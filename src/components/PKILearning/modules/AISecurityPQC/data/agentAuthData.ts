// SPDX-License-Identifier: GPL-3.0-only
import type { AgentIdentityProfile, DelegationChainLink, CommerceFlow } from './aiSecurityConstants'

// ── Agent Identity Profiles ───────────────────────────────────────────────

export const AGENT_IDENTITY_PROFILES: AgentIdentityProfile[] = [
  {
    id: 'autonomous-api',
    name: 'Autonomous API Agent',
    type: 'autonomous-service',
    description:
      'A fully autonomous agent that operates independently — monitoring systems, executing trades, or managing infrastructure. Has its own long-lived identity (X.509 cert or API key) not tied to a specific user session.',
    typicalCredentialLifetimeHours: 8760, // 1 year
    renewalStrategy: 'Certificate rotation via ACME/EST with 90-day renewal cycle',
    hndlExposureNotes:
      "Long-lived credentials are prime HNDL targets. A CRQC could forge the agent's identity and impersonate it indefinitely. High priority for PQC migration.",
  },
  {
    id: 'human-delegated',
    name: 'Human-Delegated Agent',
    type: 'human-delegated',
    description:
      'An agent authorized by a human to perform specific tasks on their behalf — booking flights, making purchases, or filing documents. Receives a scoped delegation token with time and action constraints.',
    typicalCredentialLifetimeHours: 1,
    renewalStrategy:
      'Per-session delegation token issued by identity provider. Short-lived by design. Refreshed via OAuth2 DPoP with proof-of-possession.',
    hndlExposureNotes:
      "Short credential lifetime reduces HNDL risk, but the delegation signing key (human's private key) is the critical target. If the human's key is compromised via CRQC, all delegation tokens can be forged.",
  },
  {
    id: 'multi-coordinator',
    name: 'Multi-Agent Coordinator',
    type: 'multi-agent-coordinator',
    description:
      'An orchestrator agent that coordinates multiple sub-agents — distributing tasks, aggregating results, and enforcing policies. Must authenticate to each sub-agent and manage delegation chains.',
    typicalCredentialLifetimeHours: 24,
    renewalStrategy:
      'Rolling credential with cascading delegation. Coordinator cert renewed daily; sub-agent tokens derived with reduced scope and shorter lifetime.',
    hndlExposureNotes:
      'Coordinator credentials unlock access to all downstream agents. Highest-value HNDL target in the delegation chain. Must use PQC signing to prevent chain-wide impersonation.',
  },
]

// ── Delegation Chain Templates ────────────────────────────────────────────

export interface DelegationChainTemplate {
  id: string
  name: string
  description: string
  agentType: string
  links: DelegationChainLink[]
}

export const DELEGATION_CHAIN_TEMPLATES: DelegationChainTemplate[] = [
  {
    id: 'direct-service',
    name: 'Direct Service Access',
    description: 'User directly authorizes an agent to access a single service.',
    agentType: 'human-delegated',
    links: [
      {
        from: 'User',
        to: 'Agent',
        credentialType: 'jwt-dpop',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 512,
        tokenSizePQC: 3840,
        quantumVulnerable: true,
      },
      {
        from: 'Agent',
        to: 'Service',
        credentialType: 'mtls',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 800,
        tokenSizePQC: 4600,
        quantumVulnerable: true,
      },
    ],
  },
  {
    id: 'two-hop-trading',
    name: 'Trading Bot with Market Data',
    description:
      'Portfolio manager delegates to a trading bot, which delegates to a market data agent for real-time feeds.',
    agentType: 'human-delegated',
    links: [
      {
        from: 'Portfolio Manager',
        to: 'Trading Bot',
        credentialType: 'x509-cert',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 1200,
        tokenSizePQC: 5400,
        quantumVulnerable: true,
      },
      {
        from: 'Trading Bot',
        to: 'Market Data Agent',
        credentialType: 'jwt-dpop',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 600,
        tokenSizePQC: 3900,
        quantumVulnerable: true,
      },
      {
        from: 'Market Data Agent',
        to: 'Exchange API',
        credentialType: 'mtls',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 800,
        tokenSizePQC: 4600,
        quantumVulnerable: true,
      },
    ],
  },
  {
    id: 'multi-agent-procurement',
    name: 'Multi-Agent Procurement',
    description:
      'Enterprise procurement coordinator delegates to sourcing agents and approval agents across organizations.',
    agentType: 'multi-agent-coordinator',
    links: [
      {
        from: 'Procurement Director',
        to: 'Coordinator Agent',
        credentialType: 'x509-cert',
        signingAlgorithm: 'RSA-2048',
        tokenSizeClassical: 2048,
        tokenSizePQC: 5800,
        quantumVulnerable: true,
      },
      {
        from: 'Coordinator Agent',
        to: 'Sourcing Agent',
        credentialType: 'jwt-dpop',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 600,
        tokenSizePQC: 3900,
        quantumVulnerable: true,
      },
      {
        from: 'Coordinator Agent',
        to: 'Approval Agent',
        credentialType: 'jwt-dpop',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 600,
        tokenSizePQC: 3900,
        quantumVulnerable: true,
      },
      {
        from: 'Sourcing Agent',
        to: 'Supplier API',
        credentialType: 'oauth2-client-cert',
        signingAlgorithm: 'ECDSA P-256',
        tokenSizeClassical: 900,
        tokenSizePQC: 4700,
        quantumVulnerable: true,
      },
    ],
  },
]

// ── Agentic Commerce Flows ────────────────────────────────────────────────

export const COMMERCE_FLOWS: CommerceFlow[] = [
  {
    id: 'simple-purchase',
    name: 'Simple Agent Purchase',
    scenario: 'simple-purchase',
    description:
      'A shopping agent purchases an item on behalf of a user. Straightforward delegation with a single transaction.',
    steps: [
      {
        id: 'sp-1',
        order: 1,
        label: 'User Delegates Authority',
        fromActor: 'user',
        toActor: 'buyer-agent',
        description:
          'User signs a delegation token granting the buyer agent authority to purchase items up to a spending limit, with an expiration time.',
        cryptoUsed: ['ECDSA P-256 (delegation signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 2,
        pqcLatencyMs: 3,
      },
      {
        id: 'sp-2',
        order: 2,
        label: 'Agent Browses & Selects',
        fromActor: 'buyer-agent',
        toActor: 'seller-agent',
        description:
          'Buyer agent queries seller agent catalogs via API. Session encrypted with TLS 1.3.',
        cryptoUsed: ['ECDH P-256 (TLS 1.3)', 'AES-256-GCM'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 (hybrid TLS 1.3)',
        latencyMs: 50,
        pqcLatencyMs: 55,
      },
      {
        id: 'sp-3',
        order: 3,
        label: 'Agent Signs Purchase Order',
        fromActor: 'buyer-agent',
        toActor: 'seller-agent',
        description:
          'Buyer agent creates and signs a purchase order with its delegation-derived key. Includes spending proof and delegation chain.',
        cryptoUsed: ['ECDSA P-256 (PO signing)', 'SHA-256 (PO hash)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44',
        latencyMs: 3,
        pqcLatencyMs: 4,
      },
      {
        id: 'sp-4',
        order: 4,
        label: 'Seller Verifies Delegation',
        fromActor: 'seller-agent',
        toActor: 'payment-service',
        description:
          'Seller agent verifies the delegation chain back to the human user, then forwards payment request to payment service.',
        cryptoUsed: ['ECDSA P-256 (chain verification)', 'ECDSA P-256 (payment auth)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 15,
        pqcLatencyMs: 18,
      },
      {
        id: 'sp-5',
        order: 5,
        label: 'Payment Settlement',
        fromActor: 'payment-service',
        toActor: 'buyer-agent',
        description:
          'Payment service processes the transaction and returns a signed receipt to both buyer and seller agents.',
        cryptoUsed: ['RSA-2048 (receipt signing)', 'AES-256-GCM (receipt encryption)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 100,
        pqcLatencyMs: 105,
      },
    ],
  },
  {
    id: 'multi-agent-negotiation',
    name: 'Multi-Agent Negotiation',
    scenario: 'multi-agent-negotiation',
    description:
      'A buyer agent negotiates with a seller agent, mediated by an arbiter agent. Involves multiple rounds of signed offers and counteroffers.',
    steps: [
      {
        id: 'mn-1',
        order: 1,
        label: 'Buyer Opens Negotiation',
        fromActor: 'buyer-agent',
        toActor: 'arbiter',
        description:
          'Buyer agent submits a signed opening offer to the arbiter. Includes budget constraints (encrypted) and item requirements.',
        cryptoUsed: ['ECDSA P-256 (offer signing)', 'ECDH P-256 (budget encryption)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44 + ML-KEM-768',
        latencyMs: 5,
        pqcLatencyMs: 8,
      },
      {
        id: 'mn-2',
        order: 2,
        label: 'Arbiter Relays to Seller',
        fromActor: 'arbiter',
        toActor: 'seller-agent',
        description:
          "Arbiter validates buyer's offer signature and delegation chain, then relays the offer to the seller agent (without budget details).",
        cryptoUsed: ['ECDSA P-256 (signature verification)', 'ECDSA P-256 (relay signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44',
        latencyMs: 8,
        pqcLatencyMs: 10,
      },
      {
        id: 'mn-3',
        order: 3,
        label: 'Seller Counteroffers',
        fromActor: 'seller-agent',
        toActor: 'arbiter',
        description:
          'Seller agent evaluates the offer against inventory and pricing rules, then submits a signed counteroffer to the arbiter.',
        cryptoUsed: ['ECDSA P-256 (counteroffer signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44',
        latencyMs: 5,
        pqcLatencyMs: 7,
      },
      {
        id: 'mn-4',
        order: 4,
        label: 'Arbiter Mediates Agreement',
        fromActor: 'arbiter',
        toActor: 'buyer-agent',
        description:
          'Arbiter compares offer and counteroffer, proposes a compromise, and collects signed acceptance from both parties.',
        cryptoUsed: ['ECDSA P-256 (proposal signing)', 'ECDSA P-256 (acceptance verification x2)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44',
        latencyMs: 12,
        pqcLatencyMs: 16,
      },
      {
        id: 'mn-5',
        order: 5,
        label: 'Contract Execution',
        fromActor: 'arbiter',
        toActor: 'payment-service',
        description:
          "Arbiter creates a signed contract with both parties' acceptances attached, submits to payment service for settlement.",
        cryptoUsed: ['ECDSA P-256 (contract signing)', 'RSA-2048 (payment authorization)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 110,
        pqcLatencyMs: 118,
      },
      {
        id: 'mn-6',
        order: 6,
        label: 'Settlement Confirmation',
        fromActor: 'payment-service',
        toActor: 'registry',
        description:
          'Payment service settles the transaction and records the contract in a transaction registry with a signed receipt.',
        cryptoUsed: ['RSA-2048 (receipt signing)', 'SHA-256 (registry entry hash)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 80,
        pqcLatencyMs: 85,
      },
    ],
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Procurement',
    scenario: 'supply-chain',
    description:
      'Agent-to-agent procurement across organizational boundaries. A buyer agent interacts with multiple supplier agents, comparing quotes and managing logistics.',
    steps: [
      {
        id: 'sc-1',
        order: 1,
        label: 'RFQ Broadcast',
        fromActor: 'buyer-agent',
        toActor: 'seller-agent',
        description:
          'Buyer agent broadcasts a signed Request for Quotation (RFQ) to multiple supplier agents with specification requirements.',
        cryptoUsed: ['ECDSA P-256 (RFQ signing)', 'AES-256-GCM (spec encryption)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44 + ML-KEM-768',
        latencyMs: 10,
        pqcLatencyMs: 14,
      },
      {
        id: 'sc-2',
        order: 2,
        label: 'Supplier Quotes',
        fromActor: 'seller-agent',
        toActor: 'buyer-agent',
        description:
          'Each supplier agent submits a sealed, signed quote with pricing and availability. Quotes are encrypted to the buyer agent only.',
        cryptoUsed: ['ECDSA P-256 (quote signing)', 'ECDH P-256 (quote encryption)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44 + ML-KEM-768',
        latencyMs: 8,
        pqcLatencyMs: 12,
      },
      {
        id: 'sc-3',
        order: 3,
        label: 'Quote Evaluation & Selection',
        fromActor: 'buyer-agent',
        toActor: 'buyer-agent',
        description:
          'Buyer agent decrypts and evaluates all quotes against criteria (price, lead time, quality score). Selection decision is signed for audit.',
        cryptoUsed: ['ECDH P-256 (decryption)', 'ECDSA P-256 (decision signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 + ML-DSA-44',
        latencyMs: 5,
        pqcLatencyMs: 7,
      },
      {
        id: 'sc-4',
        order: 4,
        label: 'Purchase Order',
        fromActor: 'buyer-agent',
        toActor: 'seller-agent',
        description:
          'Buyer agent issues a signed purchase order to the selected supplier with delivery terms, payment details, and delegation proof.',
        cryptoUsed: ['ECDSA P-256 (PO signing)', 'ECDSA P-256 (delegation chain)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 5,
        pqcLatencyMs: 7,
      },
      {
        id: 'sc-5',
        order: 5,
        label: 'Cross-Org Payment',
        fromActor: 'seller-agent',
        toActor: 'payment-service',
        description:
          "Supplier agent submits the signed PO to an inter-organizational payment service. Both parties' delegation chains are verified.",
        cryptoUsed: ['ECDSA P-256 (multi-party verification)', 'RSA-2048 (payment auth)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 150,
        pqcLatencyMs: 160,
      },
    ],
  },
  {
    id: 'subscription',
    name: 'Subscription Management',
    scenario: 'subscription',
    description:
      'Agent manages recurring payments and service subscriptions. Handles renewals, upgrades, and cancellations autonomously within delegated authority.',
    steps: [
      {
        id: 'sub-1',
        order: 1,
        label: 'Agent Monitors Renewal',
        fromActor: 'buyer-agent',
        toActor: 'buyer-agent',
        description:
          'Agent checks subscription expiry dates and evaluates renewal conditions against delegated policy. Signs an internal decision record.',
        cryptoUsed: ['ECDSA P-256 (decision signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44',
        latencyMs: 2,
        pqcLatencyMs: 3,
      },
      {
        id: 'sub-2',
        order: 2,
        label: 'Renewal Negotiation',
        fromActor: 'buyer-agent',
        toActor: 'seller-agent',
        description:
          "Agent contacts the service provider's agent to negotiate renewal terms. Both agents mutually authenticate.",
        cryptoUsed: ['ECDSA P-256 (mTLS)', 'ECDH P-256 (session key)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44 + ML-KEM-768',
        latencyMs: 20,
        pqcLatencyMs: 25,
      },
      {
        id: 'sub-3',
        order: 3,
        label: 'Renewal Authorization',
        fromActor: 'buyer-agent',
        toActor: 'payment-service',
        description:
          'Agent presents delegation token and signed renewal agreement to payment service for recurring charge authorization.',
        cryptoUsed: ['ECDSA P-256 (delegation + renewal signing)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44',
        latencyMs: 80,
        pqcLatencyMs: 85,
      },
      {
        id: 'sub-4',
        order: 4,
        label: 'Confirmation & Audit Log',
        fromActor: 'payment-service',
        toActor: 'registry',
        description:
          'Payment confirmed. Agent logs the action with a signed audit entry including delegation proof, terms, and payment receipt.',
        cryptoUsed: ['RSA-2048 (receipt)', 'SHA-256 (audit log hash chain)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65',
        latencyMs: 50,
        pqcLatencyMs: 55,
      },
    ],
  },
]
