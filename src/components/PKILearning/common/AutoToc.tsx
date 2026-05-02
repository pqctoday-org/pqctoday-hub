// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useRef, type RefObject } from 'react'

interface TocEntry {
  id: string
  label: string
  level: 2 | 3
}

const MIN_HEADINGS = 3

function toSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 64) || 'heading'
  )
}

interface AutoTocProps {
  containerRef: RefObject<HTMLElement | null>
}

export function AutoToc({ containerRef }: AutoTocProps) {
  const [entries, setEntries] = useState<TocEntry[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const ioRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function scanHeadings() {
      const headings = Array.from(container!.querySelectorAll('h2, h3')) as HTMLElement[]

      // Assign IDs to headings that lack one
      const seen = new Set<string>()
      headings.forEach((el) => {
        if (!el.id) {
          let slug = toSlug(el.textContent ?? '')
          // Deduplicate if the same slug appears twice on the page
          if (seen.has(slug)) slug = `${slug}-${seen.size}`
          seen.add(slug)
          el.id = slug
        } else {
          seen.add(el.id)
        }
      })

      setEntries(
        headings.map((el) => ({
          id: el.id,
          label: el.textContent?.trim() ?? '',
          level: parseInt(el.tagName[1]) as 2 | 3,
        }))
      )

      // Rebuild IntersectionObserver whenever headings change
      ioRef.current?.disconnect()
      if (headings.length >= MIN_HEADINGS) {
        ioRef.current = new IntersectionObserver(
          (obs) => {
            const first = obs.filter((e) => e.isIntersecting)[0]
            if (first) setActiveId(first.target.id)
          },
          { rootMargin: '-10% 0px -60% 0px' }
        )
        headings.forEach((h) => ioRef.current!.observe(h))
      }
    }

    scanHeadings()

    let debounce: ReturnType<typeof setTimeout>
    const mo = new MutationObserver(() => {
      clearTimeout(debounce)
      debounce = setTimeout(scanHeadings, 200)
    })
    mo.observe(container, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      ioRef.current?.disconnect()
      clearTimeout(debounce)
    }
  }, [containerRef])

  if (entries.length < MIN_HEADINGS) return null

  return (
    <nav
      aria-label="On this page"
      className="hidden 2xl:block fixed right-4 top-32 w-44 max-h-[calc(100vh-10rem)] overflow-y-auto z-10"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 select-none">
        On this page
      </p>
      <ul className="space-y-0.5">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              className={[
                'block text-[11px] leading-snug py-0.5 transition-colors truncate',
                e.level === 3 ? 'pl-3' : '',
                activeId === e.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={(ev) => {
                ev.preventDefault()
                document
                  .getElementById(e.id)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setActiveId(e.id)
              }}
            >
              {e.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
