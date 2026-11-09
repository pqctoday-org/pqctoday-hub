// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AwsKmsPolicyLab } from './AwsKmsPolicyLab'
import { validateKmsPqcPolicy } from '../utils/kmsPolicyEngine'

const EDITOR = 'key-admin-iam-policy.json editor'

describe('AwsKmsPolicyLab', () => {
  it('starts incomplete and the inserted solution snippet passes the signing-only check', () => {
    render(<AwsKmsPolicyLab />)
    const editor = screen.getByLabelText(EDITOR) as HTMLTextAreaElement
    expect(validateKmsPqcPolicy(editor.value).isValidJson).toBe(true)
    expect(validateKmsPqcPolicy(editor.value).isComplete).toBe(false)
    expect(screen.queryByText('Sample constraints satisfied')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
    const after = (screen.getByLabelText(EDITOR) as HTMLTextAreaElement).value
    const v = validateKmsPqcPolicy(after)
    expect(v.isValidJson).toBe(true)
    expect(v.isSupportedSubset).toBe(true)
    expect(v.restrictsKeySpecToMlDsa).toBe(true)
    expect(v.requiresSignVerify).toBe(true)
    expect(v.isComplete).toBe(true)
    expect(v.allowsMlKemKeyEstablishment).toBe(false)
    expect(screen.getByText('Sample constraints satisfied')).toBeInTheDocument()
    expect(screen.queryByText('Incomplete sample check')).not.toBeInTheDocument()
  })

  it('offers the ML-KEM pattern as a separate optional snippet and says why it stops completion', () => {
    render(<AwsKmsPolicyLab />)
    expect(screen.getByText(/One optional ML-KEM creation pattern detected/)).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/leaves out ML_DSA_44/)
    expect(document.body.textContent).toMatch(
      /kms:Decapsulate hands the shared secret to the caller in plaintext/
    )
    fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
    fireEvent.click(screen.getByRole('button', { name: 'Insert optional ML-KEM snippet' }))
    const after = (screen.getByLabelText(EDITOR) as HTMLTextAreaElement).value
    const v = validateKmsPqcPolicy(after)
    expect(v.isValidJson).toBe(true)
    expect(v.allowsMlKemKeyEstablishment).toBe(true)
    expect(v.isComplete).toBe(false)
    expect(screen.getByText('Incomplete sample check')).toBeInTheDocument()
    expect(screen.getByText(/Statement 3: restrict.*kms:KeySpec/)).toBeInTheDocument()
  })

  it('the optional ML-KEM snippet alone is recognised as the optional pattern', () => {
    render(<AwsKmsPolicyLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Insert optional ML-KEM snippet' }))
    const v = validateKmsPqcPolicy((screen.getByLabelText(EDITOR) as HTMLTextAreaElement).value)
    expect(v.isSupportedSubset).toBe(true)
    expect(v.allowsMlKemKeyEstablishment).toBe(true)
    expect(v.restrictsKeySpecToMlDsa).toBe(false)
    expect(v.isComplete).toBe(false)
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
  expect(screen.getByText('Incomplete sample check')).toBeInTheDocument()
  expect(screen.getByText(/Statement 3: restrict.*kms:KeySpec/)).toBeInTheDocument()
  expect(screen.queryByText('New signing keys will be ML-DSA')).not.toBeInTheDocument()
})
