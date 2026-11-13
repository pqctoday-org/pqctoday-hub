// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import captures from './__fixtures__/response-captures.json'
import { decodeTpmResponse } from './tpmResponseDecode'
import { ExecutionLog } from './ExecutionLog'
vi.mock('../learnkit/Term', () => ({
  Term: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
const bytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'))
const captured = (name: string, algorithm = 'MLKEM-768') =>
  captures.records.find((r) => r.name === name && r.algorithm === algorithm && r.rc === 0)!
const response = (name: string, algorithm = 'MLKEM-768') =>
  bytes(captured(name, algorithm).response)
const patch32 = (b: Uint8Array, off: number, n: number) => new DataView(b.buffer).setUint32(off, n)
const sizedFrame = (tag: number, payload: number[], session = false) => {
  const b = new Uint8Array([
    0x80,
    tag,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    ...payload,
    ...(session ? [0, 0, 0, 0, 0] : []),
  ])
  patch32(b, 2, b.length)
  return b
}
const payloadFields = (d: ReturnType<typeof decodeTpmResponse>) =>
  [...d.fields.keys()].filter(
    (key) => !['tag', 'size', 'responseSize', 'responseCode'].includes(key)
  )

describe('Bounded TPM response decoding', () => {
  it('binds the captured responses to the unchanged shipped binary and existing bridge', () => {
    for (const [file, hash] of Object.entries(captures.provenance.files))
      // Checked-in provenance paths, never a user-provided filesystem path.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(createHash('sha256').update(readFileSync(file)).digest('hex'), file).toBe(hash)
  })
  it.each(captures.records)(
    'reads the actual $name $algorithm response without payload/header confusion',
    (r) => {
      const d = decodeTpmResponse(r.name, bytes(r.response))
      expect(d.error).toBeUndefined()
      if (r.rc !== 0) expect(payloadFields(d)).toEqual([])
      else
        for (const [name, range] of d.fields) {
          expect(range.offset + range.size, name).toBeLessThanOrEqual(bytes(r.response).length)
          if (range.variable) {
            expect(range.offset, name).toBeGreaterThanOrEqual(d.parameterStart!)
            expect(range.offset + range.size, name).toBeLessThanOrEqual(d.parameterEnd!)
          }
        }
    }
  )
  it('reads 1088 actual ciphertext bytes following the 32-byte secret, excluding prefixes and authorization', () => {
    const en = response('TPM2_Encapsulate'),
      d = decodeTpmResponse('TPM2_Encapsulate', en)
    expect(d.fields.get('sharedSecret.buffer')).toEqual({ offset: 12, size: 32, variable: true })
    expect(d.fields.get('ciphertext.size')).toEqual({ offset: 44, size: 2, variable: false })
    expect(d.fields.get('ciphertext.buffer')).toEqual({ offset: 46, size: 1088, variable: true })
    expect(new Set(en.slice(46)).size).toBeGreaterThan(1)
    const de = response('TPM2_Decapsulate'),
      dd = decodeTpmResponse('TPM2_Decapsulate', de)
    expect(dd.parameterStart).toBe(14)
    expect(dd.parameterEnd).toBe(48)
    expect(dd.authStart).toBe(48)
    expect(de.slice(16, 48)).toEqual(en.slice(12, 44))
  })
  it('locates names after the received public-area length, and signatures after the received attest length', () => {
    const b = response('TPM2_ReadPublic'),
      v = new DataView(b.buffer),
      pubSize = v.getUint16(10)
    const d = decodeTpmResponse('TPM2_ReadPublic', b)
    expect(d.fields.get('name')?.offset).toBe(14 + pubSize)
    expect(d.fields.get('name')?.size).toBe(34)
    expect(d.fields.get('qualifiedName')?.offset).toBe(50 + pubSize)
    for (const name of ['TPM2_Quote', 'TPM2_Certify']) {
      const b = response(name, 'MLDSA-65'),
        v = new DataView(b.buffer),
        d = decodeTpmResponse(name, b)
      expect(d.fields.get('signature')?.offset).toBe(16 + v.getUint16(14))
      expect(d.fields.get('signature')?.size).toBe(3313)
      expect(d.fields.get('signature.sig.buffer')?.size).toBe(3309)
    }
  })
  it('reads the v1.85 selector-dependent ticket metadata before hmac, including the empty metadata variant', () => {
    const d = decodeTpmResponse(
      'TPM2_VerifyDigestSignature',
      response('TPM2_VerifyDigestSignature', 'MLDSA-65')
    )
    expect(d.fields.get('validation.metadata.digestVerified')?.offset).toBe(16)
    expect(d.fields.get('validation.hmac.size')?.offset).toBe(18)
    const plain = sizedFrame(1, [0x80, 0x22, 0x40, 0, 0, 7, 0, 0])
    const p = decodeTpmResponse('TPM2_VerifySignature', plain)
    expect(p.error).toBeUndefined()
    expect(p.fields.has('validation.metadata.digestVerified')).toBe(false)
    expect(p.fields.get('validation.hmac.size')?.offset).toBe(16)
    plain[11] = 0x25
    expect(decodeTpmResponse('TPM2_VerifySignature', plain).error).toMatch(/selector/)
  })
  it('keeps message-verification and hashcheck ticket selectors distinct', () => {
    const message = sizedFrame(2, [0, 0, 0, 8, 0x80, 0x26, 0x40, 0, 0, 7, 0, 0], true)
    const m = decodeTpmResponse('TPM2_VerifySequenceComplete', message)
    expect(m.error).toBeUndefined()
    expect(m.fields.has('validation.metadata.digestVerified')).toBe(false)
    expect(m.fields.get('validation.hmac.size')?.offset).toBe(20)
    const hashcheck = sizedFrame(
      2,
      [0, 0, 0, 12, 0, 2, 0xaa, 0xbb, 0x80, 0x24, 0x40, 0, 0, 7, 0, 0],
      true
    )
    const h = decodeTpmResponse('TPM2_SequenceComplete', hashcheck)
    expect(h.error).toBeUndefined()
    expect(h.fields.get('result')?.size).toBe(2)
    hashcheck[19] = 0x21
    expect(decodeTpmResponse('TPM2_SequenceComplete', hashcheck).error).toMatch(/selector/)
  })
  it('handles an optional session prefix and a response handle before parameterSize', () => {
    const en = response('TPM2_Encapsulate')
    const p = [...en.slice(10)]
    const session = sizedFrame(2, [0, 0, (p.length >>> 8) & 255, p.length & 255, ...p], true)
    const d = decodeTpmResponse('TPM2_Encapsulate', session)
    expect(d.error).toBeUndefined()
    expect(d.fields.get('ciphertext.size')?.offset).toBe(48)
    expect(d.authStart).toBe(1138)
    const cr = decodeTpmResponse('TPM2_CreatePrimary', response('TPM2_CreatePrimary'))
    expect(cr.fields.get('objectHandle')?.offset).toBe(10)
    expect(cr.fields.get('paramSize')?.offset).toBe(14)
    expect(cr.parameterStart).toBe(18)
    const quote = response('TPM2_Quote', 'MLDSA-65')
    quote[1] = 1
    expect(decodeTpmResponse('TPM2_Quote', quote).error).toMatch(/requires a session/)
  })
  it('keeps authorization sessions outside payload and rejects malformed or excessive sessions', () => {
    const en = response('TPM2_Encapsulate'),
      p = [...en.slice(10)]
    const b = sizedFrame(2, [0, 0, (p.length >>> 8) & 255, p.length & 255, ...p], true)
    const two = Uint8Array.from([...b, 0, 1, 0xaa, 0, 0, 1, 0xbb])
    patch32(two, 2, two.length)
    expect(decodeTpmResponse('TPM2_Encapsulate', two).error).toBeUndefined()
    expect(decodeTpmResponse('TPM2_Encapsulate', two).parameterEnd).toBe(1138)
    const four = Uint8Array.from([...b, ...Array(15).fill(0)])
    patch32(four, 2, four.length)
    expect(decodeTpmResponse('TPM2_Encapsulate', four).error).toMatch(/Too many/)
    const bad = two.slice()
    bad[1138] = 0xff
    expect(decodeTpmResponse('TPM2_Encapsulate', bad).error).toMatch(/Truncated/)
  })
  it('decodes supported RSA and HashML-DSA signature unions without an ML-DSA-only offset', () => {
    for (const [alg, field] of [
      [0x0014, 'signature.signature.sig'],
      [0x00a2, 'signature.sig'],
    ] as const) {
      const b = sizedFrame(2, [0, 0, 0, 9, alg >>> 8, alg & 255, 0, 0x0b, 0, 3, 1, 2, 3], true)
      const d = decodeTpmResponse('TPM2_Sign', b)
      expect(d.error).toBeUndefined()
      expect(d.fields.get(field)).toEqual({ offset: 20, size: 3, variable: true })
    }
  })
  it.each([
    'short-header',
    'wrong-tag',
    'wrong-size',
    'truncated-secret',
    'truncated-ciphertext',
    'oversized-parameter',
    'truncated-auth',
    'missing-auth',
    'extra-parameter',
  ])('refuses %s without returning any payload ranges', (kind) => {
    let b = response('TPM2_Encapsulate'),
      command = 'TPM2_Encapsulate'
    if (kind === 'short-header') b = b.slice(0, 9)
    if (kind === 'wrong-tag') b[0] = 0x70
    if (kind === 'wrong-size') patch32(b, 2, b.length + 1)
    if (kind === 'truncated-secret') {
      b = b.slice(0, 20)
      patch32(b, 2, b.length)
    }
    if (kind === 'truncated-ciphertext') {
      b = b.slice(0, -1)
      patch32(b, 2, b.length)
    }
    if (kind === 'extra-parameter') {
      b = Uint8Array.from([...b, 0])
      patch32(b, 2, b.length)
    }
    if (['oversized-parameter', 'truncated-auth', 'missing-auth'].includes(kind)) {
      b = response('TPM2_Decapsulate')
      command = 'TPM2_Decapsulate'
      if (kind === 'oversized-parameter') patch32(b, 10, b.length)
      if (kind === 'truncated-auth') {
        b = b.slice(0, -1)
        patch32(b, 2, b.length)
      }
      if (kind === 'missing-auth') {
        b = b.slice(0, 48)
        patch32(b, 2, b.length)
      }
    }
    const d = decodeTpmResponse(command, b)
    expect(d.error).toBeDefined()
    expect(payloadFields(d)).toEqual([])
  })
  it.each(['name', 'signature', 'signature-selector', 'ticket-metadata'])(
    'rejects a malformed %s structure',
    (kind) => {
      let command = 'TPM2_ReadPublic',
        b = response(command)
      if (kind === 'name')
        new DataView(b.buffer).setUint16(12 + new DataView(b.buffer).getUint16(10), 0xffff)
      else if (kind === 'signature' || kind === 'signature-selector') {
        command = 'TPM2_Quote'
        b = response(command, 'MLDSA-65')
        const off = 16 + new DataView(b.buffer).getUint16(14)
        new DataView(b.buffer).setUint16(off + (kind === 'signature' ? 2 : 0), 0xffff)
      } else {
        command = 'TPM2_VerifyDigestSignature'
        b = sizedFrame(1, [0x80, 0x27, 0x40, 0, 0, 7, 0])
      }
      const d = decodeTpmResponse(command, b)
      expect(d.error).toBeDefined()
      expect(payloadFields(d)).toEqual([])
    }
  )
  it('renders actual ciphertext length/content and preserves raw Copy bytes; malformed input is not decoded', () => {
    const r = captured('TPM2_Encapsulate'),
      writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const log = {
      commandType: r.name,
      algorithm: r.algorithm,
      request: bytes(r.request),
      response: bytes(r.response),
    }
    const view = render(<ExecutionLog logs={[log]} />)
    const row = (name: string) =>
      screen
        .getAllByRole('row')
        .filter((row) => within(row).queryByRole('cell', { name }))
        .at(-1)!
    expect(within(row('ciphertext.size')).getByText('0x0440')).toBeVisible()
    expect(within(row('ciphertext.buffer')).getByText(/^1088 B ·/)).toBeVisible()
    expect(within(row('sharedSecret.buffer')).getByText(/^32 B ·/)).toBeVisible()
    fireEvent.click(screen.getAllByTitle('Copy hex')[1])
    expect(writeText.mock.calls[0][0].replace(/\s/g, '').toLowerCase()).toBe(r.response)
    view.rerender(<ExecutionLog logs={[{ ...log, response: bytes(r.response).slice(0, 9) }]} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Response fields not decoded')
    expect(screen.queryByText('0x0440')).not.toBeInTheDocument()
    expect(screen.queryByText('TPM_RC_SUCCESS')).not.toBeInTheDocument()
  })
})
