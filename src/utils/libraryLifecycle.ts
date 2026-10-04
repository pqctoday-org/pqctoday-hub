// SPDX-License-Identifier: GPL-3.0-only
import { getDocumentStatusBucket, type DocumentStatusBucket } from './documentStatusBucket'

/**
 * The six lifecycle labels a library document can carry. Written exactly like
 * this in the library CSV's `lifecycle_state` column and shown exactly like this
 * on cards, the drawer, the table and the Lifecycle filter.
 *
 * Released   a finished, in-force document (was "Published")
 * Draft      anything still in progress, including proposals (was "Draft" and "Proposed")
 * Expired    lapsed or obsoleted without a replacement
 * Historical replaced or updated by a newer document (was "Superseded")
 * Research Paper, Misc: new; they come only from the `lifecycle_state` column.
 */
export const LIFECYCLE_LABELS = [
  'Released',
  'Draft',
  'Expired',
  'Historical',
  'Research Paper',
  'Misc',
] as const

export type LifecycleLabel = (typeof LIFECYCLE_LABELS)[number]

/** The three labels that were renamed. Old shared links (`?lifecycle=Published`)
 *  and any CSV row still spelled the old way resolve to the new label. "Proposed"
 *  had no label of its own after the change: it is a Draft. */
const RENAMED_LABELS: Record<string, LifecycleLabel> = {
  published: 'Released',
  proposed: 'Draft',
  superseded: 'Historical',
}

const LABEL_BY_KEY = new Map<string, LifecycleLabel>(
  LIFECYCLE_LABELS.map((label) => [labelKey(label), label])
)

/** Case, spacing and "_"/"-" differences do not matter ("research_paper"). */
function labelKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
}

/**
 * One of the six labels (or an old name for one of them), or null for anything
 * else. Used for the CSV `lifecycle_state` cell and for the `?lifecycle=` URL value.
 * The column also holds free text from before the six labels existed ("current",
 * "deprecated", "Round 2"); those are not labels and return null.
 */
export function parseLifecycleLabel(raw: string | null | undefined): LifecycleLabel | null {
  if (!raw) return null
  const key = labelKey(raw)
  // eslint-disable-next-line security/detect-object-injection -- key is a normalised lookup into a fixed table
  return LABEL_BY_KEY.get(key) ?? RENAMED_LABELS[key] ?? null
}

/** The label a document gets from its status text alone (the rules that ran
 *  before the six labels): used wherever `lifecycle_state` is blank or is not a
 *  label. Published becomes Released, Proposed becomes Draft, Superseded becomes
 *  Historical; Draft and Expired stay. */
export function lifecycleLabelFromStatusBucket(bucket: DocumentStatusBucket): LifecycleLabel {
  switch (bucket) {
    case 'Published':
      return 'Released'
    case 'Proposed':
    case 'Draft':
      return 'Draft'
    case 'Expired':
      return 'Expired'
    case 'Superseded':
      return 'Historical'
  }
}

/**
 * The label for one library row: the `lifecycle_state` column when it holds a
 * label, else the document's status text read by the earlier rules.
 */
export function resolveLifecycleLabel(row: {
  lifecycleState?: string | null
  documentStatus: string
}): LifecycleLabel {
  return (
    parseLifecycleLabel(row.lifecycleState) ??
    lifecycleLabelFromStatusBucket(getDocumentStatusBucket(row.documentStatus ?? ''))
  )
}

/**
 * The Lifecycle filter value for a `?lifecycle=` URL: a label, an old name for
 * one (`Published`, `Proposed`, `Superseded`), or `All`. Anything else is null,
 * which the page treats as no filter.
 */
export function parseLifecycleParam(raw: string | null | undefined): LifecycleLabel | 'All' | null {
  if (!raw) return null
  if (raw.trim().toLowerCase() === 'all') return 'All'
  return parseLifecycleLabel(raw)
}

/** How far along a label is, for picking the furthest stage across a document's
 *  revisions (higher = further). Research Paper and Misc are not stages; they
 *  rank above Expired and Historical so a lapsed or replaced revision never
 *  outranks them. */
const LABEL_RANK: Record<LifecycleLabel, number> = {
  Released: 5,
  Draft: 4,
  'Research Paper': 3,
  Misc: 2,
  Expired: 1,
  Historical: 0,
}

/** The furthest label across a revision group: the surviving record's own label
 *  plus its older revisions' labels. */
export function getGroupLifecycleLabel(
  primary: LifecycleLabel,
  priorLabels: LifecycleLabel[]
): LifecycleLabel {
  return [primary, ...priorLabels].reduce(
    // eslint-disable-next-line security/detect-object-injection -- both are LifecycleLabel keys
    (best, cur) => (LABEL_RANK[cur] > LABEL_RANK[best] ? cur : best),
    primary
  )
}

export const LIFECYCLE_STYLES: Record<
  LifecycleLabel,
  { badge: string; label: string; dot: string }
> = {
  Released: {
    badge: 'bg-success/15 text-success border border-success/40',
    label: 'Released',
    dot: 'bg-success',
  },
  Draft: {
    badge: 'bg-warning/15 text-warning border border-warning/40',
    label: 'Draft',
    dot: 'bg-warning',
  },
  Expired: {
    badge: 'bg-destructive/15 text-destructive border border-destructive/40',
    label: 'Expired',
    dot: 'bg-destructive',
  },
  Historical: {
    badge: 'bg-muted text-muted-foreground border border-border',
    label: 'Historical',
    dot: 'bg-muted-foreground',
  },
  'Research Paper': {
    badge: 'bg-status-info/15 text-status-info border border-status-info/40',
    label: 'Research Paper',
    dot: 'bg-status-info',
  },
  Misc: {
    badge: 'bg-muted/50 text-muted-foreground border border-dashed border-border',
    label: 'Misc',
    dot: 'bg-muted-foreground/60',
  },
}

export const LIFECYCLE_FILTER_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'All', label: 'All Statuses' },
  ...LIFECYCLE_LABELS.map((label) => ({ id: label, label })),
]
