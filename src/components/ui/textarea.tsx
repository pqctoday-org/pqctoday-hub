// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import { cn } from '../../lib/utils'
import { focusRing } from '../storybook/variants'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          `flex w-full rounded-2xl border-2 border-ink bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 resize-none ${focusRing}`,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
