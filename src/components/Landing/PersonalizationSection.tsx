// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BookOpen,
  Briefcase,
  Car,
  Check,
  Code,
  Code2,
  Compass,
  Cpu,
  Database,
  Factory,
  Globe,
  Globe2,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Info,
  Landmark,
  Layers,
  Lightbulb,
  MapPin,
  Pencil,
  Plane,
  Radio,
  Server,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { Region, ExperienceLevel } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { PERSONAS, inferPersonaFromAssessment, type PersonaId } from '@/data/learningPersonas'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { PersonalizedAvatar } from './PersonalizedAvatar'
import { ScoreCard } from './ScoreCard'
import { useEmbedState } from '@/embed/EmbedProvider'
import { logPersonaSelected, logRegionSelected, logIndustrySelected } from '@/utils/analytics'

type ActiveModal = 'experience' | 'role' | 'region' | 'industry' | null

// ─── Static data ──────────────────────────────────────────────────────────────

const PERSONA_ORDER: PersonaId[] = [
  'curious',
  'executive',
  'developer',
  'architect',
  'ops',
  'researcher',
]

const PERSONA_ICONS = {
  Lightbulb,
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
} as const

const PERSONA_CORNER_ICONS: Record<PersonaId, LucideIcon> = {
  curious: HelpCircle,
  executive: User,
  developer: Code2,
  architect: Compass,
  ops: Wrench,
  researcher: Database,
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'Finance & Banking': Landmark,
  'Government & Defense': Shield,
  Healthcare: HeartPulse,
  Telecommunications: Radio,
  Technology: Cpu,
  'Energy & Utilities': Zap,
  Automotive: Car,
  Aerospace: Plane,
  'Retail & E-Commerce': ShoppingCart,
  Other: Layers,
}

const REGIONS: {
  id: Region
  label: string
  description: string
  Icon: LucideIcon
  cornerIcon: LucideIcon
}[] = [
  {
    id: 'global',
    label: 'Global',
    description: 'All regions, no filtering',
    Icon: Globe,
    cornerIcon: Globe2,
  },
  {
    id: 'americas',
    label: 'Americas',
    description: 'US/Canada, NIST & CISA focus',
    Icon: MapPin,
    cornerIcon: MapPin,
  },
  {
    id: 'eu',
    label: 'Europe',
    description: 'EU, ENISA/BSI/ANSSI standards',
    Icon: Landmark,
    cornerIcon: Compass,
  },
  {
    id: 'apac',
    label: 'APAC',
    description: 'Australia, Japan, Singapore & more',
    Icon: Sun,
    cornerIcon: Globe2,
  },
]

const EXPERIENCE_LEVELS: {
  id: ExperienceLevel
  label: string
  description: string
  Icon: LucideIcon
  cornerIcon: LucideIcon
}[] = [
  {
    id: 'curious',
    label: 'Curious',
    description: 'No technical background needed',
    Icon: Lightbulb,
    cornerIcon: HelpCircle,
  },
  {
    id: 'basics',
    label: 'Know the Basics',
    description: 'Familiar with concepts',
    Icon: GraduationCap,
    cornerIcon: Star,
  },
  {
    id: 'expert',
    label: 'Expert',
    description: 'Deep technical knowledge',
    Icon: Award,
    cornerIcon: Zap,
  },
]

// ─── SelectionCard ─────────────────────────────────────────────────────────────

interface SelectionCardProps {
  isActive: boolean
  onClick: () => void
  icon: React.ReactNode
  cornerIcon: React.ReactNode
  title: string
  description?: string
  badge?: React.ReactNode
}

const SelectionCard = ({
  isActive,
  onClick,
  icon,
  cornerIcon,
  title,
  description,
  badge,
}: SelectionCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    aria-pressed={isActive}
    className={`relative flex flex-col rounded-xl transition-all duration-200 cursor-pointer select-none p-3 min-h-[44px]
      ${
        isActive
          ? 'bg-primary/[0.08] border-2 border-primary shadow-sm'
          : 'bg-card border border-border hover:border-primary/50 hover:shadow-sm hover:bg-muted/30'
      }`}
  >
    {/* Checkmark badge when selected */}
    {isActive && (
      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
        <Check size={10} strokeWidth={3} className="text-primary-foreground" />
      </div>
    )}

    {/* Top row: primary icon + corner accent (hidden when selected — replaced by checkmark) */}
    <div className="flex items-start justify-between mb-2">
      <div
        className={`rounded-lg p-1.5 w-fit transition-colors ${isActive ? 'bg-primary/15' : 'bg-muted'}`}
      >
        <span className={isActive ? 'text-primary' : 'text-foreground'}>{icon}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {badge}
        {!isActive && <span className="text-muted-foreground/30">{cornerIcon}</span>}
      </div>
    </div>

    {/* Title */}
    <p
      className={`text-[11px] font-bold uppercase tracking-wider leading-tight mb-0.5 transition-colors ${
        isActive ? 'text-primary' : 'text-foreground'
      }`}
    >
      {title}
    </p>

    {/* Description */}
    {description && (
      <p
        className={`text-[10px] leading-tight ${isActive ? 'text-foreground/60' : 'text-muted-foreground'}`}
      >
        {description}
      </p>
    )}
  </div>
)

// ─── Modal content data ───────────────────────────────────────────────────────

const EXPERIENCE_HIGHLIGHTS: { level: string; Icon: LucideIcon; items: string[] }[] = [
  {
    level: 'Curious',
    Icon: Lightbulb,
    items: [
      'Jargon-free "In Simple Terms" summaries shown on every module',
      'Chat assistant explains everything in everyday language with analogies',
      'Technical workshop steps are hidden — only visual and conceptual activities shown',
    ],
  },
  {
    level: 'Know the Basics',
    Icon: GraduationCap,
    items: [
      'Learning paths skip introductory modules and go deeper',
      'Quiz difficulty includes intermediate algorithm and protocol questions',
      'Explore and Test steps are prominently featured',
    ],
  },
  {
    level: 'Expert',
    Icon: Award,
    items: [
      'Learning paths surface advanced modules (hybrid crypto, stateful sigs, QKD)',
      'Quiz difficulty includes deep-dive protocol and math questions',
      'All platform sections treated as equally accessible — no guidance guardrails',
    ],
  },
]

const ROLE_ADAPTATIONS: {
  id: PersonaId
  icon: LucideIcon
  color: string
  highlights: string[]
}[] = [
  {
    id: 'executive',
    icon: Briefcase,
    color: 'text-primary',
    highlights: [
      'Hero CTA leads to "Start the Journey" — shortcut to Risk Assessment',
      'Learn, Assess, Compliance, and Timeline steps are featured',
      'Headings and descriptions focus on governance, risk, and compliance deadlines',
    ],
  },
  {
    id: 'developer',
    icon: Code,
    color: 'text-secondary',
    highlights: [
      'Hero CTA leads to "Start the Journey" — shortcut to Playground',
      'Learn, Algorithms, Playground, and OpenSSL steps are featured',
      'Headings and descriptions focus on hands-on crypto operations and APIs',
    ],
  },
  {
    id: 'architect',
    icon: ShieldCheck,
    color: 'text-accent',
    highlights: [
      'Hero CTA leads to "Start the Journey" — shortcut to Timeline',
      'Learn, Timeline, Assess, and Compliance steps are featured',
      'Headings and descriptions focus on migration blueprints and system design',
    ],
  },
  {
    id: 'ops',
    icon: Server,
    color: 'text-secondary',
    highlights: [
      'Hero CTA leads to "Start the Journey" — shortcut to Migration Catalog',
      'Learn, Migrate, OpenSSL, and Assess steps are featured',
      'Headings and descriptions focus on infrastructure deployment and operations',
    ],
  },
  {
    id: 'researcher',
    icon: GraduationCap,
    color: 'text-primary',
    highlights: [
      'Hero CTA leads to "Start the Journey" — shortcut to Algorithms',
      'All sections fully accessible — no dimming applied',
      'Headings and descriptions focus on mathematical foundations and protocol detail',
    ],
  },
  {
    id: 'curious',
    icon: Lightbulb,
    color: 'text-accent',
    highlights: [
      'Hero CTA leads to "Start Learning" — beginning with PQC 101',
      'Learn, Timeline, Threats, and Assess steps are featured',
      'Everything explained in plain language — no technical jargon assumed',
    ],
  },
]

const REGION_HIGHLIGHTS: { region: string; items: string[] }[] = [
  {
    region: 'Americas',
    items: [
      'Compliance deadlines filtered to US/NIST, CISA, and OMB mandates',
      'Risk Assessment pre-filled with United States as country',
      'Timeline highlights CNSA 2.0 and NSA migration milestones',
    ],
  },
  {
    region: 'Europe',
    items: [
      'Compliance deadlines filtered to ENISA, BSI, ANSSI, and NIS2 frameworks',
      'Risk Assessment pre-filled with Germany as country',
      'Timeline highlights EU PQC directives and ETSI standards',
    ],
  },
  {
    region: 'APAC',
    items: [
      'Compliance deadlines filtered to regional standards bodies',
      'Risk Assessment pre-filled with Australia as country',
      'Timeline highlights ACSC and regional government migration milestones',
    ],
  },
  {
    region: 'Global',
    items: [
      'No regional filtering — all deadlines and standards shown',
      'Risk Assessment country left unset for manual selection',
      'Timeline shows all international milestones side by side',
    ],
  },
]

const INDUSTRY_HIGHLIGHTS: { feature: string; detail: string }[] = [
  {
    feature: 'Ramp Up — Compliance',
    detail:
      'Filters compliance frameworks to those that apply to your sector (e.g. HIPAA for Healthcare, PCI DSS for Finance & Banking)',
  },
  {
    feature: 'Risk Assessment',
    detail:
      'Pre-selects your industry in the wizard, surfacing sector-specific deadlines and migration priorities',
  },
  {
    feature: 'Stay Agile — Threat Landscape',
    detail: 'Highlights threat intelligence and incident data relevant to your industry vertical',
  },
  {
    feature: 'Journey step emphasis',
    detail: 'Steps most critical to your sector are visually highlighted in the journey rail below',
  },
]

// ─── Modal shell ──────────────────────────────────────────────────────────────

const InfoModal = ({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: React.ReactNode
}) => {
  const closeRef = useRef<HTMLButtonElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Save trigger element and focus close button on open
    prevFocusRef.current = document.activeElement as HTMLElement
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // Restore focus to trigger on close
      prevFocusRef.current?.focus()
    }
  }, [onClose])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
      />
      <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="glass-panel p-6 max-w-xl w-full max-h-[85dvh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 id="info-modal-title" className="text-xl font-bold">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <Button
              variant="ghost"
              ref={closeRef}
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X size={18} />
            </Button>
          </div>
          {children}
          <p className="mt-5 text-xs text-muted-foreground border-t border-border pt-4">
            Preferences are saved locally in your browser and can be cleared at any time.
          </p>
        </motion.div>
      </div>
    </>
  )
}

// ─── Modal content per section ────────────────────────────────────────────────

const ExperienceModalContent = () => (
  <div className="space-y-3">
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      How each level shapes the experience
    </p>
    {EXPERIENCE_HIGHLIGHTS.map(({ level, Icon, items }) => (
      <div key={level} className="glass-panel p-4 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} className="text-primary" />
          <span className="text-sm font-semibold">{level}</span>
        </div>
        <ul className="space-y-1">
          {items.map((h) => (
            <li key={h} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0">·</span>
              {h}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)

const RoleModalContent = () => (
  <div className="space-y-3">
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      How each role adapts the platform
    </p>
    {ROLE_ADAPTATIONS.map(({ id, icon: Icon, color, highlights }) => (
      <div key={id} className="glass-panel p-4 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} className={color} />
          <span className="text-sm font-semibold">{PERSONAS[id].label}</span>
          <span className="text-xs text-muted-foreground">— {PERSONAS[id].subtitle}</span>
        </div>
        <ul className="space-y-1">
          {highlights.map((h) => (
            <li key={h} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0">·</span>
              {h}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)

const RegionModalContent = () => (
  <div className="space-y-3">
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      How each region filters the platform
    </p>
    {REGION_HIGHLIGHTS.map(({ region, items }) => (
      <div key={region} className="glass-panel p-4 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={14} className="text-accent" />
          <span className="text-sm font-semibold">{region}</span>
        </div>
        <ul className="space-y-1">
          {items.map((h) => (
            <li key={h} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-accent mt-0.5 shrink-0">·</span>
              {h}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)

const IndustryModalContent = () => (
  <div className="space-y-3">
    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      How your industry selection is applied
    </p>
    {INDUSTRY_HIGHLIGHTS.map(({ feature, detail }) => (
      <div key={feature} className="glass-panel p-4 border-border/50">
        <div className="flex items-center gap-2 mb-1.5">
          <Factory size={14} className="text-secondary shrink-0" />
          <span className="text-sm font-semibold">{feature}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
      </div>
    ))}
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

export const PersonalizationSection = () => {
  const {
    selectedPersona,
    selectedRegion,
    selectedIndustries,
    suppressSuggestion,
    experienceLevel,
    setPersona,
    setRegion,
    setIndustries,
    setExperienceLevel,
    clearPreferences,
  } = usePersonaStore()
  const {
    setCountry,
    setIndustry: setAssessIndustry,
    assessmentStatus,
    editFromStep,
  } = useAssessmentStore()

  // Embed mode: restrict pickers to cert-allowed options
  const embedState = useEmbedState()
  const embedPersonas = embedState.isEmbedded ? (embedState.allowedPersonas ?? null) : null
  const embedRegions = embedState.isEmbedded ? (embedState.allowedRegions ?? null) : null
  const embedIndustries = embedState.isEmbedded ? (embedState.allowedIndustries ?? null) : null

  // Filtered options — in embed mode, restrict to cert-allowed values; otherwise full list
  const visiblePersonaOrder = embedPersonas
    ? PERSONA_ORDER.filter((id) => embedPersonas.includes(id))
    : PERSONA_ORDER
  const visibleRegions = embedRegions ? REGIONS.filter((r) => embedRegions.includes(r.id)) : REGIONS
  const visibleIndustries = embedIndustries
    ? AVAILABLE_INDUSTRIES.filter((ind) => embedIndustries.includes(ind))
    : AVAILABLE_INDUSTRIES

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const hasAnySelection =
    experienceLevel !== null ||
    selectedPersona !== null ||
    (selectedRegion !== null && selectedRegion !== 'global') ||
    selectedIndustries.length > 0

  // Start collapsed if returning visitor with saved prefs
  const [isCompleted, setIsCompleted] = useState(() => hasAnySelection)

  const location = useLocation()
  const navigate = useNavigate()

  // Handle ?scroll=persona deep-link from PQC-101 "Update profile" CTA
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('scroll') === 'persona') {
      setIsCompleted(false)
      setTimeout(() => {
        document.getElementById('personalization-heading')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)
      navigate('/', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const steps =
    selectedPersona === 'curious'
      ? [
          { id: 'experience', label: 'Experience' },
          { id: 'role', label: 'Role' },
        ]
      : [
          { id: 'experience', label: 'Experience' },
          { id: 'role', label: 'Role' },
          { id: 'region', label: 'Region' },
          { id: 'industry', label: 'Industry' },
        ]

  const suggestedPersona = inferPersonaFromAssessment({
    assessmentStatus,
    teamSize: useAssessmentStore.getState().teamSize,
    migrationStatus: useAssessmentStore.getState().migrationStatus,
    cryptoAgility: useAssessmentStore.getState().cryptoAgility,
    currentCrypto: useAssessmentStore.getState().currentCrypto,
    complianceRequirements: useAssessmentStore.getState().complianceRequirements,
    cryptoUseCases: useAssessmentStore.getState().cryptoUseCases,
    infrastructure: useAssessmentStore.getState().infrastructure,
  })

  const handlePersona = (id: PersonaId) => {
    const next = id === selectedPersona ? null : id
    setPersona(next)
    if (next) logPersonaSelected(next, embedState.isEmbedded ? 'embed' : 'picker')
    if (next === 'curious') {
      // Auto-set experience level, region (Global), and industry (All) — then complete wizard
      setExperienceLevel('curious')
      setRegion('global')
      setCountry('Global')
      setIndustries([])
      setAssessIndustry('')
      setIsCompleted(true)
    }
  }

  const handleRegion = (id: Region) => {
    const next = id === selectedRegion ? null : id
    setRegion(next)
    const country = next ? (REGION_COUNTRIES_MAP[next]?.[0] ?? null) : null
    setCountry(country ?? '')
    if (next) logRegionSelected(next)
    if (next && assessmentStatus === 'complete') editFromStep(0)
  }

  const handleIndustry = (industry: string) => {
    const next = selectedIndustries[0] === industry ? [] : [industry]
    setIndustries(next)
    setAssessIndustry(next[0] ?? '')
    if (next[0]) logIndustrySelected(next[0])
    if (assessmentStatus === 'complete') editFromStep(0)
  }

  const handleClear = () => {
    clearPreferences()
    setIsCompleted(false)
    setCurrentStep(0)
  }

  const handleDone = () => {
    setIsCompleted(true)
  }

  const handleEditAvatar = () => {
    setIsCompleted(false)
  }

  const MODAL_CONFIG: Record<
    NonNullable<ActiveModal>,
    { title: string; subtitle: string; content: React.ReactNode }
  > = {
    experience: {
      title: 'How Experience Level shapes your journey',
      subtitle:
        'Your experience level adjusts learning path recommendations, quiz difficulty, and how platform features are surfaced.',
      content: <ExperienceModalContent />,
    },
    role: {
      title: 'How Role shapes your experience',
      subtitle:
        'Selecting a role tailors the hero CTA, highlights relevant journey steps, and reframes section descriptions to match your perspective.',
      content: <RoleModalContent />,
    },
    region: {
      title: 'How Region filters the platform',
      subtitle:
        'Your region pre-fills the Risk Assessment, filters compliance deadlines to your jurisdiction, and highlights region-specific migration milestones.',
      content: <RegionModalContent />,
    },
    industry: {
      title: 'How Industry personalizes recommendations',
      subtitle:
        'Your industry filters applicable compliance frameworks, pre-selects your sector in the Risk Assessment, and surfaces relevant threat data.',
      content: <IndustryModalContent />,
    },
  }

  return (
    <section aria-labelledby="personalization-heading" className="glass-panel p-4 sm:p-6 lg:p-8">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 sm:gap-6">
          <div className="flex-1 min-w-0">
            <div className="relative mb-1">
              {hasAnySelection && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleClear}
                  className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                >
                  Clear all
                </Button>
              )}
              <h2
                id="personalization-heading"
                className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-left sm:text-center"
              >
                Personalize Your Experience
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCompleted
                ? 'Your profile is set. Click the avatar to edit.'
                : 'Tailor your experience by choosing your professional role.'}
            </p>
          </div>

          {/* Avatar — always in header row */}
          {!isCompleted && (
            <div className="shrink-0 w-24 sm:w-32 md:w-40">
              <PersonalizedAvatar
                persona={selectedPersona}
                experience={experienceLevel}
                region={selectedRegion}
                industries={selectedIndustries}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Completed: avatar tile + ScoreCard side by side ─────────────────── */}
      {isCompleted && (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mt-2">
          {/* Avatar tile — clickable */}
          <Button
            variant="ghost"
            onClick={handleEditAvatar}
            aria-label="Edit personalization settings"
            className="relative shrink-0 w-24 sm:w-32 md:w-40 rounded-2xl group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PersonalizedAvatar
              persona={selectedPersona}
              experience={experienceLevel}
              region={selectedRegion}
              industries={selectedIndustries}
            />
            <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
              <Pencil size={16} className="text-foreground" />
              <span className="text-foreground text-[10px] font-bold uppercase tracking-wide">
                Edit
              </span>
            </div>
          </Button>

          {/* ScoreCard — fills remaining width */}
          <div className="flex-1 min-w-0">
            <ScoreCard embedded />
          </div>
        </div>
      )}

      {/* ── Wizard (hidden when completed) ──────────────────────────────────── */}
      <AnimatePresence>
        {!isCompleted && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {/* Stepper Progress Indicator */}
              <div className="relative flex items-center justify-between w-full max-w-lg mx-auto mb-8 px-2">
                <div className="absolute left-[8%] right-[8%] top-4 -translate-y-1/2 h-0.5 bg-border rounded-full -z-10" />
                <div
                  className="absolute left-[8%] top-4 -translate-y-1/2 h-0.5 bg-primary rounded-full transition-all duration-500 -z-10"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 84}%` }}
                />
                {steps.map((step, index) => {
                  const isPast = index < currentStep
                  const isActive = index === currentStep
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-1.5">
                      <Button
                        variant="ghost"
                        onClick={() => index <= currentStep && setCurrentStep(index)}
                        disabled={index > currentStep}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all shadow-sm
                          ${
                            isActive
                              ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                              : isPast
                                ? 'bg-primary text-primary-foreground cursor-pointer hover:scale-105'
                                : 'bg-card text-muted-foreground border border-border cursor-default'
                          }`}
                        aria-current={isActive ? 'step' : undefined}
                        aria-label={`Step ${index + 1}: ${step.label}`}
                      >
                        {isPast ? <Check size={14} strokeWidth={3} /> : index + 1}
                      </Button>
                      <span
                        className={`text-[11px] uppercase tracking-wider font-bold transition-colors
                          ${isActive || isPast ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* STEP 0: Experience */}
                  {currentStep === 0 && (
                    <div className="w-full">
                      <div className="mb-4">
                        <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                          <BookOpen className="text-primary" size={16} />
                          Select Your Experience Level
                        </h3>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveModal('experience')}
                          className="text-xs text-muted-foreground hover:text-primary mt-0.5 inline-flex items-center gap-1 transition-colors"
                        >
                          <Info size={12} /> How does this reshape the platform?
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {EXPERIENCE_LEVELS.map(
                          ({ id, label, description, Icon, cornerIcon: CornerIcon }) => (
                            <SelectionCard
                              key={id}
                              isActive={experienceLevel === id}
                              onClick={() => setExperienceLevel(experienceLevel === id ? null : id)}
                              icon={<Icon size={16} />}
                              cornerIcon={<CornerIcon size={13} />}
                              title={label}
                              description={description}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 1: Role */}
                  {currentStep === 1 && (
                    <div className="w-full">
                      <div className="mb-4">
                        <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                          <Briefcase className="text-primary" size={16} />
                          Select Your Role
                        </h3>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveModal('role')}
                          className="text-xs text-muted-foreground hover:text-primary mt-0.5 inline-flex items-center gap-1 transition-colors"
                        >
                          <Info size={12} /> How does this adapt content?
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {visiblePersonaOrder.map((id) => {
                          const persona = PERSONAS[id]
                          const Icon = PERSONA_ICONS[persona.icon]
                          const CornerIcon = PERSONA_CORNER_ICONS[id]
                          const isActive = selectedPersona === id
                          const isSuggested = !suppressSuggestion && suggestedPersona === id
                          return (
                            <SelectionCard
                              key={id}
                              isActive={isActive}
                              onClick={() => handlePersona(id)}
                              icon={<Icon size={16} />}
                              cornerIcon={<CornerIcon size={13} />}
                              title={persona.label}
                              description={persona.subtitle}
                              badge={
                                isSuggested && !isActive ? (
                                  <span className="text-[9px] font-bold uppercase tracking-wide bg-secondary text-secondary-foreground px-1 py-0.5 rounded-full leading-none">
                                    For you
                                  </span>
                                ) : undefined
                              }
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Region */}
                  {currentStep === 2 && (
                    <div className="w-full">
                      <div className="mb-4">
                        <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                          <Globe className="text-primary" size={16} />
                          Select Your Continental Region
                        </h3>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveModal('region')}
                          className="text-xs text-muted-foreground hover:text-primary mt-0.5 inline-flex items-center gap-1 transition-colors"
                        >
                          <Info size={12} /> Why do we ask for this?
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {visibleRegions.map(
                          ({ id, label, description, Icon, cornerIcon: CornerIcon }) => (
                            <SelectionCard
                              key={id}
                              isActive={selectedRegion === id}
                              onClick={() => handleRegion(id)}
                              icon={<Icon size={16} />}
                              cornerIcon={<CornerIcon size={13} />}
                              title={label}
                              description={description}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Industry */}
                  {currentStep === 3 && (
                    <div className="w-full">
                      <div className="mb-4">
                        <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                          <Factory className="text-primary" size={16} />
                          Select Your Core Industry
                        </h3>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveModal('industry')}
                          className="text-xs text-muted-foreground hover:text-primary mt-0.5 inline-flex items-center gap-1 transition-colors"
                        >
                          <Info size={12} /> How do industry filters work?
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                        {!embedIndustries && (
                          <SelectionCard
                            isActive={selectedIndustries.length === 0}
                            onClick={() => {
                              setIndustries([])
                              setAssessIndustry('')
                            }}
                            icon={<Globe size={16} />}
                            cornerIcon={<Globe2 size={13} />}
                            title="All Industries"
                          />
                        )}
                        {visibleIndustries.map((industry) => {
                          const Icon = INDUSTRY_ICONS[industry] ?? Layers
                          return (
                            <SelectionCard
                              key={industry}
                              isActive={selectedIndustries.includes(industry)}
                              onClick={() => handleIndustry(industry)}
                              icon={<Icon size={16} />}
                              cornerIcon={<Icon size={13} />}
                              title={industry}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex items-center justify-center gap-3 pt-6 mt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="flex-1 sm:flex-none px-8 rounded-full font-bold border-border/60 hover:border-border hover:bg-muted/50"
                >
                  Back
                </Button>
                {currentStep === steps.length - 1 ? (
                  <Button
                    variant="gradient"
                    onClick={handleDone}
                    className="flex-1 sm:flex-none px-8 rounded-full font-bold shadow-sm"
                  >
                    Done
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                    className="flex-1 sm:flex-none px-8 rounded-full font-bold shadow-sm"
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info modals */}
      <AnimatePresence>
        {activeModal && (
          <InfoModal
            title={MODAL_CONFIG[activeModal].title}
            subtitle={MODAL_CONFIG[activeModal].subtitle}
            onClose={() => setActiveModal(null)}
          >
            {MODAL_CONFIG[activeModal].content}
          </InfoModal>
        )}
      </AnimatePresence>
    </section>
  )
}
