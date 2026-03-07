// SPDX-License-Identifier: GPL-3.0-only

export { CLOUD_SECRETS_PROVIDERS as SECRETS_MANAGERS } from './secretsConstants'

export interface MigrationChecklistItem {
  id: string
  phase: string
  title: string
  description: string
  priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term'
  effort: 'low' | 'medium' | 'high'
}

export const MIGRATION_CHECKLIST: MigrationChecklistItem[] = [
  {
    id: 'inventory',
    phase: 'Phase 1: Inventory',
    title: 'Cryptographic Asset Inventory',
    description:
      'Enumerate all secrets, their types, lifetimes, and protection mechanisms. Identify which vault instances use RSA/ECDSA for master key wrapping and key transport. Tools: HashiCorp Vault audit logs, AWS Config rules, truffleHog for secret sprawl detection.',
    priority: 'immediate',
    effort: 'high',
  },
  {
    id: 'risk-classify',
    phase: 'Phase 1: Inventory',
    title: 'HNDL Risk Classification',
    description:
      'Classify each secret category by HNDL exposure window. Longest-lived secrets (signing keys, encryption keys, seed phrases) with immediate HNDL exposure get Priority 1 treatment. Short-lived tokens (OAuth 1h TTL) are lowest priority.',
    priority: 'immediate',
    effort: 'medium',
  },
  {
    id: 'dynamic-secrets',
    phase: 'Phase 2: Quick Wins',
    title: 'Enable Dynamic Secrets for Databases',
    description:
      'Replace static database credentials with dynamic secrets (Vault DB engine, max TTL 24h). This eliminates the HNDL risk of long-lived DB credentials without requiring any algorithm migration. Immediate security improvement achievable in weeks.',
    priority: 'short-term',
    effort: 'medium',
  },
  {
    id: 'vault-master-key',
    phase: 'Phase 2: Quick Wins',
    title: 'Upgrade Vault Seal Key Wrapping to ML-KEM',
    description:
      "When HashiCorp Vault 1.18+ supports ML-KEM seal mechanisms, migrate the vault seal key from RSA-OAEP to ML-KEM-1024. This protects the entire vault's secret store from offline decryption if a vault backup is harvested.",
    priority: 'short-term',
    effort: 'high',
  },
  {
    id: 'pqc-envelope',
    phase: 'Phase 3: Algorithm Migration',
    title: 'Re-key DEKs Under ML-KEM Envelope Encryption',
    description:
      'For each secret category using envelope encryption, generate new ML-KEM-768 or ML-KEM-1024 KEKs and re-wrap all DEKs. Data does not need re-encryption (AES-256-GCM is already quantum-safe). This is a key metadata operation only.',
    priority: 'medium-term',
    effort: 'medium',
  },
  {
    id: 'signing-migration',
    phase: 'Phase 3: Algorithm Migration',
    title: 'Migrate Signing Keys to ML-DSA',
    description:
      'Replace all ECDSA/RSA signing keys in vault with ML-DSA-65 or ML-DSA-87. Update applications that verify signatures (JWT validators, package managers, CI systems). Re-sign historical artifacts if long-term validity is required.',
    priority: 'medium-term',
    effort: 'high',
  },
  {
    id: 'kubernetes-etcd',
    phase: 'Phase 3: Algorithm Migration',
    title: 'Enable PQC Encryption for Kubernetes etcd',
    description:
      'Configure Kubernetes KMS provider with ML-KEM-backed master key for etcd encryption-at-rest. Kubernetes Secrets stored in etcd are base64 only by default — enabling encryption is critical. CIS Kubernetes Benchmark v1.9 section 1.2.33.',
    priority: 'medium-term',
    effort: 'medium',
  },
  {
    id: 'workload-identity',
    phase: 'Phase 4: Zero Trust Architecture',
    title: 'Replace Service Account Keys with Workload Identity + ML-DSA',
    description:
      'Eliminate all downloaded service account key files. Implement SPIFFE/SPIRE with ML-DSA X.509-SVID certificates for workload identity. Replace GitHub Actions service account keys with OIDC federation + ML-DSA JWT signing.',
    priority: 'long-term',
    effort: 'high',
  },
]
