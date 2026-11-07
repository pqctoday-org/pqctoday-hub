// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { ExceptionRegisterTriage } from './ExceptionRegisterTriage'

const mocks = vi.hoisted(() => ({ saved: undefined as unknown, add: vi.fn() }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument: mocks.add }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', async (original) => ({
  ...(await original<typeof import('@/hooks/useSavedArtifactInputs')>()),
  useSavedArtifactInputs: () => mocks.saved,
}))
vi.mock('../../../common/executive', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <div>
      <pre data-testid="export">{exportData}</pre>
      <Button onClick={onExport}>Save sample</Button>
    </div>
  ),
}))
const ids = ['legacy-mainframe', 'b2b-edi', 'iot-fleet', 'archive-store', 'analytics-warehouse']
const exported = () => screen.getByTestId('export').textContent ?? ''
function choose(system: RegExp, choice: string) {
  fireEvent.click(
    within(screen.getByRole('group', { name: system })).getByRole('button', { name: choice })
  )
}
beforeEach(() => {
  mocks.saved = undefined
  mocks.add.mockClear()
})
describe('exception triage preserves learner answers in exports', () => {
  it('exports blank entries as unanswered without revealing or inferring recommendations', () => {
    render(<ExceptionRegisterTriage />)
    expect(exported()).toContain('Answered: 0 of 5')
    expect(exported().match(/Not answered/g)).toHaveLength(5)
    expect(exported()).toContain('Not revealed | Not checked')
    expect(exported()).toContain('No suppression selections recorded')
    expect(exported()).not.toContain('all exceptions escalate')
    expect(screen.getByRole('button', { name: 'Check Triage' })).toBeDisabled()
  })
  it('exports only explicit suppression selections and clears a toggled answer', () => {
    render(<ExceptionRegisterTriage />)
    choose(/Disposition for Claims mainframe/, 'Suppress')
    expect(exported()).toContain('Answered: 1 of 5')
    expect(exported().split('## Sample SOC suppression selections')[1]).toContain(
      '- Claims mainframe'
    )
    expect(exported().split('## Sample SOC suppression selections')[1]).not.toContain('B2B EDI')
    choose(/Disposition for Claims mainframe/, 'Suppress')
    expect(exported()).toContain('Answered: 0 of 5')
    expect(exported()).toContain('No suppression selections recorded')
  })
  it('keeps a wrong learner decision separate from revealed model feedback', () => {
    mocks.saved = {
      choices: Object.fromEntries(ids.map((id) => [id, 'suppress'])),
      revealed: false,
    }
    render(<ExceptionRegisterTriage />)
    expect(exported()).not.toContain('Differs from sample rule')
    fireEvent.click(screen.getByRole('button', { name: 'Check Triage' }))
    expect(exported()).toContain(
      'Field IoT fleet (RSA-2048 firmware signing) | 9 | No | No | Suppress | Escalate | Differs from sample rule'
    )
    expect(exported().split('## Sample SOC suppression selections')[1]).toContain(
      '- Field IoT fleet'
    )
  })
  it('restores and saves partial choices without filling gaps', () => {
    mocks.saved = { choices: { 'legacy-mainframe': 'escalate' }, revealed: false }
    render(<ExceptionRegisterTriage />)
    expect(exported()).toContain('Answered: 1 of 5')
    fireEvent.click(screen.getByRole('button', { name: 'Save sample' }))
    const doc = mocks.add.mock.calls[0][0]
    expect(doc.data).toEqual(exported())
    expect(doc.inputs).toEqual({
      __artifactScope: 'pqc-grc-exception-register',
      revealed: false,
      choices: {
        'legacy-mainframe': 'escalate',
        'b2b-edi': null,
        'iot-fleet': null,
        'archive-store': null,
        'analytics-warehouse': null,
      },
    })
  })
  it('treats malformed saved choices as unanswered rather than complete', () => {
    mocks.saved = {
      choices: { 'legacy-mainframe': 'unknown', 'b2b-edi': undefined },
      revealed: true,
    }
    render(<ExceptionRegisterTriage />)
    expect(exported()).toContain('Answered: 0 of 5')
    expect(screen.getByRole('button', { name: 'Check Triage' })).toBeDisabled()
  })
})
