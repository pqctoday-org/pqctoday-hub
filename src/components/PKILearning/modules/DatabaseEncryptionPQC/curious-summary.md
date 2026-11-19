### What This Is About

Database encryption operates in layers: Transparent Data Encryption (TDE) for storage, Column-Level Encryption (CLE) for specific fields, and Queryable Encryption for searching ciphertext. A PQC plan must check each layer, the database engine's cipher configuration, and the key-management path. Shor's algorithm does not break AES; Grover's algorithm reduces the effective key-search strength, so AES-256 retains a 128-bit margin.

### Why It Matters

Quantum risk is not limited to one **key-wrapping layer**: review key establishment, key wrapping, certificates and transport links in the database and KMS path. Which components use RSA/ECDH depends on the engine, version and integration. Harvest-now-decrypt-later exposure depends on the captured material and the required confidentiality period. BYOK and HYOK can change customer control of key custody, but do not guarantee that a cloud service supports post-quantum import wrapping.

### The Key Takeaway

For long-lived data, this module recommends assessing key-management paths and testing a post-quantum design; that is advice, not a regulatory requirement or a claim that database vendors support ML-KEM key wrapping. Do not conflate re-wrapping a key with rotating a data-encryption key: Oracle tablespace rekeying and SQL Server DEK regeneration can rewrite or re-encrypt data, while MongoDB's client-side `rewrapManyDataKey` operation re-wraps field data keys. Online-capable operations still need workload, space, recovery and availability testing.

### What's Happening

Cloud and database capabilities differ by product and release. Treat an ML-KEM key-wrapping workflow as a design proposal until the specific KMS, database integration and key format document support for it.
