---
generated: 2026-09-09
collection: threats
documents_processed: 1
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit — every field's actual content is unchanged from threats_doc_enrichments_08292026.md, that generation's real model run. Corrected 2026-09-11: the header previously here (priv 3d3ae9f0, "example-echo cleanup") named the transformation applied to the file — replacing values byte-identical to the prompt's own illustrative examples with "None detected" — not the model that produced the content, which is this one. Where a document id appears more than once in the source, the LAST occurrence is carried forward, matching mergeEnrichmentFiles()'s own last-wins resolution.
---

## IT-002

- **Reference ID**: IT-002
- **Title**: IT Industry / Software
- **Authors**: CA/Browser Forum PKI Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: active
- **Main Topic**: The CA/Browser Forum Server Certificate Working Group is discussing PQC timeline requirements but has not adopted binding mandates, leaving adoption schedules to browser trust stores.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: Sunset all remaining use of SHA-1 signatures in Certificates and CRLs - Feb 25, 2026 Code Signing Requirements v3
- **Applicable Regions / Bodies**: Bodies: CA/Browser Forum
- **Leaders Contributions Mentioned**: Stephen Davidson (DigiCert) proposed ballot SMC015v2; Ben Wilson (Mozilla) and Scott Rea (eMudhra) endorsed the ballot.
- **PQC Products Mentioned**: Chrome; Firefox
- **Protocols Covered**: TLS; S/MIME; DNSSEC
- **Infrastructure Layers**: PKI; Certificate Transparency
- **Standardization Bodies**: CA/Browser Forum
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA-1
- **Key Takeaways**: CA/Browser Forum has not adopted binding PQC ballot language; Browser trust stores will drive PQC certificate adoption schedules; Certificate Transparency logs provide visibility into CA PQC migration progress; SHA-1 signatures are sunset in S/MIME requirements
- **Security Levels & Parameters**: ML-KEM-768
- **Hybrid & Transition Approaches**: Hybrid key exchange (X25519+ML-KEM-768); Coordinated trust store updates
- **Pure PQC KEM Support**: No
- **Pure PQC KEM Evidence**: None detected
- **Hybrid PQC KEM Support**: No
- **Hybrid PQC KEM Evidence**: None detected
- **Pure PQC Signature Support**: No
- **Pure PQC Signature Evidence**: None detected
- **Hybrid PQC Signature Support**: No
- **Hybrid PQC Signature Evidence**: None detected
- **PQC Heatmap Protocols Covered**: TLS-1.2; TLS-1.3; S/MIME; DNSSEC
- **PQC Heatmap Protocols Evidence**: TLS-1.2: "Baseline Requirements for TLS Server Certificates"; TLS-1.3: "Baseline Requirements for TLS Server Certificates"; S/MIME: "S/MIME Requirements v1.0.14"; DNSSEC: "Creates a carve-out of the logging requirements for DNSSEC specifically"
- **Lifecycle State**: Released
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Compliance; pki-workshop; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: certificate inventory, key material audit
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: third-party library trust, open-source vs proprietary
- **Deployment & Migration Complexity**: coordinated trust store updates across all major browsers and operating systems
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Math Family**: None detected
- **PQC Round**: Not Applicable
- **Attack Classification**: None detected
- **Exploitation Timeline Window**: None detected
- **Financial Impact Quantification**: None detected
- **Countermeasure Effectiveness**: None detected
- **Extraction Note**: carry-forward (DS05p2): record not iterated this run; preserved from prior enrichment

---
