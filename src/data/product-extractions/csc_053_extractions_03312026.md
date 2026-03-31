---
generated: 2026-03-31
collection: csc_053
documents_processed: 9
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

## Delinea Secret Server

- **Category**: Secrets Management
- **Product Name**: Delinea Secret Server
- **Product Brief**: Enterprise-grade Privileged Access Management vault to identify, secure, manage, monitor, and audit privileged accounts.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "encrypted vault" and "strong password management controls" but does not specify Post-Quantum Cryptography algorithms or support.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "Encrypted vault" and "multi-factor authentication" but does not list specific cryptographic primitives like ECDSA, RSA, etc.)
- **Key Management Model**: Not stated (Document mentions "encrypted vault", "centralized control", and "Resilient Secrets" for replication, but does not describe key hierarchy, root key protection, or escrow models).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized; Hybrid multi-cloud infrastructure support mentioned; Agent-based (Credential Manager mobile/browser) and API-based.
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Contact us for pricing" and copyright notice; specific license name not stated).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated (Document mentions "FedRAMP Solutions" in navigation but does not explicitly state FIPS 140-2/140-3 validation status for Secret Server).
- **Primary Platforms**: Hybrid multi-cloud infrastructure; Mobile (iOS/Android implied by "mobile app"); Browser (via extension); Windows/Linux/macOS not explicitly listed.
- **Target Industries**: Enterprise, Government (implied by FedRAMP and non-Government customer review), IT Admin, Workforce, Machine, AI, Developer.
- **Regulatory Status**: FedRAMP Solutions mentioned in navigation; no specific charter or registration details provided for the product itself.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit base URL string).

---

## HashiCorp Boundary

- **Category**: Secrets Management
- **Product Name**: HashiCorp Boundary
- **Product Brief**: An identity-aware proxy providing secure, just-in-time network access to hosts and critical systems.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any migration plans for PQC. It only mentions the use of KMS keys and encryption for secrets.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "KMS keys", "encryption", and "key derivation" but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: External KMS dependency; uses key derivation to avoid key sprawl; supports cloud KMS or Vault's Transit Secrets Engine.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based (Controller and Workers); Agentless on end hosts; supports SaaS, on-prem, secure enclaves, and clouds.
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Open Source/Commercial (Repository license listed as NOASSERTION, but product is part of HashiCorp ecosystem).
- **License**: NOASSERTION
- **Latest Version**: 0.10 (mentioned in context of release branches)
- **Release Date**: Not stated (Last Updated: 2026-03-06T16:27:45Z refers to repository update, not product release).
- **FIPS Validated**: No
- **Primary Platforms**: Clouds, on-prem, secure enclaves; requires SQL database (PostgreSQL) and KMS.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://developer.hashicorp.com/boundary/docs

---

## 1Password

- **Category**: Secrets Management
- **Product Name**: 1Password
- **Product Brief**: A passwordless authentication and secrets management platform using passkeys stored in a vault.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Current passkeys rely on ECDSA which is vulnerable to quantum computers; however, the document states it is "highly likely, if not inevitable" that passkeys will evolve to be quantum safe as post-quantum security develops. No specific PQC algorithms are currently implemented in the described v1.0 passkeys.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA (Elliptic Curve Digital Signature Algorithm)
- **Key Management Model**: Public key cryptography with private keys stored in a 1Password vault; keys never leave the vault unless securely shared.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Vault-based public key cryptography
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Passkeys v1.0 (mentioned as released in 2022)
- **Release Date**: 2023-12-01 (Document date); Passkeys released to public in 2022
- **FIPS Validated**: Not stated
- **Primary Platforms**: macOS, Windows, iOS, Android, Browser, Linux, CLI
- **Target Industries**: Enterprise, General Consumer (implied by "humans and AI agents" and general security context)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Evolution of passkeys to be quantum safe is anticipated as post-quantum security develops; users may see prompts to update passkeys to PQ secure versions in the future. No specific algorithm choices or timelines provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (Current); Quantum-safe schemes planned but unspecified
- **Authoritative Source URL**: Not stated

---

## Bitwarden

- **Category**: Secrets Management
- **Product Name**: Bitwarden
- **Product Brief**: Open source security solutions for individuals, teams, and business organizations including Password Manager, Secrets Manager, and passkey innovations.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "End-to-end encrypted" and "Zero-knowledge encrypted" but does not specify any Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions encryption types but lists no specific primitives like ECDSA, Ed25519, etc.)
- **Key Management Model**: Zero-knowledge encrypted; Option to self-host; Key connector agent mentioned for storing/providing keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Open source; End-to-end encrypted; Zero-knowledge encrypted; Self-host option available.
- **Infrastructure Layer**: Application, Security Stack, Cloud (Self-host/Docker)
- **License Type**: Open Source/Commercial
- **License**: GPL-3.0 (mentioned for specific repositories like renovate-config, self-host, ios, splunk); Commercial implied for business features.
- **Latest Version**: Not stated
- **Release Date**: Not stated (Repository update dates listed as Mar 26, 2026 and Mar 25, 2026)
- **FIPS Validated**: No
- **Primary Platforms**: Web, Browser extension, Desktop, CLI, Android, iOS, Docker, Kubernetes
- **Target Industries**: Enterprises, Small and medium teams, Startups, Nonprofits, Healthcare, Financial services, Manufacturing, Government
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://bitwarden.com

---

## OpenText Content Cloud

- **Category**: Secrets & Data Governance
- **Product Name**: OpenText Content Cloud
- **Product Brief**: Enterprise content management platform with AI-driven solutions for data governance, security, and automation.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Built-in security," "Cybersecurity Aviator," and "Data Privacy & Protection" but contains no explicit references to Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Public cloud, Private cloud, On-premises, Sovereign cloud
- **Target Industries**: Enterprise, Government, Life Sciences, Engineering, Finance (Supply Chain)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: OpenText home page (URL not explicitly provided in text)

---

## Hyland OnBase

- **Category**: Secrets & Data Governance
- **Product Name**: Hyland OnBase
- **Product Brief**: AI-enabled operational content management product orchestrating capture, governance, and workflow automation.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Security and Compliance" and "enhanced security" but contains no explicit mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary (implied by "Commercial" nature and trademark notices; specific license text not stated)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud, Enterprise systems (integrations mentioned), Web-based interface
- **Target Industries**: Healthcare, Financial Services, Government, Insurance, Education, Media & Entertainment, Manufacturing, CPG & Retail
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source file name provided: Hyland_OnBase.html)

---

## Forcepoint DLP

- **Category**: Secrets & Data Governance
- **Product Name**: Forcepoint DLP
- **Product Brief**: Industry-leading Data Loss Prevention with unified management across all channels.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document discusses Data Loss Prevention, classification, and policy enforcement but contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack, Network, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Subscription Agreement)
- **Latest Version**: Unknown
- **Release Date**: 2025-09-25
- **FIPS Validated**: Not stated
- **Primary Platforms**: Forcepoint Security Manager (FSM) Server, Forcepoint Protectors (ICAP, MTA, SPAN, WGC), Cloud-native platform
- **Target Industries**: Global businesses, Governments
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: www.forcepoint.com

---

## Netskope Intelligent DLP

- **Category**: Secrets & Data Governance
- **Product Name**: Netskope Intelligent DLP / Netskope One
- **Product Brief**: A cloud-native converged security and networking platform delivering SASE, AI security, and data loss prevention services.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Post-Quantum Cryptography" zero times; it focuses on SASE, DLP, ZTNA, and AI Security without referencing PQC algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native converged platform (Netskope One) powered by SkopeAI, Zero Trust Engine, and NewEdge Network.
- **Infrastructure Layer**: Security Stack, Cloud, Network
- **License Type**: Commercial
- **License**: Proprietary (implied by "Commercial" nature and lack of open source mention; specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions "FedRAMP High Authorization" but does not explicitly state FIPS 140-2 or 140-3 validation status).
- **Primary Platforms**: Cloud-native platform; supports hybrid work, cloud applications, and private applications.
- **Target Industries**: Financial Services & Insurance, Healthcare and Life Sciences, High Technology, Legal, Manufacturing, Retail and Hospitality, Service Companies, Utilities, Public Sector (US Federal, State & Local, Higher Education, K12, Australian Government, UK Public Sector).
- **Regulatory Status**: FedRAMP High Authorization.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: Netskope_Intelligent_DLP.html)

---
