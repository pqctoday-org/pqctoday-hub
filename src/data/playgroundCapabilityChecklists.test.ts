// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { PlaygroundCapabilityBanner } from '@/components/Playground/common/PlaygroundCapabilityBanner'
import {
  PLAYGROUND_CAPABILITY_CHECKLISTS,
  getPlaygroundCapabilityChecklist,
} from './playgroundCapabilityChecklists'

describe('Playground Production-Tool Capability Checklists', () => {
  const nativeTools = WORKSHOP_TOOLS.filter((t) => !t.sandbox)

  it('covers every native browser Playground tool explicitly in PLAYGROUND_CAPABILITY_CHECKLISTS with tamperVerification specs', () => {
    expect(nativeTools.length).toBeGreaterThanOrEqual(34)
    expect(Object.keys(PLAYGROUND_CAPABILITY_CHECKLISTS)).toHaveLength(35)

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

      const tv = spec.tamperVerification
      expect(tv, `Missing tamperVerification in ${tool.id}`).toBeDefined()
      expect(tv.artifactLabel.length).toBeGreaterThan(10)
      expect(tv.validVectorHex.length).toBeGreaterThanOrEqual(16)
      expect(tv.tamperedVectorHex.length).toBe(tv.validVectorHex.length)
      expect(tv.tamperedVectorHex).not.toBe(tv.validVectorHex)
      expect(tv.expectedFailureBehavior.length).toBeGreaterThan(30)
    }
  })

  it('resolves a complete PlaygroundCapabilitySpec for every tool in WORKSHOP_TOOLS (including sbx-* scenarios)', () => {
    for (const tool of WORKSHOP_TOOLS) {
      const spec = getPlaygroundCapabilityChecklist(tool.id)
      expect(spec.toolId).toBe(tool.id)
      expect(spec.whatCheckEstablishes.length).toBeGreaterThan(25)
      expect(spec.sandboxLimitation.length).toBeGreaterThan(25)
      expect(spec.productionToolRequirements).toHaveLength(3)
      expect(spec.tamperVerification.validVectorHex).not.toBe(
        spec.tamperVerification.tamperedVectorHex
      )
    }
  })

  it('toggles 1-bit tamper vector and highlights diff in PlaygroundCapabilityBanner', () => {
    render(
      React.createElement(PlaygroundCapabilityBanner, {
        toolId: 'hybrid-encrypt',
        defaultOpen: true,
      })
    )

    expect(screen.getByTestId('playground-capability-banner')).toBeDefined()
    expect(screen.getByTestId('playground-tamper-status').textContent).toContain(
      'INTACT SAMPLE VECTOR'
    )

    const toggleBtn = screen.getByTestId('playground-tamper-toggle-btn')
    fireEvent.click(toggleBtn)

    expect(screen.getByTestId('playground-tamper-status').textContent).toContain(
      'TAMPER / FAULT DETECTED'
    )
    expect(screen.getByTestId('playground-tamper-status').textContent).toContain('FIPS 203')
    expect(screen.getAllByTestId('tampered-byte-diff').length).toBeGreaterThan(0)
  })
})
