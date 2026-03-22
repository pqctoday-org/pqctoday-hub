// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
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
  Network,
} from 'lucide-react'
import { Button } from '../ui/button'
import { WhatsNewToast } from '../ui/WhatsNewToast'
import { DisclaimerModal } from '../ui/DisclaimerModal'
import { AchievementToast } from '../ui/AchievementToast'
import { PWAUpdatePrompt } from '../ui/PWAUpdatePrompt'
import { GuidedTour } from '../common/GuidedTour'
import { RightPanelFAB } from '../RightPanel/RightPanelFAB'
import { useRightPanelStore } from '../../store/useRightPanelStore'
import { PageAccuracyFeedback } from '../ui/PageAccuracyFeedback'
import { WorkflowBanner } from '../common/WorkflowBanner'
import { AirplaneModeBanner } from '../ui/AirplaneModeBanner'
import { AirplaneModeToast } from '../ui/AirplaneModeToast'
import { useAirplaneModeStore } from '../../store/useAirplaneModeStore'

const RightPanel = React.lazy(() =>
  import('../RightPanel/RightPanel').then((m) => ({ default: m.RightPanel }))
)
import { usePersonaStore } from '../../store/usePersonaStore'
import { PERSONA_NAV_PATHS, ALWAYS_VISIBLE_PATHS } from '../../data/personaConfig'

export const MainLayout = () => {
  const location = useLocation()
  const { selectedPersona } = usePersonaStore()
  const { isOpen: isPanelOpen, toggle: openPanel } = useRightPanelStore()
  const { isEnabled: airplaneMode, setEnabled: setAirplaneMode } = useAirplaneModeStore()

  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  const navItems = [
    { path: '/', label: 'Home', icon: Home, end: true },
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
    },
    {
      path: '/business',
      label: 'Business Center',
      icon: LayoutDashboard,
      section: 'assess',
      hiddenOnMobile: true,
      mobileMore: true,
    },
    {
      path: '/playground',
      label: 'Playground',
      icon: FlaskConical,
      hiddenOnMobile: true,
      section: 'assess',
    },
    {
      path: '/openssl',
      label: 'OpenSSL Studio',
      icon: Activity,
      hiddenOnMobile: true,
      section: 'assess',
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
    },
    { path: '/about', label: 'About', icon: Info, hiddenOnMobile: true, mobileMore: true },
  ]

  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false)

  // Close the More menu on route changes (e.g., browser back button)
  React.useEffect(() => {
    setMoreMenuOpen(false)
  }, [location.pathname])

  const personaAllowed = selectedPersona ? PERSONA_NAV_PATHS[selectedPersona] : null
  const visibleNavItems = personaAllowed
    ? navItems.filter(
        (item) => ALWAYS_VISIBLE_PATHS.includes(item.path) || personaAllowed.includes(item.path)
      )
    : navItems

  // Items that appear in the mobile "More" bottom sheet
  const moreNavItems = visibleNavItems.filter((item) => item.mobileMore)
  const isMoreActive = moreNavItems.some((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground print:min-h-0">
      {/* Skip-to-main link — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-4 focus:left-4 focus:bg-background focus:text-foreground focus:p-4 focus:rounded-md focus:ring-2 focus:ring-primary focus:shadow-lg print:hidden"
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
            <button
              type="button"
              onClick={() => setAirplaneMode(!airplaneMode)}
              className="lg:hidden flex-shrink-0 flex items-center gap-1.5 min-h-[44px] min-w-[44px]"
              aria-label={
                airplaneMode ? 'Airplane Mode on — tap to go online' : 'Toggle Airplane Mode'
              }
              title={airplaneMode ? 'Tap to disable Airplane Mode' : 'Tap to enable Airplane Mode'}
            >
              <img
                src="/favicon-light-32x32.png"
                alt=""
                width={24}
                height={24}
                className="rounded-md"
                aria-hidden="true"
              />
              <span className="text-base font-bold text-gradient">PQC</span>
              {airplaneMode && (
                <Plane size={12} className="text-primary animate-pulse" aria-hidden="true" />
              )}
            </button>
            {/* Desktop brand — always a button; toggles Airplane Mode on/off */}
            <button
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
                <img
                  src="/favicon-light-32x32.png"
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-md"
                  aria-hidden="true"
                />
                <span className="text-2xl font-bold text-gradient">PQC Today</span>
                {airplaneMode && (
                  <Plane size={14} className="text-primary animate-pulse" aria-hidden="true" />
                )}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest hidden sm:block">
                Last Updated: {buildTime}
              </span>
            </button>
          </div>

          {/* Universal Navigation: Row of Icons on Mobile, Full Nav on Desktop */}
          <nav
            className="flex flex-row flex-nowrap items-center justify-between w-full lg:w-auto gap-1 lg:gap-2 overflow-x-auto no-scrollbar"
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
                      className="hidden lg:block w-px h-5 bg-border/40 shrink-0"
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
                            ? 'bg-primary/10 text-foreground border border-primary/20 px-2 lg:px-4 min-h-[44px] lg:min-h-0'
                            : 'text-muted-foreground hover:text-foreground px-2 lg:px-4 min-h-[44px] lg:min-h-0'
                        }
                      >
                        <item.icon size={20} aria-hidden="true" className="lg:mr-2" />
                        <span className="hidden lg:inline">{item.label}</span>
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
                  aria-label="More navigation options"
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="dialog"
                  className={
                    isMoreActive
                      ? 'bg-primary/10 text-foreground border border-primary/20 px-2 min-h-[44px]'
                      : 'text-muted-foreground hover:text-foreground px-2 min-h-[44px]'
                  }
                >
                  <MoreHorizontal size={20} aria-hidden="true" />
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
            className="fixed inset-0 z-[69] bg-black/40 lg:hidden"
            onClick={() => setMoreMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            className="fixed inset-x-0 bottom-0 z-[70] lg:hidden bg-card border-t border-border rounded-t-2xl p-4 shadow-2xl"
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
              <button
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
              </button>

              {/* Journey History shortcut */}
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false)
                  openPanel('history')
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
              >
                <Clock size={18} aria-hidden="true" />
                Journey History
              </button>

              {/* Knowledge Graph shortcut */}
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false)
                  openPanel('graph')
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
              >
                <Network size={18} aria-hidden="true" />
                Knowledge Graph
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow container py-4 px-4 md:py-8 md:px-8" role="main">
        {/* Offline mode info banner */}
        <AirplaneModeBanner />

        {/* Migration planning workflow progress banner */}
        <WorkflowBanner />

        {/* Removed AnimatePresence to fix blank screen navigation bug */}
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
            <Outlet />
          </motion.div>
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8 text-center text-muted-foreground text-sm px-4 print:hidden safe-bottom">
        <p>© 2025 PQC Today. Data sourced from the public internet resources.</p>
        <p className="mt-1 text-xs opacity-70">
          Content may be inaccurate. Please verify information independently. Report inaccuracies in{' '}
          <a
            href="https://github.com/pqctoday/pqc-timeline-app/discussions"
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

      {/* What's New Toast Notification */}
      <WhatsNewToast />

      {/* First-visit disclaimer — must acknowledge before using the app */}
      <DisclaimerModal />

      {/* Achievement Toast Notification */}
      <AchievementToast />

      {/* PWA update notification */}
      <PWAUpdatePrompt />

      {/* First-visit Guided Tour */}
      <GuidedTour />

      {/* Right Panel (PQC Assistant + Journey History) */}
      <RightPanelFAB />
      <React.Suspense fallback={null}>{isPanelOpen && <RightPanel />}</React.Suspense>
    </div>
  )
}
