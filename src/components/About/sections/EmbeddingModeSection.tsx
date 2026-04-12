// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { AppWindow, ChevronDown, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmbeddingModeSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38 }}
      className="glass-panel p-4 md:p-6"
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <AppWindow className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Embedding Mode</h2>
        <ChevronDown
          size={20}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="prose prose-invert max-w-none mt-4">
              <p className="text-muted-foreground">
                PQC Today offers a powerful{' '}
                <strong className="text-foreground">Embedding Mode</strong>
                that allows organizations and vendors to integrate tailored sections of the platform
                directly into their own native workflows, dashboards, or documentation.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Zero-Trust Architecture</strong> &mdash; The
                  embed mode utilizes a strict ECDSA PKI Signature scheme. Content and tools are
                  only rendered if explicitly permitted by a cryptographically signed vendor
                  certificate.
                </li>
                <li>
                  <strong className="text-foreground">Cross-Origin Isolation</strong> &mdash;
                  Persistent state and secure context are safely managed via secure postMessage
                  bridging or strict API origins.
                </li>
                <li>
                  <strong className="text-foreground">Customizable Integration</strong> &mdash;
                  Vendors can programmatically select which modules or tools are visible, lock the
                  user interface to specific themes, and control difficulty ceilings for educational
                  modules.
                </li>
              </ul>

              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={16} className="text-primary flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">Enabling Embedding Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Embedding Mode requires a registered digital vendor signature, customized allowed
                  preset routes, and a formal onboarding process. To get started and request access,
                  please reach out directly:
                </p>
                <div className="mt-4">
                  <a
                    href="mailto:pqctoday@gmail.com"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium rounded-lg transition-colors border border-primary/20"
                  >
                    <Mail size={16} />
                    pqctoday@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
