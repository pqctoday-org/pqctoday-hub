// SPDX-License-Identifier: GPL-3.0-only
/**
 * Anchored collapsible learn section.
 *
 * Every Industries-track module renders its learn tab as a stack of local
 * `CollapsibleSection` components. Those were copy-pasted per module and none
 * of them emitted a section anchor, which meant three things were quietly
 * impossible on exactly the modules the Industry Landscape links to:
 *
 *   1. `?section=` / `#section-id` deep links had nothing to land on, so every
 *      industry link dropped the learner at the top of the module.
 *   2. The IntersectionObserver in LearnStepper never saw them, so per-section
 *      reading progress was never recorded — only the manual
 *      `ReadingCompleteButton` at the very bottom moved the needle.
 *   3. Per-path completion (LearnPath) had no per-section signal to evaluate.
 *
 * This component keeps the accordion behaviour those modules already have and
 * adds the missing anchor, URL-driven opening, and read tracking. It is a
 * drop-in replacement for the per-module `CollapsibleSection`: same props plus
 * a required `sectionId` that must match the module manifest's
 * `learnSections[].id`.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'

export interface LearnSectionProps {
  /** must match the manifest's `learnSections[].id` */
  sectionId: string
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

/**
 * How long a section must stay ≥50% on screen before it counts as read.
 *
 * Without a dwell, `IntersectionObserver` fires on the very first frame, so
 * every section visible at page load was marked read before the reader touched
 * anything — and a module with only its top section left would complete itself
 * the instant it was opened. Exported so tests can assert the behaviour rather
 * than sleep on a magic number.
 */
export const SECTION_READ_DWELL_MS = 1500

/** Reads the deep-link target from either `#section-id` or `?section=`. */
export const useDeepLinkTarget = (): string => {
  const location = useLocation()
  const fromHash = location.hash.replace(/^#/, '')
  if (fromHash) return decodeURIComponent(fromHash)
  return new URLSearchParams(location.search).get('section') ?? ''
}

/**
 * Makes already-present `data-section-id` anchors live, for modules that
 * render continuous prose rather than accordions.
 *
 * ADDED 2026-07-30. Several modules — the four Role Guides especially — were
 * already emitting `data-section-id` on plain `<section>` blocks, but nothing
 * read the URL or observed them, so the anchors were decorative: deep links
 * landed at the top and no section was ever marked read.
 *
 * Deliberately NOT implemented by wrapping those blocks in {@link LearnSection}.
 * That would collapse content which is meant to read continuously, changing
 * how shipped modules present for no benefit. This hook adds exactly the two
 * missing behaviours and leaves the markup alone.
 *
 * Call once from a module's learn tab. Safe on modules with no anchors at all.
 */
export const useSectionAnchors = (): void => {
  const location = useLocation()
  const moduleId = location.pathname.replace(/^\/learn\/?/, '') || ''
  const markLearnSectionRead = useModuleStore((s) => s.markLearnSectionRead)
  const target = useDeepLinkTarget()

  // Scroll to the section the URL names, once it has laid out.
  useEffect(() => {
    if (!target) return
    const raf = requestAnimationFrame(() => {
      const el =
        document.querySelector(`[data-section-id="${target}"]`) ??
        document.querySelector(`section[id="${CSS.escape(target)}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(raf)
  }, [target])

  // Mark each section read once half of it has been on screen FOR A WHILE.
  useEffect(() => {
    if (!moduleId) return
    // Both anchor styles. Some modules mark sections with `data-section-id`;
    // others (cbom, sbom, crypto-registry, pqc-candidates,
    // verification-closure) use a local <Section id="..."> helper that emits a
    // plain HTML id. Those were already correctly anchored and matched their
    // manifests exactly — they were invisible to this hook only because it
    // looked for one attribute.
    const els = document.querySelectorAll<HTMLElement>('[data-section-id], section[id]')
    if (els.length === 0) return

    // Whatever is on screen when the page loads used to be marked read
    // instantly: opening a module recorded its top section before the reader
    // had done anything, and if that was the last unread section the module
    // completed itself on arrival, firing the completion card. Requiring the
    // section to STAY half-visible for a beat fixes that without weakening
    // genuine reading — you cannot dwell on something you scrolled straight
    // past, and anything still on screen after the dwell really is being read.
    const timers = new Map<string, ReturnType<typeof setTimeout>>()
    const clear = (id: string) => {
      const t = timers.get(id)
      if (t) {
        clearTimeout(t)
        timers.delete(id)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement
          const id = el.dataset.sectionId ?? el.id
          if (!id) continue
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (timers.has(id)) continue
            timers.set(
              id,
              setTimeout(() => {
                timers.delete(id)
                markLearnSectionRead(moduleId, id)
              }, SECTION_READ_DWELL_MS)
            )
          } else {
            // Scrolled away before the dwell elapsed — it was passed, not read.
            clear(id)
          }
        }
      },
      { threshold: [0.5] }
    )
    els.forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [moduleId, markLearnSectionRead])
}

/**
 * Records the `?path=` the learner arrived with, so completion is judged
 * against that path rather than every section. Call once per learn tab; it is
 * a no-op when no `?path=` is present, which is every link except the ones the
 * Industry Landscape builds for multi-industry modules.
 */
export const useActiveLearnPath = (): void => {
  const location = useLocation()
  const setActiveLearnPath = useModuleStore((s) => s.setActiveLearnPath)
  const moduleId = location.pathname.replace(/^\/learn\/?/, '') || ''
  const pathId = new URLSearchParams(location.search).get('path') ?? ''
  useEffect(() => {
    if (!moduleId || !pathId) return
    setActiveLearnPath(moduleId, pathId)
  }, [moduleId, pathId, setActiveLearnPath])
}

export const LearnSection: React.FC<LearnSectionProps> = ({
  sectionId,
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const location = useLocation()
  const moduleId = location.pathname.replace(/^\/learn\/?/, '') || ''
  const markLearnSectionRead = useModuleStore((s) => s.markLearnSectionRead)
  const target = useDeepLinkTarget()
  const isTarget = target === sectionId

  // Open state is DERIVED, not synced in an effect: a deep-linked section is
  // open because the URL names it, not because something called setState after
  // render. `userToggled` stays null until the reader actually clicks, so a
  // deep link opens the section without an effect-driven cascading render.
  const [userToggled, setUserToggled] = useState<boolean | null>(null)
  const isOpen = userToggled ?? (defaultOpen || isTarget)

  const ref = useRef<HTMLElement | null>(null)
  const headingId = `${useId()}-heading`

  // Scroll only — the opening is handled by the derivation above. Deferred past
  // paint so the expanded body has laid out first; scrolling to a collapsed
  // height lands short.
  useEffect(() => {
    if (!isTarget) return
    const raf = requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(raf)
  }, [isTarget])

  // Mark read once half the section has been on screen for a beat — but only
  // while it is open, so a collapsed header scrolling past does not count as
  // having read it. The dwell matches useSectionAnchors above: an accordion
  // already expanded on arrival would otherwise be marked read on load.
  useEffect(() => {
    const el = ref.current
    if (!el || !moduleId || !isOpen) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (timer) continue
            timer = setTimeout(() => {
              timer = undefined
              markLearnSectionRead(moduleId, sectionId)
            }, SECTION_READ_DWELL_MS)
          } else if (timer) {
            clearTimeout(timer)
            timer = undefined
          }
        }
      },
      { threshold: [0.5] }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [moduleId, sectionId, isOpen, markLearnSectionRead])

  return (
    <section
      ref={ref}
      data-section-id={sectionId}
      aria-labelledby={headingId}
      className="glass-panel overflow-hidden scroll-mt-24"
    >
      <Button
        variant="ghost"
        onClick={() => setUserToggled(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 id={headingId} className="min-w-0 text-xl font-bold text-gradient">
            {title}
          </h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </Button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}
