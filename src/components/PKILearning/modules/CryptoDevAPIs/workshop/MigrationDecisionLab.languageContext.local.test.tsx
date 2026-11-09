// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MigrationDecisionLab } from './MigrationDecisionLab'
import { CryptoDevAPIsExercises } from '../components/CryptoDevAPIsExercises'

const fixture = vi.hoisted(() => ({ target: 'none' }))
vi.mock('../data/migrationData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/migrationData')>()
  return {
    ...actual,
    get DECISION_QUESTIONS() {
      if (fixture.target === 'none') return actual.DECISION_QUESTIONS
      const invalid =
        fixture.target === 'question'
          ? { label: 'Unavailable fixture option', nextQuestion: 'missing-question' }
          : {
              label: 'Unavailable fixture option',
              recommendation:
                fixture.target === 'foreign' ? 'jca-native-pqc' : 'missing-recommendation',
            }
      return actual.DECISION_QUESTIONS.map((question) =>
        question.id === 'native-api'
          ? { ...question, options: [...question.options, invalid] }
          : question
      )
    },
  }
})
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const startNativeCustom = () => {
  click('C / C++')
  click('Custom / homegrown')
}
const sourceContext = () => screen.getByText('Selected source: C / C++ → Custom / homegrown')
beforeEach(() => {
  fixture.target = 'none'
})

describe('Migration wizard preserves the declared stack', () => {
  it('asks the native custom learner to choose a native candidate without selecting a vendor', () => {
    render(<MigrationDecisionLab />)
    startNativeCustom()
    click('No HSM needed')
    expect(
      screen.getByRole('heading', {
        name: 'Which existing native library route would you like to evaluate?',
      })
    ).toBeVisible()
    for (const candidate of ['OpenSSL', 'Botan', 'wolfSSL'])
      expect(screen.getByRole('button', { name: candidate })).toBeVisible()
    expect(screen.queryByText('Recommended Migration Path')).not.toBeInTheDocument()
    expect(
      screen.queryByText('JCA: Use JDK 24+ built-in ML-KEM and ML-DSA')
    ).not.toBeInTheDocument()
  })

  it.each(['OpenSSL', 'Botan', 'wolfSSL'])(
    'retains Custom C/C++ and the explicitly selected %s candidate',
    (candidate) => {
      render(<MigrationDecisionLab />)
      startNativeCustom()
      click('No HSM needed')
      click(candidate)
      expect(sourceContext()).toBeVisible()
      expect(screen.getByText(`Selected native candidate: ${candidate}`)).toBeVisible()
      expect(screen.getByRole('list', { name: 'Custom-code migration actions' })).toBeVisible()
      expect(
        screen.getByText(/Inventory the operations, key formats and stored or wire data/)
      ).toBeVisible()
      expect(
        screen.queryByText('JCA: Use JDK 24+ built-in ML-KEM and ML-DSA')
      ).not.toBeInTheDocument()
      expect(screen.getByText(/Reference-library effort:/)).toBeVisible()
      if (candidate === 'OpenSSL') {
        click('View existing library reference')
        expect(
          screen.getByText('Library reference — not a before/after of your custom source')
        ).toBeVisible()
        expect(screen.getAllByText('C', { exact: true })).toHaveLength(2)
        expect(screen.queryByText('Java', { exact: true })).not.toBeInTheDocument()
      } else expect(screen.getByRole('list', { name: 'Recommended steps' })).toBeVisible()
    }
  )

  it.each([
    ['Yes — FIPS Level 3 required', 'HSM: PQC through PKCS#11 v3.2 mechanisms'],
    ['Yes — software FIPS sufficient', 'Software FIPS: Pick a validated module with PQC'],
  ])('preserves the existing %s outcome without turning it into a Java route', (answer, title) => {
    render(<MigrationDecisionLab />)
    startNativeCustom()
    click(answer)
    expect(screen.getByText(title)).toBeVisible()
    expect(sourceContext()).toBeVisible()
    expect(
      screen.queryByText('JCA: Use JDK 24+ built-in ML-KEM and ML-DSA')
    ).not.toBeInTheDocument()
  })

  it('keeps the positive standard JCA Java route and its full Java example', () => {
    render(<MigrationDecisionLab />)
    click('Java / Kotlin')
    click('JCA/JCE (standard)')
    click('No HSM needed')
    expect(screen.getByText('JCA: Use JDK 24+ built-in ML-KEM and ML-DSA')).toBeVisible()
    click('View full migration path')
    expect(screen.getAllByText('Java', { exact: true })).toHaveLength(2)
    expect(
      screen.queryByText('Library reference — not a before/after of your custom source')
    ).not.toBeInTheDocument()
  })

  it('identifies the Java custom source separately from the JCA reference', () => {
    render(<MigrationDecisionLab />)
    click('Java / Kotlin')
    click('Custom / homegrown')
    click('No HSM needed')
    expect(screen.getByText('Selected source: Java / Kotlin → Custom / homegrown')).toBeVisible()
    click('View existing library reference')
    expect(
      screen.getByText('Library reference — not a before/after of your custom source')
    ).toBeVisible()
    expect(screen.getAllByText('Java', { exact: true })).toHaveLength(2)
  })

  it('withdraws stale results on Back, permits a different native choice, and clears language on root reset', () => {
    render(<MigrationDecisionLab />)
    startNativeCustom()
    click('No HSM needed')
    click('OpenSSL')
    click('View existing library reference')
    click('Decision Wizard')
    click('Back')
    click('Migration Paths')
    expect(
      screen.queryByRole('heading', {
        name: 'OpenSSL: Upgrade to 3.5+ for native PQC — Migration Steps',
      })
    ).not.toBeInTheDocument()
    click('Decision Wizard')
    expect(screen.queryByText('Selected native candidate: OpenSSL')).not.toBeInTheDocument()
    click('wolfSSL')
    expect(screen.getByText('Selected native candidate: wolfSSL')).toBeVisible()
    click('Back')
    click('Back')
    click('Back')
    click('Back')
    expect(
      screen.getByRole('heading', { name: 'What is your primary development language?' })
    ).toBeVisible()
    expect(screen.queryByText(/Selected source:/)).not.toBeInTheDocument()
    click('Java / Kotlin')
    click('JCA/JCE (standard)')
    click('No HSM needed')
    expect(screen.getByText('JCA: Use JDK 24+ built-in ML-KEM and ML-DSA')).toBeVisible()
    click('Start over')
    expect(
      screen.getByRole('heading', { name: 'What is your primary development language?' })
    ).toBeVisible()
    expect(screen.queryByText('Recommended Migration Path')).not.toBeInTheDocument()
    expect(screen.queryByText(/Selected source:/)).not.toBeInTheDocument()
  })

  it.each(['question', 'recommendation', 'foreign'])(
    'withholds an unresolved %s target and recovers through an existing valid route',
    (target) => {
      fixture.target = target
      render(<MigrationDecisionLab />)
      click('C / C++')
      click('Unavailable fixture option')
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This selection cannot be resolved for your chosen stack.'
      )
      expect(screen.queryByText('Recommended Migration Path')).not.toBeInTheDocument()
      expect(
        screen.queryByText('JCA: Use JDK 24+ built-in ML-KEM and ML-DSA')
      ).not.toBeInTheDocument()
      click('OpenSSL')
      expect(screen.getByText('OpenSSL: Upgrade to 3.5+ for native PQC')).toBeVisible()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    }
  )

  it('keeps direct native library choices reachable without the custom-only source attribution', () => {
    render(<MigrationDecisionLab />)
    for (const [candidate, title] of [
      ['OpenSSL', 'OpenSSL: Upgrade to 3.5+ for native PQC'],
      ['Botan', 'Botan: Upgrade to 3.x for native PQC'],
      ['wolfSSL', 'wolfSSL: Enable the PQC algorithms in your build'],
    ]) {
      click('C / C++')
      click(candidate)
      expect(screen.getByText(title)).toBeVisible()
      expect(
        screen.queryByRole('list', { name: 'Custom-code migration actions' })
      ).not.toBeInTheDocument()
      click('Start over')
    }
  })

  it('teaches and opens the actual three-answer Java exercise without phantom compliance or timeline controls', () => {
    const navigate = vi.fn(),
      configure = vi.fn()
    render(
      <CryptoDevAPIsExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={configure} />
    )
    const instructions = screen.getByText(/In the Migration Decision Lab \(Step 8\)/)
    expect(instructions).toHaveTextContent('Java / Kotlin → JCA/JCE (standard) → No HSM needed')
    expect(instructions).not.toHaveTextContent('SOC 2')
    expect(instructions).not.toHaveTextContent('12 months')
    expect(instructions).toHaveTextContent('View full migration path')
    click('Open Workshop Step 8')
    expect(configure).toHaveBeenCalledWith({ step: 7 })
    expect(navigate).toHaveBeenCalledTimes(1)
  })
})
