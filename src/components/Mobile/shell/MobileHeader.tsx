// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ChevronLeft, Search, User, MoreHorizontal, BookText } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import { PERSONAS } from '@/data/learningPersonas'
import { NAV_PATH_LABELS } from '@/data/personaConfig'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/ui/ShareButton'
import { UserManualPanel } from '@/components/common/UserManualPanel'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore'
import { ROUTE_SHARE } from '@/data/routePageMeta'
import { FOR_YOU_GROUP_LABELS } from '@/components/Layout/railNav'
import { cn } from '@/lib/utils'
import { mobileIconButton, mobileRolePill } from '../mobileTokens'
import { pageIdForMobileRoute } from './getMobilePageActions'
import { mobileGroupIdForPath } from './mobileNavGroups'
import { useMobileWhatsNewStatus } from './mobileWhatsNew'

export interface MobileHeaderProps {
  persona: PersonaId | null
  onOpenPageActions: () => void
  onOpenRoleSwitch: () => void
}

/**
 * Home and Page header variants in one component (handoff "Header").
 * Controls, in order: Search · Share · Guide · role pill · ⋯ — the same
 * four of the desktop top bar's nine controls the handoff promotes, with
 * the rest folded into the ⋯ sheet (MobilePageActionsSheet).
 *
 * The ⋯ button's unread red dot (handoff: "6px red unread dot... when there
 * is unread news") reads useMobileWhatsNewStatus — the same real
 * lastSeenVersion/changelog computation the desktop WhatsNewModal already
 * uses to decide what counts as unseen, not a static/invented indicator.
 */
export function MobileHeader({ persona, onOpenPageActions, onOpenRoleSwitch }: MobileHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const openPalette = useCommandPaletteStore((s) => s.open)
  const pageActions = usePageActionsStore((s) => s.current)
  const { hasUnread } = useMobileWhatsNewStatus()
  const [guideOpen, setGuideOpen] = useState(false)

  const isHome = location.pathname === '/'
  const pageIdForRoute = pageIdForMobileRoute(location.pathname)
  const shareForRoute = ROUTE_SHARE[location.pathname]
  const title = isHome ? undefined : NAV_PATH_LABELS[location.pathname]
  const groupId = isHome ? undefined : mobileGroupIdForPath(location.pathname)
  const crumb = groupId ? FOR_YOU_GROUP_LABELS[groupId] : undefined
  // Handoff: "13px person icon plus the SHORT role label" — PERSONAS has no
  // dedicated short-label field, so this derives one from the real label
  // (first word: "Executive / GRC" -> "Executive") rather than inventing new
  // copy. First-run smoke test (2026-08-23): the full label alongside Search/
  // Share/Guide/⋯ in one 402px row squeezed the page title down to two
  // characters — this is a real layout fix, not cosmetic polish.
  const fullRoleLabel = persona ? (PERSONAS[persona]?.label ?? 'Everyone') : 'Everyone'
  const roleShortLabel = fullRoleLabel.split(' ')[0]

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-nav border-b border-border bg-card px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]"
      >
        <div className="flex items-center gap-2">
          {isHome ? (
            <span className="min-w-0 flex-1 text-[19px] font-extrabold text-foreground">
              PQC Today
            </span>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="h-11 w-8 shrink-0"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </Button>
              <div className="min-w-0 flex-1">
                {crumb && (
                  <p className="truncate text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                    {crumb}
                  </p>
                )}
                <p className="truncate text-[17px] font-extrabold leading-tight text-foreground">
                  {title ?? 'PQC Today'}
                </p>
              </div>
            </>
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              onClick={openPalette}
              aria-label="Search"
              className={mobileIconButton}
            >
              <Search size={15} aria-hidden="true" />
            </Button>

            <ShareButton
              title={
                pageActions?.shareTitle ??
                shareForRoute?.title ??
                `${title ?? 'PQC Today'} — PQC Today`
              }
              text={pageActions?.shareText ?? shareForRoute?.text}
              url={pageActions?.url}
              variant="icon"
              buttonClassName={mobileIconButton}
            />

            {pageIdForRoute && (
              <Button
                type="button"
                onClick={() => setGuideOpen(true)}
                aria-label="Guide"
                className={mobileIconButton}
              >
                <BookText size={15} aria-hidden="true" />
              </Button>
            )}

            <Button
              type="button"
              onClick={onOpenRoleSwitch}
              aria-label={`Change role — currently ${fullRoleLabel}`}
              className={mobileRolePill}
            >
              <User size={13} aria-hidden="true" />
              <span className="max-w-[84px] truncate">{roleShortLabel}</span>
            </Button>

            <Button
              type="button"
              onClick={onOpenPageActions}
              aria-label={hasUnread ? 'More — unread updates' : 'More'}
              className={cn(mobileIconButton, 'relative')}
            >
              <MoreHorizontal size={15} aria-hidden="true" />
              {hasUnread && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-destructive"
                />
              )}
            </Button>
          </div>
        </div>
      </header>

      {pageIdForRoute && (
        <UserManualPanel
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          pageId={pageIdForRoute}
        />
      )}
    </>
  )
}
