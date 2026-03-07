// SPDX-License-Identifier: GPL-3.0-only

export interface OSVendorStatus {
  id: string
  vendor: string
  platform: string
  opensslVersion: string
  pqcStatus: 'ga' | 'preview' | 'roadmap' | 'not-planned'
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

export const OS_VENDOR_STATUS_LABELS: Record<OSVendorStatus['pqcStatus'], PqcStatusLabel> = {
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
    opensslVersion: 'OpenSSL 3.0.7 (RHEL 9) / 3.4.x (RHEL 10)',
    pqcStatus: 'preview',
    fipsMode: 'fips-140-3',
    sshPqcStatus: 'No production SSH PQC keys yet; draft ssh-mldsa65 tracking',
    pkgSigningPqc: 'Evaluating ML-DSA for RHEL 11 package signing via rpm-sign',
    roadmapYear: '2026-2027 (RHEL 10)',
    mlKemSupport: 'ML-KEM preview in RHEL 10 via OpenSSL 3.4+ + oqsprovider',
    mlDsaSupport: 'ML-DSA preview in RHEL 10; FIPS cert pending for PQC OpenSSL module',
    notes:
      'RHEL 9 FIPS mode uses OpenSSL 3.0.7 with FIPS 140-3 certificate — this module does NOT yet include ML-KEM or ML-DSA. RHEL 10 targets OpenSSL 3.4+ with PQC FIPS module under validation. crypto-policies FUTURE policy adds hybrid TLS groups. CNSA 2.0 compliance path via RHEL 10.',
  },
  {
    id: 'ubuntu',
    vendor: 'Canonical',
    platform: 'Ubuntu 24.04 LTS (Noble Numbat)',
    opensslVersion: 'OpenSSL 3.2.x (base) / 3.4.x (24.04.1+)',
    pqcStatus: 'preview',
    fipsMode: 'fips-140-3',
    sshPqcStatus: 'No production PQC SSH; tracking OpenSSH experimental branch',
    pkgSigningPqc: 'ML-DSA for APT package signing targeted for Ubuntu 26.04 LTS (DEP-18)',
    roadmapYear: '2025-2026 (24.04.1 / 24.10)',
    mlKemSupport: 'ML-KEM hybrid TLS in OpenSSL 3.2+ via oqsprovider or OpenSSL 3.5 native',
    mlDsaSupport: 'ML-DSA available via oqsprovider; native OpenSSL 3.5+ in Ubuntu 25.10+',
    notes:
      'Ubuntu 24.04 ships with OpenSSL 3.2.x. ML-KEM hybrid TLS groups (x25519mlkem768) configurable in /etc/ssl/openssl.cnf. Ubuntu FIPS 140-3 certification covers OpenSSL 3.0.x module — PQC algorithms not yet in certified FIPS module. Ubuntu Pro subscribers can enable FIPS mode.',
  },
  {
    id: 'windows-server',
    vendor: 'Microsoft',
    platform: 'Windows Server 2025 / Windows 11 24H2',
    opensslVersion: 'CNG (native) + SymCrypt 103.4+',
    pqcStatus: 'ga',
    fipsMode: 'fips-140-3',
    sshPqcStatus: 'Win32-OpenSSH tracking upstream OpenSSH experimental PQC branch',
    pkgSigningPqc: 'Windows Update uses RSA-4096; ML-DSA code signing in Windows roadmap 2027',
    roadmapYear: '2024 (ML-KEM GA via KB5036893)',
    mlKemSupport: 'ML-KEM-768 + X25519MLKEM768 GA in Schannel TLS 1.3 (KB5036893, April 2024)',
    mlDsaSupport: 'ML-DSA in CNG planned for Windows Server 2026 / Windows 12',
    notes:
      'Windows Server 2025 is the most advanced OS for PQC TLS deployment. KB5036893 enables X25519MLKEM768 hybrid group in Schannel by default for TLS 1.3 connections. SymCrypt (the underlying crypto library) fully supports ML-KEM and ML-DSA. FIPS 140-3 certificate covers SymCrypt 103.4.0+.',
  },
  {
    id: 'debian',
    vendor: 'Debian Project',
    platform: 'Debian 13 (Trixie) / Debian 12 (Bookworm)',
    opensslVersion: 'OpenSSL 3.3.x (Trixie) / 3.0.x (Bookworm)',
    pqcStatus: 'preview',
    fipsMode: 'not-supported',
    sshPqcStatus: 'No production PQC SSH; experimental package tracking OpenSSH PQC branch',
    pkgSigningPqc: 'DEP-18 proposal for ML-DSA APT signing; not yet scheduled',
    roadmapYear: '2026 (Trixie release)',
    mlKemSupport: 'ML-KEM in experimental repository; OpenSSL 3.3 baseline with oqsprovider',
    mlDsaSupport: 'ML-DSA in experimental; native OpenSSL 3.5+ planned for Debian 14 (Forky)',
    notes:
      'Debian 13 (Trixie) ships with OpenSSL 3.3 which supports PQC algorithms via oqsprovider. No FIPS mode — Debian does not maintain a FIPS-certified crypto module. PQC adoption depends on upstream OpenSSL. Debian stable releases are conservative; PQC production use requires experimental packages.',
  },
  {
    id: 'alpine',
    vendor: 'Alpine Linux Project',
    platform: 'Alpine Linux 3.20+',
    opensslVersion: 'LibreSSL 3.9.x (default) / OpenSSL 3.x (optional)',
    pqcStatus: 'roadmap',
    fipsMode: 'not-supported',
    sshPqcStatus: 'LibreSSL does not support PQC SSH; requires OpenSSL package swap',
    pkgSigningPqc: 'APK signing uses RSA-4096 GPG; PQC not on near-term roadmap',
    roadmapYear: '2027+ (dependent on LibreSSL upstream)',
    mlKemSupport: 'Not in LibreSSL; available via alpine-openssl package (manual swap)',
    mlDsaSupport: 'Not in LibreSSL; available via alpine-openssl package (manual swap)',
    notes:
      'Alpine Linux defaults to LibreSSL which has slow PQC adoption. Container workloads on Alpine requiring PQC must replace LibreSSL with OpenSSL 3.x + oqsprovider. musl libc does not affect crypto but the Alpine package size philosophy creates friction for larger PQC key material. Popular in container images — PQC migration requires Dockerfile changes.',
  },
  {
    id: 'freebsd',
    vendor: 'FreeBSD Project',
    platform: 'FreeBSD 14.x',
    opensslVersion: 'OpenSSL 3.0.x (base system) / 3.x (ports)',
    pqcStatus: 'roadmap',
    fipsMode: 'not-supported',
    sshPqcStatus: 'Base OpenSSH 9.x; no PQC host key support in base system',
    pkgSigningPqc: 'pkg uses RSA-4096 repository signing; ML-DSA on 2026+ roadmap',
    roadmapYear: '2026 (FreeBSD 15)',
    mlKemSupport: 'Available via security/oqsprovider port; not in base OpenSSL',
    mlDsaSupport: 'Available via security/oqsprovider port; pkg signing RSA only currently',
    notes:
      'FreeBSD 14 base system uses OpenSSL 3.0.x which predates native PQC. The ports collection offers security/openssl-quic and security/oqsprovider for PQC-capable builds. FreeBSD 15 (2026) targets OpenSSL 3.4+ in base. pkg repository signing migration to ML-DSA is tracked in FreeBSD quarterly reviews.',
  },
  {
    id: 'macos',
    vendor: 'Apple',
    platform: 'macOS 15 Sequoia / macOS 14 Sonoma',
    opensslVersion: 'Security.framework (native) / Homebrew OpenSSL 3.x (user)',
    pqcStatus: 'ga',
    fipsMode: 'partial',
    sshPqcStatus: 'macOS ships OpenSSH 9.x; no PQC host key support in system SSH',
    pkgSigningPqc: 'macOS Gatekeeper / code signing uses ECDSA P-256; ML-DSA not yet',
    roadmapYear: '2024 (ML-KEM in Security.framework)',
    mlKemSupport:
      'ML-KEM-768 in Security.framework (macOS 15+); Network.framework X25519MLKEM768 TLS 1.3',
    mlDsaSupport: 'ML-DSA in Security.framework (macOS 15+); CryptoKit API planned for Swift 6.x',
    notes:
      'Apple has implemented ML-KEM and ML-DSA in their proprietary Security.framework in macOS 15 and iOS 18. Network.framework uses X25519MLKEM768 for TLS 1.3 by default. No FIPS 140-3 certification for macOS — enterprises requiring FIPS must use Homebrew OpenSSL with separate FIPS module. iMessage uses ML-KEM for PQ3 protection (deployed March 2024, iOS 17.4).',
  },
  {
    id: 'android',
    vendor: 'Google (Android)',
    platform: 'Android 14+ / Android 15',
    opensslVersion: 'BoringSSL (Conscrypt JCA provider)',
    pqcStatus: 'ga',
    fipsMode: 'partial',
    sshPqcStatus: 'N/A — Android does not run sshd in standard configurations',
    pkgSigningPqc: 'APK signing uses ECDSA P-256 / RSA-4096; ML-DSA on Android roadmap',
    roadmapYear: '2024-2025 (ML-KEM GA in Android 15)',
    mlKemSupport:
      'ML-KEM-768 GA in Android 15 via Conscrypt + BoringSSL; X25519MLKEM768 in Chrome Android',
    mlDsaSupport: 'ML-DSA in Android 15 BoringSSL; APK signing migration post-2026',
    notes:
      "Android uses BoringSSL (Google's OpenSSL fork) via the Conscrypt JCA/JCE provider. Android 15 ships BoringSSL with ML-KEM enabled for TLS. The Android Keystore system (backed by TEE/StrongBox) does not yet support PQC key storage — ML-KEM and ML-DSA operations run in Conscrypt userspace. APK signing with ML-DSA pending Conscrypt KeyStore API extension.",
  },
]
