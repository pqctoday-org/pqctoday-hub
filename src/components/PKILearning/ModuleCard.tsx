import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Circle, Clock } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import clsx from 'clsx'

export interface ModuleItem {
  id: string
  title: string
  description: string
  duration: string
  workInProgress?: boolean
}

export const ModuleCard = ({
  module,
  onSelectModule,
}: {
  module: ModuleItem
  onSelectModule: (moduleId: string) => void
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
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-6 flex flex-col h-full transition-colors hover:border-secondary/50 cursor-pointer"
      onClick={() => onSelectModule(module.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-white/5 text-primary" aria-hidden="true">
            <BookOpen size={24} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {module.workInProgress && (
            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              WIP
            </span>
          )}
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-bold border',
              status === 'completed'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : status === 'in-progress'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            )}
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

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={14} />
          {durationDisplay}
        </div>
        {status === 'completed' ? (
          <CheckCircle className="text-green-400" size={20} />
        ) : (
          <Circle className="text-muted-foreground" size={20} />
        )}
      </div>
    </motion.article>
  )
}
