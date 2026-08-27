// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryDetailDrawer — the drill-down home for the dense per-document data the
 * medium-density card drops. Right-anchored overlay with a transform-only
 * entrance (no opacity animation, resting opacity 1 — see the handoff note).
 * Supersedes LibraryDetailPopover; reuses DocumentAnalysis for the enrichment
 * sections and replicates the CSWP-39 pillar rollup.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { X, ExternalLink, Bookmark, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '@/data/libraryData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import { PILLAR_TO_ZONE } from '@/data/cswp39ZoneData'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'
import { getTrustScore } from '@/data/trustScore'
import { DocumentAnalysis } from '@/components/common/DocumentAnalysis'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import {
  buildLibraryEndorsementUrl,
  buildLibraryFlagUrl,
} from '@/components/Library/libraryEndorsement'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '@/components/ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import { lifecycleLabel, lifecyclePillClass, formatLibDate, trustInfo } from './libraryPills'

interface LibraryDetailDrawerProps {
  item: LibraryItem | null
  bookmarked: boolean
  onToggleBookmark: (referenceId: string) => void
  onClose: () => void
}

/** Outer guard — remounts the panel per document so the entrance animation and
 *  scroll position reset cleanly each open. */
export function LibraryDetailDrawer(props: LibraryDetailDrawerProps) {
  if (!props.item) return null
  return <DrawerPanel key={props.item.referenceId} {...props} item={props.item} />
}

const PILLAR_ORDER = ['inventory', 'governance', 'lifecycle', 'observability', 'assurance'] as const

function KeyFact({ label, value }: { label: string; value?: string }) {
  if (!value || value === '—') return null
  return (
    <div>
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-[12.5px] text-foreground">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function DrawerPanel({
  item,
  bookmarked,
  onToggleBookmark,
  onClose,
}: LibraryDetailDrawerProps & { item: LibraryItem }) {
  // Transform-only entrance: mount at translateX(26px), flip to 0 next frame.
  const [entered, setEntered] = useState(false)
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const { revisions } = useRevisions()
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const reqs = maturityByRefId.get(item.referenceId) ?? []
  const groupedMaturity = PILLAR_ORDER.map((p) => ({
    pillar: p,
    reqs: reqs.filter((r) => r.pillar === p).sort((a, b) => a.maturityLevel - b.maturityLevel),
  })).filter((g) => g.reqs.length > 0)
  const enrichment = libraryEnrichments[item.referenceId]
  const ts = getTrustScore('library', item.referenceId)
  const trust = trustInfo(item.referenceId)

  return (
    <div
      className="fixed inset-0 z-50 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={item.documentTitle}
    >
      {/* scrim */}
      <Button
        type="button"
        variant="ghost"
        aria-label="Close detail"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default rounded-none bg-black/60 hover:bg-black/60"
      />
      <span className="sr-only" aria-live="polite" />

      {/* panel */}
      <div
        className="absolute right-0 top-0 flex h-full w-[540px] max-w-[94vw] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200 ease-out"
        style={{ transform: entered ? 'translateX(0)' : 'translateX(26px)' }}
      >
        {/* header */}
        <div className="flex items-start gap-3 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-semibold text-primary">
                {item.referenceId}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${lifecyclePillClass(
                  item.groupStatusBucket ?? item.documentStatusBucket
                )}`}
              >
                {lifecycleLabel(item.groupStatusBucket ?? item.documentStatusBucket)}
              </span>
              {item.status && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    item.status === 'New'
                      ? 'bg-success/15 text-success'
                      : 'bg-primary/15 text-primary'
                  }`}
                >
                  {item.status}
                </span>
              )}
              <ReviewedBadge
                domain="library"
                entityId={item.referenceId}
                onOpenDrilldown={() => setDrilldownOpen(true)}
              />
            </div>
            <h2 className="mt-1.5 text-[18px] font-bold leading-snug text-foreground">
              {item.documentTitle}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Building2 size={13} aria-hidden="true" />
              <span className="truncate">{item.authorsOrOrganization || 'Unknown'}</span>
              {/* The document's own publication date is the primary signal here;
                  lastUpdateDate (catalog activity) is the fallback, matching the card. */}
              {(item.initialPublicationDate || item.lastUpdateDate) && (
                <span
                  className="font-mono text-[11px]"
                  title={
                    item.initialPublicationDate
                      ? `Published ${formatLibDate(item.initialPublicationDate)}`
                      : `Catalog record updated ${formatLibDate(item.lastUpdateDate)}`
                  }
                >
                  ·{' '}
                  {item.initialPublicationDate
                    ? formatLibDate(item.initialPublicationDate)
                    : formatLibDate(item.lastUpdateDate)}
                </span>
              )}
              {/* Sparse by design (most rows have never been re-checked) — shown
                  only when present, so it never implies false precision. */}
              {item.lastVerified && (
                <span
                  className="font-mono text-[11px] text-muted-foreground/70"
                  title={`Last verified against the source document ${formatLibDate(item.lastVerified)}`}
                >
                  · verified {formatLibDate(item.lastVerified)}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
            className="h-auto shrink-0 min-h-[44px] min-w-[44px] p-2.5 md:min-h-0 md:min-w-0 md:p-1.5"
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        {/* body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {item.shortDescription && (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {item.shortDescription}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
            <KeyFact label="Type" value={item.documentType} />
            <KeyFact label="Algorithm family" value={item.algorithmFamily} />
            <KeyFact label="Security levels" value={item.securityLevels} />
            <KeyFact label="Region" value={item.regionScope} />
            <KeyFact label="Migration urgency" value={item.migrationUrgency} />
            <KeyFact
              label="Citations"
              value={item.citationCount != null ? String(item.citationCount) : undefined}
            />
          </dl>

          {item.categories?.length > 0 && (
            <Section title="Categories">
              <div className="flex flex-wrap gap-1.5">
                {item.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-muted/60 px-2 py-0.5 text-[11.5px] text-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {item.dependencies && (
            <Section title="Builds on">
              <div className="flex flex-wrap gap-1.5">
                {item.dependencies
                  .split(';')
                  .map((d) => d.trim())
                  .filter(Boolean)
                  .map((d) => (
                    <span
                      key={d}
                      className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {d}
                    </span>
                  ))}
              </div>
            </Section>
          )}

          {item.priorRevisions && item.priorRevisions.length > 0 && (
            <Section title={`Previous revisions (${item.priorRevisions.length})`}>
              <ul className="space-y-2">
                {item.priorRevisions.map((rev) => (
                  <li
                    key={rev.referenceId}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border p-2.5"
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-[12.5px] text-foreground"
                        title={rev.documentTitle}
                      >
                        {rev.documentTitle}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${lifecyclePillClass(
                            rev.documentStatusBucket
                          )}`}
                        >
                          {lifecycleLabel(rev.documentStatusBucket)}
                        </span>
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {rev.referenceId}
                        </span>
                      </div>
                    </div>
                    {rev.downloadUrl && (
                      <a
                        href={rev.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-[12px] text-secondary hover:text-primary"
                        title={`Open source for ${rev.referenceId}`}
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                        Source
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {groupedMaturity.length > 0 && (
            <Section title="CSWP-39 requirements">
              <div className="space-y-3">
                {groupedMaturity.map((g) => {
                  const zone = PILLAR_TO_ZONE[g.pillar]
                  return (
                    <div key={g.pillar}>
                      <div className="mb-1 flex items-center gap-1.5">
                        {/* Pillar badge restored as a click-through to its
                            Command Center zone (design_handoff_2026_pages/
                            IMPLEMENTATION-PLAN-LIBRARY-2026-08-01.md §3.2) —
                            was removed with no replacement in this drawer. */}
                        <Link
                          to={`/business#zone-${zone}`}
                          className="text-[12px] font-semibold capitalize text-foreground hover:text-primary hover:underline"
                          title={`Open the ${zone} zone in Command Center`}
                        >
                          {g.pillar}
                        </Link>
                        <div className="flex gap-0.5" aria-hidden="true">
                          {[1, 2, 3, 4].map((tier) => (
                            <span
                              key={tier}
                              className={`h-1.5 w-1.5 rounded-full ${
                                g.reqs.some((r) => r.maturityLevel === tier)
                                  ? 'bg-primary'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {g.reqs.map((r, i) => (
                          <li key={i} className="text-[12px] text-muted-foreground">
                            <span className="font-mono text-[10.5px] text-primary">
                              L{r.maturityLevel}
                            </span>{' '}
                            {r.requirement}
                            {/* Evidence quote/location/confidence — present in
                                the legacy table-view popover but never ported
                                to this drawer (a real regression, not just a
                                missing link). */}
                            {r.evidenceQuote && (
                              <blockquote className="mt-0.5 text-[11px] text-muted-foreground/80 border-l-2 border-border pl-2 italic line-clamp-3">
                                {r.evidenceQuote}
                              </blockquote>
                            )}
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                              {r.evidenceLocation && <span>{r.evidenceLocation}</span>}
                              {r.confidence && <span>· {r.confidence} confidence</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
              {/* Evidence-reference deep link, restored (same plan §3.2) —
                  jumps to this document's own governance evidence inside the
                  CSWP.39 Agility explorer. */}
              <Link
                to={`/compliance?tab=cswp39&evref=${encodeURIComponent(item.referenceId)}`}
                className="mt-2 inline-block text-[11px] font-medium text-primary hover:underline"
              >
                Open in CSWP.39 evidence map →
              </Link>
            </Section>
          )}

          {enrichment && (
            <Section title="Analysis">
              <DocumentAnalysis enrichment={enrichment} />
            </Section>
          )}

          <Section title="Trust & evidence">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <KeyFact
                label="Trust score"
                value={trust.score != null ? `${trust.score} (${ts?.tier})` : undefined}
              />
              <KeyFact label="Source quality" value={item.downloadUrlQuality} />
              <KeyFact label="Vetting body" value={item.vettingBody?.join(', ')} />
              <KeyFact label="Peer reviewed" value={item.peerReviewed} />
              <KeyFact
                label="Confidence score"
                value={item.confidenceScore != null ? `${item.confidenceScore}/100` : undefined}
              />
            </dl>
          </Section>

          {item.applicableIndustries?.length > 0 && (
            <Section title="Applicable industries">
              <div className="flex flex-wrap gap-1.5">
                {item.applicableIndustries.map((ind) => (
                  <span
                    key={ind}
                    className="rounded-md bg-muted/60 px-2 py-0.5 text-[11.5px] text-muted-foreground"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center gap-2 gap-y-2 border-t border-border bg-background p-3">
          {item.downloadUrl ? (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="basis-full sm:basis-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
            >
              Open document
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ) : (
            <span
              className="basis-full sm:basis-auto flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 py-2 text-[13px] font-semibold text-muted-foreground"
              title="No public source link is available for this document yet."
            >
              Source not available
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onToggleBookmark(item.referenceId)}
            aria-pressed={bookmarked}
            className="h-auto gap-1.5 px-3 py-2 text-[13px]"
          >
            <Bookmark
              size={14}
              className={bookmarked ? 'fill-primary text-primary' : ''}
              aria-hidden="true"
            />
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
          <EndorseButton
            endorseUrl={buildLibraryEndorsementUrl(item, true)}
            resourceLabel={`${item.referenceId} — ${item.documentTitle}`}
            resourceType="Library Resource"
          />
          <FlagButton
            flagUrl={buildLibraryFlagUrl(item, true)}
            resourceLabel={`${item.referenceId} — ${item.documentTitle}`}
            resourceType="Library Resource"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="ml-auto h-auto px-3 py-2 text-[13px] text-muted-foreground"
          >
            Close
          </Button>
        </div>
      </div>

      {drilldownOpen && (
        <RevisionDrilldownPanel
          domain="library"
          entityId={item.referenceId}
          entityLabel={item.documentTitle}
          revisions={byRecord(revisions, 'library', item.referenceId)}
          onClose={() => setDrilldownOpen(false)}
        />
      )}
    </div>
  )
}
