// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { createHash } from 'node:crypto'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import {
  newModule,
  runOpenssl,
  writeFile,
  readFileBin,
} from '../../../../../test/kat/openssl-driver'
import { bindSubjectKeys, generateSubjectKey, subjectKeyDigest } from './subjectKeys'
import {
  buildMerkleTree,
  exportSubjectProof,
  getInclusionProof,
  hashCertLeaf,
  serializeCert,
  verifySubjectProof,
  type CertLeaf,
} from './merkleTree'
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(), deleteFile: vi.fn() },
}))
const metadata = (algorithm = 'ML-DSA-44', publicKeySize = 1312): CertLeaf => ({
  id: 1,
  subject: 'sample|世界',
  issuer: 'Sample CA',
  algorithm,
  publicKeySize,
  notBefore: '2026-01-01',
  notAfter: '2026-03-01',
})
async function actualExecute(command: string, files: { name: string; data: Uint8Array }[] = []) {
  const module = await newModule({ quiet: true })
  for (const file of files) writeFile(module, file.name, file.data)
  const args = command.split(' ').slice(1),
    output = args[args.indexOf('-out') + 1]
  const result = runOpenssl(module, [...args])
  if (result.rc !== 0) throw new Error(result.stderr)
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    files: [{ name: output, data: readFileBin(module, output) }],
  }
}
const nativeKeys: CertLeaf[] = []
beforeAll(async () => {
  vi.mocked(openSSLService.execute).mockImplementation(actualExecute)
  vi.mocked(openSSLService.deleteFile).mockResolvedValue(undefined)
  for (const [algorithm, size] of [
    ['ML-DSA-44', 1312],
    ['ML-DSA-65', 1952],
    ['ML-DSA-87', 2592],
    ['SLH-DSA-128s', 32],
  ] as const)
    nativeKeys.push(await generateSubjectKey(metadata(algorithm, size)))
}, 60000)
beforeEach(() => {
  vi.mocked(openSSLService.execute).mockReset().mockImplementation(actualExecute)
  vi.mocked(openSSLService.deleteFile).mockClear().mockResolvedValue(undefined)
})
describe('actual generated subject SPKI and version1 public leaf/proof binding', () => {
  it.each([0, 1, 2, 3])(
    'binds actual selected profile %s SPKI DER and independent Node hash',
    async (i) => {
      const leaf = nativeKeys[i],
        der = Buffer.from(leaf.publicKeySpki!, 'base64')
      expect(await subjectKeyDigest(leaf)).toBe(createHash('sha256').update(der).digest('hex'))
      expect(serializeCert(leaf)).toBe(
        JSON.stringify([
          'pqc-today-mtc-leaf-v1',
          leaf.id,
          leaf.subject,
          leaf.issuer,
          leaf.algorithm,
          leaf.publicKeySize,
          leaf.notBefore,
          leaf.notAfter,
          null,
          leaf.publicKeyDigest,
        ])
      )
      expect(await hashCertLeaf(leaf)).toBe(
        createHash('sha256')
          .update(Buffer.concat([Buffer.from([0]), Buffer.from(serializeCert(leaf))]))
          .digest('hex')
      )
      const tree = await buildMerkleTree([leaf, leaf])
      const envelope = exportSubjectProof(leaf, getInclusionProof(tree.levels, 0))
      expect((await verifySubjectProof(JSON.parse(JSON.stringify(envelope)))).valid).toBe(true)
      expect(JSON.stringify(envelope)).not.toMatch(/PRIVATE KEY|privateKey|secretKey/)
    }
  )
  it('retains keys across rebuilds and invalidates an old proof after actual same-size replacement', async () => {
    const original = nativeKeys[0],
      tree = await buildMerkleTree([original, original]),
      envelope = exportSubjectProof(original, getInclusionProof(tree.levels, 0))
    expect(await bindSubjectKeys([original])).toEqual([original])
    expect(openSSLService.execute).not.toHaveBeenCalled()
    const replacement = await generateSubjectKey(original)
    expect(replacement.algorithm).toBe(original.algorithm)
    expect(replacement.publicKeySize).toBe(original.publicKeySize)
    expect(replacement.publicKeyDigest).not.toBe(original.publicKeyDigest)
    expect((await verifySubjectProof({ ...envelope, leaf: replacement })).valid).toBe(false)
    const changed = await buildMerkleTree([replacement, original])
    expect(changed.root.hash).not.toBe(tree.root.hash)
    expect(openSSLService.deleteFile).toHaveBeenCalledTimes(2)
  })
  it('binds every metadata field and CT serial; delimiters/Unicode cannot alias', async () => {
    const leaf = { ...nativeKeys[0], serialNumber: 'ABCD' },
      tree = await buildMerkleTree([leaf, leaf]),
      envelope = exportSubjectProof(leaf, getInclusionProof(tree.levels, 0))
    for (const changed of [
      { id: 2 },
      { subject: 'other' },
      { issuer: 'other' },
      { notBefore: '2027-01-01' },
      { notAfter: '2028-01-01' },
      { serialNumber: 'ABCE' },
    ])
      expect((await verifySubjectProof({ ...envelope, leaf: { ...leaf, ...changed } })).valid).toBe(
        false
      )
    await expect(hashCertLeaf({ ...leaf, algorithm: 'ML-DSA-65' })).rejects.toThrow()
    await expect(hashCertLeaf({ ...leaf, publicKeySize: 1952 })).rejects.toThrow()
    expect(await hashCertLeaf({ ...leaf, subject: 'a|b', issuer: 'c' })).not.toBe(
      await hashCertLeaf({ ...leaf, subject: 'a', issuer: 'b|c' })
    )
  })
  it('rejects forged digests/hashes, malformed keys and unsupported old envelopes', async () => {
    const leaf = nativeKeys[0],
      tree = await buildMerkleTree([leaf, leaf]),
      envelope = exportSubjectProof(leaf, getInclusionProof(tree.levels, 0))
    await expect(
      verifySubjectProof({ ...envelope, leaf: { ...leaf, publicKeyDigest: '00'.repeat(32) } })
    ).rejects.toThrow(/digest/)
    expect(
      (
        await verifySubjectProof({
          ...envelope,
          proof: { ...envelope.proof, leafHash: '00'.repeat(32) },
        })
      ).valid
    ).toBe(false)
    for (const publicKeySpki of ['', 'AA==', leaf.publicKeySpki! + 'AA=='])
      await expect(hashCertLeaf({ ...leaf, publicKeySpki })).rejects.toThrow()
    for (const input of [envelope.proof, { ...envelope, version: 0 }, { ...envelope, version: 2 }])
      await expect(verifySubjectProof(input)).rejects.toThrow(/rebuild/i)
    await expect(buildMerkleTree([metadata()])).rejects.toThrow(/missing/i)
    await expect(
      verifySubjectProof({ ...envelope, proof: { ...envelope.proof, leafIndex: 1 } })
    ).rejects.toThrow(/direction/)
  })
  it('snapshots metadata before pending actual generation instead of mixing later inputs', async () => {
    let release!: () => void
    const waiting = new Promise<void>((resolve) => {
      release = resolve
    })
    vi.mocked(openSSLService.execute).mockImplementationOnce(async (command, files) => {
      await waiting
      return actualExecute(command, files)
    })
    const input = metadata(),
      original = { ...input },
      pending = generateSubjectKey(input)
    input.subject = 'later subject'
    input.algorithm = 'ML-DSA-65'
    release()
    const result = await pending
    expect(result.subject).toBe(original.subject)
    expect(result.algorithm).toBe(original.algorithm)
    expect(result.publicKeyDigest).toBe(await subjectKeyDigest(result))
  })
  it('does not publish missing output or generation/export errors, and always cleans only owned files', async () => {
    vi.mocked(openSSLService.execute).mockResolvedValueOnce({ stdout: '', stderr: '', files: [] })
    await expect(generateSubjectKey(metadata())).rejects.toThrow(/no private/)
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
    expect(openSSLService.deleteFile).toHaveBeenCalledTimes(2)
    expect(
      vi
        .mocked(openSSLService.deleteFile)
        .mock.calls.every(([name]) => /^mtc_subject_[\w-]+\.(pem|der)$/.test(name))
    ).toBe(true)
    vi.mocked(openSSLService.execute)
      .mockReset()
      .mockRejectedValueOnce(new Error('actual-call-failure'))
    await expect(generateSubjectKey(metadata())).rejects.toThrow('actual-call-failure')
    vi.mocked(openSSLService.execute)
      .mockReset()
      .mockImplementationOnce(actualExecute)
      .mockResolvedValueOnce({ stdout: '', stderr: '', files: [] })
    await expect(generateSubjectKey(metadata())).rejects.toThrow(/no public SPKI/)
  })
})
