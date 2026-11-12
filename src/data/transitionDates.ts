// SPDX-License-Identifier: AGPL-3.0-only
export interface TransitionDateEvidence {
  precision: 'day' | 'month' | 'year' | 'not-recorded'
  event: 'publication' | 'after-year-policy' | 'source-label'
  label: string
  iso?: string
  sourceUrl?: string
  /** A boundary derived from after-year wording, not a claimed publication day. */
  boundaries?: { event: 'deprecated' | 'disallowed'; afterYear: number; effectiveFrom: string }[]
}

/** Preserve explicit source precision; exact publication values belong in the maintained CSV. */
export function standardizationDateEvidence(label: string, iso?: string): TransitionDateEvidence {
  const evidence = sourceDateEvidence(label, iso)
  return {
    ...evidence,
    event: /\bpublication\b|\bpublished\b/i.test(label) ? 'publication' : 'source-label',
  }
}

function sourceDateEvidence(label: string, iso?: string): TransitionDateEvidence {
  const exactDay = /\b\d{4}-\d{2}-\d{2}\b/.test(label)
  const month =
    /\b\d{4}-\d{2}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/i.test(
      label
    )
  // A January-1 marker beside a year/month label does not establish a source day.
  const placeholder = Boolean(iso?.endsWith('-01-01')) && !exactDay
  const precision =
    !label && !iso
      ? 'not-recorded'
      : exactDay || (iso && !placeholder)
        ? 'day'
        : month
          ? 'month'
          : /\b\d{4}\b/.test(label)
            ? 'year'
            : 'not-recorded'
  return { precision, event: 'source-label', label, iso: placeholder ? undefined : iso }
}

export function deprecationDateEvidence(
  label: string,
  iso: string | undefined,
  region: string
): TransitionDateEvidence {
  const declared = [...label.matchAll(/After (\d{4}) \((Deprecated|Disallowed)\)/g)]
  if (declared.length > 0 && region === 'NIST') {
    const boundaries: NonNullable<TransitionDateEvidence['boundaries']> = declared.map((match) => ({
      event: match[2] === 'Deprecated' ? 'deprecated' : 'disallowed',
      afterYear: Number(match[1]),
      effectiveFrom: `${Number(match[1]) + 1}-01-01`,
    }))
    return {
      precision: 'year',
      event: 'after-year-policy',
      label,
      boundaries,
      iso: iso === boundaries[0].effectiveFrom ? iso : undefined,
    }
  }
  return sourceDateEvidence(label, iso)
}
