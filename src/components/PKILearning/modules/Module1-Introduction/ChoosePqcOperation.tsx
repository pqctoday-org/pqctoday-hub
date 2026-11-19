// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { equalBytes } from '@noble/ciphers/utils.js'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { Button } from '@/components/ui/button'

const tasks = [
  {
    id: 'archive',
    label: 'Protect a report in transit',
    situation:
      'Two services need a shared secret to start encrypting a fictional report. The recipient key has already been authenticated.',
    operation: 'kem',
    correct: 'ML-KEM supplies the shared secret the services can use to derive encryption keys.',
    incorrect: 'Signing the report does not give the two services a shared encryption secret.',
  },
  {
    id: 'release',
    label: 'Authenticate an update',
    situation:
      'A device has the publisher’s trusted public key. Before installing a fictional update, it needs to check who approved the exact release bytes.',
    operation: 'signature',
    correct: 'ML-DSA lets the device verify the release bytes with the trusted publisher key.',
    incorrect: 'A shared secret with a recipient does not identify the publisher of this update.',
  },
] as const

const choices = [
  { id: 'kem', label: 'ML-KEM', description: 'Establish a shared secret' },
  { id: 'signature', label: 'ML-DSA', description: 'Sign and verify a message' },
] as const

type TaskId = (typeof tasks)[number]['id']
type Operation = (typeof choices)[number]['id']

function checkOperation(operation: Operation): string {
  if (operation === 'kem') {
    const recipient = ml_kem768.keygen()
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(recipient.publicKey)
    const received = ml_kem768.decapsulate(cipherText, recipient.secretKey)
    if (!equalBytes(sharedSecret, received)) throw new Error('Shared secrets differ')
    return 'ML-KEM ran successfully. The sender and recipient obtained the same shared secret.'
  }

  const publisher = ml_dsa65.keygen()
  const message = new TextEncoder().encode('Fictional update: release 1.0')
  const signature = ml_dsa65.sign(message, publisher.secretKey)
  if (!ml_dsa65.verify(signature, message, publisher.publicKey)) {
    throw new Error('The sample signature failed')
  }
  return 'ML-DSA ran successfully. The publisher’s public key verified the signature on the sample bytes.'
}

export function ChoosePqcOperation() {
  const id = useId()
  const [taskId, setTaskId] = useState<TaskId>('archive')
  const [operation, setOperation] = useState<Operation | null>(null)
  const [result, setResult] = useState<{ output: string; fits: boolean } | null>(null)
  const [error, setError] = useState(false)
  const task = tasks.find((item) => item.id === taskId) ?? tasks[0]

  const run = () => {
    if (operation === null) return
    setError(false)
    setResult(null)
    try {
      setResult({ output: checkOperation(operation), fits: operation === task.operation })
    } catch {
      setError(true)
    }
  }

  return (
    <section aria-labelledby={id} className="space-y-3 rounded-lg border border-border p-4">
      <h3 id={id} className="font-semibold text-foreground">
        Choose the cryptographic operation
      </h3>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-medium">What are you trying to do?</legend>
        {tasks.map((item) => (
          <Button
            key={item.id}
            variant="outline"
            aria-pressed={item.id === taskId}
            className="h-auto min-h-10 whitespace-normal aria-pressed:border-primary aria-pressed:bg-primary/10"
            onClick={() => {
              setTaskId(item.id)
              setOperation(null)
              setResult(null)
              setError(false)
            }}
          >
            {item.label}
          </Button>
        ))}
      </fieldset>
      <p className="text-sm text-muted-foreground">{task.situation}</p>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Which operation fits?</legend>
        {choices.map((choice) => (
          <label key={choice.id} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={id}
              checked={operation === choice.id}
              onChange={() => {
                setOperation(choice.id)
                setResult(null)
                setError(false)
              }}
            />
            {choice.label} — {choice.description}
          </label>
        ))}
      </fieldset>
      <Button onClick={run} disabled={operation === null}>
        Run the sample operation
      </Button>
      {error && (
        <p role="alert" className="text-sm text-status-error">
          The sample operation failed. Try again.
        </p>
      )}
      <div role="status" aria-label="Operation result" className="space-y-1 text-sm">
        {result && (
          <>
            <p>{result.output}</p>
            <p className="font-semibold">
              {result.fits ? 'Fits this task.' : 'Choose a different operation.'}
            </p>
            <p>{result.fits ? task.correct : task.incorrect}</p>
          </>
        )}
      </div>
    </section>
  )
}
