// SPDX-License-Identifier: AGPL-3.0-only
import {
  CERT_MANAGER_MLDSA_MANIFESTS,
  CERT_MANAGER_CI_MLDSA_MANIFESTS,
} from './certManagerAlphaSample'
import type { IaCPattern } from './platformEngConstants'
import { OPENBAO_PKI_ROLE_RECIPE } from './openBaoPolicyExamples'

export const IAC_PATTERNS: IaCPattern[] = [
  {
    id: 'cert-manager-issuer',
    tool: 'cert-manager',
    title: 'cert-manager: Certificate Subject Key',
    vulnerability:
      'The classical fixture explicitly selects an RSA-2048 certificate subject key. That signing key is vulnerable to a future cryptographically relevant quantum computer. Changing an ACME account key or an Issuer name does not select the issued certificate subject key.',
    algorithm: 'rsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'This worked SelfSigned example changes certificate authentication keys, not TLS key establishment. Use the pinned unreleased snapshot with MLDSAPrivateKeys enabled on controller and webhook; stable v1.21.3 does not support it. Verify the issued key and renewal before assessing a production issuer or TLS consumer. SelfSigned output is not automatically trusted by other systems.',
    vulnerableConfig: CERT_MANAGER_MLDSA_MANIFESTS.replace(
      'algorithm: MLDSA',
      'algorithm: RSA'
    ).replace('size: 65', 'size: 2048'),
    pqcConfig: CERT_MANAGER_MLDSA_MANIFESTS,
  },
  {
    id: 'vault-pki-role',
    tool: 'vault',
    title: 'OpenBao: PKI Role Key Type',
    vulnerability:
      'This classical sample explicitly selects an RSA-2048 subject key. A future cryptographically relevant quantum computer threatens signatures made with that key; changing a certificate signing key is separate from protecting TLS key establishment.',
    algorithm: 'rsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'CI/CD client authentication needs a supported signing key and a trusted issuer chain. The OpenBao sample selects the role parameter set explicitly and issues a short-lived fictional certificate; validate its actual key, issuer and intended usage before configuring a consumer.',
    vulnerableConfig: `# OpenBao PKI role — explicitly selected RSA-2048
bao write pki/roles/pipeline-role \\
  allowed_domains="pipeline.internal" \\
  allow_subdomains=true \\
  max_ttl="720h" \\
  key_type="rsa" \\
  key_bits=2048
# ⚠️  RSA-2048: broken by Shor's algorithm`,
    pqcConfig: OPENBAO_PKI_ROLE_RECIPE,
  },
  {
    id: 'helm-tls-values',
    tool: 'helm',
    title: 'Helm: TLS Key-Exchange Group Configuration',
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
    pqcConfig: `# ingress-nginx controller values.yaml: separate groups from cipher suites
# Configuration grammar checked with nginx 1.30.4 linked to OpenSSL 3.6.3.
# Check the nginx/OpenSSL build in your selected controller image too.
controller:
  config:
    ssl-protocols: "TLSv1.3"
    # X25519MLKEM768 = ML-KEM-768 + X25519 hybrid TLS group (RFC 10024)
    # TLS 1.3 cipher-suite defaults remain separate from key-exchange groups.
    # ssl-ciphers is not the place for TLS 1.3 suites or hybrid group names.
    # This controller ConfigMap key becomes nginx ssl_ecdh_curve (OpenSSL 3.5+).
    ssl-ecdh-curve: "X25519MLKEM768:X25519:P-256"
# X25519MLKEM768 offers hybrid X25519 + ML-KEM-768 first.
# X25519 and P-256 are permitted classical fallbacks, not post-quantum exchange.
# nginx -t checks configuration; inspect the negotiated group in a sample handshake.`,
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
    title: 'CI Identity: Certificate Subject Key and Purpose',
    vulnerability:
      'An RSA or ECDSA client certificate authenticates a caller and faces future signature forgery. Its signing key does not select the TLS key-exchange group, so the authentication algorithm alone does not establish harvest-now-decrypt-later exposure.',
    algorithm: 'ecdsa',
    pqcAlgorithm: 'ml-dsa',
    impact:
      'The working snapshot example issues an ML-DSA-65 certificate with explicit client-auth usage. It tests certificate issuance and renewal capabilities, not a Kubernetes login. Evaluate the API server/TLS consumer, trusted issuer, subject-to-RBAC mapping and key handling separately before using a certificate for CI authentication.',
    vulnerableConfig: CERT_MANAGER_CI_MLDSA_MANIFESTS.replace(
      'algorithm: MLDSA',
      'algorithm: ECDSA'
    ).replace('size: 65', 'size: 256'),
    pqcConfig: CERT_MANAGER_CI_MLDSA_MANIFESTS,
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
