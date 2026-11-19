### What This Is About

Moving your apps and data to AWS, Azure, Google Cloud, or SaaS does not automatically make them quantum-safe. Cloud providers manage the physical servers and underlying HSMs, but your team still controls TLS policies, origin connections, KMS key types, key-import workflows, and SaaS vendor checks.

### Why It Matters

Small blind spots in the cloud create big security gaps. A CDN might negotiate hybrid post-quantum TLS (`X25519MLKEM768`) with a browser while the connection to your origin server stays classical. A cloud KMS might support ML-KEM keys in most regions while excluding others, or still wrap imported BYOK keys with classical RSA. And an unanswered SaaS vendor questionnaire hides risk rather than proving safety.

### The Key Takeaway

Map every cloud surface by who controls it and what protected asset it guards, verify live behavior with provider CLI commands and TLS probes instead of relying on marketing claims, and treat every unknown SaaS or multi-account control as an active evidence gap.

### What's Happening

As of late 2026, hybrid TLS 1.3 (`X25519MLKEM768`, RFC 10024) is widely supported at major cloud edges, AWS KMS offers both ML-DSA (June 2025) and ML-KEM (October 2026) keys, Google Cloud KMS offers GA ML-DSA/SLH-DSA signing and Preview HPKE key import, and NIST moved FIPS 140-2 certificates to Historical status in September 2026 — making active FIPS 140-3 verification essential across cloud and SaaS estates.
