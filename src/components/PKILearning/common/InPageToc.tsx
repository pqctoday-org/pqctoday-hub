// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TocEntry {
  id: string
  text: string
  level: 2 | 3
}

interface InPageTocProps {
  containerRef: React.RefObject<HTMLElement | null>
  /** 'auto' renders both mobile accordion + desktop rail with built-in breakpoints.
   *  'mobile' renders only the collapsible accordion.
   *  'desktop' renders only the sticky rail. */
  mode?: 'auto' | 'mobile' | 'desktop'
  className?: string
}

function buildToc(container: HTMLElement): TocEntry[] {
  const entries: TocEntry[] = []

  // Direct headings with IDs
  container.querySelectorAll('h2[id], h3[id]').forEach((el) => {
    entries.push({
      id: el.id,
      text: el.textContent?.trim() ?? '',
      level: el.tagName === 'H2' ? 2 : 3,
    })
  })

  // Sections/divs with IDs that contain h2/h3 (common pattern: <section id="x"><h2>title</h2>)
  container.querySelectorAll('section[id], [data-section-id]').forEach((section) => {
    const id = section.id || (section as HTMLElement).dataset.sectionId
    if (!id) return
    if (entries.some((e) => e.id === id)) return // already added
    const heading = section.querySelector('h2, h3')
    if (!heading) return
    entries.push({
      id,
      text: heading.textContent?.trim() ?? '',
      level: heading.tagName === 'H2' ? 2 : 3,
    })
  })

  // Sort by DOM order
  const allIds = new Map<string, number>()
  container.querySelectorAll('[id]').forEach((el, i) => allIds.set(el.id, i))
  entries.sort((a, b) => (allIds.get(a.id) ?? 0) - (allIds.get(b.id) ?? 0))

  return entries
}

export const InPageToc: React.FC<InPageTocProps> = ({
  containerRef,
  mode = 'auto',
  className = '',
}) => {
  const [entries, setEntries] = useState<TocEntry[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const rebuild = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const toc = buildToc(container)
    setEntries(toc)
    if (toc.length > 0 && !activeId) setActiveId(toc[0].id)
  }, [containerRef, activeId])

  useEffect(() => {
    rebuild()
    const timer = setTimeout(rebuild, 300)
    return () => clearTimeout(timer)
  }, [rebuild])

  useEffect(() => {
    if (entries.length === 0) return
    observerRef.current?.disconnect()
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          )
          setActiveId(topmost.target.id)
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    )
    entries.forEach(({ id }) => {
      const el = document.getElementById(id) ?? document.querySelector(`[data-section-id="${id}"]`)
      if (el) obs.observe(el)
    })
    observerRef.current = obs
    return () => obs.disconnect()
  }, [entries])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      setMobileOpen(false)
    }
  }

  if (entries.length < 2) return null

  const tocList = (
    <ul className="space-y-0.5">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Button
            variant="ghost"
            onClick={() => scrollTo(entry.id)}
            className={[
              'w-full text-left text-xs leading-snug px-2 py-1 h-auto rounded transition-colors justify-start font-normal',
              entry.level === 3 ? 'pl-5' : '',
              activeId === entry.id
                ? 'text-primary bg-primary/8 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            ].join(' ')}
          >
            {entry.text}
          </Button>
        </li>
      ))}
    </ul>
  )

  const showDesktop = mode === 'auto' || mode === 'desktop'
  const showMobile = mode === 'auto' || mode === 'mobile'

  return (
    <div className={className}>
      {/* Desktop: sticky rail */}
      {showDesktop && (
        <div
          className={`sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 ${mode === 'auto' ? 'hidden xl:block' : ''}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <List size={11} />
            On this page
          </p>
          {tocList}
        </div>
      )}

      {/* Mobile: collapsible accordion */}
      {showMobile && (
        <div className={`glass-panel ${mode === 'auto' ? 'xl:hidden' : ''}`}>
          <Button
            variant="ghost"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-full justify-between text-xs font-medium text-muted-foreground py-2 h-auto"
          >
            <span className="flex items-center gap-1.5">
              <List size={12} />
              On this page
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
            />
          </Button>
          {mobileOpen && <div className="px-2 pb-2">{tocList}</div>}
        </div>
      )}
    </div>
  )
}
