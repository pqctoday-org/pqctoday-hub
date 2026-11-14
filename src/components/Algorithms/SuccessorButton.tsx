// SPDX-License-Identifier: AGPL-3.0-only
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProtocolMatrixRow } from '@/data/pqcProtocolMatrix'

/**
 * The dead end and its way out: "no PQC path → <successor>". Without it a row
 * of four `na` cells reads as "not applicable" rather than "no PQC path exists,
 * go here instead". `onOpen` must open the successor the same way a row click
 * does, so the address bar follows (?protocol=<id>).
 */
export function SuccessorButton({
  from,
  successor,
  onOpen,
}: {
  from: ProtocolMatrixRow
  successor: ProtocolMatrixRow
  onOpen: (row: ProtocolMatrixRow) => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onOpen(successor)}
      className="inline-flex h-auto w-fit items-center gap-1 rounded-md border border-status-warning/40 bg-status-warning/10 px-1.5 py-0 text-[10px] font-medium text-status-warning hover:bg-status-warning/20 hover:text-status-warning"
      title={`${from.name} has no post-quantum path of its own. ${successor.name} is where the migration goes — open it.`}
    >
      <ArrowRight size={9} />
      no PQC path → {successor.name}
    </Button>
  )
}
