# Quantum-Safe Cryptographic Software Reference

## Enterprise Guide to Post-Quantum Cryptography Implementation

**Date Generated:** December 17, 2025  
**Total Quantum-Safe Entries:** 31 software products  
**NIST PQC Standards:** FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)

---

## Executive Summary

This reference document identifies and describes 31 cryptographic software products that have implemented quantum-safe cryptography. As quantum computing advances threaten traditional public-key cryptography (RSA, ECC), these solutions provide protection against future quantum attacks through NIST-standardized post-quantum algorithms.

**Key Findings:**

- 31 out of 92 reviewed products (34%) have quantum-safe capabilities
- 13 distinct software categories represented
- Mix of 17 open source and 14 commercial/mixed solutions
- Maturity ranges from production-ready (OpenSSH default) to experimental
- Strong coverage in TLS/SSL, PKI, and cryptographic libraries

---

## Understanding Post-Quantum Cryptography (PQC)

### The Quantum Threat

Quantum computers using Shor's algorithm can break:

- **RSA encryption** - Used for key exchange, digital signatures
- **ECC (Elliptic Curve Cryptography)** - Used for TLS, SSH, VPN, digital signatures
- **DH/ECDH** - Used for key agreement protocols

**Timeline Considerations:**

- "Harvest now, decrypt later" attacks are occurring today
- NIST estimates quantum computers capable of breaking RSA-2048 within 10-30 years
- Data with 10+ year confidentiality requirements needs protection now
- Migration to PQC takes 5-10 years for large enterprises

### NIST-Standardized Algorithms

**FIPS 203 - ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism)**

- Formerly known as CRYSTALS-Kyber
- Purpose: Key exchange and encryption
- Security levels: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- Most widely implemented PQC algorithm
- Excellent performance characteristics

**FIPS 204 - ML-DSA (Module-Lattice-Based Digital Signature Algorithm)**

- Formerly known as CRYSTALS-Dilithium
- Purpose: Digital signatures
- Security levels: ML-DSA-44, ML-DSA-65, ML-DSA-87
- Balanced performance and signature size

**FIPS 205 - SLH-DSA (Stateless Hash-Based Digital Signature Algorithm)**

- Formerly known as SPHINCS+
- Purpose: Digital signatures (stateless)
- More conservative security assumptions than lattice-based
- Larger signatures, slower performance, but hash-based security

### Additional Candidate Algorithms

Several software products support additional PQC candidates:

- **BIKE** - Bit Flipping Key Encapsulation
- **HQC** - Hamming Quasi-Cyclic
- **FrodoKEM** - Conservative lattice-based KEM
- **Classic McEliece** - Code-based cryptography
- **PQXDH** - Signal's post-quantum extended Diffie-Hellman

---

## Software Categories with Quantum-Safe Capabilities

### Critical Priority Categories

#### 1. Cryptographic Libraries (4 products)

**Why Critical:** Foundation for all cryptographic operations across applications

**OpenSSL 3.5+**

- Full ML-KEM, ML-DSA, SLH-DSA support
- Industry standard library, used by majority of HTTPS websites
- Hybrid mode: combines X25519 with ML-KEM for gradual migration
- Open source (Apache-2.0)

**Bouncy Castle (Java, C#)**

- Comprehensive PQC suite: ML-KEM, ML-DSA, SLH-DSA, HQC
- Composite signatures enable dual classical/PQC modes
- JCE/JCA provider for Java, .NET integration
- Open source with commercial LTS available

**Impact:** These libraries enable quantum-safe cryptography across millions of applications.

---

#### 2. TLS/SSL Implementation Software (6 products)

**Why Critical:** Protects internet communications, APIs, and web services

**OpenSSH 10.2**

- **Production deployment**: Default key exchange is now mlkem768x25519-sha256
- First major implementation to enable PQC by default
- Protects remote administration and file transfers
- Open source (BSD)

**GnuTLS 3.8.11**

- ML-KEM with X25519 hybrid (X25519MLKEM768)
- ML-DSA signature support via liboqs
- Used extensively in GNU/Linux applications
- Open source (LGPL)

**wolfSSL 5.8.2**

- Embedded/IoT focus with ML-DSA, ML-KEM, Kyber
- Small footprint for resource-constrained devices
- FIPS 140-3 validated
- Commercial with open source option

**BoringSSL (Google)**

- ML-KEM deployed in Chrome browser
- Internet-scale quantum-safe deployment
- Influences industry standards
- Open source (used by Google)

**AWS s2n-tls**

- Kyber hybrid in AWS infrastructure
- High-performance cloud TLS
- Open source (Apache-2.0)

**rustls**

- Memory-safe Rust implementation
- PQC via aws-lc-rs
- Zero unsafe code
- Open source

**Impact:** Securing the internet's transport layer against quantum threats.

---

#### 3. Post-Quantum Cryptography Libraries (2 products)

**Why Critical:** Reference implementations and integration enablers

**liboqs 0.15.0**

- Comprehensive: ML-KEM, ML-DSA, SLH-DSA, BIKE, HQC, FrodoKEM, Classic McEliece
- Linux Foundation Post-Quantum Cryptography Alliance (PQCA) project
- Foundation for OQS ecosystem
- Open source (MIT)

**oqs-provider**

- OpenSSL 3 provider architecture
- Enables PQC in TLS 1.3, X.509, CMS without application changes
- All liboqs algorithms available
- Open source (MIT)

**Impact:** These enable rapid PQC adoption across existing software ecosystems.

---

#### 4. Hardware Security Modules (4 products)

**Why Critical:** Highest security key storage with quantum protection

**Thales Luna HSM**

- PQC-ready with hardware acceleration
- FIPS 140-3 Level 3 certified
- Enterprise key management
- Commercial

**Entrust nShield**

- Hybrid classical/PQC mode
- CodeSafe secure execution environment
- FIPS 140-2 Level 3
- Commercial

**Azure Dedicated HSM** & **Utimaco SecurityServer**

- PQC capabilities via Thales integration and roadmap
- Cloud and on-premise deployment options

**Impact:** Protecting root keys and critical cryptographic operations with quantum-safe hardware.

---

#### 5. Key Management Systems (2 products)

**Why Critical:** Enterprise key lifecycle management

**HashiCorp Vault 1.21.1**

- Experimental SLH-DSA in Transit secrets engine
- Encryption-as-a-service with quantum protection
- Enterprise secrets management
- Commercial/Open source (BUSL)

**AWS KMS**

- Limited hybrid PQC support
- Gradual rollout across AWS infrastructure
- Cloud key management
- Commercial

**Impact:** Protecting encryption keys at rest and in transit against quantum threats.

---

#### 6. Public Key Infrastructure (3 products)

**Why Critical:** Trust foundation for digital certificates

**EJBCA**

- PQC via Bouncy Castle integration
- X.509 certificates with ML-DSA signatures
- Hybrid certificate chains
- Open source (LGPL)

**Keyfactor EJBCA**

- Commercial PKI with full PQC lifecycle
- Certificate issuance, renewal, revocation
- Enterprise scale

**Venafi Trust Protection Platform**

- Crypto agility for PQC migration
- Automated discovery and management
- Commercial

**Impact:** Enabling quantum-safe certificate infrastructure for authentication and encryption.

---

#### 7. Cryptographic Agility Frameworks (2 products)

**Why Critical:** Enable smooth organizational PQC transition

**ISARA Radiate**

- Purpose-built quantum-safe toolkit
- Algorithm agility and hybrid modes
- Enterprise integration focus
- Commercial

**Cryptosense Analyzer**

- PQC readiness assessment
- Crypto usage discovery
- Migration recommendations
- Commercial

**Impact:** Strategic planning and execution of quantum-safe migrations.

---

### High Priority Categories

#### 8. SSH Implementation Software (2 products)

**OpenSSH 10.2**

- Default mlkem768x25519-sha256 hybrid
- Quantum-safe remote administration
- Open source

**wolfSSH**

- Embedded SSH with Kyber/Ed25519
- IoT and embedded systems
- Commercial

---

#### 9. Digital Signature Software (1 product)

**SignServer**

- Document and code signing with PQC
- ML-DSA signature support via modules
- Open source/Commercial

---

#### 10. VPN and IPsec Software (1 product)

**strongSwan**

- Experimental ML-KEM for IPsec VPN
- Quantum-safe site-to-site tunnels
- Open source

---

#### 11. Secure Messaging (1 product)

**Signal Protocol**

- Experimental PQXDH (Post-Quantum Extended Diffie-Hellman)
- Combines X25519, Kyber, double-ratchet
- Forward secrecy with quantum protection
- Open source

---

#### 12. Secure Boot and Firmware (1 product)

**wolfBoot**

- ML-DSA firmware signature verification
- Long-lived embedded devices and IoT
- Automotive and aerospace applications
- Commercial

---

### Medium Priority Categories

#### 13. Cryptographic Protocol Analyzers (2 products)

**SSLyze & testssl.sh**

- PQC detection and verification
- Audit TLS configurations for quantum-safe readiness
- Essential for deployment verification
- Open source

---

## Implementation Maturity Levels

### Production Ready (Default Enabled)

- **OpenSSH 10.2** - mlkem768x25519 is default key exchange
- **BoringSSL** - ML-KEM deployed in Chrome

### Production Ready (Manual Configuration)

- **OpenSSL 3.5+** - Full NIST PQC support, requires configuration
- **Bouncy Castle** - Comprehensive PQC library, application integration needed
- **GnuTLS** - ML-KEM/ML-DSA support, configure cipher suites
- **wolfSSL** - Embedded PQC, configure at build/runtime

### Early Production / Stable

- **liboqs/oqs-provider** - Stable API, production deployments emerging
- **EJBCA** - PKI with PQC certificates
- **Thales Luna HSM** - PQC-ready hardware

### Experimental / Development

- **HashiCorp Vault** - SLH-DSA in Transit (experimental)
- **strongSwan** - ML-KEM for IPsec (experimental)
- **Signal** - PQXDH (experimental)
- **LibreSSL** - ML-KEM imported, not public API yet

### Limited / Hybrid Support

- **AWS KMS** - Gradual rollout
- **Azure Dedicated HSM** - Via Thales capabilities
- **Entrust nShield** - Hybrid mode support

---

## Deployment Strategies

### Hybrid Mode (Recommended)

Combines classical and PQC algorithms for defense-in-depth:

- **Key Exchange:** X25519 + ML-KEM-768 (e.g., X25519MLKEM768)
- **Signatures:** RSA/ECDSA + ML-DSA (composite signatures)

**Benefits:**

- Protection if either algorithm is broken
- Gradual migration path
- Interoperability with legacy systems

**Examples:**

- OpenSSH: mlkem768x25519-sha256
- GnuTLS: X25519MLKEM768
- Bouncy Castle: Composite signatures

### Pure PQC Mode

Uses only post-quantum algorithms:

- **Key Exchange:** ML-KEM-768 or ML-KEM-1024
- **Signatures:** ML-DSA-65 or ML-DSA-87

**Use Cases:**

- Systems requiring maximum quantum protection
- Closed environments with full PQC support
- Long-term confidentiality requirements (25+ years)

### Algorithm Agility

Design systems to switch algorithms without redesign:

- Use abstraction layers (e.g., oqs-provider for OpenSSL)
- Negotiate algorithms at runtime
- Support multiple signature/KEM algorithms

**Tools:**

- ISARA Radiate
- Venafi crypto agility
- Cryptosense Analyzer

---

## Security Levels and Algorithm Selection

### NIST Security Levels

**Level 1:** Equivalent to AES-128 (128-bit security)

- ML-KEM-512
- Suitable for standard applications

**Level 3:** Equivalent to AES-192 (192-bit security)

- ML-KEM-768 (most commonly deployed)
- ML-DSA-65
- Recommended for most enterprises

**Level 5:** Equivalent to AES-256 (256-bit security)

- ML-KEM-1024
- ML-DSA-87
- Required for top secret / critical infrastructure

### Recommended Configurations

**TLS 1.3:**

- Key Exchange: X25519+ML-KEM-768 hybrid
- Authentication: ECDSA P-256 + ML-DSA-65 composite

**SSH:**

- Key Exchange: mlkem768x25519-sha256
- Host Keys: Ed25519 + ML-DSA-65 composite

**VPN/IPsec:**

- IKEv2 with ML-KEM-768
- Authentication: RSA-3072 or ML-DSA-65

**PKI Certificates:**

- Root CA: ML-DSA-87 (pure PQC for long-term trust)
- Intermediate CA: RSA-4096 + ML-DSA-65 composite
- End-entity: ECDSA P-256 + ML-DSA-65 composite

---

## Performance Considerations

### Key Sizes

Post-quantum keys are significantly larger than classical:

| Algorithm        | Public Key      | Private Key     | Signature/Ciphertext |
| ---------------- | --------------- | --------------- | -------------------- |
| RSA-2048         | 256 bytes       | 1,193 bytes     | 256 bytes            |
| ECDSA P-256      | 64 bytes        | 32 bytes        | 64 bytes             |
| **ML-KEM-768**   | **1,184 bytes** | **2,400 bytes** | **1,088 bytes**      |
| **ML-DSA-65**    | **1,952 bytes** | **4,000 bytes** | **3,309 bytes**      |
| **SLH-DSA-128f** | **32 bytes**    | **64 bytes**    | **17,088 bytes**     |

**Impact:**

- Increased bandwidth for TLS handshakes (3-5 KB additional)
- Larger certificate files
- More storage for key material
- Potential MTU fragmentation issues

### Computational Performance

- **ML-KEM:** Faster than RSA, comparable to ECDH
- **ML-DSA:** Faster signing than RSA, slower verification
- **SLH-DSA:** Significantly slower, but hash-based security

**Hardware Acceleration:**

- Intel AVX2/AVX-512 optimizations available
- ARM NEON support in some implementations
- HSMs provide hardware acceleration

### Network Impact

- TLS handshake size increases ~3-5 KB
- SSH connection setup adds ~2-3 KB
- IPsec IKE messages grow by ~2 KB
- May require MTU adjustments for some networks

---

## Migration Planning

### Phase 1: Discovery and Assessment (3-6 months)

1. **Inventory cryptographic systems**
   - Use Cryptosense Analyzer or similar tools
   - Identify all uses of RSA, ECC, DH

2. **Assess PQC readiness**
   - Check software versions and update paths
   - Test PQC in lab environments
   - Measure performance impact

3. **Prioritize by risk**
   - Focus on long-lived data first
   - Critical infrastructure and high-value assets
   - Systems with 10+ year deployment lifecycle

**Tools:** Cryptosense Analyzer, SSLyze, testssl.sh

---

### Phase 2: Pilot Deployment (6-12 months)

1. **Internal systems first**
   - Enable hybrid mode in test environments
   - Monitor performance and compatibility
   - Train operations teams

2. **Infrastructure hardening**
   - Deploy OpenSSH with PQC
   - Enable hybrid TLS in internal APIs
   - Test VPN with strongSwan PQC

3. **Certificate infrastructure**
   - Stand up test PKI with PQC certificates
   - Issue composite certificates
   - Test certificate validation

**Tools:** OpenSSL 3.5+, liboqs, EJBCA

---

### Phase 3: Production Rollout (12-24 months)

1. **External-facing services**
   - Enable hybrid TLS on public websites
   - Deploy PQC in client applications
   - Update mobile apps with PQC libraries

2. **Certificate migration**
   - Issue new certificate chains with PQC
   - Maintain dual certificates during transition
   - Update trust stores

3. **Partner integration**
   - Coordinate with vendors and partners
   - Ensure interoperability
   - Document configuration requirements

**Tools:** Venafi, Keyfactor, ISARA Radiate

---

### Phase 4: Full Transition (24-60 months)

1. **Deprecate classical-only systems**
   - Phase out RSA-2048 and below
   - Require hybrid or pure PQC
   - Update security policies

2. **Algorithm lifecycle management**
   - Monitor NIST for algorithm updates
   - Implement crypto agility frameworks
   - Plan for algorithm rotation

3. **Continuous monitoring**
   - Scan for non-compliant systems
   - Track quantum computing advances
   - Update migration timelines

---

## Industry-Specific Considerations

### Financial Services

- **Regulatory drivers:** PCI DSS, PSD2, SEC cybersecurity rules
- **Priority:** Payment systems, trading platforms, customer data
- **Recommendations:**
  - Thales payShield with PQC roadmap
  - OpenSSL 3.5+ for TLS
  - HSM-backed key storage

### Government and Defense

- **Regulatory drivers:** NSA CNSA 2.0, NIST guidelines
- **Priority:** Classified communications, critical infrastructure
- **Recommendations:**
  - FIPS 140-3 validated solutions
  - Pure PQC mode for classified
  - ML-KEM-1024 and ML-DSA-87 (Level 5)

### Healthcare

- **Regulatory drivers:** HIPAA, HITECH, state privacy laws
- **Priority:** Patient records (25+ year retention), medical devices
- **Recommendations:**
  - Hybrid mode for interoperability
  - Focus on data-at-rest encryption
  - Long-term archive encryption

### Telecommunications

- **Regulatory drivers:** ETSI standards, national security requirements
- **Priority:** 5G infrastructure, subscriber data, roaming
- **Recommendations:**
  - wolfSSL for embedded 5G components
  - strongSwan for IPsec tunnels
  - Signal Protocol for messaging

### Critical Infrastructure

- **Regulatory drivers:** ICS-CERT, sector-specific regulations
- **Priority:** SCADA systems, industrial IoT, long-lived devices
- **Recommendations:**
  - wolfBoot for secure firmware updates
  - wolfSSL for embedded systems
  - 20+ year device lifecycle planning

---

## Open Source vs. Commercial Solutions

### Open Source Advantages

- **Transparency:** Full source code review
- **Community:** Broad adoption and testing
- **Cost:** No licensing fees
- **Flexibility:** Customize as needed

**Recommended Open Source:**

- OpenSSL 3.5+ (Cryptographic library)
- liboqs + oqs-provider (PQC enabler)
- OpenSSH 10.2 (SSH with PQC default)
- GnuTLS (TLS implementation)
- EJBCA (PKI software)

### Commercial Advantages

- **Support:** Vendor support and SLAs
- **Integration:** Enterprise tooling and automation
- **Compliance:** Pre-certified for FIPS, Common Criteria
- **Roadmap:** Clear PQC migration path

**Recommended Commercial:**

- Thales Luna HSM (Hardware key storage)
- ISARA Radiate (Migration toolkit)
- Keyfactor/Venafi (Enterprise PKI)
- HashiCorp Vault (Secrets management)
- CyberArk (Privileged access)

### Hybrid Approach (Recommended)

- Use open source for libraries and protocols
- Commercial for HSMs, enterprise management
- Open source for testing and development
- Commercial for production high-security systems

---

## Testing and Validation

### Functional Testing

1. **Algorithm Verification**
   - Test all supported PQC algorithms
   - Verify correct parameter sets
   - Validate key sizes and formats

2. **Interoperability**
   - Test client-server with different implementations
   - Verify hybrid mode fallback
   - Check cross-platform compatibility

3. **Error Handling**
   - Unsupported algorithm negotiation
   - Certificate validation failures
   - Key size limits

### Performance Testing

1. **Baseline Metrics**
   - TLS handshake time (classical)
   - Throughput (classical)
   - CPU and memory usage

2. **PQC Metrics**
   - TLS handshake time (hybrid and pure PQC)
   - Throughput with PQC
   - Resource utilization increase

3. **Load Testing**
   - Concurrent connections with PQC
   - Peak load scenarios
   - Sustained high-volume traffic

### Security Testing

1. **Configuration Validation**
   - SSLyze or testssl.sh scans
   - Cipher suite ordering
   - Certificate chain validation

2. **Penetration Testing**
   - Downgrade attacks
   - Algorithm negotiation manipulation
   - Certificate spoofing attempts

3. **Compliance Validation**
   - FIPS 140-3 mode verification
   - NIST compliance checks
   - Industry-specific requirements

---

## Common Challenges and Solutions

### Challenge 1: Certificate Size and Validation

**Problem:** PQC certificates are 3-5x larger, causing issues with:

- Legacy systems with hard-coded size limits
- Network appliances with certificate size restrictions
- TLS handshake fragmentation

**Solutions:**

- Use hybrid certificates initially
- Update size limits in configurations
- Enable TLS 1.3 with compression
- Consider certificate caching strategies

---

### Challenge 2: Performance Impact

**Problem:** Increased CPU usage and latency

**Solutions:**

- Use hybrid mode (better performance than pure PQC)
- Enable hardware acceleration (AVX2, AVX-512)
- Deploy HSMs for high-volume operations
- Optimize TLS session resumption

---

### Challenge 3: Lack of Universal Support

**Problem:** Not all clients/servers support PQC

**Solutions:**

- Deploy hybrid mode for compatibility
- Maintain dual certificate chains
- Use algorithm negotiation
- Plan for 5-10 year transition period

---

### Challenge 4: Key and Certificate Management

**Problem:** Managing larger keys and certificates at scale

**Solutions:**

- Automate certificate lifecycle with Keyfactor/Venafi
- Implement crypto agility frameworks
- Use centralized key management (Vault, KMS)
- Regular auditing with Cryptosense Analyzer

---

### Challenge 5: Vendor Readiness

**Problem:** Third-party software and hardware not PQC-ready

**Solutions:**

- Survey vendors on PQC roadmaps
- Require PQC support in procurement
- Plan for equipment replacement cycles
- Use PQC-capable intermediary devices

---

## Compliance and Standards

### NIST Guidance

- **NIST IR 8413:** Migration to Post-Quantum Cryptography
- **NIST FIPS 203/204/205:** Standardized PQC algorithms
- **NIST SP 800-208:** Recommendation for Stateful Hash-Based Signatures

### NSA Requirements

- **CNSA 2.0:** Commercial National Security Algorithm Suite
  - All NSS must use quantum-resistant algorithms by 2035
  - Firmware and software signing: SLH-DSA by 2025
  - TLS: Hybrid key exchange by 2025, pure PQC by 2030

### Industry Standards

- **ETSI TS 103 744:** Quantum-Safe Hybrid Key Exchanges in IKEv2
- **IETF Drafts:** Multiple PQC TLS and SSH specifications
- **PCI DSS v4.0:** Crypto agility requirements (prepares for PQC)

### Regulatory Landscape

- **EU Cybersecurity Act:** Preparing for quantum threats
- **US QUANTUM Act:** Federal quantum readiness requirements
- **Financial sector:** Growing awareness and planning

---

## Resources and Training

### Technical Resources

- **Open Quantum Safe Project:** https://openquantumsafe.org/
- **NIST PQC:** https://csrc.nist.gov/projects/post-quantum-cryptography
- **PQ Code Package:** https://github.com/pq-code-package
- **wolfSSL PQC Documentation:** https://www.wolfssl.com/pqc/

### Training and Certification

- SANS courses on quantum-safe cryptography
- ISC2 quantum computing security training
- Vendor-specific training (Thales, Keyfactor, ISARA)

### Community and Forums

- Linux Foundation Post-Quantum Cryptography Alliance (PQCA)
- IETF PQC working groups
- Cloud Security Alliance quantum-safe working group

---

## Vendor Contact Information

### Open Source Projects

- **OpenSSL:** https://www.openssl.org/
- **Open Quantum Safe:** https://openquantumsafe.org/
- **Bouncy Castle:** https://www.bouncycastle.org/

### Commercial Vendors

- **Thales:** https://cpl.thalesgroup.com/
- **Entrust:** https://www.entrust.com/
- **ISARA:** https://www.isara.com/
- **Keyfactor:** https://www.keyfactor.com/
- **Venafi:** https://venafi.com/
- **HashiCorp:** https://www.hashicorp.com/
- **wolfSSL:** https://www.wolfssl.com/

---

## Conclusion

The transition to quantum-safe cryptography is no longer optional—it's an essential component of long-term security strategy. With 31 production-ready and emerging solutions available across 13 critical categories, organizations can begin their PQC migration today.

**Key Takeaways:**

1. **Start Now:** "Harvest now, decrypt later" attacks make current data vulnerable
2. **Hybrid First:** Combine classical and PQC for smooth transition
3. **Focus on Maturity:** OpenSSH, OpenSSL, and Bouncy Castle are production-ready
4. **Plan for 5-10 Years:** Full organizational migration takes time
5. **Test Thoroughly:** Performance, interoperability, and security validation essential
6. **Vendor Engagement:** Ensure third-party readiness
7. **Algorithm Agility:** Build systems that can adapt to future changes

**Immediate Actions:**

1. **Assess:** Use Cryptosense Analyzer or testssl.sh to inventory current crypto
2. **Test:** Deploy OpenSSL 3.5+ or liboqs in development environment
3. **Plan:** Create 5-year PQC migration roadmap
4. **Enable:** Turn on hybrid mode in OpenSSH (already default in 10.2+)
5. **Monitor:** Track NIST and NSA guidance updates

The quantum-safe software ecosystem is maturing rapidly. Organizations that begin their transition now will be well-positioned to protect their data and infrastructure against the quantum threat.

---

**Document Classification:** Public  
**Distribution:** Unlimited  
**Last Updated:** December 17, 2025  
**Next Review:** March 2026 (Quarterly Updates Recommended)
