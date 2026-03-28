# Healthcare PQC — Module Summary

## Overview

Intermediate-level module (75 min, 5 workshop steps) covering post-quantum cryptography migration for the healthcare industry — a sector with the highest density of irreplaceable biometric data, long data retention requirements (PHI, genomic records), life-critical medical device security, and complex regulatory obligations under HIPAA, GDPR Article 9, and FDA cybersecurity guidance.

## Key Topics

- **Biometric data profiles and irreplaceability**: Healthcare holds uniquely irreplaceable biometric data — unlike passwords, biometrics cannot be rotated when compromised. PQC protection priority is driven by replaceability and lifetime sensitivity:
  - Fingerprint (512-byte template, irreplaceable — unique ridge patterns, recommend ML-KEM-768 + ML-DSA-65)
  - Iris (256-byte template, irreplaceable — stable for life, unique per person, ML-KEM-768 + ML-DSA-65)
  - Facial Geometry (2,048-byte template, partially replaceable with difficulty — angle/aging variants, ML-KEM-768 + ML-DSA-65)
  - Voiceprint (4,096-byte template, irreplaceable — voice patterns change gradually with age but remain matchable for 20+ years; compromised voiceprints enable long-term spoofing of voice-authenticated medical commands, ML-KEM-768 + ML-DSA-44)
  - DNA-SNP profile (5 MB genomic data, truly irreplaceable — single lifetime record, highest risk, ML-KEM-1024 + ML-DSA-87)
  - Retinal scan (384-byte template, irreplaceable — vessel patterns are stable and unique, ML-KEM-768 + ML-DSA-65)
- **Pharmaceutical IP and HNDL risk windows**: Drug compound structures (20-year patent protection — active development data encrypted today is HNDL-exposed during critical patent window), clinical trial data (15-year confidentiality obligation, FDA 21 CFR Part 11 audit requirement — signed audit trails must be non-repudiable for 15 years), genomic research datasets (75-year exposure window for participant-linked data — the longest HNDL window in any industry vertical)
- **Patient privacy regulatory landscape**: HIPAA Security Rule (45 CFR § 164.312 — encryption of PHI at rest and in transit; "addressable" standard interpreted as mandatory by OCR post-2023), HIPAA's 18 direct identifiers that constitute PHI, GDPR Article 9 special category data (biometric and genetic data require explicit consent + appropriate technical safeguards), GDPR Right to Erasure (Article 17) conflicts with blockchain-based health record immutability, 7-year minimum PHI retention requirement (longer in many states and jurisdictions)
- **Medical device security**: FDA cybersecurity guidance (September 2023 — mandatory premarket cybersecurity submission requirements for devices with software), IEC 62443-4-2 (component-level security for medical OT), implantable devices (pacemakers, insulin pumps) with 10–15 year in-body lifetimes requiring ultra-low-power crypto — BLE/NFC pairing security models must migrate. Post-market surveillance: FDA expects manufacturers to provide software bill of materials (SBOM) and timely patch for known vulnerabilities including cryptographic weaknesses.
- **Hospital information systems**: EHR/EMR systems (HL7 FHIR R4/R5 API security — OAuth 2.0 + SMART on FHIR, token signing must migrate to ML-DSA), DICOM medical imaging (DICOM Supplement 217 PQC — radiology report digital signatures, ML-DSA for radiologist attestation), telehealth TLS sessions (HIPAA requires encryption — TLS 1.3 + ML-KEM hybrid for video conferencing APIs), pharmacy dispensing systems (barcode/NFC verification, label authentication with ML-DSA-44)
- **HIPAA compliance and PQC timeline**: HIPAA Security Rule requires "adequate encryption" without specifying algorithms — HHS/OCR post-FIPS 203/204/205 guidance (expected 2025–2026) will designate NIST PQC standards as required for new system deployments by 2030. Covered entities and business associates face OCR audits; documented migration plans will be expected as part of compliance posture from 2027 onward.
- **Data retention vs. HNDL intersection**: PHI retention 7+ years, genomic data 75+ years — any asymmetrically encrypted data retained beyond the CRQC horizon is vulnerable to retrospective decryption. Forward secrecy alone does not protect archived records encrypted to long-lived RSA/ECDH public keys; re-encryption of archived data at rest with ML-KEM-derived keys is required.

## Workshop Steps

1. **BiometricVaultAssessor** — Inventory biometric data types by replaceability tier, template size, and storage system; map each to recommended ML-KEM/ML-DSA variant; calculate vault re-keying scope and estimated data re-encryption time for a hospital network with 500K patient records
2. **PharmaIPCalculator** — Model HNDL exposure windows for drug development data: compound library (20-year window), clinical trial data (15-year window), genomic cohort (75-year window); calculate risk score by data category and current encryption algorithm; output migration priority ranking
3. **PatientPrivacyMapper** — Map HIPAA 18-identifier PHI categories to encryption requirements; model GDPR Article 9 data flows for cross-border patient data (EU → US); identify Right to Erasure conflicts with immutable record stores; design crypto-shredding approach using ML-KEM key deletion
4. **DeviceSafetySimulator** — Assess implantable and connected medical device crypto: pacemaker BLE pairing (ML-KEM constrained variant), insulin pump NFC session, MRI scanner DICOM TLS; model post-market surveillance timelines for firmware crypto updates per FDA 2023 guidance
5. **HospitalMigrationPlanner** — Build a phased migration plan for a 5,000-bed health system: EHR TLS/FHIR API signing, DICOM signing, telehealth TLS, pharmacy dispensing, biometric vault, PHI archive re-encryption; map against HIPAA compliance checkpoints and OCR audit readiness milestones

## Key Data Points

- DNA-SNP genomic data: 5 MB per patient, truly irreplaceable — requires ML-KEM-1024 (strongest PQC KEM) + ML-DSA-87 for any genomic database that may be retained 50+ years
- Retinal scan template: 384 bytes — smallest biometric template; irreplaceability = highest protection tier despite small size
- HIPAA PHI breach cost: average $10.9M per incident (IBM Cost of a Data Breach Report 2024) — quantum-enabled mass decryption of archived RSA-encrypted PHI would be catastrophic
- DICOM image study size: 50 MB–500 MB per study; ML-DSA-65 signature (3,309 bytes) adds negligible overhead (<0.01%) to study payload
- HL7 FHIR API token: JWT signed with RS256 (RSA-2048) — replace with ES384 (ECDSA P-384) now, migrate to ML-DSA-44 when JOSE WG finalizes PQC JWA draft (expected 2025–2026)
- Implantable device power budget: pacemaker crypto coprocessor ~50 µW — ML-KEM constrained variants (ML-KEM-512) and AES-128-CCM are feasible; full ML-DSA-44 verification (~1 ms compute) within acceptable range for infrequent pairing operations
- PHI re-encryption scope: 7-year retention × average hospital 10M records × 256-byte AES key blob = ~17 GB of key material to be re-wrapped with ML-KEM-768; operational planning required for batch re-encryption
- GDPR Article 83 fine for special category data breach: up to 4% of global annual turnover or €20M — EU enforcement of quantum-vulnerable genomic data protection expected post-2030
- Genomic HNDL window: 75-year retention starting 2026 = data exposed through 2101 — far beyond any CRQC projection; absolute priority for immediate ML-KEM migration

## Standards Referenced

- HIPAA Security Rule (45 CFR Part 164) — PHI encryption standards and administrative safeguards
- GDPR Articles 9, 17, 32 — Special category data, Right to Erasure, technical security measures
- FDA Cybersecurity in Medical Devices Guidance (September 2023) — premarket and post-market requirements
- IEC 62443-4-2 — Security for Industrial Automation and Control Systems: Component Requirements
- HL7 FHIR R4/R5 — Fast Healthcare Interoperability Resources (API security)
- DICOM Supplement 217 — Post-Quantum Cryptography (digital signature migration)
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
