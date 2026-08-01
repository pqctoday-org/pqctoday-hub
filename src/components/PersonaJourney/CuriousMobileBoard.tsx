// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { NavLink, Link } from 'react-router'
import { Search, Menu, X, Bot, Map, HelpCircle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { NAV_PATH_LABELS } from '@/data/personaConfig'
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

const HNDL_ROWS: { label: string; value: string }[] = [
  { label: 'Data captured today', value: 'readable later' },
  { label: 'Must stay secret for', value: '12 years' },
  { label: 'Machine arrives', value: '~2032' },
]

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

export function CuriousMobileBoard() {
  const [moreOpen, setMoreOpen] = useState(false)
  const openSearch = useCommandPaletteStore((s) => s.open)
  const openRightPanel = useRightPanelStore((s) => s.open)

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
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
          About 6 minutes · nothing to install
        </p>
        <h1 className="text-gradient mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
          What actually breaks, and when.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The padlock in your browser relies on maths a quantum computer would undo. Watch it happen
          to a real connection, right here.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Button type="button" variant="gradient" className="w-full">
            Show me
          </Button>
          <Button type="button" variant="outline" className="w-full">
            I have 30 seconds
          </Button>
        </div>

        {/* HNDL card — pink/critical tone, rows stacked (not side-by-side) */}
        <section
          data-testid="hndl-card"
          className="glass-panel mt-6 border-critical/40 bg-critical/5 p-4"
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-critical">
            The bit that surprises people
          </p>

          <dl className="mt-3 flex flex-col gap-2.5 text-[13px]">
            {HNDL_ROWS.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-semibold text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <hr className="my-3.5 border-border/60" />

          <p className="text-base font-extrabold leading-snug text-critical">
            The deadline already passed for some data.
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
