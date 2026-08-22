// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'

export interface TocSection {
  id: string
  label: string
}

interface ReportTocProps {
  sections: TocSection[]
  onExpandAll: () => void
  onCollapseAll: () => void
}

export function ReportToc({ sections, onExpandAll, onCollapseAll }: ReportTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-10% 0px -60% 0px', threshold: 0 }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [sections])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (sections.length === 0) return null

  return (
    <>
      {/* Desktop sticky rail */}
      <aside className="hidden lg:flex flex-col w-44 xl:w-52 shrink-0 sticky top-4 self-start max-h-[calc(100dvh-6rem)] overflow-y-auto print:hidden">
        <div className="flex gap-1 mb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            title="Expand all sections"
            className="flex-1 h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground border border-border hover:border-input"
          >
            <ChevronsUpDown className="h-3 w-3 mr-1" />
            Expand all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            title="Collapse all sections"
            className="flex-1 h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground border border-border hover:border-input"
          >
            <ChevronsDownUp className="h-3 w-3 mr-1" />
            Collapse
          </Button>
        </div>

        <nav aria-label="Report sections">
          <ul className="space-y-0.5">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollTo(id)}
                  data-workshop-target={`report-toc-${id.replace(/^report-section-/, '')}`}
                  className={`w-full h-auto py-1.5 px-2 text-left justify-start text-[11px] leading-snug whitespace-normal transition-colors ${
                    activeId === id
                      ? 'text-primary bg-primary/5 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                  }`}
                >
                  {activeId === id && (
                    <span className="mr-1.5 inline-block w-1 h-1 rounded-full bg-primary shrink-0 mt-0.5" />
                  )}
                  {label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile compact bar */}
      <div className="lg:hidden flex items-center gap-2 mb-4 print:hidden flex-wrap">
        <FilterDropdown
          items={sections.map(({ id, label }) => ({ id, label }))}
          // Controlled by the same IntersectionObserver-driven `activeId` the
          // desktop rail uses, so the dropdown tracks scroll position instead
          // of freezing on whichever option was last picked (previously
          // uncontrolled — it never updated on scroll, and re-picking a
          // section you'd since scrolled away from silently did nothing
          // because the DOM's value hadn't changed from the browser's view).
          selectedId={activeId ?? ''}
          onSelect={(id) => {
            if (id !== 'All') scrollTo(id)
          }}
          defaultLabel="Jump to section…"
          defaultIcon={null}
          ariaLabel="Jump to section"
          noContainer
          className="flex-1 min-w-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExpandAll}
          className="min-h-[44px] md:min-h-0 md:h-7 text-xs px-2 border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-3 w-3 mr-1" />
          Expand
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCollapseAll}
          className="min-h-[44px] md:min-h-0 md:h-7 text-xs px-2 border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronsDownUp className="h-3 w-3 mr-1" />
          Collapse
        </Button>
      </div>
    </>
  )
}
