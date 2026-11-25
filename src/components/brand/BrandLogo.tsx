// SPDX-License-Identifier: AGPL-3.0-only
import emblemUrl from '@/assets/brand-emblem.png'
import { cn } from '../../lib/utils'

/** Full logo (globe, "PQC Today", tagline): served from public/ for the pages that show it large. */
export const FULL_LOGO_SRC = '/brand/logo-full.png'

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
 * The brand's Storybook Blue logo on its own pale rounded tile. The tile is the brand ground in both
 * modes, so in dark mode the light-background logo keeps its own pale ground (brand rule) instead of
 * sitting directly on the dark page.
 */
export function BrandLogo({
  variant = 'emblem',
  size = 32,
  decorative = false,
  className,
}: BrandLogoProps) {
  const src = variant === 'full' ? FULL_LOGO_SRC : emblemUrl
  return (
    <span
      className={cn('inline-flex shrink-0 overflow-hidden rounded-xl bg-logo-tile', className)}
      style={{ width: size, height: size }}
      data-brand-logo={variant}
    >
      <img
        src={src}
        alt={decorative ? '' : 'PQC Today'}
        aria-hidden={decorative ? true : undefined}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  )
}
