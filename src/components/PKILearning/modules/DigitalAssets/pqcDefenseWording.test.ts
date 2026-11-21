// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MODULE_DIR = resolve(__dirname)
const normalize = (s: string) => s.replace(/\s+/g, ' ')

const pqcMigrationFlowSrc = normalize(
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  readFileSync(resolve(MODULE_DIR, 'flows/PQCMigrationFlow.tsx'), 'utf8')
)
const pqcThreatSummarySrc = normalize(
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  readFileSync(resolve(MODULE_DIR, 'components/PQCThreatSummary.tsx'), 'utf8')
)
const custodyConstantsSrc = normalize(
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  readFileSync(resolve(MODULE_DIR, 'data/custodyConstants.ts'), 'utf8')
)
const conceptsGlossarySrc = normalize(
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  readFileSync(resolve(MODULE_DIR, '../../../../data/glossary/concepts.json'), 'utf8')
)

describe('LM-045 DigitalAssets PQC Defense Part 3 wording accuracy', () => {
  it('describes EIP-7702 delegation as persistent until replaced or cleared, not temporary for a transaction', () => {
    expect(pqcMigrationFlowSrc).not.toMatch(/temporarily/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/for a transaction/i)
    expect(pqcMigrationFlowSrc).toMatch(/persistent delegation code/i)
    expect(pqcMigrationFlowSrc).toMatch(/until replaced or cleared/i)
    expect(pqcMigrationFlowSrc).toMatch(/secp256k1/i)

    expect(pqcThreatSummarySrc).toMatch(/persistent delegation code/i)
    expect(pqcThreatSummarySrc).toMatch(/until replaced or cleared/i)
    expect(pqcThreatSummarySrc).toMatch(/secp256k1 key retains authority/i)
  })

  it('qualifies ERC-4337 as algorithm-agnostic rather than claiming live mainnet PQC signing or precompiles', () => {
    expect(pqcMigrationFlowSrc).not.toMatch(/deploy PQC signing today/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/Yes — via smart accounts/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/via a precompile or inline Solidity/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/switch to PQC wallets today/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/AA path available today/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/EIP-4337/)
    expect(pqcMigrationFlowSrc).toMatch(/ERC-4337 itself specifies no post-quantum/)
    expect(pqcMigrationFlowSrc).toMatch(/no PQ signature precompile is live on Ethereum mainnet/i)
    expect(pqcMigrationFlowSrc).toMatch(/no mainnet PQ precompile yet/i)

    expect(pqcThreatSummarySrc).toMatch(/algorithm-agnostic/i)
    expect(pqcThreatSummarySrc).toMatch(/no mainnet PQ precompile yet/i)
    expect(pqcThreatSummarySrc).not.toMatch(
      /lets smart-contract wallets verify PQC signatures today/i
    )
    expect(pqcThreatSummarySrc).not.toMatch(/PQC signing available today via Account Abstraction/i)
    expect(pqcThreatSummarySrc).not.toMatch(/enabling PQC signing without a full migration/i)
  })

  it('marks EIP-8141 as draft rather than active in the comparison table', () => {
    expect(pqcMigrationFlowSrc).not.toMatch(/Multiple EIPs active \(4337, 7702, 8141\)/i)
    expect(pqcMigrationFlowSrc).toMatch(/EIP-8141 native AA draft/i)
    expect(pqcMigrationFlowSrc).not.toMatch(/EIP-8141[^;.]*active/i)
  })

  it('does not list EIP-7702 as chain-level PQC signature support in custodyConstants', () => {
    expect(custodyConstantsSrc).not.toContain('Chain-level PQC signature support (EIP-7702)')
  })

  it('qualifies the Account Abstraction glossary entry consistently with ERC-4337 and EIP-7702', () => {
    expect(conceptsGlossarySrc).not.toMatch(
      /switch from ECDSA to PQC signatures \(ML-DSA or FN-DSA\) today/i
    )
    expect(conceptsGlossarySrc).not.toMatch(/"An Ethereum protocol feature \(EIP-4337\)/)
    expect(conceptsGlossarySrc).toMatch(/ERC-4337 itself specifies no post-quantum algorithm/i)
    expect(conceptsGlossarySrc).toMatch(/no PQ signature precompile is live on Ethereum mainnet/i)
    expect(conceptsGlossarySrc).toMatch(/persistent delegation code/i)
    expect(conceptsGlossarySrc).toMatch(/until replaced or cleared/i)
  })
})
