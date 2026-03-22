### What This Is About

Organizations manage two distinct sets of sensitive materials: functional secrets (API keys, DB credentials) and the cryptographic keys (like KEKs) that wrap them. Their lifetime dictates their quantum vulnerability.

### Why It Matters

Long-lived API keys harvested from a TLS session today could be extracted and exploited by a CRQC years from now. By contrast, migrating the Key Encryption Key (KEK) of a secrets vault to ML-KEM via envelope encryption protects all stored secrets at rest instantly.

### The Key Takeaway

Dynamic secrets (like 8-hour TTL database credentials) eliminate HNDL risk automatically by expiring long before they can be decrypted. For remaining static secrets, modernize your vault's transit engine to support ML-KEM envelope encryption.

### What's Happening

Secrets management platforms are evaluating ML-KEM integration for their transit encryption engines, while organizations are accelerating the shift from long-lived static API keys to short-lived dynamic secrets that naturally resist Harvest Now, Decrypt Later attacks.
