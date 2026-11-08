// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { runFullProtocol, getFinalKey } from '../services/BB84Service'
import { Button } from '@/components/ui/button'
import {
  compareSamplePair,
  extractionBudget,
  extractSamplePair,
  packSampleBits,
  parseSampleBits,
  retainedSamplePair,
  type SampleBit,
} from '../utils/samplePostProcessing'

const STEPS = [
  'Paired inputs',
  'Sample estimation',
  'Compare retained bits',
  'Bounded extraction',
  'Separate SHA-256 example',
  'Sample HKDF',
  'Result',
]
const WORKED = '101100101010011011100001'
const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Sample operation failed.'
const assumption = (value: string) => (value.trim() === '' ? NaN : Number(value))
type Pair = ReturnType<typeof compareSamplePair>
type Extracted = ReturnType<typeof extractSamplePair>

export function PostProcessingDemo() {
  const [step, setStep] = useState(0)
  const [meta, setMeta] = useState<{ source: string; prefix: number; qber: number | null } | null>(
    null
  )
  const [alice, setAlice] = useState('')
  const [bob, setBob] = useState('')
  const [edited, setEdited] = useState(false)
  const [pair, setPair] = useState<Pair | null>(null)
  const [entropy, setEntropy] = useState('')
  const [reserve, setReserve] = useState('4')
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [digest, setDigest] = useState('')
  const [derived, setDerived] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const epoch = useRef(0)
  const mounted = useRef(true)
  const invalidateEpoch = useCallback(() => {
    epoch.current++
  }, [])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      invalidateEpoch()
    }
  }, [invalidateEpoch])

  const invalidate = useCallback(() => {
    invalidateEpoch()
    setExtracted(null)
    setDigest('')
    setDerived('')
    setError('')
  }, [invalidateEpoch])
  const initialize = (
    a: SampleBit[],
    b: SampleBit[],
    source: string,
    prefix: number,
    qber: number | null
  ) => {
    invalidate()
    setPair(null)
    setAlice(a.join(''))
    setBob(b.join(''))
    setEdited(false)
    setMeta({ source, prefix, qber })
    setEntropy(String(a.length))
    setReserve('4')
    setStep(1)
  }
  const generate = () => {
    invalidate()
    setPair(null)
    setMeta(null)
    setAlice('')
    setBob('')
    setStep(0)
    try {
      const state = runFullProtocol(64, false, 1.0, 0.05)
      if (state.sampleSize === null)
        throw new Error('The generator did not return a disclosed-prefix count.')
      const tails = retainedSamplePair(
        state.siftedKeyAlice,
        state.siftedKeyBob,
        state.sampleSize,
        getFinalKey(state).length > 0
      )
      initialize(
        tails.alice,
        tails.bob,
        'Existing BB84 generator: 64 qubits, 5% channel noise',
        state.sampleSize,
        state.qber
      )
    } catch (cause) {
      setError(message(cause))
    }
  }
  const loadWorked = () =>
    initialize(
      parseSampleBits(WORKED),
      parseSampleBits(WORKED),
      'Fictional worked pair: 32 sifted bits, 8 disclosed matching prefix bits',
      8,
      0
    )
  const changeBits = (party: 'alice' | 'bob', value: string) => {
    invalidate()
    setPair(null)
    setEdited(true)
    setStep(2)
    if (party === 'alice') setAlice(value)
    else setBob(value)
  }
  const compare = () => {
    invalidate()
    setPair(null)
    try {
      const result = compareSamplePair(parseSampleBits(alice), parseSampleBits(bob))
      setPair(result)
      if (!result.matched) {
        setError(
          `Batch rejected: ${result.mismatches} retained bit(s) differ. No dependent output is available.`
        )
        return
      }
      setStep(3)
    } catch (cause) {
      setError(message(cause))
    }
  }
  const changeAssumption = (field: 'entropy' | 'reserve', value: string) => {
    invalidate()
    if (field === 'entropy') setEntropy(value)
    else setReserve(value)
    setStep(3)
  }
  const extract = () => {
    if (!pair?.matched || busyRef.current) return
    invalidate()
    try {
      const budget = extractionBudget(pair.alice.length, assumption(entropy), assumption(reserve))
      const random = new Uint8Array(
        budget.outputBits ? pair.alice.length + budget.outputBits - 1 : 0
      )
      if (random.length) crypto.getRandomValues(random)
      const seed = [...random].map((byte) => (byte & 1) as SampleBit)
      setExtracted(
        extractSamplePair(pair.alice, pair.bob, assumption(entropy), assumption(reserve), seed)
      )
      setStep(4)
    } catch (cause) {
      setError(message(cause))
    }
  }
  const runAsync = async (operation: (isCurrent: () => boolean) => Promise<void>) => {
    if (busyRef.current || !mounted.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    const version = epoch.current
    const isCurrent = () => mounted.current && epoch.current === version
    try {
      await operation(isCurrent)
    } catch (cause) {
      if (isCurrent()) setError(message(cause))
    } finally {
      // Input changes cancel publication, not an already-running WebCrypto call.
      // No new async operation can own this slot before this promise settles.
      busyRef.current = false
      if (mounted.current) setBusy(false)
    }
  }
  const calculateDigest = () => {
    if (!pair?.matched || !extracted) return
    void runAsync(async (isCurrent) => {
      setDigest('')
      setDerived('')
      // This separate format illustration hashes the matched retained sample,
      // NOT a padded short extraction output. It adds no entropy.
      const output = await crypto.subtle.digest(
        'SHA-256',
        new Uint8Array(packSampleBits(pair.alice))
      )
      if (!isCurrent()) return
      if (output.byteLength !== 32)
        throw new Error('SHA-256 did not return the expected 32-byte digest.')
      setDigest(hex(output))
      setStep(5)
    })
  }
  const calculateHkdf = () => {
    if (!digest) return
    void runAsync(async (isCurrent) => {
      setDerived('')
      const placeholder = new Uint8Array(32)
      crypto.getRandomValues(placeholder)
      const combined = new Uint8Array(64)
      combined.set(
        Uint8Array.from({ length: 32 }, (_, i) => parseInt(digest.slice(i * 2, i * 2 + 2), 16))
      )
      combined.set(placeholder, 32)
      const material = await crypto.subtle.importKey('raw', combined, 'HKDF', false, ['deriveBits'])
      if (!isCurrent()) return
      const output = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(32),
          info: new TextEncoder().encode('qkd-hybrid-key'),
        },
        material,
        256
      )
      if (!isCurrent()) return
      if (output.byteLength !== 32)
        throw new Error('HKDF did not return the expected 32-byte output.')
      setDerived(hex(output))
      setStep(6)
    })
  }

  return (
    <div className="space-y-5">
      <p role="note" className="rounded border border-border p-4 text-sm">
        Compare both parties’ sample bits, reject mismatched batches, and compute a public-seed
        Toeplitz output under explicit fictional entropy assumptions. The Hub shows sample bits
        locally; this is not a secrecy proof, error-correction protocol or authenticated
        key-confirmation exchange.
      </p>
      <div className="flex flex-wrap gap-2 text-xs" aria-label="Postprocessing stages">
        {STEPS.map((label, index) => (
          <span
            key={label}
            aria-current={index === step ? 'step' : undefined}
            className="rounded border border-border px-2 py-1"
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate}>Generate Sifted Key</Button>
        <Button variant="outline" onClick={loadWorked}>
          Load worked paired sample
        </Button>
      </div>
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          A sample crypto operation is settling. You can edit or replace inputs; dependent crypto
          actions stay disabled until it finishes.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded border border-status-error p-3 text-sm">
          {error}
        </p>
      )}
      {meta && (
        <>
          <div className="glass-panel p-4 text-sm space-y-2">
            <p>
              {meta.source}. Existing generator samples a prefix; {meta.prefix} disclosed prefix
              bits are excluded from each retained input.
            </p>
            <p>
              Original prefix QBER:{' '}
              {meta.qber === null ? 'Unknown' : `${(meta.qber * 100).toFixed(1)}%`}.{' '}
              {edited
                ? 'Retained inputs edited locally; this does not rerun parameter estimation.'
                : 'This sample statistic does not establish secrecy.'}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="min-w-0 text-sm">
                Alice retained bits
                <textarea
                  aria-label="Alice retained bits"
                  value={alice}
                  onChange={(event) => changeBits('alice', event.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background p-2 font-mono break-all"
                />
              </label>
              <label className="min-w-0 text-sm">
                Bob retained bits
                <textarea
                  aria-label="Bob retained bits"
                  value={bob}
                  onChange={(event) => changeBits('bob', event.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background p-2 font-mono break-all"
                />
              </label>
            </div>
            {step === 1 && (
              <Button onClick={() => setStep(2)}>Continue to paired comparison</Button>
            )}
            {step === 2 && <Button onClick={compare}>Compare both retained samples</Button>}
          </div>
          {pair && (
            <section
              aria-label="Paired comparison and public transcript"
              className="glass-panel p-4 text-sm space-y-2"
            >
              <p>
                {pair.matched
                  ? 'Retained samples match locally.'
                  : 'Retained samples differ; batch rejected.'}{' '}
                {pair.mismatches} differing bit(s).
              </p>
              <ul>
                {pair.transcript.map((block) => (
                  <li key={block.start}>
                    Bits {block.start + 1}–{block.start + block.length}: Alice parity {block.alice};
                    Bob parity {block.bob}.
                  </li>
                ))}
              </ul>
              <p>
                Public transcript budget: {pair.publicMessageBits} message bits (two parity messages
                per block, including partial blocks). Equal parities alone do not establish equal
                strings. Local full-string comparison rejects even-parity errors too; it is not a
                production confirmation protocol.
              </p>
            </section>
          )}
          {step === 3 && pair?.matched && (
            <section className="glass-panel p-4 space-y-3" aria-label="Fictional extraction budget">
              <h3 className="font-semibold">Bounded public-seed extraction mechanics</h3>
              <p className="text-sm">
                N = {pair.alice.length} retained bits. H defaults to N when a pair is loaded as an
                idealized fictional assumption after prefix sampling, not an entropy estimate from
                QBER. Review H if you edit the retained inputs. Reserve R = 4 is an illustrative
                deduction, not a quantified security parameter. The message-bit budget is
                conservative bookkeeping, not exact independent entropy leakage.
              </p>
              <label className="block text-sm">
                Assumed retained entropy H (bits)
                <input
                  aria-label="Assumed retained entropy H (bits)"
                  type="number"
                  value={entropy}
                  onChange={(event) => changeAssumption('entropy', event.target.value)}
                  className="block w-full sm:w-40 rounded border border-border bg-background p-2"
                />
              </label>
              <label className="block text-sm">
                Illustrative reserve R (bits)
                <input
                  aria-label="Illustrative reserve R (bits)"
                  type="number"
                  value={reserve}
                  onChange={(event) => changeAssumption('reserve', event.target.value)}
                  className="block w-full sm:w-40 rounded border border-border bg-background p-2"
                />
              </label>
              <Button onClick={extract} disabled={busy}>
                Compute bounded sample output
              </Button>
            </section>
          )}
          {extracted && (
            <section
              aria-label="Bounded extraction result"
              className="glass-panel p-4 text-sm space-y-2"
            >
              <p>
                N={extracted.retainedBits}; H={extracted.assumedEntropy}; P=
                {extracted.publicMessageBits}; R={extracted.reserve}. L=min(N,max(0,H−P−R))=
                {extracted.outputBits} bits.
              </p>
              <p>
                Public seed ({extracted.seed.length} bits):{' '}
                <code className="break-all">
                  {extracted.seed.join('') || 'Not needed for zero output'}
                </code>
              </p>
              <p>
                Alice extracted bits: <code>{extracted.alice.join('') || 'No output'}</code>
              </p>
              <p>
                Bob extracted bits: <code>{extracted.bob.join('') || 'No output'}</code>
              </p>
              <p>
                Each party computes T[i,j]=seed[N−1+i−j] over GF(2). The public seed adds no secret
                entropy. Matching outputs and this hypothetical budget do not establish secrecy.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  invalidate()
                  setStep(3)
                }}
              >
                Edit extraction assumptions
              </Button>
            </section>
          )}
          {step === 4 && (
            <section className="glass-panel p-4 space-y-3">
              <h3 className="font-semibold">Separate SHA-256 format example</h3>
              <p className="text-sm">
                Hash the matched retained sample to a fixed 256-bit digest. This is separate from
                the bounded extraction above: a digest can exceed its input length and adds no
                entropy, including when the extraction budget produced zero bits.
              </p>
              <Button onClick={calculateDigest} disabled={busy}>
                {busy ? 'Hashing…' : 'Calculate Sample Digest'}
              </Button>
            </section>
          )}
          {step === 5 && (
            <section className="glass-panel p-4 space-y-3">
              <h3 className="font-semibold">Sample HKDF with a random placeholder</h3>
              <p className="text-sm">
                Combine the 32-byte SHA-256 digest with 32 random placeholder bytes using the
                existing HKDF example. No ML-KEM operation executes, and this does not create a
                secure hybrid QKD construction.
              </p>
              <p className="break-all text-xs font-mono">{digest}</p>
              <Button onClick={calculateHkdf} disabled={busy}>
                {busy ? 'Deriving…' : 'Derive Sample HKDF Output'}
              </Button>
            </section>
          )}
          {step === 6 && (
            <section className="glass-panel p-4 space-y-3" aria-label="Sample HKDF result">
              <h3 className="font-semibold">Sample HKDF Output Calculated</h3>
              <p className="text-sm">
                This separate example uses the 32-byte digest and 32 random placeholder bytes, not
                the bounded extraction output. No ML-KEM operation executes; this is not a secure
                hybrid-QKD construction.
              </p>
              <p className="text-sm">
                Sample Digest (256 bits, not a verified QKD secret):{' '}
                <code className="break-all">{digest}</code>
              </p>
              <p className="text-sm">
                Sample HKDF Output (256 bits): <code className="break-all">{derived}</code>
              </p>
              <p className="text-sm">
                Evaluate production tools for authenticated reconciliation and key confirmation,
                leakage accounting, a finite-key security analysis and documented privacy
                amplification. This local sample does not establish those capabilities. See{' '}
                <a
                  href="https://www.etsi.org/deliver/etsi_gs/qkd/001_099/005/01.01.01_60/gs_qkd005v010101p.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  ETSI GS QKD 005 §§4.7.3–4.7.6
                </a>
                .
              </p>
            </section>
          )}
        </>
      )}
    </div>
  )
}
