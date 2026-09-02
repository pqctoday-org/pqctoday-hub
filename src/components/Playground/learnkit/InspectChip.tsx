// SPDX-License-Identifier: GPL-3.0-only
/**
 * InspectChip — the compact "N calls · K keys — Inspect →" status chip the
 * redesigned workshops show at the top of every Operate/Build surface in
 * place of the per-panel embedded log copies (design handoff
 * design_handoff_kmip_pkcs11_playground §3.4: ONE log, in Inspect, fed by
 * every surface). Live counts, one click to the real inspector.
 */
import { ScrollText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InspectChipProps {
  /** Number of logged calls (the caller decides whether that means "all"
   *  entries or crypto-only — pass whichever the surface's copy promises). */
  calls: number
  callsLabel?: string
  keys?: number
  keysLabel?: string
  onOpen: () => void
  className?: string
  /** Coachmark anchor. */
  tourId?: string
}

export const InspectChip = ({
  calls,
  callsLabel = 'calls',
  keys,
  keysLabel = 'keys',
  onOpen,
  className = '',
  tourId,
}: InspectChipProps) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onOpen}
    data-tour={tourId}
    className={`h-7 gap-1.5 px-2.5 font-mono text-[11px] text-muted-foreground hover:text-foreground ${className}`}
    aria-label={`${calls} ${callsLabel}${keys !== undefined ? `, ${keys} ${keysLabel}` : ''} — open Inspect`}
  >
    <ScrollText size={12} aria-hidden="true" />
    <span>
      {calls} {callsLabel}
    </span>
    {keys !== undefined && (
      <>
        <span aria-hidden="true">·</span>
        <span>
          {keys} {keysLabel}
        </span>
      </>
    )}
    <span aria-hidden="true">—</span>
    <span className="text-primary">Inspect</span>
    <ChevronRight size={12} aria-hidden="true" />
  </Button>
)
