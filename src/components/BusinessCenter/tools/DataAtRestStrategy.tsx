// SPDX-License-Identifier: GPL-3.0-only
/**
 * Data-at-Rest Strategy — Phase 5 Activity 5.6 Command Center gap-closer.
 *
 * Captures the per-data-store data-at-rest decision the framework's Phase 5
 * expects: for every store holding harvest-now-decrypt-later-exposed data,
 * pick one of five remediation strategies — re-encrypt with a fresh AES-256 key
 * wrapped by a PQC KEK, re-wrap the existing data key under a PQC KEK (KEK/DEK),
 * crypto-shred, delete, or accept & monitor. Bulk data stays AES-256 (quantum-
 * resistant); PQC enters only at the key-wrapping layer. Backups and archives
 * are called out as their own line so cold copies are not silently inherited
 * from the live store decision.
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
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'

/** The five data-at-rest remediation strategies offered per store. Bulk data
 *  stays AES-256 in every case; PQC applies at the key-wrap (KEK) layer. */
export const STRATEGY_OPTIONS = [
  'Re-encrypt with fresh AES-256 DEK (PQC-wrapped KEK)',
  'Re-wrap existing DEK under PQC KEK',
  'Crypto-shred',
  'Delete',
  'Accept & monitor',
] as const
export type Strategy = (typeof STRATEGY_OPTIONS)[number]

/** Confidentiality horizon / sensitivity — the framework drives strategy choice
 *  off how long the data must stay confidential, its volume, and exfiltration
 *  exposure. This is the coarse per-store proxy for that. */
const SENSITIVITY_OPTIONS = ['Low', 'Medium', 'High'] as const
type Sensitivity = (typeof SENSITIVITY_OPTIONS)[number]

export interface StoreRow {
  id: string
  name: string
  strategy: Strategy
  sensitivity: Sensitivity
  note: string
}

export interface DataAtRestState {
  stores: StoreRow[]
}

const newId = (): string => `store-${Math.random().toString(36).slice(2, 9)}`

const SEED_STORES: StoreRow[] = [
  {
    id: newId(),
    name: 'Customer PII database',
    strategy: 'Re-encrypt with fresh AES-256 DEK (PQC-wrapped KEK)',
    sensitivity: 'High',
    note: '',
  },
  {
    id: newId(),
    name: 'Backups & archives',
    strategy: 'Re-wrap existing DEK under PQC KEK',
    sensitivity: 'High',
    note: '',
  },
  {
    id: newId(),
    name: 'Document store',
    strategy: 'Re-wrap existing DEK under PQC KEK',
    sensitivity: 'Medium',
    note: '',
  },
  {
    id: newId(),
    name: 'Analytics warehouse',
    strategy: 'Accept & monitor',
    sensitivity: 'Low',
    note: '',
  },
]

function isValidStoreRows(rows: unknown): rows is StoreRow[] {
  return (
    Array.isArray(rows) &&
    rows.every(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof (r as StoreRow).id === 'string' &&
        typeof (r as StoreRow).name === 'string'
    )
  )
}

export function buildMarkdown(s: DataAtRestState): string {
  const lines: string[] = []
  lines.push('# Data-at-Rest Strategy')
  lines.push('')
  lines.push(
    'Per-data-store remediation decision for cryptographically protected data at rest. ' +
      'For each store holding data with a long confidentiality lifetime (harvest-now, ' +
      'decrypt-later exposure), one strategy is chosen below.'
  )
  lines.push('')
  lines.push(
    '> **Why most data-at-rest is lower-urgency:** bulk encryption stays AES-256, which ' +
      "Grover's algorithm only weakens to a ~128-bit effective level (still safe per NIST IR 8547 " +
      '— currently an Initial Public Draft, not yet finalized). Post-quantum risk concentrates at ' +
      'the *key-wrapping* layer, so these strategies swap the KEK to ML-KEM rather than replacing ' +
      'the AES-256 data cipher.'
  )
  lines.push('')
  lines.push('| Data store | Sensitivity | Strategy | Notes |')
  lines.push('|---|---|---|---|')
  for (const row of s.stores) {
    const name = row.name.trim() || '_(unnamed store)_'
    const note = row.note.trim() || '—'
    lines.push(`| ${name} | ${row.sensitivity} | ${row.strategy} | ${note} |`)
  }
  lines.push('')
  lines.push(
    '> **Backups & archives:** give cold copies their own line above — they are not ' +
      'automatically covered by the live-store decision and often outlive it.'
  )
  lines.push('')
  lines.push(
    '> **Delete / Crypto-shred:** carry out per NIST SP 800-88 (*Guidelines for Media ' +
      'Sanitization*) so destruction of the key material or data is verifiable, not just a delete call.'
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
  const savedInputs = useSavedArtifactInputs<DataAtRestState>('data-at-rest-strategy')
  // Restore the user's last-saved strategy so it round-trips across visits.
  const [state, setState] = useState<DataAtRestState>(() => {
    if (isValidStoreRows(savedInputs?.stores)) {
      return { stores: savedInputs.stores }
    }
    return { stores: SEED_STORES.map((row) => ({ ...row })) }
  })

  const setStore = (id: string, patch: Partial<StoreRow>) =>
    setState((prev) => ({
      ...prev,
      stores: prev.stores.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }))

  const addStore = () =>
    setState((prev) => ({
      ...prev,
      stores: [
        ...prev.stores,
        { id: newId(), name: '', strategy: 'Accept & monitor', sensitivity: 'Medium', note: '' },
      ],
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
            Phase 5 — Activity 5.6. Decide a per-data-store strategy: re-wrap the AES-256 key under
            an ML-KEM (PQC) KEK, write a fresh AES-256 DEK with a PQC-wrapped KEK, crypto-shred,
            delete, or accept &amp; monitor. Bulk data stays AES-256 (Grover only halves it to
            ~128-bit — still quantum-safe per NIST IR 8547, currently an Initial Public Draft, not
            yet finalized); PQC protects the key, not the cipher.
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

              <div
                className="block"
                role="group"
                aria-label="Confidentiality horizon / sensitivity"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  Confidentiality horizon / sensitivity
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Strategy choice should track how long this data must stay confidential, its
                  volume, and its exfiltration exposure — not just what&apos;s convenient.
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {SENSITIVITY_OPTIONS.map((opt) => {
                    const on = row.sensitivity === opt
                    return (
                      <Button
                        key={opt}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setStore(row.id, { sensitivity: opt })}
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
                <p className="text-[11px] text-muted-foreground mt-1">
                  Delete and Crypto-shred should be carried out per NIST SP 800-88 (
                  <em>Guidelines for Media Sanitization</em>) so destruction is verifiable.
                </p>
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
              ...state,
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
