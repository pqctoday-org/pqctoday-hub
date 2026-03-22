# KMS & PQC Key Management — In Simple Terms

## What This Is About
In classical cryptography, algorithms like RSA served dual purposes—they could handle both encrypting data and signing documents. However, under the new NIST SP 800-227 standards for Post-Quantum algorithms, there is a strict "separation of duties." Algorithms are now highly specialized.

## Why It Matters
Organizations must deploy ML-KEM *exclusively* for key encapsulation (envelope encryption) and ML-DSA *exclusively* for digital signatures. You can no longer use one key for two jobs. This fundamentally complicates how large enterprises manage their secret keys.

## The Key Takeaway
Administrators must essentially double their existing key inventory and dramatically upgrade their centralized Key Management Systems (KMS) architecture. This infrastructure must be capable of generating, storing, and transmitting these new, significantly larger quantum-safe keys.

## What's Happening
Cloud providers and Hardware Security Module (HSM) vendors are redesigning their platforms to support the massive throughput required to manage millions of these new, specialized Post-Quantum keys securely.
