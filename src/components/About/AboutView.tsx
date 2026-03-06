// SPDX-License-Identifier: GPL-3.0-only
import {
  Info,
  Shield,
  GithubIcon,
  ShieldCheck,
  ShieldAlert,
  Lock,
  BrainCircuit,
  Database,
  Link2,
  Sparkles,
  BarChart2,
  MessageSquare,
  Users,
  Globe,
  Lightbulb,
  HelpCircle,
  Cpu,
  BookOpen,
  Trophy,
  FileText,
  CalendarDays,
  Package,
} from 'lucide-react'

import { useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { MobileAboutView } from './MobileAboutView'
import { CareerJourneyModal } from './CareerJourneyModal'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion } from '../../store/useVersionStore'

const DATA_FOUNDATION = [
  { dataset: 'Timeline Events', records: 198, sources: '80+ orgs, 50+ countries' },
  { dataset: 'Library Resources', records: 256, sources: '30+ standards bodies' },
  { dataset: 'Algorithm Reference', records: 45, sources: 'FIPS 203/204/205/206' },
  { dataset: 'Compliance Frameworks', records: 62, sources: 'NIST, ACVP, CC, ANSSI' },
  { dataset: 'Migrate Products', records: 331, sources: '7 infrastructure layers' },
  { dataset: 'Threat Landscape', records: 79, sources: '8+ industry sectors' },
  { dataset: 'Industry Leaders', records: 103, sources: 'Public, Private, Academic' },
  { dataset: 'Quiz Questions', records: 546, sources: 'All PQC topic areas' },
  { dataset: 'Authoritative Sources', records: 89, sources: 'Gov, Academic, Industry' },
  { dataset: 'Learning Modules', records: 28, sources: '2,000+ min of content' },
]

const DISCUSSIONS_BASE = 'https://github.com/pqctoday/pqc-timeline-app/discussions/'
const DISCUSSIONS = [
  {
    number: 108,
    icon: Users,
    label: 'Contribute',
    description: 'I need your help to improve pqctoday.com',
  },
  {
    number: 109,
    icon: Globe,
    label: 'PQC News',
    description: 'Share general information about PQC',
  },
  { number: 110, icon: Lightbulb, label: 'Ideas', description: 'Post your ideas for improvements' },
  { number: 111, icon: HelpCircle, label: 'Q&A', description: 'Ask questions — answered ASAP' },
  { number: 113, icon: Cpu, label: 'Algorithms', description: 'Update or add a new algorithm' },
  {
    number: 115,
    icon: BookOpen,
    label: 'Learn Modules',
    description: 'Update or add a new learning module',
  },
  { number: 116, icon: Trophy, label: 'Leaders', description: 'Update or add a new leader' },
  {
    number: 117,
    icon: FileText,
    label: 'References',
    description: 'Update or add a reference document',
  },
  {
    number: 118,
    icon: CalendarDays,
    label: 'Timeline',
    description: 'Change or add a new timeline',
  },
  { number: 119, icon: ShieldAlert, label: 'Threats', description: 'Change or add a new threat' },
  { number: 120, icon: Package, label: 'Products', description: 'Change or add a new product' },
]

export function AboutView() {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)

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
                <h2 className="text-2xl font-semibold">About PQC Today</h2>
                <p className="text-xs text-muted-foreground font-mono">v{version}</p>
              </div>
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-muted-foreground">
              PQC Today is a community-driven, open-source platform built to educate professionals
              about the quantum threat and help them take concrete action to migrate their systems
              before harvest-now-decrypt-later attacks become viable.
            </p>
            <p className="text-muted-foreground mt-4">
              Everything here is free, transparent, and built in the open &mdash; 27 learning
              modules, 530+ quiz questions, hands-on cryptographic labs, a guided migration catalog,
              global compliance tracking, and a risk assessment wizard, all powered by real
              implementations running directly in your browser. No accounts, no paywalls, no vendor
              lock-in.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
              <p className="text-muted-foreground">
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
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <button
                onClick={() => setIsJourneyModalOpen(true)}
                className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors group"
              >
                <Sparkles size={18} className="group-hover:animate-pulse" />
                <span className="font-semibold underline decoration-2 underline-offset-4">
                  View My Career Journey
                </span>
              </button>
            </div>
            <p className="text-muted-foreground mt-4">
              See the latest updates:{' '}
              <a href="/changelog" className="text-primary hover:underline">
                View Changelog
              </a>
            </p>
          </div>
        </motion.div>

        {/* Community Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-primary shrink-0" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Community</h2>
              <p className="text-xs text-muted-foreground">
                Join the conversation on GitHub Discussions
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {DISCUSSIONS.map(({ number, icon: Icon, label, description }) => (
              <a
                key={number}
                href={`${DISCUSSIONS_BASE}${number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
              >
                <Icon className="text-primary shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Data Foundation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-primary shrink-0" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Platform Data</h2>
              <p className="text-xs text-muted-foreground">Curated datasets powering every page</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {DATA_FOUNDATION.map(({ dataset, records, sources }) => (
              <div
                key={dataset}
                className="p-3 rounded-lg border border-border bg-muted/30 text-center"
              >
                <div className="text-lg font-bold text-gradient">{records}</div>
                <div className="text-xs font-medium text-foreground mt-1">{dataset}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{sources}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gradient">1,560+</span>
              <span className="text-sm text-muted-foreground">total curated records</span>
            </div>
            <span className="text-xs text-muted-foreground">Compliance data refreshed weekly</span>
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
            <h2 className="text-xl font-semibold">Software Bill of Materials (SBOM)</h2>
          </div>
          <div className="columns-1 md:columns-3 gap-6 space-y-6">
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">UI Frameworks & Libraries</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React</span>
                  <span className="text-xs text-muted-foreground/60">v19.2.4</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Framer Motion</span>
                  <span className="text-xs text-muted-foreground/60">v12.34.2</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Lucide React</span>
                  <span className="text-xs text-muted-foreground/60">v0.562.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Tailwind CSS</span>
                  <span className="text-xs text-muted-foreground/60">v4.2.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">clsx</span>
                  <span className="text-xs text-muted-foreground/60">v2.1.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">tailwind-merge</span>
                  <span className="text-xs text-muted-foreground/60">v3.5.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">class-variance-authority</span>
                  <span className="text-xs text-muted-foreground/60">v0.7.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Router</span>
                  <span className="text-xs text-muted-foreground/60">v7.13.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Markdown</span>
                  <span className="text-xs text-muted-foreground/60">v10.1.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">remark-gfm</span>
                  <span className="text-xs text-muted-foreground/60">v4.0.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Focus Lock</span>
                  <span className="text-xs text-muted-foreground/60">v2.13.7</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Utilities</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">localforage</span>
                  <span className="text-xs text-muted-foreground/60">v1.10.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">jszip</span>
                  <span className="text-xs text-muted-foreground/60">v3.10.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">file-saver</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.5</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">papaparse</span>
                  <span className="text-xs text-muted-foreground/60">v5.5.3</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">pdf-parse</span>
                  <span className="text-xs text-muted-foreground/60">v2.4.5</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">minisearch</span>
                  <span className="text-xs text-muted-foreground/60">v7.2.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">recharts</span>
                  <span className="text-xs text-muted-foreground/60">v3.7.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Cryptography & PQC</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">OpenSSL WASM</span>
                  <span className="text-xs text-muted-foreground/60">v3.6.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Web Crypto API (X25519, P-256)</span>
                  <span className="text-xs text-muted-foreground/60">Native</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@oqs/liboqs-js</span>
                  <span className="text-xs text-muted-foreground/60">v0.15.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@noble/hashes</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@noble/curves</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/bip32</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/bip39</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/base</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">micro-eth-signer</span>
                  <span className="text-xs text-muted-foreground/60">v0.18.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">ed25519-hd-key</span>
                  <span className="text-xs text-muted-foreground/60">v1.3.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <a
                    href="https://github.com/pqctoday/softhsmv3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    softhsmv3
                    <Link2 size={12} aria-hidden="true" />
                  </a>
                  <span className="text-xs text-muted-foreground/60">
                    Fork of SoftHSMv2 — PKCS#11 v3.2 + PQC, WASM
                  </span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">State Management</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Zustand</span>
                  <span className="text-xs text-muted-foreground/60">v5.0.11</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Analytics</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React GA4</span>
                  <span className="text-xs text-muted-foreground/60">v2.1.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Notifications</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React Hot Toast</span>
                  <span className="text-xs text-muted-foreground/60">v2.6.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Build & Development</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Vite</span>
                  <span className="text-xs text-muted-foreground/60">v7.3.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">TypeScript</span>
                  <span className="text-xs text-muted-foreground/60">v5.9.3</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">tsx</span>
                  <span className="text-xs text-muted-foreground/60">v4.21.0</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">ESLint</span>
                  <span className="text-xs text-muted-foreground/60">v9.39.2</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Prettier</span>
                  <span className="text-xs text-muted-foreground/60">v3.8.1</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Husky</span>
                  <span className="text-xs text-muted-foreground/60">v9.1.7</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Testing</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Vitest</span>
                  <span className="text-xs text-muted-foreground/60">v4.0.18</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Playwright</span>
                  <span className="text-xs text-muted-foreground/60">v1.58.2</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Testing Library (React)</span>
                  <span className="text-xs text-muted-foreground/60">v16.3.2</span>
                </li>
                <li className="flex justify-between items-baseline gap-2 flex-wrap text-sm border-b border-border pb-1">
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
              <h2 className="text-xl font-semibold">Security Audit</h2>
              <p className="text-xs text-muted-foreground">Last audited: February 27, 2026</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Production Status */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-status-success border border-status-success">
              <ShieldCheck className="text-status-success mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-status-success">
                  0 production vulnerabilities
                </p>
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-warning text-status-warning">
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

        {/* Data Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock className="text-primary" size={24} />
            <h2 className="text-xl font-semibold">Data Privacy</h2>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              PQC Today is a fully static website &mdash; there is no backend server, no database,
              and no user accounts. We do not collect, store, or transmit any personal data.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">No personal data collection</strong> &mdash; no
                names, email addresses, cookies, tracking pixels, form submissions, or server-side
                logging of any kind.
              </li>
              <li>
                <strong className="text-foreground">Local-only persistence</strong> &mdash; all user
                preferences, assessment results, learning progress, and saved state are stored
                exclusively in your browser&apos;s localStorage. Nothing leaves your device.
              </li>
              <li>
                <strong className="text-foreground">Client-side cryptography</strong> &mdash; all
                cryptographic operations run entirely in your browser via WebAssembly (OpenSSL,
                liboqs). No keys or certificates are ever sent to a server.
              </li>
              <li>
                <strong className="text-foreground">No third-party services at runtime</strong>
                &mdash; no external APIs are called at runtime. The site is served as static files
                from GitHub Pages.
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
                <h3 className="text-sm font-semibold text-foreground">Anonymous usage analytics</h3>
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
                  <strong className="text-foreground">Feature interactions</strong> &mdash; searches
                  performed, filters applied, algorithms and compliance items viewed.
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
                  <strong className="text-foreground">Assistant feedback</strong> &mdash; helpful /
                  unhelpful votes on PQC Assistant responses.
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

        {/* License Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-6"
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

        {/* RAG & Gemini Flash 2.5 Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.37 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="text-primary" size={24} />
            <div>
              <h2 className="text-xl font-semibold">PQC Assistant</h2>
              <p className="text-xs text-muted-foreground">RAG + Gemini 2.5 Flash</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The PQC Assistant chatbot uses{' '}
              <strong className="text-foreground">Retrieval-Augmented Generation (RAG)</strong> to
              deliver grounded, sourced answers about post-quantum cryptography. When you ask a
              question, it searches a curated corpus of ~2,800 PQC knowledge chunks &mdash; covering
              algorithms, standards, threats, compliance certifications, migration products,
              leaders, and learning modules &mdash; retrieves the 10&ndash;20 most relevant passages
              (adaptive per query intent), and injects them as context into a{' '}
              <strong className="text-foreground">Gemini 2.5 Flash</strong> prompt. The result is an
              answer grounded in platform data, enriched with deep links to the exact page or
              section being discussed.
            </p>
            <p className="text-muted-foreground mt-3">
              To use the PQC Assistant, you need to provide your own{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio API key
              </a>
              . Your key is stored only in your browser&apos;s localStorage and is never sent to any
              server other than Google&apos;s Gemini API. You can obtain a free API key from Google
              AI Studio in seconds.
            </p>
          </div>

          {/* Capability Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
              <Database className="text-primary mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-foreground">Grounded Answers</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Responses cite specific data from the platform&apos;s curated corpus &mdash;
                  algorithm specs, NIST standards, threat scenarios, compliance certs, and more.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
              <Link2 className="text-primary mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-foreground">Deep Linking</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Answers include clickable links that navigate directly to the relevant page
                  &mdash; a specific algorithm, cert record, learning module, or workshop tab.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
              <Sparkles className="text-primary mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-foreground">PQC Domain Expertise</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gemini Flash supplements RAG context with broad PQC knowledge from its training
                  data for topics not fully covered in the corpus.
                </p>
              </div>
            </div>
          </div>

          {/* Limitations */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Limitations</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
              <li>
                Knowledge is bounded by the curated corpus (~2,800 chunks) &mdash; niche or very
                recent topics may lack coverage
              </li>
              <li>
                Requires a user-provided Gemini API key (BYOK) &mdash; no keys are stored
                server-side
              </li>
              <li>Cannot perform actions &mdash; read-only Q&A, no write operations</li>
              <li>
                General LLM caveats apply &mdash; may occasionally hallucinate details outside its
                context window
              </li>
            </ul>
          </div>
        </motion.div>

        {/* AI Acknowledgment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 text-center"
        >
          <h3 className="text-lg font-semibold mb-2">AI Technology Acknowledgment</h3>
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
          <h3 className="text-lg font-semibold">Appearance</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Choose your preferred color scheme.
          </p>
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  'px-4 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors capitalize flex items-center gap-2',
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
      <CareerJourneyModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
      />
    </div>
  )
}
