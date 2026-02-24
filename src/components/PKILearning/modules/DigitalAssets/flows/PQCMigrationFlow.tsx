import React, { useState } from 'react'
import {
  ShieldAlert,
  Bitcoin,
  Hexagon,
  Zap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

interface PQCMigrationFlowProps {
  onBack: () => void
}

const PARTS = [
  {
    id: 'vulnerability-landscape',
    title: 'Part 1: Vulnerability Landscape',
    shortTitle: 'Threat Impact',
    icon: ShieldAlert,
  },
  {
    id: 'bitcoin-p2qrh',
    title: 'Part 2: Bitcoin — BIP-360 (P2QRH)',
    shortTitle: 'Bitcoin P2QRH',
    icon: Bitcoin,
  },
  {
    id: 'ethereum-pqc',
    title: 'Part 3: Ethereum — Two Paths to PQC',
    shortTitle: 'Ethereum AA',
    icon: Hexagon,
  },
  {
    id: 'solana-hard-problem',
    title: 'Part 4: Solana — The Hard Problem',
    shortTitle: 'Solana SIMD',
    icon: Zap,
  },
]

const VulnerabilityLandscape: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground text-sm leading-relaxed">
      All three major blockchains face the same fundamental threat: Shor&apos;s algorithm running on
      a cryptographically relevant quantum computer (CRQC) can derive a private key from any exposed
      elliptic curve public key in polynomial time. The impact differs in scale and structural
      recoverability.
    </p>

    {/* Per-chain impact table */}
    <div className="glass-panel p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left p-3 font-semibold text-foreground">Chain</th>
            <th className="text-left p-3 font-semibold text-foreground">Key Exposure</th>
            <th className="text-left p-3 font-semibold text-foreground">Est. Value at Risk</th>
            <th className="text-left p-3 font-semibold text-foreground">HNFL Window</th>
            <th className="text-left p-3 font-semibold text-foreground">Migration Complexity</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b border-border/50">
            <td className="p-3 font-medium text-foreground">Bitcoin</td>
            <td className="p-3 text-xs">P2PK outputs (always exposed); reused P2PKH addresses</td>
            <td className="p-3 font-medium text-status-warning">~$718B (est.)</td>
            <td className="p-3 text-xs">Permanent — UTXO set is immutable</td>
            <td className="p-3">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                High
              </span>
              <p className="text-xs mt-1">Soft fork required; legacy UTXOs remain vulnerable</p>
            </td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3 font-medium text-foreground">Ethereum</td>
            <td className="p-3 text-xs">
              Every EOA that has sent a transaction exposes its pubkey via ECDSA signature recovery
            </td>
            <td className="p-3 font-medium text-status-warning">All transacted ETH + tokens</td>
            <td className="p-3 text-xs">Permanent — transaction history is immutable</td>
            <td className="p-3">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                Medium
              </span>
              <p className="text-xs mt-1">
                AA path available today; no hard fork needed for early adopters
              </p>
            </td>
          </tr>
          <tr>
            <td className="p-3 font-medium text-foreground">Solana</td>
            <td className="p-3 text-xs">
              Every account — the Ed25519 public key IS the address; exposed from first use
            </td>
            <td className="p-3 font-medium text-status-warning">All SOL + SPL tokens</td>
            <td className="p-3 text-xs">Permanent — and unavoidable by design</td>
            <td className="p-3">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                Very High
              </span>
              <p className="text-xs mt-1">
                Address = pubkey; full user-driven asset migration required
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* HNFL callout */}
    <div className="glass-panel p-4 border-l-4 border-l-destructive">
      <h4 className="font-semibold text-foreground mb-2">Why Blockchain HNFL is Uniquely Severe</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Traditional systems can rotate keys and revoke certificates. Blockchain transaction records
        are <strong className="text-foreground">immutable and public</strong> — any public key ever
        used in a transaction is permanently harvestable. There is no retroactive remediation; funds
        must be moved to quantum-safe addresses <em>before</em> a CRQC arrives. Every day without a
        migration path is another day of increasing HNFL exposure.
      </p>
    </div>

    {/* Signature size preview */}
    <div className="glass-panel p-4">
      <h4 className="font-semibold text-foreground mb-3">
        Why Migration Is Non-Trivial: Size Overhead
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        Post-quantum signatures are significantly larger than elliptic curve signatures. This
        directly increases transaction fees and block space requirements.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-semibold text-foreground">Algorithm</th>
              <th className="text-right p-2 font-semibold text-foreground">Public Key</th>
              <th className="text-right p-2 font-semibold text-foreground">Signature</th>
              <th className="text-right p-2 font-semibold text-foreground">Size vs secp256k1</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <td className="p-2 font-medium text-foreground">secp256k1 (current)</td>
              <td className="p-2 text-right font-mono">33 B</td>
              <td className="p-2 text-right font-mono">72 B</td>
              <td className="p-2 text-right text-muted-foreground">baseline</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="p-2 font-medium text-foreground">FALCON-512</td>
              <td className="p-2 text-right font-mono">897 B</td>
              <td className="p-2 text-right font-mono">~666 B</td>
              <td className="p-2 text-right">
                <span className="text-status-warning font-medium">~9× larger</span>
              </td>
            </tr>
            <tr>
              <td className="p-2 font-medium text-foreground">ML-DSA-65</td>
              <td className="p-2 text-right font-mono">1952 B</td>
              <td className="p-2 text-right font-mono">3309 B</td>
              <td className="p-2 text-right">
                <span className="text-destructive font-medium">~46× larger</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const BitcoinP2QRH: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-3">
      <Bitcoin size={24} className="text-warning mt-1 shrink-0" />
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          BIP-360: Pay to Quantum Resistant Hash
        </h3>
        <p className="text-sm text-muted-foreground">
          Proposed by Hunter Beast (2024). A soft fork that introduces a new native SegWit output
          type resistant to quantum attacks by removing the elliptic curve key-spend path.
        </p>
      </div>
    </div>

    {/* How it works */}
    <div className="glass-panel p-4">
      <h4 className="font-semibold text-foreground mb-3">How P2QRH Works</h4>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Generate a PQC keypair</p>
            <p className="text-xs text-muted-foreground">
              Use ML-DSA-65 (CRYSTALS-Dilithium) or FALCON-512 instead of secp256k1. Both are
              NIST-standardised PQC signature schemes.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Hash the PQC public key</p>
            <p className="text-xs text-muted-foreground">
              Apply SHA-256 then HASH160 (SHA-256 → RIPEMD-160) to the PQC public key, mirroring
              Bitcoin&apos;s existing address derivation pattern. The hash hides the full public key
              until spending time.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              New address type: <code className="font-mono text-warning">bc1r…</code> (SegWit v3)
            </p>
            <p className="text-xs text-muted-foreground">
              Bech32m encoding with a new version byte. Distinguishable from current SegWit v0 (
              <code className="font-mono">bc1q…</code>) and Taproot v1 (
              <code className="font-mono">bc1p…</code>) addresses.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            4
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Spending reveals the PQC signature
            </p>
            <p className="text-xs text-muted-foreground">
              When spending, the full PQC public key and signature are revealed in the witness. The
              node verifies the PQC signature using the standardised NIST algorithm. The key is only
              exposed once — at the moment of spending.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Comparison with P2TR */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">P2TR (Current Taproot)</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-start gap-1.5">
            <span className="text-status-success mt-0.5">✓</span> Small key-path spend (32 B pubkey)
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-status-success mt-0.5">✓</span> Tapscript flexibility
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-destructive mt-0.5">✗</span> Key-path exposes x-only pubkey
            directly
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-destructive mt-0.5">✗</span> secp256k1 vulnerable to Shor&apos;s
          </li>
        </ul>
      </div>
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">P2QRH (Proposed BIP-360)</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-start gap-1.5">
            <span className="text-status-success mt-0.5">✓</span> Removes quantum-vulnerable
            key-spend path
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-status-success mt-0.5">✓</span> NIST PQC signature schemes (ML-DSA
            / FALCON)
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-status-success mt-0.5">✓</span> Soft fork — backwards compatible
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-status-warning mt-0.5">~</span> ~9–46× larger transaction witness
            data
          </li>
        </ul>
      </div>
    </div>

    {/* Status */}
    <div className="glass-panel p-4 border-l-4 border-l-warning">
      <h4 className="font-semibold text-foreground mb-2">Current Status</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        BIP-360 is in <strong className="text-foreground">Draft</strong> status with active
        discussion on DelvingBitcoin.org and the bitcoin-dev mailing list. Bitcoin&apos;s
        conservative upgrade process (demonstrated by the multi-year SegWit and Taproot activations)
        means timeline to mainnet activation is uncertain. The proposal has evolved — PQ signatures
        have been separated into a companion BIP to allow the address type soft fork to proceed
        independently.
      </p>
      <a
        href="https://delvingbitcoin.org/t/changes-to-bip-360-pay-to-quantum-resistant-hash-p2qrh/1811"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        Read the DelvingBitcoin discussion <ExternalLink size={11} />
      </a>
    </div>
  </div>
)

const EthereumPQC: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-3">
      <Hexagon size={24} className="text-accent mt-1 shrink-0" />
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          Ethereum: Two Paths to Quantum Resistance
        </h3>
        <p className="text-sm text-muted-foreground">
          Ethereum has a structural advantage over Bitcoin and Solana: it can deploy PQC signing
          today, without a hard fork, using its Account Abstraction infrastructure. A protocol-level
          replacement is on the long-term roadmap.
        </p>
      </div>
    </div>

    {/* Path A: AA */}
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
          A
        </span>
        <h4 className="font-semibold text-foreground">
          Account Abstraction (EIP-4337) — Available Now
        </h4>
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
          Live on Mainnet
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        EIP-4337 introduced <em>smart contract wallets</em> (also called smart accounts) that can
        define arbitrary signature verification logic. A PQC-enabled smart account verifies ML-DSA
        or FALCON signatures instead of ECDSA — no protocol change required.
      </p>
      <div className="bg-muted/50 rounded p-3 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <ArrowRight size={12} className="text-accent mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            User deploys a smart account with a PQC verification module
          </span>
        </div>
        <div className="flex items-start gap-2">
          <ArrowRight size={12} className="text-accent mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            Transactions are signed with an ML-DSA or FALCON key pair off-chain
          </span>
        </div>
        <div className="flex items-start gap-2">
          <ArrowRight size={12} className="text-accent mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            The smart account validates the PQC signature on-chain via a precompile or inline
            Solidity verification
          </span>
        </div>
        <div className="flex items-start gap-2">
          <ArrowRight size={12} className="text-accent mt-0.5 shrink-0" />
          <span className="text-muted-foreground">
            Trade-off: higher gas cost (~300k–500k gas per PQC sig verification vs ~21k for ECDSA)
          </span>
        </div>
      </div>
      <a
        href="https://eips.ethereum.org/EIPS/eip-4337"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        Read EIP-4337 <ExternalLink size={11} />
      </a>
    </div>

    {/* Path B: EIP-7702 */}
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
          B
        </span>
        <h4 className="font-semibold text-foreground">
          EIP-7702 Code Delegation — Pectra Hard Fork
        </h4>
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
          Live (Pectra)
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        EIP-7702 (authored by Vitalik Buterin) allows Externally Owned Accounts (EOAs) to
        temporarily set executable code, effectively delegating their account to a smart contract
        for a transaction. This bridges the gap between EOAs and full smart accounts, enabling PQC
        signing for existing addresses without a full migration.
      </p>
      <a
        href="https://eips.ethereum.org/EIPS/eip-7702"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        Read EIP-7702 <ExternalLink size={11} />
      </a>
    </div>

    {/* Long-term protocol */}
    <div className="glass-panel p-4 border-l-4 border-l-accent">
      <h4 className="font-semibold text-foreground mb-2">
        Long-term: Protocol-Level PQC Replacement
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Ethereum Foundation&apos;s dedicated PQC research team (funded 2024–2025) is evaluating
        STARK-based and lattice-based signature schemes as replacements for the base-layer BLS and
        ECDSA schemes. An &quot;emergency quantum fork&quot; path has been outlined for use if a
        CRQC appears before a planned migration is complete.
      </p>
      <a
        href="https://ethresear.ch/t/tasklist-for-post-quantum-eth/21296"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        Ethereum Foundation PQC tasklist (ethresear.ch) <ExternalLink size={11} />
      </a>
    </div>

    {/* Why Ethereum is better positioned */}
    <div className="glass-panel p-4 bg-muted/30">
      <h4 className="font-semibold text-foreground mb-2 text-sm">
        Why Ethereum is Better Positioned than Bitcoin or Solana
      </h4>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li className="flex items-start gap-1.5">
          <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" /> Keccak-256
          hashing of pubkeys means addresses don&apos;t directly expose the public key until
          spending
        </li>
        <li className="flex items-start gap-1.5">
          <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" /> EIP-4337 lets
          users switch to PQC wallets today, without waiting for a protocol change
        </li>
        <li className="flex items-start gap-1.5">
          <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" /> EIP-7702
          provides a migration bridge for existing EOAs
        </li>
        <li className="flex items-start gap-1.5">
          <CheckCircle size={12} className="text-status-success mt-0.5 shrink-0" /> Ethereum&apos;s
          history of hard forks (Merge, Cancun, Pectra) demonstrates a viable upgrade path
        </li>
      </ul>
    </div>
  </div>
)

const SolanaHardProblem: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-3">
      <Zap size={24} className="text-success mt-1 shrink-0" />
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Solana: The Structural Challenge</h3>
        <p className="text-sm text-muted-foreground">
          Solana&apos;s quantum vulnerability is architecturally different from Bitcoin and
          Ethereum. Its design decision — making addresses equal to Ed25519 public keys — creates a
          uniquely difficult migration problem.
        </p>
      </div>
    </div>

    {/* Core challenge */}
    <div className="glass-panel p-4 border-l-4 border-l-destructive">
      <h4 className="font-semibold text-foreground mb-2">The Core Problem: Address = Public Key</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        In Bitcoin and Ethereum, addresses are derived from public keys via hash functions. The hash
        hides the public key until a transaction is signed. In Solana, the 32-byte Ed25519 public
        key is Base58-encoded and used directly as the account address. From the moment an account
        is created, its public key is permanently visible on-chain — there is no hash layer to
        provide partial protection.
      </p>
    </div>

    {/* Migration steps */}
    <div className="glass-panel p-4">
      <h4 className="font-semibold text-foreground mb-3">What a User Migration Would Require</h4>
      <div className="space-y-3">
        {[
          {
            step: 1,
            label: 'Generate a new PQC-keyed account',
            detail:
              'Create a new Solana account with a post-quantum keypair (e.g., ML-DSA). This account has a new, quantum-safe address.',
          },
          {
            step: 2,
            label: 'Transfer all SOL and SPL tokens',
            detail:
              'Every asset — SOL balance, each SPL token — must be explicitly sent to the new account. Unlike Ethereum, there is no "delegate" mechanism.',
          },
          {
            step: 3,
            label: 'Migrate DeFi positions and staking',
            detail:
              'Staking accounts, liquidity positions, and DeFi vault shares cannot simply be transferred. Each protocol must support migration or users must exit positions.',
          },
          {
            step: 4,
            label: 'Migrate NFTs and programme-derived addresses',
            detail:
              'NFTs held in the old account, PDAs derived from it, and any cross-program ownership links must be separately handled.',
          },
          {
            step: 5,
            label: 'Abandon or drain the old account',
            detail:
              'The old Ed25519-keyed account cannot be made safe retroactively. It should be drained entirely before a CRQC arrives.',
          },
        ].map(({ step, label, detail }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* SIMD process */}
    <div className="glass-panel p-4">
      <h4 className="font-semibold text-foreground mb-3">The SIMD Process</h4>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        Solana protocol changes go through Solana Improvement Documents (SIMDs) — a process similar
        to Bitcoin&apos;s BIPs and Ethereum&apos;s EIPs. As of early 2026, no SIMD for PQC has been
        ratified. Community proposals in active discussion include:
      </p>
      <ul className="text-xs text-muted-foreground space-y-2">
        <li className="flex items-start gap-1.5">
          <ArrowRight size={12} className="text-primary mt-0.5 shrink-0" />
          <span>
            <strong className="text-foreground">New PQC account type</strong>: A new account variant
            that uses a PQC keypair, identified by a different program owner or account flag.
            Requires validator client changes and new RPC methods.
          </span>
        </li>
        <li className="flex items-start gap-1.5">
          <ArrowRight size={12} className="text-primary mt-0.5 shrink-0" />
          <span>
            <strong className="text-foreground">Hybrid transition accounts</strong>: Accounts that
            accept both Ed25519 and PQC signatures during a transition window, then lock to PQC-only
            after a deadline.
          </span>
        </li>
        <li className="flex items-start gap-1.5">
          <ArrowRight size={12} className="text-primary mt-0.5 shrink-0" />
          <span>
            <strong className="text-foreground">Programme-level PQC verification</strong>: Using
            Solana&apos;s native programs to verify PQC signatures, similar to how Ethereum&apos;s
            EIP-4337 uses smart contracts — but with Solana&apos;s programme model.
          </span>
        </li>
      </ul>
      <a
        href="https://github.com/solana-foundation/solana-improvement-documents"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
      >
        SIMD repository <ExternalLink size={11} />
      </a>
    </div>

    {/* Comparison table */}
    <div className="glass-panel p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left p-3 font-semibold text-foreground">Aspect</th>
            <th className="text-left p-3 font-semibold text-foreground">Ethereum</th>
            <th className="text-left p-3 font-semibold text-foreground">Solana</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground text-xs">
          <tr className="border-b border-border/50">
            <td className="p-3 font-medium text-foreground">Address reveals pubkey?</td>
            <td className="p-3">No — Keccak-256 hides it</td>
            <td className="p-3 text-destructive font-medium">Yes — address IS the pubkey</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3 font-medium text-foreground">AA migration path?</td>
            <td className="p-3 text-status-success font-medium">Yes — EIP-4337 live today</td>
            <td className="p-3">No direct equivalent</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3 font-medium text-foreground">PQC usable today?</td>
            <td className="p-3 text-status-success font-medium">Yes — via smart accounts</td>
            <td className="p-3">No — requires protocol change</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3 font-medium text-foreground">Official PQC proposal?</td>
            <td className="p-3 text-status-success font-medium">
              Multiple EIPs active (4337, 7702)
            </td>
            <td className="p-3 text-status-warning">Community discussion only</td>
          </tr>
          <tr>
            <td className="p-3 font-medium text-foreground">Migration complexity</td>
            <td className="p-3 text-status-warning">Medium</td>
            <td className="p-3 text-destructive font-medium">Very High</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="glass-panel p-4 bg-muted/30">
      <p className="text-xs text-muted-foreground leading-relaxed italic">
        <strong className="text-foreground not-italic">Key takeaway:</strong> Solana&apos;s quantum
        risk is structurally higher than Ethereum&apos;s. Every account&apos;s public key is
        permanently and irrevocably on-chain from the moment of first use. Without a ratified SIMD
        and broad wallet/protocol support, the window to migrate safely is shrinking with each
        passing year.
      </p>
    </div>
  </div>
)

export const PQCMigrationFlow: React.FC<PQCMigrationFlowProps> = ({ onBack }) => {
  const [currentPart, setCurrentPart] = useState(0)

  return (
    <div className="space-y-6">
      {/* Step progress indicator */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between">
          {PARTS.map((part, idx) => {
            const Icon = part.icon
            return (
              <React.Fragment key={part.id}>
                <button
                  onClick={() => setCurrentPart(idx)}
                  className={`flex flex-col items-center gap-1 group ${
                    idx === currentPart
                      ? 'text-primary'
                      : idx < currentPart
                        ? 'text-status-success'
                        : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      idx === currentPart
                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                        : idx < currentPart
                          ? 'border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.1)]'
                          : 'border-border bg-background'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-medium hidden sm:block text-center leading-tight max-w-[80px]">
                    {part.shortTitle}
                  </span>
                </button>
                {idx < PARTS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${idx < currentPart ? 'bg-[hsl(var(--status-success))]' : 'bg-border'}`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="glass-panel p-6 min-h-[600px]">
        <div className="mb-6 border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-foreground">{PARTS[currentPart].title}</h2>
        </div>
        {currentPart === 0 && <VulnerabilityLandscape />}
        {currentPart === 1 && <BitcoinP2QRH />}
        {currentPart === 2 && <EthereumPQC />}
        {currentPart === 3 && <SolanaHardProblem />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={() => setCurrentPart((p) => Math.max(0, p - 1))}
          disabled={currentPart === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        {currentPart < PARTS.length - 1 ? (
          <button
            onClick={() => setCurrentPart((p) => Math.min(PARTS.length - 1, p + 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            Complete ✓
          </button>
        )}
      </div>
    </div>
  )
}
