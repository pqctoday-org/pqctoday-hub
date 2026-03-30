#!/usr/bin/env python3
"""
PQC Product Catalog Audit Fix Script — Round 2
Applies the remaining ~32 low-severity gaps not covered in round 1.
"""
import csv
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src" / "data" / "pqc_product_catalog_03302026_r1.csv"
TODAY = "2026-03-30"

FIXES: dict[str, dict[str, str]] = {

    # ── Version bumps ────────────────────────────────────────────────

    "Mozilla Firefox": {
        "pqc_capability_description": "Mozilla Firefox supports ML-KEM for TLS 1.3 key exchanges via NSS. Feature shipped in Firefox 132 (Oct 2024) but enabled by default for all users in Firefox 135 (Feb 2025). Supports X25519MLKEM768 hybrid. Firefox on Android gained support in Firefox 145.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "default-in-v135-not-v132; no-cert-backing",
    },
    "GnuPG": {
        "latest_version": "2.5.18",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "MariaDB Server": {
        "latest_version": "11.8.6",
        "pqc_capability_description": "MariaDB Server is the open-source fork of MySQL maintained by the MariaDB Foundation. MariaDB 11.8 LTS (11.8.6, Feb 2026) uses OpenSSL for TLS connections and supports Data-at-Rest Encryption (DARE) via the file_key_management and HashiCorp Vault plugins. ML-KEM hybrid TLS is available with OpenSSL 3.x. Key wrapping for DARE uses AES-256 (quantum-safe for symmetric encryption) but the key management layer (Vault, KMS) requires PQC migration.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Ping Identity PingFederate": {
        "latest_version": "13.0",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Juniper SRX Series Firewalls": {
        "pqc_support": "Partial (PQC image signing in Junos 25.4R1; IKEv2 ML-KEM on roadmap)",
        "pqc_capability_description": "Juniper SRX Series firewalls run Junos OS and provide enterprise-grade IPsec VPN, IPS, and application security. Junos 25.4R1 delivers PQC ML-DSA-87 image signatures for SRX Series. ML-KEM hybrid IKEv2 for VPN tunnels is on the Juniper roadmap targeting 2026. Juniper Networks is part of the ETSI QKD and NIST PQC working groups.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "OPNsense": {
        "pqc_support": "Partial (mlkem768x25519 SSH KEX in OPNsense 24.7.7+; strongSwan IPsec ML-KEM experimental upstream)",
        "pqc_capability_description": "OPNsense is an open-source FreeBSD-based firewall forked from pfSense. OPNsense 24.7.7+ added post-quantum SSH key exchange (mlkem768x25519-sha256 via OpenSSH 9.9). strongSwan IPsec ML-KEM support is still experimental in upstream strongSwan. Note: the implemented PQC is SSH key exchange, not IPsec.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "OpenWrt": {
        "latest_version": "24.10",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },

    # ── PQC status corrections ───────────────────────────────────────

    "Google Tink": {
        "pqc_support": "Partial (Experimental PQC in C++; HPKE shipping; NIST PQC integration in progress)",
        "pqc_capability_description": "Multi-language library (C++, Go, Java). Experimental PQC access available in C++. HPKE (Hybrid Public Key Encryption) support is shipping in stable releases. NIST PQC algorithm integration (ML-KEM, ML-DSA) in progress but not yet in stable releases. Used in Google infrastructure and Cloud KMS. Project restructured into language-specific repos (tink-java, tink-go, etc.).",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Mbed TLS": {
        "pqc_capability_description": "ARM TrustedFirmware TLS library widely used in embedded IoT devices. LMS hash-based signatures available for verification. ML-DSA initial support targeted Q2 2026. ML-KEM listed as Future on roadmap (not scheduled). TF-PSA-Crypto 1.1 LTS targeted Q1 2026. Critical gap for IoT/embedded PQC migration as millions of devices depend on Mbed TLS.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "sigstore/cosign": {
        "pqc_support": "Partial (LMS + ML-DSA Go implementations complete; PQC signing via custom Keypair)",
        "pqc_capability_description": "Uses ECDSA P-256 (default) with Ed25519 and ECDSA P-521 via --signing-algorithm flag (v3.0.3+). Go implementations of LMS and ML-DSA are complete. ML-DSA added to Sigstore protobuf specs. Cryptographic agility implemented across cosign/Fulcio/Rekor by Trail of Bits. Private Sigstore instances can experiment with PQC signing via custom Keypair implementations. Public instance awaiting Go stdlib ML-DSA support (Go 1.26+).",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Marvell LiquidSecurity 2": {
        "pqc_support": "Partial (ML-KEM ML-DSA SLH-DSA CAVP validated; FIPS 140-3 L3 #4703)",
        "pqc_capability_description": "High-throughput PCIe HSM with hardware PQC acceleration. CAVP certifications achieved for ML-KEM, ML-DSA, and SLH-DSA, upgrading from Beta. FIPS 140-3 Level 3 validated hardware (#4703). Used in cloud infrastructure and financial transaction processing.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "cavp-validated; pre-standard-date",
    },
    "WireGuard": {
        "pqc_capability_description": "Modern VPN protocol using Noise protocol framework with X25519 for key exchange. The Post-Quantum WireGuard (PQWireGuard) extension adds ML-KEM-768 to the handshake. Mullvad VPN ships PQ WireGuard. Note: PQ WireGuard extensions are third-party/research implementations (Kudelski, Rosenpass), NOT upstream WireGuard protocol. WireGuard kernel module does not natively support PQC. IETF draft for PQ WireGuard standardization is in progress.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "pq-extension-is-third-party; not-upstream",
    },
    "Futurex Vectera Plus": {
        "pqc_support": "Partial (Futurex CryptoHub PCI HSM validated with PQC Jun 2025; Vectera Plus payment firmware PQC status unclear)",
        "pqc_capability_description": "Payment HSM with crypto-agile architecture. Futurex CryptoHub general-purpose HSM has ML-DSA, ML-KEM, and SLH-DSA support with PCI HSM validation (June 2025) — currently the only PCI-HSM-validated option with PQC. Vectera Plus payment-specific firmware PQC status unclear. PCI PTS HSM v3 certified.",
        "verification_status": "Partially Verified",
        "last_verified_date": TODAY,
    },
    "UEFI Forum Secure Boot": {
        "pqc_capability_description": "No PQC algorithm support in current UEFI Secure Boot specification (UEFI 2.10). Signature database supports RSA-2048 SHA-256 only. However, AMI achieved the industry's first working PQC implementation in Aptio V UEFI Firmware (November 2025). CNSA 2.0 mandates PQC firmware signing as the first use case starting 2025. Doug Flick (Microsoft) added as TianoCore EDK2 CryptoPkg maintainer for PQC (Feb 2026). Future revisions expected to add ML-DSA/SLH-DSA.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Palo Alto Prisma SASE": {
        "pqc_support": "Partial (Quantum Readiness Dashboard GA Jan 2026; full PQC integration rolling out)",
        "pqc_capability_description": "Palo Alto Networks Prisma SASE combines SD-WAN, SSE, ZTNA, and CASB into a cloud-delivered security service. Quantum Readiness Dashboard available for NGFW and SASE customers since January 30, 2026. Additional PQC integration enhancements planned for April 2026. TLS inspection at the SASE edge and IPsec tunnels between branches require ML-KEM hybrid migration.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Cisco Meraki MX (Cloud-Managed Firewall)": {
        "pqc_capability_description": "Cisco Meraki MX is a cloud-managed next-generation firewall/SD-WAN platform used heavily in branch offices and SMB/enterprise deployments. AutoVPN uses IKEv2/IPsec with classical algorithms. Meraki cloud dashboard communications use TLS 1.3 (classical). New C8455-G2-MX hardware announced as AI/ML and PQC-ready. PQC follows Cisco's quantum-safe roadmap — no specific Meraki firmware PQC timeline published.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Ethereum (Geth)": {
        "pqc_support": "Planned (active 4-year Strawmap; pq.ethereum.org; 10+ teams on PQC devnets)",
        "pqc_capability_description": "Ethereum Foundation established dedicated PQ team in 2026 with $2M research prize fund. Detailed Strawmap with 7 hard forks through 2029: Hegota fork (H2 2026) targets hash-based STARK-friendly sigs replacing BLS, then KZG data availability upgrade, then EIP-8141 signature type switching for wallets. pq.ethereum.org launched as PQC hub. 10+ client teams running weekly PQC interoperability devnets. Vitalik Buterin published PQC defense roadmap Feb 2026.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "STMicroelectronics ST33G1M2 TPM": {
        "pqc_capability_description": "ST33G1M2 is a TCG TPM 2.0-compliant secure microcontroller (CC EAL4+ certified). Current firmware supports RSA-2048 and ECC P-256/P-384. STMicroelectronics has announced the successor ST33KTPM with PQC-protected firmware and ML-KEM/ML-DSA/XMSS/LMS support — claiming to be first to provide quantum resistant features across all product ranges. The ST33G1M2 itself does not have PQC. PQC firmware upgrade for this specific model is on roadmap targeting 2026-2027.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },

    # ── Metadata/URL/description corrections ─────────────────────────

    "Apache HTTP Server": {
        "authoritative_source": "https://httpd.apache.org/docs/2.4/mod/mod_ssl.html",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Bouncy Castle Java": {
        "fips_validated": "Yes (FIPS 140-3 BC-FJA 2.1.2 interim cert #4943)",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Entrust KeyControl": {
        "pqc_capability_description": "Full PQC key management with ML-KEM ML-DSA and SLH-DSA key types via nShield HSM delegation. Supports encapsulation decapsulation sign and verify operations. PQ-TLS for KMIP connections. nShield 5 HSM v13.8.0 natively supports PQC with CAVP validation. Note: PQC capabilities are delegated to the nShield HSM backend — KeyControl itself is the key management layer.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "pqc-via-hsm-delegation",
    },
    "SafeLogic CryptoComply": {
        "pqc_capability_description": "FIPS 140-3 validated cryptographic modules. Supports hybrid mode (classical + PQC) and includes CryptoComply PQ TLS for quantum-safe data in transit. Drop-in OpenSSL compatibility. CryptoComply Go v4.0 adds all NIST PQC algorithms (ML-KEM FIPS 203 ML-DSA FIPS 204 SLH-DSA FIPS 205). PQC capabilities rolled out across Core v3.5 (OpenSSL-based) Mobile v3.5 Java v4 and Go v4.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "01 Quantum IronCAP": {
        "pqc_support": "Yes (Modern McEliece — proprietary Goppa code-based variant)",
        "pqc_capability_description": "Quantum-safe cryptographic engine using Modern McEliece, a patented optimization of Classic McEliece with Goppa code-based encryption, plus NIST-approved PQC algorithms and hash-based digital signatures. Not standard Classic McEliece. Powers Hitachi DoMobile Ver.5 remote access system in Japan. Developing Quantum AI Wrapper (QAW) for securing AI data with Full Homomorphic Encryption and Quantum Crypto Wrapper (QCW) for blockchain quantum-safety.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "proprietary-mceliece-variant; no-cert-backing",
    },
    "citadel_pqcrypto": {
        "pqc_support": "Yes (ML-KEM; NTRU+ claim unverified)",
        "evidence_flags": "ntru-plus-unverified; no-cert-backing",
        "verification_status": "Needs Verification",
        "last_verified_date": TODAY,
    },
    "Xiphera PQC IP Cores": {
        "pqc_support": "Yes (ML-KEM CAVP validated; ACVP A7679 claimed but unverifiable via web)",
        "verification_status": "Needs Verification",
        "last_verified_date": TODAY,
        "evidence_flags": "acvp-a7679-unverifiable-via-web",
    },
    "Atalla AT1000e": {
        "pqc_capability_description": "Payment HSM. The Atalla AT1000 (current model, succeeding AT1000e) is now manufactured and sold by Utimaco (not OpenText). Has FIPS 140-3 L3 certification and integrates with OpenText Voltage SecureData. The Utimaco GP HSM Se-Series supports PQC (ML-KEM, ML-DSA, LMS, XMSS), but the AT1000 payment HSM firmware's PQC status is unclear. Organizations should evaluate migration to PQC-ready alternatives.",
        "product_brief": "Payment HSM now under Utimaco (not OpenText). FIPS 140-3 L3 certified. Payment firmware PQC status unclear. GP HSM Se-Series supports PQC.",
        "verification_status": "Partially Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "vendor-is-utimaco-not-opentext; fips-classical-only",
    },
    "Debian 12 (Bookworm)": {
        "pqc_capability_description": "Debian 12 ships with OpenSSL 3.0.x. liboqs and oqs-provider availability via bookworm-backports is unverified — users may need to build from source. Debian 13 (Trixie) expected to ship with OpenSSL 3.3+ for native PQC. Base for Ubuntu and Raspberry Pi OS making Debian PQC adoption significant for embedded and server markets.",
        "verification_status": "Partially Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "liboqs-in-backports-unverified; openssl-version-mismatch",
    },
    "Crucible": {
        "verification_status": "Needs Verification",
        "last_verified_date": TODAY,
        "evidence_flags": "product-existence-unverifiable-via-web; no-vendor-docs",
    },

    # ── Status unclear ───────────────────────────────────────────────

    "WhatsApp": {
        "pqc_support": "No (Signal Protocol supports PQXDH; WhatsApp deployment unconfirmed)",
        "pqc_capability_description": "End-to-end encrypted messaging with 2B+ users. Uses Signal Protocol (same as Signal app) with Curve25519, AES-256, and HMAC-SHA256. Signal has deployed PQXDH (ML-KEM) in its own app, but it is unconfirmed whether WhatsApp has enabled PQXDH in production. Meta has not announced PQC deployment in WhatsApp. Transport layer uses TLS via Meta's infrastructure.",
        "verification_status": "Needs Verification",
        "last_verified_date": TODAY,
        "evidence_flags": "pqxdh-deployment-unconfirmed",
    },
    "Snort IDS/IPS": {
        "pqc_capability_description": "Snort is the original open-source intrusion detection system, now maintained by Cisco. Snort 3.x includes TLS inspector capabilities. PQC-relevant detection rules for hybrid ML-KEM cipher suites are discussed for Snort 3.2+ community ruleset but no evidence of shipped PQC-specific rules was found. Used in academic and enterprise networks for network-level cryptographic monitoring.",
        "verification_status": "Needs Verification",
        "last_verified_date": TODAY,
        "evidence_flags": "pqc-detection-rules-unverified",
    },
    "Fortinet FortiAuthenticator": {
        "pqc_capability_description": "IAM and MFA product. Datasheet shows classical algorithms only (FIDO, RADIUS, LDAP, SAML). No PQC algorithms listed in product documentation. No PQC roadmap announced as of March 2026. Note: broader Fortinet Security Fabric is actively shipping PQC — FortiOS 7.6+ has ML-KEM IPsec and FortiOS 8.0 adds PQC certificates and management plane support. FortiAuthenticator PQC update is plausible in the near term.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "ARM Trusted Firmware (TF-A)": {
        "latest_version": "2.14.0",
        "release_date": "2026-03",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
    },
    "Adva Network Security FSP 3000 S-Flex": {
        "pqc_support": "Yes (PQC hybrid — specific algorithm unconfirmed; may not be Classic McEliece)",
        "pqc_capability_description": "World-first BSI-approved 400G quantum-safe Layer 1 network encryptor (September 2025). Uses AES-256 with hybrid crypto-agile key exchange combining PQC and classical Diffie-Hellman. ConnectGuard technology provides ultra-low-latency encryption. Protects against Harvest-Now-Decrypt-Later attacks. BSI certified. Note: product pages describe PQC generically; the specific claim of Classic McEliece could not be confirmed from web sources.",
        "verification_status": "Verified",
        "last_verified_date": TODAY,
        "evidence_flags": "classic-mceliece-unconfirmed; pqc-algorithm-generic; no-cert-backing",
    },
}


def apply_fixes():
    with open(SRC, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    applied = set()
    for row in rows:
        name = row["software_name"]
        if name in FIXES:
            for col, val in FIXES[name].items():
                if col in row:
                    row[col] = val
                else:
                    print(f"  WARNING: column '{col}' not in CSV for '{name}'", file=sys.stderr)
            applied.add(name)

    missed = set(FIXES.keys()) - applied
    if missed:
        print(f"\n⚠ {len(missed)} fixes NOT applied (name mismatch):", file=sys.stderr)
        for m in sorted(missed):
            print(f"  - {m}", file=sys.stderr)

    # Write back to the same file (r1)
    with open(SRC, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✓ Wrote {len(rows)} rows to {SRC.name}")
    print(f"✓ Applied round-2 fixes to {len(applied)} products")
    if missed:
        print(f"⚠ {len(missed)} fixes had name mismatches — check stderr")


if __name__ == "__main__":
    apply_fixes()
