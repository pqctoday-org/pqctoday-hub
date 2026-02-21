import { Info, Shield, GithubIcon, ShieldCheck, ShieldAlert } from 'lucide-react'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import { MobileAboutView } from './MobileAboutView'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion } from '../../store/useVersionStore'

export function AboutView() {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile View: Light Experience */}
      <div className="md:hidden px-4 py-4">
        <MobileAboutView />
      </div>

      {/* Desktop View: Full Experience */}
      <div className="hidden md:block space-y-8">
        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Info className="text-primary" size={24} />
              <div>
                <h2 className="text-2xl font-bold">About PQC Today</h2>
                <p className="text-xs text-muted-foreground font-mono">v{version}</p>
              </div>
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-muted-foreground">
              PQC Today is your comprehensive resource for tracking the transition to Post-Quantum
              Cryptography. We provide real-time updates on standardization efforts, detailed
              algorithm analysis, and interactive tools to help organizations prepare for the
              quantum future.
            </p>
            <p className="text-muted-foreground mt-4">
              Our mission is to demystify quantum threats and make PQC adoption accessible to
              everyone, from security researchers to business leaders.
            </p>
            <p className="text-muted-foreground mt-4">
              Connect with me on LinkedIn:{' '}
              <a
                href="https://www.linkedin.com/in/eric-amador-971850a"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Eric Amador
              </a>
            </p>
            <p className="text-muted-foreground mt-4">
              See the latest updates:{' '}
              <a href="/changelog" className="text-primary hover:underline">
                View Changelog
              </a>
            </p>
          </div>
        </motion.div>

        {/* SBOM Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-primary" size={24} />
            <h2 className="text-xl font-bold">Software Bill of Materials (SBOM)</h2>
          </div>
          <div className="columns-1 md:columns-3 gap-6 space-y-6">
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">UI Frameworks & Libraries</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React</span>
                  <span className="text-xs text-muted-foreground/60">v19.2.4</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Framer Motion</span>
                  <span className="text-xs text-muted-foreground/60">v12.34.2</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Lucide React</span>
                  <span className="text-xs text-muted-foreground/60">v0.562.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Tailwind CSS</span>
                  <span className="text-xs text-muted-foreground/60">v4.2.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">clsx</span>
                  <span className="text-xs text-muted-foreground/60">v2.1.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">tailwind-merge</span>
                  <span className="text-xs text-muted-foreground/60">v3.5.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">class-variance-authority</span>
                  <span className="text-xs text-muted-foreground/60">v0.7.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Router</span>
                  <span className="text-xs text-muted-foreground/60">v7.13.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Markdown</span>
                  <span className="text-xs text-muted-foreground/60">v10.1.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">remark-gfm</span>
                  <span className="text-xs text-muted-foreground/60">v4.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Focus Lock</span>
                  <span className="text-xs text-muted-foreground/60">v2.13.7</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Utilities</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">localforage</span>
                  <span className="text-xs text-muted-foreground/60">v1.10.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">jszip</span>
                  <span className="text-xs text-muted-foreground/60">v3.10.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">file-saver</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.5</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">papaparse</span>
                  <span className="text-xs text-muted-foreground/60">v5.5.3</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">pdf-parse</span>
                  <span className="text-xs text-muted-foreground/60">v2.4.5</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Cryptography & PQC</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">OpenSSL WASM</span>
                  <span className="text-xs text-muted-foreground/60">v3.6.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Web Crypto API (X25519, P-256)</span>
                  <span className="text-xs text-muted-foreground/60">Native</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@openforge-sh/liboqs</span>
                  <span className="text-xs text-muted-foreground/60">v0.14.3</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@noble/hashes</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@noble/curves</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/bip32</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/bip39</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/base</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">micro-eth-signer</span>
                  <span className="text-xs text-muted-foreground/60">v0.18.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">ed25519-hd-key</span>
                  <span className="text-xs text-muted-foreground/60">v1.3.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">State Management</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Zustand</span>
                  <span className="text-xs text-muted-foreground/60">v5.0.11</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Immer</span>
                  <span className="text-xs text-muted-foreground/60">v11.1.3</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Analytics</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React GA4</span>
                  <span className="text-xs text-muted-foreground/60">v2.1.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Notifications</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Hot Toast</span>
                  <span className="text-xs text-muted-foreground/60">v2.6.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Build & Development</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Vite</span>
                  <span className="text-xs text-muted-foreground/60">v7.3.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">TypeScript</span>
                  <span className="text-xs text-muted-foreground/60">v5.9.3</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">tsx</span>
                  <span className="text-xs text-muted-foreground/60">v4.21.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">ESLint</span>
                  <span className="text-xs text-muted-foreground/60">v9.39.2</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Prettier</span>
                  <span className="text-xs text-muted-foreground/60">v3.8.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Husky</span>
                  <span className="text-xs text-muted-foreground/60">v9.1.7</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Testing</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Vitest</span>
                  <span className="text-xs text-muted-foreground/60">v4.0.18</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Playwright</span>
                  <span className="text-xs text-muted-foreground/60">v1.58.2</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Testing Library (React)</span>
                  <span className="text-xs text-muted-foreground/60">v16.3.2</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">axe-playwright (Accessibility)</span>
                  <span className="text-xs text-muted-foreground/60">v2.2.2</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Security Audit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-primary" size={24} />
            <div>
              <h2 className="text-xl font-bold">Security Audit</h2>
              <p className="text-xs text-muted-foreground">Last audited: February 21, 2026</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Production Status */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <ShieldCheck className="text-green-500 mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-green-500">0 production vulnerabilities</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All runtime dependencies (React, crypto libraries, Zustand, Tailwind, etc.) have
                  zero known CVEs.
                </p>
              </div>
            </div>

            {/* Dev-only findings */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <ShieldAlert className="text-amber-500 mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-amber-500">
                  13 dev-only findings (12 high, 1 moderate)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All findings are in the ESLint linting toolchain. These affect developer machines
                  only and have no impact on the deployed application.
                </p>
              </div>
            </div>

            {/* CVE Details Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">CVE</th>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                      Severity
                    </th>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                      Package
                    </th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      GHSA-3ppc-4f35-3m26
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500">
                        HIGH
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      minimatch &lt; 10.2.1 (ReDoS)
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Dev-only &mdash; no upstream fix available
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      GHSA-2g4f-4pwh-qvx6
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-500">
                        MODERATE
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      ajv &lt; 8.18.0 (ReDoS via $data)
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Dev-only &mdash; ESLint does not use $data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* License Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-secondary" size={24} />
            <h2 className="text-xl font-bold">Open Source License</h2>
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
                href="https://github.com/pqctoday/pqc-timeline-app/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                <Info size={16} />
                View Full License
              </a>
              <a
                href="https://github.com/pqctoday/pqc-timeline-app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                <GithubIcon size={16} />
                View GitHub Repository
              </a>
            </div>
          </div>
        </motion.div>

        {/* AI Acknowledgment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 text-center"
        >
          <h3 className="text-lg font-bold mb-2">AI Technology Acknowledgment</h3>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            This site is developed, documented, validated and deployed using advanced AI
            technologies including Google Antigravity, ChatGPT, Claude AI, Perplexity, and Gemini
            Pro. While the presented information has been manually curated, it may still contain
            inaccuracies.
          </p>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel p-6 flex flex-col items-center justify-center gap-4"
        >
          <h3 className="text-lg font-bold">Appearance</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Choose your preferred color scheme.
          </p>
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize flex items-center gap-2',
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
      </div>
    </div>
  )
}
