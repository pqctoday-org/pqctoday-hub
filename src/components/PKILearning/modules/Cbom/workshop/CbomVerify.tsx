// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ShieldCheck, ShieldAlert, Shield, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Policy-as-Code Verify — the practical meaning of "machine-verifiable". Mirrors
 * CBOMkit's OPA/Rego compliance check, classifying each asset as one of
 * quantum-safe / quantum-vulnerable / na / unknown under a quantum-safe policy.
 */

type Verdict = 'quantum-safe' | 'quantum-vulnerable' | 'na' | 'unknown'

interface Asset {
  id: string
  label: string
  kind: 'asymmetric' | 'symmetric' | 'hash' | 'unknown'
  algorithm: string
}

const ASSETS: Asset[] = [
  { id: 'a1', label: 'TLS server key', kind: 'asymmetric', algorithm: 'RSA-2048' },
  { id: 'a2', label: 'VPN key exchange', kind: 'asymmetric', algorithm: 'ML-KEM-768' },
  { id: 'a3', label: 'Firmware signing', kind: 'asymmetric', algorithm: 'ECDSA P-256' },
  { id: 'a4', label: 'Disk encryption', kind: 'symmetric', algorithm: 'AES-256-GCM' },
  { id: 'a5', label: 'Doc signing', kind: 'asymmetric', algorithm: 'ML-DSA-65' },
  { id: 'a6', label: 'Legacy appliance', kind: 'unknown', algorithm: '(unparsed)' },
]

// A miniature "quantum-safe" policy, the way an OPA/Rego rule would decide.
function evaluate(asset: Asset): Verdict {
  if (asset.kind === 'unknown') return 'unknown'
  if (asset.kind === 'symmetric' || asset.kind === 'hash') return 'na' // out of scope for a PQC policy
  const pqc = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'FN-DSA']
  return pqc.some((p) => asset.algorithm.startsWith(p)) ? 'quantum-safe' : 'quantum-vulnerable'
}

const VERDICT_STYLE: Record<Verdict, { icon: typeof Shield; cls: string; text: string }> = {
  'quantum-safe': { icon: ShieldCheck, cls: 'text-status-success', text: 'quantum-safe' },
  'quantum-vulnerable': { icon: ShieldAlert, cls: 'text-status-error', text: 'quantum-vulnerable' },
  na: { icon: Shield, cls: 'text-muted-foreground', text: 'na' },
  unknown: { icon: HelpCircle, cls: 'text-status-warning', text: 'unknown' },
}

export function CbomVerify() {
  const [ran, setRan] = useState(false)

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <h3 className="font-semibold text-foreground mb-1">Evaluate the CBOM against a policy</h3>
        <p className="text-sm text-muted-foreground">
          Run a quantum-safe policy (as CBOMkit does with OPA/Rego) over the inventory. Each asset
          gets a verdict: quantum-safe, quantum-vulnerable, na, or unknown.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRan(true)}
          className="mt-3 border-primary bg-primary/15 text-primary hover:bg-primary/25"
        >
          Run policy check
        </Button>
      </div>

      <div className="space-y-2">
        {ASSETS.map((asset) => {
          const verdict = evaluate(asset)
          // eslint-disable-next-line security/detect-object-injection -- verdict is a closed union
          const style = VERDICT_STYLE[verdict]
          const Icon = style.icon
          return (
            <div key={asset.id} className="glass-panel p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{asset.label}</div>
                <div className="text-xs text-muted-foreground font-mono">{asset.algorithm}</div>
              </div>
              {ran ? (
                <span className={`flex items-center gap-1.5 text-sm ${style.cls}`}>
                  <Icon size={15} /> {style.text}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/50">— not evaluated —</span>
              )}
            </div>
          )
        })}
      </div>

      {ran && (
        <p className="text-xs text-muted-foreground">
          <span className="text-status-warning">unknown</span> = no rule matched (the legacy
          appliance couldn&apos;t be parsed — a discovery gap, not a pass). Normalized algorithm
          names are what make these rules match reliably.
        </p>
      )}
    </div>
  )
}
