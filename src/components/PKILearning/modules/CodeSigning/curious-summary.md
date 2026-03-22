# Code Signing PQC — In Simple Terms

## What This Is About
Code signing formally guarantees software integrity and publisher authenticity. As software supply chains grow increasingly complex with hundreds of open-source dependencies, verifying who built an update is critical to stopping injected malware.

## Why It Matters
A quantum break of classical algorithms (like RSA or ECDSA) compromises every publisher simultaneously. This means an adversary could forge any signature to impersonate trusted vendors, like Microsoft or Apple, without ever needing to steal a private key.

## The Key Takeaway
Transitioning to massive PQC algorithms (like ML-DSA or SLH-DSA) protects against "harvest now, decrypt later" firmware forgery. While PQC signatures are 38–123x larger than classical counterparts, this tradeoff is generally acceptable since software binaries only need to be verified once during installation.

## What's Happening
Modern open-source tools like Sigstore offer "keyless signing" by cleanly tying short-lived certificates to developer identities. This completely eliminates the need to manage long-term private keys, vastly simplifying the rollout of new PQC standards to developer ecosystems.
