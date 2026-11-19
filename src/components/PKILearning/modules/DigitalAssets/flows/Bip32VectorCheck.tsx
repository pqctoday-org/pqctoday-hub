// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { HDKey } from '@scure/bip32'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UseHSMResult } from '@/hooks/useHSM'
import { hsm_extractKeyValue, hsm_importGenericSecret, type SoftHSMModule } from '@/wasm/softhsm'
import { hsm_bip32ChildDerive, hsm_bip32MasterDerive } from '@/wasm/softhsm/classical'

// BIP 32 test vector 1. Only the published seed and public records are used.
const SEED = '000102030405060708090a0b0c0d0e0f'
const PARENT_XPUB =
  'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw'
const FIRST_CHILD_XPUB =
  'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ'

function deriveSampleTokenPublicKey(module: SoftHSMModule, session: number, index: number) {
  const handles: number[] = []
  try {
    const seed = hsm_importGenericSecret(module, session, hexToBytes(SEED))
    handles.push(seed)
    const master = hsm_bip32MasterDerive(module, session, seed, 'secp256k1')
    handles.push(master)
    const parent = hsm_bip32ChildDerive(module, session, master, 0, true, 'secp256k1')
    handles.push(parent)
    const child = hsm_bip32ChildDerive(module, session, parent, index, false, 'secp256k1', true)
    handles.push(child)
    const sampleScalar = hsm_extractKeyValue(module, session, child)
    try {
      return bytesToHex(secp256k1.getPublicKey(sampleScalar, true))
    } finally {
      sampleScalar.fill(0)
    }
  } finally {
    for (const handle of handles.reverse()) module._C_DestroyObject(session, handle)
  }
}

interface Result {
  path: string
  engine: string
  expected: string
  actual: string
  published: boolean
  matches: boolean
}

export function Bip32VectorCheck({ hsm }: { hsm: UseHSMResult }) {
  const inputId = useId()
  const [indexText, setIndexText] = useState('1')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const index = Number(indexText)
  const valid = /^\d+$/.test(indexText) && index < 0x80000000

  const compare = () => {
    if (!valid) return
    setResult(null)
    setError('')
    try {
      const path = `m/0'/${index}`
      const published = index === 1
      const reference = published
        ? HDKey.fromExtendedKey(FIRST_CHILD_XPUB)
        : HDKey.fromExtendedKey(PARENT_XPUB).deriveChild(index)
      const sample = HDKey.fromMasterSeed(hexToBytes(SEED)).derive(path)
      if (!reference.publicKey || !sample.publicKey) throw new Error('Public result unavailable.')
      if (reference.index !== index || sample.index !== index)
        throw new Error('A derivation moved to a different index. Choose another sample index.')

      const module = hsm.moduleRef.current
      const session = hsm.hSessionRef.current
      const live = Boolean(hsm.isReady && module && session)
      const actual =
        live && module && session
          ? deriveSampleTokenPublicKey(module, session, index)
          : bytesToHex(sample.publicKey)
      const expected = bytesToHex(reference.publicKey)
      setResult({
        path,
        published,
        expected,
        actual,
        engine: live
          ? `SoftHSM3 WebAssembly (${hsm.engine === 'rust' ? 'Rust' : 'C++'})`
          : 'JavaScript (@scure/bip32)',
        matches: actual === expected && sample.publicExtendedKey === reference.publicExtendedKey,
      })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Sample derivation could not finish.')
    }
  }

  return (
    <details className="glass-panel mb-4 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Compare a published BIP 32 example
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-muted-foreground">
          Use the public test seed from BIP 32. Index 1 has a published expected key. For other
          non-hardened indices, the reference starts from the published parent public key.
        </p>
        <p className="text-xs text-muted-foreground">
          The software-token path reads the sample child scalar into JavaScript to compute its
          compressed public key. The fixture uses publicly known keys.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
              Non-hardened child index
            </label>
            <Input
              id={inputId}
              inputMode="numeric"
              value={indexText}
              aria-invalid={!valid}
              aria-describedby={!valid ? `${inputId}-range` : undefined}
              onChange={(event) => {
                setIndexText(event.target.value)
                setResult(null)
                setError('')
              }}
            />
          </div>
          <Button type="button" disabled={!valid} onClick={compare}>
            Compare public keys
          </Button>
        </div>
        {!valid && (
          <p id={`${inputId}-range`} className="text-sm text-status-error">
            Enter a whole index from 0 to 2,147,483,647.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {result && (
          <div role="status" className="space-y-2 rounded-lg border border-border p-3 text-sm">
            <p className="font-semibold">
              {result.matches ? 'Public keys match' : 'Public key comparison failed'}
            </p>
            <p>
              Path {result.path} · {result.engine}
            </p>
            <dl className="space-y-1">
              <dt>
                {result.published
                  ? 'Published child key'
                  : 'Reference derived from the published parent'}
              </dt>
              <dd className="break-all font-mono text-xs">{result.expected}</dd>
              <dt>Sample compressed public key</dt>
              <dd className="break-all font-mono text-xs">{result.actual}</dd>
            </dl>
          </div>
        )}
        <a
          href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          BIP 32 test vector 1
        </a>
      </div>
    </details>
  )
}
