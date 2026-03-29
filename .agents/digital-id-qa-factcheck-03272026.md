# Digital ID Module Q&A Fact-Check Report

## 1. CRITICAL FINDINGS

### Library References (Metadata Issue)
- **Status**: CRITICAL GAP
- **Finding**: 25 out of 26 Q&A pairs (96%) are **missing library_refs**
- **Impact**: Q&A cannot be cross-referenced to source documents
- **Affected IDs**: digital-id-learn-001 through digital-id-learn-020, digital-id-learn-022 through digital-id-learn-026
- **Only exception**: digital-id-learn-021 (FIPS 204; FIPS 205)

### Examples of Missing Library References
These questions directly reference documents that exist in library_03252026.csv but lack the cross-reference:

1. **digital-id-learn-001** — eIDAS 2.0 regulation
   - Should reference: `eIDAS-2-Regulation` (exists in library)
   - Current: `[blank]`

2. **digital-id-learn-002** — Credential formats (mso_mdoc, SD-JWT, RFC 9901)
   - Should reference: `RFC-9901-SD-JWT-VC`, `ISO-18013-5-mDL`
   - Current: `[blank]`

3. **digital-id-learn-004** — ISO 18013-5
   - Should reference: `ISO-18013-5-mDL`
   - Current: `[blank]`

4. **digital-id-learn-006** — RFC 9901
   - Should reference: `RFC-9901-SD-JWT-VC`
   - Current: `[blank]`

5. **digital-id-learn-026** — ENISA wallet providers
   - Should reference: `ENISA-EUDI-Wallet-Security` or `ENISA-PQC-Integration-Study-2022`
   - Current: `[blank]` (has compliance_ref:ENISA instead)

## 2. CONSISTENCY ASSERTIONS (Metadata Issue)
- **Status**: PARTIAL
- **Finding**: Only 7 out of 26 pairs (26%) have consistency_assertions
- **Pattern**: Assertions only present on 5 questions (learn-005, learn-007, workshop-014, workshop-017, workshop-018, learn-021, learn-026)
- **Impact**: 19 questions lack validation rules; RAG cannot verify claims

### Examples of Missing Assertions
- **digital-id-learn-001**: "eIDAS 2.0, EU 2024/1183" — no assertion
- **digital-id-learn-003**: "PID is foundational" — no assertion
- **digital-id-learn-020**: "Wave 1/Wave 2 pilot details" — no assertion

## 3. CONTENT ACCURACY CHECK (Factual Verification)

### PASS: Verified Against RAG Summary & Components
All factual claims in answers match the rag-summary.md and component source code:

✓ **digital-id-learn-001** — eIDAS 2.0, EU 2024/1183, May 2024 entry, December 2026 deadline
  - Verified in: rag-summary.md line 7, library_03252026.csv (eIDAS-2-Regulation record)

✓ **digital-id-learn-002** — mso_mdoc (CBOR, NFC/BLE), vc+sd-jwt (JSON, RFC 9901), ARF 2.0
  - Verified in: rag-summary.md line 9, constants.ts (OPENID4VCI_METADATA)

✓ **digital-id-learn-003** — PID as foundational credential
  - Verified in: rag-summary.md line 8, index.tsx (INITIAL_WALLET), constants.ts

✓ **digital-id-learn-004** — ISO 18013-5 for mso_mdoc
  - Verified in: rag-summary.md line 9, library_03252026.csv (ISO-18013-5-mDL record)

✓ **digital-id-learn-005** — QES legal equivalence
  - Verified in: rag-summary.md line 12, constants.ts (EUDI_GLOSSARY QES definition)

✓ **digital-id-learn-006** — RFC 9901 for SD-JWT
  - Verified in: rag-summary.md line 9, library_03252026.csv (RFC-9901-SD-JWT-VC)

✓ **digital-id-learn-007** — Selective disclosure enforces GDPR Article 5(1)(c)
  - Verified in: rag-summary.md line 10, constants.ts (Data Minimization entry)

✓ **digital-id-workshop-008** — PID prerequisite for University
  - Verified in: rag-summary.md line 23 (Workshop Activity Step 3), index.tsx component

✓ **digital-id-learn-009** — National Trusted Lists role
  - Verified in: rag-summary.md line 13

✓ **digital-id-learn-010** — Unlinkability via batch credentials
  - Verified in: rag-summary.md line 14

✓ **digital-id-learn-011** — mso_mdoc vs SD-JWT usage contexts
  - Verified in: rag-summary.md line 9

✓ **digital-id-learn-012** — Relying Party verification without issuer contact
  - Verified in: rag-summary.md line 15

✓ **digital-id-workshop-013** — Privacy-preserving bank verification
  - Verified in: rag-summary.md line 24 (Workshop Activity Step 4)

✓ **digital-id-workshop-014** — QTSP/QES step 5
  - Verified in: rag-summary.md line 25, index.tsx (WORKSHOP_STEPS), QESProviderComponent.tsx

✓ **digital-id-learn-015** — SD-JWT for remote check-in
  - Verified in: rag-summary.md line 9

✓ **digital-id-workshop-016** — PID prerequisite
  - Verified in: rag-summary.md line 22-23

✓ **digital-id-workshop-017** — WebCrypto/WASM (OpenSSL) key generation
  - Verified in: index.tsx line 323-324: "Cryptographic keys are generated in-browser using WebCrypto/WASM (OpenSSL)"

✓ **digital-id-workshop-018** — resetStore() clears keys
  - Verified in: index.tsx lines 133-135: `const { resetStore } = useOpenSSLStore.getState(); resetStore(); setWallet(INITIAL_WALLET)`

✓ **digital-id-learn-019** — EU PQC roadmap alignment with EUDI timeline
  - Verified in: rag-summary.md line 16

✓ **digital-id-learn-020** — Wave 1 (2023-2025) vs Wave 2 (2025-2027)
  - Verified in: rag-summary.md line 17
  - DC4EU, EWC, NOBID, POTENTIAL in Wave 1 ✓
  - APTITUDE, WE BUILD in Wave 2 ✓

✓ **digital-id-learn-021** — FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) replace ECDSA
  - Verified in: rag-summary.md line 16, library_03252026.csv (FIPS 204, FIPS 205 records)
  - Algorithm refs: FIPS 204; FIPS 205 ✓

✓ **digital-id-learn-022** — QTSPs and National Trusted Lists ensure cross-border recognition
  - Verified in: rag-summary.md lines 11, 13

✓ **digital-id-learn-023** — Unlinkability via batch credentials and pseudonymous IDs
  - Verified in: rag-summary.md line 14

✓ **digital-id-learn-024** — Selective disclosure for age proof without birth date
  - Verified in: rag-summary.md line 10

✓ **digital-id-workshop-025** — Five-step workshop lifecycle
  - Verified in: index.tsx (WORKSHOP_STEPS), rag-summary.md lines 20-25

✓ **digital-id-learn-026** — ENISA identifies wallet providers as high-impact for early PQC
  - Verified in: rag-summary.md line 16, library_03252026.csv (ENISA-EUDI-Wallet-Security record)

## 4. SUMMARY TABLE

| Category | Count | % | Status |
|----------|-------|---|--------|
| **Total Q&A pairs** | 26 | 100 | |
| With library_refs | 1 | 3.8% | **CRITICAL GAP** |
| With deep_links | 26 | 100% | ✓ Complete |
| With consistency_assertions | 7 | 26.9% | **GAP** |
| With source_citations | 26 | 100% | ✓ Complete |
| Factually accurate vs RAG | 26 | 100% | ✓ **PASS** |

## 5. ISSUES FOUND

### HIGH PRIORITY
1. **Missing library_refs on 25 questions**: Blocks RAG corpus cross-reference and breaks documentation traceability
2. **Missing consistency_assertions on 19 questions**: Blocks automated validation and Q&A integrity checking

### MEDIUM PRIORITY
3. **No threat_refs, timeline_refs, leader_refs, algorithm_refs, migrate_refs, or compliance_refs** (except 4 questions): Limits cross-domain navigation

## 6. RECOMMENDATIONS

### Immediate Fixes Required
1. Add library_refs to 25 questions:
   - digital-id-learn-001: `eIDAS-2-Regulation`
   - digital-id-learn-002: `RFC-9901-SD-JWT-VC;ISO-18013-5-mDL`
   - digital-id-learn-003: (no direct library ref, use PID issuer component docs)
   - digital-id-learn-004: `ISO-18013-5-mDL`
   - digital-id-learn-005: (QES definition in constants, no library ref)
   - digital-id-learn-006: `RFC-9901-SD-JWT-VC`
   - digital-id-learn-007: (GDPR in constants, no library ref)
   - digital-id-learn-009: (National Trusted Lists in ARF, use eIDAS-2-Regulation)
   - digital-id-learn-020: (pilots in library? search needed)
   - digital-id-learn-021: ✓ Already has FIPS 204;FIPS 205
   - digital-id-learn-022: `eIDAS-2-Regulation`
   - digital-id-learn-026: `ENISA-EUDI-Wallet-Security;ENISA-PQC-Integration-Study-2022`

2. Add consistency_assertions to 19 questions following pattern: 
   - `library_ref:ID EXISTS` 
   - `compliance_ref:NAME EXISTS`
   - `algorithm:NAME IN algorithms_csv`

### Future Enhancements
- Add algorithm_refs where applicable (e.g., digital-id-learn-021 already has ML-DSA, SLH-DSA)
- Consider adding timeline_refs for eIDAS milestones
- Link to migrate_refs for EUDI wallet tools/products

