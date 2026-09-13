---
generated: 2026-09-11
category: Technical Standards
document_count: 6
requirement_count: 35
---

## Cloudflare-MTC-Blog
- **Source**: Keeping the Internet fast and secure: introducing Merkle Tree Certificates
- **URL**: https://blog.cloudflare.com/bootstrap-mtc/
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · certificates_: Ensure certificate transparency by requiring certificates to be logged in at least two trusted logs before they are accepted by major browsers.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Deploy Merkle Tree Certificates on an experimental basis in collaboration with industry partners to validate the transition to post-quantum authentication.
    - _T2 Risk-Informed · certificates_: Initiate migration to post-quantum cryptography immediately rather than waiting for Q-day, as migrations take longer than expected and delay risks security.
- **Observability**:
    - _T2 Risk-Informed · certificates_: Audit public certificate transparency logs to detect and prove unauthorized certificate issuance for the organization's domains.

## Cloudflare-PQ-Internet-2025
- **Source**: State of the Post-Quantum Internet in 2025
- **URL**: https://blog.cloudflare.com/pq-2025/
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Align post-quantum migration deadlines with regulatory timelines, specifically targeting the 2030-2035 window established by NSA, US federal, Australian, UK, and EU regulators.
    - _T2 Risk-Informed · all_: Prioritize upgrading quantum-vulnerable public key cryptography (RSA/ECC) over increasing symmetric key lengths, as resources are limited and public key migration is the critical path to security.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Plan for the migration of signature schemes and certificates to post-quantum standards, acknowledging that this process is more difficult and requires more time than key agreement migration.
    - _T2 Risk-Informed · keys_: Prioritize the migration of key agreement mechanisms to post-quantum algorithms immediately to mitigate harvest-now/decrypt-later attacks, as this is more urgent than signature migration.

## EU PQC Recommendation
- **Source**: Recommendation on Coordinated Implementation Roadmap for PQC Transition
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/104249
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Submit relevant information to the Commission upon request to enable monitoring of progress and assessment of the Recommendation's effects.
    - _T2 Risk-Informed · all_: Cooperate with the Commission to assess the effects of the Recommendation within three years of its publication to determine appropriate ways forward.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a comprehensive national strategy for PQC adoption defining clear goals, milestones, and timelines to ensure a coordinated transition.
    - _T2 Risk-Informed · all_: Establish a dedicated sub-group of the NIS Cooperation Group to coordinate PQC transition efforts and develop the Coordinated Implementation Roadmap.
    - _T2 Risk-Informed · all_: Align national transition plans with the common Post-Quantum Cryptography Coordinated Implementation Roadmap once agreed by Member States.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Deploy PQC technologies into existing public administration systems and critical infrastructures via hybrid schemes combining PQC with existing cryptographic approaches.
    - _T2 Risk-Informed · all_: Migrate current digital infrastructures and services for public administrations and critical infrastructures to PQC as soon as possible.
    - _T2 Risk-Informed · all_: Ensure the Post-Quantum Cryptography Coordinated Implementation Roadmap is available within two years of the Recommendation's publication.

## RFC-9901-SD-JWT-VC
- **Source**: RFC 9901 — Selective Disclosure for JWTs (SD-JWT)
- **URL**: https://www.rfc-editor.org/rfc/rfc9901
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · software_: Select JWS signature algorithms, including post-quantum algorithms when ready, based on application-specific security decisions.
    - _T2 Risk-Informed · software_: Select hash algorithms for SD-JWT digests that are preimage resistant, second-preimage resistant, and collision resistant, matching the signature scheme's strength.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Publish issuer signature verification keys in a manner that enables efficient and secure key rotation and revocation, such as via JWKS.
    - _T2 Risk-Informed · keys_: Ensure secure key pair generation, handling, storage, and lifecycle management, including rotation, revocation, and disposal, following NIST SP 800-57 Part 1.

## draft-ietf-uta-pqc-app-01
- **Source**: Post-Quantum Cryptography Recommendations for TLS-based Applications
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-uta-pqc-app/01/
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Assess data sensitivity and security lifetime to determine the urgency of adopting quantum-resistant measures for confidentiality versus authentication.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Prioritize hybrid key exchange over pure PQC to provide defense-in-depth during the transitional period, unless regulatory mandates require exclusive PQC use.
    - _T3 Repeatable · libraries_: Upgrade TLS libraries to versions supporting TLS 1.3 and PQC key exchange extensions as a necessary first step in the migration process.
    - _T3 Repeatable · software_: Transition vulnerable TLS applications to TLS 1.3 and adopt hybrid or pure post-quantum key exchange strategies to mitigate Harvest Now, Decrypt Later risks.
    - _T3 Repeatable · software_: Update explicit protocol version and cipher suite configurations to ensure hybrid or pure PQC key exchange groups are enabled.
- **Observability**:
    - _T2 Risk-Informed · software_: Review library documentation or perform interoperability testing to confirm that PQC groups are negotiated as intended when relying on library defaults.

## draft-kwiatkowski-pquip-pqc-migration-00
- **Source**: Guidance for migration to Post-Quantum Cryptography
- **URL**: https://www.ietf.org/archive/id/draft-kwiatkowski-pquip-pqc-migration-00.html
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Align migration strategies with FIPS and CMVP guidance, anticipating the certification process for post-quantum algorithms to ensure regulatory compatibility.
    - _T2 Risk-Informed · libraries_: Utilize already-certified traditional implementations alongside post-quantum algorithms during the transitional period to satisfy requirements for approved component schemes.
- **Governance**:
    - _T2 Risk-Informed · all_: Define PQC migration objectives starting with an assessment of risk tolerance to shape the choice of algorithms, protocols, and implementation paths.
    - _T2 Risk-Informed · all_: Evaluate whether to begin migration immediately or adopt a phased timeline based on data shelf-life, migration duration, and projected quantum threat timelines.
- **Inventory**:
    - _T2 Risk-Informed · all_: Build a comprehensive inventory of cryptographic use and associated assets to understand PQC relevancy and budget for discovery initiatives.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Prioritize cryptographic agility by embedding algorithm identifiers in keys and supporting efficient key rollover rather than relying solely on hybrid schemes.
    - _T3 Repeatable · keys_: Avoid reusing keypairs across PQ/T hybrid and traditional signature modes to prevent downgrade attacks during the transition period.
    - _T3 Repeatable · software_: Avoid dynamic algorithm negotiation at runtime to prevent downgrade or confusion attacks; algorithm identifiers must be part of the public key structure.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement continuous monitoring and evaluation to track migration progress and adapt to evolving quantum capabilities, requiring ongoing resource commitment.
