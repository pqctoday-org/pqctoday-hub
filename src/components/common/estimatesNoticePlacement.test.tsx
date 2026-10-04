// SPDX-License-Identifier: GPL-3.0-only
/**
 * Where the "estimates are still open" notice must appear (follow-up release). A page that
 * quotes or takes a CRQC year or qubit count carries it; a page that quotes none does not.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { UNRESOLVED_ESTIMATES_DETAIL } from './UnresolvedEstimatesNotice'
import { FAQPage, FAQ_ESTIMATE_QUESTIONS } from '@/components/FAQ/FAQPage'
import { FAQ_DATA } from '@/components/FAQ/faqData'
import { MissionCryptoLifecyclePlanner } from '@/components/PKILearning/modules/AerospacePQC/workshop/MissionCryptoLifecyclePlanner'
import { SettlementExposureModeller } from '@/components/PKILearning/modules/EMVPaymentPQC/workshop/SettlementExposureModeller'
import { BiometricVaultAssessor } from '@/components/PKILearning/modules/HealthcarePQC/workshop/BiometricVaultAssessor'
import { PatientPrivacyMapper } from '@/components/PKILearning/modules/HealthcarePQC/workshop/PatientPrivacyMapper'
import { PharmaIPCalculator } from '@/components/PKILearning/modules/HealthcarePQC/workshop/PharmaIPCalculator'
import { CRQCScenarioPlanner } from '@/components/PKILearning/modules/PQCRiskManagement/components/CRQCScenarioPlanner'

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('FAQ', () => {
  it('every quantum-estimate question named here exists in the FAQ data', () => {
    const all = FAQ_DATA.flatMap((c) => c.items.map((i) => i.question))
    for (const q of FAQ_ESTIMATE_QUESTIONS) expect(all, q).toContain(q)
  })

  it('opening a CRQC answer shows the notice; opening an unrelated answer does not', () => {
    wrap(<FAQPage />)
    expect(screen.queryByTestId('unresolved-estimates-notice')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'What is post-quantum cryptography (PQC)?' })
    )
    expect(screen.queryByTestId('unresolved-estimates-notice')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'What is a CRQC and when might one exist?' })
    )
    expect(screen.getByTestId('unresolved-estimates-notice')).toHaveTextContent(
      UNRESOLVED_ESTIMATES_DETAIL.faq
    )
  })
})

describe('Learn workshops that take a CRQC year or qubit count carry the example-figures notice', () => {
  const cases: [string, React.ReactElement][] = [
    ['Aerospace mission lifecycle planner', <MissionCryptoLifecyclePlanner key="a" />],
    ['EMV settlement exposure modeller', <SettlementExposureModeller key="b" />],
    ['Healthcare biometric vault assessor', <BiometricVaultAssessor key="c" />],
    ['Healthcare patient privacy mapper', <PatientPrivacyMapper key="d" />],
    ['Healthcare pharma IP calculator', <PharmaIPCalculator key="e" />],
    ['PQC risk CRQC scenario planner', <CRQCScenarioPlanner key="f" />],
  ]
  it.each(cases)('%s', (_name, ui) => {
    wrap(ui)
    expect(screen.getAllByTestId('unresolved-estimates-notice')[0]).toHaveTextContent(
      UNRESOLVED_ESTIMATES_DETAIL.workshopExample
    )
  })
})
