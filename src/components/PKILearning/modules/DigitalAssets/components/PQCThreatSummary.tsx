import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ExternalLink, Bitcoin, Hexagon, Zap } from 'lucide-react'
import { InfoTooltip } from './InfoTooltip'

export const PQCThreatSummary: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-destructive mt-1 shrink-0" size={24} />
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Why This Matters: Quantum Threats to Blockchain
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every cryptographic algorithm you used in this module — secp256k1 (ECDSA), Ed25519
            (EdDSA), and the elliptic curves underlying HD wallets — is vulnerable to{' '}
            <InfoTooltip term="shors" />. A sufficiently powerful quantum computer (
            <InfoTooltip term="qday" />) could derive private keys from public keys, breaking the
            security of all three blockchains.
          </p>
        </div>
      </div>

      {/* Vulnerability Table */}
      <div className="glass-panel p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-semibold text-foreground">Chain</th>
              <th className="text-left p-3 font-semibold text-foreground">Algorithm</th>
              <th className="text-left p-3 font-semibold text-foreground">Quantum Threat</th>
              <th className="text-left p-3 font-semibold text-foreground">Migration Status</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <td className="p-3 font-medium text-foreground">Bitcoin</td>
              <td className="p-3 font-mono text-xs">secp256k1 ECDSA</td>
              <td className="p-3">
                Shor's algorithm breaks ECDLP. ~$718B in vulnerable P2PK addresses with exposed
                public keys.
              </td>
              <td className="p-3 space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                  BIP-360 (P2QRH) — Draft
                </span>
                <p className="text-xs text-muted-foreground">
                  New quantum-resistant address type via soft fork
                </p>
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="p-3 font-medium text-foreground">Ethereum</td>
              <td className="p-3 font-mono text-xs">secp256k1 ECDSA + BLS12-381</td>
              <td className="p-3">
                All accounts that have transacted expose public keys. Validator BLS signatures also
                vulnerable.
              </td>
              <td className="p-3 space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
                  EIP-7702 + AA path — Active
                </span>
                <p className="text-xs text-muted-foreground">
                  PQC signing available today via Account Abstraction; EF PQC team funded
                </p>
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-foreground">Solana</td>
              <td className="p-3 font-mono text-xs">Ed25519 EdDSA</td>
              <td className="p-3">
                Shor's algorithm breaks Ed25519. All account public keys are the address itself
                (always exposed).
              </td>
              <td className="p-3 space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                  SIMD community discussion
                </span>
                <p className="text-xs text-muted-foreground">
                  No ratified proposal; structural migration challenge
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* HNFL Callout */}
      <div className="glass-panel p-4 border-l-4 border-l-destructive">
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <InfoTooltip term="hnfl" /> Risk for Blockchains
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          On-chain data is <strong className="text-foreground">immutable</strong> — unlike
          traditional systems where you can rotate keys, blockchain transaction history is
          permanent. Public keys exposed in past transactions remain harvestable indefinitely. When
          cryptographically relevant quantum computers arrive, every previously exposed public key
          becomes a target. This makes the HNFL threat particularly severe for blockchains: there is
          no retroactive fix for exposed keys.
        </p>
        <p className="text-xs text-muted-foreground mt-2 italic">
          Source: Federal Reserve Board FEDS Paper, September 2025
        </p>
      </div>

      {/* Active Migration Initiatives */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <ShieldAlert size={16} className="text-primary" />
          Active PQC Protection Initiatives
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bitcoin */}
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Bitcoin size={18} className="text-warning shrink-0" />
              <span className="font-semibold text-foreground text-sm">
                Bitcoin — BIP-360 (P2QRH)
              </span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
              Draft
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hunter Beast&apos;s proposal introduces a new SegWit v3 output type (
              <code className="font-mono">bc1r…</code>) using post-quantum signatures (ML-DSA or
              FALCON-512). Requires a soft fork. Removes the quantum-vulnerable key-spend path from
              Taproot.
            </p>
            <a
              href="https://delvingbitcoin.org/t/changes-to-bip-360-pay-to-quantum-resistant-hash-p2qrh/1811"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View proposal <ExternalLink size={11} />
            </a>
          </div>

          {/* Ethereum */}
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Hexagon size={18} className="text-accent shrink-0" />
              <span className="font-semibold text-foreground text-sm">
                Ethereum — AA + EIP-7702
              </span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
              Active Research
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Two complementary paths: EIP-4337 Account Abstraction (live) lets smart-contract
              wallets verify PQC signatures today. EIP-7702 (Pectra) allows EOAs to delegate to
              contract code, enabling PQC signing without a full migration. The Ethereum Foundation
              PQC team is researching a future protocol-level replacement (STARK-based or
              lattice-based signatures).
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://ethresear.ch/t/tasklist-for-post-quantum-eth/21296"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                EF PQC tasklist <ExternalLink size={11} />
              </a>
              <a
                href="https://ethereum.org/roadmap/future-proofing/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Roadmap <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Solana */}
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-success shrink-0" />
              <span className="font-semibold text-foreground text-sm">Solana — SIMD Process</span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
              Community Discussion
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No ratified SIMD (Solana Improvement Document) for PQC yet. The core challenge is
              structural: Solana addresses <em>are</em> Ed25519 public keys — there is no hash layer
              to hide behind. Community proposals explore new PQC-keyed account types requiring
              users to explicitly migrate all assets and positions.
            </p>
            <a
              href="https://github.com/solana-foundation/solana-improvement-documents"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              SIMD repository <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Explore Further */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/threats"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
        >
          <ExternalLink size={16} />
          Explore Full Quantum Threat Dashboard
        </Link>
        <Link
          to="/learn/quantum-threats"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
        >
          <ExternalLink size={16} />
          Quantum Threats Module — understand how quantum computers break cryptography
        </Link>
      </div>
    </div>
  )
}
