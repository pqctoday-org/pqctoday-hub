import { describe, it, expect } from 'vitest'
import {
  parseIsakmpHeader,
  formatHexDump,
  exchangeTypeName,
  EXCHANGE_TYPE,
  FLAG_RESPONSE,
  FLAG_INITIATOR,
} from './isakmp'

// Build a 28-byte ISAKMP header with the given fields. Network byte order.
const buildHeader = (opts: {
  initiatorSpi?: number[]
  responderSpi?: number[]
  nextPayload?: number
  majorVersion?: number
  minorVersion?: number
  exchangeType?: number
  flags?: number
  messageId?: number
  length?: number
}): Uint8Array => {
  const buf = new Uint8Array(28)
  const initSpi = opts.initiatorSpi ?? [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]
  const respSpi = opts.responderSpi ?? new Array(8).fill(0)
  buf.set(initSpi, 0)
  buf.set(respSpi, 8)
  buf[16] = opts.nextPayload ?? 33 // SA payload
  buf[17] = ((opts.majorVersion ?? 2) << 4) | (opts.minorVersion ?? 0)
  buf[18] = opts.exchangeType ?? EXCHANGE_TYPE.IKE_SA_INIT
  buf[19] = opts.flags ?? FLAG_INITIATOR
  const dv = new DataView(buf.buffer)
  dv.setUint32(20, opts.messageId ?? 0, false)
  dv.setUint32(24, opts.length ?? 28, false)
  return buf
}

describe('parseIsakmpHeader', () => {
  it('decodes IKE_SA_INIT request from initiator', () => {
    const h = parseIsakmpHeader(buildHeader({}))
    expect(h.initiatorSpi).toBe('1122334455667788')
    expect(h.responderSpi).toBe('0000000000000000')
    expect(h.exchangeType).toBe(EXCHANGE_TYPE.IKE_SA_INIT)
    expect(h.exchangeName).toBe('IKE_SA_INIT')
    expect(h.majorVersion).toBe(2)
    expect(h.minorVersion).toBe(0)
    expect(h.isInitiator).toBe(true)
    expect(h.isResponse).toBe(false)
    expect(h.length).toBe(28)
  })

  it('detects response flag', () => {
    const h = parseIsakmpHeader(
      buildHeader({ flags: FLAG_RESPONSE, exchangeType: EXCHANGE_TYPE.IKE_AUTH })
    )
    expect(h.exchangeName).toBe('IKE_AUTH')
    expect(h.isResponse).toBe(true)
    expect(h.isInitiator).toBe(false)
  })

  it('decodes IKE_INTERMEDIATE (RFC 9242, type 43) for ML-KEM', () => {
    const h = parseIsakmpHeader(
      buildHeader({ exchangeType: EXCHANGE_TYPE.IKE_INTERMEDIATE, messageId: 1 })
    )
    expect(h.exchangeName).toBe('IKE_INTERMEDIATE')
    expect(h.messageId).toBe(1)
  })

  it('treats unknown exchange types gracefully', () => {
    expect(exchangeTypeName(99)).toBe('UNKNOWN(99)')
  })

  it('throws on truncated input shorter than 28 bytes', () => {
    expect(() => parseIsakmpHeader(new Uint8Array(20))).toThrow(/requires 28 bytes/)
  })

  it('reads big-endian 32-bit Length and Message ID', () => {
    const h = parseIsakmpHeader(buildHeader({ messageId: 0x01020304, length: 0xa0b0c0d0 }))
    expect(h.messageId).toBe(0x01020304)
    expect(h.length).toBe(0xa0b0c0d0)
  })
})

describe('formatHexDump', () => {
  it('produces 16-byte rows with offset, hex, and ASCII gutters', () => {
    const bytes = new Uint8Array([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x00, 0x01, 0x02,
      0x03, 0xff,
    ])
    const dump = formatHexDump(bytes)
    const rows = dump.split('\n')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatch(/^00000000 {2}/)
    expect(rows[0]).toMatch(/Hello World!\.\.\.\.$/)
    expect(rows[1]).toMatch(/^00000010 {2}ff/)
  })

  it('handles empty input', () => {
    expect(formatHexDump(new Uint8Array(0))).toBe('')
  })
})
