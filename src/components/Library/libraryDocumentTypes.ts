// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What each Library document type is, and how to use one: read by the table
 * popover, the detail drawer and the phone sheet so all three say the same.
 * Moved verbatim from LibraryDetailPopover.tsx (2026-11-14).
 */
export const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  Standard:
    'A standards publication. Use its publisher, edition, status and applicable scope to determine which requirements apply; the record does not establish product compliance.',
  RFC: 'A publication in the RFC Series. Check its stream and status: an RFC can be Standards Track, Informational or Experimental, and may be an Independent Submission rather than IETF consensus.',
  'Internet-Draft':
    'IETF work in progress, not yet an RFC. Content can change or be abandoned outright; cite it for direction of travel, not as a stable requirement.',
  Regulation:
    'Binding law or regulation. Non-compliance carries legal consequence, and the deadline is set by the instrument, not by your programme.',
  'Government Guidance':
    'Non-binding advice from a government body or regulator. Carries real weight with auditors and is often the precursor to a rule, but is not itself enforceable.',
  'Compliance Framework':
    'A scheme, certification programme or control set organisations are assessed against — the thing an auditor holds you to, as distinct from the standard it draws on.',
  'Research Paper':
    'Academic paper or preprint. Check the stated review process, methods and limitations; a research finding is distinct from a deployment recommendation.',
  'Industry Report':
    'Analyst, vendor or consortium reporting and surveys. Useful for market state and adoption evidence; the author usually has a position.',
  Article:
    'News, blog or commentary. Fast-moving and short-lived — good for what changed this month, weak as a durable citation.',
  Reference:
    'A reference resource such as documentation, a tool, dataset, registry or hosted proposal. Use its named edition or proposal disposition; the type does not by itself establish standards adoption.',
}

/** The explanation for a row's `document_type`, or undefined for a type with none. */
export function documentTypeDescription(documentType: string | undefined): string | undefined {
  const key = (documentType ?? '').trim()
  return key && Object.hasOwn(DOCUMENT_TYPE_DESCRIPTIONS, key)
    ? DOCUMENT_TYPE_DESCRIPTIONS[key]
    : undefined
}
