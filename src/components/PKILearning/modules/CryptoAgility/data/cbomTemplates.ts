export interface CBOMEntry {
  id: string
  component: string
  location: string
  algorithm: string
  keySize: number
  usage: string
  quantumStatus: 'vulnerable' | 'safe' | 'weakened'
  recommendation: string
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
  },
  {
    id: 'vpn-ike',
    component: 'VPN Gateway (StrongSwan)',
    location: 'IKEv2 SA negotiation',
    algorithm: 'ECDH P-384',
    keySize: 384,
    usage: 'IPsec key exchange',
    quantumStatus: 'vulnerable',
    recommendation: 'Add ML-KEM-768 additional key exchange per RFC 9370',
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
  },
  {
    id: 'email-smime',
    component: 'Email Server (Exchange)',
    location: 'S/MIME certificates',
    algorithm: 'RSA-2048',
    keySize: 2048,
    usage: 'Email encryption and signing',
    quantumStatus: 'vulnerable',
    recommendation: 'Migrate to ML-DSA-65 signing + ML-KEM-768 encryption per RFC 9629',
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
      name: 'RSA-2048 TLS Certificate',
      'crypto:properties': {
        assetType: 'certificate',
        algorithmRef: 'RSA',
        keySize: 2048,
        classicalSecurityLevel: 112,
        quantumSecurityLevel: 0,
      },
    },
    {
      type: 'cryptographic-asset',
      name: 'AES-256-GCM Session Cipher',
      'crypto:properties': {
        assetType: 'algorithm',
        algorithmRef: 'AES',
        keySize: 256,
        classicalSecurityLevel: 256,
        quantumSecurityLevel: 128,
      },
    },
  ],
}
