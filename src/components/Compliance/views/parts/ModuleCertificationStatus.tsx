// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react'
import type { ComplianceRecord } from '../../types'

interface Props {
  /** Cert records from useComplianceRefresh / the compliance service. */
  records: readonly ComplianceRecord[]
}

/**
 * Module-level certification status panel (P11-P1-05).
 *
 * Surfaces the FIPS / ACVP / CC landscape from compliance-data.json as a small
 * "where the industry is" summary so a developer can see how many crypto
 * modules already carry PQC validation and how many don't — without scrolling
 * the full records table.
 *
 * Computes counts client-side from the records the caller already loaded; no
 * extra fetch.
 */
export const ModuleCertificationStatus: React.FC<Props> = ({ records }) => {
  const counts = useMemo(() => computeCounts(records), [records])

  // Empty data → render nothing (compliance service may still be loading).
  if (counts.total === 0) return null

  const pqcPct = counts.total > 0 ? Math.round((counts.pqc / counts.total) * 100) : 0

  return (
    <section
      data-section-id="developer-module-cert-status"
      className="glass-panel p-4 space-y-3 scroll-mt-20"
      aria-label="Crypto module certification status"
    >
      <header className="flex items-center gap-2 flex-wrap">
        <ShieldCheck size={16} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Module certification landscape</h3>
        <span className="text-xs text-muted-foreground">
          FIPS 140-3 / ACVP / CC records across the public registries
        </span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Modules tracked" value={counts.total.toLocaleString()} tone="muted" />
        <Tile
          label="With PQC support"
          value={counts.pqc.toLocaleString()}
          tone="success"
          accent={`${pqcPct}%`}
        />
        <Tile label="ML-KEM validated" value={counts.mlkem.toLocaleString()} tone="primary" />
        <Tile label="ML-DSA validated" value={counts.mldsa.toLocaleString()} tone="primary" />
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
        <AlertTriangle
          size={12}
          className="text-status-warning shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p>
          {counts.noPqc.toLocaleString()} modules in the registry still ship classical-only crypto —
          if your dependency tree includes any of them, the CI gate above will trip when you wire it
          in. Browse the full Records tab to find your exact upstream.
        </p>
      </div>

      <Link
        to="/compliance?tab=records"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        Open the Records tab
        <ArrowRight size={12} aria-hidden="true" />
        <ExternalLink size={10} aria-hidden="true" />
      </Link>
    </section>
  )
}

interface CertCounts {
  total: number
  pqc: number
  noPqc: number
  mlkem: number
  mldsa: number
  slhdsa: number
  lms: number
}

function computeCounts(records: readonly ComplianceRecord[]): CertCounts {
  const c: CertCounts = { total: 0, pqc: 0, noPqc: 0, mlkem: 0, mldsa: 0, slhdsa: 0, lms: 0 }
  for (const r of records) {
    c.total++
    const cov = typeof r.pqcCoverage === 'string' ? r.pqcCoverage : ''
    if (!cov || /no pqc/i.test(cov)) {
      c.noPqc++
      continue
    }
    c.pqc++
    if (/ML-KEM/i.test(cov)) c.mlkem++
    if (/ML-DSA/i.test(cov)) c.mldsa++
    if (/SLH-DSA/i.test(cov)) c.slhdsa++
    if (/\bLMS\b/i.test(cov)) c.lms++
  }
  return c
}

type Tone = 'muted' | 'success' | 'primary'

const TONE_CLASS: Record<Tone, { wrap: string; value: string; label: string }> = {
  muted: {
    wrap: 'border-border bg-card/40',
    value: 'text-foreground',
    label: 'text-muted-foreground',
  },
  success: {
    wrap: 'border-status-success/30 bg-status-success/5',
    value: 'text-status-success',
    label: 'text-muted-foreground',
  },
  primary: {
    wrap: 'border-primary/30 bg-primary/5',
    value: 'text-primary',
    label: 'text-muted-foreground',
  },
}

function Tile({
  label,
  value,
  tone,
  accent,
}: {
  label: string
  value: string
  tone: Tone
  accent?: string
}) {
  // eslint-disable-next-line security/detect-object-injection
  const cls = TONE_CLASS[tone]
  return (
    <div className={`rounded-lg border p-3 ${cls.wrap}`}>
      <p className={`text-[10px] uppercase tracking-wider ${cls.label}`}>{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <p className={`text-xl font-bold tabular-nums ${cls.value}`}>{value}</p>
        {accent && (
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {accent}
          </span>
        )}
      </div>
    </div>
  )
}
