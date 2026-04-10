// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  FlaskConical,
  GraduationCap,
  ArrowRightLeft,
  ClipboardCheck,
  LayoutDashboard,
  Terminal,
  HelpCircle,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Breadcrumb } from '../common/Breadcrumb'
import { PoweredByBadge } from '../ui/PoweredByBadge'
import { useEmbed } from '../../embed/EmbedProvider'
import { getActivePresets } from '../../embed/routePresets'
import { useThemeStore } from '../../store/useThemeStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import type { PersonaId } from '../../data/learningPersonas'
import { useEmbedPersistence } from '../../embed/useEmbedPersistence'
import { RightPanelFAB } from '../RightPanel/RightPanelFAB'
import { useRightPanelStore } from '../../store/useRightPanelStore'
import { logEmbedPolicyApplied } from '../../utils/analytics'

const RightPanel = React.lazy(() =>
  import('../RightPanel/RightPanel').then((m) => ({ default: m.RightPanel }))
)

export const EmbedLayout = () => {
  const location = useLocation()
  const embedConfig = useEmbed()
  const { isOpen: isPanelOpen } = useRightPanelStore()

  // Initialize persistence and auth flows
  useEmbedPersistence()

  const { setTheme } = useThemeStore()
  const { setPersona, setRegion, setIndustries } = usePersonaStore()

  // Layout forces theme if provided in embed URL
  React.useEffect(() => {
    if (embedConfig.theme) {
      setTheme(embedConfig.theme)
    }
  }, [embedConfig.theme, setTheme])

  // Seed persona/region/industry from cert policy once at mount.
  // These become the locked active values for the session.
  React.useEffect(() => {
    // Persona: resolved persona from URL (already clamped to cert-allowed in verifySignature)
    if (embedConfig.persona) {
      setPersona(embedConfig.persona as PersonaId)
    } else if (embedConfig.allowedPersonas?.[0]) {
      setPersona(embedConfig.allowedPersonas[0] as PersonaId)
    }
    // Region: first cert-allowed region becomes active
    if (embedConfig.allowedRegions?.[0]) {
      setRegion(embedConfig.allowedRegions[0] as import('@/store/usePersonaStore').Region)
    }
    // Industries: all cert-allowed industries become the active set
    if (embedConfig.allowedIndustries?.length) {
      setIndustries(embedConfig.allowedIndustries)
    }
    // Track policy restrictions applied by this vendor session
    logEmbedPolicyApplied(
      embedConfig.vendorId,
      embedConfig.allowedPersonas ?? [],
      embedConfig.allowedRegions ?? [],
      embedConfig.allowedIndustries ?? []
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once at mount — cert values are immutable for the session

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

  // Preset → nav item definition (icon + label + base path)
  const PRESET_NAV_ITEMS: Record<
    string,
    { label: string; icon: React.ElementType; basePath: string }
  > = {
    learn: { label: 'Learn', icon: GraduationCap, basePath: '/learn' },
    explore: { label: 'Explore', icon: Globe, basePath: '/timeline' },
    assess: { label: 'Assess', icon: ClipboardCheck, basePath: '/assess' },
    migrate: { label: 'Migrate', icon: ArrowRightLeft, basePath: '/migrate' },
    playground: { label: 'Playground', icon: FlaskConical, basePath: '/playground' },
    business: { label: 'Business', icon: LayoutDashboard, basePath: '/business' },
    openssl: { label: 'OpenSSL', icon: Terminal, basePath: '/openssl' },
    faq: { label: 'FAQ', icon: HelpCircle, basePath: '/faq' },
    all: { label: 'Learn', icon: GraduationCap, basePath: '/learn' }, // 'all' → default to learn
  }

  // Build nav from active presets — exactly what the vendor licensed, no Home tab
  const activePresets = getActivePresets(embedConfig.allowedRoutes)
  const visibleNavItems = activePresets
    .filter((preset) => preset !== 'all' || activePresets.length === 1) // 'all' only shows if it's the only preset
    // eslint-disable-next-line security/detect-object-injection
    .map((preset) => PRESET_NAV_ITEMS[preset])
    .filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground print:min-h-0">
      {/* Conditionally render header based on policy.features.hideNav */}
      {!embedConfig.policy.features.hideNav && (
        <header
          className="sticky top-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b"
          role="banner"
        >
          <div className="h-12 px-4 flex w-full justify-between items-center relative">
            <a
              href="https://pqctoday.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-shrink-0"
              title="Open PQC Today in a new tab"
            >
              <span className="text-lg font-bold text-gradient">PQC Today</span>
            </a>

            <nav
              className="flex flex-row flex-nowrap items-center gap-1 overflow-x-auto h-full hide-scrollbar flex-grow justify-end pl-4"
              role="navigation"
              aria-label="Main navigation"
            >
              {visibleNavItems.map((item) => {
                const embedUrl = `/embed${item.basePath}`
                return (
                  <NavLink
                    key={item.basePath}
                    to={embedUrl}
                    className="flex-shrink-0"
                    // isActive if current path starts with the embed URL
                    end={false}
                  >
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
                )
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Test Mode Overlay */}
      {embedConfig.isTestMode && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-xs sm:text-sm font-bold shadow-sm z-[40]">
          TEST ONLY PLEASE REACH OUT TO GET YOUR PRIVATE CERTIFICATE FOR PRODUCTION DEPLOYMENT
        </div>
      )}

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

      {/* PQC AI Assistant — shown only if cert policy grants assistantEnabled=true */}
      {embedConfig.policy.features.assistantEnabled && (
        <>
          <RightPanelFAB />
          <React.Suspense fallback={null}>{isPanelOpen && <RightPanel />}</React.Suspense>
        </>
      )}
    </div>
  )
}
