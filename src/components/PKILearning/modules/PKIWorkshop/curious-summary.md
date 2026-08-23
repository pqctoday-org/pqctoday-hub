### What This Is About

Public Key Infrastructure (PKI) manages the digital certificates that build trust across the internet. At its core, it relies on X.509 certificates secured by classical digital signatures like RSA and ECDSA.

### Why It Matters

Because Root Certificate Authorities can live for 20+ years, they are highly vulnerable to "Harvest Now, Forge Later" attacks where a quantum computer could forge signatures and issue rogue certificates. Additionally, moving to quantum-safe replacements like ML-DSA introduces massive certificate bloat (up to a 37x size increase), breaking constrained clients.

### The Key Takeaway

Migration to PQC is urgent: NIST IR 8547 (draft) proposes deprecating classical public-key algorithms by 2030 and disallowing them by 2035, while NSA's CNSA 2.0 requires exclusive PQC use in **national security systems** by 2030 (signing, networking) or 2033 (web/cloud, operating systems). Organizations must immediately test hybrid certificates or emerging solutions like Merkle Tree Certificates (MTCs), which significantly reduce PQC signature overhead.

### What's Happening

Certificate Authorities and browser vendors are actively testing hybrid and composite certificates, while NIST IR 8547 (draft) targets deprecating classical algorithms by 2030 (disallowed by 2035) and NSA's CNSA 2.0 requires exclusive PQC use by 2030/2033 by category for national security systems.
