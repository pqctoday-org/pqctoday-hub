// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Circle, Clock, Wrench, CheckSquare, Square } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { LEARN_SECTIONS, WORKSHOP_STEPS } from './moduleData'
import { Button } from '@/components/ui/button'

export interface ModuleItem {
  id: string
  lm_id?: string
  title: string
  description: string
  duration: string
  workInProgress?: boolean
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export const ModuleCard = ({
  module,
  onSelectModule,
  isRelevant,
  isAboveLevel,
}: {
  module: ModuleItem
  onSelectModule: (moduleId: string) => void
  isRelevant?: boolean
  isAboveLevel?: boolean
}) => {
  const { modules } = useModuleStore()
  const isBookmarked = useBookmarkStore((s) => s.myLearnModules.includes(module.id))
  const toggleMyLearnModule = useBookmarkStore((s) => s.toggleMyLearnModule)
  const moduleState = modules[module.id]
  const status = moduleState?.status || 'not-started'
  const timeSpentRaw = moduleState?.timeSpent || 0
  const timeSpentFloored = Math.floor(timeSpentRaw)

  // Learn-section completion percentage
  const learnSections = LEARN_SECTIONS[module.id] ?? []
  const checks = moduleState?.learnSectionChecks ?? {}
  const checkedCount = learnSections.filter((s) => checks[s.id]).length
  const learnPct =
    learnSections.length > 0 ? Math.round((checkedCount / learnSections.length) * 100) : 0

  // Workshop completion percentage
  const workshopSteps = WORKSHOP_STEPS[module.id] ?? []
  const completedSteps = moduleState?.completedSteps ?? []
  const workshopDone = workshopSteps.filter((s) => completedSteps.includes(s.id)).length
  const workshopPct =
    workshopSteps.length > 0 ? Math.round((workshopDone / workshopSteps.length) * 100) : 0
  const hasWorkshop = workshopSteps.length > 0

  const durationDisplay =
    status === 'not-started' || timeSpentFloored < 1
      ? module.duration
      : `${module.duration} / ${timeSpentFloored} min`

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isAboveLevel && status !== 'completed' ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-6 flex flex-col h-full transition-colors hover:border-secondary/50 cursor-pointer"
      onClick={() => onSelectModule(module.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Stacked mini progress bars: Learn + Workshop */}
          <div className="shrink-0 w-24 space-y-1.5">
            {/* Learn bar */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span
                  className={`flex items-center gap-0.5 font-medium ${learnPct === 100 ? 'text-status-success' : 'text-muted-foreground'}`}
                >
                  <BookOpen size={8} />
                  Learn
                  {learnPct === 100 && (
                    <CheckCircle size={8} className="text-status-success" aria-hidden="true" />
                  )}
                </span>
                <span
                  className={
                    learnPct === 100 ? 'text-status-success font-medium' : 'text-muted-foreground'
                  }
                >
                  {learnPct}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${learnPct === 100 ? 'bg-status-success' : 'bg-primary'}`}
                  style={{ width: `${learnPct}%` }}
                />
              </div>
            </div>
            {/* Workshop bar — only for modules with workshop steps */}
            {hasWorkshop && (
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span
                    className={`flex items-center gap-0.5 font-medium ${workshopPct === 100 ? 'text-status-success' : 'text-muted-foreground'}`}
                  >
                    <Wrench size={8} />
                    Workshop
                    {workshopPct === 100 && (
                      <CheckCircle size={8} className="text-status-success" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={
                      workshopPct === 100
                        ? 'text-status-success font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {workshopPct}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${workshopPct === 100 ? 'bg-status-success' : 'bg-accent'}`}
                    style={{ width: `${workshopPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Bookmark toggle */}
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              toggleMyLearnModule(module.id)
            }}
            className={`p-1 rounded transition-colors ${
              isBookmarked
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground/40 hover:text-primary'
            }`}
            aria-label={isBookmarked ? 'Remove from My Learn' : 'Add to My Learn'}
          >
            {isBookmarked ? <CheckSquare size={16} /> : <Square size={16} />}
          </Button>
          {isRelevant && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1.5 py-0.5">
              Relevant
            </span>
          )}
          {module.workInProgress && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning animate-pulse-glow">
              <Wrench size={12} className="animate-bounce-subtle" />
              WIP
            </span>
          )}
          <span
            className={
              'px-3 py-1 rounded-full text-xs font-bold border ' +
              (status === 'completed'
                ? 'bg-status-success text-status-success'
                : status === 'in-progress'
                  ? 'bg-status-info text-status-info'
                  : 'bg-secondary/10 text-secondary border-secondary/30')
            }
          >
            {status === 'completed'
              ? 'Completed'
              : status === 'in-progress'
                ? 'In Progress'
                : 'Not Started'}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2">{module.title}</h3>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow line-clamp-2 md:line-clamp-none">
        {module.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Clock size={14} className="shrink-0" />
          <span className="truncate max-w-[120px] md:max-w-none">{durationDisplay}</span>
          {module.difficulty && (
            <span
              className={
                'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ' +
                (module.difficulty === 'beginner'
                  ? 'bg-status-success/15 text-status-success'
                  : module.difficulty === 'intermediate'
                    ? 'bg-status-warning/15 text-status-warning'
                    : 'bg-status-error/15 text-status-error')
              }
            >
              {module.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <EndorseButton
              endorseUrl={buildEndorsementUrl({
                category: 'learn-module-endorsement',
                title: `Endorse: ${module.title}`,
                resourceType: 'Learning Module',
                resourceId: module.id,
                resourceDetails: [
                  `**Module:** ${module.title}`,
                  `**Duration:** ${module.duration}`,
                  module.difficulty ? `**Difficulty:** ${module.difficulty}` : '',
                  `**Description:** ${module.description}`,
                ]
                  .filter(Boolean)
                  .join('\n'),
                pageUrl: `/learn/${module.id}`,
              })}
              resourceLabel={module.title}
              resourceType="Module"
            />
            <FlagButton
              flagUrl={buildFlagUrl({
                category: 'learn-module-endorsement',
                title: `Flag: ${module.title}`,
                resourceType: 'Learning Module',
                resourceId: module.id,
                resourceDetails: [
                  `**Module:** ${module.title}`,
                  `**Duration:** ${module.duration}`,
                  module.difficulty ? `**Difficulty:** ${module.difficulty}` : '',
                  `**Description:** ${module.description}`,
                ]
                  .filter(Boolean)
                  .join('\n'),
                pageUrl: `/learn/${module.id}`,
              })}
              resourceLabel={module.title}
              resourceType="Module"
            />
            <AskAssistantButton
              question={`Tell me about the ${module.title} module — what will I learn and why does it matter for PQC migration?`}
            />
          </div>
          {status === 'completed' ? (
            <CheckCircle className="text-status-success" size={20} aria-hidden="true" />
          ) : (
            <Circle className="text-muted-foreground" size={20} aria-hidden="true" />
          )}
        </div>
      </div>
    </motion.article>
  )
}
