// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { HistoryPanel } from './HistoryPanel'
import { cn } from '@/lib/utils'

/**
 * The belt score and next belt, the role's journey phases and milestones, recent events and
 * achievement badges. This is what the drawer's old Journey tab held; the drawer has no tabs now,
 * so it is re-homed as a strip.
 *
 * SEAM FOR THE LEARN LANE. Nothing renders this yet: Learn › Your journey places it at the top of
 * Role map. It uses the existing components unchanged, so nothing about the belt, phases or
 * events is lost. It needs no props.
 */
export const JourneyProgressStrip: React.FC<{ className?: string }> = ({ className }) => (
  <section aria-label="Your progress" className={cn('flex flex-col', className)}>
    <HistoryPanel />
  </section>
)
