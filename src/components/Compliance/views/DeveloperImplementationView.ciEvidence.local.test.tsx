// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  cpSync,
  symlinkSync,
  readFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CI_GATE_YAML, DeveloperImplementationView } from './DeveloperImplementationView'
import { buildCbomDocument } from '@/services/cbom/cycloneDx'

// Execute the exact copyable workflow block, not a parallel implementation.
const program = CI_GATE_YAML.split('        run: |\n')[1]
  .split('\n')
  .map((line) => line.replace(/^ {10}/, ''))
  .join('\n')
const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})
function run(
  input?: unknown,
  mode: 'normal' | 'missing-tool' | 'tool-error' | 'missing-schema' | 'unknown-format' = 'normal'
) {
  const dir = mkdtempSync(join(tmpdir(), 'inventory-review-example-'))
  dirs.push(dir)
  const schemaDir = join(dir, 'src/services/cbom/schema')
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- schema fixture path under this test's mkdtemp directory
  mkdirSync(schemaDir, { recursive: true })
  cpSync(resolve('src/services/cbom/schema'), schemaDir, { recursive: true })
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- link existing tools inside this test's disposable fixture
  symlinkSync(resolve('node_modules'), join(dir, 'node_modules'), 'dir')
  if (mode === 'missing-schema') rmSync(join(schemaDir, 'cryptography-defs.schema.json'))
  if (mode === 'unknown-format') {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- modifies only the copied disposable schema fixture
    const schema = JSON.parse(readFileSync(join(schemaDir, 'bom-1.7.schema.json'), 'utf8'))
    schema.properties.serialNumber.format = 'unconfigured-sample-format'
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- modifies only the copied disposable schema fixture
    writeFileSync(join(schemaDir, 'bom-1.7.schema.json'), JSON.stringify(schema))
  }
  if (input !== undefined)
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed fixture name inside this test's mkdtemp directory
    writeFileSync(join(dir, 'cbom.json'), typeof input === 'string' ? input : JSON.stringify(input))
  let path = process.env.PATH ?? ''
  if (mode === 'missing-tool') path = dir
  if (mode === 'tool-error') {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed mock-tool name inside this test's mkdtemp directory
    writeFileSync(
      join(dir, 'jq'),
      '#!/bin/sh\necho "controlled jq evaluation failure" >&2\nexit 3\n',
      { mode: 0o755 }
    )
    path = dir + ':' + path
  }
  const result = spawnSync(
    '/bin/bash',
    ['--noprofile', '--norc', '-eo', 'pipefail', '-c', program],
    {
      cwd: dir,
      env: { ...process.env, PATH: path },
      encoding: 'utf8',
    }
  )
  return { status: result.status, output: result.stdout + result.stderr }
}
function asset(family?: string, name = 'Fictional algorithm') {
  return {
    type: 'cryptographic-asset',
    'bom-ref': 'sample-' + name,
    name,
    cryptoProperties: {
      assetType: 'algorithm',
      algorithmProperties: {
        primitive: 'signature',
        executionEnvironment: 'unknown',
        ...(family ? { algorithmFamily: family } : {}),
        implementationPlatform: 'armv8-a',
        cryptoFunctions: ['sign'],
      },
    },
  }
}
function bom(components: unknown[]) {
  return { bomFormat: 'CycloneDX', specVersion: '1.7', version: 1, components }
}

describe('copyable limited inventory-evidence review', () => {
  it('copies exactly the same YAML that the reader sees', async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    try {
      render(
        <MemoryRouter>
          <DeveloperImplementationView
            profileOverride={{
              industry: 'Technology',
              country: 'United States',
              region: 'americas',
            }}
          />
        </MemoryRouter>
      )
      const code = screen.getByText(/# .github\/workflows\/pqc-inventory-review.yml/, {
        selector: 'code',
      })
      expect(code).toHaveTextContent(CI_GATE_YAML, { normalizeWhitespace: false })
      fireEvent.click(screen.getByRole('button', { name: 'Copy CI gate YAML' }))
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(CI_GATE_YAML))
    } finally {
      if (previous) Object.defineProperty(navigator, 'clipboard', previous)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })
  it('has the existing jq prerequisite and an exact executable block', () => {
    expect(
      spawnSync('jq', ['--version'], { encoding: 'utf8' }).status,
      'existing jq runtime required for local compatibility checks'
    ).toBe(0)
    expect(program).toContain('set -eu')
    expect(CI_GATE_YAML).not.toContain('npx')
    expect(CI_GATE_YAML).not.toContain('cyclonedx-cli')
  })
  it.each([
    { ...bom([asset('ML-DSA')]), unexpected: true },
    { ...bom([asset('ML-DSA')]), version: 'one' },
    bom([{ type: 'cryptographic-asset', cryptoProperties: asset('ML-DSA').cryptoProperties }]),
    { ...bom([asset('ML-DSA')]), metadata: { timestamp: 'not-a-date-time' } },
    bom([
      {
        ...asset('ML-DSA'),
        cryptoProperties: {
          assetType: 'algorithm',
          algorithmProperties: { primitive: 'not-a-primitive', algorithmFamily: 'ML-DSA' },
        },
      },
    ]),
    bom([
      {
        ...asset('ML-DSA'),
        cryptoProperties: {
          assetType: 'algorithm',
          algorithmProperties: {
            primitive: 'signature',
            algorithmFamily: 'ML-DSA',
            nistQuantumSecurityLevel: 99,
          },
        },
      },
    ]),
  ])('rejects schema-invalid data before declaring no targeted findings', (input) => {
    const result = run(input)
    expect(result.status).toBe(2)
    expect(result.output).toContain('CycloneDX 1.7 schema invalid')
    expect(result.output).not.toContain('No targeted findings')
  })
  it.each(['RSAES-OAEP', 'RSAES-PKCS1', 'RSASSA-PKCS1', 'RSASSA-PSS', 'ECDSA', 'ECDH'])(
    'reports a structured %s record for review even with an unknown execution environment',
    (family) => {
      const result = run(bom([asset(family)]))
      expect(result.status).toBe(1)
      expect(result.output).toContain('Recorded algorithm-family review items')
      expect(result.output).toContain(family)
    }
  )
  it.each(['ML-KEM', 'ML-DSA', 'SLH-DSA', 'AES'])(
    'limits the no-targeted-finding result for %s to the declared sample scope',
    (family) => {
      const result = run(bom([asset(family)]))
      expect(result.status).toBe(0)
      expect(result.output).toContain(
        'No targeted findings in the inspected sample scope; not a compliance or security verdict'
      )
    }
  )
  it('reviews an actual Hub-emitted algorithm asset after schema validation', () => {
    const doc = buildCbomDocument([
      {
        type: 'application',
        name: 'Fictional component',
        bomRef: 'sample:component',
        algorithms: [
          {
            canonical: 'ML-DSA',
            primitive: 'signature',
            parameterSet: 'ML-DSA-65',
            securityCategory: 3,
          },
        ],
      },
    ])
    const result = run(doc.json)
    expect(result.status).toBe(0)
    expect(result.output).toContain('No targeted findings')
  })
  it('reports an unavailable referenced schema as evaluation failure, never clean', () => {
    const result = run(bom([asset('ML-DSA')]), 'missing-schema')
    expect(result.status).toBe(2)
    expect(result.output).toContain('Evaluation failed: schema setup')
    expect(result.output).not.toContain('No targeted findings')
  })
  it('fails evaluation rather than silently ignoring an additional unsupported format', () => {
    const result = run(bom([asset('ML-DSA')]), 'unknown-format')
    expect(result.status).toBe(2)
    expect(result.output).toContain('Unconfigured schema format: unconfigured-sample-format')
    expect(result.output).not.toContain('No targeted findings')
  })
  it('states exactly which optional formats are annotations without claiming their syntax passed', () => {
    const input = {
      ...bom([asset('ML-DSA')]),
      metadata: { authors: [{ name: 'Sample author', email: 'not an email address' }] },
      externalReferences: [{ type: 'website', url: 'not an IRI reference' }],
    }
    const result = run(input)
    expect(result.status).toBe(0)
    expect(result.output).toContain(
      'iri-reference and idn-email syntax are annotations only, not validated'
    )
  })
  it('does not infer a paired hybrid companion from an unrelated PQC record', () => {
    const result = run(bom([asset('ECDSA', 'record one'), asset('ML-DSA', 'record two')]))
    expect(result.status).toBe(1)
    expect(result.output).not.toContain('companion')
  })
  it.each([undefined, 'RSA', 'hybrid', 'unrecorded-family'])(
    'keeps missing or out-of-example identity %s incomplete despite a PQC-looking name',
    (family) => {
      const result = run(bom([asset(family, 'ML-KEM-768')]))
      expect(result.status).toBe(2)
      expect(result.output).toMatch(
        /Missing or out-of-example algorithm identity|CycloneDX 1.7 schema invalid/
      )
      expect(result.output).not.toContain('No targeted findings')
    }
  )
  it('retains known review findings alongside incomplete evidence', () => {
    const result = run(bom([asset('ECDSA', 'known'), asset(undefined, 'unknown')]))
    expect(result.status).toBe(2)
    expect(result.output).toContain('"findings"')
    expect(result.output).toContain('"family":"ECDSA"')
    expect(result.output).toContain('"unassessed"')
  })
  it.each([
    bom([]),
    { bomFormat: 'CycloneDX', specVersion: '1.7' },
    bom([{ type: 'library', name: 'sample software' }]),
    { ...bom([asset('ML-KEM')]), specVersion: '1.6' },
    bom([{ type: 'library', name: 'parent', components: [asset('ECDSA')] }]),
    bom([false]),
  ])('keeps insufficient or outside-example input incomplete', (input) => {
    const result = run(input)
    expect(result.status).toBe(2)
    expect(result.output).toContain('Evidence incomplete')
    expect(result.output).not.toContain('No targeted findings')
  })
  it.each(['{truncated', '{}\n{}', ''])(
    'does not turn invalid/ambiguous input into a clean result',
    (input) => {
      const result = run(input)
      expect(result.status).toBe(2)
      expect(result.output).not.toContain('No targeted findings')
    }
  )
  it.each([['ML-KEM'], ['ECDSA'], { family: 'ML-KEM' }, 0, false])(
    'does not classify nonstring family evidence as a known example',
    (family) => {
      const record = asset('ML-KEM')
      const input = bom([
        {
          ...record,
          cryptoProperties: {
            ...record.cryptoProperties,
            algorithmProperties: {
              ...record.cryptoProperties.algorithmProperties,
              algorithmFamily: family,
            },
          },
        },
      ])
      const result = run(input)
      expect(result.status).toBe(2)
      expect(result.output).toMatch(
        /Missing or out-of-example algorithm identity|CycloneDX 1.7 schema invalid/
      )
      expect(result.output).not.toContain('No targeted findings')
    }
  )
  it('keeps nested metadata-component inventory outside the inspected scope', () => {
    const input = {
      ...bom([asset('ML-KEM')]),
      metadata: { component: { type: 'library', name: 'parent', components: [asset('ECDSA')] } },
    }
    const result = run(input)
    expect(result.status).toBe(2)
    expect(result.output).toContain('Nested component inventory is outside this example')
    expect(result.output).not.toContain('No targeted findings')
  })
  it('reports unreadable input and missing tools as evaluation failures', () => {
    expect(run().output).toContain('Evaluation failed')
    const result = run(bom([asset('ML-KEM')]), 'missing-tool')
    expect(result.status).toBe(2)
    expect(result.output).toContain('jq is unavailable')
  })
  it('reports a nonzero jq evaluation separately from policy findings', () => {
    const result = run(bom([asset('ML-KEM')]), 'tool-error')
    expect(result.status).toBe(2)
    expect(result.output).toContain('controlled jq evaluation failure')
    expect(result.output).toContain('Evaluation failed')
    expect(result.output).not.toContain('No targeted findings')
  })
})
