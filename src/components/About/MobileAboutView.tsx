import { motion } from 'framer-motion'
import { Users, Globe, Lock, BrainCircuit } from 'lucide-react'
import clsx from 'clsx'
import { StudyPackCard } from './StudyPackCard'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion } from '../../store/useVersionStore'

export const MobileAboutView = () => {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          About PQC Today
        </h1>
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
          <h2 className="text-lg font-bold">Our Mission</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQC Today brings together 19 learning modules, hands-on cryptographic labs, a risk
          assessment wizard, migration planning tools, and global compliance tracking &mdash; tuned
          to your role and organization.
        </p>
      </motion.div>

      {/* Community Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-secondary/10 text-secondary">
            <Users size={20} />
          </div>
          <h2 className="text-lg font-bold">Community Driven</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This project is open source and community maintained. We believe in transparency and
          collaboration to solve the PQC challenge.
        </p>
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
          <h2 className="text-lg font-bold">Data Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQC Today is a fully static website with no backend, no database, and no user accounts. We
          do not collect, store, or transmit any personal data.
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
          <li>No cookies, no tracking pixels, no server-side logging</li>
          <li>All preferences and progress stored locally in your browser</li>
          <li>Cryptographic operations run entirely client-side via WASM</li>
          <li>No external API calls at runtime</li>
        </ul>
      </motion.div>

      {/* Study Pack Export */}
      <StudyPackCard />

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
          <h2 className="text-lg font-bold">PQC Assistant</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ask questions about post-quantum cryptography using our RAG-powered chatbot. It searches
          1,725 curated knowledge chunks and uses Gemini 2.5 Flash to deliver grounded answers with
          deep links to relevant pages.
        </p>
      </motion.div>

      {/* Connect Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="glass-panel p-4 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Created by <span className="font-bold text-foreground">Eric Amador</span>
        </p>
        <a
          href="https://www.linkedin.com/in/eric-amador-971850a"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 text-primary hover:underline text-sm"
        >
          <Users size={16} />
          Connect on LinkedIn
        </a>
      </motion.div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-panel p-4 flex flex-col items-center justify-center gap-3"
      >
        <h3 className="text-sm font-bold">Appearance</h3>
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
        <p className="text-[10px] text-muted-foreground/60">
          © 2025 PQC Timeline App. All rights reserved.
        </p>
      </div>
    </div>
  )
}
