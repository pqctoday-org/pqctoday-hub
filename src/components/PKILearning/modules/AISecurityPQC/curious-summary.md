### What This Is About

Every AI system relies on an immense data pipeline—from ingestion and storage to training and inference—secured by cryptography. When dealing with billion-parameter model weights and petabytes of training data, securing this intellectual property is paramount. We use TLS for data in transit, AES wrapped with RSA for storage, and ECDSA for signing models to ensure authenticity. Furthermore, as AI agents become autonomous, they require their own machine identities to transact securely.

### Why It Matters

"Harvest Now, Decrypt Later" (HNDL) is an existential risk for AI organizations. Adversaries can steal encrypted proprietary datasets today and decrypt them when a Cryptographically Relevant Quantum Computer (CRQC) becomes available, entirely bypassing current RSA/ECDH protections. Similarly, if classical ECDSA signatures are compromised, malicious actors could seamlessly forge model provenance, inject synthetic data back into the trusted training pipeline (accelerating "model collapse"), or impersonate active AI agents performing automated commerce.

### The Key Takeaway

A holistic Post-Quantum Cryptography (PQC) strategy must secure the entire AI lifecycle. Migrating to ML-KEM ensures that proprietary training data and model weights remain confidential against HNDL attacks over decades. Adopting ML-DSA guarantees long-term integrity for model signing, content provenance (like C2PA), and agent-to-agent delegation tokens—defending the ecosystem against data poisoning and impersonation.
