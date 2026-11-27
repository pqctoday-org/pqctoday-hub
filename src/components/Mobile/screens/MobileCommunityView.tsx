// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ShieldCheck, Building2, ExternalLink, X, Award, FolderGit2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { leadersData, deprecatedLeaderSuccessors, type Leader } from '@/data/leadersData'
import { LEADER_CATEGORIES } from '@/components/Leaders/LeaderCategorySidebar'
import { cn } from '@/lib/utils'
import { canonicalLeaderCountry } from '@/data/leaderCountry'
import { MobileSheet } from '../primitives/Sheet'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { MobilePersonaPageNote } from '@/components/Mobile/MobilePersonaPageNote'
import {
  filterLeadersByParams,
  leaderForwardedMessage,
  LEADERS_REGION_LABELS,
  leaderPatentsHref,
  resolveLeaderParam,
} from '@/components/Leaders/leaderDeepLink'
import {
  LEADER_PROVENANCE_SENTENCE,
  LEADER_REMOVAL_REQUEST_URL,
  catalogProductsHeading,
  leaderTimelineCountry,
  productLabelFromId,
} from '@/components/Leaders/leadersConstants'
import { useUrlBackedText } from '@/hooks/useUrlBackedText'
import { LeaderKeyResources } from '@/components/common/LeaderKeyResources'
import { formatDate } from '@/lib/format'

const TYPE_STYLE: Record<string, string> = {
  Public: 'bg-status-info/15 text-status-info border-status-info/30',
  Private: 'bg-secondary/10 text-secondary border-secondary/20',
  Academic: 'bg-success/15 text-success-legible border-success/30',
}

/** Humanizes the real ISO verifiedDate field ("2026-07-09" -> "Jul 2026").
 *  No existing formatter for this on desktop — LeaderCard.tsx/
 *  LeaderDetailSection.tsx both print the raw ISO string verbatim
 *  ("Profile checked 2026-07-09"). This is a real, honest derivation of the same
 *  real field, not a re-invented one. */
function humanizeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return formatDate(d, 'month', { utc: true })
}

/** Desktop `/leaders` filters the phone has no control for. They narrow the
 *  list (same semantics, via leaderDeepLink.filterLeadersByParams) and each
 *  shows as a removable chip. `cat` is not here: the category chips ARE its
 *  control. */
const LINK_FILTERS: { key: string; label: string; format?: (v: string) => string }[] = [
  { key: 'sector', label: 'Sector' },
  // eslint-disable-next-line security/detect-object-injection -- region is a filter id
  { key: 'region', label: 'Region', format: (v) => LEADERS_REGION_LABELS[v] ?? v },
  // Shown in the rows' spelling: an old ?country=USA link reads "United States".
  { key: 'country', label: 'Country', format: (v) => canonicalLeaderCountry(v) },
]

/**
 * Mobile Community (handoff Phase 7 — Reference set, design handoff §21).
 * Source: leadersData.ts, LeaderCategorySidebar.tsx (LEADER_CATEGORIES).
 *
 * Real corrections against the README's own §21 text and the mockup,
 * verified against live code before writing any UI:
 * - The mockup's subtitle sentence doesn't exist as on-screen copy — the
 *   page's own description is used, plus how profiles are compiled
 *   (LEADER_PROVENANCE_SENTENCE; owner decision 2026-11-14 replaced the old
 *   "listed only with written consent", which 109 auto-imported rows contradict).
 * - "Sort defaults to relevance to what you were reading" describes a
 *   mechanism that doesn't exist anywhere in the codebase (no reading-
 *   history/current-document tracking). The real, closest mechanism —
 *   persona/industry-based relevance, executive-only — needs the full
 *   PERSONA_LEADER_GUIDANCE + industryRelevant machinery from the 1061-line
 *   LeadersGrid.tsx; out of scope for this distillation. A plain category
 *   filter (the real 8-value LEADER_CATEGORIES taxonomy) is used instead,
 *   stated as a simplification.
 * - "Academic"/"Public" badges render as "{type} Sector" verbatim on
 *   desktop (LeaderCard.tsx) — matched here, not shortened.
 * - The mockup's "GRI Quantum Threat Timeline 2026" citation doesn't exist;
 *   the real reference is "GRI-Quantum-Threat-Timeline-2025" — citation
 *   chips below render leaders' real `keyResourceRefs` verbatim, so this
 *   class of error can't recur.
 * - The recorded `peerReviewed` flag can coexist with a profile-check date.
 *   Neither establishes institutional review or endorsement of the profile.
 *
 * Defaults to curated profiles only (sourceKind === 'curated'), matching
 * desktop's own default browsing set — the ~130 single-sentence auto-
 * imported stubs are a stated cut, not a hidden filter.
 */
export function MobileCommunityView() {
  // The open profile lives in ?leader=<leader_id> (old name links still resolve),
  // the same param desktop reads, so
  // shared links, Assistant citations and cross-page links open it on a phone
  // too. Resolved against ALL rows (not just the curated list below), so a
  // linked document-contributor stub still opens. Open pushes; close replaces.
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInput = useRef<HTMLInputElement>(null)
  const leaderParam = searchParams.get('leader')?.trim() || null
  const match = useMemo(
    () =>
      leaderParam
        ? resolveLeaderParam(leadersData, leaderParam, deprecatedLeaderSuccessors)
        : undefined,
    [leaderParam]
  )
  const selected: Leader | null = match?.leader ?? null
  // A link to a merged duplicate's leader_id opens the kept profile; the sheet
  // says so (it covers the page, so the notice lives inside it).
  const [dismissedForward, setDismissedForward] = useState<string | null>(null)
  const forwardedFrom =
    match?.forwardedFrom && dismissedForward !== leaderParam ? match.forwardedFrom : null
  const [dismissedNotFound, setDismissedNotFound] = useState<string | null>(null)
  const notFound =
    leaderParam && !selected && dismissedNotFound !== leaderParam ? leaderParam : null
  const setSelected = useCallback(
    (leader: Leader | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (leader) next.set('leader', leader.leaderId)
          else next.delete('leader')
          return next
        },
        { replace: !leader }
      )
    },
    [setSearchParams]
  )

  // The category chips are the phone's control for desktop's ?cat= (same
  // inclusive leaderMatchesCategory semantics), so they read and write it
  // (replace — a filter, not a place) and a desktop category link lands here.
  const catParam = searchParams.get('cat')?.trim()
  const category = catParam && catParam !== 'All' ? catParam : null
  const setFilterParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )
  const { text: query, update: updateSearch } = useUrlBackedText(
    searchParams.get('q') ?? '',
    (value) => setFilterParam('q', value || null)
  )
  const linkChips = LINK_FILTERS.flatMap(({ key, label, format }) => {
    const value = searchParams.get(key)?.trim()
    return value && value !== 'All' ? [{ key, label, text: format ? format(value) : value }] : []
  })
  // A ?cat the chip row can't show (not one of the 8 categories) still filters.
  if (category && !(LEADER_CATEGORIES as readonly string[]).includes(category))
    linkChips.unshift({ key: 'cat', label: 'Category', text: category })

  const curated = useMemo(() => leadersData.filter((l) => l.sourceKind === 'curated'), [])
  const filtered = useMemo(
    () => filterLeadersByParams(curated, searchParams),
    [curated, searchParams]
  )

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-3">
        <h1 className="sr-only">Community</h1>
        <p className="text-[11.5px] text-muted-foreground">
          {curated.length} hand-curated profiles
        </p>
      </div>

      <p className="mb-4 text-[11.5px] leading-relaxed text-muted-foreground">
        Evidence-linked profiles from post-quantum research, standards, policy, and implementation
        sources. Inclusion is not an endorsement or ranking. {LEADER_PROVENANCE_SENTENCE} Anyone
        listed can{' '}
        <a
          href={LEADER_REMOVAL_REQUEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-2"
        >
          ask for a correction or removal
        </a>
        .
      </p>

      {notFound && (
        <DeepLinkNotice
          kind="not-found"
          message={`"${notFound}" was not found in the Community list.`}
          onDismiss={() => setDismissedNotFound(notFound)}
        />
      )}

      {/* Same role note as desktop /leaders (it carries the certification role's directory-gap disclosure). */}
      <MobilePersonaPageNote route="/leaders" className="mb-3" />

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm">
          Search community by name or role
          <input
            ref={searchInput}
            type="search"
            value={query}
            onChange={(event) => updateSearch(event.target.value)}
            className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        {query && (
          <Button
            variant="outline"
            onClick={() => {
              updateSearch('')
              searchInput.current?.focus()
            }}
          >
            Clear community search
          </Button>
        )}
      </div>

      <div className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setFilterParam('cat', null)}
          aria-pressed={category === null}
          className={cn(
            'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
            category === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground'
          )}
        >
          All
        </Button>
        {LEADER_CATEGORIES.map((cat) => (
          <Button
            type="button"
            variant="ghost"
            key={cat}
            onClick={() => setFilterParam('cat', category === cat ? null : cat)}
            aria-pressed={category === cat}
            className={cn(
              'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
              category === cat
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {linkChips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5" data-testid="leader-link-filters">
          {linkChips.map(({ key, label, text }) => (
            <span
              key={key}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted/60 py-0.5 pl-2.5 text-[11.5px]"
            >
              <span className="text-muted-foreground">{label}:</span>
              <span className="truncate font-medium text-foreground">{text}</span>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove ${label} filter`}
                onClick={() => setFilterParam(key, null)}
                className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:bg-transparent"
              >
                <X size={12} aria-hidden="true" />
              </Button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p role="status" className="text-[12.5px] text-muted-foreground">
            {query || linkChips.length > 0
              ? 'No one matches these filters.'
              : 'No one matches this category.'}
          </p>
        )}
        {filtered.map((leader) => (
          <Button
            type="button"
            variant="ghost"
            key={leader.id}
            onClick={() => setSelected(leader)}
            // Button's own base classes hard-code whitespace-nowrap; this
            // button wraps leader.title (a real, potentially long job
            // title), which inherited nowrap and would run off the right
            // edge instead of wrapping (2026-08-24, same defect class found
            // and fixed on Threats/Patents).
            className="glass-panel rounded-2xl h-auto w-full flex-col items-start gap-1.5 whitespace-normal p-3.5 text-left font-normal"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[14px] font-bold text-foreground">{leader.name}</h2>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-sim-chip font-bold',
                  TYPE_STYLE[leader.type]
                )}
              >
                {leader.type} Sector
              </span>
            </div>

            <p className="text-[11.5px] text-muted-foreground">{leader.title}</p>
            {leader.organizations.map((org) => (
              <p
                key={org}
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-primary"
              >
                <Building2 size={12} className="shrink-0" aria-hidden="true" />
                {org}
              </p>
            ))}

            {leader.keyResourceRefs && leader.keyResourceRefs.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Cite:
                </span>
                {leader.keyResourceRefs.map((ref) => (
                  <span
                    key={ref}
                    className="rounded border border-primary/25 bg-primary/5 px-1.5 py-px font-mono text-[10px] text-primary"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-muted-foreground">
              <span>{leader.category}</span>
              <span>·</span>
              <span>{leader.country}</span>
              {leader.verifiedDate && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-success-legible">
                    <ShieldCheck size={11} aria-hidden="true" />
                    profile checked {humanizeDate(leader.verifiedDate)}
                  </span>
                </>
              )}
              {leader.peerReviewed === 'yes' && (
                <>
                  <span>·</span>
                  <span>review flag recorded</span>
                </>
              )}
            </p>
          </Button>
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Sort options, the {leadersData.length - curated.length} document-contributor stubs, and the
        form to join the list are on a laptop.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        large
        shareUrl={
          selected
            ? `/leaders?leader=${encodeURIComponent(selected.leaderId || selected.name)}`
            : undefined
        }
        testId="leader-detail-sheet"
      >
        {selected && (
          <div className="flex flex-col gap-3">
            {forwardedFrom && (
              <DeepLinkNotice
                kind="moved"
                message={leaderForwardedMessage(forwardedFrom, selected)}
                onDismiss={() => setDismissedForward(leaderParam)}
              />
            )}
            <div>
              <h2 className="text-[15px] font-bold leading-snug text-foreground">
                {selected.name}
              </h2>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{selected.title}</p>
            </div>
            {selected.bio && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">{selected.bio}</p>
            )}
            {selected.organizations.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-border pt-3">
                {selected.organizations.map((org) => (
                  <p
                    key={org}
                    className="flex items-center gap-1.5 text-[11.5px] font-semibold text-primary"
                  >
                    <Building2 size={12} className="shrink-0" aria-hidden="true" />
                    {org}
                  </p>
                ))}
              </div>
            )}
            {(selected.websiteUrl || selected.linkedinUrl) && (
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                {selected.websiteUrl && (
                  <a
                    href={selected.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-primary"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    Website
                  </a>
                )}
                {selected.linkedinUrl && (
                  <a
                    href={selected.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-primary"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    LinkedIn
                  </a>
                )}
              </div>
            )}
            {selected.patentRefs && selected.patentRefs.length > 0 && (
              <Link
                to={leaderPatentsHref(selected.patentRefs)}
                className="flex items-center gap-1.5 border-t border-border pt-3 text-[11.5px] font-semibold text-primary"
              >
                <Award size={12} aria-hidden="true" />
                View {selected.patentRefs.length} patent
                {selected.patentRefs.length === 1 ? '' : 's'}
              </Link>
            )}
            {selected.migrateCatalogRefs && selected.migrateCatalogRefs.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {catalogProductsHeading(selected.migrateCatalogRefs)}
                </p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {selected.migrateCatalogRefs.map((productId) => (
                    <Link
                      key={productId}
                      to={`/migrate?product=${encodeURIComponent(productId)}&tab=replace`}
                      className="flex items-center gap-1.5 text-[11.5px] font-semibold text-primary"
                    >
                      <FolderGit2 size={12} className="shrink-0" aria-hidden="true" />
                      {productLabelFromId(productId)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <LeaderKeyResources leader={selected} size="xs" />
            {leaderTimelineCountry(selected.country) && (
              <Link
                to={`/timeline?country=${encodeURIComponent(leaderTimelineCountry(selected.country) ?? '')}`}
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-primary"
              >
                <Clock size={12} aria-hidden="true" />
                Events from {leaderTimelineCountry(selected.country)}
              </Link>
            )}
            {selected.vettingBody && selected.vettingBody.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Institutions in source metadata
                </p>
                <p className="mt-0.5 text-[11.5px] text-foreground">
                  {selected.vettingBody.join(', ')}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  These recorded names do not establish institutional review or endorsement of this
                  profile.
                </p>
              </div>
            )}
            <p className="flex flex-wrap items-center gap-x-1.5 border-t border-border pt-3 text-[10.5px] text-muted-foreground">
              <span>{selected.category}</span>
              <span>·</span>
              <span>{selected.country}</span>
              {selected.verifiedDate && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-success-legible">
                    <ShieldCheck size={11} aria-hidden="true" />
                    profile checked {humanizeDate(selected.verifiedDate)}
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </MobileSheet>
    </div>
  )
}
