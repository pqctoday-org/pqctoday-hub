// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import { WORKSHOP_TOOLS, type WorkshopTool } from '../workshopRegistry'
import { ToolCard } from './ToolCard'

/**
 * Starter tools per persona — the curated "first steps" path. Mirrors the
 * shape of PERSONA_META.starterTools in PlaygroundWorkshop.tsx so the path
 * view stays in lock-step with the existing persona-banner logic.
 *
 * Order within the array is the curated order shown in the path.
 */
const PERSONA_STARTER_TOOLS: Record<PersonaId, string[]> = {
  executive: ['hybrid-certs', 'token-migration', 'envelope-encrypt'],
  developer: ['openssl-studio', 'slh-dsa', 'api-security-jwt'],
  architect: ['hybrid-certs', 'envelope-encrypt', 'tee-channel'],
  researcher: ['entropy-test', 'slh-dsa', 'kdf-derivation'],
  ops: ['firmware-signing', 'hybrid-certs', 'token-migration'],
  curious: ['qrng-demo', 'rng-demo', 'tls-simulator'],
}

const PERSONA_LABEL: Record<PersonaId, string> = {
  executive: 'Executive / GRC',
  developer: 'Developer / Engineer',
  architect: 'Security Architect',
  researcher: 'Researcher / Academic',
  ops: 'IT Ops / DevOps',
  curious: 'Curious Explorer',
}

interface PlaygroundPersonaPathViewProps {
  personaId: PersonaId
  /** Pre-filtered tool set (search + difficulty + bookmarks + algorithm taxon, etc.). */
  tools: WorkshopTool[]
}

export const PlaygroundPersonaPathView: React.FC<PlaygroundPersonaPathViewProps> = ({
  personaId,
  tools,
}) => {
  const starterIds = PERSONA_STARTER_TOOLS[personaId]
  const toolById = useMemo(() => {
    const m = new Map<string, WorkshopTool>()
    for (const t of WORKSHOP_TOOLS) m.set(t.id, t)
    return m
  }, [])

  // The starter tools, only those still present after the upstream filter set.
  // (If e.g. user filtered out by difficulty, drop them from the path.)
  const filteredIds = new Set(tools.map((t) => t.id))
  const starters = starterIds
    .map((id) => toolById.get(id))
    .filter((t): t is WorkshopTool => !!t && filteredIds.has(t.id))

  // Remaining persona-recommended tools (those tagged for this persona) that
  // are NOT in the starter list — shown after the starters as "More for you".
  const remaining = tools.filter(
    (t) => t.recommendedPersonas.includes(personaId) && !starterIds.includes(t.id)
  )

  return (
    <div className="space-y-6">
      {/* Curated path */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            Start Here — {PERSONA_LABEL[personaId]}
          </h3>
          <span className="text-xs text-muted-foreground">
            · {starters.length} step{starters.length === 1 ? '' : 's'}
          </span>
        </div>
        {starters.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            None of this persona&rsquo;s starter tools match the current filters. Clear filters or
            switch to Stack view to see everything.
          </p>
        ) : (
          <ol className="space-y-3">
            {starters.map((tool, idx) => (
              <li key={tool.id} className="flex items-start gap-3">
                <span className="shrink-0 mt-3 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <ToolCard tool={tool} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Remaining persona-recommended tools */}
      {remaining.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <ArrowRight size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              More for {PERSONA_LABEL[personaId]}
            </h3>
            <span className="text-xs text-muted-foreground">· {remaining.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {remaining.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Empty path AND no remaining */}
      {starters.length === 0 && remaining.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No persona-recommended tools match the current filters.
        </p>
      )}
    </div>
  )
}
