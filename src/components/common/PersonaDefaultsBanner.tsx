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
}

export function PersonaDefaultsBanner({
  matchedCount,
  totalCount,
  noun,
  onReset,
  className = '',
}: PersonaDefaultsBannerProps) {
  const pluralizedNoun = matchedCount !== 1 ? `${noun}s` : noun
  return (
    <div
      role="status"
      aria-live="polite"
      className={`glass-panel inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-md text-xs ${className}`.trim()}
    >
      <span className="text-muted-foreground">
        Showing {matchedCount} {pluralizedNoun} matched to your role
      </span>
      <span className="text-muted-foreground/60">·</span>
      <Button variant="link" onClick={onReset} className="text-xs h-auto p-0">
        See all {totalCount}
      </Button>
    </div>
  )
}
