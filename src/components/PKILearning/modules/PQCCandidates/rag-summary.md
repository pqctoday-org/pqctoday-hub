# PQC Candidates & Standardisation Lifecycle

PQC standardisation is a **rolling process**, not a single event. NIST finalised FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA) in August 2024, added HQC as an alternate KEM in March 2025, and is mid-flight on a signature on-ramp that down-selected to nine third-round candidates in NIST IR 8528 (Oct 2024).

## Four mathematical families

- **MPC-in-the-Head** — FAEST (AES-based), MQOM (multivariate quadratic), SDitH (syndrome decoding). Security reduces to well-studied symmetric or combinatorial assumptions; signatures are kilobytes.
- **Multivariate** — UOV, MAYO, QR-UOV, SNOVA. Tiny signatures (96 B–838 B), large public keys. The 2025 Ran wedge attack pushed 3 of 4 UOV parameter sets below their security target, hit MAYO-2 by ~30 bits, and broke most SNOVA parameter sets. Reparameterisation to odd-characteristic fields restores security; QR-UOV was unscathed.
- **Isogeny** — SQIsign. Smallest combined pk+sig of any PQC candidate (148 B sig at NIST Cat 1). Cousin scheme SIKE was broken in 2022 by Castryck–Decru. SQIsign avoids the structural exploit but constant-time signing is an open implementation challenge.
- **Lattice** — HAWK. Integer-only alternative to FN-DSA (Falcon) — eliminates floating-point side-channel hazards.

## Validation process

Candidates enter a round, get benchmarked against NIST evaluation criteria (security, performance, implementation characteristics, IP), and undergo public cryptanalysis. NIST publishes a status report (IR series) at the end of each round.

## Worldwide parallel processes

- **KpqC (Korea)** — competition selected SMAUG-T, NTRU+, PALOMA, REDOG, Layered ROLLO-I (KEMs); HAETAE, AIMer, SOLMAE (signatures). Target standardisation by 2029, migration by 2035.
- **CACR (China)** — national competition selected LAC (lattice KEM, withdrew from NIST), AIGIS (signature), AIGIS-Enc (KEM), SCloud. OSCCA expected to publish PQC-extended SM-series specifications.
- **CRYPTREC (Japan)** — monitors NIST output; expected to adopt FIPS 203/204/205 in the e-Government Recommended Ciphers List.
- **ISO/IEC SC 27** — adopts NIST PQC algorithms as ISO/IEC 14888 (signatures) and 18033 (encryption / KEM) standards. The gating step for jurisdictions pinned to ISO rather than FIPS.
- **IETF (CFRG, pquip, lamps)** — defines codepoints, X.509 bindings, hybrid composite signatures, TLS key-share negotiation.
- **ETSI Quantum-Safe Cryptography** — European telecom-focused technical reports and migration guidance.

## Looking ahead

NIST flags a longer expected timeline for any multivariate standardisation. Earliest projected on-ramp standardisation window is 2027 for lattice / isogeny / MPCitH winners. The PQC algorithm portfolio will keep growing — crypto agility is the operational implication.
