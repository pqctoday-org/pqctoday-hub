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
      'As of 2026-11-18, the Sigstore algorithm registry labels ML-DSA experimental and not operational within Sigstore, and the current Cosign release notes do not document ML-DSA signing or verification. Sigstore’s Oct 2, 2026 architecture proposal targets a separate production-ready PQC public instance for mid-2027, with major client revisions; that is a project target, not current Cosign support or a guarantee. The existing classical public instance is expected to remain supported until a tentative 2029/2030 turndown. Sources: https://blog.sigstore.dev/pqc-sigstore/ and https://github.com/sigstore/cosign/releases',
    sources: [
      { label: 'Sigstore PQC proposal', url: 'https://blog.sigstore.dev/pqc-sigstore/' },
      { label: 'Cosign releases', url: 'https://github.com/sigstore/cosign/releases' },
      {
        label: 'Sigstore algorithm registry',
        url: 'https://github.com/sigstore/protobuf-specs/blob/main/protos/sigstore_common.proto',
      },
    ],
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
      'The proposed PQC public instance changes the keyless flow to use a signed transparency-log proof instead of an ephemeral key and certificate; do not assume this design or its security properties apply to today’s classical instance',
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
    signatureFormat:
      'Notary Project signature envelope: JWS or COSE; signing algorithm depends on the configured provider',
    transparencyLog: false,
    pqcReadiness: 'unconfirmed',
    pqcNotes:
      'The Notary Project signature specification supports JWS and COSE envelopes and its listed signature algorithms are currently RSA-PSS and ECDSA. We found no Notation or AWS Signer Notation plugin documentation confirming ML-DSA signing. RFC 10073 now standardizes Composite ML-DSA in X.509/PKIX, but a standard does not establish CLI, plugin, CA, or verifier support. Sources: https://github.com/notaryproject/specifications/blob/main/specs/signature-specification.md, https://github.com/notaryproject/specifications/blob/main/specs/signature-envelope-jws.md, https://github.com/aws/aws-signer-notation-plugin, https://www.rfc-editor.org/rfc/rfc10073.html',
    sources: [
      {
        label: 'Notary signature specification',
        url: 'https://github.com/notaryproject/specifications/blob/main/specs/signature-specification.md',
      },
      {
        label: 'JWS envelope specification',
        url: 'https://github.com/notaryproject/specifications/blob/main/specs/signature-envelope-jws.md',
      },
      {
        label: 'AWS Signer Notation plugin',
        url: 'https://github.com/aws/aws-signer-notation-plugin',
      },
      { label: 'RFC 10073', url: 'https://www.rfc-editor.org/rfc/rfc10073.html' },
    ],
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
      'RFC 10073 now standardizes Composite ML-DSA algorithm identifiers and their use in X.509/PKIX. Check whether each Notation implementation, signing provider, certificate authority and verifier supports the required profile before deployment.',
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
    signatureFormat: 'OpenPGP packets (RFC 9580; RFC 9980 adds PQ/T algorithm IDs)',
    transparencyLog: false,
    pqcReadiness: 'unconfirmed',
    pqcNotes:
      'RFC 9980 specifies composite ML-DSA+EdDSA signatures and ML-KEM+ECDH encryption for OpenPGP. GnuPG 2.5.24 adds --allow-9980 and documents ML-KEM hybrid encryption in that mode; its release notes do not document RFC 9980 signature creation or verification. GnuPG’s default mode remains oriented toward LibrePGP, which has a distinct PQC format. Do not infer signing support from RFC 9980 parsing or encryption support, and verify the selected implementation and mode. Sources: https://www.rfc-editor.org/rfc/rfc9980.html, https://lists.gnupg.org/pipermail/gnupg-announce/2026q3/000516.html, https://gnupg.org/documentation/manuals/gnupg/GPG-Esoteric-Options.html',
    sources: [
      { label: 'RFC 9980', url: 'https://www.rfc-editor.org/rfc/rfc9980.html' },
      {
        label: 'GnuPG 2.5.24 release announcement',
        url: 'https://lists.gnupg.org/pipermail/gnupg-announce/2026q3/000516.html',
      },
      {
        label: 'GnuPG --allow-9980 manual',
        url: 'https://gnupg.org/documentation/manuals/gnupg/GPG-Esoteric-Options.html',
      },
    ],
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: 'Not stated',
    strengths: [
      'Ubiquitous — supported by every Linux package manager',
      'RFC 9980 defines OpenPGP post-quantum algorithms, including composite ML-DSA signatures; implementation support depends on the product and mode',
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
      'The current algorithm registry labels ML-DSA experimental and not yet operational. Sigstore’s Oct 2, 2026 architecture proposal targets a separate PQC public instance for mid-2027, initially opt-in, with a new ML-DSA-signed trust repository and a redesigned log-proof signing flow. This is a roadmap target, not a currently deployed public service. Source: https://blog.sigstore.dev/pqc-sigstore/',
    sources: [
      { label: 'Sigstore PQC proposal', url: 'https://blog.sigstore.dev/pqc-sigstore/' },
      {
        label: 'Sigstore algorithm registry',
        url: 'https://github.com/sigstore/protobuf-specs/blob/main/protos/sigstore_common.proto',
      },
    ],
    pqcAlgorithm: 'ml-dsa',
    estimatedPqcYear: 'Mid-2027 target for separate PQC instance (proposal)',
    strengths: [
      'Self-contained: verification needs only the bundle, no external lookups',
      'Includes Rekor inclusion proof and certificate chain',
      'Works offline (frozen log proof embedded in bundle)',
      'Portable — stores alongside any artifact type',
    ],
    limitations: [
      'Larger than raw signatures (~3KB+ with inclusion proof)',
      'The proposed PQC public instance has a mid-2027 target; verify current project status before planning against it',
      'The PQC design proposes a separate infrastructure stack and a changed keyless flow; do not model it as a simple in-place Rekor/Fulcio algorithm upgrade',
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
      "Docker's retirement notice says Docker Content Trust and notary.docker.io are being fully retired, with the service shutdown scheduled for December 8, 2026; Docker names Sigstore/Cosign and Notation as migration alternatives and makes no PQ signature-support claim. Recheck the service status and migration guidance before acting. Source: https://docs.docker.com/retired/. Ed25519 is quantum-vulnerable to Shor's algorithm despite being resistant to classical attacks.",
    sources: [
      { label: 'Docker retired products and features', url: 'https://docs.docker.com/retired/' },
      {
        label: 'Docker Content Trust guide',
        url: 'https://docs.docker.com/engine/security/trust/',
      },
    ],
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
