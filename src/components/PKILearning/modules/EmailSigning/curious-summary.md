# Email Signing PQC — In Simple Terms

## What This Is About

Enterprise email can use CMS and S/MIME to sign and encrypt messages. A valid signature supports integrity and proves control of the signing key; the certificate identity is meaningful only after the recipient checks its trust path, validity, intended use and email identity. Encryption protects message content when the recipient can validate and use the corresponding decryption key.

## Why It Matters

Some classical S/MIME deployments use RSA key transport, which encrypts the content key to the recipient's RSA public key. A future cryptographically relevant quantum computer could recover the private key from a recorded public key and expose captured messages. RFC 9629 defines a CMS KEM alternative: the sender transmits a KEM ciphertext, and sender and recipient derive the same secret for wrapping the content key. Standardizing a format does not by itself establish deployment or interoperability.

## The Key Takeaway

Migration requires compatible capabilities at both ends of each operation: recipients must be able to decrypt an encrypted message, and recipients need suitable verification support and trust material for a signed message. No general rule requires organizations to issue two separate classical and PQ certificates; profiles may use a standalone or composite algorithm, or parallel credentials where deployments need them. Signature, certificate and complete-message sizes vary by algorithm and encoding, so measure the actual message and client path before drawing performance conclusions.

## What's Happening

IETF standards define ML-DSA signatures in CMS (RFC 9882), composite ML-DSA signatures in X.509 certificates and CMS (RFC 10073), and KEM-based CMS encryption (RFC 9629). These standards specify formats and processing; they do not say that a particular mail client, gateway or certificate authority has implemented them.
