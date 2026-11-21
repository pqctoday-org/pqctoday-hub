// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Primary-source claims for Module A1 (CustodyThreatsControls, LM-083).
 * Every claim binds strictly ONE Library reference_id (`sourceId`), declared in content.ts.
 * Binance 29 October 2026 chronology, impact, containment, and attribution fields are
 * imported dynamically from `@/data/canonicalBinanceIncident` so A1 and AI share one record.
 */
import {
  BINANCE_INCIDENT_ATTRIBUTION,
  BINANCE_INCIDENT_CONTAINMENT,
  BINANCE_INCIDENT_IMPACT,
  BINANCE_INCIDENT_METADATA,
  BINANCE_INCIDENT_SOURCE_IDS,
  getBinanceIncidentStage,
} from '@/data/canonicalBinanceIncident'

export interface SourceClaim {
  id: string
  text: string
  /** Library reference_id of the single document this claim rests on */
  sourceId: string
  /** Document edition or publication date as read */
  edition: string
  /** Section, heading, or page locator within the document */
  locator: string
}

export const SOURCE_CLAIMS = {
  'DA-1.1': {
    id: 'DA-1.1',
    text: 'ECDSA requires a fresh, random, uniformly chosen per-signature nonce k; RFC 6979 defines deterministic nonce generation so verifiers need no changes while avoiding RNG reuse failures.',
    sourceId: 'IETF RFC 6979',
    edition: 'IETF RFC 6979 (Informational, August 2013)',
    locator: '§1 Introduction (pp. 2–3)',
  },
  'DA-1.3a': {
    id: 'DA-1.3a',
    text: 'In Safe.sol documentation, checkNSignatures verifies caller-supplied owner signatures over a transaction hash and warns callers to ensure executor is legitimate because an incorrect executor can reduce the required signature count by one.',
    sourceId: 'Safe-Wallet-Safe-sol-multisig-signature-verification',
    edition: 'Safe{Wallet} Smart Account Docs',
    locator: 'checkNSignatures -> Parameters -> executor',
  },
  'DA-1.3b': {
    id: 'DA-1.3b',
    text: 'In Safe.sol contract source, checkSignatures enforces that the stored threshold is nonzero (reverting with GS001 otherwise) before passing that stored _threshold to checkNSignatures.',
    sourceId: 'Safe-Smart-Account-Safe-sol-Contract-Source',
    edition: 'Safe Smart Account Safe.sol Source',
    locator: 'contracts/Safe.sol, checkSignatures',
  },
  'DA-1.4': {
    id: 'DA-1.4',
    text: 'EIP-7702 introduces an EIP-2718 transaction type that lets an Externally Owned Account (EOA) attach signed authorization tuples and write a persistent delegation indicator (0xef0100 || address) into its account code.',
    sourceId: 'Ethereum-EIP7702',
    edition: 'Ethereum EIP-7702 (Pectra)',
    locator: 'Abstract & Specification',
  },
  'DA-2.1a-fbi': {
    id: 'DA-2.1a-fbi',
    text: 'The FBI public service announcement (I-022625-PSA, 26 February 2025) advised that North Korea was responsible for the theft of approximately $1.5 billion USD in virtual assets from Bybit on or about 21 February 2025.',
    sourceId: 'FBI-PSA-I-022625-PSA-North-Korea-Responsible-for-1-5-Billion',
    edition: 'FBI PSA I-022625-PSA (2025-02-26)',
    locator: 'Opening paragraph',
  },
  'DA-2.1a-bybit': {
    id: 'DA-2.1a-bybit',
    text: 'In its 26 February 2025 statement, Bybit reported that a forensic review concluded a Safe{Wallet} developer’s credentials were compromised, allowing unauthorized access to Safe{Wallet} infrastructure to deceive signers while Bybit’s own infrastructure was uncompromised.',
    sourceId: 'Bybit-Confirms-Security-Integrity-Amid-Safe-Wallet-Incident',
    edition: 'Bybit Press Release (2025-02-26)',
    locator: 'Paragraph 2',
  },
  'DA-2.1b': {
    id: 'DA-2.1b',
    text: 'FBI Alert I-022625-PSA explicitly names the attributed North Korean malicious cyber campaign "TraderTraitor."',
    sourceId: 'FBI-PSA-I-022625-PSA-North-Korea-Responsible-for-1-5-Billion',
    edition: 'FBI PSA I-022625-PSA (2025-02-26)',
    locator: 'Paragraph 1',
  },
  'DA-2.2a': {
    id: 'DA-2.2a',
    text: 'Sygnia’s technical case study found that malicious JavaScript injected into the Safe{Wallet} interface displayed legitimate transaction details to Bybit signers while malicious payload data was signed and executed in the background.',
    sourceId: 'Bybit-Heist-Case-Study-When-Billions-Vanish',
    edition: 'Sygnia Bybit Case Study',
    locator: 'The Technical Mechanism: Interface Manipulation',
  },
  'DA-2.2b': {
    id: 'DA-2.2b',
    text: 'NCC Group’s analysis reports that the signed transaction executed with operation: 1 (delegatecall), pointing the Safe proxy implementation slot at attacker-controlled contract code and enabling theft of all funds in the wallet.',
    sourceId: 'NCC-Group-Technical-Analysis-Bybit-SafeWallet-UI-Manipulatio',
    edition: 'NCC Group Technical Analysis (2025-03-10)',
    locator: 'The Exploit',
  },
  'DA-2.2c': {
    id: 'DA-2.2c',
    text: 'On 28 February 2025, the Safe Ecosystem Foundation stated that the Safe{Wallet} team rebuilt and reconfigured all infrastructure, rotated all credentials, and restored Safe{Wallet} on Ethereum mainnet via a phased rollout.',
    sourceId: 'February-28th-2025-Statement-by-the-Safe-Ecosystem-Foundatio',
    edition: 'Safe Ecosystem Foundation Statement (2025-02-28)',
    locator: 'Safe{Wallet} Team Statement on Targeted Attack on Bybit',
  },
  'DA-2.3': {
    id: 'DA-2.3',
    text: 'The Safe Ecosystem Foundation’s 28 February 2025 statement confirmed the targeted attack on the Bybit Safe was achieved through a compromised Safe{Wallet} developer machine leading to a disguised malicious transaction proposal.',
    sourceId: 'February-28th-2025-Statement-by-the-Safe-Ecosystem-Foundatio',
    edition: 'Safe Ecosystem Foundation Statement (2025-02-28)',
    locator: 'Forensic review paragraph',
  },
  'DA-2.4a': {
    id: 'DA-2.4a',
    text: 'Drift’s 16 April 2026 recovery update states the recovery pool structure is designed to address $295 million in outstanding user losses (whereas Chainalysis’s earlier 9 April 2026 post estimated $285 million).',
    sourceId: 'Incident-Recovery-Update-April-16-2026-Drift-Updates',
    edition: 'Drift Incident Recovery Update (2026-04-16)',
    locator: 'User Recovery Framework -> Recovery Pool',
  },
  'DA-2.4b': {
    id: 'DA-2.4b',
    text: 'Chainalysis’s 9 April 2026 post (explicitly stating its account relays Drift’s post-mortem and had not yet been independently verified) reports that attackers spent months building relationships and used Solana durable nonces so Security Council members unknowingly pre-signed transactions handing over admin control.',
    sourceId: 'Drift-Protocol-Hack-How-Privileged-Access-Led-to-a-285M-Loss',
    edition: 'Chainalysis Drift Hack Post (2026-04-09)',
    locator: 'Summary & How the attack played out',
  },
  'DA-2.4c': {
    id: 'DA-2.4c',
    text: 'Chainalysis’s own on-chain findings identify Tornado Cash staging withdrawals on 10–11 March 2026, while relaying Drift’s finding that social engineering may have begun in Fall 2025 and noting formal DPRK attribution remained unconfirmed at publication.',
    sourceId: 'Drift-Protocol-Hack-How-Privileged-Access-Led-to-a-285M-Loss',
    edition: 'Chainalysis Drift Hack Post (2026-04-09)',
    locator: 'Body, Paragraph 5',
  },
  'DA-2.4d': {
    id: 'DA-2.4d',
    text: 'Drift’s 16 April 2026 relaunch framework requires all multisig signers to use dedicated signing devices and independently verify transaction content outside the primary signing interface before signing.',
    sourceId: 'Incident-Recovery-Update-April-16-2026-Drift-Updates',
    edition: 'Drift Incident Recovery Update (2026-04-16)',
    locator: 'Structured Security for Relaunch',
  },
  'DA-2.5a': {
    id: 'DA-2.5a',
    get text() {
      return `${BINANCE_INCIDENT_METADATA.title} (${BINANCE_INCIDENT_METADATA.binanceReportPublishedDate} initial findings report): ${BINANCE_INCIDENT_IMPACT.totalImpactedUsdDisplay} impacted (${BINANCE_INCIDENT_IMPACT.valuationCaveat}), with ${BINANCE_INCIDENT_IMPACT.frozenOrInterceptedUsdDisplay} frozen or intercepted.`
    },
    get sourceId() {
      return BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport
    },
    get edition() {
      return `Binance Initial Findings Report (${BINANCE_INCIDENT_METADATA.binanceReportPublishedDate})`
    },
    locator: 'Impact & Asset Recovery Summary',
  },
  'DA-2.5b': {
    id: 'DA-2.5b',
    get text() {
      const binanceStageExploit = getBinanceIncidentStage('signing-service-exploitation')
      const binanceStageRevoke = getBinanceIncidentStage('containment-and-eip7702-revocation')
      return `${binanceStageExploit.summary} ${BINANCE_INCIDENT_CONTAINMENT.keyFinding} ${binanceStageRevoke.summary}`
    },
    get sourceId() {
      return BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport
    },
    get edition() {
      return `Binance Initial Findings Report (${BINANCE_INCIDENT_METADATA.binanceReportPublishedDate})`
    },
    locator: 'What happened on 29 October',
  },
  'DA-2.5c': {
    id: 'DA-2.5c',
    get text() {
      const binanceStageA = getBinanceIncidentStage('engineer-a-supply-chain')
      const binanceStageB = getBinanceIncidentStage('engineer-b-social-engineering')
      const binanceStagePivot = getBinanceIncidentStage('internal-ai-tool-pivot')
      return `Three preparation stages in Binance’s report: (1) ${binanceStageA.dateDisplay}: ${binanceStageA.summary} (2) ${binanceStageB.dateDisplay}: ${binanceStageB.summary} (3) ${binanceStagePivot.dateDisplay}: ${binanceStagePivot.summary}`
    },
    get sourceId() {
      return BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport
    },
    get edition() {
      return `Binance Initial Findings Report (${BINANCE_INCIDENT_METADATA.binanceReportPublishedDate})`
    },
    locator: 'Attack Preparation',
  },
  'DA-2.5d': {
    id: 'DA-2.5d',
    get text() {
      return `${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.leadAgency} (${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.publishedDate}, updated ${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.modifiedDate}): ${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.theftScopeSummary} Campaign tracked as "${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.campaignName}".`
    },
    get sourceId() {
      return BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert
    },
    get edition() {
      return `FBI Public Alert (${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.publishedDate})`
    },
    locator: 'Narrative Body, Paragraph 1',
  },
  'DA-2.6': {
    id: 'DA-2.6',
    text: 'Chainalysis’s 2026 Crypto Crime Report introduction states that DPRK-linked hackers alone stole $2 billion in 2025, driven by mega-hacks most notably the February Bybit exploit at nearly $1.5 billion.',
    sourceId: 'Chainalysis-2026-Crypto-Crime-Report',
    edition: 'Chainalysis 2026 Crypto Crime Report Introduction (2026-01-08)',
    locator: 'Nation-state threats drive record volumes',
  },
  'DA-2.7': {
    id: 'DA-2.7',
    text: 'CertiK’s H1 2026 report recorded 52 verified physical coercion ("wrench attack") incidents worldwide (a 33.3% YoY increase, $124.1M recorded exposure), including 20 home invasions (up from 1 in H1 2025) and 16 kidnappings.',
    sourceId: 'CertiK-H1-2026-Physical-Coercion-and-Wrench-Attacks-Report',
    edition: 'CertiK H1 2026 Physical Coercion Report (2026-07-23)',
    locator: 'Executive Summary',
  },
  'DA-2.8': {
    id: 'DA-2.8',
    text: 'Address poisoning requires no victim private key: the attacker generates vanity lookalike addresses with its own keys and injects dust or zero-value history so the victim copies the spoofed recipient address.',
    sourceId: 'Blockchain-Address-Poisoning-Tsuchiya-et-al-arXiv-2501-16681',
    edition: 'Tsuchiya et al., arXiv:2501.16681v3 (2025-07-02)',
    locator: 'Abstract (p. 1) & §2.2 (p. 3)',
  },
  'DA-2.9a': {
    id: 'DA-2.9a',
    text: 'EIP-2612 extends ERC-20 with permit(), allowing a token holder’s signed off-chain EIP-712 message to modify the on-chain allowance mapping without submitting a transaction from msg.sender.',
    sourceId: 'EIP-2612-Permit-Extension-for-EIP-20-Signed-Approvals',
    edition: 'Ethereum EIP-2612 (Final, 2020-04-13)',
    locator: 'Abstract & Specification',
  },
  'DA-2.9b': {
    id: 'DA-2.9b',
    text: 'Uniswap Permit2 unifies SignatureTransfer (one-time, nonce-scoped off-chain transfer signatures) and AllowanceTransfer (time-bound standing approvals) over tokens approved to Permit2.',
    sourceId: 'Uniswap-Permit2-Signature-Based-Token-Approval-Overview',
    edition: 'Uniswap Permit2 Documentation',
    locator: 'Permit2 Overview',
  },
  'DA-3.1': {
    id: 'DA-3.1',
    text: 'In OASIS PKCS#11 v3.2, C_Sign signs single-part data passed by an authenticated session and returns a signature appendix over that input.',
    sourceId: 'PKCS11-V32-OS-OASIS',
    edition: 'OASIS PKCS#11 v3.2',
    locator: '§5.13.2 C_Sign',
  },
  'DA-3.1n': {
    id: 'DA-3.1n',
    text: 'OASIS PKCS#11 v3.2 defines session login, key-usage attributes (such as CKA_SIGN), and cryptographic mechanisms, and defines no blockchain transaction parser or transaction-level approval policy.',
    sourceId: 'PKCS11-V32-OS-OASIS',
    edition: 'OASIS PKCS#11 v3.2 (negative check)',
    locator: '§5.13.2 & whole specification',
  },
  'DA-3.2a': {
    id: 'DA-3.2a',
    text: 'IETF RATS draft-ietf-rats-pkix-key-attestation-08 specifies a vendor-agnostic PKIX Evidence format carrying claims about a cryptographic module (such as an HSM) and keys held inside it.',
    sourceId: 'draft-ietf-rats-pkix-key-attestation-08',
    edition: 'IETF RATS Internet-Draft -08 (2026-10-30)',
    locator: 'Abstract (p. 1)',
  },
  'DA-3.2b': {
    id: 'DA-3.2b',
    text: 'Thales Luna Public Key Confirmations provide cryptographic proof that a specific key was created inside and cannot leave an identified Luna HSM perimeter, establishing key residency rather than transaction authorization.',
    sourceId: 'Verifying-HSM-Authenticity-or-Key-Attestation-Thales-Luna',
    edition: 'Thales Luna 7 HSM Documentation',
    locator: 'Public Key Confirmations',
  },
  'DA-3.3': {
    id: 'DA-3.3',
    text: 'Securosys Smart Key Attributes (SKA) bind m-of-n authorization policies, timelocks, and key-blocking rules directly to keys and enforce them inside the HSM’s protected environment rather than in the host application.',
    sourceId: 'Securosys-Smart-Key-Attributes-SKA-and-Transaction-Security',
    edition: 'Securosys SKA & TSB Documentation',
    locator: 'Why SKA?',
  },
  'DA-3.5': {
    id: 'DA-3.5',
    text: 'Ledger Enterprise enforces Approval Rules inside the HSM at signing time and pairs human approvers with Personal Security Devices whose dedicated screen reads transactions from secure hardware rather than the browser page (noting API signers lack a second screen).',
    sourceId: 'The-security-model-Ledger-Enterprise',
    edition: 'Ledger Enterprise Security Model',
    locator: 'Three layers & What the device protects you from',
  },
  'DA-3.6': {
    id: 'DA-3.6',
    text: 'Turnkey deploys key generation, signing, and its policy engine inside secure enclaves (AWS Nitro Enclaves / QuorumOS) using cryptographic attestation to verify enclave identity and confirm only authorized code is running.',
    sourceId: 'Secure-enclaves-Turnkey',
    edition: 'Turnkey Security Architecture',
    locator: 'Architecture -> Secure enclaves',
  },
  'DA-3.7a': {
    id: 'DA-3.7a',
    text: 'AWS KMS integrates cryptographic attestation by checking measurements inside an AWS Nitro Enclave’s signed attestation document against measurement condition keys in the KMS key policy.',
    sourceId: 'Using-cryptographic-attestation-with-AWS-KMS-AWS-Nitro-Encla',
    edition: 'AWS KMS Nitro Enclaves Guide',
    locator: 'KMS key preparation',
  },
  'DA-3.7b': {
    id: 'DA-3.7b',
    text: 'The AWS Nitro System anchors secure boot in its dedicated Nitro Security Chip hardware root of trust before measuring and isolating Nitro Enclaves.',
    sourceId: 'The-Security-Design-of-the-AWS-Nitro-System',
    edition: 'AWS Nitro System Security Design Whitepaper',
    locator: 'The components of the Nitro System (doc p. 5)',
  },
  'DA-3.8a': {
    id: 'DA-3.8a',
    text: 'In the AWS KMS key-release pattern, KMS permits decrypt or data-key operations only when the caller presents an enclave-signed attestation document matching the KMS policy’s PCR measurements.',
    sourceId: 'Using-cryptographic-attestation-with-AWS-KMS-AWS-Nitro-Encla',
    edition: 'AWS KMS Nitro Enclaves Guide',
    locator: 'KMS key preparation',
  },
  'DA-3.8b': {
    id: 'DA-3.8b',
    text: 'Azure Secure Key Release (SKR) releases an HSM-protected exportable key from Azure Key Vault into an attested TEE’s memory when the attestation token’s certificate chains to a trusted CA and satisfies the release policy.',
    sourceId: 'Secure-Key-Release-with-Azure-Key-Vault-and-Azure-Confidenti',
    edition: 'Microsoft Azure Confidential Computing Docs',
    locator: 'Secure Key Release Overview',
  },
  'DA-3.9': {
    id: 'DA-3.9',
    text: 'Requests flow through Fireblocks’ SaaS Policy Service (and Signing/Approval Services) to the customer’s API Co-signer running in Intel SGX, AWS Nitro, or Google Cloud Confidential Spaces enclaves; the Co-signer holds MPC key shares or approval keys and invokes an optional customer-hosted HTTPS Callback Handler (without a Callback Handler, it automatically signs or approves all requests for that API user).',
    sourceId: 'API-Co-signers-Architecture-Overview-Fireblocks-Developer-Do',
    edition: 'Fireblocks Developer Docs',
    locator: 'API Co-signers Architecture Overview',
  },
  'DA-3.10': {
    id: 'DA-3.10',
    text: 'RFC 9591 (IRTF Informational, June 2024) specifies FROST, a two-round threshold Schnorr signature scheme allowing t-of-n participants to cooperate on a signature without reconstructing the secret key.',
    sourceId: 'RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS',
    edition: 'IRTF RFC 9591 (Informational, June 2024)',
    locator: 'Abstract',
  },
  'DA-3.11': {
    id: 'DA-3.11',
    text: 'IBM Offline Signing Orchestrator (OSO) enforces strict network isolation between online and offline (cold) signing environments, adding disconnected operations, time-based controls, and multi-party approval workflows.',
    sourceId: 'IBM-Offline-Signing-Orchestrator-OSO-Architecture-Documentat',
    edition: 'IBM OSO Architecture Documentation (2026-05-20)',
    locator: 'Opening section & Core Controls',
  },
  'DA-3.15': {
    id: 'DA-3.15',
    text: 'ERC-7730 (Draft) defines a JSON descriptor format supplying contract-call metadata so wallets and transaction simulation engines can display structured, human-verifiable details instead of raw hex.',
    sourceId: 'ERC-7730-Structured-Data-Clear-Signing-Format',
    edition: 'Ethereum ERC-7730 (Draft, 2024-02-07)',
    locator: 'Abstract',
  },
  'DA-8.1': {
    id: 'DA-8.1',
    text: 'Cloud Security Alliance’s analysis of the Agent Payments Protocol (AP2) identifies mandate spoofing and agent coercion threats and recommends hardware-backed keys, decentralized allowlists, and bounded Intent Mandate TTLs.',
    sourceId: 'Secure-Use-of-the-Agent-Payments-Protocol-AP2',
    edition: 'CSA Secure Use of AP2 (2025-10-06)',
    locator: 'Abstract & Mitigations',
  },
  'DA-8.2': {
    id: 'DA-8.2',
    text: 'An individual Internet-Draft (no working-group adoption or stream defined) specifies binding Falcon-1024 and ML-DSA-65 post-quantum credentials to x402 agentic payment authorization.',
    sourceId: 'Post-Quantum-Credential-Binding-for-x402-Agentic-Payment-Aut',
    edition: 'Individual Internet-Draft (2026-06-04)',
    locator: 'Abstract',
  },
  'DA-8.6a': {
    id: 'DA-8.6a',
    text: 'Coinbase Developer Platform (CDP) Wallets generate private keys and sign transactions inside AWS Nitro Enclaves (TEE) with automated pre-submission OFAC sanctions screening.',
    sourceId: 'Security-Coinbase-Developer-Documentation',
    edition: 'Coinbase CDP Security Docs',
    locator: 'Overview',
  },
  'DA-8.6b': {
    id: 'DA-8.6b',
    text: 'In Coinbase’s Wallet MCP eligible agent-wallet mode, an agent receives a dedicated wallet and an expiring signing grant with saved spending controls rather than unrestricted access to the owner’s main wallet.',
    sourceId: 'Wallet-MCP-Coinbase-Developer-Documentation',
    edition: 'Coinbase Wallet MCP Docs',
    locator: 'Choose how your agent acts -> Eligible agent-wallet mode',
  },
  'DA-10.1a': {
    id: 'DA-10.1a',
    text: 'DFNS documents HSM signing infrastructure explicitly as an alternative to MPC: wallet keys are encrypted (wrapped) by a customer HSM master key in a database and unwrapped inside HSM memory for signing.',
    sourceId: 'HSM-signing-infrastructure-DFNS-documentation',
    edition: 'Dfns HSM Infrastructure Docs',
    locator: 'HSM signing infrastructure opening',
  },
  'DA-10.1b': {
    id: 'DA-10.1b',
    text: 'The Dfns–Thales solution brief describes anchoring keys in customer-owned Thales Luna HSMs outside the Wallet-as-a-Service orchestration layer to avoid cloud-provider lock-in (without detailing MPC share splitting).',
    sourceId: 'Securing-Digital-Asset-Operations-with-Dfns-and-Thales-Solut',
    edition: 'Dfns & Thales Solution Brief Overview',
    locator: 'Overview',
  },
  'DA-10.1c': {
    id: 'DA-10.1c',
    text: 'The Thales–Fireblocks solution brief describes keeping cryptographic keys inside customer-owned, certified Thales Luna HSMs via Fireblocks KeyLink middleware.',
    sourceId: 'Securing-Digital-Asset-Keys-with-Thales-and-Fireblocks-Solut',
    edition: 'Thales & Fireblocks KeyLink Solution Brief',
    locator: 'Overview',
  },
  'DA-10.2': {
    id: 'DA-10.2',
    text: 'Securosys contrasts on-chain multisig, software-endpoint MPC (noting lack of native timelocks and host exposure), legacy policy-free HSMs, and HSMs enforcing multi-party authorization, timelocks, timeouts, and rule-change quorums.',
    sourceId: 'Securosys-Protecting-the-Crypto-Stash-Part-III-Multisig-MPC',
    edition: 'Securosys Blog Part III (2020-04-29)',
    locator: 'Body comparison',
  },
  'DA-10.3a': {
    id: 'DA-10.3a',
    text: 'Entrust nShield CodeSafe allows third-party developers to run custom code inside the module’s secure boundary while segregating CodeSafe applications from actual keys so CodeSafe can run without affecting FIPS 140 validation.',
    sourceId: 'CodeSafe-v13-9-9-Developer-Guide-nShield-Docs',
    edition: 'Entrust nShield CodeSafe v13.9.9 Guide',
    locator: 'Introduction',
  },
  'DA-10.3b': {
    id: 'DA-10.3b',
    text: 'Thales Luna Functionality Modules (FMs) allow signed custom security-sensitive code to be loaded by the HSM Admin (SO) and execute inside the HSM hardware as part of HSM firmware.',
    sourceId: 'FM-Architecture',
    edition: 'Thales Luna FM Architecture Docs',
    locator: 'FM Support within the HSM Hardware',
  },
  'DA-10.4n': {
    id: 'DA-10.4n',
    text: 'OASIS PKCS#11 v3.2 contains zero occurrences of MPC, multi-party, threshold signing, or Split Key mechanisms; any threshold or MPC execution behind an HSM API uses vendor-specific extensions.',
    sourceId: 'PKCS11-V32-OS-OASIS',
    edition: 'OASIS PKCS#11 v3.2 (negative check)',
    locator: 'Whole specification (0 matches)',
  },
  'DA-10.5': {
    id: 'DA-10.5',
    text: 'Ledger’s 2019 MPC readiness assessment notes that MPC’s endpoint and dissemination weaknesses would need to be addressed with secure execution environments, tamper-protected hardware, and a trusted display.',
    sourceId: 'Is-MPC-truly-ready-for-digital-asset-custody-Ledger',
    edition: 'Ledger Industry Assessment (2019-12-19)',
    locator: 'The way forward?',
  },
  'DA-10.8a': {
    id: 'DA-10.8a',
    text: 'KMIP 3.0 CSD02 (Committee Specification Draft, not an OASIS Standard) models a Split Key Managed Cryptographic Object whose split parts can be distributed across multiple key holders with a Split Key Threshold.',
    sourceId: 'Key-Management-Interoperability-Protocol-Specification-Versi',
    edition: 'OASIS KMIP 3.0 CSD02 (2026-05-07)',
    locator: '§2.2.8 Split Key',
  },
  'DA-10.8b': {
    id: 'DA-10.8b',
    text: 'KMIP 2.1 (OASIS Standard, December 2020) defines Create Split Key and Join Split Key operations for secret-shared split key objects, distinct from threshold MPC signing protocols.',
    sourceId: 'KMIP-V2-1-OASIS',
    edition: 'OASIS KMIP v2.1 Standard (2020-12-14)',
    locator: '§6.1.10 Create Split Key',
  },
  'DA-13.1': {
    id: 'DA-13.1',
    text: 'NIST FIPS 140-3 Implementation Guidance distinguishes the physical cryptographic module boundary (IG 1.A/1.B), Excluded Components inside the enclosure that must not compromise approved security (IG 2.3.D), the Approved Security Service Indicator (IG 2.4.A/C), and Software/Firmware Loading requiring prior validation (IG 10.3.F).',
    sourceId: 'NIST-FIPS140-3-IG-PQC',
    edition: 'NIST FIPS 140-3 IG (2026-08-19)',
    locator: 'IG 1.A/1.B, 2.3.D, 2.4.A/C, 10.3.F',
  },
  'DA-13.2a': {
    id: 'DA-13.2a',
    text: 'The BitForge disclosure (9 August 2023) documented missing zero-knowledge proofs in GG18 and GG20 threshold-ECDSA implementations allowing full private-key exfiltration in 16 to 1 billion signatures.',
    sourceId: 'BitForge-Fireblocks-researchers-uncover-vulnerabilities-in-o',
    edition: 'Fireblocks BitForge Disclosure (2023-08-09)',
    locator: 'BitForge Vulnerability Overview',
  },
  'DA-13.2b': {
    id: 'DA-13.2b',
    text: 'Advisory GHSA-h24c-6p6p-m3vx (1 September 2023) reports that in bnb-chain tss-lib <= 1.3.5 (GG18), a participant generating a Paillier modulus N with small factors (< 2^100) could steal secret shares in as little as sixteen signing attempts, remediated via CGGMP21 Paillier-Blum and No Small Factor proofs.',
    sourceId: 'bnb-chain-tss-lib-Security-Advisory-GHSA-h24c-6p6p-m3vx-Pail',
    edition: 'GitHub Advisory GHSA-h24c-6p6p-m3vx (2023-09-01)',
    locator: 'Impact',
  },
  'DA-13.2c': {
    id: 'DA-13.2c',
    text: 'The BitForge academic abstract (IACR ePrint 2023/1234, rev. 2025-02-26) summarizes four practical key-extraction attacks against threshold-ECDSA implementations requiring 10^6, 256, 16, and one signature, respectively.',
    sourceId: 'Practical-Key-Extraction-Attacks-in-Leading-MPC-Wallets-ePri',
    edition: 'IACR ePrint 2023/1234 Abstract (rev. 2025-02-26)',
    locator: 'Abstract',
  },
  'DA-13.3a': {
    id: 'DA-13.3a',
    text: 'Foreshadow (L1TF) demonstrated speculative-execution attacks against Intel SGX capable of reading SGX-protected memory and extracting the processor’s private attestation key.',
    sourceId: 'Foreshadow-Extracting-the-Keys-to-the-Intel-SGX-Kingdom-with',
    edition: 'Foreshadow Project Paper / Overview',
    locator: 'Introduction -> Foreshadow',
  },
  'DA-13.3b': {
    id: 'DA-13.3b',
    text: 'ÆPIC Leak exploited an architectural Intel CPU APIC MMIO bug on affected 10th–12th generation processors, putting unpatched Intel SGX enclaves at risk from privileged host attackers.',
    sourceId: 'AEPIC-Leak-Architecturally-Leaking-Uninitialized-Data-from-t',
    edition: 'ÆPIC Leak Disclosure',
    locator: 'Questions & Answers',
  },
  'DA-13.3c': {
    id: 'DA-13.3c',
    text: 'BadRAM (IEEE S&P 2025) used DRAM SPD memory aliasing to bypass AMD SEV-SNP protections, whereas the authors found Intel TDX and scalable Intel SGX boot-time alias countermeasures resisted the attack.',
    sourceId: 'BadRAM-Practical-Memory-Aliasing-Attacks-on-Trusted-Executio',
    edition: 'BadRAM Paper / Overview (IEEE S&P 2025)',
    locator: 'What about other technologies like Intel SGX and Arm CCA?',
  },
  'DA-13.3d': {
    id: 'DA-13.3d',
    text: 'Battering RAM (IEEE S&P 2026) demonstrated low-cost DDR4 memory-bus interposer attacks breaking Intel Scalable SGX and AMD SEV-SNP (not Intel TDX).',
    sourceId: 'Battering-RAM-Low-Cost-Interposer-Attacks-on-Confidential-Co',
    edition: 'Battering RAM Overview (IEEE S&P 2026)',
    locator: 'Overview',
  },
  'DA-13.3e': {
    id: 'DA-13.3e',
    text: 'TEE.fail (IEEE S&P 2026) demonstrated DDR5 memory-bus interposer attacks breaking Intel TDX and AMD SEV-SNP even with Ciphertext Hiding enabled, extracting attestation keys from updated systems.',
    sourceId: 'TEE-fail-Breaking-Hardware-Based-Confidential-Computing-Memo',
    edition: 'TEE.fail Overview (IEEE S&P 2026)',
    locator: 'Overview',
  },
  'DA-13.3f': {
    id: 'DA-13.3f',
    text: 'The Confidential Computing Consortium technical analysis (v1.3) frames hardware-based TEE threat models as explicitly excluding availability/DoS attacks, invasive physical hardware attacks, and certain side channels.',
    sourceId: 'Confidential-Computing-Consortium-A-Technical-Analysis-of-Co',
    edition: 'CCC Technical Analysis v1.3',
    locator: '§5.2.2 Out-of-Scope (p. 12)',
  },
  'DA-13.3g': {
    id: 'DA-13.3g',
    text: 'NIST IR 8320E (Initial Public Draft, May 2026) explains that attestation proves measured environment state and relies on relying-party verification of hardware vendor endorsements against security policies (not code correctness or liveness alone).',
    sourceId: 'NIST IR 8320E',
    edition: 'NIST IR 8320E ipd (May 2026)',
    locator: '§3 Stage 0 / Attestation (p. 15)',
  },
  'DA-13.5': {
    id: 'DA-13.5',
    text: 'Google Cloud’s published reference architecture (5 April 2023) runs MPC signing workers inside Confidential Space TEEs with key-share wrapping rooted in Cloud KMS / Cloud HSM.',
    sourceId: 'Google-Cloud-Multi-Party-Compute-Custody-Architecture-with-C',
    edition: 'Google Cloud Architecture Blog (2023-04-05)',
    locator: 'Reference Architecture Overview',
  },
  'DA-13.6': {
    id: 'DA-13.6',
    text: 'ERC-7730 versions its descriptor $schema with Semantic Versioning and explicitly states that curation and registry of descriptors are out of scope, warning that any registry or wallet ecosystem MUST assume it will be targeted.',
    sourceId: 'ERC-7730-Structured-Data-Clear-Signing-Format',
    edition: 'Ethereum ERC-7730 (Draft)',
    locator: 'Security Considerations -> Registry poisoning',
  },
  'DA-13.7': {
    id: 'DA-13.7',
    text: 'ERC-8176 (Draft, 26 February 2026) defines EAS descriptor attestations for ERC-7730 with uint64 expirationTime (0 = never expires, relying on active revocation via eas.revokeOffchain(uid)) and recommends bounded future expirations.',
    sourceId: 'ERC-8176-Descriptor-Attestations-for-ERC-7730',
    edition: 'Ethereum ERC-8176 (Draft, 2026-02-26)',
    locator: 'Lifecycle Guidance & Revocation',
  },
} as const satisfies Record<string, SourceClaim>

export type SourceClaimId = keyof typeof SOURCE_CLAIMS

export function claimText(id: SourceClaimId): string {
  // eslint-disable-next-line security/detect-object-injection
  return SOURCE_CLAIMS[id].text
}
