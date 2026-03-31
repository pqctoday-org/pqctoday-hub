// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { DEV_LANGUAGES, type DevLanguage, type MemorySafety } from '../data/languageData'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

type MemFilter = 'All' | MemorySafety

const MEM_ITEMS = [
  { id: 'All', label: 'All Memory Models' },
  { id: 'manual', label: 'Manual (C/C++)' },
  { id: 'ownership', label: 'Ownership (Rust)' },
  { id: 'gc', label: 'GC (Java/Go/.NET)' },
  { id: 'refcount', label: 'RefCount (Python)' },
  { id: 'comptime', label: 'Comptime (Zig)' },
]

const RADAR_KEYS: { key: keyof DevLanguage['radar']; label: string }[] = [
  { key: 'memorySafety', label: 'Memory Safety' },
  { key: 'cryptoEcosystem', label: 'Crypto Ecosystem' },
  { key: 'ffiCapability', label: 'FFI Capability' },
  { key: 'buildTooling', label: 'Build Tooling' },
  { key: 'compileTimeGuarantees', label: 'Compile-Time' },
  { key: 'auditCertHistory', label: 'Audit History' },
]

const RadarBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-28 text-muted-foreground shrink-0">{label}</span>
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${(value / 10) * 100}%` }} />
    </div>
    <span className="w-6 text-right text-muted-foreground">{value}</span>
  </div>
)

const MEM_COLORS: Record<MemorySafety, string> = {
  manual: 'bg-status-error/20 text-status-error border-status-error/50',
  ownership: 'bg-status-success/20 text-status-success border-status-success/50',
  gc: 'bg-status-info/20 text-status-info border-status-info/50',
  refcount: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  comptime: 'bg-primary/20 text-primary border-primary/50',
}

interface LangCardProps {
  lang: DevLanguage
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  compareMode: boolean
}

const LangCard: React.FC<LangCardProps> = ({
  lang,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  compareMode,
}) => (
  <div
    className={`glass-panel overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
  >
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{lang.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${MEM_COLORS[lang.memorySafety]}`}
            >
              {lang.memorySafety}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
              {lang.compiledOrInterpreted}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {lang.cryptoDevContext.slice(0, 120)}…
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {compareMode && (
            <button
              onClick={onToggleSelect}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-primary" />
              ) : (
                <Square size={20} />
              )}
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {RADAR_KEYS.map(({ key, label }) => (
          <RadarBar key={key} label={label} value={lang.radar[key]} />
        ))}
      </div>
    </div>

    {isExpanded && (
      <div className="border-t border-border p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">Memory Safety</h4>
          <p className="text-sm text-muted-foreground">{lang.memorySafetyDescription}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">FFI Capability</h4>
          <p className="text-sm text-muted-foreground">{lang.ffiDescription}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-2">Crypto Libraries</h4>
          <div className="space-y-2">
            {lang.cryptoLibraries.map((lib) => (
              <div key={lib.name} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${lib.pqcSupport ? 'bg-status-success' : 'bg-muted-foreground'}`}
                />
                <div>
                  <span className="font-mono text-sm text-primary">{lib.name}</span>
                  <span className="text-sm text-muted-foreground"> — {lib.description}</span>
                  {lib.pqcSupport && <span className="ml-2 text-xs text-status-success">PQC</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">PQC Bindings Available</h4>
          <div className="flex flex-wrap gap-1">
            {lang.pqcBindings.map((b) => (
              <span
                key={b}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h4 className="font-semibold text-sm text-status-success mb-1">Pros for Crypto Dev</h4>
            <ul className="space-y-0.5">
              {lang.pros.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  • {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-status-error mb-1">Cons for Crypto Dev</h4>
            <ul className="space-y-0.5">
              {lang.cons.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  • {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">Notable Deployments</h4>
          <div className="flex flex-wrap gap-1">
            {lang.notableDeployments.map((d) => (
              <span
                key={d}
                className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
)

const CompareTable: React.FC<{ langs: DevLanguage[] }> = ({ langs }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-3 text-muted-foreground font-medium w-36">Dimension</th>
          {langs.map((l) => (
            <th key={l.id} className="text-left p-3 text-foreground font-bold">
              {l.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[
          { label: 'Memory Safety', fn: (l: DevLanguage) => l.memorySafety },
          { label: 'Paradigm', fn: (l: DevLanguage) => l.paradigm },
          { label: 'FFI', fn: (l: DevLanguage) => l.ffi },
          { label: 'Compiled/Interpreted', fn: (l: DevLanguage) => l.compiledOrInterpreted },
          { label: 'Year', fn: (l: DevLanguage) => String(l.yearIntroduced) },
          { label: 'PQC Bindings', fn: (l: DevLanguage) => l.pqcBindings.length + ' available' },
        ].map(({ label, fn }) => (
          <tr key={label} className="border-b border-border hover:bg-muted/30">
            <td className="p-3 text-muted-foreground">{label}</td>
            {langs.map((l) => (
              <td key={l.id} className="p-3 text-foreground">
                {fn(l)}
              </td>
            ))}
          </tr>
        ))}
        {RADAR_KEYS.map(({ key, label }) => (
          <tr key={key} className="border-b border-border hover:bg-muted/30">
            <td className="p-3 text-muted-foreground">{label}</td>
            {langs.map((l) => (
              <td key={l.id} className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(l.radar[key] / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">{l.radar[key]}/10</span>
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const LanguageEcosystemComparator: React.FC = () => {
  const [memFilter, setMemFilter] = useState<MemFilter>('All')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)

  const filtered = useMemo(() => {
    return DEV_LANGUAGES.filter((l) => {
      if (memFilter !== 'All' && l.memorySafety !== memFilter) return false
      return true
    })
  }, [memFilter])

  const compareLangs = useMemo(
    () => DEV_LANGUAGES.filter((l) => selectedIds.has(l.id)),
    [selectedIds]
  )

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <FilterDropdown
          label="Memory Safety"
          items={MEM_ITEMS}
          selectedId={memFilter}
          onSelect={(id) => setMemFilter(id as MemFilter)}
        />
        <button
          onClick={() => {
            setCompareMode((v) => !v)
            if (compareMode) setSelectedIds(new Set())
          }}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            compareMode
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          {compareMode ? `Compare (${selectedIds.size}/3)` : 'Compare Mode'}
        </button>
      </div>

      <VendorCoverageNotice migrateLayer="Libraries" className="mb-2" />

      {compareMode && compareLangs.length >= 2 && (
        <div className="glass-panel p-4">
          <h3 className="font-bold text-foreground mb-4">Language Comparison</h3>
          <CompareTable langs={compareLangs} />
        </div>
      )}
      {compareMode && compareLangs.length < 2 && (
        <div className="glass-panel p-4 text-center text-muted-foreground text-sm">
          Select 2–3 languages using the checkboxes on their cards.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((lang) => (
          <LangCard
            key={lang.id}
            lang={lang}
            isExpanded={expandedIds.has(lang.id)}
            isSelected={selectedIds.has(lang.id)}
            onToggleExpand={() => toggleExpand(lang.id)}
            onToggleSelect={() => toggleSelect(lang.id)}
            compareMode={compareMode}
          />
        ))}
      </div>
    </div>
  )
}
