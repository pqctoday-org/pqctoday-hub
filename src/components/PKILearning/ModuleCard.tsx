import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Circle, Clock } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { AskAssistantButton } from '../ui/AskAssistantButton'

export interface ModuleItem {
  id: string
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
  const status = modules[module.id]?.status || 'not-started'
  const timeSpentRaw = modules[module.id]?.timeSpent || 0
  const timeSpentFloored = Math.floor(timeSpentRaw)

  const durationDisplay =
    status === 'not-started' ? module.duration : `${module.duration} / ${timeSpentFloored} min`

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
          <div className="p-3 rounded-full bg-muted text-primary" aria-hidden="true">
            <BookOpen size={24} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isRelevant && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1.5 py-0.5">
              Relevant
            </span>
          )}
          {module.workInProgress && (
            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-status-warning text-status-warning">
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

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
        {module.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={14} />
          {durationDisplay}
          {module.difficulty && (
            <span
              className={
                'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ' +
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
        <div className="flex items-center gap-2">
          <AskAssistantButton
            question={`Tell me about the ${module.title} module — what will I learn and why does it matter for PQC migration?`}
          />
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
