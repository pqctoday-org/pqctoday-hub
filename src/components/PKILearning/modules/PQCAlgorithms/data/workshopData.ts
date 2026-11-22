// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Workshop data: the parameter sets each step offers, the size rows of the comparator, and the
 * OpenSSL command lines of the two live steps. Sizes are read from the algorithm registry; the
 * live steps only measure what the tool returns.
 */
import { getAlgorithm } from '@/data/algorithmProperties'
import type { SourceClaimId } from './sourceClaims'

export const KEM_PARAMETER_SETS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'] as const
export const DSA_PARAMETER_SETS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const
export const CLASSICAL_ENTRIES = ['RSA-2048', 'ECDSA P-256'] as const

export type KemParameterSet = (typeof KEM_PARAMETER_SETS)[number]
export type DsaParameterSet = (typeof DSA_PARAMETER_SETS)[number]

/** The claim that states each ML-KEM and ML-DSA row's sizes (the registry row is checked against it). */
export const SIZE_CLAIM: Record<string, SourceClaimId> = {
  'ML-KEM-512': 'ALG-A10',
  'ML-KEM-768': 'ALG-A11',
  'ML-KEM-1024': 'ALG-A12',
  'ML-DSA-44': 'ALG-B08',
  'ML-DSA-65': 'ALG-B09',
  'ML-DSA-87': 'ALG-B10',
}

export interface SizeRow {
  name: string
  publicKeyBytes: number
  privateKeyBytes: number
  signatureOrCiphertextBytes: number
  /** Claim that states these sizes; absent for the classical entries (registry only) */
  claim?: SourceClaimId
}

export const COMPARATOR_NAMES: readonly string[] = [
  ...KEM_PARAMETER_SETS,
  ...DSA_PARAMETER_SETS,
  ...CLASSICAL_ENTRIES,
]

export function sizeRows(): SizeRow[] {
  return COMPARATOR_NAMES.map((name) => {
    const a = getAlgorithm(name)
    return {
      name: a.name,
      publicKeyBytes: a.publicKeyBytes,
      privateKeyBytes: a.privateKeyBytes,
      signatureOrCiphertextBytes: a.signatureOrCiphertextBytes,
      // eslint-disable-next-line security/detect-object-injection
      claim: SIZE_CLAIM[name],
    }
  })
}

export type SizeColumn = 'publicKeyBytes' | 'privateKeyBytes' | 'signatureOrCiphertextBytes'

export const SIZE_COLUMNS: { id: SizeColumn; label: string }[] = [
  { id: 'publicKeyBytes', label: 'Public / encapsulation key' },
  { id: 'privateKeyBytes', label: 'Private / decapsulation key' },
  { id: 'signatureOrCiphertextBytes', label: 'Signature / ciphertext' },
]

// ── Live steps: file names (the OpenSSL worker reports files with these extensions) ──
export const FILES = {
  kemKey: 'pqca-kem.key',
  kemPub: 'pqca-kem.pub',
  kemCiphertext: 'pqca-kem-ciphertext.bin',
  kemSecret: 'pqca-kem-secret.bin',
  kemAlteredCiphertext: 'pqca-kem-altered-ciphertext.bin',
  kemRecovered: 'pqca-kem-recovered.bin',
  kemAlteredRecovered: 'pqca-kem-altered-recovered.bin',
  dsaKey: 'pqca-dsa.key',
  dsaPub: 'pqca-dsa.pub',
  dsaMessage: 'pqca-dsa-message.bin',
  dsaSignature: 'pqca-dsa.sig',
} as const

export const KEM_COMMANDS = {
  generate: (alg: KemParameterSet) => `openssl genpkey -algorithm ${alg} -out ${FILES.kemKey}`,
  publicKey: () => `openssl pkey -in ${FILES.kemKey} -pubout -out ${FILES.kemPub}`,
  encapsulate: () =>
    `openssl pkeyutl -encap -inkey ${FILES.kemPub} -pubin -out ${FILES.kemCiphertext} -secret ${FILES.kemSecret}`,
  decapsulate: (ciphertextFile: string, outFile: string) =>
    `openssl pkeyutl -decap -inkey ${FILES.kemKey} -in ${ciphertextFile} -out ${outFile}`,
}

export interface SignOptions {
  deterministic: boolean
  /** Context string; empty means none */
  context: string
}

/** A whole argument in double quotes survives the service's tokenizer; a double quote inside does not. */
const quoteArg = (arg: string) => (/^[A-Za-z0-9_.:-]+$/.test(arg) ? arg : `"${arg}"`)

export function contextOption(context: string): string {
  return context === '' ? '' : ` -pkeyopt ${quoteArg(`context-string:${context}`)}`
}

export const DSA_COMMANDS = {
  generate: (alg: DsaParameterSet) => `openssl genpkey -algorithm ${alg} -out ${FILES.dsaKey}`,
  publicKey: () => `openssl pkey -in ${FILES.dsaKey} -pubout -out ${FILES.dsaPub}`,
  sign: (o: SignOptions) =>
    `openssl pkeyutl -sign -inkey ${FILES.dsaKey} -rawin -in ${FILES.dsaMessage} -out ${FILES.dsaSignature}` +
    (o.deterministic ? ' -pkeyopt deterministic:1' : '') +
    contextOption(o.context),
  verify: (context: string) =>
    `openssl pkeyutl -verify -pubin -inkey ${FILES.dsaPub} -rawin -in ${FILES.dsaMessage} -sigfile ${FILES.dsaSignature}` +
    contextOption(context),
}

/** A context string the command line can carry: printable ASCII without a double quote or backslash. */
export function isCarriableContext(context: string): boolean {
  return /^[\x20-\x7e]*$/.test(context) && !/["\\]/.test(context)
}
