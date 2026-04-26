/**
 * IKEv2 / ISAKMP header parser (RFC 7296 §3.1).
 *
 * The fixed header is exactly 28 bytes:
 *
 *   0                   1                   2                   3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                       IKE SA Initiator's SPI                  |
 *  |                                                               |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                       IKE SA Responder's SPI                  |
 *  |                                                               |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |  Next Payload | MjVer | MnVer | Exchange Type |     Flags     |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                          Message ID                           |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                            Length                             |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

export const ISAKMP_HEADER_BYTES = 28

export const EXCHANGE_TYPE = {
  IKE_SA_INIT: 34,
  IKE_AUTH: 35,
  CREATE_CHILD_SA: 36,
  INFORMATIONAL: 37,
  IKE_INTERMEDIATE: 43, // RFC 9242 — used for ML-KEM in hybrid PQ
} as const

export type ExchangeType = (typeof EXCHANGE_TYPE)[keyof typeof EXCHANGE_TYPE]

export const exchangeTypeName = (type: number): string => {
  const entry = Object.entries(EXCHANGE_TYPE).find(([, v]) => v === type)
  return entry ? entry[0] : `UNKNOWN(${type})`
}

export const FLAG_RESPONSE = 0x20
export const FLAG_VERSION = 0x10
export const FLAG_INITIATOR = 0x08

export interface IsakmpHeader {
  initiatorSpi: string // 8 bytes, hex-encoded with colons (e.g. "0011..ff")
  responderSpi: string
  nextPayload: number
  majorVersion: number
  minorVersion: number
  exchangeType: number
  exchangeName: string
  flags: number
  isResponse: boolean
  isInitiator: boolean
  messageId: number
  length: number
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

/**
 * Parse the 28-byte ISAKMP fixed header. Throws if the buffer is shorter than
 * the header — caller decides whether to surface that to the user or skip.
 */
export const parseIsakmpHeader = (bytes: Uint8Array): IsakmpHeader => {
  if (bytes.length < ISAKMP_HEADER_BYTES) {
    throw new Error(`ISAKMP header requires ${ISAKMP_HEADER_BYTES} bytes, got ${bytes.length}`)
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, ISAKMP_HEADER_BYTES)
  const versionByte = dv.getUint8(17)
  const flags = dv.getUint8(19)
  const exchangeType = dv.getUint8(18)
  return {
    initiatorSpi: toHex(bytes.subarray(0, 8)),
    responderSpi: toHex(bytes.subarray(8, 16)),
    nextPayload: dv.getUint8(16),
    majorVersion: (versionByte >> 4) & 0x0f,
    minorVersion: versionByte & 0x0f,
    exchangeType,
    exchangeName: exchangeTypeName(exchangeType),
    flags,
    isResponse: (flags & FLAG_RESPONSE) !== 0,
    isInitiator: (flags & FLAG_INITIATOR) !== 0,
    messageId: dv.getUint32(20, false), // network byte order (big-endian)
    length: dv.getUint32(24, false),
  }
}

/**
 * Render bytes as a classic hex dump: 16 bytes/row, hex + ASCII gutter.
 * Used by the Packet Inspector to show authentic wire content.
 */
export const formatHexDump = (bytes: Uint8Array, bytesPerRow = 16): string => {
  const rows: string[] = []
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const slice = bytes.subarray(i, Math.min(i + bytesPerRow, bytes.length))
    const hex = Array.from(slice, (b) => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(slice, (b) =>
      b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'
    ).join('')
    const offset = i.toString(16).padStart(8, '0')
    const hexPadded = hex.padEnd(bytesPerRow * 3 - 1, ' ')
    rows.push(`${offset}  ${hexPadded}  ${ascii}`)
  }
  return rows.join('\n')
}
