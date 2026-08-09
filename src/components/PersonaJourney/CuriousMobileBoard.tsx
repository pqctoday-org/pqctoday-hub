// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router'
import { Search, Menu, X, Bot, Map, HelpCircle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import {
  NAV_PATH_LABELS,
  PERSONA_JOURNEY_BOARD_VARIANTS,
  resolveRoleBoardVariant,
} from '@/data/personaConfig'
import { RAIL_ICON_MAP } from '@/components/Layout/railNav'

/**
 * CuriousMobileBoard — the Curious persona's 390px mobile board
 * (IMPLEMENTATION-PLAN-2026-08-01.md §3.4).
 *
 * This is deliberately NOT a responsive variant of `PersonaBoardView` — the
 * design specs a structurally simpler layout for this one persona/breakpoint
 * combination (no 3-card grid, no track strip, a persistent 5-tab bottom bar
 * instead of the desktop rail). It is a standalone screen: its own header
 * (brand + search + "More"), hero, HNDL card, an honest labs-gating note, and
 * the bottom tab bar.
 *
 * Integration (routing/MainLayout wiring for `personaId === 'curious' &&
 * viewport < lg`) is a later step — see this component's PR description /
 * build report for the exact condition assumed.
 *
 * Icons for the routed bottom tabs are pulled from the SAME maps the desktop
 * rail uses (`RAIL_ICON_MAP`, `NAV_PATH_LABELS` in railNav.ts /
 * personaConfig.ts) rather than re-declared here, so this board can never
 * silently drift from the rail's icon/label choices for '/timeline',
 * '/threats' and '/learn'. Only the '/' tab's label is overridden locally
 * ("Start", not "Home") — a per-surface label override, same pattern
 * MainLayout already uses for "Command Center" -> "Command" on its mobile row.
 *
 * The two hero CTAs navigate to the active board's `ctaPrimaryHref` /
 * `ctaSecondaryHref` — the SAME data source and `useNavigate` pattern
 * `PersonaBoardView.tsx` uses for the desktop curious board (2026-08-02 fix:
 * these rendered as inert `<Button>`s with no click behavior at all, the
 * mobile-only counterpart of the bug already fixed on desktop 2026-08-01).
 *
 * VARIANT SUPPORT (2026-08-09). This board used to read
 * `PERSONA_JOURNEY_BOARD.curious` — the role's order-1 board and nothing else —
 * so every curious board except the default was unreachable below `lg`. Two of
 * three were invisible on mobile; at six they would have been five of six.
 *
 * Reading the active variant was only half the fix. Every visible string here
 * was a hardcoded literal: the eyebrow, the headline, the sub, both CTA
 * LABELS, all three HNDL rows and the punchline. Switching variants would have
 * changed the destinations while the words stayed put, which is worse than not
 * switching at all. They now come from the board data, so this surface is
 * finally reachable by the CSV editorial pass — the same class of defect
 * `sideCard.emptyState` in personaConfig.ts was introduced to fix.
 */

interface RoutedTabDef {
  path: string
  label: string
  icon: LucideIcon
  testId: string
}

const ROUTED_BOTTOM_TABS: RoutedTabDef[] = [
  { path: '/', label: 'Start', icon: RAIL_ICON_MAP['/'], testId: 'icon-tab-start' },
  {
    path: '/timeline',
    label: NAV_PATH_LABELS['/timeline'],
    icon: RAIL_ICON_MAP['/timeline'],
    testId: 'icon-tab-timeline',
  },
  {
    path: '/threats',
    label: NAV_PATH_LABELS['/threats'],
    icon: RAIL_ICON_MAP['/threats'],
    testId: 'icon-tab-threats',
  },
  {
    path: '/learn',
    label: NAV_PATH_LABELS['/learn'],
    icon: RAIL_ICON_MAP['/learn'],
    testId: 'icon-tab-learn',
  },
]

/**
 * Side-card tone -> the critical/warn/info treatment this board paints it with.
 * The desktop board has the same map; both read the tone the CSV declares
 * rather than assuming every curious board is a red HNDL card (the `short` and
 * `mylife` boards are not).
 */
const TONE_CLASS: Record<string, { panel: string; label: string; punchline: string }> = {
  bad: {
    panel: 'border-critical/40 bg-critical/5',
    label: 'text-critical',
    punchline: 'text-critical',
  },
  warn: {
    panel: 'border-warning/40 bg-warning/5',
    label: 'text-warning',
    punchline: 'text-warning',
  },
  info: {
    panel: 'border-primary/40 bg-primary/5',
    label: 'text-primary',
    punchline: 'text-primary',
  },
  accent: { panel: 'border-accent/50 bg-accent/5', label: 'text-accent', punchline: 'text-accent' },
}

function RoutedBottomTab({ path, label, icon: Icon, testId }: RoutedTabDef) {
  return (
    <NavLink to={path} end={path === '/'} className="flex flex-1">
      {({ isActive }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${label} view`}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-none',
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon size={20} aria-hidden="true" data-testid={testId} />
          <span className="text-[11px] leading-none">{label}</span>
        </Button>
      )}
    </NavLink>
  )
}

interface CuriousMobileBoardProps {
  /** Active board option. Same resolution rules as the desktop board. */
  variantId?: string
  onSelectVariant?: (variantId: string) => void
}

export function CuriousMobileBoard({ variantId, onSelectVariant }: CuriousMobileBoardProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()
  const openSearch = useCommandPaletteStore((s) => s.open)
  const openRightPanel = useRightPanelStore((s) => s.open)
  const variants = PERSONA_JOURNEY_BOARD_VARIANTS.curious
  const active = resolveRoleBoardVariant('curious', variantId)
  const board = active.board
  const tone = TONE_CLASS[board.sideCard.tone] ?? TONE_CLASS.bad

  const handleAssistant = () => {
    setMoreOpen(false)
    openRightPanel('chat')
  }
  const handleJourney = () => {
    setMoreOpen(false)
    openRightPanel('history')
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      {/* ── Header: brand + full-width search + "More" ─────────────────────── */}
      <header
        role="banner"
        className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-card/90 px-4 py-2.5 backdrop-blur-md"
      >
        <span className="shrink-0 text-sm font-extrabold text-primary">PQC Today</span>

        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            readOnly
            aria-label="Search PQC Today"
            placeholder="Search"
            className="h-9 cursor-pointer pl-9"
            onClick={() => openSearch()}
            onFocus={() => openSearch()}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMoreOpen(true)}
          aria-label="More menu"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          title="More — Assistant, Journey, FAQ, Community, everything the desktop nav shows"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Menu size={17} aria-hidden="true" data-testid="icon-more" />
        </Button>
      </header>

      {/* ── Scrollable body: hero + HNDL card + labs-gating note ────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-6">
        {/* Board option switcher. Horizontally scrollable rather than wrapped:
            six chips wrapping at 390px would push the headline below the fold,
            and the headline is what this board is for. */}
        <div
          className="-mx-5 mb-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1"
          role="radiogroup"
          aria-label="Choose what you want to do"
          data-testid="board-variant-chips"
        >
          {variants.map((v) => {
            const selected = v.id === active.id
            return (
              <Button
                key={v.id}
                type="button"
                variant="ghost"
                size="sm"
                role="radio"
                aria-checked={selected}
                title={v.chipDescription}
                data-testid={`board-variant-chip-${v.id}`}
                onClick={() => onSelectVariant?.(v.id)}
                className={cn(
                  'h-auto shrink-0 snap-start rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                  selected
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {v.chipLabel}
              </Button>
            )
          })}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
          {board.heroEyebrow}
        </p>
        <h1 className="text-gradient mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
          {board.headline}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{board.sub}</p>

        <div className="mt-5 flex flex-col gap-3">
          <Button
            type="button"
            variant="gradient"
            className="w-full"
            onClick={() => navigate(board.ctaPrimaryHref)}
          >
            {board.ctaPrimary}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate(board.ctaSecondaryHref)}
          >
            {board.ctaSecondary}
          </Button>
        </div>

        {/* Side card — rows stacked (not side-by-side). Tone, title, rows and
            punchline all come from the active board, so each option gets its
            own card rather than every option showing the HNDL one. */}
        <section data-testid="hndl-card" className={cn('glass-panel mt-6 p-4', tone.panel)}>
          <p className={cn('text-[10.5px] font-bold uppercase tracking-[0.12em]', tone.label)}>
            {board.sideCard.title}
          </p>

          <dl className="mt-3 flex flex-col gap-2.5 text-[13px]">
            {board.sideCard.rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-semibold text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <hr className="my-3.5 border-border/60" />

          <p className={cn('text-base font-extrabold leading-snug', tone.punchline)}>
            {board.sideCard.punchline}
          </p>
        </section>

        {/* Honest labs-gating note — plain callout, not an error state */}
        <section data-testid="labs-gating" className="glass-panel mt-4 p-4">
          <p className="text-sm font-bold text-foreground">Want the hands-on labs?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            They run real cryptography and need a laptop. We&rsquo;ll send you a link — or carry on
            reading here. Nothing is locked.
          </p>
        </section>
      </div>

      {/* ── Persistent 5-tab bottom bar (fixed, not a sheet) ────────────────── */}
      <nav
        aria-label="Curious mobile navigation"
        className="fixed inset-x-0 bottom-0 z-nav flex border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        {ROUTED_BOTTOM_TABS.map((tab) => (
          <RoutedBottomTab key={tab.path} {...tab} />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => openSearch()}
          aria-label="Search view"
          className="flex min-h-[52px] w-full flex-1 flex-col items-center justify-center gap-1 rounded-none text-muted-foreground hover:text-foreground"
        >
          <Search size={20} aria-hidden="true" data-testid="icon-tab-search" />
          <span className="text-[11px] leading-none">Search</span>
        </Button>
      </nav>

      {/* "More" menu sheet — Assistant / Journey / FAQ. Rendered after the
          bottom tab bar so it stacks above it (both share the same z-nav
          token value). */}
      {moreOpen && (
        <>
          <div
            data-testid="more-menu-backdrop"
            className="fixed inset-0 z-nav-backdrop bg-black/60"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="fixed inset-x-0 bottom-0 z-modal rounded-t-2xl border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">More</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="h-9 w-9"
              >
                <X size={16} aria-hidden="true" />
              </Button>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleAssistant}
                className="w-full justify-start gap-2.5"
              >
                <Bot size={18} aria-hidden="true" />
                Assistant
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleJourney}
                className="w-full justify-start gap-2.5"
              >
                <Map size={18} aria-hidden="true" />
                Journey
              </Button>
              <Link to="/faq" onClick={() => setMoreOpen(false)}>
                <Button type="button" variant="ghost" className="w-full justify-start gap-2.5">
                  <HelpCircle size={18} aria-hidden="true" />
                  FAQ
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
