// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KmsMigrationRunbook } from '../KmsPqc/workshop/KmsMigrationRunbook'

// Inspect the command produced by the maintained runbook, without cloud calls or a second recipe.
vi.mock('@/components/PKILearning/common/OpsConfigGenerator', () => ({
  OpsConfigGenerator: ({
    generateConfig,
  }: {
    generateConfig: (input: Record<string, string>) => string
  }) => (
    <pre data-testid="runbook-command">
      {generateConfig({ provider: 'aws', operation: 're-encrypt' })}
    </pre>
  ),
}))
vi.mock('@/components/PKILearning/common/OpsChecklist', () => ({ OpsChecklist: () => null }))

const summary = fs.readFileSync(path.resolve(__dirname, 'rag-summary.md'), 'utf8')
const envelope = summary
  .split('\n')
  .find((line) => line.startsWith('- **Envelope Re-encryption at Scale**'))!
const command = envelope.match(/`(aws kms re-encrypt [^`]+)`/)?.[1]
function flags(recipe: string): Record<string, string> {
  return Object.fromEntries(
    [...recipe.matchAll(/--([a-z-]+)\s+(\S+)/g)].map((match) => [match[1], match[2]])
  )
}

describe('Ops AWS re-encryption summary contract', () => {
  it('retains the actual maintained RSA-to-AES runbook command and independently named API inputs', () => {
    expect(command).toBeDefined()
    render(<KmsMigrationRunbook />)
    const generated = screen
      .getByTestId('runbook-command')
      .textContent!.split('\n')
      .filter((line) => !line.startsWith('#'))
      .join(' ')
      .replace(/\\\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    expect(command).toBe(generated)
    // AWS ReEncrypt request contract, independently checked against its primary API reference:
    // one compatible CiphertextBlob; an encryption destination, not an ML-KEM key.
    expect(flags(command!)).toEqual({
      'ciphertext-blob': 'fileb://dek.enc',
      'source-key-id': '<old-rsa-key-id>',
      'source-encryption-algorithm': 'RSAES_OAEP_SHA_256',
      'destination-key-id': '<aes-256-key-id>',
    })
  })
  it('distinguishes application batches and KEM shared secrets from the encryption operation', () => {
    expect(envelope).toContain('one compatible KMS ciphertext blob per request')
    expect(envelope).toContain(
      'bounded batches, checkpoints and retries are orchestrated by the calling application'
    )
    expect(envelope).not.toContain('AWS KMS re-encrypt API supports batch operations')
    expect(envelope).toContain(
      'ML-KEM KMS keys instead use `Encapsulate`/`Decapsulate` to establish a shared secret'
    )
    expect(envelope).toContain(
      'not `ReEncrypt` destinations or a drop-in wrapped-DEK ciphertext format'
    )
    expect(envelope).toContain('illustrative inventory of 1M wrapped DEKs')
    expect(envelope).toContain('rather than assume a measured throughput or universal bottleneck')
  })
})
