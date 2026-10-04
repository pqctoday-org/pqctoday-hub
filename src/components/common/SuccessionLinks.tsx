// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { findLibraryItemByRef, type LibraryItem } from '@/data/libraryData'
import { lifecycleLabel, lifecyclePillClass } from '@/components/Library/redesign/libraryPills'

interface SuccessionLinksProps {
  item: LibraryItem
  /** Open another library document in place (the drawer and the phone sheet).
   *  Without it each link goes to `/library?ref=` instead. */
  onOpenRef?: (referenceId: string) => void
}

/** The documents named by `refs` that are in the library, in the order given. */
function resolve(refs: readonly string[] | undefined): LibraryItem[] {
  const found: LibraryItem[] = []
  for (const ref of refs ?? []) {
    const doc = findLibraryItemByRef(ref)
    if (doc && !found.includes(doc)) found.push(doc)
  }
  return found
}

function DocLink({
  doc,
  onOpenRef,
}: {
  doc: LibraryItem
  onOpenRef?: (referenceId: string) => void
}) {
  const className = 'h-auto p-0 text-left font-normal text-primary hover:underline'
  const label = (
    <>
      <span className="text-[12.5px]">{doc.documentTitle}</span>
      <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{doc.referenceId}</span>
    </>
  )
  const title = `Open ${doc.referenceId} — ${doc.documentTitle}`
  return (
    <li className="flex flex-wrap items-center gap-2">
      {onOpenRef ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenRef(doc.referenceId)}
          title={title}
          className={`whitespace-normal ${className}`}
        >
          {label}
        </Button>
      ) : (
        <Link
          to={`/library?ref=${encodeURIComponent(doc.referenceId)}`}
          title={title}
          className={`${className} inline-flex items-center`}
        >
          {label}
        </Link>
      )}
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${lifecyclePillClass(
          doc.lifecycleLabel
        )}`}
      >
        {lifecycleLabel(doc.lifecycleLabel)}
      </span>
    </li>
  )
}

function Group({
  heading,
  intro,
  docs,
  onOpenRef,
}: {
  heading: string
  intro: string
  docs: LibraryItem[]
  onOpenRef?: (referenceId: string) => void
}) {
  return (
    <section aria-label={heading}>
      <h3 className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {heading}
      </h3>
      <p className="mb-1.5 text-[12px] text-muted-foreground">{intro}</p>
      <ul className="space-y-1.5">
        {docs.map((doc) => (
          <DocLink key={doc.referenceId} doc={doc} onOpenRef={onOpenRef} />
        ))}
      </ul>
    </section>
  )
}

/**
 * Where a document sits between an older and a newer one. An older document
 * links to the newer document(s) that update or replace it; a newer document
 * lists what it replaces, each with a link back. Shows nothing for a document
 * that has neither. Links only to documents that are in the library, so none
 * can lead nowhere (see `attachSuccessionLinks`).
 */
export function SuccessionLinks({ item, onOpenRef }: SuccessionLinksProps) {
  const newer = resolve(item.supersededByRefs)
  const older = resolve(item.replacesRefs)
  if (newer.length === 0 && older.length === 0) return null
  return (
    <div className="space-y-3 rounded-lg border border-border p-3" data-testid="library-succession">
      {newer.length > 0 && (
        <Group
          heading="Newer document"
          intro="A newer document updates or replaces this one:"
          docs={newer}
          onOpenRef={onOpenRef}
        />
      )}
      {older.length > 0 && (
        <Group
          heading="Replaces"
          intro="This document updates or replaces:"
          docs={older}
          onOpenRef={onOpenRef}
        />
      )}
    </div>
  )
}
