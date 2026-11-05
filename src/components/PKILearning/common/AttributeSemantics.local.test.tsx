// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AttributeTable } from './AttributeTable'
import type { X509Attribute } from './types'
const field: X509Attribute = {
  id: '2.5.29.19',
  label: 'basicConstraints',
  oid: '2.5.29.19',
  value: 'CA:FALSE',
  status: 'unknown',
  critical: true,
  enabled: true,
  placeholder: '',
  description: 'sample',
  elementType: 'Extension',
}
describe('profile presence and criticality controls', () => {
  it('leaves a critical example editable/deselectable without implying required presence', () => {
    const change = vi.fn()
    render(<AttributeTable attributes={[field]} onAttributeChange={change} />)
    expect(screen.getByLabelText('Include basicConstraints')).toBeEnabled()
    expect(screen.getByText('Presence requirement: Not established')).toBeTruthy()
    expect(screen.queryByText('Mandatory')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Criticality for basicConstraints' }))
    fireEvent.click(screen.getByRole('option', { name: 'Noncritical' }))
    expect(change).toHaveBeenCalledWith(field.id, 'critical', false)
  })
  it('keeps explicitly authored required noncritical presence separate', () => {
    render(
      <AttributeTable
        attributes={[{ ...field, status: 'mandatory', critical: false }]}
        onAttributeChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Include basicConstraints')).toBeDisabled()
    expect(screen.getByText('Presence requirement: mandatory')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Criticality for basicConstraints' })
    ).toHaveTextContent('Noncritical')
  })
  it('does not fabricate a legacy critical flag', () => {
    render(
      <AttributeTable
        attributes={[{ ...field, critical: undefined }]}
        onAttributeChange={vi.fn()}
      />
    )
    expect(
      screen.getByRole('button', { name: 'Criticality for basicConstraints' })
    ).toHaveTextContent('not established')
  })
})
