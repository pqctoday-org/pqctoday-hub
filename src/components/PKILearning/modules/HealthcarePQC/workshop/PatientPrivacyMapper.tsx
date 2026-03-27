// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { HeartPulse, Clock, Shield, AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HEALTHCARE_DATA_PROFILES,
  SEVERITY_COLORS,
  type HealthcareDataCategory,
  type HealthcareDataProfile,
} from '../data/healthcareConstants'

// ── Helpers ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = 2026

function priorityBarColor(priority: number): string {
  if (priority >= 9) return 'bg-status-error'
  if (priority >= 7) return 'bg-status-warning'
  if (priority >= 5) return 'bg-status-info'
  return 'bg-muted-foreground'
}

function priorityTextColor(priority: number): string {
  if (priority >= 9) return 'text-status-error'
  if (priority >= 7) return 'text-status-warning'
  if (priority >= 5) return 'text-status-info'
  return 'text-muted-foreground'
}

function formatRetention(years: number): string {
  if (years >= 100) return 'Lifetime'
  return `${years} years`
}

// ── Category Card ──────────────────────────────────────────────────────────

interface CategoryCardProps {
  profile: HealthcareDataProfile
  selected: boolean
  onToggle: () => void
}

const CategoryCard: React.FC<CategoryCardProps> = ({ profile, selected, onToggle }) => {
  const severityClasses = SEVERITY_COLORS[profile.hndlExposure] ?? SEVERITY_COLORS['medium']

  return (
    <button
      onClick={onToggle}
      className={`relative w-full text-left rounded-lg border p-4 transition-all ${
        selected
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      {/* Selection checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg
            className="w-3 h-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <HeartPulse size={16} className="text-primary mt-0.5 shrink-0" />
          <h4 className="text-sm font-bold text-foreground leading-tight">{profile.name}</h4>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{profile.description}</p>

        <div className="flex flex-wrap gap-2">
          {/* True retention badge */}
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-bold">
            <Clock size={10} />
            {formatRetention(profile.trueRetentionYears)}
          </span>

          {/* HIPAA minimum badge */}
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground font-medium">
            HIPAA: {profile.hipaaMinimumYears} years
          </span>

          {/* Severity badge */}
          <span
            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${severityClasses}`}
          >
            {profile.hndlExposure}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Stigma Section ─────────────────────────────────────────────────────────

interface StigmaSectionProps {
  profiles: HealthcareDataProfile[]
}

const StigmaSection: React.FC<StigmaSectionProps> = ({ profiles }) => {
  const [expanded, setExpanded] = useState(true)

  const uniqueFactors = useMemo(() => {
    const factorSet = new Set<string>()
    profiles.forEach((p) => p.stigmaFactors.forEach((f) => factorSet.add(f)))
    return Array.from(factorSet).sort()
  }, [profiles])

  if (profiles.length === 0) return null

  return (
    <div className="glass-panel p-4">
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-status-error" />
          <h3 className="text-sm font-bold text-foreground">Privacy Stigma Amplifiers</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-error/10 text-status-error font-bold border border-status-error/30">
            {uniqueFactors.length} factors
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </Button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Unlike financial data breaches where losses are quantifiable and recoverable, quantum
            decryption of healthcare records causes{' '}
            <span className="text-status-error font-bold">irreversible social harm</span>. These
            stigma factors cannot be &ldquo;unlearned&rdquo; by employers, insurers, or communities
            once exposed &mdash; making HNDL attacks against healthcare data uniquely devastating.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uniqueFactors.map((factor) => {
              const sourceProfiles = profiles.filter((p) => p.stigmaFactors.includes(factor))
              return (
                <div
                  key={factor}
                  className="flex items-start gap-2 p-2 rounded border border-border bg-muted/30"
                >
                  <AlertTriangle size={12} className="text-status-warning mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground">{factor}</span>
                    <div className="text-[10px] text-muted-foreground">
                      {sourceProfiles.map((p) => p.name).join(' &bull; ')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Timeline Bar ───────────────────────────────────────────────────────────

interface TimelineBarProps {
  profile: HealthcareDataProfile
  maxRetention: number
  crqcYear: number
}

const TimelineBar: React.FC<TimelineBarProps> = ({ profile, maxRetention, crqcYear }) => {
  const hipaaWidth = (profile.hipaaMinimumYears / maxRetention) * 100
  const retentionWidth = (profile.trueRetentionYears / maxRetention) * 100
  const yearsUntilCrqc = crqcYear - CURRENT_YEAR
  const crqcPosition = Math.min((yearsUntilCrqc / maxRetention) * 100, 100)
  const hndlExposed = yearsUntilCrqc < profile.trueRetentionYears
  const hndlWidth = hndlExposed ? Math.min(crqcPosition, retentionWidth) : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{profile.name}</span>
        <span className="text-[10px] text-muted-foreground">
          {formatRetention(profile.trueRetentionYears)}
        </span>
      </div>

      <div className="relative h-6 rounded bg-muted/50 overflow-hidden">
        {/* HNDL exposure zone (harvest window) */}
        {hndlExposed && (
          <div
            className="absolute inset-y-0 left-0 bg-status-error/20 border-r border-status-error/40"
            style={{ width: `${hndlWidth}%` }}
          />
        )}

        {/* HIPAA minimum bar */}
        <div
          className="absolute inset-y-0 left-0 bg-muted border-r-2 border-muted-foreground/30"
          style={{ width: `${hipaaWidth}%` }}
        />

        {/* True retention bar */}
        <div
          className="absolute inset-y-0 left-0 bg-primary/30 border-r-2 border-primary"
          style={{ width: `${retentionWidth}%` }}
        />

        {/* CRQC line */}
        {crqcPosition <= 100 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-status-error z-10"
            style={{ left: `${crqcPosition}%` }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-status-error whitespace-nowrap">
              CRQC
            </div>
          </div>
        )}

        {/* Labels inside bar */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-[9px] text-muted-foreground font-medium">
            HIPAA {profile.hipaaMinimumYears}y
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export const PatientPrivacyMapper: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<Set<HealthcareDataCategory>>(
    new Set<HealthcareDataCategory>(['pediatric-ehr', 'genomic', 'mental-health'])
  )
  const [crqcYear, setCrqcYear] = useState(2035)

  const toggleCategory = (id: HealthcareDataCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedProfiles = useMemo(
    () =>
      HEALTHCARE_DATA_PROFILES.filter((p) => selectedCategories.has(p.id)).sort(
        (a, b) => b.pqcPriority - a.pqcPriority
      ),
    [selectedCategories]
  )

  const maxRetention = useMemo(
    () =>
      selectedProfiles.length > 0
        ? Math.max(...selectedProfiles.map((p) => p.trueRetentionYears))
        : 50,
    [selectedProfiles]
  )

  const yearsUntilCrqc = crqcYear - CURRENT_YEAR

  const aggregateStats = useMemo(() => {
    if (selectedProfiles.length === 0) return null
    const avgRetention = Math.round(
      selectedProfiles.reduce((sum, p) => sum + p.trueRetentionYears, 0) / selectedProfiles.length
    )
    const criticalCount = selectedProfiles.filter((p) => p.hndlExposure === 'critical').length
    const exposedCount = selectedProfiles.filter(
      (p) => p.trueRetentionYears > yearsUntilCrqc
    ).length
    return { avgRetention, criticalCount, exposedCount }
  }, [selectedProfiles, yearsUntilCrqc])

  const selectAll = () => {
    setSelectedCategories(new Set(HEALTHCARE_DATA_PROFILES.map((p) => p.id)))
  }

  const clearAll = () => {
    setSelectedCategories(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Patient Privacy Mapper</h3>
        <p className="text-sm text-muted-foreground">
          Select healthcare data categories to visualize true retention periods, privacy stigma
          amplifiers, and HNDL exposure windows. HIPAA mandates a 6-year minimum &mdash; but real
          retention periods are far longer, dramatically expanding the harvest-now-decrypt-later
          attack surface.
        </p>
      </div>

      {/* ── Data Category Selector ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Data Categories</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/30">
              {selectedCategories.size} / {HEALTHCARE_DATA_PROFILES.length} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={selectAll} className="text-xs h-7 px-2">
              Select All
            </Button>
            <Button variant="ghost" onClick={clearAll} className="text-xs h-7 px-2">
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HEALTHCARE_DATA_PROFILES.map((profile) => (
            <CategoryCard
              key={profile.id}
              profile={profile}
              selected={selectedCategories.has(profile.id)}
              onToggle={() => toggleCategory(profile.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Selection Summary ───────────────────────────────────────────────── */}
      {aggregateStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-primary">{aggregateStats.avgRetention}y</p>
            <p className="text-[10px] text-muted-foreground">Avg True Retention</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-status-error">{aggregateStats.criticalCount}</p>
            <p className="text-[10px] text-muted-foreground">Critical HNDL Exposure</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-status-warning">{aggregateStats.exposedCount}</p>
            <p className="text-[10px] text-muted-foreground">Exposed at CRQC {crqcYear}</p>
          </div>
        </div>
      )}

      {/* ── Stigma Amplifiers ───────────────────────────────────────────────── */}
      <StigmaSection profiles={selectedProfiles} />

      {/* ── CRQC Year Slider + Timeline Visualization ───────────────────────── */}
      {selectedProfiles.length > 0 && (
        <div className="glass-panel p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-secondary" />
            <h3 className="text-sm font-bold text-foreground">HNDL Exposure Timeline</h3>
          </div>

          <p className="text-xs text-muted-foreground">
            Data captured today remains encrypted in adversary storage. When a Cryptographically
            Relevant Quantum Computer (CRQC) arrives, all data still within its retention period can
            be decrypted. The red zone shows the harvest window &mdash; data exposed to quantum
            decryption.
          </p>

          {/* CRQC slider */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <label
              htmlFor="crqc-year-slider"
              className="flex items-center justify-between text-sm font-medium text-foreground mb-2"
            >
              <span>Expected CRQC Arrival</span>
              <span className="text-lg font-bold text-status-error">{crqcYear}</span>
            </label>
            <input
              id="crqc-year-slider"
              type="range"
              min={2030}
              max={2040}
              value={crqcYear}
              onChange={(e) => setCrqcYear(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>2030 (aggressive)</span>
              <span>2035 (median)</span>
              <span>2040 (conservative)</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted border border-muted-foreground/30" />
              <span className="text-muted-foreground">HIPAA Minimum (6y)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/30 border border-primary" />
              <span className="text-muted-foreground">True Retention</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-status-error/20 border border-status-error/40" />
              <span className="text-muted-foreground">HNDL Exposure Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-status-error" />
              <span className="text-muted-foreground">CRQC Arrival ({crqcYear})</span>
            </div>
          </div>

          {/* Timeline axis */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>0 years</span>
              <span>{Math.round(maxRetention / 4)}y</span>
              <span>{Math.round(maxRetention / 2)}y</span>
              <span>{Math.round((maxRetention * 3) / 4)}y</span>
              <span>{maxRetention}y</span>
            </div>
          </div>

          {/* Bars */}
          <div className="space-y-3">
            {selectedProfiles.map((profile) => (
              <TimelineBar
                key={profile.id}
                profile={profile}
                maxRetention={maxRetention}
                crqcYear={crqcYear}
              />
            ))}
          </div>

          {/* HNDL summary callout */}
          {aggregateStats && aggregateStats.exposedCount > 0 && (
            <div className="rounded-lg border border-status-error/30 bg-status-error/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
                <div className="text-xs text-foreground">
                  <span className="font-bold text-status-error">
                    {aggregateStats.exposedCount} of {selectedProfiles.length} categories
                  </span>{' '}
                  have retention periods exceeding the {yearsUntilCrqc}-year window until CRQC
                  arrival. Data harvested today in these categories will still be within its
                  retention period &mdash; and therefore decryptable &mdash; when quantum computers
                  become available.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Regulatory Overlay Table ────────────────────────────────────────── */}
      {selectedProfiles.length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Regulatory Overlay</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">
                    Category
                  </th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">
                    Applicable Regulations
                  </th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-semibold w-28">
                    PQC Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedProfiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-foreground">{profile.name}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {profile.applicableRegulations.map((reg) => (
                          <span
                            key={reg}
                            className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                          >
                            {reg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${priorityBarColor(profile.pqcPriority)}`}
                            style={{ width: `${profile.pqcPriority * 10}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold text-xs tabular-nums w-5 text-right ${priorityTextColor(profile.pqcPriority)}`}
                        >
                          {profile.pqcPriority}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {selectedProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Select at least one data category above to see the privacy timeline analysis.
        </div>
      )}
    </div>
  )
}
