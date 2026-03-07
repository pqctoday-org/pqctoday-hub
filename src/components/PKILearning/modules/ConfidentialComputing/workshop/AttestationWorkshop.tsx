// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  Shield,
  Info,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { ATTESTATION_FLOWS } from '../data/attestationData'
import { ACTOR_LABELS, ACTOR_COLORS } from '../data/ccConstants'

export const AttestationWorkshop: React.FC = () => {
  const [selectedFlowId, setSelectedFlowId] = useState(ATTESTATION_FLOWS[0].id)
  const [currentStep, setCurrentStep] = useState(-1) // -1 = not started
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const flow = useMemo(
    () => ATTESTATION_FLOWS.find((f) => f.id === selectedFlowId) ?? ATTESTATION_FLOWS[0],
    [selectedFlowId]
  )

  const flowItems = useMemo(() => ATTESTATION_FLOWS.map((f) => ({ id: f.id, label: f.name })), [])

  const vulnerableStepCount = useMemo(
    () => flow.steps.filter((s) => s.quantumVulnerable).length,
    [flow]
  )

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Auto-advance logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1
          if (next >= flow.steps.length) {
            setIsRunning(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return flow.steps.length - 1
          }
          return next
        })
      }, 1500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, flow.steps.length])

  const handleFlowChange = useCallback((id: string) => {
    setSelectedFlowId(id)
    setCurrentStep(-1)
    setIsRunning(false)
  }, [])

  const handleRunPause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      // If at end, restart from beginning
      if (currentStep >= flow.steps.length - 1) {
        setCurrentStep(-1)
      }
      setIsRunning(true)
    }
  }, [isRunning, currentStep, flow.steps.length])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setCurrentStep(-1)
  }, [])

  const handlePrevious = useCallback(() => {
    setIsRunning(false)
    setCurrentStep((prev) => Math.max(-1, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setIsRunning(false)
    setCurrentStep((prev) => Math.min(flow.steps.length - 1, prev + 1))
  }, [flow.steps.length])

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'future' => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current'
    return 'future'
  }

  const getStepBorderClass = (status: 'completed' | 'current' | 'future'): string => {
    switch (status) {
      case 'completed':
        return 'border-status-success'
      case 'current':
        return 'border-primary ring-2 ring-primary/30'
      case 'future':
        return 'border-border'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Attestation Flow Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Step through real attestation protocols to understand how TEEs prove their identity to
          relying parties. Quantum-vulnerable steps are highlighted with PQC replacement
          recommendations.
        </p>
      </div>

      {/* Flow Selector */}
      <div className="glass-panel p-4">
        <FilterDropdown
          items={flowItems}
          selectedId={selectedFlowId}
          onSelect={handleFlowChange}
          label="Attestation Flow"
          defaultLabel="Select Flow"
          defaultIcon={<Shield size={16} className="text-primary" />}
          noContainer
        />
      </div>

      {/* Certificate Chain Info */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Flow Configuration</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Root of Trust:</span>
            <div className="font-mono text-foreground mt-0.5">{flow.rootOfTrust}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Signing Algorithm:</span>
            <div className="font-mono text-foreground mt-0.5">{flow.signingAlgorithm}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Hash Algorithm:</span>
            <div className="font-mono text-foreground mt-0.5">{flow.hashAlgorithm}</div>
          </div>
        </div>
        {flow.pqcMigrationNotes && (
          <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded p-2 border border-border">
            <Info size={12} className="inline mr-1 text-primary" />
            {flow.pqcMigrationNotes}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handleReset} disabled={currentStep === -1}>
          <SkipBack size={14} className="mr-1" />
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentStep <= -1}>
          <ChevronLeft size={14} className="mr-1" />
          Previous
        </Button>
        <Button variant="gradient" size="sm" onClick={handleRunPause}>
          {isRunning ? (
            <>
              <Pause size={14} className="mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play size={14} className="mr-1" />
              {currentStep >= flow.steps.length - 1 ? 'Restart' : 'Run Attestation'}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentStep >= flow.steps.length - 1}
        >
          Next
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-1">
        {flow.steps.map((step, idx) => {
          const status = getStepStatus(idx)
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  status === 'completed'
                    ? 'bg-status-success border-status-success'
                    : status === 'current'
                      ? 'bg-primary border-primary'
                      : 'bg-muted border-border'
                }`}
              />
              {idx < flow.steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    status === 'completed' ? 'bg-status-success' : 'bg-border'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {flow.steps.map((step, idx) => {
          const status = getStepStatus(idx)
          const borderClass = getStepBorderClass(status)

          return (
            <div
              key={step.id}
              className={`glass-panel p-4 border-2 transition-all ${borderClass} ${
                status === 'future' ? 'opacity-60' : 'opacity-100'
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Step {step.order}
                </span>
                {/* Actor Badge */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${ACTOR_COLORS[step.actor]}`}
                >
                  {ACTOR_LABELS[step.actor]}
                </span>
              </div>

              {/* Step Label */}
              <h5 className="text-sm font-bold text-foreground mb-2">{step.label}</h5>

              {/* Description */}
              <p className="text-xs text-muted-foreground mb-3">{step.description}</p>

              {/* Crypto Used */}
              <div className="mb-2">
                <span className="text-[10px] font-bold text-muted-foreground">Crypto:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {step.cryptoUsed.map((algo) => (
                    <span
                      key={algo}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                    >
                      {algo}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quantum Vulnerability */}
              {step.quantumVulnerable && (
                <div className="bg-status-error/10 border border-status-error/30 rounded p-2 mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <ShieldAlert size={12} className="text-status-error" />
                    <span className="text-[10px] font-bold text-status-error">
                      Quantum Vulnerable
                    </span>
                  </div>
                  {step.pqcReplacement && (
                    <span className="text-[10px] text-foreground">
                      PQC Replacement:{' '}
                      <span className="font-mono font-bold text-primary">
                        {step.pqcReplacement}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Data Exchanged */}
              <div className="mt-2 text-[10px]">
                <span className="text-muted-foreground">Data:</span>{' '}
                <span className="font-mono text-foreground">{step.dataExchanged}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quantum Vulnerability Summary */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-status-warning" />
          <h4 className="text-sm font-bold text-foreground">Quantum Vulnerability Summary</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Vulnerable Steps:</span>{' '}
            <span className="font-bold text-status-error">
              {vulnerableStepCount} of {flow.steps.length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">PQC Migration Status:</span>{' '}
            <span className="font-bold text-foreground capitalize">
              {flow.pqcMigrationStatus.replace('-', ' ')}
            </span>
          </div>
        </div>

        {flow.steps.some((s) => s.quantumVulnerable) && (
          <div className="mt-3 bg-status-warning/10 border border-status-warning/30 rounded p-3">
            <div className="flex items-start gap-2">
              <ShieldAlert size={14} className="text-status-warning shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <strong>HNDL Exposure Warning:</strong> Attestation flows using ECDSA signatures are
                vulnerable to Harvest Now, Decrypt Later attacks. An adversary recording attestation
                quotes today can forge attestation evidence once a cryptographically relevant
                quantum computer is available, potentially impersonating legitimate enclaves
                retroactively.
              </div>
            </div>
          </div>
        )}

        {/* Per-step vulnerability list */}
        <div className="mt-3 space-y-1">
          {flow.steps
            .filter((s) => s.quantumVulnerable)
            .map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <ShieldAlert size={10} className="text-status-error shrink-0" />
                <span className="text-muted-foreground">
                  Step {step.order}: {step.label}
                </span>
                {step.pqcReplacement && (
                  <span className="font-mono text-primary text-[10px]">{step.pqcReplacement}</span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Attestation flows are simplified for educational purposes. Real
          implementations include additional error handling, retry logic, certificate caching, and
          collateral management. PQC replacements are based on vendor roadmaps and NIST FIPS 203/204
          standards.
        </p>
      </div>
    </div>
  )
}
