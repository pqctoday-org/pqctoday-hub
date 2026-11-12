// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import type { Key } from '@/types'
import { withEducationNoticeComment } from '@/data/educationNotice'
import {
  createSampleKeyArchive,
  readSampleKeyArchive,
  SAMPLE_KEY_MANIFEST,
} from './sampleKeyArchive'

const record = (id: string, type: Key['type'] = 'private'): Key => ({
  id,
  name: 'Same name',
  type,
  algorithm: 'ML-DSA-65',
  timestamp: 100,
  value: '0011\r\n',
  dataType: 'binary',
  data: new Uint8Array([0, 17, 255]),
})
const withoutId = (key: Key) =>
  Object.fromEntries(Object.entries(key).filter(([name]) => name !== 'id'))
interface MutableManifest {
  version: unknown
  keys: Array<{
    type: unknown
    timestamp: unknown
    algorithm: unknown
    dataType?: unknown
    valueFile: string
    data?: { file: string }
  }>
}
async function alter(change: (manifest: MutableManifest, zip: JSZip) => void) {
  const zip = await JSZip.loadAsync(
    await createSampleKeyArchive([record('one'), record('two', 'public')])
  )
  const manifest = JSON.parse(await zip.file(SAMPLE_KEY_MANIFEST)!.async('string'))
  change(manifest, zip)
  zip.file(SAMPLE_KEY_MANIFEST, JSON.stringify(manifest))
  return zip.generateAsync({ type: 'uint8array' })
}
describe('versioned plaintext sample-key archive', () => {
  it('preserves exact text, independent binary state, metadata, roles and duplicate display names with fresh IDs', async () => {
    const keys = [
      record('one', 'public'),
      record('two'),
      { ...record('aes', 'symmetric'), algorithm: 'AES-GCM' },
    ]
    const bytes = await createSampleKeyArchive(keys)
    const first = await readSampleKeyArchive(bytes),
      second = await readSampleKeyArchive(bytes)
    expect(first.legacy).toBe(false)
    expect(first.keys.map(withoutId)).toEqual(keys.map(withoutId))
    expect(new Set([...keys, ...first.keys, ...second.keys].map((key) => key.id)).size).toBe(9)
    const zip = await JSZip.loadAsync(bytes)
    expect(Object.keys(zip.files).filter((name) => name.endsWith('.txt'))).toHaveLength(4)
  })
  it('preserves already-noticed text and already-unclassified legacy records without inventing key data', async () => {
    const keys: Key[] = [
      {
        id: 'old',
        name: 'Older entry',
        type: 'unclassified',
        algorithm: 'Unclassified legacy material',
        value: withEducationNoticeComment('aabb', '#'),
        timestamp: 1,
      },
    ]
    expect(
      (await readSampleKeyArchive(await createSampleKeyArchive(keys))).keys.map(withoutId)
    ).toEqual(keys.map(withoutId))
  })
  it('keeps string-only records without manufacturing a binary encoding', async () => {
    const keys: Key[] = [
      {
        id: 'mock',
        name: 'Mock key',
        type: 'private',
        algorithm: 'ML-KEM',
        value: 'representative text',
        dataType: 'string',
        timestamp: 4,
      },
    ]
    expect(
      (await readSampleKeyArchive(await createSampleKeyArchive(keys))).keys.map(withoutId)
    ).toEqual(keys.map(withoutId))
  })
  it.each([
    [
      'unknown version',
      (m: MutableManifest) => {
        m.version = 2
      },
    ],
    [
      'invalid role',
      (m: MutableManifest) => {
        m.keys[0].type = 'verified-private'
      },
    ],
    [
      'invalid timestamp',
      (m: MutableManifest) => {
        m.keys[0].timestamp = 'yesterday'
      },
    ],
    [
      'invalid algorithm type',
      (m: MutableManifest) => {
        m.keys[0].algorithm = 65
      },
    ],
    [
      'unknown data type',
      (m: MutableManifest) => {
        m.keys[0].dataType = 'token'
      },
    ],
    [
      'missing file',
      (m: MutableManifest, z: JSZip) => {
        z.remove(m.keys[1].valueFile)
      },
    ],
    [
      'duplicate reference',
      (m: MutableManifest) => {
        m.keys[1].valueFile = m.keys[0].valueFile
      },
    ],
    [
      'absolute path',
      (m: MutableManifest) => {
        m.keys[0].valueFile = '/key.txt'
      },
    ],
    [
      'traversal reference',
      (m: MutableManifest) => {
        m.keys[0].valueFile = 'keys/../key.txt'
      },
    ],
    [
      'unreferenced member',
      (_m: MutableManifest, z: JSZip) => {
        z.file('extra.txt', 'not implicitly imported')
      },
    ],
    [
      'wrong binary metadata',
      (m: MutableManifest) => {
        delete m.keys[0].data
      },
    ],
    [
      'missing wrapper',
      (m: MutableManifest, z: JSZip) => {
        z.file(m.keys[0].valueFile, '0011')
      },
    ],
  ] as const)('rejects %s before returning any collection records', async (_label, change) => {
    await expect(readSampleKeyArchive(await alter(change))).rejects.toThrow()
  })
  it('rejects malformed JSON and sanitized traversal entries, without silently using legacy mode', async () => {
    const zip = new JSZip().file(SAMPLE_KEY_MANIFEST, '{broken').file('key.txt', 'aabb')
    await expect(
      readSampleKeyArchive(await zip.generateAsync({ type: 'uint8array' }))
    ).rejects.toThrow()
    const old = new JSZip().file('../key.txt', 'aabb')
    await expect(
      readSampleKeyArchive(await old.generateAsync({ type: 'uint8array' }))
    ).rejects.toThrow(/path/)
  })
  it('imports older text members as role/algorithm-unclassified even when their filename suggests a key type', async () => {
    const zip = new JSZip()
      .file('NOTICE.txt', 'notice')
      .file('RSA_Private.txt', withEducationNoticeComment('aa', '#'))
    const restored = await readSampleKeyArchive(await zip.generateAsync({ type: 'uint8array' }))
    expect(restored.legacy).toBe(true)
    expect(restored.keys).toHaveLength(1)
    expect(restored.keys[0]).toMatchObject({
      type: 'unclassified',
      algorithm: 'Unclassified legacy material',
      value: 'aa',
    })
    expect(restored.keys[0].dataType).toBeUndefined()
  })
  it('reconstructs actual extractable public/private CryptoKeys and independently signs/verifies', async () => {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, [
      'sign',
      'verify',
    ])
    const keys = [pair.publicKey, pair.privateKey].map((data, i): Key => ({
      id: String(i),
      name: 'EC sample',
      type: data.type === 'public' ? 'public' : 'private',
      algorithm: 'ECDSA-P384',
      value: `exact independent view ${i}`,
      timestamp: 5,
      data,
      dataType: 'cryptokey',
    }))
    const result = await readSampleKeyArchive(await createSampleKeyArchive(keys))
    for (const [i, entry] of result.keys.entries()) {
      const restored = entry.data as CryptoKey,
        original = keys[i].data as CryptoKey
      expect(restored.algorithm).toEqual(original.algorithm)
      expect(restored.usages).toEqual(original.usages)
      expect(entry.value).toBe(keys[i].value)
      const format = entry.type === 'public' ? 'spki' : 'pkcs8'
      expect(new Uint8Array(await crypto.subtle.exportKey(format, restored))).toEqual(
        new Uint8Array(await crypto.subtle.exportKey(format, original))
      )
    }
    const message = new TextEncoder().encode('fictional ZIP round-trip')
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-384' },
      result.keys[1].data as CryptoKey,
      message
    )
    expect(
      await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-384' },
        result.keys[0].data as CryptoKey,
        signature,
        message
      )
    ).toBe(true)
  })
  it('reconstructs an actual symmetric CryptoKey with identical bytes and usable encrypt/decrypt operations', async () => {
    const data = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ])
    const key: Key = {
      id: 'aes',
      name: 'AES',
      type: 'symmetric',
      algorithm: 'AES-GCM',
      value: 'exact display bytes',
      timestamp: 7,
      data,
      dataType: 'cryptokey',
    }
    const restored = (await readSampleKeyArchive(await createSampleKeyArchive([key]))).keys[0]
      .data as CryptoKey
    expect(new Uint8Array(await crypto.subtle.exportKey('raw', restored))).toEqual(
      new Uint8Array(await crypto.subtle.exportKey('raw', data))
    )
    const message = new Uint8Array([1, 2, 3]),
      algorithm = { name: 'AES-GCM', iv: new Uint8Array(12) }
    const cipher = await crypto.subtle.encrypt(algorithm, restored, message)
    expect(new Uint8Array(await crypto.subtle.decrypt(algorithm, data, cipher))).toEqual(message)
  })
  it.each([
    [
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      ['encrypt', 'decrypt'],
    ],
    [{ name: 'ECDH', namedCurve: 'P-256' }, ['deriveBits']],
    [{ name: 'ECDSA', namedCurve: 'P-521' }, ['sign', 'verify']],
    [{ name: 'Ed25519' }, ['sign', 'verify']],
    [{ name: 'X25519' }, ['deriveBits']],
  ] as const)(
    'preserves exported bytes and actual CryptoKey algorithm/usages for %s',
    async (algorithm, keyUsages) => {
      const pair = (await crypto.subtle.generateKey(algorithm, true, [
        ...keyUsages,
      ])) as CryptoKeyPair
      const keys = [pair.publicKey, pair.privateKey].map((data, index): Key => ({
        id: String(index),
        name: 'Actual sample',
        type: data.type === 'public' ? 'public' : 'private',
        algorithm: algorithm.name,
        value: 'unchanged display',
        dataType: 'cryptokey',
        data,
        timestamp: 9,
      }))
      const result = await readSampleKeyArchive(await createSampleKeyArchive(keys))
      for (const [index, key] of result.keys.entries()) {
        const data = key.data as CryptoKey,
          original = keys[index].data as CryptoKey
        expect(data.algorithm).toEqual(original.algorithm)
        expect(data.usages).toEqual(original.usages)
        const format = key.type === 'public' ? 'spki' : 'pkcs8'
        expect(new Uint8Array(await crypto.subtle.exportKey(format, data))).toEqual(
          new Uint8Array(await crypto.subtle.exportKey(format, original))
        )
      }
    }
  )
  it('fails an entire export containing a nonextractable key rather than silently omitting it', async () => {
    const data = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, false, [
      'encrypt',
      'decrypt',
    ])
    await expect(
      createSampleKeyArchive([
        record('valid'),
        {
          id: 'protected',
          name: 'Unsupported key',
          type: 'symmetric',
          algorithm: 'AES-GCM',
          value: '',
          timestamp: 8,
          data,
          dataType: 'cryptokey',
        },
      ])
    ).rejects.toThrow(/Nonextractable/)
  })
  it('rejects malformed CryptoKey bytes or role/format metadata instead of returning earlier valid records', async () => {
    const data = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, [
      'encrypt',
      'decrypt',
    ])
    const bytes = await createSampleKeyArchive([
      record('first'),
      {
        id: 'aes',
        name: 'AES',
        type: 'symmetric',
        algorithm: 'AES-GCM',
        value: '00',
        timestamp: 8,
        data,
        dataType: 'cryptokey',
      },
    ])
    const zip = await JSZip.loadAsync(bytes),
      m = JSON.parse(await zip.file(SAMPLE_KEY_MANIFEST)!.async('string'))
    zip.file(m.keys[1].data.file, new Uint8Array(3))
    await expect(
      readSampleKeyArchive(await zip.generateAsync({ type: 'uint8array' }))
    ).rejects.toThrow()
    m.keys[1].type = 'public'
    zip.file(SAMPLE_KEY_MANIFEST, JSON.stringify(m))
    await expect(
      readSampleKeyArchive(await zip.generateAsync({ type: 'uint8array' }))
    ).rejects.toThrow(/format/)
  })
})
