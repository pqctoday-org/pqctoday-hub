// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  BarChart3,
  Calendar,
  HardDrive,
  Network,
  ClipboardCheck,
  Route,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Shield,
  Info,
} from 'lucide-react'
import { ENTERPRISE_SCENARIO, ROTATION_POLICIES } from '../data/kmsConstants'
import { KMS_PROVIDERS, KMS_STATUS_LABELS, getKmsPqcStatus } from '../data/kmsProviderData'
import { Button } from '@/components/ui/button'
import { migrateDomainHref } from '@/utils/migrateLinks'

type MigrationPhase = 'inventory' | 'hybrid' | 'full-pqc'

type MaterialCategory = 'tlsCerts' | 'codeSigning' | 'caKeys' | 'dataEncryption' | 'apiAuth'
type MaterialInput = Partial<
  Record<MaterialCategory, { count: number; algorithm: string; keySize: number }>
>
type MaterialTarget = Partial<Record<MaterialCategory, { algorithm: string; keySize: number }>>
const MATERIAL_CATEGORIES: { id: MaterialCategory; label: string; secret: boolean }[] = [
  { id: 'tlsCerts', label: 'TLS-associated public material', secret: false },
  { id: 'codeSigning', label: 'Code-signing public material', secret: false },
  { id: 'caKeys', label: 'CA public material', secret: false },
  { id: 'dataEncryption', label: 'AES symmetric-secret material', secret: true },
  { id: 'apiAuth', label: 'API-auth public material', secret: false },
]
// eslint-disable-next-line react-refresh/only-export-components -- Pure sample accounting exposed for independent arithmetic checks.
export function rotationMaterial(current: MaterialInput, target: MaterialTarget) {
  const rows: {
    id: MaterialCategory
    label: string
    secret: boolean
    count: number
    currentAlgorithm: string
    targetAlgorithm: string
    currentSize: number
    targetSize: number
    currentBytes: number
    targetBytes: number
  }[] = []
  for (const category of MATERIAL_CATEGORIES) {
    const before = current[category.id]
    if (!before || !Number.isInteger(before.count) || before.count < 0) return null
    const after = target[category.id]
    if (
      before.count > 0 &&
      (!after ||
        !Number.isFinite(before.keySize) ||
        !Number.isFinite(after.keySize) ||
        before.keySize < 0 ||
        after.keySize < 0)
    )
      return null
    rows.push({
      ...category,
      count: before.count,
      currentAlgorithm: before.algorithm,
      targetAlgorithm: after?.algorithm ?? 'Not assessed (zero entries)',
      currentSize: before.keySize,
      targetSize: after?.keySize ?? 0,
      currentBytes: before.count ? before.count * before.keySize : 0,
      targetBytes: before.count ? before.count * after!.keySize : 0,
    })
  }
  const sum = (secret: boolean, field: 'currentBytes' | 'targetBytes') =>
    rows.filter((row) => row.secret === secret).reduce((n, row) => n + row[field], 0)
  const currentPublic = sum(false, 'currentBytes'),
    targetPublic = sum(false, 'targetBytes')
  const currentSecret = sum(true, 'currentBytes'),
    targetSecret = sum(true, 'targetBytes')
  return {
    rows,
    currentPublic,
    targetPublic,
    currentSecret,
    targetSecret,
    publicDelta: targetPublic - currentPublic,
    publicCount: rows.filter((row) => !row.secret).reduce((n, row) => n + row.count, 0),
    secretCount: rows.filter((row) => row.secret).reduce((n, row) => n + row.count, 0),
    currentBytes: currentPublic + currentSecret,
    targetBytes: targetPublic + targetSecret,
    multiplier:
      currentPublic + currentSecret > 0
        ? (targetPublic + targetSecret) / (currentPublic + currentSecret)
        : null,
  }
}

export const KmsRotationPlanner: React.FC = () => {
  const [migrationPhase, setMigrationPhase] = useState<MigrationPhase>('inventory')

  const scenario = ENTERPRISE_SCENARIO

  const storageAnalysis = useMemo(
    () => rotationMaterial(scenario.currentAlgorithms, scenario.targetAlgorithms),
    [scenario]
  )
  const phaseContent = useMemo<Record<
    MigrationPhase,
    {
      title: string
      description: string
      tasks: { name: string; status: 'done' | 'in-progress' | 'pending' }[]
    }
  > | null>(
    () =>
      storageAnalysis
        ? {
            inventory: {
              title: 'Phase 1: Inventory & Assessment',
              description:
                'Review the 500 sample material records and 10 fictional HSMs. Distinguish public keys, symmetric secrets and missing object/encoding inputs before estimating storage or transfer.',
              tasks: [
                {
                  name: 'Enumerate 500 sample material records by algorithm and kind',
                  status: 'done',
                },
                { name: 'Audit 10 HSM firmware versions for PQC readiness', status: 'done' },
                {
                  name:
                    'Sum current sample material inputs: ' +
                    formatBytes(storageAnalysis.currentBytes),
                  status: 'done',
                },
                { name: 'Identify 400 asymmetric-public entries (RSA + ECDSA)', status: 'done' },
                {
                  name: 'Map KMS provider PQC capabilities (AWS: ML-DSA GA; GCP: signing GA, KEMs at the software level; Azure: planned)',
                  status: 'in-progress',
                },
                {
                  name: 'Map compliance deadlines (CNSA 2.0: 2027, NIST: 2030)',
                  status: 'in-progress',
                },
              ],
            },
            hybrid: {
              title: 'Phase 2: Hybrid Deployment',
              description:
                'Deploy hybrid (classical + PQC) certificates for TLS, upgrade HSM firmware, configure multi-cloud KMS for dual-key management.',
              tasks: [
                {
                  name: 'Upgrade HSM firmware to PQC-capable version (10 HSMs)',
                  status: 'in-progress',
                },
                { name: 'Configure AWS KMS ML-DSA signing keys', status: 'in-progress' },
                { name: 'Issue hybrid TLS certificates (300 servers)', status: 'pending' },
                { name: 'Enable ML-KEM hybrid TLS for AWS KMS API transit', status: 'pending' },
                {
                  name: 'Configure GCP Cloud KMS X-Wing key-encapsulation keys (software level)',
                  status: 'pending',
                },
                { name: 'Generate ML-DSA-65 code signing keys (50 keys)', status: 'pending' },
                { name: 'Configure KMIP cross-provider key sync', status: 'pending' },
                {
                  name:
                    'Target sample material subtotal: ' +
                    formatBytes(storageAnalysis.targetBytes) +
                    ' (' +
                    (storageAnalysis.multiplier?.toFixed(1) ?? 'Not assessed') +
                    'x increase)',
                  status: 'pending',
                },
              ],
            },
            'full-pqc': {
              title: 'Phase 3: Full PQC Migration',
              description:
                'Remove classical algorithm dependencies. All certificates use PQC or hybrid algorithms. KMS providers operate with PQC key types natively.',
              tasks: [
                { name: 'Revoke all pure-classical TLS certificates', status: 'pending' },
                { name: 'Migrate CA intermediate keys to ML-DSA-87', status: 'pending' },
                {
                  name: 'Migrate Azure Key Vault to native PQC when Microsoft offers PQC key types (2029 is a Microsoft-wide goal, not a Key Vault date)',
                  status: 'pending',
                },
                { name: 'Update API authentication to ML-DSA-44 (35 services)', status: 'pending' },
                { name: 'Enable PQC-only wrapping across all KMS providers', status: 'pending' },
                {
                  name: 'Verify compliance: CNSA 2.0 + ANSSI/BSI requirements met',
                  status: 'pending',
                },
                { name: 'Decommission classical-only HSM partitions', status: 'pending' },
              ],
            },
          }
        : null,
    [storageAnalysis]
  )

  const currentPhase = phaseContent?.[migrationPhase]
  if (!storageAnalysis || !currentPhase)
    return <p>Sample material totals: Not assessed — missing category or profile inputs.</p>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">KMS Rotation Planner</h3>
        <p className="text-sm text-muted-foreground">
          Plan PQC key rotation for <strong>{scenario.name}</strong> &mdash; a fictional financial
          services scenario with {storageAnalysis.publicCount + storageAnalysis.secretCount} sample
          material records across {scenario.hsmCount} HSMs and multiple cloud KMS providers.
        </p>
      </div>

      {/* Enterprise overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {storageAnalysis.publicCount + storageAnalysis.secretCount}
          </div>
          <div className="text-xs text-muted-foreground">Sample material records</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{scenario.hsmCount}</div>
          <div className="text-xs text-muted-foreground">HSMs</div>
        </div>
        <div className="glass-panel p-3 text-center border-destructive/20">
          <div className="text-2xl font-bold text-destructive">{storageAnalysis.publicCount}</div>
          <div className="text-xs text-muted-foreground">Asymmetric public entries</div>
        </div>
        <div className="glass-panel p-3 text-center border-success/20">
          <div className="text-2xl font-bold text-success">{storageAnalysis.secretCount}</div>
          <div className="text-xs text-muted-foreground">AES secret entries (not certificates)</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The counts mix {storageAnalysis.publicCount} asymmetric-public entries and{' '}
        {storageAnalysis.secretCount} symmetric secrets. Actual certificate counts, private-key
        objects and protected encodings are not specified. Phase cards below are fictional narrative
        statuses, not operations or checks performed by this planner; the size comparison is the
        same selected scenario in every phase.
      </p>

      {/* Phase selector */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'inventory' as MigrationPhase, label: 'Inventory', icon: BarChart3 },
            { id: 'hybrid' as MigrationPhase, label: 'Hybrid Deploy', icon: Network },
            { id: 'full-pqc' as MigrationPhase, label: 'Full PQC', icon: CheckCircle },
          ] as const
        ).map((phase) => {
          const PhaseIcon = phase.icon
          return (
            <Button
              variant="ghost"
              key={phase.id}
              onClick={() => setMigrationPhase(phase.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                migrationPhase === phase.id
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              <PhaseIcon size={14} />
              {phase.label}
            </Button>
          )
        })}
      </div>

      {/* Phase detail */}
      <div className="glass-panel p-6 border-l-4 border-l-primary">
        <h4 className="text-xl font-bold text-foreground mb-1">{currentPhase.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{currentPhase.description}</p>
        <div className="space-y-2">
          {currentPhase.tasks.map((task, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-lg p-3 ${
                task.status === 'done'
                  ? 'bg-success/5 border border-success/20'
                  : task.status === 'in-progress'
                    ? 'bg-primary/5 border border-primary/20'
                    : 'bg-muted/50 border border-border'
              }`}
            >
              {task.status === 'done' ? (
                <CheckCircle size={14} className="text-success shrink-0 mt-0.5" />
              ) : task.status === 'in-progress' ? (
                <AlertTriangle size={14} className="text-primary shrink-0 mt-0.5" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className="text-xs text-foreground">{task.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Impact Dashboard */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Sample material-size comparison</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground mb-1">Current material inputs</div>
            <div className="text-lg font-bold text-foreground">
              {formatBytes(storageAnalysis.currentBytes)}
            </div>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
            <div className="text-xs text-muted-foreground mb-1">Target material inputs</div>
            <div className="text-lg font-bold text-primary">
              {formatBytes(storageAnalysis.targetBytes)}
            </div>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-xs text-muted-foreground mb-1">Material-size ratio</div>
            <div className="text-lg font-bold text-warning">
              {storageAnalysis.multiplier?.toFixed(1) ?? 'Not assessed'}x
            </div>
          </div>
        </div>

        {/* Per-category breakdown */}
        <div className="space-y-2">
          {storageAnalysis.rows.map((cat) => (
            <div
              key={cat.label}
              className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-foreground">{cat.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({cat.count} sample entries)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-destructive">
                    {cat.currentAlgorithm}: {cat.currentSize.toLocaleString()} B each
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="text-primary">
                    {cat.targetAlgorithm}: {cat.targetSize.toLocaleString()} B each
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-bold shrink-0 ${
                  cat.currentBytes === cat.targetBytes ? 'text-success' : 'text-warning'
                }`}
              >
                {cat.currentBytes > 0
                  ? `${(cat.targetBytes / cat.currentBytes).toFixed(1)}x`
                  : 'Not assessed'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-primary" />
          <h4 className="text-sm font-bold">Material categories and unassessed transfer scope</h4>
        </div>
        <p className="text-xs">
          Current public material:{' '}
          <strong>{storageAnalysis.currentPublic.toLocaleString()} B</strong>; target public
          material: <strong>{storageAnalysis.targetPublic.toLocaleString()} B</strong>.
        </p>
        <p className="text-xs">
          Current AES secrets: <strong>{storageAnalysis.currentSecret.toLocaleString()} B</strong>;
          target AES secrets: <strong>{storageAnalysis.targetSecret.toLocaleString()} B</strong>.
          Counted once, not as public keys.
        </p>
        <p className="text-xs">
          Public-material delta across all {storageAnalysis.publicCount} public entries (including
          API authentication): <strong>{storageAnalysis.publicDelta.toLocaleString()} B</strong>.
        </p>
        <p className="text-xs">
          <strong>
            Complete certificates / private-key storage / protected transfer bytes: Not assessed.
          </strong>{' '}
          These inputs omit key encodings, certificate/signature metadata, wrapped-secret objects,
          recipients and copies. A KEM ciphertext alone is not protected distribution of an existing
          DEK.
        </p>
        <p className="text-xs text-muted-foreground">
          This comparison changes traditional profiles as well as PQC constituents (for example
          RSA-2048 to P-256 plus ML-DSA-65); its ratios are not solely PQC overhead. Use production
          tools to inspect actual object layouts and rewrap/distribution behavior before estimating
          storage or network traffic.
        </p>
      </div>

      {/* Provider-Specific Rotation */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">
            Provider-Specific Rotation Capabilities
          </h4>
        </div>
        <div className="space-y-3">
          {scenario.kmsProviders.map((provider) => {
            // Find matching full provider data
            const fullProvider = KMS_PROVIDERS.find((p) => p.id === provider.id)
            const status = fullProvider ? KMS_STATUS_LABELS[getKmsPqcStatus(fullProvider)] : null

            return (
              <div key={provider.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Shield size={14} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">{provider.name}</span>
                  {status && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-foreground mb-1">Auto-Rotation</div>
                    <p className="text-xs text-muted-foreground">{provider.rotationFeature}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-foreground mb-1">PQC Capability</div>
                    <p className="text-xs text-muted-foreground">{provider.pqcCapability}</p>
                  </div>
                </div>
                {fullProvider && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {fullProvider.pqcAlgorithms.kem.map((a) => (
                      <span
                        key={a.name}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                      >
                        {a.name}
                      </span>
                    ))}
                    {fullProvider.pqcAlgorithms.sign.map((a) => (
                      <span
                        key={a.name}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20"
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* KMIP note */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border mt-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              <strong>KMIP Cross-Provider Rotation:</strong> For enterprises using multiple KMS
              providers, KMIP (Key Management Interoperability Protocol) enables centralized
              rotation scheduling.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Deadlines */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Compliance Deadlines</h4>
        </div>
        <div className="space-y-2">
          {scenario.complianceDeadlines.map((deadline) => (
            <div
              key={deadline.framework}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <span className="text-sm font-bold text-primary shrink-0 w-12">
                {deadline.deadline}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground">{deadline.framework}</div>
                <p className="text-[10px] text-muted-foreground">{deadline.requirement}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation Policy Reference */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Rotation Policy Reference</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Policy</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Interval</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Applicable Algorithms
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Framework</th>
              </tr>
            </thead>
            <tbody>
              {ROTATION_POLICIES.map((policy) => (
                <tr key={policy.id} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium text-foreground">{policy.name}</td>
                  <td className="py-2 px-2 text-foreground">{policy.rotationInterval}</td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {policy.applicableTo.map((algo) => (
                        <span
                          key={algo}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {algo}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{policy.complianceFramework}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/assess"
          className="flex items-center gap-3 glass-panel p-4 hover:border-primary/30 transition-colors"
        >
          <ClipboardCheck size={20} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-bold text-foreground">Run Assessment</div>
            <p className="text-xs text-muted-foreground">
              Assess your organization&apos;s PQC readiness
            </p>
          </div>
        </Link>
        <Link
          to={migrateDomainHref('kms')}
          className="flex items-center gap-3 glass-panel p-4 hover:border-primary/30 transition-colors"
        >
          <Route size={20} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-bold text-foreground">Migration Guide</div>
            <p className="text-xs text-muted-foreground">
              Detailed migration workflows and software catalog
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}
