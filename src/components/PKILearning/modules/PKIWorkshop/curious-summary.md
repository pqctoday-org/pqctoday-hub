### What This Is About

Public Key Infrastructure (PKI) manages the digital certificates that build trust across the internet. At its core, it relies on X.509 certificates secured by classical digital signatures like RSA and ECDSA.

### Why It Matters

Because Root Certificate Authorities can live for 20+ years, they are highly vulnerable to "Harvest Now, Forge Later" attacks where a quantum computer could forge signatures and issue rogue certificates. Additionally, moving to quantum-safe replacements like ML-DSA introduces massive certificate bloat (up to a 37x size increase), breaking constrained clients.

### The Key Takeaway

Migration to PQC is urgent, with NIST and CNSA 2.0 targeting 2030 for full implementation. Organizations must immediately test hybrid certificates or emerging solutions like Merkle Tree Certificates (MTCs), which significantly reduce PQC signature overhead.
