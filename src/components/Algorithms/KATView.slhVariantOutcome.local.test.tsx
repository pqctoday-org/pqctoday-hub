// SPDX-License-Identifier: AGPL-3.0-only
// Real desktop/phone controllers and controls; only the async KAT boundary is mocked.
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import type { KATResult, KatTestSpec } from '@/utils/katRunner'
import { evidenceForKind } from '@/utils/katEvidence'
import { KATView } from './KATView'
import { MobileKATValidationView } from '@/components/Mobile/screens/MobileKATValidationView'

type Runner = (
  module: unknown,
  session: number,
  spec: KatTestSpec,
  options: unknown
) => Promise<KATResult>
const fixture = vi.hoisted(() => ({
  run: vi.fn<Runner>(),
  hsm: {
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    initialize: vi.fn(),
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    keys: [],
    removeKey: vi.fn(),
    clearKeys: vi.fn(),
  },
}))
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => fixture.hsm }))
vi.mock('@/utils/katRunner', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/katRunner')>()),
  runKAT: (...args: Parameters<Runner>) => fixture.run(...args),
  advertisedMechanisms: () => new Set<number>(),
}))

const A = 'SHA2-128s',
  B = 'SHA2-256s'
function variant(spec: KatTestSpec): string {
  if (!('variant' in spec.kind)) throw new Error('Expected a variant-bearing SLH-DSA spec')
  return String(spec.kind.variant)
}
function passed(spec: KatTestSpec): KATResult {
  return {
    id: spec.id,
    useCase: spec.useCase ?? spec.id,
    algorithm: `SLH-DSA-${variant(spec)}`,
    standard: spec.standard ?? 'FIPS 205',
    referenceUrl: spec.referenceUrl ?? '',
    status: 'pass',
    details: `completed ${variant(spec)}`,
    evidence: evidenceForKind(spec.kind),
  }
}
function deferred() {
  let resolve!: (result: KATResult) => void
  let reject!: (error: Error) => void
  const promise = new Promise<KATResult>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function card(surface: 'desktop' | 'phone') {
  if (surface === 'desktop') return screen.getByTestId('kat-slhdsa-tile')
  const element = screen.getByText('SLH-DSA', { exact: true }).closest('div')?.parentElement
  if (!element) throw new Error('Missing actual phone SLH-DSA card')
  return element
}
function runButton(surface: 'desktop' | 'phone') {
  return within(card(surface)).getByRole('button', {
    name: surface === 'desktop' ? 'Run known-answer checks' : 'Run functional test',
  })
}
const desktopTrigger = (v: string, level: number) =>
  within(card('desktop')).getByRole('button', {
    name: `SLH-DSA-${v} (Level ${level})`,
  })
function mount(surface: 'desktop' | 'phone') {
  return render(
    <MemoryRouter>{surface === 'desktop' ? <KATView /> : <MobileKATValidationView />}</MemoryRouter>
  )
}
async function selectB(surface: 'desktop' | 'phone', user: ReturnType<typeof userEvent.setup>) {
  if (surface === 'desktop') {
    await user.click(desktopTrigger(A, 1))
    await user.click(await screen.findByRole('option', { name: `SLH-DSA-${B} (Level 5)` }))
  } else await user.click(within(card('phone')).getByRole('button', { name: B }))
}
const status = (surface: 'desktop' | 'phone') => within(card(surface)).getByTestId('kat-run-status')
beforeEach(() => {
  vi.clearAllMocks()
  fixture.run.mockReset()
  fixture.run.mockImplementation(async (_module, _session, spec) => passed(spec))
})

describe.each(['desktop', 'phone'] as const)('SLH-DSA %s pending-run UI', (surface) => {
  it('locks normal selection and repeat execution while pending, then preserves old identity until a new selection clears it', async () => {
    const user = userEvent.setup(),
      pending = deferred()
    fixture.run.mockImplementationOnce(() => pending.promise)
    mount(surface)
    const initialRun = runButton(surface)
    await user.click(initialRun)
    await waitFor(() => expect(fixture.run).toHaveBeenCalledTimes(1))
    expect(initialRun).toBeDisabled()
    if (surface === 'desktop') {
      const trigger = desktopTrigger(A, 1)
      expect(trigger).toBeDisabled()
      await user.click(trigger) // normal disabled-button interaction, no forced change event
      expect(
        screen.queryByRole('option', { name: `SLH-DSA-${B} (Level 5)` })
      ).not.toBeInTheDocument()
    } else {
      for (const button of within(card('phone'))
        .getAllByRole('button')
        .filter((b) => b.textContent?.startsWith('SHA')))
        expect(button).toBeDisabled()
      await user.click(within(card('phone')).getByRole('button', { name: B }))
      expect(within(card('phone')).getByRole('button', { name: A })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(within(card('phone')).getByRole('button', { name: B })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    }
    await user.click(initialRun)
    expect(fixture.run).toHaveBeenCalledTimes(1)
    const originalSpec = fixture.run.mock.calls[0][2]
    expect(variant(originalSpec)).toBe(A)
    await act(async () => pending.resolve(passed(originalSpec)))
    await waitFor(() => expect(runButton(surface)).toBeEnabled())
    expect(status(surface)).toHaveTextContent(
      surface === 'desktop'
        ? `SLH-DSA-${A}: 2 of 2 checks passed.`
        : `SLH-DSA-${A}: 1 of 1 check passed.`
    )
    expect(within(card(surface)).getAllByText(`completed ${A}`)).toHaveLength(
      surface === 'desktop' ? 2 : 1
    )

    await selectB(surface, user)
    expect(within(card(surface)).queryByText(`completed ${A}`)).not.toBeInTheDocument()
    expect(status(surface)).not.toHaveTextContent(/checks? passed/)
    await user.click(runButton(surface))
    await waitFor(() =>
      expect(status(surface)).toHaveTextContent(
        surface === 'desktop'
          ? `SLH-DSA-${B}: 2 of 2 checks passed.`
          : `SLH-DSA-${B}: 1 of 1 check passed.`
      )
    )
    const newCalls = fixture.run.mock.calls.slice(surface === 'desktop' ? 2 : 1)
    expect(newCalls.length).toBe(surface === 'desktop' ? 2 : 1)
    expect(newCalls.every((call) => variant(call[2]) === B)).toBe(true)
  })

  it('shows an operational error as incomplete, re-enables controls and clears that error after a valid retry', async () => {
    const user = userEvent.setup()
    fixture.run.mockRejectedValueOnce(new Error('SLH provider unavailable'))
    mount(surface)
    await user.click(runButton(surface))
    await waitFor(() =>
      expect(status(surface)).toHaveTextContent(
        `SLH-DSA-${A}: the checks could not run. SLH provider unavailable`
      )
    )
    expect(status(surface)).not.toHaveTextContent(/checks? passed/)
    expect(within(card(surface)).queryByTestId('kat-counts')).not.toBeInTheDocument()
    if (surface === 'desktop') expect(desktopTrigger(A, 1)).toBeEnabled()
    else expect(within(card('phone')).getByRole('button', { name: B })).toBeEnabled()
    await user.click(runButton(surface))
    await waitFor(() =>
      expect(status(surface)).toHaveTextContent(
        surface === 'desktop'
          ? `SLH-DSA-${A}: 2 of 2 checks passed.`
          : `SLH-DSA-${A}: 1 of 1 check passed.`
      )
    )
    expect(status(surface)).not.toHaveTextContent('unavailable')
    expect(
      within(card(surface)).queryByText('SLH provider unavailable', {
        exact: true,
      })
    ).not.toBeInTheDocument()
  })
})

describe('desktop legitimate incoming variant navigation while pending', () => {
  it.each(['late result', 'late error'] as const)(
    '%s from the previous linked variant never labels the newly linked variant',
    async (mode) => {
      const user = userEvent.setup(),
        pending = deferred()
      fixture.run.mockImplementationOnce(() => pending.promise)
      const view = render(
        <MemoryRouter>
          <KATView katParam={A} />
        </MemoryRouter>
      )
      await user.click(runButton('desktop'))
      await waitFor(() => expect(fixture.run).toHaveBeenCalledTimes(1))
      const originalSpec = fixture.run.mock.calls[0][2]
      // This is the public URL-input path, not bypassing a disabled dropdown.
      view.rerender(
        <MemoryRouter>
          <KATView katParam={B} />
        </MemoryRouter>
      )
      expect(await screen.findByRole('button', { name: `SLH-DSA-${B} (Level 5)` })).toBeDisabled()
      await act(async () => {
        if (mode === 'late result') pending.resolve(passed(originalSpec))
        else pending.reject(new Error('obsolete A provider error'))
      })
      await waitFor(() => expect(runButton('desktop')).toBeEnabled())
      expect(status('desktop')).not.toHaveTextContent(/checks? passed|obsolete/)
      expect(within(card('desktop')).queryByText(`completed ${A}`)).not.toBeInTheDocument()
      expect(fixture.run).toHaveBeenCalledTimes(1) // no further old-variant spec was executed
      await user.click(runButton('desktop'))
      await waitFor(() =>
        expect(status('desktop')).toHaveTextContent(`SLH-DSA-${B}: 2 of 2 checks passed.`)
      )
      expect(fixture.run.mock.calls.slice(1).every((call) => variant(call[2]) === B)).toBe(true)
    }
  )
})
