/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  HardDrive,
  Network,
  ClipboardCheck,
  Route,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { ENTERPRISE_SCENARIO, ROTATION_POLICIES } from '../data/keyManagementConstants'

type MigrationPhase = 'inventory' | 'hybrid' | 'full-pqc'

export const KeyRotationPlanner: React.FC = () => {
  const [migrationPhase, setMigrationPhase] = useState<MigrationPhase>('inventory')

  const scenario = ENTERPRISE_SCENARIO

  // Calculate storage impact
  const storageAnalysis = useMemo(() => {
    const current = Object.values(scenario.currentAlgorithms)

    const currentTotalPublicKeyStorage = current.reduce(
      (sum, cat) => sum + cat.count * cat.keySize,
      0
    )

    // Calculate target storage using counts from currentAlgorithms
    const targetKeys = Object.keys(scenario.targetAlgorithms) as Array<
      keyof typeof scenario.targetAlgorithms
    >
    const targetTotalPublicKeyStorage = targetKeys.reduce((sum, key) => {
      const targetCat = scenario.targetAlgorithms[key]
      const currentCatCount = scenario.currentAlgorithms[key].count
      return sum + currentCatCount * targetCat.keySize
    }, 0)

    const storageIncrease = targetTotalPublicKeyStorage - currentTotalPublicKeyStorage
    const storageMultiplier = targetTotalPublicKeyStorage / currentTotalPublicKeyStorage

    return {
      currentBytes: currentTotalPublicKeyStorage,
      targetBytes: targetTotalPublicKeyStorage,
      increaseBytes: storageIncrease,
      multiplier: storageMultiplier,
    }
  }, [scenario])

  // Calculate bandwidth impact per rotation cycle
  const bandwidthAnalysis = useMemo(() => {
    const certDistributionOverhead = 300 * (1952 + 64 - 256) // TLS certs: hybrid pub key size delta
    const codeSigningOverhead = 50 * (1952 - 64) // code signing: ML-DSA-65 vs ECDSA
    const caKeyOverhead = 15 * (2592 - 512) // CA keys: ML-DSA-87 vs RSA-4096

    const totalBandwidthIncrease = certDistributionOverhead + codeSigningOverhead + caKeyOverhead

    return {
      totalIncrease: totalBandwidthIncrease,
      perCertIncrease: 1952 + 64 - 256,
      totalCertsToRotate: 500,
    }
  }, [])

  const phaseContent = useMemo<
    Record<
      MigrationPhase,
      {
        title: string
        description: string
        tasks: { name: string; status: 'done' | 'in-progress' | 'pending' }[]
      }
    >
  >(
    () => ({
      inventory: {
        title: 'Phase 1: Inventory & Assessment',
        description:
          'Catalog all 500 certificates and 10 HSMs. Identify quantum-vulnerable keys and establish baseline storage/bandwidth metrics.',
        tasks: [
          { name: 'Enumerate all 500 certificates by algorithm type', status: 'done' },
          { name: 'Audit 10 HSM firmware versions for PQC readiness', status: 'done' },
          {
            name: 'Measure current key storage: ' + formatBytes(storageAnalysis.currentBytes),
            status: 'done',
          },
          { name: 'Identify 400 quantum-vulnerable certificates (RSA + ECDSA)', status: 'done' },
          { name: 'Map compliance deadlines (CNSA 2.0: 2030, NIST: 2030)', status: 'in-progress' },
        ],
      },
      hybrid: {
        title: 'Phase 2: Hybrid Deployment',
        description:
          'Deploy hybrid (classical + PQC) certificates for TLS, upgrade HSM firmware, begin dual-key management.',
        tasks: [
          { name: 'Upgrade HSM firmware to PQC-capable version (10 HSMs)', status: 'in-progress' },
          { name: 'Issue hybrid TLS certificates (300 servers)', status: 'pending' },
          { name: 'Generate ML-DSA-65 code signing keys (50 keys)', status: 'pending' },
          { name: 'Configure KMS for dual-key rotation policies', status: 'pending' },
          {
            name:
              'Projected storage: ' +
              formatBytes(storageAnalysis.targetBytes) +
              ' (' +
              storageAnalysis.multiplier.toFixed(1) +
              'x increase)',
            status: 'pending',
          },
        ],
      },
      'full-pqc': {
        title: 'Phase 3: Full PQC Migration',
        description:
          'Remove classical algorithm dependencies. All certificates use PQC or hybrid algorithms. HSMs operate exclusively with post-quantum mechanisms.',
        tasks: [
          { name: 'Revoke all pure-classical TLS certificates', status: 'pending' },
          { name: 'Migrate CA intermediate keys to ML-DSA-87', status: 'pending' },
          { name: 'Update API authentication to ML-DSA-44 (35 services)', status: 'pending' },
          { name: 'Verify compliance: CNSA 2.0 hybrid requirement met', status: 'pending' },
          { name: 'Decommission classical-only HSM partitions', status: 'pending' },
        ],
      },
    }),
    [storageAnalysis]
  )

  const currentPhase = phaseContent[migrationPhase]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Key Rotation Planner</h3>
        <p className="text-sm text-muted-foreground">
          Plan PQC key rotation for <strong>{scenario.name}</strong> &mdash; a fictional financial
          services enterprise with {scenario.totalCertificates} certificates across{' '}
          {scenario.hsmCount} HSMs.
        </p>
      </div>

      {/* Enterprise overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{scenario.totalCertificates}</div>
          <div className="text-xs text-muted-foreground">Certificates</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{scenario.hsmCount}</div>
          <div className="text-xs text-muted-foreground">HSMs</div>
        </div>
        <div className="glass-panel p-3 text-center border-destructive/20">
          <div className="text-2xl font-bold text-destructive">400</div>
          <div className="text-xs text-muted-foreground">Quantum-Vulnerable</div>
        </div>
        <div className="glass-panel p-3 text-center border-success/20">
          <div className="text-2xl font-bold text-success">100</div>
          <div className="text-xs text-muted-foreground">Already Safe (AES)</div>
        </div>
      </div>

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
            <button
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
            </button>
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
          <h4 className="text-sm font-bold text-foreground">Storage Impact Analysis</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground mb-1">Current (Classical)</div>
            <div className="text-lg font-bold text-foreground">
              {formatBytes(storageAnalysis.currentBytes)}
            </div>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
            <div className="text-xs text-muted-foreground mb-1">After PQC Migration</div>
            <div className="text-lg font-bold text-primary">
              {formatBytes(storageAnalysis.targetBytes)}
            </div>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-xs text-muted-foreground mb-1">Increase</div>
            <div className="text-lg font-bold text-warning">
              {storageAnalysis.multiplier.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Per-category breakdown */}
        <div className="space-y-2">
          {(
            [
              {
                label: 'TLS Certificates',
                count: 300,
                current: 'RSA-2048 (256 B)',
                target: 'Hybrid (2,016 B)',
                increase: '7.9x',
              },
              {
                label: 'Code Signing',
                count: 50,
                current: 'ECDSA P-256 (64 B)',
                target: 'ML-DSA-65 (1,952 B)',
                increase: '30.5x',
              },
              {
                label: 'CA Keys',
                count: 15,
                current: 'RSA-4096 (512 B)',
                target: 'ML-DSA-87 (2,592 B)',
                increase: '5.1x',
              },
              {
                label: 'Data Encryption',
                count: 100,
                current: 'AES-256 (32 B)',
                target: 'AES-256 (32 B)',
                increase: '1.0x',
              },
              {
                label: 'API Auth',
                count: 35,
                current: 'ECDSA P-256 (64 B)',
                target: 'ML-DSA-44 (1,312 B)',
                increase: '20.5x',
              },
            ] as const
          ).map((cat) => (
            <div
              key={cat.label}
              className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-foreground">{cat.label}</span>
                  <span className="text-[10px] text-muted-foreground">({cat.count} keys)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-destructive">{cat.current}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="text-primary">{cat.target}</span>
                </div>
              </div>
              <span
                className={`text-xs font-bold shrink-0 ${
                  cat.increase === '1.0x' ? 'text-success' : 'text-warning'
                }`}
              >
                {cat.increase}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bandwidth Impact */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Bandwidth Impact per Rotation Cycle</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground mb-1">Per-Cert Increase</div>
            <div className="text-lg font-bold text-foreground">
              +{bandwidthAnalysis.perCertIncrease.toLocaleString()} B
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground mb-1">Total Certs</div>
            <div className="text-lg font-bold text-foreground">
              {bandwidthAnalysis.totalCertsToRotate}
            </div>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-xs text-muted-foreground mb-1">Total BW Increase</div>
            <div className="text-lg font-bold text-warning">
              {formatBytes(bandwidthAnalysis.totalIncrease)}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Bandwidth increase calculated from public key size deltas during certificate distribution.
          Actual TLS handshake overhead is higher due to signature sizes in certificate chains.
        </p>
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
          to="/migrate"
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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
