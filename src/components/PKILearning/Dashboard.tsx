/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Home,
  Save,
  Upload,
  PlayCircle,
} from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { MODULE_INDUSTRY_RELEVANCE } from '../../data/personaConfig'
import { Button } from '../ui/button'
import { ModuleCard } from './ModuleCard'
import { MODULE_TRACKS, MODULE_STEP_COUNTS } from './moduleData'
import { LearningPath } from './LearningPath'

const SaveRestorePanel = () => {
  const { saveProgress, loadProgress } = useModuleStore()

  const handleSave = () => {
    saveProgress()
  }

  const handleRestore = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string)
            loadProgress(data)
          } catch (error) {
            console.error('Failed to load progress:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
          <Save className="text-secondary w-8 h-8 md:w-8 md:h-8" size={32} />
          Progress Management
        </h2>
        <p className="hidden md:block text-muted-foreground">
          Save your learning progress to continue later or transfer between devices.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="glass-panel p-6 flex flex-col h-full hover:border-primary/50 transition-colors cursor-pointer"
          onClick={handleSave}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Save size={32} />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">Save Progress</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 flex-grow">
            Download your current learning progress as a JSON file for backup or transfer.
          </p>
          <div className="pt-4 border-t border-white/5 text-center">
            <span className="text-xs text-muted-foreground">Click to download</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="glass-panel p-6 flex flex-col h-full hover:border-secondary/50 transition-colors cursor-pointer"
          onClick={handleRestore}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-secondary/10 text-secondary">
              <Upload size={32} />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">Restore Progress</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 flex-grow">
            Upload a previously saved progress file to continue your learning journey.
          </p>
          <div className="pt-4 border-t border-white/5 text-center">
            <span className="text-xs text-muted-foreground">Click to upload</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { modules } = useModuleStore()
  const { selectedPersona } = usePersonaStore()
  const [gridExpanded, setGridExpanded] = useState(false)

  const activeModules = MODULE_TRACKS.flatMap((t) => t.modules)

  // Find most recently visited in-progress module
  const inProgressModules = activeModules
    .filter((m) => modules[m.id]?.status === 'in-progress')
    .sort((a, b) => (modules[b.id]?.lastVisited || 0) - (modules[a.id]?.lastVisited || 0))

  const resumeModule = inProgressModules[0]

  const getProgressPercentage = (moduleId: string): number => {
    const module = modules[moduleId]
    if (!module) return 0
    const totalSteps = MODULE_STEP_COUNTS[moduleId] ?? 4
    return Math.min(100, Math.round((module.completedSteps.length / totalSteps) * 100))
  }

  // Show learning path if user has selected a persona (set from the home page)
  const showLearningPath = !!selectedPersona
  // Show full grid when no persona selected — persona is now set from the home page
  const showFullGrid = !selectedPersona

  return (
    <div className="space-y-8">
      {/* Continue Learning Section */}
      {resumeModule && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel p-6 border-primary/30"
        >
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="text-primary" size={24} />
                <h3 className="text-xl font-bold">Continue Learning</h3>
              </div>
              <p className="text-lg text-foreground font-semibold mb-1">{resumeModule.title}</p>
              <p className="text-sm text-muted-foreground mb-3">{resumeModule.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Progress: {getProgressPercentage(resumeModule.id)}%
                </span>
                <span className="text-muted-foreground">
                  Time spent: {Math.floor(modules[resumeModule.id]?.timeSpent || 0)} min
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="gradient" onClick={() => navigate(resumeModule.id)}>
                Resume Module
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Learning Path — shown when persona is selected (set from the home page) */}
      {showLearningPath && <LearningPath />}

      {/* Module Tracks Grid */}
      {showLearningPath ? (
        /* When learning path is active, show grid as collapsible */
        <div>
          <button
            onClick={() => setGridExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {gridExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Browse all workshops by track
          </button>

          <AnimatePresence>
            {gridExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <ModuleTracksGrid navigate={navigate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* When no persona, show full grid directly */
        showFullGrid && <ModuleTracksGrid navigate={navigate} onGoHome={() => navigate('/')} />
      )}

      {/* Knowledge Check Section — hidden when learning path is active (quiz is included in the path) */}
      {!showLearningPath && (
        <div>
          <div className="mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
              <Brain className="text-secondary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
              Knowledge Check
            </h2>
            <p className="hidden lg:block text-muted-foreground">
              Test your understanding of post-quantum cryptography concepts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <ModuleCard
              module={{
                id: 'quiz',
                title: 'PQC Quiz',
                description:
                  'Test your knowledge across all PQC topics — algorithms, standards, compliance, migration, and more.',
                duration: '15 min',
              }}
              onSelectModule={() => navigate('quiz')}
            />
          </div>
        </div>
      )}

      {/* Progress Management Section */}
      <SaveRestorePanel />
    </div>
  )
}

/** The existing module grid organized by track */
const ModuleTracksGrid = ({
  navigate,
  onGoHome,
}: {
  navigate: (path: string) => void
  onGoHome?: () => void
}) => {
  const { selectedIndustry } = usePersonaStore()

  const isModuleRelevant = (moduleId: string): boolean => {
    if (!selectedIndustry) return false
    const relevant = MODULE_INDUSTRY_RELEVANCE[moduleId]
    return relevant === null || (relevant?.includes(selectedIndustry) ?? false)
  }

  return (
    <div className="space-y-8 pt-4">
      <div className="mb-2 md:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
            <BookOpen className="text-primary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
            Learning Workshops
          </h2>
          <p className="hidden lg:block text-muted-foreground">
            Interactive hands-on workshops to master cryptographic concepts.
          </p>
        </div>
        {onGoHome && (
          <Button variant="outline" size="sm" onClick={onGoHome}>
            <Home size={14} className="mr-1.5" />
            Personalize from home
          </Button>
        )}
      </div>

      {MODULE_TRACKS.map((group) => (
        <div key={group.track}>
          <h3 className="text-lg font-bold text-foreground mb-3 pl-1">{group.track}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {group.modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onSelectModule={(id) => navigate(id)}
                  isRelevant={isModuleRelevant(module.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  )
}
