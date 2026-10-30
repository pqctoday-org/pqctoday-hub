# PQC Candidates & Standardisation Lifecycle

PQC standardisation is a **rolling process**, not a single event. NIST finalised FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA) in August 2024, added HQC as an alternate KEM in March 2025, and is mid-flight on a signature on-ramp: NIST IR 8528 (Oct 2024) down-selected the first round to 14 second-round candidates, and NIST IR 8610 (final, May 2026) advanced nine candidates to the third round (FAEST, HAWK, MAYO, MQOM, QR-UOV, SDitH, SNOVA, SQIsign, UOV; CROSS, LESS, Mirath, PERK, RYDE were eliminated). The HAWK team withdrew HAWK from the process on 29 July 2026 after a new key-recovery attack, leaving eight third-round candidates; NIST has set no standardisation year for any candidate.

## Four mathematical families

- **MPC-in-the-Head** — FAEST (AES-based), MQOM (multivariate quadratic), SDitH (syndrome decoding). Security reduces to well-studied symmetric or combinatorial assumptions; signatures are kilobytes.
- **Multivariate** — UOV, MAYO, QR-UOV, SNOVA. UOV public keys exceed 200 kilobytes in expanded form (NIST IR 8610). During the second round a wedge attack on characteristic-2 schemes reduced the security margins of three of UOV's four proposed parameter sets (a few bits at category 1 to about 20 bits at category 5, and a later small-field attack brought the same three below their targets), left MAYO2 roughly 30 bits short, and broke most of SNOVA's proposed parameter sets, often by a large margin; QR-UOV's odd-characteristic fields left it unaffected, and NIST anticipates a longer timeline before any multivariate scheme is standardised.
- **Isogeny** — SQIsign. Smallest combined pk+sig of any PQC candidate (148 B sig at NIST Cat 1). Cousin scheme SIKE was broken in 2022 by Castryck–Decru. SQIsign avoids the structural exploit but constant-time signing is an open implementation challenge.
- **Lattice** — HAWK. Integer-only alternative to FN-DSA (Falcon) — eliminates floating-point side-channel hazards.

## Validation process

Candidates enter a round, get benchmarked against NIST evaluation criteria (security, performance, implementation characteristics, IP), and undergo public cryptanalysis. NIST publishes a status report (IR series) at the end of each round.

## Worldwide parallel processes

- **KpqC (Korea)** — the competition concluded in January 2025, selecting NTRU+ and SMAUG-T (KEMs) and AIMer and HAETAE (signatures).
- **CACR (China)** — national competition selected LAC (lattice KEM, withdrew from NIST), AIGIS (signature), AIGIS-Enc (KEM), SCloud. OSCCA expected to publish PQC-extended SM-series specifications.
- **CRYPTREC (Japan)** — monitors NIST output; expected to adopt FIPS 203/204/205 in the e-Government Recommended Ciphers List.
- **ISO/IEC SC 27** — is where adoption of PQC algorithms into ISO/IEC 14888 (signatures) and 18033 (encryption / KEM) would happen; we found no document confirming which algorithms it has adopted so far. The gating step for jurisdictions pinned to ISO rather than FIPS.
- **IETF (CFRG, pquip, lamps)** — defines codepoints, X.509 bindings, hybrid composite signatures, TLS key-share negotiation.
- **ETSI Quantum-Safe Cryptography** — European telecom-focused technical reports and migration guidance.

## Looking ahead

NIST flags a longer expected timeline for any multivariate standardisation. NIST has named no standardisation year for any third-round candidate; the 7th NIST PQC Standardization Conference is planned for late spring/early summer 2027. The PQC algorithm portfolio will keep growing — crypto agility is the operational implication.
