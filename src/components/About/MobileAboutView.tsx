import { motion } from 'framer-motion'
import { Users, Globe } from 'lucide-react'

export const MobileAboutView = () => {
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

        <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
          <p className="text-xs text-muted-foreground text-center italic">
            Input forms for Kudos and Change Requests are available on the desktop version.
          </p>
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
