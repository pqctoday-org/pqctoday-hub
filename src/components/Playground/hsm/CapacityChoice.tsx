// SPDX-License-Identifier: AGPL-3.0-only
import type { ComponentProps } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'

/** Stack the label above the value so phone-width controls do not truncate N+1. */
export function CapacityChoice({
  label,
  ...props
}: Omit<ComponentProps<typeof FilterDropdown>, 'label' | 'ariaLabel'> & { label: string }) {
  return (
    <div className="min-w-0 text-sm space-y-1">
      <span className="block">{label}</span>
      <FilterDropdown {...props} ariaLabel={label} noContainer />
    </div>
  )
}
