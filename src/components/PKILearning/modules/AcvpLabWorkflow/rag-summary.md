# ACVP Lab Workflow: From Vector Set to Evidence

**Status: DRAFT — awaiting review by a validation-lab practitioner. Not a lab training resource.**

## Overview

Advanced module on how cryptographic algorithm validation testing actually runs and how to state a result at exactly the evidence level it reached. It separates algorithm validation (CAVP, run black-box through NIST's ACVTS) from module validation (CMVP, FIPS 140-3, tested by accredited CST laboratories), walks the ACVP lifecycle from capability registration to validation record, and shows where a PKCS#11 v3.2 test adapter cannot follow an ACVP test group. It is the algorithm-testing companion to the pqc-testing-validation module.

## Key Concepts

- **Algorithm vs module validation** — CAVP validates algorithm implementations and is a prerequisite of CMVP module validation (NIST CAVP page); CMVP validates modules to FIPS 140-3 (eleven requirement areas, four levels) with NVLAP-accredited CST labs; labs must also confirm algorithm "shall" statements CAVP testing does not cover (CMVP Management Manual v2.7 §2.6.2)
- **Registration and vector sets** — the client registers algorithm/mode/revision capabilities; ACVTS generates matching test vector sets (vsId) of test groups (tgId) and test cases (tcId) (ACVP spec §3.2, §5.4); revision is part of the identity (ML-DSA sigGen FIPS204 vs FIPS204-tr1)
- **Lifecycle** — POST testSessions → GET vector set (prompt) → POST results (response) → GET results (disposition: passed/fail/incomplete/expired/missing/unreceived/error) → PUT testSessions (certify with module + OE) → validation id (ACVP spec §12.4); vector sets are one-time use for a validation authority (§14); ACVTS Demo is a sandbox, only Prod (accredited labs) creates CAVP certificates
- **Test types** — AFT, VAL (ML-KEM decapsulation incl. implicit rejection; key checks), MCT and LDT (SHA), ML-DSA rejection-path tests; minimum test counts per capability combination (usnistgov/ACVP sub-specifications)
- **Deterministic vs randomized** — FIPS 203/204/205 internal interfaces take randomness as input and exist for CAVP testing; ML-DSA/SLH-DSA hedged vs deterministic variants; comparator policy (byte vs semantic)
- **PKCS#11 adapter boundaries** — ML-KEM encapsulation AFT needs server-chosen m that C_EncapsulateKey cannot accept; ML-KEM key checks are not a PKCS#11 operation; ML-DSA internal interface on M′ has no PKCS#11 v3.2 mechanism; External μ runs only through the engines' non-standard mechanism code 0x403c; hedged sigGen rnd cannot be injected (CKH_HEDGE_REQUIRED has no rnd input); deterministic sigGen via CKH_DETERMINISTIC_REQUIRED
- **Negative testing** — ACVP sigVer modifications (ML-DSA, SLH-DSA incl. too long/short), ML-KEM modified ciphertexts and invalid keys; requirements ACVP does not test; API-level negatives
- **Evidence provenance** — the Hub's eight evidence classes and permitted claims, the nine-rung claim ladder (Hub policy), tested-scope rule, provenance by SHA-256 against a pinned ACVP-Server commit (not by the isSample flag), generated counts
- **Cross-implementation limits** — the two Hub engines share adapter code, so agreement is differential evidence, not independent validation; results bind to an operational environment
- **Contributing** — vector manifest workflow (scaffold, provenance, lineage, audit, generated counts), two-person review, never commit issued vectors

## Workshop / Interactive Activities

1. **Evidence Classifier** — classify ten test-log observations into the eight evidence classes or "not test evidence"; see the claim-ladder rung, permitted claim and the overclaim trap
2. **Vector Set Anatomy** — parse a public NIST ACVP-Server sample (ML-KEM encapDecap or ML-DSA sigVer) with the Hub's ACVP-format prototype parser and predict per test group whether PKCS#11 can answer it
3. **Response Artifact Lab** — save the public prompt, run it through the real ACVP-format prototype panel on the C++ or Rust engine, download response.json + evidence.json, compare with NIST expectedResults.json, and audit evidence.json

## Related Standards

- ACVP JSON specification (draft-ietf-acvp-spec-01) and usnistgov/ACVP algorithm sub-specifications (ML-KEM, ML-DSA, SLH-DSA, SHA)
- FIPS 140-3, CMVP Management Manual v2.7, NIST SP 800-140C
- FIPS 203, FIPS 204, FIPS 205
- PKCS #11 v3.2 (OASIS Standard) and PKCS #11 Profiles v3.2
