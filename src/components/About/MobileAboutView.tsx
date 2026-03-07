// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Globe,
  Lock,
  BrainCircuit,
  Database,
  Sparkles,
  BarChart2,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Cpu,
  BookOpen,
  Trophy,
  FileText,
  CalendarDays,
  ShieldAlert,
  Package,
} from 'lucide-react'

const DISCUSSIONS_BASE = 'https://github.com/pqctoday/pqc-timeline-app/discussions/'
const DISCUSSIONS = [
  {
    number: 108,
    icon: Users,
    label: 'Contribute',
    description: 'I need your help to improve pqctoday.com',
  },
  {
    number: 109,
    icon: Globe,
    label: 'PQC News',
    description: 'Share general information about PQC',
  },
  { number: 110, icon: Lightbulb, label: 'Ideas', description: 'Post your ideas for improvements' },
  { number: 111, icon: HelpCircle, label: 'Q&A', description: 'Ask questions — answered ASAP' },
  { number: 113, icon: Cpu, label: 'Algorithms', description: 'Update or add a new algorithm' },
  {
    number: 115,
    icon: BookOpen,
    label: 'Learn Modules',
    description: 'Update or add a new learning module',
  },
  { number: 116, icon: Trophy, label: 'Leaders', description: 'Update or add a new leader' },
  {
    number: 117,
    icon: FileText,
    label: 'References',
    description: 'Update or add a reference document',
  },
  {
    number: 118,
    icon: CalendarDays,
    label: 'Timeline',
    description: 'Change or add a new timeline',
  },
  { number: 119, icon: ShieldAlert, label: 'Threats', description: 'Change or add a new threat' },
  { number: 120, icon: Package, label: 'Products', description: 'Change or add a new product' },
]
import clsx from 'clsx'
import { CareerJourneyModal } from './CareerJourneyModal'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion } from '../../store/useVersionStore'

export const MobileAboutView = () => {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gradient mb-2">About PQC Today</h1>
        <p className="text-sm text-muted-foreground">
          Learn, assess, explore, and act on the post-quantum transition.
        </p>
        <p className="text-xs text-muted-foreground/60 font-mono mt-1">v{version}</p>
      </motion.div>

      {/* Mission Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Globe size={20} />
          </div>
          <h2 className="text-lg font-semibold">Our Mission</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQC Today brings together 48 learning modules across 8 tracks &mdash; including role
          guides, industry verticals, and hands-on crypto labs &mdash; 770+ quiz questions, a risk
          assessment wizard, migration planning tools, and global compliance tracking &mdash; tuned
          to your role as a developer, architect, operations professional, executive, or researcher.
        </p>
      </motion.div>

      {/* Data Foundation Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Platform Data</h2>
            <p className="text-xs text-muted-foreground">Curated and updated weekly</p>
          </div>
        </div>
        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-gradient">1,550+</span>
          <p className="text-xs text-muted-foreground mt-1">curated records across 10 datasets</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Timeline Events', value: '187' },
            { label: 'Migrate Products', value: '223' },
            { label: 'Library Resources', value: '236' },
            { label: 'Quiz Questions', value: '520' },
          ].map((s) => (
            <div
              key={s.label}
              className="p-2 rounded-lg border border-border bg-muted/30 text-center"
            >
              <div className="text-sm font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Community Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Community</h2>
            <p className="text-xs text-muted-foreground">GitHub Discussions</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          This project is open source and community maintained. Join the conversation — ask
          questions, share ideas, or request new content.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {DISCUSSIONS.map(({ number, icon: Icon, label, description }) => (
            <a
              key={number}
              href={`${DISCUSSIONS_BASE}${number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
            >
              <Icon className="text-primary shrink-0" size={16} />
              <div className="min-w-0">
                <p className="text-xs font-medium group-hover:text-primary transition-colors">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Data Privacy Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Lock size={20} />
          </div>
          <h2 className="text-lg font-semibold">Data Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQC Today is a fully static website with no backend, no database, and no user accounts. We
          do not collect, store, or transmit any personal data.
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
          <li>No personal data — no names, emails, cookies, or server-side logging</li>
          <li>All preferences and progress stored locally in your browser</li>
          <li>Cryptographic keys and certificates never leave your device</li>
          <li>No external API calls at runtime</li>
        </ul>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={13} className="text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-foreground">Anonymous usage analytics</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use <strong className="text-foreground">Google Analytics 4</strong> to collect
            anonymous behavioral signals (page views, feature interactions, accuracy votes, learning
            milestones). No personal identifiers are ever transmitted. Analytics are disabled on
            localhost.{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Opt out
            </a>
            .
          </p>
        </div>
      </motion.div>

      {/* PQC Assistant Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <BrainCircuit size={20} />
          </div>
          <h2 className="text-lg font-semibold">PQC Assistant</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ask questions about post-quantum cryptography using our RAG-powered chatbot. It searches
          ~2,200 curated knowledge chunks and uses Gemini 2.5 Flash to deliver grounded answers with
          deep links to relevant pages.
        </p>
      </motion.div>

      {/* Connect Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="glass-panel p-4 text-center space-y-3"
      >
        <p className="text-sm text-muted-foreground">
          Created by <span className="font-bold text-foreground">Eric Amador</span>
        </p>
        <div className="flex flex-col items-center gap-3">
          <a
            href="https://www.linkedin.com/in/eric-amador-971850a"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <Users size={16} />
            Connect on LinkedIn
          </a>
          <button
            onClick={() => setIsJourneyModalOpen(true)}
            className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:underline group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            View My Career Journey
          </button>
        </div>
      </motion.div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-panel p-4 flex flex-col items-center justify-center gap-3"
      >
        <h3 className="text-sm font-semibold">Appearance</h3>
        <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={clsx(
                'px-3 py-1.5 min-h-[44px] rounded-md text-xs font-medium transition-colors capitalize flex items-center gap-1.5',
                theme === t
                  ? 'bg-primary/20 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
              )}
            >
              {t === 'light' && '☀️'}
              {t === 'dark' && '🌙'}
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <div className="text-center px-4">
        <p className="text-xs text-muted-foreground/60">
          © 2026 PQC Timeline App. All rights reserved.
        </p>
      </div>
      <CareerJourneyModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
      />
    </div>
  )
}
