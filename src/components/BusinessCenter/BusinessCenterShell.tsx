// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TABS = [
  { label: 'Dashboard', path: '/business', icon: LayoutDashboard },
  { label: 'Tools', path: '/business/tools', icon: Wrench },
] as const

/**
 * Shell for /business/* routes. Renders a tab bar and <Outlet /> for child
 * routes, mirroring the PlaygroundShell pattern but with visible navigation.
 */
export const BusinessCenterShell = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  const isActive = (path: string) =>
    path === '/business' ? pathname === '/business' : pathname.startsWith(path)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex: number | null = null
      if (e.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
      else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length
      else if (e.key === 'Home') nextIndex = 0
      else if (e.key === 'End') nextIndex = TABS.length - 1

      if (nextIndex !== null) {
        e.preventDefault()
        tabsRef.current[nextIndex]?.focus()
        navigate(TABS[nextIndex].path)
      }
    },
    [navigate]
  )

  return (
    <div>
      {/* Tab bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div
          role="tablist"
          aria-label="Command Center navigation"
          className="flex gap-2 border-b border-border pb-0"
        >
          {TABS.map(({ label, path, icon: Icon }, index) => {
            const active = isActive(path)
            return (
              <Button
                variant="ghost"
                key={path}
                ref={(el) => {
                  tabsRef.current[index] = el
                }}
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => navigate(path)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            )
          })}
        </div>
      </div>

      <Outlet />
    </div>
  )
}
