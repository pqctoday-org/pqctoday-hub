// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Globe,
  Lock,
  BrainCircuit,
  Database,
  Sparkles,
  BarChart2,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Cpu,
  BookOpen,
  Trophy,
  FileText,
  CalendarDays,
  ShieldAlert,
  Package,
  Handshake,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  BookMarked,
  Construction,
  Wrench,
  Linkedin,
  Stamp,
} from 'lucide-react'
import clsx from 'clsx'
import { CareerJourneyModal } from './CareerJourneyModal'
import { WorkgroupDetailModal } from './WorkgroupDetailModal'
import { PQC_WORKGROUPS, WORKGROUP_REGIONS } from './workgroupData'
import type { Workgroup } from './workgroupData'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion } from '../../store/useVersionStore'

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
  {
    number: 0,
    icon: Stamp,
    label: 'Library Endorsements',
    description: 'Endorse a library resource for relevance and accuracy',
    url: 'https://github.com/pqctoday/pqc-timeline-app/discussions/categories/library-resource-endorsement',
  },
]

const CRYPTO_BUFF_SITES = [
  {
    label: 'NIST Post-Quantum Cryptography',
    description:
      'Official NIST PQC standardization project — FIPS 203/204/205 standards, submissions, and status updates',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
  },
  {
    label: 'Open Quantum Safe (OQS)',
    description:
      'Open-source PQC library (liboqs) and OpenSSL/BoringSSL integrations — reference implementations',
    url: 'https://openquantumsafe.org',
  },
  {
    label: 'IACR ePrint Archive',
    description: 'Preprint server for cryptography research — where PQC papers appear first',
    url: 'https://eprint.iacr.org',
  },
  {
    label: 'A Security Site — PQC',
    description:
      'Prof. Bill Buchanan OBE — extensive PQC algorithm references and interactive labs',
    url: 'https://asecuritysite.com/pqc',
  },
  {
    label: 'cr.yp.to — Daniel J. Bernstein',
    description:
      'Co-creator of SPHINCS+/SLH-DSA and NTRU contributor — papers, software, and PQC commentary',
    url: 'https://cr.yp.to',
  },
  {
    label: 'Cryptographic Engineering — Matthew Green',
    description:
      'Johns Hopkins professor — accessible deep dives on PQC, protocol security, and crypto policy',
    url: 'https://blog.cryptographyengineering.com',
  },
  {
    label: 'Schneier on Security',
    description: "Bruce Schneier's blog — crypto policy, applied security, and PQC commentary",
    url: 'https://www.schneier.com',
  },
  {
    label: 'Stanford Cryptography Group',
    description: "Dan Boneh's research group — papers, courses, and applied crypto projects",
    url: 'https://crypto.stanford.edu',
  },
  {
    label: 'Cryptography I — Dan Boneh (Coursera)',
    description: "The gold-standard free online cryptography course by Stanford's Dan Boneh",
    url: 'https://www.coursera.org/learn/crypto',
  },
  {
    label: 'MIT OpenCourseWare — Cryptography',
    description: 'Free MIT lecture notes and problem sets for cryptography courses',
    url: 'https://ocw.mit.edu',
  },
]

const CRYPTO_BUFF_BOOKS = [
  {
    title: 'Post-Quantum Cryptography',
    author: 'Daniel J. Bernstein, Johannes Buchmann & Erik Dahmen',
    description:
      'The foundational PQC textbook — lattice, code-based, hash-based, and multivariate algorithm families',
    url: 'https://link.springer.com/book/10.1007/978-3-540-88702-7',
  },
  {
    title: 'An Introduction to Mathematical Cryptography',
    author: 'Jeffrey Hoffstein, Jill Pipher & Joseph H. Silverman',
    description:
      'Lattice-based crypto foundations (the math behind ML-KEM and ML-DSA) — by the creators of NTRU',
    url: 'https://link.springer.com/book/10.1007/978-1-4939-1711-2',
  },
  {
    title: 'A Graduate Course in Applied Cryptography',
    author: 'Dan Boneh & Victor Shoup',
    description:
      'Comprehensive and free — provable security, public-key encryption, and signature schemes',
    url: 'https://toc.cryptobook.us',
  },
  {
    title: 'Real World Cryptography',
    author: 'David Wong',
    description:
      'Hands-on guide to modern crypto primitives, protocols, and their real-world application',
    url: 'https://www.manning.com/books/real-world-cryptography',
  },
  {
    title: 'Serious Cryptography',
    author: 'Jean-Philippe Aumasson',
    description: 'Practical guide to modern encryption — symmetric, asymmetric, and protocols',
    url: 'https://nostarch.com/seriouscrypto',
  },
  {
    title: 'Applied Cryptography',
    author: 'Bruce Schneier',
    description: 'The classic reference on cryptographic protocols, algorithms, and source code',
    url: 'https://www.schneier.com/books/applied-cryptography/',
  },
  {
    title: 'The Code Book',
    author: 'Simon Singh',
    description: 'The history of codes and ciphers — from Caesar to quantum cryptography',
    url: 'https://simonsingh.net/books/the-code-book/',
  },
  {
    title: 'Self-Sovereign Identity',
    author: 'Alex Preukschat & Drummond Reed',
    description: 'Decentralized digital identity architecture, VCs, DIDs, and trust frameworks',
    url: 'https://www.manning.com/books/self-sovereign-identity',
  },
]

export const MobileAboutView = () => {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<Workgroup | null>(null)
  const [isShowAllDiscussions, setIsShowAllDiscussions] = useState(false)
  const [isWorkgroupsOpen, setIsWorkgroupsOpen] = useState(false)
  const [isCryptoBuffSitesOpen, setIsCryptoBuffSitesOpen] = useState(false)
  const [isCryptoBuffBooksOpen, setIsCryptoBuffBooksOpen] = useState(false)
  const [isDataPrivacyOpen, setIsDataPrivacyOpen] = useState(false)
  const [isPqcAssistantOpen, setIsPqcAssistantOpen] = useState(false)

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
          <a
            href="/changelog"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
          >
            View
            <ChevronRight size={14} />
          </a>
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
          PQC Today brings together 48 learning modules across 8 tracks &mdash; including role
          guides, industry verticals, and hands-on crypto labs &mdash; 820 quiz questions, a risk
          assessment wizard, migration planning tools, and global compliance tracking &mdash; tuned
          to your role as a developer, architect, operations professional, executive, or researcher.
        </p>
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
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Timeline Events', value: '203' },
            { label: 'Migrate Products', value: '385' },
            { label: 'Library Resources', value: '325' },
            { label: 'Quiz Questions', value: '820' },
          ].map((s) => (
            <div
              key={s.label}
              className="p-2 rounded-lg border border-border bg-muted/30 text-center"
            >
              <div className="text-sm font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Community Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
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
        transition={{ delay: 0.16 }}
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
        transition={{ delay: 0.18 }}
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
        transition={{ delay: 0.2 }}
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
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Ask questions about post-quantum cryptography using our RAG-powered chatbot. It
                searches ~3,830 curated knowledge chunks and uses Gemini 2.5 Flash to deliver
                grounded answers with deep links to relevant pages.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cryptography Buff Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
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

      {/* Connect Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
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
        transition={{ delay: 0.26 }}
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
