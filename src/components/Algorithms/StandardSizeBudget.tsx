// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { type AlgorithmDetail, algorithmSizeBytes } from '@/data/pqcAlgorithmsData'

const sources = {
  'FIPS 203': {
    label: 'FIPS 203 Table 3',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf',
    output: 'ciphertext',
  },
  'FIPS 204': {
    label: 'FIPS 204 Table 2',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
    output: 'signature',
  },
  'FIPS 205': {
    label: 'FIPS 205 Table 2 and Algorithm 18',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf',
    output: 'signature',
  },
}

export function StandardSizeBudget({ algorithm }: { algorithm: AlgorithmDetail }) {
  if (
    algorithm.fipsStandard !== 'FIPS 203' &&
    algorithm.fipsStandard !== 'FIPS 204' &&
    algorithm.fipsStandard !== 'FIPS 205'
  )
    return null

  const bytes = algorithmSizeBytes(algorithm, 'signatureOrCiphertext')
  if (bytes === null) return null
  return <SizeBudget bytes={bytes} reference={sources[algorithm.fipsStandard]} />
}

function SizeBudget({
  bytes,
  reference,
}: {
  bytes: number
  reference: (typeof sources)[keyof typeof sources]
}) {
  const [input, setInput] = useState('')
  const budget = /^\d+$/.test(input) ? Number(input) : NaN
  const hasBudget = Number.isSafeInteger(budget)
  const remainder = budget - bytes
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/20 p-3">
      <p className="text-sm text-muted-foreground">
        Compare one raw {reference.output} with the receiving buffer. Allow separately for protocol
        framing, container encoding and other fields.
      </p>
      <label className="block text-sm font-medium">
        Receiving buffer (bytes)
        <input
          type="text"
          inputMode="numeric"
          className="mt-1 block min-h-11 w-full max-w-64 rounded-md border border-border bg-background px-3"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      <p role="status" className="text-sm">
        {input && !hasBudget && 'Enter a whole number of bytes.'}
        {hasBudget &&
          (remainder < 0
            ? `The raw ${reference.output} exceeds the buffer by ${-remainder} ${remainder === -1 ? 'byte' : 'bytes'}.`
            : `The raw ${reference.output} fits. ${remainder} ${remainder === 1 ? 'byte remains' : 'bytes remain'}.`)}
      </p>
      <a
        className="text-sm text-primary underline"
        href={reference.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {reference.label}
      </a>
    </div>
  )
}
