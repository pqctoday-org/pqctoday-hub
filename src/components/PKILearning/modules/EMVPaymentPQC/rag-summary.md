# EMV Payment Systems & PQC — RAG Summary

## Module Overview

Advanced-level module (120 min, 6 workshop steps) covering post-quantum cryptography migration for the EMV payment ecosystem — the world's largest deployed PKI with 14.7 billion chip cards across Visa, Mastercard, Amex, UnionPay, and Discover.

## Key Topics

- **EMV Card Authentication**: SDA (static RSA), DDA (dynamic RSA per-transaction), CDA (combined with application cryptogram). All use RSA-2048 certificate chains vulnerable to quantum computers.
- **Payment Network Comparison**: 5 networks compared by scale, crypto stack, PQC posture, and readiness. Mastercard is the only network with active PQC pilots (TLS 1.3 hybrid ML-KEM). UnionPay has the largest card base (9.4B) tied to pending China GB/T standards.
- **Transaction Flows**: Online authorization (ARQC/ARPC symmetric MACs — quantum-safe), offline DDA/CDA (RSA signatures — quantum-vulnerable), contactless, and mobile payment flows.
- **Card Provisioning**: 5-phase process (Chip OS, Pre-Perso, Personalization, Key Injection, Activation) with RSA certificate chain. FN-DSA-512 (~6.7 KB chain) preferred over ML-DSA-44 (~15.3 KB) for constrained card NVM.
- **Tokenization**: TSP architectures (Visa VTS, Mastercard MDES, Amex EST) replacing PANs with tokens. Mobile wallets (Apple Pay, Google Pay, Samsung Pay) with secure element details.
- **POS Terminals**: 5 types (Traditional POS, mPOS, SoftPOS, ATM, Unattended) with DUKPT key management. Key Injection Facility ceremony is the primary quantum vulnerability (RSA-2048 key transport of BDK).
- **Migration Planning**: 10 payment components mapped by severity and effort. Critical path: HSM key wrapping → KIF key injection → Card personalization → Offline auth. Minimum timeline: 5-7 years due to 3-5 year card replacement cycle.

## Workshop Steps

1. Payment Network Comparator (filter, compare, radar chart)
2. Transaction Simulator (5 modes, play/pause, quantum overlay)
3. Card Provisioning Visualizer (5-phase stepper, RSA/ML-DSA/FN-DSA chain toggle)
4. Tokenization Explorer (TSP + wallet selector, animated flow)
5. POS Crypto Analyzer (terminal specs, DUKPT tree, KIF ceremony)
6. Migration Risk Matrix (2D heatmap, dependency DAG, timeline Gantt)

## Cross-References

- Threats: PCI-001, PCI-002, PCI-003, RETAIL-001, FIN-001
- Library: BIS-OTHP107 (Project Leap), BIS-Paper-158 (Financial quantum readiness)
- Related modules: hsm-pqc, kms-pqc, hybrid-crypto, tls-basics, compliance-strategy
- Glossary: 11 new terms (SDA, DDA, CDA, TSP, ARQC, ARPC, KIF, BDK, PAN, 3-D Secure, SoftPOS) + updated EMV, DUKPT
- Quiz: 15 questions (emv-001 through emv-015)
