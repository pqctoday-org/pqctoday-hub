// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { BookText } from 'lucide-react'
import { UserManualPanel } from '../common/UserManualPanel'
import type { PageId } from '../../data/userManualData'
import { Button } from '@/components/ui/button'

export const UserManualButton = ({ pageId }: { pageId: PageId }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20"
        aria-label="Open page guide"
      >
        <BookText size={14} />
        <span>Guide</span>
      </Button>

      <UserManualPanel isOpen={isOpen} onClose={() => setIsOpen(false)} pageId={pageId} />
    </>
  )
}
