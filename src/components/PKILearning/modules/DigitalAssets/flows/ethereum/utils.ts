import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex } from '@noble/hashes/utils.js'

export const toChecksumAddress = (address: string) => {
  const addr = address.toLowerCase().replace('0x', '')

  // Validate input is valid hex
  if (!/^[0-9a-f]{40}$/.test(addr)) {
    console.error(`[toChecksumAddress] Invalid hex address: ${address}`)
    return address // Return as-is if invalid
  }

  const hash = keccak_256(new TextEncoder().encode(addr))
  const hashHex = bytesToHex(hash)
  let result = '0x'
  for (let i = 0; i < 40; i++) {
    // eslint-disable-next-line security/detect-object-injection
    result += parseInt(hashHex[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i]
  }
  return result
}
