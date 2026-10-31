// SPDX-License-Identifier: AGPL-3.0-only
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
    label: 'No FIPS cited',
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
    sshPqcStatus: '',
    pkgSigningPqc:
      'RHEL 10.2 podman-sequoia composite PQC signatures; Red Hat Certificate System 11.0 integrates ML-DSA',
    roadmapYear: '2025 (RHEL 10.1 GA)',
    mlKemSupport:
      'ML-KEM GA in RHEL 10.1+ via OpenSSL 3.5 / GnuTLS / NSS; preferred by the default crypto policy',
    mlDsaSupport: 'ML-DSA GA in RHEL 10.1+ (OpenSSL/GnuTLS/NSS); ML-DSA TLS certificates supported',
    notes: 'Verified 2026-06-19: catalog status available.',
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
      'Verified 2026-06-19: Canonical ships GA PQC in current releases (catalog tracks Ubuntu 26.04 LTS = available).',
  },
  {
    id: 'windows-server',
    vendor: 'Microsoft',
    platform: 'Windows Server 2025 / Windows 11 24H2',
    opensslVersion: 'CNG (native) + SymCrypt',
    catalogName: 'Windows Server 2025',
    fipsMode: 'fips-140-3',
    sshPqcStatus: 'Win32-OpenSSH tracking upstream OpenSSH experimental PQC branch',
    pkgSigningPqc:
      'This lesson cites no Microsoft statement on the Windows Update signing algorithm or on an ML-DSA code signing date',
    roadmapYear: '2025-11 (Nov 2025 Update)',
    mlKemSupport:
      'ML-KEM GA in CNG APIs (Nov 2025); Schannel TLS 1.3 hybrid groups (x25519_mlkem768 etc.) available from KB5089573 (Windows 11) and KB5099536 (Windows Server 2025, 14 July 2026), disabled by default',
    mlDsaSupport:
      'ML-DSA GA in CNG APIs since November 2025; SLH-DSA not implemented by the default CNG provider',
    notes:
      'The November 2025 GA covers the CNG APIs for ML-KEM and ML-DSA on Windows 11 24H2+ and Windows Server 2025; SLH-DSA is not implemented by the default CNG provider. Schannel TLS 1.3 hybrid key exchange (x25519_mlkem768, secp256r1_mlkem768, secp384r1_mlkem1024) is available from Windows 11 update KB5089573 (24H2 and 25H2) and, with the 14 July 2026 update KB5099536, on Windows Server 2025. Microsoft documents the groups as disabled by default, so enable them explicitly via Group Policy (ECC Curve Order) or TLS cmdlets; the Microsoft TLS Supported Groups page still mentions Insider builds, so confirm the behaviour on your build. SymCrypt (the underlying crypto library) supports ML-KEM (final FIPS 203 from release 103.5.0) and ML-DSA (from 103.7.0). The SymCrypt FIPS 140-3 certificate (CMVP #5313) lists no ML-KEM or ML-DSA in the Hub CMVP snapshot; Microsoft notes the legacy FIPS mode setting is no longer recommended, and using FIPS-approved algorithms is the configuration that matters.',
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
    notes: 'Verified 2026-06-19: catalog status partial.',
  },
  {
    id: 'alpine',
    vendor: 'Alpine Linux Project',
    platform: 'Alpine Linux 3.20+',
    opensslVersion: 'OpenSSL 3.5 (Alpine 3.22+) / 3.3.x (3.20)',
    catalogName: 'Alpine Linux',
    fipsMode: 'not-supported',
    sshPqcStatus: 'No production PQC SSH; OpenSSH experimental branch required',
    pkgSigningPqc: 'APK signing uses RSA-4096 GPG',
    roadmapYear: '2024-11 (Alpine 3.21)',
    mlKemSupport: 'ML-KEM via liboqs-provider package on OpenSSL 3.3.x',
    mlDsaSupport: 'ML-DSA via liboqs-provider package on OpenSSL 3.3.x',
    notes:
      'Verified 2026-06-19: catalog status available. Alpine 3.22 ships OpenSSL 3.5, providing built-in ML-KEM/ML-DSA/SLH-DSA and hybrid X25519MLKEM768 TLS with no external plugin. (Alpine 3.20/3.21 on OpenSSL 3.3 needed the liboqs-provider package.)',
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
    pkgSigningPqc:
      'pkg uses RSA/ECDSA signatures to verify manifests and binaries (Mapping Quantum Threats, arXiv:2509.24623v2, March 2026)',
    roadmapYear: '2026-03 (FreeBSD 14.4)',
    mlKemSupport:
      'ML-KEM default-on in base OpenSSH 10.0 (SSH KEX); TLS PQC still needs OpenSSL 3.5 from ports',
    mlDsaSupport: 'Via security/oqsprovider port; pkg signing uses RSA/ECDSA signatures',
    notes:
      'Verified 2026-06-19: catalog status partial. FreeBSD 14.4 (Mar 2026) base OpenSSH 10.0p2 enables the hybrid mlkem768x25519-sha256 SSH key exchange by default (NIST ML-KEM). But base TLS is still OpenSSL 3.0 (no PQC) — PQC TLS requires OpenSSL 3.5 from ports (not sourced in the Library). So PQC is default-on for SSH but not TLS: inherited and partial, not a native OS feature.',
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
    notes: '',
  },
  {
    id: 'android',
    vendor: 'Google (Android)',
    platform: 'Android 16',
    opensslVersion: 'BoringSSL (Conscrypt JCA provider)',
    catalogName: 'Android 16',
    fipsMode: 'partial',
    sshPqcStatus: 'N/A — Android does not run sshd in standard configurations',
    pkgSigningPqc:
      'Android 17 introduces APK Signature Scheme v3.2, a hybrid scheme that signs an APK with both a classical algorithm (such as RSA or ECDSA) and a PQC algorithm',
    roadmapYear: '2025-06',
    mlKemSupport:
      'The Google Security Blog post cited here describes Android 17 ML-DSA work; it does not mention ML-KEM or Android 16',
    mlDsaSupport:
      'Android 17: ML-DSA in Android Verified Boot and Android Keystore (ML-DSA-65 and ML-DSA-87), per the Google Security Blog, 25 March 2026',
    notes:
      'The Google Security Blog post "Security for the Quantum Era: Implementing Post-Quantum Cryptography in Android" (25 March 2026) describes Android 17 upgrades: ML-DSA in Android Verified Boot, ML-DSA support in Android Keystore (the SDK exposes ML-DSA-65 and ML-DSA-87), and hybrid signatures for APKs. The Android Open Source Project documentation says Android 17 introduces APK Signature Scheme v3.2, a hybrid scheme that requires signing an APK with both a classical algorithm, like RSA or ECDSA, and a PQC algorithm. The same documentation says that on Android 16 (API level 36) and lower platform releases the platform does not process this hybrid signature block; the blog post does not mention Android 16.',
  },
]
