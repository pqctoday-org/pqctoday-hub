// SPDX-License-Identifier: GPL-3.0-only
/**
 * ModuleCompletionWatcher (A4) — fires the ModuleCompletionCard the moment a
 * module's status transitions to 'completed' (the store sets that when all learn
 * sections are checked). Mounted per-module with `key={moduleId}` so each module
 * watches only itself and the card fires once.
 *
 * It also detects the bigger PATH moment: if the module that just completed was
 * the LAST incomplete one in the learner's Journey, it shows the larger
 * 'path' card ("Journey complete") instead of the module card.
 *
 * Live data is read here and passed to the presentational card: belt + awareness
 * score (useAwarenessScore), journey progress, and the next incomplete module.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAwarenessScore } from '@/hooks/useAwarenessScore'
import { usePersonaPathItems } from './usePersonaPathItems'
import { MODULE_CATALOG } from './moduleData'
import { personaLabel } from '@/utils/analytics'
import { ModuleCompletionCard } from './ModuleCompletionCard'

interface ModuleCompletionWatcherProps {
  moduleId: string
}

export function ModuleCompletionWatcher({ moduleId }: ModuleCompletionWatcherProps) {
  const navigate = useNavigate()
  const modules = useModuleStore((s) => s.modules)
  const status = modules[moduleId]?.status
  const award = useAwarenessScore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const pathSummary = usePersonaPathItems(selectedPersona)

  // Was this module already completed on mount? If so, never auto-fire.
  const wasCompleted = useRef(status === 'completed')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const justCompleted = !wasCompleted.current && status === 'completed'
    wasCompleted.current = status === 'completed'
    if (!justCompleted) return
    // Defer the open out of the effect body (avoids a synchronous setState-in-effect;
    // same pattern as ModuleProgressHeader's completion banner).
    const id = setTimeout(() => setOpen(true), 0)
    return () => clearTimeout(id)
  }, [status])

  if (!open) return null

  // Journey context (only when the learner has a persona path).
  const pathModuleIds = pathSummary
    ? pathSummary.phases.flatMap((p) => p.moduleIds).filter((id) => MODULE_CATALOG[id])
    : []
  const isComplete = (id: string) => modules[id]?.status === 'completed'
  const doneCount = pathModuleIds.filter(isComplete).length
  const total = pathModuleIds.length
  const journeyComplete = total > 0 && doneCount === total

  // Next incomplete module after this one in the path (wrap to first incomplete).
  const idx = pathModuleIds.indexOf(moduleId)
  const ordered = idx >= 0 ? [...pathModuleIds.slice(idx + 1), ...pathModuleIds.slice(0, idx)] : []
  const nextId = ordered.find((id) => !isComplete(id)) ?? null
  const nextTitle = nextId ? (MODULE_CATALOG[nextId]?.title ?? null) : null

  const close = () => setOpen(false)

  return (
    <ModuleCompletionCard
      variant={journeyComplete ? 'path' : 'module'}
      title={
        journeyComplete && pathSummary
          ? `${personaLabel(pathSummary.personaId)} Journey`
          : (MODULE_CATALOG[moduleId]?.title ?? 'Module')
      }
      belt={{ name: award.belt.name, color: award.belt.color, textColor: award.belt.textColor }}
      score={award.score}
      nextBelt={award.nextBelt ? { name: award.nextBelt.name } : null}
      pointsToNextBelt={award.pointsToNextBelt}
      progress={total > 0 ? { done: doneCount, total } : null}
      nextLabel={journeyComplete ? null : nextTitle}
      onNext={
        journeyComplete || !nextId
          ? undefined
          : () => {
              close()
              navigate(`/learn/${nextId}`)
            }
      }
      onClose={close}
    />
  )
}
