### What This Is About

The Harvest Now, Decrypt Later (HNDL) threat means adversaries are actively collecting your encrypted data _today_, waiting for a Cryptographically Relevant Quantum Computer (CRQC) to break it. However, you cannot migrate everything to PQC instantly. Data Asset Classification is the process of categorizing your data to answer one critical question: what data is actually worth harvesting, and how urgently must it be protected?

### Why It Matters

Your PQC migration urgency is directly tied to data retention. If a CRQC arrives in 2030, any data that must remain confidential beyond 2030 is already at risk today. Without a structured 4-Tier classification model (Low, Medium, High, Critical), organizations face an impossible blanket migration requirement. Furthermore, GDPR Art. 32 implies using cryptography with consideration for the state of the art, but does not specify algorithms.

### The Key Takeaway

You must inventory cryptographic assets and distinguish business services (such as a records archiving and retrieval service) from the protected data assets they hold (such as long-lived records), classifying each by sensitivity and confidentiality lifetime. Key material (like root CAs and HSM secrets) is often rated Critical, but confirm it from what the key protects and how long that trust must last. Prioritize your PQC rollout based on HNDL exposure risk and confirmed applicable compliance obligations.

### What's Happening

NIST IR 8547 (final, October 2026) sets deprecation of quantum-vulnerable public-key algorithms after 2030 and disallowance after 2035; US federal civilian agencies follow EO 14412 and OMB M-26-15 (2030 key establishment / 2031 digital signatures, plus a directed FAR contractor rule), US National Security Systems follow CNSA 2.0 FAQ v2.2 (2027/2030/2031), and EU Member States coordinate under the EU PQC Roadmap v1.1. Meanwhile, DORA, NIS2, HIPAA, and GDPR Art. 32 impose cyber risk-management and state-of-the-art security duties rather than fixed PQC algorithm mandates, making asset classification and prioritization an immediate governance foundation.
