// SPDX-License-Identifier: GPL-3.0-only

export function parseDigestHex(ctx: FiveGService, stdout: string): string {
  if (!stdout) return ''
  const match = stdout.match(/=\s*([a-fA-F0-9]{64})/) || stdout.match(/([a-fA-F0-9]{64})/)
  return match ? match[1].toLowerCase() : ''
}

export function bcdEncode(ctx: FiveGService, digits: string): Uint8Array {
  const padded = digits.length % 2 !== 0 ? digits + 'f' : digits
  const bytes = new Uint8Array(padded.length / 2)
  for (let i = 0; i < padded.length; i += 2) {
    const lo = parseInt(padded[i], 16)
    const hi = parseInt(padded[i + 1], 16)

    bytes[i / 2] = (hi << 4) | lo // nibble-swapped: hi|lo
  }
  return bytes
}

export function bcdDecode(ctx: FiveGService, bytes: Uint8Array): string {
  let digits = ''
  for (const b of bytes) {
    const lo = b & 0x0f
    const hi = (b >> 4) & 0x0f
    digits += lo.toString(16)
    if (hi !== 0xf) digits += hi.toString(16)
  }
  return digits
}
