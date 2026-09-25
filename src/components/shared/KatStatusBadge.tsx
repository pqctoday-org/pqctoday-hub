// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle, MinusCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import type { KatStatus } from '@/utils/katRunner'

/**
 * Status pill for a katRunner result. 'skip' (not tested: the engine does not
 * advertise a mechanism the case needs) has its own warning styling — it is
 * never shown as, or counted as, a pass.
 */
export const KatStatusBadge = ({ status }: { status: KatStatus }) => (
  <span
    data-testid="kat-status"
    data-status={status}
    className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold',
      status === 'pass'
        ? 'bg-status-success/10 text-status-success'
        : status === 'skip'
          ? 'bg-status-warning/10 text-status-warning'
          : 'bg-status-error/10 text-status-error'
    )}
  >
    {status === 'pass' ? (
      <CheckCircle size={10} aria-hidden="true" />
    ) : status === 'skip' ? (
      <MinusCircle size={10} aria-hidden="true" />
    ) : (
      <XCircle size={10} aria-hidden="true" />
    )}
    {status === 'skip' ? 'not tested' : status}
  </span>
)
