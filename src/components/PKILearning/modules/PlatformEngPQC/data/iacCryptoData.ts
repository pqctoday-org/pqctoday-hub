// SPDX-License-Identifier: AGPL-3.0-only
import type { IaCPattern } from './platformEngConstants'

export const IAC_PATTERNS: IaCPattern[] = [
  {
    id: 'cert-manager-issuer',
    tool: 'cert-manager',
    title: 'cert-manager: ClusterIssuer Key Algorithm',
    vulnerability:
      "Default cert-manager ClusterIssuer uses ECDSA P-256 or RSA-2048 — both broken by Shor's algorithm. All certificates issued from this root are quantum-vulnerable.",
    algorithm: 'ecdsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'Every TLS cert in the cluster (ingress, webhook, mTLS) is quantum-vulnerable. Adversaries recording cluster traffic today can decrypt it post-CRQC.',
    vulnerableConfig: `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
# ⚠️  Default key type is RSA-2048 — quantum-vulnerable`,
    pqcConfig: `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-pqc
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-pqc
    solvers:
    - http01:
        ingress:
          class: nginx
# ⚠️  PROJECTED EXAMPLE ONLY: cert-manager's Certificate privateKey.algorithm accepts
# RSA, ECDSA or Ed25519 today, with no ML-DSA value and no hybridAlgorithm field.
# For ML-DSA certificates use an issuer that supports them (for example Vault PKI or EJBCA).
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ingress-tls
spec:
  secretName: ingress-tls-secret
  privateKey:
    algorithm: MLDSA44          # projected: not an allowed value today
    hybridAlgorithm: ECDSA-P256 # projected: no such field today
  dnsNames:
  - example.com`,
  },
  {
    id: 'vault-pki-role',
    tool: 'vault',
    title: 'HashiCorp Vault: PKI Role Key Type',
    vulnerability:
      'Vault PKI roles default to RSA-2048 or ECDSA P-256 for generated certificates. All pipeline secrets encrypted to these certs are HNDL targets.',
    algorithm: 'rsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'CI/CD pipelines authenticate to Vault via TLS client certs. If these certs use RSA/ECDSA, a future CRQC can forge a client certificate and authenticate to Vault as the pipeline: a forgery risk. The recorded session is an HNDL target only through its key exchange.',
    vulnerableConfig: `# Vault PKI role — defaults to RSA-2048
vault write pki/roles/pipeline-role \\
  allowed_domains="pipeline.internal" \\
  allow_subdomains=true \\
  max_ttl="720h" \\
  key_type="rsa" \\
  key_bits=2048
# ⚠️  RSA-2048: broken by Shor's algorithm`,
    pqcConfig: `# Vault PKI role — ML-DSA-44
# The Vault PKI API documentation lists ml-dsa as a role key type, with a parameter_set
# of ml-dsa-44, ml-dsa-65 or ml-dsa-87.
vault write pki/roles/pipeline-role-pqc \\
  allowed_domains="pipeline.internal" \\
  allow_subdomains=true \\
  max_ttl="720h" \\
  key_type="ml-dsa" \\
  parameter_set="ml-dsa-44"
# ML-DSA-44 (FIPS 204 security category 2)`,
  },
  {
    id: 'helm-tls-values',
    tool: 'helm',
    title: 'Helm: TLS Cipher Suite Configuration',
    vulnerability:
      'Default nginx-ingress Helm values allow all TLS 1.2/1.3 cipher suites including ECDHE-based key exchange. TLS sessions with ECDHE key exchange are HNDL targets even if the certificate is short-lived.',
    algorithm: 'ecdh',
    pqcAlgorithm: 'ml-kem',
    impact:
      'Every HTTPS session to the ingress is an HNDL target. The key exchange (ECDHE) is the primary quantum-vulnerable component — not just the certificate signature.',
    vulnerableConfig: `# nginx-ingress values.yaml (default)
controller:
  config:
    ssl-protocols: "TLSv1.2 TLSv1.3"
    ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:..."
# ⚠️  ECDHE key exchange — HNDL vulnerable
# Even with short-lived cert, recorded sessions can be decrypted`,
    pqcConfig: `# nginx-ingress values.yaml (PQC-hardened)
controller:
  config:
    ssl-protocols: "TLSv1.3"
    # X25519MLKEM768 = ML-KEM-768 + X25519 hybrid TLS group (RFC 10024)
    ssl-ciphers: "TLS_AES_256_GCM_SHA384"
    # Enable PQC key exchange groups (nginx + OpenSSL 3.5)
    ssl-ecdh-curve: "X25519MLKEM768:X25519:P-256"
# ✅ X25519MLKEM768 hybrid: classical X25519 + ML-KEM-768
# Provides forward secrecy against both classical and quantum`,
  },
  {
    id: 'terraform-acm',
    tool: 'terraform',
    title: 'Terraform: ACM Certificate Key Algorithm',
    vulnerability:
      'AWS ACM certificates provisioned by Terraform default to RSA-2048 or EC_prime256v1 (ECDSA P-256). All TLS sessions to ACM-fronted endpoints are HNDL targets.',
    algorithm: 'ecdsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'All load balancer and CloudFront TLS sessions use ACM certs. HNDL adversaries recording this traffic gain access to API responses, auth tokens, and payload data.',
    vulnerableConfig: `resource "aws_acm_certificate" "api" {
  domain_name       = "api.example.com"
  validation_method = "DNS"
  # ⚠️  Default: RSA_2048 — quantum-vulnerable
  # key_algorithm defaults to RSA_2048
}`,
    pqcConfig: `resource "aws_acm_certificate" "api_pqc" {
  domain_name       = "api.example.com"
  validation_method = "DNS"
  # ✅ When ACM supports ML-DSA (AWS roadmap 2026):
  # key_algorithm = "ML_DSA_44"
  # Until then: use EC_prime256v1 + enable ML-KEM at ALB level
  key_algorithm = "EC_prime256v1"

  # Enable hybrid key exchange at ALB level when available
  # Check AWS ALB documentation for current PQC TLS policy names
}`,
  },
  {
    id: 'kubernetes-kubeconfig',
    tool: 'kubernetes',
    title: 'kubeconfig: Client Certificate Key Type',
    vulnerability:
      'kubeconfig client certificates (used by CI/CD tools like kubectl, Argo) use ECDSA P-256 or RSA-2048. These authenticate high-privilege cluster operations; with RSA or ECDSA a future quantum computer could forge them: a forgery risk, not harvest-now-decrypt-later.',
    algorithm: 'ecdsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'A recorded kubectl auth session, decrypted post-CRQC, reveals all API server responses including secret values, ConfigMaps, and deployment configs.',
    vulnerableConfig: `# kubeconfig client cert (generated by kubeadm or cert-manager)
users:
- name: ci-deployer
  user:
    client-certificate: /etc/ci/client.crt  # ECDSA P-256
    client-key: /etc/ci/client.key
# ⚠️  All API server communication is HNDL-exposed`,
    pqcConfig: `# PROJECTED EXAMPLE: rotate CI client cert to ML-DSA-44 via cert-manager
# (MLDSA44 is not an allowed privateKey.algorithm value in cert-manager today)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ci-deployer-cert
  namespace: kube-system
spec:
  secretName: ci-deployer-tls
  privateKey:
    algorithm: MLDSA44
  usages:
  - client auth
  issuerRef:
    name: cluster-ca-pqc
    kind: ClusterIssuer
# projected: ML-DSA-44 client cert for CI/CD pipeline auth`,
  },
  {
    id: 'vault-transit-key',
    tool: 'vault',
    title: 'Vault Transit: Encryption Key Type',
    vulnerability:
      'Vault Transit engine keys default to AES-256-GCM (symmetric, safe) but signing keys default to ECDSA P-256. Pipeline secrets signed with Transit ECDSA are quantum-vulnerable.',
    algorithm: 'ecdsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'Vault Transit is used to sign artifact hashes, API tokens, and configuration values. An ECDSA Transit key, if compromised, undermines the integrity of all signed pipeline artifacts.',
    vulnerableConfig: `# Vault Transit — ECDSA signing key (default for signing)
vault write transit/keys/pipeline-signer \\
  type=ecdsa-p256
# ⚠️  ECDSA P-256: broken by Shor's algorithm`,
    pqcConfig: `# Vault Transit — ML-DSA-44 signing key
# The Vault Transit documentation lists ml-dsa as an Enterprise key type; parameter_set
# is required (44, 65 or 87).
vault write transit/keys/pipeline-signer-pqc \\
  type=ml-dsa \\
  parameter_set=44
# ML-DSA-44 (FIPS 204 security category 2)

# Verify new key is active
vault read transit/keys/pipeline-signer-pqc`,
  },
]
