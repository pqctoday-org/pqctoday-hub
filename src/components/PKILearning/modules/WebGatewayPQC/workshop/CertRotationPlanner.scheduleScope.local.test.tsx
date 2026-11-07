// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CertRotationPlanner } from './CertRotationPlanner'
const select = (current: string, next: string) => {
  fireEvent.click(screen.getByRole('button', { name: current }))
  fireEvent.click(screen.getByRole('option', { name: next }))
}
describe('one illustrative certificate rollout schedule', () => {
  it.each([
    { label: 'Aggressive (30 days)', rollout: 30, total: 44, pilot: 3, ramp: 12, final: 15 },
    { label: 'Moderate (90 days)', rollout: 90, total: 104, pilot: 9, ramp: 36, final: 45 },
    { label: 'Conservative (180 days)', rollout: 180, total: 194, pilot: 18, ramp: 72, final: 90 },
  ])(
    'reconciles the $rollout day option, phase boundaries and planned end',
    ({ label, rollout, total, pilot, ramp, final }) => {
      render(<CertRotationPlanner />)
      if (rollout !== 90) select('Moderate (90 days)', label)
      expect(screen.getByText(`${rollout}d`)).toBeInTheDocument()
      expect(
        screen.getByText((content) =>
          content.startsWith(
            `14 preparation days + ${rollout} rollout days = ${total} total planned days`
          )
        )
      ).toBeInTheDocument()
      expect(screen.getByText('14 days · planned day 0–14')).toBeInTheDocument()
      expect(screen.getByText(`${pilot} days · planned day 14–${14 + pilot}`)).toBeInTheDocument()
      expect(
        screen.getByText(`${ramp} days · planned day ${14 + pilot}–${14 + pilot + ramp}`)
      ).toBeInTheDocument()
      expect(
        screen.getByText(`${final} days · planned day ${14 + pilot + ramp}–${total}`)
      ).toBeInTheDocument()
      expect(screen.queryByText('Risk Window')).not.toBeInTheDocument()
      expect(screen.queryByText(/nodes\/day/)).not.toBeInTheDocument()
    }
  )
  it.each([
    { label: '1 node', nodes: 1, pilot: 1, next: 0, final: 0 },
    { label: '10 nodes', nodes: 10, pilot: 1, next: 5, final: 4 },
    { label: '50 nodes', nodes: 50, pilot: 3, next: 25, final: 22 },
    { label: '200 nodes', nodes: 200, pilot: 10, next: 100, final: 90 },
    { label: '500 nodes', nodes: 500, pilot: 25, next: 250, final: 225 },
  ])(
    'conserves the $nodes node estate with no negative final batch',
    ({ label, nodes, pilot, next, final }) => {
      render(<CertRotationPlanner />)
      if (nodes !== 10) select('10 nodes', label)
      expect(pilot + next + final).toBe(nodes) // Independent discrete-allocation examples.
      expect(
        screen.getByText(
          `Node allocation: ${pilot} pilot + ${next} next + ${final} final = ${nodes} ${nodes === 1 ? 'node' : 'nodes'}.`
        )
      ).toBeInTheDocument()
      if (nodes === 1) {
        expect(
          screen.getAllByText('No nodes assigned to this batch; adapt its template duration.')
        ).toHaveLength(2)
        expect(
          screen.getByText(/Empty batches retain template time and must be adapted/)
        ).toBeInTheDocument()
        expect(screen.getByText(/104 total planned days/)).toBeInTheDocument()
      }
    }
  )
  it('keeps certificate renewal arithmetic independent of the illustrative rollout duration', () => {
    render(<CertRotationPlanner />)
    select('10 certs', '1,000 certs')
    expect(screen.getByText('10,000')).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument() // ceil(10000/90).
    select('90 days', '1 year')
    expect(screen.getByText('28')).toBeInTheDocument() // ceil(10000/365).
    expect(screen.getByText('90d')).toBeInTheDocument()
    expect(screen.getByText(/104 total planned days/)).toBeInTheDocument()
  })
})
