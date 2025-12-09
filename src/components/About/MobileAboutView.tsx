import { motion } from 'framer-motion'
import { Users, Globe } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../../hooks/useTheme'

export const MobileAboutView = () => {
  const { theme, setTheme } = useTheme()
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
          Tracking the global transition to Post-Quantum Cryptography.
        </p>
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
          We aim to provide a comprehensive, real-time overview of how nations and organizations are
          preparing for the quantum threat. By aggregating data on policy, regulation, and technical
          migration, we help the community stay informed.
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
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          This project is open source and community maintained. We believe in transparency and
          collaboration to solve the PQC challenge.
        </p>

        <div className="p-3 rounded-lg bg-muted/20 border border-border">
          <p className="text-xs text-muted-foreground text-center italic">
            Input forms for Kudos and Change Requests are available on the desktop version.
          </p>
        </div>
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
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize flex items-center gap-1.5',
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
