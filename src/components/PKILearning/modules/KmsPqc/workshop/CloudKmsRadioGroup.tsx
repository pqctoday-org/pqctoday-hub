// SPDX-License-Identifier: AGPL-3.0-only
import { useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RadioOption<T extends string> {
  value: T
  label: string
  /** Extra line under the label, e.g. the provider's enum name. */
  hint?: string
  disabled?: boolean
}

interface RadioGroupProps<T extends string> {
  legend: string
  value: T
  options: readonly RadioOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}

/**
 * Native radio inputs drawn as pills. Using real radios keeps the arrow-key
 * behaviour, the group name and the checked state for assistive technology;
 * the check mark makes the selection visible without relying on colour.
 */
export function CloudKmsRadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  disabled = false,
}: RadioGroupProps<T>) {
  const name = useId()
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const checked = o.value === value
          return (
            <label
              key={o.value}
              className={cn(
                'flex min-h-[44px] max-w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                'focus-within:ring-2 focus-within:ring-primary',
                checked
                  ? 'border-primary bg-primary/10 font-semibold text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
                (disabled || o.disabled) && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                disabled={disabled || o.disabled}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <Check
                size={14}
                aria-hidden="true"
                className={cn('shrink-0', checked ? 'text-primary' : 'invisible')}
              />
              <span className="min-w-0 break-words">
                {o.label}
                {o.hint && (
                  <span className="block break-all font-mono text-[11px] font-normal text-muted-foreground">
                    {o.hint}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
