---
generated: 2026-11-12
category: Technical Standards
document_count: 22
requirement_count: 163
---

## 3GPP-PQC-Study-2025
- **Source**: 3GPP TR 33.938 V19.2.0 — 3GPP Cryptographic Inventory (Release 19)
- **URL**: https://www.etsi.org/deliver/etsi_tr/133900_133999/133938/19.02.00_60/tr_133938v190200p.pdf
- **Requirement count**: 4
- **Governance**:
    - _T3 Repeatable · all_: Keep the cryptographic inventory under change control and re-release it with a version/date increment whenever substantive changes occur, so it remains current.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain a documented cryptographic inventory of security protocols using cryptography in the 5G System (Standalone mode), recording cryptography type (symmetric/asymmetric) for each protocol.
    - _T3 Repeatable · all_: Record the usage type (integrity, confidentiality, and/or authentication) for each cryptographic protocol in the inventory so cryptographic purpose is known per asset.
    - _T3 Repeatable · libraries_: Inventory entries should link each cryptographic protocol to its governing specification and the applicable cryptographic profile, so each asset's configuration baseline is traceable.

## BSI TR-02102-2
- **Source**: Cryptographic Mechanisms: Recommendations for TLS
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-2.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Involve side-channel and fault-attack experts to identify leakage and implement countermeasures in TLS cryptographic system implementations.
- **Governance**:
    - _T2 Risk-Informed · all_: Align TLS cryptographic configuration with the BSI-recommended mechanisms and key lengths, and honor each mechanism's maximum period of use as policy-defined deprecation dates.
    - _T2 Risk-Informed · all_: Set organizational cryptographic policy to a minimum security level of 120 bits for all TLS mechanisms, as defined in TR-02102-1.
    - _T2 Risk-Informed · keys_: Avoid PSK-only cipher suites (TLS_PSK_*) that rely solely on pre-shared key entropy and confidentiality; use PSK suites that add ephemeral keys or random input.
    - _T2 Risk-Informed · software_: Assess whether application-layer authentication or two-factor authentication is needed because TLS may be unauthenticated or one-sided, particularly for critical operations.
    - _T3 Repeatable · all_: Plan and schedule migration to quantum-safe (hybrid) key agreement; classical-only key agreement must be retired by end of 2031.
    - _T3 Repeatable · all_: Track emerging quantum-safe TLS standards and update policy to adopt hybrid classical/PQC mechanisms once suitable standards are adopted.
    - _T3 Repeatable · all_: Restrict TLS 1.2 cipher suites to an approved list; phase out non-PFS (static DH) suites by 2026 and DHE suites by 2029, prefer PFS suites, and require Encrypt-then-MAC with CBC.
- **Inventory**:
    - _T3 Repeatable · software_: Maintain knowledge of which cipher suites, TLS versions and Diffie-Hellman groups are enabled across systems so each can be checked against its use-until date.

## ETSI TS 103 744
- **Source**: Quantum-Safe Hybrid Key Exchanges
- **URL**: https://www.etsi.org/deliver/etsi_ts/103700_103799/103744/01.02.01_60/ts_103744v010201p.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Treat the reference implementation as test-only: do not deploy test-vector reference code in production; production use requires validated, supported cryptographic modules.
    - _T3 Repeatable · libraries_: Verify implementations of hybrid key establishment against the published test vectors (derived from NIST CAVP, IETF RFC test vectors and ML-KEM test vectors) as part of conformance assurance before deployment.
- **Governance**:
    - _T2 Risk-Informed · all_: Assess quantum-threat exposure by comparing the confidentiality lifespan of sessions protected with ECC/RSA key establishment (TLS, IPsec, SSH) against quantum-computer timelines, and use that risk assessment to drive hybrid key-exchange a…
    - _T3 Repeatable · libraries_: Restrict deployed hash functions to the approved list (SHA-256, SHA-384) and maintain an enforceable cryptographic-algorithm policy that rejects other hash functions in hybrid key establishment.
    - _T3 Repeatable · libraries_: Restrict deployed KDFs to the approved set (HKDF with SHA2, KMAC128, KMAC256) and enforce that restriction through documented crypto policy and configuration baselines.
- **Inventory**:
    - _T3 Repeatable · all_: Use a ciphersuite identifier (cid) in key-establishment so that the KDF, ECDH curve, ML-KEM parameter set and combiner mode in use are explicit and can be inventoried and audited across deployments.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Ensure key-establishment messages are integrity-protected, optionally authenticated via signatures from keys bound to the sender's identity and certified by a trusted CA, implying certificate lifecycle management for authentication keys.

## FIPS 186-5
- **Source**: Digital Signature Standard (DSS)
- **URL**: https://csrc.nist.gov/pubs/fips/186-5/final
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Use only cryptographic algorithms, key generation algorithms and key establishment techniques that are FIPS-approved or on the FIPS 140-3 approved security functions list in any digital signature implementation.
    - _T3 Repeatable · libraries_: Track the CMVP implementation schedule and plan cryptographic module validations and transitions from FIPS 186-4 to FIPS 186-5 within the stated one-year transition window.
    - _T3 Repeatable · software_: Do not treat standard conformance as proof of security; verify that modules implementing signature capability are designed and built securely, and that the agency's overall implementation provides acceptable security.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign a responsible authority in each agency or department to ensure the overall digital signature implementation provides an acceptable level of security.
    - _T2 Risk-Informed · all_: Plan the transition to post-quantum signatures, since the standard's algorithms are not expected to resist attacks by a large-scale quantum computer.
    - _T2 Risk-Informed · all_: Define and document organizational policies governing the action taken when a digital signature fails verification, and address signature timeliness per SP 800-102.
    - _T2 Risk-Informed · keys_: Obtain the required assurances for digital signature applications, following SP 800-89, and consult SP 800-131A for approved key lengths and their security time frames.
    - _T2 Risk-Informed · software_: Ensure export of cryptographic modules implementing the standard, and related technical data, complies with federal export regulations and is licensed by BIS.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Retire DSA for signature generation and restrict it to verifying previously generated signatures only; migrate signing keys and processes to RSA, ECDSA or EdDSA.
    - _T3 Repeatable · keys_: Protect signatory private keys from disclosure; signatories must guard private key secrecy throughout the key lifecycle.
    - _T3 Repeatable · keys_: Generate signature key pairs using an approved, properly instantiated DRBG whose security strength meets or exceeds that of the keys being generated.

## FIPS 203
- **Source**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Validate ML-KEM implementations through the NIST validation program (CMVP) to demonstrate conformance to the standard's algorithms before relying on them.
    - _T3 Repeatable · software_: Ensure implementations enforce input checking so ML-KEM.Encaps and ML-KEM.Decaps execute only on validated inputs, and verify this through testing.
- **Governance**:
    - _T2 Risk-Informed · all_: Use only NIST-approved cryptographic algorithms (FIPS, NIST recommendations, SP 800-140C list) alongside ML-KEM, and document this in organizational cryptographic policy.
    - _T2 Risk-Informed · all_: Ensure export of cryptographic modules implementing ML-KEM, and related technical data, complies with federal export control laws and BIS licensing.
    - _T2 Risk-Informed · software_: Assess and document the security of any combined/hybrid KEM or key-derivation procedure that incorporates ML-KEM, since a combined KEM may not retain IND-CCA2 security.
- **Inventory**:
    - _T2 Risk-Informed · all_: Track which of the three ML-KEM parameter sets (512/768/1024, security categories 1/3/5) is deployed per system so RBG strength and security category can be matched and verified.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Derive final symmetric keys from the ML-KEM 256-bit shared secret using approved key-derivation methods (SP 800-108, SP 800-56C) rather than ad hoc use.
    - _T3 Repeatable · keys_: Generate randomness for ML-KEM key generation and encapsulation using an approved RBG (SP 800-90A/B/C) with security strength matching the parameter set (128/192/256 bits).

## FIPS 204
- **Source**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure implementations of ML-DSA are designed and built securely and validated; conformance to the standard alone does not guarantee implementation security, so verify modules before deployment.
    - _T3 Repeatable · libraries_: Use FIPS 140-validated cryptographic modules for ML-DSA operations; cryptographic modules implementing the standard must meet approved security function validation requirements.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign a responsible authority in each agency or department to ensure the overall system implementation using ML-DSA provides an acceptable level of security.
    - _T2 Risk-Informed · all_: Comply with federal export control regulations (BIS licensing) for cryptographic modules implementing ML-DSA and related technical data.
    - _T2 Risk-Informed · keys_: Define key ownership and require signatories to protect private keys against disclosure, since signature security depends on private key secrecy.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Track the parameter set (ML-DSA-44/65/87) and claimed security strength category of each deployed key, and note reduced strength category if the RBG is weaker than recommended.

## FIPS 205
- **Source**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Do not rely on standard conformance alone; implementers must verify that modules implementing signature capability are designed and built securely, including resistance to side-channel/fault attacks referenced in the standard.
    - _T2 Risk-Informed · software_: Apply SP 800-89 assurance requirements (e.g., assurance of validity of keys/domain parameters and possession) when deploying digital signature applications using SLH-DSA.
    - _T3 Repeatable · libraries_: Use SLH-DSA implementations in cryptographic modules whose approved security functions are validated; modules must be FIPS-conformant or use approved functions listed in SP 800-140C.
- **Governance**:
    - _T2 Risk-Informed · all_: Ensure that cryptographic modules implementing SLH-DSA comply with U.S. export control regulations and are licensed through the Bureau of Industry and Security where applicable.
    - _T2 Risk-Informed · all_: Select SLH-DSA parameter sets deliberately according to the required NIST security strength category and document this selection in policy.
    - _T2 Risk-Informed · keys_: Establish policy and accountability requiring signatories to guard against disclosure of signature private keys, since signature security depends on private key secrecy.
    - _T3 Repeatable · all_: Review the adopted cryptographic standard on a periodic basis (at least every five years) to reassess adequacy and track revisions or additional parameter sets such as SP 800-230.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Ensure implementations destroy local copies of inputs and sensitive intermediate data from key generation, signing, and sensitive verification as soon as no longer needed.

## HQC Specification
- **Source**: Hamming Quasi-Cyclic (HQC) Algorithm Specification
- **URL**: https://pqc-hqc.org/doc/hqc_specifications_2025_08_22.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Validate third-party-supplied HQC keypairs before use, relying on the seedKEM stored in the decapsulation key to confirm the keypair is consistent.
    - _T3 Repeatable · libraries_: Ensure HQC implementations use constant-time sampling of fixed-weight vectors, and verify this as a deployment assurance obligation against known timing attacks.
- **Governance**:
    - _T2 Risk-Informed · all_: Select HQC parameter sets (HQC-1/3/5) that map to the organization's required NIST security category and document the mapping, since each set targets a distinct security level and DFR.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Account for HQC's larger ciphertext/key sizes and lower efficiency versus ML-KEM when inventorying and planning deployment, treating HQC as a distinct cryptographic asset.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Protect HQC decapsulation keys (which embed ekKEM, dkPKE and the rejection secret sigma) as sensitive key material throughout their lifecycle, treating the composite structure as a single managed asset.
    - _T3 Repeatable · libraries_: Track the HQC specification version and its changelog, and update deployed implementations when revisions apply security countermeasures (FO transform, salting, constant-weight sampling).

## NIST SP 800-208
- **Source**: Recommendation for Stateful Hash-Based Signature Schemes
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-208.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Seed key generation with an approved random bit generator (SP 800-90 series) instantiated at a security strength of at least 8n bits, and verify the RBG meets this strength.
    - _T3 Repeatable · libraries_: Deploy LMS/XMSS/HSS key generation and signature generation only in hardware cryptographic modules validated to FIPS 140-2 or 140-3 Level 3 or higher, with a non-modifiable or limited operational environment.
    - _T3 Repeatable · libraries_: Operate the validated module only in its approved mode of operation and ensure no bypass mode is implemented or enabled for key generation or signature functions.
    - _T3 Repeatable · libraries_: Require that cryptographic modules performing signing also implement key generation for the same parameter set, and that verification modules support at least one approved parameter set, and confirm this through validation/conformance reco…
- **Governance**:
    - _T2 Risk-Informed · all_: Recognize that some conformance requirements fall outside CAVP/CMVP testing and assign responsibility for them to the entities that use, implement, install, or configure the applications.
    - _T2 Risk-Informed · keys_: Assign responsibility for ensuring each tree root is signed only once by its parent OTS key, rejecting HSS/XMSSMT implementations that re-sign roots on every signature because of fault-injection risk.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Plan private-key loss protection and OTS key distribution by distributing signing state across multiple cryptographic modules using two-level tree structures where appropriate.

## NIST SP 800-227
- **Source**: Recommendations for Key-Encapsulation Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Verify parameter validity by checking selected parameter sets against the approved-parameter lists in the relevant NIST publication before deployment.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Use ephemeral KEM key pairs in only one key-establishment execution and destroy them as soon as possible after use.
    - _T3 Repeatable · keys_: Use nonces with negligible repeat probability for key confirmation when the decapsulator's public key is static.

## RFC 9629
- **Source**: Using Key Encapsulation Mechanism (KEM) Algorithms in CMS
- **URL**: https://www.rfc-editor.org/rfc/rfc9629.html
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · certificates_: Validate that recipient certificates carry a KEM public key and, where a key usage extension is present, assert keyEncipherment, before using them as encryption targets.
    - _T3 Repeatable · libraries_: Implementations must verify that the kekLength value is consistent with the key-encryption algorithm identified in the wrap field, rejecting inconsistent messages.
- **Governance**:
    - _T2 Risk-Informed · all_: Select KDF and key-encryption algorithms that provide security equivalent to the chosen KEM algorithm, and document that algorithm-suite policy.
    - _T2 Risk-Informed · libraries_: Only deploy KEM algorithms proven secure against adaptive chosen ciphertext attacks, and only pair them with key-encryption algorithms that provide both confidentiality and integrity protection.
    - _T2 Risk-Informed · software_: Define policy for handling CMS messages with ukm fields; software that does not support ukm must be configured to gracefully discontinue processing rather than proceed.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Inventory which CMS implementations support KEMRecipientInfo, both recipient certificate identification alternatives, and the ukm field, so unsupported-field behavior is known.
    - _T3 Repeatable · certificates_: Maintain a discoverable inventory of recipient KEM public keys and certificates, and publish newly generated public keys so originators can locate them.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Provision each recipient with a KEM key pair generated via KeyGen() and a corresponding certificate before any content is encrypted to them; manage private keys for decapsulation.
    - _T3 Repeatable · software_: Plan staged rollout of KEMRecipientInfo by using the lowest CMS version number that supports the generated syntax to preserve interoperability during migration.

## RFC 9708
- **Source**: Use of the HSS/LMS Hash-Based Signature Algorithm in CMS
- **URL**: https://www.rfc-editor.org/rfc/rfc9708.html
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Document a PQC migration rationale: adopt hash-based signatures (e.g., for software update protection) to prepare for the day RSA, DSA, ECDSA, and EdDSA can no longer be relied upon due to CRQCs.
    - _T3 Repeatable · certificates_: Enforce certificate key usage restrictions for HSS/LMS public keys: CA certs limited to digitalSignature, nonRepudiation, keyCertSign, cRLSign; end-entity certs limited to digitalSignature, nonRepudiation, cRLSign.
- **Inventory**:
    - _T2 Risk-Informed · software_: Track which signing/verification implementations support HSS/LMS and which hash functions and parameter sets (SHA-256, SHAKE256, tree heights, LM-OTS types) are in use, since signatures identify these and registries expand over time.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Plan key retirement and replacement around the finite signing capacity of an HSS/LMS key, since the key supports only a fixed number of signatures determined by tree size.
    - _T3 Repeatable · keys_: Protect HSS/LMS private keys against compromise and maintain integrity of leaf-usage tracking state, accounting for failed writes, VM snapshotting/cloning, and other operational hazards on non-volatile or virtualized storage.
    - _T3 Repeatable · keys_: Enforce single-use of each LM-OTS private key and prevent its reuse for any other purpose; lifecycle tooling must guarantee one-time-key state is never rolled back or duplicated.
    - _T3 Repeatable · keys_: Generate each LMS key pair independently of all other key pairs in the HSS tree during key generation.

## RFC 9810
- **Source**: Certificate Management Protocol (CMP)
- **URL**: https://www.rfc-editor.org/rfc/rfc9810.html
- **Requirement count**: 11
- **Governance**:
    - _T2 Risk-Informed · certificates_: Implement the mandatory PKI management function profile in all end entity and CA/RA implementations, including the required use-case profiles.
    - _T2 Risk-Informed · keys_: Ensure end entities securely obtain the root CA public key via an out-of-band trusted channel, e.g. verifying the CA self-certificate fingerprint, before trusting the CA.
    - _T2 Risk-Informed · keys_: Support proof-of-possession of private keys for certificate requests, using signature, key-encipherment, key-agreement, or RA-verified POP structures per policy.
    - _T3 Repeatable · all_: Define and apply crypto-agility so CAs, RAs, and end entities can use different industry-standard algorithms, and support the algorithm-discovery exchanges (supported signature algorithms, preferred symmetric algorithm) to negotiate them.
    - _T3 Repeatable · certificates_: Apply special care and authorization controls when approving certificate requests containing EKU extensions, so only legitimate entities receive delegated authorizations.
    - _T3 Repeatable · certificates_: CAs using indirect proof-of-possession must not publish final certificates to CT logs until the certConf message is received; precertificates may be published earlier.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Newly established CAs that issue CRLs must produce empty CRLs before issuing any certificates and then produce CRLs periodically.
    - _T3 Repeatable · certificates_: Support certificate revocation requests from certified end entities and CRL production, with protections so denial-of-service attacks are not made easier.
    - _T3 Repeatable · certificates_: Revoke any certificate or precertificate published to a CT log when the required certConf confirmation cannot be verified, especially with implicit POP.
    - _T3 Repeatable · keys_: Plan and execute periodic CA key updates, issuing transition certificates (NewWithNew, NewWithOld, OldWithNew) so existing and new end entities can migrate to the new root without disruption.
    - _T3 Repeatable · keys_: Ensure any key pair can be regularly updated without affecting other key pairs, supporting routine rotation as an operational capability.

## RFC 9814
- **Source**: Use of SLH-DSA in CMS
- **URL**: https://www.rfc-editor.org/rfc/rfc9814.html
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Assess use-case-specific risk and decide on fault-attack (e.g., signature-generation redundancy) and side-channel countermeasures for SLH-DSA implementations, noting verify-before-release is ineffective.
- **Governance**:
    - _T2 Risk-Informed · keys_: Establish and enforce key-protection policy requiring SLH-DSA private keys to be protected, since compromise enables signature forgery.
    - _T3 Repeatable · certificates_: Enforce certificate profile policy so that certificates with SLH-DSA public keys assert only permitted key usages (digitalSignature, nonRepudiation, keyCertSign, cRLSign) and no other key usage values.
    - _T3 Repeatable · keys_: Enforce policy that signature verification confirms the signatureAlgorithm identifies SLH-DSA parameters consistent with the public key used to validate the signature.
    - _T3 Repeatable · software_: Include the CMSAlgorithmProtection attribute in signed attributes to defend against algorithm-substitution attacks.
    - _T3 Repeatable · software_: Enforce digest policy: with signed attributes, the hash must be at least twice the size of the SLH-DSA tree hash; implementations must support the specified SHA-2/SHAKE hash functions per variant.
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Track the specific SLH-DSA algorithm identifier (security level, small/fast variant, SHA2/SHAKE) used by each certificate and signing key, since each of the twelve OIDs is a distinct algorithm that signature verification must match.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Limit each SLH-DSA key (hypertree) to at most 2^64 signing operations, requiring usage tracking and key retirement/rotation before the limit is reached.
    - _T3 Repeatable · keys_: Generate each SLH-DSA key pair independently of all others and use adequate, high-quality random number generation for key generation.
    - _T3 Repeatable · keys_: Ensure key generation uses adequate PRNGs, following RFC 4086 guidance on randomness quality.

## RFC 9858
- **Source**: Additional Parameter Sets for HSS/LMS Hash-Based Signatures
- **URL**: https://www.rfc-editor.org/rfc/rfc9858.html
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure underlying hash primitives are standard, validated implementations (FIPS 180 SHA-256 and FIPS 202 SHAKE256); truncated SHA-256/192 reuses an unmodified standard SHA-256 implementation.
- **Governance**:
    - _T2 Risk-Informed · all_: Assess and record the residual risk of using 192-bit-output hash parameter sets (classical and quantum attack cost, reduced margin versus 256-bit sets) before management approval of their use.
    - _T2 Risk-Informed · keys_: Document and justify the selection of an HSS/LMS parameter set (hash function, output size, Winternitz width, tree height) based on signature size, performance and reduced security margin trade-offs, and record that rationale in policy.
    - _T2 Risk-Informed · keys_: Control and restrict signers so that no signer can deliberately sign two colliding messages; the collision-resistance corner case depends on trusting the signer holding the private key.
    - _T2 Risk-Informed · software_: Verify that deployed HSS/LMS implementations and chosen parameter sets remain compatible with NIST SP 800-208 where regulatory alignment is required, and note that this RFC is informational, not a standard.
- **Inventory**:
    - _T3 Repeatable · keys_: Record, per HSS/LMS key, the LM-OTS and LMS parameter set identifiers (hash function, n/m, w, h, levels) since these IDs appear in public keys and signatures and determine security strength and signature size.
    - _T3 Repeatable · libraries_: Inventory which hash implementations (SHA-256, SHA-256/192, SHAKE256/256, SHAKE256/192) each platform provides, since parameter-set choice depends on available libraries and performance.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Generate a fresh random I identifier per private key and a fresh random C randomizer per signature, as a lifecycle control on key generation and signing, to preserve security assumptions.
    - _T3 Repeatable · keys_: Plan key capacity and rotation according to Merkle tree height(s) chosen, since stateful signatures are finite in number and parameter choice (h, L) determines signing capacity and signature size.

## RFC 9881
- **Source**: Algorithm Identifiers for ML-DSA in X.509 PKI
- **URL**: https://www.rfc-editor.org/rfc/rfc9881.html
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Assure ML-DSA implementations resist side-channel leakage (including masking countermeasures where warranted) and are assessed beyond design-level protections such as differential power analysis.
- **Governance**:
    - _T2 Risk-Informed · certificates_: Define certificate profile policy prohibiting HashML-DSA (id-hash-ml-dsa-*-with-sha512) public keys in X.509 certificates used for CRLs, OCSP, issuance and related PKIX protocols.
    - _T2 Risk-Informed · certificates_: Select ML-DSA parameter set (44/65/87) according to documented NIST PQC security-level requirements, recognizing the signature and key size differences when planning deployment.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Ensure key generation uses a high-quality cryptographic random number generator (approved RBG) since inadequate PRNGs can enable private key recovery.
    - _T3 Repeatable · certificates_: Issue ML-DSA certificates and CRLs with AlgorithmIdentifier using the NIST-registered OIDs (id-ml-dsa-44/65/87) and with parameters absent; configure CA tooling to enforce this.
    - _T3 Repeatable · keys_: Decide signing mode (deterministic vs. randomized) deliberately; use randomized signing with an approved RBG where fault and hardware side-channel hardening is needed.

## RFC 9882
- **Source**: Use of ML-DSA in CMS
- **URL**: https://www.rfc-editor.org/rfc/rfc9882.html
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Use high-quality, cryptographically suitable random number generation for ML-DSA key generation and signing, and assure the quality of the entropy source in deployed modules.
    - _T3 Repeatable · keys_: When ML-DSA signing runs in an HSM or token, use signed attributes (or external mu computation) so only small data is sent to the device, and ensure the module supports ML-DSA pure-mode operations.
- **Governance**:
    - _T2 Risk-Informed · keys_: Protect ML-DSA private keys as critical assets, since compromise enables forgery of arbitrary signatures; define ownership and protection controls for them.
    - _T2 Risk-Informed · software_: Configure CMS implementations to support SHA-512 as the digest algorithm for all ML-DSA variants, and support SHAKE256, as a documented baseline for interoperable migration.
    - _T2 Risk-Informed · software_: Do not use HashML-DSA (pre-hash mode) in CMS; require pure-mode ML-DSA with an empty context string in signing configurations.
    - _T3 Repeatable · software_: Enforce a policy that the digest algorithm chosen for signed attributes meets the strength required by the selected ML-DSA parameter set (per Table 1); verifiers may reject non-conforming signatures.
    - _T3 Repeatable · software_: Include the CMSAlgorithmProtection attribute in signed attributes to defend against algorithm substitution attacks; set this as a mandated signing configuration.
    - _T3 Repeatable · software_: Set policy to use hedged (randomized) ML-DSA signing and avoid the deterministic variant on platforms exposed to side-channel or fault attacks; track and adopt emerging implementation protections.
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Track which ML-DSA parameter set (ML-DSA-44/65/87) and algorithm OID each signing certificate and CMS signature uses, to verify conformance with required identifiers.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Monitor research on side-channel and fault attacks against ML-DSA and update cryptographic implementations to incorporate interoperable countermeasures when beneficial.

## TCG-TPM-V185-Part0
- **Source**: TCG TPM 2.0 Library Specification V185 — Part 0: Introduction
- **URL**: https://trustedcomputinggroup.org/wp-content/uploads/Trusted-Platform-Module-2.0-Library-Part-0-Introduction_Version-185_pub.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Rely on certification evidence (manufacturer identity and evaluated assurance level for TPMs, platform manufacturer certificates) to establish trust in Roots of Trust, since their misbehavior cannot be detected at runtime.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Plan for post-quantum readiness by adopting the newly supported ML-DSA and ML-KEM (and EdDSA/DHKEM) algorithms and the new sign/verify/encapsulate commands as TPM firmware supporting them becomes available.
    - _T3 Repeatable · libraries_: Migrate off deprecated TPM commands and structures (e.g., TPM2_Sign/TPM2_VerifySignature, TPM2_EncryptDecrypt, TPM2_CreateLoaded, TPMA_ALGORITHM) to their replacements before removal in a future spec version.
- **Observability**:
    - _T3 Repeatable · keys_: Use TPM attestation (TPM2_Quote returning a PCR digest) and the TPM_PT_MODES/FIPS indication to monitor and report platform state and FIPS-mode status, supporting same-day drift detection.

## TCG-TPM-V185-Part2
- **Source**: TCG TPM 2.0 Library Specification V185 — Part 2: Structures
- **URL**: https://trustedcomputinggroup.org/wp-content/uploads/Trusted-Platform-Module-2.0-Library-Part-2-Structures_Version-185_pub.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Verify that the TPM's supported algorithms and parameter sets (including PQC algorithms ML-KEM, ML-DSA tied to NIST FIPS 203/204) match the references the organization requires before enabling them.
- **Governance**:
    - _T2 Risk-Informed · keys_: Restrict use of ECB mode in policy; permit it only where keys are frequently rotated, and document exceptions.
    - _T2 Risk-Informed · libraries_: Define and enforce policy that treats algorithms marked Deprecated in the TPM spec (SHA-1, TDES) as not to be used in new deployments, and consult Part 0 for deprecation status when approving algorithm sets.
    - _T3 Repeatable · keys_: Configure TPM algorithm selection so protection algorithms are balanced: hash digest size must exceed the symmetric key size, otherwise the TPM rejects the configuration.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Include TPM firmware-upgrade state handling in update procedures: recognize field-upgrade mode (TPM_RC_UPGRADE) and require reboot/Startup(CLEAR) before the TPM resumes normal operation.
- **Observability**:
    - _T3 Repeatable · keys_: Monitor TPM response codes for authorization failures and dictionary-attack lockout events (DA counter increments, lockoutAuth disabled) to detect abuse or misconfiguration of key-use authorization.

## draft-ietf-tls-mlkem-07
- **Source**: ML-KEM Post-Quantum Key Agreement for TLS 1.3
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Select and approve ML-KEM implementations that follow NIST SP 800-227 KEM usage guidance and resist side-channel attacks, particularly remotely exploitable ones.
    - _T2 Risk-Informed · libraries_: Follow the RNG guidance in FIPS 203 and RFC 9846 for ML-KEM encapsulation randomness, since insecure RNG output disclosed via ciphertexts can compromise RNG state; consider RFC 8937 randomness improvements.
    - _T3 Repeatable · libraries_: Deploy ML-KEM implementations that perform the FIPS 203 encapsulation key check and enforce ciphertext length validation, aborting handshakes on failure, and verify this behavior through testing.
    - _T3 Repeatable · libraries_: Ensure ML-KEM libraries never reuse encapsulation randomness or ciphertexts, and verify via assurance testing that randomness generation conforms to FIPS 203 and TLS 1.3 RNG guidance.
- **Governance**:
    - _T2 Risk-Informed · all_: Document a risk-informed policy decision on deploying standalone ML-KEM versus a hybrid construction, evaluating security, performance, and operational constraints and consulting IANA registry recommendations.
    - _T2 Risk-Informed · all_: Track the IANA TLS Supported Groups registry 'Recommended' status (currently N for ML-KEM groups) and reflect IETF guidance in crypto policy, recognizing standalone ML-KEM has no IETF recommendation.
- **Inventory**:
    - _T3 Repeatable · libraries_: Inventory which TLS endpoints and libraries support and negotiate mlkem512/768/1024 NamedGroups (0x0200-0x0202) to know post-quantum key establishment coverage.
- **Observability**:
    - _T3 Repeatable · software_: Monitor TLS handshakes for illegal_parameter and internal_error alerts arising from ML-KEM encapsulation key, ciphertext length, or decapsulation failures to detect misconfiguration or attack.

## draft-wang-ipsecme-kem-auth-ikev2-03
- **Source**: KEM based Authentication for IKEv2 with Post-quantum Security
- **URL**: https://datatracker.ietf.org/doc/draft-wang-ipsecme-kem-auth-ikev2/03/
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Ensure IKEv2 deployments using KEM-based authentication support the IKE_INTERMEDIATE exchange; treat it as mandatory baseline capability and configuration policy.
    - _T2 Risk-Informed · keys_: Adopt a policy recommending use of group Postquantum Preshared Keys (PPK) in IKEv2 to contribute to identity hiding.
    - _T2 Risk-Informed · software_: Define policy for hybrid key exchange: where combined traditional and post-quantum key exchange is required, mandate use of the multiple key exchanges extension (RFC 9370).
    - _T2 Risk-Informed · software_: Explicitly configure which peers/endpoints are enabled for KEM-based authentication and which KEMs are permitted, since responders only honor it when supported and configured and advertise allowed KEMs.
    - _T3 Repeatable · software_: Enable and enforce transcript authentication (downgrade prevention) in IKEv2 deployments to protect peers against downgrade attacks.
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Track and manage long-term KEM certificates and associated KEM private keys for each IKEv2 peer, since peers authenticate by proving possession of the key behind their KEM certificate.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Configure IKE fragmentation to be negotiated on UDP transports, since large KEM public keys and ciphertexts must be handled robustly.

## draft-yang-tls-hybrid-sm2-mlkem-03
- **Source**: Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3
- **URL**: https://datatracker.ietf.org/doc/draft-yang-tls-hybrid-sm2-mlkem/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Use ML-KEM implementations conforming to FIPS 203 and verify that cryptographic modules performing the ML-KEM-768 component are validated or conformance-tested.
- **Governance**:
    - _T2 Risk-Informed · all_: Do not treat the draft's statement that no security issues are known as a risk assessment; perform and document your own risk review and track document status (Internet-Draft, expires, work in progress) before adoption.
    - _T3 Repeatable · all_: Restrict deployment of the curveSM2MLKEM768 hybrid group to TLS 1.3 only; enforce through configuration that the group is never offered or accepted under older TLS versions.
    - _T3 Repeatable · libraries_: Ensure TLS libraries implement SM2 only with the standardized GB/T 32918.5-2016 curve parameter set and that no alternative parameters are enabled; verify this during library selection and acceptance.
    - _T3 Repeatable · software_: Configure TLS stacks so the SM2 key exchange protocol is never used within the hybrid scheme and key derivation follows TLS 1.3 requirements; verify via configuration review or testing.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Inventory TLS endpoints and libraries to know which support the curveSM2MLKEM768 NamedGroup (0x11EE) and ML-KEM-768, and which negotiate it, so hybrid PQC adoption can be tracked.
- **Observability**:
    - _T3 Repeatable · software_: Monitor negotiated TLS 1.3 groups and handshake sizes (client share 1249 bytes, server share 1153 bytes) to detect unexpected use or misconfiguration of the hybrid group.
