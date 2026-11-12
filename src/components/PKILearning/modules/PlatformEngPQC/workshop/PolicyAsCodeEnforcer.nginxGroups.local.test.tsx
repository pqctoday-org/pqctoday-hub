// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PolicyAsCodeEnforcer } from './PolicyAsCodeEnforcer'
import { POLICY_RULES } from '../data/policyRulesData'
it('renders the exact controller declaration check and its real configuration/negotiation boundary', () => {
  render(<PolicyAsCodeEnforcer />)
  const rule = POLICY_RULES.find((p) => p.id === 'kyverno-tls-cipher')!
  fireEvent.click(screen.getByRole('button', { name: new RegExp(rule.name) }))
  expect(screen.getByText(rule.targetResource)).toBeVisible()
  expect(screen.getByText(rule.description)).toHaveTextContent(
    'does not prove that a connection used the hybrid group'
  )
  expect(
    screen.getByText((_, e) => e?.tagName === 'PRE' && e.textContent === rule.rule)
  ).toBeVisible()
})
