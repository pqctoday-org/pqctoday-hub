// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Requirements — the reading room. "What does this obligation require, and who
 * says so?"
 *
 * A reading list, not a checklist. No checkbox, no owner, no evidence column,
 * and no percentage: the corpus is model-extracted from cited documents, and a
 * completion figure would claim precision the data has not got. Counts are
 * context only.
 */
import { useMemo, useRef, useState } from 'react'
import { BookOpen, ExternalLink, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { complianceFrameworks } from '@/data/complianceData'
import type { UserProfile } from '@/utils/applicabilityEngine'
import { buildObligations } from '../obligations/obligationsModel'
import {
  citationIndex,
  documentsFor,
  instrumentReadingNotes,
  resolveRequirementsPick,
  totalFor,
} from './requirementsModel'

const PILLAR_LABEL: Record<string, string> = {
  governance: 'Governance',
  inventory: 'Inventory',
  lifecycle: 'Lifecycle',
  observability: 'Observability',
  assurance: 'Assurance',
}

interface RequirementsTabProps {
  profile: UserProfile
  headingLevel?: 2 | 3
  /**
   * `?reqfw=<framework id>` (ADDED 2026-09-29, deep-link PR 2). When passed,
   * the picker is controlled by the URL: `onSelect` writes the pick, `null`
   * clears it. Omitted, the tab keeps its own local selection.
   */
  selectedId?: string | null
  onSelect?: (id: string | null) => void
}

export function RequirementsTab({
  profile,
  headingLevel = 3,
  selectedId: controlledId,
  onSelect,
}: RequirementsTabProps) {
  const InstrumentHeading = headingLevel === 2 ? 'h2' : 'h3'
  const DocumentHeading = headingLevel === 2 ? 'h3' : 'h4'
  const searchInput = useRef<HTMLInputElement>(null)
  const readingHeading = useRef<HTMLHeadingElement>(null)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const rows = useMemo(() => buildObligations(profile), [profile])
  const index = useMemo(() => citationIndex(rows.map((r) => r.framework)), [rows])

  const [localId, setLocalId] = useState<string | null>(null)
  const selectedId = controlledId !== undefined ? controlledId : localId
  const setSelectedId = onSelect ?? setLocalId
  const { selected, status } = useMemo(
    () => resolveRequirementsPick(rows, selectedId, complianceFrameworks),
    [rows, selectedId]
  )
  // The out-of-scope note is informational; dismissing it keeps the pick.
  const [dismissedNoteFor, setDismissedNoteFor] = useState<string | null>(null)

  const docs = useMemo(
    () => (selected ? documentsFor(selected.framework, index) : []),
    [selected, index]
  )

  const scopedRows = useMemo(() => new Map(rows.map((row) => [row.framework.id, row])), [rows])
  const criteria = query.trim().toLowerCase()
  const instruments = (
    showAll ? complianceFrameworks : rows.map(({ framework }) => framework)
  ).filter((framework) =>
    `${framework.id} ${framework.label} ${framework.description}`.toLowerCase().includes(criteria)
  )
  const notes = selected && instrumentReadingNotes.get(selected.framework.id)

  const notice =
    status === 'unknown' ? (
      <DeepLinkNotice
        kind="not-found"
        message={`No tracked framework has the ID “${selectedId}” — it may have been renamed or retired. Showing the first instrument in your scope instead.`}
        onDismiss={() => setSelectedId(null)}
      />
    ) : status === 'out-of-scope' && selected && dismissedNoteFor !== selectedId ? (
      <DeepLinkNotice
        kind="widened"
        message={`${selected.framework.label} is not among the instruments for your current country and sector — it is open for reference.`}
        onDismiss={() => setDismissedNoteFor(selectedId)}
      />
    ) : null

  return (
    <>
      {notice}
      <div className="grid gap-4 lg:grid-cols-[286px_minmax(0,1fr)] lg:items-start">
        {/* Obligation picker */}
        <nav
          className="overflow-hidden rounded-xl border border-border bg-card"
          aria-label="Rules & Standards"
        >
          <div className="space-y-2 border-b border-border p-3">
            <label className="block text-sm font-medium">
              Search instruments
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(event) => setShowAll(event.target.checked)}
              />
              Include instruments outside my current scope
            </label>
            {!instruments.length && (
              <>
                <p role="status" className="text-xs text-muted-foreground">
                  No instruments match this search and scope.
                </p>
                {query && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery('')
                      searchInput.current?.focus()
                    }}
                  >
                    Clear instrument search
                  </Button>
                )}
              </>
            )}
          </div>
          <ul className="max-h-[42vh] divide-y divide-border overflow-y-auto lg:max-h-[65vh]">
            {instruments.map((framework) => {
              const active = selected?.framework.id === framework.id
              const row = scopedRows.get(framework.id)
              return (
                <li key={framework.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-current={active ? 'true' : undefined}
                    aria-label={framework.label}
                    aria-description={!row ? 'Outside current scope' : undefined}
                    onClick={() => {
                      setSelectedId(framework.id)
                      requestAnimationFrame(() => readingHeading.current?.focus())
                    }}
                    className={`h-auto w-full justify-start whitespace-normal rounded-none px-3 py-2.5 text-left ${
                      active ? 'bg-primary/5 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold">{framework.label}</span>
                      <span className="mt-0.5 block text-[10.5px] font-normal text-muted-foreground">
                        {!row
                          ? 'Outside current scope'
                          : row.requirementCount > 0
                            ? `${row.requirementCount} extracted practices · ${row.requirementSources.length} document${row.requirementSources.length === 1 ? '' : 's'}`
                            : 'no extracted practices'}
                      </span>
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Reading pane */}
        <div className="min-w-0 space-y-4">
          {selected ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <InstrumentHeading
                ref={readingHeading}
                tabIndex={-1}
                className="scroll-mt-20 text-base font-bold text-foreground focus-visible:outline-primary"
              >
                {selected.framework.label}
              </InstrumentHeading>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{selected.reason}</p>
              {notes && (
                <dl className="mt-3 grid gap-2 rounded-md bg-muted/30 p-3 text-xs">
                  <div>
                    <dt className="font-semibold">In scope under the source</dt>
                    <dd>{notes.scope}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Dates to check</dt>
                    <dd>{notes.dates}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Where to read</dt>
                    <dd>{notes.locator}</dd>
                  </div>
                </dl>
              )}
              {selected.framework.website && (
                <a
                  href={selected.framework.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-primary underline"
                >
                  Read the instrument <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                These practices are machine-extracted from documents this instrument{' '}
                <span className="font-semibold text-foreground">cites</span> — not from its own text
                and not automatically legal requirements. Verify the passage and primary instrument
                before relying on them.
                {docs.length > 0 && (
                  <>
                    {' '}
                    {totalFor(docs)} extracted practice{totalFor(docs) === 1 ? '' : 's'} across{' '}
                    {docs.length} cited document{docs.length === 1 ? '' : 's'}.
                  </>
                )}
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-card p-4 text-sm">
              Pick an instrument to read its published scope and dates.
            </p>
          )}

          {selected &&
            (docs.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <BookOpen size={22} className="mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold text-foreground">
                  No extracted practices for this one
                </p>
                <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground">
                  Nothing it cites has been through requirement extraction yet. That is a gap in our
                  corpus, not a statement about the instrument — read the source directly.
                </p>
              </div>
            ) : (
              docs.map((doc) => (
                <section
                  key={doc.refId}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <header className="border-b border-border bg-muted/40 px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <DocumentHeading className="text-sm font-bold text-foreground">
                        {doc.sourceName}
                      </DocumentHeading>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {doc.refId}
                      </span>
                      <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {doc.total}
                      </span>
                      {doc.sourceUrl && (
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                        >
                          Source <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    {/* The reason no percentage appears anywhere on this page. */}
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      <span className="mr-1.5 inline-flex rounded border border-status-warning/30 bg-status-warning/10 px-1.5 py-0.5 font-sans font-semibold text-status-warning">
                        Human review not recorded
                      </span>
                      machine-extracted by {doc.extractionModel || 'unknown model'}
                      {doc.extractionDate ? ` · ${doc.extractionDate}` : ''} · confidence{' '}
                      {doc.confidence}
                    </p>

                    {doc.alsoCitedBy.length > 0 && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <Users size={12} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                        <span>
                          Also cited by{' '}
                          <span className="font-semibold text-foreground">
                            {doc.alsoCitedBy.join(', ')}
                          </span>{' '}
                          — these are the same extracted practices, read through a different
                          instrument.
                        </span>
                      </p>
                    )}
                  </header>

                  {doc.pillars.map((group) => (
                    <div key={group.pillar}>
                      <div className="flex items-baseline gap-2 bg-muted/20 px-4 py-2">
                        <span className="text-xs font-bold text-foreground">
                          {PILLAR_LABEL[group.pillar] ?? group.pillar}
                        </span>
                        <span className="font-mono text-[9.5px] text-muted-foreground">
                          pillar={group.pillar}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {group.requirements.length}
                        </span>
                      </div>

                      <ul className="divide-y divide-border">
                        {group.requirements.map((req, i) => (
                          <li key={`${doc.refId}-${group.pillar}-${i}`} className="px-4 py-3">
                            <p className="text-[12.5px] leading-relaxed text-foreground">
                              {req.requirement}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
                              <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">
                                L{req.maturityLevel}
                              </span>
                              <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                                {req.assetClass}
                              </span>
                            </div>
                            {req.evidenceQuote && (
                              <blockquote className="mt-1.5 border-l-2 border-border pl-2.5 text-[10.5px] italic text-muted-foreground">
                                {req.evidenceQuote}
                                {req.evidenceLocation && (
                                  <span className="ml-1 font-mono not-italic">
                                    — {req.evidenceLocation}
                                  </span>
                                )}
                              </blockquote>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              ))
            ))}
        </div>
      </div>
    </>
  )
}
