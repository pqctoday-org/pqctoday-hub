// SPDX-License-Identifier: GPL-3.0-only
/**
 * Data-at-Rest Strategy — Phase 5 Activity 5.6 Command Center gap-closer.
 *
 * Captures the per-data-store data-at-rest decision the framework's Phase 5
 * expects: for every store holding harvest-now-decrypt-later-exposed data,
 * pick one of five remediation strategies — re-encrypt under PQC keys, wrap
 * existing data keys under a PQC KEK (KEK/DEK), crypto-shred, delete, or
 * accept & monitor. Backups and archives are called out as their own line so
 * cold copies are not silently inherited from the live store decision.
 *
 * Emits a downloadable markdown artifact (a | Data store | Strategy | Notes |
 * table) and saves it to the Command Center, recording the chosen strategy per
 * store so it can be carried into the CBOM, like the other Phase-5 tools.
 */
import React, { useMemo, useState } from 'react'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'

/** The five data-at-rest remediation strategies offered per store. */
const STRATEGY_OPTIONS = [
  'Re-encrypt under PQC keys',
  'PQC key-wrap (KEK/DEK)',
  'Crypto-shred',
  'Delete',
  'Accept & monitor',
] as const
type Strategy = (typeof STRATEGY_OPTIONS)[number]

interface StoreRow {
  id: string
  name: string
  strategy: Strategy
  note: string
}

interface DataAtRestState {
  stores: StoreRow[]
}

const newId = (): string => `store-${Math.random().toString(36).slice(2, 9)}`

const SEED_STORES: StoreRow[] = [
  { id: newId(), name: 'Customer PII database', strategy: 'Re-encrypt under PQC keys', note: '' },
  { id: newId(), name: 'Backups & archives', strategy: 'PQC key-wrap (KEK/DEK)', note: '' },
  { id: newId(), name: 'Document store', strategy: 'PQC key-wrap (KEK/DEK)', note: '' },
  { id: newId(), name: 'Analytics warehouse', strategy: 'Accept & monitor', note: '' },
]

function buildMarkdown(s: DataAtRestState): string {
  const lines: string[] = []
  lines.push('# Data-at-Rest Strategy')
  lines.push('')
  lines.push(
    'Per-data-store remediation decision for cryptographically protected data at rest. ' +
      'For each store holding data with a long confidentiality lifetime (harvest-now, ' +
      'decrypt-later exposure), one strategy is chosen below.'
  )
  lines.push('')
  lines.push('| Data store | Strategy | Notes |')
  lines.push('|---|---|---|')
  for (const row of s.stores) {
    const name = row.name.trim() || '_(unnamed store)_'
    const note = row.note.trim() || '—'
    lines.push(`| ${name} | ${row.strategy} | ${note} |`)
  }
  lines.push('')
  lines.push(
    '> **Backups & archives:** give cold copies their own line above — they are not ' +
      'automatically covered by the live-store decision and often outlive it.'
  )
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(
    '*Aligned to Applied Quantum Phase 5 Activity 5.6 (Data-at-Rest Strategy). ' +
      'Record the chosen strategy per store in the CBOM.*'
  )
  return lines.join('\n')
}

export const DataAtRestStrategy: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const [state, setState] = useState<DataAtRestState>(() => ({
    stores: SEED_STORES.map((row) => ({ ...row })),
  }))

  const setStore = (id: string, patch: Partial<StoreRow>) =>
    setState((prev) => ({
      ...prev,
      stores: prev.stores.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }))

  const addStore = () =>
    setState((prev) => ({
      ...prev,
      stores: [...prev.stores, { id: newId(), name: '', strategy: 'Accept & monitor', note: '' }],
    }))

  const removeStore = (id: string) =>
    setState((prev) => ({
      ...prev,
      stores: prev.stores.filter((row) => row.id !== id),
    }))

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])

  const storeCount = state.stores.length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <Database size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Data-at-Rest Strategy</h2>
          <p className="text-sm text-muted-foreground">
            Phase 5 — Activity 5.6. Decide a per-data-store data-at-rest strategy: re-encrypt under
            PQC keys, PQC key-wrap (KEK/DEK), crypto-shred, delete, or accept &amp; monitor.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Data stores · {storeCount} store{storeCount === 1 ? '' : 's'}
        </h3>
        <p className="text-xs text-muted-foreground">
          Give backups &amp; archives their own line — cold copies are not covered by the live-store
          decision and often outlive it.
        </p>

        <div className="space-y-4">
          {state.stores.map((row) => (
            <div key={row.id} className="glass-panel border border-border rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="block">
                  <label
                    htmlFor={`store-name-${row.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Data store
                  </label>
                  <Input
                    id={`store-name-${row.id}`}
                    className="mt-1"
                    value={row.name}
                    onChange={(e) => setStore(row.id, { name: e.target.value })}
                    placeholder="e.g. Customer PII database"
                  />
                </div>
                <div className="block">
                  <label
                    htmlFor={`store-note-${row.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Note (optional)
                  </label>
                  <Input
                    id={`store-note-${row.id}`}
                    className="mt-1"
                    value={row.note}
                    onChange={(e) => setStore(row.id, { note: e.target.value })}
                    placeholder="e.g. 7-yr retention, regulated"
                  />
                </div>
              </div>

              <div className="block" role="group" aria-label="Data-at-rest strategy">
                <span className="text-xs font-medium text-muted-foreground">Strategy</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {STRATEGY_OPTIONS.map((opt) => {
                    const on = row.strategy === opt
                    return (
                      <Button
                        key={opt}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setStore(row.id, { strategy: opt })}
                        aria-pressed={on}
                        className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                          on
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {opt}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStore(row.id)}
                  className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:bg-muted/50"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addStore}
          className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:bg-muted/50"
        >
          + Add data store
        </Button>
      </section>

      <ExportableArtifact
        title="Data-at-Rest Strategy — Export"
        exportData={exportMarkdown}
        filename="data-at-rest-strategy"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `data-at-rest-strategy-${Date.now()}`,
            moduleId: 'database-encryption-pqc',
            type: 'data-at-rest-strategy',
            title: `Data-at-Rest Strategy — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              storeCount,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this strategy to your Command Center, or export as markdown / PDF / Word. Record the
          chosen strategy per store in the CBOM (Applied Quantum Phase 5 Activity 5.6).
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default DataAtRestStrategy
