# Financial Services & Payments PQC — RAG Summary

## Module Overview

Advanced-level module (120 min, 8 workshop steps, three learner paths) covering post-quantum cryptography migration across the whole payments and banking estate: the EMV card ecosystem (14.7 billion chip cards at the end of 2024, across Visa, Mastercard, Amex, UnionPay and Discover — the world's largest deployed PKI), retail and card-not-present acceptance, interbank settlement rails, bank key management, open banking APIs and PSD2 Strong Customer Authentication, and the sector regulation setting the pace.

Three paths so no audience is asked for the full 120 minutes: **Cards & Acceptance** (55 min, issuers/acquirers/processors/terminal estates), **Banking & Settlement** (55 min, banks/central banks/financial market infrastructure), **Retail & E-Commerce** (25 min, merchants/PSPs/platforms).

## Key Topics

- **EMV Card Authentication**: SDA (static RSA), DDA (dynamic RSA per-transaction), CDA (combined with application cryptogram). All use RSA-2048 certificate chains vulnerable to quantum computers.
- **Payment Network Comparison**: 5 networks compared by scale, crypto stack, PQC posture and readiness. Mastercard is the only card network to have published a dedicated PQC white paper; UnionPay has the largest card base (9.4B), tied to China's GB/T standards, which are still in development.
- **Transaction Flows**: Online authorization (ARQC/ARPC symmetric MACs — quantum-safe), offline DDA/CDA (RSA signatures — quantum-vulnerable), contactless, and mobile payment flows.
- **Card Provisioning**: 5-phase process (Chip OS, Pre-Perso, Personalization, Key Injection, Activation) with RSA certificate chain. FN-DSA-512 (666-byte signatures, ~6.7 KB chain) preferred over ML-DSA-44 (2,420-byte signatures, ~15.3 KB chain) for constrained card NVM. FIPS 206 is still in preparation.
- **Tokenization**: TSP architectures (Visa VTS, Mastercard MDES, Amex EST) replacing PANs with tokens. Mobile wallets (Apple Pay, Google Pay, Samsung Pay) with secure element details. Per-transaction cryptograms are AES and quantum-safe; the exposure is in provisioning.
- **E-Commerce, CNP & Retail Checkout**: TLS-borne cardholder data and 3-D Secure 2.x ECDSA challenge signing. The fastest migration path in the estate — hybrid ML-KEM TLS 1.3 is already deployable.
- **POS Terminals**: 5 types (Traditional POS, mPOS, SoftPOS, ATM, Unattended) with DUKPT key management. The DUKPT derivation chain is symmetric and quantum-safe; the Key Injection Facility ceremony's RSA-2048 transport of the BDK is the quantum vulnerability.
- **Interbank Rails & Settlement**: Swift messaging (FIN / ISO 20022), domestic RTGS, and correspondent banking chains. HNDL exposure is driven by how long data stays sensitive, not by a guessed CRQC date. The correspondent chain cannot be migrated unilaterally, which is why the sector publishes jointly.
- **Banking Key Management & Key Blocks**: A key wrapped together with its usage attributes so it cannot be repurposed — the attribute binding is the security property. The current standard is ANSI X9.143, not the more frequently cited X9 TR-31. X9.143, X9.24-1/-2 and TR-31 are paywalled and are cited as normative-but-unobtainable rather than paraphrased.
- **Sector Regulation**: Eight bodies across five jurisdictions — BIS Project Leap Phase 2, G7 Cyber Expert Group, UK CMORG, Europol Quantum Safe Financial Forum, FS-ISAC, MAS, DORA, and the EU NIS CG Coordinated Implementation Roadmap. Unlike Government & Defense, none carries a dated _algorithm_ mandate of the CNSA 2.0 kind — but the EU roadmap sets a dated _transition expectation_ (high-risk use cases by end-2030) that reaches EU banks via NIS2/DORA, without naming an algorithm. Otherwise, pressure comes from operational-resilience regulation and HNDL exposure.
- **Open Banking & PSD2 Strong Customer Authentication**: PSD2 Article 97 requires two-factor SCA (knowledge/possession/inherence) and dynamic transaction linking for remote payments. Its RTS (Commission Delegated Regulation (EU) 2018/389) implements the "dedicated interface" third-party providers use to access accounts (Art. 30), a mandatory fallback if that interface fails (Art. 33), eIDAS qualified certificates (QSealC/QWAC) for AISP/PISP identification (Art. 34), and a channel-encryption requirement worded as "strong and widely recognised encryption techniques" — deliberately technology-neutral, naming no algorithm or TLS version, so PQC migration needs no legislative change.
- **Migration Planning**: 10 payment components mapped by severity and effort. Critical path: HSM key wrapping → KIF key injection → card personalization → offline auth. Minimum timeline 5-7 years, set by the 3-5 year card replacement cycle.

## Workshop Steps

1. Payment Network Comparator (filter, compare, radar chart)
2. Transaction Simulator (5 modes, play/pause, quantum overlay)
3. Card Provisioning Visualizer (5-phase stepper, RSA/ML-DSA/FN-DSA chain toggle)
4. Tokenization Explorer (TSP + wallet selector, animated flow)
5. POS Crypto Analyzer (terminal specs, DUKPT tree, KIF ceremony)
6. Migration Risk Matrix (2D heatmap, dependency DAG, timeline Gantt)
7. Settlement Exposure Modeller (HNDL exposure per rail, driven by data retention)
8. Sector Regulation Timeline (sector bodies filtered by jurisdiction, each linked to its source document)

## Cross-References

- Threats: PCI-001, PCI-002, PCI-003, RETAIL-001, FIN-001
- Library: EPC-342-08-v16-0-1 (payments crypto guideline, June 2026), Swift CSCF v2026, BIS-OTHP107 (Project Leap Phase 2), BIS-Paper-158 (Quantum-readiness for the financial system: a roadmap, July 2025), UK-CMORG-PQC-Guidance-2025, Europol-QSFF-Call-to-Action-2025, FS-ISAC-PQC-Timeline-2026, DORA-REG-2022-2554, G7-Financial-PQC-Roadmap-2026 (G7 Cyber Expert Group statement, January 2026), SG-MAS-Quantum-Advisory-2024, ASC-X9-IR-F01-2022 (Quantum Computing Risks to the Financial Services Industry), CA-CFDIR-Quantum-Readiness-2023 (Canadian quantum-readiness guidance), Europol-FS-ISAC-PQC-Financial-2026 (Prioritising PQC Migration Activities in Financial Services)
- Related modules: hsm-pqc, kms-pqc, hybrid-crypto, tls-basics, iot-ot-pqc, compliance-strategy
- Industries: Payment Card Industry (cards path), Financial Services / Banking (banking path), Retail / E-Commerce (retail path)
- Glossary: SDA, DDA, CDA, TSP, ARQC, ARPC, KIF, BDK, PAN, 3-D Secure, SoftPOS + EMV, DUKPT
- Quiz: 15 questions (emv-001 through emv-015)
