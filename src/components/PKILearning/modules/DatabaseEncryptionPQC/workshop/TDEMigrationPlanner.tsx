// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { TDE_MIGRATION_STEPS, DATABASE_PROFILES } from '../data/databaseConstants'
import { Button } from '@/components/ui/button'

const SUPPORTED_DBS = ['oracle', 'sqlserver', 'postgresql', 'mongodb']
const DB_ITEMS = DATABASE_PROFILES.filter((p) => SUPPORTED_DBS.includes(p.id)).map((p) => ({
  id: p.id,
  label: p.dbName.split(' ')[0] + ' ' + (p.dbName.split(' ')[1] || ''),
}))

const RISK_STYLES: Record<string, string> = {
  low: 'bg-status-success/10 text-status-success border-status-success/30',
  medium: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  high: 'bg-status-error/10 text-status-error border-status-error/30',
}

const DB_NOTES: Record<string, { commandNote: string; reencrNote: string }> = {
  oracle: {
    commandNote: 'ALTER TABLESPACE <name> REKEY',
    reencrNote:
      'Oracle supports online re-encryption via ALTER TABLESPACE REKEY. No application downtime required. Keystore must be open during migration.',
  },
  sqlserver: {
    commandNote: 'ALTER DATABASE ENCRYPTION KEY REGENERATE WITH ALGORITHM = AES_256',
    reencrNote:
      'SQL Server TDE re-encryption runs in background. Monitor progress via sys.dm_database_encryption_keys. EKM provider must support ML-KEM-1024 import.',
  },
  postgresql: {
    commandNote: 'pg_tde REKEY (pg_tde 2.0+)',
    reencrNote:
      'pg_tde 2.0 (Percona) will support KMIP key provider for ML-KEM master keys. Upstream PostgreSQL does not have native TDE — requires Percona build.',
  },
  mongodb: {
    commandNote: 'db.adminCommand({ rotateMasterKey: 1 })',
    reencrNote:
      'MongoDB WiredTiger online rotation via rotateMasterKey. Atlas: key rotation via Atlas API. FLE 2.0 DEK rotation requires client-side re-encryption.',
  },
}

export const TDEMigrationPlanner: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [selectedDbId, setSelectedDbId] = useState<string>('oracle')
  const [showSummary, setShowSummary] = useState(false)

  const dbNote = DB_NOTES[selectedDbId] ?? DB_NOTES['oracle']

  const handleStepClick = (idx: number) => {
    setCurrentStep(idx)
    setShowSummary(false)
  }

  const handleMarkComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStep < TDE_MIGRATION_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setShowSummary(true)
    }
  }

  const step = TDE_MIGRATION_STEPS[currentStep]

  return (
    <div className="space-y-6">
      {/* Database selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Target Database:</span>
        <FilterDropdown
          items={DB_ITEMS}
          selectedId={selectedDbId}
          onSelect={(id) => {
            if (id !== 'All') setSelectedDbId(id)
          }}
          defaultLabel="Select Database"
          label="Database"
          noContainer
        />
        {DB_ITEMS.find((d) => d.id === selectedDbId) && (
          <code className="text-xs bg-muted px-2 py-1 rounded border border-border font-mono text-primary">
            {dbNote.commandNote}
          </code>
        )}
      </div>

      {/* Step progress bar */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {TDE_MIGRATION_STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <Button
                variant="ghost"
                onClick={() => handleStepClick(idx)}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors ${
                  idx === currentStep
                    ? 'text-primary'
                    : completedSteps.has(idx)
                      ? 'text-status-success'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                    idx === currentStep
                      ? 'border-primary bg-primary/10 text-primary'
                      : completedSteps.has(idx)
                        ? 'border-status-success bg-status-success/10 text-status-success'
                        : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {completedSteps.has(idx) ? <CheckCircle size={14} /> : s.step}
                </div>
                <span className="text-[10px] font-medium hidden sm:block max-w-[80px] text-center leading-tight">
                  {s.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </Button>
              {idx < TDE_MIGRATION_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${idx < currentStep ? 'bg-status-success' : 'bg-border'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      {!showSummary ? (
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                    Step {step.step} of {TDE_MIGRATION_STEPS.length}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-bold ${RISK_STYLES[step.risk]}`}
                  >
                    {step.risk.charAt(0).toUpperCase() + step.risk.slice(1)} Risk
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    Downtime: {step.downtime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              </div>
              {completedSteps.has(currentStep) && (
                <CheckCircle size={20} className="text-status-success shrink-0 mt-1" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

            {/* Database-specific note */}
            {currentStep === 3 && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 mb-4 text-xs">
                <div className="font-bold text-primary mb-1">Database-Specific Command</div>
                <p className="text-muted-foreground">{dbNote.reencrNote}</p>
              </div>
            )}

            {/* Classical vs PQC comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="text-xs font-bold text-status-error mb-2">
                  Classical Approach (RSA/ECC)
                </div>
                <p className="text-xs text-muted-foreground">{step.classicalApproach}</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="text-xs font-bold text-primary mb-2">
                  PQC Approach (ML-KEM-1024)
                </div>
                <p className="text-xs text-muted-foreground">{step.pqcApproach}</p>
              </div>
            </div>

            {/* Tooling */}
            <div className="mt-4">
              <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                <Wrench size={12} />
                Required Tooling
              </div>
              <div className="flex flex-wrap gap-1.5">
                {step.tooling.map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-mono"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {step.risk === 'high' && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
                <p className="text-xs text-status-warning">
                  High-risk step: Perform in a maintenance window with rollback plan. Test on a
                  non-production replica first.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-5 py-2.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 text-foreground text-sm transition-colors"
            >
              &larr; Previous
            </Button>
            <Button
              variant="ghost"
              onClick={handleMarkComplete}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                completedSteps.has(currentStep)
                  ? 'bg-status-success/10 text-status-success border border-status-success/30'
                  : 'bg-primary text-black hover:bg-primary/90'
              }`}
            >
              {completedSteps.has(currentStep)
                ? '✓ Completed'
                : currentStep === TDE_MIGRATION_STEPS.length - 1
                  ? 'Complete & Generate Plan'
                  : 'Mark Complete & Continue →'}
            </Button>
          </div>
        </div>
      ) : (
        /* Migration plan summary */
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-status-success" />
            <h3 className="text-lg font-bold text-foreground">TDE Migration Plan Generated</h3>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Migration Summary — {DB_ITEMS.find((d) => d.id === selectedDbId)?.label}
            </div>
            <div className="space-y-2">
              {TDE_MIGRATION_STEPS.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-2 rounded bg-background border border-border"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold shrink-0 mt-0.5 ${RISK_STYLES[s.risk]}`}
                  >
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">{s.title}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span>Downtime: {s.downtime}</span>
                      <span className="capitalize">Risk: {s.risk}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">Key Migration Insight</div>
            <p className="text-xs text-muted-foreground">
              AES-256 data encryption is already quantum-safe. The entire PQC migration effort for
              TDE is focused on upgrading the DEK wrapping algorithm from RSA-OAEP to ML-KEM-1024.
              This upgrade is transparent to applications and can be performed online on Oracle and
              SQL Server.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentStep(0)
              setCompletedSteps(new Set())
              setShowSummary(false)
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Reset and start over
          </Button>
        </div>
      )}
    </div>
  )
}
