// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { Info, Shield, ExternalLink } from 'lucide-react'
import { LinkToUsButton } from '@/components/ui/LinkToUsButton'

export function LicenseSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.39 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Shield className="text-secondary" size={24} />
        <h2 className="text-xl font-semibold">Open Source License</h2>
      </div>
      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground">
          PQC Today is open source software released under the{' '}
          <strong>GNU General Public License v3.0 (GPLv3)</strong>.
        </p>
        <p className="text-muted-foreground mt-2">
          You are free to copy, distribute, and modify this software, provided that any
          modifications are also released under the same license terms. This ensures that the
          project remains free and accessible to the PQC community.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href="https://github.com/pqctoday/pqctoday-hub/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <Info size={16} />
            View Full License
          </a>
          <a
            href="https://github.com/pqctoday/pqctoday-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <ExternalLink size={16} />
            View GitHub Repository
          </a>
          <LinkToUsButton />
        </div>
      </div>
    </motion.div>
  )
}
