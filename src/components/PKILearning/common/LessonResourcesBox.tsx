// SPDX-License-Identifier: AGPL-3.0-only
/**
 * LessonResourcesBox — "Related resources" for one lesson. It sits directly after the "Related modules" panel on
 * every lesson, on the desktop and the phone, and has two sources:
 *
 *  - the links the lesson used to list by hand, kept as data (src/data/lessonRelatedLinks.ts): "Related lessons" and
 *    "Elsewhere on the Hub". They need no download, so they show at once;
 *  - what the Hub's knowledge file ties to the lesson: terms, documents, compliance frameworks and industry use cases.
 *    Until that file loads, or if it does not load, these groups are simply absent.
 *
 * The kept groups come first: they say where to go next, and the generated document list can run to hundreds of rows
 * when opened. A group with nothing in it is not drawn; with no group at all, nothing is. A lesson the "Related
 * modules" panel already points to may be listed again in "Related lessons": its reason adds what the panel's does not.
 */
import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  Chip,
  Eyebrow,
  StickerCard,
  StoryButton,
  StoryRow,
  focusRing,
} from '@/components/storybook'
import {
  lessonLabelOf,
  pageLabelOf,
  relatedLinksOf,
  type RelatedLink,
} from '@/data/lessonRelatedLinks'
import { cn } from '@/lib/utils'
import { loadKnowledgeReader } from '@/services/knowledge/knowledgeReader'
import {
  COMPLIANCE_SHOWN,
  DOCUMENTS_SHOWN,
  TERMS_SHOWN,
  USE_CASES_SHOWN,
  lessonResources,
  type LessonResource,
  type LessonResources,
} from '@/services/knowledge/lessonResources'

/** The lesson's resources once the knowledge file has loaded; null before that, and when it cannot be loaded. */
function useLessonResources(moduleId: string): LessonResources | null {
  const [found, setFound] = useState<{ moduleId: string; resources: LessonResources } | null>(null)
  useEffect(() => {
    let live = true
    // The file is shared: the page's My work panel reads it too, so this adds no second download.
    loadKnowledgeReader()
      .then((reader) => {
        if (live) setFound({ moduleId, resources: lessonResources(reader, moduleId) })
      })
      .catch(() => undefined)
    return () => {
      live = false
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
function TermChip({ item, showKind }: { item: LessonResource; showKind: boolean }) {
  const isTerm = item.kind === 'Glossary term'
  return (
    <li>
      <ResourceLink
        link={item.link}
        className={cn('group inline-flex min-h-[44px] items-center rounded-full', focusRing)}
      >
        <Chip className="group-hover:underline">
          {item.label}
          {!isTerm && showKind && (
            <span aria-hidden="true" className="font-semibold opacity-80">
              · {item.kind}
            </span>
          )}
          {!isTerm && <span className="sr-only">, {item.kind}</span>}
        </Chip>
      </ResourceLink>
    </li>
  )
}

/** A link, document or use case: the kind label and the title, drawn as the Assistant draws a record, and the reason when there is one. */
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
        {item.reason ? (
          <span className="block text-xs text-muted-foreground">{item.reason}</span>
        ) : null}
      </ResourceLink>
    </StoryRow>
  )
}

type GroupName = 'lessons' | 'pages' | 'terms' | 'documents' | 'compliance' | 'use-cases'

interface GroupProps {
  /** Names the group for tests: `lessons`, `pages`, `terms`, `documents`, `compliance` or `use-cases`. */
  group: GroupName
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
  // Two records can share a label (a glossary term and the algorithm of the same name): then the chip says which is which.
  const sharedLabels = useMemo(() => {
    const seen = new Set<string>()
    const shared = new Set<string>()
    for (const i of items) (seen.has(i.label) ? shared : seen).add(i.label)
    return shared
  }, [items])
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
            <TermChip key={item.id} item={item} showKind={sharedLabels.has(item.label)} />
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

const LESSONS_SHOWN = 5
const PAGES_SHOWN = 5

const keptItem = (link: RelatedLink, kind: string): LessonResource => ({
  id: link.to,
  label: link.title,
  kind,
  link: link.to,
  reason: link.reason || undefined,
})

export interface LessonResourcesBoxProps {
  /** The lesson's module id, as in its address (`/learn/<id>`), or its tag (`LM-020`). */
  moduleId: string
}

export function LessonResourcesBox({ moduleId }: LessonResourcesBoxProps) {
  const headingId = useId()
  const resources = useLessonResources(moduleId)
  const kept = relatedLinksOf(moduleId)
  const lessons = useMemo(
    () => kept.lessons.map((l) => keptItem(l, lessonLabelOf(l.to))),
    [kept.lessons]
  )
  const pages = useMemo(() => kept.pages.map((l) => keptItem(l, pageLabelOf(l.to))), [kept.pages])
  const count =
    lessons.length +
    pages.length +
    (resources
      ? resources.terms.length +
        resources.documents.length +
        resources.compliance.length +
        resources.useCases.length
      : 0)
  if (count === 0) return null
  return (
    <StickerCard as="section" aria-labelledby={headingId} data-testid="lesson-resources">
      <h2 id={headingId} className="mb-4 text-base font-extrabold text-heading">
        Related resources
      </h2>
      <div className="space-y-5">
        <ResourceGroup
          group="lessons"
          title="Related lessons"
          items={lessons}
          shown={LESSONS_SHOWN}
          layout="rows"
        />
        <ResourceGroup
          group="pages"
          title="Elsewhere on the Hub"
          items={pages}
          shown={PAGES_SHOWN}
          layout="rows"
        />
        <ResourceGroup
          group="terms"
          title="Terms taught here"
          items={resources?.terms ?? []}
          shown={TERMS_SHOWN}
          layout="chips"
        />
        <ResourceGroup
          group="documents"
          title="Documents this lesson draws on"
          items={resources?.documents ?? []}
          shown={DOCUMENTS_SHOWN}
          layout="rows"
        />
        <ResourceGroup
          group="compliance"
          title="Compliance frameworks covered"
          items={resources?.compliance ?? []}
          shown={COMPLIANCE_SHOWN}
          layout="rows"
        />
        <ResourceGroup
          group="use-cases"
          title="Industry use cases covered"
          items={resources?.useCases ?? []}
          shown={USE_CASES_SHOWN}
          layout="rows"
        />
      </div>
    </StickerCard>
  )
}
