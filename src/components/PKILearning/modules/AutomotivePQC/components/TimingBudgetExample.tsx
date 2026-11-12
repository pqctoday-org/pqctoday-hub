// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { ALGORITHM_THROUGHPUT, AUTOMOTIVE_TIMING_BASIS } from '../data/sensorFusionData'
import { AUTOMOTIVE_FUNCTIONS } from '../data/safetyCryptoData'

/** Existing ML-DSA-44 input and braking budget; learner supplies the other pipeline work. */
export function TimingBudgetExample() {
  const primitive = ALGORITHM_THROUGHPUT.find((row) => row.algorithm === 'ML-DSA-44')!
  const budget = AUTOMOTIVE_FUNCTIONS.find((row) => row.id === 'braking')!.maxVerificationMs
  const [otherMs, setOtherMs] = useState('')
  const other = otherMs.trim() === '' ? null : Number(otherMs)
  const valid = other !== null && Number.isFinite(other) && other >= 0
  const total = valid ? primitive.verificationTimeMs + other : null
  return (
    <section className="glass-panel p-4 space-y-3" aria-label="Worked verification budget">
      <h3 className="font-bold">Worked verification budget</h3>
      <p>{AUTOMOTIVE_TIMING_BASIS}</p>
      <p>
        ML-DSA-44 verification input: {primitive.verificationTimeMs} ms. Existing braking example
        budget: {budget} ms. Remaining allowance for parsing, hashing, I/O, scheduling and other
        work = {budget} − {primitive.verificationTimeMs} ={' '}
        {(budget - primitive.verificationTimeMs).toFixed(1)} ms.
      </p>
      <label className="block">
        Other pipeline time (ms, your declared input)
        <input
          type="number"
          min="0"
          step="0.1"
          value={otherMs}
          onChange={(event) => setOtherMs(event.target.value)}
          className="block rounded border border-border bg-background p-2"
        />
      </label>
      <p role="status" aria-label="Pipeline budget comparison">
        {total === null
          ? 'Enter a finite non-negative other-work input to compare the full declared pipeline.'
          : `Declared total: ${primitive.verificationTimeMs} + ${other} = ${total.toFixed(1)} ms; ${total <= budget ? 'within' : 'exceeds'} the ${budget} ms example budget.`}
      </p>
      <p>
        Measure the complete pipeline and its worst-case execution time on your own target ECU,
        including hardware, compiler/build, inputs, load and interruption conditions. A calculation
        from declared inputs is not a measured WCET or a safety conclusion.
      </p>
    </section>
  )
}
