// SPDX-License-Identifier: AGPL-3.0-only
import React, { useContext } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ModuleWorkshopNextContext,
  useWorkshopNavigation,
} from '../contexts/WorkshopNavigationContext'

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
  const inModule = useContext(ModuleWorkshopNextContext)
  // Inside a Learn module's stepper the module names the next step on the learner's path; on its
  // last step there is no next card.
  if (inModule === null) return null
  const card = inModule ?? { name, description, open: () => selectTool(toolId) }
  return (
    <div className={`mt-8 border-t border-border pt-6 ${className}`}>
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Next in sequence
          </p>
          <p className="text-sm font-semibold text-foreground">{card.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
        </div>
        <Button variant="outline" onClick={card.open} className="shrink-0 gap-2">
          Open
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}
