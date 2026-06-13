// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { ChevronDown, Calculator, Clock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'

/**
 * Threat-Economics header for the Threats page (PER-PAGE-CHANGES Threats #1).
 *
 * Surfaces the two quantum-threat economics — Harvest-Now-Decrypt-Later (HNDL,
 * confidentiality) vs Harvest-Now-Forge-Later (HNFL, authenticity) — alongside a
 * compact Mosca mini-calculator. The Mosca arithmetic (migration deadline =
 * CRQC − data-lifetime − migration-time) reuses the same model as the
 * PKILearning / QuantumThreats `HNDLTimeline` workshop, rendered here as a
 * lightweight inline instrument rather than the full workshop widget.
 *
 * Additive: collapsed by default; nothing else on the Threats page changes when
 * it is not expanded.
 */

/** Phase tag — Threat-economics framing is a Phase 0 (Executive Mandate) input. */
const THREAT_ECONOMICS_PHASE: PhaseId = 'p0'
// eslint-disable-next-line security/detect-object-injection
const THREAT_ECONOMICS_PHASE_DEF = FRAMEWORK_PHASES[THREAT_ECONOMICS_PHASE]

const CURRENT_YEAR = 2026

type Urgency = 'overdue' | 'critical' | 'urgent' | 'planning'

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bg: string }> = {
  overdue: {
    label: 'OVERDUE',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
  critical: {
    label: 'CRITICAL',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
  urgent: {
    label: 'URGENT',
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
  },
  planning: {
    label: 'PLANNING',
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
  },
}

export const ThreatEconomicsHeader: React.FC = () => {
  const [expanded, setExpanded] = useState(false)

  // Mosca mini-calc inputs (same model as HNDLTimeline).
  const [dataLifetime, setDataLifetime] = useState(10)
  const [migrationTime, setMigrationTime] = useState(5)
  const [crqcYear, setCrqcYear] = useState(2035)

  const migrationDeadline = useMemo(
    () => crqcYear - dataLifetime - migrationTime,
    [crqcYear, dataLifetime, migrationTime]
  )
  const yearsRemaining = useMemo(() => migrationDeadline - CURRENT_YEAR, [migrationDeadline])

  const urgencyLevel = useMemo<Urgency>(() => {
    if (yearsRemaining < 0) return 'overdue'
    if (yearsRemaining <= 2) return 'critical'
    if (yearsRemaining <= 5) return 'urgent'
    return 'planning'
  }, [yearsRemaining])

  // eslint-disable-next-line security/detect-object-injection
  const urgency = URGENCY_CONFIG[urgencyLevel]

  const urgencyMessage = useMemo(() => {
    switch (urgencyLevel) {
      case 'overdue':
        return `Migration should have started ${Math.abs(yearsRemaining)} year${
          Math.abs(yearsRemaining) === 1 ? '' : 's'
        } ago. Data intercepted today is already at risk.`
      case 'critical':
        return `Only ${yearsRemaining} year${
          yearsRemaining === 1 ? '' : 's'
        } remaining. Migration must begin immediately.`
      case 'urgent':
        return `${yearsRemaining} years remaining. Migration planning should be underway.`
      default:
        return `${yearsRemaining} years remaining. Begin cryptographic inventory and planning.`
    }
  }, [urgencyLevel, yearsRemaining])

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="threat-economics-heading"
      data-testid="threat-economics-header"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="threat-economics-heading"
              className="text-base font-bold text-foreground flex items-center gap-2"
            >
              Threat Economics
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary uppercase tracking-wide">
                Phase {THREAT_ECONOMICS_PHASE_DEF.number} · {THREAT_ECONOMICS_PHASE_DEF.name}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Why quantum threats have a clock: the two attacker business models and Mosca&apos;s
              migration deadline.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="threat-economics-body"
          className="shrink-0 text-xs gap-1"
        >
          <Calculator size={14} aria-hidden="true" />
          {expanded ? 'Hide' : 'Mosca calculator'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {/* HNDL vs HNFL framing — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-xs font-bold text-foreground">HNDL — Harvest Now, Decrypt Later</div>
          <p className="text-xs text-muted-foreground mt-1">
            Attacker records encrypted traffic today and decrypts it once a CRQC exists. Threatens{' '}
            <strong className="text-foreground">confidentiality</strong>; the clock is your
            data&apos;s secrecy lifetime.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-xs font-bold text-foreground">HNFL — Harvest Now, Forge Later</div>
          <p className="text-xs text-muted-foreground mt-1">
            Attacker waits for a CRQC, recovers a signing key, then forges signatures retroactively.
            Threatens <strong className="text-foreground">authenticity</strong>; the clock is your
            credential&apos;s validity period.
          </p>
        </div>
      </div>

      {/* Mosca mini-calc — collapsible */}
      {expanded && (
        <div id="threat-economics-body" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="te-data-lifetime"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Data lifetime (X)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="te-data-lifetime"
                  type="range"
                  min={1}
                  max={75}
                  value={dataLifetime}
                  onChange={(e) => setDataLifetime(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-bold text-primary w-12 text-right">
                  {dataLifetime}y
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="te-migration-time"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Migration time (Y)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="te-migration-time"
                  type="range"
                  min={1}
                  max={15}
                  value={migrationTime}
                  onChange={(e) => setMigrationTime(Number(e.target.value))}
                  className="flex-1 accent-warning"
                />
                <span className="text-sm font-bold text-warning w-12 text-right">
                  {migrationTime}y
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="te-crqc-year"
                className="block text-xs font-medium text-foreground mb-1"
              >
                CRQC year (Z)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="te-crqc-year"
                  type="range"
                  min={2028}
                  max={2045}
                  value={crqcYear}
                  onChange={(e) => setCrqcYear(Number(e.target.value))}
                  className="flex-1 accent-secondary"
                />
                <span className="text-sm font-bold text-secondary w-12 text-right">{crqcYear}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-3 ${urgency.bg}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={13} className={urgency.color} aria-hidden="true" />
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${urgency.bg} ${urgency.color}`}
                  >
                    {urgency.label}
                  </span>
                  <span className="text-xs text-muted-foreground">Migration deadline</span>
                </div>
                <div className={`text-2xl font-bold ${urgency.color}`}>{migrationDeadline}</div>
                <p className="text-xs text-muted-foreground mt-1">{urgencyMessage}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Mosca&apos;s Inequality</div>
                <div className="font-mono text-xs text-foreground">
                  {crqcYear} &minus; {dataLifetime} &minus; {migrationTime} = {migrationDeadline}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Z &minus; X &minus; Y = deadline. If X + Y &gt; (Z &minus; today), you are already
                  exposed.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
