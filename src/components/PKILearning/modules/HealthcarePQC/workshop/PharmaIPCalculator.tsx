// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
  Shield,
  FlaskConical,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CRQC_ESTIMATES } from '@/data/regulatoryTimelines'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'
import {
  DEFAULT_PHARMA_PIPELINE,
  KEY_PROTECTION_OPTIONS,
  PHARMA_SAMPLE_BASE_YEAR,
  computePharmaCompound,
  computePharmaPortfolio,
  getKeyProtectionOption,
  type KeyProtectionPath,
  type PharmaCompoundInput,
  type PharmaPathStatus,
  type RdStep,
} from '../data/pharmaIpModel'

// ── Constants ────────────────────────────────────────────────────────────

const MAX_COMPOUNDS = 6
const MAX_STEPS = 6

const KEY_PROTECTION_DROPDOWN_ITEMS = KEY_PROTECTION_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
}))

const STATUS_TEXT: Record<PharmaPathStatus, string> = {
  'exposed-in-scenario': 'Tied to the vulnerable path in the assumed scenario',
  'path-not-exposed': 'Declared path not exposed in the assumed scenario',
  'confidentiality-ended': 'Confidentiality ends on or before the assumed year',
  'path-unknown': 'Key protection not specified, so exposure is not determined',
  'no-value': 'No value entered',
}

function formatMillions(n: number): string {
  return `$${n.toLocaleString()}M`
}

function formatYears(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? 'year' : 'years'}`
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

// ── Component ────────────────────────────────────────────────────────────

export const PharmaIPCalculator: React.FC = () => {
  const [pipeline, setPipeline] = useState<PharmaCompoundInput[]>(DEFAULT_PHARMA_PIPELINE)
  const [crqcYear, setCrqcYear] = useState<number>(CRQC_ESTIMATES.workshopDefault)
  const [baseYear, setBaseYear] = useState<number>(PHARMA_SAMPLE_BASE_YEAR)

  const scenario = useMemo(() => ({ baseYear, crqcYear }), [baseYear, crqcYear])

  const addCompound = useCallback(() => {
    setPipeline((prev) => [
      ...prev,
      {
        id: nextId('compound'),
        compoundName: `NEW-${prev.length + 1}`,
        commercialValueM: 500,
        keyProtection: 'rsa-2048',
        confidentialityYearsRemaining: 10,
        patentExpiryYear: baseYear + 10,
        exclusivityEndYear: null,
        steps: [
          {
            id: nextId('step'),
            name: 'Fictional step',
            years: 2,
            disclosedRecordAllowsSkip: true,
          },
        ],
      },
    ])
  }, [baseYear])

  const removeCompound = useCallback((id: string) => {
    setPipeline((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateCompound = useCallback((id: string, updates: Partial<PharmaCompoundInput>) => {
    setPipeline((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

  const updateStep = useCallback((compoundId: string, stepId: string, updates: Partial<RdStep>) => {
    setPipeline((prev) =>
      prev.map((c) =>
        c.id === compoundId
          ? { ...c, steps: c.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)) }
          : c
      )
    )
  }, [])

  const addStep = useCallback((compoundId: string) => {
    setPipeline((prev) =>
      prev.map((c) =>
        c.id === compoundId
          ? {
              ...c,
              steps: [
                ...c.steps,
                {
                  id: nextId('step'),
                  name: 'Fictional step',
                  years: 1,
                  disclosedRecordAllowsSkip: false,
                },
              ],
            }
          : c
      )
    )
  }, [])

  const removeStep = useCallback((compoundId: string, stepId: string) => {
    setPipeline((prev) =>
      prev.map((c) =>
        c.id === compoundId ? { ...c, steps: c.steps.filter((s) => s.id !== stepId) } : c
      )
    )
  }, [])

  // ── Calculations: one shared function ──────────────────────────────────

  const results = useMemo(
    () =>
      pipeline.map((compound) => ({ compound, result: computePharmaCompound(compound, scenario) })),
    [pipeline, scenario]
  )
  const portfolio = useMemo(() => computePharmaPortfolio(pipeline, scenario), [pipeline, scenario])

  const withSavedTime = results.filter((r) => r.result.rdYearsSaved > 0)

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <UnresolvedEstimatesNotice detail="workshopExample" />
      <p className="text-sm text-foreground/80">
        Everything on this page is a fictional project sample, not a standard, a forecast or a
        vendor claim. Each compound has one fictional record encrypted with AES-256-GCM. What you
        choose is how that record&apos;s content key is protected: RSA-2048, a pre-shared AES-256
        key, or an X25519 + ML-KEM-768 hybrid. The sample assumes a future computer that can decrypt
        recorded RSA exchanges in the CRQC year you set. It shows total value and the part of it
        tied to the exposed path as two separate figures. It assigns no probability and predicts no
        financial loss. How the key is distributed, stored or used is not assessed here.
      </p>

      {/* ── Scenario years ─────────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <label
          htmlFor="pharma-base-year"
          className="block text-sm font-bold text-foreground mb-1 flex items-center gap-2"
        >
          <Clock size={16} className="text-primary" />
          Fictional base year
        </label>
        <Input
          id="pharma-base-year"
          type="number"
          min={2000}
          max={2100}
          value={baseYear}
          onChange={(e) =>
            setBaseYear(Math.round(Number(e.target.value)) || PHARMA_SAMPLE_BASE_YEAR)
          }
          className="h-9 text-sm font-mono w-32"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Confidentiality years are counted from this year. It is an input you can edit, not
          today&apos;s date, so the results do not change as the calendar moves.
        </p>
      </div>

      {/* ── Pipeline Builder ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FlaskConical size={16} className="text-primary" />
          Fictional Compound Records
        </h4>

        <div className="space-y-3">
          {pipeline.map((compound) => {
            const option = getKeyProtectionOption(compound.keyProtection)
            return (
              <div key={compound.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div>
                    <label
                      htmlFor={`compound-name-${compound.id}`}
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Compound
                    </label>
                    <Input
                      id={`compound-name-${compound.id}`}
                      type="text"
                      value={compound.compoundName}
                      onChange={(e) =>
                        updateCompound(compound.id, { compoundName: e.target.value })
                      }
                      className="h-9 text-sm"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`compound-value-${compound.id}`}
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Value ($M)
                    </label>
                    <Input
                      id={`compound-value-${compound.id}`}
                      type="number"
                      min={0}
                      max={99999}
                      value={compound.commercialValueM}
                      onChange={(e) =>
                        updateCompound(compound.id, {
                          commercialValueM: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="h-9 text-sm font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <span className="block text-xs text-muted-foreground mb-1">
                      Record key protection
                    </span>
                    <FilterDropdown
                      items={KEY_PROTECTION_DROPDOWN_ITEMS}
                      selectedId={compound.keyProtection}
                      onSelect={(id) =>
                        updateCompound(compound.id, { keyProtection: id as KeyProtectionPath })
                      }
                      label="Key protection"
                      defaultLabel="Select"
                      noContainer
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompound(compound.id)}
                      aria-label={`Remove ${compound.compoundName || 'compound'}`}
                      className="text-status-error hover:text-status-error h-9"
                      disabled={pipeline.length <= 1}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{option.explanation}</p>

                {/* Dates: confidentiality is separate from patent and exclusivity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label
                      htmlFor={`compound-conf-${compound.id}`}
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Confidentiality years remaining
                    </label>
                    <Input
                      id={`compound-conf-${compound.id}`}
                      type="number"
                      min={0}
                      max={100}
                      value={compound.confidentialityYearsRemaining}
                      onChange={(e) =>
                        updateCompound(compound.id, {
                          confidentialityYearsRemaining: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`compound-patent-${compound.id}`}
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Patent expiry year (display only)
                    </label>
                    <Input
                      id={`compound-patent-${compound.id}`}
                      type="number"
                      min={2000}
                      max={2200}
                      value={compound.patentExpiryYear}
                      onChange={(e) =>
                        updateCompound(compound.id, {
                          patentExpiryYear: Math.round(Number(e.target.value)),
                        })
                      }
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`compound-excl-${compound.id}`}
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Exclusivity end year (display only)
                    </label>
                    <Input
                      id={`compound-excl-${compound.id}`}
                      type="number"
                      min={2000}
                      max={2200}
                      placeholder="none"
                      value={compound.exclusivityEndYear ?? ''}
                      onChange={(e) =>
                        updateCompound(compound.id, {
                          exclusivityEndYear:
                            e.target.value === '' ? null : Math.round(Number(e.target.value)),
                        })
                      }
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  A patent expiring does not end confidentiality, and confidentiality ending does
                  not end a patent. Only &quot;confidentiality years remaining&quot; feeds the
                  result.
                </p>

                {/* R&D steps */}
                <div className="mt-3">
                  <span className="block text-xs font-bold text-foreground mb-1">
                    Fictional development steps remaining
                  </span>
                  <div className="space-y-2">
                    {compound.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end"
                      >
                        <div className="sm:col-span-5">
                          <label
                            htmlFor={`step-name-${step.id}`}
                            className="block text-[11px] text-muted-foreground mb-0.5"
                          >
                            {`Step ${idx + 1} name for ${compound.compoundName}`}
                          </label>
                          <Input
                            id={`step-name-${step.id}`}
                            type="text"
                            value={step.name}
                            onChange={(e) =>
                              updateStep(compound.id, step.id, { name: e.target.value })
                            }
                            className="h-8 text-xs"
                            maxLength={40}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`step-years-${step.id}`}
                            className="block text-[11px] text-muted-foreground mb-0.5"
                          >
                            {`Step ${idx + 1} years for ${compound.compoundName}`}
                          </label>
                          <Input
                            id={`step-years-${step.id}`}
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={step.years}
                            onChange={(e) =>
                              updateStep(compound.id, step.id, {
                                years: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <label className="sm:col-span-4 flex items-center gap-1.5 text-[11px] text-foreground/80 h-8">
                          <input
                            type="checkbox"
                            checked={step.disclosedRecordAllowsSkip}
                            onChange={(e) =>
                              updateStep(compound.id, step.id, {
                                disclosedRecordAllowsSkip: e.target.checked,
                              })
                            }
                            aria-label={`Step ${idx + 1} can be omitted for ${compound.compoundName}`}
                            className="accent-primary"
                          />
                          Disclosed record would let an adversary omit this step
                        </label>
                        <div className="sm:col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(compound.id, step.id)}
                            aria-label={`Remove step ${idx + 1} of ${compound.compoundName}`}
                            className="text-status-error hover:text-status-error h-8"
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addStep(compound.id)}
                    disabled={compound.steps.length >= MAX_STEPS}
                    aria-label={`Add step to ${compound.compoundName}`}
                    className="mt-2 flex items-center gap-1.5"
                  >
                    <Plus size={12} />
                    Add step
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addCompound}
          disabled={pipeline.length >= MAX_COMPOUNDS}
          className="mt-3 flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add Compound
          {pipeline.length >= MAX_COMPOUNDS && (
            <span className="text-muted-foreground ml-1">(max {MAX_COMPOUNDS})</span>
          )}
        </Button>
      </div>

      {/* ── CRQC Year Slider ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="crqc-year"
            className="text-sm font-bold text-foreground flex items-center gap-2"
          >
            <Clock size={16} className="text-primary" />
            Assumed CRQC Year
          </label>
          <span className="text-lg font-bold font-mono text-primary">{crqcYear}</span>
        </div>
        <input
          id="crqc-year"
          type="range"
          min={2028}
          max={2042}
          step={1}
          value={crqcYear}
          onChange={(e) => setCrqcYear(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>2028 (aggressive)</span>
          <span>2035 (consensus)</span>
          <span>2042 (conservative)</span>
        </div>
      </div>

      {/* ── Value dashboard: total value and vulnerable-path value, separately ── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          Value and Key-Protection Path
        </h4>

        <div className="space-y-2">
          {results.map(({ compound, result }) => {
            const tied = result.status === 'exposed-in-scenario'
            return (
              <div
                key={compound.id}
                className={`rounded-lg border p-3 transition-colors ${
                  tied ? 'border-status-error/30 bg-status-error/5' : 'border-border bg-muted/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {compound.compoundName}
                    </span>
                    {tied && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-error/20 text-status-error">
                        <AlertTriangle size={10} />
                        Vulnerable path
                      </span>
                    )}
                    <span className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground font-medium">
                      {getKeyProtectionOption(compound.keyProtection).label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Total value</div>
                      <div className="font-mono text-foreground">
                        {formatMillions(result.totalValueM)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">
                        Tied to vulnerable path
                      </div>
                      <div
                        className={`font-mono font-bold ${tied ? 'text-status-error' : 'text-foreground'}`}
                      >
                        {result.valueOnVulnerablePathM === null
                          ? 'not determined'
                          : formatMillions(result.valueOnVulnerablePathM)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Confidential until</div>
                      <div className="font-mono text-foreground">
                        {result.confidentialityEndYear}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {STATUS_TEXT[result.status]}. Patent expiry {result.patentExpiryYear}
                  {result.exclusivityEndYear !== null
                    ? `, exclusivity ends ${result.exclusivityEndYear}`
                    : ', no exclusivity date entered'}{' '}
                  (shown separately).
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total fictional value</span>
            <span className="text-lg font-bold font-mono text-foreground">
              {formatMillions(portfolio.totalValueM)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              Value tied to the vulnerable path
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                portfolio.valueOnVulnerablePathM > 0 ? 'text-status-error' : 'text-foreground'
              }`}
            >
              {formatMillions(portfolio.valueOnVulnerablePathM)}
            </span>
          </div>
          {portfolio.compoundsPathUnknown > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {portfolio.compoundsPathUnknown} compound(s) have no key protection specified and are
              not included in the vulnerable-path figure.
            </p>
          )}
        </div>
      </div>

      {/* ── R&D time from the visible steps ───────────────────────────── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-status-warning" />
          R&amp;D Time From the Steps You Entered
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Time saved is the sum of the steps you marked as omittable, and nothing else. It is
          arithmetic on fictional steps. It does not claim a stolen record replaces independent
          trials that a regulator requires, and it does not depend on the key-protection choice.
        </p>
        <div className="space-y-2">
          {results.map(({ compound, result }) => (
            <div
              key={compound.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
            >
              <span className="font-bold font-mono text-foreground">{compound.compoundName}</span>
              <span className="font-mono text-foreground/80">
                {`${formatYears(result.developmentYearsTotal)} of steps in total, ${formatYears(result.rdYearsSaved)} omittable, ${formatYears(result.rdYearsRetained)} retained`}
              </span>
            </div>
          ))}
        </div>
        {withSavedTime.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            No step is marked as omittable, so the time saved is 0 years.
          </p>
        )}
      </div>

      {/* ── Summary Panel ─────────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Portfolio Summary
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Value
            </div>
            <div className="text-lg font-bold font-mono text-foreground mt-1">
              {formatMillions(portfolio.totalValueM)}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Tied to Vulnerable Path
            </div>
            <div className="text-lg font-bold font-mono text-foreground mt-1">
              {formatMillions(portfolio.valueOnVulnerablePathM)}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Compounds on Vulnerable Path
            </div>
            <div className="text-lg font-bold font-mono text-foreground mt-1">
              {portfolio.compoundsOnVulnerablePath}/{pipeline.length}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              R&amp;D Years Omittable
            </div>
            <div className="text-lg font-bold font-mono text-foreground mt-1">
              {portfolio.rdYearsSaved}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
