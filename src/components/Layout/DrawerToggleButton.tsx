// SPDX-License-Identifier: AGPL-3.0-only
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDrawerToggle } from '@/components/Assistant/useDrawerToggle'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useTopBarDensity } from './topBarDensity'
import { cn } from '@/lib/utils'
import type { DrawerToggleTab } from '@/types/HistoryTypes'

/** The six views the top bar opens in the side drawer, with the words and icon of their buttons. */
export const DRAWER_TOGGLES = {
  chat: { label: 'Assistant' },
  bookmarks: { label: 'Bookmarks' },
  faq: { label: 'FAQ' },
  sources: { label: 'Sources' },
  glossary: { label: 'Glossary' },
  guide: { label: 'Guide' },
} as const satisfies Record<DrawerToggleTab, { label: string }>

/**
 * One top bar button for one drawer view. Pressing it opens that view beside the page; pressing it
 * again closes the drawer; pressing another of the six switches the drawer to that view. It is shown
 * as pressed (highlight fill and ink outline, also when the bar shows icons only) while its view is open. The same component draws all six buttons.
 */
export function DrawerToggleButton({
  tab,
  icon: Icon,
}: {
  tab: DrawerToggleTab
  icon: LucideIcon
}) {
  const toggle = useDrawerToggle()
  const pressed = useRightPanelStore((s) => s.isOpen && s.activeTab === tab)
  const { label } = DRAWER_TOGGLES[tab]
  // When the bar is short of room the words go and the icon stays; the name and tooltip remain.
  const iconOnly = useTopBarDensity() >= 2
  return (
    <Button
      variant="ghost"
      onClick={() => toggle(tab)}
      className={cn(
        // The open drawer's button is the Storybook highlight (fill, ink outline), so it can be found when the bar shows icons only.
        'flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg border-2 border-transparent text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors aria-pressed:border-ink aria-pressed:bg-highlight aria-pressed:text-heading aria-pressed:hover:bg-highlight aria-pressed:hover:text-heading',
        iconOnly && 'min-h-10 min-w-10 justify-center'
      )}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      data-drawer-toggle={tab}
    >
      <Icon size={13} aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </Button>
  )
}
