// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  Globe,
  AlertTriangle,
  Shield,
  BookOpen,
  ArrowRightLeft,
  FlaskConical,
  Activity,
  ShieldCheck,
  Users,
  Search,
  Lock,
  Cpu,
  MessageCircle,
} from 'lucide-react'

import { Button } from '../ui/button'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useDisclaimerStore, getAppMajorVersion } from '../../store/useDisclaimerStore'
import { PERSONA_NAV_PATHS, ALWAYS_VISIBLE_PATHS } from '../../data/personaConfig'

const TOUR_STORAGE_KEY = 'pqc-tour-completed'

type Phase = 'intro' | 'gate' | 'features'

interface Slide {
  icon: React.FC<{ size?: number; className?: string }>
  title: string
  description: string
  route?: string // displayed as a chip (feature cards only)
  essential?: boolean // show in the shortened "I know the basics" tour
  path?: string // used for persona filtering
}

// ── Phase 1: Why PQC? (educational) ─────────────────────────────────────────

const introSlides: Slide[] = [
  {
    icon: Lock,
    title: 'Everything runs on encryption',
    description:
      'Every bank transfer, medical record, government secret, and software update depends on encryption algorithms (RSA, ECC) designed decades ago.',
  },
  {
    icon: Cpu,
    title: 'Quantum computers change everything',
    description:
      'A powerful enough quantum computer could break these algorithms in hours. Some adversaries are already collecting encrypted data today to decrypt later \u2014 a strategy called \u201CHarvest Now, Decrypt Later.\u201D',
  },
  {
    icon: ShieldCheck,
    title: 'The solution exists \u2014 the race is on',
    description:
      'NIST published new quantum-resistant encryption standards in 2024. Governments are mandating migration by 2030\u20132035. This platform helps you understand the threat, assess your readiness, and plan your transition.',
  },
]

// ── Phase 2: Feature tour (centered cards, no nav highlighting) ───────────────

const featureSlides: Slide[] = [
  // — Start the Journey —
  {
    icon: GraduationCap,
    title: 'Learning Modules',
    description:
      '48 modules across 8 tracks \u2014 from \u201CWhat is PQC?\u201D to migration planning. Follow a guided path or explore at your own pace.',
    route: '/learn',
    path: '/learn',
    essential: true,
  },
  {
    icon: Globe,
    title: 'Migration Timeline',
    description:
      'See exactly when your country mandates quantum-resistant encryption, with every government deadline on one chart.',
    route: '/timeline',
    path: '/timeline',
    essential: true,
  },
  {
    icon: Shield,
    title: 'Algorithm Explorer',
    description:
      'Compare the new encryption algorithms replacing RSA and ECC by performance, security level, and adoption status.',
    route: '/algorithms',
    path: '/algorithms',
  },
  // — My Journey —
  {
    icon: ArrowRightLeft,
    title: 'Migrate Catalog',
    description:
      '220+ tools and products verified for PQC support, organized by the infrastructure layer you\u2019re upgrading.',
    route: '/migrate',
    path: '/migrate',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Tracker',
    description:
      'Track deadlines and requirements from FIPS, CNSA 2.0, ETSI, and 10+ frameworks in one filterable view.',
    route: '/compliance',
    path: '/compliance',
  },
  // — Assess & Report —
  {
    icon: ClipboardCheck,
    title: 'Risk Assessment',
    description:
      'Answer questions about your organization and get a personalized readiness score with concrete next steps.',
    route: '/assess',
    path: '/assess',
    essential: true,
  },
  {
    icon: FileBarChart,
    title: 'Readiness Report',
    description:
      'Review your personalized readiness report with risk scores, migration roadmap, and actionable recommendations.',
    route: '/report',
    path: '/report',
    essential: true,
  },
  {
    icon: FlaskConical,
    title: 'Crypto Playground',
    description:
      'Run real quantum-resistant key generation and encryption in your browser \u2014 no install, no setup.',
    route: '/playground',
    path: '/playground',
  },
  {
    icon: Activity,
    title: 'OpenSSL Studio',
    description:
      'Use OpenSSL WASM directly in your browser \u2014 generate certificates, test PQC algorithms, inspect key material.',
    route: '/openssl',
    path: '/openssl',
  },
  // — Keep Up to Date —
  {
    icon: AlertTriangle,
    title: 'Threat Landscape',
    description:
      'Understand which attacks are real now \u2014 including why data encrypted today is already at risk of future exposure.',
    route: '/threats',
    path: '/threats',
  },
  {
    icon: BookOpen,
    title: 'Standards Library',
    description:
      'Every NIST, IETF, and ETSI document driving the transition \u2014 searchable, filterable, always up to date.',
    route: '/library',
    path: '/library',
  },
  {
    icon: Users,
    title: 'Industry Leaders',
    description:
      'See which organizations are already deploying PQC \u2014 and what they\u2019ve shipped.',
    route: '/leaders',
    path: '/leaders',
  },
  // — Always available —
  {
    icon: MessageCircle,
    title: 'PQC Assistant',
    description:
      'Ask any question about quantum risk, algorithms, or migration — and get answers grounded in NIST standards and real-world guidance. Available on every page.',
    essential: true,
  },
  {
    icon: Search,
    title: 'Glossary',
    description: '170+ terms explained in plain English, one click away from anywhere in the app.',
    essential: true,
  },
]

// ── Shared card renderer ─────────────────────────────────────────────────────

const TourCard: React.FC<{
  slide: Slide
  slideIndex: number
  totalSlides: number
  onNext: () => void
  onPrev: () => void
  onDismiss: () => void
  isLastSlide: boolean
  lastLabel?: string
}> = ({
  slide,
  slideIndex,
  totalSlides,
  onNext,
  onPrev,
  onDismiss,
  isLastSlide,
  lastLabel = 'Done',
}) => {
  const Icon = slide.icon
  return (
    <motion.div
      key={slideIndex}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.x < -50) onNext()
        else if (info.offset.x > 50) onPrev()
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-6 w-full max-w-md shadow-2xl border-primary/30 pointer-events-auto cursor-grab active:cursor-grabbing"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
            <Icon size={22} />
          </div>
          {slide.route && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              {slide.route}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="min-h-[44px] min-w-[44px] shrink-0"
          aria-label="Dismiss tour"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Content */}
      <h3 className="font-bold text-foreground text-lg mb-2">{slide.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{slide.description}</p>

      {/* Dot indicators */}
      <div className="flex gap-1.5 justify-center mb-5">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${
              i === slideIndex ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs text-muted-foreground hover:text-foreground min-h-[44px]"
        >
          Skip
        </Button>
        <div className="flex items-center gap-1">
          {slideIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onNext}
            className="flex items-center gap-1 px-4 min-h-[44px] text-black font-bold"
          >
            {isLastSlide ? lastLabel : 'Next'}
            {!isLastSlide && <ChevronRight size={14} />}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export const GuidedTour: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [introStep, setIntroStep] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [essentialOnly, setEssentialOnly] = useState(false)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isDisclaimerDone = useDisclaimerStore(
    (s) => s.acknowledgedMajorVersion !== null && s.acknowledgedMajorVersion >= getAppMajorVersion()
  )

  // Filter feature slides to match what's accessible for this persona
  const visibleFeatures = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const personaPaths = selectedPersona ? PERSONA_NAV_PATHS[selectedPersona] : null
    const allVisible =
      personaPaths === null ? null : new Set([...ALWAYS_VISIBLE_PATHS, ...personaPaths])

    return featureSlides.filter((slide) => {
      if (allVisible && slide.path && !allVisible.has(slide.path)) return false
      if (essentialOnly && !slide.essential) return false
      return true
    })
  }, [selectedPersona, essentialOnly])

  useEffect(() => {
    // Don't start the tour until the disclaimer has been acknowledged
    if (!isDisclaimerDone) return

    const params = new URLSearchParams(window.location.search)
    let completed = false
    try {
      if (params.has('tour')) localStorage.removeItem(TOUR_STORAGE_KEY)
      completed = !!localStorage.getItem(TOUR_STORAGE_KEY)
    } catch {
      // localStorage unavailable
    }
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isDisclaimerDone])

  const dismiss = useCallback(() => {
    setIsActive(false)
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    if (isActive) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isActive, dismiss])

  // ── Intro navigation ────────────────────────────────────────────────────────

  const introNext = () => {
    if (introStep < introSlides.length - 1) {
      setIntroStep((s) => s + 1)
    } else {
      setPhase('gate')
    }
  }

  const introPrev = () => {
    if (introStep > 0) setIntroStep((s) => s - 1)
  }

  // ── Knowledge gate ──────────────────────────────────────────────────────────

  const handleGateChoice = (choice: 'learning' | 'basics' | 'expert') => {
    usePersonaStore.getState().setExperienceLevel(choice === 'learning' ? 'curious' : choice)
    if (choice === 'expert') {
      dismiss()
    } else {
      setEssentialOnly(choice === 'basics')
      setCurrentStep(0)
      setPhase('features')
    }
  }

  // ── Features navigation ─────────────────────────────────────────────────────

  const next = () => {
    if (currentStep < visibleFeatures.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      dismiss()
    }
  }

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  if (!isActive) return null

  // ── Shared layout helpers (inlined to avoid static-components lint error) ──

  const overlay = (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={dismiss} aria-hidden="true" />
  )

  const wrapCard = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-tour flex items-center justify-center p-6 pointer-events-none">
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </div>
  )

  // ── Phase: intro ───────────────────────────────────────────────────────────

  if (phase === 'intro') {
    // eslint-disable-next-line security/detect-object-injection
    const slide = introSlides[introStep]
    if (!slide) {
      setPhase('gate')
      return null
    }
    return (
      <div className="print:hidden">
        {overlay}
        {wrapCard(
          <TourCard
            slide={slide}
            slideIndex={introStep}
            totalSlides={introSlides.length}
            onNext={introNext}
            onPrev={introPrev}
            onDismiss={dismiss}
            isLastSlide={introStep === introSlides.length - 1}
            lastLabel="Next"
          />
        )}
      </div>
    )
  }

  // ── Phase: gate ────────────────────────────────────────────────────────────

  if (phase === 'gate') {
    return (
      <div className="print:hidden">
        {overlay}
        {wrapCard(
          <motion.div
            key="gate"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-panel p-6 w-full max-w-md shadow-2xl border-primary/30 pointer-events-auto"
          >
            <h3 className="font-bold text-foreground text-base mb-1">
              How familiar are you with quantum computing and cryptography?
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              This helps us tailor the tour to your level.
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    id: 'learning',
                    label: "I'm just learning",
                    sub: 'Show me everything this platform offers',
                  },
                  {
                    id: 'basics',
                    label: 'I know the basics',
                    sub: 'Just show me the key features',
                  },
                  {
                    id: 'expert',
                    label: "I'm an expert",
                    sub: "Skip the tour — I'll explore on my own",
                  },
                ] as const
              ).map(({ id, label, sub }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => handleGateChoice(id)}
                  className="w-full justify-start text-left px-4 py-3 h-auto rounded-lg hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="font-bold text-sm block">{label}</span>
                  <span className="text-xs text-muted-foreground">{sub}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // ── Phase: features ─────────────────────────────────────────────────────────

  if (visibleFeatures.length === 0) {
    dismiss()
    return null
  }
  // eslint-disable-next-line security/detect-object-injection
  const feature = visibleFeatures[currentStep]
  if (!feature) {
    dismiss()
    return null
  }

  return (
    <div className="print:hidden">
      {overlay}
      {wrapCard(
        <TourCard
          slide={feature}
          slideIndex={currentStep}
          totalSlides={visibleFeatures.length}
          onNext={next}
          onPrev={prev}
          onDismiss={dismiss}
          isLastSlide={currentStep === visibleFeatures.length - 1}
          lastLabel="Get Started"
        />
      )}
    </div>
  )
}
