// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable no-restricted-syntax -- these are the Storybook Blue button primitives: the styled replacement for ui/button.tsx's variants, so they render the raw <button> themselves */
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { storyButtonVariants } from './variants'

export interface StoryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof storyButtonVariants> {}

/** Primary, secondary and quiet buttons of the Storybook Blue style. Defaults to type="button". */
export const StoryButton = React.forwardRef<HTMLButtonElement, StoryButtonProps>(
  ({ className, variant, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(storyButtonVariants({ variant }), className)}
      {...props}
    />
  )
)
StoryButton.displayName = 'StoryButton'
