# Code Signing PQC — In Simple Terms

## What This Is About

Code signing formally guarantees software integrity and publisher authenticity. As software supply chains grow increasingly complex with hundreds of open-source dependencies, verifying who built an update is critical to stopping injected malware.

## Why It Matters

A sufficiently capable quantum computer could use Shor's algorithm against exposed RSA or elliptic-curve public keys. If it recovered a trusted signing key, an attacker could forge signatures that relying systems might accept under their configured trust policies. This is a future forgery risk; it does not let an attacker instantly impersonate every publisher or bypass key rotation, revocation, and verifier policy.

## The Key Takeaway

PQC algorithms such as ML-DSA and SLH-DSA are designed to resist known quantum attacks on public-key signatures. For a concrete raw-signature comparison, ML-DSA-44 is 2,420 bytes and SLH-DSA-SHA2-128s is 7,856 bytes, versus a 64-byte raw ECDSA P-256 signature: about 38× and 123× respectively. These ratios exclude certificates, container formats, and transparency proofs. Signatures may be checked at download, installation, boot, launch, or during transparency verification, so measure storage, bandwidth, and verification costs for the actual workflow.

## What's Happening

Sigstore's keyless flow binds a short-lived certificate to a developer identity, so developers do not manage a long-lived artifact-signing key. A post-quantum transition still involves signing clients, certificate issuance, artifact formats, transparency-log operations, trust-root distribution, and verifier support; upgrading a central service alone does not make existing artifacts or clients post-quantum.

Sources: [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final), [NIST FIPS 205](https://csrc.nist.gov/pubs/fips/205/final), [Sigstore documentation](https://docs.sigstore.dev/).
