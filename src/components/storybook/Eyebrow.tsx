// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import { cn } from '../../lib/utils'
import { eyebrowClass, eyebrowPillClass } from './variants'

export interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div'
}

/** Eyebrow label ("SECTION 4 OF 4", "FROM THE HUB", group headings). */
export function Eyebrow({ as = 'p', className, ...props }: EyebrowProps) {
  return React.createElement(as, { className: cn(eyebrowClass, className), ...props })
}

/** Eyebrow pill: the eyebrow label on the ribbon colour with an ink outline. */
export function EyebrowPill({ as = 'span', className, ...props }: EyebrowProps) {
  return React.createElement(as, { className: cn(eyebrowPillClass, className), ...props })
}
