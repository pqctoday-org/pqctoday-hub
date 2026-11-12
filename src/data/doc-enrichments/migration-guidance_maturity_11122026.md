---
generated: 2026-11-12
category: Technical Standards
document_count: 22
requirement_count: 198
---

## AQ-PQC-Migration-Framework-v2.1-2026
- **Source**: The Applied Quantum PQC Migration Framework (v2.1)
- **URL**: https://pqcframework.com/wp-content/uploads/2026/06/applied-quantum-marin-ivezic-pqc-migration-framework-universal-2-1.pdf
- **Requirement count**: 16
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Where FIPS-validated PQC is required (federal/AWS environments), choose libraries with FIPS 140-3 validation including ML-KEM (e.g., AWS-LC).
- **Governance**:
    - _T2 Risk-Informed · all_: Identify the top 20 critical systems, estimate estate size, and map critical vendor dependencies during initial scoping.
    - _T2 Risk-Informed · all_: Engage legal counsel to assess long-retention data and contractual/regulatory obligations that affect HNDL urgency and risk scoring weights.
    - _T2 Risk-Informed · all_: Approve a multi-year roadmap with a resourced Year 1 plan, an operational SteerCo, and a baseline KPI set.
    - _T3 Repeatable · all_: Run quarterly roadmap reviews, maintain dependency mapping and refresh-cycle alignment, and track vendor engagement on a dashboard.
    - _T4 Adaptive · all_: Keep the migration roadmap a living instrument with quarterly updates, tested contingency triggers, and leading indicators, transitioning to ongoing posture management.
- **Inventory**:
    - _T2 Risk-Informed · all_: Extract cryptographic metadata from already-deployed security tools (SIEM, vulnerability scanners, EPP, network monitoring) to obtain a rapid baseline inventory.
    - _T3 Repeatable · all_: Deploy layered automated cryptographic discovery (Categories 1-2 tools), supplemented by binary/metadata approaches for hard-to-reach systems and manual investigation of the top 20 critical systems.
    - _T3 Repeatable · all_: Prioritize discovery tools that output CycloneDX CBOM format or integrate with the selected CBOM tooling.
    - _T3 Repeatable · all_: Treat AI-generated discovery findings, CBOM enrichments, and classifications as candidates requiring verification before entering the CBOM as fact.
    - _T3 Repeatable · all_: Maintain the CBOM in CycloneDX format with per-entry fields: component ID, algorithm OID, key size, protocol context, library/version, certificate reference, data classification, quantum vulnerability status, migration status, owner, vendo…
    - _T3 Repeatable · all_: Record algorithm and key size in each CBOM entry's quantum vulnerability field so urgency weighting (ECC-256 = RSA-2048 tier) is applied mechanically.
    - _T3 Repeatable · certificates_: Enumerate all TLS/X.509 certificates across the estate, including internal CA-issued, cloud-managed, and externally visible certificates via CT log monitoring.
    - _T3 Repeatable · keys_: Use CSPM tooling to enumerate encryption configurations, KMS key metadata, managed certificate settings, and storage encryption status across multi-cloud environments.
    - _T3 Repeatable · libraries_: Use SCA and SBOM generation combined with cryptographic vulnerability data to identify which third-party libraries contain quantum-vulnerable implementations and which applications depend on them.
    - _T3 Repeatable · software_: Use binary analysis and runtime instrumentation to detect cryptography in vendor products and firmware where source code is unavailable.

## CSC-API-v2-Spec
- **Source**: Cloud Signature Consortium API V2.2 Specification
- **URL**: https://cloudsignatureconsortium.org/wp-content/uploads/2025/11/csc-api.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Reference cryptographic module and server-signing security standards (ISO/IEC 19790, CEN EN 419 241-1 SCAL1/SCAL2) and ETSI TS 119 312 cryptographic suites as the basis for assurance of signing environments.
- **Governance**:
    - _T2 Risk-Informed · keys_: RSSP should define and enforce its own expiration policy for account_token JWTs and must accept or reject tokens based on that policy.
    - _T2 Risk-Informed · keys_: Signature applications should pre-register with the RSSP the list of Account IDs authorized to access a restricted authorization server.
    - _T3 Repeatable · all_: Remote services must guarantee integrity and confidentiality of the communication channel between the signature application and the remote service.
    - _T3 Repeatable · certificates_: Credential generation and binding via credential-management interfaces must be performed under the same assurance and audit requirements as signing operations, in coordination with the CA.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: RSSP must securely share OAuth client_id and client_secret with signature applications, and account_tokens must carry a unique jti to prevent replay.
    - _T3 Repeatable · software_: Remote services must not implement any SSL version (SSLv2/SSLv3), as these are insecure and must be retired.

## Cloudflare-MTC-Blog
- **Source**: Keeping the Internet fast and secure: introducing Merkle Tree Certificates
- **URL**: https://blog.cloudflare.com/bootstrap-mtc/
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · certificates_: Do not defer PQ authentication migration until Q-day is imminent; begin experimental deployment and testing of PQ-capable certificate mechanisms early, since migrations take longer than expected.
    - _T3 Repeatable · certificates_: Test PQ certificate changes experimentally with browser vendors and bound the experiment's scope before general deployment, defining what will be learned and how safety is ensured.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Plan CA key rotation by distributing new CA public keys to clients ahead of use, accounting for the time needed for trust-store updates, and track the resulting certificate chain length.
    - _T3 Repeatable · all_: Organizations should enable hybrid post-quantum key agreement for TLS traffic now to mitigate harvest-now-decrypt-later risk, and track the share of traffic protected.
- **Observability**:
    - _T3 Repeatable · certificates_: Server operators should audit Certificate Transparency logs for certificates issued in their name and be able to prove and act on unauthorized issuance.

## Cloudflare-PQ-Internet-2025
- **Source**: State of the Post-Quantum Internet in 2025
- **URL**: https://blog.cloudflare.com/pq-2025/
- **Requirement count**: 5
- **Governance**:
    - _T1 Partial · all_: Account for a long tail of difficult and costly upgrades in embedded and long-lived products by fitting most upgrades into product lifecycles and planning early for the hard cases.
    - _T2 Risk-Informed · all_: Align PQC migration deadlines with applicable regulator timelines (e.g., NSA CNSA 2.0 2030–2033, US/UK 2035, Australia 2030, EU 2030/2035) rather than waiting for an estimated Q-day date.
    - _T2 Risk-Informed · all_: Risk-prioritize limited resources: upgrade quantum-vulnerable public-key crypto (RSA, ECC) ahead of symmetric key-length increases such as AES-128 to AES-256.
    - _T2 Risk-Informed · all_: Choose PQC security levels pragmatically; level 1 is acceptable for signatures because level 5 public-key schemes are costly, and mandating level 5 should not drain migration resources.
    - _T2 Risk-Informed · keys_: Prioritize migrating key agreement to post-quantum now, because traffic harvested today can be decrypted after Q-day (harvest-now-decrypt-later).

## Deloitte-TechTrends-2025-Quantum
- **Source**: The new math: Solving cryptography in an age of quantum (Tech Trends 2025)
- **URL**: https://www.deloitte.com/us/en/insights/topics/technology-management/tech-trends/2025/tech-trends-quantum-computing-and-cybersecurity.html
- **Requirement count**: 12
- **Governance**:
    - _T2 Risk-Informed · all_: Establish cryptographic governance and policy as an initial step of PQC migration, including a comprehensive roadmap for internal updates.
    - _T2 Risk-Informed · all_: Prioritize PQC migration risk-based, using inventory tool output and risk analysis to decide what migrates first.
    - _T2 Risk-Informed · all_: Prioritize protection of the most sensitive information against harvest-now-decrypt-later attacks by upgrading to quantum-resistant cryptography.
    - _T2 Risk-Informed · software_: Use contractual mechanisms to ensure vendors and third-party dependencies meet updated PQC standards, and partner with vendors on a quantum-safe roadmap.
    - _T3 Repeatable · all_: Establish robust, accountable governance mechanisms and continually assess trust between digital components as part of cyber hygiene.
- **Inventory**:
    - _T2 Risk-Informed · all_: Inventory where and how cryptographic products, algorithms, and protocols are used across owned applications and partner/vendor systems before migrating.
    - _T2 Risk-Informed · all_: Begin PQC readiness with a comprehensive cryptography inventory, as practiced by JP Morgan.
    - _T3 Repeatable · all_: Adopt cryptographic discovery/inventory tooling and cryptography management solutions to gain observability and reporting across cryptographic sprawl.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Start PQC migration now and plan for a multi-year effort, given prior cryptographic transitions (e.g., SHA1 to SHA2) took long and a CRQC may arrive in 5-10 years.
    - _T2 Risk-Informed · all_: After governance and inventory steps, update encryption algorithms to the NIST PQC standards published August 2024.
    - _T3 Repeatable · keys_: Use the PQC migration to improve key management processes, modernize legacy systems, and sunset unused tools.
    - _T4 Adaptive · all_: Build crypto-agility and cryptographic resilience: reproducible activities enabling cryptographic capabilities to be added or swapped quickly and seamlessly for future threats.

## EU PQC Recommendation
- **Source**: Recommendation on Coordinated Implementation Roadmap for PQC Transition
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/104249
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Work with EU cybersecurity experts, the NIS Cooperation Group and ENISA to evaluate and select PQC algorithms and adopt them as harmonized EU standards for implementation across the Union.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a comprehensive national PQC adoption strategy defining clear goals, milestones and timelines, coordinated with other Member States and aligned to the joint Coordinated Implementation Roadmap.
    - _T2 Risk-Informed · all_: Establish a dedicated PQC governance forum (a sub-group of the NIS Cooperation Group) with appointed expert representatives to define and develop the Coordinated Implementation Roadmap.
    - _T2 Risk-Informed · all_: Develop or align national PQC transition plans with the common Coordinated Implementation Roadmap once agreed, and complete the roadmap within two years of the Recommendation's publication.
    - _T2 Risk-Informed · all_: Coordinate PQC transition with international strategic partners and other relevant bodies to ensure interoperability and avoid duplicated effort.
    - _T3 Repeatable · all_: Provide progress and effectiveness information to the Commission on request to enable periodic monitoring and assessment of the PQC transition work.
    - _T3 Repeatable · all_: Cooperate with the Commission to review the effects of the PQC transition recommendation within three years of publication, informed by the PQC sub-group's outcomes.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Define a PQC transition roadmap listing actions, a phased timeline with milestones, interdependencies, and the stakeholders to be involved.
    - _T2 Risk-Informed · all_: Plan migration of public administration and critical infrastructure systems to PQC as soon as possible, using hybrid schemes combining PQC with existing cryptography or QKD.
    - _T3 Repeatable · all_: Deploy PQC into existing public administration systems and critical infrastructures via hybrid schemes combining PQC with classical cryptography or with Quantum Key Distribution.

## HSBC-InfoSecGlobal-Thales-CryptographicInventory-2025
- **Source**: Cryptographic Inventory: Deriving Value Today, Preparing for Tomorrow
- **URL**: https://www.ventures.hsbc.com/-/media/ventures/250602-cryptographic-inventory-deriving-value-today-preparing-for-tomorrow-2025.pdf
- **Requirement count**: 17
- **Governance**:
    - _T2 Risk-Informed · all_: Feed cryptographic inventory insights into Enterprise Risk Management, treating cryptographic risk as a component of cyber risk.
    - _T2 Risk-Informed · all_: Retain ownership of cryptographic risk even when capabilities are outsourced; manage supply-chain dependencies accordingly.
    - _T3 Repeatable · all_: Track evolving regulatory timelines (e.g., NIST IR 8547) and stay ahead of them to avoid rushed upgrades and penalties.
    - _T3 Repeatable · all_: Treat cryptographic agility as on par with agile software development best practices within software development.
    - _T3 Repeatable · software_: Require a CBOM from suppliers during procurement, assess supplier PQC readiness, include PQC clauses in contracts, and agree joint incident response plans under shared responsibility.
    - _T4 Adaptive · all_: Measure unmitigated cryptographic exposure and the impact of scenario-driven mitigations, managing it as balance-sheet risk (provision, retain, or transfer) in the context of risk tolerance.
- **Inventory**:
    - _T2 Risk-Informed · all_: Prioritise inventory coverage using a Pareto-style, risk-focused approach, concentrating first on the fewer but most relevant cryptographic assets.
    - _T2 Risk-Informed · all_: Make visible the systems and components in the supply chain that are not likely to support PQC.
    - _T2 Risk-Informed · certificates_: Include deployed certificates in the cryptographic inventory: end-entity certificates, root CAs and trust stores used for TLS, mTLS, signing and other purposes.
    - _T2 Risk-Informed · keys_: Include cryptographic keys, tokens, secrets and keystores deployed in systems (TLS, client authentication, etc.) in the cryptographic inventory.
    - _T2 Risk-Informed · libraries_: Inventory cryptographic libraries and algorithms embedded in or linked to software and hardware systems.
    - _T2 Risk-Informed · software_: Inventory cryptography built into applications, including algorithms embedded in software and cryptographic operations (signing, encryption) performed by applications.
    - _T3 Repeatable · all_: Capture cryptographic configuration and network-exposed cryptography (SSH, TLS, IPsec, negotiated cipher characteristics) as well as managed (HSM/KMS/PKI) and hardware cryptography in the inventory.
    - _T3 Repeatable · software_: Identify cryptography within compiled, possibly third-party, applications as part of discovery.
    - _T3 Repeatable · software_: Maintain a CBOM for software applications, including those from external vendors, to understand built-in cryptographic capabilities (algorithms, libraries, supported keys) and keep it updated as applications change.
    - _T4 Adaptive · all_: Maintain the cryptographic inventory as a dynamic, trusted repository of cryptography-relevant data that enables users and systems to make decisions and act, exposing key metadata without exposing private keys.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Prioritise the transition to quantum-resistant cryptography, using the inventory to decide which assets to migrate and when.

## IETF RFC 4556
- **Source**: Public Key Cryptography for Initial Authentication in Kerberos (PKINIT)
- **URL**: https://www.rfc-editor.org/rfc/rfc4556
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · certificates_: Clients must require the KDC certificate to carry the id-pkinit-KPKdc EKU (with digitalSignature key usage) or the Kerberos TGS name as an id-pkinit-san SAN, unless otherwise known to be a KDC certificate.
- **Governance**:
    - _T2 Risk-Informed · keys_: Select Diffie-Hellman field sizes to provide sufficient cryptographic security; support MODP groups 2 and 14 (and 16 recommended), with exponents at least twice the bits of derived symmetric keys.
    - _T2 Risk-Informed · keys_: Where DH key reuse is permitted, the client DH nonce must be randomly chosen and at least as long as the longest supported symmetric key.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Ensure clients can supply certificate sets sufficient to build a certification path, exclude root CA certificates from that set, and ensure KDCs can perform path validation from supplied certificates.

## IETF RFC 5480
- **Source**: Elliptic Curve Cryptography Subject Public Key Information
- **URL**: https://www.rfc-editor.org/rfc/rfc5480
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · certificates_: Avoid combining keyAgreement/encipherOnly/decipherOnly with keyCertSign/cRLSign in CA certificates, so CA signing keys are not mixed with key-agreement usage.
    - _T2 Risk-Informed · certificates_: Adopt the recommended algorithm suites (e.g., 128-bit: 256-bit key, SHA-256, secp256r1; 192-bit: 384-bit key, SHA-384, secp384r1) to promote interoperability and avoid mismatched hash/key strengths.
    - _T3 Repeatable · certificates_: Do not issue or accept certificates using implicitCurve or specifiedCurve parameter encodings; restrict to named curves identified by OID.
    - _T3 Repeatable · certificates_: Enforce key usage constraints on certificates: id-ecDH/id-ecMQV keys must assert keyAgreement and must not assert digitalSignature, nonRepudiation, keyCertSign or cRLSign.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: CAs and relying parties must support the id-ecPublicKey algorithm identifier with namedCurve parameters, and must reject certificates in which ECParameters are absent.

## IETF RFC 5656
- **Source**: Elliptic Curve Algorithm Integration in the Secure Shell Transport Layer
- **URL**: https://www.rfc-editor.org/rfc/rfc5656
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Validate every received elliptic curve public key and fail the key exchange if validation fails; enforce this as a mandatory implementation control.
- **Governance**:
    - _T2 Risk-Informed · keys_: Verify that the host key presented by the SSH server actually belongs to that server (e.g., against a local host-key database) instead of accepting it unverified; this is a key-trust control for host keys.
    - _T2 Risk-Informed · software_: Ensure SSH ECC implementations support the mandatory ecdsa-sha2-* public key format and ECDH key exchange, and use SHA2-family hashes selected per curve size, as a baseline cryptographic configuration policy.

## IETF RFC 7662
- **Source**: OAuth 2.0 Token Introspection
- **URL**: https://www.rfc-editor.org/rfc/rfc7662
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · software_: Limit the token metadata (e.g., scopes) returned to each protected resource to the minimum necessary for its operation, applying per-resource response policy.
    - _T2 Risk-Informed · software_: Register cross-domain introspection response parameter names in the IANA registry through the defined review process to maintain controlled, documented extensions.
    - _T3 Repeatable · keys_: Enforce authorization on the introspection endpoint (client authentication or a separate access token) to prevent token scanning attacks.
    - _T3 Repeatable · software_: Protect the token introspection endpoint with a transport-layer security mechanism so token metadata exchanged between protected resource and authorization server is confidential and integrity-protected.
    - _T3 Repeatable · software_: Return only {"active": false} for inactive, unknown, or non-introspectable tokens, without disclosing the reason, to limit disclosure of authorization server state.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Decide caching of introspection responses deliberately, weighing performance benefits against loss of liveness of revocation/validity state used in authorization decisions.
    - _T3 Repeatable · keys_: Use the introspection endpoint to determine in real time whether tokens are active (not expired or revoked), enabling centralized token revocation and lifecycle checks by resource servers.

## IETF RFC 9701
- **Source**: JSON Web Token (JWT) Response for OAuth Token Introspection
- **URL**: https://www.rfc-editor.org/rfc/rfc9701
- **Requirement count**: 8
- **Governance**:
    - _T2 Risk-Informed · all_: Ensure a legal basis exists and is enforced throughout processing before releasing PII in introspection responses; retain scope of legal basis with the token.
    - _T3 Repeatable · all_: Determine per resource server whether it is the token audience and what data it may receive; deny data release otherwise (RS-specific policy).
    - _T3 Repeatable · keys_: Restrict resource server client credentials to only the calls required (e.g., introspection endpoint only), enforcing least privilege.
    - _T3 Repeatable · software_: Require authentication of all callers at the introspection endpoint and refuse unauthenticated requests to prevent downgrade to unsigned RFC 7662 behavior.
    - _T3 Repeatable · software_: Resource servers must verify the typ JWT header and required claims of access tokens and apply replay countermeasures to prevent cross-JWT confusion.
    - _T3 Repeatable · software_: Enforce per-RS policy on introspection response content, narrowing scopes to those relevant to the RS and omitting sub/exp claims to reduce misuse.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Maintain per-RS registry of client IDs, authentication methods, signing/encryption algorithm preferences, and encryption keys (jwks/jwks_uri) for introspection response protection.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Make signing and encryption algorithms configurable per resource server so algorithms can be changed per policy.

## IETF-RFC-7030-EST
- **Source**: Enrollment over Secure Transport (EST)
- **URL**: https://www.rfc-editor.org/rfc/rfc7030
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Submit proof-of-possession of private keys consistent with NIST SP 800-57 recommendations, using /fullcmc for key pairs that cannot generate signatures.
    - _T3 Repeatable · software_: Harden ASN.1 parsers (DER/BER) against malformed lengths and deep nesting that cause buffer overruns or stack overflows.
- **Governance**:
    - _T3 Repeatable · certificates_: Enforce certificate validation per RFC 5280 and require EST client certificates to conform to the RFC 5280 profile.
    - _T3 Repeatable · certificates_: Maintain separate Explicit and Implicit trust anchor databases and keep the distinction during client authentication so authorization decisions remain correct.
    - _T3 Repeatable · certificates_: Perform authorization checks on EST requests in addition to authentication, as specified in Section 3.7.
    - _T3 Repeatable · certificates_: Use TLS client certificate authentication as the preferred method for identifying EST clients; HTTP-based authentication is an allowed alternative.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Disable server-side key generation by default and have clients request it only with a compelling operational benefit; prefer client-generated keys.
    - _T3 Repeatable · certificates_: Support automated certificate renewal and rekeying through the EST /simplereenroll operation, authenticating the client with its existing certificate where suitable for the negotiated TLS cipher suite.
    - _T3 Repeatable · certificates_: Require re-enrollment requests to carry Subject and SubjectAltName identical to the certificate being renewed or rekeyed, unless a subject change is explicitly requested via ChangeSubjectName.
    - _T3 Repeatable · keys_: When server-side key generation is used, protect returned private keys with CMS encryption on top of TLS and avoid Implicit Trust Anchor databases.
    - _T3 Repeatable · keys_: Return server-generated private keys in a defined protected format (PKCS#8 over TLS, or CMS SignedData within EnvelopedData) and reject requests when the protection key identified by the client is unavailable.

## Meta-PQC-Migration-2026
- **Source**: Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways
- **URL**: https://engineering.fb.com/2026/04/16/security/post-quantum-cryptography-migration-at-meta-framework-lessons-and-takeaways/
- **Requirement count**: 12
- **Governance**:
    - _T2 Risk-Informed · all_: Define qualitative prioritization criteria classifying applications as high, moderate, or low priority by quantum-attack exposure to decide which use cases migrate first.
    - _T2 Risk-Informed · all_: Assess each use case against PQC Migration Levels (PQ-Unaware to PQ-Enabled) and set a minimum acceptable target level, at least PQ-Ready, aiming for PQ-Enabled.
    - _T2 Risk-Informed · all_: Identify external PQC dependencies (standards, hardware/HSM support, production implementations), engage unblocking actors, and align with hardware vendors on PQC migration plans.
    - _T2 Risk-Informed · keys_: Prefer ML-KEM768 and ML-DSA65 by default; grant exceptions for ML-KEM512 and ML-DSA44 only when performance is prohibitive for a use case.
    - _T2 Risk-Informed · libraries_: Adopt NIST-standardized PQC algorithms (ML-KEM, ML-DSA) and do not deviate from recommendations of reputable standardization bodies.
    - _T3 Repeatable · all_: Update internal cryptography guidelines to warn teams about quantum-vulnerable public-key cryptography and the need to migrate to PQC.
- **Inventory**:
    - _T2 Risk-Informed · software_: Supplement automated discovery with developer reporting of cryptographic intent for new architectures and legacy usage outside monitoring paths.
    - _T3 Repeatable · all_: Build a cryptographic inventory covering all cryptography usage across the organization as a prerequisite for company-wide PQC migration.
    - _T3 Repeatable · libraries_: Use automated discovery/monitoring tooling to map cryptographic primitives used in production, providing high-fidelity data on active usage within primary libraries.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Within high-priority use cases, migrate those without external dependencies immediately and defer those with unresolved external dependencies; treat hard-to-patch long-lifespan applications as higher risk.
    - _T3 Repeatable · all_: Prioritize a hybrid deployment (PQC layered on a classical primitive) during transition so the combined system is at least as secure as the current standard, rather than outright replacement.
- **Observability**:
    - _T3 Repeatable · software_: Create build-system/code-review rules that flag use of quantum-vulnerable APIs (e.g., RSA, ECDH) to prevent new designs from adopting them.

## Microsoft-Crypto-Inventory-CPM-2026
- **Source**: Building your cryptographic inventory: a customer strategy for cryptographic posture management
- **URL**: https://www.microsoft.com/en-us/security/blog/2026/04/16/building-your-cryptographic-inventory-a-customer-strategy-for-cryptographic-posture-management/
- **Requirement count**: 11
- **Governance**:
    - _T2 Risk-Informed · all_: Define clear ownership for each stage of the CPM lifecycle with consistent inputs and measurable outputs, since no single team or platform covers all signals.
    - _T2 Risk-Informed · all_: Maintain the cryptographic inventory to satisfy regulatory and policy obligations (e.g., DORA, OMB M-23-02, PCI DSS 4.0) and anticipate expanding global requirements.
    - _T2 Risk-Informed · all_: Define the scope of managed crypto assets and the decision-making process (risk assessment and prioritization) as part of a quantum-safe/CPM operating model.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Audit key vault instances to inventory secrets, keys, and certificates, and use secret scanning to detect exposed private keys in cloud IaaS/PaaS resources.
    - _T3 Repeatable · all_: Centralize inventory outputs in a single queryable view (e.g., SIEM or security data platform) and mature toward automation and governed data pipelines as the program scales.
    - _T3 Repeatable · all_: Identify encrypted network sessions and cipher suite usage (TLS/SSH) through network detection and traffic metadata capture as part of inventory collection.
    - _T3 Repeatable · certificates_: Deploy endpoint and vulnerability management agents to discover certificates and their algorithms, and review flagged vulnerable cryptographic libraries.
    - _T3 Repeatable · software_: Scan source code repositories for cryptographic algorithm usage (e.g., via CodeQL) and export results for central oversight.
    - _T4 Adaptive · all_: Treat inventory as a continuously running lifecycle rather than a one-time scan, tracking new commits, certificate renewals, configuration drift, and emerging vulnerabilities.
- **Lifecycle / CLM**:
    - _T4 Adaptive · all_: Maintain crypto-agility so that when an algorithm vulnerability or mandate emerges, affected assets and owners can be quickly identified and remediated.
- **Observability**:
    - _T3 Repeatable · all_: Compare the centralized inventory against defined policy baselines (key lengths, approved algorithms, certificate expiration thresholds) and prioritize by risk.

## Microsoft-QSP-Roadmap-2025
- **Source**: Microsoft Quantum Safe Program (QSP) — Product Roadmap to 2033
- **URL**: https://www.microsoft.com/en-us/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a program-level governance body with representatives from all major business groups, research and engineering divisions, and functions to lead the quantum-safe transition.
    - _T2 Risk-Informed · all_: Align the PQC migration roadmap with government requirements and timelines (OMB, CISA, NIST, NSA/CNSA 2.0) and monitor international quantum-safe initiatives to keep deadlines consistent.
    - _T3 Repeatable · software_: Update first-party and third-party services, the supply chain, and the broader ecosystem to be quantum safe and crypto-agile, not just internally owned systems.
- **Inventory**:
    - _T3 Repeatable · all_: Begin the quantum-safe transition with an enterprise-wide cryptographic inventory to assess and prioritize cryptographic asset risks before remediation work.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Set an explicit organizational migration target date ahead of the 2035 government deadline: complete transition by 2033, enable early PQC adoption by 2029, then make quantum-safe capabilities the default.
    - _T3 Repeatable · all_: Plan the PQC transition as a phased, modular program, choosing per service between direct PQC adoption and an interim hybrid classical+PQC approach based on performance constraints and risk profile.
    - _T3 Repeatable · all_: Migrate in prioritized order: foundational cryptographic components first, then core infrastructure services (authentication, key/secret management, signing), then all remaining services and endpoints.
    - _T3 Repeatable · all_: Build crypto-agility (the ability to easily change algorithms) into systems and use the migration to retire legacy technology and practices in favor of modern cryptographic architectures.
    - _T3 Repeatable · keys_: Prioritize quantum-safe key exchange (hybrid or pure PQC in TLS 1.3) to mitigate Harvest Now, Decrypt Later risk, ahead of other migrations.

## RFC 9019
- **Source**: A Firmware Update Architecture for Internet of Things (SUIT)
- **URL**: https://www.rfc-editor.org/rfc/rfc9019.html
- **Requirement count**: 13
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Protect trust anchor stores on devices against unauthorized insertion, deletion, and modification.
    - _T3 Repeatable · libraries_: Run cryptographic operations for update verification in a trusted execution environment, separate MCU hardware security module, or secure element rather than in the application code context.
    - _T3 Repeatable · software_: Authenticate and integrity-protect every firmware image so that maliciously modified images or images from unknown, untrusted sources are prevented from being flashed.
    - _T3 Repeatable · software_: Apply authentication and integrity protection to firmware images in every deployment; confidentiality protection of the image is optional.
- **Governance**:
    - _T2 Risk-Informed · keys_: Designate a Trust Provisioning Authority (typically the OEM/ODM) responsible for distributing trust anchors and authorization policies to devices and stakeholders, and for delegating rights.
    - _T2 Risk-Informed · software_: Ensure firmware updates addressing critical flaws remain obtainable after a product is discontinued or a vendor ceases business, and incentivise operators to require update mechanisms from vendors.
    - _T2 Risk-Informed · software_: Create incentives for device operators to use a firmware update mechanism and to require its integration from IoT device vendors.
    - _T2 Risk-Informed · software_: Separate duties so that firmware authors lack permission to upload images to the firmware server or initiate updates; authors provide images to device operators who authorize deployment.
- **Inventory**:
    - _T3 Repeatable · software_: Maintain per-device records of software and hardware characteristics (installed firmware version, available flash) via the status tracker to identify which devices qualify for an update.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Test firmware updates and offer recovery strategies so a failed update does not break device functionality in its operating environment.
    - _T2 Risk-Informed · software_: Make firmware updates available in a timely fashion, accounting for decision-making complexity, recertification needs, supply-chain length, and user consent.
    - _T3 Repeatable · software_: Provide automatic firmware updates for IoT devices without user involvement, since unattended updates are key to scalably fixing software vulnerabilities across deployed fleets.
- **Observability**:
    - _T3 Repeatable · software_: Use a status tracker to monitor update progress per device, report installed firmware versions and device characteristics, and collect diagnostics so operators know which devices are updated or pending.

## RFC-9901-SD-JWT-VC
- **Source**: RFC 9901 — Selective Disclosure for JWTs (SD-JWT)
- **URL**: https://www.rfc-editor.org/rfc/rfc9901
- **Requirement count**: 2
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Issuers should publish signature verification keys in a form supporting efficient, secure key rotation and revocation, e.g., at a predefined location in JWKS format.
    - _T3 Repeatable · software_: Verifiers must always verify the issuer-signed JWT signature and reject it if verification fails; issuers must sign the JWT.

## Radboud-MTC-Thesis-2025
- **Source**: Implementation and Analysis of Merkle Tree Certificates for Post-Quantum Secure Authentication in TLS
- **URL**: https://www.cs.ru.nl/masters-theses/2025/M_Pohl___Implementation_and_Analysis_of_Merkle_Tree_Certificates_for_Post-Quantum_Secure_Authentication_in_TLS.pdf
- **Requirement count**: 10
- **Governance**:
    - _T2 Risk-Informed · all_: Prioritise protecting connection confidentiality first via hybrid key exchange, because harvest-now-decrypt-later attacks threaten data already captured today, before addressing authentication migration.
    - _T2 Risk-Informed · all_: Plan the PQ transition early despite uncertainty about quantum timelines, because developing and gaining confidence in new cryptosystems takes substantial time.
    - _T3 Repeatable · certificates_: Design signing so that a CA must maintain a split view across an entire validity window, increasing the chance that misbehaviour (split-view attacks) is detected; use Transparency Services for oversight.
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Inventory the signature algorithms and key sizes in use across certificate chains (end-entity and root CAs) to understand the PQ migration impact, rather than relying only on aggregate market percentages.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Prioritise transition of server authentication to PQ-secure mechanisms, since X.509 certificates with naively substituted PQ signatures significantly increase size and slow connections; evaluate optimisations such as Merkle Tree Certificat…
    - _T3 Repeatable · certificates_: Choose PQ signature algorithms by weighing signature/key size, signing and verification CPU cost, and side-channel risk; avoid floating-point implementations where side-channel resistance is required.
    - _T3 Repeatable · certificates_: Secure the trust-parameter update channel for relying parties against quantum computers so the architecture is end-to-end PQ secure, and do not make it depend solely on MTCs since it bootstraps MTC.
    - _T3 Repeatable · certificates_: Plan for declining revocation-mechanism relevance (OCSP) by adopting CRL-based or aggregated revocation approaches such as CRLite as part of certificate lifecycle design.
    - _T3 Repeatable · certificates_: Define and maintain explicit CA parameters (issuer ID, signature scheme, CA public key, proof type, start time, batch duration, validity window size) on relying parties to enable deterministic certificate validity calculation.
- **Observability**:
    - _T3 Repeatable · certificates_: Run large-scale real-world experiments using telemetry collection to validate theoretical PQ certificate performance numbers in production deployments.

## draft-ietf-pquip-pqc-hsm-constrained-03
- **Source**: Adapting Constrained Devices for Post-Quantum Cryptography
- **URL**: https://www.ietf.org/archive/id/draft-ietf-pquip-pqc-hsm-constrained-11.txt
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Perform encryption and decryption of exported seeds and private keys entirely within cryptographic modules to reduce exposure and comply with established security standards.
    - _T3 Repeatable · keys_: When importing a private key containing both seed and expanded key, apply the consistency check defined for ML-DSA and ML-KEM private key formats.
- **Governance**:
    - _T2 Risk-Informed · all_: Vendors integrating third-party cryptographic modules should use this guidance to determine which capabilities and optimizations to require from suppliers.
    - _T2 Risk-Informed · keys_: Treat PQC seeds as Critical Security Parameters and protect them with the same level of protection as private keys, storing them within a cryptographic module.
    - _T2 Risk-Informed · keys_: Document and decide seed-only versus expanded-key storage trade-offs (storage vs performance) per module and algorithm, including SLH-DSA key-generation cost where devices generate their own keys.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Plan for backup and recovery of seeds and private keys; support secure backup mechanisms using encrypted storage and protections against unauthorized access.
    - _T3 Repeatable · keys_: Protect exported seeds/keys using a key-encryption key or secure channel with security strength at least matching the PQ security level of the exported key (e.g., AES-256 for Level 5).
    - _T3 Repeatable · keys_: Establish secure channels used to transfer private key material with a PQ-secure key exchange (hybrid ECDHE+ML-KEM or ML-KEM) to mitigate harvest-now-decrypt-later, and additionally use PQ authentication such as ML-DSA.
    - _T3 Repeatable · keys_: Use a strong symmetric key-wrap algorithm (e.g., AES Key Wrap with Padding) to encrypt seeds or private keys before export, and protect both the exported data and the wrapping key.
    - _T3 Repeatable · keys_: In seed-only designs, hold derived private keys only transiently and securely erase derived state once the operation completes.

## draft-ietf-uta-pqc-app-01
- **Source**: Post-Quantum Cryptography Recommendations for TLS-based Applications
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-uta-pqc-app/01/
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Applications relying on library defaults should review library documentation or perform interoperability testing to confirm PQC groups are negotiated as intended.
- **Governance**:
    - _T2 Risk-Informed · all_: Prioritise migration of confidentiality protection by assessing data security lifetime and Harvest-Now-Decrypt-Later exposure, with authentication migration planned as a longer-term risk.
    - _T2 Risk-Informed · keys_: Deployments with regulatory or compliance mandates requiring exclusively post-quantum cryptography may use pure PQC key exchange (ML-KEM-512/768/1024).
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Assess security lifetime of long-lived X.509 certificates (e.g., root CAs valid 20+ years, CRLs, OCSP/CRL signing certs) as a quantum-vulnerability window warranting scrutiny and planning.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Use a transitional approach in which established traditional algorithms are used alongside PQC primitives (hybrid key exchange, preferred over pure PQC) during migration.
    - _T3 Repeatable · libraries_: Upgrade TLS libraries to versions supporting TLS 1.3 and PQC key exchange extensions as a necessary first step in the transition.
    - _T3 Repeatable · software_: Applications vulnerable to Harvest Now, Decrypt Later attacks must migrate to (D)TLS 1.3 and adopt hybrid or pure PQC key exchange.
    - _T3 Repeatable · software_: Applications that explicitly configure protocol versions or cipher suites must update those settings so hybrid or pure PQC key exchange groups are enabled.

## draft-kwiatkowski-pquip-pqc-migration-00
- **Source**: Guidance for migration to Post-Quantum Cryptography
- **URL**: https://www.ietf.org/archive/id/draft-kwiatkowski-pquip-pqc-migration-00.html
- **Requirement count**: 13
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Where approved modules are required during the lengthy PQC certification period, combine already-certified traditional implementations with uncertified PQC algorithms in hybrid constructions (e.g., SP 800-56C concatenation).
- **Governance**:
    - _T2 Risk-Informed · all_: Define PQC migration objectives, starting with a documented assessment of organizational risk tolerance, which then shapes algorithm, protocol and implementation choices.
    - _T2 Risk-Informed · all_: Decide whether to migrate immediately or phase the timeline, based on migration duration, data shelf-life and projected quantum threat timeline, including harvest-now-decrypt-later exposure.
    - _T2 Risk-Informed · software_: Engage system vendors to confirm PQC migration needs, costs, and business impact, and determine whether software updates suffice or hardware replacement is required; budget for internal PQC development for custom systems.
    - _T3 Repeatable · all_: Treat PQC migration as a continuous program with ongoing threat monitoring and periodic reassessment, adapting as quantum technology evolves.
    - _T3 Repeatable · software_: Avoid runtime dynamic algorithm negotiation and excessive hybrid combinations; bind algorithm identifiers to the public key structure to limit downgrade risk and complexity.
- **Inventory**:
    - _T2 Risk-Informed · all_: Budget for and conduct discovery initiatives to build a comprehensive inventory of cryptographic use and assets and assess their PQC relevancy, including the tooling needed.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Assess long-lived constrained devices (ICS, vehicles, satellites, smart meters, smart cards) early, since upgrades may be impossible and require costly field updates or replacement.
    - _T3 Repeatable · certificates_: Update PKI (CAs, X.509 certificate formats, related processes) and plan for deploying new trust anchors to support PQC keys and certificates.
    - _T3 Repeatable · keys_: Design for cryptographic agility: embed algorithm identifiers in keys and support efficient key rollover so systems can undergo multiple cryptographic transitions without architectural change.
    - _T3 Repeatable · keys_: Account for key expiration and revocation in migration design; do not ignore key lifecycle.
    - _T3 Repeatable · keys_: Avoid reusing the same keypair across PQ/T hybrid and traditional signature modes to prevent downgrade attacks.
- **Observability**:
    - _T3 Repeatable · all_: Continuously monitor and evaluate migration progress and quantum capability developments, committing ongoing resources.
