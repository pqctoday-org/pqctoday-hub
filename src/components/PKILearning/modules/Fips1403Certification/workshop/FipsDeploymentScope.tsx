// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'

const scope = {
  version: '2.4.1',
  environment: 'Debian 12 on x86-64',
  mode: 'Approved mode',
}

const fields = [
  { id: 'version', label: 'Module version', options: [scope.version, '2.5.0'] },
  {
    id: 'environment',
    label: 'Operational environment',
    options: [scope.environment, 'Debian 12 on ARM64'],
  },
  { id: 'mode', label: 'Mode of operation', options: [scope.mode, 'General-purpose mode'] },
] as const

export function FipsDeploymentScope() {
  const id = useId()
  const [deployment, setDeployment] = useState(scope)
  const [assessed, setAssessed] = useState(false)
  const differences = fields.filter((field) => deployment[field.id] !== scope[field.id])

  return (
    <section aria-labelledby={id} className="space-y-3 rounded-lg border border-border p-4">
      <h3 id={id} className="font-semibold text-foreground">
        Check whether the validation record covers a deployment
      </h3>
      <p className="text-sm text-muted-foreground">
        Compare a proposed deployment with the fictional record below. Then change the operational
        environment and decide whether this record supports the same claim.
      </p>
      <div className="space-y-1 rounded-md bg-muted/50 p-3 text-sm">
        <h4 className="font-medium">Fictional Arden software cryptographic module</h4>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {fields.map((field) => (
            <div key={field.id}>
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd>{scope[field.id]}</dd>
            </div>
          ))}
        </dl>
      </div>
      <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium">Proposed deployment</legend>
        {fields.map((field) => (
          <div key={field.id} className="min-w-0">
            <label htmlFor={`${id}-${field.id}`} className="block text-xs font-medium">
              {field.label}
            </label>
            {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright selectOption tests */}
            <select
              id={`${id}-${field.id}`}
              value={deployment[field.id]}
              onChange={(event) => {
                setDeployment({ ...deployment, [field.id]: event.target.value })
                setAssessed(false)
              }}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>
      <Button onClick={() => setAssessed(true)}>Compare with the record</Button>
      <div role="status" aria-label="Deployment scope result" className="space-y-1 text-sm">
        {assessed && (
          <>
            <p className="font-medium">
              {differences.length === 0
                ? 'The deployment matches the tested configuration in this record.'
                : 'The record does not establish coverage for this deployment.'}
            </p>
            {differences.length > 0 && (
              <ul className="list-disc pl-5 text-muted-foreground">
                {differences.map((field) => (
                  <li key={field.id}>
                    {field.label} differs. The record lists {scope[field.id]}.
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted-foreground">
              {differences.some((field) => field.id === 'environment')
                ? 'For an environment outside the tested list, check the security policy and whether CMVP porting or affirmation rules apply. Retain the evidence for any separate claim.'
                : 'In procurement, confirm the published certificate status, the module’s security policy and any caveats.'}
            </p>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Read how to identify a tested configuration in the{' '}
        <a
          href="https://csrc.nist.gov/Projects/cryptographic-module-validation-program/validated-modules/search"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          CMVP database
        </a>{' '}
        and check the porting rules in the{' '}
        <a
          href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/cmvp-fips-140-3-management-manual"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          CMVP management manual
        </a>
        .
      </p>
    </section>
  )
}
