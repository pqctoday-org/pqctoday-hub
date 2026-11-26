// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import { cn } from '../../lib/utils'
import { focusRing } from '../storybook/variants'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const errorId = error ? `${props.id ?? props.name ?? 'input'}-error` : undefined
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            `flex h-11 md:h-10 w-full rounded-full border-2 bg-card px-4 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
            error ? 'border-destructive' : 'border-ink',
            className
          )}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-xs text-status-error"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
