// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Markdown export (decision J2): the one way My work leaves the device, and only when the learner asks.
 * Pure: it builds text from the data it is given. `downloadMarkdown` hands the text to the browser's save.
 */
import { saveAs } from 'file-saver'
import { addressOf, currentContentVersion, placeOf } from './tags'
import { summarizeAnswerPayload } from './answerSummary'
import { storageWords } from './storageWords'
import type { MyWorkItem } from './items'

export interface ExportOptions {
  /** Learner-facing name for a tag (section titles). Defaults to the lesson title and the part id. */
  labelOf?: (tag: string) => string
  /** Prefix for links, so a saved file's links open from anywhere. Empty keeps them relative. */
  origin?: string
  now?: Date
  objectiveTitle?: (id: string) => string | undefined
}

const day = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const quote = (text: string): string =>
  text
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n')

function itemMarkdown(
  item: MyWorkItem,
  o: Required<Pick<ExportOptions, 'origin'>> & ExportOptions
): string {
  const where = (tag: string) => o.labelOf?.(tag) ?? placeOf(tag)
  const link = (path: string) => `${o.origin}${path}`
  const filed = (ids: string[]) =>
    ids.length > 0
      ? `Objective: ${ids.map((id) => o.objectiveTitle?.(id) ?? id).join(', ')}`
      : 'Not filed under an objective'

  switch (item.type) {
    case 'comment': {
      const c = item.comment
      const changed = currentContentVersion(c.tag) > c.contentVersion
      return [
        `### Comment on ${where(c.tag)}`,
        '',
        quote(c.body),
        '',
        `You, ${day(c.updatedAt)}, version ${c.contentVersion}${c.edited ? ', edited' : ''}${
          changed ? ', section changed since' : ''
        }`,
        `Tag: ${c.tag}. Link: ${link(addressOf(c.tag))}`,
        filed(item.objectiveIds),
      ].join('\n')
    }
    case 'technical-artifact':
    case 'business-artifact':
    case 'draft': {
      const out = item.output
      const label =
        item.type === 'technical-artifact'
          ? 'Technical artifact'
          : item.type === 'draft'
            ? 'Draft'
            : 'Business artifact'
      return [
        `### ${label}: ${out.title}`,
        '',
        `${storageWords(out)}. Made in ${out.producer.route ? link(out.producer.route) : out.producer.toolId}`,
        out.approvalStatus ? `Approval status: ${out.approvalStatus}` : '',
        `${day(out.updatedAt)}. ${filed(item.objectiveIds)}`,
      ]
        .filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== ''))
        .join('\n')
    }
    case 'saved-answer': {
      const s = summarizeAnswerPayload(item.answer.payload)
      return [
        `### Saved answer: ${item.answer.question}`,
        '',
        s.answerText ?? '',
        s.note ? `\nNote: ${s.note}` : '',
        s.sourceTag ? `Source: ${s.sourceTag}` : '',
        s.rowTags.length ? `Records: ${s.rowTags.join(', ')}` : '',
        `Saved ${day(item.answer.savedAt)}. ${filed(item.objectiveIds)}`,
      ]
        .filter((l) => l !== '')
        .join('\n')
    }
    case 'saved-reference':
      return [
        `### Saved reference: ${item.reference.title}`,
        '',
        `Tag: ${item.reference.tag}. Link: ${link(`/go/${encodeURIComponent(item.reference.tag)}`)}`,
        `Saved ${day(item.reference.createdAt)}. ${filed(item.objectiveIds)}`,
      ].join('\n')
  }
}

/** The whole export, newest first as My work lists it. Items arrive already filtered. */
export function buildMarkdown(items: readonly MyWorkItem[], options: ExportOptions = {}): string {
  const opts = { ...options, origin: options.origin ?? '' }
  const now = options.now ?? new Date()
  const header = [
    '# My work, PQC Today',
    '',
    `Exported ${day(now.toISOString())}. Stored on this device only. Nothing here counts as completion.`,
    '',
  ]
  if (items.length === 0) return [...header, 'Nothing here yet.', ''].join('\n')
  return [...header, ...items.map((i) => itemMarkdown(i, opts)).flatMap((b) => [b, ''])].join('\n')
}

export function exportFileName(now: Date = new Date()): string {
  return `pqc-today-my-work-${now.toISOString().slice(0, 10)}.md`
}

export function downloadMarkdown(text: string, now: Date = new Date()): void {
  saveAs(new Blob([text], { type: 'text/markdown;charset=utf-8' }), exportFileName(now))
}
