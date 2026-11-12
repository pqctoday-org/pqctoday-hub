// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { GPU_BATCH } from '../data/measurements'
import {
  exactLimbExample,
  measuredGpuBatchComparison,
  measuredOffloadPartition,
} from '../data/modelFitExamples'

const integer = (n: bigint) => n.toLocaleString('en-US')

export function GpuFitExample() {
  const [batch, setBatch] = useState(256)
  const comparison = measuredGpuBatchComparison(batch)!
  return (
    <section
      aria-label="Measured GPU workload comparison"
      className="rounded-lg border border-border p-4 space-y-3"
    >
      <h4 className="font-semibold">Test the workload, not a universal GPU verdict</h4>
      <p className="text-sm">{GPU_BATCH.note}</p>
      <FilterDropdown
        label="Measured key-generation batch"
        items={GPU_BATCH.keygen.map((row) => ({
          id: String(row.batch),
          label: row.batch.toLocaleString('en-US'),
        }))}
        selectedId={String(batch)}
        onSelect={(id) => setBatch(Number(id))}
        hideDefaultOption
      />
      <div role="status" className="text-sm" data-testid="gpu-fit-result">
        GPU {comparison.gpu} versus all-core CPU {comparison.cpuAll} million keys/s:{' '}
        {comparison.gpuVsAllCpu.toFixed(2)}× CPU throughput.{' '}
        {comparison.gpuVsAllCpu > 1
          ? 'The GPU wins this measured batch.'
          : 'The all-core CPU wins this measured batch.'}
        <p>
          Computed aggregate batch time: GPU {comparison.gpuBatchMs.toFixed(3)} ms; CPU{' '}
          {comparison.cpuBatchMs.toFixed(3)} ms.
        </p>
      </div>
      <p className="text-sm">
        These are key-generation throughput comparisons, not single-signature latency measurements.
        Batch 1 was not measured here. A single operation can use cooperating threads; launch cost,
        algorithm, kernel partition and workload determine whether that helps.
      </p>
      <a
        className="text-sm underline"
        href="https://docs.nvidia.com/cuda/cupqc/libraries/cupqc_pk/api/operators.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        cuPQC-PK: block-cooperative ML-DSA operations
      </a>
    </section>
  )
}

export function KernelFitExamples() {
  const [example, setExample] = useState<ReturnType<typeof exactLimbExample> | null>(null)
  const partition = measuredOffloadPartition()
  return (
    <section
      aria-label="Kernel support, decomposition and representation"
      className="rounded-lg border border-border p-4 space-y-3 text-sm"
    >
      <h4 className="font-semibold">Three different reasons an offload can fail</h4>
      <div>
        <h5 className="font-semibold">1. Unsupported software path</h5>
        <p>
          NXP documents a TensorFlow Lite Micro model-allocation failure when an example’s operator
          resolver omits a required operator. That is a missing registration in that software
          configuration, not a proof that the chip cannot do the mathematics. Check the actual
          compiler, operator types, resolver and compatible libraries; it does not demonstrate a PQC
          kernel on Neutron.
        </p>
        <a
          className="underline"
          href="https://community.nxp.com/t5/eIQ-Machine-Learning-Software/eIQ-FAQ/ta-p/1099741"
          target="_blank"
          rel="noopener noreferrer"
        >
          NXP eIQ FAQ: supported operators and model registration
        </a>
      </div>
      <div>
        <h5 className="font-semibold">2. A correct partition can still be inefficient</h5>
        <p>
          Splitting a wide product into nine byte-pair products also adds reconstruction and data
          movement; extra operations do not establish a speed-up or a slowdown without the selected
          backend’s costs. The retained KV260 Keccak experiment’s {partition.jobs}-job call costs{' '}
          {partition.offloadUs.toLocaleString('en-US')} µs offloaded versus{' '}
          {partition.cpuUs.toFixed(0)} µs on its A53. A useful operation can lose because of
          partition and transfer cost. This is an FPGA result, not an NPU timing estimate.
        </p>
      </div>
      <div>
        <h5 className="font-semibold">
          3. A restricted representation can be impossible; decomposition can preserve it
        </h5>
        <p>
          One unsigned byte cannot represent every 23-bit value. Several bytes can. Recompose the
          existing ML-DSA modulus example and square it with nine byte-pair products, retaining
          their positional weights.
        </p>
        <Button onClick={() => setExample(exactLimbExample())} variant="outline">
          Recompose the 23-bit example
        </Button>
        {example && (
          <div role="status" data-testid="limb-fit-result" className="mt-2 space-y-1">
            <p>
              q − 1 = {integer(example.value)}; little-endian base-256 limbs: [
              {example.limbs.map(integer).join(', ')}].
            </p>
            <p>
              {example.limbs.map((limb, i) => `${integer(limb)} × 256^${i}`).join(' + ')} ={' '}
              {integer(example.recomposed)}. Exact reconstruction:{' '}
              {example.recomposed === example.value ? 'PASS' : 'FAIL'}.
            </p>
            <p>
              Keeping only the low byte gives {integer(example.oneByteOnly)} and loses the value.
            </p>
            <p>
              {example.partialProducts.length} byte-pair products recompose{' '}
              {integer(example.product)} = (q − 1)²; modulo q gives {integer(example.residue)}.
            </p>
          </div>
        )}
        <p className="mt-2">
          This executed integer example uses unsigned bytes and establishes representation
          correctness only; a backend may require a different supported encoding. A full NTT also
          needs accumulation bounds, carries, modular reduction, supported operators and data
          movement. It does not establish an implemented or fast NPU kernel. TensorFHE’s 2022 paper
          uses segmented arithmetic on NVIDIA GPU tensor cores for FHE; that is a counterexample to
          a width-only impossibility claim, not an i.MX95 implementation.
        </p>
        <a
          className="underline"
          href="https://arxiv.org/pdf/2212.14191"
          target="_blank"
          rel="noopener noreferrer"
        >
          TensorFHE §IV.C: segmentation and fusion
        </a>
      </div>
    </section>
  )
}
