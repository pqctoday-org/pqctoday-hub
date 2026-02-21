import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BlockchainExercisesProps {
  onNavigateToWorkshop: (chain?: string) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  chain: string
}

const scenarios: Scenario[] = [
  {
    id: 'bitcoin-pipeline',
    title: '1. Bitcoin Key-to-Address Pipeline',
    description:
      'Generate a Bitcoin private key with OpenSSL, derive the public key, and trace the full SHA-256 + RIPEMD-160 + Base58Check address derivation pipeline.',
    badge: 'secp256k1',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'Watch how a 256-bit private key becomes a 33-byte compressed public key, gets double-hashed into a 20-byte hash, and finally encodes into a human-readable "1..." address with a 4-byte checksum.',
    chain: 'bitcoin',
  },
  {
    id: 'eth-vs-btc',
    title: '2. Ethereum vs Bitcoin: Same Curve, Different Address',
    description:
      'Both Bitcoin and Ethereum use secp256k1, but their address derivation is completely different. Run the Ethereum flow and compare address formats with Bitcoin.',
    badge: 'Keccak-256',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
    observe:
      "Ethereum uses the uncompressed public key (64 bytes, no prefix), hashes with Keccak-256 (NOT NIST SHA3-256), takes only the last 20 bytes, and applies EIP-55 mixed-case checksum. Compare with Bitcoin's double-hash approach.",
    chain: 'ethereum',
  },
  {
    id: 'solana-ed25519',
    title: '3. Solana: Ed25519 Simplicity',
    description:
      'Solana uses Ed25519 instead of secp256k1. The public key IS the address (Base58-encoded). Run the Solana flow and compare the signing process with ECDSA chains.',
    badge: 'EdDSA',
    badgeColor: 'bg-success/20 text-success border-success/50',
    observe:
      'Notice the deterministic nonce in EdDSA — no random number generator needed, unlike ECDSA. The address is simpler: just the Base58-encoded 32-byte public key. EdDSA signs the raw message (hashing is internal).',
    chain: 'solana',
  },
  {
    id: 'hd-wallet-multi',
    title: '4. HD Wallet: One Seed, Three Chains',
    description:
      'Generate a single BIP-39 mnemonic phrase and derive addresses for Bitcoin, Ethereum, and Solana from the same seed. Understand how BIP-44 derivation paths separate keys across chains.',
    badge: 'BIP39/44',
    badgeColor: 'bg-tertiary/20 text-tertiary border-tertiary/50',
    observe:
      "All three addresses derive from the same 24-word mnemonic. Bitcoin and Ethereum use BIP-32 (HMAC-SHA512), while Solana uses SLIP-0010 for Ed25519. Different paths (m/44'/0'/..., m/44'/60'/..., m/44'/501'/...) produce completely different keys.",
    chain: 'hd-wallet',
  },
  {
    id: 'pqc-threat',
    title: '5. The Quantum Threat: What Breaks?',
    description:
      "After completing any chain flow, review how quantum computers threaten the exact cryptographic operations you just performed. Both secp256k1 (ECDSA) and Ed25519 (EdDSA) are vulnerable to Shor's algorithm.",
    badge: 'PQC',
    badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
    observe:
      "Every signature you created relies on the elliptic curve discrete logarithm problem. A quantum computer could reverse the public key derivation to recover the private key. Bitcoin's HNFL risk is particularly severe because on-chain data is immutable — exposed public keys cannot be retroactively protected.",
    chain: 'learn-pqc',
  },
]

export const BlockchainExercises: React.FC<BlockchainExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios in order to compare the cryptographic primitives across
          Bitcoin, Ethereum, and Solana. Each exercise loads the corresponding workshop flow — click
          &quot;Load &amp; Run&quot; to start.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <button
                onClick={() => onNavigateToWorkshop(scenario.chain)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load & Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the quiz to test what you&apos;ve learned about blockchain cryptography.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
