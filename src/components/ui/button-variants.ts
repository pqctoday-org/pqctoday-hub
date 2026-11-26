// SPDX-License-Identifier: AGPL-3.0-only
import { cva } from 'class-variance-authority'
import { focusRing } from '../storybook/variants'

export const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${focusRing}`,
  {
    variants: {
      variant: {
        // Storybook Blue: pill buttons with an ink outline. The primary carries the flat
        // offset edge; the others do not. Phone height is at least 44px.
        default:
          'rounded-full font-bold border-2 border-ink bg-primary text-primary-foreground shadow-[0_4px_0_hsl(var(--edge))] hover:bg-primary/90 active:translate-y-[3px] active:shadow-none max-md:min-h-[44px] [&.h-auto]:rounded-2xl [&.h-auto]:whitespace-normal',
        destructive:
          'rounded-full font-bold border-2 border-ink bg-destructive text-destructive-foreground hover:bg-destructive/90 max-md:min-h-[44px] [&.h-auto]:rounded-2xl [&.h-auto]:whitespace-normal',
        outline:
          'rounded-full font-bold border-2 border-ink bg-card text-card-foreground hover:bg-muted max-md:min-h-[44px] [&.h-auto]:rounded-2xl [&.h-auto]:whitespace-normal',
        // a11y (WS9, 2026-08-02): this paired `bg-secondary` with `text-foreground`
        // — near-white on light lavender in dark mode, 2.63:1, well under the
        // 4.5:1 WCAG AA floor. Secondary buttons now take the chip fill, whose
        // paired foreground token is measured against it.
        secondary:
          'rounded-full font-bold border-2 border-ink bg-chip text-chip-foreground hover:bg-chip/90 max-md:min-h-[44px] [&.h-auto]:rounded-2xl [&.h-auto]:whitespace-normal',
        ghost: 'rounded-lg hover:bg-muted/20 hover:text-foreground',
        link: 'rounded-lg text-primary underline-offset-4 hover:underline',
        // Kept as a name for the many call sites that ask for the call-to-action look;
        // it is the primary button (no gradient).
        gradient:
          'rounded-full font-bold border-2 border-ink bg-primary text-primary-foreground shadow-[0_4px_0_hsl(var(--edge))] hover:bg-primary/90 active:translate-y-[3px] active:shadow-none max-md:min-h-[44px] [&.h-auto]:rounded-2xl [&.h-auto]:whitespace-normal',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-10 px-3',
        lg: 'h-11 px-8',
        icon: 'h-11 w-11 touch-manipulation',
        tile: 'h-auto min-h-[88px] w-full px-4 py-3 flex-col items-start justify-start text-left whitespace-normal gap-1 rounded-2xl!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
