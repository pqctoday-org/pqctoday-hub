// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Part H: the one record viewer (UX grammar v2.1, section 3.1, V1 to V9). One right-hand drawer
 * for every record type; on a phone a bottom sheet of min(40dvh, 340px) with the title row and
 * the actions pinned. It replaces the nine viewer patterns; the page lanes switch to it one by one.
 *
 * Enter on a focused row opens it (RecordRow, DataTable). Esc closes it and returns focus to the
 * row that opened it. Ask Assistant hands over to the Assistant, which shows "Back to record".
 */
import * as React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StickerCard } from '@/components/storybook'
import { labelFor } from '@/data/recordTypes'
import { Chip, type ChipProps } from './Chip'
import { ProvenanceLine, type ProvenanceLineProps } from './FixedLines'
import { RelatedPanel, type RelatedItem } from './RelatedPanel'
import { RoleButton } from './RoleButton'
import { verbIcon, verbLabel } from './verbs'

export interface ViewerFact {
  /** A field key: it is shown through the label dictionary (D6), so `OrgName` reads "Issued by". */
  key: string
  value: string
}

export interface ViewerRecord {
  /** The tag: the single ID (V1, mono). */
  tag: string
  /** The record's type chip text, e.g. "Threat". */
  typeLabel: string
  /** V1: the status chip, if the type has one. */
  status?: ChipProps
  /** V2: the title. Null shows the tag and, with `titleFromSummary`, the note. */
  title: string | null
  titleFromSummary?: boolean
  /** V3: identity line. Fields use dictionary labels. */
  issuedBy?: string
  date?: string
  /** V4: summary + the provenance line. */
  summary?: string
  provenance: ProvenanceLineProps
  /** V5: key facts. Long free text shows one sentence and "…". */
  facts?: ViewerFact[]
  /** V6: the type's own detail panel. */
  detail?: React.ReactNode
  /** V7: "Source & trust". */
  sourceAndTrust?: React.ReactNode
  /** V8: related records. */
  related?: RelatedItem[]
  /** V9: the page of the record, for Open. */
  href?: string
}

export interface RecordViewerProps {
  /** The open record, or null for closed. */
  record: ViewerRecord | null
  onClose: () => void
  onAskAssistant: (tag: string) => void
  onSave?: (tag: string) => void
  onCopyLink: (tag: string) => void
  onOpenRelated: (tag: string) => void
  /** The ⋯ menu: Endorse and Flag. */
  onEndorse?: (tag: string) => void
  onFlag?: (tag: string) => void
  className?: string
}

const CAP = 'min(40dvh,340px)'

/** One sentence and "…" for long free text. */
export function firstSentence(text: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(text.trim())
  if (m && m[1].length < text.trim().length) return `${m[1]} …`
  return text.trim().length > 160 ? `${text.trim().slice(0, 157).trimEnd()} …` : text.trim()
}

export function RecordViewer({
  record,
  onClose,
  onAskAssistant,
  onSave,
  onCopyLink,
  onOpenRelated,
  onEndorse,
  onFlag,
  className,
}: RecordViewerProps) {
  const opener = React.useRef<HTMLElement | null>(null)
  const panel = React.useRef<HTMLElement | null>(null)
  const [expanded, setExpanded] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const tag = record?.tag ?? null

  // Remember what had focus (the row) when the record opens; hand focus back on close.
  React.useEffect(() => {
    if (!tag) return
    opener.current =
      (document.querySelector(`[data-record-tag="${CSS.escape(tag)}"]`) as HTMLElement | null) ??
      (document.activeElement as HTMLElement | null)
    panel.current?.focus()
    const rowToRestore = opener.current
    return () => rowToRestore?.focus?.()
  }, [tag])

  // Esc closes the viewer and focus returns to the row (a listener, so the aside stays a plain landmark).
  React.useEffect(() => {
    const el = panel.current
    if (!el || !tag) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [tag, onClose])

  if (!record) return null
  const R = record
  const icon = (k: 'open' | 'ask' | 'close' | 'copyLink' | 'save') => {
    const I = verbIcon(k)
    return I ? <I size={14} aria-hidden="true" /> : null
  }

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-label={`Record: ${R.title ?? R.tag}`}
      data-record-viewer
      data-expanded={expanded || undefined}
      style={{ ['--viewer-cap' as string]: CAP }}
      className={cn(
        'flex flex-col bg-card text-card-foreground',
        // Desktop: the right-hand drawer, one width.
        'md:fixed md:inset-y-0 md:right-0 md:z-40 md:w-[min(520px,100vw)] md:border-l-2 md:border-ink',
        // Phone: a bottom sheet, capped, or the whole screen once expanded.
        'max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:rounded-t-3xl max-md:border-t-2 max-md:border-ink',
        expanded ? 'max-md:top-0 max-md:rounded-none' : 'max-md:max-h-[var(--viewer-cap)]',
        className
      )}
    >
      {/* Title row and actions never scroll away. */}
      <div className="shrink-0 border-b border-border p-3" data-slot="title-row">
        <div className="flex flex-wrap items-center gap-2" data-slot="V1">
          <Chip family="category" word={R.typeLabel} />
          {R.status && <Chip {...R.status} />}
          <code className="type-code text-muted-foreground">{R.tag}</code>
        </div>
        <h2 className="type-section-title mt-1" data-slot="V2">
          {R.title ?? R.tag}
        </h2>
        {R.titleFromSummary && (
          <p className="type-small text-muted-foreground">Title taken from the summary.</p>
        )}
        {(R.issuedBy || R.date) && (
          <p className="type-small text-muted-foreground" data-slot="V3">
            {R.issuedBy && (
              <>
                {labelFor('OrgName')} {R.issuedBy}
              </>
            )}
            {R.issuedBy && R.date && ' · '}
            {R.date && (
              <>
                {labelFor('issue_date')} {R.date}
              </>
            )}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2" data-slot="V9">
          <RoleButton emphasis="primary" dense onClick={() => onAskAssistant(R.tag)}>
            {icon('ask')}
            {verbLabel('ask')}
          </RoleButton>
          <RoleButton dense onClick={() => onCopyLink(R.tag)}>
            {icon('copyLink')}
            {verbLabel('copyLink')}
          </RoleButton>
          {onSave && (
            <RoleButton dense onClick={() => onSave(R.tag)}>
              {icon('save')}
              {verbLabel('save')}
            </RoleButton>
          )}
          {(onEndorse || onFlag) && (
            <div className="relative">
              <RoleButton
                dense
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label="More actions"
                onClick={() => setMenu((v) => !v)}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </RoleButton>
              {menu && (
                <div
                  role="menu"
                  className="absolute right-0 z-10 mt-1 flex flex-col rounded-2xl border border-border bg-popover p-1"
                >
                  {onEndorse && (
                    <RoleButton
                      emphasis="quiet"
                      dense
                      role="menuitem"
                      onClick={() => onEndorse(R.tag)}
                    >
                      {verbLabel('endorse')}
                    </RoleButton>
                  )}
                  {onFlag && (
                    <RoleButton
                      emphasis="quiet"
                      dense
                      role="menuitem"
                      onClick={() => onFlag(R.tag)}
                    >
                      {verbLabel('flag')}
                    </RoleButton>
                  )}
                </div>
              )}
            </div>
          )}
          <RoleButton
            emphasis="quiet"
            dense
            className="md:hidden"
            onClick={() => setExpanded((v) => !v)}
            aria-pressed={expanded}
          >
            {verbLabel('expand')}
          </RoleButton>
          <RoleButton emphasis="quiet" dense className="ml-auto" onClick={onClose}>
            {icon('close')}
            {verbLabel('close')}
          </RoleButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
        <div data-slot="V4" className="flex flex-col gap-1">
          {R.summary ? <p className="type-body">{R.summary}</p> : null}
          <ProvenanceLine {...R.provenance} />
        </div>
        {R.facts && R.facts.length > 0 && (
          <dl data-slot="V5" className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-small">
            {R.facts.map((f) => (
              <React.Fragment key={f.key}>
                <dt className="type-eyebrow">{labelFor(f.key)}</dt>
                <dd>{firstSentence(f.value)}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {R.detail && <div data-slot="V6">{R.detail}</div>}
        {R.sourceAndTrust && (
          <StickerCard padding="default" data-slot="V7">
            <h3 className="type-block-title">Source &amp; trust</h3>
            {R.sourceAndTrust}
          </StickerCard>
        )}
        <div data-slot="V8">
          <RelatedPanel items={R.related ?? []} onOpen={onOpenRelated} />
        </div>
      </div>
    </aside>
  )
}
