// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'

const ENTRY_TYPES = [
  { id: 'image', label: 'Image digest (EFI_CERT_SHA256)' },
  { id: 'certificate', label: 'Certificate digest (EFI_CERT_X509_SHA256)' },
]
const TIMESTAMP_OUTCOMES = [
  { id: 'before', label: 'Verified and before revocation' },
  { id: 'at-or-after', label: 'Verified and at or after revocation' },
  { id: 'unverified', label: 'Missing or unverified' },
]

export function DbxRevocationCheck() {
  const [entryType, setEntryType] = useState('image')
  const [digestMatches, setDigestMatches] = useState(true)
  const [datedRevocation, setDatedRevocation] = useState(true)
  const [supportsTimestamps, setSupportsTimestamps] = useState(true)
  const [timestamp, setTimestamp] = useState('before')
  const certificate = entryType === 'certificate'
  const appliesTimestampException =
    certificate && datedRevocation && supportsTimestamps && timestamp === 'before'
  const blocked = digestMatches && !appliesTimestampException

  let explanation = 'The sample does not match the stored digest.'
  if (digestMatches) {
    if (!certificate) explanation = 'A matching image digest blocks the sample.'
    else if (!datedRevocation) explanation = 'A zero revocation time makes the entry unconditional.'
    else if (!supportsTimestamps) explanation = 'The sample firmware cannot check timestamps.'
    else if (timestamp === 'at-or-after')
      explanation = 'The verified timestamp is at or after revocation.'
    else if (timestamp === 'unverified') explanation = 'The sample has no verified timestamp.'
    else explanation = 'The verified timestamp is earlier than the recorded revocation time.'
  }

  return (
    <section
      aria-label="Sample dbx record decision"
      className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      <h5 className="text-sm font-semibold text-foreground">
        Does this dbx entry block the image?
      </h5>
      <p className="text-xs text-muted-foreground">
        This worksheet models one recorded entry and takes the digest match and timestamp
        verification as inputs.
      </p>
      <FilterDropdown
        ariaLabel="dbx record type"
        items={ENTRY_TYPES}
        selectedId={entryType}
        onSelect={setEntryType}
        noContainer
        hideDefaultOption
      />
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={digestMatches}
          onChange={(event) => setDigestMatches(event.target.checked)}
        />
        {certificate ? 'Certificate contents match the digest' : 'Image matches the stored digest'}
      </label>
      {certificate && (
        <fieldset className="space-y-1 text-sm">
          <legend className="font-semibold">Certificate revocation</legend>
          <label className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={datedRevocation}
              onChange={(event) => setDatedRevocation(event.target.checked)}
            />
            The record contains a nonzero revocation time
          </label>
          <label className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={supportsTimestamps}
              onChange={(event) => setSupportsTimestamps(event.target.checked)}
            />
            Firmware supports timestamp verification
          </label>
          <FilterDropdown
            ariaLabel="Image timestamp"
            items={TIMESTAMP_OUTCOMES}
            selectedId={timestamp}
            onSelect={setTimestamp}
            disabled={!datedRevocation || !supportsTimestamps}
            noContainer
            hideDefaultOption
          />
        </fieldset>
      )}
      <div role="status" className="space-y-1 rounded border border-border p-2 text-xs">
        <p className="font-semibold">
          {blocked ? 'Blocked by this entry' : 'This entry permits further checks'}
        </p>
        <p>{explanation}</p>
        {!blocked && <p>Evaluate other dbx entries and the image’s trust against db.</p>}
      </div>
      <a
        href="https://uefi.org/specs/UEFI/2.11/32_Secure_Boot_and_Driver_Signing.html"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary underline"
      >
        UEFI 2.11 §32.4 and §32.5
      </a>
    </section>
  )
}
