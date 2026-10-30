# Media, Entertainment & DRM PQC — In Simple Terms

## What This Is About

Films and shows are protected by systems that decide which devices may play them. When the device in your living room is the thing an attacker holds, the usual idea of "protect the data in transit" is not enough. This module reads the actual specifications behind some of those systems — the AACS system, whose specification covers keys held on media and the exchange between a drive and a host, the CI Plus system, which protects content where it leaves a conditional-access module and re-enters the host device, the MovieLabs ECP specification, and the C2PA standard that attaches signed "content credentials" to media — and asks one precise question of each: where does it use public-key cryptography, the kind that a large quantum computer would break?

## Why It Matters

Public-key cryptography does two jobs in these systems: it signs things (a block of keys, a certificate, a media file's credentials) and it lets two devices agree on a shared key. NIST's transition plan says that quantum-vulnerable signature and key-agreement schemes will be deprecated after 2030 and disallowed in NIST standards after 2035. That is NIST's schedule for NIST standards. None of the media specifications read here sets a deadline of its own.

## The Key Takeaway

A specification that does not mention quantum computers is not the same as an organisation that has no plan. The first is a fact about a document; the second would need a different kind of evidence. Reading each link precisely — which kind of cryptography it uses, who can change it, who can revoke a compromised device — is more useful than a general statement that "media is vulnerable".

## What's Happening

In the editions read here, the key tree and the content cipher use symmetric cryptography (AES-128 in AACS; DES-56 or AES-128 in CI Plus), while the signatures and key exchanges use ECDSA, RSA and Diffie-Hellman. The C2PA standard allows ECDSA, RSA and EdDSA signatures for new credentials and lists no post-quantum algorithm; separate IETF documents describe how to carry a post-quantum signature in the same format. For streaming, a hybrid key exchange for the web's encryption layer is now published as RFC 10024, while a 2023 research paper reported an absence of post-quantum security in three widely used DRM systems.
