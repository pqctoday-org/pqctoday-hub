// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'

/**
 * The three button roles of the UX grammar (handoff 2.2). A role is a look and a rule:
 *   - primary:   filled teal, at most one per area
 *   - secondary: outline, the default
 *   - quiet:     text only, for low-emphasis actions
 * Each is a pill with a 2 px ink outline, 44 px high (36 px in dense tables), and its label wraps.
 */
export type ButtonRole = 'primary' | 'secondary' | 'quiet'

/** Role to the existing Button variant. Secondary is the existing outline variant. */
export const ROLE_VARIANT = {
  primary: 'primary',
  secondary: 'outline',
  quiet: 'quiet',
} as const satisfies Record<ButtonRole, NonNullable<ButtonProps['variant']>>

export interface RoleButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  /** Defaults to secondary. */
  emphasis?: ButtonRole
  /** 36 px instead of 44 px, for dense tables. */
  dense?: boolean
}

/** The one button of the grammar: the existing Button, set to a role. Defaults to type="button". */
export const RoleButton = React.forwardRef<HTMLButtonElement, RoleButtonProps>(
  ({ emphasis = 'secondary', dense = false, type = 'button', ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      variant={ROLE_VARIANT[emphasis]}
      size={dense ? 'dense' : 'role'}
      {...props}
    />
  )
)
RoleButton.displayName = 'RoleButton'
