// SPDX-License-Identifier: GPL-3.0-only
/**
 * Refresh-Cycle Alignment — Phase 4 (Roadmap & Governance) Activity 4.3 tool.
 *
 * Maps PQC migration tasks onto the organization's ALREADY-FUNDED infrastructure
 * refresh programs (data-center hardware, SD-WAN, cloud, PKI, HSM, vendor/license
 * renewals, application modernization) so PQC work rides existing budgets rather
 * than requesting net-new spend — the "cost avoidance" play from Applied Quantum
 * Phase 4 Activity 4.3.
 *
 * The core of the tool is the ALIGNMENT check: a refresh program only avoids
 * net-new spend if its next refresh lands *within* the planning horizon. A
 * program that refreshes after the horizon is MISALIGNED — you can't ride that
 * budget and must either accelerate the refresh or plan separate spend. The tool
 * flags those so the alignment is actionable, not just a list.
 */
import React, { useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { getCswp39RefForArtifactType } from '@/components/BusinessCenter/businessToolsRegistry'
import { Cswp39SectionBadge } from '@/components/BusinessCenter/widgets/Cswp39SectionBadge'

/** Default already-funded refresh programs the user can edit, add to, or remove. */
export const SEED_PROGRAM_NAMES = [
  'Data center hardware',
  'SD-WAN / network',
  'Cloud platform',
  'PKI / certificate platform',
  'HSM replacement',
  'Vendor / license renewal',
  'Application modernization',
] as const

export interface RefreshRow {
  id: string
  programName: string
  nextRefreshYear: string
  pqcTaskToEmbed: string
}

export interface RefreshState {
  planningHorizonYears: string
  rows: RefreshRow[]
}

type SavedRefreshInputs = Partial<RefreshState>

function isValidRows(rows: unknown): rows is RefreshRow[] {
  return (
    Array.isArray(rows) &&
    rows.every(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof (r as RefreshRow).id === 'string' &&
        typeof (r as RefreshRow).programName === 'string'
    )
  )
}

const newId = (): string => `rc-${Math.random().toString(36).slice(2, 9)}`

export type RefreshAlignment = 'aligned' | 'misaligned' | 'unknown'

/**
 * Does this program's next refresh land within the planning horizon? `aligned`
 * = refreshes on/before the horizon end (can ride the budget); `misaligned` =
 * after the horizon (can't); `unknown` = no parseable year. Pure + unit-tested.
 */
export function refreshAlignment(
  nextRefreshYear: string,
  horizonEndYear: number
): RefreshAlignment {
  const y = parseInt(nextRefreshYear, 10)
  if (!Number.isFinite(y)) return 'unknown'
  return y <= horizonEndYear ? 'aligned' : 'misaligned'
}

const ALIGN_MD_LABEL: Record<RefreshAlignment, string> = {
  aligned: 'On budget',
  misaligned: 'After horizon ⚠',
  unknown: 'TBD',
}

export function buildMarkdown(s: RefreshState, horizonEndYear: number): string {
  const lines: string[] = []
  lines.push('# Refresh-Cycle Alignment')
  lines.push('')
  lines.push(
    'Embedding PQC migration tasks into already-funded infrastructure refresh ' +
      `programs (planning horizon: ${s.planningHorizonYears.trim() || '_(TBD)_'} years, ` +
      `through ${Number.isFinite(horizonEndYear) ? horizonEndYear : '_(TBD)_'}) ` +
      'so the work rides existing budgets — cost avoidance, not net-new spend.'
  )
  lines.push('')
  lines.push('| Refresh program | Next refresh | Alignment | PQC task to embed |')
  lines.push('|---|---|---|---|')
  let misaligned = 0
  for (const row of s.rows) {
    const program = row.programName.trim() || '_(unnamed)_'
    const year = row.nextRefreshYear.trim() || '_(TBD)_'
    const task = row.pqcTaskToEmbed.trim() || '_(not yet defined)_'
    const align = refreshAlignment(row.nextRefreshYear, horizonEndYear)
    if (align === 'misaligned') misaligned++
    lines.push(`| ${program} | ${year} | ${ALIGN_MD_LABEL[align]} | ${task} |`)
  }
  lines.push('')
  if (misaligned > 0) {
    lines.push(
      `> **${misaligned} of ${s.rows.length} program${s.rows.length === 1 ? '' : 's'} refresh after the planning horizon** — those can't ride the existing budget. Accelerate the refresh or plan separate PQC spend.`
    )
  } else {
    lines.push(
      '> All dated programs refresh within the planning horizon — PQC work can ride the existing budgets.'
    )
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('*Aligned to the Applied Quantum Phase 4 (Roadmap & Governance) Activity 4.3.*')
  return lines.join('\n')
}

const ALIGN_BADGE: Record<RefreshAlignment, { label: string; cls: string }> = {
  aligned: {
    label: 'On budget',
    cls: 'border-status-success/40 bg-status-success/10 text-status-success',
  },
  misaligned: {
    label: 'After horizon',
    cls: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
  },
  unknown: { label: 'TBD', cls: 'border-border bg-muted text-muted-foreground' },
}

export const RefreshCycleAlignment: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const savedInputs = useSavedArtifactInputs<SavedRefreshInputs>('refresh-cycle-alignment')
  const cswp39Ref = getCswp39RefForArtifactType('refresh-cycle-alignment')
  // Restore the user's last-saved alignment so it round-trips across visits.
  const [state, setState] = useState<RefreshState>(() => {
    if (isValidRows(savedInputs?.rows)) {
      return {
        planningHorizonYears: savedInputs?.planningHorizonYears || '3',
        rows: savedInputs.rows,
      }
    }
    return {
      planningHorizonYears: '3',
      rows: SEED_PROGRAM_NAMES.map((programName) => ({
        id: newId(),
        programName,
        nextRefreshYear: '',
        pqcTaskToEmbed: '',
      })),
    }
  })

  const set = <K extends keyof RefreshState>(key: K, value: RefreshState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const setRow = (id: string, field: keyof RefreshRow, value: string) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }))

  const addRow = () =>
    setState((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        { id: newId(), programName: '', nextRefreshYear: '', pqcTaskToEmbed: '' },
      ],
    }))

  const removeRow = (id: string) =>
    setState((prev) => ({ ...prev, rows: prev.rows.filter((row) => row.id !== id) }))

  const horizonEndYear = useMemo(() => {
    const h = parseInt(state.planningHorizonYears, 10)
    return new Date().getFullYear() + (Number.isFinite(h) ? h : 0)
  }, [state.planningHorizonYears])

  const exportMarkdown = useMemo(
    () => buildMarkdown(state, horizonEndYear),
    [state, horizonEndYear]
  )

  const misalignedCount = useMemo(
    () =>
      state.rows.filter((r) => refreshAlignment(r.nextRefreshYear, horizonEndYear) === 'misaligned')
        .length,
    [state.rows, horizonEndYear]
  )
  const rowCount = state.rows.length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <CalendarClock size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Refresh-Cycle Alignment</h2>
          <p className="text-sm text-muted-foreground">
            Phase 4 — Roadmap &amp; Governance (Activity 4.3)
            {cswp39Ref && (
              <>
                {' '}
                <Cswp39SectionBadge
                  sectionRef={cswp39Ref.sectionRef}
                  subSection={cswp39Ref.subSection}
                />
              </>
            )}
            . Map PQC migration tasks onto your already-funded infrastructure refresh programs so
            the work rides existing budgets.
          </p>
          {/* The strategy had no citation at all, though the standard states it
              directly. Cycle LENGTHS are deliberately not asserted anywhere in
              this tool — every refresh year below is user-entered, because we
              have no citable source for typical cycle lengths and inventing
              plausible ones would be worse than asking. (Audit 2026-08-10, W5.) */}
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            NIST CSWP 39-upd1 §5 names this directly, listing among a crypto-agility strategic
            plan&apos;s key activities the &ldquo;time, cost, and ease to migrate and mitigate in
            accordance with technology refresh cycles.&rdquo;{' '}
            <a
              href="https://doi.org/10.6028/NIST.CSWP.39-upd1"
              target="_blank"
              rel="noopener noreferrer"
              // `underline`, not `hover:underline`: this link sits inside a
              // paragraph, so colour alone is not a sufficient affordance
              // (axe link-in-text-block / WCAG 1.4.1).
              className="text-primary underline"
            >
              Read §5
            </a>
            . Refresh intervals themselves are yours to enter — they vary too much by asset class
            and vendor for this tool to assert a norm.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Planning horizon</h3>
        <div className="block">
          <label htmlFor="refresh-horizon" className="text-xs font-medium text-muted-foreground">
            Planning horizon (years) — programs refreshing after{' '}
            <span className="font-semibold text-foreground">{horizonEndYear}</span> can&apos;t ride
            the budget
          </label>
          <Input
            id="refresh-horizon"
            className="mt-1 max-w-[12rem]"
            inputMode="numeric"
            value={state.planningHorizonYears}
            onChange={(e) => set('planningHorizonYears', e.target.value)}
            placeholder="e.g. 3"
          />
        </div>
        {misalignedCount > 0 && (
          <p className="text-xs text-status-warning">
            ⚠ {misalignedCount} of {rowCount} program{rowCount === 1 ? '' : 's'} refresh after{' '}
            {horizonEndYear} — accelerate the refresh or plan separate PQC spend.
          </p>
        )}
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Refresh programs · {rowCount} program{rowCount === 1 ? '' : 's'}
        </h3>
        <p className="text-xs text-muted-foreground">
          For each already-funded refresh program, record the next scheduled refresh and the
          concrete PQC task to embed into it.
        </p>
        <div className="space-y-3">
          {state.rows.map((row) => {
            const align = refreshAlignment(row.nextRefreshYear, horizonEndYear)
            const badge = ALIGN_BADGE[align]
            return (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1.6fr_auto] gap-3 items-end border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <div className="block">
                  <span className="text-xs font-medium text-muted-foreground">Refresh program</span>
                  <Input
                    className="mt-1"
                    value={row.programName}
                    onChange={(e) => setRow(row.id, 'programName', e.target.value)}
                    placeholder="e.g. Data center hardware"
                    aria-label="Refresh program"
                  />
                </div>
                <div className="block">
                  <span className="text-xs font-medium text-muted-foreground">Next refresh</span>
                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    value={row.nextRefreshYear}
                    onChange={(e) => setRow(row.id, 'nextRefreshYear', e.target.value)}
                    placeholder="e.g. 2027"
                    aria-label="Next refresh year"
                  />
                  <span
                    className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    PQC task to embed
                  </span>
                  <Input
                    className="mt-1"
                    value={row.pqcTaskToEmbed}
                    onChange={(e) => setRow(row.id, 'pqcTaskToEmbed', e.target.value)}
                    placeholder="e.g. Swap to PQC-capable load balancers"
                    aria-label="PQC task to embed"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove program"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:bg-muted/50"
        >
          + Add refresh program
        </Button>
      </section>

      <ExportableArtifact
        title="Refresh-Cycle Alignment — Export"
        exportData={exportMarkdown}
        filename="refresh-cycle-alignment"
        formats={['markdown', 'pdf', 'docx']}
        wideTable
        onExport={() => {
          addExecutiveDocument({
            id: `refresh-cycle-alignment-${Date.now()}`,
            moduleId: 'migration-program',
            type: 'refresh-cycle-alignment',
            title: `Refresh-Cycle Alignment — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              ...state,
              rowCount,
              misalignedCount,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this alignment to your Command Center, or export as markdown / PDF / Word. This is
          the Phase-4 Activity 4.3 cost-avoidance artifact.
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default RefreshCycleAlignment
