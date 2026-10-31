# ACVP Lab Workflow: From Vector Set to Evidence

**Status: corrected since the PQC Today owner's last sign-off; awaiting re-sign-off. Not yet reviewed by an accredited laboratory or certification body. Not a lab training resource.**

## Overview

Advanced module on how cryptographic algorithm validation testing actually runs and how to state a result at exactly the evidence level it reached. It separates algorithm validation (CAVP, run black-box through NIST's ACVTS) from module validation (CMVP, FIPS 140-3, tested by accredited CST laboratories), walks the ACVP lifecycle from capability registration to validation record, and shows where standard PKCS#11 v3.2 has no field for an ACVP test group's input and how this HSM accepts such inputs as optional test inputs outside the standard. It is the algorithm-testing companion to the pqc-testing-validation module.

## Key Concepts

- **Algorithm vs module validation** — CAVP validates algorithm implementations and is a prerequisite of CMVP module validation (NIST CAVP page); CMVP validates modules to FIPS 140-3 (eleven requirement areas, four levels) with NVLAP-accredited CST labs; labs must also confirm algorithm "shall" statements CAVP testing does not cover (CMVP Management Manual v2.7 §2.6.2)
- **Registration and vector sets** — the client registers algorithm/mode/revision capabilities; ACVTS generates matching test vector sets (vsId) of test groups (tgId) and test cases (tcId) (ACVP spec §3.2, §5.4); revision is part of the identity (ML-DSA sigGen FIPS204 vs FIPS204-tr1)
- **Lifecycle** — POST testSessions → GET vector set (prompt) → POST results (response) → GET results (disposition: passed/fail/incomplete/expired/missing/unreceived/error) → PUT testSessions (certify with module + OE) → validation id (ACVP spec §12.4); vector sets are one-time use for a validation authority (§14); ACVTS Demo is a sandbox, only Prod (accredited labs) creates CAVP certificates
- **Test types** — AFT, VAL (ML-KEM decapsulation incl. implicit rejection; key checks), MCT and LDT (SHA), ML-DSA rejection-path tests; minimum test counts per capability combination (usnistgov/ACVP sub-specifications)
- **Deterministic vs randomized** — FIPS 203/204/205 internal interfaces take randomness as input; tests that must supply the random input use them, and the current ACVP ML-DSA specification supports testing both internal and external interfaces (§6.1.2). Two correct ML-DSA implementations signing the same message in hedged mode can produce different signatures — check that both verify; in an ACVP sigGen test the test supplies the random input and the expected signature must match exactly; ML-DSA/SLH-DSA hedged vs deterministic variants; comparator policy (byte vs semantic)
- **PKCS#11 adapter boundaries** — standard PKCS#11 has no field for ML-KEM m, ML-DSA rnd, SLH-DSA addrnd, ECDSA k or the SLH-DSA internal interface; this HSM accepts each as an optional test input outside the standard (CKM_ML_KEM / CKM_ECDSA parameter; an extended signing structure with pRandom, ulRandomLen, messageEncoding), and every result that used one is labelled "test input supplied (outside the standard)"; FIPS 203/204/205 reserve such interfaces for testing and a validated module would keep them out of its approved mode; ML-DSA internal goes through the external-μ mechanism (0x403c, PKCS#11 v3.3 working draft) with μ = SHAKE256(tr ‖ M′, 64) computed by the harness; SHA2-512/224 and SHA2-512/256 pre-hash use the generic CKM_HASH_ML_DSA / CKM_HASH_SLH_DSA; ML-KEM key checks are not a PKCS#11 operation; deterministic sigGen via CKH_DETERMINISTIC_REQUIRED
- **Negative testing** — ACVP sigVer modifications (ML-DSA, SLH-DSA incl. too long/short), ML-KEM modified ciphertexts and invalid keys; requirements ACVP does not test; API-level negatives
- **Evidence provenance** — the Hub's eight evidence classes and permitted claims, the nine-rung claim ladder (Hub policy), tested-scope rule, provenance by SHA-256 against a pinned ACVP-Server commit (not by the isSample flag), generated counts
- **Cross-implementation limits** — the two Hub engines share adapter code, so agreement is differential evidence, not independent validation; results bind to an operational environment
- **Contributing** — vector manifest workflow (scaffold, provenance, lineage, audit, generated counts), two-person review, never commit issued vectors

## Workshop / Interactive Activities

1. **Evidence Classifier** — classify ten test-log observations into the eight evidence classes or "not test evidence"; see the claim-ladder rung, permitted claim and the overclaim trap
2. **Vector Set Anatomy** — parse a public NIST ACVP-Server sample (ML-KEM encapDecap or ML-DSA sigVer) with the Hub's ACVP-format prototype parser and predict per test group whether standard PKCS#11 calls can answer it (Step 3 then shows what the engines' test-only inputs add)
3. **Response Artifact Lab** — save the public prompt, run it through the real ACVP-format prototype panel on the C++ or Rust engine (every test of both samples is answered; the answers are counted by how they were obtained: standard PKCS#11 v3.2 calls, calls to the vendor-defined external-μ mechanism with the μ NIST supplies, NIST's random value m as a test-only input, a value computed outside the engine, or the result of importing a key), download response.json + evidence.json, compare with NIST expectedResults.json, and audit evidence.json (a collapsed explanation covers every part of the file and why it exists)

## Related Standards

- ACVP JSON specification (draft-ietf-acvp-spec-01) and usnistgov/ACVP algorithm sub-specifications (ML-KEM, ML-DSA, SLH-DSA, SHA)
- FIPS 140-3, CMVP Management Manual v2.7, NIST SP 800-140C
- FIPS 203, FIPS 204, FIPS 205
- PKCS #11 v3.2 (OASIS Standard) and PKCS #11 Profiles v3.2
