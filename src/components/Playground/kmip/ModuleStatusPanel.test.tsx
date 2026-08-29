// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModuleStatusPanel } from './ModuleStatusPanel'
import type { KmipEngine, PolicyModulesStatus } from '@/wasm/kmip/kmipEngine'

const fakeEngine = (status: PolicyModulesStatus) =>
  ({ policyModulesStatus: () => status }) as unknown as KmipEngine

afterEach(() => {
  vi.useRealTimers()
})

describe('ModuleStatusPanel', () => {
  it('renders nothing when no module is active', () => {
    const { container } = render(
      <ModuleStatusPanel engine={fakeEngine({ modules: [], uncoveredOps: 'deny' })} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows each module (name, scopes, rule count, enabled state) and the uncovered-ops mode', async () => {
    render(
      <ModuleStatusPanel
        engine={fakeEngine({
          modules: [
            {
              name: 'classical-encryption',
              fingerprint: 'abc123',
              scopes: ['encryption'],
              rules: 4,
              enabled: true,
            },
            {
              name: 'classical-signing',
              fingerprint: 'def456',
              scopes: ['signing'],
              rules: 3,
              enabled: false,
            },
          ],
          uncoveredOps: 'deny',
        })}
      />
    )
    // The panel's first read is deferred a macrotask (avoids a setState-
    // synchronous-in-effect lint violation) — findBy* waits for it.
    expect(await screen.findByText('classical-encryption')).toBeInTheDocument()
    expect(screen.getByText(/encryption.*4r/)).toBeInTheDocument()
    expect(screen.getByText('classical-signing')).toBeInTheDocument()
    expect(screen.getByText(/signing.*3r/)).toBeInTheDocument()
    expect(screen.getByText(/uncovered ops: deny/i)).toBeInTheDocument()
  })

  it('polls and reflects a module disabled out from under it (the devtools-toggle acceptance case)', async () => {
    vi.useFakeTimers()
    let enabled = true
    const engine = {
      policyModulesStatus: (): PolicyModulesStatus => ({
        modules: [
          {
            name: 'classical-encryption',
            fingerprint: 'abc123',
            scopes: ['encryption'],
            rules: 4,
            enabled,
          },
        ],
        uncoveredOps: 'deny',
      }),
    } as unknown as KmipEngine

    render(<ModuleStatusPanel engine={engine} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByText('classical-encryption')).not.toHaveClass('line-through')

    // Simulate the module being disabled from outside this component entirely
    // (e.g. a devtools call to `engine.setPolicyModuleEnabled(name, false)`),
    // then let the panel's own poll interval pick it up.
    enabled = false
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    expect(screen.getByText('classical-encryption')).toHaveClass('line-through')
  })

  it('WS-7B: the enable/disable toggle calls setPolicyModuleEnabled and refreshes immediately', async () => {
    const setPolicyModuleEnabled = vi.fn().mockReturnValue({ ok: true })
    let enabled = true
    const engine = {
      policyModulesStatus: (): PolicyModulesStatus => ({
        modules: [
          {
            name: 'classical-encryption',
            fingerprint: 'abc123',
            scopes: ['encryption'],
            rules: 4,
            enabled,
          },
        ],
        uncoveredOps: 'deny',
      }),
      setPolicyModuleEnabled: (name: string, next: boolean) => {
        enabled = next
        return setPolicyModuleEnabled(name, next)
      },
    } as unknown as KmipEngine

    render(<ModuleStatusPanel engine={engine} />)
    fireEvent.click(await screen.findByTitle('Disable classical-encryption'))

    expect(setPolicyModuleEnabled).toHaveBeenCalledWith('classical-encryption', false)
    // The click's own re-poll (not the interval) must reflect the change.
    expect(screen.getByText('classical-encryption')).toHaveClass('line-through')
  })

  it('WS-7B: the deactivate button calls deactivatePolicyModule and refreshes immediately', async () => {
    const deactivatePolicyModule = vi.fn().mockReturnValue({ ok: true })
    let modules: PolicyModulesStatus['modules'] = [
      {
        name: 'classical-encryption',
        fingerprint: 'abc123',
        scopes: ['encryption'],
        rules: 4,
        enabled: true,
      },
    ]
    const engine = {
      policyModulesStatus: (): PolicyModulesStatus => ({ modules, uncoveredOps: 'deny' }),
      deactivatePolicyModule: (name: string) => {
        modules = modules.filter((m) => m.name !== name)
        return deactivatePolicyModule(name)
      },
    } as unknown as KmipEngine

    const { container } = render(<ModuleStatusPanel engine={engine} />)
    fireEvent.click(
      await screen.findByTitle(
        'Deactivate classical-encryption (removes it — re-select the preset to bring it back)'
      )
    )

    expect(deactivatePolicyModule).toHaveBeenCalledWith('classical-encryption')
    expect(screen.queryByText('classical-encryption')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })
})
