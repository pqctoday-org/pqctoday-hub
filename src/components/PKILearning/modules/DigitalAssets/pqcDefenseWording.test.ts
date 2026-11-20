// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MODULE_DIR = resolve(__dirname)
const normalize = (s: string) => s.replace(/\s+/g, ' ')

// eslint-disable-next-line security/detect-non-literal-fs-filename
const pqcMigrationFlowSrc = normalize(
  readFileSync(resolve(MODULE_DIR, 'flows/PQCMigrationFlow.tsx'), 'utf8')
)
// eslint-disable-next-line security/detect-non-literal-fs-filename
const pqcThreatSummarySrc = normalize(
  readFileSync(resolve(MODULE_DIR, 'components/PQCThreatSummary.tsx'), 'utf8')
)
// eslint-disable-next-line security/detect-non-literal-fs-filename
const custodyConstantsSrc = normalize(
  readFileSync(resolve(MODULE_DIR, 'data/custodyConstants.ts'), 'utf8')
)

describe('LM-045 DigitalAssets PQC Defense Part 3 wording accuracy', () => {
  it('describes EIP-7702 delegation as persistent until replaced or cleared, not temporary for a transaction', () => {
    expect(pqcMigrationFlowSrc).not.toMatch(/temporarily set executable code/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/for a transaction/i)
    expect(pqcMigrationFlowSrc).toMatch(/persistent delegation code/i)
    expect(pqcMigrationFlowSrc).toMatch(/until replaced or cleared/i)
    expect(pqcMigrationFlowSrc).toMatch(/secp256k1 key retains authority/i)
  })

  it('qualifies ERC-4337 as algorithm-agnostic rather than specifying ML-DSA or Falcon directly', () => {
    expect(pqcMigrationFlowSrc).toMatch(/ERC-4337 itself specifies no post-quantum/)
    expect(pqcMigrationFlowSrc).toMatch(/no PQ signature precompile is live on Ethereum mainnet/i)
    expect(pqcThreatSummarySrc).toMatch(/algorithm-agnostic/i)
    expect(pqcThreatSummarySrc).not.toMatch(
      /lets smart-contract wallets verify PQC signatures today/i
    )
  })

  it('does not list EIP-7702 as chain-level PQC signature support in custodyConstants', () => {
    expect(custodyConstantsSrc).not.toContain('Chain-level PQC signature support (EIP-7702)')
  })
})
