### What This Is About

CI/CD pipelines use classical cryptography in some signatures, certificates, and key exchanges. Each has a different quantum risk and migration path; for example, TLS key exchange affects recorded-payload confidentiality, while artifact signatures affect long-term authenticity.

### Why It Matters

Some IaC configurations and software supply-chain signatures still use classical public-key algorithms. Post-quantum migration depends on support across the signing tool, identity or trust service, artifact format, and verifier; a signature change alone does not prevent every infrastructure compromise.

### The Key Takeaway

Automation is the only way to manage PQC correctly at scale. Platform teams should use Policy-as-Code via OPA Gatekeeper or Kyverno to block classical algorithms at cluster admission, and check which monitoring sources can report certificate algorithms (expiry metrics alone do not carry the key algorithm) to watch for algorithmic drift.

### What's Happening

Sigstore’s October 2026 architecture proposal describes a separate, initially opt-in PQC public service, with mid-2027 as a target. That proposal does not mean current cosign or Notation releases provide ML-DSA signing and verification; verify the specific tool and trust path before planning a migration.
