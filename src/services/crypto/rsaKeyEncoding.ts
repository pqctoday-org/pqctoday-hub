// SPDX-License-Identifier: AGPL-3.0-only
import {
  readBytesAttr,
  CKA_MODULUS,
  CKA_PUBLIC_EXPONENT,
  CKA_PRIVATE_EXPONENT,
  CKA_PRIME_1,
  CKA_PRIME_2,
  CKA_EXPONENT_1,
  CKA_EXPONENT_2,
  CKA_COEFFICIENT,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { canonicalPositiveInteger } from '@/utils/derInteger'

// RFC 8017 A.1.2, in RSAPrivateKey order. Read only the existing sample
// key's standard attributes; RSA CKA_VALUE is not an exported key encoding.
const COMPONENTS = [
  ['modulus', CKA_MODULUS],
  ['public exponent', CKA_PUBLIC_EXPONENT],
  ['private exponent', CKA_PRIVATE_EXPONENT],
  ['prime1', CKA_PRIME_1],
  ['prime2', CKA_PRIME_2],
  ['exponent1', CKA_EXPONENT_1],
  ['exponent2', CKA_EXPONENT_2],
  ['coefficient', CKA_COEFFICIENT],
] as const

function lengthOctets(length: number): number[] {
  if (length < 128) return [length]
  const bytes: number[] = []
  for (let value = length; value > 0; value = Math.floor(value / 256)) bytes.unshift(value % 256)
  return [0x80 | bytes.length, ...bytes]
}

/** Serialize actual positive RSA CRT magnitudes, not a modulus-size estimate.
 * This is a caller-created PKCS#1 DER artifact, not the engine's internal PKCS#8.
 */
export function serializeRsaPrivateKeyDer(components: readonly Uint8Array[]): Uint8Array {
  if (components.length !== COMPONENTS.length)
    throw new Error('RSA private key needs all eight CRT attributes')
  const integers = components.map((value) => {
    if (value.length === 0 || !value.some((byte) => byte !== 0)) {
      throw new Error('RSA private key attribute must be a nonzero positive magnitude')
    }
    const content = canonicalPositiveInteger(value)
    return [0x02, ...lengthOctets(content.length), ...content]
  })
  // version = two-prime(0). The existing RSA sample generator is two-prime.
  const body = [0x02, 0x01, 0x00, ...integers.flat()]
  return new Uint8Array([0x30, ...lengthOctets(body.length), ...body])
}

/** No flags are changed: sensitive/absent/error outcomes stay failed reads. */
export function readRsaPrivateKeyDer(
  M: SoftHSMModule,
  session: number,
  handle: number
): Uint8Array {
  const components = COMPONENTS.map(([name, attribute]) => {
    const result = readBytesAttr(M, session, handle, attribute)
    if (result.rv !== 0 || result.value === null) {
      throw new Error(`RSA private ${name} attribute unavailable (0x${result.rv.toString(16)})`)
    }
    return result.value
  })
  return serializeRsaPrivateKeyDer(components)
}
