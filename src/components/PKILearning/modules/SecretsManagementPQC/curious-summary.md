### What This Is About

Organizations manage two distinct sets of sensitive materials: functional secrets (API keys, DB credentials) and the cryptographic keys (like KEKs) that wrap them. Their lifetime dictates their quantum vulnerability.

### Why It Matters

Long-lived API keys harvested from a TLS session today could be extracted and exploited by a CRQC years from now. By contrast, how stored secrets are protected at rest depends on how their data keys are wrapped. A symmetric (AES) Key Encryption Key (KEK) is not broken by quantum computers, so only an asymmetric wrapping step, such as RSA key transport, needs replacing, with a post-quantum key-encapsulation method where the product supports one.

### The Key Takeaway

Dynamic secrets (like 8-hour TTL database credentials) eliminate HNDL risk automatically by expiring long before they can be decrypted. For remaining static secrets, find which step in your vault or key service is asymmetric and ask the vendor which post-quantum options its service supports.

### What's Happening

Support differs by platform. AWS KMS documents ML-KEM keys with Encapsulate and Decapsulate operations (added on 26 October 2026), while AWS Secrets Manager still protects secrets with AES-256 data keys under symmetric KMS keys. HashiCorp's Vault transit documentation lists ML-DSA, SLH-DSA and hybrid signing key types but no ML-KEM type. Organizations are also shifting from long-lived static API keys to short-lived dynamic secrets that expire before they can be misused.
