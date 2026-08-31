// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Bookmark, BookmarkCheck, GraduationCap, Monitor, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import {
  WORKSHOP_TOOLS,
  CATEGORIES,
  type WorkshopTool,
  type WorkshopCategory,
  type ToolDifficulty,
} from '@/components/Playground/workshopRegistry'
import { PERSONA_CHIP_LABEL, roleLabel } from '@/components/Playground/cryptoLabMeta'
import { expandSearchQuery } from '@/components/Playground/cryptoLabTaxonomy'
import {
  useDeviceCapabilities,
  toolFitness,
  unmetRequirements,
  REQUIREMENT_LABELS,
} from '@/hooks/useDeviceCapabilities'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MobileSheet } from '../primitives/Sheet'

// Tools whose own real UI does not distill to a phone screen — dropped from
// the mobile catalogue entirely rather than linked to a broken experience
// (per audit, 2026-08-24):
// - vpn-sim: its IKEv2 handshake diagram is a `min-w-[480px]` grid; the
//   component's own comment already says it scrolls below ~480px.
// - mls-group-messaging: its TreeKEM ratchet-tree visual is a raw
//   `<svg width={720}>` — squeezed off-screen at phone width, not reflowed.
// - openssl-studio: the tool's own code already carries an `lg:hidden`
//   banner reading "Best experienced on desktop — scroll down for terminal
//   and file manager" — a first-party admission the 3-in-1 command-builder/
//   file-manager/terminal workspace isn't a real mobile experience, even
//   though it technically stacks.
export const DROPPED_TOOL_IDS = new Set(['vpn-sim', 'mls-group-messaging', 'openssl-studio'])

// The real 34 hand-authored tools, minus the 24 Docker-backed sandbox
// scenarios workshopRegistry.tsx appends (cut from mobile entirely per user
// decision, 2026-08-24 — no sandbox-runtime UI here) and minus the 3 dropped
// above. Mirrors WorkshopToolsTab.tsx's own `MOBILE_TOOLS` derivation (not
// exported there, so re-derived here from the same real WORKSHOP_TOOLS).
const MOBILE_TOOLS: WorkshopTool[] = WORKSHOP_TOOLS.filter(
  (t) => !t.sandbox && !DROPPED_TOOL_IDS.has(t.id)
)

type DifficultyValue = 'All' | ToolDifficulty
const DIFFICULTY_CHIPS: { value: DifficultyValue; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const DIFFICULTY_BADGE: Record<ToolDifficulty, string> = {
  beginner: 'bg-status-success/15 text-status-success',
  intermediate: 'bg-status-warning/15 text-status-warning',
  advanced: 'bg-status-error/15 text-status-error',
}

/**
 * Mobile Playground (Phase 9 — Practice set).
 * Source: workshopRegistry.tsx, cryptoLabMeta.ts, cryptoLabTaxonomy.ts,
 * useDeviceCapabilities.ts — the same real registry, category metadata,
 * search-synonym expansion and device-capability gate every desktop
 * Playground surface reads, not re-derived.
 *
 * The design handoff's Playground prose was substantially wrong: "ten
 * tools... grouped in four tabs... plus an OpenSSL tab folded in" and
 * "dropped for capability reasons: TLS/VPN simulators, TPM 2.0, CACP/KMIP,
 * full PKCS#11" — none of that holds. The real registry has 58 tools (34
 * hand-authored + 24 sandbox scenarios), 7 real categories, and every one of
 * the "dropped" items is actually live (most with zero capability gate;
 * CACP/KMIP is a *featured* item, the opposite of dropped). Confirmed with
 * the user: mobile shows the 34 hand-authored tools only (sandbox scenarios
 * need a desktop Docker runtime, cut entirely rather than shown locked), and
 * — per an explicit follow-up instruction — every included tool's own UI was
 * individually audited for phone-width usability; the 3 that don't distill
 * are dropped outright (see DROPPED_TOOL_IDS above), not linked anyway.
 *
 * "Open tool" navigates to the real, unmodified `/playground/:id` route
 * (PlaygroundToolRoute.tsx) — this screen is the catalogue/discovery layer,
 * not a second copy of each tool's own UI.
 */
export function MobilePlaygroundView() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<WorkshopCategory | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyValue>('All')
  const [runsHereOnly, setRunsHereOnly] = useState(true)
  const [selected, setSelected] = useState<WorkshopTool | null>(null)

  const caps = useDeviceCapabilities()
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)
  const toggleBookmark = useBookmarkStore((s) => s.toggleMyPlaygroundTool)
  const role = usePersonaStore((s) => s.selectedPersona)

  // Mirrors desktop's Overview "Start here" pool (PlaygroundWorkshop.tsx,
  // playground.md Phase 9.2 acceptance) — role-matched tools, or beginner
  // difficulty when no role is set. Mobile had no curated pick at all before
  // this, just the full filterable/searchable grid below. Only shown in the
  // default browse state: once a visitor narrows via category, difficulty or
  // search, they've already found their own starting point, and keeping a
  // filter-blind recommendation visible would contradict the active filter.
  const startHere = useMemo(() => {
    if (category || difficulty !== 'All' || search.trim()) return []
    const runnable = MOBILE_TOOLS.filter((t) => toolFitness(t.requires, caps) === 'runs')
    const base = role
      ? runnable.filter((t) => t.recommendedPersonas.includes(role))
      : runnable.filter((t) => t.difficulty === 'beginner')
    return base.slice(0, 3)
  }, [role, category, difficulty, search, caps])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of MOBILE_TOOLS) counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    return counts
  }, [])

  const filtered = useMemo(() => {
    let tools = MOBILE_TOOLS
    if (category) tools = tools.filter((t) => t.category === category)
    if (difficulty !== 'All') tools = tools.filter((t) => t.difficulty === difficulty)
    if (runsHereOnly) tools = tools.filter((t) => toolFitness(t.requires, caps) === 'runs')
    const q = search.trim().toLowerCase()
    if (q) {
      const queries = expandSearchQuery(q)
      const hit = (hay: string) => queries.some((term) => hay.includes(term))
      tools = tools.filter(
        (t) =>
          hit(t.name.toLowerCase()) ||
          hit(t.description.toLowerCase()) ||
          t.algorithms.some((a) => hit(a.toLowerCase())) ||
          t.keywords.some((k) => hit(k)) ||
          hit(t.category.toLowerCase())
      )
    }
    return tools
  }, [category, difficulty, runsHereOnly, caps, search])

  const gatedCount = useMemo(() => MOBILE_TOOLS.filter((t) => t.requires.length > 0).length, [])

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4">
        {/* sr-only + "Playground" (2026-08-24 audit R2.2): matches the sticky
            header's real NAV_PATH_LABELS title for this route — "Crypto Lab"
            was a second, disagreeing name for the same page. */}
        <h1 className="sr-only">Playground</h1>
        <p className="text-[11.5px] text-muted-foreground">
          {MOBILE_TOOLS.length} tools · runs in-browser
        </p>
      </div>

      {startHere.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
            {role ? `Recommended for ${roleLabel(role)}` : 'Good places to start'}
          </p>
          <div className="flex flex-col gap-2.5">
            {startHere.map((tool) => (
              <ToolCardMobile
                key={tool.id}
                tool={tool}
                caps={caps}
                bookmarked={myPlaygroundTools.includes(tool.id)}
                onToggleBookmark={() => toggleBookmark(tool.id)}
                onSelect={() => setSelected(tool)}
              />
            ))}
          </div>
        </div>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Search — try "ML-KEM", "entropy", or "hybrid cert"'
        className="mb-3 h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] text-foreground placeholder:text-muted-foreground"
      />

      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
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
        {CATEGORIES.map((cat) => (
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

      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by difficulty">
        {DIFFICULTY_CHIPS.map((chip) => (
          <Button
            type="button"
            variant="ghost"
            key={chip.value}
            onClick={() => setDifficulty(chip.value)}
            aria-pressed={difficulty === chip.value}
            className={cn(
              'h-8 rounded-full border px-3 text-[11px] font-semibold capitalize',
              difficulty === chip.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      {gatedCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setRunsHereOnly((v) => !v)}
          aria-pressed={runsHereOnly}
          className={cn(
            'mb-4 h-8 rounded-full border px-3 text-[11px] font-semibold',
            runsHereOnly
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground'
          )}
        >
          Runs on this device
        </Button>
      )}

      <div className="flex flex-col gap-2.5" data-testid="playground-tools-grid">
        {filtered.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">No tools match these filters.</p>
        )}
        {filtered.map((tool) => (
          <ToolCardMobile
            key={tool.id}
            tool={tool}
            caps={caps}
            bookmarked={myPlaygroundTools.includes(tool.id)}
            onToggleBookmark={() => toggleBookmark(tool.id)}
            onSelect={() => setSelected(tool)}
          />
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The Overview landing, command palette, "My tools" pane, and the 24 Docker-backed sandbox
        scenarios are on a laptop. A VPN handshake diagram, a group-messaging key-tree visual, and
        OpenSSL Studio&apos;s full terminal + file-manager workspace need a wider screen — open
        those on a laptop too.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        large
        testId="playground-tool-detail-sheet"
      >
        {selected && <ToolDetailSheetBody tool={selected} caps={caps} />}
      </MobileSheet>
    </div>
  )
}

function ToolCardMobile({
  tool,
  caps,
  bookmarked,
  onToggleBookmark,
  onSelect,
}: {
  tool: WorkshopTool
  caps: ReturnType<typeof useDeviceCapabilities>
  bookmarked: boolean
  onToggleBookmark: () => void
  onSelect: () => void
}) {
  const Icon = tool.icon
  const unmet = tool.requires.length > 0 ? unmetRequirements(tool.requires, caps) : []

  return (
    <article className="glass-panel relative flex flex-col p-3.5">
      <Button
        type="button"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          onToggleBookmark()
        }}
        aria-label={bookmarked ? 'Remove from My tools' : 'Add to My tools'}
        className={cn(
          'absolute right-2.5 top-2.5 h-auto shrink-0 rounded p-1',
          bookmarked ? 'text-primary' : 'text-muted-foreground/50'
        )}
      >
        {bookmarked ? (
          <BookmarkCheck size={14} aria-hidden="true" />
        ) : (
          <Bookmark size={14} aria-hidden="true" />
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        // Button's own base classes hard-code whitespace-nowrap; same defect
        // class found and fixed on Threats/Patents/Compliance/Library (2026-08-24).
        className="h-auto w-full flex-col items-start gap-1.5 whitespace-normal rounded-none p-0 pr-8 text-left font-normal"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-bold leading-tight text-foreground">{tool.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">{tool.pt_id}</span>
          <span
            className={cn(
              'inline-block rounded px-1.5 py-0.5 text-sim-chip font-semibold capitalize leading-none',
              DIFFICULTY_BADGE[tool.difficulty]
            )}
          >
            {tool.difficulty}
          </span>
          {tool.wip && (
            <span className="inline-flex items-center gap-1 rounded border border-status-warning/30 bg-status-warning/15 px-1.5 py-0.5 text-sim-chip font-semibold leading-none text-status-warning">
              <Wrench className="h-2.5 w-2.5" aria-hidden="true" />
              WIP
            </span>
          )}
          {unmet.length > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-sim-chip font-semibold leading-none text-muted-foreground"
              title={`Needs ${unmet.map((r) => REQUIREMENT_LABELS[r]).join(' and ')}`}
            >
              <Monitor className="h-2.5 w-2.5" aria-hidden="true" />
              Needs a desktop
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
          {tool.description}
        </p>
      </Button>
    </article>
  )
}

function ToolDetailSheetBody({
  tool,
  caps,
}: {
  tool: WorkshopTool
  caps: ReturnType<typeof useDeviceCapabilities>
}) {
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)
  const toggleBookmark = useBookmarkStore((s) => s.toggleMyPlaygroundTool)
  const bookmarked = myPlaygroundTools.includes(tool.id)
  const unmet = tool.requires.length > 0 ? unmetRequirements(tool.requires, caps) : []
  const relatedModuleId = tool.moduleLink.startsWith('/learn/')
    ? tool.moduleLink.slice('/learn/'.length)
    : null
  // eslint-disable-next-line security/detect-object-injection -- relatedModuleId is derived from the tool's own registry-declared moduleLink, not user input
  const relatedModuleTitle = relatedModuleId ? MODULE_CATALOG[relatedModuleId]?.title : undefined

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {tool.category}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground">{tool.description}</p>
      </div>

      <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
        Algorithms
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tool.algorithms.map((a) => (
          <span
            key={a}
            className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground"
          >
            {a}
          </span>
        ))}
      </div>

      {relatedModuleId && relatedModuleTitle && (
        <Link
          to={tool.moduleLink}
          className="flex items-center gap-2.5 rounded-xl border border-border p-3"
        >
          <GraduationCap className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
              Related module
            </span>
            <span className="block truncate text-[12px] font-medium text-foreground">
              Learn the concepts in {relatedModuleTitle}
            </span>
          </span>
        </Link>
      )}

      {tool.recommendedPersonas.length > 0 && (
        <div>
          <p className="mb-1.5 text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
            Recommended for
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tool.recommendedPersonas.map((p) => (
              <span
                key={p}
                className="rounded-md bg-secondary/10 px-2 py-1 text-[11px] text-secondary"
              >
                {/* eslint-disable-next-line security/detect-object-injection -- p is a PersonaId union key */}
                {PERSONA_CHIP_LABEL[p]}
              </span>
            ))}
          </div>
        </div>
      )}

      {unmet.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
          <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-foreground">
              This tool will not run on this device
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
              It needs {unmet.map((r) => REQUIREMENT_LABELS[r]).join(' and ')}.
            </p>
          </div>
        </div>
      )}

      <div className="mt-1 flex gap-2.5">
        {/* Demoted when this device can't run it (2026-08-24 audit R4.8) —
            it was a full-weight gradient CTA directly under a "will not run
            on this device" warning, on the one platform (iOS is never
            Chromium) where that warning fires far more often than desktop. */}
        <Link
          to={`/playground/${tool.id}`}
          className={cn(
            buttonVariants({ variant: unmet.length > 0 ? 'outline' : 'gradient' }),
            'h-auto flex-1 rounded-lg py-2.5 font-bold'
          )}
        >
          Open tool
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={() => toggleBookmark(tool.id)}
          aria-pressed={bookmarked}
          className={cn(
            'h-auto rounded-lg px-4 py-2.5 font-semibold',
            bookmarked && 'text-primary'
          )}
        >
          {bookmarked ? 'Saved' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
