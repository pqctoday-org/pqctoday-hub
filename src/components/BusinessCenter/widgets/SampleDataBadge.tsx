// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tiny "sample" badge surfaced next to data points (cert numbers, firmware
 * revisions, HSM products) that come from the illustrative educational
 * snapshot in `cryptoLibraries.ts` / `hsmVendors.ts`. Prevents users from
 * quoting these as live values without verification against authoritative
 * sources.
 */
import { FlaskConical } from 'lucide-react'

const CMVP_URL = 'https://csrc.nist.gov/projects/cryptographic-module-validation-program'

export interface SampleDataBadgeProps {
  /** Optional href the user goes to to verify the live value. Defaults to CMVP. */
  href?: string
  /** Tooltip override. */
  tooltip?: string
  /** Label override. Defaults to "sample". */
  label?: string
}

export function SampleDataBadge({
  href = CMVP_URL,
  tooltip = 'Illustrative sample for teaching. Verify against the live CMVP database before quoting.',
  label = 'sample',
}: SampleDataBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      className="inline-flex items-center gap-1 rounded px-1 py-0 text-[9px] font-semibold uppercase tracking-wider bg-status-warning/15 text-status-warning border border-status-warning/30 hover:bg-status-warning/25 align-middle"
    >
      <FlaskConical size={9} aria-hidden />
      {label}
    </a>
  )
}
