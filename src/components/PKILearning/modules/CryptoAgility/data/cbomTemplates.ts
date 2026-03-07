// SPDX-License-Identifier: GPL-3.0-only
import type { InfrastructureLayerType } from '@/components/Migrate/InfrastructureStack'

export interface CBOMEntry {
  id: string
  component: string
  location: string
  algorithm: string
  keySize: number
  usage: string
  quantumStatus: 'vulnerable' | 'safe' | 'weakened'
  recommendation: string
  infrastructureLayer: Exclude<InfrastructureLayerType, 'All'>
}

export const SAMPLE_CBOM: CBOMEntry[] = [
  {
    id: 'tls-server',
    component: 'Web Server (nginx)',
    location: '/etc/nginx/ssl/',
    algorithm: 'RSA-2048',
    keySize: 2048,
    usage: 'TLS server certificate signing',
    quantumStatus: 'vulnerable',
    recommendation: 'Migrate to ML-DSA-65 or composite certificate',
    infrastructureLayer: 'Application',
  },
  {
    id: 'tls-kex',
    component: 'Web Server (nginx)',
    location: 'TLS 1.3 handshake',
    algorithm: 'X25519',
    keySize: 256,
    usage: 'TLS key exchange (ECDHE)',
    quantumStatus: 'vulnerable',
    recommendation: 'Enable X25519MLKEM768 hybrid key exchange',
    infrastructureLayer: 'Application',
  },
  {
    id: 'tls-cipher',
    component: 'Web Server (nginx)',
    location: 'TLS 1.3 record layer',
    algorithm: 'AES-256-GCM',
    keySize: 256,
    usage: 'Symmetric encryption of TLS records',
    quantumStatus: 'safe',
    recommendation: 'No action required — AES-256 provides 128-bit post-quantum security',
    infrastructureLayer: 'Application',
  },
  {
    id: 'db-tde',
    component: 'Database (PostgreSQL)',
    location: 'Tablespace encryption',
    algorithm: 'AES-256-CBC',
    keySize: 256,
    usage: 'Transparent Data Encryption (TDE)',
    quantumStatus: 'safe',
    recommendation: 'No action required — consider AES-256-GCM for authenticated encryption',
    infrastructureLayer: 'Database',
  },
  {
    id: 'api-jwt',
    component: 'API Gateway',
    location: 'JWT token signing',
    algorithm: 'ECDSA P-256',
    keySize: 256,
    usage: 'API authentication token signatures',
    quantumStatus: 'vulnerable',
    recommendation: 'Migrate to ML-DSA-44 for short-lived tokens',
    infrastructureLayer: 'Application',
  },
  {
    id: 'vpn-ike',
    component: 'VPN Gateway (StrongSwan)',
    location: 'IKEv2 SA negotiation',
    algorithm: 'ECDH P-384',
    keySize: 384,
    usage: 'IPsec key exchange',
    quantumStatus: 'vulnerable',
    recommendation: 'Add ML-KEM-768 additional key exchange using RFC 9370 framework',
    infrastructureLayer: 'Network',
  },
  {
    id: 'vpn-auth',
    component: 'VPN Gateway (StrongSwan)',
    location: 'IKEv2 authentication',
    algorithm: 'RSA-4096',
    keySize: 4096,
    usage: 'IPsec peer authentication',
    quantumStatus: 'vulnerable',
    recommendation: 'Migrate to ML-DSA-65 or composite signature',
    infrastructureLayer: 'Network',
  },
  {
    id: 'ssh-host',
    component: 'SSH Server (OpenSSH)',
    location: '/etc/ssh/ssh_host_*',
    algorithm: 'Ed25519',
    keySize: 256,
    usage: 'SSH host key authentication',
    quantumStatus: 'vulnerable',
    recommendation: 'Enable mlkem768x25519-sha256 key exchange in OpenSSH 9.x',
    infrastructureLayer: 'Application',
  },
  {
    id: 'code-sign',
    component: 'CI/CD Pipeline',
    location: 'Build artifacts',
    algorithm: 'RSA-2048',
    keySize: 2048,
    usage: 'Code signing for release artifacts',
    quantumStatus: 'vulnerable',
    recommendation: 'Consider LMS/HSS (NIST SP 800-208) for firmware/code signing',
    infrastructureLayer: 'Application',
  },
  {
    id: 'hash-integrity',
    component: 'Build System',
    location: 'Package checksums',
    algorithm: 'SHA-256',
    keySize: 256,
    usage: 'File integrity verification',
    quantumStatus: 'safe',
    recommendation:
      'No action required — SHA-256 provides 128-bit post-quantum collision resistance',
    infrastructureLayer: 'Application',
  },
  {
    id: 'pki-ca',
    component: 'Internal CA',
    location: 'Root CA certificate',
    algorithm: 'RSA-4096',
    keySize: 4096,
    usage: 'PKI root of trust',
    quantumStatus: 'vulnerable',
    recommendation: 'Plan composite CA certificate (ML-DSA-65 + RSA-4096) for hybrid trust chain',
    infrastructureLayer: 'Security Stack',
  },
  {
    id: 'email-smime',
    component: 'Email Server (Exchange)',
    location: 'S/MIME certificates',
    algorithm: 'RSA-2048',
    keySize: 2048,
    usage: 'Email encryption and signing',
    quantumStatus: 'vulnerable',
    recommendation:
      'Migrate to ML-DSA-65 signing + ML-KEM-768 encryption using RFC 9629 KEM framework',
    infrastructureLayer: 'Application',
  },
  {
    id: 'legacy-3des',
    component: 'Payment Terminal',
    location: 'Card data encryption',
    algorithm: '3DES-168',
    keySize: 168,
    usage: 'Legacy payment card data encryption in transit',
    quantumStatus: 'weakened',
    recommendation:
      'Migrate to AES-256 — 3DES effective security is 112 bits classical, ~56 bits post-quantum (Grover)',
    infrastructureLayer: 'Application',
  },
  {
    id: 'legacy-sha1',
    component: 'Legacy Internal App',
    location: 'Certificate pinning',
    algorithm: 'SHA-1',
    keySize: 160,
    usage: 'Certificate fingerprint pinning in legacy app',
    quantumStatus: 'weakened',
    recommendation:
      'Upgrade to SHA-256 — SHA-1 has known collision attacks and only ~80-bit post-quantum preimage resistance',
    infrastructureLayer: 'Application',
  },
  // Cloud layer
  {
    id: 'cloud-kms-wrap',
    component: 'Cloud KMS (AWS KMS / Azure Key Vault)',
    location: 'Envelope encryption wrapping key',
    algorithm: 'RSA-2048',
    keySize: 2048,
    usage: 'Wrapping symmetric data-encryption keys (DEK) for cloud storage',
    quantumStatus: 'vulnerable',
    recommendation:
      'Migrate to ML-KEM-768 KEM-based key wrapping when cloud provider adds PQC support (AWS KMS PQC preview available)',
    infrastructureLayer: 'Cloud',
  },
  {
    id: 'cloud-tls-cdn',
    component: 'CDN Edge (Cloudflare / AWS CloudFront)',
    location: 'TLS 1.3 client-facing handshake',
    algorithm: 'AES-256-GCM',
    keySize: 256,
    usage: 'Symmetric session encryption for edge-terminated HTTPS traffic',
    quantumStatus: 'safe',
    recommendation: 'No action required — AES-256-GCM provides 128-bit post-quantum security',
    infrastructureLayer: 'Cloud',
  },
  // OS layer
  {
    id: 'os-fde',
    component: 'Full-Disk Encryption (BitLocker / FileVault / LUKS)',
    location: 'Volume master key protection',
    algorithm: 'AES-256-XTS',
    keySize: 256,
    usage: 'Symmetric encryption of storage volumes at rest',
    quantumStatus: 'safe',
    recommendation:
      'No action required — AES-256-XTS provides 128-bit post-quantum security for symmetric encryption',
    infrastructureLayer: 'OS',
  },
  {
    id: 'os-cert-store',
    component: 'OS Certificate Store (Windows CertMgr / macOS Keychain)',
    location: 'User and machine certificate store',
    algorithm: 'RSA-2048',
    keySize: 2048,
    usage: 'User identity certificates for machine authentication and code trust',
    quantumStatus: 'vulnerable',
    recommendation:
      'Plan ML-DSA-44 migration for user certs; composite root trust needed for backward compatibility',
    infrastructureLayer: 'OS',
  },
  // Hardware layer
  {
    id: 'hw-hsm-root',
    component: 'Hardware Security Module (Thales Luna / AWS CloudHSM)',
    location: 'Root signing key (non-extractable)',
    algorithm: 'RSA-4096',
    keySize: 4096,
    usage: 'Long-lived root key for CA and code signing operations',
    quantumStatus: 'vulnerable',
    recommendation:
      'Prioritize HSM firmware upgrade with PQC support (Thales Luna 7, Entrust nShield); plan ML-DSA-87 for root signing',
    infrastructureLayer: 'Hardware',
  },
  {
    id: 'hw-tpm-attest',
    component: 'TPM 2.0 (Trusted Platform Module)',
    location: 'Platform attestation key (AK)',
    algorithm: 'ECDSA P-256',
    keySize: 256,
    usage: 'Remote attestation and secure boot chain-of-trust verification',
    quantumStatus: 'vulnerable',
    recommendation:
      'Future TPM specifications with PQC support are in development by TCG; plan firmware upgrades or hardware replacement for long-lived devices',
    infrastructureLayer: 'Hardware',
  },
]

export const CBOM_CYCLONEDX_SAMPLE = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: 'urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79',
  version: 1,
  metadata: {
    component: {
      type: 'application',
      name: 'acme-enterprise-platform',
      version: '2.4.1',
    },
  },
  components: [
    {
      type: 'cryptographic-asset',
      name: 'RSA-2048 TLS Server Certificate',
      cryptoProperties: {
        assetType: 'certificate',
        algorithmProperties: {
          primitive: 'pke',
          parameterSetIdentifier: '2048',
          classicalSecurityLevel: 112,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'X25519 TLS Key Exchange',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'key-agree',
          parameterSetIdentifier: '256',
          classicalSecurityLevel: 128,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.3.101.110',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'AES-256-GCM Session Cipher',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'ae',
          parameterSetIdentifier: '256',
          mode: 'gcm',
          classicalSecurityLevel: 256,
          nistQuantumSecurityLevel: 1,
        },
        oid: '2.16.840.1.101.3.4.1.46',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'AES-256-CBC Database TDE',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'block-cipher',
          parameterSetIdentifier: '256',
          mode: 'cbc',
          classicalSecurityLevel: 256,
          nistQuantumSecurityLevel: 1,
        },
        oid: '2.16.840.1.101.3.4.1.42',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'ECDSA P-256 JWT Signing',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'signature',
          parameterSetIdentifier: 'P-256',
          classicalSecurityLevel: 128,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.10045.4.3.2',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'ECDH P-384 IPsec Key Exchange',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'key-agree',
          parameterSetIdentifier: 'P-384',
          classicalSecurityLevel: 192,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.3.132.0.34',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-4096 IPsec Authentication',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'signature',
          parameterSetIdentifier: '4096',
          classicalSecurityLevel: 140,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'Ed25519 SSH Host Key',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'signature',
          parameterSetIdentifier: '256',
          classicalSecurityLevel: 128,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.3.101.112',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-2048 Code Signing',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'signature',
          parameterSetIdentifier: '2048',
          classicalSecurityLevel: 112,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'SHA-256 File Integrity',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'hash',
          parameterSetIdentifier: '256',
          classicalSecurityLevel: 256,
          nistQuantumSecurityLevel: 1,
        },
        oid: '2.16.840.1.101.3.4.2.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-4096 Root CA Certificate',
      cryptoProperties: {
        assetType: 'certificate',
        algorithmProperties: {
          primitive: 'pke',
          parameterSetIdentifier: '4096',
          classicalSecurityLevel: 140,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-2048 S/MIME Certificate',
      cryptoProperties: {
        assetType: 'certificate',
        algorithmProperties: {
          primitive: 'pke',
          parameterSetIdentifier: '2048',
          classicalSecurityLevel: 112,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: '3DES-168 Payment Terminal Cipher',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'block-cipher',
          parameterSetIdentifier: '168',
          mode: 'cbc',
          classicalSecurityLevel: 112,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.3.7',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'SHA-1 Legacy Certificate Pinning',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'hash',
          parameterSetIdentifier: '160',
          classicalSecurityLevel: 80,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.3.14.3.2.26',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-2048 Cloud KMS Wrapping Key',
      cryptoProperties: {
        assetType: 'related-crypto-material',
        algorithmProperties: {
          primitive: 'pke',
          parameterSetIdentifier: '2048',
          classicalSecurityLevel: 112,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'AES-256-GCM CDN Session Cipher',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'ae',
          parameterSetIdentifier: '256',
          mode: 'gcm',
          classicalSecurityLevel: 256,
          nistQuantumSecurityLevel: 1,
        },
        oid: '2.16.840.1.101.3.4.1.46',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'AES-256-XTS Full-Disk Encryption',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive: 'block-cipher',
          parameterSetIdentifier: '256',
          mode: 'other',
          classicalSecurityLevel: 256,
          nistQuantumSecurityLevel: 1,
        },
        oid: '2.16.840.1.101.3.4.1.41',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-2048 OS User Certificate',
      cryptoProperties: {
        assetType: 'certificate',
        algorithmProperties: {
          primitive: 'pke',
          parameterSetIdentifier: '2048',
          classicalSecurityLevel: 112,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'RSA-4096 HSM Root Signing Key',
      cryptoProperties: {
        assetType: 'related-crypto-material',
        algorithmProperties: {
          primitive: 'signature',
          parameterSetIdentifier: '4096',
          classicalSecurityLevel: 140,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.113549.1.1.1',
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'ECDSA P-256 TPM Attestation Key',
      cryptoProperties: {
        assetType: 'related-crypto-material',
        algorithmProperties: {
          primitive: 'signature',
          parameterSetIdentifier: 'P-256',
          classicalSecurityLevel: 128,
          nistQuantumSecurityLevel: 0,
        },
        oid: '1.2.840.10045.4.3.2',
      },
    },
  ],
}
