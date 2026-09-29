// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 2 (2026-09-29): `?reqfw=<framework id>` drives the picker.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RequirementsTab } from './RequirementsTab'
import { OUT_OF_SCOPE_REASON, resolveRequirementsPick } from './requirementsModel'
import { buildObligations } from '../obligations/obligationsModel'
import { complianceFrameworks } from '@/data/complianceData'

const PROFILE = { country: 'France', industry: 'Finance & Insurance', region: 'eu' as const }
const ROWS = buildObligations(PROFILE)
const inScope = new Set(ROWS.map((r) => r.framework.id))
const OUTSIDE = complianceFrameworks.find((f) => !inScope.has(f.id))!

describe('resolveRequirementsPick', () => {
  it('defaults to the first row without an id', () => {
    expect(resolveRequirementsPick(ROWS, null, complianceFrameworks)).toEqual({
      selected: ROWS[0],
      status: 'none',
    })
  })
  it('finds an in-scope row', () => {
    const r = resolveRequirementsPick(ROWS, ROWS[1].framework.id, complianceFrameworks)
    expect(r.status).toBe('in-scope')
    expect(r.selected).toBe(ROWS[1])
  })
  it('keeps a tracked framework outside the scope', () => {
    const r = resolveRequirementsPick(ROWS, OUTSIDE.id, complianceFrameworks)
    expect(r.status).toBe('out-of-scope')
    expect(r.selected).toEqual({ framework: OUTSIDE, reason: OUT_OF_SCOPE_REASON })
  })
  it('falls back to the first row for an unknown id', () => {
    const r = resolveRequirementsPick(ROWS, 'NOPE', complianceFrameworks)
    expect(r.status).toBe('unknown')
    expect(r.selected).toBe(ROWS[0])
  })
})

describe('RequirementsTab with ?reqfw=', () => {
  const heading = () => screen.getByRole('heading', { level: 3 })

  it('opens on the linked framework', () => {
    const target = ROWS[1]
    render(
      <RequirementsTab profile={PROFILE} selectedId={target.framework.id} onSelect={vi.fn()} />
    )
    expect(heading()).toHaveTextContent(target.framework.label)
    expect(screen.queryByTestId(/deeplink-notice/)).not.toBeInTheDocument()
  })

  it('writes the pick through onSelect', () => {
    const onSelect = vi.fn()
    render(<RequirementsTab profile={PROFILE} selectedId={null} onSelect={onSelect} />)
    const nav = screen.getByRole('navigation', { name: 'Rules & Standards' })
    fireEvent.click(nav.querySelectorAll('button')[1])
    expect(onSelect).toHaveBeenCalledWith(ROWS[1].framework.id)
  })

  it('shows an out-of-scope framework, with a dismissable note', () => {
    render(<RequirementsTab profile={PROFILE} selectedId={OUTSIDE.id} onSelect={vi.fn()} />)
    expect(heading()).toHaveTextContent(OUTSIDE.label)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(OUTSIDE.label)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
    expect(heading()).toHaveTextContent(OUTSIDE.label)
  })

  it('says not-found for an unknown id, and dismissing clears it', () => {
    const onSelect = vi.fn()
    render(<RequirementsTab profile={PROFILE} selectedId="NOPE" onSelect={onSelect} />)
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('NOPE')
    expect(heading()).toHaveTextContent(ROWS[0].framework.label)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('still works uncontrolled (no URL)', () => {
    render(<RequirementsTab profile={PROFILE} />)
    const nav = screen.getByRole('navigation', { name: 'Rules & Standards' })
    fireEvent.click(nav.querySelectorAll('button')[1])
    expect(heading()).toHaveTextContent(ROWS[1].framework.label)
  })
})
