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

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Button } from '../ui/button'
import { LinkToUsButton } from '../ui/LinkToUsButton'
import { MobileAboutView } from './MobileAboutView'
import { CareerJourneyModal } from './CareerJourneyModal'
import { WorkgroupDetailModal } from './WorkgroupDetailModal'
import { PQC_WORKGROUPS, WORKGROUP_REGIONS } from './workgroupData'
import type { Workgroup } from './workgroupData'
import { useTheme } from '../../hooks/useTheme'
import { getCurrentVersion } from '../../store/useVersionStore'

const MISSION_TAGS = [
  '48 learning modules',
  '14-step risk assessment',
  '385+ migration catalog',
  'PKCS#11 v3.2 simulator',
  'FIPS 203 / 204 / 205',
  'AI assistant — runs locally',
  '5G SUCI simulation',
  'Zero data collected',
]

const PRINCIPLES = [
  {
    label: 'Worldwide',
    text: 'Not US-centric. NIST, ETSI, GSMA, ANSSI, ASD — all regulatory frameworks treated equally.',
  },
  {
    label: 'Transparent',
    text: 'Open source. GitHub-governed. Every correction, contribution, and decision is publicly auditable.',
  },
  {
    label: 'Neutral',
    text: 'No vendor relationships. No commercial bias. We do not take sides — we provide data so you can.',
  },
  {
    label: 'Private by design',
    text: 'No registration. No data collection. Processing runs on your device. We never know you visited.',
  },
  {
    label: 'Free at the core',
    text: 'Access to knowledge must not be gated. The community edition is free. Always.',
  },
  {
    label: 'Community governed',
    text: 'PQC practitioners set the roadmap. The platform serves the community, not the other way around.',
  },
]

const NOT_ITEMS = [
  {
    label: 'Not a vendor',
    text: 'We have no commercial relationships with HSM, cloud, or security vendors. Our content is not for sale.',
  },
  {
    label: 'Not a standards body',
    text: 'We reference and empower NIST, ETSI, ANSSI, and GSMA. We do not replace them.',
  },
  {
    label: 'Not a surveillance platform',
    text: 'We collect zero user data. We do not know who you are. We never will.',
  },
  {
    label: 'Not US-only',
    text: 'The quantum transition is a global challenge. Our platform is designed for every regulatory environment.',
  },
]

const DATA_FOUNDATION = [
  { dataset: 'Timeline Events', records: 203, sources: '80+ orgs, 50+ countries' },
  { dataset: 'Library Resources', records: 325, sources: '30+ standards bodies' },
  { dataset: 'Algorithm Reference', records: 46, sources: 'FIPS 203/204/205/206' },
  { dataset: 'Compliance Frameworks', records: 91, sources: 'NIST, ACVP, CC, ANSSI' },
  { dataset: 'Migrate Products', records: 385, sources: '7 infrastructure layers' },
  { dataset: 'Threat Landscape', records: 79, sources: '8+ industry sectors' },
  { dataset: 'Industry Leaders', records: 181, sources: 'Public, Private, Academic' },
  { dataset: 'Quiz Questions', records: 820, sources: 'All PQC topic areas' },
  { dataset: 'Authoritative Sources', records: 88, sources: 'Gov, Academic, Industry' },
  { dataset: 'Learning Modules', records: 48, sources: '2,400+ min of content' },
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
  {
    number: 116,
    icon: Trophy,
    label: 'Leaders',
    description: 'I consent to be added as a PQC leader',
    url: 'https://github.com/pqctoday/pqc-timeline-app/discussions/new?category=i-consent-to-be-added-as-a-pqc-leader',
  },
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

export function AboutView() {
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<Workgroup | null>(null)
  const [isShowAllDiscussions, setIsShowAllDiscussions] = useState(false)
  const [isMissionOpen, setIsMissionOpen] = useState(false)
  const [isWorkgroupsOpen, setIsWorkgroupsOpen] = useState(false)
  const [isSbomOpen, setIsSbomOpen] = useState(false)
  const [isCryptoBuffSitesOpen, setIsCryptoBuffSitesOpen] = useState(false)
  const [isCryptoBuffBooksOpen, setIsCryptoBuffBooksOpen] = useState(false)
  const [isDataPrivacyOpen, setIsDataPrivacyOpen] = useState(false)
  const [isPqcAssistantOpen, setIsPqcAssistantOpen] = useState(false)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile View: Light Experience */}
      <div className="md:hidden px-4 py-4">
        <MobileAboutView />
      </div>

      {/* Desktop View: Full Experience */}
      <div className="hidden md:block space-y-8">
        {/* Changelog Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-primary shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold">Release Notes</h2>
                <p className="text-sm text-muted-foreground">
                  What&apos;s new in v{version} — features, fixes, and improvements
                </p>
              </div>
            </div>
            <a
              href="/changelog"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
            >
              View Changelog
              <ChevronRight size={16} />
            </a>
          </div>
        </motion.div>

        {/* Bio Section / Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Info className="text-primary" size={24} />
              <div>
                <h2 className="text-2xl font-semibold">About PQC Today</h2>
                <p className="text-xs text-muted-foreground font-mono">v{version}</p>
              </div>
            </div>
          </div>

          {/* Preliminary section — always visible */}
          <div>
            <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-3">
              PQCToday &mdash; Public Vision
            </p>
            <h3 className="text-lg font-medium text-foreground leading-snug mb-4">
              Preparing the world for the quantum cryptographic transition
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4 mb-4">
              The algorithms that protect your data today &mdash; RSA, ECC, the cryptography behind
              TLS, SSH, and every digital signature you have ever trusted &mdash; will be broken by
              quantum computers. The question is not whether. The question is when, and whether the
              world will be ready.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              We are not ready. Most organisations do not know which systems are vulnerable. Most
              practitioners have never practiced post-quantum cryptography hands-on. The tools to
              learn, assess, and migrate exist &mdash; but they are scattered, vendor-biased, or
              inaccessible to the people who need them most.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PQCToday exists to close that gap.
            </p>
          </div>

          {/* Expand / collapse */}
          <Button
            variant="ghost"
            onClick={() => setIsMissionOpen(!isMissionOpen)}
            className="mt-4 text-xs text-muted-foreground hover:text-primary"
          >
            {isMissionOpen ? 'Collapse vision' : 'Read full vision'}
            <ChevronDown
              size={14}
              className={clsx(
                'ml-1 transition-transform duration-200',
                isMissionOpen && 'rotate-180'
              )}
            />
          </Button>

          {/* Full vision — collapsible (CSS grid trick avoids height:auto flicker) */}
          <div
            className={clsx(
              'grid transition-all duration-300 ease-in-out',
              isMissionOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="overflow-hidden">
              <div className="mt-5 space-y-5">
                <hr className="border-border" />

                {/* What we are building */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    What we are building
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    PQCToday is a neutral, community-governed platform providing independent
                    education, hands-on simulation, and migration guidance for the global
                    post-quantum cryptography transition.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    We run real cryptographic reference implementations &mdash; including SoftHSMv3,
                    an experimental open source PKCS#11 v3.2 HSM with NIST PQC algorithm support
                    &mdash; directly in your browser. No installation. No cloud account. No data
                    leaving your device.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    We cover every domain the transition touches: TLS, SSH, email, PKI, HSM key
                    management, 5G authentication, digital identity, blockchain, IoT, and the
                    regulatory frameworks &mdash; NIST, ETSI, DORA, NIS2, NSM-10, ANSSI &mdash; that
                    are setting the deadlines.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MISSION_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Founding principles */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Our founding principles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
                    {PRINCIPLES.map(({ label, text }) => (
                      <div key={label} className="bg-card p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-primary mb-1">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* What we are not */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">What we are not</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="bg-muted/20 border border-primary/20 rounded-xl p-5">
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
                  <h3 className="text-sm font-semibold text-foreground mb-2">Who this is for</h3>
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
                    industry, your regulatory environment, and your proficiency level &mdash; and it
                    does so without asking you to register, share data, or trust us with anything
                    except your time.
                  </p>
                </div>

                <hr className="border-border" />

                {/* Open source foundation */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    The open source foundation
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    PQCToday is built on open source. Our platform code, our cryptographic
                    simulators, and our community corpus are all publicly available. SoftHSMv3
                    &mdash; an experimental PKCS#11 v3.2 HSM implementation at the heart of our
                    simulator &mdash; is a standalone open source project available on GitHub and
                    npm, free for anyone to use in their own applications.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We believe the infrastructure for PQC migration training should be open,
                    auditable, and independent of any single organisation&apos;s interests. That
                    belief is not a marketing position. It is the architecture.
                  </p>
                </div>

                <hr className="border-border" />

                {/* The timeline is not optional */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    The timeline is not optional
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    NIST published its first post-quantum cryptographic standards in 2024. US
                    federal agencies are under NSM-10 migration mandates. European financial
                    institutions face DORA Article 9 cryptographic control requirements. The window
                    for &ldquo;we will think about it later&rdquo; has closed.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    The organisations that begin their cryptographic inventory, upskill their teams,
                    and start their migration planning now will complete the transition on their
                    terms. Those that wait will complete it under regulatory pressure, in crisis
                    mode, with less time and more risk.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    PQCToday exists to make sure the knowledge and tools needed for that transition
                    are available to everyone &mdash; for free, without conditions, without a sales
                    conversation, and without compromising the privacy of the people who need them.
                  </p>
                </div>

                <hr className="border-border" />

                {/* Personal links */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connect:{' '}
                    <a
                      href="https://www.linkedin.com/in/eric-amador-971850a"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Eric Amador on LinkedIn
                    </a>
                  </p>
                  <span className="hidden sm:inline text-muted-foreground/30">•</span>
                  <Button
                    variant="ghost"
                    onClick={() => setIsJourneyModalOpen(true)}
                    className="inline-flex items-center gap-2 text-accent hover:text-accent/80 group"
                  >
                    <Sparkles size={16} className="group-hover:animate-pulse" />
                    <span className="font-semibold underline decoration-2 underline-offset-4">
                      View My Career Journey
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transparency & Disclaimer Section */}
        <motion.div
          id="transparency"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Construction className="text-primary shrink-0" size={24} />
            <h2 className="text-xl font-semibold flex-1">Transparency &amp; Disclaimer</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning animate-pulse-glow">
              <Wrench size={12} className="animate-bounce-subtle" />
              WIP
            </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              PQC Today is a{' '}
              <strong className="text-foreground">community-driven educational platform</strong>{' '}
              built to help professionals understand and prepare for the post-quantum cryptography
              transition.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground list-none pl-0">
              <li className="flex items-start gap-2.5">
                <span className="text-primary mt-1 shrink-0">&#9679;</span>
                <span>
                  This website has{' '}
                  <strong className="text-foreground">not received endorsement</strong> from the
                  organizations, standards bodies, or government agencies referenced in its content
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-primary mt-1 shrink-0">&#9679;</span>
                <span>
                  All information is sourced from{' '}
                  <strong className="text-foreground">publicly available resources</strong> on the
                  internet
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-primary mt-1 shrink-0">&#9679;</span>
                <span>
                  Significant effort has gone into ensuring accuracy through{' '}
                  <strong className="text-foreground">
                    thorough automated and manual verification processes
                  </strong>
                  , but the content{' '}
                  <strong className="text-foreground">may still contain inaccuracies</strong>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-primary mt-1 shrink-0">&#9679;</span>
                <span>
                  We are actively working to{' '}
                  <strong className="text-foreground">
                    collaborate with authoritative organizations and domain experts
                  </strong>{' '}
                  to cross-validate and continuously improve the quality of this content
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-primary mt-1 shrink-0">&#9679;</span>
                <span>
                  Industry leaders featured on this platform are included only with their{' '}
                  <strong className="text-foreground">written consent</strong>
                </span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              If you represent a cited organization, are a domain expert, or simply want to help
              improve the accuracy of this platform, we welcome your involvement:
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <a
                href="https://github.com/pqctoday/pqc-timeline-app/discussions/108"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <MessageSquare size={14} />
                GitHub Discussions
                <ExternalLink size={12} />
              </a>
              <a
                href="https://www.linkedin.com/in/eric-amador-971850a"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Linkedin size={14} />
                Eric Amador
                <ExternalLink size={12} />
              </a>
            </div>
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
            {DISCUSSIONS.slice(0, 2).map(({ number, icon: Icon, label, description, url }) => (
              <a
                key={number}
                href={url ?? `${DISCUSSIONS_BASE}${number}`}
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
            <AnimatePresence>
              {isShowAllDiscussions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden contents-wrapper col-span-full"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DISCUSSIONS.slice(2).map(({ number, icon: Icon, label, description, url }) => (
                      <a
                        key={number}
                        href={url ?? `${DISCUSSIONS_BASE}${number}`}
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
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsShowAllDiscussions(!isShowAllDiscussions)}
            className="mt-3 text-xs text-muted-foreground hover:text-primary"
          >
            {isShowAllDiscussions ? 'Show less' : `Show all ${DISCUSSIONS.length - 2} more`}
            <ChevronDown
              size={14}
              className={clsx(
                'ml-1 transition-transform duration-200',
                isShowAllDiscussions && 'rotate-180'
              )}
            />
          </Button>
        </motion.div>

        {/* Stronger Together Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="glass-panel p-6"
        >
          <button
            onClick={() => setIsWorkgroupsOpen(!isWorkgroupsOpen)}
            className="flex items-center gap-3 mb-2 w-full text-left cursor-pointer"
          >
            <Handshake className="text-primary shrink-0" size={24} />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Stronger Together</h2>
              <p className="text-xs text-muted-foreground">
                Global workgroups leading the PQC transition
              </p>
            </div>
            <ChevronDown
              size={18}
              className={clsx(
                'text-muted-foreground transition-transform duration-200 shrink-0',
                isWorkgroupsOpen && 'rotate-180'
              )}
            />
          </button>
          <p className="text-sm text-muted-foreground mt-3 mb-2 leading-relaxed">
            The transition to post-quantum cryptography is a global effort that no single
            organization can tackle alone. Across every major region, governments, industry
            consortiums, and standards bodies are collaborating &mdash; publishing algorithm
            recommendations, coordinating migration timelines, and building open-source tooling.
            These are the workgroups leading the charge.
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
                <div className="space-y-5 pt-3">
                  {WORKGROUP_REGIONS.map((region) => {
                    const regionGroups = PQC_WORKGROUPS.filter((w) => w.region === region)
                    return (
                      <div key={region}>
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                          <span aria-hidden="true">{regionGroups[0]?.regionFlag}</span>
                          {region}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {regionGroups.map((wg) => (
                            <button
                              key={wg.shortName}
                              onClick={() => setSelectedWorkgroup(wg)}
                              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                  {wg.shortName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {wg.description}
                                </p>
                              </div>
                              <ChevronRight
                                size={16}
                                className="text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors"
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

        {/* Data Foundation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
              <span className="text-2xl font-bold text-gradient">2,200+</span>
              <span className="text-sm text-muted-foreground">total curated records</span>
            </div>
            <span className="text-xs text-muted-foreground">Compliance data refreshed weekly</span>
          </div>
        </motion.div>

        {/* SBOM Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
          className="glass-panel p-6"
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
                <div className="columns-1 md:columns-3 gap-6 space-y-6 mt-6">
                  <div className="break-inside-avoid">
                    <h3 className="text-lg font-semibold text-primary mb-3">
                      UI Frameworks & Libraries
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">React</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                          <span className="text-xs text-muted-foreground/60">v19.2.3</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">Framer Motion</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                          <span className="text-xs text-muted-foreground/60">v12.27.5</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">Lucide React</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">ISC</span>
                          <span className="text-xs text-muted-foreground/60">v0.562.0</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">Tailwind CSS</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                          <span className="text-xs text-muted-foreground/60">v4.1.17</span>
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
                          <span className="text-xs text-muted-foreground/60">v3.4.0</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">class-variance-authority</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">
                            Apache-2.0
                          </span>
                          <span className="text-xs text-muted-foreground/60">v0.7.1</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">React Router</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                          <span className="text-xs text-muted-foreground/60">v7.12.0</span>
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
                          <span className="text-xs text-muted-foreground/40 font-mono">
                            Apache-2.0
                          </span>
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
                          <span className="text-xs text-muted-foreground/40 font-mono">
                            Apache-2.0
                          </span>
                          <span className="text-xs text-muted-foreground/60">v3.6.0</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">
                          Web Crypto API (X25519, P-256)
                        </span>
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
                        <a
                          href="https://github.com/pqctoday/softhsmv3/releases/tag/v0.2.0"
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
                          <span className="text-xs text-muted-foreground/60">v5.0.10</span>
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
                          <span className="text-xs text-muted-foreground/40 font-mono">
                            Apache-2.0
                          </span>
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
                          <span className="text-xs text-muted-foreground/60">v9.39.2</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">Prettier</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">MIT</span>
                          <span className="text-xs text-muted-foreground/60">v3.8.0</span>
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
                          <span className="text-xs text-muted-foreground/60">v4.0.17</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">Playwright</span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-muted-foreground/40 font-mono">
                            Apache-2.0
                          </span>
                          <span className="text-xs text-muted-foreground/60">v1.57.0</span>
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
                        <span className="text-muted-foreground">
                          axe-playwright (Accessibility)
                        </span>
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
                      <span className="text-xs font-normal text-muted-foreground">
                        (softhsmrustv3)
                      </span>
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
                      <span className="text-xs font-normal text-muted-foreground">
                        (softhsmrustv3)
                      </span>
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
                          <span className="text-xs text-muted-foreground/60">
                            v0.8 / v0.10 / v0.2
                          </span>
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
                          <span className="text-xs text-muted-foreground/60">
                            v0.11-rc / v0.8-rc
                          </span>
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

        {/* Security Audit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-primary" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Security Audit</h2>
              <p className="text-xs text-muted-foreground">Last audited: March 11, 2026</p>
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
            <div className="flex items-start gap-3 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
              <ShieldAlert className="text-status-warning mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold text-status-warning">
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-warning/10 text-status-warning">
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
          transition={{ delay: 0.37 }}
          className="glass-panel p-6"
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
                    PQC Today is a fully static website &mdash; there is no backend server, no
                    database, and no user accounts. We do not collect, store, or transmit any
                    personal data.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>
                      <strong className="text-foreground">No personal data collection</strong>{' '}
                      &mdash; no names, email addresses, cookies, tracking pixels, form submissions,
                      or server-side logging of any kind.
                    </li>
                    <li>
                      <strong className="text-foreground">Local-only persistence</strong> &mdash;
                      all user preferences, assessment results, learning progress, and saved state
                      are stored exclusively in your browser&apos;s localStorage. Nothing leaves
                      your device.
                    </li>
                    <li>
                      <strong className="text-foreground">Client-side cryptography</strong> &mdash;
                      all cryptographic operations run entirely in your browser via WebAssembly
                      (OpenSSL, liboqs). No keys or certificates are ever sent to a server.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        No third-party services at runtime
                      </strong>
                      &mdash; the site is served as static files from GitHub Pages and makes no
                      external API calls at runtime &mdash; <em>except</em> when you use the PQC
                      Assistant, which sends your query and retrieved context chunks to{' '}
                      <strong className="text-foreground">Google&apos;s Gemini API</strong>. See the
                      PQC Assistant section below for details.
                    </li>
                    <li>
                      <strong className="text-foreground">Full transparency</strong> &mdash; the
                      entire source code is{' '}
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
                        <strong className="text-foreground">Content accuracy signals</strong>{' '}
                        &mdash; thumbs-up / thumbs-down votes on content pages (page path and vote
                        only).
                      </li>
                      <li>
                        <strong className="text-foreground">Learning milestones</strong> &mdash;
                        module started / completed events and artifact generation (key type only,
                        never the key itself).
                      </li>
                      <li>
                        <strong className="text-foreground">Assistant feedback</strong> &mdash;
                        helpful / unhelpful votes on PQC Assistant responses.
                      </li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      Analytics are{' '}
                      <strong className="text-foreground">disabled on localhost</strong>. Google
                      Analytics 4 anonymizes IP addresses by default &mdash;{' '}
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

        {/* License Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.39 }}
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
              <LinkToUsButton />
            </div>
          </div>
        </motion.div>

        {/* RAG & Gemini Flash 2.5 Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.41 }}
          className="glass-panel p-6"
        >
          <button
            onClick={() => setIsPqcAssistantOpen(!isPqcAssistantOpen)}
            className="flex items-center gap-3 w-full text-left cursor-pointer"
          >
            <BrainCircuit className="text-primary shrink-0" size={24} />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">PQC Assistant</h2>
              <p className="text-xs text-muted-foreground">RAG + Gemini 2.5 Flash</p>
            </div>
            <ChevronDown
              size={20}
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
                <div className="prose prose-invert max-w-none mt-4">
                  <p className="text-muted-foreground">
                    The PQC Assistant chatbot uses{' '}
                    <strong className="text-foreground">
                      Retrieval-Augmented Generation (RAG)
                    </strong>{' '}
                    to deliver grounded, sourced answers about post-quantum cryptography. When you
                    ask a question, it searches a curated corpus of ~3,830 PQC knowledge chunks
                    &mdash; covering algorithms, standards, threats, compliance certifications,
                    migration products, leaders, and learning modules &mdash; retrieves the
                    10&ndash;20 most relevant passages (adaptive per query intent), and injects them
                    as context into a <strong className="text-foreground">Gemini 2.5 Flash</strong>{' '}
                    prompt. The result is an answer grounded in platform data, enriched with deep
                    links to the exact page or section being discussed.
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
                    . Your key is stored only in your browser&apos;s localStorage and is never sent
                    to any server other than Google&apos;s Gemini API. You can obtain a free API key
                    from Google AI Studio in seconds.
                  </p>
                  <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                    <ShieldAlert className="text-status-warning mt-0.5 shrink-0" size={16} />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Data routing notice:</strong> When you
                      submit a question, your query text and the retrieved context chunks are sent
                      to <strong className="text-foreground">Google&apos;s servers</strong> for
                      processing by the Gemini 2.5 Flash model. Do not include sensitive,
                      confidential, or personal information in your queries.{' '}
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
                </div>

                {/* Capability Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                    <Database className="text-primary mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Grounded Answers</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Responses cite specific data from the platform&apos;s curated corpus &mdash;
                        algorithm specs, NIST standards, threat scenarios, compliance certs, and
                        more.
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
                        Gemini Flash supplements RAG context with broad PQC knowledge from its
                        training data for topics not fully covered in the corpus.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limitations */}
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Limitations</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                    <li>
                      Knowledge is bounded by the curated corpus (~3,830 chunks) &mdash; niche or
                      very recent topics may lack coverage
                    </li>
                    <li>
                      Requires a user-provided Gemini API key (BYOK) &mdash; no keys are stored
                      server-side
                    </li>
                    <li>Cannot perform actions &mdash; read-only Q&A, no write operations</li>
                    <li>
                      General LLM caveats apply &mdash; may occasionally hallucinate details outside
                      its context window
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Cryptography Buff Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-primary shrink-0" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Cryptography Buff</h2>
              <p className="text-xs text-muted-foreground">
                Curated websites and essential reading
              </p>
            </div>
          </div>

          {/* Websites & Blogs subsection */}
          <button
            onClick={() => setIsCryptoBuffSitesOpen(!isCryptoBuffSitesOpen)}
            className="flex items-center gap-2 w-full text-left cursor-pointer"
          >
            <Globe className="text-primary shrink-0" size={16} />
            <span className="text-sm font-semibold flex-1">Websites &amp; Blogs</span>
            <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full mr-2">
              {CRYPTO_BUFF_SITES.length}
            </span>
            <ChevronDown
              size={16}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {CRYPTO_BUFF_SITES.map((site) => (
                    <a
                      key={site.url}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                    >
                      <ExternalLink className="text-primary shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {site.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{site.description}</p>
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
            className="flex items-center gap-2 w-full text-left cursor-pointer mt-4 pt-4 border-t border-border"
          >
            <BookMarked className="text-primary shrink-0" size={16} />
            <span className="text-sm font-semibold flex-1">Essential Books</span>
            <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full mr-2">
              {CRYPTO_BUFF_BOOKS.length}
            </span>
            <ChevronDown
              size={16}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {CRYPTO_BUFF_BOOKS.map((book) => (
                    <a
                      key={book.url}
                      href={book.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {book.title}
                        </p>
                        <p className="text-xs text-accent mt-0.5">by {book.author}</p>
                        <p className="text-xs text-muted-foreground mt-1">{book.description}</p>
                      </div>
                      <ExternalLink
                        className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors"
                        size={14}
                      />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* AI Acknowledgment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
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
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 flex flex-col items-center justify-center gap-4"
        >
          <h3 className="text-lg font-semibold">Appearance</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Choose your preferred color scheme.
          </p>
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
            {(['light', 'dark'] as const).map((t) => (
              <Button
                key={t}
                variant="ghost"
                size="icon"
                onClick={() => setTheme(t)}
                className={clsx(
                  'px-4 py-2 min-h-[44px] rounded-md text-sm font-medium capitalize flex items-center gap-2',
                  theme === t
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                )}
              >
                {t === 'light' && '☀️'}
                {t === 'dark' && '🌙'}
                {t}
              </Button>
            ))}
          </div>
        </motion.div>
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
