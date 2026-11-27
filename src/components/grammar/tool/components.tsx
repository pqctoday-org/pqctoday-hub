// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The shared tool components of UX grammar v2.1, section 7.4 (the frame is in ToolFrame.tsx and
 * the step strip is block 12 in ../blocks.tsx): EngineBar, Pkcs11Panel, WizardFooter,
 * KnownAnswerTable, TamperTest, Verdict, ValueCard, OperationLog, CheckYourself, RecordExportBar,
 * SeededFromLine, and the four family chips.
 */
import * as React from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes, formatDuration, formatHex, formatSessionTime } from '@/lib/format'
import { Chip, type ChipProps } from '../Chip'
import type { ChipFamily, ChipWord } from '../chipRegistry'
import { RoleButton } from '../RoleButton'
import { verbLabel } from '../verbs'

/* ------------------------------------------------------------------ the four family chips */

type FamilyChipProps<F extends ChipFamily> = Omit<Extract<ChipProps, { family: F }>, 'family'>

function familyChip<F extends ChipFamily>(family: F, name: string) {
  const C = (props: FamilyChipProps<F>) => (
    <Chip {...({ ...props, family } as unknown as ChipProps)} />
  )
  C.displayName = name
  return C
}

/** Family 7: where a value came from. */
export const OriginChip = familyChip('origin', 'OriginChip')
/** Family 8: proof of a user's claim. */
export const EvidenceChip = familyChip('evidence', 'EvidenceChip')
/** Family 6a: how a Playground tool runs. One per tool page. */
export const HowItRunsChip = familyChip('howItRuns', 'HowItRunsChip')
/** Family 6b: what a Business tool produces. One per tool page. */
export const OutputKindChip = familyChip('outputKind', 'OutputKindChip')

/* ------------------------------------------------------------------ Verdict */

export type VerdictWord = ChipWord<'verdict'>

/** The one verdict: it accepts only the words of family 9. */
export function Verdict({
  word,
  detail,
  className,
}: {
  word: VerdictWord
  detail?: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)} data-verdict={word}>
      <Chip family="verdict" word={word} />
      {detail && <span className="type-small">{detail}</span>}
    </span>
  )
}

/* ------------------------------------------------------------------ EngineBar (T3) */

export interface EngineBarProps {
  /** Engine and session status in words: "Browser engine · session ready". */
  status: string
  /** The switch "Use the browser HSM". */
  usingBrowserHsm: boolean
  onUseBrowserHsm: (on: boolean) => void
  className?: string
}

export function EngineBar({ status, usingBrowserHsm, onUseBrowserHsm, className }: EngineBarProps) {
  return (
    <div
      data-slot-part="engine-bar"
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-2',
        className
      )}
    >
      <p className="type-small" role="status">
        {status}
      </p>
      <label className="flex min-h-[44px] items-center gap-2 type-small font-semibold">
        <input
          type="checkbox"
          role="switch"
          checked={usingBrowserHsm}
          onChange={(e) => onUseBrowserHsm(e.target.checked)}
        />
        Use the browser HSM
      </label>
    </div>
  )
}

/* ------------------------------------------------------------------ Pkcs11Panel (T9) */

export interface Pkcs11Call {
  fn: string
  /** The return value, e.g. "CKR_OK". */
  returned: string
  count: number
  cryptographic?: boolean
}

export interface Pkcs11Key {
  handle: string
  label: string
  role: string
  /** Key size in bytes or bits as the tool states; shown as given. */
  size: string
}

export interface Pkcs11PanelProps {
  calls: Pkcs11Call[]
  keys: Pkcs11Key[]
  /** `?panel=calls` restores it. */
  tab: 'calls' | 'keys'
  onTabChange: (tab: 'calls' | 'keys') => void
  className?: string
}

/** Two tabs: Calls (function, return, count) and Keys (handle, label, role, size). */
export function Pkcs11Panel({ calls, keys, tab, onTabChange, className }: Pkcs11PanelProps) {
  const total = calls.reduce((n, c) => n + c.count, 0)
  const crypto = calls.filter((c) => c.cryptographic).reduce((n, c) => n + c.count, 0)
  return (
    <aside
      aria-label="PKCS#11"
      className={cn('rounded-2xl border border-border bg-card p-3', className)}
    >
      <div role="tablist" aria-label="PKCS#11 panel" className="mb-2 flex gap-1">
        {(['calls', 'keys'] as const).map((t) => (
          <RoleButton
            key={t}
            role="tab"
            dense
            emphasis={tab === t ? 'primary' : 'quiet'}
            aria-selected={tab === t}
            onClick={() => onTabChange(t)}
          >
            {t === 'calls' ? 'Calls' : 'Keys'}
          </RoleButton>
        ))}
      </div>
      {tab === 'calls' ? (
        <>
          <p className="type-small text-muted-foreground">
            {total} calls · {crypto} cryptographic
          </p>
          <table className="w-full type-small">
            <thead>
              <tr>
                <th className="type-eyebrow text-left">Function</th>
                <th className="type-eyebrow text-left">Return</th>
                <th className="type-eyebrow text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.fn} className="border-t border-border">
                  <td className="type-code">{c.fn}</td>
                  <td className="type-code">{c.returned}</td>
                  <td className="text-right">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <table className="w-full type-small">
          <thead>
            <tr>
              {['Handle', 'Label', 'Role', 'Size'].map((h) => (
                <th key={h} className="type-eyebrow text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.handle} className="border-t border-border">
                <td className="type-code">{k.handle}</td>
                <td>{k.label}</td>
                <td>{k.role}</td>
                <td>{k.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </aside>
  )
}

/* ------------------------------------------------------------------ WizardFooter (T6) */

export interface WizardFooterProps {
  step: number
  total: number
  onBack?: () => void
  onSkip?: () => void
  onRunStep?: () => void
  /** Next, or Finish on the last step (said once; completion is recorded by the caller). */
  onNext: () => void
  className?: string
}

/** Back · Skip step · Run step · Next / Finish, with "Step n of N". */
export function WizardFooter({
  step,
  total,
  onBack,
  onSkip,
  onRunStep,
  onNext,
  className,
}: WizardFooterProps) {
  const last = step >= total
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <p className="type-small mr-auto" aria-live="polite">
        Step {step} of {total}
      </p>
      {onBack && step > 1 && <RoleButton onClick={onBack}>{verbLabel('back')}</RoleButton>}
      {onSkip && !last && (
        <RoleButton emphasis="quiet" onClick={onSkip}>
          {verbLabel('skipStep')}
        </RoleButton>
      )}
      {onRunStep && <RoleButton onClick={onRunStep}>{verbLabel('runStep')}</RoleButton>}
      <RoleButton emphasis="primary" onClick={onNext}>
        {last ? verbLabel('finish') : verbLabel('next')}
      </RoleButton>
    </div>
  )
}

/* ------------------------------------------------------------------ KnownAnswerTable (T8) */

export interface KnownAnswerRow {
  id: string
  status: 'Pass' | 'Fail'
  check: string
  algorithm: string
  source: string
  detail?: string
}

/** Status · Check · Algorithm · Source · Detail, and "n of n passed". */
export function KnownAnswerTable({
  rows,
  className,
}: {
  rows: KnownAnswerRow[]
  className?: string
}) {
  const passed = rows.filter((r) => r.status === 'Pass').length
  return (
    <section aria-label="Known-answer checks" className={cn('flex flex-col gap-2', className)}>
      <p className="type-small font-semibold" aria-live="polite">
        {passed} of {rows.length} passed
      </p>
      <div className="overflow-x-auto">
        <table className="w-full type-small">
          <thead>
            <tr>
              {['Status', 'Check', 'Algorithm', 'Source', 'Detail'].map((h) => (
                <th key={h} scope="col" className="type-eyebrow px-2 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-2 py-1">
                  <Verdict word={r.status} />
                </td>
                <td className="px-2 py-1">{r.check}</td>
                <td className="px-2 py-1">{r.algorithm}</td>
                <td className="px-2 py-1">{r.source}</td>
                <td className="px-2 py-1">{r.detail ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ TamperTest (T8) */

export interface TamperTestProps {
  /** What changed, named: "byte 12 of the signature". */
  changed: string
  /** Valid before; the changed copy; valid again after the restore. */
  result: { before: boolean; tampered: boolean; restored: boolean } | null
  className?: string
}

/** Always three rows: Valid, Rejected as expected (names the changed byte), Valid. */
export function TamperTest({ changed, result, className }: TamperTestProps) {
  const rows: { label: string; word: VerdictWord | null; detail?: string }[] = [
    { label: 'Original', word: result ? (result.before ? 'Valid' : 'Invalid') : null },
    {
      label: 'Changed copy',
      word: result ? (result.tampered ? 'Valid' : 'Rejected as expected') : null,
      detail: `Changed ${changed}`,
    },
    { label: 'Restored', word: result ? (result.restored ? 'Valid' : 'Invalid') : null },
  ]
  return (
    <ol aria-label="Tamper test" className={cn('flex flex-col gap-1', className)}>
      {rows.map((r) => (
        <li key={r.label} className="flex flex-wrap items-center gap-2 type-small">
          <span className="font-semibold">{r.label}</span>
          {r.word ? (
            <Verdict word={r.word} detail={r.detail} />
          ) : (
            <span className="text-muted-foreground">Not run yet</span>
          )}
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ ValueCard (T7) */

export interface ValueCardProps {
  label: string
  /** Bytes to show in hex (lowercase, 4-byte words, two lines), or a ready string. */
  value: Uint8Array | number[] | string
  /** What the value is, in one line. */
  note?: string
  onCopy?: (fullValue: string) => void
  className?: string
}

/** The full hex in lines of 16 bytes, four-byte words (what "Show all" shows). */
const fullLines = (hex: string): string[] =>
  (hex.match(/.{1,32}/g) ?? []).map((line) => (line.match(/.{1,8}/g) ?? []).join(' '))

export function ValueCard({ label, value, note, onCopy, className }: ValueCardProps) {
  const hex = formatHex(value)
  const [all, setAll] = React.useState(false)
  const lines = all ? fullLines(hex.copyValue) : hex.lines
  return (
    <article className={cn('rounded-2xl border border-border bg-card p-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="type-eyebrow">{label}</h4>
        <Chip family="category" word={formatBytes(hex.totalBytes)} />
      </div>
      <pre className="type-code mt-1 whitespace-pre-wrap break-all" data-value>
        {lines.join('\n')}
      </pre>
      {note && <p className="type-small text-muted-foreground">{note}</p>}
      <div className="flex gap-2">
        {hex.shortened && hex.showAllLabel && (
          <RoleButton emphasis="quiet" dense onClick={() => setAll((v) => !v)} aria-pressed={all}>
            {all ? 'Show less' : hex.showAllLabel}
          </RoleButton>
        )}
        {onCopy && (
          <RoleButton dense onClick={() => onCopy(hex.copyValue)}>
            {verbLabel('copy')}
          </RoleButton>
        )}
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ OperationLog (T7) */

export interface OperationEntry {
  id: string
  status: 'ok' | 'fail' | 'running'
  label: string
  durationMs?: number
}

/** One line per call: status icon, duration at the right, Copy, `aria-live="polite"`. */
export function OperationLog({
  entries,
  onCopy,
  className,
}: {
  entries: OperationEntry[]
  onCopy?: () => void
  className?: string
}) {
  return (
    <section
      aria-label="Operation log"
      className={cn('rounded-2xl border border-border bg-card p-3', className)}
    >
      <ol aria-live="polite" className="flex flex-col gap-1">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-2 type-small">
            {e.status === 'ok' && (
              <CheckCircle2 size={14} aria-label="Done" className="text-chip-ok-fg" />
            )}
            {e.status === 'fail' && (
              <XCircle size={14} aria-label="Failed" className="text-chip-critical-fg" />
            )}
            {e.status === 'running' && (
              <Loader2 size={14} aria-label="Running" className="motion-safe:animate-spin" />
            )}
            <span className="min-w-0 flex-1 break-words">{e.label}</span>
            {e.durationMs !== undefined && (
              <span className="type-code">{formatDuration(e.durationMs, 'ms')}</span>
            )}
          </li>
        ))}
      </ol>
      {onCopy && (
        <RoleButton dense className="mt-2" onClick={onCopy}>
          {verbLabel('copy')}
        </RoleButton>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ CheckYourself (T10) */

export interface CheckQuestion {
  id: string
  prompt: string
  options: { id: string; label: string }[]
  correctId: string
  explanation: string
}

/** One card that pages "Question 1 of 2"; options in a fixed order; feedback after choosing. */
export function CheckYourself({
  questions,
  className,
}: {
  questions: CheckQuestion[]
  className?: string
}) {
  const [index, setIndex] = React.useState(0)
  const [chosen, setChosen] = React.useState<Record<string, string>>({})
  const q = questions[index]
  if (!q) return null
  const picked = chosen[q.id]
  return (
    <section
      aria-label="Check yourself"
      className={cn('rounded-2xl border border-border bg-card p-4', className)}
    >
      <p className="type-eyebrow">
        Question {index + 1} of {questions.length}
      </p>
      <p className="type-body font-semibold mt-1">{q.prompt}</p>
      <div role="radiogroup" aria-label={q.prompt} className="mt-2 flex flex-col gap-2">
        {q.options.map((o) => (
          <label
            key={o.id}
            className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-2xl border border-border px-3 has-[:checked]:border-highlight-border has-[:checked]:bg-highlight"
          >
            <input
              type="radio"
              name={q.id}
              checked={picked === o.id}
              onChange={() => setChosen((c) => ({ ...c, [q.id]: o.id }))}
            />
            <span className="type-body">{o.label}</span>
          </label>
        ))}
      </div>
      {picked && (
        <p role="status" className="type-small mt-2">
          {picked === q.correctId ? 'Correct. ' : 'Not quite. '}
          {q.explanation}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {index > 0 && (
          <RoleButton onClick={() => setIndex((i) => i - 1)}>{verbLabel('back')}</RoleButton>
        )}
        {index < questions.length - 1 && (
          <RoleButton emphasis="primary" disabled={!picked} onClick={() => setIndex((i) => i + 1)}>
            {verbLabel('next')}
          </RoleButton>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ RecordExportBar (T12) */

export interface RecordExportBarProps {
  onSave?: () => void
  /** After saving: the real store the code wrote to, the time, and what Open does. */
  saved?: { store: string; at: Date | number; onOpen: () => void }
  onCopySummary?: () => void
  /** The formats in the Download menu: "Run record (JSON)", "CSV", ".pem". */
  downloads?: { id: string; label: string; onSelect: () => void }[]
  onPrint?: () => void
  className?: string
}

/** Save · Copy · Download ▾ · Print, and "Saved to <store> · HH:MM · Open ›". */
export function RecordExportBar({
  onSave,
  saved,
  onCopySummary,
  downloads = [],
  onPrint,
  className,
}: RecordExportBarProps) {
  const [menu, setMenu] = React.useState(false)
  return (
    <div data-slot-part="export-bar" className={cn('flex flex-wrap items-center gap-2', className)}>
      {onSave && (
        <RoleButton emphasis="primary" onClick={onSave}>
          {verbLabel('save')}
        </RoleButton>
      )}
      {onCopySummary && <RoleButton onClick={onCopySummary}>{verbLabel('copySummary')}</RoleButton>}
      {downloads.length > 0 && (
        <div className="relative">
          <RoleButton aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            {verbLabel('download')}
          </RoleButton>
          {menu && (
            <div
              role="menu"
              className="absolute z-10 mt-1 flex min-w-40 flex-col rounded-2xl border border-border bg-popover p-1"
            >
              {downloads.map((d) => (
                <RoleButton
                  key={d.id}
                  emphasis="quiet"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    d.onSelect()
                  }}
                >
                  {d.label}
                </RoleButton>
              ))}
            </div>
          )}
        </div>
      )}
      {onPrint && (
        <RoleButton emphasis="quiet" onClick={onPrint}>
          Print
        </RoleButton>
      )}
      {saved && (
        <p role="status" className="type-small">
          Saved to {saved.store} · {formatSessionTime(saved.at).slice(0, 5)} ·{' '}
          <RoleButton
            emphasis="quiet"
            dense
            className="min-h-0 px-1 py-0 align-baseline"
            onClick={saved.onOpen}
          >
            Open ›
          </RoleButton>
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ SeededFromLine (S) */

/** One chip per pre-fill source and "Start blank". */
export function SeededFromLine({
  sources,
  onStartBlank,
  className,
}: {
  sources: string[]
  onStartBlank: () => void
  className?: string
}) {
  return (
    <div
      data-slot-part="seeded-from"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {sources.map((s) => (
        <OriginChip key={s} word="Seeded" from={s} />
      ))}
      <RoleButton emphasis="quiet" dense onClick={onStartBlank}>
        {verbLabel('startBlank')}
      </RoleButton>
    </div>
  )
}
