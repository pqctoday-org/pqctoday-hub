// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CrqcTrajectoryChart } from './CrqcTrajectoryChart'

describe('CrqcTrajectoryChart', () => {
  it('separates demonstrations from roadmaps and makes no Q-Day trajectory claim', () => {
    render(<CrqcTrajectoryChart />)
    const view = screen.getByTestId('crqc-trajectory-chart')
    expect(view).toHaveTextContent(/discrete demonstrations and disclosed roadmaps/i)
    expect(view).toHaveTextContent(/No percentage or arrival date is inferred/i)
    expect(view).toHaveTextContent(/recorded LQ/i)
    expect(view).toHaveTextContent(/Highest gate fidelity IBM processor/i)
    expect(view).not.toHaveTextContent(/forecast band/i)
  })

  it('does not present Aurora’s 12 physical qubit modes as logical qubits', () => {
    render(<CrqcTrajectoryChart />)
    const view = screen.getByTestId('crqc-trajectory-chart')
    // The technology card is the heading's grandparent element.
    // eslint-disable-next-line testing-library/no-node-access
    const photonic = screen.getByText('Photonic').closest('div')!.parentElement!
    expect(photonic).toHaveTextContent(/No logical demonstration listed/)
    expect(photonic).not.toHaveTextContent(/12 recorded LQ/)
    expect(photonic).toHaveTextContent(/12 physical qubit modes per clock cycle/)
    expect(photonic).toHaveTextContent(/not twelve error-corrected logical qubits/)
    expect(view).not.toHaveTextContent(/ran 12 error-corrected/i)
  })
})
