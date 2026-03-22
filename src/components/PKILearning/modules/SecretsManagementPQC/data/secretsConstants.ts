// SPDX-License-Identifier: GPL-3.0-only

export type SecretType =
  | 'api-key'
  | 'db-credential'
  | 'tls-cert'
  | 'signing-key'
  | 'encryption-key'
  | 'oauth-token'
  | 'service-account'
  | 'seed-phrase'

export type PQCRiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type HNDLExposure = 'immediate' | 'delayed' | 'none'

export interface SecretCategory {
  id: string
  type: SecretType
  name: string
  description: string
  pqcRisk: PQCRiskLevel
  hndlExposure: HNDLExposure
  transitRisk: string
  atRestRisk: string
  mitigationStrategy: string
  exampleProducts: string[]
}

export interface VaultTransitScenario {
  id: string
  name: string
  classicalMechanism: string
  pqcMechanism: string
  keySize: string
  ciphertextExpansion: string
  description: string
  apiExample: string
}

export interface RotationPolicy {
  id: string
  secretType: string
  ttl: string
  maxTTL: string
  renewalWindow: string
  pqcConsideration: string
  complianceFramework: string
  automationTool: string
}

export interface CloudSecretsProvider {
  id: string
  name: string
  product: string
  type: 'cloud' | 'on-prem' | 'hybrid'
  pqcStatus: 'ga' | 'preview' | 'planned' | 'none'
  pqcAlgorithms: string[]
  encryptionAtRest: string
  encryptionInTransit: string
  envelopeEncryption: boolean
  dynamicSecrets: boolean
  kubernetesIntegration: string
  fipsMode: boolean
  roadmapNote: string
}

export interface PipelineIntegrationPattern {
  id: string
  tool: string
  pattern: string
  secretInjection: string
  pqcReady: boolean
  recommendation: string
  codeSnippet: string
}

export const SECRET_CATEGORIES: SecretCategory[] = [
  {
    id: 'api-keys',
    type: 'api-key',
    name: 'API Keys & Access Tokens',
    description:
      'Long-lived tokens used to authenticate service-to-service calls, third-party API integrations, and platform access. Often embedded in configuration files or environment variables.',
    pqcRisk: 'critical',
    hndlExposure: 'delayed',
    transitRisk:
      'Tokens transmitted over TLS channels are at risk if the session is recorded and later decrypted by a CRQC. Long-lived tokens amplify this risk since they may still be valid years later.',
    atRestRisk:
      'API keys stored in vault are protected by envelope encryption. The KEK wrapping the DEK must be ML-KEM protected to prevent offline decryption of harvested vault backups.',
    mitigationStrategy:
      'Store all API keys in a PQC-protected vault (ML-KEM-768 envelope encryption). Implement short TTLs (90 days max). Use ML-DSA-signed webhook payloads to authenticate requests.',
    exampleProducts: ['HashiCorp Vault', 'AWS Secrets Manager', 'Azure Key Vault', 'Doppler'],
  },
  {
    id: 'db-credentials',
    type: 'db-credential',
    name: 'Database Credentials',
    description:
      'Username/password or connection string credentials for database access. Often static and long-lived in legacy systems, creating significant HNDL exposure for sensitive data stores.',
    pqcRisk: 'critical',
    hndlExposure: 'immediate',
    transitRisk:
      'Database connections over TLS 1.2 using RSA or ECDSA key exchange are vulnerable to harvest-now-decrypt-later attacks. A CRQC can decrypt the entire connection including credentials and query results.',
    atRestRisk:
      'Static DB credentials stored in vault represent a high-value target. Compromise of the vault master key (if RSA/ECDSA wrapped) exposes all credentials simultaneously.',
    mitigationStrategy:
      'Replace static credentials with dynamic secrets (Vault database engine: TTL 1h, max 24h). Upgrade DB connection TLS to hybrid ML-KEM. Rotate master keys with ML-KEM-1024 wrapping.',
    exampleProducts: ['Vault Dynamic Secrets', 'AWS IAM Database Auth', 'Azure Managed Identity'],
  },
  {
    id: 'tls-certs',
    type: 'tls-cert',
    name: 'TLS Certificates & Private Keys',
    description:
      'X.509 certificates and their corresponding private keys used for TLS/mTLS authentication. The private key material is the most sensitive component — compromise enables identity spoofing.',
    pqcRisk: 'critical',
    hndlExposure: 'immediate',
    transitRisk:
      'TLS private keys used in RSA/ECDSA handshakes are retroactively compromisable. Recorded TLS sessions can be decrypted once the server private key is recovered by a CRQC.',
    atRestRisk:
      'Private keys stored in vault or HSM must be protected with ML-KEM-based key wrapping. PKCS#12 bundles encrypted with legacy algorithms (3DES, RC4) are immediately vulnerable.',
    mitigationStrategy:
      'Issue hybrid ML-DSA-65 + ECDSA P-256 certificates for all TLS endpoints. Store private keys in FIPS 140-3 Level 3 HSMs with ML-KEM firmware. Automate rotation via ACME/cert-manager.',
    exampleProducts: ['cert-manager', 'Vault PKI Engine', 'AWS ACM', 'Sectigo'],
  },
  {
    id: 'signing-keys',
    type: 'signing-key',
    name: 'Code & Document Signing Keys',
    description:
      'Private keys used to sign software packages, firmware images, container images, and legal documents. Compromise enables supply chain attacks via forged signatures on malicious artifacts.',
    pqcRisk: 'critical',
    hndlExposure: 'immediate',
    transitRisk:
      'Signing operations performed over unprotected channels expose the signature to HNDL. An attacker harvesting signed artifacts today can forge new signatures after recovering the private key.',
    atRestRisk:
      'Code signing keys stored in software keystores (JKS, PKCS#12) with RSA/ECDSA are directly at risk from CRQC offline attacks. HSM storage is mandatory for critical signing keys.',
    mitigationStrategy:
      'Migrate all signing operations to ML-DSA-87 (FIPS 204 Level 5) for long-term artifacts. Use Sigstore for keyless signing with short-lived ML-DSA certificates. Store root signing keys in HSMs.',
    exampleProducts: ['Sigstore/Cosign', 'Vault Transit', 'AWS Signer', 'DigiCert ONE'],
  },
  {
    id: 'encryption-keys',
    type: 'encryption-key',
    name: 'Data Encryption Keys (DEKs)',
    description:
      'Symmetric keys used to encrypt data at rest — database columns, file system volumes, object storage blobs, and backup archives. The KEK protecting the DEK is the critical quantum-vulnerable component.',
    pqcRisk: 'critical',
    hndlExposure: 'immediate',
    transitRisk:
      'DEKs transmitted for key distribution (e.g., cloud KMS APIs over TLS) are vulnerable if the TLS session uses RSA/ECDSA. A harvested key distribution session exposes all data encrypted with that DEK.',
    atRestRisk:
      'DEKs wrapped with RSA-OAEP or ECDH-ES are directly vulnerable to CRQC. Envelope encryption using ML-KEM-1024 as the KEK wrapping algorithm eliminates this risk for new data.',
    mitigationStrategy:
      'Re-key all DEKs under ML-KEM-1024 envelope encryption. AES-256-GCM for the data layer is already quantum-safe (Grover halves security to 128 bits, still acceptable). Prioritize longest-lived data first.',
    exampleProducts: ['AWS KMS', 'Google Cloud KMS', 'Azure Key Vault', 'HashiCorp Vault'],
  },
  {
    id: 'oauth-tokens',
    type: 'oauth-token',
    name: 'OAuth Tokens & JWTs',
    description:
      'Short-lived access tokens and JWTs used for API authorization. The signing key (RS256/ES256) that validates these tokens is the critical quantum-vulnerable component.',
    pqcRisk: 'high',
    hndlExposure: 'delayed',
    transitRisk:
      'OAuth tokens are bearer credentials — a harvested token is usable until expiry. Short TTLs (1h) significantly reduce HNDL risk. The signing key compromise is the greater long-term concern.',
    atRestRisk:
      'OAuth signing keys (JWKs) stored in vault must be protected with ML-KEM wrapping. Refresh tokens with long TTLs (30-90 days) represent a higher risk than short-lived access tokens.',
    mitigationStrategy:
      'Migrate OAuth signing to ML-DSA-65 (FIPS 204). Enforce 1h max TTL for access tokens. Use ML-DSA-signed JWTs (algorithm: "ML-DSA-65" in JOSE header). Rotate signing keys every 30 days.',
    exampleProducts: ['Keycloak', 'Auth0', 'AWS Cognito', 'Azure AD B2C', 'Okta'],
  },
  {
    id: 'service-accounts',
    type: 'service-account',
    name: 'Service Account Credentials',
    description:
      'Credentials for non-human identities: Kubernetes service accounts, GCP service account keys, AWS IAM users for CI/CD. Often long-lived and broadly scoped, making them high-value targets.',
    pqcRisk: 'high',
    hndlExposure: 'delayed',
    transitRisk:
      'Service account credentials transmitted over TLS are vulnerable to HNDL. Cloud provider API calls using service account keys over recorded TLS sessions can be replayed after key recovery.',
    atRestRisk:
      'Downloaded service account key files (JSON) rely on the cloud provider RSA key infrastructure for signing. Provider-managed keys offer better protection; downloaded keys should be eliminated.',
    mitigationStrategy:
      'Eliminate static service account keys. Use Workload Identity Federation (GKE, EKS, AKS) with ML-DSA short-lived credential issuance via SPIFFE/SPIRE. Vault Agent sidecar for Kubernetes.',
    exampleProducts: ['SPIFFE/SPIRE', 'Vault Kubernetes Auth', 'AWS IRSA', 'GKE Workload Identity'],
  },
  {
    id: 'seed-phrases',
    type: 'seed-phrase',
    name: 'Crypto Seed Phrases & Wallet Keys',
    description:
      'BIP-39 mnemonic seed phrases and HD wallet private keys for cryptocurrency custody. These derive all child keys — compromise of the seed phrase means total loss of all derived assets.',
    pqcRisk: 'critical',
    hndlExposure: 'immediate',
    transitRisk:
      "Seed phrases transmitted electronically over any channel (even encrypted) are vulnerable to long-term harvest. The secp256k1 keys derived from BIP-32 HD wallets are directly broken by Shor's algorithm.",
    atRestRisk:
      'BIP-39 seed phrases encrypted with AES-256 but derived from an ECDH/RSA key exchange are vulnerable. Hardware wallet storage is essential; seed backup encryption must use ML-KEM-1024.',
    mitigationStrategy:
      'Store seed phrases in FIPS 140-3 Level 3 HSMs with ML-KEM-1024 wrapping for backup. Consider MPC/TSS wallets that eliminate single-point seed phrase exposure. Monitor BIP-360 (proposed PQC wallet standard, not yet formally published) progress.',
    exampleProducts: ['Fireblocks', 'Anchorage Digital', 'Ledger Enterprise', 'Copper ClearLoop'],
  },
]

export const VAULT_TRANSIT_SCENARIOS: VaultTransitScenario[] = [
  {
    id: 'symmetric-encrypt',
    name: 'Symmetric Encryption',
    classicalMechanism: 'AES-256-GCM',
    pqcMechanism: 'AES-256-GCM (key wrapped with ML-KEM)',
    keySize: '256-bit AES key (unchanged)',
    ciphertextExpansion: '0 bytes additional (symmetric already quantum-safe)',
    description:
      "AES-256-GCM is already quantum-safe against Grover's algorithm (effective 128-bit security). The change is in how the AES key is wrapped — RSA-OAEP wrapping is replaced with ML-KEM-768 encapsulation + HKDF derivation. Ciphertext size is unchanged.",
    apiExample: `# Classical Vault transit (AES-256-GCM, RSA-wrapped key)
vault write transit/encrypt/my-key \\
  plaintext=$(base64 <<< "sensitive data")

# PQC Vault transit (AES-256-GCM, ML-KEM-wrapped key)
# Key type: aes256-gcm96 (unchanged)
# KEK wrapping: ml-kem-768 (new in Vault 1.18+)
vault write transit/encrypt/my-pqc-key \\
  plaintext=$(base64 <<< "sensitive data") \\
  key_version=2`,
  },
  {
    id: 'key-wrapping',
    name: 'Key Wrapping / KEM',
    classicalMechanism: 'RSA-OAEP-2048',
    pqcMechanism: 'ML-KEM-768',
    keySize: '1,184 bytes (public key) vs 256 bytes (RSA-2048)',
    ciphertextExpansion: '1,088 bytes (ML-KEM ciphertext) vs 256 bytes (RSA ciphertext)',
    description:
      'Replacing RSA-OAEP with ML-KEM-768 for key encapsulation increases the public key size 4.6x and ciphertext size 4.25x. This impacts HSM storage, network payload sizes for key distribution APIs, and certificate sizes when embedding public keys.',
    apiExample: `# Classical: RSA-OAEP key wrapping
vault write transit/encrypt/rsa-key \\
  type=rsa-2048 \\
  plaintext=$(base64 <<< "32-byte-dek")
# Result: 256-byte ciphertext

# PQC: ML-KEM-768 key encapsulation
vault write transit/keys/ml-kem-key \\
  type=ml-kem-768
vault write transit/encrypt/ml-kem-key \\
  plaintext=$(base64 <<< "32-byte-dek")
# Result: 1,088-byte ciphertext (4.25x larger)`,
  },
  {
    id: 'sign-verify',
    name: 'Sign & Verify',
    classicalMechanism: 'ECDSA P-256',
    pqcMechanism: 'ML-DSA-65',
    keySize: '1,952 bytes (ML-DSA-65 public key) vs 64 bytes (P-256)',
    ciphertextExpansion: '3,309 bytes (ML-DSA-65 signature) vs 64 bytes (ECDSA signature)',
    description:
      'ML-DSA-65 signatures are 51.7x larger than ECDSA P-256 signatures. This has significant impact on JWTs, code signing payloads, TLS certificate sizes, and API response headers. Applications that embed signatures in URLs or HTTP headers require protocol changes.',
    apiExample: `# Classical: ECDSA P-256 signing
vault write transit/keys/ecdsa-key type=ecdsa-p256
vault write transit/sign/ecdsa-key \\
  input=$(base64 <<< "artifact hash") \\
  hash_algorithm=sha2-256
# Signature: 64 bytes (base64: ~88 chars)

# PQC: ML-DSA-65 signing
vault write transit/keys/mldsa-key type=ml-dsa-65
vault write transit/sign/mldsa-key \\
  input=$(base64 <<< "artifact hash") \\
  hash_algorithm=sha3-256
# Signature: 3,309 bytes (base64: ~4,412 chars)`,
  },
  {
    id: 'mac',
    name: 'MAC / HMAC',
    classicalMechanism: 'HMAC-SHA256',
    pqcMechanism: 'HMAC-SHA256 (already quantum-safe)',
    keySize: '256-bit HMAC key (unchanged)',
    ciphertextExpansion: '0 bytes additional (HMAC already quantum-safe)',
    description:
      "HMAC-SHA256 is based on symmetric cryptography and is not broken by Shor's algorithm. Grover's algorithm reduces effective security from 256 to 128 bits — still within acceptable margins. No algorithm change is needed, only ensuring the HMAC key is protected by PQC wrapping in the vault.",
    apiExample: `# HMAC-SHA256 — no algorithm change needed
vault write transit/keys/hmac-key type=hmac
vault write transit/hmac/hmac-key \\
  input=$(base64 <<< "message to authenticate") \\
  algorithm=sha2-256
# Returns: 32-byte HMAC (256-bit, quantum-safe)

# PQC consideration: ensure the HMAC key is
# wrapped with ML-KEM-768 (not RSA) in Vault's
# key store to prevent offline key extraction`,
  },
]

export const ROTATION_POLICIES: RotationPolicy[] = [
  {
    id: 'api-key-rotation',
    secretType: 'API Keys & Access Tokens',
    ttl: '90 days',
    maxTTL: '180 days',
    renewalWindow: '14 days before expiry',
    pqcConsideration:
      'API keys with TTL > 10 years have high HNDL risk. Post-2026, reduce to 30 days as CRQC timelines compress. Ensure vault KEK uses ML-KEM-768.',
    complianceFramework: 'PCI DSS v4.0.1 Req. 8.6.3',
    automationTool: 'Vault Dynamic Secrets + Vault Agent',
  },
  {
    id: 'db-credential-rotation',
    secretType: 'Database Credentials',
    ttl: '8 hours',
    maxTTL: '24 hours',
    renewalWindow: '1 hour before expiry (auto-renew)',
    pqcConsideration:
      'Dynamic credentials eliminate HNDL risk for credential theft. The DB connection itself (TLS) still needs ML-KEM upgrade. Use Vault database engine with lease management.',
    complianceFramework: 'NIST SP 800-57 Part 1 Rev. 5',
    automationTool: 'Vault Database Secrets Engine',
  },
  {
    id: 'tls-cert-rotation',
    secretType: 'TLS Certificates',
    ttl: '90 days',
    maxTTL: '90 days',
    renewalWindow: '30 days before expiry',
    pqcConsideration:
      'Hybrid ML-DSA-65 + ECDSA P-256 certs are 6x larger. Automation is critical — manual rotation at scale is infeasible. cert-manager + Vault PKI engine handles lifecycle automatically.',
    complianceFramework: "CA/Browser Forum Baseline Requirements, Let's Encrypt",
    automationTool: 'cert-manager + Vault PKI Engine + ACME',
  },
  {
    id: 'signing-key-rotation',
    secretType: 'Code Signing Keys',
    ttl: '1 year',
    maxTTL: '2 years',
    renewalWindow: '90 days before expiry',
    pqcConsideration:
      'ML-DSA-87 keys are recommended for code signing (long artifact lifetimes require maximum security level). Plan for re-signing old artifacts with new keys during rotation.',
    complianceFramework: 'CNSA 2.0, NIST SP 800-57 Part 3',
    automationTool: 'Vault Transit Engine + Sigstore',
  },
  {
    id: 'dek-rotation',
    secretType: 'Data Encryption Keys (DEKs)',
    ttl: '30 days',
    maxTTL: '90 days',
    renewalWindow: '7 days before expiry',
    pqcConsideration:
      'AES-256-GCM DEKs are quantum-safe but their KEK wrappers need ML-KEM. Rotation is a re-wrap operation (decrypt with old KEK, re-encrypt with new ML-KEM KEK). No data re-encryption needed if using envelope encryption.',
    complianceFramework: 'NIST SP 800-57 Part 1, FIPS 140-3',
    automationTool: 'AWS KMS Key Rotation / Google Cloud KMS / Azure Key Vault',
  },
  {
    id: 'oauth-token-rotation',
    secretType: 'OAuth Signing Keys (JWKs)',
    ttl: '1 hour (tokens), 30 days (signing keys)',
    maxTTL: '24 hours (refresh tokens)',
    renewalWindow: 'Tokens: auto-refresh; Keys: 7 days before expiry',
    pqcConsideration:
      'Access token TTL of 1h means HNDL risk is low for individual tokens. The signing key is the critical component — migrate to ML-DSA-65 and keep jwks_uri cached for up to 24h to handle rotation lag.',
    complianceFramework: 'RFC 9700 (OAuth 2.0 Security BCP), IETF JOSE PQC',
    automationTool: 'Keycloak / Auth0 Key Rotation / Vault OIDC Provider',
  },
]

export const CLOUD_SECRETS_PROVIDERS: CloudSecretsProvider[] = [
  {
    id: 'hashicorp-vault',
    name: 'HashiCorp',
    product: 'Vault Enterprise',
    type: 'on-prem',
    pqcStatus: 'planned',
    pqcAlgorithms: ['ML-KEM-768 (planned 2026)', 'ML-DSA-65 (planned 2026)', 'SLH-DSA (roadmap)'],
    encryptionAtRest: 'AES-256-GCM with Shamir Secret Sharing for unseal keys',
    encryptionInTransit: 'TLS 1.3 (hybrid ML-KEM planned via HPKE)',
    envelopeEncryption: true,
    dynamicSecrets: true,
    kubernetesIntegration: 'vault-agent-injector / Vault Secrets Operator (VSO)',
    fipsMode: true,
    roadmapNote:
      'Transit engine PQC key types planned for Vault 1.18 (H2 2026). ML-KEM envelope encryption for seal/unseal in Vault 1.19. FIPS 140-3 validation for PQC algorithms expected 2027.',
  },
  {
    id: 'aws-secrets-manager',
    name: 'Amazon Web Services',
    product: 'AWS Secrets Manager',
    type: 'cloud',
    pqcStatus: 'none',
    pqcAlgorithms: [
      'Inherits AWS KMS: ML-KEM-768 (GA via ML-KEM key spec)',
      'ML-DSA-44/65/87 (GA 2024)',
    ],
    encryptionAtRest: 'AWS KMS envelope encryption (AES-256-GCM)',
    encryptionInTransit: 'TLS 1.3 with hybrid ML-KEM (via AWS SDK)',
    envelopeEncryption: true,
    dynamicSecrets: false,
    kubernetesIntegration: 'Secrets Store CSI Driver + AWS provider / External Secrets Operator',
    fipsMode: true,
    roadmapNote:
      'No native dynamic secrets. PQC comes via KMS integration — use a CMK with ML-KEM key type. Secrets Manager itself adds no PQC beyond what KMS provides. SDK-level TLS uses hybrid ML-KEM since 2024.',
  },
  {
    id: 'azure-key-vault',
    name: 'Microsoft Azure',
    product: 'Azure Key Vault (Managed HSM)',
    type: 'cloud',
    pqcStatus: 'planned',
    pqcAlgorithms: [
      'ML-KEM-768/1024 (planned 2026)',
      'ML-DSA-44/65/87 (planned 2026)',
      'SymCrypt internal support available',
    ],
    encryptionAtRest: 'AES-256-CBC/GCM, RSA-OAEP-256 for key wrapping (FIPS 140-2 Level 3)',
    encryptionInTransit: 'TLS 1.3 (hybrid ML-KEM planned H1 2026)',
    envelopeEncryption: true,
    dynamicSecrets: false,
    kubernetesIntegration:
      'Azure Key Vault Provider for Secrets Store CSI Driver / External Secrets Operator',
    fipsMode: true,
    roadmapNote:
      "Managed HSM PQC support announced for 2026. SymCrypt (Microsoft's crypto library) already supports ML-KEM and ML-DSA internally; Key Vault API exposure is the remaining gap. No dynamic secrets native.",
  },
  {
    id: 'gcp-secret-manager',
    name: 'Google Cloud',
    product: 'GCP Secret Manager',
    type: 'cloud',
    pqcStatus: 'none',
    pqcAlgorithms: [
      'Inherits Cloud KMS: ML-KEM (preview)',
      'ML-DSA (preview)',
      'X-Wing hybrid KEM (preview)',
    ],
    encryptionAtRest: 'Google-managed keys with AES-256, optionally Cloud KMS CMEK',
    encryptionInTransit: 'TLS 1.3 (ML-KEM hybrid via BoringSSL/Chrome TLS)',
    envelopeEncryption: true,
    dynamicSecrets: false,
    kubernetesIntegration: 'External Secrets Operator + GCP provider / Config Connector',
    fipsMode: false,
    roadmapNote:
      'PQC in Secret Manager relies on Cloud KMS CMEK configuration. Cloud KMS supports ML-KEM-768, ML-KEM-1024, X-Wing, ML-DSA-65, and SLH-DSA (preview). FIPS mode not available for Secret Manager directly.',
  },
  {
    id: 'delinea-secret-server',
    name: 'Delinea',
    product: 'Secret Server (Privileged Access)',
    type: 'hybrid',
    pqcStatus: 'planned',
    pqcAlgorithms: ['ML-KEM-768 (roadmap 2027)', 'ML-DSA-65 (roadmap 2027)'],
    encryptionAtRest: 'AES-256-CBC with RSA-2048 key wrapping (pre-PQC)',
    encryptionInTransit: 'TLS 1.2/1.3 (PQC TLS upgrade planned 2026)',
    envelopeEncryption: true,
    dynamicSecrets: true,
    kubernetesIntegration: 'Delinea Kubernetes Connector (DKAP)',
    fipsMode: true,
    roadmapNote:
      'Privileged Access Management (PAM) platform with session recording, vaulting, and just-in-time access. PQC roadmap announced 2025, targeting algorithm upgrade in 2027. FIPS 140-2 validated currently.',
  },
]

export const PIPELINE_INTEGRATION_PATTERNS: PipelineIntegrationPattern[] = [
  {
    id: 'kubernetes-vault-agent',
    tool: 'Kubernetes',
    pattern: 'Vault Agent Sidecar Injector',
    secretInjection:
      'Vault Agent runs as a sidecar container, authenticates via Kubernetes Service Account JWT, and writes secrets to a shared in-memory tmpfs volume at /vault/secrets/',
    pqcReady: false,
    recommendation:
      'Enable Kubernetes encryption-at-rest for etcd using a KMS provider with ML-KEM support. Use External Secrets Operator for GitOps-friendly secret sync. Vault Agent sidecar pattern isolates secret exposure to pod lifetime.',
    codeSnippet: `# vault-agent-config.hcl
auto_auth {
  method "kubernetes" {
    mount_path = "auth/kubernetes"
    config = {
      role = "my-app-role"
    }
  }
}

template {
  destination = "/vault/secrets/db-credentials"
  contents = <<EOT
{{- with secret "database/creds/my-role" -}}
DB_USERNAME={{ .Data.username }}
DB_PASSWORD={{ .Data.password }}
{{- end }}
EOT
}

# Pod annotation for auto-injection
# vault.hashicorp.com/agent-inject: "true"
# vault.hashicorp.com/role: "my-app-role"
# vault.hashicorp.com/agent-inject-secret-config: "database/creds/my-role"`,
  },
  {
    id: 'github-actions-oidc',
    tool: 'GitHub Actions',
    pattern: 'OIDC + Vault JWT Auth',
    secretInjection:
      'GitHub Actions requests a short-lived OIDC JWT from GitHub, presents it to Vault JWT auth method, receives a Vault token scoped to the repository/branch/environment. Secrets are fetched within the job and never stored in GitHub.',
    pqcReady: false,
    recommendation:
      "The OIDC JWT is signed with GitHub's RSA key — plan for ML-DSA-signed OIDC tokens when GitHub updates their JWKS. Use Vault namespaces to isolate production secrets from CI. Set max_lease_ttl=15m for job duration.",
    codeSnippet: `# .github/workflows/deploy.yml
jobs:
  deploy:
    permissions:
      id-token: write  # Required for OIDC
      contents: read
    steps:
      - name: Import Vault Secrets
        uses: hashicorp/vault-action@v3
        with:
          url: https://vault.example.com
          method: jwt
          role: github-ci-role
          jwtGithubAudience: vault.example.com
          secrets: |
            secret/data/prod/app API_KEY | APP_API_KEY ;
            database/creds/readonly username | DB_USER ;
            database/creds/readonly password | DB_PASS

# Vault policy (ml-dsa signed JWT validation planned 2026):
# vault write auth/jwt/role/github-ci-role \\
#   bound_subject="repo:org/repo:ref:refs/heads/main" \\
#   bound_audiences="vault.example.com" \\
#   user_claim="sub" \\
#   ttl=15m`,
  },
  {
    id: 'gitlab-ci-tokens',
    tool: 'GitLab CI',
    pattern: 'GitLab CI Job Tokens + External Secrets',
    secretInjection:
      'GitLab CI/CD provides a short-lived CI_JOB_JWT_V2 token per job. Combined with Vault JWT auth, pipelines authenticate without static credentials. External Secrets Operator syncs from Vault to GitLab Agent for Kubernetes.',
    pqcReady: false,
    recommendation:
      'GitLab CI_JOB_JWT is RS256-signed (RSA). Monitor GitLab PQC roadmap for JWT signing algorithm upgrade to ML-DSA. Use GitLab Environments for secret scoping. Set Vault token TTL to pipeline duration max.',
    codeSnippet: `# .gitlab-ci.yml
variables:
  VAULT_ADDR: "https://vault.example.com"

fetch-secrets:
  image: vault:latest
  script:
    - vault write auth/jwt/login \\
        role="gitlab-ci" \\
        jwt="$CI_JOB_JWT_V2"
    - export VAULT_TOKEN=$(vault write -field=token \\
        auth/jwt/login role="gitlab-ci" jwt="$CI_JOB_JWT_V2")
    - DB_PASSWORD=$(vault kv get -field=password secret/db)
    - echo "DB_PASSWORD=$DB_PASSWORD" >> pipeline.env
  artifacts:
    reports:
      dotenv: pipeline.env

# Vault JWT role configuration:
# vault write auth/jwt/role/gitlab-ci \\
#   bound_issuer="https://gitlab.example.com" \\
#   bound_claims.project_id="42" \\
#   user_claim="sub" \\
#   ttl=30m`,
  },
  {
    id: 'terraform-vault-provider',
    tool: 'Terraform',
    pattern: 'Vault Provider + Dynamic Credentials',
    secretInjection:
      'Terraform uses the Vault provider to read secrets at plan/apply time. HCP Terraform integrates with Vault via Vault-backed dynamic credentials, generating short-lived cloud provider credentials (AWS STS, GCP tokens, Azure SPs) for each Terraform run.',
    pqcReady: false,
    recommendation:
      'Never store Vault tokens in Terraform state. Use Vault dynamic credentials for cloud provider auth — eliminates static cloud API keys in CI. Enable state encryption with a PQC-backed KMS key. terraform_remote_state should use ML-KEM-encrypted backends.',
    codeSnippet: `# main.tf — Vault provider with dynamic credentials
terraform {
  required_providers {
    vault = { source = "hashicorp/vault" version = "~> 4.0" }
  }
}

provider "vault" {
  address = var.vault_addr
  # Auth via AWS IAM or Kubernetes SA — no static token
}

# Read static secret
data "vault_kv_secret_v2" "app_config" {
  mount = "secret"
  name  = "prod/app-config"
}

# Generate dynamic AWS credentials
data "vault_aws_access_credentials" "deploy" {
  backend = "aws"
  role    = "deploy-role"
  type    = "sts"  # Short-lived STS token (15min-1h)
}

provider "aws" {
  access_key = data.vault_aws_access_credentials.deploy.access_key
  secret_key = data.vault_aws_access_credentials.deploy.secret_key
  token      = data.vault_aws_access_credentials.deploy.security_token
}

# PQC note: Vault token auth to provider should use
# ML-DSA-signed JWT (planned Vault 1.18+)`,
  },
]

export const HNDL_RISK_LABELS: Record<PQCRiskLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const PQC_STATUS_LABELS: Record<CloudSecretsProvider['pqcStatus'], string> = {
  ga: 'GA',
  preview: 'Preview',
  planned: 'Planned',
  none: 'Via KMS',
}
