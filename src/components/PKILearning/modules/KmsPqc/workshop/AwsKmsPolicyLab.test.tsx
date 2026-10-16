// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AwsKmsPolicyLab } from './AwsKmsPolicyLab'
import { validateKmsPqcPolicy } from '../utils/kmsPolicyEngine'

const EDITOR = 'key-admin-iam-policy.json editor'

describe('AwsKmsPolicyLab', () => {
  it('starts with valid JSON and the solution snippet completes the task', () => {
    render(<AwsKmsPolicyLab />)
    const editor = screen.getByLabelText(EDITOR) as HTMLTextAreaElement
    expect(validateKmsPqcPolicy(editor.value).isValidJson).toBe(true)
    expect(validateKmsPqcPolicy(editor.value).isComplete).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
    const after = (screen.getByLabelText(EDITOR) as HTMLTextAreaElement).value
    const v = validateKmsPqcPolicy(after)
    expect(v.isValidJson).toBe(true)
    expect(v.isComplete).toBe(true)
  })

  it('never teaches a TLS cipher-suite condition key', () => {
    const { container } = render(<AwsKmsPolicyLab />)
    expect(container.textContent).not.toMatch(/tlsCipherSuites|_PQ"/)
    expect(container.textContent).toMatch(/postQuantumTlsEnabled/)
  })
})
