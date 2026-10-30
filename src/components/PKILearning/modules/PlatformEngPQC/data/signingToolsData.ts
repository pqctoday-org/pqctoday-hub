// SPDX-License-Identifier: AGPL-3.0-only
import type { SigningTool } from './platformEngConstants'

export const SIGNING_TOOLS: SigningTool[] = [
  {
    id: 'cosign',
    name: 'cosign',
    description:
      'OCI-native container image signing tool from the Sigstore project. Signs images by attaching signatures as OCI referrers in the registry. Supports keyless signing via OIDC identity binding.',
    vendor: 'Sigstore / Linux Foundation',
    signingAlgorithm: 'ecdsa',
    signatureFormat: 'OCI Referrers (ECDSA-P256 + SHA-256)',
    transparencyLog: true,
    pqcReadiness: 'roadmap',
    pqcNotes:
      'cosign v2.x roadmap includes ML-DSA support via the OCI Signature Spec v1.1 PQC profile. The Rekor transparency log must also be updated to accept ML-DSA entries. Target: 2026.',
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: '2026',
    strengths: [
      'Keyless signing via OIDC (no long-lived private key to protect)',
      'OCI-native — signatures stored in registry alongside images',
      'Rekor transparency log provides append-only audit trail',
      'Widely adopted in SLSA Level 3+ build systems',
    ],
    limitations: [
      "Current ECDSA P-256 signature vulnerable to Shor's algorithm",
      'PQC ML-DSA signatures ~52× larger than ECDSA (3.3KB vs 64B)',
      'Rekor log must be migrated to ML-DSA before keyless signing is quantum-safe',
      'Verification tooling must be updated to handle larger signature blobs',
    ],
  },
  {
    id: 'notation',
    name: 'Notation',
    description:
      'OCI artifact signing tool from CNCF. Signs any OCI artifact (images, Helm charts, SBOMs) using X.509 certificate-backed signatures. Integrates with hardware keystores and TSAs.',
    vendor: 'CNCF / Microsoft',
    signingAlgorithm: 'ecdsa',
    signatureFormat: 'COSE Sign1 / JWS (ECDSA-P256 or RSA-PSS)',
    transparencyLog: false,
    pqcReadiness: 'beta',
    pqcNotes:
      'Notation has ML-DSA-65 support available now via the AWS Crypto Tools plugin (beta). Plugin system allows swapping signing backends without changing the CLI. Composite (ECDSA + ML-DSA) certificate signing will enable gradual migration.',
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: '2026',
    strengths: [
      'Certificate-backed (X.509): integrates with existing PKI and CAs',
      'Plugin architecture allows swapping ML-DSA signing backends',
      'TSA (RFC 3161) timestamp support for long-lived signatures',
      'Signs any OCI artifact: images, Helm charts, SBOMs',
    ],
    limitations: [
      'No built-in transparency log (must pair with Rekor or similar)',
      'X.509 certificate chain must also be migrated to ML-DSA',
      'Composite cert format not yet standardized (OID in draft)',
      'Registry must support OCI referrers API for signature storage',
    ],
  },
  {
    id: 'gpg',
    name: 'GPG / PGP',
    description:
      'Legacy signing tool used for Helm charts, Debian/RPM package signing, and Git commit signing. RSA or ECDSA keys stored in keyring files. Widely deployed but difficult to migrate.',
    vendor: 'GnuPG project',
    signingAlgorithm: 'rsa',
    signatureFormat: 'OpenPGP packet format (RFC 9580)',
    transparencyLog: false,
    pqcReadiness: 'roadmap',
    pqcNotes:
      'RFC 9980 (Standards Track, June 2026, the former draft-ietf-openpgp-pqc) adds post-quantum OpenPGP: for signatures the composite schemes ML-DSA-65+Ed25519 (MUST) and ML-DSA-87+Ed448 (SHOULD), and standalone SLH-DSA (MAY). Note: GnuPG is pursuing the LibrePGP format (diverging from RFC 9580); Sequoia-PGP implements RFC 9580 (OpenPGP v6). Whether each implements RFC 9980 is not stated in the held documents. Migration requires re-signing all artifacts with new PQC keys.',
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: '2026',
    strengths: [
      'Ubiquitous — supported by every Linux package manager',
      'RFC 9980 adds post-quantum signatures to OpenPGP: composite ML-DSA schemes and standalone SLH-DSA',
      'Decentralized key distribution via keyservers',
    ],
    limitations: [
      'Current RSA-4096/ECDSA P-256 keys are quantum-vulnerable',
      'Key management complexity (keyring files, trust levels)',
      'No transparency log — revocation relies on keyservers',
      'Migration requires re-signing entire package archive',
    ],
  },
  {
    id: 'sigstore-bundle',
    name: 'Sigstore Bundle',
    description:
      'Standard Sigstore artifact bundle format (.sigstore.json) combining signature, Rekor inclusion proof, certificate, and timestamp in a single portable JSON document.',
    vendor: 'Sigstore / Linux Foundation',
    signingAlgorithm: 'ecdsa',
    signatureFormat: 'JSON bundle (signature + Rekor log proof + cert chain)',
    transparencyLog: true,
    pqcReadiness: 'roadmap',
    pqcNotes:
      'Sigstore Bundle v0.3+ specification includes provisions for PQC algorithm identifiers. The bundle format is algorithm-agnostic; the Rekor log and Fulcio CA must be PQC-enabled before bundle signatures are quantum-safe end-to-end.',
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: '2027',
    strengths: [
      'Self-contained: verification needs only the bundle, no external lookups',
      'Includes Rekor inclusion proof and certificate chain',
      'Works offline (frozen log proof embedded in bundle)',
      'Portable — stores alongside any artifact type',
    ],
    limitations: [
      'Larger than raw signatures (~3KB+ with inclusion proof)',
      'PQC bundle format not yet stable (spec in draft)',
      'Rekor and Fulcio PQC migration are prerequisites',
    ],
  },
  {
    id: 'dct',
    name: 'Docker Content Trust (DCT)',
    description:
      "Docker's built-in signing mechanism based on The Update Framework (TUF). Stores Ed25519 or RSA signatures in a Notary v1 server alongside the registry.",
    vendor: 'Docker / CNCF',
    signingAlgorithm: 'ed25519',
    signatureFormat: 'TUF metadata (Ed25519 / RSA signatures)',
    transparencyLog: false,
    pqcReadiness: 'not-planned',
    pqcNotes:
      "Docker is fully retiring DCT and the Notary v1 service (full shutdown 8 December 2026; the upstream Notary v1 codebase is no longer maintained) and names Sigstore/Cosign and Notation as the alternatives; its guidance says nothing about post-quantum signatures. Ed25519 is a Schnorr-type signature scheme — quantum-vulnerable to Shor's algorithm despite being resistant to classical attacks.",
    estimatedPqcYear: 'N/A',
    strengths: [
      'Built into Docker CLI (DOCKER_CONTENT_TRUST=1)',
      'TUF delegation model for fine-grained signing authority',
    ],
    limitations: [
      "Ed25519 is quantum-vulnerable (Shor's algorithm breaks discrete log)",
      'DCT and the Notary v1 service are being fully retired (full shutdown 8 December 2026)',
      'Not OCI-native: signatures stored in separate Notary server',
      'Migrate to an OCI-native signing tool such as Sigstore/Cosign or Notation (Docker’s guidance)',
    ],
  },
]
