// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Workshop step 3 (chain builder) asks the learner to decide which job each link of a chain does
 * (standard, certification or compliance), answers at once, and only then orders the chain and
 * offers the explanation. It used to be a reveal-only step with nothing to decide.
 */
import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import { StandardsCertChain, type ChainAnswers } from './StandardsCertChain'
import { CHAIN_SCENARIOS } from '../data'

const Harness = () => {
  const [answers, setAnswers] = useState<ChainAnswers>({})
  return <StandardsCertChain answers={answers} onAnswersChange={setAnswers} />
}

const group = (label: string) => screen.getByRole('group', { name: `Job of ${label}` })
const pick = async (label: string, job: string) => {
  await userEvent.click(within(group(label)).getByRole('button', { name: job }))
}

const [first] = CHAIN_SCENARIOS
const [standard, certification, compliance] = first.nodes

describe('StandardsCertChain', () => {
  it('shows the three links in mixed order, with no job named until it is placed', () => {
    render(<Harness />)
    const labels = screen
      .getAllByText(/^(FIPS 203|CMVP Validation|CNSA 2\.0 Mandate)/)
      .map((el) => el.textContent)
    // not the order of the chain (standard, certification, compliance)
    expect(labels).not.toEqual([standard.label, certification.label, compliance.label])
    expect(screen.getByText('0 / 3 links placed correctly')).toBeInTheDocument()
    // no job badge and no step number yet
    expect(screen.queryByText('Step 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reveal/ })).not.toBeInTheDocument()
  })

  it('answers a wrong pick at once, without placing the link', async () => {
    render(<Harness />)
    await pick(standard.label, 'Compliance')
    expect(
      screen.getByText(/Not quite\. A compliance link makes the requirement binding/)
    ).toBeInTheDocument()
    expect(screen.getByText('0 / 3 links placed correctly')).toBeInTheDocument()
    // the wrong pick can be changed
    await pick(standard.label, 'Standard')
    expect(screen.queryByText(/Not quite/)).not.toBeInTheDocument()
    expect(screen.getByText('1 / 3 links placed correctly')).toBeInTheDocument()
    expect(screen.getByText('Step 1')).toBeInTheDocument()
  })

  it('opens the explanation only for a placed link, and orders the chain when all three are placed', async () => {
    render(<Harness />)
    await pick(standard.label, 'Standard')
    expect(screen.queryByText(standard.description)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Reveal/ }))
    expect(screen.getByText(standard.description)).toBeInTheDocument()

    await pick(certification.label, 'Certification')
    await pick(compliance.label, 'Compliance')
    expect(screen.getByText('3 / 3 links placed correctly')).toBeInTheDocument()
    expect(screen.getByText(/Chain complete!/)).toBeInTheDocument()
    const order = screen
      .getAllByText(/^(FIPS 203|CMVP Validation|CNSA 2\.0 Mandate)/)
      .map((el) => el.textContent)
    expect(order).toEqual([standard.label, certification.label, compliance.label])
  })

  it('keeps each scenario separate', async () => {
    render(<Harness />)
    await pick(standard.label, 'Standard')
    await userEvent.click(
      screen.getByRole('button', { name: /2\. EU Government Digital Services/ })
    )
    expect(screen.getByText('0 / 3 links placed correctly')).toBeInTheDocument()
  })
})
