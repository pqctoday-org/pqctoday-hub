// SPDX-License-Identifier: GPL-3.0-only
import { Radar, Clock, ShieldAlert } from 'lucide-react'
import type { ThreatData } from '@/data/threatsData'
import { getThreatClass } from './threatClassification'
import { CRQC_ESTIMATES } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

/**
 * Persona-forward exposure hero for /threats. Leads the page with the user's own
 * exposure — how many threats apply to their scoped sector(s), the CRQC consensus
 * window, and a per-sector Mosca migration deadline — so the answer to "what hits
 * MY sector and when must I act?" is above the fold, before the detail panels.
 *
 * Re-composition only: reuses the live class helper + CRQC constants (the same
 * numbers CrqcCapabilityStrip derives). Multi-select aware — the deadline shows
 * the most urgent sector among the scoped set (longest-lived data wins).
 */

const NOW_YEAR = new Date().getFullYear()
const MIGRATION_YEARS = 5 // Y — typical migration runway

/** Per-sector data lifetime (X in Mosca's inequality), inferred from the industry
 *  label. Longer-lived data ⇒ earlier safe-start deadline. */
function sectorDataLifetime(industry: string): number {
  const s = industry.toLowerCase()
  if (/gov|defen|military|national|intelligence/.test(s)) return 25
  if (/aero|space|satellite|avionic/.test(s)) return 25
  if (/health|pharma|medical|hospital|life scien/.test(s)) return 25
  if (/energ|utilit|grid|nuclear|oil|gas/.test(s)) return 20
  if (/auto|vehicle/.test(s)) return 12
  if (/financ|bank|payment|insur|capital market/.test(s)) return 10
  if (/cloud|saas|hosting|datacenter|data center/.test(s)) return 7
  return 10
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-panel p-4 ${className}`}>{children}</div>
)

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
    {children}
  </span>
)

export const SectorExposureHero = ({
  applicable,
  scopedIndustries,
}: {
  applicable: ThreatData[]
  scopedIndustries: string[]
}) => {
  const total = applicable.length
  const critical = applicable.filter((t) => t.criticality === 'Critical').length
  const high = applicable.filter((t) => t.criticality === 'High').length
  let hndl = 0
  let hnfl = 0
  for (const t of applicable) {
    const c = getThreatClass(t)
    if (c === 'hndl' || c === 'both') hndl++
    if (c === 'hnfl' || c === 'both') hnfl++
  }

  // CRQC consensus — same derivation as CrqcCapabilityStrip (median of midpoints).
  const earliest = Math.min(...CRQC_ESTIMATES.map((e) => e.yearLow))
  const latest = Math.max(...CRQC_ESTIMATES.map((e) => e.yearHigh))
  const mids = CRQC_ESTIMATES.map((e) => (e.yearLow + e.yearHigh) / 2).sort((a, b) => a - b)
  const z = Math.round(mids[Math.floor(mids.length / 2)])

  // Per-sector Mosca — most urgent across the scoped sectors (longest data life wins).
  const driver =
    scopedIndustries.length > 0
      ? scopedIndustries.reduce(
          (best, ind) => (sectorDataLifetime(ind) > sectorDataLifetime(best) ? ind : best),
          scopedIndustries[0]
        )
      : null
  const dataLife = driver ? sectorDataLifetime(driver) : 10
  const deadline = z - dataLife - MIGRATION_YEARS
  const rem = deadline - NOW_YEAR
  const urgency = rem < 0 ? 'OVERDUE' : rem <= 2 ? 'CRITICAL' : rem <= 5 ? 'URGENT' : 'PLANNING'
  const urgencyTone =
    urgency === 'OVERDUE' || urgency === 'CRITICAL'
      ? 'text-status-error'
      : urgency === 'URGENT'
        ? 'text-status-warning'
        : 'text-status-success'

  const sectorLabel =
    scopedIndustries.length === 0
      ? 'all sectors'
      : scopedIndustries.length === 1
        ? scopedIndustries[0]
        : `your ${scopedIndustries.length} sectors`

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* A — your sector exposure */}
      <Card>
        <div className="mb-1.5 flex items-center justify-between">
          <Eyebrow>Your sector exposure</Eyebrow>
          <ShieldAlert size={14} className="text-primary" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-foreground tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">
            threat{total === 1 ? '' : 's'} apply to{' '}
            <span className="font-semibold text-foreground">{sectorLabel}</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-status-error/30 bg-status-error/5 px-3 py-2">
            <div className="text-xl font-extrabold text-status-error tabular-nums">{critical}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Critical
            </div>
          </div>
          <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2">
            <div className="text-xl font-extrabold text-status-warning tabular-nums">{high}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">High</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-border pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-secondary" aria-hidden="true" />
            <span className="font-semibold text-foreground">{hndl}</span> decrypt-later
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm bg-status-warning"
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">{hnfl}</span> forge-later
          </span>
        </div>
      </Card>

      {/* B — CRQC capability watch */}
      <Card>
        <div className="mb-1.5 flex items-center justify-between">
          <Eyebrow>CRQC capability watch</Eyebrow>
          <Radar size={14} className="text-status-warning" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-2xl font-extrabold text-status-warning tabular-nums">~{z}</div>
            <div className="text-[10px] text-muted-foreground">
              Z consensus · window {earliest}–{latest} · {CRQC_ESTIMATES.length} sources
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-2xl font-extrabold text-status-error tabular-nums">{earliest}</div>
            <div className="text-[10px] text-muted-foreground">
              earliest credible · {Math.max(0, earliest - NOW_YEAR)}y at the low end
            </div>
          </div>
        </div>
        <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
          When a cryptographically-relevant quantum computer (CRQC) could break today&apos;s
          public-key crypto — the clock your migration races.
        </p>
      </Card>

      {/* C — your migration deadline (Mosca) */}
      <Card>
        <div className="mb-1.5 flex items-center justify-between">
          <Eyebrow>Your migration deadline</Eyebrow>
          <span
            className={`flex items-center gap-1 text-[10px] font-bold uppercase ${urgencyTone}`}
          >
            <Clock size={12} aria-hidden="true" />
            {urgency}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold tabular-nums ${urgencyTone}`}>{deadline}</span>
          <span className="text-xs text-muted-foreground">
            latest safe start for{' '}
            <span className="font-semibold text-foreground">{sectorLabel}</span>
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {rem < 0
            ? `Already past the safe-start line by ${Math.abs(rem)}y — long-lived data may be exposed.`
            : `About ${rem}y of runway before you must have started migrating.`}
        </p>
        <div className="mt-3 border-t border-border pt-2 font-mono text-[11px] text-muted-foreground">
          Z {z} − X {dataLife} − Y {MIGRATION_YEARS} = {deadline}
          <div className="mt-0.5 text-[10px]">
            X = data lifetime, Y = migration time. Mosca&apos;s inequality.
          </div>
        </div>
      </Card>
    </div>
  )
}
