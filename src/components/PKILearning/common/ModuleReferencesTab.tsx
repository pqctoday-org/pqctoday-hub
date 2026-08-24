// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, BookOpen, CalendarCheck, Quote } from 'lucide-react'
import { Link } from 'react-router'
import { getLibraryItemsForModule } from '@/data/libraryData'
import {
  MODULE_LAST_REVIEWED,
  MODULE_LAST_EDITED,
  MODULE_CITED_STANDARDS,
} from '@/data/moduleContentRegistry'
import { EmptyState } from '@/components/ui/empty-state'

interface ModuleReferencesTabProps {
  moduleId: string
}

/**
 * Two dates, never conflated. "Reviewed" means a human checked the claims against
 * evidence and left a signed revisions.jsonl record; "updated" means the files
 * changed. Until 2026-08-23 one field carried both meanings, so this line reported
 * edits as reviews — 55 of 64 modules overstated their review date here, by a median
 * of 13 days and up to 148.
 *
 * A module with no review shows the updated date alone rather than a fabricated one.
 * Showing nothing where nothing is known is the point of the split.
 */
function LastReviewedNote({ moduleId }: { moduleId: string }) {
  const lastReviewed = MODULE_LAST_REVIEWED[moduleId] // eslint-disable-line security/detect-object-injection
  const lastEdited = MODULE_LAST_EDITED[moduleId] // eslint-disable-line security/detect-object-injection
  if (!lastReviewed && !lastEdited) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
      <CalendarCheck size={13} aria-hidden="true" />
      <span>
        {lastReviewed ? `Content last reviewed ${lastReviewed}` : 'Not yet fact-checked'}
        {lastEdited && lastEdited !== lastReviewed ? ` · last updated ${lastEdited}` : ''}
      </span>
    </div>
  )
}

/**
 * The standards this module's own content.ts cites, each linked into the
 * Library by reference id.
 *
 * Distinct from the list below it on purpose. That list is the library's view
 * — every row tagged with this module id, often dozens — and it answers "what
 * else is relevant here". This one answers "what does this module actually
 * teach from", which is a much shorter and more useful answer, and it was not
 * shown anywhere in the product before 2026-08-21.
 */
function CitedStandards({ moduleId }: { moduleId: string }) {
  const cited = MODULE_CITED_STANDARDS[moduleId] // eslint-disable-line security/detect-object-injection
  if (!cited || cited.length === 0) return null
  return (
    <section className="mb-6">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-1">
        <Quote size={14} aria-hidden="true" />
        Cited in this module
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        The documents this module&apos;s claims are drawn from. Each opens its Library entry.
      </p>
      <ul className="space-y-2 list-none">
        {cited.map((std) => (
          <li key={std.id} className="glass-panel p-3">
            <Link
              to={std.deepLink}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              {std.title || std.id}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">{std.id}</span>
              {std.organization && (
                <span className="text-xs text-muted-foreground">{std.organization}</span>
              )}
              {std.type && (
                <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted/30">
                  {std.type}
                </span>
              )}
              {/* Status is shown deliberately: a learner should see
                  "Draft Standard (not yet published)" next to FIPS 206 rather
                  than infer from its absence. */}
              {std.status && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {std.status}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ModuleReferencesTab({ moduleId }: ModuleReferencesTabProps) {
  const cited = MODULE_CITED_STANDARDS[moduleId] ?? [] // eslint-disable-line security/detect-object-injection
  const citedIds = new Set(cited.map((s) => s.id))
  // Anything already named above is not repeated here.
  const items = getLibraryItemsForModule(moduleId).filter((i) => !citedIds.has(i.referenceId))

  if (items.length === 0 && cited.length === 0) {
    return (
      <div>
        <LastReviewedNote moduleId={moduleId} />
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No references yet"
          description="This module doesn't have linked references — the Learn tab is the place to dive in."
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <LastReviewedNote moduleId={moduleId} />
      <CitedStandards moduleId={moduleId} />
      {items.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {cited.length > 0 ? 'Further s' : 'S'}tandards, RFCs, and guidance documents relevant to
          this module. All items are also available in the{' '}
          <Link to="/library" className="text-primary hover:underline">
            Standards Library
          </Link>
          .
        </p>
      )}
      {items.map((item) => (
        <div key={item.referenceId} className="glass-panel p-4 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <a
                href={item.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                {item.documentTitle}
                <ExternalLink
                  size={12}
                  className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                />
              </a>
              {/* A paid standard is still worth naming — ISO/IEC 18013-5 defines
                  the mdoc format whether or not a reader can download it — but
                  the link above goes to a shop, not a document. Say so on the
                  link itself rather than letting it read as a download. */}
              {item.accessType === 'paid' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20 whitespace-nowrap">
                  Purchase required
                </span>
              )}
            </div>
            {item.accessType === 'paid' && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.authorsOrOrganization || 'The publisher'} sells this standard — the link above
                is a purchase page, not a free download.
                {item.freeSummaryUrl && (
                  <>
                    {' '}
                    <a
                      href={item.freeSummaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Read a free summary
                      <ExternalLink size={10} className="shrink-0" />
                    </a>{' '}
                    <span className="opacity-80">
                      (an abstract describing the standard — not the standard itself).
                    </span>
                  </>
                )}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">
                {item.authorsOrOrganization}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted/30">
                {item.documentType}
              </span>
              {item.documentStatus && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {item.documentStatus}
                </span>
              )}
              {item.pqcRound && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-info/10 text-info border border-info/20">
                  {item.pqcRound}
                </span>
              )}
              {item.mathFamily?.map((fam) => (
                <span
                  key={fam}
                  className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20"
                >
                  {fam}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {item.shortDescription}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
