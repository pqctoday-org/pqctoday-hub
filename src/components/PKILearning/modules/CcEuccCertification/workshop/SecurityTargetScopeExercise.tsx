// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SECURITY_TARGET_SCOPE_EXAMPLES } from '../data/securityTargetScopeExamples'

const choices = [
  ['supported', 'Supported'],
  ['not-supported', 'Contradicted by the stated scope'],
  ['not-established', 'Not established by the reviewed evidence'],
] as const

export function SecurityTargetScopeExercise() {
  const id = useId()
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState('')
  const [checked, setChecked] = useState(false)
  const example = SECURITY_TARGET_SCOPE_EXAMPLES[index]
  return (
    <details className="glass-panel p-5 space-y-4">
      <summary className="font-semibold cursor-pointer">
        Read the exact Security Target scope
      </summary>
      <p className="text-sm">
        Compare {SECURITY_TARGET_SCOPE_EXAMPLES.length} claims about evaluated products. Read the
        linked pages, predict the verdict, then check your interpretation.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Security Target example">
        {SECURITY_TARGET_SCOPE_EXAMPLES.map((item, itemIndex) => (
          <Button
            key={item.id}
            size="sm"
            variant="outline"
            aria-pressed={index === itemIndex}
            onClick={() => {
              setIndex(itemIndex)
              setChoice('')
              setChecked(false)
            }}
          >
            Example {itemIndex + 1}
          </Button>
        ))}
      </div>
      <p className="font-medium">{example.product}</p>
      <p className="text-sm">{example.stVersion}</p>
      <a
        className="text-primary underline text-sm"
        href={example.source}
        target="_blank"
        rel="noopener noreferrer"
      >
        Source document — PDF pages {example.pages}
      </a>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium mb-2">{example.claim}</legend>
        {choices.map(([value, label]) => (
          <label key={value} className="flex gap-2 text-sm items-start">
            <input
              type="radio"
              name={`${id}-verdict`}
              value={value}
              checked={choice === value}
              onChange={() => {
                setChoice(value)
                setChecked(false)
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <Button disabled={!choice} onClick={() => setChecked(true)}>
        Check interpretation
      </Button>
      <div
        role="status"
        aria-label="Security Target interpretation"
        aria-live="polite"
        className="text-sm"
      >
        {checked && (
          <p>
            <strong>{choice === example.verdict ? 'Correct. ' : 'Review the scope. '}</strong>
            {example.explanation}
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Transfer the method: require your production tools to retain the target version, platform,
        operation, profile, assurance boundary and source pages. Ask what evidence would change your
        verdict. Neither a product-family label nor completing this exercise verifies a deployment.
      </p>
    </details>
  )
}
