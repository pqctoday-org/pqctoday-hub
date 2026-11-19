# Healthcare PQC — In Simple Terms

## What This Is About

Unlike a stolen password that can be reset, biometric and genomic data (like DNA profiles, fingerprints, and iris scans) is permanent. Healthcare records archiving and retrieval services, EHR portals, and research exchanges protect these long-lived records using public-key key establishment and key wrapping (such as RSA and ECDH) alongside symmetric encryption.

## Why It Matters

Adversaries can record encrypted health-data exchanges today and store them for later decryption once a cryptographically relevant quantum computer is built ("Harvest Now, Decrypt Later"). Because pediatric, mental-health, and genomic records remain sensitive for decades or generations, classical public-key exchanges protecting those records today carry long-term confidentiality risk.

## The Key Takeaway

Healthcare providers should prioritize post-quantum key establishment (such as hybrid ML-KEM in TLS and key wrapping) for the business services—patient portals, EHR exchange, and records archiving and retrieval services—that protect permanent, long-lived patient and biometric records.

## What's Happening

Medical device manufacturers, genomic research centers, and hospital networks are inventorying their public-key dependencies and adopting hybrid post-quantum key establishment and crypto-agile architectures so the services protecting long-lived records can transition before quantum threats mature.
