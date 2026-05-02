// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  Globe,
  Users,
  FlaskConical,
  BookOpen,
  AlertTriangle,
  Info,
  GraduationCap,
  ShieldCheck,
  ArrowRightLeft,
  Home,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  MoreHorizontal,
  X,
  Plane,
  Clock,
  Compass,
  Search,
  ScrollText,
  UserCog,
} from 'lucide-react'
import { Button } from '../ui/button'
import { WhatsNewModal } from '../ui/WhatsNewModal'
import { DisclaimerModal } from '../ui/DisclaimerModal'
import { AchievementToast } from '../ui/AchievementToast'
import { PhaseCompletionToast } from '../ui/PhaseCompletionToast'

import { GuidedTour } from '../common/GuidedTour'
import { Breadcrumb } from '../common/Breadcrumb'
import { RightPanelFAB } from '../RightPanel/RightPanelFAB'
import { useRightPanelStore } from '../../store/useRightPanelStore'
import { PageAccuracyFeedback } from '../ui/PageAccuracyFeedback'
import { WorkflowBanner } from '../common/WorkflowBanner'
import { AirplaneModeBanner } from '../ui/AirplaneModeBanner'
import { AirplaneModeToast } from '../ui/AirplaneModeToast'
import { useAirplaneModeStore } from '../../store/useAirplaneModeStore'
import { CommandPalette } from '../Search/CommandPalette'
import { useCommandPaletteStore } from '../../store/useCommandPaletteStore'
import { PersonaChip } from '../Persona/PersonaChip'
import { PersonaSwitchModal } from '../Persona/PersonaSwitchModal'
import { PreviewBanner } from '../common/PreviewBanner'
import { useWorkshopUrlAutostart } from '../../hooks/useWorkshopUrlAutostart'

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
import { PERSONA_NAV_PATHS, ALWAYS_VISIBLE_PATHS } from '../../data/personaConfig'

export const MainLayout = () => {
  const location = useLocation()
  const { selectedPersona, viewAccess } = usePersonaStore()
  const { isOpen: isPanelOpen, toggle: openPanel } = useRightPanelStore()
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

  const navItems = [
    { path: '/', label: 'Home', icon: Home, end: true },
    // — Explore entry point (curious persona only) —
    { path: '/explore', label: 'Explore', icon: Compass, section: 'start', curiousOnly: true },
    // — Start the Journey —
    { path: '/learn', label: 'Learn', icon: GraduationCap, section: 'start' },
    { path: '/timeline', label: 'Timeline', icon: Globe, section: 'start' },
    {
      path: '/algorithms',
      label: 'Algorithms',
      icon: Shield,
      section: 'start',
      hiddenOnMobile: true,
      mobileMore: true,
      moreOrder: 1,
    },
    // — My Journey —
    { path: '/migrate', label: 'Migrate', icon: ArrowRightLeft, section: 'journey' },
    {
      path: '/compliance',
      label: 'Compliance',
      icon: ShieldCheck,
      section: 'journey',
      hiddenOnMobile: true,
      mobileMore: true,
      moreOrder: 3,
    },
    // — Assess & Report —
    { path: '/assess', label: 'Assess', icon: ClipboardCheck, section: 'assess' },
    {
      path: '/report',
      label: 'Report',
      icon: FileBarChart,
      section: 'assess',
      hiddenOnMobile: true,
      mobileMore: true,
      moreOrder: 4,
    },
    {
      path: '/business',
      label: 'Command Center',
      icon: LayoutDashboard,
      section: 'assess',
      // Visible on mobile for executive/architect; hidden for others
      hiddenOnMobile: !(selectedPersona === 'executive' || selectedPersona === 'architect'),
      mobileMore: selectedPersona !== 'executive' && selectedPersona !== 'architect',
      moreOrder: 5,
    },
    {
      path: '/playground',
      label: 'Playground',
      icon: FlaskConical,
      hiddenOnMobile: true,
      mobileMore: true,
      section: 'assess',
      moreOrder: 2,
    },
    // — Keep Up to Date —
    { path: '/threats', label: 'Threats', icon: AlertTriangle, section: 'current' },
    { path: '/library', label: 'Library', icon: BookOpen, section: 'current' },
    {
      path: '/leaders',
      label: 'Leaders',
      icon: Users,
      section: 'current',
      hiddenOnMobile: true,
      mobileMore: true,
      moreOrder: 7,
    },
    {
      path: '/patents',
      label: 'Patents',
      icon: ScrollText,
      section: 'current',
      hiddenOnMobile: true,
      mobileMore: true,
      moreOrder: 8,
    },
    {
      path: '/about',
      label: 'About',
      icon: Info,
      hiddenOnMobile: true,
      mobileMore: true,
      moreOrder: 9,
    },
  ]

  // Abbreviated labels for stacked icon+label nav (only override labels that don't fit)
  const SHORT_LABELS: Record<string, string> = {
    'Command Center': 'Command',
  }

  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false)
  const [mobilePersonaSwitchOpen, setMobilePersonaSwitchOpen] = React.useState(false)

  // Close the More menu on route changes (e.g., browser back button)
  React.useEffect(() => {
    setMoreMenuOpen(false)
  }, [location.pathname])

  const personaAllowed = selectedPersona ? PERSONA_NAV_PATHS[selectedPersona] : null
  const visibleNavItems = navItems
    .filter((item) => !item.curiousOnly || selectedPersona === 'curious')
    .filter((item) =>
      personaAllowed
        ? ALWAYS_VISIBLE_PATHS.includes(item.path) || personaAllowed.includes(item.path)
        : true
    )

  // Items that appear in the mobile "More" bottom sheet, ordered by frequency/importance
  const moreNavItems = visibleNavItems
    .filter((item) => item.mobileMore)
    .slice()
    .sort((a, b) => (a.moreOrder ?? 999) - (b.moreOrder ?? 999))
  const isMoreActive = moreNavItems.some((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  return (
    <div
      className={`h-dvh flex flex-col bg-background text-foreground print:min-h-0 print:h-auto overflow-clip transition-[padding] duration-300 ${
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

      <header
        className="m-4 sticky top-[max(1rem,env(safe-area-inset-top))] z-50 transition-all duration-300 print:hidden"
        role="banner"
      >
        <div className="glass-panel p-2 lg:p-4 flex w-full justify-center lg:justify-between items-center relative">
          <div className="flex flex-row items-center gap-4">
            {/* Mobile brand — always a button; toggles Airplane Mode on/off */}
            <Button
              variant="ghost"
              type="button"
              onClick={() => setAirplaneMode(!airplaneMode)}
              className="lg:hidden flex-shrink-0 flex items-center gap-1.5 min-h-[44px] min-w-[44px]"
              aria-label={
                airplaneMode ? 'Airplane Mode on — tap to go online' : 'Toggle Airplane Mode'
              }
              title={airplaneMode ? 'Tap to disable Airplane Mode' : 'Tap to enable Airplane Mode'}
            >
              <span className="text-base font-bold text-gradient">PQC</span>
              {airplaneMode && (
                <Plane size={12} className="text-primary animate-pulse" aria-hidden="true" />
              )}
            </Button>
            {/* Desktop brand — always a button; toggles Airplane Mode on/off */}
            <Button
              variant="ghost"
              type="button"
              onClick={() => setAirplaneMode(!airplaneMode)}
              className="hidden lg:flex flex-col items-start"
              aria-label={
                airplaneMode ? 'Airplane Mode on — click to go online' : 'Toggle Airplane Mode'
              }
              title={
                airplaneMode ? 'Click to disable Airplane Mode' : 'Click to enable Airplane Mode'
              }
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gradient">PQC Today</span>
                {airplaneMode && (
                  <Plane size={14} className="text-primary animate-pulse" aria-hidden="true" />
                )}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest hidden sm:block">
                Last Updated: {buildTime}
              </span>
            </Button>
          </div>

          {/* Search chip — desktop only */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              onClick={openPalette}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50 text-sm text-muted-foreground min-w-[180px] h-auto"
              aria-label="Search (⌘K)"
            >
              <Search size={14} aria-hidden="true" />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/50">
                ⌘K
              </kbd>
            </Button>
            <PersonaChip />
          </div>

          {/* Universal Navigation: Row of Icons on Mobile, Full Nav on Desktop */}
          <nav
            className="flex flex-row flex-nowrap items-center justify-between w-full lg:w-auto gap-1 lg:gap-2 overflow-x-auto"
            role="navigation"
            aria-label="Main navigation"
          >
            {visibleNavItems.map((item, idx) => {
              const prev = visibleNavItems[idx - 1]
              const showDivider = prev?.section && item.section && prev.section !== item.section

              return (
                <React.Fragment key={item.path}>
                  {showDivider && (
                    <span
                      className="hidden lg:block w-px h-9 bg-border/40 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={
                      item.hiddenOnMobile
                        ? 'hidden lg:block'
                        : 'flex-1 lg:flex-none flex justify-center'
                    }
                  >
                    {({ isActive }) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${item.label} view`}
                        aria-current={isActive ? 'page' : undefined}
                        className={
                          isActive
                            ? 'bg-primary/10 text-foreground border border-primary/20 px-2 lg:px-3 min-h-[44px] flex-col items-center gap-0'
                            : 'text-muted-foreground hover:text-foreground px-2 lg:px-3 min-h-[44px] flex-col items-center gap-0'
                        }
                      >
                        <item.icon size={18} aria-hidden="true" />
                        <span className="text-[11px] leading-tight mt-1 truncate max-w-[72px] text-center">
                          {SHORT_LABELS[item.label] ?? item.label}
                        </span>
                      </Button>
                    )}
                  </NavLink>
                </React.Fragment>
              )
            })}

            {/* Mobile "More" button — only shown when there are overflow items */}
            {moreNavItems.length > 0 && (
              <div className="flex-1 lg:hidden flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMoreMenuOpen(true)}
                  aria-label={`More navigation options (${moreNavItems.length} pages)`}
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="dialog"
                  title={`More pages (${moreNavItems.length})`}
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
                      {moreNavItems.length}
                    </span>
                  </span>
                  <span className="text-[11px] leading-tight mt-0.5">More</span>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile "More" bottom sheet */}
      {moreMenuOpen && (
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
            className="fixed inset-x-0 bottom-0 z-nav lg:hidden bg-card border-t border-border rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">More</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setMoreMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMoreMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 ${
                        isActive
                          ? 'bg-primary/10 text-foreground border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-label={`${item.label} view`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Button>
                  )}
                </NavLink>
              ))}

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

              {/* Switch role shortcut — only when a persona is set */}
              {selectedPersona && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false)
                    setMobilePersonaSwitchOpen(true)
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

      {mobilePersonaSwitchOpen && (
        <PersonaSwitchModal onClose={() => setMobilePersonaSwitchOpen(false)} />
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
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
            !(PERSONA_NAV_PATHS.curious ?? []).includes(location.pathname) && <PreviewBanner />}

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
            >
              <Breadcrumb />
              <Outlet />
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
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Content may be inaccurate. Please verify information independently. Report inaccuracies
            in{' '}
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

        {/* Page accuracy feedback widget */}
        <PageAccuracyFeedback />

        {/* Offline connectivity toast + monitor */}
        <AirplaneModeToast />

        {/* What's New Modal — persona-aware, data-driven */}
        <WhatsNewModal />

        {/* First-visit disclaimer — must acknowledge before using the app */}
        <DisclaimerModal />

        {/* Toast notifications — aria-live so screen readers announce them */}
        <div aria-live="polite" aria-label="Notifications" aria-atomic="false">
          {/* Achievement Toast Notification */}
          <AchievementToast />

          {/* Phase Completion Toast */}
          <PhaseCompletionToast />
        </div>

        {/* First-visit Guided Tour */}
        <GuidedTour />
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
