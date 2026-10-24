// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: FIPS author
/* eslint-disable security/detect-object-injection -- keys are item and mark ids from the typed ALGORITHM_RECORD_ITEMS data, never user input */
/**
 * Workshop step `fips-algorithm-records`: read the records of two real modules (CMVP
 * certificates #5497 and #5450) for the same kind of operation, and mark each row against the
 * algorithm validation and the Security Policy's own tables. The step trains the reading of
 * records; it never rates a module, and it says "listed", never "approved" or "offered".
 *
 * Each row has two marks (listed on the algorithm validation; listed in the Policy's Approved
 * Algorithms table). The two deterministic-setting rows carry a third mark (the Policy's
 * function table) because the Policy's two tables can differ. A mark is a Listed / Not listed
 * choice, not a bare checkbox, so "not listed" is an answer the learner has to give.
 *
 * Output: an inspectable plain-text reading note the learner copies.
 */
import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  RotateCcw,
  ScrollText,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { CopyButton } from '@/components/ui/CopyButton'
import type { CertWorkshopStepProps } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'
import {
  ALGORITHM_RECORD_ITEMS,
  ALGORITHM_RECORD_MODULES,
  ALGORITHM_RECORDS_AS_OF_LABEL,
  CAVP_VALIDATION_URLS,
  FIPS_204_SIGNING_QUOTES,
  LUNA_POLICY_CREDIT,
  RECORD_MARK_LABELS,
  cmvpCertificateUrl,
  securityPolicyPageUrl,
  type AlgorithmRecordChoiceItem,
  type AlgorithmRecordCompareItem,
  type RecordMarkId,
  type RecordModule,
  type RecordModuleId,
  type RecordQuote,
} from '../data/fipsData'
import {
  ANSWER_LABEL,
  genericFeedback,
  judgeChoiceItem,
  judgeCompareItem,
  marksOf,
  scoreBandText,
  type Answer,
  type CompareVerdict,
  type MarkAnswers,
} from './algorithmRecordsScoring'

// ── Small presentational helpers ────────────────────────────────────────────

const ExtLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-0.5 text-primary underline"
  >
    {children}
    <ExternalLink size={11} aria-hidden="true" className="shrink-0" />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)

const AsOf = ({ cert }: { cert: RecordModuleId }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
    <CalendarClock size={11} aria-hidden="true" /> records as of{' '}
    {ALGORITHM_RECORDS_AS_OF_LABEL[cert]}
  </span>
)

/** Unchanged quotes, each with the page and a link to NIST's copy. */
const QuoteList = ({ quotes }: { quotes: readonly RecordQuote[] }) =>
  quotes.length === 0 ? null : (
    <ul className="space-y-1">
      {quotes.map((q) => (
        <li key={`${q.source}|${q.text}`} className="text-xs text-foreground/90">
          <q className="font-mono text-[11px]">{q.text}</q>{' '}
          <span className="whitespace-nowrap text-muted-foreground">
            (<ExtLink href={q.url}>{q.source}</ExtLink>)
          </span>
        </li>
      ))}
    </ul>
  )

const hasPolicyQuote = (quotes: readonly RecordQuote[]): boolean =>
  quotes.some((q) => q.record === 'policy')

const MARK_NAME_PREFIX = 'fips-records'

const MarkField = ({
  itemId,
  markId,
  value,
  onChange,
}: {
  itemId: string
  markId: RecordMarkId
  value: Answer | undefined
  onChange: (next: Answer) => void
}) => (
  <fieldset className="rounded-lg border border-border bg-muted/20 p-3">
    <legend className="px-1 text-xs font-semibold text-foreground">
      {RECORD_MARK_LABELS[markId]}
    </legend>
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {(['listed', 'not-listed'] as const).map((answer) => (
        <label key={answer} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={`${MARK_NAME_PREFIX}-${itemId}-${markId}`}
            value={answer}
            checked={value === answer}
            onChange={() => onChange(answer)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
          />
          {ANSWER_LABEL[answer]}
        </label>
      ))}
    </div>
  </fieldset>
)

const ModulePanel = ({ module }: { module: RecordModule }) => (
  <div className="glass-panel space-y-3 p-5" data-testid={`fips-records-module-${module.cert}`}>
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-base font-bold text-foreground">{module.heading}</h3>
      <AsOf cert={module.cert} />
    </div>
    <p className="text-xs text-muted-foreground">{module.source}</p>
    <div>
      <p className="text-xs font-semibold text-foreground">Open these records in new tabs</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
        {module.records.map((r) => (
          <li key={r.url}>
            <ExtLink href={r.url}>{r.label}</ExtLink>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <p className="text-xs font-semibold text-foreground">Tables in this Security Policy</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground/90">
        {module.tables.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
    {module.setup.map((p) => (
      <p key={p} className="text-sm text-foreground/90">
        {p}
      </p>
    ))}
    <div>
      <p className="text-xs font-semibold text-foreground">Records read</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
        {module.recordDates.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <details className="mt-1 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium">Security Policy file pin</summary>
        <p className="mt-1 break-all font-mono text-[11px]">SHA-256 {module.policySha256}</p>
      </details>
      {module.cert === '5450' ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{LUNA_POLICY_CREDIT}</p>
      ) : null}
    </div>
  </div>
)

// ── Results ─────────────────────────────────────────────────────────────────

const CompareResult = ({
  item,
  verdict,
}: {
  item: AlgorithmRecordCompareItem
  verdict: CompareVerdict
}) => {
  const allQuotes = [...verdict.marks.flatMap((m) => m.mark.quotes), ...(item.alsoQuotes ?? [])]
  return (
    <div className="mt-4 space-y-3 border-t border-border pt-3">
      <p className="text-sm font-semibold text-foreground">
        {verdict.ok ? item.feedbackRight : genericFeedback(verdict.wrong, verdict.marks.length)}
      </p>
      <p className="text-sm text-foreground/90">
        <strong>Result:</strong> {item.label}
      </p>
      <ul className="space-y-3">
        {verdict.marks.map((m) => (
          <li key={m.id} className="flex items-start gap-2 text-sm">
            {m.correct ? (
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-status-success"
                aria-label="Matches the records"
              />
            ) : (
              <XCircle
                size={16}
                className="mt-0.5 shrink-0 text-status-error"
                aria-label="Differs from the records"
              />
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-foreground">
                {RECORD_MARK_LABELS[m.id]}: <span>{m.mark.listed ? 'Listed' : 'Not listed'}</span>
                {!m.correct && m.learner ? (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    (you marked: {ANSWER_LABEL[m.learner]})
                  </span>
                ) : null}
              </p>
              {!m.correct ? <p className="text-xs text-foreground/90">{m.mark.hint}</p> : null}
              <p className="text-xs text-muted-foreground">{m.mark.where}</p>
              {m.mark.note ? <p className="text-xs text-foreground/90">{m.mark.note}</p> : null}
              <QuoteList quotes={m.mark.quotes} />
            </div>
          </li>
        ))}
      </ul>
      {item.alsoQuotes && item.alsoQuotes.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">
            Also in the Policy's function table (Table 7), for context
          </p>
          <QuoteList quotes={item.alsoQuotes} />
        </div>
      ) : null}
      {item.module === '5450' && hasPolicyQuote(allQuotes) ? (
        <p className="text-[11px] text-muted-foreground">{LUNA_POLICY_CREDIT}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">{item.explanation}</p>
      {item.id === 'ml-dsa-65-deterministic' ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">
            What "hedged" and "deterministic" mean in FIPS 204
          </p>
          <QuoteList quotes={FIPS_204_SIGNING_QUOTES} />
        </div>
      ) : null}
    </div>
  )
}

const ChoiceResult = ({
  item,
  chosen,
}: {
  item: AlgorithmRecordChoiceItem
  chosen: string | undefined
}) => {
  const ok = judgeChoiceItem(item, chosen)
  return (
    <div className="mt-4 space-y-3 border-t border-border pt-3">
      <p className="text-sm font-semibold text-foreground">
        {ok ? item.feedbackRight : 'Not that one. Read the reason beside each statement.'}
      </p>
      <ul className="space-y-2">
        {item.choices.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.ok ? (
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-status-success"
                aria-label="The statement you can make"
              />
            ) : (
              <XCircle
                size={16}
                className="mt-0.5 shrink-0 text-status-error"
                aria-label="Not supported by A5631 alone"
              />
            )}
            <div className="min-w-0">
              <p className="text-foreground">
                {c.text}
                {c.id === chosen ? (
                  <span className="text-xs text-muted-foreground"> (your choice)</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">{c.why}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">The records behind the answer</p>
        <QuoteList quotes={item.quotes} />
      </div>
      <p className="text-xs text-muted-foreground">{item.explanation}</p>
    </div>
  )
}

// ── The step ────────────────────────────────────────────────────────────────

const itemHeadingId = (id: string) => `${MARK_NAME_PREFIX}-heading-${id}`
const itemDomId = (id: string) => `${MARK_NAME_PREFIX}-item-${id}`

/** The comparison items that open a module's record list: the first of each run of one module. */
const MODULE_PANEL_ITEM_IDS: ReadonlySet<string> = new Set(
  ALGORITHM_RECORD_ITEMS.reduce<{ ids: string[]; last: RecordModuleId | null }>(
    (acc, item) => {
      if (item.kind !== 'compare') return acc
      if (item.module !== acc.last) acc.ids.push(item.id)
      return { ids: acc.ids, last: item.module }
    },
    { ids: [], last: null }
  ).ids
)

export const FipsAlgorithmRecords: FC<CertWorkshopStepProps> = ({ config }) => {
  const focusId = typeof config?.item === 'string' ? config.item : undefined

  const [answers, setAnswers] = useState<Record<string, MarkAnswers>>({})
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  // An exercise opens the step on one item: scroll to it once.
  useEffect(() => {
    if (!focusId) return
    const el = document.getElementById(itemDomId(focusId))
    el?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }, [focusId])

  const setMark = (itemId: string, markId: RecordMarkId, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [markId]: answer } }))
    setChecked(false)
  }

  const reset = () => {
    setAnswers({})
    setChoices({})
    setChecked(false)
  }

  const complete = ALGORITHM_RECORD_ITEMS.every((item) =>
    item.kind === 'compare'
      ? marksOf(item).every((m) => answers[item.id]?.[m.id] !== undefined)
      : choices[item.id] !== undefined
  )

  const verdicts = useMemo(() => {
    const out: Record<string, boolean> = {}
    for (const item of ALGORITHM_RECORD_ITEMS) {
      out[item.id] =
        item.kind === 'compare'
          ? judgeCompareItem(item, answers[item.id] ?? {}).ok
          : judgeChoiceItem(item, choices[item.id])
    }
    return out
  }, [answers, choices])
  const score = Object.values(verdicts).filter(Boolean).length
  const total = ALGORITHM_RECORD_ITEMS.length

  const noteText = useMemo(() => {
    const lines = [
      'Reading note: algorithm records',
      `Records as of: certificate #5497 ${ALGORITHM_RECORDS_AS_OF_LABEL['5497']}; certificate #5450 ${ALGORITHM_RECORDS_AS_OF_LABEL['5450']}.`,
    ]
    ALGORITHM_RECORD_ITEMS.forEach((item, i) => {
      if (item.kind === 'compare') {
        lines.push('', `${i + 1}. Certificate #${item.module}: ${item.claim}`)
        for (const { id } of marksOf(item)) {
          const given = answers[item.id]?.[id]
          lines.push(
            `   ${RECORD_MARK_LABELS[id]}: ${given ? ANSWER_LABEL[given] : '(not answered)'}`
          )
        }
        if (checked) {
          lines.push(`   Check: ${verdicts[item.id] ? 'matches the records' : 'revisit'}`)
        }
      } else {
        const picked = item.choices.find((c) => c.id === choices[item.id])
        lines.push('', `${i + 1}. Certificate #${item.module}: ${item.prompt}`)
        lines.push(`   Your statement: ${picked ? picked.text : '(not answered)'}`)
        if (checked) {
          lines.push(`   Check: ${verdicts[item.id] ? 'matches the records' : 'revisit'}`)
        }
      }
    })
    if (checked) lines.push('', `Self-check: ${score} of ${total} items match the records`)
    lines.push(
      '',
      'For your own claim:',
      'Claim I want to check: <operation> with <parameter set>, option <option>',
      'Algorithm validation: <A-number>, row <name>, shows <quote>',
      'Security Policy, Approved Algorithms table: Table <n>, page <p>, shows <quote>',
      'Security Policy, function table: Table <n>, page <p>, shows <quote>',
      'Gap, if any: <what one record or table lists and another does not>',
      'Module certificate: <number>, <status>, <overall level>, <date read>',
      'Question for the vendor or laboratory: <one question>',
      '',
      'Practitioner orientation — not laboratory training.'
    )
    return lines.join('\n')
  }, [answers, checked, choices, score, total, verdicts])

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="glass-panel space-y-3 p-5">
        <div className="mb-1 flex items-center gap-2">
          <ScrollText size={20} className="text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">
            The algorithm validation and the Security Policy, side by side
          </h2>
        </div>
        <p className="text-sm text-foreground/80">
          A certificate for a module and a certificate for its algorithms are different records.
          Practise reading both for the same operation.
        </p>
        <p className="text-sm text-foreground/80">
          A CMVP certificate lists algorithms, and each entry carries a reference such as A5631.
          That reference is a separate record, a CAVP algorithm validation. It lists what was tested
          for one implementation, including parameter sets and options.
        </p>
        <p className="text-sm text-foreground/80">
          A module's Security Policy, called the Policy below, has its own tables. Two of them
          matter in this step. The <strong>Approved Algorithms</strong> table names each validation
          number and prints its options. The <strong>Security Function Implementations</strong>{' '}
          table, called the function table here, lists the functions. The two tables, and the
          validation, do not have to match each other.
        </p>
        <p className="text-sm text-foreground/80">
          You read the records of two real modules, certificates #5497 and #5450. Each vendor is
          named only as the source of its records. The step does not rate either module or compare
          them, and it does not say whether any module meets a requirement. It trains you to read
          the records before you rely on a claim.
        </p>

        <div>
          <h3 className="text-sm font-bold text-foreground">How to work through it</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-foreground/90">
            <li>Open the records for the module in new tabs, from the list above its items.</li>
            <li>
              For items 1 to 6, answer each mark with <strong>Listed</strong> or{' '}
              <strong>Not listed</strong>. Every item has two marks: whether the claim is listed on
              the algorithm validation, and whether it is listed in the Policy's Approved Algorithms
              table. Items 2 and 4 have a third mark, for the Policy's function table, because the
              Policy's two tables can differ.
            </li>
            <li>
              Press <strong>Check</strong>. Each item then shows the quotes, the page numbers and a
              short explanation.
            </li>
            <li>
              Item 7 is a single-choice question about what an algorithm validation can and cannot
              show.
            </li>
            <li>
              Copy the reading note at the end. It keeps your answers in a form you can reuse.
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground">Terms used in the items</h3>
          <dl className="mt-1 space-y-1 text-sm text-foreground/90">
            <div>
              <dt className="inline font-semibold">Operation</dt>
              <dd className="ml-1 inline">
                : what is done, such as encapsulation, signature generation or signature
                verification.
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Parameter set</dt>
              <dd className="ml-1 inline">
                : the size or variant, such as ML-KEM-1024 or ML-DSA-65.
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Option</dt>
              <dd className="ml-1 inline">
                : a setting inside an operation, such as the signature interface, the Deterministic
                setting or External Mu.
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Hedged and deterministic</dt>
              <dd className="ml-1 inline">
                : the validations print the field "Deterministic: Yes, No". QASM's Security Policy
                calls non-deterministic signing "hedged"; the Luna T7 Security Policy does not use
                that word. FIPS 204 Section 3.4 describes both variants.
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Vendor-affirmed</dt>
              <dd className="ml-1 inline">
                : see the Learn tab, section "Algorithm validation is not the certificate".
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {ALGORITHM_RECORD_ITEMS.map((item, index) => {
        const showPanel = item.kind === 'compare' && MODULE_PANEL_ITEM_IDS.has(item.id)
        const highlight = focusId === item.id
        return (
          <div key={item.id} className="space-y-5">
            {showPanel ? <ModulePanel module={ALGORITHM_RECORD_MODULES[item.module]} /> : null}
            {item.kind === 'choose' ? (
              <p className="text-xs text-muted-foreground">
                Back to certificate #5497:{' '}
                <ExtLink href={cmvpCertificateUrl('5497')}>certificate page</ExtLink>,{' '}
                <ExtLink href={securityPolicyPageUrl('5497', 9)}>Security Policy</ExtLink> and{' '}
                <ExtLink href={CAVP_VALIDATION_URLS.A5631}>algorithm validation A5631</ExtLink>.
              </p>
            ) : null}
            <section
              id={itemDomId(item.id)}
              aria-labelledby={itemHeadingId(item.id)}
              className={`rounded-lg border p-4 ${highlight ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <h3 id={itemHeadingId(item.id)} className="text-sm font-bold text-foreground">
                {index + 1}. {item.title}
              </h3>
              <p className="mt-1 text-sm text-foreground/90">{item.prompt}</p>
              {item.kind === 'compare' ? (
                <>
                  {item.approvedNote ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.approvedNote}</p>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {marksOf(item).map(({ id }) => (
                      <MarkField
                        key={id}
                        itemId={item.id}
                        markId={id}
                        value={answers[item.id]?.[id]}
                        onChange={(answer) => setMark(item.id, id, answer)}
                      />
                    ))}
                  </div>
                  {checked ? (
                    <CompareResult
                      item={item}
                      verdict={judgeCompareItem(item, answers[item.id] ?? {})}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <fieldset className="mt-3 space-y-2">
                    <legend className="sr-only">{item.prompt}</legend>
                    {item.choices.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm"
                      >
                        <input
                          type="radio"
                          name={`${MARK_NAME_PREFIX}-${item.id}`}
                          value={c.id}
                          checked={choices[item.id] === c.id}
                          onChange={() => {
                            setChoices((prev) => ({ ...prev, [item.id]: c.id }))
                            setChecked(false)
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                        />
                        <span>{c.text}</span>
                      </label>
                    ))}
                  </fieldset>
                  {checked ? <ChoiceResult item={item} chosen={choices[item.id]} /> : null}
                </>
              )}
            </section>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <Button variant="gradient" disabled={!complete} onClick={() => setChecked(true)}>
          <ClipboardList size={16} className="mr-2" aria-hidden="true" />
          Check
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw size={16} className="mr-2" aria-hidden="true" />
          Reset
        </Button>
        {!complete ? (
          <p className="self-center text-xs text-muted-foreground">
            Answer every mark and item 7 to check.
          </p>
        ) : null}
      </div>

      <div aria-live="polite" aria-atomic="true">
        {checked ? (
          <div className="glass-panel space-y-2 p-5" data-testid="fips-records-score">
            <p className="text-sm font-bold text-foreground">
              {score} of {total} items match the records
            </p>
            <p className="text-sm text-foreground/90">{scoreBandText(score)}</p>
          </div>
        ) : null}
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">Your reading note</h3>
          <CopyButton text={noteText} label="Copy reading note" />
        </div>
        <CodeBlock
          code={noteText}
          language="text"
          className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap break-words px-4"
        />
      </div>
    </div>
  )
}
