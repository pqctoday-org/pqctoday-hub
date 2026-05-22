// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Route } from 'lucide-react'
import { Button } from '../ui/button'
import { useModuleStore } from '../../store/useModuleStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { MODULE_CATALOG } from './moduleData'
import { computeNextIncompleteModuleId } from './PersonaPathView'

interface RecommendedPathBannerProps {
  personaId: PersonaId
  onResume: (moduleId: string) => void
}

/** Formats raw minutes into a compact human label (e.g. 725 → "~12h"). */
function formatEstimatedHours(minutes: number): string {
  if (minutes <= 0) return '~0h'
  const hours = Math.round(minutes / 60)
  return `~${hours}h`
}

export const RecommendedPathBanner = ({ personaId, onResume }: RecommendedPathBannerProps) => {
  const persona = PERSONAS[personaId]
  const modules = useModuleStore((s) => s.modules)
  const reduced = usePrefersReducedMotion()

  const moduleCount = useMemo(
    () => persona.pathItems.filter((p) => p.type === 'module').length,
    [persona.pathItems]
  )
  const checkpointCount = useMemo(
    () => persona.pathItems.filter((p) => p.type === 'checkpoint').length,
    [persona.pathItems]
  )

  const nextIncompleteId = useMemo(() => {
    const statusMap: Record<string, string | undefined> = {}
    for (const k of Object.keys(modules)) {
      statusMap[k] = modules[k]?.status
    }
    return computeNextIncompleteModuleId(
      persona.pathItems as { type: 'module' | 'checkpoint'; moduleId?: string }[],
      statusMap
    )
  }, [persona.pathItems, modules])

  // eslint-disable-next-line security/detect-object-injection
  const nextModule = nextIncompleteId ? MODULE_CATALOG[nextIncompleteId] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
      className="glass-panel px-4 py-3 border-primary/30"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Route className="text-primary shrink-0 mt-0.5" size={18} aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Your path
              </span>
              <span className="text-sm font-semibold text-gradient">{persona.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {moduleCount} modules · {checkpointCount} checkpoints ·{' '}
              {formatEstimatedHours(persona.estimatedMinutes)}
            </p>
            {nextModule && (
              <p className="text-xs text-foreground mt-1">
                Next: <span className="font-medium">{nextModule.title}</span>
              </p>
            )}
          </div>
        </div>
        {nextModule && (
          <Button
            variant="gradient"
            size="sm"
            onClick={() => onResume(nextModule.id)}
            className="shrink-0"
          >
            Resume
            <ArrowRight size={12} className="ml-1.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
