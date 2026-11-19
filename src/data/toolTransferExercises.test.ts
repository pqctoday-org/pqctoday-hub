// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { TOOL_TRANSFER_EXERCISES } from './toolTransferExercises'

it('matches each operational decision to a registered tool and provides distinct answers', () => {
  const routes = new Set([
    ...BUSINESS_TOOLS.map(({ id }) => `business/${id}`),
    ...WORKSHOP_TOOLS.map(({ id }) => `playground/${id}`),
  ])
  for (const [route, exercise] of Object.entries(TOOL_TRANSFER_EXERCISES)) {
    expect(routes, route).toContain(route)
    expect(exercise, route).toBeDefined()
    if (!exercise) continue
    expect(new Set(exercise.options).size, route).toBe(exercise.options.length)
    expect(exercise.options.at(exercise.answer), route).toBeTruthy()
    expect(exercise.answer, route).toBeGreaterThanOrEqual(0)
    expect(exercise.why.length, route).toBeGreaterThan(60)
  }
})
