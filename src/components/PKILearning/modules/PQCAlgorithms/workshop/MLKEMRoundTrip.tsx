// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are the fixed file names of this step */
/**
 * Step 1: ML-KEM round trip.
 *
 * Generate a key pair, encapsulate, decapsulate, then change one byte of the ciphertext and
 * decapsulate again. Every value shown is what the in-browser OpenSSL build returned; the
 * explanatory sentences are claims from the Library documents.
 */
import { useCallback, useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { ClaimLine } from '../components/ClaimLine'
import { FILES, KEM_COMMANDS, KEM_PARAMETER_SETS, type KemParameterSet } from '../data/workshopData'
import { removeFiles, runOpenssl, sameBytes, toHex } from './opensslOps'

interface Outcome {
  secretHex: string
  matchesEncapsulation: boolean
}

const OWN_FILES = Object.values(FILES).filter((n) => n.startsWith('pqca-kem'))

export const MLKEMRoundTrip = () => {
  const [alg, setAlg] = useState<KemParameterSet>('ML-KEM-768')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [keys, setKeys] = useState<{ private: Uint8Array; public: Uint8Array } | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [secret, setSecret] = useState<Uint8Array | null>(null)
  const [decapsulated, setDecapsulated] = useState<Outcome | null>(null)
  const [altered, setAltered] = useState<{ ciphertext: Uint8Array; index: number } | null>(null)
  const [alteredOutcome, setAlteredOutcome] = useState<Outcome | null>(null)

  useEffect(() => () => removeFiles(OWN_FILES), [])

  const clear = useCallback(() => {
    setKeys(null)
    setCiphertext(null)
    setSecret(null)
    setDecapsulated(null)
    setAltered(null)
    setAlteredOutcome(null)
    setError('')
  }, [])

  const guard = async (work: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await work()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const chooseAlgorithm = (next: KemParameterSet) => {
    setAlg(next)
    clear()
  }

  const generate = () =>
    guard(async () => {
      clear()
      const generated = await runOpenssl(KEM_COMMANDS.generate(alg))
      const priv = generated[FILES.kemKey]
      if (!priv) throw new Error('The tool did not return a key.')
      const derived = await runOpenssl(KEM_COMMANDS.publicKey(), [
        { name: FILES.kemKey, data: priv },
      ])
      const pub = derived[FILES.kemPub]
      if (!pub) throw new Error('The tool did not return a public key.')
      setKeys({ private: priv, public: pub })
    })

  const encapsulate = () =>
    guard(async () => {
      if (!keys) return
      const files = await runOpenssl(KEM_COMMANDS.encapsulate(), [
        { name: FILES.kemPub, data: keys.public },
      ])
      const ct = files[FILES.kemCiphertext]
      const ss = files[FILES.kemSecret]
      if (!ct || !ss) throw new Error('The tool did not return a ciphertext and a shared secret.')
      setCiphertext(ct)
      setSecret(ss)
      setDecapsulated(null)
      setAltered(null)
      setAlteredOutcome(null)
    })

  const decapsulate = () =>
    guard(async () => {
      if (!keys || !ciphertext || !secret) return
      const files = await runOpenssl(
        KEM_COMMANDS.decapsulate(FILES.kemCiphertext, FILES.kemRecovered),
        [
          { name: FILES.kemKey, data: keys.private },
          { name: FILES.kemCiphertext, data: ciphertext },
        ]
      )
      const out = files[FILES.kemRecovered]
      if (!out) throw new Error('The tool did not return a shared secret.')
      setDecapsulated({ secretHex: toHex(out), matchesEncapsulation: sameBytes(out, secret) })
    })

  const alterCiphertext = () => {
    if (!ciphertext) return
    const index = Math.floor(ciphertext.length / 2)
    const changed = new Uint8Array(ciphertext)
    changed[index] ^= 0x01
    setAltered({ ciphertext: changed, index })
    setAlteredOutcome(null)
  }

  const decapsulateAltered = () =>
    guard(async () => {
      if (!keys || !altered || !secret) return
      const files = await runOpenssl(
        KEM_COMMANDS.decapsulate(FILES.kemAlteredCiphertext, FILES.kemAlteredRecovered),
        [
          { name: FILES.kemKey, data: keys.private },
          { name: FILES.kemAlteredCiphertext, data: altered.ciphertext },
        ]
      )
      const out = files[FILES.kemAlteredRecovered]
      if (!out) throw new Error('The tool did not return a shared secret.')
      setAlteredOutcome({ secretHex: toHex(out), matchesEncapsulation: sameBytes(out, secret) })
    })

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">ML-KEM round trip</h3>
            <p className="text-sm text-muted-foreground">
              Generate a key pair, encapsulate, decapsulate, then change the ciphertext.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Educational use only. Do not use keys generated here for any real purpose.
        </p>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Parameter set</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Parameter set">
            {KEM_PARAMETER_SETS.map((p) => (
              <Button
                key={p}
                type="button"
                variant={alg === p ? 'gradient' : 'outline'}
                onClick={() => chooseAlgorithm(p)}
                disabled={busy}
                className="text-xs"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        <ClaimLine id="ALG-A05" />
        <ClaimLine id="ALG-A06" />
        <ClaimLine id="ALG-A07" />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="gradient" onClick={generate} disabled={busy}>
            1. Generate a key pair
          </Button>
          <Button type="button" variant="outline" onClick={encapsulate} disabled={busy || !keys}>
            2. Encapsulate
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={decapsulate}
            disabled={busy || !ciphertext}
          >
            3. Decapsulate
          </Button>
        </div>

        {error ? <ErrorAlert message={error} /> : null}

        <dl className="grid gap-2 text-sm" aria-live="polite">
          {keys ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <dt className="text-xs text-muted-foreground">Key pair</dt>
              <dd className="text-foreground">Generated for {alg}</dd>
            </div>
          ) : null}
          {ciphertext && secret ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
              <dt className="text-xs text-muted-foreground">Encapsulation returned</dt>
              <dd className="text-foreground">Ciphertext: {ciphertext.length} bytes</dd>
              <dd className="text-foreground">Shared secret: {secret.length} bytes</dd>
              <dd className="font-mono text-xs break-all text-foreground">{toHex(secret)}</dd>
            </div>
          ) : null}
          {decapsulated ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
              <dt className="text-xs text-muted-foreground">Decapsulation returned</dt>
              <dd className="font-mono text-xs break-all text-foreground">
                {decapsulated.secretHex}
              </dd>
              <dd className="text-foreground">
                Same as the secret from encapsulation:{' '}
                {decapsulated.matchesEncapsulation ? 'yes' : 'no'}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-gradient">Change the ciphertext</h3>
        <p className="text-sm text-muted-foreground">
          Change one byte of the ciphertext and decapsulate again.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={alterCiphertext}
            disabled={busy || !ciphertext}
          >
            4. Change one byte of the ciphertext
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={decapsulateAltered}
            disabled={busy || !altered}
          >
            5. Decapsulate the changed ciphertext
          </Button>
        </div>

        <dl className="grid gap-2 text-sm" aria-live="polite">
          {altered ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <dt className="text-xs text-muted-foreground">Changed ciphertext</dt>
              <dd className="text-foreground">Byte {altered.index} was flipped.</dd>
            </div>
          ) : null}
          {alteredOutcome ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
              <dt className="text-xs text-muted-foreground">Decapsulation returned</dt>
              <dd className="text-foreground">The command finished without an error.</dd>
              <dd className="font-mono text-xs break-all text-foreground">
                {alteredOutcome.secretHex}
              </dd>
              <dd className="text-foreground">
                Same as the secret from encapsulation:{' '}
                {alteredOutcome.matchesEncapsulation ? 'yes' : 'no'}
              </dd>
            </div>
          ) : null}
        </dl>

        <ClaimLine id="ALG-A15" />
        <ClaimLine id="ALG-A32" />
      </section>
    </div>
  )
}
