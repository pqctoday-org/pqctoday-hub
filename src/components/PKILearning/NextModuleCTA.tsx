// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PartyPopper } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS } from '@/data/learningPersonas'
import { MODULE_CATALOG, MODULE_STEP_COUNTS } from './moduleData'

interface NextModuleCTAProps {
  moduleId: string
}

/**
 * Shows a "Continue to next module" CTA when all workshop steps in the
 * current module are complete. Uses persona path ordering to determine
 * the next module; falls back to showing a "Back to Learn" link.
 */
export const NextModuleCTA: React.FC<NextModuleCTAProps> = ({ moduleId }) => {
  const modules = useModuleStore((s) => s.modules)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const { nextModuleId, nextModuleTitle, allComplete } = useMemo(() => {
    const mod = modules[moduleId]
    const totalSteps = MODULE_STEP_COUNTS[moduleId] ?? 0
    const doneSteps = mod ? mod.completedSteps.length : 0
    const complete = totalSteps > 0 && doneSteps >= totalSteps

    if (!complete) return { nextModuleId: null, nextModuleTitle: null, allComplete: false }

    // Find next module in persona path
    if (selectedPersona) {
      const persona = PERSONAS[selectedPersona]
      const path = persona?.recommendedPath
      if (path) {
        const idx = path.indexOf(moduleId)
        if (idx !== -1 && idx < path.length - 1) {
          const nextId = path[idx + 1]
          const nextMeta = MODULE_CATALOG[nextId]
          return {
            nextModuleId: nextId,
            nextModuleTitle: nextMeta?.title ?? nextId,
            allComplete: true,
          }
        }
      }
    }

    return { nextModuleId: null, nextModuleTitle: null, allComplete: true }
  }, [moduleId, modules, selectedPersona])

  if (!allComplete) return null

  return (
    <div className="mt-6 p-4 glass-panel border-primary/20 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <PartyPopper size={18} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">All workshop steps complete!</span>
      </div>
      {nextModuleId ? (
        <Link
          to={`/learn/${nextModuleId}`}
          className="inline-flex items-center gap-2 px-4 py-2 mt-1 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground text-sm font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
        >
          Continue to {nextModuleTitle}
          <ArrowRight size={14} />
        </Link>
      ) : (
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 px-4 py-2 mt-1 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          Back to Learning Dashboard
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
