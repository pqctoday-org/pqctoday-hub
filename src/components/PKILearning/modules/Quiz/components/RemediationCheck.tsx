// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FollowUp {
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

const followUps = new Map<string, FollowUp>([
  [
    'fund-002',
    {
      prompt:
        'A recording must stay confidential for 20 years. Why protect it before a capable quantum computer exists?',
      options: [
        'Someone can store the ciphertext now and decrypt it later.',
        'The recording becomes vulnerable only if it is captured after that computer exists.',
      ],
      correctIndex: 0,
      explanation:
        'A captured copy can outlive the original system. Use the time the recording must stay secret when deciding when to migrate.',
    },
  ],
  [
    'fund-010',
    {
      prompt:
        'A procurement deadline passes without any demonstrated break of a widely used public-key algorithm. Has that deadline itself established Q-Day?',
      options: [
        'Yes, the deadline establishes Q-Day.',
        'No, Q-Day refers to the hypothetical cryptographic break.',
      ],
      correctIndex: 1,
      explanation:
        'A migration deadline can require action ahead of a possible break. It does not establish when a break will occur.',
    },
  ],
  [
    'fund-011',
    {
      prompt:
        'A colleague enters the survey’s upper estimate as the chance that your organization will suffer a breach within ten years. What should you correct?',
      options: [
        'Use it as an expert estimate about CRQC arrival.',
        'Keep it as the probability of a breach at our organization.',
      ],
      correctIndex: 0,
      explanation:
        'The survey concerns a quantum computing capability. A breach estimate also depends on your assets, exposure and controls.',
    },
  ],
  [
    'algo-006',
    {
      prompt:
        'A device update needs proof of who signed it. Which primitive should verify that signature?',
      options: ['ML-KEM', 'ML-DSA'],
      correctIndex: 1,
      explanation: 'ML-DSA verifies signatures. ML-KEM lets peers establish a shared secret.',
    },
  ],
])

export function RemediationCheck({ questionId }: { questionId: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  const check = followUps.get(questionId)
  if (!check) return null
  const passed = selected === check.correctIndex

  return (
    <details className="mt-3">
      <summary className="cursor-pointer font-semibold">
        Try the same concept in a new example
      </summary>
      <fieldset className="mt-2 min-w-0 space-y-2">
        <legend className="mb-2 text-sm">{check.prompt}</legend>
        {check.options.map((option, index) => (
          <Button
            key={option}
            type="button"
            className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
            variant="outline"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            {option}
          </Button>
        ))}
      </fieldset>
      <p role="status" className="mt-2 text-sm">
        {selected !== null && (passed ? 'Correct. ' : 'Try again. ')}
        {selected !== null && check.explanation}
      </p>
      <p className="text-xs text-muted-foreground">
        Practice answers leave your quiz score as recorded.
      </p>
    </details>
  )
}
