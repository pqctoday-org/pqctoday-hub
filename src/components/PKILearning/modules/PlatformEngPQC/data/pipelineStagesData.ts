// SPDX-License-Identifier: AGPL-3.0-only
import type { PipelineStage } from './platformEngConstants'

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'source',
    label: 'Source Control',
    description:
      'Git repositories hold the root of all software. Signing commits, webhook secrets, and deploy keys are the first cryptographic layer an attacker targets.',
    tools: ['GitHub', 'GitLab', 'Bitbucket', 'Gitea'],
    hndlExposure: 'none',
    migrationPriority: 'high',
    cryptoAssets: [
      {
        id: 'src-commit-sign',
        name: 'Git Commit Signing Keys',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'none',
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
        hndlRisk: 'none',
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
        hndlRisk: 'none',
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
        pqcReplacement: 'X25519MLKEM768 (TLS hybrid key exchange)',
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
    hndlExposure: 'none',
    migrationPriority: 'critical',
    cryptoAssets: [
      {
        id: 'sign-image-key',
        name: 'Container Image Signing Key (ECDSA)',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement: 'ML-DSA-65 (once the signing tool supports it)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          "10–25 years (images remain in production and must be verifiable for compliance) (this module's planning assumption, not a measurement)",
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
        hndlRisk: 'none',
        pqcReplacement: 'SLH-DSA-SHAKE-128f (stateless, long signature lifetime)',
        pqcAlgorithm: 'slh-dsa',
        exposureWindow: '20+ years (SBOMs are used for compliance audits years after release)',
        notes:
          'SLH-DSA uses stateless hash-based signatures with no key state to manage, making it suited for long-lived attestation documents like SBOMs that may be referenced years after signing. ML-DSA is stateless and requires no key-state management (only stateful XMSS/LMS do).',
      },
      {
        id: 'sign-provenance',
        name: 'Build Provenance (SLSA)',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement: 'ML-DSA-44 (SLSA provenance envelope)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '10–20 years (provenance used in supply chain audits)',
        notes:
          'SLSA build provenance attestations link artifacts to their build environment. Forged provenance lets an attacker pass SLSA provenance checks even with other controls in place.',
      },
    ],
  },
  {
    id: 'registry',
    label: 'Container Registry',
    description:
      'Registries store signed images. TLS sessions for pushes and pulls, image manifest signatures, and registry certificates are all quantum-vulnerable.',
    tools: ['Docker Hub', 'Amazon ECR', 'Google Artifact Registry', 'Harbor', 'Quay.io'],
    hndlExposure: 'none',
    migrationPriority: 'high',
    cryptoAssets: [
      {
        id: 'reg-tls-cert',
        name: 'Registry TLS Certificate',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: "P-256 / Let's Encrypt",
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement:
          'ML-DSA-65 certificate from an issuer that supports ML-DSA (for example Vault PKI or EJBCA)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          '1–2 years (certificate lifetime: the window in which a forged signature would be accepted)',
        notes:
          'A short-lived certificate limits how long a forged signature would stay useful; it does not protect a recorded TLS session, whose confidentiality depends on the key exchange (NIST IR 8547: harvest-now-decrypt-later concerns encrypted data, and authentication may be transitioned at a different time).',
      },
      {
        id: 'reg-manifest-sig',
        name: 'OCI Image Manifest Signature',
        type: 'signing-key',
        algorithm: 'ecdsa',
        keySize: 'P-256 (OCI referrers API)',
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement: 'ML-DSA-65 (once the signing tool supports it)',
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
    hndlExposure: 'none',
    migrationPriority: 'critical',
    cryptoAssets: [
      {
        id: 'deploy-apiserver-tls',
        name: 'kube-apiserver TLS Certificate',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256 / RSA-2048',
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement:
          'ML-DSA-65 certificate from an issuer that supports ML-DSA (for example Vault PKI or EJBCA)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          '1 year (rotated annually: the window in which a forged signature would be accepted; the control plane is a high-value target)',
        notes:
          'The kube-apiserver certificate authenticates the control plane to every kubectl and controller connection. With an RSA or ECDSA key, a future quantum computer could forge it and impersonate the API server: a forgery risk, not harvest-now-decrypt-later. The confidentiality of recorded kubectl and controller traffic depends on the TLS key exchange (NIST IR 8547).',
      },
      {
        id: 'deploy-webhook-tls',
        name: 'Admission Webhook TLS',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256',
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement:
          'ML-DSA-65 certificate from an ML-DSA-capable issuer, delivered through cert-manager',
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
        hndlRisk: 'none',
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
        name: 'Service Mesh mTLS (key exchange and SPIFFE SVIDs)',
        type: 'tls-session',
        algorithm: 'ecdsa',
        keySize: 'P-256 (SPIFFE SVID, 1-hour TTL)',
        quantumVulnerable: true,
        hndlRisk: 'high',
        pqcReplacement: 'ML-DSA-44 SVID + ML-KEM-512 key exchange',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow:
          '1 hour (short-lived certs, but encrypted payloads may be sensitive for 10+ years)',
        notes:
          'A forged SPIFFE SVID is an authentication risk, and SVIDs are short-lived. The harvest-now-decrypt-later exposure is the mTLS key exchange: the data it protects (API calls, internal service responses) may remain sensitive for years, and an adversary who records the traffic can decrypt it once the key exchange can be broken.',
      },
      {
        id: 'run-certmanager-certs',
        name: 'cert-manager Issued Certificates',
        type: 'certificate',
        algorithm: 'ecdsa',
        keySize: 'P-256 (configurable)',
        quantumVulnerable: true,
        hndlRisk: 'none',
        pqcReplacement: 'ML-DSA-44 from an ML-DSA-capable issuer (for example Vault PKI or EJBCA)',
        pqcAlgorithm: 'ml-dsa',
        exposureWindow: '90 days – 1 year',
        notes:
          'The cert-manager Certificate privateKey.algorithm field accepts RSA, ECDSA or Ed25519; request ML-DSA-44 certificates from an issuer that supports them.',
      },
    ],
  },
]
