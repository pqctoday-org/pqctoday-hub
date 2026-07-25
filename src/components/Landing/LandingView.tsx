// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Save, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useModuleStore } from '@/store/useModuleStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { PersonalizationSection } from './PersonalizationSection'
import { OnboardingCTAs } from './OnboardingCTAs'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { TransparencyBanner } from './TransparencyBanner'
import { PersonaChip } from '@/components/Persona/PersonaChip'
import { ResumeBanner } from '@/components/common/ResumeBanner'
import { CuriousGuide } from '@/components/common/CuriousGuide'
import { logEvent, personaLabel } from '@/utils/analytics'

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
    secondary: { label: 'Jump to Migration Workbench', path: '/migrate' },
  },
  curious: {
    primary: { label: 'Start Learning', path: '/learn' },
    secondary: { label: 'What Is the Quantum Threat?', path: '/learn/pqc-101' },
  },
}

// Persona-specific second-line urgency framing under the hero copy. Speaks to
// each role's natural worry: deadlines for execs, library choices for devs,
// hierarchy redesign for architects, evidence for researchers, fleet rotation
// for ops, and "what is this" for the curious.
//
// {{nssDeadline}} and {{latestRfc}} are placeholders resolved at render time
// from live timeline/library data (see NSS_DEADLINE_FALLBACK / LATEST_RFC_FALLBACK
// and the useEffect below) so these two facts can't silently age out the way a
// hand-dated string would — word-count/keyword tests below run against the raw
// template, not the substituted value.
export const PERSONA_HERO_TAGLINE: Record<string, string> = {
  executive:
    'Boards are asking now. CNSA 2.0 deadlines are already landing; {{nssDeadline}}. Get a defensible answer before the next audit cycle.',
  developer:
    'OpenSSL 3.x, BoringSSL, and JOSE are already shipping PQC. See the algorithms, test the libraries, and find the one that fits your stack.',
  architect:
    'Hybrid certs, composite signatures, and multi-fold key/signature growth reshape every PKI. Map the redesign before it maps you.',
  researcher:
    'FIPS 203/204/205 are out, {{latestRfc}}, and ACVP vectors are live. Trace the citations and KATs end-to-end.',
  ops: 'Cert rotations get longer, keys get bigger, HSMs get pickier. Plan the cutover before the next renewal window.',
  curious:
    "Nothing breaks today. But what runs the padlock icon will look very different in five years — here's the short version.",
}

// Rendered until the live derivation below resolves (and if it ever can't find
// a matching row) — both verified against their authoritative source as of
// this writing (NSA CSI CNSA 2.0 FAQ; RFC 9964 / RFC Editor).
const NSS_DEADLINE_FALLBACK = 'NSS acquisitions due January 2027'
const LATEST_RFC_FALLBACK = 'RFC 9964 just landed'

function resolveTagline(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ''
  )
}

const DEFAULT_HERO_CTA = {
  primary: { label: 'Start the Journey', path: '/learn' },
  secondary: { label: 'Explore the Timeline', path: '/timeline' },
}

export const LandingView = () => {
  const { selectedPersona, selectedRegion, setPersona } = usePersonaStore()
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)

  const moduleModules = useModuleStore((s) => s.modules)

  const hasLearningProgress = useMemo(
    () => Object.values(moduleModules).some((m) => m.status !== 'not-started'),
    [moduleModules]
  )

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
  const [nssDeadline, setNssDeadline] = useState(NSS_DEADLINE_FALLBACK)
  const [latestRfc, setLatestRfc] = useState(LATEST_RFC_FALLBACK)

  const heroTagline = useMemo(() => {
    if (!selectedPersona) return null
    // eslint-disable-next-line security/detect-object-injection
    const template = PERSONA_HERO_TAGLINE[selectedPersona]
    if (!template) return null
    return resolveTagline(template, { nssDeadline, latestRfc })
  }, [selectedPersona, nssDeadline, latestRfc])

  useEffect(() => {
    loadPQCAlgorithmsData().then((data) => setAlgorithmCount(data.length))
    import('@/data/timelineData').then(({ timelineData }) => {
      setTimelineEventCount(timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length)

      // The CSV loader buckets every NSA row (all CNSA 2.0 related) under a
      // synthetic "United States (CNSA)" country so they get their own Gantt
      // lane — see timelineData.ts. That means every event here is already
      // CNSA-scoped; no extra region/org filter is needed.
      const cnsaLane = timelineData.find((c) => c.countryName === 'United States (CNSA)')
      const deadlineEvents =
        cnsaLane?.bodies.flatMap((b) => b.events).filter((e) => e.phase === 'Deadline') ?? []
      const currentYear = new Date().getFullYear()
      const nextDeadline = deadlineEvents
        .filter((e) => e.endYear >= currentYear)
        .sort((a, b) => a.endYear - b.endYear)[0]
      if (nextDeadline) {
        setNssDeadline(`${nextDeadline.title} due ${nextDeadline.endYear}`)
      }
    })
    import('@/data/libraryData').then(({ libraryData }) => {
      setLibraryCount(libraryData.length)

      // Newest-by-publication-date RFC in the library, not gated on the 30-day
      // "New" recency badge — a badge window this narrow would make the tagline
      // fall back to generic text for most of a document's life, defeating the
      // point of deriving it live at all.
      const rfcItems = libraryData
        .map((item) => ({
          item,
          rfcNumber: /\bRFC[ -]?(\d{3,5})\b/i.exec(item.referenceId)?.[1] ?? null,
        }))
        .filter(
          (r): r is { item: (typeof libraryData)[number]; rfcNumber: string } => !!r.rfcNumber
        )
        .sort((a, b) => b.item.initialPublicationDate.localeCompare(a.item.initialPublicationDate))
      if (rfcItems[0]) {
        setLatestRfc(`RFC ${rfcItems[0].rfcNumber} just landed`)
      }
    })
  }, [])

  return (
    <div className="w-full space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center pt-8 md:pt-16">
        {selectedPersona && (
          <div className="flex justify-end mb-4 -mt-2">
            <PersonaChip />
          </div>
        )}

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-sm font-mono uppercase tracking-widest text-primary-legible mb-4">
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
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3"
        >
          Quantum computers will break today's encryption. This free platform walks you from
          understanding the threat to deploying quantum-resistant cryptography — step by step.
        </motion.p>

        {heroTagline && (
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2.2}
            className="text-base text-foreground/85 max-w-2xl mx-auto mb-8 font-medium"
          >
            {heroTagline}
          </motion.p>
        )}
        {!selectedPersona && <div className="mb-5" />}

        {/* Resume banner — shared component reused on Landing, Report, Business Center */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2.4}>
          <ResumeBanner dismissKey="landing-hero" />
        </motion.div>

        {/* Personalization Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2.5}
          className="mb-6"
        >
          <PersonalizationSection />
        </motion.div>

        {/* Onboarding CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2.8}
          className="mb-8"
        >
          <OnboardingCTAs persona={selectedPersona} region={selectedRegion} />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to={heroCta.primary.path}
            onClick={() =>
              logEvent('Landing', 'Hero CTA Primary', personaLabel(heroCta.primary.path))
            }
            className="block sm:inline-block"
          >
            <Button
              variant="gradient"
              size="lg"
              className="w-full sm:w-auto text-base"
              data-workshop-target="landing-cta-primary"
            >
              {heroCta.primary.label}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Link
            to={heroCta.secondary.path}
            onClick={() =>
              logEvent('Landing', 'Hero CTA Secondary', personaLabel(heroCta.secondary.path))
            }
            className="block sm:inline-block"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base"
              data-workshop-target="landing-cta-secondary"
            >
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

        {/* Switch role hint — visible only when a persona is active */}
        {selectedPersona && (
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3.5}
            className="mt-3 text-xs text-muted-foreground/60 text-center"
          >
            Viewing as {selectedPersona.charAt(0).toUpperCase() + selectedPersona.slice(1)} ·{' '}
            <Button
              variant="link"
              className="text-xs h-auto p-0 text-muted-foreground/60 hover:text-primary"
              onClick={() => setPersona(null)}
            >
              Switch role
            </Button>
          </motion.p>
        )}

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
              label: 'Library Documents',
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

      {/* Curious-persona floating tour — auto-mounts on first Landing visit when
          persona is curious. Dismiss persists via usePersonaStore v7 migration. */}
      <CuriousGuide />

      {/* Progress Management — collapsed by default so housekeeping does not compete
          with the hero/personalization content; the export/import feature is retained. */}
      <section className="pt-4">
        <details className="group">
          <summary className="text-lg font-bold text-foreground mb-3 flex items-center gap-2 cursor-pointer list-none select-none">
            <Save size={20} className="text-primary" />
            Backup &amp; Restore progress
            <span className="text-xs font-normal text-muted-foreground ml-1 group-open:hidden">
              — export or import your saved progress
            </span>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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
                  toast.error('Failed to export backup')
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
                    toast.success('Backup restored successfully. The page will now reload.')
                    setTimeout(() => window.location.reload(), 500)
                  } catch (error) {
                    console.error('Failed to restore backup:', error)
                    toast.error(error instanceof Error ? error.message : 'Failed to restore backup')
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
                  Restore from a previously exported backup file to resume all progress and
                  settings.
                </p>
              </div>
            </motion.button>
          </div>
        </details>
      </section>
    </div>
  )
}
