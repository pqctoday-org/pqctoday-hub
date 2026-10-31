# KMS & PQC Key Management — In Simple Terms

## What This Is About

In classical cryptography, algorithms like RSA served dual purposes—they could handle both encrypting data and signing documents. The post-quantum standards split these roles by algorithm: ML-KEM (FIPS 203) is for key establishment, while ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) are for signatures.

## Why It Matters

In this module's reading, organizations use ML-KEM for key encapsulation (envelope encryption) and ML-DSA for digital signatures, so one key no longer does both jobs as an RSA key could. This fundamentally complicates how large enterprises manage their secret keys.

## The Key Takeaway

Because post-quantum algorithms cannot share one key pair between encryption and signing, organisations that used dual-purpose keys will need more keys, and must upgrade their centralized Key Management Systems (KMS) architecture. This infrastructure must be capable of generating, storing, and transmitting these new, significantly larger quantum-safe keys.

## What's Happening

Cloud providers and Hardware Security Module (HSM) vendors are redesigning their platforms to support the massive throughput required to manage millions of these new, specialized Post-Quantum keys securely.
