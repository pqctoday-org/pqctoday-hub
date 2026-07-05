// SPDX-License-Identifier: GPL-3.0-only
//
// GlossaryRail — persistent, collapsible right column shared by all 4 KMIP3.0
// sub-tabs (mounted once at the Kmip3View level via GlossaryContext). Search
// + a "now viewing" pinned card (set by any `Term` hover/focus anywhere on
// the page) + three alphabetical sections: Wire format, Protocol concepts,
// Post-quantum concepts.
import { useMemo, useState } from 'react'
import { ChevronDown, PanelRight, PanelRightClose, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useGlossary } from './GlossaryContext'
import { TAG_GLOSSARY, TERMS, lookupGlossaryDef } from './glossary'

interface RailEntry {
  key: string
  label: string
  def: string
  hex?: string
}

const byLabel = (a: RailEntry, b: RailEntry) => a.label.localeCompare(b.label)

const WIRE_ENTRIES: RailEntry[] = [
  ...Object.entries(TAG_GLOSSARY).map(([name, e]) => ({
    key: name,
    label: name,
    def: e.def,
    hex: e.hex,
  })),
  ...TERMS.filter((t) => t.cat === 'wire').map((t) => ({ key: t.id, label: t.label, def: t.def })),
].sort(byLabel)

const PROTOCOL_ENTRIES: RailEntry[] = TERMS.filter((t) => t.cat === 'protocol')
  .map((t) => ({ key: t.id, label: t.label, def: t.def }))
  .sort(byLabel)

const PQC_ENTRIES: RailEntry[] = TERMS.filter((t) => t.cat === 'pqc')
  .map((t) => ({ key: t.id, label: t.label, def: t.def }))
  .sort(byLabel)

function GlossarySection({ title, entries }: { title: string; entries: RailEntry[] }) {
  const [open, setOpen] = useState(true)
  if (entries.length === 0) return null
  return (
    <div className="mt-3 border-t border-border pt-2">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-auto w-full items-center justify-between p-1"
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {title} ({entries.length})
        </span>
        <ChevronDown
          size={12}
          className={cn('text-muted-foreground transition-transform', !open && '-rotate-90')}
        />
      </Button>
      {open && (
        <ul className="mt-1 space-y-1.5">
          {entries.map((e) => (
            <li key={e.key} className="text-[11.5px] leading-snug">
              <span className="font-semibold text-foreground">{e.label}</span>
              {e.hex && (
                <span className="ml-1 font-mono text-[10px] text-muted-foreground/70">{e.hex}</span>
              )}
              <span className="ml-1 text-muted-foreground">{e.def}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function GlossaryRail() {
  const { activeKey, collapsed, setCollapsed } = useGlossary()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filter = (entries: RailEntry[]) =>
    q
      ? entries.filter((e) => e.label.toLowerCase().includes(q) || e.def.toLowerCase().includes(q))
      : entries

  const pinnedDef = activeKey ? lookupGlossaryDef(activeKey) : undefined
  const pinnedEntry = useMemo(() => {
    if (!activeKey || !pinnedDef) return undefined
    // eslint-disable-next-line security/detect-object-injection -- read-only lookup against this module's own fixed glossary catalog, never used to write; `activeKey` is always a wire tag name or TERMS id, never raw user input.
    const hex = TAG_GLOSSARY[activeKey]?.hex
    const label = TERM_LABEL(activeKey)
    return { label, hex, def: pinnedDef }
  }, [activeKey, pinnedDef])

  if (collapsed) {
    return (
      <div className="sticky top-0 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          aria-label="Expand glossary"
          className="h-auto p-2"
        >
          <PanelRight size={16} className="text-muted-foreground" />
        </Button>
      </div>
    )
  }

  return (
    <aside className="sticky top-0 max-h-[calc(100vh-2rem)] w-[300px] shrink-0 overflow-y-auto rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Glossary</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse glossary"
          className="h-auto p-1"
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </Button>
      </div>

      <div className="relative mt-2">
        <Search
          size={12}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search glossary…"
          className="h-8 pl-7 text-xs"
        />
      </div>

      {pinnedEntry && (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-primary">Now viewing</p>
          <p className="mt-0.5 text-[12.5px] font-semibold text-foreground">
            {pinnedEntry.label}
            {pinnedEntry.hex && (
              <span className="ml-1.5 font-mono text-[10px] font-normal text-muted-foreground">
                {pinnedEntry.hex}
              </span>
            )}
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{pinnedEntry.def}</p>
        </div>
      )}

      <GlossarySection title="Wire format" entries={filter(WIRE_ENTRIES)} />
      <GlossarySection title="Protocol concepts" entries={filter(PROTOCOL_ENTRIES)} />
      <GlossarySection title="Post-quantum concepts" entries={filter(PQC_ENTRIES)} />
    </aside>
  )
}

/** A glossary key is either a tag name (label === key) or a TERMS id (label
 * is the term's human-readable label, e.g. `kem` → "KEM (Key Encapsulation
 * Mechanism)"). */
function TERM_LABEL(key: string): string {
  return TERMS.find((t) => t.id === key)?.label ?? key
}
