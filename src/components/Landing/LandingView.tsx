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
} from 'lucide-react'
import { Button } from '../ui/button'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_RECOMMENDED_PATHS, PERSONA_NAV_PATHS } from '@/data/personaConfig'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { PersonalizationSection } from './PersonalizationSection'
import { ScoreCard } from './ScoreCard'

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

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'learn',
    step: 1,
    label: 'Learn',
    icon: GraduationCap,
    color: 'text-secondary',
    description:
      '25 interactive modules across 6 tracks + 470-question quiz — from PQC fundamentals to executive decision-making',
    paths: ['/learn'],
  },
  {
    id: 'assess',
    step: 2,
    label: 'Assess',
    icon: ClipboardCheck,
    color: 'text-primary',
    description:
      '13-step quantum risk wizard — crypto inventory, sensitivity, compliance gaps, and personalized risk score',
    paths: ['/assess', '/report'],
  },
  {
    id: 'explore',
    step: 3,
    label: 'Explore',
    icon: Globe,
    color: 'text-accent',
    description:
      'Migration timelines, 40+ algorithm comparisons, and a standards library of PQC drafts and specs',
    paths: ['/timeline', '/algorithms', '/library'],
  },
  {
    id: 'test',
    step: 4,
    label: 'Test',
    icon: FlaskConical,
    color: 'text-secondary',
    description:
      'Real in-browser PQC operations — key generation, encapsulation, and signing via Playground and OpenSSL Studio',
    paths: ['/playground', '/openssl'],
  },
  {
    id: 'deploy',
    step: 5,
    label: 'Deploy',
    icon: ArrowRightLeft,
    color: 'text-primary',
    description:
      '220+ verified PQC-ready tools across 7 infrastructure layers — from cloud KMS to hardware security modules',
    paths: ['/migrate'],
  },
  {
    id: 'ramp',
    step: 6,
    label: 'Ramp Up',
    icon: ShieldCheck,
    color: 'text-accent',
    description:
      'Track compliance deadlines from 2024 to 2036 — FIPS, CNSA 2.0, ETSI, and more with persona-aware filtering',
    paths: ['/compliance'],
  },
  {
    id: 'maintain',
    step: 7,
    label: 'Stay Agile',
    icon: Activity,
    color: 'text-primary',
    description:
      'Monitor quantum threat evolution by industry and track organizations leading the PQC transition',
    paths: ['/threats', '/leaders'],
  },
]

const SECTION_HEADING: Record<string, { title: string; sub: string }> = {
  executive: {
    title: 'Your roadmap to organizational PQC readiness',
    sub: 'Risk assessment, compliance tracking, and migration planning — built for decision makers.',
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

  const [algorithmCount, setAlgorithmCount] = useState<number | null>(null)
  const [timelineEventCount, setTimelineEventCount] = useState<number | null>(null)
  const [libraryCount, setLibraryCount] = useState<number | null>(null)

  useEffect(() => {
    loadPQCAlgorithmsData().then((data) => setAlgorithmCount(data.length))
    import('@/data/timelineData').then(({ timelineData }) => {
      setTimelineEventCount(timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length)
    })
    import('@/data/libraryData').then(({ libraryData }) => {
      setLibraryCount(libraryData.length)
    })
  }, [])

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
            Your PQC Transformation
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
          Explore global migration timelines, test real PQC algorithms in your browser, assess your
          risk, and get instant answers from our AI assistant — all from a single open-source
          platform.
        </motion.p>

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
              <div className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Personalization Section */}
      <PersonalizationSection />

      {/* Learning Journey Scorecard */}
      <ScoreCard />

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

        {/* Step Rail */}
        <div className="relative mb-8">
          <div className="flex items-start justify-between overflow-x-auto pb-2 gap-1">
            {JOURNEY_STEPS.map((step, idx) => {
              const accessible = isAccessible(step)
              const recommended = isRecommendedStep(step)
              return (
                <div key={step.id} className="flex items-start flex-1 min-w-0">
                  <div
                    className={`flex flex-col items-center flex-shrink-0 transition-opacity ${accessible ? 'opacity-100' : 'opacity-35'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                        accessible
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.step}
                    </div>
                    <span className="text-[11px] mt-1 text-muted-foreground font-medium whitespace-nowrap">
                      {step.label}
                    </span>
                    {recommended && (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1 py-0.5 mt-0.5">
                        For you
                      </span>
                    )}
                  </div>
                  {idx < JOURNEY_STEPS.length - 1 && (
                    <div className="h-0.5 flex-1 min-w-[8px] mx-1 sm:mx-2 bg-border mt-4" />
                  )}
                </div>
              )
            })}
          </div>
          {/* Right-edge fade — visual affordance that rail can scroll on narrow viewports */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Journey Step Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 0.5, staggerChildren: 0.07 } } }}
        >
          {JOURNEY_STEPS.map((step) => {
            const accessible = isAccessible(step)
            const recommended = isRecommendedStep(step)
            return (
              <motion.div
                key={step.id}
                variants={fadeUp}
                className={accessible ? '' : 'opacity-40'}
              >
                <Link to={step.paths[0]} className="block h-full">
                  <div className="glass-panel p-6 h-full hover:border-primary/30 transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-4">
                          {step.step}
                        </span>
                        <step.icon className={step.color} size={24} />
                      </div>
                      {recommended && (
                        <span className="text-xs font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0">
                          For you
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
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

      {/* CTA */}
      <section className="text-center pb-8">
        <motion.div
          initial="hidden"
          animate="visible"
          className="glass-panel p-8 md:p-12"
          variants={{ visible: { transition: { delayChildren: 0.9, staggerChildren: 0.1 } } }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-bold mb-4">
            Open source. <span className="text-gradient">Free forever.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-muted-foreground max-w-lg mx-auto mb-6"
          >
            PQC Today is GPL-3.0 licensed. Contribute on GitHub, report issues, or just start
            learning.
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/learn">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                Start Learning
                <GraduationCap className="ml-2" size={18} />
              </Button>
            </Link>
            <a
              href="https://github.com/pqctoday/pqc-timeline-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View on GitHub
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
