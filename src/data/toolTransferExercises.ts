// SPDX-License-Identifier: AGPL-3.0-only
import type { StepExercise } from './stepExercises'

export const TOOL_TRANSFER_EXERCISES: Partial<Record<string, StepExercise>> = {
  'playground/slh-dsa': {
    prompt:
      'A sample firmware signature was made with Pure SLH-DSA under the context update-v1. The release verifier requires update-v2. Which verification result should the release engineer expect?',
    options: [
      'The signature fails under update-v2. Verify which context the release policy requires.',
      'The signature works because its public key and file bytes are unchanged.',
      'The signature works if the verifier tries a different pre-hash first.',
    ],
    answer: 0,
    why: 'The context participates in signature verification. Keep the signature mode and the application context tied to the intended policy.',
    source: { label: 'NIST FIPS 205', href: 'https://csrc.nist.gov/pubs/fips/205/final' },
  },
  'playground/lms-hss': {
    prompt:
      'A sample LMS key has one unused leaf. The token gets two signing requests at the same time. What evidence would allow the maintainer to accept the test?',
    options: [
      'Both requests returned a signature with the same leaf because the messages are different.',
      'One request consumed the last leaf and the other was refused without reusing it.',
      'Both requests signed after resetting the same key to its earlier counter.',
    ],
    answer: 1,
    why: 'The signer must reserve and persist unused state safely. An exhausted key cannot sign again.',
    source: {
      label: 'RFC 8554 signer state',
      href: 'https://www.rfc-editor.org/rfc/rfc8554.html#section-9.2',
    },
  },
  'playground/hybrid-encrypt': {
    prompt:
      'The recipient can derive the classical contribution to a hybrid envelope, but its recovered post-quantum contribution is different. The envelope uses both in the key derivation. What should happen?',
    options: [
      'The plaintext should open using the classical contribution alone.',
      'The envelope should silently retry without the post-quantum contribution.',
      'The authenticated open should fail under the different derived key.',
    ],
    answer: 2,
    why: 'The recipient needs the same derived key as the sender. Verify the authentication tag before releasing plaintext.',
  },
  'playground/envelope-encrypt': {
    prompt:
      'A team changes the wrapping key while the data-encryption key and encrypted object stay the same. Which operation should the reviewer look for?',
    options: [
      'Re-wrap the existing data key and verify that the retained ciphertext opens with the new wrapper.',
      'Run no recovery test because the active database can already write using the new wrapping key.',
      'Change the confidentiality label on the old encrypted object and discard its key metadata.',
    ],
    answer: 0,
    why: 'Re-wrapping changes how the data key is protected. A recovery test shows whether the existing object remains usable through the new wrapper.',
  },
  'playground/hybrid-sigs': {
    prompt:
      'A verifier expects a hybrid signature under a both-components policy. It verifies the classical signature but the post-quantum signature fails. What should the application report?',
    options: [
      'The hybrid signature passed because the classical component was valid.',
      'The hybrid signature failed under the selected policy.',
      'The result is the same as an explicit classical-only policy.',
    ],
    answer: 1,
    why: 'The policy requires both results on the intended data. A separate classical-only policy would be a different acceptance rule.',
  },
  'playground/cacp-kmip': {
    prompt:
      'A KMIP client can locate the identifier of a sample signing key. The service refuses to sign for that client identity. What access has been demonstrated?',
    options: [
      'Successful signing because Locate returned the identifier.',
      'Permission to export the key because its identifier is visible.',
      'Object visibility with signing still refused for this client.',
    ],
    answer: 2,
    why: 'Authorization depends on the operation and identity. Test Sign explicitly and record its result separately from object discovery.',
  },
  'playground/pqc-ssh-sim': {
    prompt:
      'The peer negotiates the expected hybrid SSH exchange. Its host key does not match the trusted key record. Which rollout decision follows?',
    options: [
      'Block acceptance until the server identity is verified separately.',
      'Accept the server because a hybrid exchange succeeded.',
      'Update the trusted key from this unverified session.',
    ],
    answer: 0,
    why: 'The negotiated group describes how the session key was established. Host authentication uses a separate trusted key check.',
  },
  'playground/qrng-demo': {
    prompt:
      'Two sample random-number files look similarly balanced. Only one source has reproducible characterization and a health-test record. Which evidence supports a source-quality decision?',
    options: [
      'The file with the most equal number of zeros and ones.',
      'The source characterization, collection method and health-test evidence.',
      'The file with the longest hexadecimal line.',
    ],
    answer: 1,
    why: 'Appearance alone cannot establish unpredictability. Examine the source assumptions and its behavior under the conditions in which it operates.',
  },
  'playground/pki-workshop': {
    prompt:
      'A CSR verifies against its own public key and requests gateway.example.test. What should the issuer do before approving that name?',
    options: [
      'Approve the name immediately because the CSR self-signature verified.',
      'Treat the CSR signature as an existing trusted certificate path.',
      'Check the requester’s authorization for the name under the issuer’s policy.',
    ],
    answer: 2,
    why: 'CSR signature verification checks possession of the corresponding private key. Issuance authorization and later relying-party certificate validation are distinct.',
    source: {
      label: 'RFC 2986 certificate request',
      href: 'https://www.rfc-editor.org/rfc/rfc2986.html',
    },
  },
  'playground/bitcoin-flow': {
    prompt:
      'In a fictional wallet demo, a local post-quantum signature verifies over a proposed transaction. What evidence would establish that a particular Bitcoin network configuration accepts that spending condition?',
    options: [
      'Validation of the actual spending condition under that network’s consensus rules.',
      'The wallet’s successful standalone signature verification.',
      'A longer public key than the original one.',
    ],
    answer: 0,
    why: 'A standalone signature is evidence about those bytes and that key. Network acceptance depends on its transaction validation rules.',
  },
  'playground/solana-flow': {
    prompt:
      'A sample transaction has a valid signature. The receiving program still rejects the request under its account rules. What should the integration report?',
    options: [
      'Program execution must succeed whenever the signature verifies.',
      'The signature verified and the program’s separate authorization or execution check failed.',
      'The program result proves that the signature was altered.',
    ],
    answer: 1,
    why: 'Signing authenticates the request. The receiving program can still reject it based on accounts, state and the requested operation.',
  },
  'playground/hd-wallet': {
    prompt:
      'Two recovery tools import the same fictional wallet seed but show different first receiving addresses. Which setting should the migration owner compare first?',
    options: [
      'The rendered color of each receiving address.',
      'The size of the notes attached to each account.',
      'The derivation scheme, account path and address index used by each wallet.',
    ],
    answer: 2,
    why: 'The derived key depends on the derivation path as well as the seed. Keep recovery instructions tied to the actual scheme and path.',
  },
  'playground/openssl-studio': {
    prompt:
      'OpenSSL lists ML-DSA-65 in the sample provider. The deployed application uses a different provider configuration. How would an engineer demonstrate that the deployed path works?',
    options: [
      'Run key generation, signing, valid verification and an altered-message rejection using the application’s actual build and provider.',
      'Use the sample provider’s algorithm list as proof for the deployed build.',
      'Run a SHA-256 digest to establish that the deployed build can sign with ML-DSA.',
    ],
    answer: 0,
    why: 'An algorithm list gives evidence of capability in that context. The observed operations and rejection check establish which path actually worked.',
  },
  'business/board-pitch': {
    prompt:
      'The board has time to approve one limited experimental rollout. Which proposal gives it a decision that can be checked afterward?',
    options: [
      'Approve general readiness work and report progress later.',
      'Approve a named two-gateway pilot with a spending limit, accountable sponsor and a decision date based on peer evidence.',
      'Ask the board to select certificate algorithms for all production systems.',
    ],
    answer: 1,
    why: 'A bounded decision states what the pilot authorizes and who owns it. An evidence gate supports the next decision.',
  },
  'business/breach-simulator': {
    prompt:
      'A fictional archive must stay secret for eight years, and its exchange takes three years to replace. The assumed threat horizon changes from twelve years to ten. What changes in the planning comparison?',
    options: [
      'The migration time automatically shrinks by two years.',
      'The projected exposure stays unchanged because the data lifetime is eight years.',
      'The eleven-year confidentiality and migration window is now beyond the ten-year horizon.',
    ],
    answer: 2,
    why: 'Hold confidentiality lifetime and migration time fixed, then compare their sum with the revised horizon. This is a planning assumption to revisit.',
  },
  'business/crqc-scenario': {
    prompt:
      'The team moves its assumed CRQC arrival two years earlier. It also has a published customer delivery date. Which value should change when the scenario is rerun?',
    options: [
      'The modeled exposure window. Keep the published commitment tied to its own source.',
      'The published delivery date moves automatically with the scenario.',
      'Both values remain unchanged if the asset count stays fixed.',
    ],
    answer: 0,
    why: 'The arrival year is a planning input. A dated obligation or commitment changes only through its own governing record.',
  },
  'business/risk-register': {
    prompt:
      'A team assigns an owner and review date to a risk. Likelihood and impact inputs stay the same. What should the status review record?',
    options: [
      'The risk score falls because the new owner has accepted accountability.',
      'The escalation path improves while the stated risk score stays the same.',
      'The exposure disappears until the review date.',
    ],
    answer: 1,
    why: 'Ownership changes responsibility for the response. A change to the exposure assessment requires evidence affecting likelihood, impact or the modeled controls.',
  },
  'business/risk-treatment-plan': {
    prompt:
      'A team chooses Mitigate and schedules a new TLS rollout. No compatibility tests or deployment evidence exist yet. How should the coordinator describe residual risk?',
    options: [
      'The planned treatment sets residual risk to zero.',
      'The treatment choice proves the control is implemented.',
      'Record the planned treatment and leave the reduction pending until test and rollout evidence exist.',
    ],
    answer: 2,
    why: 'A treatment is the intended response. Use implementation and verification evidence before crediting a reduction in exposure.',
  },
  'business/compliance-checklist': {
    prompt:
      'A sample framework appears in an organization’s checklist. There is no evidence covering the affected service or jurisdiction. What action can the reviewer take?',
    options: [
      'Record the applicability question and request scoped evidence before marking the item complete.',
      'Mark the obligation satisfied because the framework is visible.',
      'Erase the item because the proof has not been attached yet.',
    ],
    answer: 0,
    why: 'The checklist organizes review. Confirm the framework and obligation apply to the service, then assess the referenced evidence.',
  },
  'business/compliance-timeline': {
    prompt:
      'The fictional programme schedules a migration milestone before the chosen reference year. The delivery owner has provided no completion record. How should the date comparison be reported?',
    options: [
      'Delivery is complete and the obligation is satisfied.',
      'The milestone is planned before the reference year, with delivery evidence still required.',
      'The reference year should be removed until the work is completed.',
    ],
    answer: 1,
    why: 'A date comparison shows planned timing. Confirm the source and applicability of the reference and capture actual delivery separately.',
  },
  'business/policy-generator': {
    prompt:
      'An approved policy names hybrid key exchange. A pilot configuration still permits a classical-only peer to connect. What goes in the evidence record?',
    options: [
      'The approved policy proves all peers enforced the requirement.',
      'The classical peer succeeded, so the hybrid requirement is unnecessary.',
      'The policy exists and the pilot did not enforce it on the tested path.',
    ],
    answer: 2,
    why: 'Separate the approved policy language from enforcement. The pilot’s observed behavior gives the owner a specific gap to correct and retest.',
  },
  'business/contract-clause': {
    prompt:
      'The supplier demonstrates a PQC algorithm on a different firmware version from the one it will deliver. What evidence requirement belongs in the contract?',
    options: [
      'Evidence for the delivered firmware, selected mode and agreed acceptance tests.',
      'An algorithm name on the invoice with the firmware omitted.',
      'Any successful demonstration from the product family.',
    ],
    answer: 0,
    why: 'Tie acceptance to the deployed configuration. Reusing a demonstration from another version leaves the delivered version unverified.',
  },
  'business/supply-chain-matrix': {
    prompt:
      'A vendor replaces the cryptography library in a build that keeps the same product name. Which evidence should sourcing request before carrying forward its previous assessment?',
    options: [
      'The marketing description from the prior build.',
      'The new build’s dependency inventory, provenance and compatibility evidence for the affected paths.',
      'An unchanged customer purchase order.',
    ],
    answer: 1,
    why: 'The relevant components and behavior can change within one product family. Link the evidence to the new build.',
  },
  'business/crypto-architecture-diagram': {
    prompt:
      'An architecture diagram moves TLS termination from the application to a gateway. What does the architect need to review before claiming the whole connection path uses the same policy?',
    options: [
      'Only whether the new diagram has a gateway icon.',
      'Only the certificate presented to the external client.',
      'Both connections and their independently negotiated key exchange, identity and trust settings.',
    ],
    answer: 2,
    why: 'TLS termination creates distinct connections. Each one has its own cryptographic and trust configuration.',
  },
  'business/crypto-cbom-builder': {
    prompt:
      'A signed inventory correctly lists a sample crypto library. A reviewer also needs proof of which group a gateway negotiated under that build. What should the dossier include?',
    options: [
      'A handshake result tied to the matching build and configuration.',
      'The library name a second time in the BOM.',
      'The BOM signature alone as proof of the group.',
    ],
    answer: 0,
    why: 'The inventory records components, and its signature helps authenticate that record. The observed handshake establishes the group used by the deployed path.',
  },
  'business/skills-team-plan': {
    prompt:
      'A programme still has four delivery FTE. An extra half-time coordinator is assigned to the updated plan. What should the staffing comparison show?',
    options: [
      'Delivery rises to 4.5 FTE and the coordination entry stays unchanged.',
      'Delivery stays at four FTE and coordination and the total each increase by 0.5 FTE.',
      'The baseline inventory ratio changes as soon as the coordinator is named.',
    ],
    answer: 1,
    why: 'The model maintains separate delivery and coordination allocations. The inventory ratio still applies to the same estate and phase.',
  },
}
