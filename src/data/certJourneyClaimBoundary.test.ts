// SPDX-License-Identifier: AGPL-3.0-only
//
// Claim-boundary regression checks for the certification-engineer journey
// (review of 15 Oct 2026). Each pattern names the source that contradicts it;
// a match means the wrong claim came back.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')

const ATTACKS = 'src/data/implementationAttackProfiles.ts'
const HSM = 'src/components/PKILearning/modules/HsmPqc'
const CC = 'src/components/PKILearning/modules/ConfidentialComputing'

const BANNED: { file: string; banned: RegExp; why: string }[] = [
  {
    file: ATTACKS,
    banned: /inherently constant-time|no known SCA/i,
    why: 'FIPS 205 §3.2: protect SLH-DSA against side-channel and fault attacks',
  },
  {
    file: ATTACKS,
    banned: /at least as strong as the stronger component/i,
    why: 'SP 800-227 §4.6: holds only for a well-designed scheme with a sound combiner',
  },
  {
    file: ATTACKS,
    banned: /RFC 9180 HPKE or TLS/,
    why: 'RFC 9180 is HPKE, not a hybrid KEM combiner (SP 800-227 §4.6.2)',
  },
  {
    file: ATTACKS,
    banned: /side-channel-vulnerable NIST PQC standard/i,
    why: 'FIPS 206 (FN-DSA) is still in development',
  },
  {
    file: ATTACKS,
    banned: /ML-DSA nonce reuse/,
    why: 'FIPS 204 §3.4: ML-DSA takes no caller-supplied nonce',
  },
  {
    file: `${HSM}/components/HsmPqcIntroduction.tsx`,
    banned: /lack firmware-level PQC|preview-only|v3\.2 draft|v3\.2 Draft/,
    why: 'AWS CloudHSM ML-DSA in the HSM (FIPS mode, hsm2m.medium, 1 Sep 2026); PKCS#11 v3.2 OASIS Standard 3 Jun 2026',
  },
  {
    file: `${HSM}/data/hsmConstants.ts`,
    banned: /CSD01|ML-DSA-44\/65\/87 \(preview\)|SDK update only/,
    why: 'PKCS#11 v3.2 OASIS Standard 3 Jun 2026; AWS CloudHSM ML-DSA generally available',
  },
  {
    file: `${HSM}/data/hsmVendorData.ts`,
    banned: /\(preview\)'|via SDK only|Hardware HSM-backed PQC keys remain roadmap/,
    why: 'AWS CloudHSM ML-DSA in the HSM; Google lists PQC at the SOFTWARE level only',
  },
  {
    file: `${HSM}/curious-summary.md`,
    banned: /v3\.2 draft|preview SDKs/,
    why: 'PKCS#11 v3.2 OASIS Standard; AWS CloudHSM ML-DSA in the HSM',
  },
  {
    file: `${CC}/data/attestationData.ts`,
    banned: /ML-DSA preview via SDK only/,
    why: 'AWS CloudHSM ML-DSA in the HSM',
  },
  {
    file: 'src/components/PKILearning/modules/ArchQuantumImpact/rag-summary.md',
    banned: /AWS CloudHSM \(ML-KEM preview\)/,
    why: 'AWS CloudHSM documents ML-DSA only; no ML-KEM command',
  },
  {
    file: `${HSM}/components/HsmPqcIntroduction.tsx`,
    banned: /PQC delivered via AWS-LC SDK|Native PKCS#11 PQC mechanisms not yet in firmware/,
    why: 'AWS CloudHSM ML-DSA in the HSM via vendor-defined PKCS#11 mechanisms',
  },
  {
    file: 'src/components/PKILearning/modules/CryptoMgmtModernization/components/CryptoApiRefactorAudit.tsx',
    banned: /AWS Crypto Tools SDK/,
    why: 'AWS CloudHSM ML-DSA in the HSM via vendor-defined PKCS#11 mechanisms',
  },
  {
    file: 'src/components/PKILearning/modules/CryptoMgmtModernization/data/hsmVendors.ts',
    banned: /hsm2m instance family \(outside FIPS boundary\)/,
    why: 'ML-DSA in FIPS mode on hsm2m.medium from 1 Sep 2026; not on certificate #4703',
  },
  {
    file: `${HSM}/components/HsmPqcIntroduction.tsx`,
    banned: /^\s*PRODUCTION\s*$/m,
    why: 'vendor badges read the central catalog through STATUS_LABELS; a typed status word drifts',
  },
  {
    file: 'src/components/PKILearning/modules/CryptoMgmtModernization/data/hsmVendors.ts',
    banned: /#4962 \(Luna G7\)/,
    why: 'Luna Network HSM 7 is the K7 module: certificate #4684, firmware 7.8.4 and 7.8.5, no PQC algorithm listed; #4962 is the Luna G7 module',
  },
  {
    file: 'src/components/PKILearning/modules/CryptoMgmtModernization/workshop/RiskAnalysisEngine.tsx',
    banned: /CMVP #4962 active\. PQC in FIPS boundary/,
    why: 'Luna certificate #4684 (firmware 7.8.4 and 7.8.5) lists no PQC algorithm',
  },
  {
    file: 'src/components/PKILearning/modules/KmsPqc/data/kmsProviderData.ts',
    banned: /none are GA yet/,
    why: 'Cloud KMS PQC signing GA 16 Jul 2026 (release notes)',
  },
  {
    file: 'src/components/PKILearning/modules/KmsPqc/data/kmsConstants.ts',
    banned: /X-Wing GA|ML-DSA preview/,
    why: 'Cloud KMS: signing GA, KEMs Preview (release notes)',
  },
  {
    file: 'src/components/Algorithms/algorithmFilterOptions.ts',
    banned: /label: 'Certified'/,
    why: 'algorithms are not certified; the bucket includes FIPS-pending and non-US picks',
  },
  {
    file: 'src/components/Algorithms/AlgorithmsView.tsx',
    banned: /Status = Certified|algorithms safe to deploy/,
    why: 'the status bucket includes FIPS-pending and non-US picks',
  },
  {
    file: 'src/components/PKILearning/modules/StandardsBodies/data.ts',
    banned: /6-year PQC|4 finalists|4 rounds of evaluation/,
    why: 'NIST IR 8413: call for proposals Dec 2016, 7 finalists and 8 alternates in round 3, first algorithms selected July 2022',
  },
  {
    file: 'src/components/PKILearning/modules/StandardsBodies/rag-summary.md',
    banned: /6-year PQC/,
    why: 'NIST IR 8413: call for proposals Dec 2016, first algorithms selected July 2022',
  },
  {
    file: 'src/components/OpenSSLStudio/learn/opensslLessons.ts',
    banned: /kdf \(3\.6\+\)|two brand-new subcommands/,
    why: 'openssl-kdf(1) HISTORY: "Added in OpenSSL 3.0"; only configutl was added in 3.6',
  },
  {
    file: 'src/components/OpenSSLStudio/learn/opensslGlossary.ts',
    banned: /openssl-kdf — new in OpenSSL 3\.6/,
    why: 'openssl-kdf(1) HISTORY: "Added in OpenSSL 3.0"',
  },
]

describe('certification-engineer journey claim boundary (15 Oct 2026 review)', () => {
  for (const { file, banned, why } of BANNED) {
    it(`${file} does not say ${banned} (${why})`, () => {
      expect(read(file)).not.toMatch(banned)
    })
  }

  it('the Validation-tab link on the certification schemes view opens the KAT section', () => {
    expect(read('src/components/Compliance/views/CertEngineerSchemesView.tsx')).toContain(
      "'/algorithms?tab=validation&section=kat'"
    )
  })
})
