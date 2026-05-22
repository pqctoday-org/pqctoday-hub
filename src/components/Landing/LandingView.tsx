// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Save, Upload, Cloud, CloudOff, Loader2, LogOut } from 'lucide-react'
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

// Persona-specific second-line urgency framing under the hero copy. Speaks to
// each role's natural worry: deadlines for execs, library choices for devs,
// hierarchy redesign for architects, evidence for researchers, fleet rotation
// for ops, and "what is this" for the curious.
export const PERSONA_HERO_TAGLINE: Record<string, string> = {
  executive:
    'Boards are asking now. CNSA 2.0 deadlines start landing in 2027 — get a defensible answer before the next audit cycle.',
  developer:
    'OpenSSL 3.x, BoringSSL, and JOSE are already shipping PQC. See the algorithms, test the libraries, and find the one that fits your stack.',
  architect:
    'Hybrid certs, composite signatures, and a 30 % key-size jump reshape every PKI. Map the redesign before it maps you.',
  researcher:
    'FIPS 203/204/205 are out, RFC 9964 just landed, and ACVP vectors are live. Trace the citations and KATs end-to-end.',
  ops: 'Cert rotations get longer, keys get bigger, HSMs get pickier. Plan the cutover before the next renewal window.',
  curious:
    "Nothing breaks today. But what runs the padlock icon will look very different in five years — here's the short version.",
}

const DEFAULT_HERO_CTA = {
  primary: { label: 'Start the Journey', path: '/learn' },
  secondary: { label: 'Explore the Timeline', path: '/timeline' },
}

export const LandingView = () => {
  const { selectedPersona, selectedRegion, setPersona } = usePersonaStore()
  const { signIn, signOut, isSignedIn, syncStatus, lastSyncedAt, isConfigured } = useGoogleAuth()
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

  useEffect(() => {
    loadPQCAlgorithmsData().then((data) => setAlgorithmCount(data.length))
    import('@/data/timelineData').then(({ timelineData }) => {
      setTimelineEventCount(timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length)
    })
    import('@/data/libraryData').then(({ libraryData }) => {
      setLibraryCount(libraryData.length)
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
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3"
        >
          Quantum computers will break today's encryption. This free platform walks you from
          understanding the threat to deploying quantum-resistant cryptography — step by step.
        </motion.p>

        {selectedPersona && PERSONA_HERO_TAGLINE[selectedPersona] && (
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2.2}
            className="text-base text-foreground/85 max-w-2xl mx-auto mb-8 font-medium"
          >
            {PERSONA_HERO_TAGLINE[selectedPersona]}
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

      {/* Curious-persona floating tour — auto-mounts on first Landing visit when
          persona is curious. Dismiss persists via usePersonaStore v7 migration. */}
      <CuriousGuide />

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
