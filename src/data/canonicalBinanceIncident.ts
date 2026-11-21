// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Canonical evidence record for the 29 October 2026 Binance security incident.
 *
 * Single source of truth imported across custody and AI-threat learning modules
 * so chronology, actor roles, published figures, containment mechanics, and
 * official attribution remain consistent. Module-specific pedagogical overlays
 * (such as local AI causal-role classifications) live in consuming modules
 * rather than inside this shared record.
 */

export const BINANCE_INCIDENT_SOURCE_IDS = {
  binanceInitialReport: 'Binance-Security-Incident-Update-and-Initial-Findings-Report',
  fbiTraderTraitorAlert: 'North-Korea-Responsible-for-6-Billion-Binance-Attack-FBI',
} as const

export type BinanceIncidentSourceId =
  (typeof BINANCE_INCIDENT_SOURCE_IDS)[keyof typeof BINANCE_INCIDENT_SOURCE_IDS]

/**
 * Reusable causal-role classification type for AI-threat learning modules.
 * Assigned locally by consumers; intentionally omitted from the shared chronology.
 */
export type BinanceIncidentCausalRole = 'none shown' | 'not stated' | 'tool-mediated'

export type BinanceIncidentPhase = 'preparation' | 'execution' | 'containment'

export interface BinanceIncidentMetadata {
  readonly incidentId: string
  readonly title: string
  readonly incidentDate: string
  readonly binanceReportPublishedDate: string
  readonly fbiAlertPublishedDate: string
  readonly fbiAlertModifiedDate: string
  readonly epistemicStatus: string
  readonly sourceIds: readonly BinanceIncidentSourceId[]
}

export interface BinanceAssetOutflow {
  readonly networkOrAsset: string
  readonly amountDisplay: string
  readonly windowUtc: string | null
  readonly walletContext: string
  readonly sourceId: BinanceIncidentSourceId
}

export interface BinanceIncidentImpact {
  readonly totalImpactedUsdApprox: number
  readonly totalImpactedUsdDisplay: string
  readonly fbiMinimumTheftUsdDisplay: string
  readonly frozenOrInterceptedUsdApprox: number
  readonly frozenOrInterceptedUsdDisplay: string
  readonly valuationCaveat: string
  readonly userImpactPolicy: string
  readonly replenishmentAsOfDate: string
  readonly replenishmentStatus: string
  readonly publishedAssetOutflows: readonly BinanceAssetOutflow[]
  readonly sourceIds: readonly BinanceIncidentSourceId[]
}

export interface BinanceIncidentStage {
  readonly id:
    | 'engineer-a-supply-chain'
    | 'engineer-b-social-engineering'
    | 'internal-ai-tool-pivot'
    | 'signing-service-exploitation'
    | 'containment-and-eip7702-revocation'
  readonly sequenceOrder: number
  readonly phase: BinanceIncidentPhase
  readonly date: string
  readonly dateDisplay: string
  readonly title: string
  readonly actors: readonly string[]
  readonly summary: string
  readonly technicalDetails: readonly string[]
  readonly sourceId: BinanceIncidentSourceId
}

export interface BinanceIncidentContainment {
  readonly offChainActionsTaken: readonly string[]
  readonly eip7702Exploitation: {
    readonly signingTransactionsCount: number
    readonly nonceManipulationSummary: string
    readonly delegationEffect: string
    readonly privateKeyExposureClaim: string
    readonly hotWalletArchitecture: string
    readonly targetHotWalletLabel: string
  }
  readonly keyFinding: string
  readonly verbatimContainmentQuotes: readonly string[]
  readonly onChainRevocation: {
    readonly procedureSummary: string
    readonly completedAtUtc: string
    readonly targetAddressClearedTo: string
    readonly finalUnauthorizedTransfer: {
      readonly amountDisplay: string
      readonly finalizedAtUtc: string
      readonly note: string
    }
  }
  readonly sourceId: BinanceIncidentSourceId
}

export interface BinanceIncidentAttribution {
  readonly separationNote: string
  readonly victimStatementReference: {
    readonly organization: string
    readonly publishedDate: string
    readonly statementSummary: string
    readonly priorThreatContext: string
    readonly remediationAsOfDate: string
    readonly remediationActionsSummary: readonly string[]
    readonly sourceId: BinanceIncidentSourceId
  }
  readonly officialGovernmentAttribution: {
    readonly leadAgency: string
    readonly partnerAgencies: readonly string[]
    readonly publishedDate: string
    readonly modifiedDate: string
    readonly attributedStateActor: string
    readonly campaignName: string
    readonly theftScopeSummary: string
    readonly observedLaunderingAndGuidance: string
    readonly sourceId: BinanceIncidentSourceId
  }
}

export interface CanonicalBinanceIncidentRecord {
  readonly metadata: BinanceIncidentMetadata
  readonly impact: BinanceIncidentImpact
  readonly stages: readonly BinanceIncidentStage[]
  readonly containment: BinanceIncidentContainment
  readonly attribution: BinanceIncidentAttribution
}

export const BINANCE_INCIDENT_METADATA = {
  incidentId: 'binance-2026-10-29',
  title: '29 October 2026 Binance Security Incident',
  incidentDate: '2026-10-29',
  binanceReportPublishedDate: '2026-11-03',
  fbiAlertPublishedDate: '2026-10-31',
  fbiAlertModifiedDate: '2026-11-02',
  epistemicStatus:
    'Initial findings report; investigation remains ongoing and subject to further independent review, reconciliation, and market price volatility.',
  sourceIds: [
    BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert,
  ],
} as const satisfies BinanceIncidentMetadata

export const BINANCE_INCIDENT_IMPACT = {
  totalImpactedUsdApprox: 6_340_000_000,
  totalImpactedUsdDisplay: 'Approximately USD 6.34 billion',
  fbiMinimumTheftUsdDisplay: 'More than $6 billion USD',
  frozenOrInterceptedUsdApprox: 2_850_000_000,
  frozenOrInterceptedUsdDisplay: 'Approximately USD 2.85 billion',
  valuationCaveat: 'Subject to reconciliation and market price volatility.',
  userImpactPolicy:
    'Binance stated it will absorb the financial impact of the stolen funds, not users, and set aside more than 100% of the funds required to cover the loss.',
  replenishmentAsOfDate: '2026-10-31',
  replenishmentStatus:
    'As of 31 October 2026, 98% of the impacted token assets had been replenished and were verifiable on Proof of Reserves; Binance stated it was purchasing the outstanding, more illiquid assets.',
  publishedAssetOutflows: [
    {
      networkOrAsset: 'XRP',
      amountDisplay: '233.46 million XRP',
      windowUtc: '2026-10-29T20:05:00Z/2026-10-29T20:09:00Z',
      walletContext:
        'Five Binance hot wallets sent 233.46 million XRP to an attacker-controlled address between 20:05 UTC and 20:09 UTC.',
      sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    },
    {
      networkOrAsset: 'SOL (Solana)',
      amountDisplay: 'Approximately 970,500 SOL',
      windowUtc: null,
      walletContext:
        'Binance hot wallets on Solana sent approximately 970,500 SOL to attacker-controlled addresses (exact timestamp not stated in report).',
      sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    },
    {
      networkOrAsset: 'OP (Optimism)',
      amountDisplay: '44.2 million OP',
      windowUtc: null,
      walletContext:
        'Binance hot wallets on Optimism sent 44.2 million OP to attacker-controlled addresses (exact timestamp not stated in report).',
      sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    },
    {
      networkOrAsset: 'BTC',
      amountDisplay: '18,270 BTC',
      windowUtc: null,
      walletContext:
        'Binance hot wallet sent 18,270 BTC to an attacker-controlled address after the initial internal large-volume transfer alert (exact timestamp not stated in report).',
      sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    },
    {
      networkOrAsset: 'ETH',
      amountDisplay: '2,961.9 ETH',
      windowUtc: '2026-10-29T23:56:00Z',
      walletContext:
        'Final unauthorized transfer of 2,961.9 ETH previously broadcast and pending, finalised on-chain at 23:56 UTC; no further unauthorised transfers were observed after.',
      sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    },
  ],
  sourceIds: [
    BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert,
  ],
} as const satisfies BinanceIncidentImpact

export const BINANCE_INCIDENT_STAGES = [
  {
    id: 'engineer-a-supply-chain',
    sequenceOrder: 1,
    phase: 'preparation',
    date: '2026-06',
    dateDisplay: 'June 2026',
    title: 'Supply chain attack via tampered Homebrew installation',
    actors: ['Engineer A (Wallet DevOps)'],
    summary:
      'Engineer A from Wallet DevOps downloaded a tampered Homebrew installation in order to install a popular AI coding tool after searching for it on a search engine. Binance’s security team detected the anomaly, replaced the device, and rotated all related credentials proactively, though Engineer A’s role and related colleagues on the wallet infrastructure team were exposed to the hacker.',
    technicalDetails: [
      'Initial lure: searching for a popular AI coding tool on a search engine led Engineer A to download a "tampered Homebrew installation" (Binance report phrasing).',
      'Proactive response: Binance security detected the anomaly, replaced the device, and rotated all related credentials.',
      'Residual exposure: Engineer A’s role and related colleagues on the wallet infrastructure team were exposed to the attacker.',
    ],
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
  },
  {
    id: 'engineer-b-social-engineering',
    sequenceOrder: 2,
    phase: 'preparation',
    date: '2026-09',
    dateDisplay: 'September 2026',
    title: 'Social engineering interviews and 0-day pyenv component replacement',
    actors: ['Software Engineer B'],
    summary:
      'Software Engineer B was contacted on a legitimate job-hunting platform by an individual posing as a Project Director, completed a live video first-round interview with a purported HR representative who shared social media photos and videos to build trust, and completed a second-round interview on a popular social chat app with a purported CEO of a fictitious company before downloading a malicious coding "assignment" repository onto his work computer.',
    technicalDetails: [
      'Social engineering chain: legitimate job-hunting platform outreach (purported Project Director) -> live video first-round interview with purported HR representative sharing personal social media photos and videos -> second-round interview in a popular social chat app with purported CEO of a fictitious company -> malicious coding "assignment" repository executed during setup.',
      'Prose vs. script listing: Binance’s narrative prose refers to "replacing a legitimate development tool component with a malicious version", while the script step listing explicitly names pyenv under Homebrew.',
      '0-day script steps (not detected by endpoint security protection tools at the time): CREATE /opt/homebrew/Cellar/pyenv/2.8.0/libexec/pyenv_ -> MODIFY pyenv_ (3,414 B) -> DELETE .../libexec/pyenv (3,344 B) -> RENAME pyenv_ to pyenv (3,414 B) -> DELETE /opt/homebrew/bin/pyenv (3,414 B) -> ln (create a new symlink) + spawn zsh.',
      'Post-execution behavior: executed commands, established communication with an attacker-controlled external server, and took steps to conceal malicious activity and remove traces of the compromise.',
    ],
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
  },
  {
    id: 'internal-ai-tool-pivot',
    sequenceOrder: 3,
    phase: 'preparation',
    date: '2026-10-20',
    dateDisplay: '20 October 2026',
    title: 'Use of an internal AI tool as a springboard',
    actors: [
      'Software Engineer B (compromised computer)',
      'Wallet DevOps Engineer A',
      'Wallet Software Engineer C',
    ],
    summary:
      'The attacker leveraged the compromised computer of Software Engineer B and used an internal AI tool as a springboard to gain control over Wallet DevOps Engineer A and Wallet Software Engineer C, discovering a container deployment permission token on Engineer A’s computer.',
    technicalDetails: [
      'Source phrasing: the 20 October 2026 entry states the attacker "used an internal AI tool" as a springboard (the Attack Preparation preamble also refers to "compromised internal AI tooling").',
      'Lateral movement targets: Wallet DevOps Engineer A and Wallet Software Engineer C.',
      'Token discovery: attacker discovered a container deployment permission token on Wallet DevOps Engineer A’s computer.',
    ],
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
  },
  {
    id: 'signing-service-exploitation',
    sequenceOrder: 4,
    phase: 'execution',
    date: '2026-10-29',
    dateDisplay:
      '29 October 2026 (17:15–19:56, timezone omitted in source; outflows 20:05–23:56 UTC)',
    title:
      'Container deployment, internal signing-service abuse, multi-chain outflows, and EIP-7702 delegation',
    actors: [
      'Wallet Software Engineer C (compromised workstation)',
      'Wallet DevOps Engineer A (stolen container deployment credentials)',
    ],
    summary:
      'On 29 October between 17:15 and 19:56 (timezone omitted in source), the attacker logged onto Software Engineer C’s computer using credentials stolen from Wallet DevOps Engineer A, deployed a container, and triggered a malicious script to exploit unauthorized access to an internal wallet signing service outside the normal withdrawal process.',
    technicalDetails: [
      '17:15–19:56 (timezone omitted in Binance’s report): logged onto Software Engineer C’s computer using Engineer A’s stolen credentials, deployed a container, and triggered a malicious script.',
      '20:05–20:09 UTC: five Binance hot wallets sent 233.46 million XRP to an attacker-controlled address.',
      'Solana, Optimism, and Bitcoin outflows: Binance hot wallets sent approximately 970,500 SOL and 44.2 million OP; Binance received an internal large-volume transfer alert and began investigating; a Binance hot wallet sent 18,270 BTC.',
      'EIP-7702 delegation: attacker used the signing service to submit 50 signing transactions manipulating the account nonce and establishing malicious EIP-7702 delegation authorizations, giving an attacker-controlled smart contract partial execution rights over a Binance hot wallet "without exposing the private key".',
      '23:56 UTC: final unauthorized transfer of 2,961.9 ETH (previously broadcast and pending) finalised on-chain; no further unauthorised transfers were observed after.',
    ],
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
  },
  {
    id: 'containment-and-eip7702-revocation',
    sequenceOrder: 5,
    phase: 'containment',
    date: '2026-10-30',
    dateDisplay: '29–30 October 2026 (revocation completed at 00:10 UTC on 30 October)',
    title: 'Off-chain containment, MPC constraints, and EIP-7702 zero-address revocation',
    actors: [
      'Binance security and wallet engineering teams',
      'Law enforcement, blockchain intelligence firms, and industry partners',
    ],
    summary:
      'Binance suspended withdrawals, shut down hot wallet services, and coordinated freezes totaling approximately USD 2.85 billion, but off-chain service halts did not automatically invalidate existing on-chain EIP-7702 authorizations. Because the MPC hot wallet had no single private key for immediate revocation, Binance developed and executed a specialized MPC procedure and sent a new authorization from Binance14 to the zero address at 00:10 UTC on 30 October 2026.',
    technicalDetails: [
      'Off-chain measures: suspended withdrawals, shut down hot wallet services, and coordinated with partners to freeze approximately USD 2.85 billion in assets (subject to reconciliation and market price volatility).',
      'On-chain persistence: malicious EIP-7702 authorizations existed on-chain and operated independently of Binance’s normal withdrawal infrastructure.',
      'MPC constraint: because the hot wallet used Multi-Party Computation (MPC), there was no single private key to immediately revoke the malicious EIP-7702 authorizations, requiring a specialized revocation procedure.',
      '00:10 UTC on 30 October 2026: Binance executed a new authorization from the Binance14 hot wallet to the zero address, clearing the EIP-7702 delegation code.',
    ],
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
  },
] as const satisfies readonly BinanceIncidentStage[]

export type BinanceIncidentStageId = (typeof BINANCE_INCIDENT_STAGES)[number]['id']

export type BinanceAiBranchStageId =
  'engineer-a-supply-chain' | 'engineer-b-social-engineering' | 'internal-ai-tool-pivot'

export function getBinanceIncidentStage(id: BinanceIncidentStageId): BinanceIncidentStage {
  const stage = BINANCE_INCIDENT_STAGES.find((entry) => entry.id === id)
  if (!stage) {
    throw new Error(`[canonicalBinanceIncident] Unknown incident stage: "${id}"`)
  }
  return stage
}

export const BINANCE_INCIDENT_CONTAINMENT = {
  offChainActionsTaken: [
    'Suspended withdrawals to restrict further outflows',
    'Shut down hot wallet services',
    'Coordinated with law enforcement, blockchain intelligence firms, and industry partners to freeze affected tokens (approximately USD 2.85 billion frozen or intercepted)',
  ],
  eip7702Exploitation: {
    signingTransactionsCount: 50,
    nonceManipulationSummary:
      'Attackers submitted 50 signing transactions via the internal wallet signing service to manipulate the account nonce and establish malicious EIP-7702 delegation authorizations.',
    delegationEffect:
      'Gave an attacker-controlled smart contract partial execution rights over a Binance hot wallet, operating on-chain independently of Binance’s normal withdrawal infrastructure.',
    privateKeyExposureClaim:
      'EIP-7702 allows an account to delegate certain execution rights to a smart contract without exposing the private key.',
    hotWalletArchitecture:
      'Multi-Party Computation (MPC); there was no single private key that could be used to immediately revoke the malicious EIP-7702 authorizations.',
    targetHotWalletLabel: 'Binance14',
  },
  keyFinding:
    'Suspending withdrawals and shutting down hot wallet services did not automatically invalidate existing on-chain EIP-7702 authorizations; additional on-chain transactions were needed to revoke them.',
  verbatimContainmentQuotes: [
    'However, suspending withdrawals alone could not stop all unauthorized asset movements. The malicious EIP-7702 authorizations existed on-chain and operated independently of Binance’s normal withdrawal infrastructure.',
    'Furthermore, suspending withdrawals and shutting down hot wallet services did not automatically invalidate existing on-chain authorizations.',
  ],
  onChainRevocation: {
    procedureSummary:
      'Because the MPC hot wallet had no single private key to immediately revoke the malicious EIP-7702 authorizations, Binance developed and executed a specialized MPC procedure and sent a new authorization clearing the EIP-7702 delegation code.',
    completedAtUtc: '2026-10-30T00:10:00Z',
    targetAddressClearedTo: 'the zero address',
    finalUnauthorizedTransfer: {
      amountDisplay: '2,961.9 ETH',
      finalizedAtUtc: '2026-10-29T23:56:00Z',
      note: 'Transaction had previously been broadcast and remained pending before subsequently finalising on-chain at 23:56 UTC; no further unauthorised transfers were observed after.',
    },
  },
  sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
} as const satisfies BinanceIncidentContainment

export const BINANCE_INCIDENT_ATTRIBUTION = {
  separationNote:
    'Binance’s 2026-11-03 initial findings report and the FBI’s 2026-10-31 public alert (updated 2026-11-02) are tracked separately with distinct source IDs and publication dates.',
  victimStatementReference: {
    organization: 'Binance',
    publishedDate: '2026-11-03',
    statementSummary:
      'Binance’s 3 November 2026 initial findings report states: "The latest information released by the Federal Bureau of Investigation indicates that the Democratic People’s Republic of Korea is responsible for this incident."',
    priorThreatContext:
      'Throughout 2026, Binance’s security team detected and prevented 57 suspected North Korea-linked cyber threat cases; Binance notes its own report presents initial findings while investigation and independent review remain ongoing.',
    remediationAsOfDate: '2026-11-03',
    remediationActionsSummary: [
      'Rebuilt the affected wallet system in a new environment',
      'Rebuilt the affected internal AI tool and access controls',
      'Replaced affected devices and decommissioned credentials and tokens related to affected engineers',
      'Completed enhanced security scans across all employee devices',
      'Enhanced AI-based behavioural anomaly detection and strengthened wallet-service risk controls',
      'Engaged independent third-party cybersecurity experts for further review',
    ],
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
  },
  officialGovernmentAttribution: {
    leadAgency: 'Federal Bureau of Investigation (FBI)',
    partnerAgencies: ['USSS', 'IRS-CI'],
    publishedDate: '2026-10-31',
    modifiedDate: '2026-11-02',
    attributedStateActor: "Democratic People's Republic of Korea (North Korea)",
    campaignName: 'TraderTraitor',
    theftScopeSummary:
      "The FBI advised that the Democratic People's Republic of Korea (North Korea) was responsible for the theft of more than $6 billion USD in virtual assets from cryptocurrency exchange Binance, on or about October 29, 2026.",
    observedLaunderingAndGuidance:
      'FBI, together with partners at the USSS and IRS-CI, observed TraderTraitor actors converting stolen assets primarily into Ether (ETH), assessed expected further laundering via DeFi and instant swap services, and urged THORNode operators, RPC node operators, instant exchanges, DeFi services, blockchain analytics firms, and other virtual asset service providers to block transactions with or derived from listed TraderTraitor ETH, BTC, and SOL addresses.',
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert,
  },
} as const satisfies BinanceIncidentAttribution

export const CANONICAL_BINANCE_INCIDENT = {
  metadata: BINANCE_INCIDENT_METADATA,
  impact: BINANCE_INCIDENT_IMPACT,
  stages: BINANCE_INCIDENT_STAGES,
  containment: BINANCE_INCIDENT_CONTAINMENT,
  attribution: BINANCE_INCIDENT_ATTRIBUTION,
} as const satisfies CanonicalBinanceIncidentRecord
