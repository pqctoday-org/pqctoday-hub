---
generated: 2026-03-30
collection: csc_053
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## CyberArk Conjur

- **Category**: Secrets Management
- **Product Name**: CyberArk Conjur (also referred to as Secrets Manager, SaaS; Secrets Manager, Self-Hosted; Conjur Secrets Manager Open Source)
- **Product Brief**: Centrally manage secrets for all application identities across multi-cloud, on-prem, and containerized environments.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated (Text mentions "centrally rotate and manage credentials" but does not specify key hierarchy, root key protection, or escrow details).
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS and Self-Hosted; supports multi-cloud, on-prem, containerized, CI/CD pipeline, and DevOps environments.
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Open Source/Commercial
- **License**: Proprietary (for SaaS/Self-Hosted); Open Source (for Conjur Secrets Manager Open Source). Specific license names not stated.
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention
- **Primary Platforms**: Multi-cloud, on-prem, containerized environments, CI/CD pipelines; integrates with AWS Secrets Manager and Azure Key Vault via Secrets Hub.
- **Target Industries**: Automotive, Banking, Critical Infrastructure, Financial Services, Government, Healthcare, Insurance, Manufacturing, Managed Service Providers.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable (Not a blockchain protocol)
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains navigation links but no specific product URL is explicitly defined as the authoritative source).

---

## 1Password

- **Category**: Secrets Management
- **Product Name**: 1Password
- **Product Brief**: A passwordless authentication and secrets management platform utilizing passkeys stored in a vault.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Current passkeys rely on classic cryptography (ECDSA). The document states it is "highly likely, if not inevitable" that passkeys will evolve to be quantum safe as post-quantum security develops. No specific PQC algorithms are currently implemented in the described passkey system; migration is anticipated via user prompts to update passkeys when PQC becomes mainstream.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA (Elliptic Curve Digital Signature Algorithm), RSA (mentioned as context for quantum vulnerability)
- **Key Management Model**: Public key cryptography with private keys stored in the 1Password vault; keys are not shared with websites unless securely shared by the user.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer public key cryptography
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Passkeys v1.0 (referenced as released in 2022)
- **Release Date**: 2023-12-01 (Document publication date; product release dates mentioned are 2022 for passkeys and 2011 for first commercial quantum computer)
- **FIPS Validated**: Not stated
- **Primary Platforms**: macOS, Windows, iOS, Android, Browser, Linux, CLI
- **Target Industries**: Enterprise, Personal (implied by product categories like "Enterprise Password Manager" and "Personal Password Manager")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Evolution of passkeys to be quantum safe is anticipated; users may see prompts from services to update passkeys to PQ secure versions as PQC becomes mainstream. No specific algorithm choices or timelines provided.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA (current); Post-quantum schemes planned but not specified.
- **Authoritative Source URL**: Not stated

---

## OpenText Content Cloud

- **Category**: Secrets & Data Governance
- **Product Name**: OpenText Content Cloud
- **Product Brief**: Enterprise content management platform with AI-driven solutions for data governance, security, and collaboration.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans. It focuses on general cybersecurity, AI, and content management.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Public cloud, Private cloud, On-premises, Sovereign cloud
- **Target Industries**: Enterprise, Government, Life Sciences, Engineering, Supply Chain
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: OpenText home page (URL not explicitly provided in text)

---

## Hyland OnBase

- **Category**: Secrets & Data Governance
- **Product Name**: Hyland OnBase
- **Product Brief**: AI-enabled operational content management product orchestrating capture, governance, and workflow automation.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document contains no mention of Post-Quantum Cryptography, PQC algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Cloud (Hyland Cloud), Enterprise systems
- **Target Industries**: Healthcare, Financial Services, Government, Insurance, Education, Media & Entertainment, Manufacturing, CPG & Retail
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.hyland.com/products/onbase (inferred from context, but exact URL not explicitly listed in text; text mentions "View the OnBase demo" and "Connect with an OnBase expert")

---

## Forcepoint DLP

- **Category**: Secrets & Data Governance
- **Product Name**: Forcepoint DLP
- **Product Brief**: Industry-leading Data Loss Prevention with unified management across all channels.
- **PQC Support**: No
- **PQC Capability Description**: The provided documents do not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. The text focuses on DLP deployment, policy configuration, and data classification techniques.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Network
- **License Type**: Commercial
- **License**: Proprietary (Subscription Agreement)
- **Latest Version**: Not stated
- **Release Date**: 2025-09-25
- **FIPS Validated**: No
- **Primary Platforms**: Forcepoint Security Manager (FSM) Server, Forcepoint Protectors (ICAP, MTA, SPAN, WGC), Cloud-native platform
- **Target Industries**: Global businesses, Governments
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: www.forcepoint.com

---

## Netskope Intelligent DLP

- **Category**: Secrets & Data Governance
- **Product Name**: Netskope Intelligent DLP
- **Product Brief**: Cloud-native platform delivering converged security, networking, AI security, and data loss prevention services.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Data Loss Prevention," "AI Security," and "Zero Trust" but contains no explicit mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or PQC migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cloud-native converged platform
- **Infrastructure Layer**: Application, Security Stack, Cloud, Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No (Document mentions "FedRAMP High Authorization" but does not explicitly state FIPS 140-2 or 140-3 validation status for specific crypto modules).
- **Primary Platforms**: Cloud-native platform; supports SASE, SSE, and converged security services.
- **Target Industries**: Financial Services & Insurance, Healthcare and Life Sciences, High Technology, Legal, Manufacturing, Retail and Hospitality, Service Companies, Utilities, Public Sector and Education (including US Federal, State & Local, Higher Education, K12, Australian Government, UK Public Sector).
- **Regulatory Status**: FedRAMP High Authorization
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: Netskope_Intelligent_DLP.html)

---