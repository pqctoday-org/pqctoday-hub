// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  Shield,
  Cpu,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Zap,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  MEDICAL_DEVICE_CATALOG,
  PATIENT_IMPACT_COLORS,
  SEVERITY_COLORS,
  type MedicalDeviceProfile,
  type PatientImpact,
} from '../data/healthcareConstants'
import { Button } from '@/components/ui/button'

// ── Constants ──────────────────────────────────────────────────────────────

const FDA_CLASS_STYLES: Record<string, string> = {
  I: 'bg-status-success/20 text-status-success border-status-success/40',
  II: 'bg-status-warning/20 text-status-warning border-status-warning/40',
  III: 'bg-status-error/20 text-status-error border-status-error/40',
}

const FIRMWARE_UPDATE_LABELS: Record<string, string> = {
  ota: 'Over-the-Air (OTA)',
  'clinic-only': 'Clinic Visit Only',
  'manufacturer-only': 'Manufacturer Service Only',
}

const FIRMWARE_UPDATE_STYLES: Record<string, string> = {
  ota: 'bg-status-success/20 text-status-success',
  'clinic-only': 'bg-status-warning/20 text-status-warning',
  'manufacturer-only': 'bg-status-error/20 text-status-error',
}

const IMPACT_LABELS: Record<PatientImpact, string> = {
  fatal: 'Fatal',
  'life-threatening': 'Life-Threatening',
  injury: 'Injury',
  nuisance: 'Nuisance',
}

const FDA_PREMARKET_CHECKLIST = [
  {
    id: 'threat-model',
    label: 'Threat model includes quantum adversary',
    detail:
      'The device threat model explicitly considers a cryptanalytically relevant quantum computer (CRQC) as an adversary capable of breaking RSA, ECDH, and ECDSA.',
  },
  {
    id: 'crypto-inventory',
    label: 'Cryptographic inventory documented',
    detail:
      'All cryptographic algorithms, key sizes, protocols, and libraries used in the device are catalogued in a Software Bill of Materials (SBOM) with crypto annotations.',
  },
  {
    id: 'algorithm-selection',
    label: 'PQC algorithm selection justified',
    detail:
      'The choice of PQC algorithm (e.g., ML-KEM, ML-DSA, LMS) is justified based on device resource constraints, security level requirements, and NIST FIPS standards.',
  },
  {
    id: 'key-management',
    label: 'Key management plan covers device lifetime',
    detail:
      'Key provisioning, rotation, and revocation procedures address the full expected device lifetime, including post-market firmware updates for algorithm transitions.',
  },
  {
    id: 'firmware-update',
    label: 'Firmware update mechanism supports PQC signatures',
    detail:
      'The secure boot chain and firmware update verification can validate PQC signatures (e.g., ML-DSA or LMS) in addition to or replacing classical signatures.',
  },
  {
    id: 'post-market',
    label: 'Post-market surveillance for crypto vulnerabilities',
    detail:
      'The post-market cybersecurity plan includes monitoring for cryptographic algorithm deprecations, new quantum computing milestones, and NIST advisory updates.',
  },
  {
    id: 'sbom-crypto',
    label: 'SBOM includes cryptographic dependencies',
    detail:
      'The SBOM (per FDA Section 524B) explicitly enumerates cryptographic libraries, their versions, and the specific algorithms/key sizes used by each component.',
  },
  {
    id: 'hybrid-transition',
    label: 'Hybrid mode transition plan documented',
    detail:
      'A phased migration plan from classical-only to hybrid (classical + PQC) to PQC-only is documented, with rollback procedures for each transition stage.',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRam(kb: number): string {
  if (kb >= 1_000_000) return `${(kb / 1_000_000).toFixed(0)} GB`
  if (kb >= 1_000) return `${(kb / 1_000).toFixed(0)} MB`
  return `${kb} KB`
}

function formatFlash(mb: number): string {
  if (mb >= 1_000) return `${(mb / 1_000).toFixed(0)} GB`
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
  return `${mb} MB`
}

// ── Sub-components ─────────────────────────────────────────────────────────

const DeviceProfileCard: React.FC<{ device: MedicalDeviceProfile }> = ({ device }) => {
  const lifetimeWarning = device.deviceLifetimeYears > 10

  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            {device.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{device.category}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${FDA_CLASS_STYLES[device.fdaClass]}`}
        >
          FDA Class {device.fdaClass}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Communication */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Communication
          </span>
          <p className="text-sm text-foreground">{device.protocolLabel}</p>
        </div>

        {/* Current Crypto */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Crypto
          </span>
          <p className="text-sm text-foreground">{device.currentCrypto}</p>
        </div>

        {/* Firmware Update */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Firmware Updates
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${FIRMWARE_UPDATE_STYLES[device.firmwareUpdateMethod]}`}
          >
            {FIRMWARE_UPDATE_LABELS[device.firmwareUpdateMethod]}
          </span>
        </div>
      </div>

      {/* Hardware Specs */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Hardware Specifications
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">CPU</p>
            <p className="text-sm font-bold text-foreground mt-1">{device.cpuProfile}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">RAM</p>
            <p className="text-sm font-bold text-foreground mt-1">{formatRam(device.ramKB)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Flash</p>
            <p className="text-sm font-bold text-foreground mt-1">{formatFlash(device.flashMB)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Lifetime</p>
            <p
              className={`text-sm font-bold mt-1 flex items-center justify-center gap-1 ${
                lifetimeWarning ? 'text-status-warning' : 'text-foreground'
              }`}
            >
              {device.deviceLifetimeYears} years
              {lifetimeWarning && <AlertTriangle size={12} />}
            </p>
          </div>
        </div>
        {lifetimeWarning && (
          <p className="text-xs text-status-warning mt-2">
            Device lifetime exceeds 10 years — requires long-term cryptographic agility planning and
            support for algorithm migration during operational life.
          </p>
        )}
      </div>
    </div>
  )
}

const AttackScenarioCard: React.FC<{
  scenario: MedicalDeviceProfile['attackScenarios'][number]
  isExpanded: boolean
  onToggle: () => void
}> = ({ scenario, isExpanded, onToggle }) => {
  const impactColors = PATIENT_IMPACT_COLORS[scenario.patientImpact]
  const impactLabel = IMPACT_LABELS[scenario.patientImpact]

  return (
    <div className={`glass-panel overflow-hidden transition-all duration-200`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Zap size={16} className="text-status-warning shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-bold text-foreground">{scenario.vectorLabel}</span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${impactColors}`}
              >
                {impactLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                via {scenario.quantumMechanism}&apos;s algorithm
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Attack Description
            </span>
            <p className="text-sm text-foreground mt-1">{scenario.attackDescription}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quantum Mechanism
              </span>
              <p className="text-sm text-foreground mt-1">
                {scenario.quantumMechanism === 'Shor'
                  ? "Shor's algorithm — breaks public-key cryptography (RSA, ECDH, ECDSA) in polynomial time"
                  : "Grover's algorithm — provides quadratic speedup against symmetric ciphers (AES key search)"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Current Defense
              </span>
              <p className="text-sm text-foreground mt-1">{scenario.currentDefense}</p>
            </div>
          </div>

          {/* Visual severity bar */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Severity
            </span>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  scenario.patientImpact === 'fatal'
                    ? 'bg-status-error w-full'
                    : scenario.patientImpact === 'life-threatening'
                      ? 'bg-status-error/70 w-4/5'
                      : scenario.patientImpact === 'injury'
                        ? 'bg-status-warning w-3/5'
                        : 'bg-muted-foreground/40 w-1/4'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FeasibilityTable: React.FC<{ device: MedicalDeviceProfile }> = ({ device }) => {
  const feasibleCount = device.pqcFeasibility.filter((f) => f.feasible).length
  const totalCount = device.pqcFeasibility.length

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2 mb-1">
        <Shield size={18} className="text-primary" />
        <h3 className="text-base font-bold text-foreground">PQC Algorithm Feasibility</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {feasibleCount} of {totalCount} evaluated algorithms are feasible for this device&apos;s
        hardware constraints.
      </p>

      <div className="space-y-3">
        {device.pqcFeasibility.map((entry) => (
          <div key={entry.algorithm} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">{entry.algorithm}</span>
              {entry.feasible ? (
                <span className="flex items-center gap-1 text-xs font-medium text-status-success">
                  <Check size={14} />
                  Feasible
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-status-error">
                  <X size={14} />
                  Not Feasible
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{entry.rationale}</p>

            {/* RAM usage bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Device RAM: {formatRam(device.ramKB)}</span>
                <span>{entry.feasible ? 'Within capacity' : 'Exceeds capacity'}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    entry.feasible ? 'bg-status-success' : 'bg-status-error'
                  }`}
                  style={{
                    width: entry.feasible ? '40%' : '100%',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-bold">Recommendation:</span>{' '}
          {feasibleCount === 0
            ? 'No standard PQC algorithms fit this device. Consider hash-based signatures (LMS/XMSS) for firmware verification and rely on gateway-level PQC for communications.'
            : feasibleCount === totalCount
              ? 'All evaluated PQC algorithms are feasible. Prioritize ML-KEM for key exchange and ML-DSA for firmware signing at the highest supported security level.'
              : 'Use feasible algorithms for on-device operations. For infeasible algorithms, offload cryptographic processing to a gateway or backend server.'}
        </p>
      </div>
    </div>
  )
}

const FDAChecklistSection: React.FC<{
  checkedItems: Set<string>
  onToggle: (id: string) => void
}> = ({ checkedItems, onToggle }) => {
  const completedCount = checkedItems.size
  const totalCount = FDA_PREMARKET_CHECKLIST.length
  const progressPct = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-status-warning" />
          <h3 className="text-base font-bold text-foreground">
            FDA Premarket Cybersecurity Checklist
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} reviewed
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Key items for PQC readiness in FDA 510(k) and PMA cybersecurity documentation. Check each
        item as you review it for your device submission.
      </p>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-status-success transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-2">
        {FDA_PREMARKET_CHECKLIST.map((item) => {
          const isChecked = checkedItems.has(item.id)
          return (
            <Button
              variant="ghost"
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                isChecked
                  ? 'border-status-success/40 bg-status-success/5'
                  : 'border-border bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-status-success border-status-success text-background'
                      : 'border-border bg-muted'
                  }`}
                >
                  {isChecked && <Check size={12} />}
                </div>
                <div className="min-w-0">
                  <span
                    className={`text-sm font-medium ${isChecked ? 'text-foreground' : 'text-foreground'}`}
                  >
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      {completedCount === totalCount && (
        <div className="mt-4 p-3 rounded-lg bg-status-success/10 border border-status-success/30 flex items-center gap-2">
          <Check size={16} className="text-status-success shrink-0" />
          <p className="text-sm text-status-success font-medium">
            All checklist items reviewed. This device submission addresses quantum-resistant
            cryptography across all FDA-recommended dimensions.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export const DeviceSafetySimulator: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('pacemaker')
  const [expandedAttack, setExpandedAttack] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const deviceItems = useMemo(
    () => MEDICAL_DEVICE_CATALOG.map((d) => ({ id: d.id, label: d.name })),
    []
  )

  const selectedDevice = useMemo(
    () =>
      MEDICAL_DEVICE_CATALOG.find((d) => d.id === selectedDeviceId) ?? MEDICAL_DEVICE_CATALOG[0],
    [selectedDeviceId]
  )

  const handleDeviceChange = (id: string) => {
    setSelectedDeviceId(id)
    setExpandedAttack(null)
  }

  const handleAttackToggle = (vector: string) => {
    setExpandedAttack((prev) => (prev === vector ? null : vector))
  }

  const handleChecklistToggle = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Summary stats for the selected device
  const fatalCount = selectedDevice.attackScenarios.filter(
    (s) => s.patientImpact === 'fatal'
  ).length
  const lifeThreateningCount = selectedDevice.attackScenarios.filter(
    (s) => s.patientImpact === 'life-threatening'
  ).length

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Browse a catalog of connected medical devices, explore quantum attack scenarios with patient
        impact ratings, and evaluate PQC algorithm feasibility against constrained hardware. Use the
        FDA premarket checklist to verify quantum readiness for regulatory submissions.
      </p>

      {/* Device Selector */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-foreground">Select Medical Device:</span>
          <FilterDropdown
            items={deviceItems}
            selectedId={selectedDeviceId}
            onSelect={handleDeviceChange}
            noContainer
            label="Device"
          />
        </div>

        {/* Quick stats */}
        {(fatalCount > 0 || lifeThreateningCount > 0) && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {fatalCount > 0 && (
              <span className={`text-xs px-2 py-1 rounded border ${SEVERITY_COLORS['critical']}`}>
                {fatalCount} fatal-risk scenario{fatalCount > 1 ? 's' : ''}
              </span>
            )}
            {lifeThreateningCount > 0 && (
              <span className={`text-xs px-2 py-1 rounded border ${SEVERITY_COLORS['high']}`}>
                {lifeThreateningCount} life-threatening scenario
                {lifeThreateningCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {selectedDevice.pqcFeasibility.filter((f) => f.feasible).length}/
              {selectedDevice.pqcFeasibility.length} PQC algorithms feasible
            </span>
          </div>
        )}
      </div>

      {/* Device Profile Card */}
      <DeviceProfileCard device={selectedDevice} />

      {/* Attack Scenarios */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-status-warning" />
          <h3 className="text-base font-bold text-foreground">Quantum Attack Scenarios</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Each scenario describes how a quantum computer could compromise this device. Expand a
          scenario to see the full attack chain, patient impact, and current defenses.
        </p>
        <div className="space-y-2">
          {selectedDevice.attackScenarios.map((scenario) => (
            <AttackScenarioCard
              key={scenario.vector}
              scenario={scenario}
              isExpanded={expandedAttack === scenario.vector}
              onToggle={() => handleAttackToggle(scenario.vector)}
            />
          ))}
        </div>
      </div>

      {/* PQC Algorithm Feasibility */}
      <FeasibilityTable device={selectedDevice} />

      {/* FDA Premarket Checklist */}
      <FDAChecklistSection checkedItems={checkedItems} onToggle={handleChecklistToggle} />
    </div>
  )
}
