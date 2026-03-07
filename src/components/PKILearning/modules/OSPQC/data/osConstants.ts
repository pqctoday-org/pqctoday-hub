// SPDX-License-Identifier: GPL-3.0-only

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
  status: 'production' | 'experimental' | 'planned'
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
      'ML-KEM (FIPS 203) and ML-DSA (FIPS 204) available as built-in EVP algorithms in OpenSSL 3.4+. Older 3.x distro packages require oqsprovider plugin. System-wide configuration via openssl.cnf groups directive.',
  },
  {
    id: 'windows-cng',
    name: 'Windows CNG (BCrypt/NCrypt)',
    platform: 'Windows Server 2025 / Windows 11 24H2',
    type: 'userspace',
    pqcStatus: 'supported',
    version: 'CNG v10+ (KB5036893)',
    notes:
      'ML-KEM-768 and ML-KEM-1024 added in KB5036893 (April 2024). Schannel TLS 1.3 supports X25519MLKEM768 hybrid group. ML-DSA signing via CNG planned for Windows Server 2026.',
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
      'ML-KEM-768 hybrid TLS 1.3 (X25519MLKEM768) enabled by default in Firefox 128+. Chrome 131+ uses X25519MLKEM768 by default. ML-DSA support in NSS is not yet available; PQC signature algorithm integration is on the roadmap.',
  },
]

export const PACKAGE_FORMATS: PackageFormat[] = [
  {
    id: 'rpm',
    name: 'RPM (Red Hat Package Manager)',
    tool: 'rpm-sign, gpg, dnf',
    currentSigningAlgo: 'GPG RSA-4096 or ECDSA P-256',
    pqcMigrationPath:
      'ML-DSA-65 via libgcrypt PQC patch (experimental) OR sigstore-style detached signature with ML-DSA',
    status: 'experimental',
    notes:
      'RPM v4.19+ supports pluggable signature backends. RHEL crypto team evaluating ML-DSA for RHEL 11 package signing. Current GPG v2.3+ does not natively support ML-DSA — requires oqsprovider patch or sigstore.',
  },
  {
    id: 'deb',
    name: 'DEB (Debian/Ubuntu)',
    tool: 'dpkg-sig, reprepro, apt-sign',
    currentSigningAlgo: 'GPG RSA-4096',
    pqcMigrationPath:
      'ML-DSA-65 via GnuPG PQC extension OR Debian archive signing key migration to ML-DSA',
    status: 'planned',
    notes:
      'Debian Project tracking PQC signing as DEP-18. Ubuntu 26.04 LTS target for ML-DSA package signing support. InRelease file signing requires apt client updates to verify ML-DSA signatures.',
  },
  {
    id: 'flatpak',
    name: 'Flatpak',
    tool: 'flatpak-builder, OSTree',
    currentSigningAlgo: 'GPG Ed25519 / RSA-4096',
    pqcMigrationPath: 'OSTree summary signature migration to ML-DSA when libgpgme supports PQC',
    status: 'planned',
    notes:
      'Flathub repository signing depends on OSTree GPG implementation. ML-DSA support requires upstream libgpgme + OSTree changes. Timeline: 2027-2028.',
  },
  {
    id: 'snap',
    name: 'Snap (Canonical)',
    tool: 'snapcraft, snap-store',
    currentSigningAlgo: 'RSA-4096 (Snap Store authority)',
    pqcMigrationPath: 'Snap Store backend migration to ML-DSA (Canonical roadmap 2027)',
    status: 'planned',
    notes:
      'Snap packages are signed by the Snap Store. Client-side verification requires snapd update. Canonical has indicated PQC signing in Ubuntu 26.04 LTS timeframe.',
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
    opensshSupport: 'OpenSSH 10.0+ (draft RFC)',
    rfcStatus: 'draft-ietf-sshm-mldsa (active WG draft)',
    notes:
      'IETF SSHM WG draft for ssh-mldsa44/65/87 key types. OpenSSH experimental branch available. Hybrid ssh-ecdsa-nistp256-mldsa65 also drafted. Not yet in any production OpenSSH release.',
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
    policyMechanism: 'Schannel registry + PowerShell TLS cmdlets',
    defaultPolicy: 'TLS 1.3 + X25519MLKEM768 hybrid (KB5036893+)',
    pqcPolicy: 'X25519MLKEM768 enabled by default in TLS 1.3 ClientHello',
    command: 'Set-TlsCipherSuite -Name "TLS_AES_256_GCM_SHA384" -Position 0 (via PowerShell)',
    notes:
      'Windows Server 2025 with KB5036893 includes ML-KEM-768 hybrid TLS. Schannel automatically negotiates X25519MLKEM768 in TLS 1.3. Group priority is managed via registry HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Cryptography\\Configuration\\Local\\SSL.',
  },
]
