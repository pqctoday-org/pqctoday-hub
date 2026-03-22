# Energy Grid PQC — In Simple Terms

## What This Is About
Energy infrastructure operates on 20–40 year asset lifecycles and provides safety-critical functions. A substation controller deployed today will still be operational in 2050—well past the expected arrival timeline for cryptographically relevant quantum computers.

## Why It Matters
Unlike IT data breaches, cryptographic failures in the energy sector can trigger severe physical consequences, including grid blackouts or pipeline overpressure. A "Harvest Now, Decrypt Later" attacker could capture encrypted utility communications today and decrypt them in the future to map out sensitive protection settings for physical attacks.

## The Key Takeaway
For crucial substation protocols (like GOOSE, Sampled Values, and DNP3), the per-message authentication (HMAC) is already quantum-safe. The actual vulnerability lies in the asymmetric key distribution channels (like classical RSA certificates) used to share those HMAC keys.

## What's Happening
Replacing classic keys with PQC keys creates a massive bandwidth bottleneck for smart meters. Moving from a 33-byte classical ECDH key to a 1,088-byte ML-KEM ciphertext transforms a routine background key rotation on a slow powerline network into a multi-day network operation.
