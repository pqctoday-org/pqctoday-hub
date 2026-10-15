// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AppliedQuantumCredit, CC_BY_4_URL, APPLIED_QUANTUM_FRAMEWORK_URL } from './FrameworkCredit'

describe('AppliedQuantumCredit (CC BY 4.0 attribution)', () => {
  it('names the creator, links the source and the licence, and says the work was adapted', () => {
    render(<AppliedQuantumCredit section="SOC Implementation" pages="165–175" />)
    const credit = screen.getByTestId('cc-by-credit')
    expect(credit).toHaveTextContent('Marin Ivezić / Applied Quantum')
    expect(credit).toHaveTextContent('“SOC Implementation” section, pp. 165–175')
    expect(credit).toHaveTextContent(/adapted/)
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', CC_BY_4_URL)
    expect(
      screen.getByRole('link', { name: /Applied Quantum PQC Migration Framework/ })
    ).toHaveAttribute('href', APPLIED_QUANTUM_FRAMEWORK_URL)
  })

  // The modules whose content.ts says it adapts CC BY 4.0 framework text must show the credit.
  it.each(['SocImplementationPqc', 'PqcGrc', 'SkillsTeamStructurePqc'])(
    '%s shows the credit on its Learn page',
    (mod) => {
      const intro = readFileSync(
        join(__dirname, '..', 'modules', mod, 'components', 'Introduction.tsx'),
        'utf8'
      )
      expect(intro).toMatch(/<AppliedQuantumCredit section="[^"]+" pages="[^"]+" \/>/)
    }
  )
})
