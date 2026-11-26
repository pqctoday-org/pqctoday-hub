// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'

export function CatalogReleaseCheck({ version }: { version: string }) {
  const id = useId()
  const [deployed, setDeployed] = useState('')
  const recorded = version.trim()
  const candidate = deployed.trim()
  if (!recorded) return null

  return (
    <details className="space-y-2 rounded-2xl border border-border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Compare your deployed version</summary>
      <p>
        Catalogue release <strong>{recorded}</strong>
      </p>
      <label htmlFor={id} className="block font-medium">
        Deployed version
      </label>
      <Input id={id} value={deployed} onChange={(event) => setDeployed(event.target.value)} />
      <p role="status">
        {!candidate
          ? 'Enter the version string reported by the application.'
          : candidate === recorded
            ? 'Release label matches. Check the linked evidence for your build, enabled provider and protocol profile.'
            : 'Different release. This catalogue record leaves support for the deployed version unverified.'}
      </p>
    </details>
  )
}
