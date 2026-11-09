// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HybridSignatures } from './HybridSignatures'
import { MemoryRouter, Routes, Route } from 'react-router'
import { PlaygroundToolRoute } from '@/components/Playground/PlaygroundToolRoute'
import { ToolExercise } from '@/components/shared/ToolExercise'
import { StepExercise } from '@/components/shared/StepExercise'
import { PersonaBlock } from '@/components/shared/PersonaBlock'
import { usePersonaStore } from '@/store/usePersonaStore'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import type { HybridSigKeyPair, HybridSigResult } from '../services/HybridSignatureService'
const fixture = vi.hoisted(() => ({
  keygen: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
  replace: vi.fn(),
}))
vi.mock('../services/HybridSignatureService', async (original) => ({
  ...(await original<typeof import('../services/HybridSignatureService')>()),
  silithiumKeygen: fixture.keygen,
  silithiumSign: fixture.sign,
  silithiumVerify: fixture.verify,
  silithiumRecombinationAttack: fixture.replace,
}))
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  getSoftHSMRustModule: vi.fn().mockRejectedValue(new Error('Controlled unavailable HSM')),
}))
vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({ revisions: [] }),
  byRecord: () => [],
}))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
const keys: HybridSigKeyPair = {
  ecSk: new Uint8Array([1]),
  ecPk: new Uint8Array([2]),
  mlSk: new Uint8Array([3]),
  mlPk: new Uint8Array([4]),
}
const attacker: HybridSigKeyPair = {
  ecSk: new Uint8Array([5]),
  ecPk: new Uint8Array([6]),
  mlSk: new Uint8Array([7]),
  mlPk: new Uint8Array([8]),
}
const signed: HybridSigResult = {
  construction: 'silithium',
  signatureBytes: new Uint8Array(70).fill(1),
  components: { ecPart: '01', mlPart: '02', sharedChallenge: '03' },
  sizes: { ecBytes: 65, mlBytes: 5, totalBytes: 70, concatenationBytes: 70, savedBytes: 0 },
  separable: false,
  timingMs: 1,
}
const tick = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10)
  })
}
function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}
function card(label: string) {
  // No accessible group exists for a result card; scope assertions to its labelled container.
  // eslint-disable-next-line testing-library/no-node-access
  const container = screen.getByText(label).parentElement
  if (!container) throw new Error('Missing result card')
  return within(container)
}
async function ready() {
  render(<HybridSignatures />)
  click('Shared-binding model')
  click(/Generate Key Pairs/)
  await tick()
  click(/^Sign$/)
  await tick()
}
beforeEach(() => {
  vi.useFakeTimers()
  usePersonaStore.setState({ selectedPersona: null })
  fixture.keygen.mockReset().mockReturnValueOnce(keys).mockReturnValue(attacker)
  fixture.sign.mockReset().mockReturnValue(signed)
  fixture.verify.mockReset().mockReturnValue({
    valid: true,
    ecValid: true,
    mlValid: true,
    ecAloneValid: false,
    mlAloneValid: false,
  })
  fixture.replace.mockReset().mockReturnValue({
    valid: false,
    ecValid: false,
    mlValid: true,
    ecAloneValid: false,
    mlAloneValid: false,
  })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('shared-binding model result attribution', () => {
  it('renders the returned raw-component and public-only replacement results', async () => {
    await ready()
    fixture.verify.mockReturnValueOnce({
      valid: true,
      ecValid: true,
      mlValid: true,
      ecAloneValid: false,
      mlAloneValid: true,
    })
    click(/^Verify$/)
    await tick()
    expect(screen.getByText('Both components valid')).toBeInTheDocument()
    expect(
      screen.getByText('Separable ⚠ — ML-DSA verifies on raw message alone')
    ).toBeInTheDocument()
    click(/Recombination Attack/)
    await tick()
    expect(fixture.replace).toHaveBeenCalledTimes(1)
    const call = fixture.replace.mock.calls[0]
    expect(call[1]).toBe(signed.signatureBytes)
    expect(call[2]).toEqual({ ecPk: keys.ecPk, mlPk: attacker.mlPk, mlSk: attacker.mlSk })
    expect(Object.hasOwn(call[2], 'ecSk')).toBe(false)
    const expectedMessage =
      'Hello from the post-quantum transition. This message must be signed by both classical and PQC algorithms.'
    expect(screen.getByRole('textbox', { name: 'Message to sign' })).toHaveValue(expectedMessage)
    expect(new TextDecoder().decode(call[0])).toBe(expectedMessage)
    expect(
      card('EC under replacement binding').getByText('EC component check did not pass')
    ).toBeInTheDocument()
    expect(
      card('ML-DSA under replacement binding').getByText('ML-DSA component check passed')
    ).toBeInTheDocument()
    expect(screen.getByText(/Observed: the replacement ML check passed/)).toHaveTextContent(
      'not a general security proof'
    )
    expect(
      screen.getByText(/shared-binding model uses fresh random EC signing nonces/)
    ).toHaveTextContent('not the published scheme or its security proof')
  })

  it('shows operational failure instead of an attack-blocked result and permits retry', async () => {
    await ready()
    fixture.replace.mockReturnValueOnce({
      valid: false,
      ecAloneValid: false,
      mlAloneValid: false,
      error: 'Controlled replacement verification failure',
    })
    click(/Recombination Attack/)
    await tick()
    expect(screen.getByText('Error: Controlled replacement verification failure')).toBeVisible()
    expect(screen.queryByText('Recombination Attack Result')).not.toBeInTheDocument()
    expect(screen.queryByText(/Observed: the replacement ML check passed/)).not.toBeInTheDocument()
    click(/Recombination Attack/)
    await tick()
    expect(
      screen.queryByText('Error: Controlled replacement verification failure')
    ).not.toBeInTheDocument()
    expect(screen.getByText('Recombination Attack Result')).toBeInTheDocument()
  })

  it('withdraws previous result cards immediately on a message edit', async () => {
    await ready()
    click(/^Verify$/)
    await tick()
    click(/Recombination Attack/)
    await tick()
    expect(screen.getByText('Both components valid')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Message to sign' }), {
      target: { value: 'Changed sample' },
    })
    expect(screen.queryByText('Both components valid')).not.toBeInTheDocument()
    expect(screen.queryByText('Recombination Attack Result')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Verify$/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Recombination Attack/ })).toBeDisabled()
  })

  it.each(['sign', 'verify', 'replacement'] as const)(
    'does not run obsolete %s work after editing during pacing, and releases busy for a new run',
    async (operation) => {
      await ready()
      if (operation === 'sign') click(/^Sign$/)
      if (operation === 'verify') click(/^Verify$/)
      if (operation === 'replacement') click(/Recombination Attack/)
      fireEvent.change(screen.getByRole('textbox', { name: 'Message to sign' }), {
        target: { value: 'Current sample input' },
      })
      expect(screen.getByRole('button', { name: /Generate Key Pairs/ })).toBeDisabled()
      await tick()
      expect(fixture.sign).toHaveBeenCalledTimes(1)
      expect(fixture.verify).not.toHaveBeenCalled()
      expect(fixture.replace).not.toHaveBeenCalled()
      expect(screen.queryByText('Recombination Attack Result')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Sign$/ })).toBeEnabled()
      click(/^Sign$/)
      await tick()
      expect(fixture.sign).toHaveBeenCalledTimes(2)
      expect(new TextDecoder().decode(fixture.sign.mock.calls[1][0])).toBe('Current sample input')
      expect(screen.getByRole('button', { name: /^Verify$/ })).toBeEnabled()
    }
  )

  it('does not present a failed main verification as a completed component result', async () => {
    await ready()
    fixture.verify.mockReturnValueOnce({
      valid: false,
      ecAloneValid: false,
      mlAloneValid: false,
      error: 'Controlled verification error',
    })
    click(/^Verify$/)
    await tick()
    expect(screen.getByText('Error: Controlled verification error')).toBeVisible()
    expect(screen.queryByText('Both components valid')).not.toBeInTheDocument()
    click(/^Verify$/)
    await tick()
    expect(screen.getByText('Both components valid')).toBeInTheDocument()
  })
})

describe('shared-binding tool aliases', () => {
  it('renders the actual registry introduction with the renamed options and bounded outcomes', async () => {
    vi.useRealTimers()
    render(
      <MemoryRouter initialEntries={['/playground/hybrid-sigs']}>
        <Routes>
          <Route path="/playground/:toolId" element={<PlaygroundToolRoute />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('region', { name: 'What you will do' })).toHaveTextContent(
      'Choose Concatenation, Nesting or Shared-binding model'
    )
    expect(screen.getByRole('region', { name: 'What you will do' })).toHaveTextContent(
      'not the published Silithium scheme, and this page does not claim strong non-separability or a security proof'
    )
    expect(screen.getByRole('region', { name: 'What you will do' })).toHaveTextContent(
      'retains the EC public key and original EC bytes'
    )
    expect(
      await screen.findByRole('heading', { name: 'Hybrid Signature Spectrums', level: 2 })
    ).toBeVisible()
    const tool = WORKSHOP_TOOLS.find((entry) => entry.id === 'hybrid-sigs')!
    expect(tool.outputSpec).toContain('executed full-binding, raw-component and replacement checks')
    expect(tool.outputSpec).not.toContain('each component must independently verify')
  })

  it.each([
    { role: 'developer', limitation: 'not published Silithium or a security proof' },
    {
      role: 'architect',
      limitation:
        'versioned standard/profile, relying-party compatibility checks and implementation evidence',
    },
    {
      role: 'researcher',
      limitation: 'not the published Silithium construction or a general non-separability property',
    },
    {
      role: 'cert-engineer',
      limitation: 'not published-scheme conformance or validation evidence',
    },
  ] as const)(
    'renders the actual $role guidance without representing the model as published-scheme evidence',
    ({ role, limitation }) => {
      usePersonaStore.setState({ selectedPersona: role })
      render(
        <MemoryRouter>
          <PersonaBlock route="/playground/hybrid-sigs" />
        </MemoryRouter>
      )
      const block = screen.getByRole('region', { name: 'For your role' })
      expect(block).toHaveTextContent(limitation)
      expect(block).not.toHaveTextContent('Silithium (Fused)')
    }
  )
})

describe('hybrid signature question outcomes', () => {
  it('grades both raw-message components, distinguishing nesting and the local model', () => {
    render(<ToolExercise toolId="hybrid-sigs" />)
    expect(
      screen.getByText(/verifies BOTH raw-message component signatures independently/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shared-binding model' }))
    expect(screen.getByRole('status')).toHaveTextContent('Not quite — it is "Concatenation".')
    fireEvent.click(screen.getByRole('button', { name: 'Concatenation' }))
    expect(screen.getByRole('status')).toHaveTextContent('Right.')
    expect(screen.getByRole('status')).toHaveTextContent('Nesting verifies the EC component alone')
    expect(screen.getByRole('status')).toHaveTextContent(
      'not a proof of non-separability or published Silithium security'
    )
  })

  it('preserves the actual nesting answer without presenting the local option as an SNS proof', () => {
    render(<StepExercise moduleId="hybrid-crypto" stepId="hybrid-signatures" />)
    fireEvent.click(
      screen.getByRole('button', {
        name: 'It still verifies alone, but swapping it for a different EC signature would invalidate the outer ML-DSA signature (WNS)',
      })
    )
    expect(screen.getByRole('status')).toHaveTextContent('Right.')
    expect(screen.getByRole('status')).toHaveTextContent('not published Silithium')
    expect(screen.getByRole('status')).toHaveTextContent('do not prove Strong Non-Separability')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'It cannot be verified alone, because the fused challenge μ binds both public keys (SNS)',
      })
    )
    expect(screen.getByRole('status')).toHaveTextContent('Not quite')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nesting wraps the EC signature inside the ML-DSA signature'
    )
  })
})
