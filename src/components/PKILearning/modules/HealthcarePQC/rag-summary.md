# Healthcare PQC — Module Summary

## Overview

Intermediate-level module (60 min, 5 workshop steps) covering post-quantum cryptography migration for the healthcare industry — a sector with the highest density of irreplaceable biometric data, long data retention requirements (PHI, genomic records), life-critical medical device security, and complex regulatory obligations under HIPAA, GDPR Article 9, and FDA cybersecurity guidance.

## Key Topics

- **Biometric data profiles and irreplaceability**: Healthcare holds uniquely irreplaceable biometric data — unlike passwords, biometrics cannot be rotated when compromised. PQC protection priority is driven by replaceability and lifetime sensitivity:
  - Fingerprint (512-byte template, irreplaceable — unique ridge patterns, recommend ML-KEM-768 + ML-DSA-65)
  - Iris (256-byte template, irreplaceable — stable for life, unique per person, ML-KEM-768 + ML-DSA-65)
  - Facial Geometry (2,048-byte template, partially replaceable with difficulty — angle/aging variants, ML-KEM-768 + ML-DSA-65)
  - Voiceprint (4,096-byte template, irreplaceable — voice patterns change gradually with age but remain matchable for 20+ years; compromised voiceprints enable long-term spoofing of voice-authenticated medical commands, ML-KEM-768 + ML-DSA-44)
  - DNA-SNP profile (5 MB genomic data, truly irreplaceable — single lifetime record, highest risk, ML-KEM-1024 + ML-DSA-87)
  - Retinal scan (384-byte template, irreplaceable — vessel patterns are stable and unique, ML-KEM-768 + ML-DSA-65)
- **Pharmaceutical IP and HNDL risk windows**: Drug compound structures (20-year patent protection — active development data encrypted today is HNDL-exposed during critical patent window), clinical trial data (FDA 21 CFR Part 11 governs electronic records and signatures and requires audit trails to be kept at least as long as the records they cover; the retention period itself comes from the applicable predicate rule — for IND investigators, 21 CFR 312.62(c): 2 years after the marketing application is approved, or 2 years after the investigation is discontinued and FDA is notified — plus sponsor, jurisdiction and contract terms, such as the EU Clinical Trials Regulation 536/2014 Art. 58 minimum of 25 years for the trial master file; determine the period before sizing HNDL exposure), genomic research datasets (participant-linked data stays sensitive for the participant's lifetime and affects relatives, among the longest HNDL exposures in healthcare; the module models it as a 75-year site estimate)
- **Patient privacy regulatory landscape**: HIPAA Security Rule (45 CFR § 164.312 — encryption and decryption of electronic PHI under the access-control standard, and encryption of electronic PHI in transmission, are each an "addressable" implementation specification: implement it if reasonable and appropriate, or document why not and implement an equivalent alternative measure if reasonable and appropriate), HIPAA's 18 direct identifiers that constitute PHI, GDPR Article 9 special category data (biometric and genetic data may be processed only under an Article 9(2) condition such as explicit consent, health-care provision or research, with appropriate safeguards), GDPR Right to Erasure (Article 17) conflicts with blockchain-based health record immutability, a 6-year retention requirement for HIPAA compliance documentation such as policies, procedures and risk assessments (45 CFR § 164.316(b)(2)); how long the medical records themselves are kept is set by state law and is often longer
- **Medical device security**: FDA premarket cybersecurity guidance (current edition 3 February 2026, first issued September 2023 — nonbinding recommendations, including cryptography that is expected to stay cryptographically strong throughout the service life of the device; the guidance does not name quantum computers or PQC algorithms). Section 524B of the FD&C Act separately requires sponsors of "cyber devices" — devices that include software, can connect to the internet and could be vulnerable to cybersecurity threats — to submit a plan to monitor, identify and address postmarket vulnerabilities (including coordinated vulnerability disclosure), to design, develop and maintain processes and procedures that give reasonable assurance that the device and related systems are cybersecure, and to provide a software bill of materials (SBOM), in 510(k), PMA, PDP, De Novo and HDE submissions. IEC 62443-4-2 (component-level security for medical OT), implantable devices (pacemakers, insulin pumps) with 10–15 year in-body lifetimes requiring ultra-low-power crypto — BLE/NFC pairing security models must migrate. Post-market: under section 524B(b)(2)(A) of the FD&C Act, manufacturers of cyber devices must make updates and patches available for known unacceptable vulnerabilities on a reasonably justified regular cycle.
- **Hospital information systems**: EHR/EMR systems (HL7 FHIR R4/R5 API security — OAuth 2.0 + SMART on FHIR, token signing must migrate to ML-DSA), DICOM medical imaging (no DICOM supplement adding PQC digital signature support exists yet — DICOM Supplement 217 is titled "Neurophysiology Waveforms" and is unrelated; radiology report signatures are defined in DICOM PS3.15's Digital Signatures profile, which supports pluggable algorithm registration via OID, so ML-DSA would need a new signature algorithm identifier registered under that existing framework once proposed and ratified), telehealth TLS sessions (encryption in transit is an addressable HIPAA specification — TLS 1.3, specified in RFC 9846, with an ML-KEM hybrid key agreement as defined in RFC 10024, for video conferencing APIs), pharmacy dispensing systems (barcode/NFC verification, label authentication with ML-DSA-44). In the US, the ONC health IT certification criteria for certified EHR software that cover end-user device encryption, integrity and trusted connection (§ 170.315(d)(7)–(d)(9)) refer to NIST-approved encryption and SHA-2 or stronger hashing and name no post-quantum algorithm
- **HIPAA compliance and PQC timeline**: The HIPAA Security Rule in force (45 CFR Part 164 Subpart C, eCFR text current to 23 September 2026) names no encryption algorithms and sets no post-quantum date; HHS lists OCR's proposed rewrite of it separately from the rule in effect (HHS page last reviewed 7 August 2026), so plan migration phases against your own risk and treat any specific HIPAA year you see quoted as a guess. Covered entities and business associates face OCR audits, so a documented migration plan helps show that quantum risk was assessed.
- **Data retention vs. HNDL intersection**: PHI retention 7+ years, genomic data 75+ years — any asymmetrically encrypted data retained beyond the CRQC horizon is vulnerable to retrospective decryption. Forward secrecy alone does not protect archived records encrypted to long-lived RSA/ECDH public keys; re-encryption of archived data at rest with ML-KEM-derived keys is required.

## Workshop Steps

1. **BiometricVaultAssessor** — Inventory biometric data types by replaceability tier, template size, and storage system; map each to recommended ML-KEM/ML-DSA variant; calculate vault re-keying scope and estimated data re-encryption time for a hospital network with 500K patient records
2. **PharmaIPCalculator** — Model HNDL exposure for drug development data by pipeline stage (discovery, preclinical, Phase I–III, FDA review, post-market), each with a site-estimated number of years until the data stops being sensitive (from 20 years at discovery to 2 years post-market); calculate risk score by stage and current encryption algorithm; output migration priority ranking
3. **PatientPrivacyMapper** — Map HIPAA 18-identifier PHI categories to encryption requirements; model GDPR Article 9 data flows for cross-border patient data (EU → US); identify Right to Erasure conflicts with immutable record stores; design crypto-shredding approach using ML-KEM key deletion
4. **DeviceSafetySimulator** — Assess implantable and connected medical device crypto: pacemaker BLE pairing (ML-KEM constrained variant), insulin pump NFC session, MRI scanner DICOM TLS; model post-market surveillance timelines for firmware crypto updates under FDA's premarket cybersecurity guidance; its PQC readiness checklist is module-authored, derived from FDA's service-life cryptography recommendation
5. **HospitalMigrationPlanner** — Build a phased migration plan for a 5,000-bed health system: EHR TLS/FHIR API signing, DICOM signing, telehealth TLS, pharmacy dispensing, biometric vault, PHI archive re-encryption; map against HIPAA compliance checkpoints and OCR audit readiness milestones

## Key Data Points

- DNA-SNP genomic data: 5 MB per patient, truly irreplaceable — requires ML-KEM-1024 (strongest PQC KEM) + ML-DSA-87 for any genomic database that may be retained 50+ years
- Retinal scan template: 384 bytes; irreplaceability = highest protection tier despite small size
- HIPAA PHI breach cost: average $9.77M per healthcare breach (IBM Cost of a Data Breach Report 2024) — quantum-enabled mass decryption of archived RSA-encrypted PHI would be catastrophic
- DICOM image study size: 50 MB–500 MB per study; ML-DSA-65 signature (3,309 bytes) adds negligible overhead (<0.01%) to study payload
- HL7 FHIR API token: JWT signed with RS256 (RSA-2048) — replace with ES384 (ECDSA P-384) now, migrate to ML-DSA-44 (ML-DSA-44, ML-DSA-65 and ML-DSA-87 are registered for JOSE and COSE in RFC 9964, May 2026)
- Implantable device power budget (a planning assumption, not a measurement): a pacemaker-class device has a very small power budget, and this module treats ML-KEM-512 and AES-128-CCM as feasible there
- PHI re-encryption scope (assuming about 7 years of retained records; state medical-record rules vary): 7 years × average hospital 10M records × 256-byte AES key blob = ~17 GB of key material to be re-wrapped with ML-KEM-768; operational planning required for batch re-encryption
- GDPR Article 83 fine for special category data breach: up to 4% of global annual turnover or €20M — EU enforcement of quantum-vulnerable genomic data protection expected post-2030
- Genomic HNDL window: 75-year retention starting 2026 = data exposed through 2101 — far beyond any CRQC projection; absolute priority for immediate ML-KEM migration

## Standards Referenced

- HIPAA Security Rule (45 CFR Part 164) — PHI encryption standards and administrative safeguards
- GDPR Articles 9, 17, 32 — Special category data, Right to Erasure, technical security measures
- FDA Cybersecurity in Medical Devices guidance (current edition 3 February 2026, first issued September 2023) — nonbinding recommendations for premarket submissions, including cybersecurity management plans for vulnerabilities found after release; FD&C Act section 524B for cyber-device submissions
- IEC 62443-4-2 — Security for Industrial Automation and Control Systems: Component Requirements
- HL7 FHIR R4/R5 — Fast Healthcare Interoperability Resources (API security)
- RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3 (July 2026)
- RFC 10024 — Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3 (August 2026)
- ONC health IT certification criteria § 170.315(d)(7) end-user device encryption, (d)(8) integrity, (d)(9) trusted connection
- DICOM PS3.15 — Digital Signatures profile (pluggable algorithm registration; no PQC signature supplement exists yet)
- NIST SP 800-111 — Guide to Storage Encryption Technologies for End User Devices
- FIPS 203 (ML-KEM) — key encapsulation for PHI archive re-encryption and FHIR API session keys
- FIPS 204 (ML-DSA) — digital signatures for DICOM radiology reports and FHIR audit logs
- FIPS 205 (SLH-DSA) — stateless signing for long-lived genomic data provenance records
- 21 CFR Part 11 — Electronic Records and Electronic Signatures (FDA audit trail integrity)
- NIST SP 800-66 Rev. 2 — Implementing the HIPAA Security Rule

## Cross-References

- `data-asset-sensitivity` — PHI and genomic data sensitivity classification (GDPR/HIPAA mapping)
- `kms-pqc` — hospital KMS for PHI archive re-encryption key management
- `hsm-pqc` — HSM-protected signing keys for DICOM report signing and FHIR token issuance
- `iot-ot-pqc` — connected medical device and implantable device PQC constraints
- `digital-id` — patient identity verification, mDL integration for clinical authentication
- `tls-basics` — telehealth TLS 1.3 migration and FHIR API transport security
- `compliance-strategy` — HIPAA/GDPR compliance framework integration for PQC migration documentation
- Quiz: 15 questions (hpq-001 through hpq-015)
