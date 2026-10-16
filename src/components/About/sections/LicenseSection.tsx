// SPDX-License-Identifier: AGPL-3.0-only
import { motion } from 'framer-motion'
import { Info, Shield, ExternalLink, Scale, Heart, Code, FileText } from 'lucide-react'
import { Link } from 'react-router'
import { LinkToUsButton } from '@/components/ui/LinkToUsButton'
import { BUILD_COMMIT, shortCommit, sourceCodeUrl } from '@/utils/sourceLink'

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null

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
          <strong>GNU Affero General Public License v3.0 (AGPL-3.0-only)</strong>.
        </p>
        <p className="text-muted-foreground mt-2">
          You are free to copy, distribute, and modify this software, provided that any
          modifications are also released under the same license terms, including when you run a
          changed version as a service for others. For use without these terms, PQC Today, LLC
          offers a commercial licence on request (pqctoday@proton.me).
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href="https://github.com/pqctoday-org/pqctoday-hub/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <Info size={16} />
            View Full License
          </a>
          <a
            href="https://github.com/pqctoday-org/pqctoday-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <ExternalLink size={16} />
            View GitHub Repository
          </a>
          <a
            href={sourceCodeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="about-source-link"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <Code size={16} />
            {BUILD_COMMIT
              ? `Source code of this version (${APP_VERSION ? `v${APP_VERSION}, ` : ''}commit ${shortCommit()})`
              : `Source code${APP_VERSION ? ` (v${APP_VERSION})` : ''}`}
          </a>
          <a
            href="/licenses/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="about-licenses-link"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <FileText size={16} />
            Open-source licences
          </a>
          <Link
            to="/terms"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <Scale size={16} />
            Terms of Use
          </Link>
          <a
            href="https://github.com/sponsors/pqctoday-org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            <Heart size={16} />
            Support development
          </a>
          <LinkToUsButton />
        </div>
      </div>
    </motion.div>
  )
}
