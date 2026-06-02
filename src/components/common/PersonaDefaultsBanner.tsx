// SPDX-License-Identifier: GPL-3.0-only
/**
 * PersonaDefaultsBanner — the matched/show-all banner used across pages
 * that apply persona-aware default filters (Library, Migrate, Threats,
 * Timeline, etc.).
 *
 * Renders the canonical sentence:
 *   "Showing N {noun} matched to your role · See all M"
 *
 * Render only when persona narrowing is currently active (i.e. the user
 * has a persona set with a preferred subset, has not picked an explicit
 * filter, and has not opted out via `?prefs=off`). Each call site is
 * responsible for that conditional — the banner itself is presentational.
 *
 * Pair with `usePersonaDefaults()` from `@/hooks/usePersonaDefaults` for
 * the `?prefs=off` URL state and the persona-change reset.
 */
import { Button } from '@/components/ui/button'

export interface PersonaDefaultsBannerProps {
  matchedCount: number
  totalCount: number
  /** Singular noun for the items being filtered (e.g. "document",
   *  "product", "threat", "country"). The banner handles pluralization. */
  noun: string
  /** Callback to reset to the full set. Use the `resetToFullSet`
   *  return from `usePersonaDefaults()`. */
  onReset: () => void
  /** Optional className to extend the wrapper styles. */
  className?: string
  /** Optional persona display name (e.g. "Architect", "Executive"). When
   *  provided, the banner names the persona explicitly so the user can
   *  tell which role is currently narrowing the view. */
  personaName?: string
  /** Optional count of recently-added items (status='New' in the loader
   *  diff) that are hidden by the persona narrowing. When > 0, the banner
   *  uses a warning-style call-out so freshly added content doesn't get
   *  silently buried behind the persona default. */
  newHiddenCount?: number
}

export function PersonaDefaultsBanner({
  matchedCount,
  totalCount,
  noun,
  onReset,
  className = '',
  personaName,
  newHiddenCount = 0,
}: PersonaDefaultsBannerProps) {
  const matchedPluralized = matchedCount !== 1 ? `${noun}s` : noun
  const newPluralized = newHiddenCount !== 1 ? `${noun}s` : noun
  const hiddenCount = Math.max(totalCount - matchedCount, 0)
  const roleLabel = personaName ? `your ${personaName} role` : 'your role'
  const wrapperClass =
    newHiddenCount > 0
      ? `glass-panel inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-md text-xs border border-status-warning/30 bg-status-warning/5 ${className}`.trim()
      : `glass-panel inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-md text-xs ${className}`.trim()
  return (
    <div role="status" aria-live="polite" className={wrapperClass}>
      {newHiddenCount > 0 ? (
        <span className="text-status-warning font-medium">
          {newHiddenCount} newly added {newPluralized} hidden by {roleLabel}
        </span>
      ) : (
        <span className="text-muted-foreground">
          Showing {matchedCount} {matchedPluralized} matched to {roleLabel}
          {hiddenCount > 0 && (
            <>
              {' '}
              <span className="text-muted-foreground/80">({hiddenCount} hidden)</span>
            </>
          )}
        </span>
      )}
      <span className="text-muted-foreground/60">·</span>
      <Button variant="link" onClick={onReset} className="text-xs h-auto p-0">
        Show all {totalCount}
      </Button>
    </div>
  )
}
