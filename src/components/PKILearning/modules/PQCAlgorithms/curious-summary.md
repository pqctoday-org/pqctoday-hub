# The PQC Algorithms: How They Work and How to Choose — In Simple Terms

## What This Is About

This module explains the standardised post-quantum algorithms in the words of the documents that define them. FIPS 203 standardizes ML-KEM, a key-encapsulation mechanism that is believed to be secure even against adversaries who possess a quantum computer. FIPS 204 specifies ML-DSA, a set of algorithms for generating and verifying digital signatures that is believed to be secure even against adversaries with a large-scale quantum computer.

## Why It Matters

Every sentence in the lesson names the document, the edition and the place it comes from, so a choice of algorithm can be traced to its source.

## The Key Takeaway

In FIPS 203, a key-encapsulation mechanism is a set of algorithms that two parties can use, under certain conditions, to establish a shared secret key over a public channel. FIPS 204 specifies three main ML-DSA algorithms covering key generation (ML-DSA.KeyGen), signature generation (ML-DSA.Sign), and signature verification (ML-DSA.Verify).

## What's Happening

In a KEM, the receiving party begins by running KeyGen to generate a public encapsulation key and a private decapsulation key. Using the encapsulation key, the other party runs Encaps to produce a copy of the shared secret key and an associated ciphertext, then sends the ciphertext back. The first party completes key establishment by running Decaps with the decapsulation key and the received ciphertext to produce a copy of the shared secret key.
