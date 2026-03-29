// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MISSION_TAGS,
  PRINCIPLES,
  NOT_ITEMS,
  DATA_FOUNDATION,
  DISCUSSIONS_BASE,
  DISCUSSIONS,
  CRYPTO_BUFF_SITES,
  CRYPTO_BUFF_BOOKS,
} from './aboutData'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Lock,
  BrainCircuit,
  Database,
  Sparkles,
  BarChart2,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Shield,
  GithubIcon,
  Handshake,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  BookMarked,
  Construction,
  Wrench,
  Linkedin,
  Info,
  Cloud,
  Link2,
  Globe,
  BookOpen,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { CareerJourneyModal } from './CareerJourneyModal'
import { WorkgroupDetailModal } from './WorkgroupDetailModal'
import { PQC_WORKGROUPS, WORKGROUP_REGIONS } from './workgroupData'
import type { Workgroup } from './workgroupData'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion, useVersionStore } from '../../store/useVersionStore'
import { LinkToUsButton } from '../ui/LinkToUsButton'

const SBOM_GROUPS = [
  {
    label: 'UI & Rendering',
    items: [
      'React',
      'Framer Motion',
      'Lucide React',
      'Tailwind v4',
      'React Router',
      'React Markdown',
      'clsx',
      'recharts',
    ],
  },
  {
    label: 'Utilities',
    items: ['localforage', 'jszip', 'file-saver', 'papaparse', 'minisearch'],
  },
  {
    label: 'Cryptography & PQC',
    items: [
      'OpenSSL WASM 3.6.1',
      'liboqs-js v0.15.1',
      '@noble/*',
      '@scure/*',
      '@peculiar/asn1-schema',
      '@peculiar/asn1-x509',
      'softhsmv3',
    ],
  },
  {
    label: 'State & DX',
    items: ['Zustand', 'React Hot Toast', 'React GA4'],
  },
  {
    label: 'Testing',
    items: ['Vitest', 'Playwright', 'Testing Library', 'axe-playwright'],
  },
  {
    label: 'Rust WASM',
    items: ['ml-kem', 'ml-dsa', 'slh-dsa', 'wasm-bindgen', 'ed25519-dalek', 'x25519-dalek'],
  },
]

export const MobileAboutView = () => {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const requestShowWhatsNew = useVersionStore((s) => s.requestShowWhatsNew)
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<Workgroup | null>(null)
  const [isShowAllDiscussions, setIsShowAllDiscussions] = useState(false)
  const [isWorkgroupsOpen, setIsWorkgroupsOpen] = useState(false)
  const [isCryptoBuffSitesOpen, setIsCryptoBuffSitesOpen] = useState(false)
  const [isCryptoBuffBooksOpen, setIsCryptoBuffBooksOpen] = useState(false)
  const [isDataPrivacyOpen, setIsDataPrivacyOpen] = useState(false)
  const [isPqcAssistantOpen, setIsPqcAssistantOpen] = useState(false)
  const [isFullVisionOpen, setIsFullVisionOpen] = useState(false)
  const [isSbomOpen, setIsSbomOpen] = useState(false)
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false)
  const [isLicenseOpen, setIsLicenseOpen] = useState(false)
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gradient mb-2">About PQC Today</h1>
        <p className="text-sm text-muted-foreground">
          Learn, assess, explore, and act on the post-quantum transition.
        </p>
        <p className="text-xs text-muted-foreground/60 font-mono mt-1">v{version}</p>
      </motion.div>

      {/* Changelog Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Release Notes</h2>
              <p className="text-xs text-muted-foreground">v{version} — what&apos;s new</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={requestShowWhatsNew}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-foreground font-semibold text-xs hover:bg-muted/40 transition-colors"
            >
              <Sparkles size={12} />
              New
            </button>
            <a
              href="/changelog"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              View
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Transparency & Disclaimer Card */}
      <motion.div
        id="transparency"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <Construction size={20} />
          </div>
          <h2 className="text-lg font-semibold flex-1">Transparency</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning animate-pulse-glow">
            <Wrench size={10} className="animate-bounce-subtle" />
            WIP
          </span>
        </div>
        <div className="space-y-2.5 text-sm text-muted-foreground">
          <p>
            PQC Today is a{' '}
            <strong className="text-foreground">community-driven educational platform</strong>. It
            has not received endorsement from the organizations cited and may contain inaccuracies.
          </p>
          <p>
            Industry leaders are included only with{' '}
            <strong className="text-foreground">written consent</strong>. We welcome collaboration
            from domain experts.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="https://github.com/pqctoday/pqc-timeline-app/discussions/108"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <MessageSquare size={12} />
              Discussions
              <ExternalLink size={10} />
            </a>
            <a
              href="https://www.linkedin.com/in/eric-amador-971850a"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Linkedin size={12} />
              Eric Amador
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
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
          <h2 className="text-lg font-semibold">Our Mission</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQC Today brings together 48 learning modules across 8 tracks, 14 interactive business
          planning tools, 820 quiz questions, a risk assessment wizard, migration planning tools,
          and global compliance tracking &mdash; tuned to your role as a developer, architect,
          operations professional, executive, or researcher.
        </p>

        {/* "Read full vision" toggle */}
        <button
          onClick={() => setIsFullVisionOpen(!isFullVisionOpen)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {isFullVisionOpen ? 'Collapse vision' : 'Read full vision'}
          <ChevronDown
            size={13}
            className={clsx('transition-transform duration-200', isFullVisionOpen && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {isFullVisionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                <hr className="border-border" />

                {/* What we are building */}
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    What we are building
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    PQCToday is a neutral, community-governed platform providing independent
                    education, hands-on simulation, and migration guidance for the global
                    post-quantum cryptography transition. We run real cryptographic reference
                    implementations directly in your browser — no installation, no cloud account, no
                    data leaving your device.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MISSION_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Founding principles */}
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Our founding principles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
                    {PRINCIPLES.map(({ label, text }) => (
                      <div key={label} className="bg-card p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
                            {label}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* What we are not */}
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    What we are not
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {NOT_ITEMS.map(({ label, text }) => (
                      <div key={label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-status-error mb-1">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Quote */}
                <div className="bg-muted/20 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary leading-relaxed italic">
                    &ldquo;We seek the endorsement and support of existing standards bodies and PQC
                    experts. We aim to empower these bodies rather than replace them &mdash; and to
                    enable them to simplify and improve the deployment of quantum-safe best
                    practices worldwide.&rdquo;
                  </p>
                </div>

                <hr className="border-border" />

                {/* Who this is for */}
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Who this is for
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    Every organisation that processes sensitive data has a quantum exposure problem
                    &mdash; whether they know it yet or not. Governments. Banks. Hospitals.
                    Telecoms. Manufacturers. The practitioner who needs to understand ML-KEM before
                    their next architecture review. The CISO who needs to explain quantum risk to
                    their board. The engineer who needs to practice PKCS#11 v3.2 operations before
                    touching production.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    PQCToday is built for all of them. The platform adapts to your role, your
                    industry, your regulatory environment, and your proficiency level &mdash;
                    without asking you to register, share data, or trust us with anything except
                    your time.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Data Foundation Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Platform Data</h2>
            <p className="text-xs text-muted-foreground">Curated and updated weekly</p>
          </div>
        </div>
        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-gradient">2,200+</span>
          <p className="text-xs text-muted-foreground mt-1">curated records across 10 datasets</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DATA_FOUNDATION.map((s) => (
            <div
              key={s.dataset}
              className="p-2 rounded-lg border border-border bg-muted/30 text-center"
            >
              <div className="text-sm font-bold text-foreground">{s.records}</div>
              <div className="text-xs text-muted-foreground leading-tight">{s.dataset}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                {s.sources}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SBOM Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsSbomOpen(!isSbomOpen)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <Info size={20} />
          </div>
          <h2 className="text-lg font-semibold flex-1">Software Bill of Materials</h2>
          <ChevronDown
            size={16}
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
              <div className="mt-4 space-y-4">
                {SBOM_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <a
                    href="https://github.com/pqctoday/pqc-timeline-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink size={12} />
                    View full dependency tree on GitHub
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Security Audit Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsSecurityAuditOpen(!isSecurityAuditOpen)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Security Audit</h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-success/10 text-status-success border border-status-success/30">
              OWASP
            </span>
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isSecurityAuditOpen && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {isSecurityAuditOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {/* CVE status */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-status-success/5 border border-status-success/30">
                  <ShieldCheck size={16} className="text-status-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-status-success">
                      0 vulnerabilities (production and dev)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Verified via <code className="text-[10px]">npm audit</code> in CI on every
                      push.
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Last audited: March 22, 2026
                    </p>
                  </div>
                </div>
                {/* OWASP checklist */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">
                      OWASP Top 10 compliant
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        No <code className="text-[10px]">dangerouslySetInnerHTML</code>,{' '}
                        <code className="text-[10px]">eval()</code>, or{' '}
                        <code className="text-[10px]">innerHTML</code> in production code
                      </li>
                      <li>
                        All external links protected against tabnabbing (
                        <code className="text-[10px]">rel=&quot;noopener noreferrer&quot;</code>)
                      </li>
                      <li>No hardcoded secrets — all credentials via environment variables</li>
                      <li>Content Security Policy configured with scoped connect-src whitelist</li>
                      <li>ESLint security plugin active in CI</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* License Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsLicenseOpen(!isLicenseOpen)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <div className="p-2 rounded-full bg-secondary/10 text-secondary shrink-0">
            <Shield size={20} />
          </div>
          <h2 className="text-lg font-semibold flex-1">Open Source License</h2>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isLicenseOpen && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {isLicenseOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PQC Today is open source software released under the{' '}
                  <strong className="text-foreground">
                    GNU General Public License v3.0 (GPLv3)
                  </strong>
                  . You are free to copy, distribute, and modify this software, provided that any
                  modifications are also released under the same license terms.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href="https://github.com/pqctoday/pqc-timeline-app/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink size={14} />
                    View Full License
                  </a>
                  <a
                    href="https://github.com/pqctoday/pqc-timeline-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <GithubIcon size={14} />
                    View GitHub Repository
                  </a>
                  <LinkToUsButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Google Drive Sync — Privacy Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsCloudSyncOpen(!isCloudSyncOpen)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <Cloud size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Google Drive Sync</h2>
            <p className="text-xs text-muted-foreground">Privacy Terms</p>
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isCloudSyncOpen && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {isCloudSyncOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 text-sm text-muted-foreground space-y-2.5">
                <p>
                  The optional <strong className="text-foreground">Sync to Google Drive</strong>{' '}
                  feature allows you to back up and restore your progress across devices.
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-status-success mt-1 shrink-0">&#9679;</span>
                    <span>
                      <strong className="text-foreground">No personal data is collected.</strong> We
                      do not request your name, email, or profile picture.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-status-success mt-1 shrink-0">&#9679;</span>
                    <span>
                      <strong className="text-foreground">Your data stays in your account.</strong>{' '}
                      All progress is saved to a hidden file in{' '}
                      <strong className="text-foreground">your own Google Drive</strong> — not on
                      any server we own or control.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-status-success mt-1 shrink-0">&#9679;</span>
                    <span>
                      <strong className="text-foreground">No identity is transmitted.</strong> The
                      Google access token is stored only in browser memory and never sent to our
                      servers.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-status-success mt-1 shrink-0">&#9679;</span>
                    <span>
                      <strong className="text-foreground">No API keys are synced.</strong> Your
                      Gemini or other AI provider API keys are excluded from the sync payload.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-status-success mt-1 shrink-0">&#9679;</span>
                    <span>
                      <strong className="text-foreground">Full user control.</strong> Sign out any
                      time. Delete the sync file via Google Drive settings &rarr; Manage apps &rarr;
                      PQC Today &rarr; Delete hidden app data.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-status-success mt-1 shrink-0">&#9679;</span>
                    <span>
                      <strong className="text-foreground">This feature is optional.</strong> The app
                      works fully without signing in.
                    </span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/40">
                  Scope requested:{' '}
                  <code className="font-mono text-primary text-xs">drive.appdata</code> — the
                  least-privileged Drive scope. It cannot read or modify your regular Drive files.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Community Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Community</h2>
            <p className="text-xs text-muted-foreground">GitHub Discussions</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          This project is open source and community maintained. Join the conversation — ask
          questions, share ideas, or request new content.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {DISCUSSIONS.slice(0, 2).map(({ number, icon: Icon, label, description, url }) => (
            <a
              key={number}
              href={url ?? `${DISCUSSIONS_BASE}${number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 min-h-[44px] rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
            >
              <Icon className="text-primary shrink-0" size={16} />
              <div className="min-w-0">
                <p className="text-xs font-medium group-hover:text-primary transition-colors">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
            </a>
          ))}
          <AnimatePresence>
            {isShowAllDiscussions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-2">
                  {DISCUSSIONS.slice(2).map(({ number, icon: Icon, label, description, url }) => (
                    <a
                      key={number}
                      href={url ?? `${DISCUSSIONS_BASE}${number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 min-h-[44px] rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                    >
                      <Icon className="text-primary shrink-0" size={16} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium group-hover:text-primary transition-colors">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setIsShowAllDiscussions(!isShowAllDiscussions)}
          className="mt-2 py-2 min-h-[44px] text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          {isShowAllDiscussions ? 'Show less' : `Show all ${DISCUSSIONS.length - 2} more`}
          <ChevronDown
            size={14}
            className={clsx(
              'transition-transform duration-200',
              isShowAllDiscussions && 'rotate-180'
            )}
          />
        </button>
      </motion.div>

      {/* Stronger Together Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.19 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsWorkgroupsOpen(!isWorkgroupsOpen)}
          className="flex items-center gap-3 mb-3 w-full text-left cursor-pointer rounded-lg active:bg-muted/20 transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Handshake size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Stronger Together</h2>
            <p className="text-xs text-muted-foreground">Global PQC workgroups</p>
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isWorkgroupsOpen && 'rotate-180'
            )}
          />
        </button>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          Governments, consortiums, and standards bodies across the world are collaborating to drive
          the PQC transition. Tap any group to learn more.
        </p>
        <AnimatePresence>
          {isWorkgroupsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                {WORKGROUP_REGIONS.map((region) => {
                  const regionGroups = PQC_WORKGROUPS.filter((w) => w.region === region)
                  return (
                    <div key={region}>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                        <span aria-hidden="true">{regionGroups[0]?.regionFlag}</span>
                        {region}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {regionGroups.map((wg) => (
                          <button
                            key={wg.shortName}
                            onClick={() => setSelectedWorkgroup(wg)}
                            className="flex items-center gap-3 p-2.5 min-h-[44px] rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium group-hover:text-primary transition-colors">
                                {wg.shortName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {wg.description}
                              </p>
                            </div>
                            <ChevronRight
                              size={14}
                              className="text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Data Privacy Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.21 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsDataPrivacyOpen(!isDataPrivacyOpen)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <Lock size={20} />
          </div>
          <h2 className="text-lg font-semibold flex-1">Data Privacy</h2>
          <ChevronDown
            size={16}
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
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                PQC Today is a fully static website with no backend, no database, and no user
                accounts. We do not collect, store, or transmit any personal data.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                <li>No personal data — no names, emails, cookies, or server-side logging</li>
                <li>All preferences and progress stored locally in your browser</li>
                <li>Cryptographic keys and certificates never leave your device</li>
                <li>No external API calls at runtime</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 size={13} className="text-primary flex-shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Anonymous usage analytics
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use <strong className="text-foreground">Google Analytics 4</strong> to collect
                  anonymous behavioral signals (page views, feature interactions, accuracy votes,
                  learning milestones). No personal identifiers are ever transmitted. Analytics are
                  disabled on localhost.{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Opt out
                  </a>
                  .
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PQC Assistant Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.23 }}
        className="glass-panel p-4"
      >
        <button
          onClick={() => setIsPqcAssistantOpen(!isPqcAssistantOpen)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <BrainCircuit size={20} />
          </div>
          <h2 className="text-lg font-semibold flex-1">PQC Assistant</h2>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isPqcAssistantOpen && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {isPqcAssistantOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The PQC Assistant chatbot uses{' '}
                  <strong className="text-foreground">Retrieval-Augmented Generation (RAG)</strong>{' '}
                  to deliver grounded, sourced answers about post-quantum cryptography. It searches
                  ~3,970 curated knowledge chunks — covering algorithms, standards, threats,
                  compliance certifications, migration products, leaders, and learning modules —
                  retrieves the 10–20 most relevant passages, and injects them as context into a{' '}
                  <strong className="text-foreground">Gemini 2.5 Flash</strong> prompt.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To use the PQC Assistant, provide your own{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio API key
                  </a>
                  . Your key is stored only in your browser&apos;s localStorage and is never sent to
                  any server other than Google&apos;s Gemini API.
                </p>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-status-warning/10 border border-status-warning/30">
                  <ShieldAlert className="text-status-warning mt-0.5 shrink-0" size={14} />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Data routing notice:</strong> Your query
                    text and retrieved context chunks are sent to{' '}
                    <strong className="text-foreground">Google&apos;s servers</strong> for
                    processing. Do not include sensitive or personal information.{' '}
                    <a
                      href="https://ai.google.dev/gemini-api/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google AI Studio terms
                    </a>{' '}
                    apply.
                  </p>
                </div>

                {/* Capability Cards */}
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border">
                    <Database className="text-primary mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Grounded Answers</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Responses cite specific data from the platform&apos;s curated corpus —
                        algorithm specs, NIST standards, threat scenarios, compliance certs, and
                        more.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border">
                    <Link2 className="text-primary mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Deep Linking</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Answers include clickable links that navigate directly to the relevant page
                        — a specific algorithm, cert record, learning module, or workshop tab.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border">
                    <Sparkles className="text-primary mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">PQC Domain Expertise</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gemini Flash supplements RAG context with broad PQC knowledge from its
                        training data for topics not fully covered in the corpus.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limitations */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Limitations
                  </h3>
                  <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                    <li>
                      Knowledge bounded by curated corpus (~3,970 chunks) — niche or very recent
                      topics may lack coverage
                    </li>
                    <li>Requires a user-provided Gemini API key (BYOK)</li>
                    <li>Read-only Q&A — cannot perform actions</li>
                    <li>
                      General LLM caveats apply — may occasionally hallucinate details outside its
                      context window
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cryptography Buff Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Cryptography Buff</h2>
            <p className="text-xs text-muted-foreground">Websites and essential reading</p>
          </div>
        </div>

        {/* Websites & Blogs subsection */}
        <button
          onClick={() => setIsCryptoBuffSitesOpen(!isCryptoBuffSitesOpen)}
          className="flex items-center gap-2 w-full text-left cursor-pointer"
        >
          <Globe className="text-primary shrink-0" size={14} />
          <span className="text-xs font-semibold flex-1">Websites &amp; Blogs</span>
          <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full mr-1">
            {CRYPTO_BUFF_SITES.length}
          </span>
          <ChevronDown
            size={14}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isCryptoBuffSitesOpen && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {isCryptoBuffSitesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 mt-2">
                {CRYPTO_BUFF_SITES.map((site) => (
                  <a
                    key={site.url}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2.5 min-h-[44px] rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                  >
                    <ExternalLink className="text-primary shrink-0 mt-0.5" size={14} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium group-hover:text-primary transition-colors">
                        {site.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{site.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Essential Books subsection */}
        <button
          onClick={() => setIsCryptoBuffBooksOpen(!isCryptoBuffBooksOpen)}
          className="flex items-center gap-2 w-full text-left cursor-pointer mt-3 pt-3 border-t border-border"
        >
          <BookMarked className="text-primary shrink-0" size={14} />
          <span className="text-xs font-semibold flex-1">Essential Books</span>
          <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full mr-1">
            {CRYPTO_BUFF_BOOKS.length}
          </span>
          <ChevronDown
            size={14}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isCryptoBuffBooksOpen && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {isCryptoBuffBooksOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 mt-2">
                {CRYPTO_BUFF_BOOKS.map((book) => (
                  <a
                    key={book.url}
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-2 p-2.5 min-h-[44px] rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                        {book.title}
                      </p>
                      <p className="text-xs text-accent">by {book.author}</p>
                    </div>
                    <ExternalLink
                      className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors"
                      size={12}
                    />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Technology Acknowledgment */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className="glass-panel p-4 text-center"
      >
        <h3 className="text-sm font-semibold mb-1.5">AI Technology Acknowledgment</h3>
        <p className="text-xs text-muted-foreground">
          This site is developed, documented, validated and deployed using advanced AI technologies
          including Google Antigravity, ChatGPT, Claude AI, Perplexity, and Gemini Pro. While the
          presented information has been manually curated, it may still contain inaccuracies.
        </p>
      </motion.div>

      {/* Connect Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
        className="glass-panel p-4 text-center space-y-3"
      >
        <p className="text-sm text-muted-foreground">
          Created by <span className="font-bold text-foreground">Eric Amador</span>
        </p>
        <div className="flex flex-col items-center gap-3">
          <a
            href="https://www.linkedin.com/in/eric-amador-971850a"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <Users size={16} />
            Connect on LinkedIn
          </a>
          <button
            onClick={() => setIsJourneyModalOpen(true)}
            className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:underline group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            View My Career Journey
          </button>
        </div>
      </motion.div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.29 }}
        className="glass-panel p-4 flex flex-col items-center justify-center gap-3"
      >
        <h3 className="text-sm font-semibold">Appearance</h3>
        <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={clsx(
                'px-3 py-1.5 min-h-[44px] rounded-md text-xs font-medium transition-colors capitalize flex items-center gap-1.5',
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

      {/* Legal Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.31 }}
        className="glass-panel p-4 text-center"
      >
        <h3 className="text-sm font-semibold mb-2">Legal</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          This platform embeds open-source cryptographic software classified under ECCN 5D002. Usage
          is subject to U.S. Export Administration Regulations.
        </p>
        <Link
          to="/terms"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-accent hover:underline"
        >
          <FileText size={14} />
          Terms of Service
        </Link>
      </motion.div>

      {/* Disclaimer */}
      <div className="text-center px-4">
        <p className="text-xs text-muted-foreground/60">
          © 2025 PQC Today. Data sourced from the public internet resources.
        </p>
      </div>

      <CareerJourneyModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
      />
      <WorkgroupDetailModal
        workgroup={selectedWorkgroup}
        onClose={() => setSelectedWorkgroup(null)}
      />
    </div>
  )
}
