// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Lock, BarChart2, ChevronDown } from 'lucide-react'

export function DataPrivacySection() {
  const [isDataPrivacyOpen, setIsDataPrivacyOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.37 }}
      className="glass-panel p-4 md:p-6"
    >
      <button
        onClick={() => setIsDataPrivacyOpen(!isDataPrivacyOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <Lock className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Data Privacy</h2>
        <ChevronDown
          size={20}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isDataPrivacyOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {isDataPrivacyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="prose prose-invert max-w-none mt-4">
              <p className="text-muted-foreground">
                PQC Today is a fully static website &mdash; there is no backend server, no database,
                and no user accounts. We do not collect, store, or transmit any personal data.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">No personal data collection</strong> &mdash;
                  no names, email addresses, form submissions, or server-side logging of any kind.
                </li>
                <li>
                  <strong className="text-foreground">Local-only persistence</strong> &mdash; all
                  user preferences, assessment results, learning progress, and saved state are
                  stored in your browser&apos;s localStorage. This data never leaves your device
                  unless you opt in to Google Drive sync.
                </li>
                <li>
                  <strong className="text-foreground">Client-side cryptography</strong> &mdash; all
                  cryptographic operations run entirely in your browser via WebAssembly (OpenSSL,
                  liboqs). No keys or certificates are ever sent to a server.
                </li>
                <li>
                  <strong className="text-foreground">Third-party data flows</strong> &mdash; the
                  site is served as static files from GitHub Pages. Data is sent externally only
                  when you use specific opt-in features:{' '}
                  <strong className="text-foreground">Google Analytics 4</strong> (anonymous usage
                  data, may set cookies), <strong className="text-foreground">Gemini AI</strong>{' '}
                  (chat messages sent to Google when using cloud mode), and{' '}
                  <strong className="text-foreground">Google Drive sync</strong> (learning progress,
                  opt-in). See sections below and the{' '}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  for full details.
                </li>
                <li>
                  <strong className="text-foreground">Full transparency</strong> &mdash; the entire
                  source code is{' '}
                  <a
                    href="https://github.com/pqctoday/pqc-timeline-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    publicly available
                  </a>{' '}
                  for inspection under GPLv3.
                </li>
              </ul>

              {/* Anonymous analytics disclosure */}
              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 size={16} className="text-primary flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Anonymous usage analytics
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  To improve content accuracy and usability, PQC Today uses{' '}
                  <strong className="text-foreground">Google Analytics 4</strong> to collect
                  anonymous, aggregated behavioral signals. No personal identifiers are ever
                  transmitted. Specifically, we collect:
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                  <li>
                    <strong className="text-foreground">Page navigation</strong> &mdash; which
                    sections of the site are visited.
                  </li>
                  <li>
                    <strong className="text-foreground">Feature interactions</strong> &mdash;
                    searches performed, filters applied, algorithms and compliance items viewed.
                  </li>
                  <li>
                    <strong className="text-foreground">Content accuracy signals</strong> &mdash;
                    thumbs-up / thumbs-down votes on content pages (page path and vote only).
                  </li>
                  <li>
                    <strong className="text-foreground">Learning milestones</strong> &mdash; module
                    started / completed events and artifact generation (key type only, never the key
                    itself).
                  </li>
                  <li>
                    <strong className="text-foreground">Assistant feedback</strong> &mdash; helpful
                    / unhelpful votes on PQC Assistant responses.
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  Analytics are <strong className="text-foreground">disabled on localhost</strong>.
                  Google Analytics 4 anonymizes IP addresses by default &mdash;{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google&apos;s Privacy Policy
                  </a>{' '}
                  applies. You may opt out at any time via the{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Analytics opt-out browser extension
                  </a>
                  .
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
