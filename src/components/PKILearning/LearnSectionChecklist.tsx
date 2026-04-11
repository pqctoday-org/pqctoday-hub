// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { BookOpen, CheckSquare, Square } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { LEARN_SECTIONS } from './moduleData'
import { Button } from '@/components/ui/button'

interface LearnSectionChecklistProps {
  moduleId: string
  className?: string
}

/**
 * Manual checklist of reading sections for a module.
 * User checks each section after reading it. Checking all sections
 * triggers module completion in the store.
 */
export const LearnSectionChecklist = ({ moduleId, className = '' }: LearnSectionChecklistProps) => {
  const { modules, toggleLearnSection } = useModuleStore()
  const sections = LEARN_SECTIONS[moduleId] ?? []

  if (sections.length === 0) return null

  const moduleState = modules[moduleId]
  const checks = moduleState?.learnSectionChecks ?? {}
  const checkedCount = sections.filter((s) => checks[s.id]).length

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen size={12} />
          Reading Progress
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {checkedCount}/{sections.length}
        </span>
      </div>

      <ul className="space-y-1.5" aria-label="Learn section checklist">
        {sections.map((section) => {
          const isChecked = checks[section.id] ?? false
          return (
            <li key={section.id}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => toggleLearnSection(moduleId, section.id)}
                className={
                  'w-full min-w-0 whitespace-normal flex items-start gap-2 text-left text-xs rounded px-2 py-1.5 transition-colors ' +
                  (isChecked
                    ? 'text-status-success bg-status-success/15 hover:bg-status-success/20'
                    : 'text-foreground hover:bg-muted')
                }
                aria-pressed={isChecked}
                aria-label={`${isChecked ? 'Uncheck' : 'Check'}: ${section.label}`}
              >
                {isChecked ? (
                  <CheckSquare size={14} className="text-status-success mt-0.5 shrink-0" />
                ) : (
                  <Square size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                )}
                <span
                  className={`min-w-0 break-words ${isChecked ? 'line-through opacity-70' : ''}`}
                >
                  {section.label}
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
