// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Save, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import {
  ALGORITHM_COUNT_ESTIMATE,
  TIMELINE_EVENT_COUNT_ESTIMATE,
  LIBRARY_COUNT_ESTIMATE,
} from '@/data/landingCounts.generated'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useRoleBoardVariantStore } from '@/store/useRoleBoardVariantStore'
import { resolveRoleBoardVariant, RESEARCHER_FIELD_WATCH_VARIANT_ID } from '@/data/personaConfig'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useModuleStore } from '@/store/useModuleStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { ScoreCard } from './ScoreCard'
import { OnboardingCTAs } from './OnboardingCTAs'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { TransparencyBanner } from './TransparencyBanner'
import { ResumeBanner } from '@/components/common/ResumeBanner'
import { CuriousGuide } from '@/components/common/CuriousGuide'
import { logEvent, personaLabel } from '@/utils/analytics'
import { RoleHomeView } from '@/components/RoleHome/RoleHomeView'
import { PersonaBoardView } from '@/components/PersonaJourney/PersonaBoardView'
import { CuriousMobileBoard } from '@/components/PersonaJourney/CuriousMobileBoard'
import { ResearcherFieldWatchCard } from '@/components/PersonaJourney/ResearcherFieldWatchCard'
import { useIsBelowLgViewport } from '@/hooks/useIsBelowLgViewport'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileHomeBoard } from '@/components/Mobile/screens/MobileHomeBoard'
import { MobileRoleSelection } from '@/components/Mobile/shell/MobileRoleSelection'

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
    // eslint-disable-next-line security/detect-object-injection -- guarded by the hasOwnProperty check above
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ''
  )
}

const DEFAULT_HERO_CTA = {
  primary: { label: 'Start the Journey', path: '/learn' },
  secondary: { label: 'Explore the Timeline', path: '/timeline' },
}

/**
 * Progress export/import — collapsed by default, persona-independent.
 * Extracted so the persona-selected branch (persona-journeys A-grade
 * redesign, 2026-08-01) and the pre-redesign "Show me everything" branch
 * below don't hand-duplicate this ~80-line block.
 */
const BackupRestoreSection = () => (
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
              Restore from a previously exported backup file to resume all progress and settings.
            </p>
          </div>
        </motion.button>
      </div>
    </details>
  </section>
)

export const LandingView = () => {
  const {
    selectedPersona,
    selectedRegion,
    setPersona,
    hasSkippedPersonalization,
    skipPersonalization,
  } = usePersonaStore()
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)

  // Board-option selection. Precedence is `?variant=` over the persisted
  // choice, so a shared or bookmarked link always shows what the sender saw —
  // the reader's own stored preference must not silently rewrite someone
  // else's link. PersonaBoardView falls back to the role's order-1 board when
  // neither resolves to a real variant, which is what makes a stale stored id
  // or a hand-typed URL harmless.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedVariantByRole = useRoleBoardVariantStore((s) => s.selectedVariantByRole)
  const selectVariant = useRoleBoardVariantStore((s) => s.selectVariant)
  const urlVariant = searchParams.get('variant') ?? undefined
  const activeVariantId =
    urlVariant ??
    // eslint-disable-next-line security/detect-object-injection -- selectedPersona is the typed PersonaId union, not user input
    (selectedPersona ? selectedVariantByRole[selectedPersona] : undefined)

  const handleSelectVariant = (variantId: string) => {
    if (selectedPersona) selectVariant(selectedPersona, variantId)
    // Keep the URL honest about what is on screen, so copying the address bar
    // shares the board actually being read. `replace` — switching options is
    // not a navigation the back button should have to walk through.
    const next = new URLSearchParams(searchParams)
    next.set('variant', variantId)
    setSearchParams(next, { replace: true })
  }
  // Persona-journeys A-grade redesign (2026-08-01): Curious's mobile board is
  // a structurally different, standalone layout (own header/bottom-tab-bar —
  // see CuriousMobileBoard.tsx), not a responsive variant of PersonaBoardView.
  // `useIsBelowLgViewport` is the SAME breakpoint MainLayout.tsx's rail uses
  // (`hidden lg:flex` / `lg:hidden`) so the two components can never disagree
  // about which viewport width means "mobile" here — see the hook's own docs.
  const isBelowLg = useIsBelowLgViewport()
  const isMobileShell = useIsMobileShell()
  const [homeRoleSwitchOpen, setHomeRoleSwitchOpen] = useState(false)

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

  // Seeded from build-time estimates (src/data/landingCounts.generated.ts) so
  // the hero counters render a real number on first paint instead of '...' —
  // the async loads below still run and self-correct the count if it's ever
  // off; they're kept because they also derive nssDeadline/latestRfc below,
  // which genuinely do need the full datasets, not just a count.
  const [algorithmCount, setAlgorithmCount] = useState<number | null>(ALGORITHM_COUNT_ESTIMATE)
  const [timelineEventCount, setTimelineEventCount] = useState<number | null>(
    TIMELINE_EVENT_COUNT_ESTIMATE
  )
  const [libraryCount, setLibraryCount] = useState<number | null>(LIBRARY_COUNT_ESTIMATE)
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

  // Mobile UX layer (design_handoff_pqc_mobile_ux/IMPLEMENTATION-PLAN.md
  // Phase 4) — supersedes CuriousMobileBoard for ALL SIX personas, not just
  // curious. Placed before every branch below so it wins whenever the flag
  // is on; every branch below is completely unchanged for the flag-off path
  // (Rule 1). The first-run case (no persona, not skipped) returns null
  // here rather than <RoleHomeView> — MainLayout.tsx already renders that
  // exact component full-screen for isMobileShell + isMobileFirstRun, and
  // rendering it a second time here would mount two elements sharing
  // RoleHomeView's own "role-home-heading" id.
  //
  // CuriousMobileBoard's branch below is intentionally NOT deleted — only
  // made unreachable while the flag is on. Physical removal is Phase 11
  // (go-live cleanup), the same treatment Phase 3 gave the legacy mobile nav
  // row in MainLayout.tsx.
  if (isMobileShell) {
    if (!selectedPersona && !hasSkippedPersonalization) return null
    return (
      <>
        <MobileHomeBoard
          persona={selectedPersona}
          variantId={activeVariantId}
          onSelectVariant={handleSelectVariant}
          onOpenRoleSwitch={() => setHomeRoleSwitchOpen(true)}
        />
        <MobileRoleSelection
          variant="switch"
          open={homeRoleSwitchOpen}
          onClose={() => setHomeRoleSwitchOpen(false)}
        />
      </>
    )
  }

  // ── Persona-journeys A-grade redesign (2026-08-01) ─────────────────────────
  // Role Home is the new pre-personalization front door
  // (IMPLEMENTATION-PLAN-2026-08-01.md §3.2): shown exactly once, until the
  // user either picks a role or explicitly skips ("Show me everything" →
  // `skipPersonalization()`, which flips `hasSkippedPersonalization` so this
  // screen never returns for that user — see usePersonaStore's own doc
  // comment on that flag). The old Track → Role → Region → Industry wizard
  // (`PersonalizationSection`) has since been retired (2026-08-01 top-bar
  // pill follow-up) — Role Home replaced its Track/Role steps, and the top
  // bar's RegionIndustryPill (MainLayout.tsx) replaced its Region/Industry
  // steps.
  if (!selectedPersona && !hasSkippedPersonalization) {
    return <RoleHomeView onSelectPersona={setPersona} onSkip={skipPersonalization} />
  }

  // Curious · mobile (IMPLEMENTATION-PLAN-2026-08-01.md §3.4) — a standalone,
  // structurally simpler layout with its OWN header/bottom-tab-bar, not a
  // responsive variant of PersonaBoardView. Scoped to Curious + below-`lg`
  // only; MainLayout.tsx suppresses its own header chrome for this exact same
  // condition so the two never fight over the screen (see MainLayout.tsx's
  // `isCuriousMobileTakeover`).
  // Variant selection is passed through so mobile reaches every curious board,
  // not just order 1 (2026-08-09). It uses the SAME `activeVariantId` and
  // `handleSelectVariant` as the desktop board, so switching option on one
  // surface and resizing into the other keeps the same board on screen.
  if (selectedPersona === 'curious' && isBelowLg) {
    return <CuriousMobileBoard variantId={activeVariantId} onSelectVariant={handleSelectVariant} />
  }

  // A persona is selected (and we're not in the Curious-mobile case above) —
  // PersonaBoardView (§3.3) is the real per-persona experience now, replacing
  // the old generic hero/CTA-buttons/stats-bar block entirely (not stacked
  // alongside it). What stays, below the board, and why:
  //  - OnboardingCTAs: a genuinely distinct feature (video tour / browse
  //    workshops) the board skeleton doesn't cover.
  //  - ScoreCard: the learning-progress/belt-rank summary — genuinely
  //    separate from persona/region/industry selection (it tracks module
  //    completion, quiz mastery, and artifact generation, not profile
  //    fields). Previously rendered indirectly via PersonalizationSection's
  //    collapsed "avatar + ScoreCard" state; rendered directly now that
  //    PersonalizationSection (the Track→Role→Region→Industry wizard, plus
  //    its avatar/"Change persona" framing) has been retired — Role Home +
  //    the rail's role-switcher + the top bar's RegionIndustryPill fully
  //    replace what that wizard did. See the build report for the removal's
  //    full rationale, including the `?scroll=persona`/`?picker=open`
  //    "Update profile" deep-link CTAs (PQC101Module, AboutNextStepCTA),
  //    which now open the persona-switch modal via MainLayout instead.
  //  - TransparencyBanner / CuriousGuide / Backup & Restore: generic,
  //    persona-independent utility sections, unchanged from today.
  if (selectedPersona) {
    return (
      <div className="w-full space-y-16 md:space-y-24">
        {/* The persona-journeys redesign (PersonaBoardView, above) replaced the
            old generic hero, which is where ResumeBanner used to live — the
            redesign dropped it by omission, not by decision. Restored at the
            top: this is the most-visited state (picking a role is the
            encouraged path), so a returning visitor's "continue where I left
            off" affordance needs to survive scanning, not require scrolling
            past the whole board to find it. */}
        <ResumeBanner dismissKey="landing-persona-board" />

        <PersonaBoardView
          personaId={selectedPersona}
          variantId={activeVariantId}
          onSelectVariant={handleSelectVariant}
          customSideCard={
            selectedPersona === 'researcher' &&
            resolveRoleBoardVariant(selectedPersona, activeVariantId).id ===
              RESEARCHER_FIELD_WATCH_VARIANT_ID ? (
              <ResearcherFieldWatchCard />
            ) : undefined
          }
        />

        <OnboardingCTAs persona={selectedPersona} region={selectedRegion} />

        <ScoreCard />

        <TransparencyBanner />

        <CuriousGuide />

        <BackupRestoreSection />
      </div>
    )
  }

  // hasSkippedPersonalization === true && selectedPersona === null — "Show me
  // everything": identical to today's pre-redesign Landing, unfiltered.
  return (
    <div className="w-full space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center pt-8 md:pt-16">
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

        {/* Learning-progress summary — see the persona-selected branch above
            for why this renders ScoreCard directly rather than through the
            now-retired PersonalizationSection wizard. Region/industry/persona
            selection for this "show me everything" visitor now happens via
            the top bar's RegionIndustryPill and role-switcher (MainLayout),
            reachable from every route, not just here. */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2.5}
          className="mb-6"
        >
          <ScoreCard />
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
      <BackupRestoreSection />
    </div>
  )
}
