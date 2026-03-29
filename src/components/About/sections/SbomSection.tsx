// SPDX-License-Identifier: GPL-3.0-only
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Info, Link2, ChevronDown } from 'lucide-react'

export function SbomSection() {
  const [isSbomOpen, setIsSbomOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.33 }}
      className="glass-panel p-4 md:p-6"
    >
      <button
        onClick={() => setIsSbomOpen(!isSbomOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <Info className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Software Bill of Materials (SBOM)</h2>
        <ChevronDown
          size={18}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isSbomOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {isSbomOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="columns-1 md:columns-3 gap-4 md:p-6 space-y-6 mt-6">
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  UI Frameworks & Libraries
                </h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">React</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v19.2.4</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Framer Motion</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v12.35.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Lucide React</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">ISC</span>
                      <span className="text-xs text-muted-foreground/60">v0.577.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Tailwind CSS</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v4.2.2</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">clsx</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.1.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">tailwind-merge</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v3.5.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">class-variance-authority</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">Apache-2.0</span>
                      <span className="text-xs text-muted-foreground/60">v0.7.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">React Router</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v7.13.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">React Markdown</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v10.1.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">remark-gfm</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v4.0.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">React Focus Lock</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.13.7</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">Utilities</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">localforage</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">Apache-2.0</span>
                      <span className="text-xs text-muted-foreground/60">v1.10.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">jszip</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v3.10.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">file-saver</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.0.5</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">papaparse</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v5.5.3</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">pdf-parse</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.4.5</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">minisearch</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v7.2.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">recharts</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v3.7.0</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">Cryptography & PQC</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">OpenSSL WASM</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">Apache-2.0</span>
                      <span className="text-xs text-muted-foreground/60">v3.6.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Web Crypto API (X25519, P-256)</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">W3C</span>
                      <span className="text-xs text-muted-foreground/60">Native</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@oqs/liboqs-js</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v0.15.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@noble/hashes</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@noble/curves</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@scure/bip32</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@scure/bip39</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@scure/base</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.0.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">micro-eth-signer</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v0.18.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">ed25519-hd-key</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v1.3.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@peculiar/asn1-schema</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.6.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@peculiar/asn1-x509</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.6.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">@peculiar/asn1-x509-post-quantum</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.6.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <a
                      href="https://github.com/pqctoday/softhsmv3/releases/tag/v0.4.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      softhsmv3
                      <Link2 size={12} aria-hidden="true" />
                    </a>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        BSD-2-Clause
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        Fork of SoftHSMv2 — PKCS#11 v3.2 + PQC, WASM
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">State Management</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Zustand</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v5.0.11</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">Analytics</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">React GA4</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.1.0</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">Notifications</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">React Hot Toast</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.6.0</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">Build & Development</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Vite</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v7.3.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">TypeScript</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">Apache-2.0</span>
                      <span className="text-xs text-muted-foreground/60">v5.9.3</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">tsx</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v4.21.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">ESLint</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v9.39.4</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Prettier</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v3.8.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Husky</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v9.1.7</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">vite-plugin-pwa</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v1.2.0</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">Testing</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Vitest</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v4.1.2</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Playwright</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">Apache-2.0</span>
                      <span className="text-xs text-muted-foreground/60">v1.58.2</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">Testing Library (React)</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v16.3.2</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">axe-playwright (Accessibility)</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                      <span className="text-xs text-muted-foreground/60">v2.2.2</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  Rust WASM Bindings{' '}
                  <span className="text-xs font-normal text-muted-foreground">(softhsmrustv3)</span>
                </h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">wasm-bindgen</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.2.92</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">js-sys</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.3.69</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">web-sys</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.3.69</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">getrandom</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.2.17</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">console_error_panic_hook</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.1.7</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  Rust Crypto Crates{' '}
                  <span className="text-xs font-normal text-muted-foreground">(softhsmrustv3)</span>
                </h3>
                <ul className="space-y-2">
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">ml-kem</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.2.3</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">ml-dsa</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.1.0-rc.7</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">slh-dsa</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.2.0-rc.4</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">ed25519-dalek</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        BSD-3-Clause
                      </span>
                      <span className="text-xs text-muted-foreground/60">v2.1</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">x25519-dalek</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        BSD-3-Clause
                      </span>
                      <span className="text-xs text-muted-foreground/60">v2.0</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">p256</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.13</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">p384</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.13</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">rsa</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.9</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">aes / aes-gcm / aes-kw</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.8 / v0.10 / v0.2</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">cbc / ctr</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.1.2 / v0.9.2</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">sha2 / sha3</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.10.8</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">hmac / pbkdf2 / hkdf</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        v0.12 / v0.12 / v0.12
                      </span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">pkcs8 / spki</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.11-rc / v0.8-rc</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">signature</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v3.0.0-rc.10</span>
                    </div>
                  </li>
                  <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                    <span className="text-muted-foreground">rand</span>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        MIT / Apache-2.0
                      </span>
                      <span className="text-xs text-muted-foreground/60">v0.8.5</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
