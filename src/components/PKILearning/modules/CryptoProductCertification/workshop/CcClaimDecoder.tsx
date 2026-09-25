// SPDX-License-Identifier: GPL-3.0-only
// OWNER: CC/EU author
/**
 * Workshop step `cc-claim-decoder` (Common Criteria path). The learner decodes
 * three REAL certificate records (dated fixture in data/ccEuData.ts, verified
 * 24 September 2026 against the official certificate / report):
 *   1. match each augmentation component to what it adds;
 *   2. read the record's scope, scheme, PP and recognition;
 *   3. judge which claims the record supports.
 * The artifact is a copyable "decoded claim" per record plus a comparison that
 * shows why the three cannot be ranked by headline.
 */
import { useMemo, useState, type FC } from 'react'
import { CheckCircle2, ExternalLink, FileSearch, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { CopyButton } from '@/components/ui/CopyButton'
import type { CertWorkshopStepProps } from '../data/types'
import {
  ASSURANCE_COMPONENTS,
  AVA_VAN_ATTACK_POTENTIAL,
  CC_DECODER_RECORDS,
  CLAIM_VERDICT_LABEL,
  findDecoderRecord,
  type CertRecordFixture,
  type ClaimVerdict,
} from '../data/ccEuData'
import { CheckedOn } from '../components/sections/CcEuSections'

const VERDICTS: ClaimVerdict[] = ['supported', 'not-supported', 'not-shown']

/** Every component code the dictionary knows, in a stable order — the distractor pool. */
const ALL_CODES = [...ASSURANCE_COMPONENTS.keys()]

/** Three choices per component: the right meaning plus two stable distractors. */
function choicesFor(code: string): string[] {
  const i = ALL_CODES.indexOf(code)
  const n = ALL_CODES.length
  const picks = [code, ALL_CODES[(i + 3) % n], ALL_CODES[(i + 7) % n]]
  // rotate so the right answer is not always first
  const shift = i % 3
  return [...picks.slice(shift), ...picks.slice(0, shift)]
}

const key = (recordId: string, itemId: string) => `${recordId}:${itemId}`

const fullClaim = (r: CertRecordFixture) =>
  r.components.length > 0 ? `${r.eal} augmented with ${r.components.join(', ')}` : r.eal

function decodedText(
  r: CertRecordFixture,
  matches: ReadonlyMap<string, string>,
  verdicts: ReadonlyMap<string, ClaimVerdict>
): string {
  const lines: string[] = [
    `DECODED CLAIM — ${r.product} (${r.vendor})`,
    `Headline seen:  "${r.headline}"  [${r.headlineSource}]`,
    `Full claim:     ${fullClaim(r)}`,
    `Vulnerability:  AVA_VAN.${r.avaVan} → attack potential ${AVA_VAN_ATTACK_POTENTIAL.get(r.avaVan) ?? '?'}`,
    '',
    'Components:',
  ]
  for (const code of r.components) {
    const c = ASSURANCE_COMPONENTS.get(code)
    const pick = matches.get(key(r.id, code))
    const mark =
      pick === undefined ? '[ not matched ]' : pick === code ? '[ matched ✓ ]' : '[ matched ✗ ]'
    lines.push(`  ${mark} ${code} ${c?.name ?? ''} — ${c?.vsEal4 ?? ''}`)
  }
  lines.push('', 'Record facts:')
  for (const f of r.fields) lines.push(`  ${f.label}: ${f.value}`)
  lines.push('', 'Claims judged:')
  for (const c of r.claims) {
    const v = verdicts.get(key(r.id, c.id))
    const verdictLabel = CLAIM_VERDICT_LABEL.get(c.verdict) ?? c.verdict
    const mark = v === undefined ? '[ not judged ]' : v === c.verdict ? '[ ✓ ]' : '[ ✗ ]'
    lines.push(`  ${mark} ${c.text}`, `      → ${verdictLabel}. ${c.why}`)
  }
  if (r.datasetNote) lines.push('', `Dataset check: ${r.datasetNote}`)
  lines.push(
    '',
    'Sources:',
    ...r.sources.map((s) => `  ${s.label}: ${s.url}`),
    `Checked against the official record on ${r.checkedOn}. Practitioner orientation — not laboratory training.`
  )
  return lines.join('\n')
}

export const CcClaimDecoder: FC<CertWorkshopStepProps> = ({ config }) => {
  const initial = findDecoderRecord(config?.recordId) ?? CC_DECODER_RECORDS[0]
  const focus = typeof config?.focus === 'string' ? config.focus : undefined

  const [recordId, setRecordId] = useState<string>(initial.id)
  const [matches, setMatches] = useState<ReadonlyMap<string, string>>(new Map())
  const [verdicts, setVerdicts] = useState<ReadonlyMap<string, ClaimVerdict>>(new Map())

  const record = findDecoderRecord(recordId) ?? CC_DECODER_RECORDS[0]

  const progress = useMemo(
    () =>
      CC_DECODER_RECORDS.map((r) => {
        const matched = r.components.filter((c) => matches.get(key(r.id, c)) === c).length
        const judged = r.claims.filter((c) => verdicts.get(key(r.id, c.id)) === c.verdict).length
        return {
          id: r.id,
          done: matched === r.components.length && judged === r.claims.length,
          score: matched + judged,
          total: r.components.length + r.claims.length,
        }
      }),
    [matches, verdicts]
  )
  const decodedCount = progress.filter((p) => p.done).length

  const setMatch = (code: string, choice: string) =>
    setMatches((prev) => new Map(prev).set(key(record.id, code), choice))
  const setVerdict = (claimId: string, v: ClaimVerdict) =>
    setVerdicts((prev) => new Map(prev).set(key(record.id, claimId), v))

  const artifact = decodedText(record, matches, verdicts)
  const ring = (panel: string) => (focus === panel ? 'ring-2 ring-primary/60' : '')

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-3 p-5">
        <div className="flex items-start gap-3">
          <FileSearch size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-1 text-sm text-foreground/90">
            <p>
              Three real certificates. Two HSM listings both read “EAL4+”; the third is an EUCC
              certificate at a nominal EAL1. Decode each one: what was added to the EAL, what the
              record covers, and which claims it supports.
            </p>
            <p className="text-xs text-muted-foreground">
              Decoded {decodedCount} of {CC_DECODER_RECORDS.length} records.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Certificate record">
          {CC_DECODER_RECORDS.map((r) => {
            const p = progress.find((x) => x.id === r.id)
            return (
              <Button
                key={r.id}
                variant={r.id === record.id ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={r.id === record.id}
                onClick={() => setRecordId(r.id)}
              >
                {p?.done ? <CheckCircle2 size={14} className="mr-1.5" aria-hidden="true" /> : null}
                {r.shortName}
              </Button>
            )
          })}
        </div>
      </div>

      {/* 1 — headline vs full claim */}
      <div className={`glass-panel space-y-4 p-5 ${ring('components')}`}>
        <h3 className="text-base font-semibold text-foreground">
          1. What did the “{record.eal}” get augmented with?
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Headline as a listing shows it</p>
            <p className="font-mono text-lg font-bold text-foreground">{record.headline}</p>
            <p className="text-xs text-muted-foreground">{record.headlineSource}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Full claim on the certificate</p>
            <p className="font-mono text-sm font-bold text-foreground">{fullClaim(record)}</p>
            <p className="text-xs text-muted-foreground">
              AVA_VAN.{record.avaVan}: penetration testing assumes{' '}
              {AVA_VAN_ATTACK_POTENTIAL.get(record.avaVan) ?? '?'} attack potential
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground/90">
          For each component, pick what it adds. The feedback says how it relates to the base
          package.
        </p>
        <ul className="space-y-4">
          {record.components.map((code) => {
            const picked = matches.get(key(record.id, code))
            const comp = ASSURANCE_COMPONENTS.get(code)
            return (
              <li key={code} className="space-y-2">
                <p className="font-mono text-sm font-semibold text-foreground">{code}</p>
                <div className="grid gap-2" role="group" aria-label={`Meaning of ${code}`}>
                  {choicesFor(code).map((choice) => {
                    const meaning = ASSURANCE_COMPONENTS.get(choice)?.plain ?? choice
                    const isPicked = picked === choice
                    return (
                      <Button
                        key={choice}
                        variant={isPicked ? 'secondary' : 'outline'}
                        size="sm"
                        aria-pressed={isPicked}
                        className="h-auto justify-start whitespace-normal py-2 text-left"
                        onClick={() => setMatch(code, choice)}
                      >
                        {meaning}
                      </Button>
                    )
                  })}
                </div>
                {picked !== undefined ? (
                  <p
                    className={`flex items-start gap-2 text-xs ${picked === code ? 'text-status-success' : 'text-status-error'}`}
                    role="status"
                  >
                    {picked === code ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-foreground/90">
                      {picked === code ? 'Right — ' : 'Not that one — '}
                      <strong>
                        {code} {comp?.name}
                      </strong>
                      . {comp?.vsEal4}
                    </span>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      {/* 2 — the record */}
      <div className={`glass-panel space-y-3 p-5 ${ring('recognition')}`}>
        <h3 className="text-base font-semibold text-foreground">2. What the record says</h3>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted-foreground">Product</dt>
          <dd className="text-foreground">
            {record.product} — {record.vendor}
          </dd>
          {record.fields.map((f) => (
            <div key={f.label} className="contents">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="text-foreground/90">{f.value}</dd>
            </div>
          ))}
        </dl>
        {record.datasetNote ? (
          <p className="rounded-lg border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-foreground">
            <strong>Dataset check:</strong> {record.datasetNote}
          </p>
        ) : null}
        <ul className="space-y-1 text-xs">
          {record.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
              >
                {s.label}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <CheckedOn date={record.checkedOn} />
      </div>

      {/* 3 — claims */}
      <div className={`glass-panel space-y-4 p-5 ${ring('claims')}`}>
        <h3 className="text-base font-semibold text-foreground">
          3. Which claims does this record support?
        </h3>
        <ul className="space-y-4">
          {record.claims.map((c) => {
            const v = verdicts.get(key(record.id, c.id))
            return (
              <li key={c.id} className="space-y-2">
                <p className="text-sm text-foreground">{c.text}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Your verdict">
                  {VERDICTS.map((opt) => (
                    <Button
                      key={opt}
                      size="sm"
                      variant={v === opt ? 'secondary' : 'outline'}
                      aria-pressed={v === opt}
                      onClick={() => setVerdict(c.id, opt)}
                    >
                      {CLAIM_VERDICT_LABEL.get(opt)}
                    </Button>
                  ))}
                </div>
                {v !== undefined ? (
                  <p
                    className={`flex items-start gap-2 text-xs ${v === c.verdict ? 'text-status-success' : 'text-status-error'}`}
                    role="status"
                  >
                    {v === c.verdict ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-foreground/90">
                      <strong>{CLAIM_VERDICT_LABEL.get(c.verdict)}.</strong> {c.why}
                    </span>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Artifact */}
      <div className="glass-panel space-y-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Your decoded claim</h3>
          <CopyButton text={artifact} label="Copy decoded claim" />
        </div>
        <CodeBlock code={artifact} language="text" className="mt-2 whitespace-pre-wrap" />
      </div>

      {/* Comparison */}
      <div className="glass-panel space-y-3 p-5">
        <h3 className="text-base font-semibold text-foreground">
          The three side by side — rank them?
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Comparison of the three decoded certificates</caption>
            <thead>
              <tr className="border-b border-border">
                {['Record', 'Headline', 'Full claim', 'Attack potential', 'Scheme'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="p-2 text-left font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CC_DECODER_RECORDS.map((r) => (
                <tr key={r.id} className="border-b border-border/50 align-top">
                  <td className="p-2 text-foreground">{r.shortName}</td>
                  <td className="p-2 font-mono text-xs text-foreground">{r.headline}</td>
                  <td className="p-2 font-mono text-xs text-foreground/90">{fullClaim(r)}</td>
                  <td className="p-2 text-foreground/90">
                    {AVA_VAN_ATTACK_POTENTIAL.get(r.avaVan)} (AVA_VAN.{r.avaVan})
                  </td>
                  <td className="p-2 text-foreground/90">
                    {r.fields.find((f) => f.label.startsWith('Scheme'))?.value ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-foreground/90">
          There is no single ranking. The two HSMs share EAL4 and AVA_VAN.5 but claim different
          components, under different schemes and PP restrictions. The switch was evaluated against
          a collaborative PP whose evaluation activities, not its EAL number, define the testing.
          Each certificate answers its own question about its own TOE.
        </p>
      </div>
    </div>
  )
}
