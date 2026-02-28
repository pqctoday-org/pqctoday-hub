/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Home,
  Rocket,
  Save,
  Upload,
  PlayCircle,
} from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { MODULE_INDUSTRY_RELEVANCE } from '../../data/personaConfig'
import { Button } from '../ui/button'
import { ModuleCard } from './ModuleCard'
import { MODULE_CATALOG, MODULE_TRACKS, MODULE_STEP_COUNTS } from './moduleData'
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
          <div className="pt-4 border-t border-border text-center">
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
          <div className="pt-4 border-t border-border text-center">
            <span className="text-xs text-muted-foreground">Click to upload</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

type LevelKey = 'new' | 'basics' | 'expert' | '_default'

const EXPERIENCE_PATHS: Record<LevelKey, { id: string; subtitle: string }[]> = {
  _default: [
    { id: 'pqc-101', subtitle: 'Understand the quantum threat in 15 minutes' },
    { id: 'quantum-threats', subtitle: 'Go deeper on how quantum computers break encryption' },
    {
      id: 'hybrid-crypto',
      subtitle: 'Learn how old and new encryption work together during the transition',
    },
    {
      id: 'crypto-agility',
      subtitle: 'Design systems that can switch algorithms as standards evolve',
    },
  ],
  new: [
    {
      id: 'pqc-101',
      subtitle: 'Understand the quantum threat — no prior crypto knowledge needed',
    },
    {
      id: 'quantum-threats',
      subtitle: "Shor's and Grover's algorithms and the HNDL/HNFL threat",
    },
    {
      id: 'pqc-risk-management',
      subtitle: 'Quantify quantum risk and build your first risk register',
    },
    { id: 'pqc-business-case', subtitle: 'Translate risk to ROI for leadership buy-in' },
    { id: 'pqc-governance', subtitle: 'Set up policies, RACI matrices, and KPI dashboards' },
    {
      id: 'compliance-strategy',
      subtitle: 'Map your multi-jurisdiction regulatory requirements',
    },
  ],
  basics: [
    {
      id: 'hybrid-crypto',
      subtitle: 'Combine classical and PQC algorithms during the transition',
    },
    { id: 'tls-basics', subtitle: 'Master TLS 1.3 handshakes before adding PQC' },
    { id: 'pki-workshop', subtitle: 'Build certificate chains hands-on, then migrate to PQC' },
    {
      id: 'key-management',
      subtitle: 'Lifecycle management, HSMs, and enterprise key rotation',
    },
    {
      id: 'email-signing',
      subtitle: 'S/MIME and CMS with KEM-based PQC encryption (RFC 9629)',
    },
    { id: 'code-signing', subtitle: 'From ML-DSA package integrity to Sigstore keyless signing' },
    { id: 'api-security-jwt', subtitle: 'JWT/JWS/JWE with ML-DSA signing and hybrid tokens' },
    {
      id: 'crypto-agility',
      subtitle: 'Design systems that can switch algorithms as standards evolve',
    },
    {
      id: 'digital-assets',
      subtitle: 'Cryptographic foundations of Bitcoin, Ethereum, and Solana',
    },
    {
      id: 'vendor-risk',
      subtitle: 'Score vendor PQC readiness and map supply chain exposure',
    },
    {
      id: 'migration-program',
      subtitle: 'Build migration roadmaps with real country deadlines',
    },
  ],
  expert: [
    { id: 'vpn-ssh-pqc', subtitle: 'IKEv2 and SSH with ML-KEM, WireGuard Rosenpass' },
    {
      id: 'stateful-signatures',
      subtitle: 'LMS/HSS and XMSS: Merkle tree signatures and critical state management',
    },
    {
      id: 'merkle-tree-certs',
      subtitle: 'Build Merkle trees, generate inclusion proofs, compare MTC vs PKI',
    },
    {
      id: 'entropy-randomness',
      subtitle: 'NIST SP 800-90, DRBG, TRNG vs QRNG — defense in depth',
    },
    {
      id: '5g-security',
      subtitle: '3GPP architecture: SUCI deconcealment, 5G-AKA, provisioning',
    },
    {
      id: 'iot-ot-pqc',
      subtitle: 'PQC for constrained devices: CoAP/DTLS, SCADA/ICS migration',
    },
    { id: 'digital-id', subtitle: 'EUDI Wallet: PID issuance, QES, attestations at scale' },
    {
      id: 'qkd',
      subtitle: 'BB84, classical post-processing, hybrid key derivation — 150 min deep dive',
    },
  ],
}

const EXPERIENCE_PATH_META: Record<LevelKey, { title: string; subtitle: string }> = {
  _default: {
    title: 'Start Here',
    subtitle:
      'New to post-quantum cryptography? Follow these 4 modules in order to build a solid foundation.',
  },
  new: {
    title: 'Start Here',
    subtitle: 'No prior cryptography knowledge required — 6 modules to build your PQC foundation.',
  },
  basics: {
    title: 'Your Learning Path',
    subtitle: 'Build on the basics with 11 protocol and infrastructure implementation modules.',
  },
  expert: {
    title: 'Deep Dives',
    subtitle:
      'Advanced workshops covering protocol internals, novel algorithms, and specialized domain applications.',
  },
}

const ExperienceLevelPath: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { modules } = useModuleStore()
  const { experienceLevel } = usePersonaStore()

  const levelKey: LevelKey = experienceLevel ?? '_default'
  const steps = EXPERIENCE_PATHS[levelKey]
  const meta = EXPERIENCE_PATH_META[levelKey]

  const allCompleted = steps.every((step) => modules[step.id]?.status === 'completed')
  if (allCompleted) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
          <Rocket className="text-primary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
          {meta.title}
        </h2>
        <p className="text-muted-foreground text-sm">{meta.subtitle}</p>
      </div>

      <div className="glass-panel p-4 md:p-6">
        <div className="space-y-0">
          {steps.map((step, i) => {
            const mod = MODULE_CATALOG[step.id]
            const status = modules[step.id]?.status || 'not-started'
            const isLast = i === steps.length - 1

            return (
              <div key={step.id} className="flex gap-3 md:gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  {status === 'completed' ? (
                    <CheckCircle className="text-status-success shrink-0" size={22} />
                  ) : (
                    <Circle
                      className={`shrink-0 ${status === 'in-progress' ? 'text-primary' : 'text-muted-foreground'}`}
                      size={22}
                    />
                  )}
                  {!isLast && (
                    <div
                      className={`w-px flex-1 min-h-[24px] ${status === 'completed' ? 'bg-status-success/40' : 'bg-border'}`}
                    />
                  )}
                </div>

                {/* Content */}
                <button onClick={() => navigate(step.id)} className="flex-1 text-left pb-4 group">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                    <span className="font-bold group-hover:text-primary transition-colors">
                      {mod.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{mod.duration}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                    {step.subtitle}
                  </p>
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-2 pt-3 border-t border-border">
          Then explore by track below, or select a role on the{' '}
          <button onClick={() => navigate('/')} className="text-primary hover:underline">
            home page
          </button>{' '}
          for a personalized path.
        </p>
      </div>
    </motion.section>
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

      {/* Experience level path — shown when no persona is selected */}
      {!showLearningPath && <ExperienceLevelPath navigate={navigate} />}

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
  const { selectedIndustry, experienceLevel } = usePersonaStore()

  const isModuleRelevant = (moduleId: string): boolean => {
    if (!selectedIndustry) return false
    const relevant = MODULE_INDUSTRY_RELEVANCE[moduleId]
    return relevant === null || (relevant?.includes(selectedIndustry) ?? false)
  }

  const isModuleAboveLevel = (moduleId: string): boolean => {
    if (!experienceLevel) return false
    const mod = MODULE_CATALOG[moduleId]
    if (!mod?.difficulty) return false
    if (experienceLevel === 'new') return mod.difficulty !== 'beginner'
    if (experienceLevel === 'basics') return mod.difficulty === 'advanced'
    return false // expert: nothing dimmed
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
                  isAboveLevel={isModuleAboveLevel(module.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  )
}
