// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Clock, AlertTriangle, Compass, GitBranch } from 'lucide-react'
import { KEM_HISTORY } from '../data/kemHistory'
import { CANDIDATES } from '../data/candidates'
import { FAMILIES } from '../data/families'

const PHASES = [
  {
    id: 'now',
    label: 'Now (2025–2026)',
    body: 'Round 3 down-selection of the 9 on-ramp candidates. ML-KEM, ML-DSA, SLH-DSA, FN-DSA in active production deployment. HQC alternate published. ISO/IEC SC 27 drafts in progress.',
  },
  {
    id: 'near',
    label: 'Near (2027–2028)',
    body: 'Earliest projected on-ramp standardisation. Lattice (HAWK), isogeny (SQIsign), one or two MPCitH schemes (likely FAEST or MQOM) reach draft FIPS. Multivariate candidates likely still in evaluation.',
  },
  {
    id: 'mid',
    label: 'Mid (2029–2030)',
    body: 'KpqC schemes (SMAUG-T, NTRU+, HAETAE, AIMer) reach Korean national standardisation. ISO/IEC adoption of NIST on-ramp winners completes. CACR / OSCCA publishes PQC-extended SM-series specifications.',
  },
  {
    id: 'long',
    label: 'Long (post-2030)',
    body: 'Further KEM diversification — additional code-based or isogeny-based KEMs to broaden the portfolio beyond ML-KEM + HQC. Long-tail review cycles for newer hardness assumptions. Possible third NIST signature on-ramp if a major lattice attack lands.',
  },
]

const KEM_OUTCOME_TONE: Record<string, string> = {
  standardised: 'bg-status-success/15 text-status-success border-status-success/40',
  alternate: 'bg-status-info/15 text-status-info border-status-info/40',
  monitoring: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  broken: 'bg-status-error/15 text-status-error border-status-error/40',
  eliminated: 'bg-muted text-muted-foreground border-border',
}

export const FutureRoundsForecaster: React.FC = () => {
  // Forecast bucketing — purely illustrative; clearly labelled as forecast
  const forecast = {
    fastTrack: CANDIDATES.filter((c) => ['hawk', 'sqisign', 'faest', 'mqom'].includes(c.id)),
    extended: CANDIDATES.filter((c) => ['uov', 'mayo', 'qr-uov', 'snova'].includes(c.id)),
    monitoring: CANDIDATES.filter((c) => ['sdith'].includes(c.id)),
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 border border-status-warning/30 bg-status-warning/5">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/85 leading-relaxed">
            <strong className="text-status-warning">Forecast, not commitment.</strong> NIST IR 8528
            signals expected timelines and the most-mature candidates. The numbers below are
            illustrative — actual standardisation cadence depends on Round 3 cryptanalysis,
            reparameterisation outcomes, and international body alignment.
          </p>
        </div>
      </div>

      {/* Phased timeline */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Clock size={16} className="text-primary" /> Standardisation cadence
        </h3>
        <div className="space-y-2">
          {PHASES.map((p) => (
            <div key={p.id} className="rounded-md border border-border bg-card/50 p-3">
              <div className="text-sm font-semibold text-foreground mb-1">{p.label}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-candidate bucketing */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Compass size={16} className="text-primary" /> Where each candidate sits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ForecastBucket
            label="Fast-track to 2027"
            tone="border-status-success/40 bg-status-success/5 text-status-success"
            items={forecast.fastTrack}
            hint="Most-mature parameter sets; expected to reach draft FIPS earliest."
          />
          <ForecastBucket
            label="Extended track"
            tone="border-status-warning/40 bg-status-warning/5 text-status-warning"
            items={forecast.extended}
            hint="Needs another evaluation round to settle post-wedge-attack parameters."
          />
          <ForecastBucket
            label="Continued monitoring"
            tone="border-status-info/40 bg-status-info/5 text-status-info"
            items={forecast.monitoring}
            hint="Conservative foundation; analysis ongoing, no rush to standardise."
          />
        </div>
      </div>

      {/* KEM history rationale */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <GitBranch size={16} className="text-primary" /> The KEM track tells the future
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The KEM standardisation already shows the pattern: a primary winner (ML-KEM, lattice), an
          alternate added years later (HQC, code-based, March 2025), schemes kept in monitoring
          (Classic McEliece, FrodoKEM), and casualties of cryptanalysis (SIKE). Expect the same
          shape for signatures.
        </p>
        <div className="space-y-2">
          {KEM_HISTORY.map((entry) => (
            <div
              key={entry.name}
              className="rounded-md border border-border bg-card/40 p-3 flex items-start gap-3 flex-wrap"
            >
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-semibold text-foreground">
                  {entry.name}{' '}
                  <span className="text-xs text-muted-foreground italic">({entry.family})</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-1">{entry.summary}</p>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${KEM_OUTCOME_TONE[entry.outcome]}`}
              >
                {entry.outcome}
                {entry.finalName ? ` · ${entry.finalName}` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ForecastBucket: React.FC<{
  label: string
  tone: string
  items: typeof CANDIDATES
  hint: string
}> = ({ label, tone, items, hint }) => (
  <div className={`rounded-lg border ${tone} p-3 space-y-2`}>
    <div className="text-sm font-bold">{label}</div>
    <p className="text-xs text-muted-foreground italic leading-snug">{hint}</p>
    <div className="space-y-1">
      {items.map((c) => (
        <div key={c.id} className="text-xs">
          <span className="font-semibold text-foreground">{c.name}</span>{' '}
          <span className="text-muted-foreground">— {FAMILIES[c.family].label}</span>
        </div>
      ))}
    </div>
  </div>
)
