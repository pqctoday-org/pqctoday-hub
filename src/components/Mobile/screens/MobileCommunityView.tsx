// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ShieldCheck, Building2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { leadersData, type Leader } from '@/data/leadersData'
import { LEADER_CATEGORIES } from '@/components/Leaders/LeaderCategorySidebar'
import { cn } from '@/lib/utils'
import { MobileSheet } from '../primitives/Sheet'

const TYPE_STYLE: Record<string, string> = {
  Public: 'bg-status-info/15 text-status-info border-status-info/30',
  Private: 'bg-secondary/10 text-secondary border-secondary/20',
  Academic: 'bg-success/15 text-success border-success/30',
}

/** Humanizes the real ISO verifiedDate field ("2026-07-09" -> "Jul 2026").
 *  No existing formatter for this on desktop — LeaderCard.tsx/
 *  LeaderDetailSection.tsx both print the raw ISO string verbatim
 *  ("Verified 2026-07-09"). This is a real, honest derivation of the same
 *  real field, not a re-invented one. */
function humanizeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Mobile Community (handoff Phase 7 — Reference set, design handoff §21).
 * Source: leadersData.ts, LeaderCategorySidebar.tsx (LEADER_CATEGORIES).
 *
 * Real corrections against the README's own §21 text and the mockup,
 * verified against live code before writing any UI:
 * - The mockup's subtitle sentence doesn't exist as on-screen copy — the
 *   real sentence (PageHeader description + LeaderConsentModal.tsx verbatim)
 *   is used instead: "People contributing to the advances of post-quantum
 *   cryptography. Community members are listed only with written consent."
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
 * - "Peer reviewed" is real (`peerReviewed` field) but not mutually
 *   exclusive with a verified date — real rows carry both simultaneously.
 *   Shown alongside verification, not instead of it.
 *
 * Defaults to curated profiles only (sourceKind === 'curated'), matching
 * desktop's own default browsing set — the ~130 single-sentence auto-
 * imported stubs are a stated cut, not a hidden filter.
 */
export function MobileCommunityView() {
  const [category, setCategory] = useState<string | null>(null)
  const [selected, setSelected] = useState<Leader | null>(null)

  const curated = useMemo(() => leadersData.filter((l) => l.sourceKind === 'curated'), [])
  const filtered = useMemo(
    () => (category ? curated.filter((l) => l.category === category) : curated),
    [curated, category]
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
        People contributing to the advances of post-quantum cryptography. Community members are
        listed <span className="font-semibold text-foreground">only with written consent</span>.
      </p>

      <div className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCategory(null)}
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
            onClick={() => setCategory((c) => (c === cat ? null : cat))}
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

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">No one matches this category.</p>
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
            className="glass-panel h-auto w-full flex-col items-start gap-1.5 whitespace-normal p-3.5 text-left font-normal"
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
                  <span className="flex items-center gap-1 text-success">
                    <ShieldCheck size={11} aria-hidden="true" />
                    verified {humanizeDate(leader.verifiedDate)}
                  </span>
                </>
              )}
              {leader.peerReviewed === 'yes' && (
                <>
                  <span>·</span>
                  <span>peer reviewed</span>
                </>
              )}
            </p>
          </Button>
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Sort options, the {leadersData.length - curated.length} document-contributor stubs, and the
        consent/removal request flow are on a laptop.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        large
        testId="leader-detail-sheet"
      >
        {selected && (
          <div className="flex flex-col gap-3">
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
            {selected.keyResourceRefs && selected.keyResourceRefs.length > 0 && (
              <div className="border-t border-border pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Cite:
                </span>
                {/* keyResourceRefs[i] pairs positionally with keyResourceUrl[i]
                    (leadersData.ts's own documented convention) — guard the
                    index rather than assume the two arrays are the same
                    length, then link only where a real URL exists at that
                    position. Was dropped from this sheet entirely (2026-08-24
                    audit R4.2): the card shows these chips, but tapping
                    through to the detail sheet lost them — "the point of the
                    page" (a claim with a name behind it) had no reachable
                    reference. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {selected.keyResourceRefs.map((ref, i) => {
                    const url = selected.keyResourceUrl?.[i]
                    const chipClass =
                      'rounded border border-primary/25 bg-primary/5 px-1.5 py-px font-mono text-[10px] text-primary'
                    return url ? (
                      <a
                        key={ref}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(chipClass, 'underline decoration-dotted underline-offset-2')}
                      >
                        {ref}
                      </a>
                    ) : (
                      <span key={ref} className={chipClass}>
                        {ref}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {selected.vettingBody && selected.vettingBody.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                  Vetted by
                </p>
                <p className="mt-0.5 text-[11.5px] text-foreground">
                  {selected.vettingBody.join(', ')}
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
                  <span className="flex items-center gap-1 text-success">
                    <ShieldCheck size={11} aria-hidden="true" />
                    verified {humanizeDate(selected.verifiedDate)}
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
