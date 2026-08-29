// SPDX-License-Identifier: GPL-3.0-only
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Circle, Network, ArrowRight, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { MODULE_TO_TRACK, LEARN_SECTIONS } from '@/components/PKILearning/moduleData'
// moduleRelations() is pure data/logic (no JSX) — src/components/Mobile may
// not import a desktop VIEW component (RelatedModulesPanel), so this renders
// its own mobile-styled list off the same computed relations instead of
// reusing that component. See eslint.config.js's no-restricted-imports rule.
import { moduleRelations } from '@/data/moduleRelations'
import { useModuleStore } from '@/store/useModuleStore'
import { MobileProgress } from '../primitives/Progress'
import { mobileChip } from '../mobileTokens'
import { cn } from '@/lib/utils'

export interface MobileModuleShellProps {
  manifest: ModuleManifest
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
 * The section checklist reuses toggleLearnSection — the same manual-toggle
 * semantics the desktop sidebar's LearnSectionChecklist uses, not
 * markLearnSectionRead's scroll-dwell auto-marking. A per-section chevron
 * that "opens the reader" would imply reliable per-section scroll anchors,
 * which don't exist consistently across modules (confirmed: only 3 of 7
 * sections in HsmPqcIntroduction carry a data-section-id at all) — a tap
 * toggling real read state is honest; a chevron to nowhere reliable is not.
 */
export function MobileModuleShell({
  manifest,
  title,
  description,
  learnContent,
  practiceTool,
}: MobileModuleShellProps) {
  const modules = useModuleStore((s) => s.modules)
  const toggleLearnSection = useModuleStore((s) => s.toggleLearnSection)

  const track = MODULE_TO_TRACK[manifest.id]
  const sections = LEARN_SECTIONS[manifest.id] ?? []
  const checks = modules[manifest.id]?.learnSectionChecks ?? {}
  const checkedCount = sections.filter((s) => checks[s.id]).length
  const { entries: relatedModules } = moduleRelations(manifest.id)

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {track && <span className={mobileChip}>{track}</span>}
          {manifest.difficulty && <span className={mobileChip}>{manifest.difficulty}</span>}
          {manifest.duration && <span className={mobileChip}>{manifest.duration}</span>}
          {manifest.lm_id && <span className={cn(mobileChip, 'font-mono')}>{manifest.lm_id}</span>}
        </div>
        <h1 className="text-[19px] font-extrabold leading-tight text-foreground">
          {title ?? manifest.title}
        </h1>
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
      </div>

      {sections.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5">
          <MobileProgress
            tone="success"
            value={(checkedCount / sections.length) * 100}
            label={`${checkedCount}/${sections.length} sections read`}
          />
          <ul className="mt-1 flex flex-col gap-1.5">
            {sections.map((section) => {
              const done = checks[section.id] ?? false
              return (
                <li key={section.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={done}
                    onClick={() => toggleLearnSection(manifest.id, section.id)}
                    className="h-11 w-full items-center justify-start gap-2.5 rounded-lg border border-border/60 px-2.5 text-left font-normal"
                  >
                    {done ? (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-success"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground',
                        done && 'text-muted-foreground line-through'
                      )}
                    >
                      {section.label}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="text-[13px] leading-relaxed text-foreground [&_h2]:mt-4 [&_h2]:text-[15px] [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-[13.5px] [&_h3]:font-bold">
        {learnContent}
      </div>

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
              This module has a workshop tool that works right here — try it now
            </span>
          </span>
        </Link>
      ) : (
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

      {/* Wave C2 (2026-08-29) — mirrors ModuleShell.tsx's desktop-only
          RelatedModulesPanel mount (WS22 Stage 3), rendered with mobile's own
          markup (see the moduleRelations import note above). Rendered
          unconditionally, same rationale as desktop: the point is to be
          found, not a reward for completion. */}
      {relatedModules.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3.5">
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
    </div>
  )
}
