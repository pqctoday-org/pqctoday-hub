// SPDX-License-Identifier: AGPL-3.0-only
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { gcm } from '@noble/ciphers/aes.js'
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
/** Locally generated educational envelope. This is not a Vault transit key type. */
export function runSecretEnvelopeSample(message: string) {
  const { publicKey, secretKey } = ml_kem768.keygen()
  const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKey)
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const aad = new TextEncoder().encode('fictional-envelope-v1;ML-KEM-768;HKDF-SHA256;AES-256-GCM')
  const keyFor = (secret: Uint8Array) => hkdf(sha256, secret, salt, aad, 32)
  const plaintext = new TextEncoder().encode(message)
  const encrypted = gcm(keyFor(sharedSecret), nonce, aad).encrypt(plaintext)
  const recovered = gcm(keyFor(ml_kem768.decapsulate(cipherText, secretKey)), nonce, aad).decrypt(
    encrypted
  )
  const mutated = cipherText.slice()
  mutated[0] ^= 1
  let changedKemRejected = false
  try {
    gcm(keyFor(ml_kem768.decapsulate(mutated, secretKey)), nonce, aad).decrypt(encrypted)
  } catch {
    changedKemRejected = true
  }
  const badData = encrypted.slice()
  badData[badData.length - 1] ^= 1
  let changedDataRejected = false
  try {
    gcm(keyFor(sharedSecret), nonce, aad).decrypt(badData)
  } catch {
    changedDataRejected = true
  }
  const restored = gcm(keyFor(ml_kem768.decapsulate(cipherText, secretKey)), nonce, aad).decrypt(
    encrypted
  )
  return {
    messageRecovered: new TextDecoder().decode(recovered) === message,
    changedKemRejected,
    changedDataRejected,
    restored: new TextDecoder().decode(restored) === message,
    envelope: {
      version: 1,
      kem: 'ML-KEM-768',
      kdf: 'HKDF-SHA256',
      aead: 'AES-256-GCM',
      kemCiphertextHex: hex(cipherText),
      saltHex: hex(salt),
      nonceHex: hex(nonce),
      authenticatedMetadataHex: hex(aad),
      ciphertextAndTagHex: hex(encrypted),
    },
    sizes: {
      encapsulationKey: publicKey.length,
      kemCiphertext: cipherText.length,
      dataWithTag: encrypted.length,
      nonce: nonce.length,
      salt: salt.length,
    },
  }
}
