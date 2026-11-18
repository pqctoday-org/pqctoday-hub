// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import {
  buildCbomDocument,
  downloadCbomJson,
  type CbomAlgorithm,
  type CbomComponentInput,
} from '@/services/cbom/cycloneDx'

const service: CbomComponentInput = {
  type: 'application',
  name: 'Sample update service',
  bomRef: 'sample-update-service',
}

const versions: { version: string; algorithm: CbomAlgorithm }[] = [
  {
    version: '1.0',
    algorithm: {
      canonical: 'ECDSA',
      primitive: 'signature',
      ellipticCurve: 'nist/P-256',
      classical: true,
    },
  },
  {
    version: '2.0',
    algorithm: {
      canonical: 'ML-DSA',
      primitive: 'signature',
      parameterSet: 'ML-DSA-65',
      securityCategory: 3,
    },
  },
]

export function DependencyReconciliation() {
  const [version, setVersion] = useState('1.0')
  const baseline = versions[0]
  const observed = versions.find((entry) => entry.version === version) ?? baseline
  const observedName = observed.algorithm.parameterSet ?? observed.algorithm.canonical

  function download() {
    const library: CbomComponentInput = {
      type: 'library',
      name: 'Sample signing library',
      version: observed.version,
      bomRef: `sample-signing-library@${observed.version}`,
      algorithms: [observed.algorithm],
    }
    const { json } = buildCbomDocument([service, library], { toolName: 'CBOM workshop sample' })
    const document = {
      ...JSON.parse(json),
      dependencies: [
        { ref: service.bomRef, dependsOn: [library.bomRef] },
        { ref: library.bomRef, dependsOn: [] },
      ],
    }
    downloadCbomJson(JSON.stringify(document, null, 2), 'workshop-signing-dependency')
  }

  return (
    <section className="glass-panel space-y-3 p-4" aria-label="Reconcile a signing dependency">
      <h3 className="font-semibold">Reconcile a signing dependency</h3>
      <p className="text-sm text-muted-foreground">
        The fictional update service delegates signing to a library. Its baseline inventory was
        collected against version 1.0 and declares ECDSA P-256. Compare it with the declaration for
        the observed version.
      </p>
      <FilterDropdown
        label="Observed library version"
        items={versions.map((entry) => entry.version)}
        selectedId={version}
        onSelect={setVersion}
        hideDefaultOption
      />
      <div role="status" className="space-y-1 text-sm">
        <p>
          {service.name} depends on Sample signing library {observed.version}. That version declares{' '}
          {observedName}
          {observed.algorithm.ellipticCurve ? ' P-256' : ''}.
        </p>
        <p>
          {observed === baseline
            ? 'The version and declared signature match the baseline inventory.'
            : 'Replace the dependency version and its ECDSA entry with the observed version and ML-DSA-65. Check that update verifiers accept the new signatures before rollout.'}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={download}>
        Download reconciled CBOM
      </Button>
    </section>
  )
}
