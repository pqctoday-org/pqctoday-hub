### What This Is About

Public Key Infrastructure (PKI) manages the digital certificates that build trust across the internet. At its core, it relies on X.509 certificates secured by classical digital signatures like RSA and ECDSA.

### Why It Matters

Because Root Certificate Authorities can live for 20+ years, they are highly vulnerable to "Harvest Now, Forge Later" attacks where a quantum computer could forge signatures and issue rogue certificates. Additionally, moving to quantum-safe replacements like ML-DSA introduces massive certificate bloat (up to a 37x size increase), breaking constrained clients.

### The Key Takeaway

Migration to PQC is urgent: NIST IR 8547 (final, October 2026) deprecates quantum-vulnerable public-key algorithms after 2030 and disallows them after 2035, while NSA's current CNSA 2.0 FAQ requires compliant new **national security system** acquisitions from 2027, phase-out of unsupported equipment and services by 2030, and CNSA 2.0 algorithms by 2031 unless otherwise noted. Organizations should test the certificate profiles appropriate to their authority and interoperability needs, including hybrid or emerging solutions such as Merkle Tree Certificates (MTCs).

### What's Happening

Certificate Authorities and browser vendors are actively testing hybrid and composite certificates, while NIST IR 8547 (final, October 2026) deprecates quantum-vulnerable public-key algorithms after 2030 (disallowed after 2035) and NSA's CNSA 2.0 FAQ version 2.2 records 2027/2030/2031 milestones for national security systems.
