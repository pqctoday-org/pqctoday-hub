// SPDX-License-Identifier: GPL-3.0-only
import type { ReactNode } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { MODULE_TO_TRACK, LEARN_SECTIONS } from '@/components/PKILearning/moduleData'
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
 * Deliberately narrower than the handoff spec in two more ways, both stated:
 * - No Learn/Workshop/Exercises/Tools tab strip yet — a single Learn view.
 *   Workshop/Exercises/Tools are interactive desktop-shaped components, a
 *   materially larger scope than the Learn tab's static prose; deferred, not
 *   dropped silently.
 * - No "Start workshop" CTA. The handoff's own guided workshop is a DOCK over
 *   real pages (Phase 6, not yet built), not a tab on this screen — a button
 *   with nowhere real to send the user would be exactly the "looks
 *   interactive, does nothing" defect the handoff calls out as a shipped
 *   defect elsewhere. Left off until the dock exists, with a stated note.
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
}: MobileModuleShellProps) {
  const modules = useModuleStore((s) => s.modules)
  const toggleLearnSection = useModuleStore((s) => s.toggleLearnSection)

  const track = MODULE_TO_TRACK[manifest.id]
  const sections = LEARN_SECTIONS[manifest.id] ?? []
  const checks = modules[manifest.id]?.learnSectionChecks ?? {}
  const checkedCount = sections.filter((s) => checks[s.id]).length

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
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

      {manifest.workshopSteps && manifest.workshopSteps.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground">
          This module&apos;s guided workshop isn&apos;t built for mobile yet — switch to a laptop to
          run it.
        </p>
      )}
    </div>
  )
}
