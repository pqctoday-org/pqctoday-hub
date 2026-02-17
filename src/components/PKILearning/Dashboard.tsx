import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Brain, CheckCircle, Circle, Clock, Save, Upload, PlayCircle } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { Button } from '../ui/button'
import clsx from 'clsx'

interface ModuleItem {
  id: string
  title: string
  description: string
  duration: string
  workInProgress?: boolean
}

const ModuleCard = ({
  module,
  onSelectModule,
}: {
  module: ModuleItem
  onSelectModule: (moduleId: string) => void
}) => {
  const { modules } = useModuleStore()
  const status = modules[module.id]?.status || 'not-started'
  const timeSpent = modules[module.id]?.timeSpent || 0

  const durationDisplay =
    status === 'not-started' ? module.duration : `${module.duration} / ${timeSpent} min`

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

const SaveRestorePanel = () => {
  const { saveProgress, loadProgress } = useModuleStore()

  const handleSave = () => {
    saveProgress()
    // Could add toast notification here
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
            // Could add toast notification here
          } catch (error) {
            console.error('Failed to load progress:', error)
            // Could add error toast here
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
  const activeModules: ModuleItem[] = [
    {
      id: 'pqc-101',
      title: 'PQC 101',
      description:
        'Start here! A beginner-friendly introduction to the quantum threat and post-quantum cryptography.',
      duration: '15 min',
    },
    {
      id: 'pki-workshop',
      title: 'PKI',
      description: 'Complete hands-on workshop: CSRs, Root CAs, Signing, and Parsing.',
      duration: '45 min',
    },
    {
      id: 'digital-assets',
      title: 'Digital Assets',
      description:
        'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana using OpenSSL.',
      duration: '60 min',
    },
    {
      id: '5g-security',
      title: '5G Security',
      description:
        'Explore 3GPP security architecture: SUCI Deconcealment, 5G-AKA, & Provisioning.',
      duration: '90 min',
    },
    {
      id: 'digital-id',
      title: 'Digital ID',
      description:
        'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
      duration: '120 min',
    },
    {
      id: 'tls-basics',
      title: 'TLS Basics',
      description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
      duration: '60 min',
    },
  ]

  // Find most recently visited in-progress module
  const inProgressModules = activeModules
    .filter((m) => modules[m.id]?.status === 'in-progress')
    .sort((a, b) => (modules[b.id]?.lastVisited || 0) - (modules[a.id]?.lastVisited || 0))

  const resumeModule = inProgressModules[0]

  // Calculate progress percentage for resume module
  const getProgressPercentage = (moduleId: string): number => {
    const module = modules[moduleId]
    if (!module) return 0
    // Estimate based on completed steps (this could be more sophisticated)
    const totalSteps = 4 // Most modules have ~4 steps
    return Math.round((module.completedSteps.length / totalSteps) * 100)
  }

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
                  Time spent: {modules[resumeModule.id]?.timeSpent || 0} min
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

      {/* Active Modules Section */}
      <div>
        <div className="mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
            <BookOpen className="text-primary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
            Learning Workshops
          </h2>
          <p className="hidden lg:block text-muted-foreground">
            Interactive hands-on workshops to master cryptographic concepts.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {activeModules.map((module) => (
              <ModuleCard key={module.id} module={module} onSelectModule={(id) => navigate(id)} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Knowledge Check Section */}
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

      {/* Progress Management Section */}
      <SaveRestorePanel />
    </div>
  )
}
