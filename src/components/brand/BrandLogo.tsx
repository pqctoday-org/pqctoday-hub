// SPDX-License-Identifier: AGPL-3.0-only
import emblemLightUrl from '@/assets/brand-emblem.png'
import emblemDarkUrl from '@/assets/brand-emblem-dark.png'
import { cn } from '../../lib/utils'

/** Full logo (globe, "PQC Today", tagline) for light mode: served from public/ for the pages that show it large. */
export const FULL_LOGO_SRC = '/brand/logo-full.png'
/** The same logo for dark mode: the brand's dark navy logo. */
export const FULL_LOGO_DARK_SRC = '/brand/logo-full-dark.png'

export interface BrandLogoProps {
  /** `full`: globe, wordmark and tagline. `emblem`: the globe only, no lettering. */
  variant?: 'full' | 'emblem'
  /** Edge length in px (the logo is square). */
  size?: number
  /** Empty alt for a decorative copy that sits beside the words "PQC Today". */
  decorative?: boolean
  className?: string
}

/**
 * The brand logo on its own rounded tile. Light mode shows the Storybook Blue light logo on the pale
 * brand ground; dark mode shows the brand's dark logo on its own navy ground. Both images are in the
 * page and the theme class (`.dark`, set by useTheme from the visitor's choice or the device) picks
 * one in CSS (`.brand-logo-*` in index.css), so an explicit theme choice switches the logo too, the
 * box never changes size, and no script runs. Lazy loading keeps the hidden copy from downloading.
 */
export function BrandLogo({
  variant = 'emblem',
  size = 32,
  decorative = false,
  className,
}: BrandLogoProps) {
  const light = variant === 'full' ? FULL_LOGO_SRC : emblemLightUrl
  const dark = variant === 'full' ? FULL_LOGO_DARK_SRC : emblemDarkUrl
  // The wrapper carries the accessible name once; both pictures are hidden from assistive
  // technology, so the name is the same in light and dark and is never announced twice.
  const common = {
    'aria-hidden': true as const,
    width: size,
    height: size,
    loading: 'lazy' as const,
    draggable: false,
  }
  return (
    <span
      className={cn(
        'brand-logo inline-flex shrink-0 overflow-hidden rounded-xl bg-logo-tile',
        className
      )}
      style={{ width: size, height: size }}
      data-brand-logo={variant}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'PQC Today' })}
    >
      <img
        src={light}
        alt=""
        {...common}
        className="brand-logo-light h-full w-full object-contain"
        data-theme-logo="light"
      />
      <img
        src={dark}
        alt=""
        {...common}
        className="brand-logo-dark h-full w-full object-contain"
        data-theme-logo="dark"
      />
    </span>
  )
}
