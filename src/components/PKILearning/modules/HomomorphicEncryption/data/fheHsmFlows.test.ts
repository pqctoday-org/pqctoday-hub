// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FHE_HSM_FLOWS } from './fheHsmFlows'
import { FHE_STEP_IO } from './fheHsmStepIO'

const flow = (id: string) => FHE_HSM_FLOWS.find((f) => f.id === id)!

function flowText(id: string): string {
  const f = flow(id)
  const io = Object.entries(FHE_STEP_IO).find(([key]) => key === id)?.[1] ?? []
  return [
    f.label,
    f.tagline,
    f.scaling?.note ?? '',
    f.layman.analogy,
    f.layman.whatsDifferent,
    f.layman.catch,
    ...f.steps.flatMap((s) => [s.label, s.title, s.detail]),
    ...io.flatMap((x) => [x.input, x.computation, x.output]),
  ].join('\n')
}

describe('TFHE scenario: leveled and bootstrapped operations', () => {
  const text = flowText('tfhe-single-hsm')

  it('does not say that every operation or gate is a bootstrap', () => {
    expect(text).not.toMatch(/each TFHE operation is a bootstrap/i)
    expect(text).not.toMatch(/PBS on every op/i)
    expect(text).not.toMatch(
      /every (gate|integer operation|operation)[^.]*(ends in|is) a (programmable )?bootstrap/i
    )
    expect(text).not.toMatch(/linear operations on blocks, each followed by/i)
  })

  it('teaches leveled operations that need no bootstrap next to bootstrapped ones', () => {
    const step = flow('tfhe-single-hsm').steps.find((s) => s.id === 'compute-with-pbs')!
    expect(step.detail).toMatch(/Leveled operations only add noise and use up carry space/)
    expect(step.detail).toMatch(/need no bootstrap/)
    expect(step.detail).toMatch(/programmable bootstrap/)
  })

  it('makes the bootstrap count depend on the API and parameters, with several for complex operations', () => {
    const step = flow('tfhe-single-hsm').steps.find((s) => s.id === 'compute-with-pbs')!
    expect(step.detail).toMatch(/depends on the API flavour, the operation and the parameter set/)
    expect(step.detail).toMatch(/complex integer operation can use several/)
    const catchLine = flow('tfhe-single-hsm').layman.catch
    expect(catchLine).toMatch(/default flavour/i)
    expect(catchLine).toMatch(/several programmable bootstraps and key switches/)
  })

  it('names both evaluation keys: a bootstrapping key and a key-switching key', () => {
    expect(flow('tfhe-single-hsm').layman.whatsDifferent).toMatch(
      /bootstrapping key and a key-switching key/
    )
  })
})

describe('HSM compute-limits scenario: sample profile and untrusted computation', () => {
  const f = flow('hsm-compute-limits')
  const text = flowText('hsm-compute-limits')
  const inHsm = f.steps.find((s) => s.id === 'evaluation-in-hsm')!
  const onCompute = f.steps.find((s) => s.id === 'evaluation-on-accelerators')!

  it('does not say evaluation belongs on GPUs or that an HSM can never hold it', () => {
    expect(text).not.toMatch(/evaluation belongs on GPUs/i)
    expect(text).not.toMatch(/An HSM has neither/)
    expect(text).not.toMatch(/racks of GPUs/)
    expect(text).not.toMatch(/can run anywhere/)
  })

  it('frames the memory and throughput limit as the sample HSM profile, not every HSM', () => {
    expect(f.tagline).toMatch(/sample HSM profile/)
    expect(inHsm.title).toMatch(/sample HSM profile/)
    expect(inHsm.detail).toMatch(/other HSMs differ/)
    expect(inHsm.detail).toMatch(/would change the answer/)
    expect(inHsm.detail).toMatch(/bootstrapping itself was not measured on the token/)
    expect(f.actors.find((a) => a.id === 'hsm')!.sub).toMatch(/sample profile/)
  })

  it('compares CPU, GPU and FPGA compute without declaring one winner', () => {
    expect(onCompute.detail).toMatch(/CPUs, GPUs or FPGAs/)
    expect(onCompute.detail).toMatch(/depends on the scheme, the parameters and the batch size/)
    expect(text).not.toMatch(/GPU-class/)
  })

  it('separates secret-key custody from untrusted computation', () => {
    expect(inHsm.detail).toMatch(/never needs the secret-key custodian/)
    expect(inHsm.detail).toMatch(/no confidentiality because the HSM already holds the secret key/)
    expect(inHsm.detail).not.toMatch(/make the HSM the trusted party/)
    expect(onCompute.detail).toMatch(/only public evaluation keys and ciphertexts/)
  })
})
