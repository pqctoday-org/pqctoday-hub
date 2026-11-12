// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { ShieldCheck, ShieldAlert, Shield, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_INVENTORY, type InventoryAsset } from '@/data/cryptoEstate'
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'

/**
 * Heuristic name-rule exercise over the shared sample estate, not an OPA/Rego
 * engine or a safety/compliance check. Separate declared-component fixtures
 * exercise the existing strict policy without changing the shared sample estate.
 */

type Verdict = 'rule-accepted' | 'rule-rejected' | 'na' | 'unknown'

const PQC_FAMILIES = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'FN-DSA', 'HQC']
const SYMMETRIC = ['AES', 'ChaCha', 'SHA-2', 'SHA-3', 'SHA-256', 'SHA-512']

function isHybrid(algo: string) {
  return /hybrid|x25519\+|\+ml-kem|rsa\+ml/i.test(algo)
}

function evaluate(asset: Pick<InventoryAsset, 'currentAlgorithm'>, pureOnly: boolean): Verdict {
  const algo = asset.currentAlgorithm
  if (algo.includes('(unparsed)')) return 'unknown'
  // Pure-symmetric / hash-only assets are out of scope for a PQC key policy.
  const hasAsymmetric = /RSA|ECDSA|ECDH|EdDSA|Ed25519|X25519|ML-KEM|ML-DSA|SLH-DSA/i.test(algo)
  if (!hasAsymmetric && SYMMETRIC.some((s) => algo.includes(s))) return 'na'
  if (isHybrid(algo)) return pureOnly ? 'rule-rejected' : 'rule-accepted'
  if (PQC_FAMILIES.some((f) => algo.includes(f)) && !/RSA|ECDSA|ECDH/i.test(algo))
    return 'rule-accepted'
  return hasAsymmetric ? 'rule-rejected' : 'unknown'
}

type DeclaredComponent = { family: 'classical' | 'pqc'; algorithm: string }
const DECLARED_SAMPLES: { name: string; components: DeclaredComponent[] }[] = [
  {
    name: 'Declared hybrid',
    components: [
      { family: 'classical', algorithm: 'X25519' },
      { family: 'pqc', algorithm: 'ML-KEM-768' },
    ],
  },
  { name: 'Declared pure PQC', components: [{ family: 'pqc', algorithm: 'ML-KEM-768' }] },
  { name: 'Declared classical', components: [{ family: 'classical', algorithm: 'X25519' }] },
  { name: 'Missing declaration', components: [] },
]

function evaluateDeclared(components: DeclaredComponent[], pureOnly: boolean): Verdict {
  if (components.length === 0) return 'unknown'
  const hasClassical = components.some((component) => component.family === 'classical')
  const hasPqc = components.some((component) => component.family === 'pqc')
  // Composition is evaluated before pure status. These are declared sample facts,
  // not a profile, parameter or implementation-validation claim.
  if (hasClassical && hasPqc) return pureOnly ? 'rule-rejected' : 'rule-accepted'
  return hasPqc ? 'rule-accepted' : 'rule-rejected'
}

const STYLE: Record<Verdict, { icon: typeof Shield; cls: string }> = {
  'rule-accepted': { icon: ShieldCheck, cls: 'text-status-success' },
  'rule-rejected': { icon: ShieldAlert, cls: 'text-status-error' },
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
      'rule-accepted': 0,
      'rule-rejected': 0,
      na: 0,
      unknown: 0,
    }
    for (const r of results) c[r.verdict]++
    return c
  }, [results])

  const inScope = counts['rule-accepted'] + counts['rule-rejected']
  const compliance = inScope ? Math.round((counts['rule-accepted'] / inScope) * 100) : 0
  const shown = results.filter((r) => filter === 'all' || r.verdict === filter)

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="mb-1 font-semibold text-foreground">Run a sample algorithm-name rule</h3>
        <p className="text-sm text-muted-foreground">
          Match name patterns in the {SAMPLE_INVENTORY.length}-asset sample. Results are rule
          accepted / rejected / out of scope / unknown, not safety or compliance verdicts. This
          TypeScript demonstration does not run OPA/Rego or verify parameters, actual hybrid
          composition or implementation validation.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRan(true)}
            className="border-primary bg-primary/15 text-primary hover:bg-primary/25"
          >
            Run name-rule exercise
          </Button>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={pureOnly}
              onChange={(e) => setPureOnly(e.target.checked)}
            />
            Strict pure-PQC sample policy: reject hybrid composition
          </label>
        </div>
      </div>

      {ran && (
        <>
          <div className="glass-panel p-4">
            <div className="mb-3 space-y-2 text-xs text-muted-foreground">
              <h4 className="font-semibold text-foreground">Declared-component policy examples</h4>
              <p>
                These separate fictional declarations exercise the existing pure-PQC policy: the
                normal policy accepts pure PQC and classical/PQC hybrids; strict rejects hybrids. A
                policy rejection does not mean hybrid cryptography is vulnerable. No protocol
                profile, parameters or implementation are validated here.
              </p>
              {DECLARED_SAMPLES.map((sample) => (
                <p key={sample.name} role="status" aria-label={sample.name}>
                  {sample.name}:{' '}
                  {sample.components.map((component) => component.algorithm).join(' + ') || 'none'}
                  {' — '}
                  {evaluateDeclared(sample.components, pureOnly)}
                </p>
              ))}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">
                Name-rule acceptance (classified sample rows)
              </span>
              <span className="text-sm text-status-success">
                {inScope ? `${compliance}%` : 'Not assessed'}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-status-success transition-all"
                style={{ width: `${compliance}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['all', 'rule-rejected', 'rule-accepted', 'na', 'unknown'] as const).map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter(v)}
                  className={filter === v ? 'border-primary bg-primary/15 text-primary' : ''}
                >
                  {v === 'all' ? `all (${results.length})` : `${v} (${counts[v]})`}
                </Button>
              ))}
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
                        <span className="ml-1 text-status-success">
                          · Registry standard reference: {reg.fipsStandard}
                        </span>
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
            sample asymmetric-name rule. The remaining results describe only these name-pattern
            rules. In production tools, inspect structured algorithm, key-use and composition
            records, select the applicable policy/profile and test known contrary cases; this name
            exercise cannot establish those capabilities.
          </p>
        </>
      )}
    </div>
  )
}
