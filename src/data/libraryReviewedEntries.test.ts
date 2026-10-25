// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library, concept registry, trusted-source links and quiz entries that were corrected
 * after the October 2026 re-review. Each test pins what the entry's own document says
 * (see the dated note on the row in data_quality_notes), so a later edit that brings the
 * old wording back fails here.
 */
import { describe, it, expect } from 'vitest'
import { libraryData, type LibraryItem } from './libraryData'
import { conceptByCanonicalId, conceptIdByStoreKey } from './conceptRegistry'
import { trustedSourceXrefs } from './trustedSourceXrefData'
import { quizQuestions } from './quizDataLoader'

const byId = (id: string): LibraryItem => {
  const item = libraryData.find((i) => i.referenceId === id)
  if (!item) throw new Error(`Library entry ${id} is missing`)
  return item
}

describe('reviewed Library entries: dates and titles', () => {
  it('3GPP TR 33.938: first published June 2025 (SA#108), description gives V19.2.0 as February 2026', () => {
    const item = byId('3GPP-PQC-Study-2025')
    expect(item.initialPublicationDate).toBe('2025-06')
    expect(item.lastUpdateDate).toBe('2026-02')
    expect(item.shortDescription).toContain('v19.2.0 (2026-02)')
    expect(item.shortDescription).not.toContain('(2026-01)')
  })

  it('keeps the Deloitte and InfoSec Global dates the documents show', () => {
    const deloitte = byId('Deloitte-TechTrends-2025-Quantum')
    expect(deloitte.initialPublicationDate).toBe('2024-12-11')
    expect(deloitte.lastUpdateDate).toBe('2024-12-11')
    // the page heading, with the series name kept
    expect(deloitte.documentTitle).toBe(
      'The new math: Solving cryptography in an age of quantum (Tech Trends 2025)'
    )
    const infosec = byId('InfoSec-Global-Hype-Cycles')
    expect(infosec.initialPublicationDate).toBe('2024-08-22')
    expect(infosec.lastUpdateDate).toBe('2024-08-22')
  })

  it('FrodoKEM side-channel preprint: full title, preprint dates, journal version of 29 June 2026', () => {
    const item = byId('FrodoKEM-SCA-Countermeasures-2024')
    expect(item.documentTitle).toBe(
      'Countermeasures against Side-Channel Attacks in FrodoKEM: An Implementation Study'
    )
    expect(item.initialPublicationDate).toBe('2025-10-01')
    expect(item.lastUpdateDate).toBe('2025-10-01')
    expect(item.shortDescription).toContain('29 June 2026')
    expect(item.shortDescription).toContain('Journal of Cryptographic Engineering')
  })

  it('Microsoft Quantum Safe Program: links the August 2025 article, not the blog index', () => {
    const item = byId('Microsoft-QSP-Roadmap-2025')
    expect(item.downloadUrl).toBe(
      'https://www.microsoft.com/en-us/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/'
    )
    expect(item.initialPublicationDate).toBe('2025-08-20')
    expect(item.lastUpdateDate).toBe('2025-08-20')
  })

  it('Spherity paper: cites the paper page and its own dates, not the LinkedIn post', () => {
    const item = byId('Spherity-PQC-Identity-Corridors-2026')
    expect(item.downloadUrl).toBe(
      'https://spherity.github.io/spherity-research/quantum-resilient-organizational-identity.html'
    )
    expect(item.documentTitle).toBe('Quantum-Resilient Organizational Identity')
    expect(item.initialPublicationDate).toBe('2026-05-21')
    expect(item.lastUpdateDate).toBe('2026-09-07')
    expect(item.miscInfo ?? '').not.toMatch(/linkedin/i)
    expect(item.authorsOrOrganization).toContain('Couzens')
  })

  it('ANSSI: the position-paper entry is the 2022 paper, the follow-up keeps its own entry', () => {
    const paper = byId('ANSSI PQC Position Paper')
    expect(paper.documentTitle).toBe(
      "Avis scientifique et technique de l'ANSSI sur la migration vers la cryptographie post-quantique"
    )
    expect(paper.initialPublicationDate).toBe('2022-04-14')
    expect(paper.lastUpdateDate).toBe('2022-04-14')
    expect(paper.downloadUrl).toContain('anssi-avis-migration-vers-la-cryptographie-post-quantique')
    const followUp = byId('ANSSI PQC Follow-up Paper')
    expect(followUp.initialPublicationDate).toBe('2023-12-21')
    expect(followUp.downloadUrl).not.toBe(paper.downloadUrl)
    // the English version of the 2022 paper is dated on its first page
    expect(byId('ANSSI-PQC-Position-2022').initialPublicationDate).toBe('2022-03-30')
  })
})

describe('reviewed Library entries: descriptions', () => {
  it('CA/Browser Forum SC-PQC: a closed, unmerged proposal replaced by a later review copy', () => {
    const item = byId('CA/Browser Forum Ballot SC-PQC')
    expect(item.shortDescription).toContain('closed, unmerged proposal')
    expect(item.shortDescription).toContain('not an adopted ballot')
    expect(item.shortDescription).toContain('superseded by a later review copy')
    expect(item.initialPublicationDate).toBe('2026-04-22')
    expect(item.lastUpdateDate).toBe('2026-08-11')
  })

  it('NIST CMVP transition page: lists two submission milestones and does not call the page contradictory', () => {
    const item = byId('NIST-CMVP-140-2-to-140-3-Transition-Timeline')
    expect(item.shortDescription).toContain('On 22 September 2021')
    expect(item.shortDescription).toContain('on 1 April 2022')
    expect(item.shortDescription).not.toMatch(/contradict|unreconciled/i)
    expect(item.shortDescription).toContain('September 21, 2026')
    expect(item.shortDescription).toContain('September 22, 2026')
  })

  it('FIPS 140-3 Implementation Guidance and the ANSSI guide carry no catalogue-added security levels', () => {
    expect(byId('NIST-FIPS140-3-IG-PQC').securityLevels).toBe('')
    expect(byId('ANSSI-PG-083-v3-2026').securityLevels).toBe('')
  })

  it('the Entropy lesson references no longer list the three off-topic entries', () => {
    const entropy = libraryData
      .filter((i) => i.moduleIds?.includes('entropy-randomness'))
      .map((i) => i.referenceId)
    for (const id of [
      'EmergentMind-Nonce-Reuse-Crypto',
      'SCA-2023-Masked-Kyber-DL',
      'SCA-2017-AES-CNN-Jitter',
    ]) {
      expect(entropy, id).not.toContain(id)
    }
    // the two side-channel papers stay with the Testing & Validation lesson
    expect(byId('SCA-2023-Masked-Kyber-DL').moduleIds).toContain('pqc-testing-validation')
    expect(byId('SCA-2017-AES-CNN-Jitter').moduleIds).toContain('pqc-testing-validation')
  })
})

describe('reviewed Library entries: the three TCG TPM profiles', () => {
  it('EK Credential Profile v2.7: describes the post-quantum EK templates the specification defines', () => {
    const item = byId('TCG-EK-Credential-Profile-v2.7')
    expect(item.downloadUrl).toMatch(/Version-2\.7_Pub\.pdf$/)
    expect(item.shortDescription).toContain('ML-KEM')
    expect(item.shortDescription).toContain('ML-DSA')
    expect(item.shortDescription).toContain('TPMPQCVersion')
    // the specification does not name TPM Library v1.85
    expect(item.shortDescription).not.toMatch(/1\.85|\bAdds\b/)
    expect(item.securityLevels).toBe('L1,L2,L3,L5')
    expect(item.initialPublicationDate).toBe('2026-03-16')
    expect(item.confidenceScore).toBe(80)
  })

  it('PC Client TPM Profile v1.07: states the mandatory algorithms and the EK certificate pairing', () => {
    const item = byId('TCG-PC-Client-Platform-TPM-Profile-v1.07')
    expect(item.downloadUrl).toMatch(/v1p07_Pub\.pdf$/)
    expect(item.shortDescription).toContain('mandatory')
    expect(item.shortDescription).toContain('ML-KEM-768 or ML-KEM-1024')
    expect(item.shortDescription).toContain('ML-DSA-65 or ML-DSA-87')
    expect(item.shortDescription).toContain('CRB')
    expect(item.securityLevels).toBe('L1,L2,L3,L5')
    expect(item.initialPublicationDate).toBe('2026-03-23')
    expect(item.confidenceScore).toBe(80)
  })

  it('TPM 2.0 Library v1.85 Part 3: names the KEM commands and ML-DSA, not ML-KEM or Labeled KEM', () => {
    const item = byId('TCG-TPM-2.0-Library-v1.85-Part3-Published')
    expect(item.shortDescription).toContain('TPM2_Encapsulate')
    expect(item.shortDescription).toContain('TPM2_Decapsulate')
    expect(item.shortDescription).toContain('ML-DSA')
    expect(item.shortDescription).not.toMatch(/ML-KEM|Labeled/i)
    expect(item.algorithmFamily).toBe('ML-DSA; EdDSA')
    expect(item.securityLevels).toBe('')
    expect(item.confidenceScore).toBe(80)
  })
})

describe('OpenPGP persistent symmetric keys draft and the ACVP LMS specification', () => {
  it('has one active entry for the draft, under its own identifier, and none called RFC 9581', () => {
    const active = libraryData.filter(
      (i) => i.referenceId === 'RFC 9581' || /persistent-symmetric-keys/.test(i.referenceId)
    )
    expect(active.map((i) => i.referenceId)).toEqual([
      'draft-ietf-openpgp-persistent-symmetric-keys',
    ])
    const item = active[0]
    expect(item.documentTitle).toBe('Persistent Symmetric Keys in OpenPGP')
    expect(item.shortDescription).toContain('not an RFC')
    expect(item.localFile).toBe('library/draft-ietf-openpgp-persistent-symmetric-keys.txt')
  })

  it('moves the concept registry and the trusted-source link to the new identifier', () => {
    const id = 'draft-ietf-openpgp-persistent-symmetric-keys'
    expect(conceptByCanonicalId.get('standard:rfc-9581')).toBeUndefined()
    expect(conceptIdByStoreKey.get('library:RFC 9581')).toBeUndefined()
    expect(conceptByCanonicalId.get(`standard:${id}`)?.sourceRowId).toBe(id)
    expect(conceptIdByStoreKey.get(`library:${id}`)).toBe(`standard:${id}`)
    const links = trustedSourceXrefs.filter((x) => x.resourceType === 'library')
    expect(links.some((x) => x.resourceId === 'RFC 9581')).toBe(false)
    expect(links.some((x) => x.resourceId === id && x.sourceId === 'ietf')).toBe(true)
  })

  it('lists the ACVP LMS specification next to the other ACVP algorithm specifications', () => {
    const item = byId('ACVP-LMS-JSON-Specification')
    expect(item.documentTitle).toBe('ACVP LMS JSON Specification')
    expect(item.downloadUrl).toBe('https://pages.nist.gov/ACVP/draft-celi-acvp-lms.html')
    expect(item.lastUpdateDate).toBe('2026-10-02')
    expect(item.shortDescription).toContain('draft-celi-acvp-lms-01')
    expect(item.moduleIds).toEqual(
      expect.arrayContaining(['acvp-lab-workflow', 'stateful-signatures'])
    )
    expect(item.dependencies.split(';')).toContain('NIST SP 800-208')
    expect(
      trustedSourceXrefs.some(
        (x) => x.resourceId === 'ACVP-LMS-JSON-Specification' && x.sourceId === 'nist-csrc'
      )
    ).toBe(true)
  })
})

describe('quiz: PKCS#11 v3.2 approval date', () => {
  it('cda-011 gives the OASIS Standard date printed on the specification (3 June 2026)', () => {
    const q = quizQuestions.find((x) => x.id === 'cda-011')
    expect(q?.explanation).toContain('OASIS Standard, dated 3 June 2026')
    expect(
      quizQuestions.some((x) => /approved as an OASIS Standard on 15 July 2026/.test(x.explanation))
    ).toBe(false)
  })
})
