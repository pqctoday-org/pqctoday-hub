// SPDX-License-Identifier: AGPL-3.0-only
//
// The v3.2 specification says CK_SIGN_ADDITIONAL_CONTEXT with hedging "Preferred" may produce either a
// hedged signature or a deterministic one, so two identical signatures are a permitted outcome. The
// lesson step must report what the token returned and must not fail on either outcome.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sign = vi.fn()
vi.mock('@/wasm/softhsm', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/wasm/softhsm')>()
  return {
    ...original,
    hsm_generateMLDSAKeyPair: vi.fn(() => ({ privHandle: 7, pubHandle: 8 })),
    hsm_sign: (...args: unknown[]) => sign(...args),
  }
})

import { V32_LESSONS } from './pkcs11LessonsV32'

const hsm = {
  moduleRef: { current: {} },
  hSessionRef: { current: 1 },
} as unknown as Parameters<NonNullable<(typeof V32_LESSONS)[number]['steps'][number]['run']>>[0]

const preferredStep = () => {
  const lesson = V32_LESSONS.find((l) => l.id === 'hedged-signing')
  const step = lesson?.steps.find((s) => s.op.startsWith('C_Sign (hedging: preferred)'))
  if (!step) throw new Error('no preferred-hedging step')
  return step
}
const keyResult = { detail: 'priv=7' }

describe('hedged-signing lesson, Preferred step', () => {
  beforeEach(() => sign.mockReset())

  it('does not fail when the token returns identical signatures, and says that is permitted', async () => {
    sign.mockReturnValue(new Uint8Array([1, 2, 3, 4]))
    const out = await preferredStep().run(hsm, [keyResult])
    expect(out.detail).toMatch(/identical/i)
    expect(out.detail).toMatch(/permits/i)
  })

  it('reports different signatures as a permitted hedged outcome', async () => {
    sign
      .mockReturnValueOnce(new Uint8Array([1, 2, 3, 4]))
      .mockReturnValueOnce(new Uint8Array([9, 9, 9, 9]))
    const out = await preferredStep().run(hsm, [keyResult])
    expect(out.detail).toMatch(/different/i)
    expect(out.detail).toMatch(/permits/i)
  })
})
