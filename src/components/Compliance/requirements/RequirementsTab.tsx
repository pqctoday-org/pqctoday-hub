// SPDX-License-Identifier: GPL-3.0-only
/**
 * Requirements — the reading room. "What does this obligation require, and who
 * says so?"
 *
 * A reading list, not a checklist. No checkbox, no owner, no evidence column,
 * and no percentage: the corpus is model-extracted from cited documents, and a
 * completion figure would claim precision the data has not got. Counts are
 * context only.
 */
import { useMemo, useState } from 'react'
import { BookOpen, ExternalLink, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/utils/applicabilityEngine'
import { buildObligations } from '../obligations/obligationsModel'
import { citationIndex, documentsFor, totalFor } from './requirementsModel'

const PILLAR_LABEL: Record<string, string> = {
  governance: 'Governance',
  inventory: 'Inventory',
  lifecycle: 'Lifecycle',
  observability: 'Observability',
  assurance: 'Assurance',
}

interface RequirementsTabProps {
  profile: UserProfile
}

export function RequirementsTab({ profile }: RequirementsTabProps) {
  const rows = useMemo(() => buildObligations(profile), [profile])
  const index = useMemo(() => citationIndex(rows.map((r) => r.framework)), [rows])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = rows.find((r) => r.framework.id === selectedId) ?? rows[0]

  const docs = useMemo(
    () => (selected ? documentsFor(selected.framework, index) : []),
    [selected, index]
  )

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <BookOpen size={24} className="mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold text-foreground">Nothing in scope yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Set a country and a sector on Rules & Standards, and the requirements behind each
          instrument appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[286px_minmax(0,1fr)] lg:items-start">
      {/* Obligation picker */}
      <nav
        className="overflow-hidden rounded-xl border border-border bg-card"
        aria-label="Rules & Standards"
      >
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const active = selected?.framework.id === row.framework.id
            return (
              <li key={row.framework.id}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setSelectedId(row.framework.id)}
                  className={`h-auto w-full justify-start whitespace-normal rounded-none px-3 py-2.5 text-left ${
                    active ? 'bg-primary/5 text-primary' : 'text-foreground'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold">{row.framework.label}</span>
                    <span className="mt-0.5 block text-[10.5px] font-normal text-muted-foreground">
                      {row.requirementCount > 0
                        ? `${row.requirementCount} requirements · ${row.requirementSources.length} document${row.requirementSources.length === 1 ? '' : 's'}`
                        : 'no extracted requirements'}
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
        {selected && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-base font-bold text-foreground">{selected.framework.label}</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{selected.reason}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              These requirements are extracted from the documents this instrument{' '}
              <span className="font-semibold text-foreground">cites</span> — not from its own text.
              {docs.length > 0 && (
                <>
                  {' '}
                  {totalFor(docs)} requirement{totalFor(docs) === 1 ? '' : 's'} across {docs.length}{' '}
                  cited document{docs.length === 1 ? '' : 's'}.
                </>
              )}
            </p>
          </div>
        )}

        {docs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <BookOpen size={22} className="mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              No extracted requirements for this one
            </p>
            <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground">
              Nothing it cites has been through requirement extraction yet. That is a gap in our
              corpus, not a statement about the instrument — read the source directly.
              {selected?.framework.website && (
                <>
                  {' '}
                  <a
                    href={selected.framework.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open the source ↗
                  </a>
                </>
              )}
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
                  <h4 className="text-sm font-bold text-foreground">{doc.sourceName}</h4>
                  <span className="font-mono text-[10px] text-muted-foreground">{doc.refId}</span>
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
                  extracted by {doc.extractionModel || 'unknown model'}
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
                      — these are the same requirements, read through a different instrument.
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
        )}
      </div>
    </div>
  )
}
