// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import {
  Info,
  MoreHorizontal,
  X,
  Plane,
  Clock,
  Search,
  UserCog,
  Bot,
  Map,
  Wrench,
  Cpu,
  ChevronDown,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import { WhatsNewModal } from '../ui/WhatsNewModal'
import { DisclaimerModal } from '../ui/DisclaimerModal'
import { AchievementToast } from '../ui/AchievementToast'
import { PhaseCompletionToast } from '../ui/PhaseCompletionToast'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { FAQButton } from '../ui/FAQButton'
import { UserManualButton } from '../ui/UserManualButton'

import { GuidedTour } from '../common/GuidedTour'
import { Breadcrumb } from '../common/Breadcrumb'
import { PhaseContextBanner } from '../shared/PhaseContextBanner'
import { ResumeSimBar } from '../shared/ResumeSimBar'
import { RightPanelFAB } from '../RightPanel/RightPanelFAB'
import { useRightPanelStore } from '../../store/useRightPanelStore'
import { WorkflowBanner } from '../common/WorkflowBanner'
import { AirplaneModeBanner } from '../ui/AirplaneModeBanner'
import { AirplaneModeToast } from '../ui/AirplaneModeToast'
import { useAirplaneModeStore } from '../../store/useAirplaneModeStore'
import { CommandPalette } from '../Search/CommandPalette'
import { useCommandPaletteStore } from '../../store/useCommandPaletteStore'
import { PersonaSwitchModal } from '../Persona/PersonaSwitchModal'
import { PreviewBanner } from '../common/PreviewBanner'
import { useWorkshopUrlAutostart } from '../../hooks/useWorkshopUrlAutostart'
import { ScrollFadeContainer } from '../ui/ScrollFadeContainer'
import { useIsBelowLgViewport } from '../../hooks/useIsBelowLgViewport'

const RightPanel = React.lazy(() =>
  import('../RightPanel/RightPanel').then((m) => ({ default: m.RightPanel }))
)

const VideoOverlay = React.lazy(() =>
  import('../Workshop/VideoOverlay').then((m) => ({ default: m.VideoOverlay }))
)

const WorkshopOverlayHost = React.lazy(() =>
  import('../Workshop/WorkshopOverlayHost').then((m) => ({ default: m.WorkshopOverlayHost }))
)
import { usePersonaStore } from '../../store/usePersonaStore'
import { useHistoryStore } from '../../store/useHistoryStore'
import {
  PERSONA_NAV_PATHS,
  ALWAYS_VISIBLE_PATHS,
  NAV_PATH_LABELS,
  PERSONA_TIMELINE_REGION,
  PERSONA_THREATS_DEFAULT_INDUSTRIES,
  PERSONA_MARKED_NAV_PATHS,
} from '../../data/personaConfig'
import { PERSONAS } from '../../data/learningPersonas'
import type { ViewType } from '../../data/authoritativeSourcesData'
import type { PageId } from '../../data/userManualData'
import {
  getRailSections,
  getRowTreatment,
  getMobileVisiblePaths,
  RAIL_ICON_MAP,
  RAIL_ALWAYS_VISIBLE_PATHS,
  type RailRowTreatment,
} from './railNav'

// ── Route → shared-component-id lookups for the top bar's icon cluster ──────
// Both SourcesButton and UserManualButton require a page-specific id; only the
// routes below have a registered ViewType / PageId (see authoritativeSourcesData.ts
// / userManualData.ts). Routes without an entry simply omit that button, same
// as PageHeader.tsx's own `showSources = !!viewType` conditional.
const ROUTE_VIEW_TYPE: Partial<Record<string, ViewType>> = {
  '/timeline': 'Timeline',
  '/library': 'Library',
  '/threats': 'Threats',
  '/leaders': 'Leaders',
  '/algorithms': 'Algorithms',
  '/compliance': 'Compliance',
  '/migrate': 'Migrate',
  // OpenSSL Studio's own (now-removed) PageHeader call passed viewType="Library"
  // (it reuses the Library authoritative-sources list — there is no distinct
  // "OpenSSL" ViewType) — preserved here so /openssl keeps its Sources button.
  '/openssl': 'Library',
}

const ROUTE_PAGE_ID: Partial<Record<string, PageId>> = {
  '/timeline': 'timeline',
  '/algorithms': 'algorithms',
  '/library': 'library',
  '/playground': 'playground',
  '/openssl': 'openssl-studio',
  '/threats': 'threats',
  '/leaders': 'leaders',
  '/compliance': 'compliance',
  '/migrate': 'migrate',
  '/assess': 'assess',
  '/report': 'report',
  '/business': 'business-center',
  // BusinessToolsGrid ('/business/tools') is a separate nested route from
  // BusinessCenterView ('/business' index) but shares the same pageId — its
  // own (now-removed) PageHeader call passed pageId="business-center" too.
  '/business/tools': 'business-center',
  '/learn': 'learn',
}

// Bespoke Share title/text per route — preserved from each page's own
// (now-removed) `<PageHeader shareTitle=... shareText=...>` call so the
// global top bar's ShareButton keeps the same copy instead of falling back to
// the generic `"{route label} — PQC Today"` title for every route. Routes
// absent here (e.g. /learn, /migrate) never had a bespoke shareTitle on their
// PageHeader either — they keep the generic fallback, same as before.
//
// Two of these intentionally approximate rather than reproduce a dynamic
// shareText (see IMPLEMENTATION-PLAN follow-up, 2026-08-01 PageHeader
// consolidation):
//  - /algorithms used `${algorithmData.length || 'dozens of'}` — reusing the
//    same page's own "no data yet" fallback copy ("dozens of") rather than
//    duplicating its data-loading hook here.
//  - /business/tools used `${BUSINESS_TOOLS.length}` — reusing the page's own
//    static `description` copy instead of importing the tools registry (a
//    sizeable data+icon module) into the always-loaded MainLayout shell.
const ROUTE_SHARE: Partial<Record<string, { title: string; text?: string }>> = {
  '/algorithms': {
    title: 'PQC Algorithm Comparison — ML-KEM, ML-DSA, SLH-DSA & More',
    text: 'Compare dozens of cryptographic algorithms side-by-side — security levels, key sizes, and performance.',
  },
  '/assess': {
    title: 'PQC Risk Assessment — Post-Quantum Cryptography Migration Tool',
    text: 'Get a personalized quantum risk score, migration priorities, and actionable recommendations for your organization.',
  },
  '/business': {
    title: 'PQC Command Center — Quantum Readiness Workspace',
    text: 'Your PQC readiness command center — risk, compliance, governance, and actionable next steps.',
  },
  '/business/tools': {
    title: 'PQC Business Tools — Planning & Governance Toolkit',
    text: 'Interactive planning and governance tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, and more.',
  },
  '/compliance': {
    title: 'PQC Compliance Tracker — Standards, Certifications, Frameworks',
    text: 'Explore PQC compliance: standardization bodies, certification programs (FIPS 140-3, ACVP, Common Criteria), and regulatory frameworks.',
  },
  '/leaders': {
    title: 'PQC Community — People Contributing to the Advances of Post-Quantum Cryptography',
    text: 'Meet the people contributing to the advances of post-quantum cryptography.',
  },
  '/library': {
    title: 'PQC Library — NIST, IETF, ETSI & More',
    text: 'Explore post-quantum cryptography standards, drafts, and key documents.',
  },
  '/openssl': {
    title: 'OpenSSL Studio — Interactive OpenSSL v3.6.2 in Your Browser',
    text: 'Run real OpenSSL 3.6.2 commands — key generation, certificates, KEM, PQC — entirely in your browser via WebAssembly.',
  },
  '/patents': {
    title: 'PQC Patents — Post-Quantum Migration Patent Corpus',
    text: 'Cryptographic patents relevant to post-quantum migration, enriched across 25 technical dimensions.',
  },
  '/report': {
    title: 'PQC Assessment Report — Post-Quantum Cryptography Risk Analysis',
    text: 'View your personalized PQC risk score, migration priorities, and actionable recommendations.',
  },
  '/threats': {
    title: 'Quantum Threats Dashboard — Industry Risk Analysis',
    text: 'Detailed analysis of quantum threats across industries — criticality ratings, at-risk cryptography, and PQC replacements.',
  },
  '/timeline': {
    title: 'PQC Migration Timeline — Global Post-Quantum Cryptography Roadmap',
    text: 'Compare PQC migration timelines across nations — track phases from discovery to full migration.',
  },
}

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'EU',
  mena: 'MENA',
  apac: 'APAC',
  global: 'Global',
  All: 'All regions',
}

// Left-border + tint per FOR YOU row treatment. MORE rows never use these —
// they get a fixed, smaller/muted style regardless of treatment (see RailRow).
const ROW_TREATMENT_CLASS: Record<RailRowTreatment, string> = {
  featured: 'border-l-2 border-l-accent bg-accent/10 text-accent hover:bg-accent/15',
  marked:
    'border-l-2 border-dashed border-l-warning/70 text-muted-foreground hover:text-foreground',
  active: 'border-l-2 border-l-primary bg-primary/10 text-primary',
  plain:
    'border-l-2 border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20',
}

/** Route label lookup, defaulting to the raw path — centralizes the one
 * dynamic-key access instead of repeating it (and its lint suppression) at
 * every call site. */
function labelFor(path: string): string {
  // eslint-disable-next-line security/detect-object-injection
  return NAV_PATH_LABELS[path] ?? path
}

/** Route icon lookup, defaulting to a generic Info glyph. */
function iconFor(path: string): LucideIcon {
  // eslint-disable-next-line security/detect-object-injection
  return RAIL_ICON_MAP[path] ?? Info
}

interface RailRowProps {
  path: string
  label: string
  icon?: LucideIcon
  active: boolean
  /** Only meaningful when `variant` is 'primary' (the default). */
  treatment?: RailRowTreatment
  /** 'more' renders the smaller/muted style the spec requires for MORE rows —
   * it never gets the marked/dashed/featured FOR YOU treatments. */
  variant?: 'primary' | 'more'
  title?: string
  onNavigate?: () => void
}

/** One rail row (desktop rail FOR YOU/MORE, or the mobile "More" sheet). */
const RailRow: React.FC<RailRowProps> = ({
  path,
  label,
  icon,
  active,
  treatment = 'plain',
  variant = 'primary',
  title,
  onNavigate,
}) => {
  const Icon = icon ?? iconFor(path)
  const isMore = variant === 'more'
  const treatmentClass = isMore
    ? active
      ? 'text-foreground'
      : 'text-muted-foreground hover:text-foreground'
    : // eslint-disable-next-line security/detect-object-injection
      ROW_TREATMENT_CLASS[treatment]

  return (
    <NavLink to={path} end={path === '/'} onClick={onNavigate} className="block w-full">
      {({ isActive }) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${label} view`}
          aria-current={isActive ? 'page' : undefined}
          title={title ?? label}
          className={`w-full justify-start gap-2 min-h-[36px] rounded-md ${
            isMore ? 'pl-3 pr-2 text-xs' : 'pl-2 pr-2 text-sm'
          } ${treatmentClass}`}
        >
          <Icon size={isMore ? 13 : 16} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      )}
    </NavLink>
  )
}

export const MainLayout = () => {
  const location = useLocation()
  const { selectedPersona, viewAccess } = usePersonaStore()
  const { isOpen: isPanelOpen, toggle: openPanel, open: openRightPanel } = useRightPanelStore()
  const recordVisit = useHistoryStore((s) => s.recordVisit)
  // Auto-start Workshop Video Mode from `?workshop=video&autoplay=1` (Playwright recorder hook).
  useWorkshopUrlAutostart()

  React.useEffect(() => {
    recordVisit(location.pathname)
  }, [location.pathname, recordVisit])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Used only by Playwright
      window.__e2e_toggle_panel = openPanel
    }
  }, [openPanel])
  const { isEnabled: airplaneMode, setEnabled: setAirplaneMode } = useAirplaneModeStore()
  const { isOpen: paletteOpen, open: openPalette, close: closePalette } = useCommandPaletteStore()

  // Global ⌘K / Ctrl+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [openPalette])

  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  // ── Rail sections (persona-journeys A-grade redesign, 2026-08-01) ─────────
  // FOR YOU / MORE are derived from PERSONA_NAV_PATHS via a pure, unit-tested
  // helper (railNav.ts) so desktop rail + mobile sheet share one source of
  // truth instead of drifting the way the old static `navItems` array could.
  const { forYou, more } = React.useMemo(() => getRailSections(selectedPersona), [selectedPersona])
  const mobileVisiblePaths = React.useMemo(
    () => getMobileVisiblePaths(selectedPersona),
    [selectedPersona]
  )
  const isArchitect = selectedPersona === 'architect'

  // Persona-journeys A-grade redesign (2026-08-01): the Curious persona's
  // mobile board (`CuriousMobileBoard`, rendered by LandingView at '/') is a
  // standalone screen with its OWN header (brand + search + "More") and its
  // OWN persistent bottom tab bar — not a small tweak to this file's mobile
  // nav row, a genuinely different navigation paradigm scoped to this one
  // persona/route/viewport combination (IMPLEMENTATION-PLAN-2026-08-01.md
  // §3.4). Left un-suppressed, MainLayout's own mobile header + "More" sheet
  // would double up underneath/above it. `isBelowLg` uses the exact same
  // breakpoint this file's `hidden lg:flex` / `lg:hidden` rail split already
  // uses (see useIsBelowLgViewport's own docs) and LandingView gates its
  // CuriousMobileBoard render on the identical condition, so the two can
  // never disagree about when this applies. Scoped to `pathname === '/'`
  // specifically — every OTHER route (e.g. a curious-mobile user on
  // `/library`) must keep this file's normal header/nav so they aren't
  // stranded with no way to navigate away.
  const isBelowLg = useIsBelowLgViewport()
  const isCuriousMobileTakeover =
    selectedPersona === 'curious' && isBelowLg && location.pathname === '/'

  const isPathActive = React.useCallback(
    (path: string) =>
      path === '/' ? location.pathname === '/' : location.pathname.startsWith(path),
    [location.pathname]
  )

  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false)
  const [personaSwitchOpen, setPersonaSwitchOpen] = React.useState(false)

  // Close the More menu on route changes (e.g., browser back button)
  React.useEffect(() => {
    setMoreMenuOpen(false)
  }, [location.pathname])

  // Mobile "More" sheet content = everything reachable minus what's already an
  // icon in the mobile row, grouped the same way the desktop rail is (FOR YOU
  // then MORE) so the two surfaces never disagree about what's reachable.
  const mobileSheetForYou = forYou.filter((p) => !mobileVisiblePaths.includes(p))
  const mobileSheetMore = more.filter((p) => !mobileVisiblePaths.includes(p))
  const mobileSheetAllPaths = [
    ...mobileSheetForYou,
    ...mobileSheetMore,
    ...(isArchitect ? ['/playground/cacp'] : []),
  ]
  const isMoreActive = mobileSheetAllPaths.some((p) => isPathActive(p))

  // ── Top bar data ───────────────────────────────────────────────────────────
  const currentLabel = NAV_PATH_LABELS[location.pathname] ?? 'PQC Today'
  // eslint-disable-next-line security/detect-object-injection
  const regionValue = selectedPersona ? PERSONA_TIMELINE_REGION[selectedPersona] : null
  const industriesValue = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      PERSONA_THREATS_DEFAULT_INDUSTRIES[selectedPersona]
    : []
  const markedPaths = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      (PERSONA_MARKED_NAV_PATHS[selectedPersona] ?? [])
    : []
  // Simpler of the two spec-offered options: show the WIP chip whenever this
  // persona has ANY marked/pending rail rows at all, rather than only while
  // the user is actively on one of those routes.
  const showWipChip = markedPaths.length > 0
  const roleLabel = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      (PERSONAS[selectedPersona]?.label ?? 'Everyone')
    : 'Everyone'
  const viewTypeForRoute = ROUTE_VIEW_TYPE[location.pathname]
  const pageIdForRoute = ROUTE_PAGE_ID[location.pathname]
  const shareForRoute = ROUTE_SHARE[location.pathname]

  return (
    <div
      className={`h-dvh flex flex-col lg:flex-row bg-background text-foreground print:min-h-0 print:h-auto overflow-clip transition-[padding] duration-300 ${
        isPanelOpen ? 'sm:pr-[40vw]' : ''
      }`}
    >
      {/* Skip-to-main link — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-overlay focus:top-4 focus:left-4 focus:bg-background focus:text-foreground focus:p-4 focus:rounded-md focus:ring-2 focus:ring-primary focus:shadow-lg print:hidden"
      >
        Skip to main content
      </a>

      {/* ── Desktop left rail (lg+) — persistent two-axis nav ──────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[168px] lg:shrink-0 border-r border-border/60 bg-card/30 print:hidden">
        {/* Brand wordmark — desktop copy lives here now; mobile copy stays in the header below */}
        <div className="p-3 border-b border-border/40">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setAirplaneMode(!airplaneMode)}
            className="w-full flex flex-col items-start px-2"
            aria-label={
              airplaneMode ? 'Airplane Mode on — click to go online' : 'Toggle Airplane Mode'
            }
            title={
              airplaneMode ? 'Click to disable Airplane Mode' : 'Click to enable Airplane Mode'
            }
          >
            <span className="flex items-center gap-2">
              <span className="text-lg font-bold text-gradient">PQC Today</span>
              {airplaneMode && (
                <Plane size={12} className="text-primary animate-pulse" aria-hidden="true" />
              )}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Last Updated: {buildTime}
            </span>
          </Button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5"
          aria-label="Primary navigation"
        >
          {/* Implicit/global pages — always reachable, not persona-gated, not
              part of the FOR YOU/MORE coverage invariant (see railNav.ts). */}
          {RAIL_ALWAYS_VISIBLE_PATHS.map((path) => (
            <RailRow
              key={path}
              path={path}
              label={labelFor(path)}
              active={isPathActive(path)}
              treatment={isPathActive(path) ? 'active' : 'plain'}
            />
          ))}

          <span className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            For You
          </span>
          {forYou.length === 0 && (
            <span className="px-2 pb-2 text-[11px] italic text-muted-foreground/70">
              Everything, unfiltered
            </span>
          )}
          {forYou.map((path) => {
            const active = isPathActive(path)
            const treatment = getRowTreatment(selectedPersona, path, active)
            const title =
              treatment === 'featured'
                ? 'Executive Overview — a guided, ~20-minute walk through the program (EXEC_TOUR_STAGES)'
                : treatment === 'marked'
                  ? `${labelFor(path)} — in progress, not yet fully tailored to this role`
                  : undefined
            return (
              <RailRow
                key={path}
                path={path}
                label={labelFor(path)}
                active={active}
                treatment={treatment}
                title={title}
              />
            )
          })}
          {isArchitect && (
            <RailRow
              path="/playground/cacp"
              label="CACP"
              icon={Cpu}
              active={location.pathname.startsWith('/playground/cacp')}
              treatment="plain"
              title="Crypto Agility Control Plane — KMIP 3.0 control plane (1-click shortcut)"
            />
          )}

          <span className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            More
          </span>
          {more.map((path) => (
            <RailRow
              key={path}
              path={path}
              label={labelFor(path)}
              active={isPathActive(path)}
              variant="more"
            />
          ))}
        </nav>

        {/* Utility dock — same open-state as the existing Assistant/Journey
            triggers elsewhere (PageHeader's Assistant button, the mobile
            sheet's Journey History button); no parallel feature built. */}
        <div className="p-2 border-t border-border/40 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openRightPanel('chat')}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            aria-label="Assistant"
            title="Ask the PQC Assistant"
          >
            <Bot size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel('history')}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            aria-label="Journey"
            title="Open your Journey map"
          >
            <Map size={16} aria-hidden="true" />
          </Button>
        </div>
      </aside>

      {/* ── Right column: top bar + scrollable content ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Sim header strip — kept visible on every hub resource opened from the
            PQC Today Sim, so the simulation context is never lost on a redirect. */}
        <ResumeSimBar />

        {/* Suppressed for the Curious-mobile-board takeover (see
            `isCuriousMobileTakeover` above) — that screen renders its own
            header; this one would only double up underneath it. */}
        {!isCuriousMobileTakeover && (
          <header
            className="m-4 sticky top-[max(1rem,env(safe-area-inset-top))] z-50 transition-all duration-300 print:hidden"
            role="banner"
          >
            <div className="glass-panel p-2 lg:p-4 flex w-full items-center gap-2 relative">
              {/* Mobile brand — always a button; toggles Airplane Mode on/off.
                Desktop copy lives in the rail above. */}
              <Button
                variant="ghost"
                type="button"
                onClick={() => setAirplaneMode(!airplaneMode)}
                className="lg:hidden flex-shrink-0 flex items-center gap-1.5 min-h-[44px] min-w-[44px]"
                aria-label={
                  airplaneMode ? 'Airplane Mode on — tap to go online' : 'Toggle Airplane Mode'
                }
                title={
                  airplaneMode ? 'Tap to disable Airplane Mode' : 'Tap to enable Airplane Mode'
                }
              >
                <span className="text-base font-bold text-gradient">PQC</span>
                {airplaneMode && (
                  <Plane size={12} className="text-primary animate-pulse" aria-hidden="true" />
                )}
              </Button>

              {/* Desktop top bar — region/industry pill, WIP chip, action icon
                cluster, ⌘K search, role switcher. Rail owns nav on desktop, so
                this replaces the old flat nav row entirely at lg+. */}
              <div className="hidden lg:flex items-center justify-between gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {selectedPersona ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-xs text-muted-foreground min-w-0 truncate"
                      title={`PERSONA_TIMELINE_REGION.${selectedPersona} = "${regionValue}" · PERSONA_THREATS_DEFAULT_INDUSTRIES.${selectedPersona} = [${
                        industriesValue.join(', ') || '—'
                      }]`}
                    >
                      <span className="truncate">
                        {REGION_LABELS[regionValue ?? 'global'] ?? regionValue}
                        {industriesValue.length > 0 ? ` · ${industriesValue.join(', ')}` : ''}
                      </span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-xs text-muted-foreground"
                      title="No role selected — showing unfiltered data across all regions and industries"
                    >
                      All regions · All industries
                    </span>
                  )}
                  {showWipChip && (
                    <span
                      className="inline-flex items-center gap-1 rounded-lg border text-status-warning bg-status-warning px-2 py-1 text-[11px] font-medium shrink-0"
                      title="Some destinations on this board are marked in-progress — see the dashed rail rows."
                    >
                      <Wrench size={12} aria-hidden="true" />
                      WIP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => openRightPanel('chat')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20"
                    aria-label="Open PQC Assistant"
                  >
                    <MessageCircle size={14} aria-hidden="true" />
                    <span>Assistant</span>
                  </Button>
                  <ShareButton
                    title={shareForRoute?.title ?? `${currentLabel} — PQC Today`}
                    text={shareForRoute?.text}
                  />
                  <FAQButton />
                  {viewTypeForRoute && <SourcesButton viewType={viewTypeForRoute} />}
                  <GlossaryButton />
                  {pageIdForRoute && <UserManualButton pageId={pageIdForRoute} />}

                  <Button
                    variant="outline"
                    onClick={openPalette}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50 text-sm text-muted-foreground min-w-[140px] h-auto"
                    aria-label="Search (⌘K)"
                  >
                    <Search size={14} aria-hidden="true" />
                    <span className="flex-1 text-left">Search…</span>
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/50">
                      ⌘K
                    </kbd>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setPersonaSwitchOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg h-auto text-sm"
                    aria-label="Switch role"
                    title="Switch your role"
                  >
                    <UserCog size={14} aria-hidden="true" />
                    <span className="truncate max-w-[110px]">{roleLabel}</span>
                    <ChevronDown size={12} aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Mobile nav row — icon-only row + "More" sheet trigger.
                Unchanged mechanism from before the rail rebuild; only the
                underlying path list now sources from the same rail sections
                the desktop rail uses (see mobileVisiblePaths above). */}
              <nav className="w-full lg:hidden" role="navigation" aria-label="Main navigation">
                <ScrollFadeContainer scrollClassName="flex flex-row flex-nowrap items-center justify-between gap-1">
                  {mobileVisiblePaths.map((path) => {
                    const Icon = iconFor(path)
                    const label = labelFor(path)
                    return (
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className="flex-1 flex justify-center"
                      >
                        {({ isActive }) => (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`${label} view`}
                            aria-current={isActive ? 'page' : undefined}
                            className={
                              isActive
                                ? 'bg-primary/10 text-foreground border border-primary/20 px-2 min-h-[44px] flex-col items-center gap-0'
                                : 'text-muted-foreground hover:text-foreground px-2 min-h-[44px] flex-col items-center gap-0'
                            }
                          >
                            <Icon size={18} aria-hidden="true" />
                            <span className="text-[11px] leading-tight mt-1 truncate max-w-[72px] text-center">
                              {label === 'Command Center' ? 'Command' : label}
                            </span>
                          </Button>
                        )}
                      </NavLink>
                    )
                  })}

                  {/* Mobile "More" button — folds FOR YOU (rest) + MORE + the
                    architect CACP shortcut into the existing bottom sheet. */}
                  {mobileSheetAllPaths.length > 0 && (
                    <div className="flex-1 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMoreMenuOpen(true)}
                        aria-label={`More navigation options (${mobileSheetAllPaths.length} pages)`}
                        aria-expanded={moreMenuOpen}
                        aria-haspopup="dialog"
                        title={`More pages (${mobileSheetAllPaths.length})`}
                        className={
                          isMoreActive
                            ? 'relative bg-primary/10 text-foreground border border-primary/20 px-1 min-h-[44px] flex-col items-center gap-0'
                            : 'relative text-muted-foreground hover:text-foreground px-1 min-h-[44px] flex-col items-center gap-0'
                        }
                      >
                        <span className="relative">
                          <MoreHorizontal size={18} aria-hidden="true" />
                          <span
                            aria-hidden="true"
                            className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-primary/20 text-primary text-[9px] font-semibold leading-[14px] text-center"
                          >
                            {mobileSheetAllPaths.length}
                          </span>
                        </span>
                        <span className="text-[11px] leading-tight mt-0.5">More</span>
                      </Button>
                    </div>
                  )}
                </ScrollFadeContainer>
              </nav>
            </div>
          </header>
        )}

        {/* Mobile "More" bottom sheet — unreachable in the Curious-mobile
            takeover state anyway (its trigger button lives inside the
            suppressed header above), gated explicitly for clarity/safety. */}
        {!isCuriousMobileTakeover && moreMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-nav-backdrop bg-black/60 lg:hidden"
              onClick={() => setMoreMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Sheet */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
              className="fixed inset-x-0 bottom-0 z-nav lg:hidden bg-card border-t border-border rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl max-h-[75dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-foreground">More</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] p-0"
                  onClick={() => setMoreMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={16} />
                </Button>
              </div>

              {mobileSheetForYou.length > 0 && (
                <>
                  <span className="block px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    For You
                  </span>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {mobileSheetForYou.map((path) => (
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        onClick={() => setMoreMenuOpen(false)}
                      >
                        {({ isActive }) => (
                          <Button
                            variant="ghost"
                            className={`w-full min-h-[44px] justify-start gap-2 ${
                              isActive
                                ? 'bg-primary/10 text-foreground border border-primary/20'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            aria-label={`${labelFor(path)} view`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {React.createElement(iconFor(path), {
                              size: 18,
                              'aria-hidden': true,
                            })}
                            <span>{labelFor(path)}</span>
                          </Button>
                        )}
                      </NavLink>
                    ))}
                    {isArchitect && (
                      <NavLink to="/playground/cacp" onClick={() => setMoreMenuOpen(false)}>
                        {({ isActive }) => (
                          <Button
                            variant="ghost"
                            className={`w-full min-h-[44px] justify-start gap-2 ${
                              isActive
                                ? 'bg-primary/10 text-foreground border border-primary/20'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            aria-label="CACP view"
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <Cpu size={18} aria-hidden="true" />
                            <span>CACP</span>
                          </Button>
                        )}
                      </NavLink>
                    )}
                  </div>
                </>
              )}

              {mobileSheetMore.length > 0 && (
                <>
                  <span className="block px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    More
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {mobileSheetMore.map((path) => (
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        onClick={() => setMoreMenuOpen(false)}
                      >
                        {({ isActive }) => (
                          <Button
                            variant="ghost"
                            className={`w-full min-h-[44px] justify-start gap-2 text-xs ${
                              isActive
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            aria-label={`${labelFor(path)} view`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {React.createElement(iconFor(path), {
                              size: 16,
                              'aria-hidden': true,
                            })}
                            <span>{labelFor(path)}</span>
                          </Button>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                {/* Airplane Mode toggle */}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setAirplaneMode(!airplaneMode)
                    setMoreMenuOpen(false)
                  }}
                  className="col-span-2 w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
                  aria-pressed={airplaneMode}
                >
                  <span className="flex items-center gap-2">
                    <Plane size={18} aria-hidden="true" />
                    Airplane Mode
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      airplaneMode ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {airplaneMode ? 'On' : 'Off'}
                  </span>
                </Button>

                {/* Search shortcut — the only touch-reachable entry point to
                    CommandPalette on mobile; desktop already has the "Search…"
                    chip (hidden lg:flex, in the top bar) plus the ⌘K/Ctrl+K shortcut. */}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false)
                    openPalette()
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
                >
                  <Search size={18} aria-hidden="true" />
                  Search
                </Button>

                {/* Journey History shortcut */}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false)
                    openPanel('history')
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
                >
                  <Clock size={18} aria-hidden="true" />
                  Journey History
                </Button>

                {/* Assistant shortcut */}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false)
                    openRightPanel('chat')
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
                >
                  <Bot size={18} aria-hidden="true" />
                  Assistant
                </Button>

                {/* Switch role shortcut — only when a persona is set */}
                {selectedPersona && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false)
                      setPersonaSwitchOpen(true)
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
                  >
                    <UserCog size={18} aria-hidden="true" />
                    Switch role
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {personaSwitchOpen && <PersonaSwitchModal onClose={() => setPersonaSwitchOpen(false)} />}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {isCuriousMobileTakeover ? (
            /* Curious-mobile takeover: bare Outlet, no container padding, no
               banners/Breadcrumb/PhaseContextBanner — CuriousMobileBoard is a
               full-bleed standalone screen that supplies all of its own
               chrome. `id="main-content"` + `role="main"` are kept so the
               skip-link and the page's main landmark still resolve. */
            <div id="main-content" role="main">
              <React.Suspense
                fallback={
                  <div className="flex min-h-[200px] h-[50dvh] w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-muted-foreground animate-pulse">Loading...</p>
                    </div>
                  </div>
                }
              >
                <Outlet />
              </React.Suspense>
            </div>
          ) : (
            <>
              {/* Main Content Area */}
              <main id="main-content" className="container py-4 px-4 md:py-8 md:px-8" role="main">
                {/* Offline mode info banner */}
                <AirplaneModeBanner />

                {/* Migration planning workflow progress banner */}
                <WorkflowBanner />

                {/* Preview mode banner — curious persona browsing advanced routes */}
                {selectedPersona === 'curious' &&
                  viewAccess === 'preview' &&
                  !ALWAYS_VISIBLE_PATHS.includes(location.pathname) &&
                  !(PERSONA_NAV_PATHS.curious ?? []).includes(location.pathname) && (
                    <PreviewBanner />
                  )}

                {/* Suspense boundary for route-level code splitting */}
                <React.Suspense
                  fallback={
                    <div className="flex min-h-[200px] h-[50dvh] w-full items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-muted-foreground animate-pulse">Loading...</p>
                      </div>
                    </div>
                  }
                >
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="lg:flex lg:items-start lg:gap-6"
                  >
                    <div className="min-w-0 lg:flex-1">
                      <Breadcrumb />
                      {/* "You're viewing Phase X" banner — shows when a ?phase= param is
                          present (e.g. a deep link); self-skips Assess/Report/Command Center. */}
                      <PhaseContextBanner />
                      <Outlet />
                    </div>
                  </motion.div>
                </React.Suspense>
              </main>

              {/* Footer */}
              <footer className="border-t border-border mt-12 py-8 text-center text-muted-foreground text-sm px-4 print:hidden safe-bottom">
                <p>
                  © 2025 PQC Today. Data sourced from the public internet resources.{' '}
                  <Link to="/terms" className="underline hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  {' · '}
                  <Link
                    to="/editorial-independence"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Editorial Independence
                  </Link>
                  {' · '}
                  <Link to="/sponsor" className="underline hover:text-foreground transition-colors">
                    Sponsor
                  </Link>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Content may be inaccurate. Please verify information independently. Report
                  inaccuracies in{' '}
                  <a
                    href="https://github.com/pqctoday-org/pqctoday-hub/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    GitHub Discussions
                  </a>
                  .
                </p>
              </footer>
            </>
          )}

          {/* Offline connectivity toast + monitor */}
          <AirplaneModeToast />

          {/* What's New Modal — persona-aware, data-driven */}
          <WhatsNewModal />

          {/* First-visit disclaimer — must acknowledge before using the app */}
          <DisclaimerModal />

          {/* Toast notifications — role="status" so screen readers announce them.
              A plain <div>'s implicit role is "generic", which prohibits aria-label
              (axe: aria-prohibited-attr) since a generic element can't have a name. */}
          <div role="status" aria-live="polite" aria-label="Notifications" aria-atomic="false">
            {/* Achievement Toast Notification */}
            <AchievementToast />

            {/* Phase Completion Toast */}
            <PhaseCompletionToast />
          </div>

          {/* First-visit Guided Tour */}
          <GuidedTour />
        </div>
      </div>

      {/* Assistant bottom drawer — pinned below scrollable content */}
      <RightPanelFAB />
      <React.Suspense fallback={null}>{isPanelOpen && <RightPanel />}</React.Suspense>

      {/* Workshop overlay primitives (Spotlight / Callout / CaptionBar) — shared by Workshop Mode + Video Mode */}
      <React.Suspense fallback={null}>
        <WorkshopOverlayHost />
      </React.Suspense>
      {/* Video Mode driver — RAF cue scheduler + bottom control bar */}
      <React.Suspense fallback={null}>
        <VideoOverlay />
      </React.Suspense>

      {/* Command palette — ⌘K search */}
      <CommandPalette isOpen={paletteOpen} onClose={closePalette} />
    </div>
  )
}
