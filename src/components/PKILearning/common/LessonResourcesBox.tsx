// SPDX-License-Identifier: AGPL-3.0-only
/**
 * LessonResourcesBox — "Related resources" for one lesson, generated from the Hub's knowledge file: the terms the
 * lesson teaches, the library documents it draws on and the industry use cases it covers. It sits directly after the
 * "Related modules" panel on every lesson, on the desktop and the phone.
 *
 * While the file loads, or if it does not load, nothing renders (no placeholder, so nothing shifts); a lesson with
 * nothing linked to it renders nothing either. See src/services/knowledge/lessonResources.ts for what each group holds.
 */
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import {
  Chip,
  Eyebrow,
  StickerCard,
  StoryButton,
  StoryRow,
  focusRing,
} from '@/components/storybook'
import { cn } from '@/lib/utils'
import { loadKnowledgeReader } from '@/services/knowledge/knowledgeReader'
import {
  DOCUMENTS_SHOWN,
  TERMS_SHOWN,
  USE_CASES_SHOWN,
  hasLessonResources,
  lessonResources,
  type LessonResource,
  type LessonResources,
} from '@/services/knowledge/lessonResources'

/** The lesson's resources once the knowledge file has loaded; null before that, and when it cannot be loaded. */
function useLessonResources(moduleId: string): LessonResources | null {
  const [found, setFound] = useState<{ moduleId: string; resources: LessonResources } | null>(null)
  useEffect(() => {
    let live = true
    const load = () => {
      loadKnowledgeReader()
        .then((reader) => {
          if (live) setFound({ moduleId, resources: lessonResources(reader, moduleId) })
        })
        .catch(() => undefined)
    }
    // The file is large: once the page itself is up, read it when the browser is idle.
    const idle = typeof window !== 'undefined' ? window.requestIdleCallback : undefined
    const handle = idle ? idle(load, { timeout: 2000 }) : null
    if (handle === null) load()
    return () => {
      live = false
      if (handle !== null) window.cancelIdleCallback?.(handle)
    }
  }, [moduleId])
  return found?.moduleId === moduleId ? found.resources : null
}

const isInternal = (link: string) => link.startsWith('/') && !link.startsWith('//')

/** An address inside the Hub is a router link; anything else is an ordinary link. */
function ResourceLink({
  link,
  className,
  children,
}: {
  link: string
  className?: string
  children: React.ReactNode
}) {
  if (isInternal(link)) {
    return (
      <Link to={link} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={link} className={className}>
      {children}
    </a>
  )
}

/** A term, algorithm or protocol: a chip that is a link, at least 44px tall to tap. */
function TermChip({ item }: { item: LessonResource }) {
  return (
    <li>
      <ResourceLink
        link={item.link}
        className={cn('group inline-flex min-h-[44px] items-center rounded-full', focusRing)}
      >
        <Chip className="group-hover:underline">
          {item.label}
          {item.kind !== 'Glossary term' && <span className="sr-only">, {item.kind}</span>}
        </Chip>
      </ResourceLink>
    </li>
  )
}

/** A document or use case: the kind label and the title, drawn as the Assistant draws a record. */
function ResourceRow({ item }: { item: LessonResource }) {
  return (
    <StoryRow as="li" padding="none" data-tag={item.id}>
      <ResourceLink
        link={item.link}
        className={cn(
          'block min-h-[44px] space-y-1.5 rounded-2xl px-4 py-3 transition-colors hover:bg-muted',
          focusRing
        )}
      >
        <Chip>{item.kind}</Chip>
        <span className="block text-sm font-bold text-foreground">{item.label}</span>
      </ResourceLink>
    </StoryRow>
  )
}

interface GroupProps {
  /** Names the group for tests and links: `terms`, `documents` or `use-cases`. */
  group: 'terms' | 'documents' | 'use-cases'
  title: string
  items: LessonResource[]
  shown: number
  /** How the group's items are laid out: chips run in a line, rows in a grid. */
  layout: 'chips' | 'rows'
}

/** One group: a labelled list that shows its first few items and a "Show all N" control for the rest. */
function ResourceGroup({ group, title, items, shown, layout }: GroupProps) {
  const [open, setOpen] = useState(false)
  const headingId = useId()
  const listId = useId()
  if (items.length === 0) return null
  const hidden = items.length > shown
  const visible = open ? items : items.slice(0, shown)
  return (
    <div className="space-y-2" data-testid={`lesson-resources-${group}`}>
      <h3 id={headingId}>
        <Eyebrow as="span">
          {title} <span className="font-semibold text-muted-foreground">({items.length})</span>
        </Eyebrow>
      </h3>
      <ul
        id={listId}
        aria-labelledby={headingId}
        className={
          layout === 'chips' ? 'flex flex-wrap gap-x-1.5 gap-y-0' : 'grid gap-2 sm:grid-cols-2'
        }
      >
        {visible.map((item) =>
          layout === 'chips' ? (
            <TermChip key={item.id} item={item} />
          ) : (
            <ResourceRow key={item.id} item={item} />
          )
        )}
      </ul>
      {hidden && (
        <StoryButton
          variant="quiet"
          className="-ml-2"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show fewer' : `Show all ${items.length}`}
        </StoryButton>
      )}
    </div>
  )
}

export interface LessonResourcesBoxProps {
  /** The lesson's module id, as in its address (`/learn/<id>`), or its tag (`LM-020`). */
  moduleId: string
}

export function LessonResourcesBox({ moduleId }: LessonResourcesBoxProps) {
  const headingId = useId()
  const resources = useLessonResources(moduleId)
  if (!resources || !hasLessonResources(resources)) return null
  return (
    <StickerCard as="section" aria-labelledby={headingId} data-testid="lesson-resources">
      <h2 id={headingId} className="mb-4 text-base font-extrabold text-heading">
        Related resources
      </h2>
      <div className="space-y-5">
        <ResourceGroup
          group="terms"
          title="Terms taught here"
          items={resources.terms}
          shown={TERMS_SHOWN}
          layout="chips"
        />
        <ResourceGroup
          group="documents"
          title="Documents this lesson draws on"
          items={resources.documents}
          shown={DOCUMENTS_SHOWN}
          layout="rows"
        />
        <ResourceGroup
          group="use-cases"
          title="Industry use cases covered"
          items={resources.useCases}
          shown={USE_CASES_SHOWN}
          layout="rows"
        />
      </div>
    </StickerCard>
  )
}
