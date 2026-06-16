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
 * For each seeded refresh program the user records the next scheduled refresh year
 * and the concrete PQC task to embed into that refresh. Emits a downloadable
 * markdown artifact and saves it to the Command Center, like the other tools.
 */
import React, { useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'

/** Fixed labels for the org's typically already-funded refresh programs. */
const SEED_PROGRAM_NAMES = [
  'Data center hardware',
  'SD-WAN / network',
  'Cloud platform',
  'PKI / certificate platform',
  'HSM replacement',
  'Vendor / license renewal',
  'Application modernization',
] as const

interface RefreshRow {
  programName: string
  nextRefreshYear: string
  pqcTaskToEmbed: string
}

interface RefreshState {
  planningHorizonYears: string
  rows: RefreshRow[]
}

function buildMarkdown(s: RefreshState): string {
  const lines: string[] = []
  lines.push('# Refresh-Cycle Alignment')
  lines.push('')
  lines.push(
    'Embedding PQC migration tasks into already-funded infrastructure refresh ' +
      `programs (planning horizon: ${s.planningHorizonYears.trim() || '_(TBD)_'} years) ` +
      'so the work rides existing budgets — cost avoidance, not net-new spend.'
  )
  lines.push('')
  lines.push('| Refresh program | Next refresh | PQC task to embed |')
  lines.push('|---|---|---|')
  for (const row of s.rows) {
    const program = row.programName.trim() || '_(unnamed)_'
    const year = row.nextRefreshYear.trim() || '_(TBD)_'
    const task = row.pqcTaskToEmbed.trim() || '_(not yet defined)_'
    lines.push(`| ${program} | ${year} | ${task} |`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('*Aligned to the Applied Quantum Phase 4 (Roadmap & Governance) Activity 4.3.*')
  return lines.join('\n')
}

export const RefreshCycleAlignment: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const [state, setState] = useState<RefreshState>(() => ({
    planningHorizonYears: '3',
    rows: SEED_PROGRAM_NAMES.map((programName) => ({
      programName,
      nextRefreshYear: '',
      pqcTaskToEmbed: '',
    })),
  }))

  const set = <K extends keyof RefreshState>(key: K, value: RefreshState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const setRow = (index: number, field: keyof RefreshRow, value: string) =>
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }))

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])

  const rowCount = state.rows.length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <CalendarClock size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Refresh-Cycle Alignment</h2>
          <p className="text-sm text-muted-foreground">
            Phase 4 — Roadmap &amp; Governance (Activity 4.3). Map PQC migration tasks onto your
            already-funded infrastructure refresh programs so the work rides existing budgets.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Planning horizon</h3>
        <div className="block">
          <label htmlFor="refresh-horizon" className="text-xs font-medium text-muted-foreground">
            Planning horizon (years)
          </label>
          <Input
            id="refresh-horizon"
            className="mt-1"
            value={state.planningHorizonYears}
            onChange={(e) => set('planningHorizonYears', e.target.value)}
            placeholder="e.g. 3"
          />
        </div>
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
          {state.rows.map((row, i) => (
            <div
              key={row.programName}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
            >
              <div className="block">
                <span className="text-xs font-medium text-muted-foreground">Refresh program</span>
                <p className="mt-1 text-sm font-medium text-foreground">{row.programName}</p>
              </div>
              <div className="block">
                <label
                  htmlFor={`refresh-year-${i}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Next refresh
                </label>
                <Input
                  id={`refresh-year-${i}`}
                  className="mt-1"
                  value={row.nextRefreshYear}
                  onChange={(e) => setRow(i, 'nextRefreshYear', e.target.value)}
                  placeholder="e.g. 2027"
                />
              </div>
              <div className="block">
                <label
                  htmlFor={`refresh-task-${i}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  PQC task to embed
                </label>
                <Input
                  id={`refresh-task-${i}`}
                  className="mt-1"
                  value={row.pqcTaskToEmbed}
                  onChange={(e) => setRow(i, 'pqcTaskToEmbed', e.target.value)}
                  placeholder="e.g. Swap to PQC-capable load balancers"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <ExportableArtifact
        title="Refresh-Cycle Alignment — Export"
        exportData={exportMarkdown}
        filename="refresh-cycle-alignment"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `refresh-cycle-alignment-${Date.now()}`,
            moduleId: 'migration-program',
            type: 'refresh-cycle-alignment',
            title: `Refresh-Cycle Alignment — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              rowCount,
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
