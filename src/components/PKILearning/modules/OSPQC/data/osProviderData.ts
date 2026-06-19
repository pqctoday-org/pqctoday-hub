// SPDX-License-Identifier: GPL-3.0-only
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

export type OsPqcStatus = 'ga' | 'preview' | 'roadmap' | 'not-planned'

export interface OSVendorStatus {
  id: string
  vendor: string
  platform: string
  opensslVersion: string
  /**
   * Reference to the product's `software_name` in the central catalog
   * (`pqc_product_catalog_*.csv`). The headline `pqcStatus` is DERIVED from the
   * catalog via `getOsPqcStatus` — never stored here. The per-OS teaching detail
   * (openssl version / ssh / pkg-signing / ml-kem / ml-dsa / notes) stays
   * module-authored.
   */
  catalogName: string
  fipsMode: 'fips-140-3' | 'fips-140-2' | 'partial' | 'not-supported'
  sshPqcStatus: string
  pkgSigningPqc: string
  roadmapYear: string
  mlKemSupport: string
  mlDsaSupport: string
  notes: string
}

export type PqcStatusLabel = {
  label: string
  className: string
}

// ── Catalog-derived headline status ───────────────────────────────────────────
// An OS's overall PQC status is the SINGLE SOURCE OF TRUTH in the central product
// catalog. Map catalog availability → this module's display vocabulary.
const AVAIL_TO_PQC: Record<CatalogAvailability, OsPqcStatus> = {
  available: 'ga',
  partial: 'preview',
  roadmap: 'roadmap',
  none: 'not-planned',
  unverified: 'roadmap',
}

/** Headline PQC status for an OS, derived live from the central catalog. */
export function getOsPqcStatus(v: OSVendorStatus): OsPqcStatus {
  const status = getCatalogStatus(v.catalogName)
  return status ? AVAIL_TO_PQC[status.availability] : 'roadmap'
}

export const OS_VENDOR_STATUS_LABELS: Record<OsPqcStatus, PqcStatusLabel> = {
  ga: {
    label: 'GA',
    className: 'text-status-success bg-status-success/10 border-status-success/30',
  },
  preview: {
    label: 'Preview',
    className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  },
  roadmap: {
    label: 'Roadmap',
    className: 'text-status-info bg-status-info/10 border-status-info/30',
  },
  'not-planned': {
    label: 'Not Planned',
    className: 'text-muted-foreground bg-muted border-border',
  },
}

export const FIPS_STATUS_LABELS: Record<OSVendorStatus['fipsMode'], PqcStatusLabel> = {
  'fips-140-3': {
    label: 'FIPS 140-3',
    className: 'text-status-success bg-status-success/10 border-status-success/30',
  },
  'fips-140-2': {
    label: 'FIPS 140-2',
    className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  },
  partial: {
    label: 'FIPS Partial',
    className: 'text-status-info bg-status-info/10 border-status-info/30',
  },
  'not-supported': {
    label: 'No FIPS',
    className: 'text-muted-foreground bg-muted border-border',
  },
}

export const OS_VENDORS: OSVendorStatus[] = [
  {
    id: 'rhel',
    vendor: 'Red Hat',
    platform: 'RHEL 9.x / 10.x',
    opensslVersion: 'OpenSSL 3.5 (RHEL 10) / 3.0.7 (RHEL 9)',
    catalogName: 'Red Hat Enterprise Linux 10.2',
    fipsMode: 'fips-140-3',
    sshPqcStatus:
      'RHEL 10.2: OpenSSH ML-KEM SSH key exchange (mlkem768nistp256) default-on in all crypto policies',
    pkgSigningPqc:
      'RHEL 10.2 podman-sequoia composite PQC signatures; Red Hat Certificate System 11.0 integrates ML-DSA',
    roadmapYear: '2025 (RHEL 10.1 GA)',
    mlKemSupport:
      'ML-KEM GA in RHEL 10.1+ via OpenSSL 3.5 / GnuTLS / NSS; preferred by the default crypto policy',
    mlDsaSupport: 'ML-DSA GA in RHEL 10.1+ (OpenSSL/GnuTLS/NSS); ML-DSA TLS certificates supported',
    notes:
      'Verified 2026-06-19: catalog status available. RHEL 10.1+ ships GA NIST PQC across OpenSSL 3.5, GnuTLS, NSS and (10.2) OpenSSH — the default system-wide crypto policy enables and PREFERS hybrid ML-KEM key exchange, so TLS/SSH to/from RHEL 10.1+ use PQC by default. RHEL 10.0 was tech-preview; RHEL 9 (OpenSSL 3.0.7) has no PQC. CNSA 2.0 path via RHEL 10.',
  },
  {
    id: 'ubuntu',
    vendor: 'Canonical',
    platform: 'Ubuntu 26.04 LTS (Resolute Raccoon) / 25.10',
    opensslVersion: 'OpenSSL 3.5 (25.10 / 26.04) — 24.04 LTS is OpenSSL 3.0 (no PQC)',
    catalogName: 'Ubuntu 26.04 LTS',
    fipsMode: 'fips-140-3',
    sshPqcStatus: 'No production PQC SSH; tracking OpenSSH experimental branch',
    pkgSigningPqc: 'ML-DSA for APT package signing targeted for Ubuntu 26.04 LTS (DEP-18)',
    roadmapYear: '2025-2026 (24.04.1 / 24.10)',
    mlKemSupport: 'ML-KEM hybrid TLS in OpenSSL 3.0.x via oqsprovider or OpenSSL 3.5 native',
    mlDsaSupport: 'ML-DSA available via oqsprovider; native OpenSSL 3.5+ in Ubuntu 25.10+',
    notes:
      'Verified 2026-06-19: Canonical ships GA PQC in current releases (catalog tracks Ubuntu 26.04 LTS = available). Ubuntu 25.10 (OpenSSL 3.5.3, OpenSSH 10.0) and 26.04 LTS (OpenSSH 10.2p1) enable hybrid ML-KEM in TLS and SSH by default. The widely-deployed Ubuntu 24.04 LTS ships OpenSSL 3.0 and has NO native PQC — it is not backported (catalog: Ubuntu 24.04 LTS = none); PQC on 24.04 requires a manual oqsprovider build.',
  },
  {
    id: 'windows-server',
    vendor: 'Microsoft',
    platform: 'Windows Server 2025 / Windows 11 24H2',
    opensslVersion: 'CNG (native) + SymCrypt 103.4+',
    catalogName: 'Windows Server 2025',
    fipsMode: 'fips-140-3',
    sshPqcStatus: 'Win32-OpenSSH tracking upstream OpenSSH experimental PQC branch',
    pkgSigningPqc: 'Windows Update uses RSA-4096; ML-DSA code signing in Windows roadmap 2027',
    roadmapYear: '2025-11 (Nov 2025 Update)',
    mlKemSupport: 'ML-KEM-768 + X25519MLKEM768 GA in Schannel TLS 1.3 (Nov 2025 Update)',
    mlDsaSupport: 'ML-DSA in CNG planned for Windows Server 2026 / Windows 12',
    notes:
      'Windows Server 2025 is the most advanced OS for PQC TLS deployment. KB5036893 enables X25519MLKEM768 hybrid group in Schannel by default for TLS 1.3 connections. SymCrypt (the underlying crypto library) fully supports ML-KEM and ML-DSA. FIPS 140-3 certificate covers SymCrypt 103.4.0+.',
  },
  {
    id: 'debian',
    vendor: 'Debian Project',
    platform: 'Debian 13 (Trixie) / Debian 12 (Bookworm)',
    opensslVersion: 'OpenSSL 3.5.6 (Trixie) / 3.0.x (Bookworm)',
    catalogName: 'Debian 13 (Trixie)',
    fipsMode: 'not-supported',
    sshPqcStatus: 'No production PQC SSH; experimental package tracking OpenSSH PQC branch',
    pkgSigningPqc: 'DEP-18 proposal for ML-DSA APT signing; not yet scheduled',
    roadmapYear: '2026 (Trixie release)',
    mlKemSupport: 'ML-KEM in experimental repository; OpenSSL 3.3 baseline with oqsprovider',
    mlDsaSupport: 'ML-DSA in experimental; native OpenSSL 3.5+ planned for Debian 14 (Forky)',
    notes:
      'Verified 2026-06-19: catalog status partial. Debian 13 (Trixie, Aug 2025) ships OpenSSL 3.5.6, so TLS 1.3 negotiates the hybrid X25519MLKEM768 group by DEFAULT (inherited from OpenSSL, no config). Debian has no native PQC primitive of its own and no FIPS-certified crypto module. Debian 12 (Bookworm, OpenSSL 3.0) has no PQC (catalog: none).',
  },
  {
    id: 'alpine',
    vendor: 'Alpine Linux Project',
    platform: 'Alpine Linux 3.20+',
    opensslVersion: 'OpenSSL 3.5 (Alpine 3.22+) / 3.3.x (3.20)',
    catalogName: 'Alpine Linux',
    fipsMode: 'not-supported',
    sshPqcStatus: 'No production PQC SSH; OpenSSH experimental branch required',
    pkgSigningPqc: 'APK signing uses RSA-4096 GPG; PQC not on near-term roadmap',
    roadmapYear: '2024-11 (Alpine 3.21)',
    mlKemSupport: 'ML-KEM via liboqs-provider package on OpenSSL 3.3.x',
    mlDsaSupport: 'ML-DSA via liboqs-provider package on OpenSSL 3.3.x',
    notes:
      'Verified 2026-06-19: catalog status available. Alpine 3.22 ships OpenSSL 3.5, providing built-in ML-KEM/ML-DSA/SLH-DSA and hybrid X25519MLKEM768 TLS with no external plugin. Alpine uses musl libc and is the default base image for millions of Docker containers, so this makes a large container fleet quantum-safe in transit by default. (Alpine 3.20/3.21 on OpenSSL 3.3 needed the liboqs-provider package.)',
  },
  {
    id: 'freebsd',
    vendor: 'FreeBSD Project',
    platform: 'FreeBSD 14.x',
    opensslVersion: 'OpenSSL 3.0.x (base) + OpenSSH 10.0 (base, ML-KEM SSH) / 3.5 (ports)',
    catalogName: 'FreeBSD',
    fipsMode: 'not-supported',
    sshPqcStatus:
      'FreeBSD 14.4 base OpenSSH 10.0p2 uses hybrid mlkem768x25519-sha256 (NIST ML-KEM) by DEFAULT',
    pkgSigningPqc: 'pkg uses RSA-4096 repository signing; ML-DSA on 2026+ roadmap',
    roadmapYear: '2026-03 (FreeBSD 14.4)',
    mlKemSupport:
      'ML-KEM default-on in base OpenSSH 10.0 (SSH KEX); TLS PQC still needs OpenSSL 3.5 from ports',
    mlDsaSupport: 'Via security/oqsprovider port; pkg signing RSA only currently',
    notes:
      'Verified 2026-06-19: catalog status partial. FreeBSD 14.4 (Mar 2026) base OpenSSH 10.0p2 enables the hybrid mlkem768x25519-sha256 SSH key exchange by default (NIST ML-KEM). But base TLS is still OpenSSL 3.0 (no PQC) — PQC TLS requires OpenSSL 3.5 from ports. So PQC is default-on for SSH but not TLS: inherited and partial, not a native OS feature.',
  },
  {
    id: 'macos',
    vendor: 'Apple',
    platform: 'macOS 26 / iOS 26',
    opensslVersion: 'Security.framework (native) / Homebrew OpenSSL 3.x (user)',
    catalogName: 'iOS 26 / macOS 26',
    fipsMode: 'partial',
    sshPqcStatus: 'macOS ships OpenSSH 9.x; no PQC host key support in system SSH',
    pkgSigningPqc: 'macOS Gatekeeper / code signing uses ECDSA P-256; ML-DSA not yet',
    roadmapYear: '2026-02-11',
    mlKemSupport:
      'ML-KEM-768 in Security.framework (macOS 26+); Network.framework X25519MLKEM768 TLS 1.3',
    mlDsaSupport: 'ML-DSA in Security.framework (macOS 26+); CryptoKit API planned for Swift 6.x',
    notes:
      'Apple has implemented ML-KEM and ML-DSA in their proprietary Security.framework in macOS 26 and iOS 26. Network.framework uses X25519MLKEM768 for TLS 1.3 by default. No FIPS 140-3 certification for macOS — enterprises requiring FIPS must use Homebrew OpenSSL with separate FIPS module. iMessage uses ML-KEM for PQ3 protection (deployed March 2024, iOS 17.4).',
  },
  {
    id: 'android',
    vendor: 'Google (Android)',
    platform: 'Android 16',
    opensslVersion: 'BoringSSL (Conscrypt JCA provider)',
    catalogName: 'Android 16',
    fipsMode: 'partial',
    sshPqcStatus: 'N/A — Android does not run sshd in standard configurations',
    pkgSigningPqc: 'APK signing uses ECDSA P-256 / RSA-4096; ML-DSA on Android roadmap',
    roadmapYear: '2025-06',
    mlKemSupport:
      'Android 16: ML-KEM only at the app/Chrome layer (Chrome/WebView X25519MLKEM768 via BoringSSL); platform-level Keystore/Conscrypt PQC is Android 17',
    mlDsaSupport: 'Platform ML-DSA targeted for Android 17; APK signing migration post-2026',
    notes:
      'Verified 2026-06-19: catalog status is roadmap for Android 16. PQC reaches Android 16 only at the app layer (Chrome/WebView negotiate X25519MLKEM768 via their bundled BoringSSL); platform-level Keystore (TEE/StrongBox) and Conscrypt ML-DSA/ML-KEM are announced for Android 17, not shipping in 16. APK signing with ML-DSA pending a Conscrypt KeyStore API extension.',
  },
]
