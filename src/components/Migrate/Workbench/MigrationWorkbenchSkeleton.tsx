// SPDX-License-Identifier: GPL-3.0-only
//
// First-paint skeleton for /migrate. Same reasoning as LibraryViewSkeleton:
// MigrationWorkbench is a lazy route chunk, so the skeleton has to live in an
// eagerly-imported file to cover the download window (WS18 defect class 7).
import { Skeleton } from '@/components/ui/skeleton'

export function MigrationWorkbenchSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading the PQC Migration Workbench"
      className="animate-fade-in space-y-4 pb-24"
    >
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Posture command center */}
      <Skeleton className="h-32 w-full" />

      {/* Tab row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>

      {/* Product / domain cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading the PQC Migration Workbench…</span>
    </div>
  )
}
