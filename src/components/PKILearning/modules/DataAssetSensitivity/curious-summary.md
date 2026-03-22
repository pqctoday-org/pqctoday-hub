### What This Is About

The Harvest Now, Decrypt Later (HNDL) threat means adversaries are actively collecting your encrypted data _today_, waiting for a Cryptographically Relevant Quantum Computer (CRQC) to break it. However, you cannot migrate everything to PQC instantly. Data Asset Classification is the process of categorizing your data to answer one critical question: what data is actually worth harvesting, and how urgently must it be protected?

### Why It Matters

Your PQC migration urgency is directly tied to data retention. If a CRQC arrives in 2030, any data that must remain confidential beyond 2030 is already at risk today. Without a structured 4-Tier classification model (Low, Medium, High, Critical), organizations face an impossible blanket migration requirement. Furthermore, regulations like DORA, HIPAA, and GDPR Art. 32 demand "state of the art" cryptographic controls for highly sensitive PII and financial records.

### The Key Takeaway

You must immediately inventory all cryptographic assets and classify them by sensitivity and retention. Key material (like root CAs and HSM secrets) must always be classified as Critical. Prioritize your PQC rollout based on a composite score of HNDL exposure risk and regulatory compliance deadlines.
