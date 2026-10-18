// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import {
  BUSINESS_TOOLS,
  BUSINESS_CATEGORIES,
  type BusinessTool,
} from '@/components/BusinessCenter/businessToolsRegistry'
import { Cswp39SectionBadge } from '@/components/BusinessCenter/widgets/Cswp39SectionBadge'
import { MobileSheet } from '../primitives/Sheet'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getBusinessRoleSequence } from '@/data/businessRoleConfig'
import { businessToolEvidence } from '@/data/businessToolEvidence'

// crypto-architecture-diagram dropped entirely (per audit, 2026-08-24): its
// core value is a live Mermaid topology diagram (`MermaidDiagram.tsx`,
// injected via `dangerouslySetInnerHTML`, only `overflow-x-auto` wrapped,
// the component's own "← scroll to see the full diagram →" hint admits it)
// plus a 4-input-per-row dense entry table. Neither survives a 375px
// viewport even though nothing technically breaks. Matches the mobile
// Playground catalogue's precedent: dropped, not linked to a degraded tool.
export const DROPPED_TOOL_IDS = new Set(['crypto-architecture-diagram'])

const MOBILE_TOOLS: BusinessTool[] = BUSINESS_TOOLS.filter((t) => !DROPPED_TOOL_IDS.has(t.id))
const DROPPED_TOOLS: BusinessTool[] = BUSINESS_TOOLS.filter((t) => DROPPED_TOOL_IDS.has(t.id))

const AUDIENCE_BADGE: Record<string, string> = {
  architect: 'For architects',
  developer: 'For developers',
}

/**
 * Mobile Business Tools (Phase 9 — Practice set, closing Phase 9).
 * Source: businessToolsRegistry.tsx, widgets/Cswp39SectionBadge.tsx — the
 * same real registry and provenance badge desktop's BusinessToolsGrid.tsx
 * and BusinessToolRoute.tsx already read, not re-derived.
 *
 * The design handoff's §15 prose ("Six tools... survives a phone even where
 * the tool doesn't. Dropped tools keep their goodAnswer line on the page")
 * had the right instinct but the wrong scale — the real registry has 37
 * tools, not six, and that "goodAnswer survives a drop" mechanism didn't
 * exist anywhere in the codebase (goodAnswer renders in exactly one real
 * place, BusinessToolRoute.tsx, directly above the tool it describes). This
 * screen is the first real implementation of that idea, scaled correctly:
 * 36 of 37 tools kept (audited individually for phone-width usability, same
 * method as the Playground catalogue — grid/table/diagram/drag-drop red
 * flags checked against each real component), 1 dropped outright.
 *
 * Confirmed with the user: this gets a real rebuilt mobile screen (matching
 * every other Phase 7-9 screen's density/typography) rather than reusing
 * BusinessToolsGrid.tsx directly — even though that desktop page is
 * unusually already responsive (44px touch targets already baked into its
 * filter dropdowns), for visual consistency across the mobile shell.
 *
 * Distilled from desktop's 4 facets (category/zone/phase/audience) + a
 * "Start here" sequence down to search + category only — stated below, not
 * silently dropped. "Open tool" navigates to the real, unmodified
 * /business/tools/:id route (BusinessToolRoute.tsx) — this screen is the
 * catalogue/discovery layer, not a second copy of each tool's own UI.
 */
export function MobileBusinessToolsView() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [selected, setSelected] = useState<BusinessTool | null>(null)
  const selectedPersona = usePersonaStore((state) => state.selectedPersona)
  const startHere = getBusinessRoleSequence(selectedPersona)

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of MOBILE_TOOLS) counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    return counts
  }, [])

  const filtered = useMemo(() => {
    let tools = MOBILE_TOOLS
    if (category) tools = tools.filter((t) => t.category === category)
    const q = search.trim().toLowerCase()
    if (q) {
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
      )
    }
    return tools
  }, [category, search])

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4">
        <h1 className="sr-only">Business Tools</h1>
        <p className="text-[11.5px] text-muted-foreground">{MOBILE_TOOLS.length} tools</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tools or keywords..."
        aria-label="Search business tools"
        className="mb-3 h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] text-foreground placeholder:text-muted-foreground"
      />

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCategory(null)}
          aria-pressed={category === null}
          className={cn(
            'h-8 rounded-full border px-3 text-[11px] font-semibold',
            category === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground'
          )}
        >
          All
        </Button>
        {BUSINESS_CATEGORIES.map((cat) => (
          <Button
            type="button"
            variant="ghost"
            key={cat}
            onClick={() => setCategory((c) => (c === cat ? null : cat))}
            aria-pressed={category === cat}
            className={cn(
              'h-8 rounded-full border px-3 text-[11px] font-semibold',
              category === cat
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {cat} · {categoryCounts.get(cat) ?? 0}
          </Button>
        ))}
      </div>

      {!search.trim() && !category && (
        <section className="mb-4 rounded-xl border border-border bg-card p-3.5">
          <h2 className="text-[12px] font-bold text-foreground">{startHere.heading}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {startHere.guidance}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {startHere.steps.slice(0, 4).map((step) => (
              <Link
                key={step.id}
                to={`/business/tools/${step.id}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground"
              >
                <span className="text-primary">{step.step}</span>
                {step.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">No tools match these filters.</p>
        )}
        {filtered.map((tool) => (
          <ToolCardMobile key={tool.id} tool={tool} onSelect={() => setSelected(tool)} />
        ))}
      </div>

      {/* §15 spec: "Dropped tools keep their goodAnswer line on the page —
          that sentence is the teaching and survives a phone even where the
          tool doesn't." Was a bare name in the fine print below (2026-08-24
          audit R4.3) — the mechanism itself was never actually built. Real
          goodAnswer + CSWP badge, no link. */}
      {DROPPED_TOOLS.map((tool) => (
        <div key={tool.id} className="mt-2.5 rounded-xl border border-dashed border-border p-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-foreground">{tool.name}</span>
            <Cswp39SectionBadge
              sectionRef={tool.cswp39SectionRef}
              subSection={tool.cswp39SubSection}
            />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {tool.goodAnswer}
          </p>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Needs a laptop — the tool doesn&apos;t fit a phone, but the answer does
          </p>
        </div>
      ))}

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The role-specific "Start here" sequence is available above. Zone, Phase and Audience filters
        and "Group by" remain laptop features. The Crypto Architecture Diagram tool also needs a
        wider screen — its live topology diagram and dense entry table don&apos;t fit a phone.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        large
        shareUrl={selected ? `/business/tools/${encodeURIComponent(selected.id)}` : undefined}
        testId="business-tool-detail-sheet"
      >
        {selected && <ToolDetailSheetBody tool={selected} />}
      </MobileSheet>
    </div>
  )
}

function ToolCardMobile({ tool, onSelect }: { tool: BusinessTool; onSelect: () => void }) {
  const Icon = tool.icon
  return (
    <article className="glass-panel flex flex-col gap-1.5 p-3.5">
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        // Button's own base classes hard-code whitespace-nowrap; same defect
        // class found and fixed on Threats/Patents/Compliance/Library (2026-08-24).
        className="h-auto w-full flex-col items-start gap-1.5 whitespace-normal rounded-none p-0 text-left font-normal"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-bold leading-tight text-foreground">{tool.name}</span>
        </div>
        <p className="line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
          {tool.description}
        </p>
      </Button>
      {/* Keep provenance outside the card's Open button. Cswp39SectionBadge is
          independently keyboard/touch interactive; nesting it in the button
          created 36 inaccessible nested controls on the phone catalogue. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tool.audience && tool.audience !== 'business' && (
          <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-sim-chip font-semibold leading-none text-secondary">
            {AUDIENCE_BADGE[tool.audience]}
          </span>
        )}
        <Cswp39SectionBadge sectionRef={tool.cswp39SectionRef} subSection={tool.cswp39SubSection} />
        <MobileBusinessToolEvidenceNotice toolId={tool.id} compact />
      </div>
    </article>
  )
}

function ToolDetailSheetBody({ tool }: { tool: BusinessTool }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {tool.category}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground">
          <span className="font-semibold">What this is for:</span> {tool.description}.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-3">
        <p className="text-[12px] leading-relaxed text-foreground/90">
          <span className="font-semibold text-foreground">What a good answer looks like:</span>{' '}
          {tool.goodAnswer}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Cswp39SectionBadge sectionRef={tool.cswp39SectionRef} subSection={tool.cswp39SubSection} />
        <MobileBusinessToolEvidenceNotice toolId={tool.id} compact />
      </div>

      <MobileBusinessToolEvidenceNotice toolId={tool.id} />

      <Link
        to={`/business/tools/${tool.id}`}
        className={cn(
          buttonVariants({ variant: 'gradient' }),
          'h-auto rounded-lg py-2.5 font-bold'
        )}
      >
        Open tool
      </Link>
    </div>
  )
}

/** Phone-specific presentation backed by the same evidence contract as desktop. */
function MobileBusinessToolEvidenceNotice({
  toolId,
  compact = false,
}: {
  toolId: string
  compact?: boolean
}) {
  const evidence = businessToolEvidence(toolId)
  if (!evidence) return null

  if (compact) {
    return (
      <span
        className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
        aria-label={`Output type: ${evidence.label}`}
      >
        {evidence.label}
      </span>
    )
  }

  return (
    <aside
      className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-[11px]"
      aria-label="How to interpret this business tool"
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 space-y-1 leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{evidence.label}</p>
          <p>
            <span className="font-semibold text-foreground">Can show:</span> {evidence.proves}
          </p>
          <p>
            <span className="font-semibold text-foreground">Cannot establish:</span>{' '}
            {evidence.doesNotProve}
          </p>
        </div>
      </div>
    </aside>
  )
}
