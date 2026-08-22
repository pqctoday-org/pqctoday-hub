// SPDX-License-Identifier: GPL-3.0-only
//
// First-paint skeleton for /library. Deliberately lives OUTSIDE
// LibraryViewRedesign.tsx: the view is a lazy route chunk, so a skeleton
// defined inside it could not render until the very chunk it is meant to
// cover has already downloaded. This file is imported eagerly by App.tsx and
// used as the route's Suspense fallback, which is the window a visitor on a
// slow connection actually spends waiting (WS18 defect class 7).
import { Skeleton } from '@/components/ui/skeleton'

export function LibraryViewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading the PQC Library"
      className="animate-fade-in space-y-4 pb-24"
    >
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Recently changed strip */}
      <Skeleton className="h-20 w-full" />

      {/* Purpose doors */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Facet rail */}
        <div className="hidden w-64 shrink-0 space-y-3 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        {/* Control deck + document cards */}
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading the PQC Library…</span>
    </div>
  )
}
