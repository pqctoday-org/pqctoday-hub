// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Network, ArrowRight, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { handleTabListKeyDown } from '@/components/ui/tabs'
import type { ResolvedModuleManifest } from '@/components/PKILearning/manifest/types'
import { MODULE_TO_TRACK } from '@/components/PKILearning/moduleData'
import { ModuleFitStrip } from '@/components/Journey/ModuleFitStrip'
import { ModuleJourneyHeader } from '@/components/Journey/ModuleJourneyHeader'
import { ModuleCommentsMount } from '@/components/Journey/mountPoints'
// moduleRelations() is pure data/logic (no JSX) — src/components/Mobile may
// not import a desktop VIEW component (RelatedModulesPanel), so this renders
// its own mobile-styled list off the same computed relations instead of
// reusing that component. See eslint.config.js's no-restricted-imports rule.
import { moduleRelations } from '@/data/moduleRelations'
import { TOOL_TITLE_BY_ID } from '@/data/moduleToolLinks'
import { PERSONAS } from '@/data/learningPersonas'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MobileUnderstandingCheckCard } from '../MobileUnderstandingCheckCard'
import { MobilePersonaBlock } from '../MobilePersonaBlock'
import { mobileChip } from '../mobileTokens'
import { DESKTOP_ONLY_WORKSHOP_LABEL, useDesktopOnlyWorkshopEntries } from '../desktopOnlyWorkshop'
import { cn } from '@/lib/utils'

export interface MobileModuleShellProps {
  manifest: ResolvedModuleManifest
  title?: ReactNode
  description?: ReactNode
  /** Already-resolved Learn tab body — same real content desktop's Learn tab
   *  renders (glossary-wrapped the same way), computed once by the caller so
   *  this component doesn't need its own copy of ModuleShell's slot-resolution
   *  logic. */
  learnContent: ReactNode
  /** Wave B2 (2026-08-29) — the id of this module's phone-capable playground
   *  twin (`mobilePracticeTool` in moduleToolLinks.ts), or undefined when
   *  none exists / it's off the signed-off mobile shortlist. Resolved by the
   *  caller (ModuleShell) so this component stays free of the bundle-size
   *  concern that keeps that resolution a plain literal, not a live import. */
  practiceTool?: string
  /**
   * Wave D (2026-09-18): the module's real Workshop tab body, passed only for
   * modules on MOBILE_WORKSHOP_READY (src/data/mobileWorkshops.ts). When
   * present the screen gains a Learn / Workshop switch and the "switch to a
   * laptop" banner is not shown.
   */
  workshopContent?: ReactNode
  /** ModuleShell's active tab ('learn' | 'workshop' | …); drives the switch. */
  activeTab?: string
  onTabChange?: (tab: string) => void
  /** Wave C: opens the manifest's "Start here" workshop step (via ModuleShell's goToWorkshop). */
  onStartHere?: () => void
  /** The header duration as the desktop header shows it: the active learning path's own
   *  minutes, else the module's label. Falls back to the manifest's duration when absent. */
  durationLabel?: string
  /** False when the "Start here" step is not on the learner's active path (the desktop header
   *  hides it then too). Defaults to showing it. */
  showStartHere?: boolean
  /** WS-0 (2026-09-24): ModuleShell's LearnPathPicker, for manifests that
   *  declare learnPaths. Passed in as a node — this directory may not import
   *  desktop view components (eslint no-restricted-imports). */
  pathPicker?: ReactNode
  workshopSearchHref?: string
}

/**
 * Handoff screen 3 — Module detail (mobile chrome; the module's own Learn-tab
 * content renders as-is inside it). Confirmed decision, 2026-08-23: module
 * content has no structured per-section body text anywhere in this codebase
 * — every one of the ~59 modules hand-rolls its own React component for its
 * prose (confirmed by tracing HsmPqcIntroduction.tsx). A true "one section,
 * one screen" reader (the handoff's own screen 4) isn't buildable from real
 * data the way My Path was, so this reuses the SAME real learn-tab JSX each
 * module's index.tsx already supplies, in mobile-styled chrome around it —
 * real content, not mobile-optimized prose typography, stated rather than
 * silently claimed as a full mobile redesign.
 *
 * Deliberately narrower than the handoff spec in one more way, stated:
 * - No Learn/Workshop/Exercises/Tools tab strip yet — a single Learn view.
 *   Workshop/Exercises/Tools are interactive desktop-shaped components, a
 *   materially larger scope than the Learn tab's static prose; deferred, not
 *   dropped silently.
 *
 * Wave B1/B2 (2026-08-29): the in-prose "Start Workshop" button every
 * module's Learn content still renders (via ModuleShell's `api.goToWorkshop`)
 * used to be a dead click here — it targeted the desktop tab strip this
 * screen never mounts. `ModuleShell` now routes that same click to whichever
 * of the two real destinations below actually exists for THIS module, so it
 * is never a no-op:
 * - a phone-capable playground twin exists (`practiceTool` prop, B2's
 *   signed-off shortlist) → the click navigates there directly, and this
 *   screen also surfaces it as its own standing "Practice on your phone" card
 *   (not just a reaction to the in-prose click);
 * - no twin exists (most modules) → the click scrolls to and briefly
 *   highlights the honest banner below, instead of doing nothing.
 *
 * 2026-10-23 (owner decision D6, workshops are desktop-only on phones): where neither
 * destination exists (no ready workshop, no twin) every workshop entry point — the
 * "Open this step" button below, and the Learn content's own "Start Workshop" buttons and
 * `?tab=workshop` links (see ../desktopOnlyWorkshop.ts) — reads "Workshop: on a computer"
 * instead of being a button that does nothing. The reading content is untouched.
 *
 * There is no progress box on this screen. Reading progress lives on each section (the "Mark section as
 * read" control, SectionReadControl), the same as on a wide screen.
 */
export function MobileModuleShell({
  manifest,
  title,
  description,
  learnContent,
  practiceTool,
  workshopContent,
  activeTab,
  onTabChange,
  onStartHere,
  durationLabel,
  showStartHere = true,
  pathPicker,
  workshopSearchHref,
}: MobileModuleShellProps) {
  const showWorkshop = Boolean(workshopContent) && activeTab === 'workshop'
  const mobileViewId = useId()
  const learnPanelId = `${mobileViewId}-learn-panel`
  // A phone can open this module's workshop when it mounts here (workshopContent) or has a
  // phone-capable twin tool. Otherwise every workshop entry point says "on a computer".
  const workshopOnPhone = Boolean(workshopContent) || Boolean(practiceTool)
  const learnRef = useRef<HTMLDivElement>(null)
  useDesktopOnlyWorkshopEntries(learnRef, !workshopOnPhone, manifest.id)

  const track = MODULE_TO_TRACK[manifest.id]
  const persona = usePersonaStore((state) => state.selectedPersona)
  const { entries: relatedModules } = moduleRelations(
    manifest.id,
    undefined,
    persona ? PERSONAS[persona]?.recommendedPath : undefined
  )

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
      {workshopSearchHref && (
        <Link
          to={workshopSearchHref}
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          Back to workshop search
        </Link>
      )}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {track && <span className={mobileChip}>{track}</span>}
          {manifest.difficulty && <span className={mobileChip}>{manifest.difficulty}</span>}
          {manifest.duration && (
            <span className={mobileChip}>{durationLabel ?? manifest.duration}</span>
          )}
        </div>
        <h1 className="text-[19px] font-extrabold leading-tight text-foreground">
          {title ?? manifest.title}
        </h1>
        <ModuleFitStrip moduleId={manifest.id} />
        <div className="mt-3">
          <ModuleJourneyHeader moduleId={manifest.id} compact />
        </div>
        {(description ?? manifest.description) && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {description ?? manifest.description}
          </p>
        )}
        {manifest.whyThisMatters && (
          <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">
              Why this matters
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-foreground/90">
              {manifest.whyThisMatters}
            </p>
          </div>
        )}
        {/* Wave C (2026-09-18): "Start here" — same text as the desktop shell; the
            button goes through ModuleShell's goToWorkshop, which on a phone opens
            the real workshop when the module is on MOBILE_WORKSHOP_READY and the
            honest "not built for mobile yet" banner otherwise. */}
        {manifest.startHere && showStartHere && (
          <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">
              Start here
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-foreground/90">
              {manifest.startHere.text}
            </p>
            {onStartHere &&
              (workshopOnPhone ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onStartHere}
                  className="mt-2 h-7 border-primary/30 bg-primary/10 px-2.5 text-[11.5px] font-bold text-primary"
                >
                  Open this step
                </Button>
              ) : (
                <p className="mt-2 text-[11.5px] font-semibold text-muted-foreground">
                  {DESKTOP_ONLY_WORKSHOP_LABEL}
                </p>
              ))}
          </div>
        )}
        {/* Round 9, wave 2 — "For your role" (src/data/personaBlocks.ts), phone twin. */}
        <MobilePersonaBlock route={`/learn/${manifest.id}`} className="mt-2" />
      </div>

      {pathPicker}

      {workshopContent ? (
        <div
          role="tablist"
          aria-label="Module view"
          tabIndex={-1}
          onKeyDown={(event) => handleTabListKeyDown(event)}
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1"
        >
          {(['learn', 'workshop'] as const).map((tab) => {
            const selected = tab === 'workshop' ? showWorkshop : !showWorkshop
            return (
              <Button
                key={tab}
                type="button"
                variant="ghost"
                role="tab"
                id={`${mobileViewId}-${tab}-tab`}
                aria-selected={selected}
                aria-controls={
                  selected ? (tab === 'learn' ? learnPanelId : 'mobile-workshop') : undefined
                }
                tabIndex={selected ? 0 : -1}
                onClick={() => {
                  if (!selected) onTabChange?.(tab)
                }}
                className={cn(
                  'h-auto min-h-[44px] rounded-lg text-[13px] font-semibold transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {tab === 'learn' ? 'Learn' : 'Workshop'}
              </Button>
            )
          })}
        </div>
      ) : null}

      {showWorkshop ? (
        <div
          id="mobile-workshop"
          role="tabpanel"
          aria-labelledby={`${mobileViewId}-workshop-tab`}
          className="min-w-0"
        >
          {workshopContent}
        </div>
      ) : null}

      {practiceTool ? (
        <Link
          to={`/playground/${practiceTool}`}
          className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 transition-colors active:bg-primary/10"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12">
            <Wrench size={16} className="text-primary" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-bold uppercase tracking-wide text-primary">
              Practice on your phone
            </span>
            <span className="block text-[12.5px] font-medium text-foreground">
              {TOOL_TITLE_BY_ID.get(practiceTool) ?? practiceTool}
            </span>
          </span>
        </Link>
      ) : (
        !workshopContent &&
        manifest.workshopSteps &&
        manifest.workshopSteps.length > 0 && (
          <p
            id="mobile-workshop-banner"
            className="rounded-lg text-center text-[11px] text-muted-foreground transition-shadow"
          >
            This module&apos;s guided workshop isn&apos;t built for mobile yet — switch to a laptop
            to run it.
          </p>
        )
      )}

      {!showWorkshop && (
        <div
          ref={learnRef}
          id={workshopContent ? learnPanelId : undefined}
          role={workshopContent ? 'tabpanel' : undefined}
          aria-labelledby={workshopContent ? `${mobileViewId}-learn-tab` : undefined}
          className="text-[13px] leading-relaxed text-foreground [&_h2]:mt-4 [&_h2]:text-[15px] [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-[13.5px] [&_h3]:font-bold"
        >
          {learnContent}
        </div>
      )}
      <ModuleCommentsMount moduleId={manifest.id} />

      {/* Wave C2 (2026-08-29) — mirrors ModuleShell.tsx's desktop-only
          RelatedModulesPanel mount (WS22 Stage 3), rendered with mobile's own
          markup (see the moduleRelations import note above). Rendered
          unconditionally, same rationale as desktop: the point is to be
          found, not a reward for completion. */}
      {relatedModules.length > 0 && (
        <div
          className="rounded-xl border border-border bg-card p-3.5"
          data-testid="related-content"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <Network size={15} className="shrink-0 text-primary" aria-hidden="true" />
            <h2 className="text-[13px] font-semibold text-foreground">Related modules</h2>
          </div>
          <ul className="flex flex-col gap-2">
            {relatedModules.map((entry) => (
              <li key={entry.id}>
                <Link
                  to={`/learn/${entry.id}`}
                  className="flex items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-[12.5px] transition-colors active:bg-muted"
                >
                  <ArrowRight
                    size={13}
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{entry.title}</span>
                    {entry.reason ? (
                      <span className="block text-[10.5px] text-muted-foreground">
                        {entry.reason}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <MobileUnderstandingCheckCard moduleId={manifest.id} moduleTitle={manifest.title} />
    </div>
  )
}
