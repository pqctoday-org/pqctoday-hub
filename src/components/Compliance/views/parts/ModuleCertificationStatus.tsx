// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Link } from 'react-router'
import { ShieldCheck, AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react'
import type { ComplianceRecord } from '../../types'
import {
  isCurrentRecord,
  isNistValidationType,
  isSecurityTargetType,
  pqcCoverageState,
  pqcNames,
} from '../../recordSemantics'

interface Props {
  /** Cert records from useComplianceRefresh / the compliance service. */
  records: readonly ComplianceRecord[]
}

/**
 * Module-level certification status panel (P11-P1-05).
 *
 * Surfaces the FIPS 140-3 / NIST CAVP / CC / CSPN snapshot from
 * compliance-data.json as a small "where the industry is" summary so a
 * developer can see how many crypto modules already carry PQC validation and
 * how many don't — without scrolling the full records table.
 *
 * Counts CURRENT records only (Active / Validated): a Historical, Revoked or
 * Archived certificate is not a current validation. "Validated" tiles count
 * NIST records only (FIPS 140-3 Approved Algorithms list, CAVP validations);
 * a PQC algorithm merely named in a CC / EUCC / CSPN Security Target is
 * reported separately, never as validated. pqcCoverage '' (page not read) is
 * unknown, not classical-only.
 *
 * Computes counts client-side from the records the caller already loaded; no
 * extra fetch.
 */
export const ModuleCertificationStatus: React.FC<Props> = ({ records }) => {
  const counts = useMemo(() => computeCounts(records), [records])

  // Empty data → render nothing (compliance service may still be loading).
  if (counts.total === 0) return null

  const pqcPct = counts.nistTotal > 0 ? Math.round((counts.pqc / counts.nistTotal) * 100) : 0

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
          Current FIPS 140-3 / NIST CAVP / CC / CSPN records in the published snapshot
        </span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Current records" value={counts.total.toLocaleString()} tone="muted" />
        <Tile
          label="PQC in NIST validation"
          value={counts.pqc.toLocaleString()}
          tone="success"
          accent={`${pqcPct}% of NIST`}
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
          {counts.noPqc.toLocaleString()} records list no PQC algorithm
          {counts.unanalyzed > 0 && (
            <> · {counts.unanalyzed.toLocaleString()} not read / not yet analyzed for PQC</>
          )}
          {counts.stNamed > 0 && (
            <>
              {' '}
              · {counts.stNamed.toLocaleString()} CC / EUCC / CSPN records name PQC in their
              Security Target (not a validation)
            </>
          )}{' '}
          — if your dependency tree includes classical-only modules, the CI gate above will trip.
          Browse the full Records tab to find your exact upstream.
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
  nistTotal: number
  stNamed: number
  pqc: number
  noPqc: number
  unanalyzed: number
  mlkem: number
  mldsa: number
  slhdsa: number
  lms: number
}

function computeCounts(records: readonly ComplianceRecord[]): CertCounts {
  const c: CertCounts = {
    total: 0,
    nistTotal: 0,
    stNamed: 0,
    pqc: 0,
    noPqc: 0,
    unanalyzed: 0,
    mlkem: 0,
    mldsa: 0,
    slhdsa: 0,
    lms: 0,
  }
  for (const r of records) {
    if (!isCurrentRecord(r)) continue
    c.total++
    const nist = isNistValidationType(r.type)
    if (nist) c.nistTotal++
    const state = pqcCoverageState(r.pqcCoverage)
    if (state === 'none') {
      c.noPqc++
      continue
    }
    if (state !== 'named') {
      // '' (page not read), pending, name-match heuristics, bare booleans.
      c.unanalyzed++
      continue
    }
    if (!nist) {
      if (isSecurityTargetType(r.type)) c.stNamed++
      continue
    }
    c.pqc++
    const cov = pqcNames(r.pqcCoverage).join(', ')
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
