// SPDX-License-Identifier: GPL-3.0-only
//
// Pkcs11BypassDemo — WP-4 showcase. Every other demo on this page goes
// THROUGH the KMIP dispatcher and the active CACP policy above. This one
// deliberately doesn't: it creates a Sign/Verify-only RSA key pair via KMIP,
// then calls straight into the engine's raw PKCS#11 layer asking it to
// Encrypt with that key — skipping KMIP and CACP entirely. The point isn't
// what the ACTIVE policy says (this works the same under every policy,
// including built-in-permissive); it's that the engine itself won't let a
// KMIP-created key be used outside the usage it was created for, even when
// nothing above the engine gets a say.
import { useState } from 'react'
import { ShieldAlert, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipEngine, RawPkcs11EncryptProbeResult } from '@/wasm/kmip/kmipEngine'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

type Step = 'idle' | 'created' | 'probed' | 'error'

export function Pkcs11BypassDemo({ engine }: { engine: KmipEngine }) {
  const [step, setStep] = useState<Step>('idle')
  const [publicKeyUid, setPublicKeyUid] = useState<string | null>(null)
  const [probe, setProbe] = useState<RawPkcs11EncryptProbeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = () => {
    setError(null)
    setProbe(null)
    try {
      const created = engine.runOp({ op: 'CreateKeyPair', algorithm: 'RSA', length: 2048 })
      const uid = str(created.summary?.publicKeyUid)
      if (!created.ok || !uid) {
        // The most common cause is a non-permissive policy active above (CNSA
        // 2.0 / FIPS-only / a PQC-only profile) that forbids creating an RSA
        // key at all — this demo needs one. Surface the engine's own reason.
        setError(
          created.message
            ? `Couldn't create the RSA key: ${created.message}. This demo needs an RSA key — switch the active policy to one that permits RSA (e.g. Classical or the built-in permissive policy).`
            : 'CreateKeyPair failed',
        )
        setStep('error')
        return
      }
      setPublicKeyUid(uid)
      setStep('created')

      const result = engine.rawPkcs11EncryptProbe(uid)
      setProbe(result)
      setStep(result.error ? 'error' : 'probed')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStep('error')
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShieldAlert size={14} className="text-status-warning" /> Beyond policy: the engine enforces
        this on its own
      </h4>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Everything above goes through KMIP and the active policy. This doesn't — it creates a
        Sign/Verify-only RSA key pair via KMIP, then calls the engine's raw PKCS#11 layer directly,
        asking it to <span className="font-mono">Encrypt</span> with that key. No KMIP dispatcher,
        no CACP policy check, no matter which policy is active above. PKCS#11 v3.2 §4.8 Table 13 —{' '}
        <span className="font-mono">CKA_ALLOWED_MECHANISMS</span>, set from the key's own usage mask
        at creation — is what actually stops it.
      </p>

      <Button size="sm" variant="secondary" onClick={run} className="mt-3 h-7 gap-1.5 px-2 text-xs">
        <Zap size={12} /> Create a Sign-only key, then try to raw-Encrypt with it
      </Button>

      {step !== 'idle' && (
        <div className="mt-3 space-y-2 text-[11.5px]">
          {publicKeyUid && (
            <p className="text-muted-foreground">
              ✓ KMIP created an RSA key pair for Sign/Verify only — public key{' '}
              <span className="font-mono text-foreground">{publicKeyUid.slice(0, 28)}…</span>
            </p>
          )}
          {probe && (
            <div
              className={`rounded-lg border p-2.5 ${
                probe.blocked
                  ? 'border-status-success/50 bg-status-success/10'
                  : 'border-destructive/50 bg-destructive/10'
              }`}
            >
              <p
                className={`font-semibold ${
                  probe.blocked ? 'text-status-success' : 'text-destructive'
                }`}
              >
                {probe.blocked
                  ? `Refused — ${probe.rvName} (raw ${probe.mechanism} attempt)`
                  : `NOT refused — ${probe.mechanism} succeeded`}
              </p>
              <p className="mt-1 text-muted-foreground">{probe.message}</p>
              {probe.rv && (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">rv={probe.rv}</p>
              )}
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
