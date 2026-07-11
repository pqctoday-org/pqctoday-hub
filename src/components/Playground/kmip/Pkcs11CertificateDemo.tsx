// SPDX-License-Identifier: GPL-3.0-only
//
// Pkcs11CertificateDemo — WP-3 showcase. KMIP Register (and Import) now
// mirror a certificate onto the engine as a real CKO_CERTIFICATE PKCS#11
// object, sharing its CKA_ID with a linked key pair — the strongSwan
// cert-to-key matching pattern. Native CA issuance (Certify) isn't
// reachable in wasm (its rcgen backend doesn't cross-compile to wasm32),
// so this demonstrates the wasm-reachable half: Register a certificate the
// caller already holds (a real, fixed, self-signed demo certificate — see
// wp3DemoCertificate.ts) and observe it land on the engine, read-only.
import { useState } from 'react'
import { FileBadge2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipEngine, EngineCertificateAttributes } from '@/wasm/kmip/kmipEngine'
import { WP3_DEMO_CERT_DER_HEX } from '@/wasm/kmip/wp3DemoCertificate'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

type Step = 'idle' | 'created' | 'registered' | 'observed' | 'error'

export function Pkcs11CertificateDemo({ engine }: { engine: KmipEngine }) {
  const [step, setStep] = useState<Step>('idle')
  const [publicKeyUid, setPublicKeyUid] = useState<string | null>(null)
  const [certUid, setCertUid] = useState<string | null>(null)
  const [attrs, setAttrs] = useState<EngineCertificateAttributes | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = () => {
    setError(null)
    setAttrs(null)
    try {
      const created = engine.runOp({ op: 'CreateKeyPair', algorithm: 'ECDSA' })
      const pubUid = str(created.summary?.publicKeyUid)
      if (!created.ok || !pubUid) {
        setError(
          created.message
            ? `Couldn't create the key pair: ${created.message}`
            : 'CreateKeyPair failed',
        )
        setStep('error')
        return
      }
      setPublicKeyUid(pubUid)
      setStep('created')

      const reg = engine.registerCertificateDemo(pubUid, WP3_DEMO_CERT_DER_HEX)
      if (!reg.ok || !reg.uid) {
        setError(reg.error || 'Register failed')
        setStep('error')
        return
      }
      setCertUid(reg.uid)
      setStep('registered')

      const observed = engine.engineCertificateAttributes(reg.uid)
      if (observed.error) {
        setError(observed.error)
        setStep('error')
        return
      }
      setAttrs(observed)
      setStep('observed')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStep('error')
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <FileBadge2 size={14} className="text-status-info" /> A certificate on the token
      </h4>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Create a KMIP key pair, then <span className="font-mono">Register</span> a certificate
        linked to it (a real, fixed, self-signed demo certificate — native CA issuance isn't
        reachable in this browser build). Watch the engine project it as a real{' '}
        <span className="font-mono">CKO_CERTIFICATE</span> object, sharing the key's{' '}
        <span className="font-mono">CKA_ID</span> — the same matching pattern strongSwan relies on
        to find a certificate for a given private key.
      </p>

      <Button size="sm" variant="secondary" onClick={run} className="mt-3 h-7 gap-1.5 px-2 text-xs">
        <Zap size={12} /> Create a key, register a certificate for it, observe the engine object
      </Button>

      {step !== 'idle' && (
        <div className="mt-3 space-y-2 text-[11.5px]">
          {publicKeyUid && (
            <p className="text-muted-foreground">
              ✓ KMIP created an ECDSA key pair — public key{' '}
              <span className="font-mono text-foreground">{publicKeyUid.slice(0, 28)}…</span>
            </p>
          )}
          {certUid && (
            <p className="text-muted-foreground">
              ✓ Registered the demo certificate, linked to that public key — certificate{' '}
              <span className="font-mono text-foreground">{certUid.slice(0, 28)}…</span>
            </p>
          )}
          {attrs && (
            <div className="rounded-lg border border-status-success/50 bg-status-success/10 p-2.5">
              <p className="font-semibold text-status-success">
                Real engine-side PKCS#11 attributes (read back from the token, not the KMIP record)
              </p>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[10.5px] text-foreground">
                <dt className="text-muted-foreground">CKA_ID</dt>
                <dd>{attrs.ckaId}</dd>
                <dt className="text-muted-foreground">CKA_VALUE</dt>
                <dd>{attrs.ckaValueLen} bytes (the certificate DER)</dd>
                <dt className="text-muted-foreground">CKA_SUBJECT</dt>
                <dd>
                  {attrs.ckaSubjectDerLen} bytes DER — CN={attrs.subjectCn ?? '(unparsed)'}
                </dd>
                <dt className="text-muted-foreground">CKA_ISSUER</dt>
                <dd>{attrs.ckaIssuerDerLen} bytes DER (self-signed, same as Subject)</dd>
                <dt className="text-muted-foreground">CKA_SERIAL_NUMBER</dt>
                <dd>{attrs.ckaSerialNumberHex}</dd>
              </dl>
            </div>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-2.5 text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
