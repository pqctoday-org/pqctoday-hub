import React, { useState, useMemo } from 'react'
import { CRQC_ESTIMATES } from '../data/quantumConstants'

export const HNDLTimeline: React.FC = () => {
  const [dataLifetime, setDataLifetime] = useState(25)
  const [migrationTime, setMigrationTime] = useState(5)
  const [crqcYear, setCrqcYear] = useState(2035)
  const currentYear = 2026

  const migrationDeadline = useMemo(
    () => crqcYear - dataLifetime - migrationTime,
    [crqcYear, dataLifetime, migrationTime]
  )

  const yearsRemaining = useMemo(() => migrationDeadline - currentYear, [migrationDeadline])

  const urgencyLevel = useMemo(() => {
    if (yearsRemaining < 0) return 'overdue'
    if (yearsRemaining <= 2) return 'critical'
    if (yearsRemaining <= 5) return 'urgent'
    return 'planning'
  }, [yearsRemaining])

  const urgencyConfig = {
    overdue: {
      label: 'OVERDUE',
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/20',
      message: `Migration should have started ${Math.abs(yearsRemaining)} years ago. Data intercepted today is already at risk.`,
    },
    critical: {
      label: 'CRITICAL',
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/20',
      message: `Only ${yearsRemaining} year${yearsRemaining === 1 ? '' : 's'} remaining. Migration must begin immediately.`,
    },
    urgent: {
      label: 'URGENT',
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/20',
      message: `${yearsRemaining} years remaining. Migration planning should be underway.`,
    },
    planning: {
      label: 'PLANNING',
      color: 'text-success',
      bg: 'bg-success/10 border-success/20',
      message: `${yearsRemaining} years remaining. Begin cryptographic inventory and planning.`,
    },
  }

  // eslint-disable-next-line security/detect-object-injection
  const urgency = urgencyConfig[urgencyLevel]

  // Timeline visualization points
  const timelineStart = Math.min(currentYear - 5, migrationDeadline - 2)
  const timelineEnd = Math.max(crqcYear + 5, currentYear + 15)
  const timelineRange = timelineEnd - timelineStart

  const getPosition = (year: number) => ((year - timelineStart) / timelineRange) * 100

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">HNDL Timeline Calculator</h3>
        <p className="text-sm text-muted-foreground">
          Calculate when you must migrate to PQC based on your data&apos;s confidentiality
          requirements and the expected arrival of a Cryptographically Relevant Quantum Computer
          (CRQC).
        </p>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-panel p-4">
          <label
            htmlFor="data-lifetime-slider"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Data Confidentiality Lifetime
          </label>
          <div className="flex items-center gap-3">
            <input
              id="data-lifetime-slider"
              type="range"
              min={1}
              max={75}
              value={dataLifetime}
              onChange={(e) => setDataLifetime(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-lg font-bold text-primary w-20 text-right">
              {dataLifetime} yrs
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1 year</span>
            <span>75 years</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: 'Email', years: 5 },
              { label: 'Financial', years: 10 },
              { label: 'Gov/Military', years: 25 },
              { label: 'Healthcare', years: 50 },
              { label: 'State secrets', years: 75 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setDataLifetime(preset.years)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  dataLifetime === preset.years
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {preset.label} ({preset.years}y)
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4 space-y-6">
          <div>
            <label
              htmlFor="crqc-year-slider"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Expected CRQC Arrival Year
            </label>
            <div className="flex items-center gap-3">
              <input
                id="crqc-year-slider"
                type="range"
                min={2028}
                max={2045}
                value={crqcYear}
                onChange={(e) => setCrqcYear(Number(e.target.value))}
                className="flex-1 accent-secondary"
              />
              <span className="text-lg font-bold text-secondary w-20 text-right">{crqcYear}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>2028</span>
              <span>2045</span>
            </div>
            <div className="mt-3 space-y-1">
              {CRQC_ESTIMATES.slice(0, 3).map((estimate) => (
                <div key={estimate.source} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground truncate">{estimate.source}:</span>
                  <span className="text-foreground/80">{estimate.confidence}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label
              htmlFor="migration-time-slider"
              className="block text-sm font-medium text-foreground mb-2"
            >
              System Migration Time
            </label>
            <div className="flex items-center gap-3">
              <input
                id="migration-time-slider"
                type="range"
                min={1}
                max={15}
                value={migrationTime}
                onChange={(e) => setMigrationTime(Number(e.target.value))}
                className="flex-1 accent-warning"
              />
              <span className="text-lg font-bold text-warning w-20 text-right">
                {migrationTime} yrs
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 year</span>
              <span>15 years</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className={`glass-panel p-6 border ${urgency.bg}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded border font-bold ${urgency.bg} ${urgency.color}`}
              >
                {urgency.label}
              </span>
              <span className="text-sm text-muted-foreground">Migration Deadline</span>
            </div>
            <div className={`text-3xl font-bold ${urgency.color}`}>{migrationDeadline}</div>
            <p className="text-sm text-muted-foreground mt-1">{urgency.message}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Mosca&apos;s Theorem</div>
            <div className="font-mono text-sm text-foreground">
              {crqcYear} &minus; {dataLifetime} &minus; {migrationTime} = {migrationDeadline}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              CRQC Year &minus; Data Lifetime &minus; Migration Time
            </div>
          </div>
        </div>
      </div>

      {/* Visual timeline */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">Visual Timeline</h4>
        <div className="relative h-16">
          {/* Timeline bar */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 rounded" />

          {/* Danger zone */}
          {migrationDeadline < crqcYear && (
            <div
              className="absolute top-1/2 h-1 bg-destructive/30 -translate-y-1/2 rounded"
              style={{
                left: `${Math.max(0, getPosition(Math.max(migrationDeadline, timelineStart)))}%`,
                width: `${getPosition(crqcYear) - Math.max(0, getPosition(Math.max(migrationDeadline, timelineStart)))}%`,
              }}
            />
          )}

          {/* Migration deadline marker */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${Math.max(0, Math.min(100, getPosition(migrationDeadline)))}%` }}
          >
            <div className="text-[10px] font-bold text-warning whitespace-nowrap -translate-x-1/2">
              Migrate by
            </div>
            <div className="w-0.5 flex-1 bg-warning" />
            <div className="text-[10px] font-bold text-warning -translate-x-1/2">
              {migrationDeadline}
            </div>
          </div>

          {/* Current year marker */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${getPosition(currentYear)}%` }}
          >
            <div className="text-[10px] font-bold text-primary whitespace-nowrap -translate-x-1/2">
              Today
            </div>
            <div className="w-0.5 flex-1 bg-primary" />
            <div className="text-[10px] font-bold text-primary -translate-x-1/2">{currentYear}</div>
          </div>

          {/* CRQC marker */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${getPosition(crqcYear)}%` }}
          >
            <div className="text-[10px] font-bold text-destructive whitespace-nowrap -translate-x-1/2">
              CRQC
            </div>
            <div className="w-0.5 flex-1 bg-destructive" />
            <div className="text-[10px] font-bold text-destructive -translate-x-1/2">
              {crqcYear}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
