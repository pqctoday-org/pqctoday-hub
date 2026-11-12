// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Cpu } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { CURRENT_QUANTUM_COMPUTERS, type AlgorithmSecurityData } from '../data/quantumConstants'

type Choice = 'progress' | 'ratio' | 'scope'
const CHOICES: { id: Choice; text: string }[] = [
  {
    id: 'progress',
    text: 'Divide the physical count by the algorithm’s logical count to measure attack progress.',
  },
  {
    id: 'ratio',
    text: 'Multiply the algorithm’s logical count by this experiment’s physical/logical ratio to obtain the physical hardware required for the attack.',
  },
  {
    id: 'scope',
    text: 'Keep physical and logical units separate. Experimental and algorithm-model logical counts share a unit, but their error, circuit and architecture conditions must match before inferring attack capacity.',
  },
]
const keyFor = (q: (typeof CURRENT_QUANTUM_COMPUTERS)[number]) => `${q.vendor}:${q.name}:${q.year}`

/** Local answered diagnostic only: no learner-store, progress or engine side effects. */
export function QubitComparisonDiagnostic({ algorithm }: { algorithm: AlgorithmSecurityData }) {
  const radioName = useId()
  const [machineId, setMachineId] = useState(() => {
    const first =
      CURRENT_QUANTUM_COMPUTERS.find((q) => q.name === 'Willow') ?? CURRENT_QUANTUM_COMPUTERS[0]
    return first ? keyFor(first) : ''
  })
  const [answer, setAnswer] = useState<{
    algorithm: string
    machine: string
    choice: Choice
    submitted: boolean
  } | null>(null)
  const machine = CURRENT_QUANTUM_COMPUTERS.find((q) => keyFor(q) === machineId)
  const current =
    answer?.algorithm === algorithm.name && answer.machine === machineId ? answer : null
  const hasRequirement = algorithm.estimatedQubits !== null
  if (!machine) return null
  const hasLogical = machine.estimatedLogicalQubits > 0
  const select = (choice: Choice) =>
    setAnswer({ algorithm: algorithm.name, machine: machineId, choice, submitted: false })
  const algorithmLinks = [...algorithm.notes.matchAll(/arXiv:(\d{4}\.\d{4,5})/g)].map(
    (m) => `https://arxiv.org/abs/${m[1]}`
  )
  if (algorithm.name.startsWith('RSA-')) algorithmLinks.unshift('https://arxiv.org/abs/2505.15917')
  const hardwareLinks = [...machine.notes.matchAll(/arXiv:(\d{4}\.\d{4,5})/g)].map(
    (m) => `https://arxiv.org/abs/${m[1]}`
  )
  if (machine.name === 'Willow')
    hardwareLinks.unshift('https://research.google/blog/making-quantum-error-correction-work/')

  return (
    <section
      aria-label="Qubit quantities worked comparison"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-4"
    >
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Cpu className="h-4 w-4 text-primary" />
        Compare quantities and source conditions
      </h4>
      <p className="text-xs text-muted-foreground">
        Use these dated records to decide which figures are comparable. A hardware experiment is not
        a cryptanalytic capacity test; no machine-specific attack requirement or attack time is
        calculated here.
      </p>
      <FilterDropdown
        label="Select Hardware Record"
        items={CURRENT_QUANTUM_COMPUTERS.map((q) => ({
          id: keyFor(q),
          label: `${q.vendor} ${q.name} (${q.year})`,
        }))}
        selectedId={machineId}
        onSelect={setMachineId}
        hideDefaultOption
        noContainer
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className="rounded border border-border p-3"
          role="group"
          aria-label="Recorded physical qubits"
        >
          <h5 className="text-xs font-semibold">Hardware physical count</h5>
          <p className="font-bold text-primary">
            {machine.physicalQubits.toLocaleString('en-US')} physical qubits
          </p>
          <p className="text-xs text-muted-foreground">
            {machine.vendor} {machine.name} · {machine.year} · {machine.qubitType}
          </p>
        </div>
        <div
          className="rounded border border-border p-3"
          role="group"
          aria-label="Recorded experimental logical qubits"
        >
          <h5 className="text-xs font-semibold">Experimental logical count</h5>
          <p className="font-bold text-foreground">
            {hasLogical
              ? `~${machine.estimatedLogicalQubits.toLocaleString('en-US')} experimental logical ${machine.estimatedLogicalQubits === 1 ? 'qubit' : 'qubits'}`
              : 'No fault-tolerant logical count reported (NISQ)'}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasLogical
              ? 'A reported experiment under its own code and error conditions, not a ready-to-run attack resource.'
              : 'No reported logical count is not zero error-correction overhead or a zero-qubit attack requirement.'}
          </p>
        </div>
        <div
          className="rounded border border-border p-3"
          role="group"
          aria-label="Algorithm model logical qubits"
        >
          <h5 className="text-xs font-semibold">Algorithm logical-count model</h5>
          <p className="font-bold text-foreground">
            {hasRequirement
              ? `~${algorithm.estimatedQubits!.toLocaleString('en-US')} model logical qubits`
              : 'No logical-qubit attack estimate supplied for this algorithm'}
          </p>
          <p className="text-xs text-muted-foreground">
            {algorithm.name}: read the model’s circuit and source assumptions above. This is not
            this machine’s physical requirement.
          </p>
          {Array.from(new Set(algorithmLinks)).map((url, i) => (
            <a
              key={url}
              className="block text-xs text-primary underline"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Algorithm source {i + 1}
            </a>
          ))}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-semibold">
          Hardware record year: {machine.year} — notes and source context
        </p>
        <p>{machine.notes}</p>
        {Array.from(new Set(hardwareLinks)).map((url, i) => (
          <a
            key={url}
            className="block text-primary underline"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Hardware source {i + 1}
          </a>
        ))}
      </div>
      {hasRequirement ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold mb-2">
            Which conclusion follows from these reported values alone?
          </legend>
          {CHOICES.map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-2 rounded border border-border p-3 text-xs cursor-pointer"
            >
              <input
                type="radio"
                name={radioName}
                value={option.id}
                checked={current?.choice === option.id}
                onChange={() => select(option.id)}
                className="mt-0.5"
              />
              <span>{option.text}</span>
            </label>
          ))}
          <Button
            disabled={!current}
            onClick={() => current && setAnswer({ ...current, submitted: true })}
          >
            Check comparison
          </Button>
          {current?.submitted && (
            <div role="status" className="rounded border border-border p-3 text-xs space-y-2">
              <p className="font-semibold">
                {current.choice === 'scope'
                  ? 'Correct: compare units and source conditions.'
                  : 'Try again: these counts do not establish that inference.'}
              </p>
              {current.choice === 'progress' ? (
                <p>
                  {machine.physicalQubits.toLocaleString('en-US')} physical qubits and{' '}
                  {algorithm.estimatedQubits!.toLocaleString('en-US')} model logical qubits use
                  different units. Their quotient is not an attack-progress percentage.
                </p>
              ) : current.choice === 'ratio' ? (
                <p>
                  An encoding ratio from this experiment is not a circuit-, error- and
                  architecture-specific attack model. Multiplying it by the listed algorithm count
                  would invent a machine-specific requirement.
                </p>
              ) : (
                <p>
                  {hasLogical
                    ? `The recorded ~${machine.estimatedLogicalQubits} experimental logical ${machine.estimatedLogicalQubits === 1 ? 'qubit' : 'qubits'} and ~${algorithm.estimatedQubits!.toLocaleString('en-US')} model logical qubits share a unit, but not necessarily the required logical error, gate set, circuit depth or code/architecture conditions.`
                    : 'This NISQ record supplies no fault-tolerant logical count. Keep that missing quantity distinct from zero overhead.'}{' '}
                  A physical attack-resource claim needs those conditions and a complete attack
                  circuit, not just a qubit count.
                </p>
              )}
              <p>
                Use the cited experiment and algorithm resource analysis to identify matching
                assumptions before drawing a capability conclusion. This answer checks your
                interpretation of these records; it does not verify a deployed system or a machine’s
                attack capability.
              </p>
            </div>
          )}
        </fieldset>
      ) : (
        <p className="text-xs text-muted-foreground">
          Select an algorithm with a listed logical-qubit estimate to answer the comparison. An
          absent estimate is not zero.
        </p>
      )}
    </section>
  )
}
