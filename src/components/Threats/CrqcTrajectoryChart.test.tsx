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
})
