// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'
import { Link } from 'react-router'

export function TransparencyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-panel p-4 flex items-start gap-3"
    >
      <Construction size={18} className="text-primary mt-0.5 shrink-0" />
      <div className="flex-1">
        {/* UX fix (B+ round 8, 2026-09-19): the bouncing "WIP" pill that sat
            beside this title was a platform-level work-in-progress badge on the
            site's first screen; the sentence below already says what it needs to.
            Per-page WIP signals (top-bar chip, module/tool chips) are unchanged. */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground text-sm">
            Community-Driven Educational Resource
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQC Today is built from publicly available information with thorough verification, but is
          not endorsed by the organizations cited and may contain inaccuracies.{' '}
          <Link to="/about#transparency" className="text-primary hover:underline">
            Learn more &rarr;
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
