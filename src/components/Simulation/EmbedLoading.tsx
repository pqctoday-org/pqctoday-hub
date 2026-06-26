// SPDX-License-Identifier: GPL-3.0-only
/**
 * EmbedLoading (PR6) — the loading affordance shown while a lazily-imported
 * in-sim tool (Learn module, activity, workshop, reference) resolves. Drives off
 * the existing Suspense fallback so the embed pane shows a spinner + shimmer
 * lines instead of popping in cold. Motion is gated by prefers-reduced-motion
 * via the .sim-fade-in utility (no animation for reduced-motion users).
 */
import { Skeleton } from '@/components/ui/skeleton'

export function EmbedLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="sim-fade-in flex flex-col items-center gap-4 p-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground">{label}…</span>
      <div className="w-full max-w-md space-y-2" aria-hidden="true">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
