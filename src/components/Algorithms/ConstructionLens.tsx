// SPDX-License-Identifier: AGPL-3.0-only
//
// Construction views for the Industry Landscape tab (2026-11-13):
//   - ConstructionChip       — a construction, its outlook colour and use-case count
//   - ConstructionDiagram    — the code-drawn flow (inputs → algorithms → combiner → outputs)
//   - ConstructionCard       — plain explanation, outlook, "works with" strip, successors
//   - TransitionMap          — today's constructions → the post-quantum picture
//   - ConstructionsOverview  — industries × constructions at a glance
//   - ConstructionPairing    — the per-use-case line (today → target)
// Every label comes from cryptoConstructions.ts and every count from
// constructionUsage.ts, so the views cannot drift from the data.

import { ArrowDown, ArrowRight, BookOpen, GraduationCap, Octagon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../ui/button'
import {
  CRYPTO_CONSTRUCTIONS,
  PQC_OUTLOOK_LABEL,
  PQC_OUTLOOK_ORDER,
  STANDARDS_STATUS_LABEL,
  getConstruction,
  instantiationsOf,
  predecessorsOf,
  type CryptoConstruction,
  type PqcOutlook,
  type StandardsStatus,
} from '../../data/cryptoConstructions'
import { getMechanismFamily } from '../../data/cryptoMechanisms'
import type { ConstructionUsage } from '../../data/constructionUsage'
import type { IndustryUseCase } from '../../data/industryLandscapeData'
import { parseGlossaryText } from '../../utils/parseGlossary'

const OUTLOOK_CHIP: Record<PqcOutlook, string> = {
  'stays-both': 'border-primary/40 bg-primary/10 text-primary',
  replaced: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
  bridge: 'border-accent/50 bg-accent/10 text-foreground',
  'pqc-native': 'border-status-success/40 bg-status-success/10 text-status-success',
  'no-successor-yet': 'border-border bg-muted/60 text-muted-foreground',
}

const STATUS_STYLE: Record<StandardsStatus, string> = {
  published: 'border-status-success/40 text-status-success',
  'vendor-spec': 'border-primary/40 text-primary',
  draft: 'border-status-warning/40 text-status-warning',
  study: 'border-border text-muted-foreground',
  research: 'border-border text-muted-foreground',
}

/** Line style for a succession arrow on the transition map, by status. */
const STATUS_LINE: Record<StandardsStatus, string> = {
  published: 'border-solid',
  'vendor-spec': 'border-solid',
  draft: 'border-dashed',
  study: 'border-dotted',
  research: 'border-dotted',
}

export function StatusBadge({ status }: { status: StandardsStatus }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[status]}`}
      data-testid={`status-${status}`}
    >
      {STANDARDS_STATUS_LABEL[status]}
    </span>
  )
}

export function OutlookBadge({ outlook }: { outlook: PqcOutlook }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${OUTLOOK_CHIP[outlook]}`}
      data-testid={`outlook-${outlook}`}
    >
      {PQC_OUTLOOK_LABEL[outlook]}
    </span>
  )
}

export function ConstructionChip({
  id,
  count,
  active,
  onSelect,
}: {
  id: string
  count?: number
  active?: boolean
  onSelect?: (id: string) => void
}) {
  const c = getConstruction(id)
  const style = c ? OUTLOOK_CHIP[c.outlook] : 'border-border bg-muted text-foreground'
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect ? () => onSelect(id) : undefined}
      className={`h-auto rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
        active ? 'border-primary bg-primary text-primary-foreground' : style
      }`}
      title={c ? `${c.label} — ${PQC_OUTLOOK_LABEL[c.outlook]}` : id}
      data-testid={`construction-chip-${id}`}
    >
      {id}
      {count !== undefined && (
        <span className="ml-1 rounded-full bg-background/60 px-1 text-[10px] tabular-nums">
          {count}
        </span>
      )}
    </Button>
  )
}

function AlgorithmBox({ family }: { family: string }) {
  const def = getMechanismFamily(family)
  const pq = def ? !def.classical : false
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-medium ${
        pq
          ? 'border-status-success/50 bg-status-success/10 text-status-success'
          : 'border-border bg-muted/60 text-foreground'
      }`}
    >
      {family}
    </span>
  )
}

function FlowBox({
  children,
  tone = 'plain',
}: {
  children: React.ReactNode
  tone?: 'plain' | 'step'
}) {
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 text-xs ${
        tone === 'step'
          ? 'border-primary/40 bg-primary/5 text-foreground'
          : 'border-border bg-card text-foreground'
      }`}
    >
      {children}
    </div>
  )
}

function FlowArrow() {
  return (
    <>
      <ArrowRight
        size={14}
        className="hidden shrink-0 text-muted-foreground sm:block"
        aria-hidden
      />
      <ArrowDown
        size={14}
        className="shrink-0 self-center text-muted-foreground sm:hidden"
        aria-hidden
      />
    </>
  )
}

/**
 * Code-drawn flow: inputs → algorithm groups (one per instantiation side) →
 * the combining step → outputs. Algorithm boxes are coloured classical vs
 * post-quantum. Stacks vertically below the `sm` breakpoint.
 */
export function ConstructionDiagram({ c }: { c: CryptoConstruction }) {
  const d = c.explain.diagram
  const groups = instantiationsOf(c)
  const sideLabel = { classical: 'Classical', pqc: 'Post-quantum', hybrid: 'Hybrid' } as const
  return (
    <figure
      className="mt-3 rounded-lg border border-border bg-muted/20 p-3"
      data-testid={`construction-diagram-${c.id}`}
      aria-label={`How ${c.label} works`}
    >
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          {d.inputs.map((i) => (
            <FlowBox key={i}>{i}</FlowBox>
          ))}
        </div>
        <FlowArrow />
        <div className="flex flex-col gap-1.5">
          {groups.map(({ side, inst }, n) => (
            <div key={`${side}-${n}`} className="flex flex-wrap items-center gap-1">
              <span className="w-20 text-[10px] uppercase tracking-wide text-muted-foreground">
                {sideLabel[side]}
              </span>
              {inst.algorithms.length > 0 ? (
                inst.algorithms.map((a) => <AlgorithmBox key={a} family={a} />)
              ) : (
                <span className="text-xs text-muted-foreground">no public-key algorithm</span>
              )}
            </div>
          ))}
        </div>
        {d.combiner && (
          <>
            <FlowArrow />
            <FlowBox tone="step">{d.combiner}</FlowBox>
          </>
        )}
        <FlowArrow />
        <div className="flex flex-col gap-1">
          {d.outputs.map((o) => (
            <FlowBox key={o}>{o}</FlowBox>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-[11px] text-muted-foreground">
        Grey boxes are classical algorithms; green boxes are post-quantum.
      </figcaption>
    </figure>
  )
}

function libraryHref(ref: string): string {
  return `/library?ref=${encodeURIComponent(ref)}`
}

/** One line per instantiation: side, algorithms, status, note, source. */
function WorksWith({ c }: { c: CryptoConstruction }) {
  const sideLabel = { classical: 'Classical', pqc: 'Post-quantum', hybrid: 'Hybrid' } as const
  return (
    <div className="mt-3 space-y-1.5" data-testid="construction-works-with">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Works with</span>
      {instantiationsOf(c).map(({ side, inst }, n) => (
        <div key={`${side}-${n}`} className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="w-24 font-medium text-foreground">{sideLabel[side]}</span>
          {inst.algorithms.map((a) => (
            <AlgorithmBox key={a} family={a} />
          ))}
          <StatusBadge status={inst.status} />
          {inst.proofRefs.map((r) => (
            <Link key={r} to={libraryHref(r)} className="text-primary hover:underline">
              {r}
            </Link>
          ))}
          {inst.note && <span className="w-full pl-24 text-muted-foreground">{inst.note}</span>}
        </div>
      ))}
    </div>
  )
}

export function ConstructionCard({
  c,
  usage,
  onPick,
}: {
  c: CryptoConstruction
  usage?: ConstructionUsage
  onPick: (id: string) => void
}) {
  const e = c.explain
  const preds = predecessorsOf(c.id)
  const direct = usage?.direct.length ?? 0
  const industries = usage?.industries.length ?? 0
  const nStandards = usage?.standards.length ?? 0
  const viaIds = [...new Set((usage?.inside ?? []).map((i) => i.via))]
  return (
    <div
      className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-sm"
      data-testid={`construction-card-${c.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{c.label}</span>
        <OutlookBadge outlook={c.outlook} />
        <span className="text-xs text-muted-foreground">
          CycloneDX primitive: {c.cycloneDxPrimitive}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{e.plain}</p>
      {e.analogy && <p className="mt-1 text-sm italic text-muted-foreground">{e.analogy}</p>}
      <p className="mt-2 text-sm text-foreground">
        <span className="font-medium">What changes with PQC: </span>
        {e.whyItMattersForPqc}
      </p>
      <ConstructionDiagram c={c} />
      <WorksWith c={c} />
      {(c.successions?.length ?? 0) > 0 && (
        <div
          className="mt-3 flex flex-wrap items-center gap-1.5 text-xs"
          data-testid="construction-successors"
        >
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Replaced by
          </span>
          {c.successions!.map((s) => (
            <span key={`${s.to}-${s.context}`} className="inline-flex flex-wrap items-center gap-1">
              <ConstructionChip id={s.to} onSelect={onPick} />
              <span className="text-muted-foreground">in {s.context}</span>
              <StatusBadge status={s.status} />
            </span>
          ))}
        </div>
      )}
      {preds.length > 0 && (
        <div
          className="mt-2 flex flex-wrap items-center gap-1.5 text-xs"
          data-testid="construction-predecessors"
        >
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Takes over from
          </span>
          {preds.map((p) => (
            <ConstructionChip key={p.id} id={p.id} onSelect={onPick} />
          ))}
        </div>
      )}
      {c.outlook === 'no-successor-yet' && c.noSuccessorReason && (
        <p className="mt-2 inline-flex items-start gap-1 text-xs text-muted-foreground">
          <Octagon size={12} className="mt-0.5 shrink-0" aria-hidden />
          {c.noSuccessorReason}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {e.glossaryTerm && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <BookOpen size={12} aria-hidden /> Glossary: {parseGlossaryText(e.glossaryTerm)}
          </span>
        )}
        {e.learnModuleId && (
          <Link
            to={`/learn/${e.learnModuleId}`}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <GraduationCap size={12} aria-hidden /> Learn module
          </Link>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground" data-testid="construction-usage-line">
        Used in {direct} use case{direct === 1 ? '' : 's'} across {industries} industr
        {industries === 1 ? 'y' : 'ies'}
        {nStandards > 0 && ` · cited by ${nStandards} standard${nStandards === 1 ? '' : 's'}`}
        {viaIds.length > 0 &&
          ` · inside ${viaIds.join(', ')} in ${usage!.inside.length} more use case${usage!.inside.length === 1 ? '' : 's'}`}
        .
      </p>
    </div>
  )
}

/** Chips grouped by outlook, each with its direct use-case count. */
export function ConstructionChipRows({
  usage,
  selected,
  onPick,
}: {
  usage: Map<string, ConstructionUsage>
  selected: string | null
  onPick: (id: string) => void
}) {
  return (
    <div className="mb-4 space-y-2" data-testid="construction-chip-rows">
      {PQC_OUTLOOK_ORDER.map((o) => {
        const list = CRYPTO_CONSTRUCTIONS.filter((c) => c.outlook === o)
        if (list.length === 0) return null
        return (
          <div key={o} className="flex flex-wrap items-center gap-1.5">
            <span className="w-40 text-[11px] uppercase tracking-wide text-muted-foreground">
              {PQC_OUTLOOK_LABEL[o]}
            </span>
            {list.map((c) => {
              const u = usage.get(c.id)
              return (
                <ConstructionChip
                  key={c.id}
                  id={c.id}
                  count={
                    (u?.direct.length ?? 0) + (u?.standards.length ?? 0) + (u?.inside.length ?? 0)
                  }
                  active={c.id === selected}
                  onSelect={onPick}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Today's constructions on the left, the post-quantum picture on the right.
 * `stays-both` entries run straight across; `replaced` entries point at their
 * successors (solid = published or vendor spec, dashed = draft, dotted = study
 * or research); bridges sit in the middle; no-successor entries end at a stop.
 */
export function TransitionMap({
  usage,
  onPick,
}: {
  usage: Map<string, ConstructionUsage>
  onPick: (id: string) => void
}) {
  const count = (id: string) => usage.get(id)?.direct.length ?? 0
  const byOutlook = (o: PqcOutlook) => CRYPTO_CONSTRUCTIONS.filter((c) => c.outlook === o)
  return (
    <section
      className="mb-6 rounded-lg border border-border bg-card p-3"
      data-testid="transition-map"
    >
      <h3 className="mb-2 text-sm font-medium text-foreground">The transition at a glance</h3>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Being replaced
          </p>
          <div className="space-y-1">
            {byOutlook('replaced').map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-1.5"
                data-testid={`map-row-${c.id}`}
              >
                <ConstructionChip id={c.id} count={count(c.id)} onSelect={onPick} />
                {(c.successions ?? []).map((s) => (
                  <span key={`${s.to}-${s.context}`} className="inline-flex items-center gap-1">
                    <span
                      className={`w-6 border-t-2 border-muted-foreground ${STATUS_LINE[s.status]}`}
                      aria-hidden
                    />
                    <ArrowRight size={12} className="-ml-1 text-muted-foreground" aria-hidden />
                    <ConstructionChip id={s.to} count={count(s.to)} onSelect={onPick} />
                    <span className="text-[11px] text-muted-foreground">
                      {s.context} · {STANDARDS_STATUS_LABEL[s.status].toLowerCase()}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        {(['stays-both', 'bridge', 'pqc-native', 'no-successor-yet'] as const).map((o) =>
          byOutlook(o).length > 0 ? (
            <div key={o}>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {PQC_OUTLOOK_LABEL[o]}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {byOutlook(o).map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1">
                    <ConstructionChip id={c.id} count={count(c.id)} onSelect={onPick} />
                    {o === 'no-successor-yet' && (
                      <Octagon
                        size={12}
                        className="text-muted-foreground"
                        aria-label="no successor yet"
                      />
                    )}
                  </span>
                ))}
              </div>
            </div>
          ) : null
        )}
        <p className="text-[11px] text-muted-foreground">
          Arrow lines: solid = published or vendor specification, dashed = draft, dotted = under
          study or research. Numbers are use cases that name the construction.
        </p>
      </div>
    </section>
  )
}

/**
 * Industries × constructions. A table on wider screens (each cell marks
 * today / target / both and links to the construction), a per-industry list
 * on phones so the page never scrolls sideways.
 */
export function ConstructionsOverview({
  industries,
  usage,
  onPick,
}: {
  industries: string[]
  usage: Map<string, ConstructionUsage>
  onPick: (id: string) => void
}) {
  const used = CRYPTO_CONSTRUCTIONS.filter((c) => (usage.get(c.id)?.direct.length ?? 0) > 0)
  const cell = (ind: string, id: string) => {
    const sides = new Set(
      (usage.get(id)?.direct ?? []).filter((d) => d.useCase.industry === ind).map((d) => d.side)
    )
    if (sides.size === 0) return null
    if (sides.has('both') || (sides.has('today') && sides.has('target'))) return 'both'
    return sides.has('today') ? 'today' : 'target'
  }
  const mark = { today: '●', target: '○', both: '◐' } as const
  const rows = industries.filter((ind) => used.some((c) => cell(ind, c.id)))
  if (used.length === 0) return null
  return (
    <section className="mb-6" data-testid="constructions-overview">
      <h3 className="mb-2 text-sm font-medium text-foreground">
        Which industries use which constructions
      </h3>
      <p className="mb-2 text-[11px] text-muted-foreground">
        ● used today · ○ migration target · ◐ both
      </p>
      <div className="hidden overflow-x-auto md:block">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-muted-foreground">Industry</th>
              {used.map((c) => (
                <th key={c.id} className="px-1 py-1 font-medium text-muted-foreground">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onPick(c.id)}
                    className="h-auto p-0 text-[11px] text-primary hover:underline"
                  >
                    {c.id}
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((ind) => (
              <tr key={ind} className="border-t border-border">
                <td className="px-2 py-1 text-foreground">{ind}</td>
                {used.map((c) => {
                  const v = cell(ind, c.id)
                  return (
                    <td
                      key={c.id}
                      className="px-1 py-1 text-center text-primary"
                      data-testid={`cell-${ind}-${c.id}`}
                    >
                      {v ? mark[v] : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {rows.map((ind) => (
          <li key={ind} className="text-xs">
            <span className="font-medium text-foreground">{ind}</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {used
                .filter((c) => cell(ind, c.id))
                .map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-0.5">
                    <span className="text-primary">{mark[cell(ind, c.id)!]}</span>
                    <ConstructionChip id={c.id} onSelect={onPick} />
                  </span>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The per-use-case line: each construction it runs today and its target. */
export function ConstructionPairing({
  uc,
  onPick,
}: {
  uc: IndustryUseCase
  onPick?: (id: string) => void
}) {
  if (uc.classicalConstructions.length === 0 && uc.pqcConstructions.length === 0) return null
  const targets = new Set(uc.pqcConstructions)
  return (
    <div className="mt-2 space-y-1 text-xs" data-testid="construction-pairing">
      {uc.classicalConstructions.map((id) => {
        const c = getConstruction(id)
        if (!c) return null
        const next =
          c.outlook === 'stays-both' && targets.has(id)
            ? 'stays, moves to post-quantum algorithms'
            : null
        const successors = (c.successions ?? []).filter((s) => targets.has(s.to))
        return (
          <div key={id} className="flex flex-wrap items-center gap-1">
            <ConstructionChip id={id} onSelect={onPick} />
            {successors.map((s) => (
              <span key={s.to} className="inline-flex items-center gap-1">
                <ArrowRight size={12} className="text-muted-foreground" aria-hidden />
                <ConstructionChip id={s.to} onSelect={onPick} />
                <span className="text-muted-foreground">
                  ({STANDARDS_STATUS_LABEL[s.status].toLowerCase()})
                </span>
              </span>
            ))}
            {next && <span className="text-muted-foreground">{next}</span>}
          </div>
        )
      })}
      {uc.pqcConstructions
        .filter(
          (id) =>
            !uc.classicalConstructions.includes(id) &&
            !uc.classicalConstructions.some((cid) =>
              getConstruction(cid)?.successions?.some((s) => s.to === id)
            )
        )
        .map((id) => (
          <div key={id} className="flex flex-wrap items-center gap-1">
            <span className="text-muted-foreground">Target:</span>
            <ConstructionChip id={id} onSelect={onPick} />
          </div>
        ))}
    </div>
  )
}
