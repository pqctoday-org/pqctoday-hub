// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** `compact`: small icon + text-xs, no border/background — used by the global
 * top bar (MainLayout.tsx) so it matches the other top-bar buttons. Default
 * (unset) keeps the original bordered-pill look for every other call site
 * (PageHeader.tsx's mobile menu, etc.) — unchanged. */
export const FAQButton = ({ compact = false }: { compact?: boolean } = {}) => {
  const navigate = useNavigate()

  return (
    <Button
      variant="ghost"
      onClick={() => navigate('/faq')}
      className={
        compact
          ? 'flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors'
          : 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20'
      }
      aria-label="Open frequently asked questions"
    >
      <HelpCircle size={compact ? 13 : 14} />
      <span>FAQ</span>
    </Button>
  )
}
