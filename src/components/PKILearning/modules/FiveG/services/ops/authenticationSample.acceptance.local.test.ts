// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, createHmac, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openSSLService, type OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'
import {
  AuthenticationSample,
  AUTHENTICATION_STAGES,
  type AuthenticationSampleInputs,
} from './authenticationSample'

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(), deleteFile: vi.fn() },
}))
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
// Retained primitive fixture from services/__tests__/audit_milenage.test.ts.
// It is not an external full 5G-AKA exchange/KAT fixture.
const RAND = '23553cbe9637a89d218ae64dae47bf35'
const INPUTS: Partial<AuthenticationSampleInputs> = {
  kHex: '465b5ce8b199b49faa5f0a2ee238a6bc',
  opHex: 'cdc202d5123e20f62b6d676ac72cb318',
  firstSqnHex: 'ff9bb4d0b607',
  amfHex: 'b9b9',
}
const CK_IK = Buffer.from('b40ba9a3c58b2a05bbf0d987b21bf8cbf769bcd751044604127672711c6d3441', 'hex')
const SNN = Buffer.from('5G:mnc260.mcc310.3gppnetwork.org', 'utf8')
const LEN_SNN = Buffer.from(SNN.length.toString(16).padStart(4, '0'), 'hex')
// Independent standard-crypto oracle with explicitly assembled Annex A inputs.
const EXPECTED_XRES = createHmac('sha256', CK_IK)
  .update(
    Buffer.concat([
      Buffer.from('6b', 'hex'),
      SNN,
      LEN_SNN,
      Buffer.from(RAND + '0010a54211d5e3ba50bf0008', 'hex'),
    ])
  )
  .digest()
  .subarray(16)
  .toString('hex')
const EXPECTED_KAUSF = createHmac('sha256', CK_IK)
  .update(
    Buffer.concat([Buffer.from('6a', 'hex'), SNN, LEN_SNN, Buffer.from('55f328b435770006', 'hex')])
  )
  .digest('hex')
const EXPECTED_HXRES = createHash('sha256')
  .update(Buffer.from(RAND + EXPECTED_XRES, 'hex'))
  .digest()
  .subarray(16)
  .toString('hex')

const adapter: typeof openSSLService.execute = async (command, files) => {
  const data = files?.at(0)?.data
  if (!data || !ArrayBuffer.isView(data)) throw new Error('Expected actual binary digest input')
  const key = /-macopt hexkey:([0-9a-f]+)/.exec(command)?.[1]
  const digest = key
    ? createHmac('sha256', Buffer.from(key, 'hex')).update(data).digest('hex')
    : createHash('sha256').update(data).digest('hex')
  return { stdout: `SHA2-256(sample.bin)= ${digest}`, stderr: '', files: [] }
}
beforeEach(() => {
  vi.resetAllMocks()
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: {
      subtle: webcrypto.subtle,
      getRandomValues: (value: Uint8Array) => {
        value.set(Buffer.from(RAND, 'hex'))
        return value
      },
    },
  })
  vi.mocked(openSSLService.execute).mockImplementation(adapter)
  vi.mocked(openSSLService.deleteFile).mockResolvedValue(undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})
async function toVector(sample = new AuthenticationSample(INPUTS)) {
  for (const stage of AUTHENTICATION_STAGES.slice(0, 5)) await sample.execute(stage)
  return sample
}
function alter(hex: string) {
  const b = Buffer.from(hex, 'hex')
  b.writeUInt8(b.at(-1)! ^ 1, b.length - 1)
  return b.toString('hex')
}
function deferred() {
  let resolve!: (result: OpenSSLCommandResult) => void
  const promise = new Promise<OpenSSLCommandResult>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('fictional authentication acceptance checks', () => {
  it('uses real MILENAGE with independently calculated KDF/hash values and accepts one matching challenge', async () => {
    const s = await toVector(),
      v = s.getSnapshot()
    expect(v.networkOPcHex).toBe('cd63cb71954a9f4e48a5994e37a02baf')
    expect(v.subscriberOPcHex).toBe(v.networkOPcHex)
    expect(v.autnHex).toBe('55f328b43577b9b94a9ffac354dfafb3')
    expect(v.xresStarHex).toBe(EXPECTED_XRES)
    expect(v.kausfHex).toBe(EXPECTED_KAUSF)
    expect(v.hxresStarHex).toBe(EXPECTED_HXRES)
    expect(v.accepted).toBe(false)
    await s.execute('verify_ue')
    expect(s.getSnapshot().ueResStarHex).toBe(EXPECTED_XRES)
    expect(s.getSnapshot().ueNextSqnHex).toBe('ff9bb4d0b608')
    await s.execute('verify_seaf')
    expect(s.getSnapshot().hresStarHex).toBe(EXPECTED_HXRES)
    expect(s.getSnapshot().accepted).toBe(false)
    await s.execute('verify_ausf')
    expect(s.getSnapshot()).toMatchObject({ accepted: true, consumed: true, canReplay: true })
    await expect(s.execute('verify_ausf')).rejects.toMatchObject({ kind: 'replay' })
    expect(s.getSnapshot().accepted).toBe(false)
    expect(openSSLService.deleteFile).toHaveBeenCalledTimes(5)
  })
  it('rejects a changed MAC without advancing UE state, then accepts the restored sender token', async () => {
    const s = await toVector(),
      v = s.getSnapshot()
    s.setReceivedAutn(alter(v.autnHex))
    await expect(s.execute('verify_ue')).rejects.toMatchObject({ kind: 'mac' })
    expect(s.getSnapshot()).toMatchObject({
      ueNextSqnHex: INPUTS.firstSqnHex,
      ueResStarHex: '',
      accepted: false,
    })
    await expect(s.execute('verify_seaf')).rejects.toMatchObject({ kind: 'prerequisite' })
    s.setReceivedAutn(v.autnHex)
    await expect(s.execute('verify_ue')).resolves.toHaveProperty(
      'snapshot.stageComplete.verify_ue',
      true
    )
  })
  it('distinguishes a correctly authenticated stale SQN from a bad MAC', async () => {
    const s = new AuthenticationSample(INPUTS)
    await s.execute('retrieve_creds')
    s.setChallengeSqn('ff9bb4d0b606')
    for (const stage of AUTHENTICATION_STAGES.slice(1, 5)) await s.execute(stage)
    await expect(s.execute('verify_ue')).rejects.toMatchObject({ kind: 'sequence' })
    expect(s.getSnapshot().ueResStarHex).toBe('')
    expect(s.getSnapshot().ueNextSqnHex).toBe(INPUTS.firstSqnHex)
  })
  it('rejects actual replay after successful UE/network checks and accepts a new counter-aligned challenge', async () => {
    const s = await toVector()
    for (const stage of AUTHENTICATION_STAGES.slice(5)) await s.execute(stage)
    s.replayLastChallenge()
    await expect(s.execute('verify_ue')).rejects.toMatchObject({ kind: 'sequence' })
    expect(s.getSnapshot().accepted).toBe(false)
    s.newChallenge()
    for (const stage of AUTHENTICATION_STAGES.slice(1)) await s.execute(stage)
    expect(s.getSnapshot()).toMatchObject({
      accepted: true,
      networkSqnHex: 'ff9bb4d0b608',
      ueNextSqnHex: 'ff9bb4d0b609',
    })
  })
  it('rejects a received response mismatch at the serving check and permits restoration of the pending response', async () => {
    const s = await toVector()
    await s.execute('verify_ue')
    const original = s.getSnapshot().ueResStarHex
    s.setReceivedResponse(alter(original))
    await expect(s.execute('verify_seaf')).rejects.toMatchObject({ kind: 'response' })
    await expect(s.execute('verify_ausf')).rejects.toMatchObject({ kind: 'prerequisite' })
    expect(s.getSnapshot().accepted).toBe(false)
    s.setReceivedResponse(original)
    await s.execute('verify_seaf')
    await s.execute('verify_ausf')
    expect(s.getSnapshot().accepted).toBe(true)
  })
  it('still checks home response equality if a controlled serving digest incorrectly reports a match', async () => {
    const s = await toVector()
    await s.execute('verify_ue')
    s.setReceivedResponse(alter(s.getSnapshot().ueResStarHex))
    // Fault injection isolates AUSF equality; this is not a real hash collision.
    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: `SHA2-256(sample)= ${'00'.repeat(16)}${EXPECTED_HXRES}`,
      stderr: '',
      files: [],
    })
    await s.execute('verify_seaf')
    await expect(s.execute('verify_ausf')).rejects.toMatchObject({ kind: 'response' })
    expect(s.getSnapshot().accepted).toBe(false)
  })
  it('uses the independent subscriber credential copy rather than trusting the sender result', async () => {
    const s = await toVector(
      new AuthenticationSample({ ...INPUTS, subscriberKHex: '00'.repeat(16) })
    )
    await expect(s.execute('verify_ue')).rejects.toMatchObject({ kind: 'mac' })
    expect(s.getSnapshot().stageComplete.verify_ue).toBe(false)
    expect(s.getSnapshot().ueResStarHex).toBe('')
  })
  it.each(['', '00'.repeat(15), '00'.repeat(17), 'gg'.repeat(16)])(
    'rejects malformed received AUTN %j before producing a response',
    async (value) => {
      const s = await toVector()
      s.setReceivedAutn(value)
      await expect(s.execute('verify_ue')).rejects.toMatchObject({ kind: 'input' })
      expect(s.getSnapshot().ueResStarHex).toBe('')
    }
  )
  it('rejects a valid MAC whose AMF does not select the 5G separation bit', async () => {
    const s = await toVector(new AuthenticationSample({ ...INPUTS, amfHex: '0000' }))
    await expect(s.execute('verify_ue')).rejects.toMatchObject({ kind: 'separation' })
  })
  it.each(['missing', 'short', 'nonhex', 'reported', 'thrown'])(
    'does not publish a vector from %s provider output and supports actual retry',
    async (kind) => {
      const s = new AuthenticationSample(INPUTS)
      for (const stage of AUTHENTICATION_STAGES.slice(0, 4)) await s.execute(stage)
      if (kind === 'thrown')
        vi.mocked(openSSLService.execute).mockRejectedValueOnce(
          new Error('controlled engine failure')
        )
      else
        vi.mocked(openSSLService.execute).mockResolvedValueOnce({
          stdout:
            kind === 'short'
              ? 'ab'.repeat(31)
              : kind === 'nonhex'
                ? 'gg'.repeat(32)
                : kind === 'reported'
                  ? 'ab'.repeat(32)
                  : '',
          stderr: '',
          files: [],
          ...(kind === 'reported' ? { error: 'controlled engine error' } : {}),
        })
      await expect(s.execute('derive_kausf')).rejects.toThrow()
      expect(s.getSnapshot()).toMatchObject({ kausfHex: '', xresStarHex: '', accepted: false })
      await s.execute('derive_kausf')
      expect(s.getSnapshot().xresStarHex).toBe(EXPECTED_XRES)
    }
  )
  it('holds busy until an obsolete vector operation settles and prevents its dependent operations/results', async () => {
    const s = new AuthenticationSample(INPUTS)
    for (const stage of AUTHENTICATION_STAGES.slice(0, 4)) await s.execute(stage)
    const gate = deferred()
    vi.mocked(openSSLService.execute).mockReturnValueOnce(gate.promise)
    const pending = s.execute('derive_kausf')
    s.setChallengeSqn('ff9bb4d0b608')
    await expect(s.execute('gen_rand')).rejects.toMatchObject({ kind: 'busy' })
    gate.resolve({ stdout: 'ab'.repeat(32), stderr: '', files: [] })
    await expect(pending).rejects.toMatchObject({ kind: 'stale' })
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
    expect(s.getSnapshot().xresStarHex).toBe('')
    await expect(s.execute('gen_rand')).resolves.toHaveProperty(
      'snapshot.stageComplete.gen_rand',
      true
    )
  })
  it('does not advance the UE counter when the received token changes while response derivation is pending', async () => {
    const s = await toVector(),
      original = s.getSnapshot().autnHex
    const gate = deferred()
    vi.mocked(openSSLService.execute).mockReturnValueOnce(gate.promise)
    const pending = s.execute('verify_ue')
    await vi.waitFor(() => expect(openSSLService.execute).toHaveBeenCalledTimes(4))
    s.setReceivedAutn(alter(original))
    gate.resolve({ stdout: 'ab'.repeat(32), stderr: '', files: [] })
    await expect(pending).rejects.toMatchObject({ kind: 'stale' })
    expect(s.getSnapshot()).toMatchObject({ ueNextSqnHex: INPUTS.firstSqnHex, ueResStarHex: '' })
    s.setReceivedAutn(original)
    await s.execute('verify_ue')
    expect(s.getSnapshot().ueResStarHex).toBe(EXPECTED_XRES)
  })
  it('withdraws a serving receipt on response edit and requires a current comparison before home acceptance', async () => {
    const s = await toVector()
    await s.execute('verify_ue')
    await s.execute('verify_seaf')
    s.setReceivedResponse(alter(s.getSnapshot().ueResStarHex))
    await expect(s.execute('verify_ausf')).rejects.toMatchObject({ kind: 'prerequisite' })
    expect(s.getSnapshot()).toMatchObject({ accepted: false, hresStarHex: '' })
  })
  it('disposes old pending work without changing a replacement instance or hanging its own busy guard', async () => {
    const old = new AuthenticationSample(INPUTS)
    for (const stage of AUTHENTICATION_STAGES.slice(0, 4)) await old.execute(stage)
    const gate = deferred()
    vi.mocked(openSSLService.execute).mockReturnValueOnce(gate.promise)
    const pending = old.execute('derive_kausf')
    old.dispose()
    const replacement = await toVector()
    for (const stage of AUTHENTICATION_STAGES.slice(5)) await replacement.execute(stage)
    gate.resolve({ stdout: 'ab'.repeat(32), stderr: '', files: [] })
    await expect(pending).rejects.toMatchObject({ kind: 'stale' })
    expect(replacement.getSnapshot().accepted).toBe(true)
    await expect(old.execute('gen_rand')).rejects.toMatchObject({ kind: 'stale' })
  })
  it.each(['', '00'.repeat(15), '00'.repeat(17), 'zz'.repeat(16)])(
    'rejects malformed received response %j without publishing a serving check',
    async (value) => {
      const s = await toVector()
      await s.execute('verify_ue')
      s.setReceivedResponse(value)
      await expect(s.execute('verify_seaf')).rejects.toMatchObject({ kind: 'input' })
      expect(openSSLService.execute).toHaveBeenCalledTimes(4)
      expect(s.getSnapshot()).toMatchObject({ accepted: false, hresStarHex: '' })
    }
  )
  it('keeps the UE counter unchanged on a response-derivation error and supports a valid retry', async () => {
    const s = await toVector()
    vi.mocked(openSSLService.execute).mockRejectedValueOnce(
      new Error('controlled UE derivation failure')
    )
    await expect(s.execute('verify_ue')).rejects.toThrow('controlled UE derivation failure')
    expect(s.getSnapshot()).toMatchObject({ ueNextSqnHex: INPUTS.firstSqnHex, ueResStarHex: '' })
    await s.execute('verify_ue')
    expect(s.getSnapshot().ueResStarHex).toBe(EXPECTED_XRES)
  })
  it('does not accept an operational serving-check failure as a response rejection or final success', async () => {
    const s = await toVector()
    await s.execute('verify_ue')
    vi.mocked(openSSLService.execute).mockRejectedValueOnce(
      new Error('controlled serving digest failure')
    )
    await expect(s.execute('verify_seaf')).rejects.toThrow('controlled serving digest failure')
    expect(s.getSnapshot()).toMatchObject({ accepted: false, hresStarHex: '' })
    await s.execute('verify_seaf')
    await s.execute('verify_ausf')
    expect(s.getSnapshot().accepted).toBe(true)
  })
  it('does not wrap a 48-bit counter or accept an unknown stage/static-output fallback', async () => {
    const s = new AuthenticationSample({ ...INPUTS, firstSqnHex: 'ffffffffffff' })
    for (const stage of AUTHENTICATION_STAGES.slice(0, 4)) await s.execute(stage)
    await expect(s.execute('derive_kausf')).rejects.toMatchObject({ kind: 'sequence' })
    await expect(s.execute('unknown' as never)).rejects.toMatchObject({ kind: 'input' })
    expect(s.getSnapshot().accepted).toBe(false)
  })
})
