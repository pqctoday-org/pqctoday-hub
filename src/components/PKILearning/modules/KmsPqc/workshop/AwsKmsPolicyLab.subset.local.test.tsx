// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AwsKmsPolicyLab } from './AwsKmsPolicyLab'
import { validateKmsPqcPolicy } from '../utils/kmsPolicyEngine'

const editorName = 'key-admin-iam-policy.json editor'
const valid = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: 'kms:CreateKey',
      Resource: '*',
      Condition: { StringEquals: { 'kms:KeySpec': 'ML_DSA_65', 'kms:KeyUsage': 'SIGN_VERIFY' } },
    },
  ],
}
const edit = (value: unknown) =>
  fireEvent.change(screen.getByRole('textbox', { name: editorName }), {
    target: { value: typeof value === 'string' ? value : JSON.stringify(value) },
  })
const success = () => screen.queryByText('Sample constraints satisfied')

describe('actual live sample subset validator', () => {
  it('IAM-02/20 preserves authored initial/snippet inputs and reports the scoped useful result', () => {
    render(<AwsKmsPolicyLab />)
    const initial = JSON.parse(
      (screen.getByRole('textbox', { name: editorName }) as HTMLTextAreaElement).value
    )
    expect(initial).toEqual({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowKeyAdministration',
          Effect: 'Allow',
          Action: ['kms:DescribeKey', 'kms:ListKeys', 'kms:TagResource'],
          Resource: '*',
        },
      ],
    })
    expect(success()).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Insert Solution Snippet' }))
    const current = JSON.parse(
      (screen.getByRole('textbox', { name: editorName }) as HTMLTextAreaElement).value
    )
    expect(current.Statement[0]).toEqual(initial.Statement[0])
    expect(current.Statement[1].Condition).toEqual({
      StringEquals: { 'kms:KeySpec': ['ML_DSA_65', 'ML_DSA_87'], 'kms:KeyUsage': 'SIGN_VERIFY' },
    })
    expect(current.Statement).toHaveLength(2)
    expect(validateKmsPqcPolicy(JSON.stringify(current)).isComplete).toBe(true)
    expect(success()).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Insert optional ML-KEM snippet' }))
    const mixed = JSON.parse(
      (screen.getByRole('textbox', { name: editorName }) as HTMLTextAreaElement).value
    )
    expect(mixed.Statement[2].Condition.StringEquals['kms:KeyUsage']).toBe(
      'ENCAPSULATE_DECAPSULATE'
    )
    expect(validateKmsPqcPolicy(JSON.stringify(mixed))).toMatchObject({
      allowsMlKemKeyEstablishment: true,
      isComplete: false,
    })
    expect(screen.getByText('One optional ML-KEM creation pattern detected')).toBeInTheDocument()
    expect(success()).not.toBeInTheDocument()
    mixed.Statement.pop()
    edit(mixed)
    expect(validateKmsPqcPolicy(JSON.stringify(mixed)).isComplete).toBe(true)
    expect(success()).toBeInTheDocument()
    expect(
      screen.getByText(/All CreateKey Allow paths in this supported sample fragment/)
    ).toBeInTheDocument()
    expect(screen.getByText(/does not establish effective account permissions/)).toBeInTheDocument()
    expect(screen.getByText(/postQuantumTlsEnabled/)).toBeInTheDocument()
  })
  it('IAM-05/06/18 a new unrestricted grant clears current success, and correction recovers', () => {
    render(<AwsKmsPolicyLab />)
    edit(valid)
    expect(success()).toBeInTheDocument()
    edit({
      ...valid,
      Statement: [...valid.Statement, { Effect: 'Allow', Action: 'kms:CreateKey', Resource: '*' }],
    })
    expect(success()).not.toBeInTheDocument()
    expect(screen.getByText('Incomplete sample check')).toBeInTheDocument()
    expect(screen.getByText(/Statement 2: restrict/)).toBeInTheDocument()
    edit(valid)
    expect(success()).toBeInTheDocument()
  })
  it('IAM-05 does not accumulate a key restriction from one Allow and usage from another', () => {
    render(<AwsKmsPolicyLab />)
    edit({
      ...valid,
      Statement: [
        { ...valid.Statement[0], Condition: { StringEquals: { 'kms:KeySpec': 'ML_DSA_65' } } },
        { ...valid.Statement[0], Condition: { StringEquals: { 'kms:KeyUsage': 'SIGN_VERIFY' } } },
      ],
    })
    expect(success()).not.toBeInTheDocument()
    expect(screen.getByText(/Statement 1: require.*Statement 2: restrict/)).toBeInTheDocument()
  })
  it.each([
    { ...valid.Statement[0], Resource: null },
    { ...valid.Statement[0], Condition: null },
    {
      ...valid.Statement[0],
      Condition: {
        StringEquals: { ...valid.Statement[0].Condition.StringEquals, 'sample:Unknown': 'x' },
      },
    },
    { ...valid.Statement[0], Effect: 'Deny' },
    { ...valid.Statement[0], Action: 'kms:*' },
  ])('IAM-10/11/12/18 actual unsupported edit remains visibly incomplete: %j', (statement) => {
    render(<AwsKmsPolicyLab />)
    edit(valid)
    expect(success()).toBeInTheDocument()
    edit({ ...valid, Statement: [statement] })
    expect(success()).not.toBeInTheDocument()
    expect(screen.getByText(/^Unsupported or malformed in this sample check:/)).toHaveTextContent(
      'not an AWS deny verdict'
    )
    edit(valid)
    expect(success()).toBeInTheDocument()
  })
  it('IAM-15/18 malformed JSON/root cannot retain a prior positive result', () => {
    render(<AwsKmsPolicyLab />)
    edit(valid)
    expect(success()).toBeInTheDocument()
    edit('null')
    expect(success()).not.toBeInTheDocument()
    expect(screen.getByText('Expected a JSON policy object.')).toBeInTheDocument()
    edit('{')
    expect(screen.getByText('Invalid JSON syntax.')).toBeInTheDocument()
    edit(valid)
    expect(success()).toBeInTheDocument()
  })
})

it('a duplicate raw member cannot preserve current success after native JSON parsing', () => {
  render(<AwsKmsPolicyLab />)
  edit(valid)
  expect(success()).toBeInTheDocument()
  const raw = JSON.stringify(valid).replace('"Effect":"Allow"', '"Effect":"Deny","Effect":"Allow"')
  edit(raw)
  expect(success()).not.toBeInTheDocument()
  expect(screen.getByText(/duplicate JSON member/)).toHaveTextContent('not an AWS deny verdict')
  edit(valid)
  expect(success()).toBeInTheDocument()
})
