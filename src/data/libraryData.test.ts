import { describe, it, expect } from 'vitest'
import {
  libraryData,
  computeCitationCounts,
  attachPriorRevisions,
  attachSuccessionLinks,
  transformLibraryRow,
  type RawLibraryRow,
  detectPurpose,
  resolvePurpose,
  findLibraryItemByRef,
  findLibrarySuccessor,
  REFERENCE_ID_ALIASES,
  LIBRARY_PURPOSES,
  type LibraryItem,
  type PriorRevision,
} from './libraryData'
import { LIFECYCLE_LABELS, resolveLifecycleLabel } from '../utils/libraryLifecycle'
import { loadLatestCSV } from './csvUtils'
import { isResearchTopicId } from './researchTopics'
import { LIBRARY_EXECUTIVE_PICKS } from './libraryExecutivePicks'
import { LIBRARY_OPS_PICKS } from './libraryOpsPicks'
import { LIBRARY_CURIOUS_PICKS } from './libraryCuriousPicks'

describe('libraryData', () => {
  it('loads without error', () => {
    expect(libraryData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of libraryData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of libraryData) {
      expect(item.referenceId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = libraryData.map((item) => item.referenceId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })

  it('derives a citationCount field on every item', () => {
    for (const item of libraryData) {
      expect(typeof item.citationCount).toBe('number')
      expect(item.citationCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('assigns every item one of the three canonical purposes', () => {
    for (const item of libraryData) {
      expect(LIBRARY_PURPOSES).toContain(item.purpose)
    }
  })

  it('carries the current CNSA 2.0 FAQ Version 2.2 milestones and qualified hybrid position', () => {
    const faq = libraryData.find((item) => item.referenceId === 'NSA CNSA 2.0 FAQ')
    expect(faq).toBeDefined()
    expect(faq?.documentStatus).toContain('Version 2.2')
    expect(faq?.shortDescription).toContain('1 January 2027')
    expect(faq?.shortDescription).toContain('31 December 2030')
    expect(faq?.shortDescription).toContain('31 December 2031')
    expect(faq?.shortDescription).toContain('Hybrids are not generally required')
    expect(faq?.shortDescription).not.toContain('2033')
  })

  it('does not present SLH-DSA as a CNSA 2.0 requirement (NSA CNSA 2.0 FAQ v2.2: not part of CNSA)', () => {
    const cnsa = libraryData.find((item) => item.referenceId === 'NSA CNSA 2.0')
    expect(cnsa).toBeDefined()
    expect(cnsa?.shortDescription).toContain('SLH-DSA is not part of CNSA 2.0')
    expect(cnsa?.shortDescription).toContain('LMS and XMSS')
    expect(cnsa?.shortDescription).not.toContain('ML-DSA-87, SLH-DSA')
    expect(cnsa?.dependencies.split(';')).not.toContain('FIPS 205')
    expect(cnsa?.dependencies.split(';')).toEqual(['FIPS 203', 'FIPS 204', 'NIST SP 800-208'])
  })

  it('describes the TPM 2.0 Library errata by what the document contains, with no post-quantum claim', () => {
    const errata = libraryData.find(
      (item) => item.referenceId === 'TCG-TPM-2.0-Library-v1.85-Errata'
    )
    expect(errata).toBeDefined()
    expect(errata?.shortDescription).toContain('Non-normative errata')
    expect(errata?.shortDescription).toContain('four commands')
    expect(errata?.shortDescription).not.toMatch(/ML-DSA|ML-KEM|Labeled KEM/i)
    expect(errata?.algorithmFamily).toBe('')
    expect(errata?.securityLevels).toBe('N/A')
    expect(errata?.lastUpdateDate).toBe('2026-08-11')
  })

  it('lists the lab-testing sources of the stateful-signature and SLH-DSA lessons in the Library', () => {
    const ids: Record<string, string[]> = {
      'NIST-FIPS140-3-IG-PQC': ['stateful-signatures', 'slh-dsa'],
      'NSA CNSA 2.0 FAQ': ['stateful-signatures', 'slh-dsa'],
      'ACVP-SLH-DSA-JSON-Specification': ['slh-dsa'],
    }
    for (const [ref, modules] of Object.entries(ids)) {
      const item = libraryData.find((i) => i.referenceId === ref)
      expect(item, ref).toBeDefined()
      for (const m of modules) expect(item?.moduleIds, `${ref} -> ${m}`).toContain(m)
    }
  })

  describe('document dates', () => {
    // A date is YYYY, YYYY-MM or YYYY-MM-DD and a real calendar date.
    const isRealDate = (v: string): boolean => {
      const parts = v.split('-')
      const twoDigits = (p: string | undefined) => p === undefined || /^\d{2}$/.test(p)
      if (
        parts.length > 3 ||
        !/^\d{4}$/.test(parts[0]) ||
        !twoDigits(parts[1]) ||
        !twoDigits(parts[2])
      ) {
        return false
      }
      const [y, mo, d] = [Number(parts[0]), Number(parts[1] ?? 1), Number(parts[2] ?? 1)]
      const t = new Date(Date.UTC(y, mo - 1, d))
      return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
    }
    // Compared at the coarser of the two precisions, so a month-only date is not
    // "earlier" than a day in the same month.
    const precedes = (later: string, earlier: string): boolean => {
      const n = Math.min(later.split('-').length, earlier.split('-').length)
      const cut = (v: string) => v.split('-').slice(0, n).join('-')
      return cut(later) < cut(earlier)
    }
    it('lists the OpenPGP draft under its own identifier as an Internet-Draft, not as RFC 9581', () => {
      // RFC 9581 is "CBOR Tags for Time, Duration, and Period" (August 2024); the entry is
      // draft-ietf-openpgp-persistent-symmetric-keys, which has no RFC number.
      expect(libraryData.some((i) => i.referenceId === 'RFC 9581')).toBe(false)
      const item = libraryData.find(
        (i) => i.referenceId === 'draft-ietf-openpgp-persistent-symmetric-keys'
      )!
      expect(item.documentStatus).toContain('Internet-Draft')
      expect(item.downloadUrl).toContain('draft-ietf-openpgp-persistent-symmetric-keys-04')
      expect(item.initialPublicationDate).toBe('2024-07-08')
      expect(item.lastUpdateDate).toBe('2026-09-15')
      // the retired id stays visible as a prior entry that points at the new one
      const retired = item.priorRevisions?.find((r) => r.referenceId === 'RFC 9581')
      expect(retired?.supersededBy).toBe('draft-ietf-openpgp-persistent-symmetric-keys')
      expect(retired?.deprecatedReason).toContain('not an RFC')
      expect(findLibrarySuccessor('RFC 9581')?.referenceId).toBe(item.referenceId)
    })

    it('every publication and last-update date parses as a real date', () => {
      for (const item of libraryData) {
        for (const v of [item.initialPublicationDate, item.lastUpdateDate]) {
          if (v) expect(isRealDate(v), `${item.referenceId}: ${v}`).toBe(true)
        }
      }
    })

    it('no document is last updated before it was first published', () => {
      const outOfOrder = libraryData
        .filter(
          (i) =>
            i.initialPublicationDate &&
            i.lastUpdateDate &&
            precedes(i.lastUpdateDate, i.initialPublicationDate)
        )
        .map((i) => i.referenceId)
        .sort()
      expect(outOfOrder).toEqual([])
    })
  })

  it('describes RFC 9811 as HTTP transport for CMP, not as an HSM or PQC profile', () => {
    const rfc = libraryData.find((item) => item.referenceId === 'RFC 9811')
    expect(rfc).toBeDefined()
    expect(rfc?.documentTitle).toContain('HTTP Transfer for the Certificate Management Protocol')
    expect(rfc?.shortDescription).toContain('does not define an HSM')
    expect(rfc?.shortDescription).not.toContain('ML-DSA validation')
    expect(rfc?.documentTitle).not.toContain('Hardware Security Modules')
  })

  it('does not turn adjacent regulation and protocol sources into universal PQC mandates', () => {
    const rfc9935 = libraryData.find((item) => item.referenceId === 'RFC-9935')
    expect(rfc9935?.shortDescription).toContain('when an X.509 deployment uses ML-KEM')
    expect(rfc9935?.shortDescription).not.toContain('Required for post-quantum PKI')

    const cra = libraryData.find((item) => item.referenceId === 'EU-CRA-REG-2024-2847')
    expect(cra?.shortDescription).toContain('where applicable')
    expect(cra?.shortDescription).toContain('does not prescribe a named PQC algorithm')

    const austrac = libraryData.find((item) => item.referenceId === 'AUSTRAC-AML-CTF-Act')
    expect(austrac?.shortDescription).toContain('relevance to cryptographic migration is indirect')
    expect(austrac?.shortDescription).not.toContain('must maintain secure cryptographic systems')
  })

  it('keeps legacy TLS deprecation separate from PQC protocol requirements', () => {
    for (const referenceId of ['RFC 6176', 'RFC 7568', 'RFC 8996']) {
      const item = libraryData.find((candidate) => candidate.referenceId === referenceId)
      expect(item?.shortDescription, referenceId).toMatch(/does not|neither defines nor requires/)
      expect(item?.shortDescription, referenceId).not.toContain('required for PQC hybrid')
    }
  })

  it('preserves the DoD memorandum exceptions and scoped transition dates', () => {
    const memo = libraryData.find((item) => item.referenceId === 'DoD-CIO-PQC-Memo-2025')
    expect(memo?.shortDescription).toContain('unless excepted')
    expect(memo?.shortDescription).toContain('particular PSK')
    expect(memo?.shortDescription).not.toContain('Bans QKD on DoD networks')
  })

  it('does not confuse Common Criteria product evaluation with FIPS module certification', () => {
    const commonCriteria = libraryData.find((item) => item.referenceId === 'COMMON-CRITERIA')
    expect(commonCriteria?.documentStatus).toContain('CC:2022 Release 1')
    expect(commonCriteria?.shortDescription).toContain('does not by itself validate')
    expect(commonCriteria?.shortDescription).toContain('FIPS 140-3')
    expect(commonCriteria?.documentStatus).not.toContain('v3.1 Rev 5')
  })

  it('separates IoT and OAuth source requirements from PQCtoday migration analysis', () => {
    for (const referenceId of ['RFC-7925', 'RFC-9124', 'RFC-7252', 'RFC-9068']) {
      const item = libraryData.find((candidate) => candidate.referenceId === referenceId)
      expect(item?.lastVerified, referenceId).toBe('2026-10-17')
      expect(item?.shortDescription, referenceId).toContain('PQCtoday migration note:')
    }

    const oauth = libraryData.find((item) => item.referenceId === 'RFC-9068')
    expect(oauth?.shortDescription).toContain('must include RS256 among')
    expect(oauth?.shortDescription).toContain('does not require RS256 to be the only algorithm')

    const coap = libraryData.find((item) => item.referenceId === 'RFC-7252')
    expect(coap?.shortDescription).toContain('RawPublicKey is mandatory to implement')
    expect(coap?.shortDescription).toContain('secp256r1')
  })

  it('keeps product, health, and OT obligations within their official source scope', () => {
    const smart = libraryData.find((item) => item.referenceId === 'SMART-App-Launch')
    expect(smart?.documentStatus).toContain('v2.2.0')
    expect(smart?.shortDescription).toContain('does not mandate a PQC algorithm')
    expect(smart?.shortDescription).not.toContain('required client-authentication signature')

    const psti = libraryData.find((item) => item.referenceId === 'UK-PSTI-Regs-2023-1007')
    expect(psti?.shortDescription).toContain('unique per product or user-defined')
    expect(psti?.shortDescription).toContain('does not itself impose a PQC deadline')

    const tsa = libraryData.find((item) => item.referenceId === 'TSA-SD-PIPELINE-2021-02G')
    expect(tsa?.shortDescription).toContain('when OT services are allowed to traverse')
    expect(tsa?.shortDescription).toContain('does not state a general rule')

    const opc = libraryData.find((item) => item.referenceId === 'OPC-10000-7')
    expect(opc?.shortDescription).toContain('does not define a post-quantum SecurityPolicy')
  })

  it('uses official provenance and scoped claims for the remaining reviewed library records', () => {
    const reviewedIds = [
      'DO-178C-Costs-vs-Benefits-Analysis',
      'EN-18031-1-2024',
      'EN-18031-3-2024',
      'PSA-Certified-Security-Model-v1-1',
      'PSA-Certified-Level-2-PP-SESIP-v2-0',
      'EN-17927-2023',
      'ASHRAE-135-2016-Addendum-bj',
      'Derbyshire-IChemE-Hazards26-2016',
    ]

    for (const referenceId of reviewedIds) {
      const item = libraryData.find((candidate) => candidate.referenceId === referenceId)
      expect(item?.lastVerified, referenceId).toBe('2026-10-17')
    }

    const do178c = libraryData.find(
      (item) => item.referenceId === 'DO-178C-Costs-vs-Benefits-Analysis'
    )
    expect(do178c?.shortDescription).toContain('25–40%')
    expect(do178c?.shortDescription).toContain('not regulator guidance')
    expect(do178c?.shortDescription).not.toContain('states the real-world cost')

    for (const referenceId of ['EN-18031-1-2024', 'EN-18031-3-2024']) {
      const item = libraryData.find((candidate) => candidate.referenceId === referenceId)
      expect(item?.downloadUrl, referenceId).toContain('cencenelec.eu')
      expect(item?.freeSummaryUrl, referenceId).toContain('eur-lex.europa.eu')
      expect(item?.shortDescription, referenceId).toContain(
        'do not establish a post-quantum algorithm requirement'
      )
      expect(item?.downloadUrl, referenceId).not.toContain('iteh.ai')
    }

    const en180313 = libraryData.find((item) => item.referenceId === 'EN-18031-3-2024')
    expect(en180313?.protocolOrToolImpact).not.toContain('SSH')

    const sesip = libraryData.find((item) => item.referenceId === 'EN-17927-2023')
    expect(sesip?.downloadUrl).toContain('standardsdevelopment.bsigroup.com')
    expect(sesip?.downloadUrl).not.toContain('iteh.ai')
    expect(sesip?.shortDescription).toContain('PQCtoday migration note:')

    const psaModel = libraryData.find(
      (item) => item.referenceId === 'PSA-Certified-Security-Model-v1-1'
    )
    expect(psaModel?.shortDescription).toContain('does not specify post-quantum algorithms')
    expect(psaModel?.shortDescription).toContain('PQCtoday migration note:')

    const psaLevel2 = libraryData.find(
      (item) => item.referenceId === 'PSA-Certified-Level-2-PP-SESIP-v2-0'
    )
    expect(psaLevel2?.shortDescription).toContain('before the end of 2026')
    expect(psaLevel2?.shortDescription).toContain('not itself a post-quantum requirement')

    const bacnet = libraryData.find((item) => item.referenceId === 'ASHRAE-135-2016-Addendum-bj')
    expect(bacnet?.shortDescription).toContain('must support TLS 1.3')
    expect(bacnet?.shortDescription).toContain('does not define post-quantum algorithms')

    const iecContext = libraryData.find(
      (item) => item.referenceId === 'Derbyshire-IChemE-Hazards26-2016'
    )
    expect(iecContext?.shortDescription).toContain("author's interpretation")
    expect(iecContext?.shortDescription).toContain(
      'not a substitute for the normative IEC standard'
    )
  })

  it('keeps public-sector and certification records within their exact source scope', () => {
    const nukib = libraryData.find(
      (item) => item.referenceId === 'CZ-NUKIB-Crypto-Requirements-2023'
    )
    expect(nukib?.lastVerified).toBe('2026-10-17')
    expect(nukib?.shortDescription).toContain('liable under the cited Czech')
    expect(nukib?.shortDescription).toContain('states no 2027 migration deadline')

    const cmmc = libraryData.find((item) => item.referenceId === 'CMMC-2.0-MODEL')
    expect(cmmc?.downloadUrl).toContain('dodcio.defense.gov/Portals/0/Documents/CMMC')
    expect(cmmc?.shortDescription).toContain('Level 1, Level 2 and Level 3')
    expect(cmmc?.shortDescription).not.toContain('Foundational/Advanced/Expert')
    expect(cmmc?.shortDescription).toContain('does not establish a post-quantum')

    const nzism = libraryData.find((item) => item.referenceId === 'NZISM-V3-9')
    expect(nzism?.initialPublicationDate).toBe('2025-04')
    expect(nzism?.shortDescription).toContain('no post-quantum cryptographic systems')
    expect(nzism?.shortDescription).toContain('Crown entities')

    const onc7 = libraryData.find(
      (item) => item.referenceId === 'ONC-Health-IT-Certification-Criterion-170-315-d-7-End-User-D'
    )
    expect(onc7?.shortDescription).toContain('either to encrypt')
    expect(onc7?.shortDescription).toContain('or to prevent')

    const onc8 = libraryData.find(
      (item) => item.referenceId === 'ONC-Health-IT-Certification-Criterion-170-315-d-8-Integrity'
    )
    expect(onc8?.shortDescription).toContain('create a message digest')
    expect(onc8?.shortDescription).toContain('does not pin a digital-signature algorithm')

    const onc9 = libraryData.find(
      (item) => item.referenceId === 'ONC-Health-IT-Certification-Criterion-170-315-d-9-Trusted-Co'
    )
    expect(onc9?.protocolOrToolImpact).not.toContain('TLS')
    expect(onc9?.shortDescription).toContain('need not name HTTPS or SSL/TLS')

    const qscdNotice = libraryData.find(
      (item) => item.referenceId === 'CIR-EU-2025-1570-QSCD-Certification-Notification'
    )
    expect(qscdNotice?.documentStatus).toBe('In force')
    expect(qscdNotice?.shortDescription).toContain('does not certify a product itself')

    const unsigned = libraryData.find((item) => item.referenceId === 'RFC-9925')
    expect(unsigned?.shortDescription).toContain(
      'validators must reject it in a certification path'
    )
    expect(unsigned?.shortDescription).toContain('not a general way to bypass')
  })

  it('separates protocol specifications from ecosystem and migration claims', () => {
    const slip10 = libraryData.find((item) => item.referenceId === 'SLIP-0010')
    expect(slip10?.lastVerified).toBe('2026-10-17')
    expect(slip10?.shortDescription).toContain('only hardened private-child derivation')
    expect(slip10?.shortDescription).toContain('does not mention Solana')
    expect(slip10?.protocolOrToolImpact).not.toContain('Solana')

    const bip340 = libraryData.find((item) => item.referenceId === 'BIP-340')
    expect(bip340?.documentStatus).toBe('Deployed')
    expect(bip340?.shortDescription).toContain('does not define MuSig, MuSig2')
    expect(bip340?.shortDescription).toContain('PQCtoday migration note:')

    const erc4337 = libraryData.find((item) => item.referenceId === 'Ethereum-EIP4337-AA')
    expect(erc4337?.documentTitle).toContain('ERC-4337')
    expect(erc4337?.shortDescription).toContain("signature field's meaning")
    expect(erc4337?.shortDescription).toContain('does not specify ML-DSA, Falcon')

    const openidVci = libraryData.find((item) => item.referenceId === 'OpenID4VCI-Spec')
    expect(openidVci?.shortDescription).toContain('optional cryptographic key binding')
    expect(openidVci?.shortDescription).toContain('does not mention EUDI')

    const openidVp = libraryData.find((item) => item.referenceId === 'OpenID4VP-Spec')
    expect(openidVp?.shortDescription).toContain('DCQL queries')
    expect(openidVp?.shortDescription).toContain('does not mention EUDI')
    expect(openidVp?.shortDescription).not.toContain('DIF PE')
  })

  it('labels research estimates and developing standards without turning them into forecasts', () => {
    const enisa = libraryData.find(
      (item) => item.referenceId === 'ENISA-State-of-Cybersecurity-2024'
    )
    expect(enisa?.lastVerified).toBe('2026-10-17')
    expect(enisa?.shortDescription).toContain('not a cryptographic standard')
    expect(enisa?.shortDescription).not.toContain('most European stakeholders')

    const falcon = libraryData.find((item) => item.referenceId === 'Falcon-Spec-v12')
    expect(falcon?.documentStatus).toContain('submission specification')
    expect(falcon?.shortDescription).toContain('FIPS 206 as under development')
    expect(falcon?.shortDescription).toContain('must not be presented as final FIPS 206')

    const gidney = libraryData.find((item) => item.referenceId === 'ref-gidney-factor-rsa')
    expect(gidney?.documentStatus).toBe('Preprint v1')
    expect(gidney?.shortDescription).toContain('under stated assumptions')
    expect(gidney?.shortDescription).toContain('not evidence that such a computer exists')

    const kim = libraryData.find((item) => item.referenceId === 'ref-kim-ecdlp')
    expect(kim?.documentStatus).toContain('Preprint')
    expect(kim?.shortDescription).toContain('conditional resource estimates')
    expect(kim?.shortDescription).toContain('not evidence that the required hardware exists')

    const pont = libraryData.find((item) => item.referenceId === 'ref-pont-downtime')
    expect(pont?.documentStatus).toBe('Preprint v1')
    expect(pont?.shortDescription).toContain('non-tight lower bound')
    expect(pont?.shortDescription).toContain('not an established deadline')
  })

  it('separates vendor and news claims from certification, mandates, and independent evidence', () => {
    const pqshield = libraryData.find(
      (item) => item.referenceId === 'PQShield-4-Quantum-Threats-Enterprises-2026'
    )
    expect(pqshield?.lastVerified).toBe('2026-10-17')
    expect(pqshield?.shortDescription).toContain('vendor guidance')
    expect(pqshield?.shortDescription).toContain('not as an independent risk assessment')

    const cryptonext = libraryData.find(
      (item) => item.referenceId === 'QuantumZeitgeist-CryptoNext-NIST-Cert-2026'
    )
    expect(cryptonext?.manualCategory).toBe('Industry & Research')
    expect(cryptonext?.shortDescription).toContain('not the same as')
    expect(cryptonext?.shortDescription).toContain('FIPS 140 cryptographic-module validation')
    expect(cryptonext?.documentTitle).not.toContain('Full NIST Quantum-Safe Certification')

    const eff = libraryData.find((item) => item.referenceId === 'EFF-Encryption-Y2K-Moment-2026')
    expect(eff?.documentType).toBe('Article')
    expect(eff?.shortDescription).toContain('company planning estimate')
    expect(eff?.shortDescription).toContain('not a government deadline')

    const acs = libraryData.find((item) => item.referenceId === 'ACS-Google-Cloudflare-PQC-2029')
    expect(acs?.shortDescription).toContain('their own PQC-readiness programmes')
    expect(acs?.shortDescription).toContain('not an industry-wide regulatory deadline')

    const samsung = libraryData.find(
      (item) => item.referenceId === 'Samsung-Thales-ML-KEM-eSE-2026'
    )
    expect(samsung?.documentType).toBe('Article')
    expect(samsung?.accessType).not.toBe('blocked')
    expect(samsung?.shortDescription).toContain('does not identify ML-KEM')
    expect(samsung?.shortDescription).toContain('vendor claims')
  })

  it('scopes historical drafts and implementation registries to their actual standing', () => {
    const semistatic = libraryData.find(
      (item) => item.referenceId === 'draft-ietf-tls-semistatic-dh'
    )
    expect(semistatic?.documentStatus).toBe('Expired Internet-Draft')
    expect(semistatic?.shortDescription).toContain('never became an RFC')
    expect(semistatic?.shortDescription).toContain('not as a current TLS requirement')

    const ike = libraryData.find(
      (item) => item.referenceId === 'Post-Quantum-Traditional-PQ-T-Hybrid-PKI-Authentication-in-t'
    )
    expect(ike?.documentStatus).toContain('individual submission')
    expect(ike?.algorithmFamily).toBe('ML-DSA')
    expect(ike?.shortDescription).toContain('no IETF endorsement')
    expect(ike?.shortDescription).toContain('does not itself change key exchange')

    const iso26262 = libraryData.find(
      (item) => item.referenceId === 'ISO-26262-Road-vehicles-Functional-safety'
    )
    expect(iso26262?.shortDescription).toContain('does not prescribe cryptographic algorithms')
    expect(iso26262?.shortDescription).toContain('only when it can affect a safety-related item')

    const sigstore = libraryData.find((item) => item.referenceId === 'Sigstore-Algorithm-Registry')
    expect(sigstore?.shortDescription).toContain('not required to implement every')
    expect(sigstore?.shortDescription).toContain('not operational within Sigstore')
    expect(sigstore?.shortDescription).not.toContain('post-quantum replacement')

    const autosar = libraryData.find(
      (item) => item.referenceId === 'AUTOSAR-CP-SWS-CryptoDriver-R23-11'
    )
    expect(autosar?.shortDescription).toContain('does not require every ECU')
    expect(autosar?.shortDescription).toContain('does not prescribe PQC')
    expect(autosar?.shortDescription).toContain('or define MACsec')
  })

  it('keeps demonstrations, product pages, and educational posts within their evidence', () => {
    const safe = libraryData.find(
      (item) => item.referenceId === 'Safe-Wallet-Safe-sol-multisig-signature-verification'
    )
    expect(safe?.shortDescription).toContain('does not document secp256r1')
    expect(safe?.shortDescription).toContain('not a PQC mechanism')

    const internet2 = libraryData.find(
      (item) => item.referenceId === 'Internet2-PQC-Demo-on-the-National-Backbone'
    )
    expect(internet2?.shortDescription).toContain(
      'FIPS 203 specifies ML-KEM key establishment rather than bulk data encryption'
    )
    expect(internet2?.shortDescription).toContain('not an independent product certification')

    const pci = libraryData.find(
      (item) => item.referenceId === 'PCI-SSC-Key-Blocks-101-104-AES-TDES-key-management'
    )
    expect(pci?.shortDescription).toContain('does not recommend migration from TDES to AES')
    expect(pci?.manualCategory).toBe('Compliance & Certification')

    const securosys = libraryData.find(
      (item) => item.referenceId === 'Securosys-Primus-HSM-CyberVault-PQC-ready'
    )
    expect(securosys?.shortDescription).toContain('A6129, A6130 and A6131')
    expect(securosys?.shortDescription).toContain('not by themselves FIPS 140 module validation')

    const acos = libraryData.find((item) => item.referenceId === 'ACS-ACOSJ-P-PBOC-3.0-DC-EC-Card')
    expect(acos?.shortDescription).toContain('does not show that PBOC 3.0 requires SM2')
    expect(acos?.shortDescription).toContain('which algorithm was exercised')
  })

  it('distinguishes experimental evidence and protection profiles from certification outcomes', () => {
    const avionics = libraryData.find(
      (item) => item.referenceId === 'Agile-Post-Quantum-Secure-Cryptography-in-Avionics'
    )
    expect(avionics?.documentStatus).toBe('Peer-reviewed journal article')
    expect(avionics?.downloadUrl).toContain('10.1007/s13272-025-00806-5')
    expect(avionics?.algorithmFamily).toBe('ML-KEM; ML-DSA')
    expect(avionics?.shortDescription).toContain('not an avionics certification')
    expect(avionics?.shortDescription).toContain('does not guarantee certification credit')

    const goose = libraryData.find(
      (item) => item.referenceId === 'Evaluation-of-Time-Critical-Communications-for-IEC-61850-Sub'
    )
    expect(goose?.documentStatus).toBe('Preprint v1')
    expect(goose?.shortDescription).toContain('cites secondary literature')
    expect(goose?.shortDescription).toContain('tests no cryptography or PQC overhead')

    const anssi = libraryData.find((item) => item.referenceId === 'ANSSI-CC-PP-2016-05-EN-419221-5')
    expect(anssi?.documentType).toBe('Compliance Framework')
    expect(anssi?.lastUpdateDate).toBe('2016-12-16')
    expect(anssi?.shortDescription).toContain('does not certify a cryptographic module')

    const bsi = libraryData.find((item) => item.referenceId === 'BSI-CC-PP-0084-V2-2026')
    expect(bsi?.shortDescription).toContain('five packages add optional')
    expect(bsi?.shortDescription).toContain('does not approve particular')
    expect(bsi?.shortDescription).toContain('not automatically to a chip')
  })

  it('tracks current BSI RNG classes and EUCC document applicability', () => {
    const ais = libraryData.find((item) => item.referenceId === 'BSI-AIS-20-31')
    expect(ais?.documentTitle).toContain('Version 3.0')
    expect(ais?.shortDescription).toContain('DRT.1')
    expect(ais?.shortDescription).toContain('NTG.1')
    expect(ais?.shortDescription).toContain('removes the former DRG.1 and PTG.1')

    const guidance = libraryData.find(
      (item) => item.referenceId === 'EUCC-Guidelines-on-Cryptography'
    )
    expect(guidance?.shortDescription).toContain('v2')
    expect(guidance?.shortDescription).toContain('ACM v3 as a draft')
    expect(guidance?.shortDescription).toContain('not an applicable certification requirement')

    const amendment = libraryData.find(
      (item) => item.referenceId === 'CIR-EU-2025-2462-EUCC-Amendment'
    )
    expect(amendment?.documentStatus).toBe('In Force')
    expect(amendment?.shortDescription).toContain('does not itself establish a general PQC')
  })

  it('replaces truncated RFC stubs with scoped educational summaries', () => {
    const cp = libraryData.find((item) => item.referenceId === 'RFC-3647')
    expect(cp?.documentTitle).toContain('Certificate Policy and Certification Practices')
    expect(cp?.shortDescription).toContain('does not define a particular certificate policy')

    const cache = libraryData.find((item) => item.referenceId === 'RFC-7924')
    expect(cache?.documentTitle).toContain('Cached Information Extension')
    expect(cache?.shortDescription).toContain('not a substitute for PQ-capable authentication')

    const delegated = libraryData.find((item) => item.referenceId === 'RFC-9345')
    expect(delegated?.shortDescription).toContain('TLS 1.3-or-later')
    expect(delegated?.shortDescription).toContain('no independent early-revocation')

    const cnsa = libraryData.find((item) => item.referenceId === 'RFC 9151')
    expect(cnsa?.shortDescription).toContain('Independent Submission')
    expect(cnsa?.shortDescription).toContain('does not define CNSA 2.0')

    const c509 = libraryData.find(
      (item) => item.referenceId === 'draft-ietf-cose-cbor-encoded-cert'
    )
    expect(c509?.lastVerified).toBe('2026-10-17')
    expect(c509?.shortDescription).toContain('marginal savings for ML-DSA-65')
  })
})

describe('findLibraryItemByRef', () => {
  it('resolves a live item by its current reference_id', () => {
    const anyLive = libraryData[0]
    expect(findLibraryItemByRef(anyLive.referenceId)).toBe(anyLive)
  })

  it('resolves an unknown ref to undefined rather than throwing', () => {
    expect(findLibraryItemByRef('DOES-NOT-EXIST')).toBeUndefined()
  })

  it('tolerates separator and case variants of a reference_id (FIPS-203 → FIPS 203)', () => {
    // The Assistant's page guide and a JWT workshop linked ?ref=FIPS-203,
    // which opened a "not found" notice (deep-link refresh audit, 2026-10-02).
    expect(findLibraryItemByRef('FIPS-203')?.referenceId).toBe('FIPS 203')
    expect(findLibraryItemByRef('fips_204')?.referenceId).toBe('FIPS 204')
  })

  it('every alias target that is currently active resolves to a live item', () => {
    // Aliases whose target has itself been deprecated/orphaned in the current
    // CSV snapshot are a separate data-integrity issue (see revisions.jsonl /
    // library remediation), not a bug in the alias mechanism itself — so this
    // only asserts on aliases whose target actually appears in libraryData.
    for (const [oldRef, newRef] of Object.entries(REFERENCE_ID_ALIASES)) {
      const targetIsLive = libraryData.some((item) => item.referenceId === newRef)
      if (!targetIsLive) continue
      expect(findLibraryItemByRef(oldRef)?.referenceId).toBe(newRef)
    }
  })

  it('resolves the deprecated NIST-CSWP-39 id to the live "NIST CSWP 39" revision (Grade-A remediation)', () => {
    // NIST-CSWP-39 (hyphenated) was deprecated 2026-06-06 and superseded by
    // "NIST CSWP 39" (spaced, no hyphen) — a different referenceId string.
    // LIBRARY_EXECUTIVE_PICKS[0] still points at the old hyphenated id, so
    // without this alias the executive persona's #1 "Start here" pick was a
    // dead click (detail drawer never opened).
    const resolved = findLibraryItemByRef('NIST-CSWP-39')
    expect(resolved).toBeDefined()
    expect(resolved?.referenceId).toBe('NIST CSWP 39')
  })

  it('resolves the legacy NIST-IR-8547 id to the real IR 8547, never the fabricated IPD2 row', () => {
    // NIST-IR-8547-IPD2 claimed a second draft (2026-04-12) that CSRC does not
    // list. It is deprecated with no successor, so it must neither be an alias
    // target nor surface as a prior revision of the live IR 8547 tile.
    expect(findLibraryItemByRef('NIST-IR-8547')?.referenceId).toBe('NIST IR 8547')
    const ir8547 = libraryData.find((item) => item.referenceId === 'NIST IR 8547')
    expect(ir8547).toBeDefined()
    expect((ir8547?.priorRevisions ?? []).map((p) => p.referenceId)).not.toContain(
      'NIST-IR-8547-IPD2'
    )
  })

  it('resolves every persona "Start here" pick to a real, live library item', () => {
    const allPicks = [...LIBRARY_EXECUTIVE_PICKS, ...LIBRARY_OPS_PICKS, ...LIBRARY_CURIOUS_PICKS]
    for (const pick of allPicks) {
      const resolved = findLibraryItemByRef(pick.referenceId)
      expect(
        resolved,
        `persona pick "${pick.referenceId}" (${pick.label}) did not resolve to a live library item`
      ).toBeDefined()
    }
  })
})

describe('detectPurpose', () => {
  it('routes migration-planning categories to planning (checked first)', () => {
    expect(detectPurpose('Migration Guidance', '')).toBe('planning')
    expect(detectPurpose('Program Guidance', '')).toBe('planning')
    expect(detectPurpose('National Migration Strategy', 'Roadmap')).toBe('planning')
  })

  it('routes research/news/analysis categories to education', () => {
    expect(detectPurpose('Industry & Research', '')).toBe('education')
    expect(detectPurpose('Threat Analysis', '')).toBe('education')
    expect(detectPurpose('Industry News', '')).toBe('education')
  })

  it('falls back to reference for standards/specs/protocols/policy', () => {
    expect(detectPurpose('Protocols', '')).toBe('reference')
    expect(detectPurpose('NIST Standards', '')).toBe('reference')
    expect(detectPurpose('Government & Policy', '')).toBe('reference')
    expect(detectPurpose('Algorithm Specifications', '')).toBe('reference')
  })

  it('falls back to document_type when manual_category is blank', () => {
    expect(detectPurpose('', 'Migration Playbook')).toBe('planning')
    expect(detectPurpose(undefined, 'Research Paper')).toBe('education')
    expect(detectPurpose('   ', 'Technical Specification')).toBe('reference')
  })
})

describe('resolvePurpose', () => {
  it('prefers a recognized CSV purpose column over the heuristic', () => {
    // manual_category alone would heuristically land 'planning' (contains
    // "Migration"), but a dedicated override should win.
    expect(resolvePurpose('reference', 'Migration Guidance', 'Technical Standard')).toBe(
      'reference'
    )
  })

  it('is case/whitespace-tolerant on the CSV value', () => {
    expect(resolvePurpose(' Education ', 'Industry & Research', '')).toBe('education')
  })

  it('falls back to the heuristic when the CSV value is blank or unrecognized', () => {
    expect(resolvePurpose('', 'Migration Guidance', '')).toBe('planning')
    expect(resolvePurpose(undefined, 'Protocols', '')).toBe('reference')
    expect(resolvePurpose('not-a-real-purpose', 'Protocols', '')).toBe('reference')
  })
})

describe('attachPriorRevisions', () => {
  const item = (referenceId: string, extra: Partial<LibraryItem> = {}): LibraryItem =>
    ({
      referenceId,
      documentTitle: referenceId,
      downloadUrl: '',
      initialPublicationDate: '',
      lastUpdateDate: '',
      documentStatus: 'Draft',
      lifecycleLabel: 'Draft',
      shortDescription: '',
      documentType: '',
      applicableIndustries: [],
      authorsOrOrganization: '',
      dependencies: '',
      regionScope: '',
      algorithmFamily: '',
      securityLevels: '',
      protocolOrToolImpact: '',
      toolchainSupport: '',
      migrationUrgency: '',
      categories: [],
      ...extra,
    }) as LibraryItem
  const prior = (
    referenceId: string,
    supersededBy: string,
    extra: Partial<PriorRevision> = {}
  ): PriorRevision => ({
    referenceId,
    documentTitle: referenceId,
    documentStatus: 'Internet-Draft',
    lifecycleLabel: 'Draft',
    downloadUrl: `https://example.org/${referenceId}`,
    supersededBy,
    deprecatedAt: '2026-06-06',
    ...extra,
  })

  it('attaches deprecated revisions to their surviving record only', () => {
    const items = [item('SURV'), item('OTHER')]
    const priors = [prior('OLD-1', 'SURV'), prior('OLD-2', 'SURV')]
    const out = attachPriorRevisions(items, priors)
    const surv = out.find((i) => i.referenceId === 'SURV')!
    const other = out.find((i) => i.referenceId === 'OTHER')!
    expect(surv.priorRevisions?.length).toBe(2)
    expect(other.priorRevisions).toBeUndefined()
    // deprecated rows never become their own items
    expect(out.map((i) => i.referenceId)).toEqual(['SURV', 'OTHER'])
  })

  it("keeps the survivor's own label: an older revision never raises it", () => {
    const items = [item('SURV', { lifecycleLabel: 'Draft' })]
    const priors = [prior('OLD', 'SURV', { lifecycleLabel: 'Released' })]
    const out = attachPriorRevisions(items, priors)
    expect(out[0].lifecycleLabel).toBe('Draft')
    expect(out[0].priorRevisions?.[0].lifecycleLabel).toBe('Released')
  })

  it('ignores priors with no supersededBy', () => {
    const out = attachPriorRevisions([item('SURV')], [prior('X', '')])
    expect(out[0].priorRevisions).toBeUndefined()
  })

  it('hides a same-RFC-number id-alias prior, but keeps genuine older revisions', () => {
    const surv = item('RFC 8391', { downloadUrl: 'https://www.rfc-editor.org/rfc/rfc8391.html' })
    const aliasOnly = attachPriorRevisions(
      [surv],
      [
        prior('IETF RFC 8391', 'RFC 8391', {
          downloadUrl: 'https://www.rfc-editor.org/rfc/rfc8391.html',
        }),
      ]
    )
    expect(aliasOnly[0].priorRevisions).toBeUndefined() // alias hidden -> no revisions shown

    const mixed = attachPriorRevisions(
      [surv],
      [
        prior('IETF RFC 8391', 'RFC 8391', {
          downloadUrl: 'https://www.rfc-editor.org/rfc/rfc8391.html',
        }),
        prior('draft-old-xmss-02', 'RFC 8391'), // genuine older draft -> kept
      ]
    )
    expect(mixed[0].priorRevisions?.map((r) => r.referenceId)).toEqual(['draft-old-xmss-02'])
  })
})

describe('libraryData revision collapse (real data)', () => {
  it('collapses the Merkle-Tree-Certs revisions into one surviving tile', () => {
    const ids = new Set(libraryData.map((i) => i.referenceId))
    // survivor present, deprecated members absent from the grid
    expect(ids.has('draft-ietf-plants-merkle-tree-certs')).toBe(true)
    expect(ids.has('draft-ietf-tls-merkle-tree-certs')).toBe(false)
    expect(ids.has('draft-ietf-plants-merkle-tree-certs-00')).toBe(false)
    const surv = libraryData.find((i) => i.referenceId === 'draft-ietf-plants-merkle-tree-certs')!
    expect(surv.priorRevisions?.length ?? 0).toBeGreaterThanOrEqual(2)
  })

  it('child instances in the dependency tree carry the same enrichment (priorRevisions)', () => {
    // Regression: buildTree must run AFTER attachPriorRevisions/status so a record
    // reached via parent.children is the SAME enriched object findByRef would return.
    const topLevel = new Map(libraryData.map((i) => [i.referenceId, i]))
    const walk = (items: typeof libraryData) => {
      for (const child of items) {
        const top = topLevel.get(child.referenceId)
        if (top?.priorRevisions?.length) {
          expect(child.priorRevisions?.length).toBe(top.priorRevisions.length)
        }
        if (child.children?.length) walk(child.children)
      }
    }
    walk(libraryData)
  })

  it('never exposes a deprecated row as its own tile', () => {
    // every priorRevision id must NOT appear as a top-level library item
    const ids = new Set(libraryData.map((i) => i.referenceId))
    for (const item of libraryData) {
      for (const rev of item.priorRevisions ?? []) {
        expect(ids.has(rev.referenceId)).toBe(false)
        expect(rev.supersededBy).toBe(item.referenceId)
      }
    }
  })
})

describe('computeCitationCounts', () => {
  it('counts inbound references from the dependencies field', () => {
    // Plan §Tests/Unit #7 — given A.deps=[B]; C.deps=[B], B.citationCount === 2
    const items = [
      { referenceId: 'A', dependencies: 'B' },
      { referenceId: 'B', dependencies: '' },
      { referenceId: 'C', dependencies: 'B' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('B')).toBe(2)
    expect(counts.get('A') ?? 0).toBe(0)
    expect(counts.get('C') ?? 0).toBe(0)
  })

  it('handles semicolon-delimited multi-dep entries', () => {
    const items = [
      { referenceId: 'A', dependencies: 'X; Y; Z' },
      { referenceId: 'B', dependencies: 'X;Y' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('X')).toBe(2)
    expect(counts.get('Y')).toBe(2)
    expect(counts.get('Z')).toBe(1)
  })

  it('ignores self-references and empty entries', () => {
    const items = [
      { referenceId: 'A', dependencies: 'A; ; B' },
      { referenceId: 'B', dependencies: '' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('A') ?? 0).toBe(0)
    expect(counts.get('B')).toBe(1)
  })

  it('returns an empty map when no items have dependencies', () => {
    const items = [
      { referenceId: 'A', dependencies: '' },
      { referenceId: 'B', dependencies: '' },
    ]
    expect(computeCitationCounts(items).size).toBe(0)
  })
})

describe('library lifecycle labels (loader)', () => {
  const rawRow = (extra: Partial<RawLibraryRow> = {}): RawLibraryRow =>
    ({
      reference_id: 'DOC-1',
      document_title: 'Doc 1',
      document_status: 'Published',
      document_type: 'Standard',
      applicable_industries: '',
      dependencies: '',
      status: 'active',
      ...extra,
    }) as RawLibraryRow

  it('shows the label written in lifecycle_state', () => {
    for (const label of LIFECYCLE_LABELS) {
      const item = transformLibraryRow(rawRow({ lifecycle_state: label }))
      expect(item?.lifecycleLabel).toBe(label)
      expect(item?.lifecycleState).toBe(label)
    }
  })

  it('falls back to the status text where lifecycle_state is blank or free text', () => {
    expect(transformLibraryRow(rawRow({ document_status: 'Final' }))?.lifecycleLabel).toBe(
      'Released'
    )
    expect(
      transformLibraryRow(
        rawRow({ document_status: 'Round 4 Submission', lifecycle_state: 'current' })
      )?.lifecycleLabel
    ).toBe('Draft')
    expect(transformLibraryRow(rawRow({ lifecycle_state: '' }))?.lifecycleState).toBeUndefined()
  })

  it('keeps an old spelling in the column working', () => {
    expect(transformLibraryRow(rawRow({ lifecycle_state: 'Superseded' }))?.lifecycleLabel).toBe(
      'Historical'
    )
  })

  it('reads the newer document(s) from superseded_by on an active row', () => {
    expect(transformLibraryRow(rawRow({ superseded_by: 'NEW-1' }))?.supersededByRefs).toEqual([
      'NEW-1',
    ])
    expect(
      transformLibraryRow(rawRow({ superseded_by: 'NEW-1; NEW-2 ' }))?.supersededByRefs
    ).toEqual(['NEW-1', 'NEW-2'])
    expect(transformLibraryRow(rawRow({ superseded_by: '' }))?.supersededByRefs).toBeUndefined()
  })

  it('still skips deprecated rows (they collapse into their survivor instead)', () => {
    expect(transformLibraryRow(rawRow({ status: 'deprecated', superseded_by: 'NEW-1' }))).toBeNull()
  })

  it('gives every document in the real data one of the six labels, read by the same rule', () => {
    for (const item of libraryData) {
      expect(LIFECYCLE_LABELS, item.referenceId).toContain(item.lifecycleLabel)
      expect(item.lifecycleLabel, item.referenceId).toBe(resolveLifecycleLabel(item))
    }
  })

  it('labels a revision group by its current record only (researcher audit, 15 Oct 2026)', () => {
    // Active Internet-Drafts were shown as "Released" because one older revision
    // carried an unrecognised status. The card must match the Lifecycle filter.
    for (const item of libraryData.filter((i) => i.priorRevisions?.length)) {
      expect(LIFECYCLE_LABELS, item.referenceId).toContain(item.lifecycleLabel)
      expect(item, item.referenceId).not.toHaveProperty('groupLifecycleLabel')
    }
    const pqcAuth = libraryData.find((i) =>
      i.referenceId.startsWith('draft-ietf-ipsecme-ikev2-pqc-auth')
    )
    if (pqcAuth) expect(pqcAuth.lifecycleLabel).not.toBe('Released')
  })
})

describe('attachSuccessionLinks', () => {
  const item = (referenceId: string, supersededByRefs?: string[]): LibraryItem =>
    ({ referenceId, supersededByRefs }) as LibraryItem

  it('links an older document to the newer one, and the newer one back', () => {
    const [older, newer] = attachSuccessionLinks([item('OLD', ['NEW']), item('NEW')])
    expect(older.supersededByRefs).toEqual(['NEW'])
    expect(older.replacesRefs).toBeUndefined()
    expect(newer.replacesRefs).toEqual(['OLD'])
    expect(newer.supersededByRefs).toBeUndefined()
  })

  it('lists every older document the newer one replaces, in library order', () => {
    const out = attachSuccessionLinks([item('A', ['NEW']), item('NEW'), item('B', ['NEW'])])
    expect(out.find((i) => i.referenceId === 'NEW')?.replacesRefs).toEqual(['A', 'B'])
  })

  it('keeps several newer documents and drops repeats', () => {
    const out = attachSuccessionLinks([item('OLD', ['N1', 'N2', 'N1']), item('N1'), item('N2')])
    expect(out[0].supersededByRefs).toEqual(['N1', 'N2'])
    expect(out[1].replacesRefs).toEqual(['OLD'])
    expect(out[2].replacesRefs).toEqual(['OLD'])
  })

  it('drops a newer document that is not in the library, so no link can dangle', () => {
    const out = attachSuccessionLinks([
      item('OLD', ['GONE']),
      item('B', ['B2', 'GONE']),
      item('B2'),
    ])
    expect(out[0].supersededByRefs).toBeUndefined()
    expect(out[1].supersededByRefs).toEqual(['B2'])
  })

  it('never links a document to itself', () => {
    const out = attachSuccessionLinks([item('SELF', ['SELF'])])
    expect(out[0].supersededByRefs).toBeUndefined()
    expect(out[0].replacesRefs).toBeUndefined()
  })

  it('leaves documents with no succession untouched', () => {
    const out = attachSuccessionLinks([item('A'), item('B')])
    expect(out.map((i) => [i.supersededByRefs, i.replacesRefs])).toEqual([
      [undefined, undefined],
      [undefined, undefined],
    ])
  })

  it('holds in the real data: every link resolves and every link has its way back', () => {
    const byId = new Map(libraryData.map((i) => [i.referenceId, i]))
    for (const doc of libraryData) {
      for (const ref of doc.supersededByRefs ?? []) {
        expect(byId.get(ref)?.replacesRefs, `${doc.referenceId} -> ${ref}`).toContain(
          doc.referenceId
        )
      }
      for (const ref of doc.replacesRefs ?? []) {
        expect(byId.get(ref)?.supersededByRefs, `${ref} <- ${doc.referenceId}`).toContain(
          doc.referenceId
        )
      }
    }
  })
})

describe('library research topics (loader)', () => {
  const header =
    'reference_id,document_title,document_status,document_type,applicable_industries,dependencies,status'
  const load = (csv: string) =>
    loadLatestCSV<RawLibraryRow, LibraryItem>(
      { './library_01012026.csv': csv },
      /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
      transformLibraryRow
    ).data

  it('gives every row no topics when the CSV has no research_topics column', () => {
    const items = load(`${header}\nDOC-1,Doc 1,Published,Standard,,,active\n`)
    expect(items).toHaveLength(1)
    expect(items[0].researchTopics).toEqual([])
  })

  it('parses the research_topics column when present, keeping only known ids', () => {
    const items = load(
      `${header},research_topics\n` +
        'DOC-1,Doc 1,Published,Standard,,,active,cryptanalysis; Formal-Analysis\n' +
        'DOC-2,Doc 2,Published,Standard,,,active,\n' +
        'DOC-3,Doc 3,Published,Standard,,,active,not-a-topic;quantum-threat\n'
    )
    expect(items.map((i) => i.researchTopics)).toEqual([
      ['cryptanalysis', 'formal-analysis'],
      [],
      ['quantum-threat'],
    ])
  })

  it('every shipped row carries a researchTopics array of known ids', () => {
    for (const item of libraryData) {
      expect(Array.isArray(item.researchTopics)).toBe(true)
      for (const id of item.researchTopics) expect(isResearchTopicId(id)).toBe(true)
    }
  })
})
