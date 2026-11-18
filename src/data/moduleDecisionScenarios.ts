// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { evaluateSamplePolicy, type SamplePolicyInputs } from '@/utils/policyContradictionEvaluator'

export interface ModuleDecisionScenario {
  moduleId: string
  domainTitle: string
  roleDecisionPrompt: string
  artifactLabel: string
  algorithmVariant: { operation: 'signature' | 'kem'; variant: 44 | 65 | 87 | 512 | 768 | 1024 }
  validCaseExplanation: string
  adverseFailureExplanation: string
  recoveryActionExplanation: string
  transferQuestion: {
    prompt: string
    changedAssumptionOutcome: string
  }
  productionToolCheck: string
}

export const MODULE_DECISION_SCENARIOS: Record<string, ModuleDecisionScenario> = {
  'pqc-101': {
    moduleId: 'pqc-101',
    domainTitle: 'Foundational NIST FIPS 203 (ML-KEM) vs FIPS 204 (ML-DSA) Primitive Selection',
    roleDecisionPrompt:
      'Decide whether a workload requires post-quantum key establishment (ML-KEM-768) for confidentiality in transit or digital signatures (ML-DSA-65) for origin authentication and integrity.',
    artifactLabel: 'Fictional foundational ML-DSA-65 signed release manifest',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'A freshly generated ML-DSA-65 keypair signs and verifies the unmodified fictional manifest bytes deterministically, while ML-KEM-768 is reserved for key establishment.',
    adverseFailureExplanation:
      'Flipping byte 0 of the 3,309-byte ML-DSA-65 signature causes FIPS 204 verification to return false; selecting ML-DSA-65 for key establishment is flagged as a primitive mismatch.',
    recoveryActionExplanation:
      'Restore the original untampered signature bytes to recover valid verification, and pair ML-KEM-768 with key-establishment flows.',
    transferQuestion: {
      prompt:
        'What changes if the workload shifts from authenticating a public software release to protecting 10-year confidential session traffic?',
      changedAssumptionOutcome:
        'Signature verification alone cannot prevent Harvest-Now-Decrypt-Later (HNDL) eavesdropping; the architecture must switch the primitive to ML-KEM-768 key establishment before the retention + migration window exceeds the threat horizon.',
    },
    productionToolCheck:
      'Query your cryptographic provider (e.g., OpenSSL 3.5+ `openssl list -kem-algorithms -signature-algorithms`) and verify that key-exchange and signature APIs enforce distinct FIPS 203 and FIPS 204 mechanisms.',
  },
  'quantum-threats': {
    moduleId: 'quantum-threats',
    domainTitle: 'Mosca HNDL Exposure Window (X + Y > Z) & Ciphertext Tamper Resilience',
    roleDecisionPrompt:
      'Evaluate whether intercepted key-establishment traffic is exposed to Harvest-Now-Decrypt-Later (HNDL) decryption and how ML-KEM-768 handles corrupted encapsulation ciphertexts.',
    artifactLabel: 'Fictional archival session ML-KEM-768 ciphertext & AEAD confirmation tag',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'ML-KEM-768 encapsulates a 1,088-byte ciphertext and derives a shared secret that unlocks the AES-256-GCM confirmation message while resisting Shor-based passive key recovery.',
    adverseFailureExplanation:
      'Mutating byte 0 of the ML-KEM-768 ciphertext triggers FIPS 203 implicit rejection, deriving an unrelated key that causes the AES-256-GCM authentication tag check to fail.',
    recoveryActionExplanation:
      'Restore the valid 1,088-byte ciphertext to recover matching shared secrets, and shorten migration duration or upgrade to ML-KEM-768 to close the Mosca X + Y > Z exposure gap.',
    transferQuestion: {
      prompt:
        'What changes if the protected data retention requirement increases from 3 years to 10 years while migration still takes 3 years against an 8-year horizon?',
      changedAssumptionOutcome:
        'Total exposure (10 + 3 = 13 years) exceeds the 8-year horizon by 5 years, turning a previously acceptable schedule into an active HNDL scenario risk even if organizational policy applicability is waived.',
    },
    productionToolCheck:
      'Cross-reference your data-classification retention schedule against live TLS/VPN key-exchange telemetry to identify all flows where X + Y exceeds your risk horizon.',
  },
  'hybrid-crypto': {
    moduleId: 'hybrid-crypto',
    domainTitle: 'PQ/T Hybrid Key Exchange (X25519MLKEM768) Combiner & Share Integrity',
    roleDecisionPrompt:
      'Verify that your hybrid PQ/T key establishment fails closed when the post-quantum ML-KEM-768 ciphertext share is corrupted, even if the classical X25519 share remains valid.',
    artifactLabel: 'Fictional X25519MLKEM768 PQ component share (ML-KEM-768 ciphertext)',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'When both the classical share and the 1,088-byte ML-KEM-768 share arrive intact, the KDF combiner derives the expected session key and passes authenticated key confirmation.',
    adverseFailureExplanation:
      'A 1-byte mutation in the ML-KEM-768 ciphertext alters the decapsulated PQ secret fed into the hybrid combiner, causing the follow-on AEAD key confirmation to reject the handshake.',
    recoveryActionExplanation:
      'Restore the intact ML-KEM-768 key share so both component secrets match, and configure downgrade alerts so peers cannot silently strip the PQ share.',
    transferQuestion: {
      prompt:
        'What changes if a compliance mandate requires pure CNSA 2.0 Category 5 cryptography instead of a transitional Category 3 hybrid?',
      changedAssumptionOutcome:
        'The deployment must transition from X25519MLKEM768 (Category 3 hybrid) to ML-KEM-1024 (or SecP384r1MLKEM1024 where hybrid is permitted) before the mandate deadline.',
    },
    productionToolCheck:
      'Capture staging TLS 1.3 `ClientHello`/`ServerHello` packets (`0x11EC` for `X25519MLKEM768`) and run negative tests corrupting the PQ key_share byte stream.',
  },
  'crypto-agility': {
    moduleId: 'crypto-agility',
    domainTitle: 'Provider-Abstracted Algorithm Swap & Signature Verification Integrity',
    roleDecisionPrompt:
      'Confirm that swapping from classical ECDSA to ML-DSA-65 via provider configuration preserves strict signature tamper rejection without altering application business logic.',
    artifactLabel: 'Fictional provider-abstracted ML-DSA-65 release manifest signature',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The cryptographic abstraction layer dispatches signing and verification to ML-DSA-65 via configuration, accepting the valid 3,309-byte signature.',
    adverseFailureExplanation:
      'Mutating byte 0 of the ML-DSA-65 signature is deterministically rejected by the provider verification call, proving that abstraction wrappers do not mask verification errors.',
    recoveryActionExplanation:
      'Restore the valid signature artifact and ensure configuration rollbacks or parameter-set upgrades (e.g., ML-DSA-65 to ML-DSA-87) invalidate stale cached verdicts.',
    transferQuestion: {
      prompt:
        'What changes if an application database column or API header truncates signatures at 512 bytes when switching from ECDSA P-256 (64 B) to ML-DSA-65 (3,309 B)?',
      changedAssumptionOutcome:
        'Every valid ML-DSA-65 signature will be corrupted in storage/transit and fail verification until schema and buffer limits are expanded for variable-length PQC artifacts.',
    },
    productionToolCheck:
      'Execute a staging config-only swap in OpenSSL 3.5+ / JCA / PKCS#11 v3.2 and verify both positive signature acceptance and 1-byte negative tamper rejection.',
  },
  'talking-about-pqc': {
    moduleId: 'talking-about-pqc',
    domainTitle: 'Executive Readiness Attestation & Service-vs-Asset Scope Accuracy',
    roleDecisionPrompt:
      'Distinguish between business services (e.g., the records archiving service) and protected assets (long-lived customer records), and verify that signed readiness attestations cannot be altered.',
    artifactLabel: 'Fictional ML-DSA-65 signed CBOM & executive readiness briefing',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'An intact ML-DSA-65 signature over the dated readiness briefing confirms the report matches the underlying discovery scan and policy scope.',
    adverseFailureExplanation:
      'Modifying 1 byte of the signed attestation invalidates the ML-DSA-65 signature; claiming an out-of-scope policy proves HNDL safety is flagged as an unsupported scope error.',
    recoveryActionExplanation:
      'Re-verify the original signed briefing and separate policy deadline compliance from scenario-level HNDL exposure on long-lived record assets.',
    transferQuestion: {
      prompt:
        'What changes if an executive briefing removes a legacy customer portal from the 2030 internal policy scope while the portal still handles 10-year confidential records?',
      changedAssumptionOutcome:
        'Removing policy applicability eliminates the internal policy-violation flag, but the 5-year HNDL scenario risk on the underlying customer records remains unchanged.',
    },
    productionToolCheck:
      'Require every board-level PQC readiness claim to link to a dated CBOM discovery scan, a verified CAVP/CMVP reference, and explicit asset-retention assumptions.',
  },
  'tls-basics': {
    moduleId: 'tls-basics',
    domainTitle: 'TLS 1.3 X25519MLKEM768 KeyShare Encapsulation & Finished MAC Confirmation',
    roleDecisionPrompt:
      'Determine how TLS 1.3 handles a corrupted ML-KEM-768 `ServerHello` `key_share` ciphertext and why handshake authentication depends on the `Finished` transcript MAC.',
    artifactLabel: 'Fictional TLS 1.3 ServerHello ML-KEM-768 KeyShare & Finished confirmation',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Decapsulating the intact 1,088-byte ML-KEM-768 `key_share` yields the exact shared secret needed to derive the TLS 1.3 handshake traffic keys and verify the `Finished` message.',
    adverseFailureExplanation:
      'Flipping byte 0 of the ML-KEM-768 `key_share` does not cause decapsulation itself to throw, but implicit rejection derives a mismatched handshake secret so `Finished` AEAD confirmation fails with `bad_record_mac` / `decrypt_error`.',
    recoveryActionExplanation:
      'Restore the unmodified `key_share` ciphertext so both peers derive identical TLS 1.3 handshake traffic secrets.',
    transferQuestion: {
      prompt:
        'What changes if a middlebox drops fragmented TCP segments when the TLS 1.3 `ClientHello` grows beyond 1,500 bytes with `X25519MLKEM768`?',
      changedAssumptionOutcome:
        'Connections stall or fall back to classical groups; operators must fix middlebox TCP window/MTU handling and monitor classical downgrade counters rather than disabling PQC.',
    },
    productionToolCheck:
      'Run `openssl s_client -groups X25519MLKEM768` against staging TLS terminators and inspect packet captures for codepoint `0x11EC` and `Finished` verification.',
  },
  'vpn-ssh-pqc': {
    moduleId: 'vpn-ssh-pqc',
    domainTitle: 'IKEv2 RFC 9370 ADDKE & OpenSSH mlkem768x25519-sha256 Tunnel Key Exchange',
    roleDecisionPrompt:
      'Verify that site-to-site IPsec IKEv2 (RFC 9370) and OpenSSH 9.9+ hybrid key exchanges reject tampered ML-KEM-768 key-exchange payloads before establishing tunnel SAs.',
    artifactLabel: 'Fictional IKEv2 IKE_INTERMEDIATE ML-KEM-768 ADDKE payload',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'An intact ML-KEM-768 `ADDKE` payload mixes into `SKEYSEED` so both VPN peers compute identical `SK_a`/`SK_e` keys and validate the `IKE_AUTH` payload.',
    adverseFailureExplanation:
      'A 1-byte mutation in the fragmented IKEv2 ML-KEM-768 ciphertext produces a divergent `SKEYSEED` via implicit rejection, causing `IKE_AUTH` decryption and authentication to fail.',
    recoveryActionExplanation:
      'Enable RFC 7383 IKEv2 fragmentation (or RFC 8229 TCP encapsulation) and restore intact payload reassembly so `IKE_INTERMEDIATE` completes cleanly.',
    transferQuestion: {
      prompt:
        'What changes if a remote-access VPN tunnel carries long-lived classified traffic over a 10-year retention window but IKEv2 migration is delayed past 2030?',
      changedAssumptionOutcome:
        'Recorded classical IKEv2 pcaps remain vulnerable to HNDL decryption even if SSH host-key signatures are upgraded first; key-establishment migration must be prioritized.',
    },
    productionToolCheck:
      'Verify `swanctl --list-sas` for RFC 9370 `ADDKE` transforms and `sshd -T | grep kexalgorithms` for `mlkem768x25519-sha256`.',
  },
  'dnssec-pqc': {
    moduleId: 'dnssec-pqc',
    domainTitle: 'DNSSEC signing primitive and resolver validation',
    roleDecisionPrompt:
      'Predict the effect of changing a signature byte. Then validate a signed MX record in the workshop and decide when a resolver should retry over TCP.',
    artifactLabel: 'Fictional release-manifest message for the DNSSEC signature warm-up',
    algorithmVariant: { operation: 'signature', variant: 44 },
    validCaseExplanation:
      'The primitive check verifies an ML-DSA-44 signature over the sample message.',
    adverseFailureExplanation:
      'Changing a signature byte makes verification fail against the original message and key.',
    recoveryActionExplanation:
      'Restoring the signature recovers verification. Use the signed MX exercise in workshop step 2 to test DNS record validation and transport recovery.',
    transferQuestion: {
      prompt:
        'What changes if a zone operator mistakenly selects an encryption KEM (`ML-KEM-768`) instead of a signature algorithm (`ML-DSA-44`) in a DNSSEC signing policy?',
      changedAssumptionOutcome:
        'DNSSEC requires public-key digital signatures over zone RRsets; selecting a KEM creates an immediate primitive-use-case mismatch that cannot sign `RRSIG` records.',
    },
    productionToolCheck:
      'Test staging zones with `dig +dnssec +bufsize=1232` and verify `TC=1` TCP fallback and negative `RRSIG` corruption rejection (`SERVFAIL`).',
  },
  'email-signing': {
    moduleId: 'email-signing',
    domainTitle: 'S/MIME 4.0 CMS SignedData (RFC 9882 ML-DSA-65) & KEMRecipientInfo Integrity',
    roleDecisionPrompt:
      'Determine whether enterprise S/MIME gateways correctly reject modified CMS `SignedData` signatures (`ML-DSA-65`) and distinguish signing from `KEMRecipientInfo` encryption.',
    artifactLabel: 'Fictional S/MIME CMS SignedData ML-DSA-65 detached signature',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'An unmodified CMS `SignedData` object signed with `ML-DSA-65` verifies cleanly against the sender certificate and preserves non-repudiation.',
    adverseFailureExplanation:
      'Altering 1 byte of the CMS signature causes `ML-DSA-65` verification to fail, alerting the recipient mail client that the message or signature was tampered with.',
    recoveryActionExplanation:
      'Re-verify the original untampered CMS bundle and pair `ML-DSA-65` signing with `ML-KEM-768` (`KEMRecipientInfo`, RFC 9629) when message confidentiality is also required.',
    transferQuestion: {
      prompt:
        'What changes if encrypted executive emails must remain confidential for 10 years, yet the organization only migrates S/MIME signatures (`ML-DSA-65`) and leaves key transport on RSA-2048?',
      changedAssumptionOutcome:
        'Signing emails with ML-DSA-65 prevents forgery but does not protect message confidentiality; intercepted RSA-encrypted emails remain exposed to HNDL until `KEMRecipientInfo` (`ML-KEM-768`) is deployed.',
    },
    productionToolCheck:
      'Inspect CMS structures with `openssl asn1parse` and test cross-client rejection of modified `SignedData` and `AuthEnvelopedData` payloads.',
  },
  'pki-workshop': {
    moduleId: 'pki-workshop',
    domainTitle: 'X.509 v3 Multi-Tier PQC Certificate Chain Validation (RFC 9881 ML-DSA)',
    roleDecisionPrompt:
      'Validate a 3-tier X.509 certificate hierarchy (`ML-DSA-87` Root -> `ML-DSA-65` Intermediate -> `ML-DSA-44` Leaf) and diagnose path validation failures when a certificate signature is mutated.',
    artifactLabel: 'Fictional Issuing CA ML-DSA-65 X.509 certificate signature',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'Each certificate in the chain verifies against its issuer’s `ML-DSA` public key (`SubjectPublicKeyInfo`), establishing an unbroken trust path to the Root CA.',
    adverseFailureExplanation:
      'Flipping 1 byte in the Issuing CA’s 3,309-byte `ML-DSA-65` signature causes X.509 path validation (`certificate signature failure`) to abort immediately.',
    recoveryActionExplanation:
      'Serve the intact certificate chain from the CA repository/AIA endpoint and re-run `openssl verify` and OCSP/CRL revocation checks.',
    transferQuestion: {
      prompt:
        'What changes if an enterprise CA issues a Root CA certificate with a 20-year validity period using a classical algorithm past the 2030 deprecation milestone?',
      changedAssumptionOutcome:
        'Every relying party and subordinate CA anchored to that classical root inherits non-compliance and quantum forgery risk, requiring a root cross-signing or re-keying ceremony.',
    },
    productionToolCheck:
      'Issue a non-production `ML-DSA` certificate chain, decode OIDs (`2.16.840.1.101.3.4.3.17/18/19`) with `openssl x509 -text`, and test negative signature tampering.',
  },
  'kms-pqc': {
    moduleId: 'kms-pqc',
    domainTitle: 'Cloud KMS Envelope Encryption (ML-KEM-768 DEK Wrap & Context Binding)',
    roleDecisionPrompt:
      'Verify how a KMS envelope encryption workflow encapsulates a Data Encryption Key (DEK) with `ML-KEM-768` and rejects tampered ciphertexts via AEAD authentication.',
    artifactLabel: 'Fictional KMS ML-KEM-768 wrapped DEK ciphertext & AES-256-GCM tag',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'KMS `Decapsulate` recovers the 32-byte shared secret from the intact `ML-KEM-768` ciphertext, unwrapping the `AES-256-GCM` DEK and decrypting the payload.',
    adverseFailureExplanation:
      'A 1-byte mutation in the stored `ML-KEM-768` ciphertext causes `Decapsulate` to return a deterministic pseudo-random fallback key (implicit rejection), which immediately fails `AES-256-GCM` tag verification.',
    recoveryActionExplanation:
      'Restore the undamaged envelope ciphertext from redundant object storage and log the integrity failure in KMS/CloudTrail audit trails.',
    transferQuestion: {
      prompt:
        'What changes if long-lived backup archives (10-year retention) remain wrapped under classical RSA-2048 KEKs until 2031?',
      changedAssumptionOutcome:
        'The backup archives exceed both the 2030 policy milestone and the 8-year HNDL horizon (5 years excess exposure), requiring envelope re-wrapping with `ML-KEM-768` without re-encrypting bulk AES-256 ciphertext.',
    },
    productionToolCheck:
      'Test KMS `Encapsulate`/`Decapsulate` APIs in staging, verify HKDF encryption-context binding, and confirm CloudTrail logs capture failed unwrap attempts.',
  },
  'hsm-pqc': {
    moduleId: 'hsm-pqc',
    domainTitle: 'PKCS#11 v3.2 HSM Partition Signing (CKM_ML_DSA) & Attribute Enforcement',
    roleDecisionPrompt:
      'Ensure HSM partitions enforce `CKA_SENSITIVE=TRUE` and `CKA_EXTRACTABLE=FALSE` on `ML-DSA-65` keys and deterministically reject tampered signatures across HA slots.',
    artifactLabel: 'Fictional PKCS#11 v3.2 CKM_ML_DSA (ML-DSA-65) HSM partition signature',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The HSM slot executes `C_Sign` and `C_Verify` with `CKM_ML_DSA` (`CKP_ML_DSA_65`) inside the FIPS 140-3 Level 3 boundary and validates the unmodified signature.',
    adverseFailureExplanation:
      'Mutating 1 byte of the signature buffer causes `C_Verify` to return `CKR_SIGNATURE_INVALID` (`false`), preventing acceptance of corrupted hardware-signed artifacts.',
    recoveryActionExplanation:
      'Re-verify against the intact signature or re-sign via an active HA partition slot while keeping private key material non-extractable.',
    transferQuestion: {
      prompt:
        'What changes if an HSM administrator attempts to use `C_Sign` with `CKM_ML_KEM` instead of `C_EncapsulateKey`/`C_DecapsulateKey`?',
      changedAssumptionOutcome:
        'PKCS#11 v3.2 separates KEM mechanisms (`C_EncapsulateKey`/`C_DecapsulateKey`) from signature mechanisms (`C_Sign`/`C_Verify`); the HSM returns `CKR_MECHANISM_INVALID` (primitive mismatch).',
    },
    productionToolCheck:
      'Run `pkcs11-tool --list-mechanisms` on staging HSM partitions to confirm `CKM_ML_KEM`, `CKM_ML_DSA`, and `CKM_SLH_DSA` firmware support and attribute templates.',
  },
  'pqc-hw-acceleration': {
    moduleId: 'pqc-hw-acceleration',
    domainTitle: 'Hardware NTT / Keccak Accelerator Fault Detection & Signature Integrity',
    roleDecisionPrompt:
      'Evaluate how a hardware NTT/Keccak accelerator detects voltage-glitch or electromagnetic fault injection during `ML-DSA-65` signing before releasing an output.',
    artifactLabel: 'Fictional SoC NTT-accelerated ML-DSA-65 signature output',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'When the NTT polynomial multiplier and SHAKE sponge operate without fault injection, the hardware self-check confirms the generated `ML-DSA-65` signature is valid.',
    adverseFailureExplanation:
      'A simulated 1-byte fault injected into the output signature causes the post-sign verification check to fail (`false`), blocking bus release of a corrupted signature.',
    recoveryActionExplanation:
      'Zeroize the faulted internal SRAM buffers, clear the DMA output register, and re-run the constant-time signing pipeline.',
    transferQuestion: {
      prompt:
        'What changes if an embedded SoC has only 16 KB of free SRAM and must perform high-assurance firmware verification?',
      changedAssumptionOutcome:
        'Full `ML-DSA-87` keygen/signing may exceed tight SRAM budgets unless streaming NTT/Keccak hardware offload or compact stateful hash verification (`LMS`) is selected for the boot ROM.',
    },
    productionToolCheck:
      'Review target silicon/FPGA cycle counts, SRAM stack high-water marks, and TVLA side-channel / fault-injection test reports.',
  },
  'crypto-product-certification': {
    moduleId: 'crypto-product-certification',
    domainTitle: 'CAVP Algorithm Certificate vs CMVP Module Boundary Verification',
    roleDecisionPrompt:
      'Verify whether a vendor’s claimed PQC capability executes inside a validated cryptographic module boundary (`ML-DSA-65`) and rejects tampered artifacts.',
    artifactLabel: 'Fictional CAVP/CMVP module ML-DSA-65 signed binary attestation',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The validated module verifies the intact `ML-DSA-65` signature using its CAVP-certified algorithm implementation.',
    adverseFailureExplanation:
      'Flipping 1 byte of the signature causes the module verification check to fail; relying on an unvalidated host library outside the module boundary invalidates compliance claims.',
    recoveryActionExplanation:
      'Restore the valid signed artifact and bind application calls strictly to the FIPS-validated provider/module binary hash.',
    transferQuestion: {
      prompt:
        'What changes if a vendor presents a NIST CAVP algorithm certificate for `ML-KEM-768`, but its CMVP FIPS 140-3 module certificate only lists classical algorithms?',
      changedAssumptionOutcome:
        'A CAVP certificate only proves the algorithm passed test vectors; until `ML-KEM-768` appears on the CMVP module certificate’s approved list, running it does not count as FIPS 140-3 validated module execution.',
    },
    productionToolCheck:
      'Cross-check vendor CAVP and CMVP certificate numbers on the NIST CSRC database against the exact deployed library version and Security Policy.',
  },
  'fips-140-3-certification': {
    moduleId: 'fips-140-3-certification',
    domainTitle: 'FIPS 140-3 Pre-Operational CAST & Pairwise Consistency Fault Injection',
    roleDecisionPrompt:
      'Confirm that a FIPS 140-3 cryptographic module’s Conditional Algorithm Self-Test (CAST) detects a 1-byte corruption in `ML-DSA-65` signature verification and halts crypto output.',
    artifactLabel: 'Fictional FIPS 140-3 POST/CAST ML-DSA-65 self-test vector',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'During Power-On Self-Test (POST), the intact `ML-DSA-65` known-answer vector verifies true, allowing the module to transition to the operational state.',
    adverseFailureExplanation:
      'Injecting a 1-byte fault into the `ML-DSA-65` signature vector causes verification to return false, forcing the FIPS 140-3 module into the soft/hard error state.',
    recoveryActionExplanation:
      'Clear the fault condition, restore the uncorrupted module image, and re-execute POST before enabling cryptographic services.',
    transferQuestion: {
      prompt:
        'What changes if a federal system’s transition schedule completes FIPS 140-3 PQC module deployment in 2031 against a 2030 agency deadline?',
      changedAssumptionOutcome:
        'The 2031 completion triggers an applicable policy deadline violation even if the cryptographic primitive (`ML-KEM-768` or `ML-DSA-65`) matches the intended operation.',
    },
    productionToolCheck:
      'Trigger the module’s FIPS self-test fault-injection hook in staging and verify that all cryptographic APIs block output until POST succeeds.',
  },
  'cc-eucc-certification': {
    moduleId: 'cc-eucc-certification',
    domainTitle: 'Common Criteria / EUCC Security Target Scope (`FCS_COP.1`) & Tamper Check',
    roleDecisionPrompt:
      'Evaluate whether a product’s Common Criteria / EUCC Security Target (`FCS_COP.1`) covers the exact PQC operation (`ML-DSA-65` verification) and rejects corrupted inputs.',
    artifactLabel: 'Fictional EUCC evaluated-configuration ML-DSA-65 signature check',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'Inside the evaluated configuration specified by the Security Target, the intact `ML-DSA-65` signature verifies cleanly.',
    adverseFailureExplanation:
      'Mutating byte 0 of the signature causes `FCS_COP.1` signature verification to reject the input; claiming the ST covers key establishment when it only lists signature verification is a scope contradiction.',
    recoveryActionExplanation:
      'Restore the valid signature and align procurement claims strictly with the SFRs (`FCS_COP.1`, `FCS_CKM.1`) listed in the published Security Target.',
    transferQuestion: {
      prompt:
        'What changes if a hardware appliance is deployed with an admin feature enabled that the Common Criteria Security Target explicitly excludes from the evaluated configuration?',
      changedAssumptionOutcome:
        'The deployed appliance operates outside its EUCC/CC certificate scope; the certification no longer attests to its security posture until returned to the evaluated configuration.',
    },
    productionToolCheck:
      'Compare your deployed firmware configuration flags line-by-line against the Common Criteria / EUCC Security Target and Guidance Documentation (`AGD_OPE`).',
  },
  'pci-certification': {
    moduleId: 'pci-certification',
    domainTitle: 'PCI DSS v4.0.1 Req. 12.3.3 Inventory & Cardholder Transit KEM Integrity',
    roleDecisionPrompt:
      'Distinguish current PCI DSS v4.0.1 requirements (Req. 12.3.3 cipher inventory, Req. 4.2.1 strong transit crypto) from proactive `ML-KEM-768` hybrid TLS planning.',
    artifactLabel: 'Fictional payment gateway TLS 1.3 ML-KEM-768 key-establishment sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'An intact `ML-KEM-768` encapsulation establishes a shared secret that passes AEAD confirmation for cardholder data in transit.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-KEM-768` ciphertext triggers implicit rejection and fails AEAD confirmation, terminating the payment gateway session safely.',
    recoveryActionExplanation:
      'Restore valid key establishment and record the negotiated hybrid cipher suites in the annual PCI DSS Req. 12.3.3 cryptographic inventory.',
    transferQuestion: {
      prompt:
        'What changes if a QSA review checks whether PCI DSS v4.0.1 itself mandates post-quantum cryptography by 2030 versus an internal bank policy?',
      changedAssumptionOutcome:
        'PCI DSS v4.0.1 Req. 12.3.3 mandates an annual cryptographic inventory and industry-trend monitoring rather than a hard PQC cutover date, whereas an internal bank policy with a 2030 deadline enforces a binding organizational milestone.',
    },
    productionToolCheck:
      'Audit your annual PCI DSS Req. 12.3.3 inventory artifact and verify payment-gateway TLS 1.3 configurations in staging.',
  },
  'data-asset-sensitivity': {
    moduleId: 'data-asset-sensitivity',
    domainTitle: 'Data Sensitivity Classification, Retention Lifetimes & HNDL KEM Protection',
    roleDecisionPrompt:
      'Map asset confidentiality lifetimes (3-year short-lived vs 10-year+ regulated archives) to `ML-KEM-768` key establishment and evaluate HNDL exposure.',
    artifactLabel: 'Fictional high-sensitivity archive ML-KEM-768 encapsulation envelope',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Protecting high-sensitivity data flows with `ML-KEM-768` ensures decapsulation derives the authentic key and neutralizes passive HNDL capture.',
    adverseFailureExplanation:
      'A 1-byte mutation in the `ML-KEM-768` ciphertext causes decapsulation to derive a non-matching secret that fails AEAD confirmation.',
    recoveryActionExplanation:
      'Restore the valid encapsulation ciphertext and prioritize 10-year+ retention datasets for immediate hybrid/PQC key-establishment rollout.',
    transferQuestion: {
      prompt:
        'What changes when you reclassify a dataset from short-lived operational telemetry (3y retention + 2y migration) to regulated PII/financial records (10y retention + 3y migration) under an 8-year horizon?',
      changedAssumptionOutcome:
        'Scenario arithmetic shifts from -3 years (3 + 2 - 8 = -3, within horizon) to +5 years excess exposure (10 + 3 - 8 = +5), triggering an immediate `scenario-risk` finding.',
    },
    productionToolCheck:
      'Join your enterprise data-classification catalog with KMS/TLS cipher inventories to flag every long-retention asset still using classical key exchange.',
  },
  'stateful-signatures': {
    moduleId: 'stateful-signatures',
    domainTitle: 'SP 800-208 LMS/XMSS Monotonic State Discipline & Firmware Signature Verification',
    roleDecisionPrompt:
      'Compare stateful hash-based signing (`LMS/HSS`, `XMSS` monotonic leaf index `q`) with stateless `ML-DSA-87` firmware verification, and test 1-byte signature tamper rejection.',
    artifactLabel: 'Fictional high-assurance firmware manifest signature (ML-DSA-87 / SP 800-208)',
    algorithmVariant: { operation: 'signature', variant: 87 },
    validCaseExplanation:
      'An intact signature over the firmware manifest verifies true, while hardware-enforced NVRAM state counters prevent leaf-index reuse on stateful keys.',
    adverseFailureExplanation:
      'Flipping 1 byte of the firmware signature causes verification to fail immediately, halting firmware installation before flash write.',
    recoveryActionExplanation:
      'Fetch the uncorrupted signed firmware image (or advance to a fresh HSS subtree / stateless `ML-DSA-87` key if an HSM partition state fault occurs).',
    transferQuestion: {
      prompt:
        'What changes if a signing operator exports an `LMS` or `XMSS` private key out of an HSM into a virtual machine that gets snapshotted and rolled back?',
      changedAssumptionOutcome:
        'Rolling back the VM reuses one-time signature (OTS) leaf index `q` on two different messages, allowing an attacker to forge arbitrary signatures without a quantum computer.',
    },
    productionToolCheck:
      'Verify that stateful `LMS`/`XMSS` keys reside solely in FIPS 140-3 HSMs with non-exportable monotonic counters, or use stateless `ML-DSA-87`/`SLH-DSA` where hardware state cannot be guaranteed.',
  },
  'digital-assets': {
    moduleId: 'digital-assets',
    domainTitle: 'Institutional Custody Wallet Transaction Signing (ML-DSA-65) & Witness Integrity',
    roleDecisionPrompt:
      'Verify how an institutional custody HSM or account-abstraction smart wallet validates post-quantum `ML-DSA-65` transaction signatures and blocks mutated witnesses.',
    artifactLabel: 'Fictional custody transfer authorization witness (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The intact 3,309-byte `ML-DSA-65` witness verifies against the custody vault’s registered post-quantum public key, authorizing settlement.',
    adverseFailureExplanation:
      'Modifying 1 byte of the witness signature causes `ML-DSA-65` verification to return false, rejecting the transaction before broadcast or on-chain execution.',
    recoveryActionExplanation:
      'Re-sign or re-submit the unmodified transaction witness from the custody HSM quorum and rotate exposed classical `secp256k1` addresses.',
    transferQuestion: {
      prompt:
        'What changes if a blockchain treasury address has previously broadcast outgoing `secp256k1` transactions (exposing its raw public key on-chain) versus a fresh unspent address hash?',
      changedAssumptionOutcome:
        'Exposed on-chain public keys are directly vulnerable to Shor-based private-key recovery once a CRQC arrives, requiring proactive asset migration to PQC-protected custody.',
    },
    productionToolCheck:
      'Benchmark PQC witness serialization size and verification compute/gas cost on your target testnet and custody HSM.',
  },
  '5g-security': {
    moduleId: '5g-security',
    domainTitle: '3GPP TS 33.501 5G SUCI Concealment & Home Network KEM Encapsulation',
    roleDecisionPrompt:
      'Evaluate post-quantum subscriber identifier (`SUPI` -> `SUCI`) concealment using `ML-KEM-768` between the UE/USIM and the Home Network UDM/SIDF.',
    artifactLabel: 'Fictional 5G SUCI Home Network ML-KEM-768 ciphertext & AEAD tag',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The UE encapsulates to the Home Network’s `ML-KEM-768` public key, and the SIDF decapsulates the intact ciphertext to deconceal the subscriber `SUPI` safely.',
    adverseFailureExplanation:
      'If an active radio-link attacker flips 1 byte of the `ML-KEM-768` ciphertext, SIDF decapsulation derives a fallback secret (implicit rejection) and the `SUCI` AEAD MAC check rejects the registration request.',
    recoveryActionExplanation:
      'Restore intact `SUCI` transmission (or trigger a fresh UE encapsulation attempt) while securing N2/N3 IPsec and SBA N32 TLS 1.3 links.',
    transferQuestion: {
      prompt:
        'What changes if a mobile operator upgrades SBA TLS 1.3 (`X25519MLKEM768`) in the 5G core by 2030, but USIM/SIDF `SUCI` concealment remains on classical ECIES Profile A/B with long-term subscriber tracking risk?',
      changedAssumptionOutcome:
        'Core SBA links are protected, but over-the-air radio captures of classical ECIES `SUCI` frames remain exposed to retroactive `SUPI` subscriber deconcealment until 3GPP PQC SUCI profiles are deployed.',
    },
    productionToolCheck:
      'Run staging SIDF deconcealment test vectors, inspect N32/N2 TLS 1.3 and IKEv2 handshakes, and verify 256-bit `TUAK` / `MILENAGE` subscriber key policies.',
  },
  'digital-id': {
    moduleId: 'digital-id',
    domainTitle: 'ISO/IEC 18013-5 mDL & eIDAS 2.0 Wallet Attestation Signing (ML-DSA-65)',
    roleDecisionPrompt:
      'Verify that a mobile driver’s license (mDL `MSO`) or eIDAS 2.0 PID verifiable credential signed with `ML-DSA-65` rejects 1-byte tampering during Relying Party verification.',
    artifactLabel: 'Fictional ISO 18013-5 mDL COSE_Sign1 Mobile Security Object (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The verifier validates the intact `COSE_Sign1` `ML-DSA-65` issuer signature against the trusted eIDAS/state issuer certificate list.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `COSE_Sign1` signature or truncated NFC APDU frame causes `ML-DSA-65` verification to return false, rejecting the identity presentation.',
    recoveryActionExplanation:
      'Re-transmit the complete chunked APDU presentation over BLE/NFC and verify the intact `MSO` signature.',
    transferQuestion: {
      prompt:
        'What changes if a national identity issuer signs 10-year citizen credentials using a classical signature algorithm after a 2030 eIDAS/national transition deadline?',
      changedAssumptionOutcome:
        'Credentials remain in circulation past the deprecation milestone, creating both a policy violation and active forgery exposure across relying parties.',
    },
    productionToolCheck:
      'Test end-to-end `COSE_Sign1` / SD-JWT issuance and BLE/NFC proximity verification latency with `ML-DSA-65` in staging.',
  },
  'entropy-randomness': {
    moduleId: 'entropy-randomness',
    domainTitle: 'SP 800-90B/90A 256-Bit Seed Conditioning & ML-KEM-768 Encapsulation Control',
    roleDecisionPrompt:
      'Verify how conditioned 256-bit DRBG entropy seeds (`d`, `z`) drive `ML-KEM-768` keygen/encapsulation and how implicit-rejection secret derivation behaves on ciphertext corruption.',
    artifactLabel: 'Fictional SP 800-90A seeded ML-KEM-768 encapsulation & confirmation sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Seeded with full-entropy randomness, `ML-KEM-768` keygen and encapsulation produce a valid keypair and shared secret confirmed by AEAD decryption.',
    adverseFailureExplanation:
      'Mutating byte 0 of the ciphertext causes decapsulation to use the secret implicit-rejection seed `z`, yielding a pseudorandom key that fails AEAD confirmation.',
    recoveryActionExplanation:
      'Restore the unmodified ciphertext to recover the shared secret, and ensure SP 800-90B RCT/APT health tests continuously guard the noise source feeding `d` and `z`.',
    transferQuestion: {
      prompt:
        'What changes if the secret implicit-rejection seed `z` in `ML-KEM` is generated from a predictable or zeroed RNG instead of an SP 800-90A/90B CSPRNG?',
      changedAssumptionOutcome:
        'An attacker submitting mutated ciphertexts could predict the implicit-rejection output, weakening IND-CCA2 security and exposing the decapsulation implementation to chosen-ciphertext analysis.',
    },
    productionToolCheck:
      'Run the NIST SP 800-90B min-entropy assessment suite (`ea_non_iid`) on raw noise samples and verify ESV/FIPS 140-3 DRBG health-test alarms.',
  },
  'merkle-tree-certs': {
    moduleId: 'merkle-tree-certs',
    domainTitle: 'IETF Merkle Tree Certificates (MTC) Checkpoint Signature & Proof Verification',
    roleDecisionPrompt:
      'Evaluate how Merkle Tree Certificates replace multi-kilobyte per-CA PQC signatures on the TLS wire with a cosigned tree-head checkpoint (`ML-DSA-65`) and inclusion proof.',
    artifactLabel: 'Fictional MTC issuance-log checkpoint signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The client verifies the intact `ML-DSA-65` checkpoint signature and Merkle inclusion proof, authenticating the TLS leaf key within a compact byte budget.',
    adverseFailureExplanation:
      'Flipping 1 byte of the checkpoint signature or inclusion proof invalidates verification (`false`), causing the TLS client to abort the handshake.',
    recoveryActionExplanation:
      'Serve the intact landmark checkpoint signature and configure fallback to standard X.509 `ML-DSA-65` chains for clients without MTC support.',
    transferQuestion: {
      prompt:
        'What changes if an edge CDN serves MTC certificates to legacy TLS clients that do not advertise the MTC extension?',
      changedAssumptionOutcome:
        'Clients lacking MTC support will reject the certificate unless the edge terminator negotiates MTC dynamically and falls back to a standard X.509 chain.',
    },
    productionToolCheck:
      'Benchmark TLS 1.3 handshake byte budgets comparing a 3-cert `ML-DSA-65` chain against an MTC inclusion proof in a staging testbed.',
  },
  qkd: {
    moduleId: 'qkd',
    domainTitle: 'Hybrid QKD (ETSI 014) + ML-KEM-768 Combiner & Control-Channel Integrity',
    roleDecisionPrompt:
      'Assess how a defense-in-depth combiner mixes ETSI GS QKD 014 optical keys with `ML-KEM-768` and rejects corrupted key-encapsulation payloads.',
    artifactLabel: 'Fictional hybrid QKD + ML-KEM-768 key-exchange confirmation payload',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The hybrid combiner derives a session key from both the QKD key ID and the intact `ML-KEM-768` encapsulation, passing AEAD key confirmation.',
    adverseFailureExplanation:
      'Mutating byte 0 of the `ML-KEM-768` ciphertext alters the decapsulated PQ component secret, causing the combined session key to fail AEAD confirmation.',
    recoveryActionExplanation:
      'Restore the valid `ML-KEM-768` encapsulation and ensure the ETSI 014 control channel is authenticated with post-quantum signatures (`ML-DSA-65`).',
    transferQuestion: {
      prompt:
        'What changes if an organization deploys optical QKD on a single metro fibre link without `ML-KEM-768` hybridization or PQC control-channel authentication?',
      changedAssumptionOutcome:
        'The deployment contradicts BSI/ANSSI defense-in-depth guidance (and NSA/NCSC guidance against standalone QKD), leaving the classical control channel and non-optical hops exposed.',
    },
    productionToolCheck:
      'Test ETSI GS QKD 014 `get_key` integration with RFC 8784 IKEv2 PPK and verify session continuity when the optical QKD link is interrupted.',
  },
  'vendor-risk': {
    moduleId: 'vendor-risk',
    domainTitle: 'Third-Party Vendor CBOM Attestation (ML-DSA-65) & SLA Milestone Scope',
    roleDecisionPrompt:
      'Verify vendor-delivered CycloneDX 1.6 CBOM attestations signed with `ML-DSA-65` and evaluate whether vendor delivery timelines breach your 2030 procurement policy.',
    artifactLabel: 'Fictional vendor CycloneDX 1.6 CBOM attestation signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'An intact `ML-DSA-65` signature over the vendor’s CBOM JSON confirms the artifact has not been modified since release signing.',
    adverseFailureExplanation:
      'Flipping 1 byte of the vendor signature causes verification to fail; a vendor roadmap promising key-establishment migration in 2031 violates a 2030 contract policy.',
    recoveryActionExplanation:
      'Require a validly signed CBOM artifact, verify CAVP/CMVP numbers on NIST CSRC, and enforce contract SLA addenda for pre-2030 delivery.',
    transferQuestion: {
      prompt:
        'What changes if a SaaS vendor claims to be "quantum-safe" because it signs release notes with `ML-DSA-65`, while its customer data API still uses classical TLS key exchange until 2031?',
      changedAssumptionOutcome:
        'The vendor has a primitive mismatch for data-in-transit confidentiality and exceeds both the 2030 policy milestone and the HNDL threat horizon.',
    },
    productionToolCheck:
      'Validate vendor CBOM deliverables against independent TLS/SSH network scans and NIST CSRC CMVP certificate lookups.',
  },
  'compliance-strategy': {
    moduleId: 'compliance-strategy',
    domainTitle: 'Multi-Jurisdiction Regulatory Deadline Mapping & Evidence Integrity',
    roleDecisionPrompt:
      'Reconcile overlapping PQC timelines (CNSA 2.0, NIST IR 8547, EU DORA/NIS2, UK NCSC) and verify that signed compliance evidence dossiers (`ML-DSA-65`) detect tampering.',
    artifactLabel: 'Fictional multi-jurisdiction compliance dossier signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The intact `ML-DSA-65` signature validates the dated compliance evidence package, while the policy evaluator checks completion year against applicable mandates.',
    adverseFailureExplanation:
      'Altering 1 byte of the signed dossier fails verification; completing migration in 2031 under an applicable 2030 mandate raises a policy violation.',
    recoveryActionExplanation:
      'Restore the original signed evidence package and advance the migration wave to 2030 (or document a time-bound compensating control waiver where permitted).',
    transferQuestion: {
      prompt:
        'What changes if a regional subsidiary is outside a specific 2030 regulatory mandate (`applies = false`), but processes 10-year confidential customer archives?',
      changedAssumptionOutcome:
        'The evaluator flags `out-of-scope` for the regulatory deadline, yet the 5-year HNDL `scenario-risk` persists because mathematical exposure does not depend on legal scope.',
    },
    productionToolCheck:
      'Trace each jurisdictional mandate in your GRC register down to a dated CBOM scan and negative-test verification receipt.',
  },
  'migration-program': {
    moduleId: 'migration-program',
    domainTitle: 'Seven-Phase Migration Wave Sequencing, Canary Rollback & HNDL Horizon',
    roleDecisionPrompt:
      'Sequence migration waves across PKI, KMS/HSM, and network tiers using `ML-KEM-768` pilot checks while managing 2030 completion milestones.',
    artifactLabel: 'Fictional pilot wave ML-KEM-768 canary key-establishment check',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The canary wave establishes a valid `ML-KEM-768` shared secret and passes AEAD key confirmation before production traffic cutover.',
    adverseFailureExplanation:
      'Injecting a 1-byte fault into the `ML-KEM-768` ciphertext triggers implicit rejection and AEAD confirmation failure, exercising the automated canary rollback gate.',
    recoveryActionExplanation:
      'Restore the valid configuration, verify telemetry health, and pull long-retention services into earlier migration waves to meet the 2030 deadline.',
    transferQuestion: {
      prompt:
        'What changes if a program manager schedules an application wave to adopt `ML-DSA-65` certificates before the upstream Issuing CA and HSM firmware wave completes?',
      changedAssumptionOutcome:
        'The wave fails on an unmet upstream dependency; PKI root/issuing CAs and HSM firmware must precede consuming application waves in the dependency graph.',
    },
    productionToolCheck:
      'Run a pilot migration wave and emergency rollback drill in staging, capturing both forward cutover and negative-fault telemetry.',
  },
  'pqc-risk-management': {
    moduleId: 'pqc-risk-management',
    domainTitle: 'Quantitative Risk Register (Mosca X + Y > Z) & Control Verification',
    roleDecisionPrompt:
      'Quantify HNDL vs active-forgery risk in your enterprise risk register and verify `ML-KEM-768` key-establishment controls against mutated inputs.',
    artifactLabel: 'Fictional risk-register ML-KEM-768 control verification sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Migrating a key-establishment flow to `ML-KEM-768` produces a verified shared secret and mitigates HNDL exposure for new sessions.',
    adverseFailureExplanation:
      'A 1-byte mutation in the `ML-KEM-768` ciphertext causes decapsulation secret mismatch and AEAD rejection; leaving quantum-vulnerable key exchange until 2031 creates 5 years of excess HNDL exposure.',
    recoveryActionExplanation:
      'Restore the valid `ML-KEM-768` control and accelerate migration of long-retention data flows so `X + Y <= Z`.',
    transferQuestion: {
      prompt:
        'What changes if a risk committee accepts a policy waiver extending migration to 2032 for a 10-year retention database?',
      changedAssumptionOutcome:
        'Signing a governance waiver removes internal policy-audit escalation, but does not reduce the 5-year HNDL mathematical exposure against external adversaries.',
    },
    productionToolCheck:
      'Reconcile risk-register entries quarterly against automated network TLS/SSH discovery and CBOM scans.',
  },
  'pqc-testing-validation': {
    moduleId: 'pqc-testing-validation',
    domainTitle: 'CI/CD Negative Tamper-Rejection Harness & MTU Fragmentation Testing',
    roleDecisionPrompt:
      'Design a staging test suite that proves both positive `ML-DSA-65` verification and deterministic rejection of 1-byte mutated signatures across vendor stacks.',
    artifactLabel: 'Fictional CI/CD negative-test ML-DSA-65 signature vector',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The positive control verifies the unmodified 3,309-byte `ML-DSA-65` signature first, establishing that the test harness is operational.',
    adverseFailureExplanation:
      'Flipping byte 0 of the signature causes the negative control to return `false`, proving the verifier does not silently pass corrupted inputs.',
    recoveryActionExplanation:
      'Restore the original signature vector to confirm stateless recovery without side effects on subsequent test runs.',
    transferQuestion: {
      prompt:
        'What changes if a QA suite only runs positive happy-path handshakes and never tests mutated signatures or 1,500-byte MTU boundaries?',
      changedAssumptionOutcome:
        'A stubbed or misconfigured verifier that always returns true (or a firewall that drops fragmented packets in production) would pass QA undetected.',
    },
    productionToolCheck:
      'Integrate ACVP KAT vectors, 1-byte bit-flip negative tests, and constrained-MTU network tests into your CI/CD pipeline.',
  },
  'acvp-lab-workflow': {
    moduleId: 'acvp-lab-workflow',
    domainTitle: 'NIST ACVP sigGen/sigVer Vector Harness & FIPS 204 §6.3 Rejection Rules',
    roleDecisionPrompt:
      'Validate how an ACVP test harness processes `ML-DSA-65` `sigVer` vectors and deterministically rejects 1-byte mutated signatures for CSTL lab evidence.',
    artifactLabel: 'Fictional ACVP sigVer test-group ML-DSA-65 signature vector',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The implementation under test (IUT) outputs `"testPassed": true` on the valid `ML-DSA-65` vector, matching the ACVP server’s expected result.',
    adverseFailureExplanation:
      'When the ACVP `sigVer` vector flips 1 byte in the signature, the IUT returns `"testPassed": false` per FIPS 204 §6.3 (`ML-DSA.Verify_internal`).',
    recoveryActionExplanation:
      'Re-run the unmodified control vector to confirm `"testPassed": true` and package the complete ACVP request/response JSON transcript.',
    transferQuestion: {
      prompt:
        'What changes if a developer leaves the deterministic ACVP seed-injection test hook (`xi`, `rnd`) enabled in the production binary release?',
      changedAssumptionOutcome:
        'Callers could accidentally or maliciously supply fixed seeds in production, destroying randomness; ACVP seed injection must be gated behind build/validation boundaries while production uses the approved DRBG.',
    },
    productionToolCheck:
      'Run the NIST `acvp-server` vector sets against your target binary and verify zero mismatches across both positive and negative `sigVer`/`encapDecap` test groups.',
  },
  'pqc-business-case': {
    moduleId: 'pqc-business-case',
    domainTitle: 'CFO/CISO Capital Refresh Alignment, TCO Modeling & Horizon Risk',
    roleDecisionPrompt:
      'Align PQC HSM/gateway capital expenditure with hardware refresh cycles while preventing 2031 deadline overruns and HNDL exposure on key establishment.',
    artifactLabel: 'Fictional business-case pilot ML-KEM-768 key-establishment verification',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Validating `ML-KEM-768` on existing or scheduled-refresh hardware confirms the target profile works before committing multi-year capital budgets.',
    adverseFailureExplanation:
      'A 1-byte ciphertext mutation fails AEAD confirmation; deferring hardware refresh to 2031 breaches the 2030 policy milestone and incurs 5 years of HNDL exposure.',
    recoveryActionExplanation:
      'Restore valid key establishment and align the procurement wave with the pre-2030 refresh cycle to avoid emergency retrofit premiums.',
    transferQuestion: {
      prompt:
        'What changes if a budget proposal funds `ML-DSA-65` document-signing HSMs first but defers `ML-KEM-768` customer-portal TLS upgrades to 2032?',
      changedAssumptionOutcome:
        'High-retention customer traffic remains exposed to HNDL during the deferral window, creating unmitigated scenario risk and a 2030 policy violation.',
    },
    productionToolCheck:
      'Validate TCO model assumptions against real vendor HSM/CDN quotes and staging throughput benchmarks.',
  },
  'pqc-governance': {
    moduleId: 'pqc-governance',
    domainTitle: 'Enterprise Cryptographic Policy-as-Code Gates & Exception Governance',
    roleDecisionPrompt:
      'Enforce enterprise PQC policy rules (primitive selection, 2030 deadline, signature integrity) via automated CI/CD and admission gates.',
    artifactLabel: 'Fictional policy-as-code signed deployment manifest (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The OPA/Kyverno admission gate verifies the intact `ML-DSA-65` manifest signature and confirms the workload’s cryptographic profile meets the 2030 policy.',
    adverseFailureExplanation:
      'Flipping 1 byte of the manifest signature causes admission rejection (`false`), and specifying `ML-DSA-65` for key establishment triggers a policy mismatch finding.',
    recoveryActionExplanation:
      'Re-sign the compliant manifest with `ML-DSA-65` and set key establishment to `ML-KEM-768` with completion by 2030.',
    transferQuestion: {
      prompt:
        'What changes if an engineering team marks an internal microservice as exempt from the enterprise portal policy (`applies = false`) even though it replicates 10-year customer data?',
      changedAssumptionOutcome:
        'The policy gate marks the service `out-of-scope` for the portal clause, but the governance engine still surfaces the 5-year HNDL `scenario-risk` requiring CISO review.',
    },
    productionToolCheck:
      'Test your OPA/Kyverno or CI policy linters with both a 1-byte tampered signature and an unapproved algorithm OID to confirm automated blocking.',
  },
  'code-signing': {
    moduleId: 'code-signing',
    domainTitle: 'Release Artifact Signing (ML-DSA-65), RFC 3161 Timestamps & Admission Control',
    roleDecisionPrompt:
      'Verify that release binaries and container images signed with `ML-DSA-65` pass admission control when intact and are blocked on a 1-byte modification.',
    artifactLabel: 'Fictional release binary ML-DSA-65 detached signature (3,309 B)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The package verifier validates the intact 3,309-byte `ML-DSA-65` signature and PQC RFC 3161 timestamp before allowing execution.',
    adverseFailureExplanation:
      'Flipping byte 0 of the `ML-DSA-65` signature causes verification to return `false`, blocking execution of the tampered release artifact.',
    recoveryActionExplanation:
      'Fetch the authentic signed release bundle from the immutable artifact registry and re-verify against the HSM-backed root of trust.',
    transferQuestion: {
      prompt:
        'What changes if a software release is signed with `ML-DSA-65`, but its RFC 3161 timestamp token is still signed with RSA-2048 for an artifact that must verify for 15 years?',
      changedAssumptionOutcome:
        'Once RSA-2048 is deprecated or broken, an attacker can forge the timestamp token over an expired/revoked key; long-lived code signatures require a post-quantum TSA token as well.',
    },
    productionToolCheck:
      'Sign a staging artifact with `ML-DSA-65`, attach a timestamp, flip 1 byte of the binary/signature, and verify admission controller rejection.',
  },
  'software-supply-chain-pqc': {
    moduleId: 'software-supply-chain-pqc',
    domainTitle: 'TUF / Uptane Metadata & SLSA DSSE Provenance Attestation (ML-DSA-65)',
    roleDecisionPrompt:
      'Validate how a TUF/SLSA supply-chain verifier checks `ML-DSA-65` DSSE provenance envelopes and prevents installation of tampered build artifacts.',
    artifactLabel: 'Fictional SLSA Level 3 in-toto DSSE envelope signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The TUF/SLSA verifier confirms the intact `ML-DSA-65` signature over the `targets`/`provenance` metadata before downloading the package.',
    adverseFailureExplanation:
      'A 1-byte mutation in the DSSE signature invalidates `ML-DSA-65` verification (`false`), halting the supply-chain deployment pipeline.',
    recoveryActionExplanation:
      'Restore the valid signed metadata from the threshold-signed TUF repository and verify root-of-trust rotation metadata.',
    transferQuestion: {
      prompt:
        'What changes if CI/CD build nodes sign SLSA provenance with `ML-DSA-65`, but the TUF `root.json` offline threshold keys remain single-algorithm Ed25519?',
      changedAssumptionOutcome:
        'An attacker with quantum capability can forge `root.json` and replace the `ML-DSA-65` build keys entirely; TUF root metadata must transition to hybrid/PQC threshold signatures first.',
    },
    productionToolCheck:
      'Test a staging TUF root key rotation to `ML-DSA-65` threshold signing and verify client rejection of tampered `targets.json` metadata.',
  },
  'api-security-jwt': {
    moduleId: 'api-security-jwt',
    domainTitle: 'Post-Quantum JOSE/JWS Bearer Token Verification (ML-DSA-65) & Header Budgets',
    roleDecisionPrompt:
      'Evaluate how an API gateway validates `ML-DSA-65` JWS bearer tokens (~4.4 KB base64url signature) and rejects 1-byte tampered token signatures.',
    artifactLabel: 'Fictional JWS bearer token ML-DSA-65 signature segment',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The API gateway decodes the JWS token, pins the `alg` header to the JWKS `ML-DSA-65` public key, and accepts the unmodified signature.',
    adverseFailureExplanation:
      'Flipping 1 byte of the JWS signature causes `ML-DSA-65` verification to return `false`, returning `401 Unauthorized` to the caller.',
    recoveryActionExplanation:
      'Present the unmodified JWS token from the OIDC issuer and configure reverse-proxy HTTP header limits (`>= 16 KB`) or phantom-token reference patterns.',
    transferQuestion: {
      prompt:
        'What changes if an upstream CDN or ingress proxy enforces a default 4 KB total HTTP header limit when clients send `ML-DSA-65` JWTs in `Authorization` headers?',
      changedAssumptionOutcome:
        'Because an `ML-DSA-65` signature alone is 3,309 bytes (~4,412 base64url chars), the proxy truncates or rejects the request (`431 Request Header Fields Too Large`) unless header limits are raised or opaque reference tokens are used.',
    },
    productionToolCheck:
      'Send an `ML-DSA-65` signed JWS through your staging API gateway/CDN stack and test both header-size limits and 1-byte signature tamper rejection.',
  },
  'iot-pqc': {
    moduleId: 'iot-pqc',
    domainTitle: 'Constrained MCU DTLS 1.3 (RFC 9147) ML-KEM-512 Session Establishment',
    roleDecisionPrompt:
      'Verify that a constrained IoT device (`ML-KEM-512` over DTLS 1.3 / EDHOC) detects corrupted ciphertext fragments and manages long field-deployment lifetimes.',
    artifactLabel: 'Fictional DTLS 1.3 IoT sensor ML-KEM-512 key-share & AEAD confirmation',
    algorithmVariant: { operation: 'kem', variant: 512 },
    validCaseExplanation:
      'The reassembled 768-byte `ML-KEM-512` ciphertext decapsulates to the matching shared secret and passes DTLS 1.3 `Finished` confirmation within MCU SRAM limits.',
    adverseFailureExplanation:
      'A 1-byte corruption in a lossy 802.15.4/LoRaWAN fragment causes `ML-KEM-512` implicit rejection and fails DTLS AEAD confirmation.',
    recoveryActionExplanation:
      'Retransmit the corrupted DTLS 1.3 fragment (RFC 9147 ACK/reassembly) to restore the intact 768-byte `ML-KEM-512` ciphertext.',
    transferQuestion: {
      prompt:
        'What changes if an industrial IoT sensor fleet has a 15-year field lifespan without over-the-air crypto-agility and is deployed with classical ECDH?',
      changedAssumptionOutcome:
        'The fleet cannot be remediated without physical truck rolls, creating a multi-year HNDL and compliance exposure across its operational lifetime.',
    },
    productionToolCheck:
      'Profile `arm-none-eabi-size` RAM/Flash usage and test DTLS 1.3 `ML-KEM-512`/`768` fragment recovery under simulated packet loss on target MCU hardware.',
  },
  'confidential-computing': {
    moduleId: 'confidential-computing',
    domainTitle: 'TEE Remote Attestation & RA-TLS (ML-KEM-768) Sealed Secret Release',
    roleDecisionPrompt:
      'Confirm that a Confidential Computing KMS releases secrets only when the TEE’s RA-TLS `ML-KEM-768` encapsulation and enclave measurement are intact.',
    artifactLabel: 'Fictional RA-TLS enclave ML-KEM-768 key encapsulation & confirmation',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The enclave decapsulates the intact `ML-KEM-768` ciphertext inside the TEE memory boundary and decrypts the sealed workload secret.',
    adverseFailureExplanation:
      'Mutating 1 byte of the `ML-KEM-768` ciphertext triggers implicit rejection, causing the enclave’s AEAD unwrap check to fail and preventing use of corrupted key material.',
    recoveryActionExplanation:
      'Re-establish the attested RA-TLS session with a verified `SEV-SNP`/`TDX` quote and intact `ML-KEM-768` encapsulation.',
    transferQuestion: {
      prompt:
        'What changes if the RA-TLS transport uses `X25519MLKEM768`, but the hardware attestation quote itself is signed with a classical endorsement key (`ECDSA P-384`) past 2030?',
      changedAssumptionOutcome:
        'While passive HNDL on the RA-TLS session is mitigated by `ML-KEM-768`, an active quantum adversary after CRQC arrival could forge an enclave attestation quote unless silicon endorsement chains migrate to PQC.',
    },
    productionToolCheck:
      'Verify staging TEE attestation quotes, inspect RA-TLS `X25519MLKEM768` negotiation, and test KMS policy rejection on altered `MRTD`/`RTMR` measurements.',
  },
  'homomorphic-encryption': {
    moduleId: 'homomorphic-encryption',
    domainTitle: 'FHE Evaluation-Key Transport & IND-CPA^D Ciphertext Integrity Guard',
    roleDecisionPrompt:
      'Protect Ring-LWE Homomorphic Encryption (BGV/BFV/CKKS/TFHE) evaluation keys and results in transit using `ML-KEM-768` + `AES-256-GCM` so corrupted ciphertexts never reach the decryption oracle.',
    artifactLabel: 'Fictional FHE result transport ML-KEM-768 envelope & AEAD confirmation',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The intact `ML-KEM-768` transport envelope authenticates and unwraps the FHE ciphertext before the client invokes Ring-LWE secret-key decryption.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-KEM-768` transport ciphertext causes implicit rejection and AEAD tag failure, blocking malformed ciphertexts from triggering IND-CPA^D decryption-failure leakage.',
    recoveryActionExplanation:
      'Reject the corrupted transport frame at the AEAD layer and request retransmission of the intact envelope.',
    transferQuestion: {
      prompt:
        'What changes if an FHE service exposes raw Ring-LWE decryption outputs back to untrusted callers without authenticated transport or noise-flooding/circuit bounds?',
      changedAssumptionOutcome:
        'Callers can submit perturbed ciphertexts and observe decryption errors to recover the Ring-LWE secret key (IND-CPA^D attack), even though the lattice parameters resist quantum attacks.',
    },
    productionToolCheck:
      'Validate Ring-LWE parameters (`N`, `q`) against the HomomorphicEncryption.org security tables (`>= 128-bit`) and enforce authenticated PQC transport envelopes.',
  },
  'web-gateway-pqc': {
    moduleId: 'web-gateway-pqc',
    domainTitle: 'Edge CDN / Reverse Proxy (NGINX / Envoy) Ingress & Origin TLS 1.3 PQC',
    roleDecisionPrompt:
      'Verify that edge web gateways terminate `X25519MLKEM768` on client ingress AND re-encrypt upstream origin connections with `ML-KEM-768` key confirmation.',
    artifactLabel: 'Fictional edge-to-origin TLS 1.3 ML-KEM-768 KeyShare & AEAD confirmation',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Both the ingress and upstream origin TLS 1.3 legs decapsulate intact `ML-KEM-768` key shares and pass `Finished` AEAD confirmation.',
    adverseFailureExplanation:
      'A 1-byte corruption in the upstream `ML-KEM-768` key share derives a mismatched secret via implicit rejection, failing the origin TLS 1.3 `Finished` check (`502 Bad Gateway`).',
    recoveryActionExplanation:
      'Restore intact upstream TLS 1.3 negotiation and monitor `$ssl_curve` access-log metrics across both ingress and origin legs.',
    transferQuestion: {
      prompt:
        'What changes if an enterprise enables `X25519MLKEM768` on its public CDN edge, but leaves the CDN-to-origin leg over the public internet on classical ECDH until 2031?',
      changedAssumptionOutcome:
        'The origin leg remains vulnerable to HNDL interception across the transit network and violates the 2030 end-to-end migration policy.',
    },
    productionToolCheck:
      'Check `ssl_ecdh_curve X25519MLKEM768:X25519` on both ingress and proxy_ssl upstream directives and inspect `$ssl_curve` telemetry under load.',
  },
  'emv-payment-pqc': {
    moduleId: 'emv-payment-pqc',
    domainTitle: 'EMV Contactless ODA Cryptogram Verification (ML-DSA-44) & Acquirer Transit',
    roleDecisionPrompt:
      'Evaluate post-quantum Offline Data Authentication (`ML-DSA-44`) and acquirer-to-issuer TLS 1.3 (`ML-KEM-768`) within EMV contactless tap-time and APDU constraints.',
    artifactLabel: 'Fictional EMV payment kernel ML-DSA-44 dynamic cryptogram signature',
    algorithmVariant: { operation: 'signature', variant: 44 },
    validCaseExplanation:
      'The payment terminal verifies the intact 2,420-byte `ML-DSA-44` card/issuer signature and forwards the authorization over a PQC-protected acquirer link.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-DSA-44` cryptogram signature causes terminal ODA verification to return `false`, declining or flagging the tampered card transaction.',
    recoveryActionExplanation:
      'Re-read the intact APDU response from the contactless card and ensure acquirer host links use `ML-KEM-768` before the 2030 deadline.',
    transferQuestion: {
      prompt:
        'What changes if a payment processor signs settlement batches with `ML-DSA-65`, but keeps 10-year retained cardholder settlement archives on classical key transport until 2031?',
      changedAssumptionOutcome:
        'Using a signature algorithm does not protect settlement transit confidentiality (primitive mismatch), and completing key-establishment migration in 2031 exceeds both the 2030 policy and the 8-year HNDL horizon.',
    },
    productionToolCheck:
      'Benchmark contactless APDU exchange times in a terminal simulator and verify acquirer gateway TLS 1.3 `X25519MLKEM768` negotiation.',
  },
  'crypto-dev-apis': {
    moduleId: 'crypto-dev-apis',
    domainTitle: 'High-Level EVP_PKEY_encapsulate & One-Shot EVP_DigestSign API Contract',
    roleDecisionPrompt:
      'Use modern one-shot `EVP_DigestSign`/`EVP_DigestVerify` (`ML-DSA-65` with `NULL` digest) and `EVP_PKEY_encapsulate` APIs, verifying that 1-byte tampered signatures are rejected.',
    artifactLabel: 'Fictional OpenSSL 3.5+ EVP_DigestVerify ML-DSA-65 buffer',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'Calling one-shot `EVP_DigestVerify` with `NULL` pre-hash on the intact 3,309-byte `ML-DSA-65` signature returns `1` (`true`).',
    adverseFailureExplanation:
      'Mutating byte 0 of the signature buffer causes `EVP_DigestVerify` to return `0` (`false`); attempting to pass `ML-DSA-65` to `EVP_PKEY_encapsulate` fails as an invalid operation.',
    recoveryActionExplanation:
      'Pass the unmodified signature buffer to `EVP_DigestVerify` and zeroize private/shared buffers with `OPENSSL_cleanse` before freeing.',
    transferQuestion: {
      prompt:
        'What changes if a developer checks `if (EVP_DigestVerify(...) != 0)` instead of `if (EVP_DigestVerify(...) == 1)` in C/C++ application code?',
      changedAssumptionOutcome:
        'OpenSSL returns negative values (e.g., `-1`) on parameter or allocation errors; checking `!= 0` treats an API error as a valid signature bypass!',
    },
    productionToolCheck:
      'Run unit tests covering positive verification, 1-byte negative tamper rejection (`== 0`), and error return codes (`< 0`) under AddressSanitizer.',
  },
  'platform-eng-pqc': {
    moduleId: 'platform-eng-pqc',
    domainTitle: 'Kubernetes Service-Mesh mTLS (Envoy) & SPIFFE/cert-manager Workload Identity',
    roleDecisionPrompt:
      'Verify that Kubernetes `cert-manager` and service-mesh sidecars validate `ML-DSA-65` workload SVID signatures and reject tampered pod certificates.',
    artifactLabel: 'Fictional SPIFFE/cert-manager ML-DSA-65 workload SVID signature',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The Envoy sidecar verifies the peer pod’s intact `ML-DSA-65` X.509-SVID signature against the cluster trust bundle and establishes mTLS.',
    adverseFailureExplanation:
      'Flipping 1 byte of the workload certificate signature causes Envoy peer verification to fail (`false`), blocking lateral pod-to-pod traffic.',
    recoveryActionExplanation:
      'Trigger `cert-manager` / SPIRE automated SVID rotation to issue a fresh, intact `ML-DSA-65` certificate to the workload.',
    transferQuestion: {
      prompt:
        'What changes if Kubernetes Ingress terminates `X25519MLKEM768`, but east-west pod-to-pod traffic inside a shared multi-tenant cluster remains unencrypted or classical past 2030?',
      changedAssumptionOutcome:
        'East-west packet captures inside the cloud VPC remain exposed to HNDL and breach zero-trust policy milestones until service-mesh mTLS also negotiates hybrid PQC.',
    },
    productionToolCheck:
      'Inspect Envoy `ssl.ciphers` / `ssl.curves` Prometheus metrics and `kubectl describe certificate` status for PQC workload certs in staging.',
  },
  'ot-pqc': {
    moduleId: 'ot-pqc',
    domainTitle:
      'OT / ICS Substation Firmware Authentication (ML-DSA-87) & Real-Time Timing Bounds',
    roleDecisionPrompt:
      'Authenticate PLC/protection-relay firmware updates with `ML-DSA-87` while respecting deterministic `< 3 ms` IEC 61850 GOOSE real-time control-loop boundaries.',
    artifactLabel: 'Fictional substation IED firmware update manifest signature (ML-DSA-87)',
    algorithmVariant: { operation: 'signature', variant: 87 },
    validCaseExplanation:
      'During maintenance-window staging, the IED verifies the intact 4,627-byte `ML-DSA-87` firmware signature before flashing.',
    adverseFailureExplanation:
      'A 1-byte modification in the `ML-DSA-87` signature causes verification to return `false`, preventing malicious firmware from loading onto the PLC/IED.',
    recoveryActionExplanation:
      'Reload the verified golden firmware package from the engineering workstation and keep multi-kilobyte PQC handshakes off the `< 3 ms` GOOSE trip bus via bump-in-the-wire gateways.',
    transferQuestion: {
      prompt:
        'What changes if an OT architect attempts to attach a 4,627-byte `ML-DSA-87` signature directly to every real-time IEC 61850 Type 1A GOOSE trip frame on a 100 Mbps substation LAN?',
      changedAssumptionOutcome:
        'Frame serialization and verification latency risk violating the `< 3 ms` TT6 protection-relay trip window; GOOSE frames require symmetric MACs keyed via out-of-band PQC session establishment.',
    },
    productionToolCheck:
      'Measure OPC UA / IEC 62351 bump-in-the-wire gateway latency on a hardware-in-the-loop (HIL) OT testbed and verify firmware tamper rejection.',
  },
  'healthcare-pqc': {
    moduleId: 'healthcare-pqc',
    domainTitle: '50-Year EHR / Genomic HNDL Protection (ML-KEM-768) & FDA §524B Device Integrity',
    roleDecisionPrompt:
      'Protect HL7 FHIR / DICOMweb clinical data streams against multi-decade HNDL exposure using `ML-KEM-768` and evaluate retention risk against hospital migration schedules.',
    artifactLabel: 'Fictional HL7 FHIR / DICOMweb ML-KEM-768 session key encapsulation',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The FHIR/DICOM gateway decapsulates the intact `ML-KEM-768` ciphertext and confirms the AEAD session key protecting patient health records in transit.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-KEM-768` ciphertext causes implicit rejection and AEAD confirmation failure; delaying EHR key-exchange migration to 2031 creates immediate HNDL exposure.',
    recoveryActionExplanation:
      'Restore the valid `ML-KEM-768` handshake on clinical gateways and deploy PQC TLS proxies in front of legacy imaging modalities.',
    transferQuestion: {
      prompt:
        'What changes if a hospital network signs connected infusion-pump firmware with `ML-DSA-65`, but leaves DICOM genomic transfers on classical ECDH with a 10+ year retention requirement?',
      changedAssumptionOutcome:
        'Device firmware authenticity does not protect patient data confidentiality in transit (primitive mismatch); captured genomic traffic remains exposed to HNDL decryption.',
    },
    productionToolCheck:
      'Scan clinical HL7 FHIR and DICOMweb endpoints for `X25519MLKEM768` support and review medical-device SBOM/CBOM packages for FDA §524B readiness.',
  },
  'aerospace-pqc': {
    moduleId: 'aerospace-pqc',
    domainTitle: 'CCSDS Space Link Key Establishment (ML-KEM-1024) & SEU Fault Resilience',
    roleDecisionPrompt:
      'Validate CNSA 2.0 Category 5 `ML-KEM-1024` satellite telecommand key establishment and detect single-event upset (SEU) bit flips or active tampering over high-RTT space links.',
    artifactLabel: 'Fictional CCSDS SDLS telecommand ML-KEM-1024 encapsulation (1,568 B)',
    algorithmVariant: { operation: 'kem', variant: 1024 },
    validCaseExplanation:
      'The spacecraft crypto unit decapsulates the intact 1,568-byte `ML-KEM-1024` telecommand ciphertext and passes AEAD command confirmation.',
    adverseFailureExplanation:
      'A 1-byte bit flip (from RF jamming or radiation SEU) in the `ML-KEM-1024` ciphertext triggers implicit rejection and fails AEAD confirmation, preventing execution of unauthenticated telecommands.',
    recoveryActionExplanation:
      'Apply CCSDS forward error correction (LDPC/Reed-Solomon) or re-uplink the intact `ML-KEM-1024` frame before arming spacecraft actuators.',
    transferQuestion: {
      prompt:
        'What changes if an orbital platform with a 20-year non-serviceable mission life launches in 2028 with hardcoded RSA-2048 boot verification and no crypto-agile FPGA upload capability?',
      changedAssumptionOutcome:
        'The spacecraft cannot meet the 2030/2031 CNSA 2.0 transition window in orbit, leaving telecommand authentication exposed for the remainder of the mission.',
    },
    productionToolCheck:
      'Simulate CCSDS SDLS `ML-KEM-1024` handshakes over high-BER satellite channel profiles and verify dual-bank FPGA secure-boot signature checks.',
  },
  'automotive-pqc': {
    moduleId: 'automotive-pqc',
    domainTitle: 'UNECE R156 / Uptane OTA ECU Firmware Signing (ML-DSA-65) & ISO 15118-20 V2G',
    roleDecisionPrompt:
      'Verify that automotive Zone/Domain ECUs authenticate Uptane OTA firmware manifests signed with `ML-DSA-65` and reject 1-byte corrupted update packages.',
    artifactLabel: 'Fictional Uptane Director ECU manifest signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The vehicle HSM (EVITA Full / AUTOSAR CSM) verifies the intact `ML-DSA-65` Director manifest signature before staging the ECU flash update.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-DSA-65` signature causes AUTOSAR CSM verification to return `false`, aborting the OTA install and preserving the last known-good ECU bank.',
    recoveryActionExplanation:
      'Re-download the intact Uptane manifest bundle and maintain A/B dual-bank rollback protection across all safety-critical ECUs.',
    transferQuestion: {
      prompt:
        'What changes if a vehicle platform launching in 2028 stays on vehicle roads for 15 years while its V2G Plug & Charge (ISO 15118-20) PKI migration completes in 2031?',
      changedAssumptionOutcome:
        'In-field vehicles exceed the 2030 policy milestone and require OTA root/intermediate certificate provisioning to prevent charging-station authentication failures.',
    },
    productionToolCheck:
      'Benchmark AUTOSAR CSM `ML-DSA-65` verification time on target automotive MCUs and record results in the ISO/SAE 21434 TARA.',
  },
  'exec-quantum-impact': {
    moduleId: 'exec-quantum-impact',
    domainTitle: 'Executive Decision Check: Portal Connections, Retained Records & Signing Scope',
    roleDecisionPrompt:
      'Evaluate enterprise PQC readiness across customer portal connections (`ML-KEM-768`), the records archiving service (protecting long-lived record assets), and software signing (`ML-DSA-65`).',
    artifactLabel: 'Fictional executive portal key-establishment sample (ML-KEM-768)',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'An intact `ML-KEM-768` encapsulation establishes a quantum-safe shared secret confirmed by AEAD decryption, while policy completion by 2030 avoids deadline and HNDL findings.',
    adverseFailureExplanation:
      'Mutating 1 byte of the `ML-KEM-768` ciphertext causes implicit rejection and fails AEAD confirmation; assigning `ML-DSA-65` to portal key establishment or slipping past 2030 triggers policy and scenario-risk findings.',
    recoveryActionExplanation:
      'Restore intact `ML-KEM-768` key establishment, set migration completion to 2030, and keep sample test outputs separate from production evidence checklists.',
    transferQuestion: {
      prompt:
        'What changes when the fictional portal policy is marked out of scope (`applies = false`), yet the archiving service still transfers 10-year retained records over classical key establishment?',
      changedAssumptionOutcome:
        'The policy violation disappears (`out-of-scope`), but the 5-year HNDL `scenario-risk` remains active—teaching executives that legal/policy exemptions do not eliminate cryptographic exposure.',
    },
    productionToolCheck:
      'Require dated CBOM scans, NIST CAVP/CMVP validation numbers, and staging negative-test receipts for customer portals, record-archiving services, and release-signing pipelines.',
  },
  'dev-quantum-impact': {
    moduleId: 'dev-quantum-impact',
    domainTitle: 'Developer Stack Refactoring: Buffer Sizing, KEM vs Sign APIs & CI Gates',
    roleDecisionPrompt:
      'Refactor application code from legacy RSA/ECDSA calls to `ML-DSA-65` signatures and `ML-KEM-768` KEMs, verifying that 1-byte payload mutations are rejected in unit tests.',
    artifactLabel: 'Fictional microservice webhook payload signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The microservice verifies the intact 3,309-byte `ML-DSA-65` webhook signature and processes the event payload.',
    adverseFailureExplanation:
      'Flipping byte 0 of the signature causes verification to return `false`, rejecting the forged or corrupted webhook event.',
    recoveryActionExplanation:
      'Restore the unmodified signature in the test fixture and ensure ORM/database columns use `BYTEA`/`BLOB` or `TEXT` capable of storing full PQC artifacts.',
    transferQuestion: {
      prompt:
        'What changes if a developer replaces `RSA_public_encrypt` session-key wrapping with `ML-DSA-65` instead of `ML-KEM-768`?',
      changedAssumptionOutcome:
        '`ML-DSA-65` is a digital signature scheme and cannot encapsulate or encrypt session keys; the build fails or triggers a primitive mismatch requiring `ML-KEM-768`.',
    },
    productionToolCheck:
      'Add Semgrep/SAST rules flagging classical `RSA`/`EC_KEY` APIs and run integration tests with full-size `ML-DSA-65` and `ML-KEM-768` payloads.',
  },
  'arch-quantum-impact': {
    moduleId: 'arch-quantum-impact',
    domainTitle: 'Target Cryptographic Reference Architecture & Cross-Tier Sizing',
    roleDecisionPrompt:
      'Design a reference architecture pairing `ML-KEM-768` transit encapsulation with `ML-DSA-65` PKI authentication, and verify fail-closed behavior when ciphertexts are altered.',
    artifactLabel: 'Fictional cross-tier service-mesh ML-KEM-768 encapsulation sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The target architecture encapsulates a 1,088-byte `ML-KEM-768` ciphertext across the service boundary and confirms the derived AEAD key.',
    adverseFailureExplanation:
      'A 1-byte mutation in the transit ciphertext causes implicit rejection and AEAD confirmation failure, isolating the corrupted connection.',
    recoveryActionExplanation:
      'Restore the intact `ML-KEM-768` handshake and align PKI, KMS, and gateway tiers so no internal hop falls back to unmonitored classical key exchange.',
    transferQuestion: {
      prompt:
        'What changes if an enterprise architecture upgrades external TLS 1.3 to `X25519MLKEM768` by 2030, but cross-region database replication links remain on classical TLS until 2032?',
      changedAssumptionOutcome:
        'Inter-region replication carries 10-year retained records across provider backbones, creating a 5-year HNDL `scenario-risk` and breaching the 2030 architecture standard.',
    },
    productionToolCheck:
      'Validate your target architecture blueprint with staging PoC benchmarks measuring handshake byte size, p99 latency, and negative-tamper rejection.',
  },
  'ops-quantum-impact': {
    moduleId: 'ops-quantum-impact',
    domainTitle: 'SRE / PKI Operations Game-Day Rollover & Certificate Tamper Triage',
    roleDecisionPrompt:
      'Execute an operational certificate rotation and incident triage drill (`ML-DSA-65`), distinguishing a corrupted signature artifact from a policy or horizon mismatch.',
    artifactLabel: 'Fictional automated CLM rotated certificate signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The newly rotated `ML-DSA-65` leaf certificate verifies against the Issuing CA and passes post-deployment health probes.',
    adverseFailureExplanation:
      'A 1-byte corruption in the deployed certificate signature causes health probes to fail verification (`false`), triggering a SIEM alert and automated rollback.',
    recoveryActionExplanation:
      'Re-deploy the intact `ML-DSA-65` certificate bundle via the CLM pipeline and verify endpoint handshake recovery within target MTTR.',
    transferQuestion: {
      prompt:
        'What changes if an operations team suppresses TLS downgrade alerts during a maintenance window and forgets to re-enable hybrid `X25519MLKEM768` enforcement until 2031?',
      changedAssumptionOutcome:
        'Production endpoints silently serve classical-only key exchange past the 2030 policy deadline, re-exposing long-retention traffic to HNDL.',
    },
    productionToolCheck:
      'Run a staging game-day CA rollover drill and verify that SIEM/Prometheus alerts fire when PQC group negotiation drops or certificate verification fails.',
  },
  'research-quantum-impact': {
    moduleId: 'research-quantum-impact',
    domainTitle: 'Cryptanalytic Margin, CCA Fujisaki-Okamoto Transform & Family Diversity',
    roleDecisionPrompt:
      'Analyze how the Fujisaki-Okamoto (FO) transform in `ML-KEM-1024` enforces IND-CCA2 implicit rejection when a ciphertext byte is perturbed.',
    artifactLabel: 'Fictional Category 5 ML-KEM-1024 FO-transform ciphertext (1,568 B)',
    algorithmVariant: { operation: 'kem', variant: 1024 },
    validCaseExplanation:
      'During `ML-KEM-1024.Decaps`, re-encapsulating the decrypted message `m′` reproduces the exact 1,568-byte input ciphertext `c`, so the real shared secret `K` is returned.',
    adverseFailureExplanation:
      'Flipping byte 0 of `c` causes the FO re-encapsulation check (`c′ != c`) to fail internally; `Decaps` returns `J(z || c)` instead of `K`, causing the AEAD key confirmation to fail without leaking failure timing.',
    recoveryActionExplanation:
      'Restore the original ciphertext `c` so `c′ == c` holds, and maintain cryptographic family diversity (`HQC`, `SLH-DSA`) in long-term research roadmaps.',
    transferQuestion: {
      prompt:
        'What changes if a naive lattice KEM implementation omits the Fujisaki-Okamoto re-encapsulation check (using IND-CPA encryption directly with a static key)?',
      changedAssumptionOutcome:
        'An attacker can submit chosen mutated ciphertexts and observe decryption behavior to recover the static lattice secret key (reaction/key-recovery attack).',
    },
    productionToolCheck:
      'Run `dudect` / TVLA constant-time leakage harnesses on `ML-KEM` decapsulation to verify that the `c′ == c` branch exhibits zero timing variation.',
  },
  'standards-bodies': {
    moduleId: 'standards-bodies',
    domainTitle: 'Normative Standards Traceability (FIPS 203/204/205, IETF RFCs) & OID Pinning',
    roleDecisionPrompt:
      'Verify that deployed artifacts use final published NIST FIPS 204 (`ML-DSA-65`) / RFC 9881 identifiers rather than retired draft codepoints, and reject mutated signatures.',
    artifactLabel: 'Fictional RFC 9881 OID-pinned ML-DSA-65 signed standards manifest',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The standards-compliant `ML-DSA-65` signature (`2.16.840.1.101.3.4.3.18`) verifies cleanly against the final FIPS 204 parameter set.',
    adverseFailureExplanation:
      'Mutating byte 0 of the signature causes FIPS 204 verification to return `false`; mixing pre-standard draft keys (`Kyber-768` / `Dilithium3` round-3) with final FIPS 203/204 fails interoperability.',
    recoveryActionExplanation:
      'Restore the valid FIPS 204 `ML-DSA-65` signature and enforce final NIST/IETF OID registries across all relying parties.',
    transferQuestion: {
      prompt:
        'What changes if a procurement specification mandates "FIPS 206 (FN-DSA) and FIPS 207 (HQC) validated modules" for immediate 2026 production cutover?',
      changedAssumptionOutcome:
        'While FIPS 203, 204, and 205 are published standards, FN-DSA (planned FIPS 206) and HQC (selected March 2025) do not yet have published final FIPS standards or CMVP validations—requiring `ML-KEM`/`ML-DSA`/`SLH-DSA` today.',
    },
    productionToolCheck:
      'Audit internal cryptographic standards documents against current NIST CSRC and IETF Datatracker RFC registries.',
  },
  'ai-security-pqc': {
    moduleId: 'ai-security-pqc',
    domainTitle: 'AI Model Weight Provenance Signing (ML-DSA-65) & RAG Vector Transit Security',
    roleDecisionPrompt:
      'Verify that serialized AI model checkpoints (`.safetensors` / ONNX manifests) signed with `ML-DSA-65` block weight-poisoning tamper attacks prior to GPU inference loading.',
    artifactLabel: 'Fictional AI model checkpoint `.safetensors` manifest signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The MLOps inference loader verifies the intact `ML-DSA-65` signature over the model weight hashes before loading tensors into GPU memory.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-DSA-65` manifest signature causes verification to fail (`false`), quarantining the potentially poisoned model checkpoint.',
    recoveryActionExplanation:
      'Pull the clean, signed model checkpoint from the immutable model registry and protect RAG vector-store queries with `ML-KEM-768` TLS 1.3.',
    transferQuestion: {
      prompt:
        'What changes if an enterprise signs its proprietary LLM weights with `ML-DSA-65`, but transmits 10-year confidential patient/financial RAG prompts over classical TLS until 2031?',
      changedAssumptionOutcome:
        'Model weight signing prevents supply-chain tampering but does not encrypt inference traffic (primitive mismatch); intercepted RAG prompts remain exposed to HNDL decryption.',
    },
    productionToolCheck:
      'Configure your MLOps loader to verify `ML-DSA-65` model manifest signatures pre-load and audit vector-database TLS 1.3 cipher groups.',
  },
  'secrets-management-pqc': {
    moduleId: 'secrets-management-pqc',
    domainTitle: 'Vault / Secrets Manager PQC Envelope (ML-KEM-768) & Transit Engine Integrity',
    roleDecisionPrompt:
      'Validate how a secrets manager encapsulates dynamic secret leases under `ML-KEM-768` + `AES-256-GCM` and rejects tampered envelope ciphertexts.',
    artifactLabel: 'Fictional secrets-manager ML-KEM-768 wrapped lease & AEAD confirmation',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Decapsulating the intact `ML-KEM-768` envelope recovers the shared secret and passes `AES-256-GCM` authenticated decryption of the secret lease.',
    adverseFailureExplanation:
      'Mutating byte 0 of the `ML-KEM-768` ciphertext triggers implicit rejection, deriving an unrelated key that causes `AES-256-GCM` decryption of the secret envelope to throw and reject.',
    recoveryActionExplanation:
      'Restore the original untampered envelope ciphertext (or issue a fresh dynamic secret lease) and verify PKCS#11 HSM auto-unseal integrity.',
    transferQuestion: {
      prompt:
        'What changes if a secrets manager rotates application database passwords every 24 hours, but its inter-cluster replication link uses classical TLS while replicating long-lived root CA private keys?',
      changedAssumptionOutcome:
        'Short-lived dynamic passwords have a 1-day retention window, but replicated long-lived root keys carry a 10+ year lifetime—triggering an immediate HNDL `scenario-risk` on the replication link.',
    },
    productionToolCheck:
      'Test Vault/OpenBao transit PQC signing, PKCS#11 HSM seal status, and cluster mTLS (`X25519MLKEM768`) in staging.',
  },
  'network-security-pqc': {
    moduleId: 'network-security-pqc',
    domainTitle: 'NGFW Hybrid TLS 1.3 Inspection, ZTNA & MACsec EAP-TLS PQC Key Exchange',
    roleDecisionPrompt:
      'Ensure Next-Generation Firewalls (NGFW) and ZTNA gateways accurately negotiate `ML-KEM-768` key establishment without dropping multi-packet handshakes or accepting corrupted shares.',
    artifactLabel: 'Fictional NGFW/ZTNA TLS 1.3 ML-KEM-768 key-share inspection sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The NGFW/ZTNA terminator decapsulates the intact 1,088-byte `ML-KEM-768` share and confirms the session via the TLS 1.3 `Finished` MAC.',
    adverseFailureExplanation:
      'A 1-byte corruption in the `ML-KEM-768` ciphertext causes implicit rejection and fails `Finished` confirmation, dropping the malformed session cleanly.',
    recoveryActionExplanation:
      'Restore intact packet delivery across firewall interfaces and update DPI signature engines to recognize RFC 8879 compressed PQC certificates.',
    transferQuestion: {
      prompt:
        'What changes if an NGFW TLS decryption policy forces inbound `X25519MLKEM768` clients to downgrade to classical `X25519` so legacy DPI blades can inspect traffic?',
      changedAssumptionOutcome:
        'The firewall strips post-quantum protection from every external session, re-introducing HNDL exposure and violating the 2030 network security policy.',
    },
    productionToolCheck:
      'Pass `X25519MLKEM768` TLS 1.3 and RFC 9370 IKEv2 traffic through staging NGFW/IDS appliances and inspect pcap captures on both sides of the firewall.',
  },
  'database-encryption-pqc': {
    moduleId: 'database-encryption-pqc',
    domainTitle: 'Database TDE / CSFLE Master Key Wrapping (ML-KEM-768) & Wire TLS 1.3',
    roleDecisionPrompt:
      'Verify how Transparent Data Encryption (TDE) and Client-Side Field-Level Encryption (CSFLE) wrap Master Encryption Keys (MEKs) with `ML-KEM-768` and reject corrupted key blobs.',
    artifactLabel: 'Fictional TDE/CSFLE ML-KEM-768 wrapped master key blob',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The external KMS/HSM decapsulates the intact `ML-KEM-768` key blob and unwraps the `AES-256-GCM` database MEK for online tablespace access.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-KEM-768` wrapped key blob causes implicit rejection and fails MEK AEAD authentication, preventing database mount with a corrupted key.',
    recoveryActionExplanation:
      'Restore the intact wrapped MEK header from backup metadata and verify client-to-database wire TLS 1.3 (`X25519MLKEM768`).',
    transferQuestion: {
      prompt:
        'What changes if a database encrypts tablespaces at rest with `AES-256-XTS`, but replicates 10-year retained rows over classical TLS connections until 2031?',
      changedAssumptionOutcome:
        'AES-256 at rest is quantum-resilient against Grover, but classical TLS replication in transit exposes the same 10-year records to HNDL capture (`scenario-risk` + 2030 policy violation).',
    },
    productionToolCheck:
      'Execute a staging TDE master-key rotation backed by an `ML-KEM` KMS key and inspect database TLS key-exchange telemetry.',
  },
  'iam-pqc': {
    moduleId: 'iam-pqc',
    domainTitle: 'Enterprise IdP (OIDC / SAML 2.0 / PIV) Assertion Signing with ML-DSA-65',
    roleDecisionPrompt:
      'Validate that workforce Identity Providers (IdPs) and Relying Parties verify `ML-DSA-65` signed OIDC/SAML assertions and block 1-byte modified authentication tokens.',
    artifactLabel: 'Fictional OIDC / SAML 2.0 IdP assertion signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The Relying Party verifies the intact 3,309-byte `ML-DSA-65` assertion signature against the IdP’s published federation metadata key.',
    adverseFailureExplanation:
      'Mutating 1 byte of the assertion signature causes `ML-DSA-65` verification to return `false`, denying federated single sign-on (SSO) access.',
    recoveryActionExplanation:
      'Request a fresh, unmodified assertion from the IdP over a hybrid PQC TLS 1.3 channel.',
    transferQuestion: {
      prompt:
        'What changes if an IAM team configures `ML-KEM-768` instead of `ML-DSA-65` as the SAML assertion signing algorithm in federation metadata?',
      changedAssumptionOutcome:
        'SAML assertions require non-repudiable digital signatures verified by multiple relying parties; `ML-KEM-768` is a key-encapsulation mechanism and triggers an immediate primitive mismatch.',
    },
    productionToolCheck:
      'Test staging OIDC/SAML login flows with `ML-DSA-65` tokens across browser redirect bindings and reverse proxies.',
  },
  'secure-boot-pqc': {
    moduleId: 'secure-boot-pqc',
    domainTitle: 'Silicon Root-of-Trust / UEFI Secure Boot Verification (ML-DSA-87 / CNSA 2.0)',
    roleDecisionPrompt:
      'Confirm that Boot ROM / UEFI Secure Boot verifies Category 5 `ML-DSA-87` stage-1 bootloader signatures against OTP fuse hashes and halts on a 1-byte modification.',
    artifactLabel: 'Fictional stage-1 bootloader image signature (ML-DSA-87, 4,627 B)',
    algorithmVariant: { operation: 'signature', variant: 87 },
    validCaseExplanation:
      'The immutable Boot ROM verifies the intact 4,627-byte `ML-DSA-87` signature against the OTP-fused root public key hash and transfers execution to the bootloader.',
    adverseFailureExplanation:
      'Flipping byte 0 of the `ML-DSA-87` bootloader signature causes verification to return `false`, triggering an immediate hardware boot halt / recovery ROM fallback.',
    recoveryActionExplanation:
      'Fail over to the golden recovery flash bank with an intact `ML-DSA-87` signature and enforce monotonic anti-rollback fuse counters (`SVN`).',
    transferQuestion: {
      prompt:
        'What changes if a server motherboard verifies `ML-DSA-87` bootloader signatures in Boot ROM, but does not increment the hardware anti-rollback Security Version Number (`SVN`) fuse when revoking a vulnerable classical-signed bootloader?',
      changedAssumptionOutcome:
        'An attacker with local flash access can re-flash the old classical-signed bootloader (downgrade attack) and bypass the PQC chain of trust.',
    },
    productionToolCheck:
      'Test UART secure-boot verification on target hardware with both a valid PQC-signed image and a 1-byte flipped signature/image.',
  },
  'os-pqc': {
    moduleId: 'os-pqc',
    domainTitle: 'OS Crypto-Policies (`DEFAULT:TEST-PQ`), OpenSSL Providers & Package Signing',
    roleDecisionPrompt:
      'Verify that OS-wide cryptographic policies enable `ML-DSA-65` package verification and `ML-KEM-768` daemon handshakes while rejecting corrupted RPM/DEB signatures.',
    artifactLabel: 'Fictional OS repository package header signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The OS package manager verifies the intact `ML-DSA-65` repository signature via the system OpenSSL 3.5+ provider before installing system updates.',
    adverseFailureExplanation:
      'Flipping 1 byte of the package signature causes `ML-DSA-65` verification to fail (`false`), aborting package installation.',
    recoveryActionExplanation:
      'Refresh repository metadata from a trusted mirror and re-verify the intact package signature.',
    transferQuestion: {
      prompt:
        'What changes if a Linux host enables `update-crypto-policies --set DEFAULT:TEST-PQ`, but containerized workloads on the same host bundle statically linked OpenSSL 1.1.1 inside their container images?',
      changedAssumptionOutcome:
        'Host OS crypto-policies do not apply to statically linked legacy libraries inside containers; those workloads remain stuck on classical crypto until base images are rebuilt.',
    },
    productionToolCheck:
      'Run `update-crypto-policies --show` and `openssl list -providers` in staging VMs and container base images.',
  },
  'slh-dsa': {
    moduleId: 'slh-dsa',
    domainTitle: 'FIPS 205 SLH-DSA (-s vs -f) Profile Selection & High-Assurance Signature Check',
    roleDecisionPrompt:
      'Compare stateless hash-based `SLH-DSA` parameter sets (RFC 9909) with Category 5 `ML-DSA-87` for root CA and firmware signing, and verify 1-byte tamper rejection.',
    artifactLabel: 'Fictional root CA / firmware high-assurance signature sample (ML-DSA-87)',
    algorithmVariant: { operation: 'signature', variant: 87 },
    validCaseExplanation:
      'The high-assurance signature verifies deterministically against the public key without requiring mutable one-time signature state counters.',
    adverseFailureExplanation:
      'Flipping byte 0 of the signature invalidates verification (`false`), preventing acceptance of a corrupted root or firmware certificate.',
    recoveryActionExplanation:
      'Restore the intact signature artifact and choose `SLH-DSA-128s` (7,856 B, smaller wire size) vs `SLH-DSA-128f` (17,088 B, faster signing) or `ML-DSA-87` (4,627 B) based on latency and assumption requirements.',
    transferQuestion: {
      prompt:
        'What changes if a root CA ceremony requires security relying solely on hash-function properties (SHA-256 / SHAKE256) rather than structured lattice assumptions?',
      changedAssumptionOutcome:
        'The architect selects NIST FIPS 205 `SLH-DSA` (stateless hash-based) instead of lattice-based `ML-DSA-87`, trading a larger signature (7,856–49,856 B) for hash-only security assumptions.',
    },
    productionToolCheck:
      'Benchmark `SLH-DSA-SHA2-128s`, `SLH-DSA-SHA2-128f`, and `ML-DSA-87` signing/verification times and byte sizes in OpenSSL 3.5+ or your target HSM.',
  },
  'crypto-mgmt-modernization': {
    moduleId: 'crypto-mgmt-modernization',
    domainTitle: 'Unified Cryptographic Management Plane & Shadow-Endpoint Reconciliation',
    roleDecisionPrompt:
      'Reconcile external network TLS discovery scans against CLM/KMS inventories and verify `ML-KEM-768` remediation on previously unmanaged endpoints.',
    artifactLabel: 'Fictional remediated endpoint ML-KEM-768 key-establishment verification',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Once onboarded to automated CLM/KMS management, the endpoint negotiates `ML-KEM-768` and passes AEAD key confirmation.',
    adverseFailureExplanation:
      'A 1-byte mutation in the `ML-KEM-768` ciphertext causes implicit rejection and AEAD failure; unmanaged shadow endpoints completing migration in 2031 breach the 2030 policy.',
    recoveryActionExplanation:
      'Restore intact `ML-KEM-768` configuration and onboard shadow endpoints into the central CLM/KMS plane before the 2030 deadline.',
    transferQuestion: {
      prompt:
        'What changes if an enterprise’s CLM dashboard reports "100% PQC compliance" based on managed certificates, while external discovery scans find 40 unmanaged legacy load balancers serving 10-year customer data?',
      changedAssumptionOutcome:
        'Inventory blind spots hide active HNDL `scenario-risk` and policy violations; estate coverage must be measured against external network discovery and CBOM scans, not just managed CLM records.',
    },
    productionToolCheck:
      'Run a quarterly reconciliation comparing external TLS scan inventories against your CLM and cloud KMS registries.',
  },
  'pki-enrollment-protocols': {
    moduleId: 'pki-enrollment-protocols',
    domainTitle: 'CMPv3 (RFC 9810) encrCert Proof-of-Possession & KemOtherInfo Confirmation',
    roleDecisionPrompt:
      'Verify how a CA validates `ML-KEM-768` certificate enrollment via CMPv3 `POPOPrivKey` `encrCert` (encrypted certificate return + `certConf` confirmation) versus `ML-DSA-65` CSR signatures.',
    artifactLabel: 'Fictional CMPv3 encrCert ML-KEM-768 certificate-encryption & certConf sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The CA encapsulates a content-encryption key to the applicant’s `ML-KEM-768` public key; the applicant decapsulates the intact ciphertext, decrypts the new certificate, and proves possession via `certConf`.',
    adverseFailureExplanation:
      'If 1 byte of the `ML-KEM-768` ciphertext is corrupted (or if the applicant lacks the matching private key), decapsulation produces a mismatched secret via implicit rejection, so certificate decryption and `certConf` verification fail.',
    recoveryActionExplanation:
      'Restore the intact CMPv3 `ip`/`kup` message so the applicant decapsulates the authentic key and returns a valid `certConf` hash.',
    transferQuestion: {
      prompt:
        'What changes if a PKI engineer tries to enroll an `ML-KEM-768` certificate using a standard PKCS#10 CSR with a PKCS#9 `challengePassword` over EST/SCEP?',
      changedAssumptionOutcome:
        '`ML-KEM-768` cannot sign a PKCS#10 CSR, and `challengePassword` only authenticates the enrollment request—it does NOT prove possession of the `ML-KEM` private key; CMPv3 `encrCert` or CRMF `POPOPrivKey` is required.',
    },
    productionToolCheck:
      'Test CMPv3 `ir`/`kur` with `encrCert` POP for `ML-KEM-768` and EST/ACME CSR enrollment for `ML-DSA-65` against a staging CA (e.g., EJBCA 9.1+).',
  },
  'mls-group-messaging': {
    moduleId: 'mls-group-messaging',
    domainTitle: 'RFC 9420 MLS TreeKEM Post-Quantum Epoch Ratchet (ML-KEM-768)',
    roleDecisionPrompt:
      'Evaluate how Messaging Layer Security (MLS) TreeKEM epoch `Commit` messages encapsulate path secrets with `ML-KEM-768` for forward secrecy and post-compromise security.',
    artifactLabel: 'Fictional MLS TreeKEM UpdatePathNode ML-KEM-768 ciphertext',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'Group members decapsulate the intact `ML-KEM-768` `UpdatePath` ciphertext to derive the new epoch `commit_secret` and verify the ` confirmation_tag`.',
    adverseFailureExplanation:
      'Mutating 1 byte of the `ML-KEM-768` `UpdatePath` ciphertext causes implicit rejection, deriving a divergent epoch secret that fails the MLS `confirmation_tag` check.',
    recoveryActionExplanation:
      'Reject the corrupted `Commit` frame and process the authentic MLS epoch update signed with the sender’s `ML-DSA-65` `LeafNode` credential.',
    transferQuestion: {
      prompt:
        'What changes if an enterprise messaging app uses `ML-DSA-65` to sign user `KeyPackages`, but keeps TreeKEM epoch ratchets on classical `X25519` for 10-year archived compliance chats?',
      changedAssumptionOutcome:
        'Identity signatures prevent impersonation today, but recorded `X25519` TreeKEM ratchets remain vulnerable to HNDL decryption (`scenario-risk` + primitive mismatch for confidentiality).',
    },
    productionToolCheck:
      'Simulate multi-member MLS group `Commit` and epoch key-update flows with hybrid PQ cipher suites (`draft-ietf-mls-pq-ciphersuites`) in staging.',
  },
  'pqc-candidates': {
    moduleId: 'pqc-candidates',
    domainTitle: 'NIST Round 4 / Alternate Candidates (HQC, FN-DSA, FrodoKEM) Lifecycle Gating',
    roleDecisionPrompt:
      'Compare alternate PQC candidates (`HQC` code-based KEM, `FN-DSA` / Falcon, `FrodoKEM`) against standardized `ML-KEM-768` and enforce production lifecycle gates.',
    artifactLabel: 'Fictional standardized baseline ML-KEM-768 encapsulation vs candidate gate',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The production-approved `ML-KEM-768` baseline encapsulates and confirms the shared secret while non-standardized candidates remain gated in research sandboxes.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-KEM-768` ciphertext triggers implicit rejection and fails AEAD confirmation; deploying retired/unstandardized candidates in production fails policy compliance.',
    recoveryActionExplanation:
      'Restore the valid `ML-KEM-768` encapsulation and keep provider architectures modular so future FIPS 206 (`FN-DSA`) and `HQC` standards can be enabled once published.',
    transferQuestion: {
      prompt:
        'What changes if an application team deploys an unselected Round 4 algorithm (`BIKE` or `SIKE`) in a production service scheduled for 2030 compliance?',
      changedAssumptionOutcome:
        '`SIKE` is broken by classical cryptanalysis and `BIKE` was not selected by NIST (which selected `HQC` in March 2025); the deployment fails cryptographic policy and must migrate to `ML-KEM-768`.',
    },
    productionToolCheck:
      'Verify that production OpenSSL/JCA provider policies block experimental/unstandardized algorithms while staging sandboxes benchmark approved candidates.',
  },
  'verification-closure': {
    moduleId: 'verification-closure',
    domainTitle: 'Five-Point Migration Closure Dossier & Negative Tamper Verification',
    roleDecisionPrompt:
      'Audit a system’s migration closure dossier across all 5 verification points—including live negative tamper rejection (`ML-DSA-65`)—before decommissioning legacy controls.',
    artifactLabel: 'Fictional 5-point closure dossier ML-DSA-65 negative-control receipt',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The closure audit confirms the positive control (`baselineValid: true`) before executing the mandatory negative tamper check.',
    adverseFailureExplanation:
      'Flipping byte 0 of the `ML-DSA-65` signature produces `alteredAccepted: false`, providing reproducible negative-test evidence that the verifier fails closed.',
    recoveryActionExplanation:
      'Verify `restoredValid: true` on the restored artifact and archive the signed 5-point verification dossier alongside continuous drift monitoring.',
    transferQuestion: {
      prompt:
        'What changes if a project team marks a migration wave "Closed" based solely on a written architecture note without executing a negative tamper test or verifying policy scope?',
      changedAssumptionOutcome:
        'Reference notes do not prove deployed enforcement; closure must be withheld until all 5 technical verification receipts and policy/horizon checks pass.',
    },
    productionToolCheck:
      'Re-run the linked pcap inspection, 1-byte negative tamper test, and `openssl verify` chain check before signing off on migration closure.',
  },
  'media-drm-pqc': {
    moduleId: 'media-drm-pqc',
    domainTitle: 'C2PA Content Provenance Manifest Signing (ML-DSA-65) & DRM License Delivery',
    roleDecisionPrompt:
      'Verify that C2PA media provenance manifests (`COSE_Sign1`) signed with `ML-DSA-65` detect 1-byte tampering and that DRM license servers protect key delivery.',
    artifactLabel: 'Fictional C2PA media asset manifest COSE_Sign1 signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The media player / provenance verifier validates the intact `ML-DSA-65` C2PA manifest signature and displays valid content credentials.',
    adverseFailureExplanation:
      'Mutating 1 byte of the `ML-DSA-65` signature causes C2PA manifest validation to return `false`, flagging the media asset as tampered/unverified.',
    recoveryActionExplanation:
      'Restore the original signed C2PA manifest and secure Widevine/FairPlay/PlayReady license acquisition over `X25519MLKEM768` TLS 1.3.',
    transferQuestion: {
      prompt:
        'What changes if a studio signs C2PA provenance manifests with `ML-DSA-65`, but distributes pre-release master content keys over classical TLS with a 10-year exclusivity value?',
      changedAssumptionOutcome:
        'C2PA signatures prove origin authenticity but do not encrypt content keys (primitive mismatch); DRM key exchange requires `ML-KEM-768` to prevent HNDL capture.',
    },
    productionToolCheck:
      'Test C2PA manifest validation and inspect DRM license-server TLS 1.3 key-exchange groups in staging.',
  },
  cbom: {
    moduleId: 'cbom',
    domainTitle: 'CycloneDX 1.6 CBOM Attestation Signing (ML-DSA-65) & Runtime Reconciliation',
    roleDecisionPrompt:
      'Validate the integrity of a CycloneDX v1.6 Cryptographic Bill of Materials (`cryptoProperties`) signed with `ML-DSA-65` and reconcile static findings against runtime policy.',
    artifactLabel: 'Fictional CycloneDX 1.6 CBOM JSON attestation signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The CI/CD governance gate verifies the intact `ML-DSA-65` signature over the CycloneDX 1.6 CBOM before ingesting its `algorithm` and `protocol` inventory.',
    adverseFailureExplanation:
      'Flipping 1 byte of the CBOM signature causes verification to fail (`false`), preventing ingestion of a tampered cryptographic inventory.',
    recoveryActionExplanation:
      'Re-generate and sign the CBOM in the isolated CI runner and flag any discovered classical key-exchange assets exceeding the 2030 policy deadline.',
    transferQuestion: {
      prompt:
        'What changes if a static source-code CBOM scanner reports `ML-KEM-768` in application libraries, while runtime TLS configuration still negotiates classical `X25519` until 2031?',
      changedAssumptionOutcome:
        'Library presence does not equal active runtime enforcement; the runtime endpoint still triggers a 2030 policy violation and 5-year HNDL `scenario-risk`.',
    },
    productionToolCheck:
      'Validate CycloneDX 1.6 CBOM JSON files against the official schema, verify `ML-DSA-65` provenance signatures, and reconcile with live TLS telemetry.',
  },
  sbom: {
    moduleId: 'sbom',
    domainTitle:
      'SPDX 3.0 / CycloneDX 1.6 SBOM Signing (ML-DSA-65) & Transitive Crypto Dependency Audit',
    roleDecisionPrompt:
      'Verify `ML-DSA-65` signatures over container SBOM artifacts and identify transitive End-of-Life (EoL) cryptographic libraries blocking PQC migration.',
    artifactLabel: 'Fictional container SPDX/CycloneDX SBOM Cosign signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The admission controller verifies the intact `ML-DSA-65` signature on the SBOM and confirms all transitive `purl` dependencies support OpenSSL 3.5+ / PQC.',
    adverseFailureExplanation:
      'Mutating 1 byte of the SBOM signature causes verification to return `false`, blocking deployment of the unverified container image.',
    recoveryActionExplanation:
      'Restore the authentic signed SBOM from the build pipeline and upgrade transitive EoL libraries (e.g., OpenSSL 1.1.1 -> OpenSSL 3.5+) before the 2030 milestone.',
    transferQuestion: {
      prompt:
        'What changes if an application’s top-level `package.json`/`go.mod` appears up to date, but the SBOM reveals a transitive C-extension bundling an EoL classical TLS library until 2031?',
      changedAssumptionOutcome:
        'The transitive dependency prevents PQC key establishment on that outbound connection, causing both a 2030 policy violation and HNDL exposure on long-lived data.',
    },
    productionToolCheck:
      'Generate signed SBOMs in CI, resolve all cryptographic `purl` entries against your approved version registry, and test admission rejection on tampered SBOMs.',
  },
  'crypto-registry': {
    moduleId: 'crypto-registry',
    domainTitle: 'Enterprise Cryptographic Registry OID Governance & Snapshot Integrity',
    roleDecisionPrompt:
      'Maintain an authoritative Enterprise Cryptographic Registry mapping OIDs (`ML-KEM-768`, `ML-DSA-65`) to owning business services and verify signed registry snapshots.',
    artifactLabel: 'Fictional Enterprise Cryptographic Registry snapshot signature (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'Downstream deployment gates verify the intact `ML-DSA-65` signature on the registry snapshot before enforcing `Approved` vs `Deprecated` OID rules.',
    adverseFailureExplanation:
      'Flipping 1 byte of the registry snapshot signature invalidates verification (`false`), preventing unauthorized tampering with approved algorithm lists.',
    recoveryActionExplanation:
      'Restore the last verified registry snapshot from version control and remediate services bound to deprecated classical OIDs ahead of 2030.',
    transferQuestion: {
      prompt:
        'What changes if a registry entry lists `ML-DSA-65` as the approved algorithm for a service whose actual operation is bulk session key establishment?',
      changedAssumptionOutcome:
        'The registry evaluator flags an immediate primitive-to-operation mismatch (`ML-DSA-65` does not supply key establishment) before the rule reaches production.',
    },
    productionToolCheck:
      'Sync your cryptographic registry with CBOM/CLM feeds and test CI gate rejection when a service references a `Deprecated` or mismatched OID.',
  },
  'government-defense-pqc': {
    moduleId: 'government-defense-pqc',
    domainTitle: 'NSA CNSA 2.0 Category 5 Enforcement (ML-KEM-1024 / ML-DSA-87) & NSS Scope',
    roleDecisionPrompt:
      'Enforce NSA CNSA 2.0 Category 5 parameters (`ML-KEM-1024` for key establishment, `ML-DSA-87` for signatures) on National Security Systems and verify fail-closed tamper rejection.',
    artifactLabel: 'Fictional CNSA 2.0 Category 5 ML-KEM-1024 NSS key-establishment sample',
    algorithmVariant: { operation: 'kem', variant: 1024 },
    validCaseExplanation:
      'The NSS endpoint encapsulates a 1,568-byte `ML-KEM-1024` ciphertext, derives the shared secret, and passes AEAD key confirmation under CNSA 2.0 rules.',
    adverseFailureExplanation:
      'Mutating 1 byte of the `ML-KEM-1024` ciphertext triggers FIPS 203 implicit rejection and fails AEAD confirmation; slipping completion to 2031 breaches the 2030 phase-out milestone.',
    recoveryActionExplanation:
      'Restore the valid `ML-KEM-1024` encapsulation and complete NSS wave cutover by the 2030 CNSA 2.0 phase-out deadline.',
    transferQuestion: {
      prompt:
        'What changes if a contractor system is classified as non-NSS (`applies = false` for a specific NSS directive), yet handles 10-year sensitive defense logistics data over classical key exchange?',
      changedAssumptionOutcome:
        'Even if a specific directive clause is marked out of scope,OMB M-23-02 / NIST IR 8547 expectations and the 5-year HNDL `scenario-risk` still require pre-horizon migration.',
    },
    productionToolCheck:
      'Verify NSS staging endpoints reject Category 1/3 parameters where CNSA 2.0 mandates Category 5 (`ML-KEM-1024` / `ML-DSA-87`) and check CMVP module certificates.',
  },
  'trust-services-pqc': {
    moduleId: 'trust-services-pqc',
    domainTitle:
      'ETSI Qualified Trust Services (QTSP) & Long-Term Archive Timestamping (ML-DSA-87)',
    roleDecisionPrompt:
      'Validate ETSI EN 319 411/421 QTSP archival timestamps (`PAdES-LTA` / `CAdES-A`) signed with `ML-DSA-87` to preserve long-term legal non-repudiation.',
    artifactLabel: 'Fictional QTSP RFC 3161 / CAdES-A archive timestamp signature (ML-DSA-87)',
    algorithmVariant: { operation: 'signature', variant: 87 },
    validCaseExplanation:
      'The Long-Term Validation (LTV) verifier confirms the intact 4,627-byte `ML-DSA-87` archive timestamp signature over the historical document and validation material.',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-DSA-87` archive timestamp signature causes LTV verification to return `false`, invalidating the archival proof of existence.',
    recoveryActionExplanation:
      'Retrieve the redundant intact RFC 4998 / RFC 6283 Evidence Record Syntax (ERS) timestamp chain from the QTSP archive.',
    transferQuestion: {
      prompt:
        'What changes if a 30-year notarized contract was originally signed with RSA-2048 in 2024 and is NOT re-timestamped with a post-quantum QTSP archive timestamp before 2030?',
      changedAssumptionOutcome:
        'Once RSA-2048 is deprecated or broken, an attacker can backdate forged alterations to the contract; applying an `ML-DSA-87` archive timestamp before classical deprecation locks in prior integrity.',
    },
    productionToolCheck:
      'Generate a staging `PAdES-LTA` / `CAdES-A` signature with a PQC archive timestamp and test LTV validation after revoking/expiring the inner classical cert.',
  },
  'pqc-grc': {
    moduleId: 'pqc-grc',
    domainTitle: 'ISO 27001 A.8.24 / NIST CSF 2.0 / SP 800-53 SC-13 Control Effectiveness Testing',
    roleDecisionPrompt:
      'Distinguish written policy statements from executable control evidence by running `ML-DSA-65` negative-control tests and scoped policy evaluations.',
    artifactLabel:
      'Fictional SP 800-53 SC-13 / ISO 27001 A.8.24 negative-control sample (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The GRC control test records both a passing baseline (`baselineValid: true`) and a compliant policy configuration (`No contradiction`).',
    adverseFailureExplanation:
      'Flipping 1 byte of the `ML-DSA-65` signature proves the negative control rejects tampered artifacts (`alteredAccepted: false`), while a 2031 completion date flags a policy finding.',
    recoveryActionExplanation:
      'Restore the valid artifact (`restoredValid: true`), remediate the schedule to 2030, and attach the test receipt to the internal audit workpaper.',
    transferQuestion: {
      prompt:
        'What changes if an internal audit accepts a PDF policy document as "effective control evidence" for `SC-13` without testing whether endpoints actually reject classical or tampered inputs?',
      changedAssumptionOutcome:
        'A policy document only demonstrates control design intent, not operating effectiveness; live endpoint configuration exports and negative-test receipts are required.',
    },
    productionToolCheck:
      'Sample 10 production endpoints mapped to `SC-13` / `A.8.24` and verify live hybrid PQC negotiation and negative-control test logs.',
  },
  'soc-implementation-pqc': {
    moduleId: 'soc-implementation-pqc',
    domainTitle: 'SOC Zeek / Suricata PQC Telemetry (`0x11EC`) & Downgrade Anomaly Detection',
    roleDecisionPrompt:
      'Configure SOC network sensors and SIEM rules to detect `X25519MLKEM768` (`0x11EC`) handshakes, classical downgrade anomalies, and `ML-KEM-768` confirmation failures.',
    artifactLabel: 'Fictional SOC Zeek/SIEM monitored ML-KEM-768 session confirmation sample',
    algorithmVariant: { operation: 'kem', variant: 768 },
    validCaseExplanation:
      'The monitored session negotiates `ML-KEM-768`, derives matching secrets, passes AEAD confirmation, and logs `curve: X25519MLKEM768` in Zeek `ssl.log`.',
    adverseFailureExplanation:
      'When an active attacker or fault mutates byte 0 of the `ML-KEM-768` ciphertext, implicit rejection triggers an AEAD `bad_record_mac` alert that the SOC correlates as a handshake integrity anomaly.',
    recoveryActionExplanation:
      'Block the offending source or fix the faulty middlebox, restore clean `X25519MLKEM768` negotiation, and verify SIEM downgrade alert rules.',
    transferQuestion: {
      prompt:
        'What changes if SOC Zeek sensors are running an outdated parser that logs `unknown_group` for codepoint `0x11EC` and drops the field from SIEM ingestion?',
      changedAssumptionOutcome:
        'The SOC loses visibility into which segments have migrated to PQC versus which silently downgraded to classical ECDH during an incident.',
    },
    productionToolCheck:
      'Replay synthetic `X25519MLKEM768` and classical-downgrade pcaps through staging Zeek/Suricata sensors and verify SIEM alert firing.',
  },
  'skills-team-structure': {
    moduleId: 'skills-team-structure',
    domainTitle:
      'NICE Workforce Framework (SP 800-181r1) PQC Center of Excellence Lab Verification',
    roleDecisionPrompt:
      'Assess cross-functional engineering and GRC readiness through practical `ML-DSA-65` tamper diagnosis and policy-scope evaluation rather than slide-only completion.',
    artifactLabel: 'Fictional PQC CoE practitioner lab verification artifact (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The practitioner verifies the positive `ML-DSA-65` control and aligns role responsibilities across Architecture, DevSecOps, PKI Ops, and GRC.',
    adverseFailureExplanation:
      'Injecting a 1-byte signature mutation (`alteredAccepted: false`) or a primitive/policy mismatch tests whether the team can diagnose root causes accurately.',
    recoveryActionExplanation:
      'Restore the valid signature artifact and remediate the policy/primitive configuration to demonstrate operational competency.',
    transferQuestion: {
      prompt:
        'What changes if a PQC Center of Excellence trains only central cryptographers, without equipping application developers and SREs to handle 3–5 KB PQC artifacts andMTU fragmentation?',
      changedAssumptionOutcome:
        'Central standards stall at the deployment phase because product and SRE teams lack the practical debugging skills to resolve buffer and handshake failures.',
    },
    productionToolCheck:
      'Require role-specific staging lab sign-offs (TLS pcap analysis, HSM key rotation, CI negative testing) in your NICE-aligned competency matrix.',
  },
  quiz: {
    moduleId: 'quiz',
    domainTitle:
      'Cross-Domain PQC Practitioner Verification Oracle (FIPS 203 / 204 / Policy Scope)',
    roleDecisionPrompt:
      'Synthesize primitive selection (`ML-DSA-65` vs `ML-KEM-768`), 1-byte tamper/implicit-rejection mechanics, and Mosca horizon / policy-scope rules across all Hub domains.',
    artifactLabel: 'Fictional cross-domain capstone verification artifact (ML-DSA-65)',
    algorithmVariant: { operation: 'signature', variant: 65 },
    validCaseExplanation:
      'The capstone control verifies an intact `ML-DSA-65` signature (`baselineValid: true`) and evaluates a compliant `ML-KEM-768` 2030 transition scenario (`No contradiction`).',
    adverseFailureExplanation:
      'A 1-byte mutation in the `ML-DSA-65` signature is rejected (`alteredAccepted: false`), and mismatched primitives or post-2030 schedules produce explicit policy and scenario-risk findings.',
    recoveryActionExplanation:
      'Restore the original signature (`restoredValid: true`) and align algorithm selection, completion year, and retention horizon before moving to production staging.',
    transferQuestion: {
      prompt:
        'What changes when you move from passing this browser-based Hub assessment to signing off on a live production system?',
      changedAssumptionOutcome:
        'Hub exercises establish decision criteria using fictional samples; production sign-off requires executing these positive, negative, and scope checks directly inside your own OpenSSL, PKI, KMS/HSM, and CI/CD tools.',
    },
    productionToolCheck:
      'Pair your quiz results with the module-specific production-tool evaluation checklists across your deployed cryptographic estate.',
  },
}

export const ALL_DECISION_SCENARIO_MODULE_IDS: string[] = Object.keys(MODULE_DECISION_SCENARIOS)

export function getModuleDecisionScenario(moduleId: string): ModuleDecisionScenario | undefined {
  return MODULE_DECISION_SCENARIOS[moduleId]
}

/**
 * Evaluates the scoped policy/horizon engine for a module decision scenario,
 * supporting baseline compliant, adverse violating, and transfer (changed-assumption) runs.
 */
export function evaluatePolicyScope(
  moduleId: string,
  mode: 'compliant' | 'adverse' | 'transfer' = 'compliant'
) {
  const scenario = MODULE_DECISION_SCENARIOS[moduleId]
  if (!scenario) {
    throw new Error(`Unknown moduleId for evaluatePolicyScope: ${moduleId}`)
  }
  const baseInputs: SamplePolicyInputs =
    mode === 'compliant'
      ? {
          algorithm: 'ML-KEM-768',
          useCase: 'key-establishment',
          quantumVulnerableDuringTransition: true,
          retentionYears: 3,
          migrationYears: 2,
          threatHorizonYears: 8,
          completionYear: 2030,
          policy: {
            id: `FICTIONAL-${moduleId.toUpperCase()}`,
            revision: '1',
            source: `Hub-authored fictional policy for ${scenario.domainTitle}`,
            applies: true,
            deadlineYear: 2030,
          },
        }
      : mode === 'adverse'
        ? {
            algorithm: 'ML-DSA-65',
            useCase: 'key-establishment',
            quantumVulnerableDuringTransition: true,
            retentionYears: 10,
            migrationYears: 3,
            threatHorizonYears: 8,
            completionYear: 2031,
            policy: {
              id: `FICTIONAL-${moduleId.toUpperCase()}`,
              revision: '1',
              source: `Hub-authored fictional policy for ${scenario.domainTitle}`,
              applies: true,
              deadlineYear: 2030,
            },
          }
        : {
            algorithm: 'ML-KEM-768',
            useCase: 'key-establishment',
            quantumVulnerableDuringTransition: true,
            retentionYears: 10,
            migrationYears: 3,
            threatHorizonYears: 8,
            completionYear: 2030,
            policy: {
              id: `FICTIONAL-${moduleId.toUpperCase()}`,
              revision: '1',
              source: `Hub-authored fictional policy for ${scenario.domainTitle}`,
              applies: false,
              deadlineYear: 2030,
            },
          }

  return evaluateSamplePolicy(baseInputs)
}
