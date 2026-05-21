// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkshopNavigation } from '../contexts/WorkshopNavigationContext'

interface PlaygroundNextStepProps {
  toolId: string
  name: string
  description: string
  className?: string
}

export const PlaygroundNextStep: React.FC<PlaygroundNextStepProps> = ({
  toolId,
  name,
  description,
  className = '',
}) => {
  const { selectTool } = useWorkshopNavigation()
  return (
    <div className={`mt-8 border-t border-border pt-6 ${className}`}>
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Next in sequence
          </p>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Button variant="outline" onClick={() => selectTool(toolId)} className="shrink-0 gap-2">
          Open
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}
