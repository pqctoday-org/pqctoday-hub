# EUDI Digital Identity Wallet Module

The EUDI Digital Identity Wallet module simulates the European Digital Identity ecosystem established by eIDAS 2.0 (Regulation EU 2024/1183), which mandates all 27 EU member states provide citizens with at least one EUDI Wallet by late 2026. Learners experience the full credential lifecycle -- issuance, presentation, and qualified electronic signing -- through a five-step interactive workshop. The module covers the Architecture Reference Framework (ARF v3.0.0) attestation formats (mso_mdoc and SD-JWT VC, both mandatory, plus optional W3C VCDM v2.0), the layered trust framework (National Trusted Lists, QTSPs, eIDAS Bridge), privacy-by-design principles (selective disclosure, unlinkability, data minimization), and the post-quantum readiness roadmap for European digital identity.

## Key Concepts

- eIDAS 2.0 regulation: entered into force 20 May 2024; mandatory EUDI Wallets by December 2026; private sector acceptance by late 2027; five implementing regulations adopted 28 November 2024 and published in the Official Journal on 4 December 2024
- Person Identification Data (PID): the foundational credential issued by a national PID Issuer after citizen authentication, upon which all other attestations build
- Credential formats: mso_mdoc (ISO 18013-5, CBOR binary encoding, optimized for proximity via NFC/BLE) and dc+sd-jwt (the SD-JWT VC profile, draft-ietf-oauth-sd-jwt-vc, built on base SD-JWT / RFC 9901, JSON text-based, optimized for remote/online verification; the media type was `vc+sd-jwt` until November 2024)
- Selective disclosure: only requested attributes are revealed to verifiers; all other claims remain cryptographically hidden, enforcing GDPR Article 5(1)(c) data minimization
- Qualified Electronic Attestations (QEAA): issued by certified QTSPs (Qualified Trust Service Providers), listed on National Trusted Lists; carry legal weight across all EU member states
- Qualified Electronic Signatures (QES): digital signatures with the legal equivalent of handwritten signatures under eIDAS 2.0; provided by QTSPs using the CSC (Cloud Signature Consortium) protocol
- Trust framework layers: National Trusted Lists (machine-readable registers of QTSPs per member state), QTSPs (issue QEAAs and provide QES), and the eIDAS Trust Framework bridge for cross-border mutual recognition
- Unlinkability: different presentations to different Relying Parties should not be correlatable; addressed through batch-issued credentials and pseudonymous identifiers
- Relying Party verification: banks, employers, and services verify credentials using selective disclosure and cryptographic proofs without contacting the issuer
- Post-quantum readiness: current implementations use ECDSA (P-256, P-384); ENISA identifies wallet providers as high-impact entities for early PQC adoption. The EU PQC transition dates — national roadmaps by December 2026, high-risk migration by 2030, full transition by 2035 — come from the NIS Cooperation Group "Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography" (11 June 2025), which implements Commission Recommendation (EU) 2024/1101; they are not specified by the EUDI ARF. ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) are expected future replacements
- Large-Scale Pilots: Wave 1 (2023-2025) includes DC4EU (education/social security), EWC (travel/organisational identity), NOBID (payments), POTENTIAL (government, SIM registration, mDL, e-health, payments); Wave 2 (2025-2027) includes APTITUDE (travel credentials/banking) and WE BUILD (business identity)

## Workshop Activities

- **Step 1 -- EUDI Wallet**: View the wallet holder's credentials, cryptographic keys, and activity history
- **Step 2 -- PID Issuer**: Authenticate as a citizen and receive a Person Identification Data credential (mso_mdoc format) from the national PID Issuer
- **Step 3 -- University Attestation**: Obtain a Diploma attestation (SD-JWT format) from a university, which requires a valid PID credential as a prerequisite
- **Step 4 -- Bank (Relying Party)**: Present selective identity attributes to a bank to open an account, demonstrating privacy-preserving credential verification
- **Step 5 -- QTSP (QES)**: Sign a document using a Qualified Electronic Signature via a Trust Service Provider, producing a legally binding digital signature

## Related Standards

- `eIDAS-2-Regulation` — eIDAS 2.0 (Regulation EU 2024/1183): legal framework mandating EUDI Wallets for all 27 EU member states by late 2026
- `EUDI-Wallet-ARF` — EUDI Architecture Reference Framework: technical specification for attestation formats and the trust framework. It specifies no PQC migration roadmap — see `EU PQC Recommendation` for the transition dates
- `ISO-18013-5-mDL` — ISO/IEC 18013-5:2021: mso_mdoc credential format (CBOR binary, proximity via NFC/BLE) and the `org.iso.18013.5.1` namespace; the EUDI `eu.europa.ec.eudi.pid.1` doctype comes from the ARF PID Rulebook, not from ISO. Sold by ISO, so it carries access_type=paid — named and cited, but never presented as a free download
- `RFC-9901-SD-JWT-VC` — RFC 9901: Selective Disclosure for JWTs (base SD-JWT); the SD-JWT VC credential profile is the separate draft-ietf-oauth-sd-jwt-vc (JSON text, optimised for online verification)
- `OpenID4VCI-Spec` — OpenID4VCI (Final): credential issuance protocol used by all EUDI PID and attestation issuers
- `OpenID4VP-Spec` — OpenID4VP (1.0 Final, July 2025): credential presentation protocol for relying party verification. Queries use DCQL; the earlier DIF Presentation Exchange syntax was removed before 1.0
- `CSC-API-v2-Spec` — Cloud Signature Consortium API (V2.2, November 2025): remote QES signing protocol used by QTSPs under eIDAS 2.0
- `ETSI-EN-319-411` — ETSI EN 319 411: QTSP requirements and audit scheme for qualified trust service providers. Note the server-signing/QSCD standards (EN 419 241 series, EN 419 221-5) are CEN deliverables, not ETSI
- `EU PQC Recommendation` — NIS Cooperation Group Coordinated Implementation Roadmap for the PQC transition (11 June 2025), implementing Commission Recommendation (EU) 2024/1101: the source of the Dec 2026 / 2030 / 2035 dates
- `FIPS 204` (ML-DSA) and `FIPS 205` (SLH-DSA): future PQC signature replacements for ECDSA in credential issuance and QES signing
