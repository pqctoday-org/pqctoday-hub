// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
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
  ArrowLeft,
  X,
} from 'lucide-react'
import { Button } from '../ui/button'
import { WhatsNewToast } from '../ui/WhatsNewToast'
import { AchievementToast } from '../ui/AchievementToast'
import { GuidedTour } from '../common/GuidedTour'
import { RightPanelFAB } from '../RightPanel/RightPanelFAB'
import { useRightPanelStore } from '../../store/useRightPanelStore'
import { PageAccuracyFeedback } from '../ui/PageAccuracyFeedback'
import { WorkflowBanner } from '../common/WorkflowBanner'

const RightPanel = React.lazy(() =>
  import('../RightPanel/RightPanel').then((m) => ({ default: m.RightPanel }))
)
import { usePersonaStore } from '../../store/usePersonaStore'
import { PERSONA_NAV_PATHS, ALWAYS_VISIBLE_PATHS } from '../../data/personaConfig'

const RETURN_LABELS: Record<string, string> = {
  '/business': 'Business Center',
}

function ReturnBanner() {
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = useMemo(() => {
    const stored = sessionStorage.getItem('pqc-return-to')
    return stored && stored !== location.pathname ? stored : null
  }, [location.pathname])

  if (!returnTo) return null

  const label = RETURN_LABELS[returnTo] ?? 'previous page' // eslint-disable-line security/detect-object-injection

  return (
    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          sessionStorage.removeItem('pqc-return-to')
          navigate(returnTo)
        }}
      >
        <ArrowLeft size={14} className="mr-1" />
        Back to {label}
      </Button>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => {
          sessionStorage.removeItem('pqc-return-to')
          setReturnTo(null)
        }}
      >
        <X size={14} />
      </Button>
    </div>
  )
}

export const MainLayout = () => {
  const location = useLocation()
  const { selectedPersona } = usePersonaStore()
  const isPanelOpen = useRightPanelStore((s) => s.isOpen)

  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  const navItems = [
    { path: '/', label: 'Home', icon: Home, end: true },
    // — Start the Journey —
    { path: '/learn', label: 'Learn', icon: GraduationCap, section: 'start' },
    { path: '/timeline', label: 'Timeline', icon: Globe, section: 'start' },
    { path: '/algorithms', label: 'Algorithms', icon: Shield, section: 'start' },
    // — My Journey —
    { path: '/migrate', label: 'Migrate', icon: ArrowRightLeft, section: 'journey' },
    { path: '/compliance', label: 'Compliance', icon: ShieldCheck, section: 'journey' },
    // — Assess & Report —
    { path: '/assess', label: 'Assess', icon: ClipboardCheck, section: 'assess' },
    { path: '/report', label: 'Report', icon: FileBarChart, section: 'assess' },
    { path: '/business', label: 'Business Center', icon: LayoutDashboard, section: 'assess' },
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
    { path: '/leaders', label: 'Leaders', icon: Users, section: 'current' },
    { path: '/about', label: 'About', icon: Info },
  ]

  const personaAllowed = selectedPersona ? PERSONA_NAV_PATHS[selectedPersona] : null
  const visibleNavItems = personaAllowed
    ? navItems.filter(
        (item) => ALWAYS_VISIBLE_PATHS.includes(item.path) || personaAllowed.includes(item.path)
      )
    : navItems

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
          <div className="flex flex-row items-baseline gap-4">
            {/* Abbreviated brand on mobile, full brand on desktop */}
            <div className="lg:hidden flex-shrink-0">
              <span className="text-base font-bold text-gradient">PQC</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-gradient">PQC Today</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest hidden sm:block">
                Last Updated: {buildTime}
              </p>
            </div>
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
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow container py-4 px-2 md:py-8 md:px-8" role="main">
        {/* Migration planning workflow progress banner */}
        <WorkflowBanner />
        <ReturnBanner />

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
      </footer>

      {/* Page accuracy feedback widget */}
      <PageAccuracyFeedback />

      {/* What's New Toast Notification */}
      <WhatsNewToast />

      {/* Achievement Toast Notification */}
      <AchievementToast />

      {/* First-visit Guided Tour */}
      <GuidedTour />

      {/* Right Panel (PQC Assistant + Journey History) */}
      <RightPanelFAB />
      <React.Suspense fallback={null}>{isPanelOpen && <RightPanel />}</React.Suspense>
    </div>
  )
}
