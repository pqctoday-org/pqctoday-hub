// SPDX-License-Identifier: AGPL-3.0-only
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { FheExercises } from './FheExercises'
import { FHE_HSM_FLOWS, engineStatusOf } from '../data/fheHsmFlows'
import { FHE_STEP_COSTS } from '../data/fheHsmCosts'
import { EVIDENCE_MANIFEST } from '@/data/fhe/fheEvidence'
import { CKKS_EVIDENCE } from '../data/fheCkksEvidence'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { HomomorphicEncryptionModule } from '../index'
import { EmbedProvider } from '@/embed/EmbedProvider'

const root = resolve(__dirname, '../../../../../../public/data/fhe-evidence')
const file = resolve(root, 'ckks-stream-mx95-7de154b/generate-only.json')
const run = JSON.parse(readFileSync(file, 'utf8')) as {
  paramSet: number
  keys: number
  limbsPerCall: number
  evkCalls: number
  bytes: number
  seconds: number
  peakRssKiB: number
}
function panel() {
  const node = screen
    .getByRole('heading', { name: /^4\. What can run in the HSM/ })
    .closest('.glass-panel')
  if (!(node instanceof HTMLElement)) throw Error('Missing exercise panel')
  return within(node)
}
function flow(id: string) {
  const f = FHE_HSM_FLOWS.find((x) => x.id === id)
  if (!f) throw Error(id)
  return f
}
function stepStatus(id: string, step: string) {
  const f = flow(id),
    s = f.steps.find((x) => x.id === step)
  if (!s) throw Error(step)
  return engineStatusOf(f, s)
}
beforeEach(() => {
  useModuleStore.getState().resetProgress()
  usePersonaStore.getState().setPersona('cert-engineer')
  useModuleStore.getState().setActiveLearnPath('homomorphic-encryption', 'hsm-custody')
})
afterEach(() => {
  useModuleStore.getState().resetProgress()
  usePersonaStore.getState().setPersona(null)
})
describe('Supported streamed export versus sample evaluation placement', () => {
  it('pins retained bytes, calls, time and memory to the actual manifest artifact without running FHE', () => {
    const rec = EVIDENCE_MANIFEST.records.find((x) => x.id === CKKS_EVIDENCE.mx95)
    expect(rec).toBeDefined()
    const artifact = rec!.artifacts.find((x) => x.name === 'generate-only.json')
    expect(artifact?.sha256).toBe(
      '5bb20592b3f9ddb1b56eecc68b7494545c732efa3d431e26f5b5090f3ead7fd9'
    )
    expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(artifact?.sha256)
    expect(run.paramSet).toBe(2)
    expect(run.keys).toBe(51)
    expect(run.bytes).toBe(3_941_073_029)
    expect(run.evkCalls).toBe(1001)
    expect(run.limbsPerCall).toBe(8)
    expect((run.bytes / 1e9).toFixed(2)).toBe('3.94')
    expect((run.peakRssKiB / 1024).toFixed(1)).toBe('16.7')
    expect(Math.round(run.seconds)).toBe(473)
    // Aggregate exported bytes and instantaneous resident memory are different quantities.
    expect(run.bytes).toBeGreaterThan(200 * run.peakRssKiB * 1024)
    expect((run.bytes / 2 ** 30).toFixed(2)).toBe('3.67')
  })
  it('uses the actual placement function for the positive stream and the contrary refused evaluation case', () => {
    expect(stepStatus('single-hsm', 'export-evaluation-keys')).toBe('engine')
    expect(stepStatus('hsm-compute-limits', 'eval-keygen-in-hsm')).toBe('engine')
    expect(stepStatus('hsm-compute-limits', 'evaluation-in-hsm')).toBe('refused')
    expect(stepStatus('hsm-compute-limits', 'evaluation-on-accelerators')).toBe('outside')
    const costs = FHE_STEP_COSTS['single-hsm']
    expect(costs[1].where).toBe('HSM, streamed')
    expect(costs[5].where).toBe('cloud GPU/CPU')
    expect(
      flow('hsm-compute-limits').steps.find((x) => x.id === 'evaluation-in-hsm')?.detail
    ).toContain('A larger HSM, a different scheme or API')
  })
  it('reveals the supported numeric example and workload limits, then preserves the exercise handoff', async () => {
    const user = userEvent.setup(),
      navigate = vi.fn()
    render(
      <MemoryRouter initialEntries={['/learn/homomorphic-encryption?path=hsm-custody']}>
        <FheExercises onNavigateToWorkshop={navigate} />
      </MemoryRouter>
    )
    const p = panel()
    expect(p.queryByRole('status')).not.toBeInTheDocument()
    await user.click(p.getByRole('button', { name: 'Reveal explanation' }))
    const answer = p.getByRole('status')
    for (const text of [
      '3.94 GB',
      '1,001 bounded calls',
      '16.7 MiB',
      '473 s',
      'rotation or recovery',
      'CPUs, GPUs or FPGAs',
      'every parameter set',
    ])
      expect(answer).toHaveTextContent(text)
    expect(answer).not.toHaveTextContent(
      /planned engine|refuses it by design|need.*GPU or FPGA acceleration/
    )
    await user.click(p.getByRole('button', { name: 'Open Workshop' }))
    expect(navigate).toHaveBeenCalledExactlyOnceWith(1)
    await user.click(p.getByRole('button', { name: 'Hide explanation' }))
    expect(p.queryByRole('status')).not.toBeInTheDocument()
  })
  it('hands the real module exercise to the existing HSM flow view without executing an engine', async () => {
    const user = userEvent.setup()
    render(
      <EmbedProvider>
        <MemoryRouter
          initialEntries={['/learn/homomorphic-encryption?tab=exercises&path=hsm-custody']}
        >
          <HomomorphicEncryptionModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    await user.click(screen.getByRole('tab', { name: /Exercises/ }))
    await user.click(panel().getByRole('button', { name: 'Open Workshop' }))
    expect(
      await screen.findByRole('button', { name: /What can run in the HSM\?/ })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /What can run in the HSM\?/ }))
    expect(screen.getByRole('heading', { name: 'What can run in the HSM?' })).toBeInTheDocument()
    expect(screen.getByText(/not in this sample HSM profile/)).toBeInTheDocument()
  })
})
