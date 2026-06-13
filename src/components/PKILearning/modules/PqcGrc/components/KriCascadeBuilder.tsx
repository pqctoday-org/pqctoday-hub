// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { Button } from '@/components/ui/button'
import { ExportableArtifact } from '../../../common/executive'
import { KRIS, KRI_LEVELS, type Kri, type KriLevel, type KriStatus } from '../data/grcData'

const MODULE_ID = 'pqc-grc'

const LEVEL_ORDER: KriLevel[] = ['board', 'ciso', 'operational']

const STATUS_CYCLE: KriStatus[] = ['green', 'amber', 'red']

function cycleStatus(current: KriStatus): KriStatus {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

function statusColor(status: KriStatus): string {
  switch (status) {
    case 'green':
      return 'bg-status-success/20 text-status-success border-status-success/40'
    case 'amber':
      return 'bg-status-warning/20 text-status-warning border-status-warning/40'
    case 'red':
      return 'bg-status-error/20 text-status-error border-status-error/40'
  }
}

function statusLabel(status: KriStatus): string {
  switch (status) {
    case 'green':
      return 'On track'
    case 'amber':
      return 'Watch'
    case 'red':
      return 'Breach'
  }
}

/** Seed every KRI at its canonical cascade level and a green status, so the
 *  learner refines rather than starts from a blank grid. */
function buildSeed(): { levelOf: Record<string, KriLevel>; statusOf: Record<string, KriStatus> } {
  const levelOf: Record<string, KriLevel> = {}
  const statusOf: Record<string, KriStatus> = {}
  for (const k of KRIS) {
    levelOf[k.id] = k.level
    statusOf[k.id] = 'green'
  }
  return { levelOf, statusOf }
}

export const KriCascadeBuilder: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const seed = useMemo(() => buildSeed(), [])
  const [levelOf, setLevelOf] = useState<Record<string, KriLevel>>(seed.levelOf)
  const [statusOf, setStatusOf] = useState<Record<string, KriStatus>>(seed.statusOf)

  const krisByLevel = useMemo(() => {
    const map: Record<KriLevel, Kri[]> = { board: [], ciso: [], operational: [] }
    for (const k of KRIS) map[levelOf[k.id]].push(k)
    return map
  }, [levelOf])

  // Validation: a level with no KRIs is an incomplete cascade; a board KRI left
  // red means the board's intervention threshold is tripped and must be flagged.
  const emptyLevels = useMemo(
    () => LEVEL_ORDER.filter((lvl) => krisByLevel[lvl].length === 0),
    [krisByLevel]
  )
  const boardReds = useMemo(
    () => krisByLevel.board.filter((k) => statusOf[k.id] === 'red'),
    [krisByLevel, statusOf]
  )

  const setLevel = useCallback((id: string, level: KriLevel) => {
    setLevelOf((prev) => ({ ...prev, [id]: level }))
  }, [])

  const toggleStatus = useCallback((id: string) => {
    setStatusOf((prev) => ({ ...prev, [id]: cycleStatus(prev[id]) }))
  }, [])

  const exportMarkdown = useMemo(() => {
    let md = '# PQC GRC — KRI Cascade Dashboard\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    for (const lvl of LEVEL_ORDER) {
      const meta = KRI_LEVELS[lvl]
      md += `## ${meta.label} (${meta.cadence})\n\n`
      md += `_${meta.audience} — ${meta.question}_\n\n`
      const rows = krisByLevel[lvl]
      if (rows.length === 0) {
        md += '_No KRIs assigned to this level._\n\n'
        continue
      }
      md += '| KRI | Status | Answers | Threshold |\n'
      md += '|-----|--------|---------|----------|\n'
      for (const k of rows) {
        md += `| ${k.name} | ${statusLabel(statusOf[k.id])} | ${k.answers} | ${k.threshold} |\n`
      }
      md += '\n'
    }
    if (boardReds.length > 0) {
      md += `> **Board intervention flagged:** ${boardReds.map((k) => k.name).join(', ')}.\n`
    }
    return md
  }, [krisByLevel, statusOf, boardReds])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `kri-cascade-${Date.now()}`,
      moduleId: MODULE_ID,
      type: 'kpi-dashboard',
      title: 'PQC GRC — KRI Cascade Dashboard',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Assign each Key Risk Indicator to a cascade level and set its current status. Use the level
        buttons to move a KRI between board, CISO, and operational reporting; click the status pill
        to cycle on track &rarr; watch &rarr; breach. Every level needs at least one indicator, and
        a board KRI in breach trips the board-intervention threshold.
      </p>

      <div className="space-y-5">
        {LEVEL_ORDER.map((lvl) => {
          const meta = KRI_LEVELS[lvl]
          const rows = krisByLevel[lvl]
          return (
            <div key={lvl} className="glass-panel p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-base font-bold text-gradient">{meta.label}</h3>
                <span className="text-[11px] text-muted-foreground">
                  {meta.audience} &mdash; {meta.cadence}
                </span>
              </div>
              {rows.length === 0 ? (
                <p className="text-xs text-status-warning">No KRIs assigned to this level.</p>
              ) : (
                <ul className="space-y-2">
                  {rows.map((k) => (
                    <li
                      key={k.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 bg-muted/40 rounded-lg p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{k.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {k.threshold}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => toggleStatus(k.id)}
                        aria-label={`${k.name} status: ${statusLabel(statusOf[k.id])}. Click to cycle.`}
                        className={`text-xs font-bold rounded border px-2 py-1 min-h-[32px] min-w-[88px] focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusColor(statusOf[k.id])}`}
                      >
                        {statusLabel(statusOf[k.id])}
                      </Button>
                      <div
                        className="flex gap-1"
                        role="group"
                        aria-label={`Reassign ${k.name} level`}
                      >
                        {LEVEL_ORDER.map((target) => (
                          <Button
                            key={target}
                            variant="ghost"
                            type="button"
                            onClick={() => setLevel(k.id, target)}
                            aria-pressed={levelOf[k.id] === target}
                            aria-label={`Move ${k.name} to ${KRI_LEVELS[target].label}`}
                            className={`text-[10px] font-bold rounded border px-2 py-1 min-h-[32px] uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                              levelOf[k.id] === target
                                ? 'bg-primary/20 text-primary border-primary/40'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            {target === 'board' ? 'Brd' : target === 'ciso' ? 'CISO' : 'Ops'}
                          </Button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {emptyLevels.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-sm">
          <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Incomplete cascade</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each level needs at least one KRI so every audience has indicators at its cadence.
              Empty: {emptyLevels.map((l) => KRI_LEVELS[l].label).join(', ')}.
            </p>
          </div>
        </div>
      )}
      {boardReds.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-sm">
          <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Board intervention threshold tripped</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A board-level KRI in breach requires board notification, not just a SteerCo review:{' '}
              {boardReds.map((k) => k.name).join(', ')}.
            </p>
          </div>
        </div>
      )}

      <ExportableArtifact
        title="KRI Cascade Export"
        exportData={exportMarkdown}
        filename="pqc-grc-kri-cascade"
        formats={['markdown', 'pdf']}
        onExport={handleExport}
        wideTable
      >
        <p className="text-sm text-muted-foreground">
          Export the three-level cascade as a board-ready dashboard and save it to your learning
          portfolio.
        </p>
      </ExportableArtifact>
    </div>
  )
}
