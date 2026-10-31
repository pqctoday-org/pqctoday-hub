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
    pqcReadiness: 'unconfirmed',
    pqcNotes:
      'Sigstore says (June 2025) that it wants people to be able to sign content with post-quantum keys as soon as possible. ML-DSA, chosen over SLH-DSA for its smaller signature size, has been added to the Sigstore protocol buffer specification so that clients can experiment with ML-DSA keys in Sigstore bundles, while the Sigstore services (Fulcio, Rekor and a timestamp authority) will adopt post-quantum algorithms when reliable, vetted implementations are available in the Go ecosystem. The post gives no production date and does not mention cosign; the held cosign changelog (v3.0.x) lists no post-quantum feature.',
    estimatedPqcYear: 'Not stated',
    strengths: [
      'Keyless signing via OIDC (no long-lived private key to protect)',
      'OCI-native — signatures stored in registry alongside images',
      'Rekor transparency log provides append-only audit trail',
      'Signs build artifacts in supply chain pipelines',
    ],
    limitations: [
      "Current ECDSA P-256 signature vulnerable to Shor's algorithm",
      'PQC ML-DSA signatures are much larger than ECDSA P-256 (2,420 B for ML-DSA-44, 3,309 B for ML-DSA-65, 4,627 B for ML-DSA-87, vs 64 B)',
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
    pqcReadiness: 'unconfirmed',
    pqcNotes:
      'We found no vendor documentation stating that Notation, or the plugin that signs through AWS Signer, supports ML-DSA, so any ML-DSA support is unconfirmed. Check the Notary Project and plugin documentation for current status.',
    estimatedPqcYear: 'Not stated',
    strengths: [
      'Certificate-backed (X.509): integrates with existing PKI and CAs',
      'Plugin architecture: signing backends are supplied by plugins',
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
    pqcReadiness: 'unconfirmed',
    pqcNotes:
      'RFC 9980 (Standards Track, June 2026, the former draft-ietf-openpgp-pqc) adds post-quantum OpenPGP: for signatures a conformant implementation MUST implement the composite scheme ML-DSA-65+Ed25519 and SHOULD also implement ML-DSA-87+Ed448; standalone SLH-DSA is optional (MAY). Note: GnuPG is pursuing the LibrePGP format (diverging from RFC 9580); Sequoia-PGP implements RFC 9580 (OpenPGP v6). Whether each implements RFC 9980 is not stated in the held documents. Migration requires re-signing all artifacts with new PQC keys.',
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: 'Not stated',
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
      'Sigstore says (June 2025) that ML-DSA has been added to its protocol buffer specification so that clients can experiment with ML-DSA ephemeral keys in Sigstore bundles. The post gives no date for its public services; this module reasons that bundle signatures would only be quantum-safe end-to-end once the Rekor log and Fulcio CA are post-quantum enabled.',
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: 'No date stated',
    strengths: [
      'Self-contained: verification needs only the bundle, no external lookups',
      'Includes Rekor inclusion proof and certificate chain',
      'Works offline (frozen log proof embedded in bundle)',
      'Portable — stores alongside any artifact type',
    ],
    limitations: [
      'Larger than raw signatures (~3KB+ with inclusion proof)',
      'No production date for post-quantum signing in the public Sigstore services (Sigstore, June 2025)',
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
    pqcReadiness: 'retiring',
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
