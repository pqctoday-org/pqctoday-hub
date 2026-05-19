// SPDX-License-Identifier: GPL-3.0-only
/**
 * Disclaimer noting that the five Crypto Posture Management pillar tags
 * (inventory, governance, lifecycle, observability, assurance) are an
 * application-specific framing layered over NIST CSWP 39, not vocabulary
 * from the paper itself.
 *
 * Render once per pillar-displaying view at the FOOTER of the pillar block,
 * not next to every pillar chip.
 */
import { Info } from 'lucide-react'

export function PillarDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] text-muted-foreground italic flex items-start gap-1.5 ${className}`}>
      <Info size={11} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        Pillar tags reflect the PQC Today Hub&apos;s Crypto Posture Management framework, not NIST
        CSWP 39 terminology.
      </span>
    </p>
  )
}
