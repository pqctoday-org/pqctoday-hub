// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/** One optional line beside the path for a reader new to ML-KEM and ML-DSA. */
export function NewToPqcNote({ className }: { className?: string }) {
  const link = 'font-medium text-primary underline underline-offset-2'
  return (
    <p data-testid="new-to-pqc-note" className={cn('text-xs text-muted-foreground', className)}>
      If ML-KEM and ML-DSA are new to you,{' '}
      <Link to="/learn/pqc-101" className={link}>
        PQC 101
      </Link>{' '}
      and the{' '}
      <Link to="/algorithms" className={link}>
        Algorithms page
      </Link>{' '}
      are optional background.
    </p>
  )
}
