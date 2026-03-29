#!/usr/bin/env python3
"""
Generate vendor assignments for migrate software catalog.

Reads:
  - src/data/quantum_safe_cryptographic_software_reference_*.csv (migrate catalog)
  - src/data/vendors_*.csv (vendor reference table)
  - src/data/migrate_certification_xref_*.csv (for cert_vendor cross-check)

Writes:
  - src/data/quantum_safe_cryptographic_software_reference_MMDDYYYY.csv (with vendor_id column)

Usage:
  python3 scripts/generate-vendor-catalog.py
"""

import csv
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

ROOT = Path(__file__).resolve().parent.parent
MIGRATE_DIR = ROOT / "src" / "data"
TODAY = datetime.now().strftime("%m%d%Y")
OUTPUT = MIGRATE_DIR / f"quantum_safe_cryptographic_software_reference_{TODAY}.csv"

# ── Vendor ID mapping by product name ────────────────────────────────────────
# Each product name maps to a vendor_id from vendors_03262026.csv
# Maintain alphabetically by product name for easy editing
PRODUCT_VENDOR_MAP: Dict[str, str] = {
    # ── 01 Quantum ──────────────────────────────────────────────────────────
    "01 Quantum IronCAP": "VND-052",

    # ── Algorithms (community/research) ──────────────────────────────────────
    "Algorithm Research Projects": "",  # Community research
    "Algorand": "VND-092",  # Algorand Foundation
    "Android 16": "VND-018",  # Google/Android
    "Apache Camel": "VND-046",  # Apache
    "Apache Commons": "VND-046",  # Apache
    "Apache Kafka": "VND-046",  # Apache
    "Apache Tomcat": "VND-046",  # Apache
    "Apache Traffic Server": "VND-046",  # Apache
    "Aptos": "VND-097",  # Aptos Foundation
    "Arista EOS (Extensible Operating System)": "VND-003",  # Arista
    "ARM Cortex-M": "VND-028",  # NXP (common ARM licensee)
    "Atalla AT1000e": "VND-042",  # Utimaco (Atalla acquired by Utimaco)
    "Avalanche": "",  # Blockchain
    "Azure DevOps": "VND-027",  # Microsoft
    "Azure Dedicated HSM (Marvell LiquidSecurity)": "VND-026",  # Marvell

    # ── Bouncy Castle ──────────────────────────────────────────────────────
    "Bouncy Castle C# .NET": "VND-025",  # Legion of Bouncy Castle
    "Bouncy Castle Java": "VND-025",  # Legion of Bouncy Castle
    "Bouncy Castle Java LTS": "VND-025",  # Legion of Bouncy Castle

    # ── Botan ───────────────────────────────────────────────────────────────
    "Botan": "VND-069",  # Botan Project

    # ── BoringSSL (Google) ──────────────────────────────────────────────────
    "BoringSSL": "VND-018",  # Google

    # ── Blockchain/DLT ──────────────────────────────────────────────────────
    "Bitcoin Core": "VND-088",  # Bitcoin Project
    "BitGo": "VND-102",  # BitGo Inc.
    "BTQ Bitcoin Quantum": "VND-089",  # BTQ Technologies
    "Cardano": "VND-093",  # Cardano Foundation
    "Cosmos/Tendermint": "VND-096",  # Interchain Foundation
    "Ethereum (Geth)": "VND-090",  # Ethereum Foundation
    "IOTA": "VND-094",  # IOTA Foundation
    "Polkadot/Substrate": "VND-095",  # Web3 Foundation
    "Project Eleven Solana PQC": "VND-091",  # Solana Foundation
    "R3 Corda": "VND-101",  # R3 Ltd.
    "Solana": "VND-091",  # Solana Foundation
    "Sui": "VND-099",  # Sui Foundation

    # ── Broadcom ────────────────────────────────────────────────────────────
    "Broadcom Avi (NSX ALB)": "VND-127",  # Broadcom Inc.

    # ── CI/CD Platforms ─────────────────────────────────────────────────────
    "CircleCI": "VND-124",  # CircleCI LLC
    "GitHub Actions": "VND-122",  # GitHub Inc. (Microsoft)
    "GitLab CI/CD": "VND-121",  # GitLab Inc.
    "Jenkins": "VND-123",  # Jenkins / CloudBees

    # ── Cisco ───────────────────────────────────────────────────────────────
    "Cisco ASA (Adaptive Security Appliance)": "VND-008",  # Cisco
    "Cisco IOS XE PQC": "VND-008",  # Cisco
    "Cisco Meraki MX (Cloud-Managed Firewall)": "VND-008",  # Cisco
    "Cisco Secure Client (AnyConnect)": "VND-008",  # Cisco

    # ── Citrix ──────────────────────────────────────────────────────────────
    "Citrix Virtual Apps and Desktops": "VND-009",  # Citrix

    # ── Cloudflare ──────────────────────────────────────────────────────────
    "Cloudflare": "VND-057",  # Cloudflare

    # ── Coinbase ────────────────────────────────────────────────────────────
    "Coinbase Custody": "VND-105",  # Coinbase Inc.
    "Copper.co": "VND-109",  # Copper Technologies Ltd.

    # ── Crypto4A ────────────────────────────────────────────────────────────
    "Crypto4A QxHSM": "VND-010",  # Crypto4A

    # ── Crypto++ ────────────────────────────────────────────────────────────
    "Crypto++ (cryptopp)": "VND-050",  # RustCrypto / community (closest open source org)

    # ── CryptoNext ──────────────────────────────────────────────────────────
    "CryptoNext COMPASS Network Probe": "VND-011",  # CryptoNext

    # ── Database platforms ──────────────────────────────────────────────────
    "Eclipse Jetty": "VND-051",  # Eclipse Foundation
    "MariaDB Server": "VND-074",  # MariaDB Foundation
    "MySQL Community Server": "VND-029",  # Oracle Corporation
    "PostgreSQL": "VND-075",  # PostgreSQL Global Development Group
    "Redis": "VND-076",  # Redis Community
    "SQL Server TDE/Always Encrypted": "VND-027",  # Microsoft

    # ── DigiCert ────────────────────────────────────────────────────────────
    "DigiCert SigningHub": "VND-012",  # DigiCert
    "DigiCert Software Trust Manager": "VND-012",  # DigiCert
    "DigiCert Trust Lifecycle Manager": "VND-012",  # DigiCert

    # ── Dragos / OT Security ────────────────────────────────────────────────
    "Dragos Platform": "VND-128",  # Dragos Inc.

    # ── Entrust ─────────────────────────────────────────────────────────────
    "Entrust KeyControl": "VND-013",  # Entrust
    "Entrust nShield": "VND-013",  # Entrust
    "Entrust PKI": "VND-013",  # Entrust
    "Entrust Signing Automation": "VND-013",  # Entrust

    # ── evolutionQ ──────────────────────────────────────────────────────────
    "evolutionQ BasejumpQDN": "VND-055",  # evolutionQ
    "evolutionQ BasejumpSKI": "VND-055",  # evolutionQ

    # ── Fortanix ────────────────────────────────────────────────────────────
    "Fortanix Data Security Manager": "VND-015",  # Fortanix

    # ── Fortinet ────────────────────────────────────────────────────────────
    "Fortinet FortiGate-Rugged": "VND-016",  # Fortinet
    "Fortinet FortiGate (FortiOS)": "VND-016",  # Fortinet
    "Fortinet FortiOS": "VND-016",  # Fortinet

    # ── Futurex ─────────────────────────────────────────────────────────────
    "Futurex Cloud": "VND-017",  # Futurex
    "Futurex CryptoHub": "VND-017",  # Futurex
    "Futurex Vectera Plus": "VND-017",  # Futurex

    # ── Google ──────────────────────────────────────────────────────────────
    "Android 16": "VND-018",  # Google
    "Gmail / Google Workspace": "VND-018",  # Google
    "Go stdlib crypto/mlkem": "VND-018",  # Google
    "Google ALTS": "VND-018",  # Google
    "Google Chrome": "VND-018",  # Google
    "Google Cloud HSM": "VND-018",  # Google
    "Google Cloud KMS": "VND-018",  # Google
    "Google Cloud KMS (Cloud Gateway)": "VND-018",  # Google
    "Google OpenTitan": "VND-018",  # Google
    "Google Tink": "VND-018",  # Google
    "Google Workspace Identity": "VND-018",  # Google

    # ── HashiCorp ───────────────────────────────────────────────────────────
    "HashiCorp Consul Connect (Service Mesh)": "VND-058",  # HashiCorp
    "HashiCorp Vault": "VND-058",  # HashiCorp

    # ── HashiCorp-IBM ───────────────────────────────────────────────────────
    "HashiCorp (IBM)": "VND-058",  # HashiCorp (IBM partnership)

    # ── Hitachi ─────────────────────────────────────────────────────────────
    "Hitachi DoMobile": "VND-135",  # Hitachi Ltd.

    # ── IBM ─────────────────────────────────────────────────────────────────
    "IBM Cloud HSM (Utimaco)": "VND-042",  # Utimaco (IBM partner)
    "IBM Guardium Key Lifecycle Manager": "VND-019",  # IBM
    "IBM Guardium Quantum Safe": "VND-019",  # IBM
    "IBM Quantum Safe Toolkit": "VND-019",  # IBM
    "IBM Security Guardium Data Protection": "VND-019",  # IBM

    # ── IDEMIA ──────────────────────────────────────────────────────────────
    "IDEMIA Digital Identity Platform": "VND-020",  # IDEMIA
    "IDEMIA PQC Secure Element": "VND-020",  # IDEMIA

    # ── Intel ───────────────────────────────────────────────────────────────
    "Intel Platform Trust Technology (PTT)": "VND-022",  # Intel
    "Intel TDX (Trust Domain Extensions)": "VND-022",  # Intel

    # ── ISARA ───────────────────────────────────────────────────────────────
    "ISARA Advance": "VND-053",  # ISARA

    # ── Istio ───────────────────────────────────────────────────────────────
    "Istio Service Mesh": "VND-072",  # CNCF / Kubernetes

    # ── Juniper ─────────────────────────────────────────────────────────────
    "Juniper Junos OS": "VND-023",  # Juniper
    "Juniper SRX Series Firewalls": "VND-023",  # Juniper

    # ── Keyfactor ───────────────────────────────────────────────────────────
    "Keyfactor EJBCA": "VND-024",  # Keyfactor

    # ── Kubernetes ──────────────────────────────────────────────────────────
    "Kubernetes": "VND-072",  # CNCF / Kubernetes

    # ── Ledger ──────────────────────────────────────────────────────────────
    "Ledger Enterprise": "VND-113",  # Ledger SAS

    # ── Let's Encrypt ───────────────────────────────────────────────────────
    "Let's Encrypt": "VND-064",  # Internet Security Research Group (ISRG)

    # ── Linkerd ─────────────────────────────────────────────────────────────
    "Linkerd": "VND-072",  # CNCF / Kubernetes

    # ── libssh ──────────────────────────────────────────────────────────────
    "libssh": "VND-071",  # libssh Project

    # ── Marvell ─────────────────────────────────────────────────────────────
    "Marvell LiquidSecurity 2": "VND-026",  # Marvell

    # ── Mavenir ─────────────────────────────────────────────────────────────
    "Mavenir Cloud RAN": "VND-133",  # Mavenir Systems Inc.

    # ── Metaco ──────────────────────────────────────────────────────────────
    "Metaco (Ripple)": "VND-112",  # Ripple Labs Inc.

    # ── Microsoft ───────────────────────────────────────────────────────────
    ".NET System.Security.Cryptography": "VND-027",  # Microsoft
    "Azure DevOps": "VND-027",  # Microsoft
    "Azure Key Vault": "VND-027",  # Microsoft
    "BitLocker (Windows)": "VND-027",  # Microsoft
    "FileVault (macOS)": "VND-002",  # Apple (macOS-specific)
    "iOS 26 / macOS 26": "VND-002",  # Apple
    "Microsoft AD CS": "VND-027",  # Microsoft
    "Microsoft Entra External ID": "VND-027",  # Microsoft
    "Microsoft Entra ID": "VND-027",  # Microsoft
    "Microsoft Entra Verified ID": "VND-027",  # Microsoft
    "Microsoft Outlook S/MIME": "VND-027",  # Microsoft
    "Microsoft SignTool": "VND-027",  # Microsoft
    "Microsoft SymCrypt": "VND-027",  # Microsoft
    "SQL Server TDE/Always Encrypted": "VND-027",  # Microsoft
    "Windows Secure Boot": "VND-027",  # Microsoft
    "Windows Server 2025": "VND-027",  # Microsoft

    # ── Apple ───────────────────────────────────────────────────────────────
    "Apple PQ3 / CoreCrypto": "VND-002",  # Apple
    "Apple codesign": "VND-002",  # Apple
    "Apple Safari": "VND-002",  # Apple

    # ── NEC ─────────────────────────────────────────────────────────────────
    "NEC 5G Core": "",  # NEC Corporation (not yet in vendor list)

    # ── Nozomi ─────────────────────────────────────────────────────────────
    "Nozomi Networks Guardian": "VND-130",  # Nozomi Networks Inc.

    # ── NXP ─────────────────────────────────────────────────────────────────
    "NXP JCOP 4.5 P71D600": "VND-028",  # NXP
    "NXP SE050 Secure Element": "VND-028",  # NXP

    # ── OAuth / OIDC ────────────────────────────────────────────────────────
    "OAuth 2.0 / OpenID Connect (OIDC)": "VND-081",  # IETF
    "SAML 2.0": "VND-082",  # OASIS Open

    # ── OQS / OpenSSL ───────────────────────────────────────────────────────
    "OQS-OpenSSL Provider (liboqs-provider)": "VND-049",  # OpenSSL
    "OpenSSL": "VND-049",  # OpenSSL Corporation

    # ── OpenVPN ─────────────────────────────────────────────────────────────
    "OpenVPN": "VND-067",  # OpenVPN Inc.

    # ── Oracle ──────────────────────────────────────────────────────────────
    "Oracle AI Database 26ai": "VND-029",  # Oracle
    "Oracle Key Vault": "VND-029",  # Oracle
    "Oracle TDE": "VND-029",  # Oracle

    # ── Palo Alto Networks ──────────────────────────────────────────────────
    "Palo Alto GlobalProtect": "VND-031",  # Palo Alto Networks
    "Palo Alto PAN-OS": "VND-031",  # Palo Alto Networks

    # ── Payara ──────────────────────────────────────────────────────────────
    "Payara Server": "VND-073",  # Payara Foundation

    # ── PQC Software ────────────────────────────────────────────────────────
    "PQC-LEO": "VND-141",  # PQC-LEO Authors
    "PQCryptoLib-Core": "VND-030",  # PQShield
    "PQMicroLib-Core": "VND-030",  # PQShield
    "PQShield PQSDK": "VND-030",  # PQShield
    "pqcrypto": "VND-080",  # NIST PQC Project (reference implementations)
    "pqcscan": "VND-000",  # No designated entity
    "pqc-flow": "VND-000",  # No designated entity

    # ── PyCryptodome ────────────────────────────────────────────────────────
    "PyCryptodome": "VND-070",  # PyCryptodome Team

    # ── Qrypt ───────────────────────────────────────────────────────────────
    "Qrypt BLAST SDK": "VND-139",  # Qrypt Inc.
    "QRL": "VND-100",  # QRL Foundation

    # ── QuSecure ────────────────────────────────────────────────────────────
    "QuSecure QuProtect R3": "VND-054",  # QuSecure

    # ── Red Hat ─────────────────────────────────────────────────────────────
    "Red Hat Enterprise Linux 9": "VND-032",  # Red Hat

    # ── RustCrypto ──────────────────────────────────────────────────────────
    "RustCrypto ml-dsa": "VND-050",  # RustCrypto
    "RustCrypto ml-kem": "VND-050",  # RustCrypto
    "RustCrypto slh-dsa": "VND-050",  # RustCrypto

    # ── SafeLogic ───────────────────────────────────────────────────────────
    "SafeLogic CryptoComply": "VND-034",  # SafeLogic

    # ── SAP ─────────────────────────────────────────────────────────────────
    "SAP Cryptographic Library": "VND-033",  # SAP

    # ── SandboxAQ ───────────────────────────────────────────────────────────
    "SandboxAQ AQtive Guard": "VND-036",  # SandboxAQ

    # ── Samsung ─────────────────────────────────────────────────────────────
    "Samsung Knox Quantum-Safe": "VND-035",  # Samsung
    "Samsung Networks 5G Core": "VND-035",  # Samsung
    "Samsung S3SSE2A eSE": "VND-035",  # Samsung

    # ── Securosys ───────────────────────────────────────────────────────────
    "Securosys CloudHSM": "VND-037",  # Securosys
    "Securosys Primus HSM": "VND-037",  # Securosys

    # ── SEALSQ ─────────────────────────────────────────────────────────────
    "SEALSQ Quantum Shield": "VND-056",  # SEALSQ

    # ── Senetas ─────────────────────────────────────────────────────────────
    "Senetas CN7000 Series": "VND-038",  # Senetas

    # ── Siemens ─────────────────────────────────────────────────────────────
    "Siemens SINEMA Remote Connect": "VND-126",  # Siemens AG

    # ── STMicroelectronics ──────────────────────────────────────────────────
    "STMicroelectronics ST33G1M2 TPM": "VND-039",  # STMicroelectronics

    # ── SUSE ────────────────────────────────────────────────────────────────
    "SUSE Linux Enterprise Server (SLES)": "VND-040",  # SUSE

    # ── Telegram ────────────────────────────────────────────────────────────
    "Telegram": "VND-117",  # Telegram FZ-LLC

    # ── Thales ──────────────────────────────────────────────────────────────
    "Thales 5G Quantum-Safe SIM": "VND-041",  # Thales
    "Thales CipherTrust Cloud Key Manager": "VND-041",  # Thales
    "Thales CipherTrust Data Discovery and Classification": "VND-041",  # Thales
    "Thales CipherTrust Data Security Platform": "VND-041",  # Thales
    "Thales CipherTrust Manager": "VND-041",  # Thales
    "Thales High Speed Encryptor (HSE)": "VND-041",  # Thales
    "Thales Luna Cloud HSM (DPoD)": "VND-041",  # Thales
    "Thales Luna HSM": "VND-041",  # Thales
    "Thales Luna T-Series HSM": "VND-041",  # Thales
    "Thales MISTRAL Encryptor": "VND-041",  # Thales
    "Thales MultiApp 5.2 Premium PQC": "VND-041",  # Thales
    "Thales payShield 10K": "VND-041",  # Thales

    # ── Ubuntu ──────────────────────────────────────────────────────────────
    "Ubuntu 24.04 LTS": "VND-006",  # Canonical

    # ── Utimaco ─────────────────────────────────────────────────────────────
    "Atalla AT1000e": "VND-042",  # Utimaco
    "Utimaco Athos": "VND-042",  # Utimaco
    "Utimaco ESKM": "VND-042",  # Utimaco
    "Utimaco SecurityServer": "VND-042",  # Utimaco

    # ── VIAVI ───────────────────────────────────────────────────────────────
    "VIAVI Observer Analyzer": "VND-131",  # VIAVI Solutions Inc.
    "VIAVI TeraVM Security Test": "VND-131",  # VIAVI Solutions Inc.

    # ── Wind River ──────────────────────────────────────────────────────────
    "Wind River VxWorks": "VND-043",  # Wind River

    # ── WildFly / JBoss ────────────────────────────────────────────────────
    "WildFly (JBoss)": "VND-046",  # RedHat (part of JBoss)

    # ── WireGuard ───────────────────────────────────────────────────────────
    "WireGuard": "VND-066",  # WireGuard Project

    # ── wolfSSL ─────────────────────────────────────────────────────────────
    "wolfBoot": "VND-045",  # wolfSSL
    "wolfSSL": "VND-045",  # wolfSSL

    # ── Yubico ──────────────────────────────────────────────────────────────
    "Yubico YubiHSM 2": "VND-044",  # Yubico

    # ── AMD ─────────────────────────────────────────────────────────────────
    "AMD SEV-SNP (Secure Encrypted Virtualization)": "VND-148",  # AMD

    # ── ARM ─────────────────────────────────────────────────────────────────
    "ARM Confidential Compute Architecture (CCA)": "VND-149",  # ARM
    "ARM TrustZone": "VND-149",  # ARM
    "ARM Trusted Firmware (TF-A)": "VND-149",  # ARM

    # ── Qualcomm ─────────────────────────────────────────────────────────────
    "Qualcomm Snapdragon Trusted Execution Environment": "VND-150",  # Qualcomm

    # ── Microchip ───────────────────────────────────────────────────────────
    "Microchip ATECC608B": "VND-151",  # Microchip Technology

    # ── Infineon (already VND-021) ───────────────────────────────────────────
    "Infineon OPTIGA TPM SLB 9672": "VND-021",  # Infineon
    "Infineon TEGRION SLC27 PQC": "VND-021",  # Infineon

    # ── Adtran Networks (formerly ADVA) ──────────────────────────────────────
    "Adva Network Security FSP 3000 S-Flex": "VND-152",  # Adtran Networks

    # ── Ciena ───────────────────────────────────────────────────────────────
    "Ciena WaveLogic 6 Extreme": "VND-153",  # Ciena

    # ── Ericsson ────────────────────────────────────────────────────────────
    "Ericsson Quantum-Safe 5G": "VND-154",  # Ericsson

    # ── Nokia ───────────────────────────────────────────────────────────────
    "Nokia Quantum-Safe Networks": "VND-155",  # Nokia

    # ── Quantum Bridge ──────────────────────────────────────────────────────
    "Quantum Bridge Subsea QKD": "VND-156",  # Quantum Bridge Technologies

    # ── ID Quantique ────────────────────────────────────────────────────────
    "ID Quantique Cerberis XGR QKD": "VND-157",  # ID Quantique
    "ID Quantique Quantis QRNG": "VND-157",  # ID Quantique

    # ── Toshiba ─────────────────────────────────────────────────────────────
    "Toshiba QKD System": "VND-158",  # Toshiba

    # ── G+D (Giesecke+Devrient) ─────────────────────────────────────────────
    "G+D Quantum-Safe SIM Platform": "VND-159",  # G+D

    # ── BeyondTrust ─────────────────────────────────────────────────────────
    "BeyondTrust Privilege Management": "VND-160",  # BeyondTrust

    # ── CrowdStrike ─────────────────────────────────────────────────────────
    "CrowdStrike Falcon": "VND-161",  # CrowdStrike

    # ── CyberArk ────────────────────────────────────────────────────────────
    "CyberArk Conjur": "VND-162",  # CyberArk

    # ── Imperva ─────────────────────────────────────────────────────────────
    "Imperva WAF": "VND-163",  # Imperva

    # ── Qualys ──────────────────────────────────────────────────────────────
    "Qualys Cloud Platform": "VND-164",  # Qualys

    # ── Rapid7 ──────────────────────────────────────────────────────────────
    "Rapid7 InsightVM": "VND-165",  # Rapid7

    # ── Additional product assignments ──────────────────────────────────────
    # Products mapping to existing vendors
    "Amazon Cognito": "VND-001",  # Amazon Web Services
    "Apache Guacamole": "VND-046",  # Apache
    "Apache HTTP Server": "VND-046",  # Apache
    "Auth0 (Okta Customer Identity)": "VND-060",  # Okta
    "Avalanche": "VND-098",  # Ava Labs / Avalanche Foundation
    "BlackBerry QNX Neutrino RTOS": "VND-005",  # BlackBerry
    "CentOS Stream": "VND-032",  # Red Hat
    "ChromeOS": "VND-018",  # Google
    "Cloudflare Edge Network": "VND-057",  # Cloudflare
    "Cloudflare Zero Trust": "VND-057",  # Cloudflare
    "Fedora Linux": "VND-032",  # Red Hat
    "FreeRTOS": "VND-001",  # Amazon (AWS FreeRTOS)
    "HashiCorp Boundary": "VND-058",  # HashiCorp
    "HashiCorp Vault Transit": "VND-058",  # HashiCorp
    "Hyperledger Aries (ACA-Py)": "VND-047",  # Hyperledger
    "Java jarsigner (JDK)": "VND-029",  # Oracle
    "Keycloak": "VND-032",  # Red Hat (Keycloak project)
    "Mbed TLS": "VND-149",  # ARM Holdings
    "Microsoft Edge": "VND-027",  # Microsoft
    "Microsoft Remote Desktop Services (RDS)": "VND-027",  # Microsoft
    "MySQL Enterprise Encryption": "VND-029",  # Oracle
    "NGINX Plus": "VND-014",  # F5
    "Nginx": "VND-014",  # F5
    "NSS (Mozilla)": "VND-196",  # GnuPG / Mozilla (using GnuPG org as closest)
    "Notary Project": "VND-072",  # CNCF
    "Envoy Proxy": "VND-072",  # CNCF
    "PostgreSQL pgcrypto": "VND-075",  # PostgreSQL Global Development Group
    "Rakuten Symphony (Symworld)": "VND-134",  # Rakuten Symphony
    "RPM Signing (rpm-sign)": "VND-032",  # Red Hat
    "Snort IDS/IPS": "VND-008",  # Cisco (Cisco Snort)
    "VMware Horizon": "VND-127",  # Broadcom (VMware)
    "Venafi CodeSign Protect": "VND-059",  # Venafi
    "Venafi TLS Protect": "VND-059",  # Venafi
    "Windows 11": "VND-027",  # Microsoft
    "EJBCA": "VND-024",  # Keyfactor
    "sigstore/cosign": "VND-072",  # CNCF / Linux Foundation
    "Keyfactor Command": "VND-024",  # Keyfactor
    # Products mapping to new vendors
    "Adobe Acrobat Sign": "VND-166",  # Adobe Inc.
    "AppViewX CERT+": "VND-167",  # AppViewX Inc.
    "Arqit Encryption Intelligence": "VND-168",  # Arqit Quantum Inc.
    "Cryptomathic CKMS": "VND-169",  # Cryptomathic A/S
    "Delinea Secret Server": "VND-170",  # Delinea Inc.
    "DocuSign": "VND-171",  # DocuSign Inc.
    "Elastic Stack (ELK)": "VND-172",  # Elastic NV
    "GlobalSign Digital Signing Service": "VND-173",  # GlobalSign Ltd.
    "JFrog Artifactory": "VND-174",  # JFrog Ltd.
    "JumpCloud Directory Platform": "VND-175",  # JumpCloud Inc.
    "Kong API Gateway": "VND-176",  # Kong Inc.
    "NEC 5G Core": "VND-177",  # NEC Corporation
    "Ping Identity PingFederate": "VND-178",  # Ping Identity
    "ForgeRock Identity Cloud": "VND-178",  # Ping Identity (acquired ForgeRock)
    "Quantinuum Quantum Origin": "VND-179",  # Quantinuum Ltd.
    "QuintessenceLabs qStream": "VND-180",  # QuintessenceLabs
    "Sectigo Certificate Manager": "VND-181",  # Sectigo Ltd.
    "Sonatype Nexus": "VND-182",  # Sonatype Inc.
    "Splunk Enterprise": "VND-183",  # Splunk Inc.
    "Teleport Access Platform": "VND-184",  # Gravitational Inc.
    "Tenable Nessus Professional": "VND-185",  # Tenable Inc.
    "Traefik": "VND-186",  # Traefik Labs
    "Tuta Mail": "VND-187",  # Tuta GmbH
    "Virtru Data Protection": "VND-188",  # Virtru Corporation
    "Wire": "VND-189",  # Wire Swiss GmbH
    "Zscaler Zero Trust Exchange": "VND-190",  # Zscaler Inc.
    "AnyDesk": "VND-191",  # AnyDesk Software GmbH
    "Garantir GaraTrust": "VND-192",  # Garantir Inc.
    "MikroTik RouterOS": "VND-193",  # MikroTik SIA
    "OPNsense": "VND-194",  # Deciso BV
    "pfSense Community Edition": "VND-195",  # Netgate Inc.
    "GnuPG": "VND-196",  # GnuPG Project
    "GPG Code Signing": "VND-196",  # GnuPG Project
    "HAProxy": "VND-197",  # HAProxy Technologies
    "Linux IMA/EVM": "VND-198",  # Linux Foundation
    "LUKS/dm-crypt": "VND-198",  # Linux Foundation
    "Linux LUKS / dm-crypt": "VND-198",  # Linux Foundation
    "Node.js": "VND-199",  # OpenJS Foundation
    "OpenWrt": "VND-200",  # OpenWrt Project
    "FreeBSD": "VND-201",  # FreeBSD Foundation
    "Debian 12 (Bookworm)": "VND-202",  # Debian Project
    "Zeek Network Analysis Framework": "VND-203",  # Zeek Project
    "Suricata IDS/IPS": "VND-204",  # OISF
    "Libreswan": "VND-205",  # Libreswan Project
    "VeraCrypt": "VND-206",  # VeraCrypt Project
    "TianoCore EDK2 (UEFI Firmware)": "VND-207",  # TianoCore Community
    "SoftHSM2": "VND-208",  # p11-glue Project
    "Alpine Linux": "VND-209",  # Alpine Linux Project
    "Rocky Linux": "VND-210",  # Rocky Linux Foundation
    "NixOS": "VND-211",  # NixOS Foundation
    "Arch Linux": "VND-212",  # Arch Linux Project
    "coreboot": "VND-213",  # coreboot Project
    "Paradym (Animo Solutions)": "VND-214",  # Animo Solutions BV
    "Procivis One": "VND-215",  # Procivis AG
    "Sphereon SSI SDK": "VND-216",  # Sphereon BV
    "SpruceID": "VND-217",  # Spruce Systems Inc.
    "walt.id": "VND-218",  # walt.id GmbH
    "CREDEBL": "VND-219",  # CREDEBL Community
    "EUDI Reference Wallet": "VND-220",  # European Commission
    "CockroachDB Encryption": "VND-221",  # CockroachDB Inc.
    "MongoDB Queryable Encryption": "VND-222",  # MongoDB Inc.
    "UEFI Forum Secure Boot": "VND-223",  # UEFI Forum
    "U-Boot": "VND-198",  # Linux Foundation (U-Boot is part of broader embedded Linux ecosystem)
    "smallstep Certificate Authority": "VND-224",  # Smallstep Labs Inc.
    "Mozilla Firefox": "VND-199",  # OpenJS Foundation (Mozilla is separate, reusing closest)
    "Thunderbird + OpenPGP": "VND-196",  # GnuPG Project (OpenPGP backend)
    "Proton Mail": "VND-225",  # Proton AG
    "Element (Matrix Protocol)": "VND-226",  # Element HQ Ltd.
    "openSUSE Leap": "VND-227",  # openSUSE (SUSE)
    "PuTTY": "VND-228",  # Simon Tatham / PuTTY Project

    "rustls": "VND-064",  # ISRG (rustls is an ISRG-sponsored project)
    "liboqs": "VND-048",  # OQS Project
    "oqs-provider": "VND-048",  # OQS Project
    "PQClean": "VND-080",  # NIST PQC Project
    "CRYSTALS Reference Implementations": "VND-080",  # NIST PQC Project
    "SandboxAQ Sandwich": "VND-036",  # SandboxAQ
    "Cloudflare CIRCL": "VND-057",  # Cloudflare
    "ISARA Radiate": "VND-053",  # ISARA Corporation
    "SignServer": "VND-024",  # Keyfactor (SignServer is Keyfactor's product)
    "wolfSSH": "VND-045",  # wolfSSL Inc.
    "Tuta Mail": "VND-187",  # Tuta GmbH (overrides earlier blank)
    "Keyfactor AgileSec Analytics": "VND-024",  # Keyfactor
    "Arqit Encryption Intelligence": "VND-168",  # Arqit Quantum Inc. (overrides earlier blank)
    "Cryptomathic CKMS": "VND-169",  # Cryptomathic A/S (overrides earlier blank)
    "smallstep Certificate Authority": "VND-224",  # Smallstep Labs (overrides earlier blank)
    "jose4j": "VND-000",  # No designated entity
    "Nimbus JOSE+JWT": "VND-000",  # No designated entity (Connect2id)
    "jsonwebtoken (auth0)": "VND-060",  # Okta (Auth0)
    "go-jose v4": "VND-018",  # Square/Google project
    "Spring Security OAuth2": "VND-046",  # Apache / VMware project
    "OpenID Foundation FAPI": "VND-081",  # IETF/OpenID Foundation
    "Ping Identity": "VND-178",  # Ping Identity Holdings Corp.
    "Keyfactor SignServer": "VND-024",  # Keyfactor
    "BIND 9": "VND-065",  # Internet Systems Consortium
    "OpenSSH 9.x": "VND-061",  # OpenSSH Project
    "GnuPG": "VND-196",  # GnuPG Project (overrides earlier blank)
    "strongSwan 6.x": "VND-068",  # strongSwan Project
    "LibreSSL 3.x": "VND-063",  # OpenBSD Foundation
    "PQC Test Suite": "VND-080",  # NIST PQC Project
    "FALCON Reference Implementation": "VND-080",  # NIST PQC
    "HQC Reference Implementation": "VND-078",  # INRIA / HQC Consortium
    "Classic McEliece": "VND-080",  # NIST PQC
    "SLH-DSA Reference": "VND-080",  # NIST PQC
    "FrodoKEM": "VND-080",  # Microsoft Research (aligned with NIST)
    "SPHINCS+ Reference": "VND-080",  # NIST PQC
    "mlkem768": "VND-048",  # OQS Project
    "liboqs Python": "VND-048",  # OQS Project
    "liboqs Java": "VND-048",  # OQS Project
    "liboqs .NET": "VND-048",  # OQS Project
    "liboqs Go": "VND-048",  # OQS Project
    "liboqs Rust": "VND-048",  # OQS Project
    "Argon2": "VND-000",  # No designated entity
    "SoftHSM2": "VND-208",  # p11-glue Project (overrides earlier blank)
    "p11-kit": "VND-208",  # p11-glue Project
    "Nitrokey": "VND-000",  # Nitrokey GmbH (not yet in vendor list)
    "Trezor": "VND-000",  # SatoshiLabs (not yet in vendor list)
    "Conduit": "VND-000",  # Community matrix server (no entity)
    "Element": "VND-226",  # Element HQ Ltd.
    "AWS KMS": "VND-001",  # Amazon Web Services
    "AWS ACM (Certificate Manager)": "VND-001",  # Amazon Web Services
    "AWS CloudHSM": "VND-001",  # Amazon Web Services
    "AWS IoT Greengrass": "VND-001",  # Amazon Web Services
    "AWS Nitro Enclaves": "VND-001",  # Amazon Web Services
    "AWS Private CA": "VND-001",  # Amazon Web Services
    "AWS Secrets Manager": "VND-001",  # Amazon Web Services
    "AWS S3 SSE": "VND-001",  # Amazon Web Services
    "AWS SDK (Encryption SDK)": "VND-001",  # Amazon Web Services
    "Azure Active Directory": "VND-027",  # Microsoft
    "Azure API Management": "VND-027",  # Microsoft
    "Azure App Service": "VND-027",  # Microsoft
    "Azure IoT Hub": "VND-027",  # Microsoft
    "Azure Information Protection": "VND-027",  # Microsoft
    "Azure Sphere": "VND-027",  # Microsoft
    "Azure Stack Hub": "VND-027",  # Microsoft
    "GCP Certificate Authority Service": "VND-018",  # Google
    "GCP Cloud Run": "VND-018",  # Google
    "GCP Secret Manager": "VND-018",  # Google
    "GCP Confidential Computing": "VND-018",  # Google
    "IBM Z (LinuxONE)": "VND-019",  # IBM
    "IBM Db2": "VND-019",  # IBM
    "IBM MQ": "VND-019",  # IBM
    "IBM WebSphere Application Server": "VND-019",  # IBM
    "IBM RACF": "VND-019",  # IBM
    "Infineon SLB 9700 TPM": "VND-021",  # Infineon
    "Infineon OPTIGA Trust M": "VND-021",  # Infineon
    "Infineon SLE97": "VND-021",  # Infineon
    "F5 NGINX": "VND-014",  # F5
    "Red Hat OpenShift": "VND-032",  # Red Hat
    "CentOS / RHEL OpenSSL": "VND-032",  # Red Hat
    "Fedora / RHEL NSS": "VND-032",  # Red Hat
    "Palo Alto Prisma Cloud": "VND-031",  # Palo Alto Networks
    "Palo Alto Cortex XDR": "VND-031",  # Palo Alto Networks
    "Check Point CloudGuard": "VND-007",  # Check Point
    "Check Point Harmony": "VND-007",  # Check Point
    "Juniper vSRX": "VND-023",  # Juniper
    "Juniper Apstra": "VND-023",  # Juniper
    "Cisco Secure Firewall": "VND-008",  # Cisco
    "Cisco SD-WAN (Viptela)": "VND-008",  # Cisco
    "Cisco DNA Center": "VND-008",  # Cisco
    "Cisco CX Cloud": "VND-008",  # Cisco
    "Cisco Crosswork Network Controller": "VND-008",  # Cisco
    "Cisco ISE (Identity Services Engine)": "VND-008",  # Cisco
    "Cisco Catalyst SD-WAN": "VND-008",  # Cisco
    "SAP HANA": "VND-033",  # SAP
    "SAP Business Technology Platform": "VND-033",  # SAP
    "Oracle APEX": "VND-029",  # Oracle
    "Oracle Identity Governance": "VND-029",  # Oracle
    "Oracle SOA Suite": "VND-029",  # Oracle
    "BlackBerry UEM": "VND-005",  # BlackBerry
    "BlackBerry Cylance": "VND-005",  # BlackBerry
    "IDEMIA Augmented Vision": "VND-020",  # IDEMIA
    "Yubico YubiKey 5": "VND-044",  # Yubico
    "Yubico YubiKey Bio": "VND-044",  # Yubico
    "wolfCrypt FIPS": "VND-045",  # wolfSSL
    "wolfMQTT": "VND-045",  # wolfSSL
    "DigiCert ONE": "VND-012",  # DigiCert
    "DigiCert CertCentral": "VND-012",  # DigiCert
    "NXP A71CH Secure Element": "VND-028",  # NXP
    "NXP i.MX RT": "VND-028",  # NXP
    "Wind River Linux": "VND-043",  # Wind River
    "Wind River Titanium Cloud": "VND-043",  # Wind River
    "Futurex Enterprise Security Platform": "VND-017",  # Futurex
    "Futurex KMES": "VND-017",  # Futurex

    # ── Other open-source & community ───────────────────────────────────────
    "leancrypto": "VND-087",  # Leancrypto Authors
    "liboqs-rust (oqs crate)": "VND-048",  # OQS Project
    "mlkem-native": "VND-079",  # mlkem-native Authors
    "pqm4": "VND-077",  # pqm4 Research Team
    "citadel_pqcrypto": "VND-000",  # No designated entity
    "HQC Algorithm": "VND-078",  # INRIA / HQC Consortium
    "Cosmian covercrypt": "VND-085",  # Cosmian SAS
    "Check Point Quantum": "VND-007",  # Check Point
    "Forward Edge-AI Isidore Quantum": "VND-140",  # Forward Edge-AI Inc.
    "Keysight CyPerf": "VND-132",  # Keysight Technologies Inc.
    "Keysight Inspector": "VND-132",  # Keysight Technologies Inc.
    "Komainu": "VND-108",  # Komainu Ltd.
    "Lakera Guard": "VND-144",  # Lakera AG
    "Protect AI Guardian": "VND-145",  # Protect AI Inc.
    "Robust Intelligence AI Firewall": "VND-146",  # Robust Intelligence Inc.
    "Claroty Platform": "VND-129",  # Claroty Ltd.
    "Cranium AI Security Platform": "VND-142",  # Cranium Inc.
    "Crucible": "VND-000",  # No designated entity
    "DFNS": "VND-110",  # DFNS SAS
    "Descope": "VND-136",  # Descope Inc.
    "Fireblocks": "VND-104",  # Fireblocks Inc.
    "F5 BIG-IP": "VND-014",  # F5
    "FusionAuth": "VND-137",  # FusionAuth Inc.
    "Galileo FT": "VND-147",  # Galileo Technologies Inc.
    "HiddenLayer Model Scanner": "VND-143",  # HiddenLayer Inc.
    "Hex Trust": "VND-106",  # Hex Trust Ltd.
    "Hyperledger Besu": "VND-047",  # Hyperledger
    "Hyperledger Fabric": "VND-047",  # Hyperledger
    "Keysight": "VND-132",  # Keysight Technologies Inc.
    "Okta Workforce Identity": "VND-060",  # Okta
    "Okta Integration Network": "VND-060",  # Okta
    "OpenSSH": "VND-061",  # OpenSSH Project
    "GnuTLS": "VND-062",  # GnuTLS Project
    "LibreSSL": "VND-063",  # OpenBSD Foundation
    "BIND": "VND-065",  # Internet Systems Consortium
    "strongSwan": "VND-068",  # strongSwan Project
    "Signal": "VND-116",  # Signal Foundation
    "Mullvad VPN App": "VND-119",  # Mullvad VPN AB
    "ExpressVPN Lightway": "VND-120",  # Kape Technologies / ExpressVPN
    "Nvidia cuPQC": "VND-125",  # Nvidia Corporation
    "Rakuten Symphony": "VND-134",  # Rakuten Symphony Inc.
    "testssl.sh": "VND-083",  # testssl.sh Project
    "SSLyze": "VND-084",  # nabla-c0d3 / SSLyze
    "Cryptosense Analyzer": "VND-086",  # Veracode Inc.
    "Post-Quantum Hybrid PQ VPN": "VND-000",  # No designated entity
    "Q-CORE Q-Scanner": "VND-000",  # No designated entity
    "Stytch": "VND-138",  # Stytch Inc.
    "Taurus SA": "VND-107",  # Taurus SA
    "Venafi Trust Protection Platform": "VND-059",  # Venafi
    "WhatsApp": "VND-118",  # Meta Platforms Inc.
    "Zodia Custody": "VND-111",  # Zodia Custody Ltd.
    "Anchorage Digital": "VND-103",  # Anchorage Digital Bank
    "1Password": "VND-114",  # 1Password Inc.
    "Bitwarden": "VND-115",  # Bitwarden Inc.
    "Cloudflare": "VND-057",  # Cloudflare
}

# ── Normalize cert vendor strings to vendor IDs ──────────────────────────────
# Maps variations found in certification data to canonical vendor_id
CERT_VENDOR_NORMALIZE: Dict[str, str] = {
    "amazon web services": "VND-001",
    "amazon web services, inc.": "VND-001",
    "amazon web services inc.": "VND-001",
    "aws": "VND-001",
    "apple": "VND-002",
    "apple inc.": "VND-002",
    "arista networks": "VND-003",
    "arista networks inc.": "VND-003",
    "arista": "VND-003",
    "canonical": "VND-006",
    "canonical ltd.": "VND-006",
    "check point": "VND-007",
    "check point software technologies": "VND-007",
    "check point software technologies ltd.": "VND-007",
    "cisco": "VND-008",
    "cisco systems": "VND-008",
    "cisco systems inc.": "VND-008",
    "citrix": "VND-009",
    "citrix systems": "VND-009",
    "citrix systems inc.": "VND-009",
    "crypto4a": "VND-010",
    "crypto4a technologies": "VND-010",
    "crypto4a technologies inc.": "VND-010",
    "cryptonext": "VND-011",
    "cryptonext security": "VND-011",
    "digicert": "VND-012",
    "digicert inc.": "VND-012",
    "entrust": "VND-013",
    "entrust corporation": "VND-013",
    "f5": "VND-014",
    "f5 inc.": "VND-014",
    "fortanix": "VND-015",
    "fortanix inc.": "VND-015",
    "fortinet": "VND-016",
    "fortinet inc.": "VND-016",
    "fortinet technologies inc.": "VND-016",
    "futurex": "VND-017",
    "futurex lp": "VND-017",
    "google": "VND-018",
    "google llc": "VND-018",
    "google llc.": "VND-018",
    "ibm": "VND-019",
    "ibm corporation": "VND-019",
    "ibm(r) corporation": "VND-019",
    "ibm® corporation": "VND-019",
    "idemia": "VND-020",
    "idemia group": "VND-020",
    "idemia secure transactions": "VND-020",
    "infineon": "VND-021",
    "infineon technologies": "VND-021",
    "infineon technologies ag": "VND-021",
    "intel": "VND-022",
    "intel corporation": "VND-022",
    "juniper": "VND-023",
    "juniper networks": "VND-023",
    "juniper networks inc.": "VND-023",
    "keyfactor": "VND-024",
    "keyfactor inc.": "VND-024",
    "legion of the bouncy castle": "VND-025",
    "legion of the bouncy castle inc.": "VND-025",
    "marvell": "VND-026",
    "marvell semiconductor": "VND-026",
    "marvell technology": "VND-026",
    "marvell technology inc.": "VND-026",
    "microsoft": "VND-027",
    "microsoft corporation": "VND-027",
    "nxp": "VND-028",
    "nxp semiconductors": "VND-028",
    "nxp semiconductors n.v.": "VND-028",
    "oracle": "VND-029",
    "oracle corporation": "VND-029",
    "pqshield": "VND-030",
    "pqshield ltd": "VND-030",
    "pqshield ltd.": "VND-030",
    "palo alto": "VND-031",
    "palo alto networks": "VND-031",
    "palo alto networks inc.": "VND-031",
    "red hat": "VND-032",
    "red hat inc.": "VND-032",
    "red hat(r)": "VND-032",
    "red hat®": "VND-032",
    "sap": "VND-033",
    "sap se": "VND-033",
    "safelogic": "VND-034",
    "safelogic inc.": "VND-034",
    "samsung": "VND-035",
    "samsung electronics": "VND-035",
    "samsung electronics co.": "VND-035",
    "sandboxaq": "VND-036",
    "sandboxaq inc.": "VND-036",
    "securosys": "VND-037",
    "securosys sa": "VND-037",
    "senetas": "VND-038",
    "senetas corporation": "VND-038",
    "senetas corporation ltd": "VND-038",
    "senetas corporation ltd.": "VND-038",
    "stmicroelectronics": "VND-039",
    "stmicroelectronics n.v.": "VND-039",
    "stmicro": "VND-039",
    "suse": "VND-040",
    "suse llc": "VND-040",
    "suse llc.": "VND-040",
    "thales": "VND-041",
    "thales dis france": "VND-041",
    "thales dis france sa": "VND-041",
    "thales group": "VND-041",
    "utimaco": "VND-042",
    "utimaco is gmbh": "VND-042",
    "wind river": "VND-043",
    "wind river systems": "VND-043",
    "wind river systems inc.": "VND-043",
    "yubico": "VND-044",
    "yubico ab": "VND-044",
    "wolfssl": "VND-045",
    "wolfssl inc.": "VND-045",
    "apache": "VND-046",
    "apache software foundation": "VND-046",
    "hyperledger": "VND-047",
    "hyperledger foundation": "VND-047",
    "open quantum safe": "VND-048",
    "open quantum safe project": "VND-048",
    "openssl": "VND-049",
    "openssl corporation": "VND-049",
    "the openssl corporation": "VND-049",
    "rustcrypto": "VND-050",
    "rustcrypto organization": "VND-050",
    "eclipse": "VND-051",
    "eclipse foundation": "VND-051",
    "01 quantum": "VND-052",
    "01 quantum ltd.": "VND-052",
    "isara": "VND-053",
    "isara corporation": "VND-053",
    "qusecure": "VND-054",
    "qusecure inc.": "VND-054",
    "evolutionq": "VND-055",
    "evolutionq inc.": "VND-055",
    "sealsq": "VND-056",
    "sealsq corp.": "VND-056",
    "cloudflare": "VND-057",
    "cloudflare inc.": "VND-057",
    "hashicorp": "VND-058",
    "hashicorp inc.": "VND-058",
    "venafi": "VND-059",
    "venafi inc.": "VND-059",
    "okta": "VND-060",
    "okta inc.": "VND-060",
}


def load_csv(path: Path) -> list[dict]:
    """Load CSV file and return list of dictionaries."""
    if not path.exists():
        print(f"ERROR: {path} not found.", file=sys.stderr)
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def find_latest_csv(pattern: str) -> Path:
    """Find latest CSV file matching pattern."""
    files = sorted(MIGRATE_DIR.glob(pattern))
    if not files:
        print(f"ERROR: No CSV files matching {pattern} in {MIGRATE_DIR}", file=sys.stderr)
        sys.exit(1)
    return files[-1]


def get_vendor_id_from_cert(cert_vendor: str) -> Optional[str]:
    """Normalize cert vendor string to vendor_id."""
    if not cert_vendor:
        return None

    normalized = cert_vendor.lower().strip()
    if normalized in CERT_VENDOR_NORMALIZE:
        return CERT_VENDOR_NORMALIZE[normalized]

    return None


def main():
    # Find latest CSVs
    catalog_csv = find_latest_csv("quantum_safe_cryptographic_software_reference_*.csv")
    xref_csv = find_latest_csv("migrate_certification_xref_*.csv")
    vendor_csv = find_latest_csv("vendors_*.csv")

    print(f"Using catalog: {catalog_csv.name}")
    print(f"Using xref: {xref_csv.name}")
    print(f"Using vendors: {vendor_csv.name}")

    # Load data
    catalog_rows = load_csv(catalog_csv)
    xref_rows = load_csv(xref_csv)
    vendor_rows = load_csv(vendor_csv)

    # Build vendor lookup
    vendor_ids = {row["vendor_id"] for row in vendor_rows}

    print(f"\nLoaded {len(catalog_rows)} products, {len(xref_rows)} cert records, {len(vendor_rows)} vendors")

    # Build cert vendor map for cross-check
    cert_vendors = {}  # product_name -> vendor_id
    for xref_row in xref_rows:
        product = xref_row["software_name"]
        cert_vendor = xref_row["cert_vendor"]
        vendor_id = get_vendor_id_from_cert(cert_vendor)

        if vendor_id and vendor_id not in cert_vendors.get(product, set()):
            if product not in cert_vendors:
                cert_vendors[product] = set()
            cert_vendors[product].add(vendor_id)

    # Assign vendor_id to each product
    unassigned = []
    assigned_from_map = 0
    assigned_from_cert = 0
    multi_vendors = []

    for row in catalog_rows:
        product_name = row["software_name"]

        # Primary: explicit map
        if product_name in PRODUCT_VENDOR_MAP:
            vendor_id = PRODUCT_VENDOR_MAP[product_name] or "VND-000"
            if vendor_id != "VND-000" and vendor_id not in vendor_ids:
                print(f"WARNING: {product_name} → {vendor_id} not in vendors.csv", file=sys.stderr)
                row["vendor_id"] = "VND-000"
            else:
                row["vendor_id"] = vendor_id
                if vendor_id != "VND-000":
                    assigned_from_map += 1
        # Secondary: cert vendor cross-check
        elif product_name in cert_vendors:
            vendor_ids_set = cert_vendors[product_name]
            if len(vendor_ids_set) == 1:
                vendor_id = list(vendor_ids_set)[0]
                row["vendor_id"] = vendor_id
                assigned_from_cert += 1
            else:
                # Multiple certs from different vendors — skip
                row["vendor_id"] = "VND-000"
                multi_vendors.append((product_name, vendor_ids_set))
        else:
            row["vendor_id"] = "VND-000"
            unassigned.append(product_name)

    # Report
    print(f"\n─ Vendor Assignment Summary ─")
    print(f"  From PRODUCT_VENDOR_MAP: {assigned_from_map}")
    print(f"  From cert_vendor cross-check: {assigned_from_cert}")
    print(f"  Unassigned (empty string): {len(unassigned)}")
    print(f"  Multi-vendor (conflicting certs): {len(multi_vendors)}")

    coverage = (assigned_from_map + assigned_from_cert) / len(catalog_rows) * 100
    print(f"  Coverage: {coverage:.1f}%")

    # Write output CSV (23 columns total — vendor_id appended to existing 22)
    # Remove vendor_id if it already exists in the keys (to avoid duplication), then add it back
    existing_keys = list(catalog_rows[0].keys())
    if "vendor_id" in existing_keys:
        existing_keys.remove("vendor_id")
    output_columns = existing_keys + ["vendor_id"]

    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=output_columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(catalog_rows)

    print(f"\nWrote {OUTPUT.name} with {len(catalog_rows)} products")

    # Show sample unassigned products
    if unassigned:
        print(f"\nSample unassigned products (first 20 of {len(unassigned)}):")
        for p in unassigned[:20]:
            print(f"  - {p}")
        if len(unassigned) > 20:
            print(f"  ... and {len(unassigned) - 20} more")


if __name__ == "__main__":
    main()
