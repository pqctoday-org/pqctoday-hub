### What This Is About

Today's digital world is secured by public-key cryptography (like RSA and ECC), which relies on math problems that are extremely hard for classical computers. A sufficiently large, fault-tolerant quantum computer running Shor's Algorithm could solve these specific problems efficiently, breaking the encryption and signatures that protect banking, defense, and healthcare. No such machine is publicly known to exist today.

### Why It Matters

The risk starts before that machine exists because of "Harvest Now, Decrypt Later" (HNDL): government security agencies, including NSA, CISA and the UK NCSC, warn that adversaries may record encrypted data now to decrypt it later. Likewise, "Harvest Now, Forge Later" matters for long-lived digital signatures on firmware and roots of trust (not sourced in the Library).

### The Key Takeaway

The algorithms are ready. In August 2024, NIST published the first three Post-Quantum Cryptography (PQC) standards (FIPS 203, 204, 205). Protocols, products and certifications are still catching up, so organizations should begin the transition with a cryptographic inventory and a risk assessment. NIST's transition plan (IR 8547, final since October 2026) deprecates quantum-vulnerable public-key algorithms such as RSA and elliptic-curve cryptography after 2030 and disallows their use under NIST standards and guidelines after 2035.

### What's Happening

Some governments have set dates for specific systems. For example, CNSA 2.0 requires new acquisitions for U.S. National Security Systems to be CNSA 2.0-compliant from January 2027.
