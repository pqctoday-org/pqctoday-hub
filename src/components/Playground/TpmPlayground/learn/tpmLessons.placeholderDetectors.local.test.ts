// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { TPM_LESSONS, type TpmLearnContext } from './tpmLessons'
import {
  TPM_CC_CreatePrimary,
  TPM_CC_Encapsulate,
  TPM_CC_SignDigest,
} from '../../../../wasm/tpmSerializer'

// Controlled wire observations, not valid KEM/signature vectors. These tests
// establish exactly which known patterns the existing lesson detects; passing
// this detector is deliberately not a statement of cryptographic correctness.
function header(size: number, rc = 0) {
  const bytes = new Uint8Array(size)
  const view = new DataView(bytes.buffer)
  view.setUint16(0, 0x8001)
  view.setUint32(2, size)
  view.setUint32(6, rc)
  return bytes
}
function kemResponse(secret: Uint8Array) {
  const bytes = header(14 + secret.length + 2)
  const view = new DataView(bytes.buffer)
  view.setUint16(10, secret.length)
  bytes.set(secret, 12)
  view.setUint16(12 + secret.length, 2)
  bytes.set([0x12, 0x34], 14 + secret.length)
  return bytes
}
function signatureResponse(signature: Uint8Array) {
  const bytes = header(18 + signature.length)
  new DataView(bytes.buffer).setUint16(16, signature.length)
  bytes.set(signature, 18)
  return bytes
}
function context(response: Uint8Array) {
  const primary = header(14)
  new DataView(primary.buffer).setUint32(10, 0x80000001)
  const exec = vi.fn().mockResolvedValueOnce(primary).mockResolvedValueOnce(response)
  const ctx: TpmLearnContext = {
    exec,
    execLarge: vi.fn(),
    flushAll: vi.fn().mockResolvedValue(undefined),
    nvReadAll: vi.fn(),
    bridgeStatus: () => 'active',
    chain: { handles: {} },
  }
  return { ctx, exec }
}
const lesson = TPM_LESSONS.find((item) => item.id === 'honest-tpm')!
const cases = [
  {
    name: 'KEM',
    step: lesson.steps.find((step) => step.op.startsWith('TPM2_Encapsulate'))!,
    placeholder: 0xdd,
    response: kemResponse,
    command: TPM_CC_Encapsulate,
  },
  {
    name: 'signature',
    step: lesson.steps.find((step) => step.op.startsWith('TPM2_SignDigest'))!,
    placeholder: 0xee,
    response: signatureResponse,
    command: TPM_CC_SignDigest,
  },
] as const
describe('TPM lesson known-placeholder detector boundaries', () => {
  for (const sample of cases) {
    it(`${sample.name}: rejects its known placeholder bytes`, async () => {
      const { ctx } = context(sample.response(new Uint8Array(32).fill(sample.placeholder)))
      await expect(sample.step.run(ctx, [])).rejects.toThrow(
        /known 0x(?:DD|EE) placeholder pattern detected/
      )
    })
    it(`${sample.name}: rejects empty output instead of calling it a detector pass`, async () => {
      const { ctx } = context(sample.response(new Uint8Array()))
      await expect(sample.step.run(ctx, [])).rejects.toThrow('Empty output')
    })
    it(`${sample.name}: treats arbitrary non-placeholder bytes only as a bounded observation`, async () => {
      // Deliberately unvalidated and too short to be a supported ML-DSA signature.
      const bytes = new Uint8Array([0x01, 0x02, 0x03])
      const { ctx, exec } = context(sample.response(bytes))
      const result = await sample.step.run(ctx, [])
      expect(result.detail).toContain('placeholder pattern was not detected')
      expect(result.detail).toContain('does not establish')
      expect(result.detail).not.toMatch(/math ran|cryptography is correct|signature is valid\./i)
      const commands = exec.mock.calls.map(([command]) =>
        new DataView(command.buffer, command.byteOffset, command.byteLength).getUint32(6)
      )
      expect(commands).toEqual([TPM_CC_CreatePrimary, sample.command])
    })
    it(`${sample.name}: does not turn an operational refusal into a detector observation`, async () => {
      const { ctx } = context(header(10, 0x101))
      await expect(sample.step.run(ctx, [])).rejects.toThrow('TPM_RC_FAILURE')
    })
  }
})
