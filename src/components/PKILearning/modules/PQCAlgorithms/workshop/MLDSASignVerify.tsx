// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Step 2: ML-DSA sign and verify.
 *
 * Generate a key pair, sign a message (hedged or deterministic, with or without a context
 * string), then verify it against the same or a changed message or context. Every value shown
 * is what the in-browser OpenSSL build returned; the explanatory sentences are claims from the
 * Library documents.
 */
import { useEffect, useState } from 'react'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ClaimLine } from '../components/ClaimLine'
import {
  DSA_COMMANDS,
  DSA_PARAMETER_SETS,
  FILES,
  isCarriableContext,
  type DsaParameterSet,
} from '../data/workshopData'
import { isCommandFailure, removeFiles, runOpenssl, sameBytes, toHex } from './opensslOps'

const OWN_FILES = Object.values(FILES).filter((n) => n.startsWith('pqca-dsa'))
const DEFAULT_MESSAGE = 'Message to sign'
const encode = (text: string) => new TextEncoder().encode(text)

interface Signed {
  message: string
  context: string
  deterministic: boolean
  signature: Uint8Array
  /** The signature this one replaced, when it was made from the same message and context */
  previous: Uint8Array | null
}

interface Verdict {
  ok: boolean
  detail: string
}

export const MLDSASignVerify = () => {
  const [alg, setAlg] = useState<DsaParameterSet>('ML-DSA-65')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [keys, setKeys] = useState<{ private: Uint8Array; public: Uint8Array } | null>(null)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [context, setContext] = useState('')
  const [deterministic, setDeterministic] = useState(false)
  const [signed, setSigned] = useState<Signed | null>(null)
  const [verifyMessage, setVerifyMessage] = useState(DEFAULT_MESSAGE)
  const [verifyContext, setVerifyContext] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)

  useEffect(() => () => removeFiles(OWN_FILES), [])

  const contextOk = isCarriableContext(context) && isCarriableContext(verifyContext)

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

  const chooseAlgorithm = (next: DsaParameterSet) => {
    setAlg(next)
    setKeys(null)
    setSigned(null)
    setVerdict(null)
    setError('')
  }

  const generate = () =>
    guard(async () => {
      setSigned(null)
      setVerdict(null)
      const generated = await runOpenssl(DSA_COMMANDS.generate(alg))
      const priv = generated[FILES.dsaKey]
      if (!priv) throw new Error('The tool did not return a key.')
      const derived = await runOpenssl(DSA_COMMANDS.publicKey(), [
        { name: FILES.dsaKey, data: priv },
      ])
      const pub = derived[FILES.dsaPub]
      if (!pub) throw new Error('The tool did not return a public key.')
      setKeys({ private: priv, public: pub })
    })

  const sign = () =>
    guard(async () => {
      if (!keys) return
      const files = await runOpenssl(DSA_COMMANDS.sign({ deterministic, context }), [
        { name: FILES.dsaKey, data: keys.private },
        { name: FILES.dsaMessage, data: encode(message) },
      ])
      const signature = files[FILES.dsaSignature]
      if (!signature) throw new Error('The tool did not return a signature.')
      const sameInputs = signed !== null && signed.message === message && signed.context === context
      setSigned({
        message,
        context,
        deterministic,
        signature,
        previous: sameInputs ? signed.signature : null,
      })
      setVerifyMessage(message)
      setVerifyContext(context)
      setVerdict(null)
    })

  const verify = () =>
    guard(async () => {
      if (!keys || !signed) return
      try {
        await runOpenssl(DSA_COMMANDS.verify(verifyContext), [
          { name: FILES.dsaPub, data: keys.public },
          { name: FILES.dsaMessage, data: encode(verifyMessage) },
          { name: FILES.dsaSignature, data: signed.signature },
        ])
        setVerdict({ ok: true, detail: 'Signature verified.' })
      } catch (e) {
        if (!isCommandFailure(e)) throw e
        setVerdict({ ok: false, detail: 'Verification failed.' })
      }
    })

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <PenLine size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">ML-DSA sign and verify</h3>
            <p className="text-sm text-muted-foreground">
              Generate a key pair, sign a message, then verify it with the same or a changed message
              or context string.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Educational use only. Do not use keys generated here for any real purpose.
        </p>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Parameter set</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Parameter set">
            {DSA_PARAMETER_SETS.map((p) => (
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

        <ClaimLine id="ALG-B04" />

        <Button type="button" variant="gradient" onClick={generate} disabled={busy}>
          1. Generate a key pair
        </Button>
        {keys ? <p className="text-sm text-foreground">Key pair generated for {alg}.</p> : null}
      </section>

      <section className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-gradient">Sign</h3>

        <div className="space-y-1">
          <label htmlFor="pqca-message" className="text-xs text-muted-foreground">
            Message to sign
          </label>
          <Textarea
            id="pqca-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pqca-context" className="text-xs text-muted-foreground">
            Context string (leave empty for none)
          </label>
          <Input
            id="pqca-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={64}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Signing mode</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Signing mode">
            <Button
              type="button"
              variant={!deterministic ? 'gradient' : 'outline'}
              onClick={() => setDeterministic(false)}
              disabled={busy}
              className="text-xs"
            >
              Hedged (default)
            </Button>
            <Button
              type="button"
              variant={deterministic ? 'gradient' : 'outline'}
              onClick={() => setDeterministic(true)}
              disabled={busy}
              className="text-xs"
            >
              Deterministic
            </Button>
          </div>
        </div>

        {!contextOk ? (
          <p className="text-xs text-status-error">
            Use printable characters without quotes or backslashes in a context string.
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={sign}
          disabled={busy || !keys || !contextOk}
        >
          2. Sign the message
        </Button>
        <p className="text-sm text-muted-foreground">
          Sign the same message twice in each mode and compare the two results.
        </p>

        <div aria-live="polite" className="space-y-2">
          {signed ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1 text-sm">
              <p className="text-xs text-muted-foreground">Signing returned</p>
              <p className="text-foreground">
                Signature: {signed.signature.length} bytes (
                {signed.deterministic ? 'deterministic' : 'hedged'})
              </p>
              <p className="font-mono text-xs break-all text-foreground">
                {toHex(signed.signature.slice(0, 32))}…
              </p>
              {signed.previous ? (
                <p className="text-foreground">
                  Same bytes as the previous signature of this message and context:{' '}
                  {sameBytes(signed.previous, signed.signature) ? 'yes' : 'no'}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <ClaimLine id="ALG-B12" />
        <ClaimLine id="ALG-B13" />
        <ClaimLine id="ALG-B14" />
      </section>

      <section className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-gradient">Verify</h3>
        <p className="text-sm text-muted-foreground">
          Change one character of the message, or change the context string, and verify again.
        </p>

        <div className="space-y-1">
          <label htmlFor="pqca-verify-message" className="text-xs text-muted-foreground">
            Message to verify
          </label>
          <Textarea
            id="pqca-verify-message"
            value={verifyMessage}
            onChange={(e) => setVerifyMessage(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pqca-verify-context" className="text-xs text-muted-foreground">
            Context string to verify with (leave empty for none)
          </label>
          <Input
            id="pqca-verify-context"
            value={verifyContext}
            onChange={(e) => setVerifyContext(e.target.value)}
            maxLength={64}
            autoComplete="off"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={verify}
          disabled={busy || !signed || !contextOk}
        >
          3. Verify the signature
        </Button>

        {error ? <ErrorAlert message={error} /> : null}

        <div aria-live="polite">
          {verdict ? (
            <p
              className={`text-sm font-medium ${verdict.ok ? 'text-status-success' : 'text-status-error'}`}
            >
              {verdict.detail}
            </p>
          ) : null}
        </div>

        <ClaimLine id="ALG-B15" />
        <ClaimLine id="ALG-B16" />
      </section>
    </div>
  )
}
