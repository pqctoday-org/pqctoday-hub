// SPDX-License-Identifier: GPL-3.0-only
/**
 * Initial Scoping Assessment — Phase 0 (Executive Mandate) Command Center
 * gap-closer (PHASE-OVERLAY-SPEC.md §6.4).
 *
 * Captures the first-cut scope the framework's Phase 0.5 expects: the top-20
 * in-scope systems, a rough estate-size estimate (cryptographic instances), and
 * the top-10 vendor dependencies. The system + vendor lists are *seedable* from
 * the user's existing /migrate selection and the assessment industry via
 * `useExecutiveModuleData`, so the scoping opens with their context rather than
 * a blank sheet. Emits a downloadable markdown artifact saved under the
 * Governance zone.
 */
import React, { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

const MAX_SYSTEMS = 20
const MAX_VENDORS = 10

interface ScopingState {
  systems: string[]
  vendors: string[]
  estateInstances: string
  seeded: boolean
}

function buildMarkdown(s: ScopingState, industry: string): string {
  const lines: string[] = []
  lines.push('# Initial Scoping Assessment')
  lines.push('')
  lines.push('*Phase 0 — Executive Mandate (initial scoping). First-cut estate boundary.*')
  if (industry) {
    lines.push('')
    lines.push(`Industry context: ${industry}`)
  }
  lines.push('')

  lines.push(`## Top systems in scope (max ${MAX_SYSTEMS})`)
  lines.push('')
  const systems = s.systems.map((v) => v.trim()).filter(Boolean)
  if (systems.length === 0) {
    lines.push('_No systems listed yet._')
  } else {
    systems.forEach((sys, i) => lines.push(`${i + 1}. ${sys}`))
  }
  lines.push('')

  lines.push('## Estate-size estimate')
  lines.push('')
  const instances = s.estateInstances.trim()
  lines.push(`- **Estimated cryptographic instances:** ${instances || '_(TBD)_'}`)
  lines.push(
    '  (keys, certificates, library call-sites, protocol endpoints — a rough order of magnitude)'
  )
  lines.push('')

  lines.push(`## Top vendor dependencies (max ${MAX_VENDORS})`)
  lines.push('')
  const vendors = s.vendors.map((v) => v.trim()).filter(Boolean)
  if (vendors.length === 0) {
    lines.push('_No vendor dependencies listed yet._')
  } else {
    vendors.forEach((v, i) => lines.push(`${i + 1}. ${v}`))
  }
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push(
    '*Aligned to NIST CSWP 39 §5 (Crypto Agility Strategic Plan — scope) and the Applied ' +
      'Quantum Phase 0 initial-scoping step. https://doi.org/10.6028/NIST.CSWP.39*'
  )
  return lines.join('\n')
}

/** Editable text-row list with add/remove, capped at `max` entries. */
function RowList({
  label,
  rows,
  max,
  placeholder,
  onChange,
}: {
  label: string
  rows: string[]
  max: number
  placeholder: string
  onChange: (rows: string[]) => void
}) {
  const setRow = (i: number, value: string) => {
    const next = [...rows]
    next[i] = value
    onChange(next)
  }
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const addRow = () => {
    if (rows.length < max) onChange([...rows, ''])
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">
          {rows.length} / {max}
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-muted-foreground w-5 shrink-0">
              {i + 1}.
            </span>
            <Input
              value={row}
              onChange={(e) => setRow(i, e.target.value)}
              placeholder={placeholder}
              className="h-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeRow(i)}
              aria-label={`Remove row ${i + 1}`}
              className="h-8 px-2 text-muted-foreground"
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={rows.length >= max}
        className="h-7"
      >
        + Add
      </Button>
    </div>
  )
}

export const InitialScopingAssessment: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const { myProducts, industry, totalProducts } = useExecutiveModuleData()

  // Seed systems + vendors from the user's /migrate selection. Systems take the
  // product (software) names; vendors take the distinct vendor ids behind them.
  const seedSystems = useMemo(
    () => myProducts.slice(0, MAX_SYSTEMS).map((p) => p.softwareName),
    [myProducts]
  )
  const seedVendors = useMemo(() => {
    const out: string[] = []
    const seen = new Set<string>()
    for (const p of myProducts) {
      const v = (p.vendorId || '').trim()
      if (v && !seen.has(v)) {
        seen.add(v)
        out.push(v)
      }
      if (out.length >= MAX_VENDORS) break
    }
    return out
  }, [myProducts])

  // Rough estate-size seed: when the user has a /migrate selection we estimate
  // ~12 cryptographic instances per selected product as a starting order of
  // magnitude; otherwise leave blank for the user to enter.
  const seedInstances = useMemo(
    () => (myProducts.length > 0 ? String(myProducts.length * 12) : ''),
    [myProducts.length]
  )

  // The store-backed /migrate selection is available synchronously on first
  // render, so the lazy initializer seeds the scope from it; no re-seed effect
  // needed (and none of the assess data arrives async into an empty form).
  const [state, setState] = useState<ScopingState>(() => ({
    systems: seedSystems.length > 0 ? seedSystems : [''],
    vendors: seedVendors.length > 0 ? seedVendors : [''],
    estateInstances: seedInstances,
    seeded: seedSystems.length > 0 || seedVendors.length > 0,
  }))

  const exportMarkdown = useMemo(() => buildMarkdown(state, industry), [state, industry])

  const sources: string[] = []
  if (myProducts.length > 0)
    sources.push(`${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`)
  if (industry) sources.push(`${industry} industry context`)

  return (
    <div className="space-y-4">
      {state.seeded && sources.length > 0 && (
        <PreFilledBanner
          summary={`Scope seeded from ${sources.join(' + ')}${
            totalProducts ? ` (estate ~${totalProducts} catalogued products)` : ''
          }.`}
          onClear={() =>
            setState({ systems: [''], vendors: [''], estateInstances: '', seeded: false })
          }
        />
      )}
      <header className="flex items-start gap-3">
        <ClipboardList size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Initial Scoping Assessment</h2>
          <p className="text-sm text-muted-foreground">
            Phase 0 first-cut scope: your top {MAX_SYSTEMS} in-scope systems, a rough estate-size
            estimate, and your top {MAX_VENDORS} vendor dependencies.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4">
        <RowList
          label={`Top systems in scope`}
          rows={state.systems}
          max={MAX_SYSTEMS}
          placeholder="e.g. Customer-facing TLS gateway"
          onChange={(systems) => setState((prev) => ({ ...prev, systems }))}
        />
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-2">
        <label
          htmlFor="scoping-estate-instances"
          className="text-sm font-semibold text-foreground block"
        >
          Estate-size estimate
        </label>
        <p className="text-xs text-muted-foreground mb-1.5">
          Rough count of cryptographic instances (keys, certificates, library call-sites, protocol
          endpoints). Drives FTE sizing in the Skills &amp; Team plan.
        </p>
        <Input
          id="scoping-estate-instances"
          type="number"
          min={0}
          value={state.estateInstances}
          onChange={(e) => setState((prev) => ({ ...prev, estateInstances: e.target.value }))}
          placeholder="e.g. 2400"
          className="max-w-[12rem]"
        />
      </section>

      <section className="glass-panel border border-border rounded-lg p-4">
        <RowList
          label={`Top vendor dependencies`}
          rows={state.vendors}
          max={MAX_VENDORS}
          placeholder="e.g. OpenSSL / Microsoft / F5"
          onChange={(vendors) => setState((prev) => ({ ...prev, vendors }))}
        />
      </section>

      <ExportableArtifact
        title="Initial Scoping Assessment — Export"
        exportData={exportMarkdown}
        filename="initial-scoping-assessment"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          const systems = state.systems.map((v) => v.trim()).filter(Boolean)
          const vendors = state.vendors.map((v) => v.trim()).filter(Boolean)
          addExecutiveDocument({
            id: `initial-scoping-${Date.now()}`,
            moduleId: 'pqc-governance',
            type: 'initial-scoping',
            title: `Initial Scoping Assessment — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              systemCount: systems.length,
              vendorCount: vendors.length,
              estateInstances: state.estateInstances,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this scope to your Command Center under the Governance zone, or export as markdown /
          PDF / Word. This seeds the Discovery &amp; Inventory phase that follows.
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default InitialScopingAssessment
