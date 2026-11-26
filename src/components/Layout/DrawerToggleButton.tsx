// SPDX-License-Identifier: AGPL-3.0-only
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDrawerToggle } from '@/components/Assistant/useDrawerToggle'
import { useRightPanelStore } from '@/store/useRightPanelStore'
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
 * as pressed while its view is open. The same component draws all six buttons.
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
  return (
    <Button
      variant="ghost"
      onClick={() => toggle(tab)}
      className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors aria-pressed:text-foreground aria-pressed:bg-muted/30"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      data-drawer-toggle={tab}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{label}</span>
    </Button>
  )
}
