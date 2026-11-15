// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { PlaygroundCapabilityBanner } from '@/components/Playground/common/PlaygroundCapabilityBanner'
import {
  PLAYGROUND_CAPABILITY_CHECKLISTS,
  getPlaygroundCapabilityChecklist,
} from './playgroundCapabilityChecklists'

describe('Playground production-tool capability checklists', () => {
  const nativeTools = WORKSHOP_TOOLS.filter((t) => !t.sandbox)

  it('covers every native browser Playground tool explicitly', () => {
    expect(nativeTools.length).toBeGreaterThan(0)

    for (const tool of nativeTools) {
      const spec = PLAYGROUND_CAPABILITY_CHECKLISTS[tool.id]
      expect(
        spec,
        `Missing explicit capability checklist for playground tool "${tool.id}"`
      ).toBeDefined()
      expect(spec.toolId).toBe(tool.id)
      expect(spec.whatCheckEstablishes.length).toBeGreaterThan(30)
      expect(spec.sandboxLimitation.length).toBeGreaterThan(30)
      expect(spec.productionToolRequirements).toHaveLength(3)
      for (const req of spec.productionToolRequirements) {
        expect(req.length).toBeGreaterThan(25)
      }
    }
  })

  it('has no checklist key that is not a Playground tool', () => {
    const registryIds = new Set(WORKSHOP_TOOLS.map((t) => t.id))
    for (const id of Object.keys(PLAYGROUND_CAPABILITY_CHECKLISTS)) {
      expect(registryIds.has(id), `Orphan playground checklist key: ${id}`).toBe(true)
    }
  })

  it('resolves a complete spec for every tool in WORKSHOP_TOOLS (including sbx-* scenarios)', () => {
    for (const tool of WORKSHOP_TOOLS) {
      const spec = getPlaygroundCapabilityChecklist(tool.id)
      expect(spec.toolId).toBe(tool.id)
      expect(spec.whatCheckEstablishes.length).toBeGreaterThan(25)
      expect(spec.sandboxLimitation.length).toBeGreaterThan(25)
      expect(spec.productionToolRequirements).toHaveLength(3)
    }
  })

  it('renders collapsed by default and lists the requirements when opened', () => {
    const { unmount } = render(
      React.createElement(PlaygroundCapabilityBanner, { toolId: 'hybrid-encrypt' })
    )
    expect((screen.getByTestId('playground-capability-banner') as HTMLDetailsElement).open).toBe(
      false
    )
    unmount()

    render(
      React.createElement(PlaygroundCapabilityBanner, {
        toolId: 'hybrid-encrypt',
        defaultOpen: true,
      })
    )
    const banner = screen.getByTestId('playground-capability-banner') as HTMLDetailsElement
    expect(banner.open).toBe(true)
    const spec = getPlaygroundCapabilityChecklist('hybrid-encrypt')
    expect(screen.getAllByRole('listitem')).toHaveLength(spec.productionToolRequirements.length)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
