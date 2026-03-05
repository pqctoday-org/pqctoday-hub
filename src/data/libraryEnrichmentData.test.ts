// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { parseEnrichmentMarkdown, hasSubstantiveEnrichment } from './libraryEnrichmentData'

const SAMPLE_MARKDOWN = `---
generated: 2026-02-28
collection: library
documents_processed: 3
---

## GSMA PQ.03 PQC Guidelines

- **Reference ID**: GSMA PQ.03 PQC Guidelines
- **Title**: Post-Quantum Cryptography Guidelines for Telecom Use Cases
- **Authors**: GSMA
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Permanent Reference Document
- **Main Topic**: Guidance for integrating PQC into TLS, IKE, and 5G infrastructure.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Milestones: Effective October 2024
- **Applicable Regions / Bodies**: Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPsec, X.509
- **Infrastructure Layers**: PKI, Code Signing, Firmware, IoT, Cloud, 5G
- **Standardization Bodies**: IETF, NCSC
- **Compliance Frameworks Referenced**: GSMA NG.116
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: Operators should adopt hybrid TLS by 2026; 5G core requires ML-KEM for key exchange
- **Security Levels & Parameters**: NIST L1, NIST L3
- **Hybrid & Transition Approaches**: Hybrid TLS, dual-stack deployment
- **Performance & Size Considerations**: ML-KEM-768 adds 1088 bytes to TLS handshake
- **Target Audience**: Security Architect, Developer
- **Implementation Prerequisites**: OpenSSL 3.5+; 5G core upgrade
- **Relevant PQC Today Features**: Compliance, tls-basics, 5g-security

---

## India-DST-Quantum-Safe-Roadmap-2026

- **Reference ID**: India-DST-Quantum-Safe-Roadmap-2026
- **Title**: Implementation of Quantum Safe Ecosystem in India
- **Authors**: India Ministry of Science & Technology (DST)
- **Publication Date**: 2026-02-04
- **Last Updated**: 2026-02-04
- **Document Status**: Published
- **Main Topic**: India's national PQC migration roadmap from the Department of Science & Technology.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: HNDL, Cryptographically Relevant Quantum, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Milestones: Q-Day may arrive by 2029 | Deprecation of classical crypto by 2030 | Federal mandate for PQC adoption
- **Applicable Regions / Bodies**: Regions: United States, European Union, India, Bodies: NIST, CISA, NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Signal
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI, Firmware, IoT, Satellite, OT/ICS/SCADA
- **Standardization Bodies**: NIST, NCSC
- **Compliance Frameworks Referenced**: CCCS ITSM.40.001

---

## BIP-141

- **Reference ID**: BIP-141
- **Title**: BIP-141: Segregated Witness (Consensus Layer)
- **Authors**: Eric Lombrozo; Johnson Lau; Pieter Wuille (Bitcoin Core)
- **Publication Date**: 2015-12-21
- **Last Updated**: 2021-10-05
- **Document Status**: Final
- **Main Topic**: Activates Segregated Witness on Bitcoin.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
`

describe('parseEnrichmentMarkdown', () => {
  const lookup = parseEnrichmentMarkdown(SAMPLE_MARKDOWN)

  it('parses the correct number of entries', () => {
    expect(Object.keys(lookup)).toHaveLength(3)
  })

  it('keys entries by referenceId', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines']).toBeDefined()
    expect(lookup['India-DST-Quantum-Safe-Roadmap-2026']).toBeDefined()
    expect(lookup['BIP-141']).toBeDefined()
  })

  it('parses main topic', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].mainTopic).toBe(
      'Guidance for integrating PQC into TLS, IKE, and 5G infrastructure.'
    )
  })

  it('converts "None detected" to empty arrays', () => {
    const gsma = lookup['GSMA PQ.03 PQC Guidelines']
    expect(gsma.pqcAlgorithms).toEqual([])
    expect(gsma.leadersContributions).toEqual([])
    expect(gsma.pqcProducts).toEqual([])
  })

  it('parses comma-separated lists into arrays', () => {
    const gsma = lookup['GSMA PQ.03 PQC Guidelines']
    expect(gsma.protocols).toEqual(['TLS', 'IPsec', 'X.509'])
    expect(gsma.infrastructureLayers).toEqual([
      'PKI',
      'Code Signing',
      'Firmware',
      'IoT',
      'Cloud',
      '5G',
    ])
    expect(gsma.standardizationBodies).toEqual(['IETF', 'NCSC'])
  })

  it('parses quantum threats list', () => {
    const india = lookup['India-DST-Quantum-Safe-Roadmap-2026']
    expect(india.quantumThreats).toEqual([
      'HNDL',
      'Cryptographically Relevant Quantum',
      'Quantum Computer',
      'Post-Quantum',
    ])
  })

  it('parses migration timeline with milestone phrases', () => {
    const india = lookup['India-DST-Quantum-Safe-Roadmap-2026']
    expect(india.migrationTimeline).toEqual([
      'Q-Day may arrive by 2029',
      'Deprecation of classical crypto by 2030',
      'Federal mandate for PQC adoption',
    ])
  })

  it('parses migration timeline with single milestone', () => {
    const gsma = lookup['GSMA PQ.03 PQC Guidelines']
    expect(gsma.migrationTimeline).toEqual(['Effective October 2024'])
  })

  it('returns null for "None detected" migration timeline', () => {
    expect(lookup['BIP-141'].migrationTimeline).toBeNull()
  })

  it('parses regions and bodies', () => {
    const india = lookup['India-DST-Quantum-Safe-Roadmap-2026']
    expect(india.regionsAndBodies).toEqual({
      regions: ['United States', 'European Union', 'India'],
      bodies: ['NIST', 'CISA', 'NCSC'],
    })
  })

  it('parses bodies only (no regions prefix)', () => {
    const gsma = lookup['GSMA PQ.03 PQC Guidelines']
    expect(gsma.regionsAndBodies).toEqual({
      regions: [],
      bodies: ['NCSC'],
    })
  })

  it('returns null for "None detected" regions/bodies', () => {
    expect(lookup['BIP-141'].regionsAndBodies).toBeNull()
  })

  it('parses compliance frameworks', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].complianceFrameworks).toEqual(['GSMA NG.116'])
    expect(lookup['India-DST-Quantum-Safe-Roadmap-2026'].complianceFrameworks).toEqual([
      'CCCS ITSM.40.001',
    ])
  })

  // v2 dimension tests
  it('parses classical algorithms as comma-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].classicalAlgorithms).toEqual(['RSA', 'ECDSA'])
  })

  it('parses key takeaways as semicolon-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].keyTakeaways).toEqual([
      'Operators should adopt hybrid TLS by 2026',
      '5G core requires ML-KEM for key exchange',
    ])
  })

  it('parses security levels as comma-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].securityLevels).toEqual(['NIST L1', 'NIST L3'])
  })

  it('parses hybrid approaches as comma-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].hybridApproaches).toEqual([
      'Hybrid TLS',
      'dual-stack deployment',
    ])
  })

  it('parses performance considerations as semicolon-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].performanceConsiderations).toEqual([
      'ML-KEM-768 adds 1088 bytes to TLS handshake',
    ])
  })

  it('parses target audience as comma-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].targetAudience).toEqual([
      'Security Architect',
      'Developer',
    ])
  })

  it('parses implementation prerequisites as semicolon-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].implementationPrereqs).toEqual([
      'OpenSSL 3.5+',
      '5G core upgrade',
    ])
  })

  it('parses relevant features as comma-separated list', () => {
    expect(lookup['GSMA PQ.03 PQC Guidelines'].relevantFeatures).toEqual([
      'Compliance',
      'tls-basics',
      '5g-security',
    ])
  })

  it('returns empty arrays for missing v2 fields (backward compat)', () => {
    const bip = lookup['BIP-141']
    expect(bip.classicalAlgorithms).toEqual([])
    expect(bip.keyTakeaways).toEqual([])
    expect(bip.securityLevels).toEqual([])
    expect(bip.hybridApproaches).toEqual([])
    expect(bip.performanceConsiderations).toEqual([])
    expect(bip.targetAudience).toEqual([])
    expect(bip.implementationPrereqs).toEqual([])
    expect(bip.relevantFeatures).toEqual([])
  })

  it('returns empty arrays for entries without v2 fields (India)', () => {
    const india = lookup['India-DST-Quantum-Safe-Roadmap-2026']
    expect(india.classicalAlgorithms).toEqual([])
    expect(india.keyTakeaways).toEqual([])
    expect(india.securityLevels).toEqual([])
    expect(india.hybridApproaches).toEqual([])
    expect(india.performanceConsiderations).toEqual([])
    expect(india.targetAudience).toEqual([])
    expect(india.implementationPrereqs).toEqual([])
    expect(india.relevantFeatures).toEqual([])
  })
})

describe('hasSubstantiveEnrichment', () => {
  const EMPTY_V2 = {
    classicalAlgorithms: [] as string[],
    keyTakeaways: [] as string[],
    securityLevels: [] as string[],
    hybridApproaches: [] as string[],
    performanceConsiderations: [] as string[],
    targetAudience: [] as string[],
    implementationPrereqs: [] as string[],
    relevantFeatures: [] as string[],
  }

  it('returns true when mainTopic is set', () => {
    const result = hasSubstantiveEnrichment({
      mainTopic: 'Something useful',
      pqcAlgorithms: [],
      quantumThreats: [],
      migrationTimeline: null,
      regionsAndBodies: null,
      leadersContributions: [],
      pqcProducts: [],
      protocols: [],
      infrastructureLayers: [],
      standardizationBodies: [],
      complianceFrameworks: [],
      ...EMPTY_V2,
    })
    expect(result).toBe(true)
  })

  it('returns true when any array dimension has items', () => {
    const result = hasSubstantiveEnrichment({
      mainTopic: '',
      pqcAlgorithms: ['ML-KEM'],
      quantumThreats: [],
      migrationTimeline: null,
      regionsAndBodies: null,
      leadersContributions: [],
      pqcProducts: [],
      protocols: [],
      infrastructureLayers: [],
      standardizationBodies: [],
      complianceFrameworks: [],
      ...EMPTY_V2,
    })
    expect(result).toBe(true)
  })

  it('returns false when all dimensions are empty', () => {
    const result = hasSubstantiveEnrichment({
      mainTopic: '',
      pqcAlgorithms: [],
      quantumThreats: [],
      migrationTimeline: null,
      regionsAndBodies: null,
      leadersContributions: [],
      pqcProducts: [],
      protocols: [],
      infrastructureLayers: [],
      standardizationBodies: [],
      complianceFrameworks: [],
      ...EMPTY_V2,
    })
    expect(result).toBe(false)
  })

  it('returns true when only v2 dimensions have items', () => {
    const result = hasSubstantiveEnrichment({
      mainTopic: '',
      pqcAlgorithms: [],
      quantumThreats: [],
      migrationTimeline: null,
      regionsAndBodies: null,
      leadersContributions: [],
      pqcProducts: [],
      protocols: [],
      infrastructureLayers: [],
      standardizationBodies: [],
      complianceFrameworks: [],
      classicalAlgorithms: ['RSA'],
      keyTakeaways: [],
      securityLevels: [],
      hybridApproaches: [],
      performanceConsiderations: [],
      targetAudience: [],
      implementationPrereqs: [],
      relevantFeatures: [],
    })
    expect(result).toBe(true)
  })
})
