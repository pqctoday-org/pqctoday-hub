// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { BookText } from 'lucide-react'
import { UserManualPanel } from '../common/UserManualPanel'
import type { PageId } from '../../data/userManualData'
import { Button } from '@/components/ui/button'

/** `compact`: small icon + text-xs, no border/background — used by the global
 * top bar (MainLayout.tsx). Default keeps the bordered-pill look everywhere
 * else. */
export const UserManualButton = ({
  pageId,
  compact = false,
}: {
  pageId: PageId
  compact?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className={
          compact
            ? 'flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors'
            : 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20'
        }
        aria-label="Open page guide"
      >
        <BookText size={compact ? 13 : 14} />
        <span>Guide</span>
      </Button>

      <UserManualPanel isOpen={isOpen} onClose={() => setIsOpen(false)} pageId={pageId} />
    </>
  )
}
