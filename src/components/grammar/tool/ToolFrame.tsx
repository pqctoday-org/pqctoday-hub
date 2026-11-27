// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The shared tool frame (UX grammar v2.1, section 7.1): one layout component with named slots
 * T1 to T12 (plus B, the notice line, and S, the seeded-from line). Each archetype selects the
 * slots it uses (sections 7.2 and 7.3). The frame decides the order; a tool fills the slots.
 *
 * Phone: setup collapses to one row and the next operation (or Save) is pinned at the bottom;
 * the PKCS#11 panel (T9) opens as a bottom sheet. Those behaviours are the tool lanes' to
 * add inside their slot content; the frame stacks the slots in one column below 1024 px.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

/** The slots, in the order they are drawn. */
export const TOOL_SLOTS = [
  'T1',
  'B',
  'S',
  'T2',
  'T3',
  'T4',
  'T5',
  'T6',
  'T7',
  'T8',
  'T9',
  'T10',
  'T11',
  'T12',
] as const
export type ToolSlot = (typeof TOOL_SLOTS)[number]

export type PlaygroundArchetype =
  | 'cryptoLab'
  | 'guidedFlow'
  | 'protocolSimulator'
  | 'randomnessAnalyser'
  | 'calculator'
  | 'fullPlayground'
  | 'sandboxScenario'

export type BusinessArchetype =
  | 'scenarioModel'
  | 'register'
  | 'matrix'
  | 'checklist'
  | 'guidedPlanner'
  | 'documentDrafter'
  | 'timeline'
  | 'scorecard'

export type ToolArchetype = PlaygroundArchetype | BusinessArchetype

const range = (...parts: ToolSlot[]) => parts
/** T1-T3, T5-T12 (crypto lab and guided flow). */
const CRYPTO_LAB = range('T1', 'T2', 'T3', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12')

/**
 * The slots each archetype uses (7.2 for the Playground, 7.1's Business column for Business).
 * B and S are Business only, except B on sandbox pages. T8 is Checks everywhere; the Business
 * export bar is T12.
 */
export const ARCHETYPE_SLOTS: Record<ToolArchetype, readonly ToolSlot[]> = {
  cryptoLab: CRYPTO_LAB,
  guidedFlow: CRYPTO_LAB,
  protocolSimulator: range('T1', 'T2', 'T4', 'T5', 'T6', 'T7', 'T9', 'T10', 'T11', 'T12'),
  randomnessAnalyser: range('T1', 'T2', 'T5', 'T6', 'T7', 'T8', 'T10', 'T11', 'T12'),
  calculator: range('T1', 'T2', 'T5', 'T7', 'T10', 'T11', 'T12'),
  fullPlayground: range('T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T9', 'T11', 'T12'),
  sandboxScenario: range('T1', 'B', 'T2', 'T11'),
  scenarioModel: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  register: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  matrix: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  checklist: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  guidedPlanner: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  documentDrafter: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  timeline: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
  scorecard: range('T1', 'B', 'S', 'T2', 'T4', 'T5', 'T6', 'T7', 'T10', 'T11', 'T12'),
}

/** Slots that are only drawn when filled; every other used slot is expected (the dev check names the missing ones). */
export type ToolFrameSlots = Partial<Record<ToolSlot, React.ReactNode>>

export interface ToolFrameProps {
  archetype: ToolArchetype
  /**
   * The content of each slot, keyed by slot id: `slots={{ T1: <ToolHeader/>, T5: <Setup/> }}`.
   * A slot the archetype does not use fails in development.
   */
  slots: ToolFrameSlots
  className?: string
}

/** Slots of the archetype that are filled; slots filled but not in the archetype. */
export function checkSlots(
  archetype: ToolArchetype,
  slots: ToolFrameSlots
): { unused: ToolSlot[]; empty: ToolSlot[] } {
  const allowed = ARCHETYPE_SLOTS[archetype]
  const filled = TOOL_SLOTS.filter((s) => slots[s] !== undefined && slots[s] !== null)
  return {
    unused: filled.filter((s) => !allowed.includes(s)),
    empty: allowed.filter((s) => !filled.includes(s)),
  }
}

const slot = (id: ToolSlot, node: React.ReactNode, className?: string) =>
  node === undefined || node === null ? null : (
    <div key={id} data-tool-slot={id} className={className}>
      {node}
    </div>
  )

export function ToolFrame({ archetype, slots, className }: ToolFrameProps) {
  const { unused } = checkSlots(archetype, slots)
  if (unused.length > 0 && import.meta.env.DEV)
    throw new Error(`Slots ${unused.join(', ')} are not used by the "${archetype}" archetype`)
  const main: ToolSlot[] = ['T5', 'T6', 'T7', 'T8', 'T10', 'T11', 'T12']
  return (
    <div data-tool-frame={archetype} className={cn('flex flex-col gap-4', className)}>
      {(['T1', 'B', 'S', 'T2', 'T3', 'T4'] as const).map((id) => slot(id, slots[id]))}
      <div
        className={cn(
          'grid grid-cols-1 gap-4',
          slots.T9 && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]'
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">{main.map((id) => slot(id, slots[id]))}</div>
        {slot('T9', slots.T9, 'min-w-0')}
      </div>
    </div>
  )
}
