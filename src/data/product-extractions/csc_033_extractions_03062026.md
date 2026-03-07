---
generated: 2026-03-06
collection: csc_033
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## Imperva WAF

- **Category**: Network Security Software
- **Product Name**: Imperva Web Application Firewall (WAF)
- **Product Brief**: Industry-leading application and API protection that stops attacks with near-zero false positives.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Data encryption and cryptographic solutions" generally but contains no specific references to Post-Quantum Cryptography, quantum-resistant algorithms, or PQC migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions SSL/TLS management and data encryption generally, but does not list specific primitives like ECDSA, RSA, or AES).
- **Key Management Model**: Enterprise SSL management with automated certificate renewal and domain validation; centralized observability. Specific key exchange protocols (e.g., IKE, PSK) are not stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based SaaS (Cloud WAF), Virtual Appliance/Gateway (WAF Gateway), Kubernetes-based hybrid (Elastic WAF).
- **Infrastructure Layer**: Application, Security Stack, Cloud, Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Public cloud, private cloud, hybrid cloud, on-premises environments; Kubernetes (for Elastic WAF).
- **Target Industries**: Government, Healthcare, Financial Services, Telecom & ISPs, Retail.
- **Regulatory Status**: Mentions compliance features for GDPR, PII, and PCI DSS 4.0; no specific regulatory licenses or charters stated.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text provided from Imperva_WAF.html and Imperva_WAF_doc2.html, but no specific URL string extracted).

---

## Cisco ASA (Adaptive Security Appliance)

- **Category**: Network Security Software
- **Product Name**: Cisco Secure Firewall ASA (Adaptive Security Appliance)
- **Product Brief**: A network security firewall product available as a series of appliances and software releases.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document contains no mention of Post-Quantum Cryptography, quantum-resistant algorithms, or PQC migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "IPsec", "TLS", "SAML", and "ACME Protocol" but does not list specific cryptographic primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Document mentions "Certificate Enrollment with ACME Protocol" and "Tunnel Groups" but does not describe the underlying key management architecture).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Firewall (Network Security Software)
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Commercial" status and Cisco ownership; specific license text not stated)
- **Latest Version**: 9.24(x) (Cisco Secure Firewall ASA), 7.24(x) (ASDM)
- **Release Date**: 2026-03-04
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cisco Secure Firewall ASA Series, Cisco ASA Device Package Software for ACI
- **Target Industries**: Enterprise (Inferred from "Cisco" and general firewall context; specific industries not explicitly listed)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit authoritative source URL string)

---

## Cisco Meraki MX (Cloud-Managed Firewall)

- **Category**: Network Security Software
- **Product Name**: Cisco Meraki MX (Cloud-Managed Firewall)
- **Product Brief**: Enterprise security & SD-WAN appliance designed for distributed deployments requiring remote administration.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "IPsec" and "Secure overlay services" but contains no explicit mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or quantum key distribution.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: IPsec (mentioned in context of Secure SD-WAN Overlay and VPN tunnels); TLS (implied by "Secure overlay services" and general web security context, but specific cipher suites not listed).
- **Key Management Model**: Not stated. The document mentions "IPsec VPN tunnels" and "AutoVPN architecture" but does not specify key exchange mechanisms (e.g., IKEv2 details), pre-shared keys, or certificate-based authentication specifics.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Security & SD-WAN appliance; Virtual appliance (vMX); Cloud-managed security.
- **Infrastructure Layer**: Network, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (implied by "Cisco Meraki" and commercial trial/subscription model mentioned).
- **Latest Version**: Not stated (Document mentions "MX19.1" in a guide title, but this refers to a specific guide version or legacy reference, not the current product firmware version).
- **Release Date**: 2023-09-20 (Date of the Miercom evaluation report; product release date not stated).
- **FIPS Validated**: Not stated
- **Primary Platforms**: AWS, Azure, Alibaba Cloud, GCP, Cisco NFVIS (for vMX); On-premises hardware appliances.
- **Target Industries**: Enterprise (Small branch to Data Center), SaaS application users.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://meraki.cisco.com

---

## Fortinet FortiGate (FortiOS)

- **Category**: Network Security Software
- **Product Name**: Fortinet FortiGate (FortiOS)
- **Product Brief**: Next-Generation Firewall protecting data, assets, and users across hybrid environments with AI-powered security.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Quantum key distribution (QKD) requiring FortiOS 7.4.2 and Post Quantum Cryptography (PQC) for IPsec VPNs requiring FortiOS 7.6.1. Includes NIST-approved algorithms and algorithm stacking to protect against quantum computing threats.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: Supports Quantum key distribution (QKD); specific IKE key exchange or certificate-based auth details not explicitly detailed beyond general IPsec VPN support.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Next-Generation Firewall (NGFW), Hybrid Mesh Firewall, Virtual appliance, Cloud-native, Physical appliance.
- **Infrastructure Layer**: Network, Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: FortiOS 7.6.1
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Physical appliances (FortiGate 3800G Series), Virtualized environments, Cloud environments, Data Centers, Campus, Branch.
- **Target Industries**: Enterprise, IT/OT, Manufacturing, Oil & Gas, Power Utilities, Health and Medical, Education, Financial Services, Retail, Hospitality, Service Providers.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: QKD support requires FortiOS 7.4.2; PQC for IPsec VPNs requires FortiOS 7.6.1; utilizes NIST-approved algorithms and algorithm stacking.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## pfSense Community Edition

- **Category**: Network Security Software
- **Product Name**: pfSense Community Edition
- **Product Brief**: A free network firewall distribution based on FreeBSD with a custom kernel and third-party packages.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Network firewall distribution based on FreeBSD with a custom kernel.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: FreeBSD operating system
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://pfsense.org/

---

## OPNsense

- **Category**: Network Security Software
- **Product Name**: OPNsense
- **Product Brief**: Open source firewall project providing GUI, API, and systems backend for network security.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Virtual appliance / Network security software (GUI and system management)
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Open Source
- **License**: BSD-2-Clause
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: FreeBSD (implied by "bsd" topic and "FreeBSD compatible package/ports origin")
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/opnsense/core

---
