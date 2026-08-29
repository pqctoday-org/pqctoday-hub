// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * ModuleShell — the shared chrome every learn module copy-pastes today: the
 * gradient header, the ModuleTabBar, the data-driven Visual/References/Tools
 * tabs, and the workshop stepper (progress dots, step header, prev/next/
 * complete). Reproduced verbatim from the golden master (modules/HsmPqc) so a
 * module that adopts it renders identically.
 *
 * Module-specific content is supplied via slots:
 *  - `learn` / `exercises`: the tab bodies (Learn is glossary-wrapped here)
 *  - `workshopParts` + `renderWorkshopStep`: the workshop steps + their bodies
 *  - `children`: for `custom` modules (Quiz) that own their whole body
 *
 * Header text is a slot (`title`/`description`) defaulting to the manifest —
 * because a module's in-page header often differs from its catalog description.
 */
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import {
  Trash2,
  Gamepad2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ModuleTabBar } from './ModuleTabBar'
import { useEmbeddedLearn } from '../embeddedLearnContext'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { ModuleVisualTab } from './ModuleVisualTab'
import { ModuleReferencesTab } from './ModuleReferencesTab'
import { ModuleMigrateTab } from './ModuleMigrateTab'
import { WorkshopStepHeader } from './WorkshopStepHeader'
import { GlossaryAutoWrap } from './GlossaryAutoWrap'
import { useModuleProgress } from './useModuleProgress'
import { STANDARD_TABS, type ModuleManifest } from '../manifest/types'
import { QUIZ_CATEGORIES } from '../modules/Quiz/types'
import { MODULE_TO_TRACK, TRACK_COLORS, MODULE_TRACKS } from '../moduleData'
import { RelatedModulesPanel } from './RelatedModulesPanel'
import { resolveModuleTool, mobilePracticeTool } from '@/data/moduleToolLinks'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { personaPracticesModulePhase } from '@/data/personaConfig'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileModuleShell } from '@/components/Mobile/screens/MobileModuleShell'

/** "Phase 4 · Execute" style label for the header context rail (P2.1). Spanning
 *  modules (frameworkPhase is an array) show their first/primary phase. */
function phaseChipLabel(phase: PhaseId | PhaseId[]): string | null {
  const id = Array.isArray(phase) ? phase[0] : phase
  const p = FRAMEWORK_PHASES[id]
  if (!p) return null
  return p.number !== null ? `Phase ${p.number} · ${p.name}` : p.name
}

/** The sim deep-link target for a module — jumps the board to the phase this
 *  lesson teaches (?phase=), so "Practice in the Simulation" lands where it's
 *  relevant instead of the generic entry point. First phase wins for the few
 *  multi-phase modules (same choice phaseChipLabel makes). */
function simPracticeHref(phase: PhaseId | PhaseId[]): string {
  const id = Array.isArray(phase) ? phase[0] : phase
  return FRAMEWORK_PHASES[id] ? `/simulation?phase=${id}` : '/simulation'
}

const difficultyChip: Record<NonNullable<ModuleManifest['difficulty']>, string> = {
  beginner: 'bg-status-success/15 text-status-success',
  intermediate: 'bg-status-warning/15 text-status-warning',
  advanced: 'bg-status-error/15 text-status-error',
}

export interface WorkshopPart {
  id: string
  title: string
  description: string
  icon: LucideIcon
  /** optional CSWP.39 process badge rendered in the step header (default: none,
   *  so existing modules are unaffected) */
  cswp39Step?: string
}

/** Handlers the shell exposes to function slots so Learn/Exercises content can
 *  drive navigation owned by the shell's progress hook (the per-module
 *  onNavigateToWorkshop / onSetWorkshopConfig callbacks). */
export interface ModuleSlotApi {
  /** complete the current tab and jump to the Workshop tab, optionally landing
   *  on a specific step (the per-module onNavigateToWorkshop(step?) callback) */
  goToWorkshop: (step?: number) => void
  /** complete the current tab and jump to a named tab */
  goToTab: (tab: string) => void
  /** open the Workshop at a specific step (remounts the step body), optionally
   *  with a config object passed through to renderWorkshopStep — used to pre-fill
   *  the step from an exercise (the per-module onSetWorkshopConfig). */
  openWorkshopStep: (step: number, config?: Record<string, unknown>) => void
  /** run the same confirmed-reset the stepper's Reset button does (clears
   *  pre-fill config + fires onReset). For NON-stepper `workshop` slots that
   *  render their own Reset button (the stepper chrome is bypassed). */
  resetWorkshop: () => void
}

/** A tab body: a static node, or a function given the nav API. */
export type ModuleSlot = ReactNode | ((api: ModuleSlotApi) => ReactNode)

export interface ModuleShellProps {
  manifest: ModuleManifest
  /** header title; defaults to manifest.title */
  title?: ReactNode
  /** header description; defaults to manifest.description (often overridden) */
  description?: ReactNode
  /** Learn tab body (wrapped in GlossaryAutoWrap by the shell) */
  learn?: ModuleSlot
  /** Learn tab body rendered WITHOUT the shell's GlossaryAutoWrap — for modules
   *  whose Learn tab owns its own layout (e.g. an InPageToc two-column shell) and
   *  must glossary-wrap only part of it. Takes precedence over `learn`. */
  learnRaw?: ModuleSlot
  /** Visual tab body; defaults to the data-driven <ModuleVisualTab>. Override for
   *  modules that prepend a bespoke diagram before the standard visual. */
  visual?: ModuleSlot
  /** Exercises tab body */
  exercises?: ModuleSlot
  /**
   * Custom Workshop tab body — escape hatch for modules whose workshop is NOT a
   * stepper (e.g. DigitalAssets' chain-selector grid). When provided it renders
   * verbatim in the Workshop tab INSTEAD of the WorkshopStepper, so a
   * non-stepper workshop adopts the shared chrome without changing its render.
   * Mutually exclusive with workshopParts/renderWorkshopStep.
   */
  workshop?: ModuleSlot
  /** workshop stepper parts (omit for modules with no workshop) */
  workshopParts?: WorkshopPart[]
  /** renders the active workshop step body, keyed by configKey for remounts;
   *  `config` carries the optional pre-fill from openWorkshopStep; `goToStep`
   *  lets a step body advance the stepper (an in-step "Continue" button that
   *  marks the current step complete and moves forward — same semantics as the
   *  stepper's Next button). Existing modules ignore the extra arg. */
  renderWorkshopStep?: (
    index: number,
    configKey: number,
    config: Record<string, unknown> | undefined,
    goToStep: (step: number) => void
  ) => ReactNode
  /** Called when the workshop Reset is CONFIRMED (after the shell clears its
   *  pre-fill config). For modules that hold cross-TAB state in their own FC
   *  (above the shell, so it survives tab switches) which the original Reset
   *  cleared — e.g. an assessed risk register or selected jurisdictions. Does
   *  NOT fire if the user cancels the confirm. Omit it and nothing extra clears. */
  onReset?: () => void
  /** custom modules (Quiz) render their own body — no tabs */
  children?: ReactNode
}

interface WorkshopStepperProps {
  moduleId: string
  parts: WorkshopPart[]
  currentPart: number
  configKey: number
  onPartChange: (index: number) => void
  onReset: () => void
  onComplete: (stepId: string) => void
  renderStep: (index: number, configKey: number, goToStep: (step: number) => void) => ReactNode
}

function WorkshopStepper({
  moduleId,
  parts,
  currentPart,
  configKey,
  onPartChange,
  onReset,
  onComplete,
  renderStep,
}: WorkshopStepperProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset
        </Button>
      </div>

      <div className="overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-evenly relative min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
          {parts.map((part, idx) => {
            const Icon = part.icon
            return (
              <Button
                variant="ghost"
                key={part.id}
                onClick={() => onPartChange(idx)}
                aria-label={part.title}
                aria-current={idx === currentPart ? 'step' : undefined}
                className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${
                      idx === currentPart
                        ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                        : idx < currentPart
                          ? 'border-success text-success'
                          : 'border-border text-muted-foreground'
                    }`}
                >
                  <Icon size={16} />
                </div>
                <span className="block max-w-[68px] truncate text-[11px] font-medium leading-tight sm:max-w-none sm:text-sm">
                  {part.title.split(':')[0]}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
        <WorkshopStepHeader
          moduleId={moduleId}
          stepId={parts[currentPart].id}
          stepTitle={parts[currentPart].title}
          stepDescription={parts[currentPart].description}
          stepIndex={currentPart}
          totalSteps={parts.length}
          cswp39Step={parts[currentPart].cswp39Step}
          steps={parts.map((p) => ({ id: p.id, label: p.title }))}
          onStepClick={onPartChange}
        />
        {renderStep(currentPart, configKey, onPartChange)}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => onPartChange(Math.max(0, currentPart - 1))}
          disabled={currentPart === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
          data-workshop-target="learn-stepper-prev"
        >
          &larr; Previous Step
        </Button>
        {currentPart === parts.length - 1 ? (
          <Button
            variant="gradient"
            onClick={() => onComplete(parts[currentPart].id)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
            data-workshop-target="learn-stepper-complete"
          >
            Complete Module
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={() => onPartChange(currentPart + 1)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
            data-workshop-target="learn-stepper-next"
          >
            Next Step &rarr;
          </Button>
        )}
      </div>
    </div>
  )
}

export const ModuleShell = ({
  manifest,
  title,
  description,
  learn,
  learnRaw,
  visual,
  exercises,
  workshop,
  workshopParts,
  renderWorkshopStep,
  onReset,
  children,
}: ModuleShellProps) => {
  const isMobileShell = useIsMobileShell()
  const navigate = useNavigate()
  // Wave B1/B2 (2026-08-29) — the mobile shell's own real destination for the
  // in-prose "Start Workshop" CTA (see slotApi.goToWorkshop below and
  // MobileModuleShell's "Practice on your phone" card).
  const practiceTool = mobilePracticeTool(manifest)
  const parts = workshopParts ?? []
  const {
    activeTab,
    handleTabChange,
    navigateToTab,
    currentPart,
    setCurrentPart,
    configKey,
    bumpConfig,
    handlePartChange,
    handleReset,
    completeStep,
    workshopDot,
  } = useModuleProgress(manifest.id, {
    steps: parts.length ? parts : manifest.workshopSteps,
    // dot tracks the canonical workshopSteps (matches the golden master), even
    // if the UI parts are wired differently
    dotSteps: manifest.workshopSteps,
    resetLabel: `Restart ${manifest.title}?`,
  })

  // P2.2 — headline progress + track momentum, read from the same store the
  // catalog ModuleCard uses (workshop steps for workshop modules, else learn
  // sections). Hook must run before the `custom` early return below.
  const moduleStates = useModuleStore((s) => s.modules)

  // last config passed from an exercise (openWorkshopStep) — threaded to
  // renderWorkshopStep so a step can pre-fill itself (the old onSetWorkshopConfig)
  const [workshopConfig, setWorkshopConfig] = useState<Record<string, unknown> | undefined>(
    undefined
  )
  // The confirmed-reset handler, shared by the stepper's Reset button and the
  // slot API: clears the exercise pre-fill config and fires the module's
  // onReset, but only when the user confirms (handleReset owns the confirm()).
  const resetWorkshop = () =>
    handleReset(() => {
      setWorkshopConfig(undefined)
      onReset?.()
    })
  const slotApi: ModuleSlotApi = {
    goToWorkshop: (step) => {
      // Wave B1 (2026-08-29): MobileModuleShell never mounts a Workshop tab,
      // so navigateToTab('workshop') below is a dead click there — confirmed
      // on pqc-101/healthcare-pqc/the industry batch, every module whose
      // Learn content calls this. On mobile the shell owns the intent
      // instead: a real playground twin (B2's signed-off shortlist) if one
      // exists, else scroll to the honest "not built for mobile yet" banner
      // MobileModuleShell renders — never a no-op.
      if (isMobileShell) {
        if (practiceTool) {
          navigate(`/playground/${practiceTool}`)
        } else {
          document.getElementById('mobile-workshop-banner')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
        return
      }
      navigateToTab('workshop')
      // honor an optional target step; `typeof` guards against a stray event arg
      if (typeof step === 'number') setCurrentPart(step)
    },
    goToTab: navigateToTab,
    openWorkshopStep: (step, config) => {
      setCurrentPart(step)
      setWorkshopConfig(config)
      bumpConfig()
    },
    resetWorkshop,
  }
  const resolve = (slot: ModuleSlot | undefined): ReactNode =>
    typeof slot === 'function' ? slot(slotApi) : slot

  const headerDescription = description ?? manifest.description
  const embedded = useEmbeddedLearn()

  // P2.1 — context rail sourced from the manifest: ties the module to the same
  // track + framework-phase model the catalog and the simulation use.
  const track = MODULE_TO_TRACK[manifest.id]
  const phaseChip = phaseChipLabel(manifest.frameworkPhase)
  // The two chips are independent vocabularies that happen to collide: the
  // `foundations` framework phase is numberless, so it renders as bare
  // "Foundations" — the exact name of the Foundations track. Modules in both
  // showed FOUNDATIONS twice in a row. Numbered phases ("Phase 4 · Execute")
  // can never collide, so this drops nothing but the literal repeat.
  const phaseLabel =
    phaseChip && track && phaseChip.toLowerCase() === track.toLowerCase() ? null : phaseChip
  const chip = 'rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide'

  // "Back to Dashboard" used to sit on its own row above the module, rendered
  // by PKILearningView alongside a cluster of buttons the global top bar now
  // duplicates. That row is gone (2026-08-02); the back link lives here, on the
  // chip row, so the page opens on the module itself. Hidden in both embed
  // contexts for the same reason the old row was: neither the sim panel nor an
  // iframe embed has a Learn dashboard to go back to.
  const iframeEmbedded = useIsEmbedded()
  const showBackLink = !embedded && !iframeEmbedded

  // "Practice in the Simulation" is persona-aware: relevance depends on the
  // active profile, not the lesson's track. An exec practices the governance/
  // program phases; an architect/ops/dev practices the technical execution &
  // infrastructure phases (p5/p6) where TLS, HSM, 5G live (see
  // PERSONA_SIM_PRACTICE_PHASES). No persona / researcher / curious → broad.
  // Never shown when the module is itself embedded in the sim (a confusing loop).
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const showSimCta =
    !embedded && personaPracticesModulePhase(selectedPersona, manifest.frameworkPhase)

  // Module completion (drives the handoff footer); the dual learn/workshop
  // progress bars + track momentum render once in ModuleProgressHeader above.
  const here = moduleStates[manifest.id]

  // P2.3 — next module in this track (trackOrder), for the completion handoff.
  const nextInTrack = (() => {
    const entry = MODULE_TRACKS.find((t) => t.track === track)
    if (!entry) return null
    const idx = entry.modules.findIndex((m) => m.id === manifest.id)
    return idx >= 0 && idx < entry.modules.length - 1 ? entry.modules[idx + 1] : null
  })()
  // WS12 gap 3 (2026-08-21) — the module's own `playgroundTool` first, then the
  // reverse of any tool whose required `moduleLink` already points here. Three
  // modules (confidential-computing, iam-pqc, secure-boot-pqc) had a real tool
  // linking to them and rendered nothing back; no manifest edit closes it.
  const relatedTool = resolveModuleTool(manifest)
  const footerLink =
    'flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted'

  const header = (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        {/* Context rail (P2.1) — small mono-cased chips above a solid title.
            Gradient retired here so the active workshop step is the one hero. */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {showBackLink ? (
            <Link
              to="/learn"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Dashboard
            </Link>
          ) : null}
          {track ? (
            <span className={`${chip} ${TRACK_COLORS[track] ?? 'bg-muted text-muted-foreground'}`}>
              {track}
            </span>
          ) : null}
          {phaseLabel ? (
            <span className={`${chip} bg-status-info/15 text-status-info`}>{phaseLabel}</span>
          ) : null}
          {manifest.difficulty ? (
            <span className={`${chip} ${difficultyChip[manifest.difficulty]}`}>
              {manifest.difficulty}
            </span>
          ) : null}
          {manifest.duration ? (
            <span className={`${chip} bg-muted text-muted-foreground`}>{manifest.duration}</span>
          ) : null}
          {manifest.workInProgress ? (
            <span className={`${chip} bg-status-warning/15 text-status-warning`}>
              Work in progress
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold text-foreground">{title ?? manifest.title}</h1>
        {headerDescription ? (
          <p className="text-muted-foreground mt-2">{headerDescription}</p>
        ) : null}
        {/* "Why this matters" entry frame (P2.1) — rendered only when authored. */}
        {manifest.whyThisMatters ? (
          <p className="mt-3 border-l-2 border-primary pl-3 text-sm text-foreground/90">
            <span className="font-semibold">Why this matters: </span>
            {manifest.whyThisMatters}
          </p>
        ) : null}
      </div>
      {showSimCta ? (
        <Link
          to={simPracticeHref(manifest.frameworkPhase)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
        >
          <Gamepad2 size={16} />
          Practice in the Simulation
        </Link>
      ) : null}
    </div>
  )

  // Custom modules (Quiz) own their entire body; the hook still tracks time.
  if (manifest.custom) {
    return <div className="space-y-6">{children}</div>
  }

  if (isMobileShell) {
    const learnContent =
      learnRaw !== undefined ? (
        resolve(learnRaw)
      ) : (
        <GlossaryAutoWrap>{resolve(learn)}</GlossaryAutoWrap>
      )
    return (
      <MobileModuleShell
        manifest={manifest}
        title={title}
        description={headerDescription}
        learnContent={learnContent}
        practiceTool={practiceTool}
      />
    )
  }

  const tabs = manifest.tabs ?? STANDARD_TABS
  const present = new Set(tabs.map((t) => t.value))
  const barTabs = tabs.map((t) => (t.value === 'workshop' ? { ...t, hasDot: workshopDot } : t))

  return (
    <div className="space-y-6">
      {header}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ModuleTabBar tabs={barTabs} value={activeTab} onValueChange={handleTabChange} />

        {present.has('learn') && (
          <TabsContent value="learn">
            {learnRaw !== undefined ? (
              resolve(learnRaw)
            ) : (
              <GlossaryAutoWrap>{resolve(learn)}</GlossaryAutoWrap>
            )}
          </TabsContent>
        )}
        {present.has('visual') && (
          <TabsContent value="visual">
            {visual !== undefined ? resolve(visual) : <ModuleVisualTab moduleId={manifest.id} />}
          </TabsContent>
        )}
        {present.has('workshop') && workshop && (
          <TabsContent value="workshop">{resolve(workshop)}</TabsContent>
        )}
        {present.has('workshop') && !workshop && parts.length > 0 && renderWorkshopStep && (
          <TabsContent value="workshop">
            <WorkshopStepper
              moduleId={manifest.id}
              parts={parts}
              currentPart={currentPart}
              configKey={configKey}
              onPartChange={handlePartChange}
              onReset={resetWorkshop}
              onComplete={(stepId) => completeStep(stepId)}
              renderStep={(index, key, goToStep) =>
                renderWorkshopStep(index, key, workshopConfig, goToStep)
              }
            />
          </TabsContent>
        )}
        {present.has('exercises') && (
          <TabsContent value="exercises">{resolve(exercises)}</TabsContent>
        )}
        {present.has('references') && (
          <TabsContent value="references">
            <ModuleReferencesTab moduleId={manifest.id} />
          </TabsContent>
        )}
        {present.has('tools') && (
          <TabsContent value="tools">
            <ModuleMigrateTab moduleId={manifest.id} />
          </TabsContent>
        )}
      </Tabs>
      {/* WS22 Stage 3 (2026-08-21) — module→module relations, computed from the
          `track`/`frameworkPhase`/`taxonomy` tags the manifests already carry.
          Rendered unconditionally (not gated on completion) because the point
          is to be found, not to be a reward; hidden in both embed contexts for
          the same reason the back link is. See src/data/moduleRelations.ts. */}
      {!embedded && !iframeEmbedded ? <RelatedModulesPanel moduleId={manifest.id} /> : null}
      {/* P2.3 — completion handoff footer. Replaces the sidebar NextModuleCTA so
          finishing a module always routes somewhere, never a dead-end "Complete".
          The sim "Practice" CTA lives in the header (persistent, curated) so it is
          not duplicated here. */}
      {!embedded && here?.status === 'completed' ? (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 animate-fade-in">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0 text-status-success" />
            <span className="text-sm font-semibold text-foreground">
              Module complete — keep your momentum
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {nextInTrack ? (
              <Link to={`/learn/${nextInTrack.id}`} className={footerLink}>
                <ArrowRight size={15} className="shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    Next in {track}
                  </span>
                  <span className="block truncate font-medium text-foreground">
                    {nextInTrack.title}
                  </span>
                </span>
              </Link>
            ) : (
              <Link to="/learn" className={footerLink}>
                <ArrowRight size={15} className="shrink-0 text-primary" />
                <span className="font-medium text-foreground">Back to the Learning hub</span>
              </Link>
            )}
            {/* Quiz handoff. Until 2026-07-31 nothing in the app routed a
                learner from a finished module to its questions — the only
                /learn/quiz?category= links lived in the persona path view — so
                20 digital-id questions (and every other module's) were
                effectively unreachable from the module itself. Gated on the
                module id actually being a quiz category: 59 of 65 are, and the
                remaining 6 correctly get no CTA rather than a dead link. */}
            {(QUIZ_CATEGORIES as readonly string[]).includes(manifest.id) ? (
              <Link to={`/learn/quiz?category=${manifest.id}`} className={footerLink}>
                <GraduationCap size={15} className="shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    Check your understanding
                  </span>
                  <span className="block truncate font-medium text-foreground">
                    Take the {manifest.title} quiz
                  </span>
                </span>
              </Link>
            ) : null}
            {relatedTool ? (
              <Link to={`/playground/${relatedTool}`} className={footerLink}>
                <Wrench size={15} className="shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    Related tool
                  </span>
                  <span className="block truncate font-medium text-foreground">
                    Open in the Playground
                  </span>
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
