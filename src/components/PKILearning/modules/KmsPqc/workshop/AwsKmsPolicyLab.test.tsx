// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AwsKmsPolicyLab } from './AwsKmsPolicyLab'
import { validateKmsPqcPolicy } from '../utils/kmsPolicyEngine'

describe('AwsKmsPolicyLab', () => {
  it('starts with valid JSON and the solution snippet makes it fully secure', () => {
    render(<AwsKmsPolicyLab />)
    const editor = screen.getByLabelText('key-policy.json editor') as HTMLTextAreaElement
    expect(validateKmsPqcPolicy(editor.value).isValidJson).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
    const after = (screen.getByLabelText('key-policy.json editor') as HTMLTextAreaElement).value
    const v = validateKmsPqcPolicy(after)
    expect(v.isValidJson).toBe(true)
    expect(v.isFullySecure).toBe(true)
  })
})
