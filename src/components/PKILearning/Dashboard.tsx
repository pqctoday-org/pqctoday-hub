import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle, Circle, Clock, Layers, Save, Upload } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import clsx from 'clsx'

interface ModuleItem {
  id: string
  title: string
  description: string
  duration: string
  disabled?: boolean
  comingSoon?: boolean
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

  // Format duration string
  let durationDisplay = module.duration
  if (!module.comingSoon) {
    if (status === 'not-started') {
      durationDisplay = `${module.duration}`
    } else {
      durationDisplay = `${module.duration} / ${timeSpent} min`
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'glass-panel p-6 flex flex-col h-full transition-colors',
        !module.disabled && 'hover:border-secondary/50 cursor-pointer',
        module.disabled && 'opacity-60 cursor-not-allowed'
      )}
      onClick={() => !module.disabled && onSelectModule(module.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-white/5 text-primary" aria-hidden="true">
            <BookOpen size={24} />
          </div>
        </div>
        {module.comingSoon ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
            Coming Soon
          </span>
        ) : (
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
        )}
      </div>

      <h3 className="text-xl font-bold mb-2">{module.title}</h3>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
        {module.description}
      </p>

      {!module.comingSoon && (
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
      )}
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
  const activeModules: ModuleItem[] = [
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
  ]

  const upcomingModules: ModuleItem[] = [
    {
      id: '5g-security',
      title: '5G Security',
      description: 'Explore the security architecture of 5G networks and SIM authentication.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
    {
      id: 'digital-id',
      title: 'Digital ID',
      description: 'Understand decentralized identity, verifiable credentials, and mDL.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
    {
      id: 'tls',
      title: 'TLS',
      description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
    {
      id: 'vpn',
      title: 'VPN',
      description: 'Configure and secure VPN tunnels using WireGuard and OpenVPN protocols.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
  ]

  return (
    <div className="space-y-8">
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

      {/* Upcoming Modules Section */}
      <div>
        <div className="mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
            <Layers className="text-secondary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
            Upcoming Tracks
          </h2>
          <p className="hidden md:block text-muted-foreground">
            More learning modules coming soon to expand your knowledge.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {upcomingModules.map((module) => (
              <ModuleCard key={module.id} module={module} onSelectModule={(id) => navigate(id)} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Management Section */}
      <SaveRestorePanel />
    </div>
  )
}
