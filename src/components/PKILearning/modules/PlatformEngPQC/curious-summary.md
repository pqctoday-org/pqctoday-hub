### What This Is About

CI/CD pipelines heavily rely on classical cryptography, from Git commit signing with ECDSA, to Vault mTLS, to Kubernetes cert-manager deployments. Every layer of the platform engineering stack is exposed to quantum threats.

### Why It Matters

Infrastructure-as-Code (IaC) tools typically default to quantum-vulnerable settings (like RSA-2048). Furthermore, critical supply chain anchors like container image signatures—built on tools like cosign and Notation—must be migrated to algorithms like ML-DSA to prevent complete infrastructure compromise.

### The Key Takeaway

Automation is the only way to manage PQC correctly at scale. Platform teams should use Policy-as-Code via OPA Gatekeeper or Kyverno to block classical algorithms at cluster admission, and employ Prometheus metrics to continuously monitor for algorithmic drift.

### What's Happening

Platform teams are beginning to integrate PQC-aware policies into their CI/CD pipelines, using OPA Gatekeeper and Kyverno to enforce quantum-safe algorithms at cluster admission while migrating container image signing tools like cosign and Notation to ML-DSA.
