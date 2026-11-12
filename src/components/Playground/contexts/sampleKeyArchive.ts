// SPDX-License-Identifier: AGPL-3.0-only
import JSZip from 'jszip'
import type { Key } from '@/types'
import {
  EDUCATION_NOTICE_TEXT,
  stripEducationNoticeComment,
  withEducationNoticeComment,
} from '@/data/educationNotice'

export const SAMPLE_KEY_MANIFEST = 'playground-keys.json'
const SCHEMA = 'pqctoday-playground-sample-keys'
const roles = new Set(['public', 'private', 'symmetric', 'unclassified'])
const usages = new Set([
  'encrypt',
  'decrypt',
  'sign',
  'verify',
  'deriveKey',
  'deriveBits',
  'wrapKey',
  'unwrapKey',
])
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const fail = (message: string): never => {
  throw new Error(message)
}
type ImportAlgorithm = { name: string; hash?: string; namedCurve?: string }
type SavedData =
  | { kind: 'bytes'; file: string }
  | {
      kind: 'webcrypto'
      file: string
      format: 'spki' | 'pkcs8' | 'raw'
      algorithm: ImportAlgorithm
      usages: KeyUsage[]
      extractable: true
    }
interface SavedKey {
  name: string
  type: Key['type']
  algorithm: string
  timestamp: number
  dataType?: Key['dataType']
  valueFile: string
  noticeAdded: boolean
  data?: SavedData
}

function importAlgorithm(value: unknown): ImportAlgorithm {
  if (!object(value) || typeof value.name !== 'string') return fail('Missing CryptoKey algorithm')
  if (['RSA-OAEP', 'RSA-PSS', 'RSASSA-PKCS1-v1_5'].includes(value.name)) {
    const hash = object(value.hash) ? value.hash.name : value.hash
    if (typeof hash !== 'string' || !['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].includes(hash))
      return fail('Unsupported CryptoKey hash')
    return { name: value.name, hash }
  }
  if (value.name === 'ECDSA' || value.name === 'ECDH') {
    if (
      typeof value.namedCurve !== 'string' ||
      !['P-256', 'P-384', 'P-521'].includes(value.namedCurve)
    )
      return fail('Unsupported CryptoKey curve')
    return { name: value.name, namedCurve: value.namedCurve }
  }
  if (['Ed25519', 'X25519', 'AES-GCM'].includes(value.name)) return { name: value.name }
  return fail('Unsupported sample CryptoKey algorithm')
}
function member(value: unknown, extension: 'txt' | 'bin'): string {
  if (
    typeof value !== 'string' ||
    !/^keys\/key-[0-9]{6,}\.(txt|bin)$/.test(value) ||
    !value.endsWith(`.${extension}`)
  )
    return fail('Unsupported archive member path')
  return value
}
function parseEntry(value: unknown): SavedKey {
  if (
    !object(value) ||
    typeof value.name !== 'string' ||
    !value.name ||
    typeof value.type !== 'string' ||
    !roles.has(value.type) ||
    typeof value.algorithm !== 'string' ||
    !value.algorithm ||
    typeof value.timestamp !== 'number' ||
    !Number.isFinite(value.timestamp) ||
    typeof value.noticeAdded !== 'boolean'
  )
    return fail('Invalid sample-key manifest record')
  if (
    value.dataType !== undefined &&
    !['string', 'binary', 'cryptokey'].includes(String(value.dataType))
  )
    return fail('Unsupported sample key dataType')
  let data: SavedData | undefined
  if (value.data !== undefined) {
    if (!object(value.data)) return fail('Invalid sample-key data descriptor')
    const file = member(value.data.file, 'bin')
    if (value.data.kind === 'bytes') data = { kind: 'bytes', file }
    else if (value.data.kind === 'webcrypto') {
      const d = value.data
      if (
        !['spki', 'pkcs8', 'raw'].includes(String(d.format)) ||
        d.extractable !== true ||
        !Array.isArray(d.usages) ||
        d.usages.some((u) => typeof u !== 'string' || !usages.has(u)) ||
        new Set(d.usages).size !== d.usages.length
      )
        return fail('Invalid sample CryptoKey metadata')
      const format = d.format as 'spki' | 'pkcs8' | 'raw'
      if (
        format !==
        (value.type === 'public'
          ? 'spki'
          : value.type === 'private'
            ? 'pkcs8'
            : value.type === 'symmetric'
              ? 'raw'
              : 'unsupported')
      )
        return fail('CryptoKey format does not match its recorded role')
      data = {
        kind: 'webcrypto',
        file,
        format,
        algorithm: importAlgorithm(d.algorithm),
        usages: d.usages as KeyUsage[],
        extractable: true,
      }
    } else return fail('Unsupported sample-key data kind')
  }
  if (
    (value.dataType === 'binary' && data?.kind !== 'bytes') ||
    (value.dataType === 'cryptokey' && data?.kind !== 'webcrypto') ||
    (value.dataType === 'string' && data !== undefined) ||
    (value.type === 'unclassified' && data !== undefined)
  )
    return fail('Sample key data and metadata disagree')
  return {
    name: value.name,
    type: value.type as Key['type'],
    algorithm: value.algorithm,
    timestamp: value.timestamp,
    ...(value.dataType !== undefined ? { dataType: value.dataType as Key['dataType'] } : {}),
    valueFile: member(value.valueFile, 'txt'),
    noticeAdded: value.noticeAdded,
    ...(data ? { data } : {}),
  }
}

/** Plain educational ZIP only. Nonextractable/protected keys fail the whole export. */
export async function createSampleKeyArchive(keys: readonly Key[]): Promise<Uint8Array> {
  const snapshot = keys.map((key) => ({
    ...key,
    data: key.data instanceof Uint8Array ? key.data.slice() : key.data,
  }))
  const zip = new JSZip()
  zip.file(
    'NOTICE.txt',
    `${EDUCATION_NOTICE_TEXT}\n\nPlaintext sample-key archive. Restoring records does not verify their cryptographic validity.\n`
  )
  const saved: SavedKey[] = []
  for (const [index, key] of snapshot.entries()) {
    const stem = `keys/key-${String(index + 1).padStart(6, '0')}`
    const wrapped = withEducationNoticeComment(key.value, '#')
    let data: SavedData | undefined
    if (key.data instanceof Uint8Array) {
      data = { kind: 'bytes', file: `${stem}.bin` }
      zip.file(data.file, key.data)
    } else if (key.data !== undefined) {
      const cryptoKey = key.data
      if (!cryptoKey.extractable)
        return fail('Nonextractable keys are not supported by this plaintext sample archive')
      const role = cryptoKey.type === 'secret' ? 'symmetric' : cryptoKey.type
      if (key.type !== role) return fail('CryptoKey role differs from the sample record')
      const format =
        cryptoKey.type === 'public' ? 'spki' : cryptoKey.type === 'private' ? 'pkcs8' : 'raw'
      data = {
        kind: 'webcrypto',
        file: `${stem}.bin`,
        format,
        algorithm: importAlgorithm(cryptoKey.algorithm),
        usages: [...cryptoKey.usages],
        extractable: true,
      }
      zip.file(data.file, await crypto.subtle.exportKey(format, cryptoKey))
    }
    const entry = parseEntry({
      name: key.name,
      type: key.type,
      algorithm: key.algorithm,
      timestamp: key.timestamp,
      ...(key.dataType !== undefined ? { dataType: key.dataType } : {}),
      valueFile: `${stem}.txt`,
      noticeAdded: wrapped !== key.value,
      ...(data ? { data } : {}),
    })
    zip.file(entry.valueFile, wrapped)
    saved.push(entry)
  }
  zip.file(
    SAMPLE_KEY_MANIFEST,
    JSON.stringify({ schema: SCHEMA, version: 1, keys: saved }, null, 2)
  )
  return zip.generateAsync({ type: 'uint8array' })
}

let restoredSequence = 0
const freshId = () => `restored-${crypto.randomUUID()}-${++restoredSequence}`

/** Parse all records before the caller inserts any. This is not key validation. */
export async function readSampleKeyArchive(
  input: Parameters<JSZip['loadAsync']>[0]
): Promise<{ keys: Key[]; legacy: boolean }> {
  const zip = await JSZip.loadAsync(input, { checkCRC32: true })
  for (const entry of Object.values(zip.files)) {
    const name = entry.unsafeOriginalName ?? entry.name
    if (
      name.startsWith('/') ||
      name.includes('\\') ||
      name.split('/').some((part) => part === '..' || part === '.')
    )
      return fail('Unsupported archive member path')
  }
  const manifest = zip.file(SAMPLE_KEY_MANIFEST)
  if (!manifest) {
    const legacy: Key[] = []
    for (const entry of Object.values(zip.files)) {
      if (entry.dir) continue
      if (entry.name.includes('/')) return fail('Unsupported legacy archive member path')
      if (entry.name.toLowerCase() === 'notice.txt' || !entry.name.toLowerCase().endsWith('.txt'))
        continue
      legacy.push({
        id: freshId(),
        name: entry.name.slice(0, -4).replace(/_/g, ' '),
        type: 'unclassified',
        algorithm: 'Unclassified legacy material',
        value: stripEducationNoticeComment(await entry.async('string'), '#'),
        timestamp: Date.now(),
      })
    }
    return { keys: legacy, legacy: true }
  }
  const decoded: unknown = JSON.parse(await manifest.async('string'))
  if (
    !object(decoded) ||
    decoded.schema !== SCHEMA ||
    decoded.version !== 1 ||
    !Array.isArray(decoded.keys)
  )
    return fail('Unsupported or malformed sample-key manifest')
  const saved = decoded.keys.map(parseEntry)
  const references = saved.flatMap((entry) => [
    entry.valueFile,
    ...(entry.data ? [entry.data.file] : []),
  ])
  if (new Set(references).size !== references.length)
    return fail('Duplicate archive member reference')
  for (const name of references) if (!zip.file(name)) return fail(`Missing archive member: ${name}`)
  const allowed = new Set([SAMPLE_KEY_MANIFEST, 'NOTICE.txt', ...references])
  for (const entry of Object.values(zip.files)) {
    if (entry.dir ? entry.name !== 'keys/' : !allowed.has(entry.name))
      return fail('Unsupported unreferenced archive member')
  }
  const keys: Key[] = []
  for (const entry of saved) {
    const wrapped = await zip.file(entry.valueFile)!.async('string')
    const value = entry.noticeAdded ? stripEducationNoticeComment(wrapped, '#') : wrapped
    if (entry.noticeAdded && value === wrapped)
      return fail('Missing recorded education-comment wrapper')
    let data: Key['data']
    if (entry.data) {
      const bytes = await zip.file(entry.data.file)!.async('uint8array')
      if (entry.data.kind === 'bytes') data = bytes
      else {
        data = await crypto.subtle.importKey(
          entry.data.format,
          new Uint8Array(bytes),
          entry.data.algorithm,
          true,
          entry.data.usages
        )
        const role = data.type === 'secret' ? 'symmetric' : data.type
        if (role !== entry.type) return fail('Restored CryptoKey role differs from its record')
      }
    }
    keys.push({
      id: freshId(),
      name: entry.name,
      type: entry.type,
      algorithm: entry.algorithm,
      timestamp: entry.timestamp,
      value,
      ...(entry.dataType !== undefined ? { dataType: entry.dataType } : {}),
      ...(data !== undefined ? { data } : {}),
    })
  }
  return { keys, legacy: false }
}
