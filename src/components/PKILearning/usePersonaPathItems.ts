// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { PERSONAS, type PersonaId, type PathItem } from '@/data/learningPersonas'
import { MODULE_CATALOG, MODULE_TO_TRACK } from './moduleData'
import type { ModuleTableItem } from './ModuleTable'

export interface PersonaPathPhase {
  /** Phase key: the closing checkpoint id or 'wrap-up' for the terminal quiz phase. */
  id: string
  /** Phase title from the checkpoint label, or "Wrap-up" for the terminal phase. */
  title: string
  /** Module IDs contained in this phase, in order. */
  moduleIds: string[]
  /** Quiz category list from the closing checkpoint (empty for wrap-up). */
  categories: string[]
}

export interface PersonaPathSummary {
  personaId: PersonaId
  pathItems: readonly PathItem[]
  moduleCount: number
  checkpointCount: number
  estimatedMinutes: number
  /** Phases partitioned on checkpoint nodes, plus a terminal "Wrap-up" phase for the quiz. */
  phases: PersonaPathPhase[]
  /** Flat module/checkpoint list shaped for ModuleTable (re-used by cards/table modes). */
  flatItems: ModuleTableItem[]
}

/**
 * Shared persona-path computation used by both PersonaPathView and Dashboard.flatItems.
 * Walks PERSONAS[personaId].pathItems, partitions on checkpoint nodes, and synthesizes a
 * terminal "Wrap-up" phase for the trailing `quiz` module so the renderer can treat the
 * quiz uniformly as part of a phase rather than as a special-case sibling.
 *
 * Returns null when personaId is unknown (defensive — every PersonaId in the union is
 * present in PERSONAS but the input type is widened to string at deep-link boundaries).
 */
export function usePersonaPathItems(personaId: string | null | undefined): PersonaPathSummary | null {
  return useMemo(() => {
    if (!personaId) return null
    const persona = PERSONAS[personaId as PersonaId]
    if (!persona) return null

    const phases: PersonaPathPhase[] = []
    let buffer: string[] = []
    let trailingQuizId: string | null = null

    for (let i = 0; i < persona.pathItems.length; i++) {
      const item = persona.pathItems[i]
      if (item.type === 'module') {
        // Hold the terminal quiz module out for the wrap-up phase
        const isLast = i === persona.pathItems.length - 1
        if (isLast && item.moduleId === 'quiz') {
          trailingQuizId = item.moduleId
        } else {
          buffer.push(item.moduleId)
        }
      } else {
        // Checkpoint closes the current phase
        phases.push({
          id: item.id,
          title: item.label,
          moduleIds: buffer,
          categories: item.categories as string[],
        })
        buffer = []
      }
    }

    // Any modules left without a closing checkpoint form an implicit final phase
    if (buffer.length > 0) {
      phases.push({
        id: 'implicit-final',
        title: 'Final modules',
        moduleIds: buffer,
        categories: [],
      })
    }

    // Terminal wrap-up containing the quiz
    if (trailingQuizId) {
      phases.push({
        id: 'wrap-up',
        title: 'Wrap-up: Take the quiz',
        moduleIds: [trailingQuizId],
        categories: [],
      })
    }

    const moduleCount = persona.pathItems.filter((p) => p.type === 'module').length
    const checkpointCount = persona.pathItems.filter((p) => p.type === 'checkpoint').length

    const flatItems: ModuleTableItem[] = persona.pathItems.map((item) => {
      if (item.type === 'module') {
        const mod = MODULE_CATALOG[item.moduleId]
        return {
          kind: 'module' as const,
          module: mod,
          track: MODULE_TO_TRACK[item.moduleId] ?? '',
        }
      }
      return {
        kind: 'checkpoint' as const,
        id: item.id,
        label: item.label,
        categoryCount: item.categories.length,
        categories: item.categories as string[],
      }
    })

    return {
      personaId: persona.id,
      pathItems: persona.pathItems,
      moduleCount,
      checkpointCount,
      estimatedMinutes: persona.estimatedMinutes,
      phases,
      flatItems,
    }
  }, [personaId])
}
