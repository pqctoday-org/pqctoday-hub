// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle, CheckSquare } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useModuleStore } from '../../store/useModuleStore'
import { LEARN_SECTIONS } from './moduleData'
import { Button } from '../ui/button'

/**
 * Inline reading completion CTA rendered at the bottom of every Introduction component.
 * Self-contained — resolves moduleId from the URL via useLocation (no :moduleId route param).
 *
 * Two states:
 *  - Not complete: "Mark as Read" button with CheckSquare icon
 *  - Complete: green success panel with CheckCircle icon
 *
 * Returns null for modules with no LEARN_SECTIONS (e.g. Quiz, dashboard).
 */
export const ReadingCompleteButton = () => {
  const location = useLocation()
  const moduleId = location.pathname.replace(/^\/learn\/?/, '') || undefined
  const { modules, markAllLearnSectionsComplete } = useModuleStore()

  if (!moduleId) return null

  const sections = LEARN_SECTIONS[moduleId] ?? []
  if (sections.length === 0) return null

  const moduleState = modules[moduleId]
  const checks = moduleState?.learnSectionChecks ?? {}
  const allDone = sections.length > 0 && sections.every((s) => checks[s.id])

  if (allDone) {
    return (
      <div className="mt-8 flex items-center justify-center gap-3 rounded-xl bg-status-success/15 border border-status-success/30 px-6 py-4 animate-in fade-in duration-300">
        <CheckCircle size={20} className="text-status-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-status-success">Reading Complete!</p>
          <p className="text-xs text-status-success/80 mt-0.5">All sections marked as read.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 glass-panel p-4 text-center">
      <Button
        variant="gradient"
        className="gap-2"
        onClick={() => markAllLearnSectionsComplete(moduleId)}
      >
        <CheckSquare size={16} />
        Mark as Read
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Check off all sections and mark this reading done.
      </p>
    </div>
  )
}
