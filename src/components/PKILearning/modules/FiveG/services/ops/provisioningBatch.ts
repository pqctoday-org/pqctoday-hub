// SPDX-License-Identifier: AGPL-3.0-only
/** One fictional browser-local provisioning record, not a production batch format. */
export const PROVISIONING_IMSI = '310260123456789'
export const PROVISIONING_AAD = JSON.stringify(['pqctoday-provisioning-batch', 1, 'AES-128-GCM'])
export interface ProvisioningEnvelope {
  format: 'pqctoday-provisioning-batch'
  version: 1
  algorithm: 'AES-128-GCM'
  ivHex: string
  /** WebCrypto ciphertext followed by the 16-byte GCM authentication tag. */
  ciphertextHex: string
}
export interface ProvisioningRecord {
  imsi: string
  k: string
  opc: string
}
export interface ProvisioningImportResult {
  record: ProvisioningRecord
  checks: Record<string, string>
}

export function requireSubscriberKey(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !/^[a-f\d]{32}$/i.test(value))
    throw new Error(`${name} must be exactly 16 hexadecimal bytes`)
}
export function provisioningHexBytes(value: string): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(value.length / 2)
  for (let i = 0; i < result.length; i++)
    result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16)
  return result
}
export function provisioningHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** These two schemas are flat scalar objects. Duplicate property names are not accepted. */
function parseFlatObject(
  text: string,
  expectedKeys: string[],
  label: string
): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error(`${label} must be valid JSON`)
  }
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== expectedKeys.length ||
    !expectedKeys.every((key) => Object.hasOwn(value, key))
  )
    throw new Error(`${label} must contain only ${expectedKeys.join(', ')}`)
  const names = Array.from(
    text.matchAll(/"(?:[^"\\]|\\.)*"\s*:/g),
    (token) => JSON.parse(token[0].slice(0, token[0].lastIndexOf(':')).trim()) as string
  )
  if (names.length !== expectedKeys.length || new Set(names).size !== names.length)
    throw new Error(`${label} must not contain duplicate or nested fields`)
  return value as Record<string, unknown>
}

export function parseProvisioningEnvelope(text: string): ProvisioningEnvelope {
  const value = parseFlatObject(
    text,
    ['format', 'version', 'algorithm', 'ivHex', 'ciphertextHex'],
    'Provisioning envelope'
  )
  if (
    value.format !== 'pqctoday-provisioning-batch' ||
    value.version !== 1 ||
    value.algorithm !== 'AES-128-GCM'
  )
    throw new Error('Unsupported provisioning format, version or algorithm')
  if (typeof value.ivHex !== 'string' || !/^[a-f\d]{24}$/i.test(value.ivHex))
    throw new Error('Provisioning nonce must be exactly 12 hexadecimal bytes')
  if (
    typeof value.ciphertextHex !== 'string' ||
    value.ciphertextHex.length < 32 ||
    value.ciphertextHex.length % 2 !== 0 ||
    !/^[a-f\d]+$/i.test(value.ciphertextHex)
  )
    throw new Error('Provisioning ciphertext must include a complete 16-byte authentication tag')
  return {
    format: value.format,
    version: value.version,
    algorithm: value.algorithm,
    ivHex: value.ivHex,
    ciphertextHex: value.ciphertextHex,
  }
}

export function validateProvisioningIdentity(imsi: unknown): asserts imsi is string {
  // This authored one-record example uses a 15-digit fictional IMSI.
  if (typeof imsi !== 'string' || !/^\d{15}$/.test(imsi))
    throw new Error('Sample IMSI must contain exactly 15 decimal digits')
}
export function parseProvisioningRecord(text: string): ProvisioningRecord {
  const value = parseFlatObject(text, ['imsi', 'k', 'opc'], 'Provisioning record')
  validateProvisioningIdentity(value.imsi)
  requireSubscriberKey(value.k, 'Subscriber K')
  requireSubscriberKey(value.opc, 'Derived OPc')
  return { imsi: value.imsi, k: value.k, opc: value.opc }
}

export function requireTransportKey(key: CryptoKey): void {
  const algorithm = key?.algorithm as AesKeyAlgorithm | undefined
  if (
    key?.type !== 'secret' ||
    key.extractable !== false ||
    algorithm?.name !== 'AES-GCM' ||
    algorithm.length !== 128 ||
    !key.usages.includes('encrypt') ||
    !key.usages.includes('decrypt')
  )
    throw new Error('The separate nonextractable AES-128-GCM sample transport key is required')
}
