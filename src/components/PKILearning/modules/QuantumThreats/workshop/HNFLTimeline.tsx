import React, { useState, useMemo } from 'react'
import { CRQC_ESTIMATES } from '../data/quantumConstants'

export const HNFLTimeline: React.FC = () => {
  const [credentialValidity, setCredentialValidity] = useState(20)
  const [reissuanceTime, setReissuanceTime] = useState(5)
  const [crqcYear, setCrqcYear] = useState(2035)
  const currentYear = 2026

  // Re-issuance must complete before CRQC arrives
  const reissuanceDeadline = useMemo(() => crqcYear - reissuanceTime, [crqcYear, reissuanceTime])

  const yearsRemaining = useMemo(() => reissuanceDeadline - currentYear, [reissuanceDeadline])

  // Credential issued today expires at:
  const credentialExpiryYear = useMemo(() => currentYear + credentialValidity, [credentialValidity])

  // Is this credential still valid when CRQC arrives? If so, it's forgeable.
  const credentialAtRisk = useMemo(
    () => credentialExpiryYear >= crqcYear,
    [credentialExpiryYear, crqcYear]
  )

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
      message: `Re-issuance should have started ${Math.abs(yearsRemaining)} year${Math.abs(yearsRemaining) === 1 ? '' : 's'} ago. Credentials issued today are already in the HNFL forge window.`,
    },
    critical: {
      label: 'CRITICAL',
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/20',
      message: `Only ${yearsRemaining} year${yearsRemaining === 1 ? '' : 's'} remaining. PQC signing migration must begin immediately.`,
    },
    urgent: {
      label: 'URGENT',
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/20',
      message: `${yearsRemaining} years remaining. Credential re-issuance planning should be underway.`,
    },
    planning: {
      label: 'PLANNING',
      color: 'text-success',
      bg: 'bg-success/10 border-success/20',
      message: `${yearsRemaining} years remaining. Begin PKI inventory and PQC signing algorithm selection.`,
    },
  }

  // eslint-disable-next-line security/detect-object-injection
  const urgency = urgencyConfig[urgencyLevel]

  // Timeline visualization
  const timelineStart = Math.min(currentYear - 3, reissuanceDeadline - 2)
  const timelineEnd = Math.max(crqcYear + 5, credentialExpiryYear + 2)
  const timelineRange = timelineEnd - timelineStart

  const getPosition = (year: number) => ((year - timelineStart) / timelineRange) * 100

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">HNFL Credential Risk Calculator</h3>
        <p className="text-sm text-muted-foreground">
          Calculate when signing credentials must migrate to PQC. Any credential still valid when a
          CRQC arrives can be retroactively forged — an adversary recovers the signing private key
          and issues fraudulent signatures on any document, firmware, or certificate.
        </p>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-panel p-4">
          <label
            htmlFor="credential-validity-slider"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Credential Validity Period
          </label>
          <div className="flex items-center gap-3">
            <input
              id="credential-validity-slider"
              type="range"
              min={1}
              max={30}
              value={credentialValidity}
              onChange={(e) => setCredentialValidity(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-lg font-bold text-primary w-20 text-right">
              {credentialValidity} yrs
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1 year</span>
            <span>30 years</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: 'TLS cert', years: 1 },
              { label: 'Code signing', years: 3 },
              { label: 'Intermediate CA', years: 10 },
              { label: 'Root CA', years: 20 },
              { label: 'Long-lived firmware', years: 25 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setCredentialValidity(preset.years)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  credentialValidity === preset.years
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {preset.label} ({preset.years}y)
              </button>
            ))}
          </div>
          <div className="mt-3 bg-muted/50 rounded p-2 border border-border text-xs text-muted-foreground">
            <strong className="text-foreground">Credential expiry:</strong>{' '}
            <span
              className={credentialAtRisk ? 'text-destructive font-bold' : 'text-success font-bold'}
            >
              {credentialExpiryYear}
            </span>
            {credentialAtRisk ? (
              <span className="text-destructive"> — still valid at CRQC arrival (at risk)</span>
            ) : (
              <span className="text-success"> — expires before CRQC (lower risk)</span>
            )}
          </div>
        </div>

        <div className="glass-panel p-4 space-y-6">
          <div>
            <label
              htmlFor="hnfl-crqc-year-slider"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Expected CRQC Arrival Year
            </label>
            <div className="flex items-center gap-3">
              <input
                id="hnfl-crqc-year-slider"
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
              htmlFor="reissuance-time-slider"
              className="block text-sm font-medium text-foreground mb-2"
            >
              PKI Re-issuance Time
            </label>
            <div className="flex items-center gap-3">
              <input
                id="reissuance-time-slider"
                type="range"
                min={1}
                max={10}
                value={reissuanceTime}
                onChange={(e) => setReissuanceTime(Number(e.target.value))}
                className="flex-1 accent-warning"
              />
              <span className="text-lg font-bold text-warning w-20 text-right">
                {reissuanceTime} yrs
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 year</span>
              <span>10 years</span>
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
              <span className="text-sm text-muted-foreground">Re-issuance Deadline</span>
            </div>
            <div className={`text-3xl font-bold ${urgency.color}`}>{reissuanceDeadline}</div>
            <p className="text-sm text-muted-foreground mt-1">{urgency.message}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">HNFL Re-issuance Formula</div>
            <div className="font-mono text-sm text-foreground">
              {crqcYear} &minus; {reissuanceTime} = {reissuanceDeadline}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              CRQC Year &minus; Re-issuance Time
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

          {/* Forge window danger zone (credential expiry → CRQC, if credential at risk) */}
          {credentialAtRisk && (
            <div
              className="absolute top-1/2 h-1 bg-destructive/30 -translate-y-1/2 rounded"
              style={{
                left: `${Math.max(0, getPosition(Math.max(crqcYear, timelineStart)))}%`,
                right: '0%',
                width: `${100 - Math.max(0, getPosition(Math.max(crqcYear, timelineStart)))}%`,
              }}
            />
          )}

          {/* Re-issuance deadline marker */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${Math.max(0, Math.min(100, getPosition(reissuanceDeadline)))}%` }}
          >
            <div className="text-[10px] font-bold text-warning whitespace-nowrap -translate-x-1/2">
              Re-issue by
            </div>
            <div className="w-0.5 flex-1 bg-warning" />
            <div className="text-[10px] font-bold text-warning -translate-x-1/2">
              {reissuanceDeadline}
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

          {/* Credential expiry marker */}
          {credentialExpiryYear <= timelineEnd && credentialExpiryYear >= timelineStart && (
            <div
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${Math.max(0, Math.min(100, getPosition(credentialExpiryYear)))}%` }}
            >
              <div
                className={`text-[10px] font-bold whitespace-nowrap -translate-x-1/2 ${credentialAtRisk ? 'text-destructive' : 'text-success'}`}
              >
                Cred. expires
              </div>
              <div
                className={`w-0.5 flex-1 ${credentialAtRisk ? 'bg-destructive/60' : 'bg-success/60'}`}
              />
              <div
                className={`text-[10px] font-bold -translate-x-1/2 ${credentialAtRisk ? 'text-destructive' : 'text-success'}`}
              >
                {credentialExpiryYear}
              </div>
            </div>
          )}

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

      {/* Key insight */}
      <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
        <p className="text-xs text-muted-foreground">
          <strong className="text-secondary">Key difference from HNDL:</strong> HNFL does not
          require the adversary to intercept any traffic. Signed artifacts — certificate chains,
          firmware images, code-signing blobs — are often <em>publicly accessible</em>. Any
          organization relying on RSA or ECDSA signatures must rotate to{' '}
          <strong>ML-DSA or SLH-DSA</strong> before a CRQC arrives, or every past and future
          signature becomes forgeable.
        </p>
      </div>
    </div>
  )
}
