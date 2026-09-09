// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
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
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '../../lib/utils'
// Lazy — same reasoning as the mobile shell / RightPanel below, but for data
// weight rather than component weight: WhatsNewModal pulls in
// utils/dataFingerprint, which statically imports NINE full datasets
// (library, migrate, threats, leaders, timeline, compliance, algorithms,
// authoritative sources, certification xrefs, quiz). A static import here
// rode all of that into every visitor's eager bundle — found via the
// precache budget when library growth pushed eager JS past its 15 MB gate.
const WhatsNewModal = React.lazy(() =>
  import('../ui/WhatsNewModal').then((m) => ({ default: m.WhatsNewModal }))
)
import { DisclaimerModal } from '../ui/DisclaimerModal'
import { AchievementToast } from '../ui/AchievementToast'
import { PhaseCompletionToast } from '../ui/PhaseCompletionToast'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { FAQButton } from '../ui/FAQButton'
import { UserManualButton } from '../ui/UserManualButton'

import { GuidedTour } from '../common/GuidedTour'
import { PhaseContextBanner } from '../shared/PhaseContextBanner'
import { ResumeSimBar } from '../shared/ResumeSimBar'
import { useRightPanelStore } from '../../store/useRightPanelStore'
import { WorkflowBanner } from '../common/WorkflowBanner'
import { AirplaneModeBanner } from '../ui/AirplaneModeBanner'
import { AirplaneModeToast } from '../ui/AirplaneModeToast'
import { useAirplaneModeStore } from '../../store/useAirplaneModeStore'
import { CommandPalette } from '../Search/CommandPalette'
import { useCommandPaletteStore } from '../../store/useCommandPaletteStore'
import { PersonaSwitchModal } from '../Persona/PersonaSwitchModal'
import { PageActionStrip } from '../common/PageActionStrip'
import { usePageActionsStore } from '../../store/usePageActionsStore'
import { PreviewBanner } from '../common/PreviewBanner'
import { ExecutiveGrcSplitNotice } from '../common/ExecutiveGrcSplitNotice'
import { useWorkshopUrlAutostart } from '../../hooks/useWorkshopUrlAutostart'
import { ScrollFadeContainer } from '../ui/ScrollFadeContainer'
import { useIsBelowLgViewport } from '../../hooks/useIsBelowLgViewport'
import { useIsMobileShell } from '../../hooks/useIsMobileShell'

// Lazy — same reasoning as RightPanel/VideoOverlay/WorkshopOverlayHost below:
// MainLayout is mounted on every route, so a static import here would put
// the whole mobile shell (and everything it pulls in — RoleHomeView,
// SourcesModal, Glossary, UserManualPanel) into every desktop visitor's
// eager bundle even though useIsMobileShell() is false for nearly all of
// them. Found via the precache budget: a static import measurably grew the
// eager payload (19.64 -> 19.66 MB) for a feature that render-guards itself
// off. `!isMobileShell` bails before React ever needs these — the
// `<Suspense fallback={null}>` around each usage never has anything to show.
const MobileHeader = React.lazy(() =>
  import('../Mobile/shell/MobileHeader').then((m) => ({ default: m.MobileHeader }))
)
const MobileBottomBar = React.lazy(() =>
  import('../Mobile/shell/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar }))
)
const MobilePageActionsSheet = React.lazy(() =>
  import('../Mobile/shell/MobilePageActionsSheet').then((m) => ({
    default: m.MobilePageActionsSheet,
  }))
)
const MobileRoleSelection = React.lazy(() =>
  import('../Mobile/shell/MobileRoleSelection').then((m) => ({ default: m.MobileRoleSelection }))
)
const MobileWorkshopDock = React.lazy(() =>
  import('../Mobile/shell/MobileWorkshopDock').then((m) => ({ default: m.MobileWorkshopDock }))
)

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
  isPersonaVisiblePath,
  NAV_PATH_LABELS,
  PERSONA_MARKED_NAV_PATHS,
  PERSONA_TIMELINE_REGION,
  PERSONA_THREATS_DEFAULT_INDUSTRIES,
} from '../../data/personaConfig'
import { REGION_LABELS } from '../../data/regionIndustryOptions'
import { PERSONAS } from '../../data/learningPersonas'
import {
  ROUTE_VIEW_TYPE,
  ROUTE_PAGE_ID,
  pageIdForNestedRoute,
  ROUTE_SHARE,
} from '../../data/routePageMeta'
import {
  getRailSections,
  getRowTreatment,
  getMobileVisiblePaths,
  getForYouGroups,
  getGroupAbsences,
  computeGroupDisplayPaths,
  FOR_YOU_GROUP_BLURBS,
  RAIL_ICON_MAP,
  type RailRowTreatment,
} from './railNav'

// Footer copyright year — computed once at module load so it never needs a
// manual bump (was a hardcoded "© 2025" literal that would silently go stale
// every January).
const COPYRIGHT_YEAR = new Date().getFullYear()

// Route -> shared-component-id lookups (ROUTE_VIEW_TYPE, ROUTE_PAGE_ID,
// NESTED_ROUTE_PAGE_ID, pageIdForNestedRoute, ROUTE_SHARE) moved to
// '@/data/routePageMeta' (pure-move extraction E-5, IMPLEMENTATION-PLAN.md
// §5.4) so the mobile shell's page-actions selector can read the same
// tables this top bar reads.

// Left-border + tint per FOR YOU row treatment. MORE rows never use these —
// they get a fixed, smaller/muted style regardless of treatment (see RailRow).
const ROW_TREATMENT_CLASS: Record<RailRowTreatment, string> = {
  featured: 'border-l-2 border-l-accent bg-accent/10 text-accent-legible hover:bg-accent/15',
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

/**
 * "Not offered for your role" (B+ remediation 1.3, 2026-08-10; reshaped
 * 2026-08-10 after review).
 *
 * The programme's second grading principle — a deliberate absence must be
 * visible where it takes effect — but rendered as NAVIGATION, not as prose.
 *
 * The first version put the whole reason and its alternative on screen as a
 * bordered paragraph. In a 168px rail that wrapped to four lines, and two of
 * them plus three group blurbs turned a nav column into a wall of text: the
 * exact "too cluttered" problem the 2026-08-01 declutter pass had just fixed.
 * Correct information, wrong object.
 *
 * Now it is a single dimmed row in the same shape and rhythm as `RailRow` —
 * icon, label, and a muted slash marking it unavailable — so the absence reads
 * at a glance as "this exists and is not for you" rather than as missing. The
 * reason and the alternative are one click away, which is where explanation
 * belongs in a surface whose job is to get you somewhere.
 */
const RailAbsenceNotice: React.FC<{
  path: string
  label: string
  reason: string
  insteadPath: string
  insteadLabel: string
}> = ({ path, label, reason, insteadPath, insteadLabel }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={`${label} — not offered for your role. ${reason}`}
        className="w-full justify-start gap-2 min-h-[36px] rounded-md pl-2 pr-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground"
      >
        {/* createElement rather than <Icon />, matching RailRow above: a
            capitalised local binding reads as a component declared during
            render to react-hooks/static-components. */}
        {React.createElement(iconFor(path), {
          size: 16,
          'aria-hidden': true,
          className: 'shrink-0 opacity-60',
        })}
        <span className="truncate line-through decoration-muted-foreground/40">{label}</span>
        <Info size={11} aria-hidden="true" className="ml-auto shrink-0 opacity-70" />
      </Button>
      {open && (
        <div className="mb-1 ml-2 mr-2 border-l border-border pl-2">
          <p className="text-[10px] leading-snug text-muted-foreground">{reason}</p>
          <NavLink
            to={insteadPath}
            className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline"
          >
            {insteadLabel}
            <ChevronRight size={10} aria-hidden="true" />
          </NavLink>
        </div>
      )}
    </div>
  )
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

  // bplus-programme WS7b (2026-08-07): this used to be <NavLink><Button>…
  // </Button></NavLink> — a real <button> nested inside a real <a>, invalid
  // HTML that gave every nav row two separate keyboard/screen-reader stops
  // instead of one (measured live: tabbing through the rail visited "Home"
  // as a link, then "Home view" as a button, for every single row). Fixed by
  // applying Button's own `buttonVariants` styling directly to the NavLink,
  // so there's exactly one focusable, one accessible element per row —
  // pixel-identical, since it reuses the exact same class-generating
  // function Button itself calls. `aria-current="page"` no longer needs
  // manual handling: NavLink sets it automatically when active.
  return (
    <NavLink
      to={path}
      end={path === '/'}
      onClick={onNavigate}
      title={title ?? label}
      aria-label={`${label} view`}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'w-full justify-start gap-2 min-h-[36px] rounded-md',
        isMore ? 'pl-3 pr-2 text-[11px]' : 'pl-2 pr-2 text-[11px]',
        treatmentClass
      )}
    >
      {React.createElement(Icon, {
        size: isMore ? 13 : 16,
        'aria-hidden': true,
        className: 'shrink-0',
      })}
      <span className="truncate">{label}</span>
      {/* Marks the dashed/"marked" treatment ON the row rather than in a
          detached legend at the foot of the rail. `title` (set by the caller)
          carries the full sentence. */}
      {treatment === 'marked' && !isMore && (
        <span
          className="ml-auto shrink-0 rounded bg-status-warning/15 px-1 text-[9px] font-bold uppercase leading-4 tracking-wide text-status-warning"
          aria-hidden="true"
        >
          wip
        </span>
      )}
    </NavLink>
  )
}

export const MainLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  // `<MotionConfig reducedMotion="user">` (AppRoot.tsx) only suppresses
  // TRANSFORM-based animation — framer-motion's own design deliberately keeps
  // opacity transitions running under reduced motion (cross-fades aren't
  // treated as the kind of motion that triggers vestibular discomfort). The
  // route-content wrapper below animates BOTH `y` and `opacity`, so a user who
  // has explicitly asked for reduced motion still got a 300ms low-contrast
  // fade on every single navigation — MotionConfig only silently dropped the
  // y-slide. Found 2026-08-02 diagnosing a CI-only a11y failure: the E2E spec
  // has no settle delay between paint and the axe check, so it reliably
  // sampled mid-fade; local manual reproduction always added a `waitForTimeout`
  // before injecting axe, which happened to outlast the 300ms fade every time,
  // masking the defect through dozens of attempts. Real users with reduced
  // motion see the identical flash on identical timing — this was a genuine
  // accessibility defect, not just a test artifact.
  const prefersReducedMotion = useReducedMotion()
  const {
    selectedPersona,
    viewAccess,
    hasSkippedPersonalization,
    selectedRegion,
    selectedIndustries,
  } = usePersonaStore()
  const { isOpen: isPanelOpen, toggle: openPanel, open: openRightPanel } = useRightPanelStore()
  const recordVisit = useHistoryStore((s) => s.recordVisit)
  // Auto-start Workshop Video Mode from `?workshop=video&autoplay=1` (Playwright recorder hook).
  useWorkshopUrlAutostart()

  React.useEffect(() => {
    recordVisit(location.pathname)
  }, [location.pathname, recordVisit])

  // The app's real scroll container is this inner div (see the ref below), not
  // window/document — ScrollToTop.tsx's window.scrollTo only fires on a real
  // route change, and picking a persona (Role Home card, or the top-bar
  // switcher from anywhere) never changes the route (always `/`). Without
  // this, switching persona while scrolled down left the new board rendered
  // at the old scroll offset — its hero/CTA buttons pushed off-screen above
  // the viewport, reading as "the buttons don't work" when they were just not
  // visible. Resets on both persona change and pathname change (belt-and-
  // suspenders alongside ScrollToTop.tsx for this specific container).
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    // Plain scrollTop assignment, not scrollTo({behavior:'instant'}) - jsdom
    // (used by every test in this file) doesn't implement Element.scrollTo.
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
  }, [selectedPersona, location.pathname])

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
  const forYouGroups = React.useMemo(() => getForYouGroups(forYou), [forYou])
  const mobileVisiblePaths = React.useMemo(
    () => getMobileVisiblePaths(selectedPersona),
    [selectedPersona]
  )

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

  // Mobile UX layer (design_handoff_pqc_mobile_ux/IMPLEMENTATION-PLAN.md).
  // On by default as of 2026-08-23 — see featureFlags.ts. Computed before
  // isCuriousMobileTakeover below, which needs to know about it.
  const isMobileShell = useIsMobileShell()

  // `!isMobileShell` added 2026-08-23 — real bug, found by a test exercising
  // the REAL useIsMobileShell/useIsBelowLgViewport hooks together for the
  // first time (LandingView.integration.test.tsx; every earlier test of this
  // interaction mocked useIsMobileShell directly, which bypasses this
  // computation entirely). Without it: once the flag defaults on,
  // LandingView's OWN isMobileShell check (placed first, see LandingView.tsx)
  // already wins and renders the new MobileHomeBoard for curious — but this
  // flag stayed true regardless, so MainLayout suppressed its OWN header and
  // bottom-bar anyway, assuming the legacy CuriousMobileBoard (which supplies
  // its own chrome) was what actually rendered. Net result: real content, no
  // chrome at all. CuriousMobileBoard's branch in LandingView.tsx is
  // intentionally NOT deleted (only reachable with the flag explicitly
  // opted out via '0') — this just makes the takeover-suppression agree with
  // which board is actually rendering.
  const isCuriousMobileTakeover =
    selectedPersona === 'curious' && isBelowLg && location.pathname === '/' && !isMobileShell

  // Navigate (force-cluster graph, design_handoff_force_cluster/IMPLEMENTATION-PLAN-2026-08-28.md
  // §2.6). Unlike isCuriousMobileTakeover, this does NOT suppress the rail/top-bar chrome
  // (deliberate product decision: "keep the left and top bar") — it only affects which
  // content-wrapper branch renders below (bare Outlet vs. the padded/max-w-7xl/motion one),
  // so it's used ONLY at that one branch-selection point, never at the header/bottom-nav
  // suppression checks that key off isCuriousMobileTakeover elsewhere in this file.
  const isFullBleedContentRoute = location.pathname === '/navigate'

  const isPathActive = React.useCallback(
    (path: string) =>
      path === '/' ? location.pathname === '/' : location.pathname.startsWith(path),
    [location.pathname]
  )

  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false)
  const [personaSwitchOpen, setPersonaSwitchOpen] = React.useState(false)

  const [mobilePageActionsOpen, setMobilePageActionsOpen] = React.useState(false)
  const [mobileRoleSwitchOpen, setMobileRoleSwitchOpen] = React.useState(false)
  // Same condition LandingView.tsx already uses for the identical no-persona
  // state (Rule 2 — one source of truth for "has this user chosen or
  // explicitly skipped personalization yet").
  const isMobileFirstRun = !selectedPersona && !hasSkippedPersonalization

  // Close the More menu / mobile page-actions sheet on route changes (e.g., browser back button)
  React.useEffect(() => {
    setMoreMenuOpen(false)
    setMobilePageActionsOpen(false)
  }, [location.pathname])

  // ── Desktop rail's collapsible MORE section (2026-08-01 declutter follow-up) ──
  // Collapsed by default per the user's live-review request ("too cluttered...
  // collapsible sections"). Plain local component state, NOT a persisted
  // usePersonaStore field — judgment call (flagged): a persisted "user closed
  // MORE" preference would fight the auto-expand-on-active-route behavior
  // right below (which must win open on every landing whether or not the user
  // previously collapsed it), and this is cheap, low-stakes UI chrome a user
  // can re-expand in one click — not worth a version bump + migrate() +
  // onRehydrateStorage for. Resets to collapsed each session/full reload.
  // Per-FOR-YOU-sub-group collapse (2026-08-01 follow-up: "collapse is per
  // section not just a more at the end"). All groups now default OPEN.
  //
  // Reference defaulted to COLLAPSED from 2026-08-01 ("collapse reference by
  // default" — standing material, lower priority than day-to-day workflow) and
  // was reopened on 2026-08-02. Collapsing it hid Algorithms, Library, Leaders,
  // Patents, Timeline and Threats behind a disclosure on a fresh visit, which
  // is a lot of the product to make invisible by default; it had already forced
  // one related fix (Learn was promoted out of this group for the same reason).
  // Rows stay collapsible — this only changes the initial state.
  const [collapsedForYouGroups, setCollapsedForYouGroups] = React.useState<Set<string>>(
    () => new Set()
  )
  const toggleForYouGroup = React.useCallback((groupId: string) => {
    setCollapsedForYouGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])
  // MORE removed from the desktop rail's FOR-YOU-populated case entirely
  // (2026-08-01 follow-up: "remove more and revisions from the left bar") —
  // for executive/developer/architect/ops/curious, whatever lands in `more`
  // (e.g. /revisions for everyone, /explore or /leaders for some personas) is
  // reachable via search (⌘K) or direct URL, not a rail row. `more` itself is
  // kept — used by the mobile "More" sheet as before, AND (reachability fix,
  // Grade-A remediation Phase 2, 2026-08-02) rendered directly in the desktop
  // rail's `forYou.length === 0` fallback below, since for researcher/
  // no-persona `more` is the ONLY place the other 13 routes exist at all —
  // see that block's own comment for the full history.

  // "Update your profile" deep link — `/?picker=open` (PQC101Module's two
  // "Update profile"/"Set profile" links, AboutNextStepCTA's "Find my
  // starting point" fallback). Previously handled by PersonalizationSection's
  // own `?scroll=persona`/`?picker=open` effect, which scrolled to/opened the
  // wizard; both retired together (see PersonalizationSection.tsx's removal).
  // PQC101Module's two links used `?scroll=persona` — repointed to
  // `?picker=open` so both CTAs share this one handler. Judgment call (flagged
  // in the build report): opens the persona-switch modal — the same identity
  // control the rail's role-switcher opens — rather than the new region/
  // industry pill, since these three CTAs were always about "pick a persona",
  // not region/industry. When no persona is set and Role Home hasn't been
  // skipped, Role Home already renders on `/` and fully covers this, so the
  // effect no-ops instead of stacking a second persona picker on top of it.
  React.useEffect(() => {
    if (location.pathname !== '/') return
    const params = new URLSearchParams(location.search)
    if (params.get('picker') !== 'open') return
    if (selectedPersona || hasSkippedPersonalization) {
      setPersonaSwitchOpen(true)
    }
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately re-runs only on navigation to '/' with the param present; navigate/selectedPersona/hasSkippedPersonalization are read, not depended on, for re-triggering
  }, [location.pathname, location.search])

  // Mobile "More" sheet content = everything reachable minus what's already an
  // icon in the mobile row, grouped the same way the desktop rail is (FOR YOU
  // then MORE) so the two surfaces never disagree about what's reachable.
  const mobileSheetForYou = forYou.filter((p) => !mobileVisiblePaths.includes(p))
  // '/about' is deliberately excluded from both `forYou` and `more`
  // (RAIL_ALWAYS_VISIBLE_PATHS — see railNav.ts) because the desktop rail
  // self-places it as its own last row (below). Mobile has no equivalent
  // self-placed row, so without this it had NO reachable nav entry point on
  // mobile at all (bug found 2026-08-07). Appended to `more` here so it rides
  // along as the last item of the sheet's "More" group, mirroring "About
  // renders last, after MORE" on desktop.
  // `/revisions` is filtered out here for the same reason the desktop MORE
  // section filters it (see the rail render below): it was removed from every
  // persona's nav on 2026-08-01, deliberately. Mobile built from the same
  // `more` list without the filter, so the sheet still offered it — the two
  // surfaces disagreed about what is reachable, which the comment above
  // asserts they never do (2026-08-09).
  const mobileSheetMore = [
    ...more.filter((p) => !mobileVisiblePaths.includes(p) && p !== '/revisions'),
    '/about',
  ]
  // CACP has no direct shortcut anywhere in nav (2026-08-01 follow-up) —
  // Playground grid only.
  const mobileSheetAllPaths = [...mobileSheetForYou, ...mobileSheetMore]
  const isMoreActive = mobileSheetAllPaths.some((p) => isPathActive(p))

  // ── Top bar data ───────────────────────────────────────────────────────────
  const currentLabel = NAV_PATH_LABELS[location.pathname] ?? 'PQC Today'
  const markedPaths = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      (PERSONA_MARKED_NAV_PATHS[selectedPersona] ?? [])
    : []
  // Simpler of the two spec-offered options: show the WIP chip whenever this
  // persona has ANY marked/pending rail rows at all, rather than only while
  // the user is actively on one of those routes.
  const showWipChip = markedPaths.length > 0
  const pageActions = usePageActionsStore((s) => s.current)
  // Merged persona + region/industry summary (2026-08-01 follow-up: "merge
  // the persona filtering in one drop down" / "become a persona dropdown") —
  // ONE button now carries all three; clicking it opens PersonaSwitchModal,
  // which has the region/industry pickers folded into it (was a separate
  // RegionIndustryPill trigger before this).
  const roleShortLabel = selectedPersona
    ? // eslint-disable-next-line security/detect-object-injection
      (PERSONAS[selectedPersona]?.label ?? 'Everyone')
    : 'Everyone'
  const hasCustomRegion = selectedRegion !== null && selectedRegion !== 'global'
  const hasCustomIndustries = selectedIndustries.length > 0
  const effectiveRegion = hasCustomRegion
    ? selectedRegion
    : selectedPersona
      ? // eslint-disable-next-line security/detect-object-injection
        PERSONA_TIMELINE_REGION[selectedPersona]
      : 'global'
  const effectiveIndustries = hasCustomIndustries
    ? selectedIndustries
    : selectedPersona
      ? // eslint-disable-next-line security/detect-object-injection
        PERSONA_THREATS_DEFAULT_INDUSTRIES[selectedPersona]
      : []
  // eslint-disable-next-line security/detect-object-injection
  const regionLabel = REGION_LABELS[effectiveRegion] ?? effectiveRegion
  const roleLabel =
    effectiveIndustries.length > 0
      ? `${roleShortLabel} · ${regionLabel}, ${effectiveIndustries.join(', ')}`
      : `${roleShortLabel} · ${regionLabel}`
  const viewTypeForRoute = ROUTE_VIEW_TYPE[location.pathname]
  // Exact match first, then the nested-route fallback below. Both tables are
  // keyed by top-level path, so `/learn/<module-id>` matched nothing and every
  // module page silently rendered the top bar WITHOUT a Guide button — the
  // gap §5 of HEADER-TOPBAR-STANDARDIZATION-PLAN-2026-08-01.md said to close
  // BEFORE deleting PKILearningView's own copies of these buttons.
  const pageIdForRoute = ROUTE_PAGE_ID[location.pathname] ?? pageIdForNestedRoute(location.pathname)
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
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
              {buildTime}
            </span>
          </Button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5"
          aria-label="Primary navigation"
        >
          {/* Home leads the rail — always the first row, orientation anchor.
              FOR YOU follows immediately after (2026-08-01 reorder: it's
              contextual to the selected role, so it's the primary thing, not
              an afterthought below the other generic global pages). */}
          <RailRow
            path="/"
            label={labelFor('/')}
            active={isPathActive('/')}
            treatment={isPathActive('/') ? 'active' : 'plain'}
          />
          {/* Learn sits directly under Home (2026-08-02), promoted out of
              Reference. Reference is collapsed by default, so Learn was one
              expand away from being seen at all despite being a primary
              destination rather than standing lookup material. Rendered here
              unconditionally — it is globally always-visible, not persona-
              gated — which also means it must NOT appear in either of the two
              Reference render paths below, or personas with a Reference group
              would get two Learn rows. */}
          <RailRow
            path="/learn"
            label={labelFor('/learn')}
            active={isPathActive('/learn')}
            treatment={isPathActive('/learn') ? 'active' : 'plain'}
          />
          {forYou.length === 0 && (
            <>
              <span className="px-2 pb-2 text-[11px] italic text-muted-foreground">
                Everything, unfiltered
              </span>
              {/* No persona (or researcher, whose PERSONA_NAV_PATHS is null)
                  means forYouGroups has no 'reference' group to carry Timeline/
                  Threats — render them directly here so they aren't silently
                  dropped for exactly the persona with the broadest
                  reachability guarantee. (Learn is above, unconditionally.) */}
              {['/timeline', '/threats'].map((path) => (
                <RailRow
                  key={path}
                  path={path}
                  label={labelFor(path)}
                  active={isPathActive(path)}
                  treatment={isPathActive(path) ? 'active' : 'plain'}
                />
              ))}
              {/* Reachability fix (Grade-A remediation Phase 2, 2026-08-02):
                  forYou is empty here, so forYouGroups below renders nothing
                  at all — before this fix, `more` (the other 13 routes:
                  /assess, /report, /migrate, /compliance, /business,
                  /business/tools, /simulation, /playground, /explore,
                  /algorithms, /library, /leaders, /patents) had NO desktop
                  rail row whatsoever for researcher/no-persona, even though
                  PERSONA_NAV_PATHS documents researcher as "unrestricted"
                  (railNav.ts). The desktop MORE section was removed entirely
                  in the 2026-08-01 declutter follow-up ("remove more and
                  revisions from the left bar", commit 5cebd1d46) — that
                  request was about decluttering personas whose FOR YOU was
                  already populated (its own commit message claims "railNav's
                  pure reachability logic is unchanged," which is true, but
                  the *rendering* logic silently orphaned this one case).
                  Mirrors the already-correct mobile "More" sheet: same `more`
                  array, same muted RailRow 'more' variant, unconditional (no
                  collapse toggle — nothing to collapse away from a user who
                  has no other nav at all). /revisions stays excluded here,
                  honoring that same 2026-08-01 decision independent of this
                  fix — it remains reachable via search (⌘K), direct URL, or
                  the mobile More sheet, same as for every other persona. */}
              {/* Full-opacity `text-muted-foreground`, NOT the `/70` used by the
                  "Everything, unfiltered" label above. At 10px this is small
                  text, so WCAG AA wants 4.5:1: muted-foreground alone measures
                  7.0:1 (light) / 7.5:1 (dark), but composited at 70% opacity it
                  drops to 3.43:1 / 4.19:1 and fails. That regression broke the
                  a11y gate on all 14 smoke routes when this section was first
                  restored (CI run 30757441984) — this label renders on every
                  page for no-persona and researcher visitors, so it failed
                  everywhere at once. */}
              {more.length > 0 && (
                <span className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  More
                </span>
              )}
              {more
                .filter((path) => path !== '/revisions')
                .map((path) => (
                  <RailRow
                    key={path}
                    path={path}
                    label={labelFor(path)}
                    active={isPathActive(path)}
                    variant="more"
                  />
                ))}
            </>
          )}
          {forYouGroups.map((group) => {
            // Learn was in this list too until 2026-08-02, when it was
            // promoted to its own row directly under Home; it is deliberately
            // absent now, since it renders unconditionally above and a second
            // entry here would duplicate it.
            const displayPaths = computeGroupDisplayPaths(group, forYou)
            const groupHasActiveRoute = displayPaths.some((path) => isPathActive(path))
            const groupExpanded = groupHasActiveRoute || !collapsedForYouGroups.has(group.id)
            const groupContentId = `for-you-group-${group.id}`
            return (
              <React.Fragment key={group.id}>
                {/* Sub-group header only when there's more than one group —
                    a persona whose FOR YOU rows all land in one bucket doesn't
                    need a lone sub-header repeating "For You" above it. Each
                    group is independently collapsible (2026-08-01 follow-up),
                    same auto-expand-on-active-route guarantee as MORE. */}
                {forYouGroups.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleForYouGroup(group.id)}
                    aria-expanded={groupExpanded}
                    aria-controls={groupContentId}
                    aria-label={`${groupExpanded ? 'Hide' : 'Show'} ${group.label} (${group.paths.length})`}
                    // B+ remediation 1.3 (2026-08-10): the group name alone was
                    // the hub's vocabulary, not the reader's. The blurb now
                    // leads the tooltip (the collapse/expand hint follows it,
                    // since the chevron already says that visually) and repeats
                    // as sub-text below when the group is open, so the rail
                    // explains itself in place rather than needing decoding.
                    title={`${FOR_YOU_GROUP_BLURBS[group.id]} — click to ${groupExpanded ? 'hide' : 'show'}`}
                    className="w-full h-auto justify-between gap-1 px-2 pt-2 pb-0.5 rounded-md text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      size={10}
                      aria-hidden="true"
                      className={`transition-transform ${groupExpanded ? 'rotate-180' : ''}`}
                    />
                  </Button>
                ) : null}
                {/* The group blurb is deliberately NOT rendered inline. At
                    168px it wrapped to two or three lines per group, which
                    together with the absence notices buried the nav rows it was
                    supposed to be labelling. It rides the header's tooltip
                    instead (see `title` above) — the explanation is still one
                    hover away, and the rail stays a rail. */}
                {groupExpanded && (
                  <div id={groupContentId} className="flex flex-col gap-0.5">
                    {displayPaths.map((path) => {
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
                    {/* B+ remediation 1.3: routes deliberately not offered to
                        this role render their reason here, in the group the row
                        would have occupied — a documented absence made visible
                        instead of an apparently missing row. */}
                    {getGroupAbsences(selectedPersona, group.id).map((absence) => (
                      <RailAbsenceNotice
                        key={absence.path}
                        path={absence.path}
                        label={absence.label}
                        reason={absence.reason}
                        insteadPath={absence.insteadPath}
                        insteadLabel={absence.insteadLabel}
                      />
                    ))}
                  </div>
                )}
              </React.Fragment>
            )
          })}
          {/* The dashed-row legend that stood here has been REMOVED (2026-08-10,
              same review pass that compressed the absence notices). It read "A
              dashed row works, but isn't tailored to your role yet" and sat at
              the very bottom of the rail — several groups away from the single
              dashed row it described, in a column that had already been called
              out as too text-heavy. A legend nobody can connect to its referent
              is worse than no legend: the first reader of it asked what it
              meant. The meaning now rides the row itself — a small "wip" marker
              plus the same sentence in its tooltip — which is where a reader
              looks when they wonder about a row. */}

          {/* CACP is deliberately NOT a direct rail shortcut (2026-08-01
              follow-up: "CACP is fold in playground no direct access") —
              reachable via the Playground grid's own featured card only. */}

          {/* Every RAIL_ALWAYS_VISIBLE_PATHS entry now has an explicit home
              (2026-08-01 follow-up, revised 2026-08-02): '/' renders once, at
              the very top of the rail, and '/learn' immediately under it (see
              above FOR YOU); '/timeline' and '/threats' render inside the
              Reference group; '/about' renders last, after MORE, below.
              Nothing left to render as a separate "global pages" block —
              deliberately empty, not a missing case. */}

          {/* About — deliberately the very last row in the rail (2026-08-01
              reorder), after FOR YOU, the global pages, and MORE. */}
          <RailRow
            path="/about"
            label={labelFor('/about')}
            active={isPathActive('/about')}
            treatment={isPathActive('/about') ? 'active' : 'plain'}
          />
        </nav>

        {/* The rail's lone-icon utility dock was removed on 2026-08-02. It had
            already lost its Assistant trigger (a confirmed duplicate of the top
            bar's "Ask"), leaving one Journey icon behind a border in the rail
            footer. Journey now has a real top-bar entry point beside Ask, so
            the dock had nothing left to hold — which is the outcome its own
            comment predicted. */}
      </aside>

      {/* ── Right column: top bar + scrollable content ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Sim header strip — kept visible on every hub resource opened from the
            PQC Today Sim, so the simulation context is never lost on a redirect. */}
        <ResumeSimBar />

        {/* Suppressed for the Curious-mobile-board takeover (see
            `isCuriousMobileTakeover` above) — that screen renders its own
            header; this one would only double up underneath it. Renders
            during first run too (real gap found by the user: the header
            disappeared entirely on the "Who's asking?" screen) — the target
            design keeps header/nav visible there. */}
        {!isCuriousMobileTakeover && isMobileShell && (
          <React.Suspense fallback={null}>
            <MobileHeader
              persona={selectedPersona}
              onOpenPageActions={() => setMobilePageActionsOpen(true)}
              onOpenRoleSwitch={() => setMobileRoleSwitchOpen(true)}
            />
          </React.Suspense>
        )}
        {!isCuriousMobileTakeover && !isMobileShell && (
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
              {/* 2026-08-01 bug fix: the two clusters below previously fought
                  each other for space at narrow widths (e.g. Assistant panel
                  open) with no shared overflow handling, reading as
                  overlapping text. One flex-nowrap + overflow-x-auto row: at
                  narrow widths the whole bar scrolls together instead of any
                  part of it ever clipping/overlapping.
                  2026-08-19 bug fix: that overflow-x-auto row had no scroll
                  affordance, so on any lg+ viewport too narrow to fit every
                  button (e.g. a tablet in portrait) the trailing buttons —
                  role switcher included — were reachable only by a scroll
                  gesture the user had no indication existed (real-device
                  report: "can't scroll to the right of the top bar"). Now
                  wrapped in the same ScrollFadeContainer the mobile nav row
                  below already uses for this exact problem. */}
              <ScrollFadeContainer
                className="hidden lg:flex flex-1 min-w-0"
                scrollClassName="flex items-center justify-between gap-2 flex-nowrap"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  {showWipChip && (
                    <span
                      className="inline-flex items-center gap-1 rounded-lg border text-status-warning bg-status-warning px-1.5 py-1 text-[10px] font-medium shrink-0"
                      title="Some destinations on this board are marked in-progress — see the dashed rail rows."
                    >
                      <Wrench size={11} aria-hidden="true" />
                      WIP
                    </span>
                  )}
                  {pageActions && (
                    <>
                      <span className="w-px h-4 bg-border shrink-0" aria-hidden="true" />
                      <PageActionStrip {...pageActions} className="shrink-0" />
                    </>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0 flex-nowrap justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => openRightPanel('chat')}
                    className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    aria-label="Open PQC Assistant"
                    title="Open PQC Assistant"
                  >
                    <Bot size={13} aria-hidden="true" />
                    <span>Assistant</span>
                  </Button>
                  {/* Journey — moved here from the rail's lone-icon utility dock
                      on 2026-08-02, which is exactly what that dock's own
                      comment prescribed ("give Journey a top-bar entry point
                      too, then this lone-icon dock can likely go away
                      entirely"). It sits beside Ask because both open the same
                      right panel, just on different tabs. */}
                  <Button
                    variant="ghost"
                    onClick={() => openRightPanel('history')}
                    className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    aria-label="Open your Journey map"
                    title="Open your Journey map"
                  >
                    <Map size={13} aria-hidden="true" />
                    <span>Journey</span>
                  </Button>
                  <ShareButton
                    title={
                      pageActions?.shareTitle ??
                      shareForRoute?.title ??
                      `${currentLabel} — PQC Today`
                    }
                    text={pageActions?.shareText ?? shareForRoute?.text}
                    // BUG FIX (Grade-A remediation Phase 2, top-bar Share):
                    // most routes' whole shareable state lives in the URL
                    // already, so omitting `url` and falling back to
                    // ShareButton's own `window.location.href` default is
                    // correct for them. /report is the exception — its state
                    // lives in local/session store, not the URL — so it
                    // registers a self-contained token URL via
                    // `usePageActionsStore` (see ReportView.tsx). Every other
                    // route's `pageActions.url` stays undefined, preserving
                    // the existing bare-URL fallback exactly.
                    url={pageActions?.url}
                    variant="full"
                  />
                  <FAQButton compact />
                  {viewTypeForRoute && (
                    <SourcesButton
                      viewType={viewTypeForRoute}
                      compact
                      dataSource={pageActions?.dataSource}
                    />
                  )}
                  <GlossaryButton compact />
                  {pageIdForRoute && <UserManualButton pageId={pageIdForRoute} compact />}

                  <Button
                    variant="ghost"
                    onClick={openPalette}
                    className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    aria-label="Search (⌘K)"
                    title="Search (⌘K)"
                  >
                    <Search size={13} aria-hidden="true" />
                    <span>Search</span>
                    <kbd className="text-[9px] font-mono px-1 py-0.5 rounded border border-border/60 bg-muted/40">
                      ⌘K
                    </kbd>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setPersonaSwitchOpen(true)}
                    className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors shrink min-w-0"
                    aria-label={`Switch role — currently ${roleLabel}`}
                    title="Switch your role, region, or industry"
                    // Guided-workshop entry point for the persona prerequisite step.
                    // Replaces the retired PersonalizationSection wizard's
                    // "persona-edit" anchor (see PersonaSwitchModal for the rest).
                    data-workshop-target="persona-switch-open"
                  >
                    <UserCog size={13} aria-hidden="true" />
                    <span className="truncate max-w-[200px]">{roleLabel}</span>
                    <ChevronDown size={11} aria-hidden="true" className="shrink-0" />
                  </Button>
                </div>
              </ScrollFadeContainer>

              {/* Mobile nav row — icon-only row + "More" sheet trigger.
                Unchanged mechanism from before the rail rebuild; only the
                underlying path list now sources from the same rail sections
                the desktop rail uses (see mobileVisiblePaths above). */}
              <nav className="w-full lg:hidden" role="navigation" aria-label="Main navigation">
                <ScrollFadeContainer scrollClassName="flex flex-row flex-nowrap items-center justify-between gap-1">
                  {mobileVisiblePaths.map((path) => {
                    const Icon = iconFor(path)
                    const label = labelFor(path)
                    // bplus-programme WS7b (2026-08-07): collapsed from
                    // <NavLink><Button>…</Button></NavLink> (a <button>
                    // nested inside an <a>) into one element, same fix and
                    // same reasoning as RailRow above.
                    return (
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        aria-label={`${label} view`}
                        className={({ isActive }) =>
                          cn(
                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                            'flex-1 flex-col items-center justify-center gap-0 px-2 min-h-[44px]',
                            isActive
                              ? 'bg-primary/10 text-foreground border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground'
                          )
                        }
                      >
                        <Icon size={18} aria-hidden="true" />
                        <span className="text-[11px] leading-tight mt-1 truncate max-w-[72px] text-center">
                          {label === 'Command Center' ? 'Command' : label}
                        </span>
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

        {/* Mobile UX layer — bottom bar + its group panels/sheets, replacing
            the legacy "More" sheet below for isMobileShell. Renders during
            first run too, same as MobileHeader above — see that comment.
            Suppressed only for the Curious-mobile takeover, which renders
            its own chrome. */}
        {!isCuriousMobileTakeover && isMobileShell && (
          <React.Suspense fallback={null}>
            <MobileBottomBar persona={selectedPersona} />
            <MobilePageActionsSheet
              open={mobilePageActionsOpen}
              onClose={() => setMobilePageActionsOpen(false)}
            />
            <MobileRoleSelection
              variant="switch"
              open={mobileRoleSwitchOpen}
              onClose={() => setMobileRoleSwitchOpen(false)}
            />
            {/* Phase 6 — mounted unconditionally, not gated on route or
                first-run: it renders null internally unless a workshop is
                actually mode:'running' (see MobileWorkshopDock's own early
                return), so there is nothing to gate here. Sits above
                MobileBottomBar via its own `bottom: var(--mobile-nav-height)`
                offset and z-mobile-dock. */}
            <MobileWorkshopDock />
          </React.Suspense>
        )}

        {/* Mobile "More" bottom sheet — unreachable in the Curious-mobile
            takeover state anyway (its trigger button lives inside the
            suppressed header above), gated explicitly for clarity/safety. */}
        {!isCuriousMobileTakeover && !isMobileShell && moreMenuOpen && (
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
                      // bplus-programme WS7b (2026-08-07): same nested
                      // button-in-link fix as RailRow/mobile nav row above.
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        onClick={() => setMoreMenuOpen(false)}
                        aria-label={`${labelFor(path)} view`}
                        className={({ isActive }) =>
                          cn(
                            buttonVariants({ variant: 'ghost' }),
                            'w-full min-h-[44px] justify-start gap-2',
                            isActive
                              ? 'bg-primary/10 text-foreground border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground'
                          )
                        }
                      >
                        {React.createElement(iconFor(path), {
                          size: 18,
                          'aria-hidden': true,
                        })}
                        <span>{labelFor(path)}</span>
                      </NavLink>
                    ))}
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
                      // bplus-programme WS7b (2026-08-07): same nested
                      // button-in-link fix as the other rail/mobile spots.
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        onClick={() => setMoreMenuOpen(false)}
                        aria-label={`${labelFor(path)} view`}
                        className={({ isActive }) =>
                          cn(
                            buttonVariants({ variant: 'ghost' }),
                            'w-full min-h-[44px] justify-start gap-2 text-xs',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )
                        }
                      >
                        {React.createElement(iconFor(path), {
                          size: 16,
                          'aria-hidden': true,
                        })}
                        <span>{labelFor(path)}</span>
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

                {/* Switch role shortcut — unconditional, mirroring the desktop
                    top-bar button (also unconditional; roleShortLabel already
                    defaults to 'Everyone' when no persona is set). Previously
                    gated on `selectedPersona`, which left mobile users with no
                    persona set with zero way to open the picker at all — the
                    desktop-only top-bar trigger is `hidden lg:flex` and this
                    sheet was the sole mobile entry point (bug found 2026-08-19
                    from a real-device report: "no option visible"). */}
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
                  {selectedPersona ? 'Switch role' : 'Choose your role'}
                </Button>
              </div>
            </div>
          </>
        )}

        {personaSwitchOpen && <PersonaSwitchModal onClose={() => setPersonaSwitchOpen(false)} />}

        {/* Scrollable content area */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden min-h-0',
            // Clears the fixed bottom bar (handoff: "96px bottom pad on
            // scroll containers") — only when it's actually rendered. Now
            // rendered during first run too (see MobileHeader comment above),
            // so this only excludes the Curious-mobile takeover.
            //
            // 2026-08-24 audit R5: --mobile-nav-height already resolves to
            // `55px + max(22px, env(safe-area-inset-bottom))` (index.css) —
            // it already includes the safe-area inset. Adding a second
            // `+env(safe-area-inset-bottom)` here double-counted it,
            // over-padding the scroll area by up to the full inset again.
            isMobileShell && !isCuriousMobileTakeover && 'pb-[var(--mobile-nav-height)]'
          )}
        >
          {isCuriousMobileTakeover || isFullBleedContentRoute ? (
            /* Curious-mobile takeover OR /navigate: bare Outlet, no container
               padding, no banners/Breadcrumb/PhaseContextBanner. CuriousMobileBoard
               is a full-bleed standalone screen that supplies all of its own chrome;
               /navigate's force-cluster canvas needs the same bare content slot but
               keeps the rail/top-bar chrome around it (isFullBleedContentRoute is
               deliberately NOT part of isCuriousMobileTakeover, which also suppresses
               that chrome — see its definition above). `id="main-content"` +
               `role="main"` are kept so the skip-link and the page's main landmark
               still resolve. `h-full` is required, not cosmetic — without it
               this div has no defined height (its own parent, the scroll
               container, is a plain block box, not flex), so a `h-full` child
               like ForceClusterView's canvas wrapper has nothing to inherit
               from and collapses to its content's natural height instead of
               filling the viewport (found via real browser verification,
               2026-08-28). */
            <div id="main-content" role="main" className="h-full">
              <React.Suspense
                fallback={
                  <div className="flex min-h-[200px] h-[50dvh] w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      {/* The spinner ring keeps `animate-spin` — purely decorative
                          motion, doesn't affect legibility. "Loading..." lost its
                          `animate-pulse` (2026-08-02): pulsing a word's OPACITY
                          means it is, by construction, below full contrast for
                          part of every cycle — axe caught it on the CI runner at
                          ratios as low as 2.26:1, and a sighted low-vision reader
                          hits the identical dip in real use, not just in CI. */}
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  </div>
                }
              >
                <Outlet />
              </React.Suspense>
            </div>
          ) : isMobileShell && isMobileFirstRun ? (
            /* Mobile first run — the "Who's asking?" role picker renders as
               normal in-flow content here, inside the same header/content/
               bottom-nav column every other mobile screen uses, rather than
               a fixed full-viewport overlay. The earlier fixed-overlay
               version visually covered the header and bottom nav even once
               they were made to render during first run (see the comment on
               MobileHeader above) — real gap the user found directly. */
            <div id="main-content" role="main">
              <React.Suspense fallback={null}>
                <MobileRoleSelection variant="firstRun" />
              </React.Suspense>
            </div>
          ) : (
            <>
              {/* Main Content Area */}
              <main
                id="main-content"
                className={cn(
                  // mobile-ux-layer (2026-08-24 audit R2.1): the `.container`
                  // utility itself carries `px-4 md:px-8` (index.css), so this
                  // element's classes and every Mobile/* screen's own
                  // `px-4 pt-4` were stacking — 32px of side padding on a
                  // 402px viewport (~9% of the width, double the handoff's
                  // specified 16px) plus doubled top padding. Screens already
                  // own their spacing; on mobile this element contributes
                  // none, rather than trimming 19 screen roots individually.
                  !isMobileShell && 'container py-4 px-4 md:py-8 md:px-8'
                )}
                role="main"
              >
                {/* Offline mode info banner */}
                <AirplaneModeBanner />

                {/* One-time legacy-Executive notice (2026-09-07 split) — see
                    the component's own doc comment for the acknowledgement
                    rule. Renders in both desktop and mobile (this branch
                    covers both, excluding only the curious-mobile takeover
                    and full-bleed routes, neither of which executive uses). */}
                <ExecutiveGrcSplitNotice />

                {/* Migration planning workflow progress banner */}
                <WorkflowBanner />

                {/* Preview mode banner — curious persona browsing advanced routes.
                    Prefix-matched, not exact (2026-09-03): ALWAYS_VISIBLE_PATHS and
                    PERSONA_NAV_PATHS list top-level routes like '/playground' or
                    '/learn', but a visitor following a specific home-board CTA lands
                    on a sub-path ('/playground/tls-simulator', '/learn/tls-basics').
                    Exact-match treated every one of those as "not nav-listed" and
                    showed a locked-preview banner over a page the rail already
                    offers this persona — the opposite of what "none of it locked"
                    promises on the boards that link there. 'suggestion', not the
                    default 'gated': nothing this reaches is actually locked for
                    curious, so the banner should read as an offer, not a wall. */}
                {selectedPersona === 'curious' &&
                  viewAccess === 'preview' &&
                  !isPersonaVisiblePath(location.pathname, ALWAYS_VISIBLE_PATHS) &&
                  !isPersonaVisiblePath(location.pathname, PERSONA_NAV_PATHS.curious ?? []) && (
                    <PreviewBanner variant="suggestion" />
                  )}

                {/* Suspense boundary for route-level code splitting */}
                <React.Suspense
                  fallback={
                    <div className="flex min-h-[200px] h-[50dvh] w-full items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    </div>
                  }
                >
                  <motion.div
                    key={location.pathname}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                    className="lg:flex lg:items-start lg:gap-6"
                  >
                    <div className="min-w-0 lg:flex-1">
                      {/* Breadcrumb removed (2026-08-01 follow-up: "remove also on
                          each page the paths before page title") — redundant with
                          the rail's own FOR YOU/Workflow/Practice/Reference
                          structure now that it leads with real navigation. */}
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
                  © {COPYRIGHT_YEAR} PQC Today. Data sourced from the public internet resources.{' '}
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
          <React.Suspense fallback={null}>
            <WhatsNewModal />
          </React.Suspense>

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

      {/* The floating assistant FAB was removed from the main layout on
          2026-08-02. Both of its functions now have real top-bar entries —
          "Ask" (chat) and "Journey" (history) — so it was a third control for
          state the top bar already exposes, and a large one: a 96px animated
          GIF pinned over page content at every breakpoint. It also carried the
          "Need Help?" bubble whose 10 s opacity keyframe made automated
          contrast checks non-deterministic.
          It is deliberately KEPT in EmbedLayout: embeds render no top bar, so
          there the FAB is the only way to reach the assistant at all. */}
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
