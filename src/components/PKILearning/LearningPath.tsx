/* eslint-disable security/detect-object-injection */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, RotateCcw, Target, ArrowRight, Flag, Check } from 'lucide-react'
import { Briefcase, Code, ShieldCheck, GraduationCap } from 'lucide-react'
import { PERSONAS } from '../../data/learningPersonas'
import type { PathItem } from '../../data/learningPersonas'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useModuleStore } from '../../store/useModuleStore'
import { Button } from '../ui/button'
import { ModuleCard, type ModuleItem } from './ModuleCard'
import { MODULE_CATALOG, MODULE_STEP_COUNTS } from './moduleData'

const ICON_MAP = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
} as const

// ── Module node marker ──────────────────────────────────────────────────────

interface ModuleMarkerProps {
  status: 'completed' | 'in-progress' | 'not-started'
  step: number
  isQuiz: boolean
}

function ModuleMarker({ status, step, isQuiz }: ModuleMarkerProps) {
  if (isQuiz) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 border-2 border-primary text-primary">
        <Flag size={16} />
      </div>
    )
  }
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
        status === 'completed'
          ? 'bg-primary/20 border-primary text-primary'
          : status === 'in-progress'
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-muted/10 border-border text-muted-foreground'
      }`}
    >
      {status === 'completed' ? <Check size={15} /> : step}
    </div>
  )
}

// ── Checkpoint node marker ─────────────────────────────────────────────────

function CheckpointMarker() {
  return (
    <div className="w-9 h-9 flex items-center justify-center">
      <div className="w-5 h-5 rotate-45 rounded-sm bg-secondary/20 border-2 border-secondary" />
    </div>
  )
}

// ── Checkpoint card ────────────────────────────────────────────────────────

interface CheckpointCardProps {
  item: Extract<PathItem, { type: 'checkpoint' }>
  onTakeQuiz: () => void
}

function CheckpointCard({ item, onTakeQuiz }: CheckpointCardProps) {
  return (
    <div className="glass-panel border-l-2 border-l-secondary p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target size={14} className="text-secondary" />
          <span className="text-sm font-semibold text-foreground">{item.label} Checkpoint</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.categories.length} topic areas · Quick knowledge check
        </p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onTakeQuiz}>
        Take Quiz
        <ArrowRight size={14} className="ml-1.5" />
      </Button>
    </div>
  )
}

// ── Main LearningPath ──────────────────────────────────────────────────────

export const LearningPath = () => {
  const navigate = useNavigate()
  const { selectedPersona, clearPersona } = usePersonaStore()
  const { modules } = useModuleStore()
  const [showAllExpanded, setShowAllExpanded] = useState(false)

  if (!selectedPersona) return null

  const persona = PERSONAS[selectedPersona]
  const Icon = ICON_MAP[persona.icon]

  // Module items only (for progress and remaining-modules calculation)
  const pathModuleIds = persona.pathItems
    .filter((item): item is Extract<PathItem, { type: 'module' }> => item.type === 'module')
    .map((item) => item.moduleId)

  // Progress: count completed modules (excluding quiz)
  const completedCount = pathModuleIds
    .filter((id) => id !== 'quiz')
    .filter((id) => modules[id]?.status === 'completed').length
  const totalInPath = pathModuleIds.filter((id) => id !== 'quiz').length

  // Modules not in the path
  const pathSet = new Set(persona.recommendedPath)
  const remainingModules: ModuleItem[] = Object.keys(MODULE_CATALOG)
    .filter((id) => !pathSet.has(id))
    .map((id) => MODULE_CATALOG[id])
    .filter(Boolean)

  const hours = Math.round(persona.estimatedMinutes / 60)

  // Pre-compute step numbers for non-quiz module items
  const stepNumbers = new Map<string, number>()
  let step = 0
  for (const item of persona.pathItems) {
    if (item.type === 'module' && item.moduleId !== 'quiz') {
      step += 1
      stepNumbers.set(item.moduleId, step)
    }
  }

  return (
    <div className="space-y-6">
      {/* Path Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary">
            <Icon size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gradient">{persona.label} Path</h2>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalInPath} modules completed &middot; ~{hours}h total
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clearPersona}>
          <RotateCcw size={14} className="mr-1.5" />
          Change path
        </Button>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-muted/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${totalInPath > 0 ? (completedCount / totalInPath) * 100 : 0}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Visual Path Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-border" />

        <div className="space-y-3">
          {persona.pathItems.map((item, index) => {
            if (item.type === 'module') {
              const mod = MODULE_CATALOG[item.moduleId]
              if (!mod) return null

              const isQuiz = item.moduleId === 'quiz'
              const displayMod = isQuiz ? { ...mod, description: persona.quizDescription } : mod
              const status = modules[item.moduleId]?.status || 'not-started'
              const completedSteps = modules[item.moduleId]?.completedSteps?.length || 0
              const totalSteps = MODULE_STEP_COUNTS[item.moduleId] ?? 4
              const currentStep = stepNumbers.get(item.moduleId) ?? 0

              return (
                <motion.div
                  key={item.moduleId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="relative flex items-start gap-3"
                >
                  {/* Marker on the line */}
                  <div className="shrink-0 relative z-10 mt-3">
                    <ModuleMarker status={status} step={currentStep} isQuiz={isQuiz} />
                  </div>

                  {/* Module card */}
                  <div className="flex-1 min-w-0">
                    <ModuleCard module={displayMod} onSelectModule={(id) => navigate(id)} />
                    {status === 'in-progress' && completedSteps > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 ml-1">
                        {completedSteps} of {totalSteps} steps completed
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            }

            // Checkpoint node
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="relative flex items-center gap-3"
              >
                <div className="shrink-0 relative z-10">
                  <CheckpointMarker />
                </div>
                <div className="flex-1 min-w-0">
                  <CheckpointCard
                    item={item}
                    onTakeQuiz={() =>
                      navigate('/learn/quiz', {
                        state: {
                          checkpointCategories: item.categories,
                          checkpointLabel: item.label,
                        },
                      })
                    }
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Remaining Modules (collapsible) */}
      {remainingModules.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {showAllExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Explore all {remainingModules.length} other modules
          </button>

          <AnimatePresence>
            {showAllExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {remainingModules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onSelectModule={(id) => navigate(id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
