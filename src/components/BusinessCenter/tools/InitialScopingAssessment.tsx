// SPDX-License-Identifier: GPL-3.0-only
/**
 * Initial Scoping Assessment — Phase 0 (Executive Mandate) Command Center
 * gap-closer. Captures the rapid first-cut scope the framework's Activity 0.5
 * expects: the top-20 in-scope systems (each triaged by priority tier and
 * ownership), a rough estate-size estimate (optionally itemized by category),
 * and the top 5–10 vendor dependencies. Detailed per-system crypto (protocols,
 * algorithms, precise sensitivity) is deliberately deferred to Discovery / the
 * CBOM Builder — Activity 0.5 is a 2–4 week triage on existing organizational
 * knowledge, not an inventory. Seedable from /migrate; emits a markdown
 * artifact under the Governance zone.
 */
import React, { useMemo, useState } from 'react'
import { ClipboardList, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { INSTANCES_PER_PRODUCT_ESTIMATE } from '@/data/roleCrosswalk'

const MAX_SYSTEMS = 20
const MAX_VENDORS = 10

export type Priority = '—' | 'A' | 'B' | 'C'
export type Ownership = 'Internal' | 'Vendor' | 'Mixed'
const PRIORITIES: Priority[] = ['—', 'A', 'B', 'C']
const OWNERSHIPS: Ownership[] = ['Internal', 'Vendor', 'Mixed']

export interface ScopedSystem {
  name: string
  /** Discovery-priority tier (A/B/C); '—' = not yet triaged. */
  priority: Priority
  ownership: Ownership
  /** Optional "if known" note — protocols / sensitivity / dependents. Discovery + the CBOM fill these in. */
  notes: string
}

export interface EstateBreakdown {
  tlsEndpoints: string
  certificates: string
  vpnTunnels: string
  hsmKeys: string
  codeSigningPipelines: string
}

export interface ScopingState {
  systems: ScopedSystem[]
  vendors: string[]
  estateInstances: string
  estate: EstateBreakdown
  seeded: boolean
}

const emptyEstate = (): EstateBreakdown => ({
  tlsEndpoints: '',
  certificates: '',
  vpnTunnels: '',
  hsmKeys: '',
  codeSigningPipelines: '',
})

const emptySystem = (): ScopedSystem => ({
  name: '',
  priority: '—',
  ownership: 'Internal',
  notes: '',
})

/** Back-compat: older saved scopes stored systems as plain strings. */
export function normalizeSystem(v: unknown): ScopedSystem {
  if (typeof v === 'string') return { ...emptySystem(), name: v }
  const o = (v ?? {}) as Partial<ScopedSystem>
  return {
    name: o.name ?? '',
    priority: (PRIORITIES.includes(o.priority as Priority) ? o.priority : '—') as Priority,
    ownership: (OWNERSHIPS.includes(o.ownership as Ownership)
      ? o.ownership
      : 'Internal') as Ownership,
    notes: o.notes ?? '',
  }
}

export function normalizeState(s: unknown): ScopingState | null {
  if (!s || typeof s !== 'object') return null
  const o = s as Partial<ScopingState> & { systems?: unknown[] }
  if (!Array.isArray(o.systems) || !Array.isArray(o.vendors)) return null
  return {
    systems: o.systems.map(normalizeSystem),
    vendors: o.vendors as string[],
    estateInstances: typeof o.estateInstances === 'string' ? o.estateInstances : '',
    estate: { ...emptyEstate(), ...(o.estate ?? {}) },
    seeded: !!o.seeded,
  }
}

export function buildMarkdown(s: ScopingState, industry: string): string {
  const lines: string[] = []
  lines.push('# Initial Scoping Assessment')
  lines.push('')
  lines.push('*Phase 0 — Executive Mandate (Activity 0.5). Rapid first-cut estate boundary.*')
  if (industry) {
    lines.push('')
    lines.push(`Industry context: ${industry}`)
  }
  lines.push('')

  lines.push(`## Top systems in scope (max ${MAX_SYSTEMS})`)
  lines.push('')
  const systems = s.systems.filter((sys) => sys.name.trim())
  if (systems.length === 0) {
    lines.push('_No systems listed yet._')
  } else {
    lines.push('| # | System | Priority | Owner | Notes (if known) |')
    lines.push('|---|--------|----------|-------|------------------|')
    systems.forEach((sys, i) =>
      lines.push(
        `| ${i + 1} | ${sys.name.trim()} | ${sys.priority} | ${sys.ownership} | ${sys.notes.trim() || '—'} |`
      )
    )
  }
  lines.push('')
  lines.push(
    '_Priority tiers (framework Activity 1.0): A = internet-exposed + long-lived secrecy/trust; ' +
      'B = internal Tier-1 with significant data sensitivity; C = everything else. Detailed ' +
      'per-system protocols and algorithms come from Discovery / the CBOM Builder._'
  )
  lines.push('')

  lines.push('## Estate-size estimate')
  lines.push('')
  lines.push(`- **Estimated cryptographic instances:** ${s.estateInstances.trim() || '_(TBD)_'}`)
  const e = s.estate
  const rows: [string, string][] = [
    ['TLS endpoints', e.tlsEndpoints],
    ['Certificates', e.certificates],
    ['VPN tunnels', e.vpnTunnels],
    ['HSM-protected keys', e.hsmKeys],
    ['Code-signing pipelines', e.codeSigningPipelines],
  ].filter(([, v]) => v.trim()) as [string, string][]
  if (rows.length > 0) {
    lines.push('')
    lines.push('| Category | Count |')
    lines.push('|----------|-------|')
    rows.forEach(([label, v]) => lines.push(`| ${label} | ${v.trim()} |`))
  }
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
      'Quantum Activity 0.5 initial-scoping step. https://doi.org/10.6028/NIST.CSWP.39-upd1*'
  )
  return lines.join('\n')
}

/** Collapsible "how this data is sourced" panel. */
function DataSourcesPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-panel border border-border rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 p-3 text-left h-auto"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
        <Info size={14} className="text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground">How this data is sourced</span>
      </Button>
      {open && (
        <div className="border-t border-border p-4 space-y-4 text-xs text-foreground/80">
          <section className="space-y-1.5">
            <h4 className="font-semibold text-foreground">
              Applied Quantum Framework, Activity 0.5 — Conduct Initial Scoping Assessment
            </h4>
            <p>
              A rapid (2&ndash;4 week) triage on existing organizational knowledge. This tool
              captures the top 20 revenue-generating or mission-critical systems &mdash; each with a{' '}
              <strong>priority tier</strong> (A/B/C) and <strong>ownership</strong> (internal vs
              vendor) &mdash; a rough <strong>estate-size estimate</strong> (optionally itemized),
              and the <strong>5&ndash;10 vendors</strong> whose PQC readiness will most constrain
              the timeline. Detailed per-system protocols, algorithms, and precise data sensitivity
              are deliberately deferred to Discovery and the CBOM Builder; scoping is triage, not an
              inventory. Its output calibrates Year 1 budget and staffing and seeds Phase 1
              prioritization.
            </p>
          </section>
          <section className="space-y-1.5">
            <h4 className="font-semibold text-foreground">NIST CSWP.39 §5 grounding</h4>
            <p>
              The scope you capture here is the input to the Crypto Agility Strategic Plan&apos;s
              scoping step (
              <a
                href="https://doi.org/10.6028/NIST.CSWP.39-upd1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NIST CSWP 39
              </a>{' '}
              §5) — the estate boundary that Phase 1 (Discovery &amp; Inventory) then discovers
              against in priority order.
            </p>
          </section>
          <section className="space-y-1.5">
            <h4 className="font-semibold text-foreground">Seeding from your other pages</h4>
            <p>
              When you have a product selection on <code className="text-[11px]">/migrate</code>,
              the systems and vendor lists open pre-filled from it (systems from the product names,
              with ownership inferred from whether a vendor backs each; vendors from the distinct
              vendor ids). Priority is left un-triaged (&mdash;) for you to set — it isn&apos;t
              guessed. The estate-size estimate is seeded at {INSTANCES_PER_PRODUCT_ESTIMATE}{' '}
              cryptographic instances per selected product — a rough order of magnitude, not a
              measurement.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}

/** Editable text-row list with add/remove, capped at `max` entries (vendors). */
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
  const savedInputs = useSavedArtifactInputs<ScopingState>('initial-scoping')
  const { myProducts, industry, totalProducts } = useExecutiveModuleData()

  const seedSystems = useMemo<ScopedSystem[]>(
    () =>
      myProducts.slice(0, MAX_SYSTEMS).map((p) => ({
        name: p.softwareName,
        priority: '—' as Priority,
        ownership: (p.vendorId ? 'Vendor' : 'Internal') as Ownership,
        notes: p.infrastructureLayer ? `Layer: ${p.infrastructureLayer}` : '',
      })),
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
  const seedInstances = useMemo(
    () => (myProducts.length > 0 ? String(myProducts.length * INSTANCES_PER_PRODUCT_ESTIMATE) : ''),
    [myProducts.length]
  )

  const [state, setState] = useState<ScopingState>(() => {
    const restored = normalizeState(savedInputs)
    if (restored) return restored
    return {
      systems: seedSystems.length > 0 ? seedSystems : [emptySystem()],
      vendors: seedVendors.length > 0 ? seedVendors : [''],
      estateInstances: seedInstances,
      estate: emptyEstate(),
      seeded: seedSystems.length > 0 || seedVendors.length > 0,
    }
  })
  const [estateOpen, setEstateOpen] = useState(false)

  const exportMarkdown = useMemo(() => buildMarkdown(state, industry), [state, industry])

  const setSystem = (i: number, patch: Partial<ScopedSystem>) =>
    setState((prev) => ({
      ...prev,
      systems: prev.systems.map((sys, idx) => (idx === i ? { ...sys, ...patch } : sys)),
    }))
  const removeSystem = (i: number) =>
    setState((prev) => ({ ...prev, systems: prev.systems.filter((_, idx) => idx !== i) }))
  const addSystem = () =>
    setState((prev) =>
      prev.systems.length < MAX_SYSTEMS
        ? { ...prev, systems: [...prev.systems, emptySystem()] }
        : prev
    )
  const setEstate = (patch: Partial<EstateBreakdown>) =>
    setState((prev) => ({ ...prev, estate: { ...prev.estate, ...patch } }))

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
            setState({
              systems: [emptySystem()],
              vendors: [''],
              estateInstances: '',
              estate: emptyEstate(),
              seeded: false,
            })
          }
        />
      )}
      <header className="flex items-start gap-3">
        <ClipboardList size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Initial Scoping Assessment</h2>
          <p className="text-sm text-muted-foreground">
            Phase 0 rapid first-cut: your top {MAX_SYSTEMS} systems triaged by priority and owner, a
            rough estate-size estimate, and your top {MAX_VENDORS} vendor dependencies.
          </p>
        </div>
      </header>

      <DataSourcesPanel />

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Top systems in scope</span>
          <span className="text-[10px] text-muted-foreground">
            {state.systems.length} / {MAX_SYSTEMS}
          </span>
        </div>
        <div className="space-y-2">
          {state.systems.map((sys, i) => (
            <div key={i} className="rounded border border-border p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums text-muted-foreground w-5 shrink-0">
                  {i + 1}.
                </span>
                <Input
                  value={sys.name}
                  onChange={(e) => setSystem(i, { name: e.target.value })}
                  placeholder="e.g. Customer-facing TLS gateway"
                  className="h-8 flex-1"
                  aria-label={`System ${i + 1} name`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSystem(i)}
                  aria-label={`Remove system ${i + 1}`}
                  className="h-8 px-2 text-muted-foreground"
                >
                  ✕
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <span className="text-[10px] text-muted-foreground">Priority</span>
                <FilterDropdown
                  items={PRIORITIES.map((p) => ({
                    id: p,
                    label: p === '—' ? '— (untriaged)' : p,
                  }))}
                  selectedId={sys.priority}
                  onSelect={(id) => setSystem(i, { priority: id as Priority })}
                  ariaLabel={`System ${i + 1} priority`}
                  hideDefaultOption
                  noContainer
                  size="sm"
                />
                <span className="text-[10px] text-muted-foreground">Owner</span>
                <FilterDropdown
                  items={OWNERSHIPS}
                  selectedId={sys.ownership}
                  onSelect={(id) => setSystem(i, { ownership: id as Ownership })}
                  ariaLabel={`System ${i + 1} ownership`}
                  hideDefaultOption
                  noContainer
                  size="sm"
                />
                <Input
                  value={sys.notes}
                  onChange={(e) => setSystem(i, { notes: e.target.value })}
                  placeholder="if known: protocols / sensitivity / dependents"
                  className="h-7 flex-1 min-w-[10rem] text-[11px]"
                  aria-label={`System ${i + 1} notes`}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSystem}
          disabled={state.systems.length >= MAX_SYSTEMS}
          className="h-7"
        >
          + Add
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Triage the top 20 by <strong>priority tier</strong> (A = internet-exposed + long-lived
          secrecy/trust; B = internal Tier-1; C = everything else) and <strong>owner</strong>. The
          detailed crypto per system belongs in the{' '}
          <Link to="/business/tools/crypto-cbom-builder" className="text-primary hover:underline">
            CBOM Builder
          </Link>{' '}
          — this stays a rapid triage.
        </p>
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
          endpoints). Calibrates Year 1 FTE sizing.
          {myProducts.length > 0 && (
            <>
              {' '}
              Seeded as{' '}
              <span className="font-medium text-foreground">
                {myProducts.length} product{myProducts.length === 1 ? '' : 's'} ×{' '}
                {INSTANCES_PER_PRODUCT_ESTIMATE}
              </span>{' '}
              — a rough order of magnitude, not a measurement.
            </>
          )}
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEstateOpen((o) => !o)}
          aria-expanded={estateOpen}
          className="h-7 px-2 -ml-2 text-xs text-muted-foreground"
        >
          {estateOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Break down by category (optional, if known)
        </Button>
        {estateOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {(
              [
                ['TLS endpoints', 'tlsEndpoints'],
                ['Certificates', 'certificates'],
                ['VPN tunnels', 'vpnTunnels'],
                ['HSM-protected keys', 'hsmKeys'],
                ['Code-signing pipelines', 'codeSigningPipelines'],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-40 shrink-0">{label}</span>
                <Input
                  type="number"
                  min={0}
                  value={state.estate[key]}
                  onChange={(e) => setEstate({ [key]: e.target.value })}
                  placeholder="—"
                  className="h-7"
                  aria-label={label}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-2">
        <RowList
          label={`Top vendor dependencies`}
          rows={state.vendors}
          max={MAX_VENDORS}
          placeholder="e.g. OpenSSL / Microsoft / F5"
          onChange={(vendors) => setState((prev) => ({ ...prev, vendors }))}
        />
        <p className="text-[11px] text-muted-foreground">
          Capped at {MAX_VENDORS} — Framework Activity 0.5 asks for the 5&ndash;10 vendors whose PQC
          readiness will most constrain your migration timeline.
        </p>
      </section>

      <ExportableArtifact
        title="Initial Scoping Assessment — Export"
        exportData={exportMarkdown}
        filename="initial-scoping-assessment"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `initial-scoping-${Date.now()}`,
            moduleId: 'pqc-governance',
            type: 'initial-scoping',
            title: `Initial Scoping Assessment — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: state,
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
