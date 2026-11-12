// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import {
  evaluateNssRequirement,
  NSS_SOURCE,
  NSS_WORKED_CASES,
  type NssSelection,
} from '../data/nssWorkedCases'

const LABELS = {
  match: 'Matches selected algorithm requirement',
  'does-not-match': 'Does not match selected algorithm requirement',
  'needs-input': 'More input needed',
  'not-applicable': 'Selected NSS requirement not applicable',
  'not-evaluated': 'Requirement not evaluated',
}
const ALGORITHMS = ['ML-KEM', 'ML-DSA', 'FrodoKEM', 'PQC family', 'Kyber', 'Dilithium', 'SLH-DSA']

function SelectionControl({
  title,
  name,
  value,
  items,
  onSelect,
}: {
  title: string
  name: string
  value: string | null
  items: (string | FilterDropdownItem)[]
  onSelect: (value: string | null) => void
}) {
  return (
    <div className="min-w-0 space-y-1 text-sm">
      <p>{title}</p>
      <FilterDropdown
        ariaLabel={name}
        items={[{ id: 'missing', label: 'Not provided' }, ...items]}
        selectedId={value ?? 'missing'}
        onSelect={(id) => onSelect(id === 'missing' ? null : id)}
        hideDefaultOption
        defaultIcon={null}
        className="w-full"
        noContainer
      />
    </div>
  )
}

function WorkedCase({ example }: { example: (typeof NSS_WORKED_CASES)[number] }) {
  const [selection, setSelection] = useState<NssSelection>(() => ({ ...example.initial }))
  const result = evaluateNssRequirement(example.id, selection)
  return (
    <section aria-label={example.title} className="glass-panel min-w-0 p-4 space-y-3">
      <h4 className="font-semibold">{example.title}</h4>
      <p className="text-sm">
        Declared scope: US national security system (NSS). Operation: {example.initial.operation}.
        Selected requirement: {example.requirement}.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectionControl
          title="Algorithm"
          name={`${example.title} algorithm`}
          value={selection.algorithm}
          items={ALGORITHMS}
          onSelect={(algorithm) => setSelection({ ...selection, algorithm })}
        />
        <SelectionControl
          title="Parameter set"
          name={`${example.title} parameter set`}
          value={selection.parameter}
          items={[...example.parameterOptions]}
          onSelect={(parameter) => setSelection({ ...selection, parameter })}
        />
        <SelectionControl
          title="Composition"
          name={`${example.title} composition`}
          value={selection.composition}
          items={[
            { id: 'standalone', label: 'Standalone' },
            { id: 'hybrid', label: 'Generic hybrid; arrangement unspecified' },
          ]}
          onSelect={(id) =>
            setSelection({
              ...selection,
              composition: id === 'standalone' ? 'standalone' : id === 'hybrid' ? 'hybrid' : null,
            })
          }
        />
        {example.initial.operation === 'software signing' && (
          <SelectionControl
            title="Signature variant"
            name={`${example.title} signature variant`}
            value={selection.variant}
            items={[
              { id: 'pure', label: 'Pure ML-DSA' },
              { id: 'HashML-DSA', label: 'HashML-DSA (prehash)' },
            ]}
            onSelect={(variant) => setSelection({ ...selection, variant })}
          />
        )}
      </div>
      <div role="status" aria-live="polite" className="rounded border border-border p-3 text-sm">
        <strong>{LABELS[result.status]}</strong>
        <p className="mt-1">{result.reason}</p>
      </div>
    </section>
  )
}

export function NssWorkedCases() {
  return (
    <section aria-label="Named NSS algorithm worked cases" className="space-y-3">
      <h3 className="font-semibold">Two fictional US NSS worked cases</h3>
      <p className="text-sm text-muted-foreground">
        Compare explicit algorithm requirements by operation, parameter set and composition. Change
        a parameter to see a mismatch or remove it to see the missing input. These two cases are not
        the complete CNSA suite and do not assign NSS scope to your imported risk entries.
      </p>
      <p className="text-xs text-muted-foreground">
        <a
          className="text-primary underline"
          href={NSS_SOURCE.url}
          target="_blank"
          rel="noreferrer"
        >
          {NSS_SOURCE.title}
        </a>{' '}
        — {NSS_SOURCE.pages}.
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        {NSS_WORKED_CASES.map((example) => (
          <WorkedCase key={example.id} example={example} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        In your production tools, look for versioned requirements matched to explicit scope,
        operation, parameters and composition. Keep implementation validation and the supported
        protocol arrangement as separate evidence. This sample compares declared fields; it does not
        execute cryptography or verify a deployment.
      </p>
    </section>
  )
}
