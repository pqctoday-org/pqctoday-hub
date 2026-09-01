// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import type { TestStatus } from '@/wasm/kmip/corpus/runner'
import { STATUS_LABEL } from './useKmipCorpus'

export function StatusBadge({ status }: { status: TestStatus }) {
  if (status === 'PASS') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
        <CheckCircle2 size={11} /> {STATUS_LABEL[status]}
      </span>
    )
  }
  if (status === 'FAIL' || status === 'ERROR') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
        <XCircle size={11} /> {STATUS_LABEL[status]}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <MinusCircle size={11} /> {STATUS_LABEL[status]}
    </span>
  )
}
