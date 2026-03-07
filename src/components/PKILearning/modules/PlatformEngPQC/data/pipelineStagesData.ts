// SPDX-License-Identifier: GPL-3.0-only
import type { PipelineStage } from './platformEngConstants'

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'source',
    label: 'Source Control',
    description:
      'Git repositories hold the root of all software. Signing commits, webhook secrets, and deploy keys are the first cryptographic layer an attacker targets.',
    tools: ['GitHub', 'GitLab', 'Bitbucket', 'Gitea'],
    hndlExposure: 'medium',
    migrationPriority: 'high',
    cryptoAssets: [
      {
        id: 'src-commit-sign',
        name: 'Git Commit Signing Keys',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'medium',
        pqcReplacement: 'ML-DSA-44 or SLH-DSA-SHAKE-128s',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '10–30 years (repo history must stay authentic)',
        notes:
          'Stolen ECDSA private key allows forged commits. Compromised historical commit signatures undermine software provenance for the life of the project.',
      },
      {
        id: 'src-webhook',
        name: 'Webhook HMAC Secrets',
        type: 'secret',
        algorithm: 'hmac',
        keySize: 'SHA-256 / 256-bit',
        quantumVulnerable: false,
        hndlRisk: 'none',
        pqcReplacement: 'HMAC-SHA-256 (already quantum-safe)',
        pqcAlgorithm: 'hmac',
        exposureWindow: 'Short-lived (rotate with each deployment)',
        notes:
          "Grover's algorithm provides only a quadratic speedup against HMAC. SHA-256 remains quantum-safe at 128-bit post-quantum security.",
      },
      {
        id: 'src-deploy-key',
        name: 'Deploy Keys (SSH RSA/ECDSA)',
        type: 'signing-key',
        algorithm: 'rsa',
        keySize: 'RSA-3072 / ECDSA P-256',
        quantumVulnerable: true,
        hndlRisk: 'medium',
        pqcReplacement:
          'ML-DSA-44 (pending IETF PQ SSH draft; OpenSSH 9.x has PQ key exchange only)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '2–5 years (typically rotated with repo access reviews)',
        notes:
          'SSH now supports sntrup761x25519 for key exchange, but Ed25519/RSA signing keys remain quantum-vulnerable.',
      },
    ],
  },
  {
    id: 'build',
    label: 'CI/CD Build',
    description:
      'Build pipelines use OIDC tokens, mTLS to secrets vaults, and registry auth. Each of these cryptographic sessions may be harvested in transit.',
    tools: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'Tekton', 'CircleCI', 'ArgoCD'],
    hndlExposure: 'high',
    migrationPriority: 'critical',
    cryptoAssets: [
      {
        id: 'build-oidc',
        name: 'CI/CD OIDC Tokens (JWT)',
        type: 'token',
        algorithm: 'ecdsa',
        keySize: 'ES256 (P-256)',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-65 JWT signing (JOSE draft)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          '15+ years (OIDC provider cert chains must remain trusted for audit trails)',
        notes:
          'GitHub Actions OIDC and similar use ES256 JWTs to authenticate build jobs. A compromised OIDC signing key allows forging pipeline identities.',
      },
      {
        id: 'build-vault-mtls',
        name: 'Vault mTLS Sessions',
        type: 'tls-session',
        algorithm: 'ecdh',
        keySize: 'P-256 / TLS 1.3 ECDHE',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-KEM-768 (X-Wing hybrid TLS)',
        pqcAlgorithm: 'ml-kem',
        exposureWindow: '10+ years (secrets may remain sensitive long after session)',
        notes:
          "HNDL is the primary concern: an adversary recording Vault mTLS traffic today can decrypt it post-CRQC, exposing every secret the pipeline fetched. This is the pipeline's highest-risk crypto asset.",
      },
      {
        id: 'build-registry-auth',
        name: 'Container Registry Auth TLS',
        type: 'tls-session',
        algorithm: 'ecdh',
        keySize: 'P-256 / TLS 1.3 ECDHE',
        quantumVulnerable: true,
        hndlRisk: 'medium',
        pqcReplacement: 'ML-KEM-768 hybrid TLS (NIST FIPS 203)',
        pqcAlgorithm: 'ml-kem',
        exposureWindow: '5–10 years (image pull credentials and layer checksums in transit)',
        notes:
          'Registry pulls during CI may expose internal image layer contents if TLS traffic is recorded. Upgrade registry endpoints to ML-KEM hybrid TLS.',
      },
    ],
  },
  {
    id: 'sign',
    label: 'Artifact Signing',
    description:
      'Container images, SBOMs, and build attestations are signed before publication. These signatures must remain trustworthy for the lifetime of the software.',
    tools: ['cosign', 'Notation', 'Sigstore', 'GPG', 'in-toto'],
    hndlExposure: 'high',
    migrationPriority: 'critical',
    cryptoAssets: [
      {
        id: 'sign-image-key',
        name: 'Container Image Signing Key (ECDSA)',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-65 (cosign v2.x with PQC support)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          '10–25 years (images remain in production and must be verifiable for compliance)',
        notes:
          'The most critical asset in the pipeline. A compromised or quantum-broken image signing key allows supply chain attacks: forged images accepted as authentic.',
      },
      {
        id: 'sign-sbom',
        name: 'SBOM Attestation Signatures',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256 (DSSE envelope)',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'SLH-DSA-SHAKE-128f (stateless, long signature lifetime)',
        pqcAlgorithm: 'slh-dsa',
        exposureWindow: '20+ years (SBOMs are used for compliance audits years after release)',
        notes:
          'SLH-DSA is preferred for SBOMs over ML-DSA because stateless hash-based signatures have no key state to manage and are well-suited to long-lived attestation documents.',
      },
      {
        id: 'sign-provenance',
        name: 'Build Provenance (SLSA)',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-44 (SLSA provenance envelope)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '10–20 years (provenance used in supply chain audits)',
        notes:
          'SLSA build provenance attestations link artifacts to their build environment. Forged provenance allows SLSA Level 4 bypass even with other controls in place.',
      },
    ],
  },
  {
    id: 'registry',
    label: 'Container Registry',
    description:
      'Registries store signed images. TLS sessions for pushes and pulls, image manifest signatures, and registry certificates are all quantum-vulnerable.',
    tools: ['Docker Hub', 'Amazon ECR', 'Google Artifact Registry', 'Harbor', 'Quay.io'],
    hndlExposure: 'medium',
    migrationPriority: 'high',
    cryptoAssets: [
      {
        id: 'reg-tls-cert',
        name: 'Registry TLS Certificate',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: "P-256 / Let's Encrypt",
        quantumVulnerable: true,
        hndlRisk: 'medium',
        pqcReplacement: 'ML-DSA-65 hybrid cert (dual-algorithm X.509)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '1–2 years (short-lived, but TLS sessions recorded during lifetime)',
        notes:
          'Even short-lived certs create HNDL risk because adversaries can record the TLS session and decrypt it later. Hybrid certificates maintain backward compatibility during migration.',
      },
      {
        id: 'reg-manifest-sig',
        name: 'OCI Image Manifest Signature',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256 (OCI referrers API)',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-65 via Notation or cosign v2.x',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '10+ years (images remain in use post-deployment)',
        notes:
          'OCI manifest signatures are stored in the registry as referrers. The signature format is standardized in OCI Image Spec v1.1 and must be updated to carry PQC signatures.',
      },
    ],
  },
  {
    id: 'deploy',
    label: 'Kubernetes Deploy',
    description:
      'Kubernetes API server, admission webhooks, kubeconfig TLS, and Helm chart signatures all use classical cryptography that must be migrated.',
    tools: ['kubectl', 'Helm', 'ArgoCD', 'Flux', 'Kustomize'],
    hndlExposure: 'high',
    migrationPriority: 'critical',
    cryptoAssets: [
      {
        id: 'deploy-apiserver-tls',
        name: 'kube-apiserver TLS Certificate',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256 / RSA-2048',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-65 hybrid cert (cert-manager v1.17+ PQC issuer)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '1 year (rotated annually, but control plane TLS is high-value target)',
        notes:
          'The kube-apiserver certificate is the master key to the entire cluster. All kubectl and controller traffic is encrypted with this cert. A HNDL adversary recording this traffic gains access to every resource operation.',
      },
      {
        id: 'deploy-webhook-tls',
        name: 'Admission Webhook TLS',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'medium',
        pqcReplacement: 'ML-DSA-65 via cert-manager',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '1 year',
        notes:
          'Admission webhooks (including OPA/Kyverno) use TLS. A MITM on the API server → webhook TLS connection could suppress policy enforcement silently.',
      },
      {
        id: 'deploy-helm-sig',
        name: 'Helm Chart Signatures (GPG)',
        type: 'signing-key',
        algorithm: 'rsa',
        keySize: 'RSA-4096 (GPG keyring)',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-87 (Helm v4 PQC signing backend)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '10+ years (chart provenance must remain verifiable for audit)',
        notes:
          'Helm chart GPG signing (helm package --sign) uses RSA or ECDSA keys. Helm v4 is expected to support PQC signing backends. Until then, migrate to Notation for OCI-packaged charts.',
      },
    ],
  },
  {
    id: 'runtime',
    label: 'Runtime & Service Mesh',
    description:
      'In-cluster mTLS (Istio/Linkerd), SPIFFE workload identity, and cert-manager issued certificates encrypt all pod-to-pod communication.',
    tools: ['Istio', 'Linkerd', 'SPIFFE/SPIRE', 'cert-manager', 'Envoy'],
    hndlExposure: 'high',
    migrationPriority: 'high',
    cryptoAssets: [
      {
        id: 'run-mesh-mtls',
        name: 'Service Mesh mTLS (SPIFFE SVIDs)',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256 (SPIFFE SVID, 1-hour TTL)',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-44 SVID + ML-KEM-512 key exchange',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          '1 hour (short-lived certs, but encrypted payloads may be sensitive for 10+ years)',
        notes:
          'SPIFFE SVIDs are short-lived, but the data they protect (API calls, internal service responses) may remain sensitive for years. HNDL adversaries record the traffic and decrypt post-CRQC.',
      },
      {
        id: 'run-certmanager-certs',
        name: 'cert-manager Issued Certificates',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256 (configurable)',
        quantumVulnerable: true,
        hndlRisk: 'medium',
        pqcReplacement: 'ML-DSA-44 via cert-manager PQC issuer (v1.17+)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '90 days – 1 year',
        notes:
          'cert-manager v1.17+ supports PQC algorithms via OpenSSL 3.5 integration. Change CertificateRequest.spec.privateKey.algorithm to ML-DSA-44.',
      },
    ],
  },
]
