# PKI Enrollment Protocols — In Simple Terms

## What This Is About

Before any device, app, or person can use a digital certificate, they need to _get one_ — and a certificate isn't just an X.509 file emailed around. There's a protocol that asks the Certificate Authority "please issue me one," carries the public key safely, proves you actually own the matching private key, and delivers the signed certificate back. Two protocols dominate that conversation: **EST** (Enrollment over Secure Transport, RFC 7030) and **CMP** (Certificate Management Protocol, RFC 4210 + RFC 9810).

## Why It Matters

Post-quantum migration adds two new wrinkles to enrollment. First, the new ML-DSA signatures are roughly 50× larger than classical ECDSA — every CSR, every cert, every protocol envelope balloons. Second, ML-KEM keys cannot sign anything at all, so the standard "sign the request to prove you have the private key" trick stops working. RFC 9810 (published July 2025) solves this by having the CA _encapsulate_ the new certificate under the requester's ML-KEM public key — only the genuine private-key holder can decapsulate it.

## The Key Takeaway

EST is HTTP-friendly and simple, CMP is richer and is where the IETF post-quantum work is happening. Both run real cryptographic message exchanges with proof-of-possession, signature verification, and trust-anchor checks. The same enrollment story that has carried RSA certs for decades now carries ML-DSA and ML-KEM — same shape, different algorithms, same need to get rolled out at industrial scale before quantum computers arrive.

## What's Happening

EJBCA 9.1+ already issues ML-DSA + ML-KEM certificates through CMP today. Bouncy Castle, OpenSSL 3.5+, and the IETF LAMPS working group are filling in the remaining gaps — composite signatures (one cert with both ML-DSA _and_ ECDSA inside) sit in draft form, ready when the operational reality catches up.
