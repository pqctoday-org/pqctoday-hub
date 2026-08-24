// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Home, GraduationCap, ArrowRightLeft, FlaskConical, BookOpen } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import { Button } from '@/components/ui/button'
import type { ForYouGroupId } from '@/components/Layout/railNav'
import { mobileNavTab } from '../mobileTokens'
import { MobileGroupPanel } from './MobileGroupPanel'
import { mobileGroupIdForPath } from './mobileNavGroups'

const GROUP_TABS: { id: ForYouGroupId; label: string; icon: typeof ArrowRightLeft }[] = [
  { id: 'workflow', label: 'Workflow', icon: ArrowRightLeft },
  { id: 'practice', label: 'Practice', icon: FlaskConical },
  { id: 'reference', label: 'Reference', icon: BookOpen },
]

export interface MobileBottomBarProps {
  persona: PersonaId | null
}

/**
 * The five-tab bottom bar (handoff "Navigation shell — Bottom bar"). Home and
 * Learn navigate directly; Workflow/Practice/Reference each open their own
 * MobileGroupPanel sheet — real data from railNav.ts, same as the desktop
 * rail, not a hand-typed page list.
 */
export function MobileBottomBar({ persona }: MobileBottomBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [openGroup, setOpenGroup] = useState<ForYouGroupId | null>(null)

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  // 2026-08-24 audit R5: a tab only lit up while its own sheet was open —
  // navigating to a group's page some other way (a card tap, a deep link)
  // left every tab dark, even though the current route genuinely belongs
  // to one of the three groups. Same real resolver MobileHeader's crumb
  // already reads, not a new gate.
  const currentGroupId = mobileGroupIdForPath(location.pathname)

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-nav flex items-stretch gap-1 border-t border-border bg-card px-2 pt-1.5"
        style={{
          height: 'var(--mobile-nav-height)',
          paddingBottom: 'max(22px, env(safe-area-inset-bottom))',
        }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/')}
          className={mobileNavTab({ active: isActive('/') })}
          aria-current={isActive('/') ? 'page' : undefined}
        >
          <Home size={20} aria-hidden="true" />
          <span className="text-[10px] font-bold">Home</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/learn')}
          className={mobileNavTab({ active: isActive('/learn') })}
          aria-current={isActive('/learn') ? 'page' : undefined}
        >
          <GraduationCap size={20} aria-hidden="true" />
          <span className="text-[10px] font-bold">Learn</span>
        </Button>
        {GROUP_TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            onClick={() => setOpenGroup(id)}
            className={mobileNavTab({ active: openGroup === id || currentGroupId === id })}
            aria-expanded={openGroup === id}
            aria-haspopup="dialog"
          >
            <Icon size={20} aria-hidden="true" />
            <span className="text-[10px] font-bold">{label}</span>
          </Button>
        ))}
      </nav>

      {GROUP_TABS.map(({ id }) => (
        <MobileGroupPanel
          key={id}
          groupId={id}
          open={openGroup === id}
          onClose={() => setOpenGroup(null)}
          persona={persona}
        />
      ))}
    </>
  )
}
