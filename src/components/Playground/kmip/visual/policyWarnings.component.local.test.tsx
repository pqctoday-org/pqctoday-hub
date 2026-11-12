// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { PolicyGraphView } from './PolicyGraphView'
import type { DryRunResult, KmipEngine } from '@/wasm/kmip/kmipEngine'

const yaml = `schema_version: "1"
metadata:
  name: sample-warning
  effective: always
rules:
  - type: temporal_cutoff
    severity: warn
    op: "Sign"
    algorithm_class: classical
    after: "2026-01-01"
    reason: "Sample warning"
  - type: temporal_cutoff
    op: "Sign"
    algorithm_class: classical
    after: "2027-01-01"
    reason: "Sample denial"
`
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))
})
afterEach(() => vi.unstubAllGlobals())
async function run(result: DryRunResult) {
  const dryRun = vi.fn(() => result)
  const engine = {
    dryRun,
    policyStatus: () => ({ active: true, name: 'sample', fingerprint: 'sample-fp' }),
    policyModulesStatus: () => ({
      modules: [
        { name: 'sample', fingerprint: 'sample-fp', enabled: true, scopes: ['signing'], rules: 2 },
      ],
      uncoveredOps: 'deny',
    }),
    lintPolicyDraft: () => ({ ok: true, findings: [] }),
  } as unknown as KmipEngine
  render(
    <PolicyGraphView
      engine={engine}
      initialYaml={yaml}
      presetFile={null}
      guided={false}
      onLoadPreset={vi.fn()}
      onApplyYaml={() => ({ ok: true })}
    />
  )
  // Deliberately edit a sample reason and apply the draft through the existing flow.
  // This establishes a current graph/source binding without changing a gating condition.
  fireEvent.click(screen.getByRole('button', { name: /policy source/ }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Policy YAML source' }), {
    target: { value: yaml.replace('Sample warning', 'Edited sample warning') },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Apply to graph' }))
  fireEvent.click(screen.getByRole('button', { name: 'Simulate' }))
  fireEvent.click(screen.getByRole('button', { name: 'Run through the pipeline' }))
  await act(async () => {
    await Promise.resolve()
  })
  return dryRun
}
describe('warning traces preserve observed engine effects and authoritative decisions', () => {
  it('renders a literal observed warning and its nonterminal meaning', async () => {
    await run({
      kind: 'Allow',
      algorithm: 'ECDSA-P256',
      trace: [{ index: 1, effect: 'warn', note: '' }],
    })
    expect(screen.getByLabelText('Warning: evaluation continues')).toBeInTheDocument()
    expect(screen.getByText('Warning — evaluation continues')).toBeInTheDocument()
    expect(screen.getByText('engine verdict')).toBeInTheDocument()
  })
  it('does not manufacture a warning from a native pass and source severity', async () => {
    await run({
      kind: 'Allow',
      algorithm: 'ECDSA-P256',
      trace: [{ index: 1, effect: 'pass', note: 'Observed native pass' }],
    })
    expect(screen.queryByLabelText('Warning: evaluation continues')).not.toBeInTheDocument()
    expect(screen.getByText('Observed native pass')).toBeInTheDocument()
  })
  it('never changes an authoritative Deny into Allow merely because its trace includes a warning', async () => {
    await run({
      kind: 'Deny',
      reason: 'Observed native denial',
      trace: [
        { index: 1, effect: 'warn', note: 'Observed warning' },
        { index: 2, effect: 'deny', note: 'Observed later denial' },
      ],
    })
    expect(screen.getByLabelText('Warning: evaluation continues')).toBeInTheDocument()
    expect(screen.getAllByText('Observed native denial')).toHaveLength(2)
    expect(screen.getByText('Observed later denial')).toBeInTheDocument()
    expect(screen.queryByText('resolved → ECDSA-P256')).not.toBeInTheDocument()
  })
  it('does not relabel an observed native denial as a warning from source severity', async () => {
    await run({
      kind: 'Deny',
      reason: 'Observed native denial',
      trace: [{ index: 1, effect: 'deny', note: 'Observed native deny effect' }],
    })
    expect(screen.queryByLabelText('Warning: evaluation continues')).not.toBeInTheDocument()
    expect(screen.getByText('Observed native deny effect')).toBeInTheDocument()
  })
  it('shows the illustrative warning without replacing a trace-free authoritative result', async () => {
    await run({ kind: 'Allow', algorithm: 'ECDSA-P256' })
    expect(screen.getByLabelText('Warning: evaluation continues')).toBeInTheDocument()
    expect(screen.getByText(/Illustrative graph path/)).toBeInTheDocument()
    expect(screen.getByText('engine verdict')).toBeInTheDocument()
  })
})
