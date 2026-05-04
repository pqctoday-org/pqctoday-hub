// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { LEARN_SECTIONS } from './moduleData'
import { Button } from '@/components/ui/button'

export interface LearnStep {
  /** Section id matching `LEARN_SECTIONS[moduleId][i].id`. Used as the
   *  `data-section-id` anchor for workshop scroll-to cues and as the
   *  IntersectionObserver tracking key for completion. */
  id: string
  label: string
  content: React.ReactNode
}

interface LearnStepperProps {
  steps: LearnStep[]
}

/**
 * All-DOM section renderer with a sticky table-of-contents.
 *
 * Replaces the prior step-at-a-time stepper. Every section now mounts
 * simultaneously inside a `<section data-section-id="...">` block so:
 *  - Workshop `scroll-to [data-section-id="X"]` cues land deterministically
 *  - Browser Cmd-F searches the whole module
 *  - URL hash anchors (`/learn/x#section-id`) deep-link to the section
 *  - Screen readers can navigate continuously
 *
 * Section completion is tracked via IntersectionObserver — when 50% of a
 * section is visible, it gets marked read (idempotent set; never unsets).
 * Users can still toggle sections from the LearnSectionChecklist sidebar.
 */
export const LearnStepper = ({ steps }: LearnStepperProps) => {
  const location = useLocation()
  const moduleId = location.pathname.replace(/^\/learn\/?/, '') || undefined
  const modules = useModuleStore((s) => s.modules)
  const markLearnSectionRead = useModuleStore((s) => s.markLearnSectionRead)
  const markAllLearnSectionsComplete = useModuleStore((s) => s.markAllLearnSectionsComplete)

  const sections = moduleId ? (LEARN_SECTIONS[moduleId] ?? []) : []
  const checks = modules[moduleId ?? '']?.learnSectionChecks ?? {}
  const allDone = sections.length > 0 && sections.every((s) => checks[s.id])

  // IntersectionObserver: mark a section read once it crosses 50% viewport.
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  useEffect(() => {
    if (!moduleId) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = (entry.target as HTMLElement).dataset.sectionId
            if (id) markLearnSectionRead(moduleId, id)
          }
        }
      },
      { threshold: [0.5] }
    )
    for (const el of sectionRefs.current.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [moduleId, markLearnSectionRead, steps.length])

  const scrollToSection = (id: string): void => {
    const el = document.querySelector(`[data-section-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="w-full">
      {/* Sticky table-of-contents — numbered circles with connecting line */}
      <div className="sticky top-16 z-10 mb-8 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex justify-between relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border -z-10" />
          {steps.map((step) => {
            const done = checks[step.id]
            return (
              <Button
                variant="ghost"
                key={step.id}
                type="button"
                onClick={() => scrollToSection(step.id)}
                className="flex flex-col items-center gap-2 group text-muted-foreground hover:text-primary"
                aria-label={`Jump to section: ${step.label}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background text-sm ${
                    done
                      ? 'border-status-success text-status-success'
                      : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
                  }`}
                >
                  {done ? '✓' : steps.findIndex((s) => s.id === step.id) + 1}
                </div>
                <span className="text-[10px] sm:text-xs font-medium max-w-[80px] text-center leading-tight">
                  {step.label}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* All sections rendered vertically; each is a workshop scroll-to target */}
      <div className="space-y-6">
        {steps.map((step) => (
          <section
            key={step.id}
            data-section-id={step.id}
            ref={(el) => {
              if (el) sectionRefs.current.set(step.id, el)
              else sectionRefs.current.delete(step.id)
            }}
            className="glass-panel p-6 md:p-8 scroll-mt-20"
          >
            {step.content}
          </section>
        ))}
      </div>

      {/* Mark as Read — manual override for users who skim or use screen readers */}
      <div className="flex justify-end mt-6">
        {allDone ? (
          <div className="flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm font-semibold">
            <CheckCircle size={16} />
            Reading Complete!
          </div>
        ) : (
          <Button
            variant="ghost"
            type="button"
            data-workshop-target="learn-stepper-complete"
            onClick={() => moduleId && markAllLearnSectionsComplete(moduleId)}
            className="px-6 py-3 min-h-[44px] bg-status-success text-foreground font-bold rounded-lg hover:bg-status-success/90 transition-colors"
          >
            ✓ Mark as Read
          </Button>
        )}
      </div>
    </div>
  )
}
