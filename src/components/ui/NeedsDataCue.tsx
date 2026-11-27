// SPDX-License-Identifier: AGPL-3.0-only
import { isMissingDataLabel } from './missingData'

/**
 * The "Needs data" cue: a small dashed pill (the grammar's Origin chip, muted) placed after one of the
 * four missing-data words. Its word is always shown, so colour never carries it alone.
 */
export function NeedsDataCue() {
  return (
    <span
      data-testid="needs-data-cue"
      className="ml-1.5 inline-flex items-center rounded-full border border-dashed border-border bg-muted px-1.5 py-0.5 align-middle text-[11px] font-extrabold leading-none text-muted-foreground not-italic"
    >
      Needs data
    </span>
  )
}

/** A value's text; when it is one of the four missing-data words, in italics with the cue after it. */
export function MissingAwareText({ text }: { text: string }) {
  if (!isMissingDataLabel(text)) return <>{text}</>
  return (
    <>
      <span className="italic text-muted-foreground">{text}</span>
      <NeedsDataCue />
    </>
  )
}
