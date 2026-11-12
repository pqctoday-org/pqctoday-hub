### What This Is About

Every AI system relies on an immense data pipeline—from ingestion and storage to training and inference—secured by cryptography. When dealing with billion-parameter model weights and petabytes of training data, securing this intellectual property is paramount. We use TLS for data in transit, AES wrapped with RSA for storage, and ECDSA for signing models to ensure authenticity. Furthermore, as AI agents become autonomous, they require their own machine identities to transact securely.

### Why It Matters

"Harvest Now, Decrypt Later" (HNDL) is an existential risk for AI organizations. Adversaries can steal encrypted proprietary datasets today and decrypt them when a Cryptographically Relevant Quantum Computer (CRQC) becomes available, entirely bypassing current RSA/ECDH protections. Similarly, if classical ECDSA signatures are compromised, malicious actors could seamlessly forge model provenance, inject synthetic data back into the trusted training pipeline (accelerating "model collapse"), or impersonate active AI agents performing automated commerce.

### The Key Takeaway

A holistic Post-Quantum Cryptography (PQC) strategy must secure the entire AI lifecycle. ML-KEM can establish a key used to protect an independent data-encryption key; the workshop compares the complete stored wrapping envelope. ML-DSA can authenticate signed model and provenance claims. A valid signature does not establish that content is true, human-made or suitable for training. Evaluate the whole key, trust and verification process with your own tools.

### What's Happening

AI organizations are beginning to audit their data pipelines for quantum exposure, migrating model signing to ML-DSA for long-term provenance guarantees, and designing quantum-safe authentication protocols for autonomous AI agents entering agentic commerce ecosystems.
