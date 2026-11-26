// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/storybook/variants'

const Switch = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  const toggle = () => onCheckedChange?.(!checked)
  return (
    // eslint-disable-next-line no-restricted-syntax
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      ref={ref}
      onClick={toggle}
      className={cn(
        `peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-ink transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted ${focusRing}`,
        className
      )}
      {...props}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-card data-[state=unchecked]:translate-x-0.5 data-[state=unchecked]:bg-ink'
        )}
      />
    </button>
  )
})
Switch.displayName = 'Switch'

export { Switch }
