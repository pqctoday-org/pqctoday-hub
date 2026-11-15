# Decommissioning & Program Closure

## Overview

This module covers the end of a post-quantum migration — two jobs that are routinely neglected: decommissioning classical cryptography on a defensible schedule, and closing the program into business-as-usual. The independently-sourced spine is the deprecation timeline (NIST IR 8547, final October 2026: deprecate quantum-vulnerable public-key after 2030, disallow after 2035). Verification-by-observed-behaviour, the estate-scale sampling approach, and the PQC-specific closure detail are presented as practitioner guidance.

## Key Concepts

- **Decommissioning** — the migration is done when the classical cryptography is gone, not when PQC is added. Discipline: deprecate → remove → **verify removed** → log. Schedule anchored to NIST IR 8547 (deprecated after 2030 / disallowed after 2035) and SP 800-131A.
- **Verification by observed behaviour** (practitioner) — prove migration by capturing the handshake and confirming ML-KEM/ML-DSA was negotiated, not by trusting a change ticket. Reuse the Active PQC Scanner and passive handshake capture. Control basis: NIST CSWP 48 (draft) → CSF 2.0 / SP 800-53.
- **Coverage at estate scale** (practitioner) — verify business-critical systems fully, sample lower tiers per migration wave, widen the check on any sampled failure.
- **Program closure** (practitioner + ISO/RMF) — define closure criteria in advance; accept residual risk with a named owner and re-evaluation date; transfer standing capabilities (CBOM, continuous discovery, vendor cadence, SOC content, KRIs, crypto-agility) to permanent owners; archive an evidence dossier. Generic governance: ISO/IEC 27001, NIST SP 800-37 (RMF).
- **Evidence-chain verification & ACVP vs. module boundary validation** — NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`). CMVP FIPS 140-3 validates a cryptographic module against its security requirements (module specification and boundary, interfaces, self-tests, key and SSP zeroization, physical security, with entropy sources validated separately under SP 800-90B); non-invasive (side-channel) requirements are currently N/A by default. Common Criteria/EUCC evaluates the product against its own Security Target, and only what the ST claims. When reading a production certificate, a useful check is: the certificate or module number and its status (active, historical or revoked); the exact module or product name and version; the tested operational environment or configuration (CMVP: Security Policy; CC: evaluated configuration in the certification report); the CAVP algorithm certificate numbers listed for the algorithms you rely on; and, for CC/EUCC, the Security Target and assurance level it claims. This is Hub practice guidance, not a certification-scheme requirement. A sample Hub exercise export or a vendor marketing datasheet is never certification evidence.

## Standards & Sources

NIST IR 8547, NIST SP 800-131A, NIST CSWP 48 (draft), NIST CSF 2.0, NIST SP 800-53, NIST SP 800-37 (RMF), NCSC-UK migration timelines, ETSI TR 103 619 / TR 104 016, Dutch PQC Migration Handbook (AIVD/CWI/TNO), ISO/IEC 27001.
