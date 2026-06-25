// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ShieldCheck, ShieldAlert, Shield, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_INVENTORY, type InventoryAsset } from '@/data/cryptoEstate'
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'

/**
 * Policy-as-Code Verify — run a quantum-safe policy (the way CBOMkit does with
 * OPA/Rego) over the shared estate. Each asset gets a verdict:
 * quantum-safe / quantum-vulnerable / na / unknown. Toggle policy strictness
 * (is hybrid acceptable, or pure-PQC only?) and watch the compliance % move.
 * Algorithm facts come from ALGORITHM_REGISTRY.
 */

type Verdict = 'quantum-safe' | 'quantum-vulnerable' | 'na' | 'unknown'

const PQC_FAMILIES = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'FN-DSA', 'HQC']
const SYMMETRIC = ['AES', 'ChaCha', 'SHA-2', 'SHA-3', 'SHA-256', 'SHA-512']

function isHybrid(algo: string) {
  return /hybrid|x25519\+|\+ml-kem|rsa\+ml/i.test(algo)
}

function evaluate(asset: InventoryAsset, pureOnly: boolean): Verdict {
  const algo = asset.currentAlgorithm
  if (algo.includes('(unparsed)')) return 'unknown'
  // Pure-symmetric / hash-only assets are out of scope for a PQC key policy.
  const hasAsymmetric = /RSA|ECDSA|ECDH|EdDSA|Ed25519|X25519|ML-KEM|ML-DSA|SLH-DSA/i.test(algo)
  if (!hasAsymmetric && SYMMETRIC.some((s) => algo.includes(s))) return 'na'
  if (PQC_FAMILIES.some((f) => algo.includes(f)) && !/RSA|ECDSA|ECDH/i.test(algo))
    return 'quantum-safe'
  if (isHybrid(algo)) return pureOnly ? 'quantum-vulnerable' : 'quantum-safe'
  return asset.quantumVulnerable ? 'quantum-vulnerable' : 'quantum-safe'
}

const STYLE: Record<Verdict, { icon: typeof Shield; cls: string }> = {
  'quantum-safe': { icon: ShieldCheck, cls: 'text-status-success' },
  'quantum-vulnerable': { icon: ShieldAlert, cls: 'text-status-error' },
  na: { icon: Shield, cls: 'text-muted-foreground' },
  unknown: { icon: HelpCircle, cls: 'text-status-warning' },
}

export function CbomVerify() {
  const [ran, setRan] = useState(false)
  const [pureOnly, setPureOnly] = useState(false)
  const [filter, setFilter] = useState<Verdict | 'all'>('all')

  const results = useMemo(
    () => SAMPLE_INVENTORY.map((a) => ({ asset: a, verdict: evaluate(a, pureOnly) })),
    [pureOnly]
  )
  const counts = useMemo(() => {
    const c: Record<Verdict, number> = {
      'quantum-safe': 0,
      'quantum-vulnerable': 0,
      na: 0,
      unknown: 0,
    }
    for (const r of results) c[r.verdict]++
    return c
  }, [results])

  const inScope = counts['quantum-safe'] + counts['quantum-vulnerable']
  const compliance = inScope ? Math.round((counts['quantum-safe'] / inScope) * 100) : 0
  const shown = results.filter((r) => filter === 'all' || r.verdict === filter)

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="mb-1 font-semibold text-foreground">Evaluate the CBOM against a policy</h3>
        <p className="text-sm text-muted-foreground">
          Run a quantum-safe policy over the {SAMPLE_INVENTORY.length}-asset estate. Verdicts:
          quantum-safe / quantum-vulnerable / na / unknown.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRan(true)}
            className="border-primary bg-primary/15 text-primary hover:bg-primary/25"
          >
            Run policy check
          </Button>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={pureOnly}
              onChange={(e) => setPureOnly(e.target.checked)}
            />
            Strict: pure-PQC only (hybrid = vulnerable)
          </label>
        </div>
      </div>

      {ran && (
        <>
          <div className="glass-panel p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">
                PQC compliance (in-scope)
              </span>
              <span className="text-sm text-status-success">{compliance}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-status-success transition-all"
                style={{ width: `${compliance}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['all', 'quantum-vulnerable', 'quantum-safe', 'na', 'unknown'] as const).map(
                (v) => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter(v)}
                    className={filter === v ? 'border-primary bg-primary/15 text-primary' : ''}
                  >
                    {v === 'all' ? `all (${results.length})` : `${v} (${counts[v]})`}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {shown.map(({ asset, verdict }) => {
              const s = STYLE[verdict] // eslint-disable-line security/detect-object-injection
              const Icon = s.icon
              const reg = asset.registryKey ? ALGORITHM_REGISTRY[asset.registryKey] : undefined
              return (
                <div key={asset.id} className="glass-panel flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{asset.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {asset.currentAlgorithm}
                      {reg?.fipsStandard && (
                        <span className="ml-1 text-status-success">· {reg.fipsStandard}</span>
                      )}
                    </div>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1.5 text-sm ${s.cls}`}>
                    <Icon size={15} /> {verdict}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="text-status-warning">unknown</span> = no rule matched (the legacy
            appliance can&apos;t be parsed — a discovery gap, not a pass);{' '}
            <span className="text-muted-foreground">na</span> = symmetric/hash, out of scope for a
            PQC key policy. Normalized algorithm names are what make the Rego rules match.
          </p>
        </>
      )}
    </div>
  )
}
