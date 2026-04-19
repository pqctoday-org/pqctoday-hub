// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  FlaskConical,
  GraduationCap,
  Shield,
  ShieldCheck,
  ArrowRightLeft,
  ArrowRight,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  Save,
  Upload,
  Compass,
  AlertTriangle,
  Check,
  Cloud,
  CloudOff,
  Loader2,
  LogOut,
} from 'lucide-react'
// LogOut intentionally kept for sign-out button
import { Button } from '../ui/button'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { PERSONA_RECOMMENDED_PATHS, PERSONA_NAV_PATHS } from '@/data/personaConfig'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { PersonalizationSection } from './PersonalizationSection'
import { PQCExplainer } from './PQCExplainer'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { TransparencyBanner } from './TransparencyBanner'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'

const MODULE_COUNT = Object.keys(MODULE_CATALOG).filter((k) => k !== 'quiz').length

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

const PERSONA_HERO_CTA: Record<
  string,
  { primary: { label: string; path: string }; secondary: { label: string; path: string } }
> = {
  executive: {
    primary: { label: 'Start the Journey', path: '/learn' },
    secondary: { label: 'Open Command Center', path: '/business' },
  },
  developer: {
    primary: { label: 'Start the Journey', path: '/learn' },
    secondary: { label: 'Jump to Playground', path: '/playground' },
  },
  architect: {
    primary: { label: 'Start the Journey', path: '/learn' },
    secondary: { label: 'Jump to Timeline', path: '/timeline' },
  },
  researcher: {
    primary: { label: 'Start the Journey', path: '/learn' },
    secondary: { label: 'Jump to Algorithms', path: '/algorithms' },
  },
  ops: {
    primary: { label: 'Start the Journey', path: '/learn' },
    secondary: { label: 'Jump to Migration Catalog', path: '/migrate' },
  },
  curious: {
    primary: { label: 'Start Learning', path: '/learn' },
    secondary: { label: 'What Is the Quantum Threat?', path: '/learn/pqc-101' },
  },
}

const DEFAULT_HERO_CTA = {
  primary: { label: 'Start the Journey', path: '/learn' },
  secondary: { label: 'Explore the Timeline', path: '/timeline' },
}

// Paths always visible regardless of persona
const ALWAYS_VISIBLE_PATHS = ['/learn', '/timeline', '/threats']

type StepEngagement = 'not-started' | 'started' | 'engaged'

interface JourneyStep {
  id: string
  step: number
  label: string
  icon: React.ElementType
  description: string
  paths: string[]
  color: string
  section: 'start' | 'journey' | 'assess' | 'current'
  actionLabel: string
  resumeLabel: string
}

const JOURNEY_SECTIONS: { id: string; title: string; subtitle: string; nextHint?: string }[] = [
  {
    id: 'start',
    title: 'Start the Journey',
    subtitle: 'Build your understanding of the quantum threat and the new cryptographic standards.',
    nextHint: 'Ready to plan your migration?',
  },
  {
    id: 'journey',
    title: 'My Journey',
    subtitle: 'Map your specific requirements — products, compliance frameworks, and deadlines.',
    nextHint: 'Time to assess your readiness.',
  },
  {
    id: 'assess',
    title: 'Assess & Report',
    subtitle: 'Get a personalized risk score, migration roadmap, and hands-on testing.',
    nextHint: 'Stay informed as the landscape evolves.',
  },
  {
    id: 'current',
    title: 'Keep Up to Date',
    subtitle: 'Monitor evolving threats, new standards, and industry leaders.',
  },
]

function buildJourneySteps(
  algorithmCount: number | null,
  migrateCount: number | null,
  libraryCount: number | null
): JourneyStep[] {
  const algoLabel = algorithmCount !== null ? `${algorithmCount}` : '80+'
  const migrateLabel = migrateCount !== null ? `${migrateCount}` : '700+'
  const libraryLabel = libraryCount !== null ? `${libraryCount}` : '450+'

  return [
    // — Start the Journey —
    {
      id: 'learn',
      step: 1,
      label: 'Learn',
      icon: GraduationCap,
      color: 'text-secondary',
      section: 'start' as const,
      description: `Start from zero or go deep — ${MODULE_COUNT} hands-on modules covering the quantum threat, new encryption standards, and what your organization needs to do`,
      paths: ['/learn'],
      actionLabel: 'Start Learning',
      resumeLabel: 'Continue Learning',
    },
    {
      id: 'timeline',
      step: 2,
      label: 'Timeline',
      icon: Globe,
      color: 'text-accent',
      section: 'start' as const,
      description:
        'See when governments require action — track every PQC mandate, advisory, and milestone from 2020 to 2035',
      paths: ['/timeline'],
      actionLabel: 'Track Deadlines',
      resumeLabel: 'Review Timeline',
    },
    {
      id: 'algorithms',
      step: 3,
      label: 'Algorithms',
      icon: Shield,
      color: 'text-primary',
      section: 'start' as const,
      description: `Compare ${algoLabel} post-quantum encryption algorithms — performance, security levels, key sizes, and standardization status`,
      paths: ['/algorithms'],
      actionLabel: 'Compare Algorithms',
      resumeLabel: 'Explore More',
    },
    // — My Journey —
    {
      id: 'migrate',
      step: 4,
      label: 'Migrate',
      icon: ArrowRightLeft,
      color: 'text-primary',
      section: 'journey' as const,
      description: `${migrateLabel} tracked, production-grade tools for upgrading your infrastructure — from cloud services to hardware`,
      paths: ['/migrate'],
      actionLabel: 'Browse Catalog',
      resumeLabel: 'Continue Planning',
    },
    {
      id: 'compliance',
      step: 5,
      label: 'Compliance',
      icon: ShieldCheck,
      color: 'text-accent',
      section: 'journey' as const,
      description:
        'Track regulatory deadlines from 2024 to 2035 — know exactly when your industry must comply',
      paths: ['/compliance'],
      actionLabel: 'Check Compliance',
      resumeLabel: 'Review Frameworks',
    },
    // — Assess & Report —
    {
      id: 'assess',
      step: 6,
      label: 'Assess',
      icon: ClipboardCheck,
      color: 'text-primary',
      section: 'assess' as const,
      description:
        'Answer a few questions about your organization and get a personalized readiness score with concrete next steps',
      paths: ['/assess'],
      actionLabel: 'Run Assessment',
      resumeLabel: 'Update Assessment',
    },
    {
      id: 'report',
      step: 7,
      label: 'Report',
      icon: FileBarChart,
      color: 'text-accent',
      section: 'assess' as const,
      description:
        'Review your personalized readiness report with risk scores, migration roadmap, and actionable recommendations',
      paths: ['/report'],
      actionLabel: 'View Report',
      resumeLabel: 'Review Report',
    },
    {
      id: 'business',
      step: 8,
      label: 'Command Center',
      icon: LayoutDashboard,
      color: 'text-primary',
      section: 'assess' as const,
      description:
        'Your GRC command center — live risk scores, compliance tracking, vendor posture, and prioritized next steps',
      paths: ['/business'],
      actionLabel: 'Open Dashboard',
      resumeLabel: 'View Dashboard',
    },
    {
      id: 'test',
      step: 9,
      label: 'Test & Build',
      icon: FlaskConical,
      color: 'text-secondary',
      section: 'assess' as const,
      description:
        'Generate quantum-resistant keys and test new encryption algorithms right in your browser — no setup required',
      paths: ['/playground', '/openssl'],
      actionLabel: 'Try the Playground',
      resumeLabel: 'Build More',
    },
    // — Keep Up to Date —
    {
      id: 'threats',
      step: 10,
      label: 'Threats',
      icon: AlertTriangle,
      color: 'text-accent',
      section: 'current' as const,
      description:
        'Stay current on evolving threats by industry — understand attack vectors, risk timelines, and what to prioritize',
      paths: ['/threats'],
      actionLabel: 'Explore Threats',
      resumeLabel: 'Check Updates',
    },
    {
      id: 'library',
      step: 11,
      label: 'Library',
      icon: Shield,
      color: 'text-primary',
      section: 'current' as const,
      description: `Browse ${libraryLabel} tracked standards, RFCs, and specifications driving the post-quantum transition`,
      paths: ['/library'],
      actionLabel: 'Browse Standards',
      resumeLabel: 'Browse Standards',
    },
    {
      id: 'leaders',
      step: 12,
      label: 'Leaders',
      icon: Globe,
      color: 'text-secondary',
      section: 'current' as const,
      description:
        'Discover the organizations and individuals driving the post-quantum transition worldwide',
      paths: ['/leaders'],
      actionLabel: 'Discover Leaders',
      resumeLabel: 'Discover Leaders',
    },
  ]
}

const SECTION_HEADING: Record<string, { title: string; sub: string }> = {
  executive: {
    title: 'Your roadmap to organizational PQC readiness',
    sub: 'Risk assessment, compliance tracking, and governance planning — built for decision makers and compliance professionals.',
  },
  developer: {
    title: 'Your toolkit for building with PQC today',
    sub: 'Real cryptographic operations powered by OpenSSL WASM, liboqs, and a dual-engine (C++/Rust) WASM HSM — not simulations.',
  },
  architect: {
    title: 'Your blueprint for PQC-ready systems',
    sub: 'Architecture patterns, compliance mappings, and live crypto tools — from planning to deployment.',
  },
  researcher: {
    title: 'Your platform for exploring the PQC frontier',
    sub: 'Full algorithm implementations, protocol deep-dives, and interactive simulations — real science, real data.',
  },
  ops: {
    title: 'Your operations hub for PQC deployment',
    sub: 'Migration catalogs, key management, and infrastructure tooling — built for the teams who keep it running.',
  },
  curious: {
    title: 'Your guide to understanding the quantum security shift',
    sub: 'No technical background needed — learn why encryption is changing and what it means for you.',
  },
  default: {
    title: 'The complete platform for your PQC transformation',
    sub: 'Understand, assess, and stay current — every step of the journey, all in one place.',
  },
}

export const LandingView = () => {
  const { selectedPersona } = usePersonaStore()
  const { signIn, signOut, isSignedIn, syncStatus, lastSyncedAt, isConfigured } = useGoogleAuth()
  // eslint-disable-next-line security/detect-object-injection
  const recommendedPaths = selectedPersona ? PERSONA_RECOMMENDED_PATHS[selectedPersona] : []
  const { workflowActive, startWorkflow } = useMigrationWorkflowStore()
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const showWorkflowCta = assessmentStatus === 'complete' && !workflowActive

  // Engagement tracking — derive from existing stores (no new persistence)
  const moduleModules = useModuleStore((s) => s.modules)
  const artifactCount = useModuleStore((s) => {
    const a = s.artifacts
    return a.keys.length + a.certificates.length + a.csrs.length
  })
  const myFrameworkCount = useComplianceSelectionStore((s) => s.myFrameworks.length)
  const migrationStarted = useMigrationWorkflowStore((s) => s.startedAt !== null)

  const hasLearningProgress = useMemo(
    () => Object.values(moduleModules).some((m) => m.status !== 'not-started'),
    [moduleModules]
  )

  const stepEngagement = useMemo((): Record<string, StepEngagement> => {
    return {
      learn: hasLearningProgress ? 'engaged' : 'not-started',
      timeline: 'not-started',
      algorithms: artifactCount > 0 ? 'engaged' : 'not-started',
      migrate: migrationStarted ? 'engaged' : 'not-started',
      compliance: myFrameworkCount > 0 ? 'engaged' : 'not-started',
      assess:
        assessmentStatus === 'complete'
          ? 'engaged'
          : assessmentStatus === 'in-progress'
            ? 'started'
            : 'not-started',
      report: assessmentStatus === 'complete' ? 'engaged' : 'not-started',
      business:
        assessmentStatus === 'complete' || myFrameworkCount > 0
          ? 'engaged'
          : assessmentStatus === 'in-progress'
            ? 'started'
            : 'not-started',
      test: artifactCount > 0 ? 'engaged' : 'not-started',
      threats: 'not-started',
      library: 'not-started',
      leaders: 'not-started',
    }
  }, [hasLearningProgress, artifactCount, myFrameworkCount, migrationStarted, assessmentStatus])

  // Context-aware hero CTA — evolves based on user progress
  const heroCta = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const base = (selectedPersona && PERSONA_HERO_CTA[selectedPersona]) || DEFAULT_HERO_CTA
    if (assessmentStatus === 'complete') {
      return {
        primary: { label: 'View Your Report', path: '/report' },
        secondary: base.secondary,
      }
    }
    if (hasLearningProgress) {
      return {
        primary: { label: 'Continue Your Journey', path: '/learn' },
        secondary: base.secondary,
      }
    }
    return base
  }, [selectedPersona, hasLearningProgress, assessmentStatus])

  const [algorithmCount, setAlgorithmCount] = useState<number | null>(null)
  const [timelineEventCount, setTimelineEventCount] = useState<number | null>(null)
  const [libraryCount, setLibraryCount] = useState<number | null>(null)
  const [migrateCount, setMigrateCount] = useState<number | null>(null)

  useEffect(() => {
    loadPQCAlgorithmsData().then((data) => setAlgorithmCount(data.length))
    import('@/data/timelineData').then(({ timelineData }) => {
      setTimelineEventCount(timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length)
    })
    import('@/data/libraryData').then(({ libraryData }) => {
      setLibraryCount(libraryData.length)
    })
    import('@/data/migrateData').then(({ softwareData }) => {
      setMigrateCount(softwareData.length)
    })
  }, [])

  const journeySteps = useMemo(
    () => buildJourneySteps(algorithmCount, migrateCount, libraryCount),
    [algorithmCount, migrateCount, libraryCount]
  )

  // Set of paths accessible to the current persona
  const accessiblePaths = useMemo((): Set<string> => {
    if (!selectedPersona) return new Set(['*'])
    // eslint-disable-next-line security/detect-object-injection
    const personaPaths = PERSONA_NAV_PATHS[selectedPersona]
    if (personaPaths === null) return new Set(['*']) // researcher = all
    return new Set([...ALWAYS_VISIBLE_PATHS, ...personaPaths])
  }, [selectedPersona])

  const isAccessible = (step: JourneyStep) =>
    accessiblePaths.has('*') || step.paths.some((p) => accessiblePaths.has(p))

  const isRecommendedStep = (step: JourneyStep) =>
    step.paths.some((p) => recommendedPaths.includes(p))

  // First recommended step the user hasn't engaged with yet — gets "Start here" badge
  const firstRecommendedUnvisited = useMemo(() => {
    const recommended = journeySteps.filter((s) => isRecommendedStep(s))
    return recommended.find((s) => stepEngagement[s.id] === 'not-started')?.id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeySteps, stepEngagement, recommendedPaths])

  const heading = SECTION_HEADING[selectedPersona ?? 'default'] ?? SECTION_HEADING.default

  return (
    <div className="w-full space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center pt-8 md:pt-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-sm font-mono uppercase tracking-widest text-primary mb-4">
            Prepare for the Quantum Era
          </p>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          The quantum era is <span className="text-gradient">here.</span>
          <br />
          <span className="text-muted-foreground text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal mt-2 block">
            Your transformation journey starts now.
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Quantum computers will break today's encryption. This free platform walks you from
          understanding the threat to deploying quantum-resistant cryptography — step by step.
        </motion.p>

        {/* PQC Explainer for non-experts */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2.3}
          className="mb-6"
        >
          <PQCExplainer />
        </motion.div>

        {/* Personalization Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2.5}
          className="mb-8"
        >
          <PersonalizationSection />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to={heroCta.primary.path} className="block sm:inline-block">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base">
              {heroCta.primary.label}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Link to={heroCta.secondary.path} className="block sm:inline-block">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              {heroCta.secondary.label}
            </Button>
          </Link>
          <AskAssistantButton
            variant="text"
            label="Ask the PQC Assistant"
            className="block sm:inline-block"
            question={
              selectedPersona === 'developer'
                ? 'How do I start integrating post-quantum cryptography into my applications?'
                : selectedPersona === 'architect'
                  ? 'What are the architectural considerations for migrating to post-quantum cryptography?'
                  : selectedPersona === 'executive'
                    ? 'What are the business risks and compliance deadlines for post-quantum cryptography?'
                    : selectedPersona === 'researcher'
                      ? 'What are the mathematical foundations of the NIST-standardized PQC algorithms?'
                      : selectedPersona === 'ops'
                        ? 'What are the best infrastructure tools and configurations for deploying post-quantum cryptography?'
                        : 'What should I know about post-quantum cryptography?'
            }
          />
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto"
        >
          {[
            {
              value: algorithmCount !== null ? String(algorithmCount) : '...',
              label: 'Algorithms',
            },
            {
              value: timelineEventCount !== null ? String(timelineEventCount) : '...',
              label: 'Timeline Events',
            },
            {
              value: libraryCount !== null ? String(libraryCount) : '...',
              label: 'Standards Tracked',
            },
            { value: String(MODULE_COUNT), label: 'Learning Modules' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Transparency Banner */}
      <TransparencyBanner />

      {/* Journey Section */}
      <section>
        {/* Persona-aware heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-10"
          variants={{ visible: { transition: { delayChildren: 0.3, staggerChildren: 0.1 } } }}
        >
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold mb-3">
            <span className="text-gradient">{heading.title}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">
            {heading.sub}
          </motion.p>
        </motion.div>

        {/* Guided workflow CTA — shown after assessment is complete */}
        {showWorkflowCta && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-6 flex justify-center"
          >
            <Button
              variant="outline"
              onClick={() => startWorkflow()}
              className="inline-flex items-center gap-2"
            >
              <Compass size={16} aria-hidden="true" />
              Start Guided Migration Planning
            </Button>
          </motion.div>
        )}

        {/* Journey Step Cards — grouped by section */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 0.5, staggerChildren: 0.07 } } }}
        >
          {JOURNEY_SECTIONS.map((section) => {
            const sectionSteps = journeySteps.filter((s) => s.section === section.id)
            if (sectionSteps.length === 0) return null
            return (
              <React.Fragment key={section.id}>
                <motion.div variants={fadeUp} className="col-span-full mt-6 first:mt-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      {section.title}
                    </h3>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <p className="text-xs text-muted-foreground/70 mb-3 max-w-lg">
                    {section.subtitle}
                  </p>
                </motion.div>
                {sectionSteps.map((step) => {
                  const accessible = isAccessible(step)
                  const recommended = isRecommendedStep(step)
                  const engagement = stepEngagement[step.id] ?? 'not-started'
                  const isStartHere = step.id === firstRecommendedUnvisited
                  return (
                    <motion.div
                      key={step.id}
                      variants={fadeUp}
                      className={`flex h-full ${accessible ? '' : 'opacity-40'}`}
                    >
                      <Link to={step.paths[0]} className="block w-full group">
                        <div className="glass-panel p-4 h-full border-border/50 hover:border-primary/30 transition-all duration-300 flex flex-col">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground w-4 underline underline-offset-4 decoration-primary/30">
                                {step.step}
                              </span>
                              <step.icon className={step.color} size={18} />
                            </div>
                            {isStartHere ? (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary border border-secondary/30 rounded px-1.5 py-0.5 shrink-0 bg-secondary/5 animate-pulse">
                                Start here
                              </span>
                            ) : engagement === 'engaged' ? (
                              <span className="text-[10px] font-mono text-status-success flex items-center gap-1">
                                <Check size={10} /> Explored
                              </span>
                            ) : engagement === 'started' ? (
                              <span className="text-[10px] font-mono text-status-warning flex items-center gap-1">
                                <ArrowRight size={10} /> In progress
                              </span>
                            ) : recommended ? (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0 bg-primary/5">
                                For you
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors tracking-tight">
                            {step.label}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-snug flex-1 line-clamp-3">
                            {step.description}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex flex-wrap gap-1">
                              {step.paths.map((p) => (
                                <span
                                  key={p}
                                  className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:underline underline-offset-2 flex items-center gap-0.5 shrink-0">
                              {engagement !== 'not-started' ? step.resumeLabel : step.actionLabel}
                              <ArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
                {section.nextHint && (
                  <motion.div
                    variants={fadeUp}
                    className="col-span-full hidden sm:flex justify-center py-2"
                  >
                    <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                      {section.nextHint}
                      <ArrowRight size={12} className="text-primary/50" />
                    </span>
                  </motion.div>
                )}
              </React.Fragment>
            )
          })}
        </motion.div>
      </section>

      {/* Progress Management */}
      <section className="pt-4">
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Save size={20} className="text-primary" />
          Backup &amp; Restore
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <motion.button
            type="button"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            aria-label="Export backup — download all progress and settings"
            className="glass-panel p-3 flex items-center gap-3 hover:border-primary/50 transition-colors text-left w-full"
            onClick={() => {
              try {
                UnifiedStorageService.downloadSnapshot()
              } catch (error) {
                console.error('Failed to export backup:', error)
                alert('Failed to export backup')
              }
            }}
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Save size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Export Backup</h4>
              <p className="text-xs text-muted-foreground leading-snug">
                Downloads all progress — modules, assessment, persona, quiz mastery, chat history,
                artifacts, and settings.
              </p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            aria-label="Import backup — restore from a previously exported backup file"
            className="glass-panel p-3 flex items-center gap-3 hover:border-secondary/50 transition-colors text-left w-full"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                try {
                  const snapshot = await UnifiedStorageService.importSnapshot(file)
                  UnifiedStorageService.restoreSnapshot(snapshot)
                  alert('Backup restored successfully. The page will now reload.')

                  // Reload to ensure all components pick up the newly restored state
                  setTimeout(() => window.location.reload(), 500)
                } catch (error) {
                  console.error('Failed to restore backup:', error)
                  alert(error instanceof Error ? error.message : 'Failed to restore backup')
                }
              }
              input.click()
            }}
          >
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
              <Upload size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Import Backup</h4>
              <p className="text-xs text-muted-foreground leading-snug">
                Restore from a previously exported backup file to resume all progress and settings.
              </p>
            </div>
          </motion.button>

          {/* Google Drive Cloud Sync */}
          {isConfigured && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {isSignedIn ? (
                <div className="glass-panel p-3 flex flex-col gap-2 h-full border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      {syncStatus === 'syncing' ? (
                        <Loader2 size={18} aria-hidden="true" className="animate-spin" />
                      ) : syncStatus === 'error' ? (
                        <CloudOff size={18} aria-hidden="true" className="text-status-error" />
                      ) : (
                        <Cloud size={18} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground">Google Drive Sync</h4>
                      <p className="text-xs text-muted-foreground leading-snug">Connected</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {syncStatus === 'syncing'
                      ? 'Syncing…'
                      : syncStatus === 'error'
                        ? 'Sync failed — will retry on next change'
                        : syncStatus === 'success' && lastSyncedAt
                          ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
                          : 'Auto-sync active — changes save to your Drive'}
                  </p>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={signOut}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto"
                  >
                    <LogOut size={12} aria-hidden="true" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={signIn}
                  className="glass-panel p-3 flex items-center gap-3 hover:border-primary/50 transition-colors text-left w-full h-full"
                  aria-label="Sign in with Google to sync progress to Google Drive"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Cloud size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                      Sync to Google Drive
                      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/30">
                        WIP
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-snug">
                      Auto-save progress across devices.
                    </p>
                  </div>
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
