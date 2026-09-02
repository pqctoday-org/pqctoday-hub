// SPDX-License-Identifier: GPL-3.0-only
/**
 * WorkshopShell — the shared chrome both hub workshops (PKCS#11 at
 * /playground/hsm, KMIP/CACP at /playground/cacp) render around their
 * content: a header row (icon + title, a badge slot, a right-hand action
 * cluster) and ONE primary tab row built on the shared `ui/tabs.tsx`
 * (WAI-ARIA tabs, roving focus, arrow-key navigation) instead of each
 * playground hand-rolling its own `role="tablist"`.
 *
 * Design handoff: design_handoff_kmip_pkcs11_playground (2026-09-02), §3.3.
 * The mockups' "top nav" pattern — logo/name + badge left, primary tab row
 * right, underline indicator — ported to the app's semantic tokens (D1).
 *
 * Content: each tab's `content` is mounted only while active (TabsContent
 * returns null otherwise), the same unmount-on-switch contract the previous
 * hand-rolled bars had, so nothing downstream changes its state handling.
 */
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useTabsContext,
  tabPanelId,
  tabTriggerId,
} from '@/components/ui/tabs'

/** A `TabsContent` that hides instead of unmounting — same ids/ARIA as the
 *  real one (read from the enclosing `<Tabs>` context) so the trigger's
 *  `aria-controls` still resolves. */
function KeepMountedPanel({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: ReactNode
}) {
  const ctx = useTabsContext()
  const active = ctx?.value === value
  return (
    <div
      role="tabpanel"
      id={ctx ? tabPanelId(ctx.baseId, value) : undefined}
      aria-labelledby={ctx ? tabTriggerId(ctx.baseId, value) : undefined}
      hidden={!active}
      className={className}
    >
      {children}
    </div>
  )
}

export interface WorkshopTab<TId extends string> {
  id: TId
  label: ReactNode
  /** Short label for narrow viewports; falls back to `label`. */
  shortLabel?: ReactNode
  icon?: LucideIcon
  /** Coachmark anchor for the trigger, e.g. `pkcs-tab-operate`. */
  tourId?: string
  content: ReactNode
  /** Hidden tabs render neither trigger nor content (persona gating). */
  hidden?: boolean
  /**
   * Keep this tab's content mounted (visually hidden) while another tab is
   * active — for surfaces whose in-progress state must survive a detour
   * (a Learn lesson mid-way through its steps while the spotlight jumps
   * to Operate and back). Default false = unmount on switch.
   */
  keepMounted?: boolean
}

interface WorkshopShellProps<TId extends string> {
  icon: LucideIcon
  title: ReactNode
  /** Small chip next to the title (draft-status, WIP, engine…). */
  badge?: ReactNode
  /** Right-hand header cluster (Lessons hub, engine selector, mode toggle…). */
  actions?: ReactNode
  /** Rendered between the header and the tab row (banners, jargon strip). */
  preamble?: ReactNode
  tabs: WorkshopTab<TId>[]
  value: TId
  onValueChange: (id: TId) => void
  tabListLabel: string
  /** `data-tour` anchor on the tab list itself. */
  tabListTourId?: string
  /** Extra classes on the content panel wrapper. */
  contentClassName?: string
}

export function WorkshopShell<TId extends string>({
  icon: Icon,
  title,
  badge,
  actions,
  preamble,
  tabs,
  value,
  onValueChange,
  tabListLabel,
  tabListTourId,
  contentClassName,
}: WorkshopShellProps<TId>) {
  const visible = tabs.filter((t) => !t.hidden)
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as TId)}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 shrink-0 gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 min-w-0">
          <Icon className="text-secondary shrink-0" aria-hidden="true" />
          <span className="truncate">{title}</span>
          {badge}
        </h3>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {preamble}

      <TabsList aria-label={tabListLabel} data-tour={tabListTourId} className="shrink-0 mb-3">
        {visible.map((t) => {
          const TabIcon = t.icon
          return (
            <TabsTrigger
              key={t.id}
              value={t.id}
              data-tour={t.tourId}
              className="gap-1.5 text-xs data-[state=active]:text-primary"
            >
              {TabIcon && <TabIcon size={15} className="shrink-0" aria-hidden="true" />}
              {t.shortLabel ? (
                <>
                  <span className="sm:hidden">{t.shortLabel}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </>
              ) : (
                t.label
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {visible.map((t) => {
        const panelClass = clsx(
          'mt-0 flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-card rounded-xl border border-border p-3 md:p-6 relative',
          contentClassName
        )
        if (t.keepMounted) {
          return (
            <KeepMountedPanel key={t.id} value={t.id} className={panelClass}>
              {t.content}
            </KeepMountedPanel>
          )
        }
        return (
          <TabsContent key={t.id} value={t.id} className={panelClass}>
            {t.content}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
