// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  FlaskConical,
  Activity,
  GraduationCap,
  ShieldCheck,
  ArrowRightLeft,
  ArrowRight,
  ClipboardCheck,
  Save,
  Upload,
  Compass,
} from 'lucide-react'
import { Button } from '../ui/button'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { PERSONA_RECOMMENDED_PATHS, PERSONA_NAV_PATHS } from '@/data/personaConfig'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { PersonalizationSection } from './PersonalizationSection'
import { PQCExplainer } from './PQCExplainer'
import { AskAssistantButton } from '../ui/AskAssistantButton'

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
    primary: { label: 'Assess Your Risk', path: '/assess' },
    secondary: { label: 'View the Timeline', path: '/timeline' },
  },
  developer: {
    primary: { label: 'Try the Playground', path: '/playground' },
    secondary: { label: 'Explore Algorithms', path: '/algorithms' },
  },
  architect: {
    primary: { label: 'Explore the Timeline', path: '/timeline' },
    secondary: { label: 'Assess Your Risk', path: '/assess' },
  },
  researcher: {
    primary: { label: 'Explore Algorithms', path: '/algorithms' },
    secondary: { label: 'Try the Playground', path: '/playground' },
  },
  ops: {
    primary: { label: 'Explore Migration Catalog', path: '/migrate' },
    secondary: { label: 'Try OpenSSL Studio', path: '/openssl' },
  },
}

const DEFAULT_HERO_CTA = {
  primary: { label: 'Explore the Timeline', path: '/timeline' },
  secondary: { label: 'Try the Playground', path: '/playground' },
}

// Paths always visible regardless of persona
const ALWAYS_VISIBLE_PATHS = ['/learn', '/timeline', '/threats']

interface JourneyStep {
  id: string
  step: number
  label: string
  icon: React.ElementType
  description: string
  paths: string[]
  color: string
}

function buildJourneySteps(
  algorithmCount: number | null,
  migrateCount: number | null
): JourneyStep[] {
  const algoLabel = algorithmCount !== null ? `${algorithmCount}` : '40+'
  const migrateLabel = migrateCount !== null ? `${migrateCount}` : '220+'

  return [
    {
      id: 'learn',
      step: 1,
      label: 'Learn',
      icon: GraduationCap,
      color: 'text-secondary',
      description:
        'Start from zero or go deep — 27 hands-on modules covering the quantum threat, new encryption standards, and what your organization needs to do',
      paths: ['/learn'],
    },
    {
      id: 'assess',
      step: 2,
      label: 'Assess',
      icon: ClipboardCheck,
      color: 'text-primary',
      description:
        'Answer a few questions about your organization and get a personalized readiness score with concrete next steps',
      paths: ['/assess', '/report'],
    },
    {
      id: 'explore',
      step: 3,
      label: 'Explore',
      icon: Globe,
      color: 'text-accent',
      description: `See when governments require action, compare ${algoLabel} encryption algorithms, and browse the standards driving the transition`,
      paths: ['/timeline', '/algorithms', '/library'],
    },
    {
      id: 'test',
      step: 4,
      label: 'Test',
      icon: FlaskConical,
      color: 'text-secondary',
      description:
        'Generate quantum-resistant keys and test new encryption algorithms right in your browser — no setup required',
      paths: ['/playground', '/openssl'],
    },
    {
      id: 'deploy',
      step: 5,
      label: 'Deploy',
      icon: ArrowRightLeft,
      color: 'text-primary',
      description: `${migrateLabel} tested, production-ready tools for upgrading your infrastructure — from cloud services to hardware`,
      paths: ['/migrate'],
    },
    {
      id: 'ramp',
      step: 6,
      label: 'Ramp Up',
      icon: ShieldCheck,
      color: 'text-accent',
      description:
        'Track regulatory deadlines from 2024 to 2036 — know exactly when your industry must comply',
      paths: ['/compliance'],
    },
    {
      id: 'maintain',
      step: 7,
      label: 'Stay Agile',
      icon: Activity,
      color: 'text-primary',
      description:
        'Stay current on evolving threats by industry and see which organizations are leading the transition',
      paths: ['/threats', '/leaders'],
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
    sub: 'Real cryptographic operations powered by OpenSSL WASM and liboqs — not simulations.',
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
  default: {
    title: 'The complete platform for your PQC transformation',
    sub: 'Learn, assess, explore, test, and stay agile — every step of the journey, all in one place.',
  },
}

export const LandingView = () => {
  const { selectedPersona } = usePersonaStore()
  // eslint-disable-next-line security/detect-object-injection
  const recommendedPaths = selectedPersona ? PERSONA_RECOMMENDED_PATHS[selectedPersona] : []
  // eslint-disable-next-line security/detect-object-injection
  const heroCta = (selectedPersona && PERSONA_HERO_CTA[selectedPersona]) || DEFAULT_HERO_CTA
  const { workflowActive, startWorkflow } = useMigrationWorkflowStore()
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const showWorkflowCta = assessmentStatus === 'complete' && !workflowActive

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
    () => buildJourneySteps(algorithmCount, migrateCount),
    [algorithmCount, migrateCount]
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

  const heading = SECTION_HEADING[selectedPersona ?? 'default'] ?? SECTION_HEADING.default

  return (
    <div className="max-w-6xl mx-auto space-y-16 md:space-y-24">
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
          className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          The quantum era is <span className="text-gradient">here.</span>
          <br />
          <span className="text-muted-foreground text-2xl md:text-3xl lg:text-4xl font-normal mt-2 block">
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
          <Link to={heroCta.primary.path}>
            <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base">
              {heroCta.primary.label}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Link to={heroCta.secondary.path}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              {heroCta.secondary.label}
            </Button>
          </Link>
          <AskAssistantButton
            variant="text"
            label="Ask the PQC Assistant"
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
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
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

        {/* Journey Step Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 0.5, staggerChildren: 0.07 } } }}
        >
          {journeySteps.map((step) => {
            const accessible = isAccessible(step)
            const recommended = isRecommendedStep(step)
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
                      {recommended && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0 bg-primary/5">
                          For you
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors tracking-tight">
                      {step.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-snug flex-1">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {step.paths.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass-panel p-3 flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer"
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
              <Save size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Export Backup</h4>
              <p className="text-xs text-muted-foreground leading-snug">
                Downloads all progress — modules, assessment, persona, quiz mastery, chat history,
                artifacts, and settings.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass-panel p-3 flex items-center gap-3 hover:border-secondary/50 transition-colors cursor-pointer"
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
              <Upload size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Import Backup</h4>
              <p className="text-xs text-muted-foreground leading-snug">
                Restore from a previously exported backup file to resume all progress and settings.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
