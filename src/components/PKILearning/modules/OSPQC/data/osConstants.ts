// SPDX-License-Identifier: AGPL-3.0-only

export interface OSPlatform {
  id: string
  name: string
  family: 'linux' | 'windows' | 'bsd' | 'macos' | 'android'
  packageManager: string
  cryptoFramework: string
  fipsCapable: boolean
}

export interface CryptoSubsystem {
  id: string
  name: string
  platform: string
  type: 'kernel' | 'userspace' | 'browser'
  pqcStatus: 'supported' | 'partial' | 'roadmap' | 'not-supported'
  version: string
  notes: string
}

export interface PackageFormat {
  id: string
  name: string
  tool: string
  currentSigningAlgo: string
  pqcMigrationPath: string
  status: 'production' | 'experimental' | 'planned' | 'unverified'
  notes: string
}

export interface SSHKeyType {
  id: string
  keyType: string
  algorithm: string
  publicKeyBytes: number
  signatureBytes: number
  quantumSafe: boolean
  opensshSupport: string
  rfcStatus: string
  notes: string
}

export interface SystemTLSPolicy {
  id: string
  os: string
  policyMechanism: string
  defaultPolicy: string
  pqcPolicy: string
  command: string
  notes: string
}

export const OS_PLATFORMS: OSPlatform[] = [
  {
    id: 'rhel',
    name: 'RHEL / CentOS Stream 9+',
    family: 'linux',
    packageManager: 'dnf / rpm',
    cryptoFramework: 'OpenSSL 3.0.x + crypto-policies',
    fipsCapable: true,
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu 24.04 LTS (Noble)',
    family: 'linux',
    packageManager: 'apt / dpkg',
    cryptoFramework: 'OpenSSL 3.2.x + update-crypto-policies',
    fipsCapable: true,
  },
  {
    id: 'windows-server',
    name: 'Windows Server 2025',
    family: 'windows',
    packageManager: 'winget / WSUS',
    cryptoFramework: 'CNG (Cryptography Next Generation) + Schannel',
    fipsCapable: true,
  },
  {
    id: 'macos',
    name: 'macOS 15 Sequoia',
    family: 'macos',
    packageManager: 'Homebrew / pkg',
    cryptoFramework: 'Security.framework + Network.framework',
    fipsCapable: false,
  },
  {
    id: 'freebsd',
    name: 'FreeBSD 14.x',
    family: 'bsd',
    packageManager: 'pkg / ports',
    cryptoFramework: 'OpenSSL 3.x (base) + LibreSSL (ports)',
    fipsCapable: false,
  },
  {
    id: 'alpine',
    name: 'Alpine Linux 3.20+',
    family: 'linux',
    packageManager: 'apk',
    cryptoFramework: 'musl libc + LibreSSL / OpenSSL (configurable)',
    fipsCapable: false,
  },
]

export const CRYPTO_SUBSYSTEMS: CryptoSubsystem[] = [
  {
    id: 'linux-cryptoapi',
    name: 'Linux Kernel CryptoAPI',
    platform: 'Linux (all distros)',
    type: 'kernel',
    pqcStatus: 'partial',
    version: 'Linux 6.x',
    notes:
      'Linux kernel PQC support is in active development (experimental patchset stage). Most PQC operations occur in userspace via OpenSSL or other crypto libraries. Kernel CryptoAPI may gain ML-KEM/ML-DSA in future releases pending upstream acceptance.',
  },
  {
    id: 'openssl-3x',
    name: 'OpenSSL 3.x (system)',
    platform: 'Linux, macOS, FreeBSD',
    type: 'userspace',
    pqcStatus: 'supported',
    version: 'OpenSSL 3.3+',
    notes:
      'ML-KEM (FIPS 203) and ML-DSA (FIPS 204) available as built-in EVP algorithms in OpenSSL 3.5.0 and later. Older 3.x distro packages require oqsprovider plugin. System-wide configuration via openssl.cnf groups directive.',
  },
  {
    id: 'windows-cng',
    name: 'Windows CNG (BCrypt/NCrypt)',
    platform: 'Windows Server 2025 / Windows 11 24H2',
    type: 'userspace',
    pqcStatus: 'supported',
    version: 'Windows 11 24H2+ / Server 2025 (Nov 2025)',
    notes:
      'ML-KEM and ML-DSA APIs GA in CNG since November 2025 on Windows 11 24H2+ and Windows Server 2025; SLH-DSA is not implemented by the default CNG provider. Schannel TLS 1.3 hybrid key exchange (x25519_mlkem768, secp256r1_mlkem768, secp384r1_mlkem1024) is available from Windows 11 update KB5089573 (24H2 and 25H2) and, with the 14 July 2026 update KB5099536, on Windows Server 2025. Microsoft documents the groups as disabled by default, so enable them explicitly via Group Policy (ECC Curve Order) or TLS cmdlets; the Microsoft TLS Supported Groups page still mentions Insider builds, so confirm the behaviour on your build.',
  },
  {
    id: 'gnutls',
    name: 'GnuTLS',
    platform: 'Linux (GNOME, system daemons)',
    type: 'userspace',
    pqcStatus: 'partial',
    version: 'GnuTLS 3.8.x',
    notes:
      'ML-KEM hybrid TLS groups (X25519MLKEM768) in GnuTLS 3.8.3+. ML-DSA certificate support planned for 4.x. Used by curl, wget, NetworkManager, and systemd-resolved on many distros.',
  },
  {
    id: 'nss',
    name: 'NSS (Firefox / Chrome)',
    platform: 'Cross-platform (browser)',
    type: 'browser',
    pqcStatus: 'supported',
    version: 'NSS 3.101+',
    notes:
      'ML-KEM-768 hybrid TLS 1.3 (X25519MLKEM768) enabled by default in Firefox 132+. Chrome 131+ uses X25519MLKEM768 by default.',
  },
]

export const PACKAGE_FORMATS: PackageFormat[] = [
  {
    id: 'rpm',
    name: 'RPM (Red Hat Package Manager)',
    tool: 'rpmsign, rpmkeys, sq (Sequoia), dnf',
    currentSigningAlgo: 'OpenPGP RSA signatures (RPM v4)',
    pqcMigrationPath:
      'RPM 6.0.0 and later can carry several OpenPGP signatures per package, including OpenPGP v6 and PQC keys and signatures. Red Hat signs RHEL 10.1 packages with a hybrid ML-DSA-87 + Ed448 key in addition to its RSA key.',
    status: 'experimental',
    notes:
      'RPM 6.0.0 (22 September 2025) lists support for OpenPGP v6 and PQC keys and signatures and for multiple signatures per package; verification uses a Sequoia back end. Red Hat reports that its first post-quantum signed package was ipmitool-1.8.19-10.el10_1 (RHBA-2025:23156) and that packages are still also signed with the RSA key: systems that understand RPM 6 signatures verify both, older systems verify only the RSA signature. Red Hat describes its procedure for signing your own RPMs as a technology preview that is not intended for production use. The detached ML-DSA signature in this workshop is a lab example that no package manager checks.',
  },
  {
    id: 'deb',
    name: 'DEB (Debian/Ubuntu)',
    tool: 'dpkg-sig, reprepro, apt-ftparchive',
    currentSigningAlgo: 'OpenPGP signature on InRelease (sample in this lesson: RSA-4096)',
    pqcMigrationPath:
      'This lesson cites no Debian or Ubuntu plan, date or release for ML-DSA archive or package signatures.',
    status: 'unverified',
    notes:
      'DEP-18 is the Debian Enhancement Proposal "Encourage Continuous Integration and Merge Request based Collaboration for Debian packages"; it is about packaging workflow, not post-quantum signatures, so it is not cited here. An archive could only switch once the apt client verifies the new signature type. Check the Debian and Ubuntu release notes for the current position.',
  },
  {
    id: 'flatpak',
    name: 'Flatpak',
    tool: 'flatpak-builder, OSTree',
    currentSigningAlgo: 'GPG Ed25519 / RSA-4096',
    pqcMigrationPath: 'OSTree summary signature migration to ML-DSA when libgpgme supports PQC',
    status: 'planned',
    notes: 'Flathub repository signing depends on OSTree GPG implementation.',
  },
  {
    id: 'snap',
    name: 'Snap (Canonical)',
    tool: 'snapcraft, snap-store',
    currentSigningAlgo: 'RSA-4096 (Snap Store authority)',
    pqcMigrationPath: 'Snap Store backend migration to ML-DSA',
    status: 'planned',
    notes:
      'Snap packages are signed by the Snap Store. Client-side verification requires snapd update.',
  },
  {
    id: 'homebrew',
    name: 'Homebrew (macOS)',
    tool: 'brew, git, SHA-256 checksums',
    currentSigningAlgo: 'SHA-256 checksums + HTTPS (no package signature)',
    pqcMigrationPath:
      'No traditional package signing — relies on HTTPS and git commit signing. Could adopt ML-DSA for bottle signing.',
    status: 'planned',
    notes:
      'Homebrew uses HTTPS download integrity, not cryptographic signatures. A proposal for ML-DSA bottle signing exists but is not scheduled. Migration risk is lower than RPM/DEB.',
  },
]

export const SSH_HOST_KEY_TYPES: SSHKeyType[] = [
  {
    id: 'rsa-4096',
    keyType: 'ssh-rsa',
    algorithm: 'RSA-4096',
    publicKeyBytes: 512,
    signatureBytes: 512,
    quantumSafe: false,
    opensshSupport: 'OpenSSH 5.x+ (deprecated in 9.x)',
    rfcStatus: 'RFC 4253 (2006)',
    notes: 'Deprecated in OpenSSH 9.0. Still widely supported for legacy compatibility.',
  },
  {
    id: 'ecdsa-256',
    keyType: 'ecdsa-sha2-nistp256',
    algorithm: 'ECDSA P-256',
    publicKeyBytes: 65,
    signatureBytes: 64,
    quantumSafe: false,
    opensshSupport: 'OpenSSH 5.7+',
    rfcStatus: 'RFC 5656 (2009)',
    notes: "Quantum-vulnerable to Shor's algorithm. Smaller keys than RSA but same security risk.",
  },
  {
    id: 'ed25519',
    keyType: 'ssh-ed25519',
    algorithm: 'Ed25519 (Curve25519)',
    publicKeyBytes: 32,
    signatureBytes: 64,
    quantumSafe: false,
    opensshSupport: 'OpenSSH 6.5+ (recommended classical)',
    rfcStatus: 'RFC 8709 (2020)',
    notes: 'Current best-practice classical key. Still quantum-vulnerable — Shor breaks Ed25519.',
  },
  {
    id: 'mldsa65',
    keyType: 'ssh-mldsa65',
    algorithm: 'ML-DSA-65 (FIPS 204)',
    publicKeyBytes: 1952,
    signatureBytes: 3309,
    quantumSafe: true,
    opensshSupport: 'Not named in the OpenSSH 10.0, 10.4 or 10.6 release notes',
    rfcStatus:
      'draft-sfluhrer-ssh-mldsa (Internet-Draft, revision 08 when checked; not a standard)',
    notes:
      'The Internet-Draft draft-sfluhrer-ssh-mldsa (revision 08 when checked; expires 1 March 2027) names the key types ssh-mldsa-44, ssh-mldsa-65 and ssh-mldsa-87, written with hyphens. Composite ML-DSA signatures for SSH are in draft-ietf-sshm-composite-sigs-00 (SSHM working group, 21 August 2026, Intended Status: Standards Track), which specifies ssh-mldsa44-ed25519 and ssh-mldsa87-p384; OpenSSH 10.6 (6 October 2026) enables ssh-mldsa44-ed25519. Another Internet-Draft, draft-sun-ssh-composite-sigs-03, describes further composite types such as ssh-mldsa65-es256. An Internet-Draft is a work in progress, not a standard.',
  },
]

export const SYSTEM_TLS_POLICIES: SystemTLSPolicy[] = [
  {
    id: 'rhel-crypto-policies',
    os: 'RHEL / CentOS Stream',
    policyMechanism: 'crypto-policies',
    defaultPolicy: 'DEFAULT (TLS 1.2+, RSA-2048+, AES-128+)',
    pqcPolicy: 'FUTURE:PQCONLY (draft) — experimental in RHEL 10',
    command: 'update-crypto-policies --set FUTURE',
    notes:
      'RHEL crypto-policies controls system-wide TLS, SSH, IPsec, and Kerberos settings. The FUTURE policy enables TLS 1.3-only and post-quantum groups. A PQCONLY subpolicy is in development for RHEL 10.',
  },
  {
    id: 'ubuntu-openssl',
    os: 'Ubuntu 24.04 LTS',
    policyMechanism: '/etc/ssl/openssl.cnf + update-crypto-policies',
    defaultPolicy: 'DEFAULT (TLS 1.2+, ECDHE, RSA-2048+)',
    pqcPolicy: 'TLS 1.3 groups = x25519mlkem768:x25519:P-256',
    command: 'openssl.cnf: Groups = x25519mlkem768:x25519:prime256v1',
    notes:
      'Ubuntu 24.04 ships OpenSSL 3.2.x with ML-KEM hybrid TLS groups available. System-wide config via /etc/ssl/openssl.cnf. The oqsprovider package enables additional PQC algorithms. update-crypto-policies backported from RHEL.',
  },
  {
    id: 'windows-schannel',
    os: 'Windows Server 2025',
    policyMechanism: 'Schannel Group Policy + PowerShell TLS cmdlets',
    defaultPolicy: 'TLS 1.3 with classical groups; PQC hybrid disabled by default',
    pqcPolicy:
      'x25519_mlkem768 is available from KB5089573 (Windows 11) and KB5099536 (Windows Server 2025, 14 July 2026): disabled by default, enable via Group Policy or TLS cmdlets',
    command:
      'Enable-TlsEccCurve / Group Policy: SSL Configuration Settings → ECC Curve Order (add X25519MLKEM768)',
    notes:
      'CNG PQC APIs (ML-KEM and ML-DSA) are GA since November 2025; SLH-DSA is not implemented by the default CNG provider. Schannel TLS 1.3 hybrid key exchange (x25519_mlkem768) is available from Windows 11 update KB5089573 (24H2 and 25H2) and, with the 14 July 2026 update KB5099536, on Windows Server 2025. Microsoft documents the groups as disabled by default, so enable them explicitly via Group Policy (ECC Curve Order) or TLS cmdlets; the Microsoft TLS Supported Groups page still mentions Insider builds, so confirm the behaviour on your build.',
  },
]
