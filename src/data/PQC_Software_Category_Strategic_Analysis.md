# PQC Software Category Cross-Reference & Augmentation Analysis

**Analysis Date:** December 16, 2025
**Data Sources:** PQC CSV Database + Cryptographic Software Categories

---

## EXECUTIVE SUMMARY

This analysis cross-references 30 cryptographic software categories against the Post-Quantum Cryptography (PQC) threat landscape, migration timeline, standards library, and industry leaders database. The integration reveals critical gaps and provides actionable intelligence for PQC migration planning.

### Key Findings:

1. **Critical Readiness Gap**: Only 51% of tracked software (25/49 products) has ANY PQC support
2. **High-Priority Categories**: 15 of 30 categories (50%) require immediate action (2025-Q4 timeline)
3. **Migration Bottleneck**: 8 "Critical" priority categories represent foundational infrastructure affecting ALL industries
4. **Leadership Alignment**: 100 tracked PQC leaders map to only 12 software categories, indicating concentration risk

---

## SECTION 1: SOFTWARE CATEGORY PRIORITY MATRIX

### Tier 1 - CRITICAL URGENCY (Urgency Score 80-100) - 15 Categories

**Immediate Action Required (2025-Q4)**

| Category ID | Category Name                            | Urgency Score | PQC Readiness | Action Timeline |
| ----------- | ---------------------------------------- | ------------- | ------------- | --------------- |
| CSC-025     | Cryptographic Agility Frameworks         | 100.0         | 0%            | 2025-Q4         |
| CSC-002     | Hardware Security Module (HSM) Software  | 95.0          | N/A           | 2025-Q4         |
| CSC-004     | Public Key Infrastructure (PKI) Software | 95.0          | N/A           | 2025-Q4         |
| CSC-003     | Key Management Systems (KMS)             | 95.0          | 25%           | 2025-Q4         |
| CSC-029     | Payment Cryptography Systems             | 95.0          | N/A           | 2025-Q4         |
| CSC-016     | Post-Quantum Cryptography Libraries      | 89.0          | N/A           | 2025-Q4         |
| CSC-001     | Cryptographic Libraries                  | 88.5          | 44%           | 2025-Q4         |
| CSC-015     | API Security and JWT Libraries           | 85.0          | N/A           | 2025-Q4         |
| CSC-026     | Secure Boot and Firmware Security        | 85.0          | N/A           | 2025-Q4         |
| CSC-005     | TLS/SSL Implementation Software          | 83.0          | N/A           | 2025-Q4         |
| CSC-006     | Disk and File Encryption Software        | 81.0          | N/A           | 2025-Q4         |
| CSC-007     | Database Encryption Software             | 80.0          | N/A           | 2025-Q4         |
| CSC-009     | Digital Signature Software               | 80.0          | N/A           | 2025-Q4         |
| CSC-008     | Email Encryption Software                | 80.0          | N/A           | 2025-Q4         |
| CSC-017     | Code Signing and Software Integrity      | 80.0          | N/A           | 2025-Q4         |

### Tier 2 - HIGH URGENCY (Urgency Score 60-79) - 11 Categories

**Action Required (2026-Q1)**

| Category ID | Category Name                           | Urgency Score | Timeline |
| ----------- | --------------------------------------- | ------------- | -------- |
| CSC-014     | SSH Implementation Software             | 79.0          | 2026-Q1  |
| CSC-010     | VPN and IPsec Software                  | 78.0          | 2026-Q1  |
| CSC-011     | Secure Messaging and Communication      | 77.0          | 2026-Q1  |
| CSC-021     | Random Number Generation Software       | 75.0          | 2026-Q1  |
| CSC-028     | Cloud Encryption Gateways               | 74.0          | 2026-Q1  |
| CSC-013     | Tokenization Software                   | 69.0          | 2026-Q1  |
| CSC-012     | Password and Credential Management      | 67.0          | 2026-Q1  |
| CSC-019     | Secure Enclave and TEE Software         | 65.0          | 2026-Q1  |
| CSC-020     | Blockchain and DLT Cryptography         | 65.0          | 2026-Q1  |
| CSC-027     | Data Loss Prevention with Encryption    | 63.0          | 2026-Q1  |
| CSC-023     | Certificate Transparency and Monitoring | 62.0          | 2026-Q1  |

### Tier 3 - MEDIUM URGENCY (Urgency Score 40-59) - 4 Categories

**Planning Phase (2026-Q2)**

| Category ID | Category Name                      | Urgency Score |
| ----------- | ---------------------------------- | ------------- |
| CSC-018     | Cryptographic Protocol Analyzers   | 55.0          |
| CSC-022     | Homomorphic Encryption Libraries   | 48.0          |
| CSC-024     | Identity-Based Encryption Software | 43.0          |
| CSC-030     | Quantum Key Distribution Software  | 41.0          |

---

## SECTION 2: SOFTWARE READINESS ANALYSIS

### Top 10 PQC-Ready Software Products

| Software                    | Category              | Readiness Score | Status                       | Deployment Timeline |
| --------------------------- | --------------------- | --------------- | ---------------------------- | ------------------- |
| OpenSSL 3.5.4               | Cryptographic Library | 90/100          | ML-KEM, ML-DSA, SLH-DSA      | Ready Now (2025)    |
| Bouncy Castle Java 1.83     | Cryptographic Library | 90/100          | ML-KEM, ML-DSA, SLH-DSA, HQC | Ready Now (2025)    |
| liboqs 0.15.0               | PQC Library           | 80/100          | All NIST algorithms          | Ready Now (2025)    |
| wolfSSL 5.8.2               | TLS/SSL Library       | 70/100          | ML-DSA, ML-KEM, Kyber        | Ready Now (2025)    |
| GnuTLS 3.8.11               | TLS/SSL Library       | 60/100          | ML-KEM (hybrid)              | Ready Now (2025)    |
| Bouncy Castle Java LTS      | Cryptographic Library | 45/100          | ML-DSA composite             | Ready Now (2025)    |
| OpenSSL (LTS) 3.0.18        | Cryptographic Library | 40/100          | Limited                      | Early 2026          |
| Bouncy Castle C# .NET 2.6.1 | Cryptographic Library | 40/100          | HQC, ML-KEM                  | Ready Now (2025)    |
| wolfBoot 2.4.0              | Secure Boot           | 40/100          | ML-DSA                       | Ready Now (2025)    |
| AWS s2n-tls 1.5.x           | TLS Library           | 40/100          | Kyber hybrid                 | Early 2026          |

### Readiness Distribution

- **Ready Now (80-100 score)**: 3 products (6%)
- **Nearly Ready (60-79)**: 2 products (4%)
- **In Progress (30-59)**: 18 products (37%)
- **Early Stage (1-29)**: 12 products (24%)
- **Not Started (0)**: 14 products (29%)

### Critical Gaps Identified

1. **HSM Software**: No tracked HSM products with full PQC support despite critical priority
2. **Payment Systems**: Zero payment cryptography products with PQC readiness
3. **Database Encryption**: No tracked database encryption products with PQC
4. **API Security**: JWT libraries lack PQC signature support
5. **Secure Boot**: Limited PQC support in UEFI/firmware signing tools

---

## SECTION 3: THREAT-TO-SOFTWARE MAPPING

### High-Impact Threat Categories

| Threat Domain               | Affected Software Categories       | Critical Products at Risk          |
| --------------------------- | ---------------------------------- | ---------------------------------- |
| **Financial Services HNDL** | CSC-001, CSC-005, CSC-004, CSC-029 | OpenSSL, payment HSMs, banking PKI |
| **Government/Defense**      | CSC-004, CSC-026, CSC-014          | AD CS, OpenSSH, secure boot        |
| **Healthcare EHR**          | CSC-007, CSC-008, CSC-006          | Database TDE, email encryption     |
| **Critical Infrastructure** | CSC-005, CSC-014, CSC-010, CSC-026 | SCADA TLS, industrial SSH, OT VPNs |
| **Cloud Services**          | CSC-003, CSC-028, CSC-002          | Cloud KMS, CASBs, cloud HSMs       |
| **IoT/Embedded**            | CSC-001, CSC-026, CSC-014          | wolfSSL, mbed TLS, embedded SSH    |

### Industry-Specific Urgency

**Finance & Banking** (CRITICAL)

- Affected Categories: 8 critical, 5 high
- Key Software: OpenSSL, Thales Luna HSM, Oracle TDE, payment terminals
- Timeline: Immediate (2025-Q4)
- Primary Threats: HNDL attacks, payment fraud, long-term data exposure

**Government & Defense** (CRITICAL)

- Affected Categories: 6 critical, 4 high
- Key Software: Microsoft AD CS, OpenSSH, secure boot, classified messaging
- Timeline: CNSA 2.0 compliance by 2026-Q1
- Primary Threats: Nation-state attacks, classified data exposure

**Healthcare** (HIGH)

- Affected Categories: 5 critical, 6 high
- Key Software: EHR database encryption, HIPAA email, endpoint encryption
- Timeline: 2026-Q1
- Primary Threats: Patient data HNDL, long-term health record exposure

**Critical Infrastructure** (CRITICAL)

- Affected Categories: 7 critical, 5 high
- Key Software: SCADA TLS, industrial SSH, OT VPNs, grid controllers
- Timeline: 2026-Q1
- Primary Threats: Grid control systems, OT communications, real-time attacks

---

## SECTION 4: STANDARDS-TO-SOFTWARE MAPPING

### FIPS 203 (ML-KEM) Implementation Status

**Software with Full Support:**

- OpenSSL 3.5.4, Bouncy Castle Java 1.83, liboqs, GnuTLS (hybrid)
- wolfSSL 5.8.2, Bouncy Castle C# .NET

**Affected Categories:**

- CSC-005 (TLS/SSL) - Critical for secure communications
- CSC-003 (Key Management) - Essential for key encapsulation
- CSC-010 (VPN/IPsec) - Required for VPN modernization
- CSC-014 (SSH) - Deployed in OpenSSH 10.2 by default

**Industry Documents Requiring ML-KEM:**

- IETF TLS 1.3 Hybrid KEM (draft-03)
- IETF LAMPS Composite KEM (draft-11)
- CISA PQC Product Category List

### FIPS 204 (ML-DSA) Implementation Status

**Software with Full Support:**

- OpenSSL 3.5.4, Bouncy Castle Java 1.83, liboqs
- wolfSSL 5.8.2, wolfBoot 2.4.0

**Affected Categories:**

- CSC-004 (PKI) - Certificate signing
- CSC-017 (Code Signing) - Software supply chain
- CSC-026 (Secure Boot) - Firmware integrity
- CSC-009 (Digital Signatures) - Document authentication

**Industry Documents Requiring ML-DSA:**

- IETF LAMPS Composite Signatures
- X.509 Certificate Standards
- Authenticode/Code Signing Standards

### FIPS 205 (SLH-DSA) Implementation Status

**Software with Full Support:**

- OpenSSL 3.5.4, Bouncy Castle Java 1.83, liboqs
- HashiCorp Vault (experimental)

**Affected Categories:**

- CSC-004 (PKI) - Long-term trust
- CSC-017 (Code Signing) - Stateless signatures
- CSC-026 (Secure Boot) - Backup signature scheme

**Use Cases:**

- Long-term archival signatures
- Backup to ML-DSA
- Stateless signature requirements

---

## SECTION 5: TIMELINE PRESSURE ANALYSIS

### Regulatory Deadlines Impacting Software Categories

**2025-12-31: CNSA 1.0 Compliance (NSA)**

- Affected: CSC-004 (PKI), CSC-002 (HSM), CSC-001 (Crypto Libraries)
- Impact: All National Security Systems
- Status: In Progress

**2025-Q4: CISA PQC Product Category List**

- Affected: Multiple categories across data management, networking, endpoints
- Impact: Federal procurement requirements
- Status: List published, approved products pending

**2026-06-30: CNSA 2.0 Compliance Window**

- Affected: All cryptographic software categories
- Impact: 6-month window for systems not CNSA 1.0 compliant
- Status: Planning phase

**2026: EU/Germany PQC Initiatives**

- Germany quantum-secure ID cards (BSI)
- PKI Consortium global coordination
- Impact: International standards pressure

**2026-2027: HSM PQC Architecture Availability**

- Current Gap: No full PQC HSM architectures
- FIPS 140-3 certification lag: 2+ years
- Impact: Root of trust vulnerability window

---

## SECTION 6: STRATEGIC RECOMMENDATIONS

### Immediate Actions (2025-Q4)

1. **Cryptographic Libraries (CSC-001)**
   - Deploy OpenSSL 3.5.4 or Bouncy Castle 1.83 with full PQC
   - Establish crypto inventory of all library dependencies
   - Begin hybrid mode deployment (classical + PQC)

2. **TLS/SSL Infrastructure (CSC-005)**
   - Enable hybrid TLS 1.3 with X25519MLKEM768
   - Update web servers, load balancers, API gateways
   - Test performance impact in production-like environments

3. **PKI Systems (CSC-004)**
   - Deploy composite certificate capability
   - Plan phased migration of certificate hierarchies
   - Test interoperability with legacy systems

4. **HSM Software (CSC-002)**
   - Engage HSM vendors on PQC roadmaps
   - Plan 2026-2027 HSM replacement cycle
   - Deploy hybrid HSM architecture if available

5. **Key Management (CSC-003)**
   - Audit all key lifecycle processes
   - Implement ML-KEM for key encapsulation
   - Update KMS to support dual-algorithm operation

### Planning Phase (2026-Q1)

6. **SSH Infrastructure (CSC-014)**
   - Deploy OpenSSH 10.2 with mlkem768x25519 default
   - Update jump hosts and bastion servers
   - Test with privileged access management systems

7. **VPN/IPsec (CSC-010)**
   - Deploy strongSwan with experimental ML-KEM
   - Plan site-to-site VPN migration
   - Test remote access VPN performance

8. **Secure Boot (CSC-026)**
   - Implement ML-DSA firmware signing
   - Update TPM 2.0 configurations
   - Plan UEFI Secure Boot PQC enablement

9. **Code Signing (CSC-017)**
   - Deploy ML-DSA for software signing
   - Update CI/CD pipelines
   - Test container image signing with PQC

10. **Database Encryption (CSC-007)**
    - Evaluate TDE with PQC key wrapping
    - Test column-level encryption performance
    - Plan data warehouse migration

### Strategic Initiatives (2026-Q2+)

11. **Cryptographic Agility (CSC-025)**
    - Implement crypto abstraction layers
    - Deploy algorithm negotiation frameworks
    - Establish governance for algorithm transitions

12. **API Security (CSC-015)**
    - Migrate JWT to ML-DSA signatures
    - Update OAuth 2.0 implementations
    - Test service mesh security with PQC

13. **Payment Systems (CSC-029)**
    - Coordinate with payment networks (Visa, Mastercard)
    - Plan P2PE solution upgrades
    - Update payment terminals for PQC

14. **Cloud Encryption (CSC-028)**
    - Enable PQC in cloud KMS services
    - Update CASB encryption policies
    - Implement multi-cloud PQC strategy

15. **Monitoring & Assessment (CSC-018)**
    - Deploy crypto discovery tools
    - Implement continuous compliance scanning
    - Establish PQC readiness dashboards

---

## SECTION 7: RISK MITIGATION STRATEGIES

### Vendor Lock-in Risks

**Issue:** Concentration of PQC support in few vendors (OpenSSL, Bouncy Castle)

**Mitigation:**

1. Support multiple cryptographic library options
2. Implement crypto abstraction layers (CSC-025)
3. Maintain fallback to alternative implementations
4. Participate in open-source PQC projects

### Performance Impact Risks

**Issue:** PQC algorithms have larger keys and slower operations

**Mitigation:**

1. Deploy hybrid mode initially (classical + PQC)
2. Conduct thorough performance testing
3. Plan infrastructure scaling (network, compute)
4. Optimize hot paths with hardware acceleration

### Interoperability Risks

**Issue:** Mixed PQC deployment creates compatibility issues

**Mitigation:**

1. Maintain backward compatibility during transition
2. Deploy hybrid algorithms (X25519MLKEM768)
3. Implement graceful fallback mechanisms
4. Coordinate with partners on migration timeline

### HSM Availability Risks

**Issue:** 2+ year gap until PQC-ready HSMs widely available

**Mitigation:**

1. Plan HSM replacement cycles now for 2026-2027
2. Consider software-based key protection as interim
3. Deploy HSM pooling/clustering for flexibility
4. Evaluate quantum-safe HSM alternatives (Crypto4A)

### Compliance Pressure Risks

**Issue:** Regulatory deadlines compressing migration timeline

**Mitigation:**

1. Prioritize systems with regulatory requirements
2. Establish executive sponsorship for PQC program
3. Allocate dedicated resources and budget
4. Seek guidance/waivers where needed (e.g., NSS)

---

## SECTION 8: INVESTMENT PRIORITIES

### Budget Allocation Recommendations

**High-Priority Investments (60% of budget):**

1. Cryptographic library upgrades and licensing
2. HSM replacement planning and procurement
3. TLS/SSL infrastructure modernization
4. PKI system upgrades and testing
5. Professional services for migration planning

**Medium-Priority Investments (30% of budget):**

1. Performance testing and optimization
2. Monitoring and discovery tools
3. Training and enablement
4. Interoperability testing
5. Third-party assessments

**Strategic Investments (10% of budget):**

1. Cryptographic agility frameworks
2. Research and development
3. Industry collaboration
4. Standards participation
5. Innovation initiatives

### ROI Considerations

**Cost Avoidance:**

- Prevent harvest-now-decrypt-later exposure
- Avoid regulatory non-compliance penalties
- Reduce incident response costs
- Minimize emergency migration expenses

**Business Enablement:**

- Support long-term digital trust
- Enable quantum-safe product offerings
- Maintain customer confidence
- Ensure business continuity

**Competitive Advantage:**

- Early mover advantage in quantum-safe services
- Differentiation in regulated industries
- Enhanced security posture
- Future-proof architecture

---

## SECTION 9: CROSS-REFERENCE SUMMARY

### Database Integration Statistics

**Datasets Cross-Referenced:**

- Leaders: 100 PQC thought leaders and contributors
- Library: 76 authoritative documents and standards
- Threats: 125 industry-specific quantum threats
- Timeline: 128 regulatory and milestone events
- Algorithms: 41 PQC algorithm specifications
- Software Categories: 30 cryptographic software categories
- Software Products: 49 specific implementations

**Mapping Coverage:**

- 15 software categories mapped to specific threats
- 76 library documents mapped to software categories
- 49 software products assessed for PQC readiness
- 30 categories prioritized by urgency score
- 25 products with some level of PQC support

**Gap Analysis:**

- 14 software products with zero PQC support (29%)
- 12 high-priority categories with <50% readiness
- 8 critical categories requiring immediate action
- Multiple categories with no tracked software products

---

## SECTION 10: NEXT STEPS

### Phase 1: Assessment (2025-Q4)

**Week 1-2:**

- [ ] Complete cryptographic inventory
- [ ] Identify all software dependencies
- [ ] Map current state to software categories
- [ ] Prioritize systems by business impact

**Week 3-4:**

- [ ] Assess PQC readiness of current software
- [ ] Identify vendor PQC roadmaps
- [ ] Evaluate hybrid deployment options
- [ ] Create detailed migration plan

### Phase 2: Pilot Deployment (2026-Q1)

**Month 1:**

- [ ] Deploy PQC in non-production environments
- [ ] Conduct performance testing
- [ ] Validate interoperability
- [ ] Train operations teams

**Month 2:**

- [ ] Pilot production deployment (low-risk systems)
- [ ] Monitor and measure performance
- [ ] Collect feedback and refine approach
- [ ] Document lessons learned

**Month 3:**

- [ ] Expand to medium-risk production systems
- [ ] Establish operational procedures
- [ ] Update runbooks and documentation
- [ ] Prepare for full-scale rollout

### Phase 3: Production Rollout (2026-Q2+)

**Continuous Activities:**

- [ ] Phased migration by priority
- [ ] Regular assessment and monitoring
- [ ] Vendor engagement and coordination
- [ ] Standards tracking and compliance
- [ ] Team training and capability building

---

## APPENDICES

### Appendix A: Augmented Data Files

1. **library_augmented_with_sw_categories.csv**
   - Original library + software category mappings
   - Impacted software products
   - Migration priority levels

2. **software_reference_augmented_pqc_analysis.csv**
   - Software products + PQC readiness scores
   - Migration timelines
   - Relevant standards
   - Industry impact analysis

3. **pqc_threat_software_mapping.csv**
   - Threat scenarios + affected software
   - Specific products at risk
   - Recommended actions

4. **pqc_software_category_priority_matrix.csv**
   - All categories with urgency scores
   - Readiness percentages
   - Timeline pressures
   - Action timelines

### Appendix B: Key Resources

**Standards Organizations:**

- NIST: https://csrc.nist.gov/projects/post-quantum-cryptography
- IETF: https://datatracker.ietf.org/
- CISA: https://www.cisa.gov/quantum

**Open Source Projects:**

- Open Quantum Safe: https://openquantumsafe.org/
- liboqs: https://github.com/open-quantum-safe/liboqs
- oqs-provider: https://github.com/open-quantum-safe/oqs-provider

**Industry Consortia:**

- PQCA (Linux Foundation): https://pqca.org/
- PKI Consortium: https://pkic.org/

### Appendix C: Glossary

- **ML-KEM**: Module-Lattice-Based Key Encapsulation Mechanism (FIPS 203)
- **ML-DSA**: Module-Lattice-Based Digital Signature Algorithm (FIPS 204)
- **SLH-DSA**: Stateless Hash-Based Digital Signature Algorithm (FIPS 205)
- **HNDL**: Harvest Now, Decrypt Later attacks
- **CNSA 2.0**: Commercial National Security Algorithm Suite 2.0
- **FIPS 140-3**: Federal Information Processing Standard for cryptographic modules
- **Hybrid Mode**: Using both classical and PQC algorithms simultaneously

---

**Document Version:** 1.0
**Last Updated:** December 16, 2025
**Next Review:** January 2026
**Owner:** PQC Migration Program Office
