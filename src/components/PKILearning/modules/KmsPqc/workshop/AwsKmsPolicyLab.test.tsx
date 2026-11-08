// SPDX-License-Identifier: AGPL-3.0-only
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

  it('shows the ML-KEM key-establishment pattern and the reason ML_DSA_44 is left out of the solution', () => {
    render(<AwsKmsPolicyLab />)
    expect(
      screen.getByText(/Optional: ML-KEM KeySpec with ENCAPSULATE_DECAPSULATE usage found/)
    ).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/leaves out ML_DSA_44/)
    expect(document.body.textContent).toMatch(
      /kms:Decapsulate hands the shared secret to the caller in plaintext/
    )
    fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
    const after = (screen.getByLabelText(EDITOR) as HTMLTextAreaElement).value
    const v = validateKmsPqcPolicy(after)
    expect(v.allowsMlKemKeyEstablishment).toBe(true)
    expect(v.isComplete).toBe(true)
  })

  it('never teaches a TLS cipher-suite condition key', () => {
    const { container } = render(<AwsKmsPolicyLab />)
    expect(container.textContent).not.toMatch(/tlsCipherSuites|_PQ"/)
    expect(container.textContent).toMatch(/postQuantumTlsEnabled/)
  })
})

it('does not claim effective ML-DSA-only permissions after an extra unconditional grant', () => {
  render(<AwsKmsPolicyLab />)
  fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
  const editor = screen.getByLabelText(EDITOR) as HTMLTextAreaElement
  const policy = JSON.parse(editor.value)
  policy.Statement.push({ Effect: 'Allow', Action: 'kms:CreateKey', Resource: '*' })
  fireEvent.change(editor, { target: { value: JSON.stringify(policy) } })
  expect(screen.getByText('Sample patterns found')).toBeInTheDocument()
  expect(
    screen.getByText(/An additional Allow statement could permit other key creation/)
  ).toBeInTheDocument()
  expect(screen.queryByText('New signing keys will be ML-DSA')).not.toBeInTheDocument()
})
