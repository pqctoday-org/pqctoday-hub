// SPDX-License-Identifier: AGPL-3.0-only
import type { StepExercise } from './stepExercises'

export const STEP_TRANSFER_EXERCISES: Partial<Record<string, StepExercise>> = {
  'quantum-threats/hnfl-timeline': {
    prompt:
      'A release key is retired in 2033. An offline verifier will trust it until 2040. In the worksheet’s 2035 scenario, which evidence changes your decision?',
    options: [
      'The date the verifier stopped accepting the key and how it establishes when an archived signature was made',
      'The date the last signature was issued, on its own',
      'The date the private key was deleted, on its own',
    ],
    answer: 0,
    why: 'What the verifier accepts governs forgery exposure. Stopping new signing does not remove old trust. Historical acceptance also depends on evidence of when the artifact was signed.',
  },
  'exec-quantum-impact/how-to-act': {
    prompt:
      'A sample customer archive must stay confidential for 15 years. A second service carries disposable diagnostics. Both use classical public-key exchange. Which measure informs the first budget decision?',
    options: [
      'The number of dashboard users on each service',
      'The confidentiality lifetime of each asset and the time required to replace its exposed key exchange',
      'The renewal date of each server certificate on its own',
    ],
    answer: 1,
    why: 'Estimate when captured data would still have value, then account for how long migration takes. The server renewal date alone tells you little about that exposure.',
  },
  'arch-quantum-impact/how-to-act': {
    prompt:
      'An architecture decision requires hybrid key agreement and ML-DSA authentication. The test captures X25519MLKEM768 and an RSA-PSS CertificateVerify. What goes in the decision record?',
    options: [
      'Both requirements passed because the session used a hybrid group',
      'The session used ML-DSA because ML-KEM was present in the group',
      'Key agreement met the requirement. Authentication still needs a peer test with ML-DSA',
    ],
    answer: 2,
    why: 'The group establishes shared secrets. The observed signature scheme identifies the authentication that happened. Record and accept those outcomes separately.',
  },
  'ops-quantum-impact/how-to-act': {
    prompt:
      'The pilot requires hybrid key agreement. A peer supporting only X25519 connects after the policy change. What do you record before expanding the pilot?',
    options: [
      'The legacy-peer test failed the requirement. Capture the negotiated group and correct the enforcement setting',
      'The pilot passed because the HTTP request succeeded',
      'The rollout passed because the server sent the expected RSA certificate',
    ],
    answer: 0,
    why: 'A successful request under classical fallback breaches the stated policy. Use the handshake result and the negative peer test to decide whether to expand.',
  },
  'migration-program/kpi-tracker': {
    prompt:
      'A metric reports 12 of 20 inventoried systems migrated. Four more systems enter scope and none of them has migrated. What should the measured rate become?',
    options: [
      '60% remains correct',
      '50%, with the newly scoped systems in the denominator',
      '67%, because the completed work stayed the same',
    ],
    answer: 1,
    why: 'The migrated count remains 12. The scope grows to 24, so the measured rate is 12 divided by 24. Record the scope change alongside the new rate.',
  },
  'vendor-risk/contract-clauses': {
    prompt:
      'A vendor supplies an algorithm test record for firmware 7.2. Your planned appliance uses 7.3 and requires the approved operating mode. What evidence belongs in the acceptance clause?',
    options: [
      'Require evidence for the delivered firmware and approved mode, and identify the validation scope',
      'Accept the earlier test record if the product name matches',
      'Accept a roadmap announcement and require the algorithm name on the invoice',
    ],
    answer: 0,
    why: 'Algorithm testing and product or module validation answer different questions. Resolve the version and approved-mode scope before recording acceptance.',
  },
  'network-security-pqc/tls-inspection-lab': {
    prompt:
      'The client-to-proxy connection negotiates X25519MLKEM768. The proxy-to-origin connection negotiates X25519. A policy requires hybrid key agreement on both legs. What is the result?',
    options: [
      'Both legs pass because the browser connected using hybrid key agreement',
      'Only the client-to-proxy leg passes',
      'Only the proxy-to-origin leg passes',
    ],
    answer: 1,
    why: 'The proxy terminates one TLS connection and opens another. The upstream leg has its own negotiated group and must satisfy the same requirement independently.',
  },
  'automotive-pqc/ota-orchestration-planner': {
    prompt:
      'In a new fleet plan, a 15-minute gateway update blocks two ECU updates of 45 and 55 minutes, which then run in parallel. How much time must the maintenance window allow for this chain?',
    options: ['55 minutes', '115 minutes', '70 minutes'],
    answer: 2,
    why: 'The gateway is a prerequisite for both ECUs. The longer downstream update sets the finish time, so add 15 and 55 minutes.',
  },
  'crypto-mgmt-modernization/no-regret-roi': {
    prompt:
      'A sample investment estimates $420,000 in provider-maintenance savings and $300,000 in expected quantum-breach avoidance at a 100% CRQC assumption. You change the probability to zero. What should remain in the model’s benefit estimate?',
    options: [
      '$420,000 in provider-maintenance savings',
      '$720,000 across both streams',
      '$0 across both streams',
    ],
    answer: 0,
    why: 'The CRQC assumption scales the quantum-dependent benefit. Maintenance savings have their own inputs and should be estimated separately.',
  },
  'data-asset-sensitivity/asset-inventory': {
    prompt:
      'Your scenario changes the CRQC arrival estimate from 2034 to 2032. The asset’s representative confidentiality lifetime stays at seven years. In what year does the modeled capture window begin?',
    options: ['2039', '2025', '2027'],
    answer: 1,
    why: 'Subtract the seven-year confidentiality lifetime from the new 2032 arrival assumption. Updating the scenario moves the modeled capture window two years earlier.',
  },
  'secrets-management-pqc/secrets-architecture-mapper': {
    prompt:
      'Inventory shows an active database protected by key v2. A cold backup from before rotation still depends on v1. What evidence supports retiring v1?',
    options: [
      'A successful read from the active database',
      'A restore of the retained backup without v1, using the approved rewrapped backup or equivalent replacement',
      'A successful request for the latest key version',
    ],
    answer: 1,
    why: 'Rotation moves new operations to v2. Inventory the versions needed by retained backups, then test recovery with the keys that will remain available.',
  },
  'pqc-testing-validation/active-pqc-scanner': {
    prompt:
      'A test report lists X25519MLKEM768 among the groups offered by the client. The captured server selected X25519. Which evidence should the report give to the application owner?',
    options: [
      'Hybrid was advertised by the client. The observed connection used classical X25519',
      'Hybrid was negotiated because it appeared in the client’s list',
      'The result depends on the server certificate’s public key size',
    ],
    answer: 0,
    why: 'The offer expresses capability. The server’s selected key share identifies the group used for the observed handshake.',
    source: {
      label: 'TLS 1.3 key share',
      href: 'https://www.ietf.org/ietf-ftp/rfc/rfc9846.html#section-4.3.8',
    },
  },
  'skills-team-structure/team-sizing': {
    prompt:
      'The sample draft allocates 4 delivery FTE and 2.5 coordination FTE. You add 0.5 FTE to the PMO analyst row. What should the handoff report?',
    options: [
      '4.5 delivery and 2.5 coordination',
      '4 delivery and 2.5 coordination',
      '4 delivery and 3 coordination',
    ],
    answer: 2,
    why: 'The PMO analyst is in coordination. The new total is 7 FTE, and the delivery reference stays tied to the same estate size and phase.',
  },
  'slh-dsa/sign-verify': {
    prompt:
      'A signed package specifies Pure SLH-DSA with application context release-v1. A verifier uses Pure SLH-DSA with context release-v2. The same file and public key are available. What should the maintainer check?',
    options: [
      'Whether the verifier is supposed to require release-v2, because the signature was made for release-v1',
      'Whether the verifier allocated enough bytes for the public key',
      'Whether the same file can be accepted automatically under release-v2',
    ],
    answer: 0,
    why: 'The verifier includes the context in the signed input. A signature made for release-v1 fails verification under release-v2. Use the intended application context in the verification policy.',
    source: {
      label: 'NIST FIPS 205, section 10',
      href: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf',
    },
  },
  'aerospace-pqc/mission-crypto-lifecycle': {
    prompt:
      'The fictional mission moves launch from 2034 to 2032. The planner still assumes a three-year design phase. When should the team reopen its algorithm choice under that assumption?',
    options: ['2031', '2029', '2035'],
    answer: 1,
    why: 'Subtract the three-year lead time from the revised launch year. Review that planning assumption with the actual integration, assurance and launch owners.',
  },
  'ot-pqc/firmware-project-signing-lab': {
    prompt:
      'After signing firmware, a standby signer is restored from a key snapshot. Its next LMS leaf is 17, and production logs show the active signer already used leaf 17 under that key. What is the release decision?',
    options: [
      'Use the standby because this is a different HSM',
      'Sign with the standby and reconcile the audit logs afterward',
      'Block signing on the restored state until safe unused signing state or a replacement key is established',
    ],
    answer: 2,
    why: 'A leaf is a one-time signing key. Its identity follows the LMS key, so moving a snapshot to other hardware does not give it fresh leaves.',
    source: {
      label: 'RFC 8554 state management',
      href: 'https://www.rfc-editor.org/rfc/rfc8554.html#section-9.2',
    },
  },
  'platform-eng-pqc/crypto-posture-monitor': {
    prompt:
      'The largest valid signature in a new rollout is 7,856 bytes. Its encoded envelope adds 700 bytes, and the receiver accepts up to 8,192 bytes. What happens at the gate?',
    options: [
      'The envelope exceeds the receiver limit by 364 bytes. Test an agreed change before rollout',
      'The signature fits with 336 bytes free, so the envelope passes',
      'The envelope is accepted automatically once verification is enabled',
    ],
    answer: 0,
    why: 'The receiver sees 8,556 bytes. Compare the encoded object actually sent to the limit on the production path, then exercise both sides of the chosen limit.',
  },
  'soc-implementation-pqc/self-assessment': {
    prompt:
      'Your detector saw a classical group used on an endpoint required to use hybrid. The handshake succeeded and the application returned 200. Which finding belongs in the incident notes?',
    options: [
      'The endpoint passed because the application returned success',
      'The observed negotiated group violated the endpoint policy. Keep the handshake evidence and verify the affected path',
      'The server signing key is proven compromised',
    ],
    answer: 1,
    why: 'An observed group can demonstrate a policy mismatch. Check that the flow crossed the expected segment and termination point before attributing scope or cause.',
    source: {
      label: 'IANA TLS Supported Groups',
      href: 'https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-8',
    },
  },
  'crypto-product-certification/boundary-drawer': {
    prompt:
      'A new service puts the approved module behind a worker that opens TLS using another library. Only the module is listed on the validation record. What evidence supports a claim about the worker’s cryptography?',
    options: [
      'The worker can inherit the module’s validation because both run in the same service',
      'A successful TLS handshake confers the same validation',
      'Trace which implementation performs the worker’s cryptographic operations and check its own validation scope and mode',
    ],
    answer: 2,
    why: 'Evidence must identify the cryptographic module performing the claimed service. A validation record for one module does not establish coverage for another implementation in the same deployment.',
    source: {
      label: 'NIST CMVP validation scope',
      href: 'https://csrc.nist.gov/Projects/Cryptographic-Module-Validation-Program/faqs',
    },
  },
  'crypto-product-certification/evidence-exchange': {
    prompt:
      'A receipt says the uploaded payload passed schema checks. The report digest in the receipt differs from the digest in the approval file. What belongs in the evidence record?',
    options: [
      'The exact approved bytes have not been reconciled. Match the digest and verify the approval covers that artifact',
      'The receipt proves the two files contain the same exact bytes',
      'Schema success proves the lab approved the report',
    ],
    answer: 0,
    why: 'Schema checking establishes the structure of the submission. Reconcile the artifact identity and the authority’s decision as separate evidence.',
  },
  'dnssec-pqc/validation-chain-walkthrough': {
    prompt:
      'A validating resolver receives a truncated UDP response for a signed record. It retries over TCP and validates the complete response under its configured trust chain. What should the operations report say?',
    options: [
      'DNSSEC validation failed when the UDP response was truncated',
      'UDP required a transport retry, and the complete response validated',
      'The TCP connection alone established DNSSEC authenticity',
    ],
    answer: 1,
    why: 'Report the transport retry separately from DNSSEC validation. Authenticity comes from verifying the complete signed data and its trust chain.',
    source: {
      label: 'RFC 4035 DNSSEC validation',
      href: 'https://www.rfc-editor.org/rfc/rfc4035.html#section-5',
    },
  },
  'entropy-randomness/source-combining': {
    prompt:
      'Two sample blocks each have a credited estimate of 128 bits. The second device picked up the same measurement as the first. What can you claim about the combination?',
    options: [
      '256 bits because the blocks came from two devices',
      '256 bits if the output looks balanced',
      'The observations do not justify adding the two entropy estimates',
    ],
    answer: 2,
    why: 'The addition in this exercise depends on the independence of the credited sources. A second copy of the same measurement leaves the estimate unchanged.',
    source: {
      label: 'NIST SP 800-90C, section 2.6',
      href: 'https://csrc.nist.gov/pubs/sp/800/90/c/final',
    },
  },
  'government-defense-pqc/suite-comparator': {
    prompt:
      'A fictional acceptance policy specifies ML-KEM-1024. A vendor supplies an ML-KEM-768 handshake trace for the correct appliance. What evidence is still needed?',
    options: [
      'A trace and configuration for the same appliance demonstrating the required ML-KEM-1024 profile',
      'The same ML-KEM-768 trace with the appliance model highlighted',
      'A product brochure stating that it supports ML-KEM',
    ],
    answer: 0,
    why: 'Parameter sets are distinct. Acceptance depends on the actual negotiated profile under the selected build and policy.',
  },
  'emv-payment-pqc/tokenization-explorer': {
    prompt:
      'Your merchant pilot uses an EMV Payment Token instead of a card number. A reviewer then asks which key exchange protected the connection to the service. What evidence should the pilot supply?',
    options: [
      'The payment token length',
      'The negotiated transport key exchange from that connection',
      'The merchant’s decision to remove card numbers from its database',
    ],
    answer: 1,
    why: 'Tokenisation limits use of the payment data. Check the actual connection separately to determine which key establishment protocol and group protected it.',
    source: {
      label: 'EMVCo Payment Tokenisation',
      href: 'https://www.emvco.com/emv-technologies/payment-tokenisation/',
    },
  },
  'iam-pqc/token-migration-lab': {
    prompt:
      'The new token signature verifies under the trusted issuer key. The token names the payments API as its audience, and it reaches the reports API. What should the reports API do?',
    options: [
      'Accept the token because the signature verifies',
      'Accept the token because both services use the same issuer',
      'Reject the token because the reports API is outside its audience',
    ],
    answer: 2,
    why: 'A valid signature identifies the issuer and protects the signed bytes. The recipient still checks that it is included in the token’s intended audience.',
    source: {
      label: 'RFC 7519 audience claim',
      href: 'https://www.rfc-editor.org/rfc/rfc7519.html#section-4.1.3',
    },
  },
  'dev-quantum-impact/how-to-act': {
    prompt:
      'A developer upgrades a crypto library and lists X25519MLKEM768 as available. The application still connects to a classical-only sample peer. What would prove the application enforces hybrid exchange?',
    options: [
      'A hybrid-peer trace showing the selected group and a classical-only peer test that the application rejects',
      'A dependency report with the new library version',
      'A successful connection to the classical-only sample peer',
    ],
    answer: 0,
    why: 'A list shows what the library can offer. Verify the application’s actual selection on a compatible path, then demonstrate enforcement with an incompatible peer.',
  },
  'cc-eucc-certification/cc-claim-decoder': {
    prompt:
      'A vendor quotes a Common Criteria certificate for firmware 4.1. The bid offers 4.2 with a new signing feature. Which evidence would support the claim for the new signing feature?',
    options: [
      'The headline evaluation level for firmware 4.1',
      'The evaluated version and configuration, with the signing feature in the published Security Target or applicable update record',
      'A statement that the product family name is the same',
    ],
    answer: 1,
    why: 'The evaluation covers the defined target and its claimed functions. Match the delivered version, configuration and function to the actual evaluated scope or documented update.',
  },
  'media-drm-pqc/provenance-algorithm-check': {
    prompt:
      'A media pipeline verifies a signed provenance record and also retrieves a valid decryption licence. What evidence checks whether the displayed asset is the one described by the provenance?',
    options: [
      'A successful licence request, by itself',
      'The codec and resolution displayed by the player',
      'The verified provenance claim’s binding to the bytes of the displayed asset',
    ],
    answer: 2,
    why: 'The licence authorizes use under its rules. The provenance verifier separately checks that the authenticated claim binds to the actual asset.',
  },
  'pqc-candidates/lifecycle': {
    prompt:
      'A supplier cites selection in a research round as the only evidence for meeting a clause that requires a published algorithm standard. What should the procurement reviewer record?',
    options: [
      'Request the published specification and evidence for the delivered implementation',
      'Accept the claim because selection makes the draft final',
      'Accept the claim if the submission has public sample code',
    ],
    answer: 0,
    why: 'A research milestone and a published standard are different records. Match the applicable publication and implementation evidence to the actual contractual requirement.',
  },
  'standards-bodies/coverage-grid': {
    prompt:
      'A project requires both an algorithm standard and a certificate for a specific tested module. The team already has the algorithm specification. Which authority’s record answers the second question in the FIPS 140-3 programme?',
    options: [
      'The algorithm standard itself',
      'The Cryptographic Module Validation Program’s record for the exact module',
      'A technology standards meeting agenda',
    ],
    answer: 1,
    why: 'The specification establishes how the algorithm works. The module validation record identifies the module, applicable versions and validation scope.',
    source: {
      label: 'NIST CMVP validated modules',
      href: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules',
    },
  },
  'sbom/sbom-format-explorer': {
    prompt:
      'A release BOM lists two versions of the same cryptography package. Only one is linked as a dependency of the gateway component. What evidence should the migration owner follow?',
    options: [
      'Every component with the package’s short name, without distinguishing versions',
      'The oldest component in the BOM',
      'The dependency reference to the exact component, then the deployed build’s evidence for actual crypto use',
    ],
    answer: 2,
    why: 'Use the BOM references to identify the exact dependency. An inventory entry establishes a component relationship, and runtime evidence establishes what the deployment uses.',
    source: {
      label: 'CycloneDX dependency references',
      href: 'https://www.cyclonedx.org/use-cases/software-dependencies/',
    },
  },
  'vpn-ssh-pqc/ssh-key-exchange': {
    prompt:
      'Your recorded SSH session uses the required hybrid key exchange. Its host-key fingerprint differs from the trusted inventory. What belongs in the rollout decision?',
    options: [
      'Pause the rollout until the host key is verified against its trusted record',
      'Accept the host because the key exchange was hybrid',
      'Replace the host fingerprint in inventory using only this observation',
    ],
    answer: 0,
    why: 'A key exchange establishes session secrets. The host-key check establishes the server identity expected by the client, and needs its own trusted evidence.',
    source: {
      label: 'RFC 4253 key exchange',
      href: 'https://www.rfc-editor.org/rfc/rfc4253.html#section-7',
    },
  },
  'stateful-signatures/state-management': {
    prompt:
      'A sample LMS signer reports that it has used leaf 19. A restored backup of the same key reports leaf 18 as the next index. What should the request handler do?',
    options: [
      'Resume signing because the key identifier matches',
      'Block signing on the stale state and recover a verified unused index or replace the key',
      'Resume from the restored counter with a new message name',
    ],
    answer: 1,
    why: 'The leaf is a one-time key. A restored state behind the confirmed counter risks reusing leaves under the same root.',
    source: {
      label: 'RFC 8554 signer state',
      href: 'https://www.rfc-editor.org/rfc/rfc8554.html#section-9.2',
    },
  },
  'qkd/post-processing': {
    prompt:
      'A lab reports a usable optical link and an expected error rate. The peers have yet to authenticate their classical post-processing channel. What is still needed before accepting the shared key?',
    options: [
      'A lower measured optical error rate only',
      'A useful key rate over a longer optical path',
      'Evidence that the classical post-processing exchange came from the intended peer and was intact',
    ],
    answer: 2,
    why: 'The optical measurement describes the quantum link. Post-processing needs an authenticated classical channel so the endpoints can verify who exchanged the messages and their integrity.',
    source: {
      label: 'ETSI QKD vocabulary',
      href: 'https://www.etsi.org/deliver/etsi_gr/QKD/001_099/007/01.02.01_60/gr_QKD007v010201p.pdf',
    },
  },
  'trust-services-pqc/longevity-calculator': {
    prompt:
      'An archive retains a time-stamp token over a signed sample file. On migration, the copied file has a different digest. What should the archive verifier conclude about the existing token?',
    options: [
      'It can be used only for the original digest, so reconcile the copied file before relying on it',
      'It automatically transfers to the file with the same name',
      'It proves the copied bytes were signed on the original date',
    ],
    answer: 0,
    why: 'The token binds a digest, so its trusted time applies to the original message imprint. A file name does not transfer that evidence to changed bytes.',
    source: {
      label: 'RFC 3161 time-stamp request and response',
      href: 'https://www.rfc-editor.org/rfc/rfc3161.html#section-2.4',
    },
  },
  'research-quantum-impact/how-to-act': {
    prompt:
      'A paper compares a software run on one CPU with an accelerator run on a different host. Both use the same named algorithm. Which evidence would let the reader reproduce a speed comparison for their deployment?',
    options: [
      'The algorithm name and the faster timing only',
      'The parameter set, workload, timing boundary and host setup, with comparable measurements',
      'The paper’s publication venue and release date',
    ],
    answer: 1,
    why: 'Speed measurements depend on the work included and the measurement conditions. Record those inputs so the reader can repeat a comparable experiment.',
  },
  'pqc-hw-acceleration/offload-lab': {
    prompt:
      'A device signs in 8 ms on its CPU. The accelerator signs in 2 ms, but that request adds 7 ms of transfer and queue time. How does the single-request latency compare?',
    options: [
      '2 ms on the accelerator path, because data transfer is outside the algorithm',
      '7 ms on the accelerator path, because signing overlaps with transfer by default',
      '9 ms on the accelerator path, one millisecond slower than the CPU path',
    ],
    answer: 2,
    why: 'For the serial operation described here, add the 2 ms of signing and 7 ms of overhead. Measure the full request path before claiming a latency improvement.',
  },
  'pqc-grc/exception-triage': {
    prompt:
      'A temporary classical crypto exception covered one gateway for a pilot. A different gateway now needs the same exemption. What belongs in the decision record?',
    options: [
      'A separate scope decision for the second gateway, with owner, expiry and evidence for any compensating control',
      'Reuse of the first approval because the algorithm is the same',
      'Removal of the expiry field because a previous exception already exists',
    ],
    answer: 0,
    why: 'An exception applies to the systems and time it names. The second gateway needs an explicit decision based on its own exposure and the proposed controls.',
  },
  'talking-about-pqc/claim-checker': {
    prompt:
      'A slide calls a gateway quantum-safe because a sample TLS connection negotiated X25519MLKEM768. The same trace shows an RSA-PSS handshake signature. What can the reviewer approve in the slide?',
    options: [
      'A claim that the tested gateway has post-quantum authentication',
      'A claim that the sample used hybrid key exchange and classical RSA-PSS authentication',
      'A claim that every gateway installation now uses hybrid key exchange',
    ],
    answer: 1,
    why: 'Use the observed group and signature scheme as separate facts. Limit the claim to the build and connection that supplied the evidence.',
  },
}
