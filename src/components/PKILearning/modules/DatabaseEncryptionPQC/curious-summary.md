### What This Is About

Database encryption operates in layers: Transparent Data Encryption (TDE) for storage, Column-Level Encryption (CLE) for specific fields, and Queryable Encryption for searching ciphertext. PQC migration for databases does not require changing how the actual data is encrypted, because the underlying AES-256 symmetric encryption is already quantum-safe against Grover's algorithm.

### Why It Matters

The quantum vulnerability in databases lies entirely in the **key wrapping layer**. The Data Encryption Keys (DEKs) and Column Master Keys (CMKs) are currently protected by vulnerable algorithms like RSA-OAEP and ECDH. If an adversary harvests the wrapped keys today, they can decrypt the entire database later. Organizations using Provider-Managed keys are entirely at the mercy of their cloud vendor's timeline, while BYOK and HYOK architectures offer control over when PQC wrapping is enforced.

### The Key Takeaway

Regulated industries must prioritize HYOK (Hold Your Own Key) architectures and migrate key wrapping to ML-KEM-1024 immediately. Because the AES data layer remains unchanged, modern databases (like Oracle and SQL Server) support online TDE re-keying, allowing you to migrate the wrapping keys with zero application downtime.
