// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { stickerCardVariants, storyRowVariants } from './variants'

type Block = 'div' | 'section' | 'article' | 'li'

export interface StickerCardProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof stickerCardVariants> {
  as?: Block
}

/** The primary container of the Storybook Blue style: ink outline, large radius, offset edge. */
export const StickerCard = React.forwardRef<HTMLElement, StickerCardProps>(
  ({ as = 'div', className, tone, padding, ...props }, ref) =>
    React.createElement(as, {
      ref,
      className: cn(stickerCardVariants({ tone, padding }), className),
      ...props,
    })
)
StickerCard.displayName = 'StickerCard'

export interface StoryRowProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof storyRowVariants> {
  as?: Block
}

/** A row inside a card (resource, step, catalogue, comment): thin border, no edge. */
export const StoryRow = React.forwardRef<HTMLElement, StoryRowProps>(
  ({ as = 'div', className, padding, tone, ...props }, ref) =>
    React.createElement(as, {
      ref,
      className: cn(storyRowVariants({ padding, tone }), className),
      ...props,
    })
)
StoryRow.displayName = 'StoryRow'
