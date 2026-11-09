// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_IDS,
  CATEGORY_NAMES,
  COMBINE_CASES,
  GRID_FINDINGS,
  GRID_FOOTNOTE,
  GRID_ROWS,
  SCENARIOS,
  TRUST_CARDS,
  type CardQuestion,
  type CategoryId,
  type CellKind,
} from '../data/trustHardware'
import { SourceList } from './SourceList'
import { TrustHardwareVenn } from './TrustHardwareVenn'

type View = 'cards' | 'grid' | 'pick' | 'combine'

const VIEWS: { id: View; label: string }[] = [
  { id: 'cards', label: 'Eight kinds' },
  { id: 'grid', label: 'Side-by-side grid' },
  { id: 'pick', label: 'Pick the right one' },
  { id: 'combine', label: 'How they combine' },
]

const QUESTION_LABEL: Record<CardQuestion, string> = {
  what: 'What it is',
  origin: 'Where it comes from',
  where: 'Where it sits',
  protects: 'What it protects',
  pq: 'Post-quantum status today',
}

const KIND_LABEL: Record<CellKind, string | null> = {
  stated: null,
  specified: 'Requirement in a specification',
  varies: 'Varies by product',
  'not-published': null,
}

// ---- Cards ----------------------------------------------------------------------------------

const CardsView: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {TRUST_CARDS.map((card) => (
      <article
        key={card.id}
        className="glass-panel p-5 space-y-3"
        aria-labelledby={`thc-${card.id}`}
        data-testid={`trust-card-${card.id}`}
      >
        <header className="space-y-1">
          <h3 id={`thc-${card.id}`} className="text-lg font-semibold text-foreground">
            {card.name}
          </h3>
          <p className="text-xs text-muted-foreground">{card.tagline}</p>
          {card.status && (
            <p className="inline-block text-xs px-2 py-0.5 rounded border border-status-warning/40 bg-status-warning/10 text-status-warning">
              {card.status}
            </p>
          )}
        </header>
        <dl className="space-y-3">
          {card.sentences.map((s, i) => (
            <div key={i} className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary">
                {QUESTION_LABEL[s.q]}
              </dt>
              <dd className="space-y-1 text-sm text-foreground/90 leading-relaxed">
                {s.text}
                <SourceList ids={s.sources} />
              </dd>
            </div>
          ))}
        </dl>
        {card.ancestorBox && (
          <aside
            className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
            aria-label={card.ancestorBox.title}
          >
            <h4 className="text-xs font-semibold text-foreground">{card.ancestorBox.title}</h4>
            <p className="text-[11px] text-muted-foreground">
              A separate product, not evidence about Tessera.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              {card.ancestorBox.sentences.map((s, i) => (
                <li key={i} className="text-sm text-foreground/90">
                  {s.text}
                  <SourceList ids={s.sources} />
                </li>
              ))}
            </ul>
          </aside>
        )}
        <footer className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <span className="text-xs text-muted-foreground">Learn more:</span>
          {card.modules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              {m.label} <ArrowRight size={12} aria-hidden="true" />
            </Link>
          ))}
        </footer>
      </article>
    ))}
  </div>
)

// ---- Grid -----------------------------------------------------------------------------------

const GridView: React.FC = () => {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setOpenRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GRID_FINDINGS.map((f) => (
          <div key={f.heading} className="glass-panel p-4 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{f.heading}</h3>
            <p className="text-sm text-foreground/90">{f.text}</p>
            <SourceList ids={f.sources} />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground md:hidden">
        Scroll the table sideways to see all eight kinds.
      </p>
      <div
        className="overflow-x-auto rounded-lg border border-border snap-x snap-proximity scroll-pl-[6.5rem] md:scroll-pl-[11rem]"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard users must be able to scroll the wide grid
        tabIndex={0}
        role="region"
        aria-label="Trust hardware comparison grid, scrolls sideways"
        data-testid="trust-grid-scroll"
      >
        <table className="w-full min-w-[1280px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 bg-muted border-r border-border text-left p-2 md:p-3 w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] md:w-[11rem] md:min-w-[11rem] md:max-w-none text-[11px] md:text-xs font-semibold text-foreground"
              >
                Question
              </th>
              {TRUST_CARDS.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="snap-start bg-muted text-left p-3 min-w-40 align-bottom text-xs font-semibold text-foreground"
                >
                  {c.name}
                  <span className="block font-normal text-muted-foreground">{c.tagline}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRID_ROWS.map((row) => {
              const open = openRows.has(row.id)
              return (
                <React.Fragment key={row.id}>
                  <tr className="align-top">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-background border-t border-border border-r text-left p-2 md:p-3 w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] md:w-[11rem] md:min-w-[11rem] md:max-w-none align-top text-[11px] md:text-xs font-semibold text-foreground"
                    >
                      <span className="block">{row.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-auto px-0 py-1 text-[11px] text-primary whitespace-normal"
                        aria-expanded={open}
                        aria-label={`${open ? 'Hide' : 'Show'} sources for ${row.label}`}
                        onClick={() => toggle(row.id)}
                      >
                        {open ? (
                          <>
                            Hide sources <ChevronUp size={12} className="ml-1" aria-hidden="true" />
                          </>
                        ) : (
                          <>
                            Show sources{' '}
                            <ChevronDown size={12} className="ml-1" aria-hidden="true" />
                          </>
                        )}
                      </Button>
                    </th>
                    {CATEGORY_IDS.map((id) => {
                      const cell = row.cells[id]
                      const kindLabel = KIND_LABEL[cell.kind]
                      return (
                        <td
                          key={id}
                          className={`border-t border-border p-3 text-sm leading-snug ${
                            cell.kind === 'not-published'
                              ? 'text-muted-foreground italic'
                              : 'text-foreground/90'
                          }`}
                          data-testid={`grid-cell-${row.id}-${id}`}
                        >
                          {cell.text}
                          {kindLabel && (
                            <span className="mt-1 block text-[10px] uppercase tracking-wide text-status-warning not-italic">
                              {kindLabel}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  {open && (
                    <tr>
                      <td className="sticky left-0 z-10 bg-muted border-t border-border border-r p-2 md:p-3 w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] md:w-[11rem] md:min-w-[11rem] md:max-w-none text-[11px] text-muted-foreground">
                        Sources for “{row.label}”
                      </td>
                      {CATEGORY_IDS.map((id) => (
                        <td key={id} className="bg-muted border-t border-border p-3 align-top">
                          {row.cells[id].sources.length > 0 ? (
                            <SourceList ids={row.cells[id].sources} label={CATEGORY_NAMES[id]} />
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {CATEGORY_NAMES[id]}: none to cite
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground max-w-3xl">{GRID_FOOTNOTE.text}</p>
    </div>
  )
}

// ---- Exercise 1: pick the right one -------------------------------------------------------------

const sameSet = (a: CategoryId[], b: CategoryId[]) =>
  a.length === b.length && a.every((x) => b.includes(x))

const PickView: React.FC = () => {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<CategoryId[]>([])
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<Record<string, 'right' | 'partial' | 'wrong'>>({})

  const scenario = SCENARIOS[index]
  const score = useMemo(() => Object.values(results).filter((r) => r === 'right').length, [results])

  const togglePick = (id: CategoryId) => {
    if (checked) return
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const check = () => {
    const verdict = sameSet(picked, scenario.best)
      ? 'right'
      : picked.some((p) => scenario.best.includes(p))
        ? 'partial'
        : 'wrong'
    setResults((prev) => ({ ...prev, [scenario.id]: verdict }))
    setChecked(true)
  }

  const goTo = (next: number) => {
    setIndex(next)
    setPicked([])
    setChecked(false)
  }

  const verdict = results[scenario.id]

  return (
    <div className="space-y-4" data-testid="trust-pick">
      <div className="glass-panel p-5 space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Pick the right one</h3>
        <p className="text-sm text-muted-foreground">
          Read the scenario, choose one or two of the eight kinds, then check your answer. The
          answer says why, and why the others fit less well, with its sources.
        </p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Scenario {index + 1} of {SCENARIOS.length} · {score} right so far
        </p>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground">{scenario.title}</h4>
          <p className="text-sm text-foreground/90">{scenario.prompt}</p>
          <p className="text-[11px] text-muted-foreground">
            {scenario.origin === 'landscape'
              ? `Starts from the Industry Landscape use case “${scenario.landscapeUseCaseId}”.`
              : 'Written for this step from the cited documents; the Industry Landscape has no use case for it.'}
          </p>
        </div>

        <div role="group" aria-label="Choose one or two kinds" className="flex flex-wrap gap-2">
          {CATEGORY_IDS.map((id) => {
            const selected = picked.includes(id)
            const isBest = checked && scenario.best.includes(id)
            return (
              <Button
                key={id}
                size="sm"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                className={`h-auto min-h-10 whitespace-normal text-left py-2 ${
                  isBest ? 'ring-2 ring-status-success' : ''
                }`}
                onClick={() => togglePick(id)}
              >
                {CATEGORY_NAMES[id]}
              </Button>
            )
          })}
        </div>

        {!checked && (
          <Button onClick={check} disabled={picked.length === 0} className="w-full sm:w-auto">
            Check my answer
          </Button>
        )}

        {checked && (
          <div className="space-y-3" data-testid="trust-pick-answer" aria-live="polite">
            <p
              className={`text-sm font-semibold flex items-center gap-2 ${
                verdict === 'right'
                  ? 'text-status-success'
                  : verdict === 'partial'
                    ? 'text-status-warning'
                    : 'text-status-error'
              }`}
            >
              {verdict === 'right' ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <CircleHelp size={16} aria-hidden="true" />
              )}
              {verdict === 'right'
                ? 'Matches the documented answer.'
                : verdict === 'partial'
                  ? 'Partly: one of your picks matches.'
                  : 'Not the documented answer.'}{' '}
              Best fit: {scenario.best.map((b) => CATEGORY_NAMES[b]).join(' and ')}.
            </p>
            <div className="space-y-1">
              <p className="text-sm text-foreground/90">{scenario.why.text}</p>
              <SourceList ids={scenario.why.sources} />
            </div>
            {scenario.lessWell.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Why the others fit less well
                </h5>
                <ul className="space-y-2">
                  {scenario.lessWell.map((l) => (
                    <li key={l.category} className="text-sm text-foreground/90">
                      <strong>{CATEGORY_NAMES[l.category]}.</strong> {l.text}
                      <SourceList ids={l.sources} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={index === SCENARIOS.length - 1}
            onClick={() => goTo(index + 1)}
          >
            Next scenario
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Exercise 2: how they combine ---------------------------------------------------------------

const CombineView: React.FC = () => {
  const [caseId, setCaseId] = useState(COMBINE_CASES[0].id)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const active = COMBINE_CASES.find((c) => c.id === caseId) ?? COMBINE_CASES[0]
  const showTakeaway = revealed.has(active.id)

  return (
    <div className="space-y-4" data-testid="trust-combine">
      <div className="glass-panel p-5 space-y-2">
        <h3 className="text-lg font-semibold text-foreground">How they combine</h3>
        <p className="text-sm text-muted-foreground">
          Four documented flows, each from its own sources. Read the steps, then reveal what the
          case teaches. Combinations are named per product: nothing here claims that any cloud HSM
          can feed any workload.
        </p>
      </div>

      <div role="group" aria-label="Choose a case" className="flex flex-wrap gap-2">
        {COMBINE_CASES.map((c, i) => (
          <Button
            key={c.id}
            size="sm"
            variant={c.id === caseId ? 'default' : 'outline'}
            aria-pressed={c.id === caseId}
            className="h-auto min-h-10 whitespace-normal text-left py-2"
            onClick={() => setCaseId(c.id)}
          >
            Case {i + 1}
          </Button>
        ))}
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground">{active.title}</h4>
          <p className="text-xs text-muted-foreground">
            Parts: {active.parts.map((p) => CATEGORY_NAMES[p]).join(' + ')}
          </p>
        </div>
        <ol className="space-y-3 list-decimal pl-5">
          {active.steps.map((s, i) => (
            <li key={i} className="text-sm text-foreground/90">
              {s.text}
              <SourceList ids={s.sources} />
            </li>
          ))}
        </ol>
        {!showTakeaway ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed((prev) => new Set(prev).add(active.id))}
          >
            What does this case teach?
          </Button>
        ) : (
          <div
            className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1"
            aria-live="polite"
          >
            <p className="text-sm text-foreground">{active.takeaway.text}</p>
            <SourceList ids={active.takeaway.sources} />
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Step -----------------------------------------------------------------------------------------

export const TrustHardwareSelector: React.FC = () => {
  const [view, setView] = useState<View>('cards')

  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Trust Hardware Selector</h2>
        <p className="text-muted-foreground">
          Eight kinds of hardware are used to root trust and protect keys: TPM 2.0, Caliptra,
          Tessera, hardware HSMs, cloud HSMs, confidential computing, DPUs you buy, and the
          provider’s own DPUs. This step shows what each is, where it sits, what it protects and its
          post-quantum status, so you can tell them apart and choose between them.
        </p>
      </div>

      <TrustHardwareVenn />

      <div
        role="group"
        aria-label="Trust hardware views"
        className="flex flex-wrap gap-2 justify-center"
      >
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            size="sm"
            variant={view === v.id ? 'default' : 'outline'}
            aria-pressed={view === v.id}
            className="h-auto min-h-10 whitespace-normal py-2"
            onClick={() => setView(v.id)}
          >
            {v.label}
          </Button>
        ))}
      </div>

      {view === 'cards' && <CardsView />}
      {view === 'grid' && <GridView />}
      {view === 'pick' && <PickView />}
      {view === 'combine' && <CombineView />}
    </div>
  )
}
