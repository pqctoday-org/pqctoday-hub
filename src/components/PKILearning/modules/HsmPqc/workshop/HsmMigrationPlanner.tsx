// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useCallback } from 'react'
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  Server,
  HardDrive,
  Shield,
  ClipboardCheck,
} from 'lucide-react'
import { FIRMWARE_UPGRADE_PATHS, type FirmwareUpgradePath } from '../data/hsmConstants'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'

const PHASES = [
  {
    id: 'assessment',
    label: 'Assessment',
    icon: ClipboardCheck,
    description: 'Select your current vendor and firmware, and assess current capabilities.',
  },
  {
    id: 'firmware',
    label: 'Firmware Planning',
    icon: Server,
    description: 'Review upgrade path, estimated downtime, and complexity for your vendor.',
  },
  {
    id: 'key-migration',
    label: 'Key Migration',
    icon: HardDrive,
    description: 'Plan backup, dual-partition strategy, and migration duration.',
  },
  {
    id: 'validation',
    label: 'Validation',
    icon: Shield,
    description: 'FIPS 140-3 re-validation checklist and CAVP algorithm testing status.',
  },
] as const

interface ChecklistItem {
  id: string
  label: string
  required: boolean
}

const VALIDATION_CHECKLIST: ChecklistItem[] = [
  {
    id: 'fips-scope',
    label: 'Verify FIPS 140-3 certificate scope covers PQC algorithms',
    required: true,
  },
  { id: 'cavp-ml-kem', label: 'Confirm CAVP validation for ML-KEM (FIPS 203)', required: true },
  { id: 'cavp-ml-dsa', label: 'Confirm CAVP validation for ML-DSA (FIPS 204)', required: true },
  {
    id: 'cavp-slh-dsa',
    label: 'Confirm CAVP validation for SLH-DSA (FIPS 205) if needed',
    required: false,
  },
  {
    id: 'cavp-lms',
    label: 'Confirm CAVP validation for LMS/HSS (SP 800-208) if stateful sigs needed',
    required: false,
  },
  {
    id: 'entropy-source',
    label: 'Verify DRBG entropy source meets SP 800-90A/B/C',
    required: true,
  },
  {
    id: 'side-channel',
    label: 'Side-channel resistance testing completed (power, EM, fault)',
    required: true,
  },
  { id: 'key-zeroization', label: 'Key zeroization on tamper detection verified', required: true },
  {
    id: 'pkcs11-compliance',
    label: 'PKCS#11 v3.2+ PQC mechanism compliance tested (C_EncapsulateKey/C_DecapsulateKey)',
    required: true,
  },
  {
    id: 'backup-restore',
    label: 'Backup/restore procedure validated with PQC keys',
    required: true,
  },
  {
    id: 'hybrid-interop',
    label: 'Hybrid key pair interoperability tested (if applicable)',
    required: false,
  },
  {
    id: 'performance',
    label: 'Performance benchmark: PQC operations within SLA requirements',
    required: true,
  },
]

export const HsmMigrationPlanner: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    FIRMWARE_UPGRADE_PATHS[0].vendorId
  )
  const [hsmCount, setHsmCount] = useState(10)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const selectedPath = useMemo(
    () =>
      FIRMWARE_UPGRADE_PATHS.find((p) => p.vendorId === selectedVendorId) ??
      FIRMWARE_UPGRADE_PATHS[0],
    [selectedVendorId]
  )

  const toggleCheck = useCallback((id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const getComplexityColor = (complexity: FirmwareUpgradePath['upgradeComplexity']): string => {
    switch (complexity) {
      case 'low':
        return 'text-success'
      case 'medium':
        return 'text-warning'
      case 'high':
        return 'text-destructive'
    }
  }

  const getRiskColor = (phase: number): string => {
    switch (phase) {
      case 0:
        return 'text-success' // Assessment = low risk
      case 1:
        return selectedPath.upgradeComplexity === 'high' ? 'text-destructive' : 'text-warning'
      case 2:
        return 'text-warning'
      case 3:
        return selectedPath.recertificationRequired ? 'text-warning' : 'text-success'
      default:
        return 'text-muted-foreground'
    }
  }

  const getRiskLabel = (phase: number): string => {
    switch (phase) {
      case 0:
        return 'Low'
      case 1:
        return selectedPath.upgradeComplexity === 'high' ? 'High' : 'Medium'
      case 2:
        return 'Medium'
      case 3:
        return selectedPath.recertificationRequired ? 'Medium' : 'Low'
      default:
        return 'Unknown'
    }
  }

  // Estimate migration time from downtime string
  const estimateTotalTime = useMemo(() => {
    const downtimeStr = selectedPath.estimatedDowntime
    // Extract numbers from downtime string (e.g. "30-60 minutes" or "Zero")
    const numbers = downtimeStr.match(/\d+/g)
    if (!numbers || numbers.length === 0) return 'N/A'
    const minMinutes = parseInt(numbers[0], 10)
    const maxMinutes = numbers.length > 1 ? parseInt(numbers[1], 10) : minMinutes
    // Rolling upgrade: one HSM at a time
    const totalMin = minMinutes * hsmCount
    const totalMax = maxMinutes * hsmCount
    if (totalMin >= 60) {
      return `${(totalMin / 60).toFixed(1)} - ${(totalMax / 60).toFixed(1)} hours`
    }
    return `${totalMin} - ${totalMax} minutes`
  }, [selectedPath, hsmCount])

  // Estimate backup size (rough: ~50MB base + 2MB per PQC key set)
  const estimateBackupSize = useMemo(() => {
    const baseMb = 50
    const perHsmMb = 2
    const totalMb = (baseMb + perHsmMb * 100) * hsmCount // assume ~100 key sets per HSM
    if (totalMb >= 1024) {
      return `${(totalMb / 1024).toFixed(1)} GB`
    }
    return `${totalMb} MB`
  }, [hsmCount])

  const requiredChecked = VALIDATION_CHECKLIST.filter((item) => item.required)
  const requiredComplete = requiredChecked.every((item) => checkedItems.has(item.id))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">HSM Firmware Migration Planner</h3>
        <p className="text-sm text-muted-foreground">
          Plan your HSM firmware migration from classical to PQC in 4 phases. Select your vendor and
          fleet size to see upgrade paths, timelines, and validation requirements.
        </p>
      </div>

      {/* Phase Selector */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon
            return (
              <button
                key={phase.id}
                onClick={() => setCurrentPhase(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  idx === currentPhase
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : idx < currentPhase
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                <Icon size={14} />
                {phase.label}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{PHASES[currentPhase].description}</p>
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <span className="text-[10px] text-muted-foreground">Risk:</span>
            <span className={`text-[10px] font-bold ${getRiskColor(currentPhase)}`}>
              {getRiskLabel(currentPhase)}
            </span>
          </div>
        </div>
      </div>

      {/* Phase 1: Assessment */}
      {currentPhase === 0 && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <h4 className="text-base font-bold text-foreground">Phase 1: Assessment</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-1 block">
                Select Current Vendor / Firmware
              </span>
              <FilterDropdown
                noContainer
                selectedId={selectedVendorId}
                onSelect={(id) => setSelectedVendorId(id)}
                items={FIRMWARE_UPGRADE_PATHS.map((path) => ({
                  id: path.vendorId,
                  label: `${path.vendorName} (${path.currentFirmware})`,
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="hsm-count"
                className="text-xs font-medium text-muted-foreground mb-1 block"
              >
                Number of HSMs in Fleet
              </label>
              <input
                id="hsm-count"
                type="number"
                min={1}
                max={1000}
                value={hsmCount}
                onChange={(e) => setHsmCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-lg bg-muted/50 border border-border p-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Current Capabilities */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h5 className="text-sm font-bold text-foreground mb-2">Current Configuration</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Vendor:</span>{' '}
                <span className="text-foreground font-bold">{selectedPath.vendorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Firmware:</span>{' '}
                <span className="font-mono text-foreground">{selectedPath.currentFirmware}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Target Firmware:</span>{' '}
                <span className="font-mono text-primary">{selectedPath.targetFirmware}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fleet Size:</span>{' '}
                <span className="text-foreground font-bold">{hsmCount} HSMs</span>
              </div>
            </div>
          </div>

          <Button variant="gradient" onClick={() => setCurrentPhase(1)}>
            Proceed to Firmware Planning
          </Button>
        </div>
      )}

      {/* Phase 2: Firmware Planning */}
      {currentPhase === 1 && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <h4 className="text-base font-bold text-foreground">Phase 2: Firmware Planning</h4>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h5 className="text-sm font-bold text-foreground mb-3">
              Upgrade Path: {selectedPath.vendorName}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Current Firmware:</span>{' '}
                <span className="font-mono text-foreground">{selectedPath.currentFirmware}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Target Firmware:</span>{' '}
                <span className="font-mono text-primary">{selectedPath.targetFirmware}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Complexity:</span>{' '}
                <span className={`font-bold ${getComplexityColor(selectedPath.upgradeComplexity)}`}>
                  {selectedPath.upgradeComplexity.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Downtime per HSM:</span>{' '}
                <span className="text-foreground">{selectedPath.estimatedDowntime}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Recertification Required:</span>{' '}
                {selectedPath.recertificationRequired ? (
                  <span className="text-warning font-bold">Yes</span>
                ) : (
                  <span className="text-success font-bold">No</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Recert Timeline:</span>{' '}
                <span className="text-foreground">{selectedPath.recertificationTimeline}</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xs text-muted-foreground">PQC Algorithms Added:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedPath.pqcAlgorithmsAdded.map((alg) => (
                  <span
                    key={alg}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                  >
                    {alg}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{selectedPath.notes}</p>
          </div>

          {/* Estimated Total Time */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h5 className="text-sm font-bold text-foreground mb-1">
              Rolling Upgrade Estimate ({hsmCount} HSMs)
            </h5>
            <p className="text-lg font-bold text-primary">{estimateTotalTime}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Using rolling upgrade strategy (one HSM at a time, classical operations continue on
              remaining HSMs during each upgrade window).
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentPhase(0)}>
              &larr; Back
            </Button>
            <Button variant="gradient" onClick={() => setCurrentPhase(2)}>
              Proceed to Key Migration
            </Button>
          </div>
        </div>
      )}

      {/* Phase 3: Key Migration */}
      {currentPhase === 2 && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <h4 className="text-base font-bold text-foreground">Phase 3: Key Migration</h4>

          {/* Backup Size Calculation */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h5 className="text-sm font-bold text-foreground mb-2">Backup Size Estimate</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">HSMs:</span>{' '}
                <span className="text-foreground font-bold">{hsmCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Total Backup:</span>{' '}
                <span className="text-primary font-bold">{estimateBackupSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Per HSM:</span>{' '}
                <span className="text-foreground">~250 MB (keys + config + state)</span>
              </div>
            </div>
          </div>

          {/* Dual-Partition Strategy */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h5 className="text-sm font-bold text-foreground mb-2">Dual-Partition Strategy</h5>
            <p className="text-xs text-muted-foreground mb-3">
              During migration, each HSM runs two logical partitions in parallel. The classical
              partition handles existing operations while the PQC partition is being configured and
              tested.
            </p>

            {/* Visual Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">
                  Classical
                </span>
                <div className="flex-1 h-6 rounded bg-success/20 border border-success/30 flex items-center px-2">
                  <span className="text-[10px] text-success font-medium">
                    Active &mdash; RSA, ECDSA, AES (continues during migration)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">
                  PQC
                </span>
                <div className="flex-1 h-6 rounded flex items-stretch">
                  <div className="w-1/4 bg-warning/20 border border-warning/30 rounded-l flex items-center px-1">
                    <span className="text-[10px] text-warning truncate">Setup</span>
                  </div>
                  <div className="w-1/4 bg-primary/20 border-y border-primary/30 flex items-center px-1">
                    <span className="text-[10px] text-primary truncate">Test</span>
                  </div>
                  <div className="w-1/4 bg-primary/20 border-y border-primary/30 flex items-center px-1">
                    <span className="text-[10px] text-primary truncate">Validate</span>
                  </div>
                  <div className="w-1/4 bg-success/20 border border-success/30 rounded-r flex items-center px-1">
                    <span className="text-[10px] text-success truncate">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Duration Estimate */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h5 className="text-sm font-bold text-foreground mb-2">Migration Duration</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Firmware Upgrade:</span>{' '}
                <span className="text-foreground">{estimateTotalTime}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Key Backup / Restore:</span>{' '}
                <span className="text-foreground">~15 min per HSM</span>
              </div>
              <div>
                <span className="text-muted-foreground">PQC Key Generation:</span>{' '}
                <span className="text-foreground">~5 min per HSM (batch)</span>
              </div>
              <div>
                <span className="text-muted-foreground">Validation Testing:</span>{' '}
                <span className="text-foreground">~30 min per HSM</span>
              </div>
            </div>
          </div>

          <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                <strong>Critical:</strong> Always take a full backup of each HSM before starting
                firmware upgrade. Verify backup integrity by restoring to a test HSM if available.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentPhase(1)}>
              &larr; Back
            </Button>
            <Button variant="gradient" onClick={() => setCurrentPhase(3)}>
              Proceed to Validation
            </Button>
          </div>
        </div>
      )}

      {/* Phase 4: Validation */}
      {currentPhase === 3 && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <h4 className="text-base font-bold text-foreground">Phase 4: Validation</h4>
          <p className="text-sm text-muted-foreground">
            Complete the FIPS 140-3 re-validation checklist. Required items must be verified before
            the migration is considered complete.
          </p>

          {/* Checklist */}
          <div className="space-y-2">
            {VALIDATION_CHECKLIST.map((item) => {
              const isChecked = checkedItems.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    isChecked
                      ? 'bg-success/5 border-success/20'
                      : 'bg-muted/50 border-border hover:border-primary/30'
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle size={16} className="text-success shrink-0" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs text-foreground flex-1">{item.label}</span>
                  {item.required && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold shrink-0">
                      REQUIRED
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Completion Status */}
          <div
            className={`rounded-lg p-4 border ${
              requiredComplete ? 'bg-success/10 border-success/20' : 'bg-muted/50 border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {requiredComplete ? (
                <CheckCircle size={16} className="text-success" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
              <span
                className={`text-sm font-bold ${requiredComplete ? 'text-success' : 'text-foreground'}`}
              >
                {requiredComplete ? 'Validation Complete' : 'Validation In Progress'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {checkedItems.size} / {VALIDATION_CHECKLIST.length} items checked (
              {requiredChecked.filter((item) => checkedItems.has(item.id)).length} /{' '}
              {requiredChecked.length} required items complete)
            </p>
          </div>

          {/* CAVP Algorithm Testing */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h5 className="text-sm font-bold text-foreground mb-2">
              CAVP Algorithm Testing Status
            </h5>
            <p className="text-xs text-muted-foreground mb-2">
              Each PQC algorithm must pass CAVP (Cryptographic Algorithm Validation Program) testing
              before the FIPS 140-3 module certificate can be updated.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedPath.pqcAlgorithmsAdded.map((alg) => (
                <div
                  key={alg}
                  className="text-center p-2 rounded bg-primary/10 border border-primary/20"
                >
                  <span className="text-[10px] font-mono text-primary block">{alg}</span>
                  <span className="text-[10px] text-muted-foreground">CAVP Required</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentPhase(2)}>
              &larr; Back
            </Button>
          </div>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Migration timelines and backup estimates are approximate and based
          on vendor documentation. Actual times depend on HSM utilization, key count, network
          bandwidth, and organizational change management processes. Always consult your HSM
          vendor&apos;s official migration guide before proceeding.
        </p>
      </div>
    </div>
  )
}
