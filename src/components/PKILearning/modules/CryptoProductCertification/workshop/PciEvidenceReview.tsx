// SPDX-License-Identifier: GPL-3.0-only
// OWNER: PCI author
/* eslint-disable security/detect-object-injection -- keys are typed literal unions and fixture column names */
/**
 * Workshop step `pci-evidence-review` — Payment HSM evidence review (plan r2
 * §5 P8). Part A reads REAL PTS HSM listings (pciListingFixture.ts, captured
 * from public listing popups on 24 September 2026). Part B reviews a FICTIONAL
 * evidence packet for the anchor product: PTS listing, Security Policy, FIPS
 * certificate, entity-assessment scope and the Program Guide change concept.
 * The learner judges each claim and names the document that settles it; the
 * inspectable artifact is a copyable evidence-review memo.
 *
 * `config` (from the Exercises tab): { scenario?: 'appliance' | 'firmware-4' |
 * 'cloud', listing?: '<approval number>' }.
 */
import { useMemo, useState, type FC } from 'react'
import clsx from 'clsx'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSearch,
  Info,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { CopyButton } from '@/components/ui/CopyButton'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import type { CertWorkshopStepProps } from '../data/types'
import { ANCHOR_SCENARIO } from '../data/anchorScenario'
import { PCI_LISTING_COLUMNS, pciListingFixture } from '../data/pciListingFixture'
import {
  EVIDENCE_DOCS,
  EVIDENCE_DOC_SHORT,
  EVIDENCE_SCENARIOS,
  buildEvidenceMemo,
  type EvidenceAnswer,
  PCI_AS_OF_LABEL,
  VERDICT_LABELS,
  readListing,
  type EvidenceScenario,
  type Verdict,
} from '../data/pciData'
import { PciCite } from '../components/sections/PciSections'

const VERDICTS: Verdict[] = ['supported', 'not-supported', 'needs-more']

const stringConfig = (config: Record<string, unknown> | undefined, key: string) => {
  const v = config?.[key]
  return typeof v === 'string' ? v : undefined
}

const ListingReader: FC<{ initialListing?: string }> = ({ initialListing }) => {
  const entries = pciListingFixture.entries
  const [selected, setSelected] = useState(
    entries.some((e) => e.approvalNumber === initialListing)
      ? (initialListing as string)
      : entries[0].approvalNumber
  )
  const entry = entries.find((e) => e.approvalNumber === selected) ?? entries[0]
  const readings = readListing(entry.fields, pciListingFixture.asOf)

  return (
    <section className="glass-panel space-y-4 p-5" aria-labelledby="pci-listing-reader">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="pci-listing-reader" className="text-lg font-bold text-foreground">
            Part A — Read a real PTS HSM listing
          </h3>
          <p className="text-sm text-muted-foreground">
            Three real listings, copied verbatim from PCI’s public listing popups on{' '}
            {PCI_AS_OF_LABEL}. Listings change; follow the link for the live entry.
          </p>
        </div>
        <FilterDropdown
          items={entries.map((e) => ({
            id: e.approvalNumber,
            label: `${e.approvalNumber} — ${e.fields.Product.split(',')[0]}`,
          }))}
          selectedId={selected}
          onSelect={setSelected}
          hideDefaultOption
          ariaLabel="Choose a real PTS HSM listing"
          className="sm:w-72"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left text-xs">
          <tbody>
            {PCI_LISTING_COLUMNS.map((col) => (
              <tr key={col} className="border-b border-border/50 align-top last:border-0">
                <th
                  scope="row"
                  className="w-48 bg-muted/40 px-3 py-2 font-semibold text-foreground"
                >
                  {col}
                </th>
                <td className="whitespace-pre-line px-3 py-2 text-foreground/80">
                  {entry.fields[col] === '' ? (
                    <span className="italic text-muted-foreground">(blank on the listing)</span>
                  ) : (
                    entry.fields[col]
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Source:{' '}
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
        >
          PCI SSC listing {entry.approvalNumber} <ExternalLink size={10} aria-hidden="true" />
        </a>{' '}
        · read {PCI_AS_OF_LABEL} · found via: {entry.foundVia} · field meanings:{' '}
        <PciCite refKey="listingFields" label="listing field definitions" />
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        {readings.map((r) => (
          <div
            key={r.label}
            className={clsx(
              'rounded-lg border p-3 text-xs',
              r.tone === 'warn' && 'border-status-warning/30 bg-status-warning/10',
              r.tone === 'ok' && 'border-status-success/30 bg-status-success/10',
              r.tone === 'info' && 'border-border bg-muted/40'
            )}
          >
            <p className="mb-1 font-semibold text-foreground">{r.label}</p>
            <p className="text-foreground/80">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export const PciEvidenceReview: FC<CertWorkshopStepProps> = ({ config }) => {
  const initialScenario = stringConfig(config, 'scenario')
  const [scenarioId, setScenarioId] = useState<EvidenceScenario['id']>(
    EVIDENCE_SCENARIOS.find((s) => s.id === initialScenario)?.id ?? 'appliance'
  )
  const [answers, setAnswers] = useState<Record<string, EvidenceAnswer>>({})
  const [checked, setChecked] = useState(false)

  const scenario = EVIDENCE_SCENARIOS.find((s) => s.id === scenarioId) ?? EVIDENCE_SCENARIOS[0]
  const complete = scenario.claims.every((c) => answers[c.id]?.verdict && answers[c.id]?.doc)
  const score = scenario.claims.filter(
    (c) => answers[c.id]?.verdict === c.verdict && answers[c.id]?.doc === c.doc
  ).length
  const memo = useMemo(
    () => buildEvidenceMemo(scenario, answers, checked),
    [scenario, answers, checked]
  )

  const setAnswer = (claimId: string, patch: EvidenceAnswer) => {
    setChecked(false)
    setAnswers((prev) => ({ ...prev, [claimId]: { ...prev[claimId], ...patch } }))
  }

  const switchScenario = (id: string) => {
    const next = EVIDENCE_SCENARIOS.find((s) => s.id === id)
    if (!next) return
    setScenarioId(next.id)
    setAnswers({})
    setChecked(false)
  }

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-5">
        <div className="flex items-start gap-3">
          <FileSearch size={22} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-1 text-sm text-foreground/80">
            <p className="font-semibold text-foreground">Payment HSM evidence review</p>
            <p>
              A payment HSM collects evidence from several places: PCI’s device listing, the
              vendor’s Security Policy, perhaps a FIPS certificate, and the assessments of the
              entities that run it. Each answers different questions. Read a real listing first,
              then review a claim set for {ANCHOR_SCENARIO.name}, a {ANCHOR_SCENARIO.fictionalLabel}{' '}
              network HSM.
            </p>
          </div>
        </div>
      </div>

      <ListingReader initialListing={stringConfig(config, 'listing')} />

      <section className="glass-panel space-y-4 p-5" aria-labelledby="pci-evidence-packet">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 id="pci-evidence-packet" className="text-lg font-bold text-foreground">
              Part B — Review the evidence packet
            </h3>
            <p className="text-sm text-muted-foreground">
              Every document in this packet is <strong>fictional</strong>, built on the real field
              layouts. Numbers such as FICT-0007 are not real approvals or certificates.
            </p>
          </div>
          <FilterDropdown
            items={EVIDENCE_SCENARIOS.map((s) => ({ id: s.id, label: s.label }))}
            selectedId={scenario.id}
            onSelect={switchScenario}
            hideDefaultOption
            ariaLabel="Choose a review scenario"
            className="sm:w-72"
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-status-info/30 bg-status-info/10 p-3 text-sm text-foreground/80">
          <Info size={16} className="mt-0.5 shrink-0 text-status-info" aria-hidden="true" />
          <p>{scenario.context}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {EVIDENCE_DOCS.map((d) => (
            <div key={d.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-bold text-foreground">{d.title}</p>
              <dl className="space-y-1 text-xs">
                {d.fields.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-semibold text-muted-foreground">{k}</dt>
                    <dd className="text-foreground/80">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[11px] italic text-muted-foreground">{d.note}</p>
            </div>
          ))}
        </div>

        <ol className="space-y-4">
          {scenario.claims.map((c, i) => {
            const a = answers[c.id] ?? {}
            const ok = a.verdict === c.verdict && a.doc === c.doc
            return (
              <li key={c.id} className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  {i + 1}. “{c.claim}”
                </p>
                <fieldset className="mb-2">
                  <legend className="mb-1 text-xs text-muted-foreground">Your verdict</legend>
                  <div className="flex flex-wrap gap-2">
                    {VERDICTS.map((v) => (
                      <Button
                        key={v}
                        size="sm"
                        variant={a.verdict === v ? 'gradient' : 'outline'}
                        aria-pressed={a.verdict === v}
                        onClick={() => setAnswer(c.id, { verdict: v })}
                      >
                        {VERDICT_LABELS[v]}
                      </Button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-1 text-xs text-muted-foreground">
                    Which document settles it?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {EVIDENCE_DOCS.map((d) => (
                      <Button
                        key={d.id}
                        size="sm"
                        variant={a.doc === d.id ? 'secondary' : 'ghost'}
                        aria-pressed={a.doc === d.id}
                        onClick={() => setAnswer(c.id, { doc: d.id })}
                      >
                        {EVIDENCE_DOC_SHORT[d.id]}
                      </Button>
                    ))}
                  </div>
                </fieldset>
                {checked ? (
                  <div
                    className={clsx(
                      'mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs',
                      ok
                        ? 'border-status-success/30 bg-status-success/10'
                        : 'border-status-warning/30 bg-status-warning/10'
                    )}
                    role="status"
                  >
                    {ok ? (
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-status-success"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-status-warning"
                        aria-hidden="true"
                      />
                    )}
                    <div className="text-foreground/80">
                      <p className="font-semibold text-foreground">
                        {VERDICT_LABELS[c.verdict]} · {EVIDENCE_DOC_SHORT[c.doc]}
                      </p>
                      <p>{c.why}</p>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gradient" disabled={!complete} onClick={() => setChecked(true)}>
            <ClipboardList size={16} className="mr-2" aria-hidden="true" />
            Check my review
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAnswers({})
              setChecked(false)
            }}
          >
            <RotateCcw size={16} className="mr-2" aria-hidden="true" />
            Reset
          </Button>
          {!complete ? (
            <span className="text-xs text-muted-foreground">
              Give a verdict and a document for every claim to check.
            </span>
          ) : null}
          {checked ? (
            <span className="text-sm font-semibold text-foreground" role="status">
              {score} / {scenario.claims.length} claims judged against the right document
            </span>
          ) : null}
        </div>
      </section>

      <section className="glass-panel space-y-3 p-5" aria-labelledby="pci-evidence-memo">
        <div className="flex items-center justify-between gap-3">
          <h3 id="pci-evidence-memo" className="text-lg font-bold text-foreground">
            Your evidence-review memo
          </h3>
          <CopyButton text={memo} label="Copy memo" />
        </div>
        <p className="text-xs text-muted-foreground">
          The step’s artifact: each claim, your verdict and the document you would check — plus,
          once checked, the expected answer and why. Paste it into a review ticket or the capstone.
        </p>
        <CodeBlock code={memo} language="text" />
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0 text-status-warning"
            aria-hidden="true"
          />
          Payment brands decide who must validate and which evidence they accept. This review
          teaches how to read evidence; it is not an assessment.
        </p>
      </section>
    </div>
  )
}
