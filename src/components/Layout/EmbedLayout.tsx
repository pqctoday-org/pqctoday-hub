// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
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
} from 'lucide-react'
import { Button } from '../ui/button'
import { Breadcrumb } from '../common/Breadcrumb'
import { PoweredByBadge } from '../ui/PoweredByBadge'
import { useEmbed } from '../../embed/EmbedProvider'
import { matchesAllowedRoute } from '../../embed/routePresets'
import { useThemeStore } from '../../store/useThemeStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import type { PersonaId } from '../../data/learningPersonas'
import { PERSONA_NAV_PATHS, ALWAYS_VISIBLE_PATHS } from '../../data/personaConfig'
import { useEmbedPersistence } from '../../embed/useEmbedPersistence'

export const EmbedLayout = () => {
  const location = useLocation()
  const embedConfig = useEmbed()

  // Initialize persistence and auth flows
  useEmbedPersistence()

  const { setTheme } = useThemeStore()
  const { setPersona, selectedPersona } = usePersonaStore()

  // Layout forces theme if provided in embed URL
  React.useEffect(() => {
    if (embedConfig.theme) {
      setTheme(embedConfig.theme)
    }
  }, [embedConfig.theme, setTheme])

  // Layout forces persona if provided in embed URL
  React.useEffect(() => {
    if (embedConfig.persona) {
      setPersona(embedConfig.persona as PersonaId)
    }
  }, [embedConfig.persona, setPersona])

  // Resize Observer for postMessage communication
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce window resize messages
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        for (const entry of entries) {
          if (entry.target === document.body && window.parent !== window) {
            window.parent.postMessage(
              {
                type: 'pqc:resize',
                height: entry.contentRect.height,
              },
              '*'
            )
          }
        }
      }, 100)
    })

    resizeObserver.observe(document.body)
    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeoutId)
    }
  }, [])

  // Map of all possible nav items
  const allNavItems = [
    { path: '/', label: 'Home', icon: Home, end: true },
    { path: '/learn', label: 'Learn', icon: GraduationCap },
    { path: '/timeline', label: 'Timeline', icon: Globe },
    { path: '/algorithms', label: 'Algorithms', icon: Shield },
    { path: '/migrate', label: 'Migrate', icon: ArrowRightLeft },
    { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
    { path: '/assess', label: 'Assess', icon: ClipboardCheck },
    { path: '/report', label: 'Report', icon: FileBarChart },
    { path: '/business', label: 'Business Center', icon: LayoutDashboard },
    { path: '/playground', label: 'Playground', icon: FlaskConical },
    { path: '/threats', label: 'Threats', icon: AlertTriangle },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/leaders', label: 'Leaders', icon: Users },
    { path: '/about', label: 'About', icon: Info },
  ]

  // Filter 1: Persona visibility (if selected)
  // eslint-disable-next-line security/detect-object-injection
  const personaAllowed = selectedPersona ? PERSONA_NAV_PATHS[selectedPersona] : null
  const personaNavItems = personaAllowed
    ? allNavItems.filter(
        (item) => ALWAYS_VISIBLE_PATHS.includes(item.path) || personaAllowed.includes(item.path)
      )
    : allNavItems

  // Filter 2: Embed allowed routes
  const visibleNavItems = personaNavItems.filter((item) =>
    matchesAllowedRoute(item.path, embedConfig.allowedRoutes)
  )

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground print:min-h-0">
      <header
        className="sticky top-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b"
        role="banner"
      >
        <div className="h-12 px-4 flex w-full justify-between items-center relative">
          {/* Slim Header Brand linking out */}
          <a
            href="https://pqctoday.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 flex-shrink-0"
            title="Open PQC Today in a new tab"
          >
            <span className="text-lg font-bold text-gradient">PQC Today</span>
          </a>

          {/* Navigation - horizontal scrolling for allowed routes */}
          <nav
            className="flex flex-row flex-nowrap items-center gap-1 overflow-x-auto items-center h-full hide-scrollbar flex-grow justify-end pl-4"
            role="navigation"
            aria-label="Main navigation"
          >
            {visibleNavItems.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.end} className="flex-shrink-0">
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${item.label} view`}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'bg-primary/10 text-foreground border border-primary/20 h-auto py-1.5 px-3'
                        : 'text-muted-foreground hover:text-foreground h-auto py-1.5 px-3'
                    }
                  >
                    <item.icon size={16} aria-hidden="true" className="mr-1.5" />
                    <span className="text-[13px]">{item.label}</span>
                  </Button>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow container py-4 px-4 md:py-6 md:px-6" role="main">
        <React.Suspense
          fallback={
            <div className="flex min-h-[200px] h-[50dvh] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </div>
          }
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Breadcrumb />
            <Outlet />
          </motion.div>
        </React.Suspense>
      </main>

      <PoweredByBadge />
    </div>
  )
}
