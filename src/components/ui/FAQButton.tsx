// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FAQButton = () => {
  const navigate = useNavigate()

  return (
    <Button
      variant="ghost"
      onClick={() => navigate('/faq')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20"
      aria-label="Open frequently asked questions"
    >
      <HelpCircle size={14} />
      <span>FAQ</span>
    </Button>
  )
}
