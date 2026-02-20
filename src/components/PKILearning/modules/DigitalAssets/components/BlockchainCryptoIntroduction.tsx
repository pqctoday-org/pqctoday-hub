import React from 'react'
import { Shield, Key, Wallet, PenTool, GitBranch, ArrowRight } from 'lucide-react'
import { HDWalletFlowDiagram } from './CryptoFlowDiagram'
import { InfoTooltip } from './InfoTooltip'
import { PQCThreatSummary } from './PQCThreatSummary'
import { DERIVATION_PATH_EXPLANATIONS } from '../utils/cryptoConstants'

interface BlockchainCryptoIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const BlockchainCryptoIntroduction: React.FC<BlockchainCryptoIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: What is Blockchain Cryptography? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> What is Blockchain Cryptography?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          Blockchains are fundamentally cryptographic systems. Every transaction is authorized by a
          digital signature, every address is derived from a public key through hash functions, and
          every wallet generates its keys from elliptic curve mathematics. There is no central
          authority — cryptography alone establishes ownership and prevents fraud.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Keys & Signatures</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Private key controls funds (256-bit secret)</li>
              <li>Public key derived via elliptic curve math</li>
              <li>Digital signatures prove transaction authority</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">Hash Functions</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>SHA-256 secures Bitcoin blocks and addresses</li>
              <li>Keccak-256 derives Ethereum addresses</li>
              <li>RIPEMD-160 shortens Bitcoin address hashes</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-warning mb-1">Address Derivation</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Addresses are hashes of public keys</li>
              <li>Each chain uses a different derivation pipeline</li>
              <li>HD wallets generate unlimited addresses from one seed</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Sources: Bitcoin whitepaper (Nakamoto, 2008) &sect;2, Ethereum Yellow Paper (Wood, 2014)
          &sect;4
        </p>
      </section>

      {/* Section 2: Elliptic Curves */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Key size={20} /> Elliptic Curves: secp256k1 vs Ed25519
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Blockchain private keys are random 256-bit numbers. The corresponding public key is
          derived via scalar multiplication on an elliptic curve — a one-way trapdoor function that
          is easy to compute forward but computationally infeasible to reverse. Two curves dominate:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">
              <InfoTooltip term="secp256k1" />
            </div>
            <p className="text-xs text-muted-foreground">
              Used by Bitcoin and Ethereum. Defined in SEC 2 (Certicom, 2010). 128-bit security
              level. Public keys are 33 bytes (compressed) or 65 bytes (uncompressed). Signatures
              use <InfoTooltip term="ecdsa" />.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">
              <InfoTooltip term="ed25519" />
            </div>
            <p className="text-xs text-muted-foreground">
              Used by Solana. Defined in RFC 8032. Twisted Edwards curve with 128-bit security.
              32-byte public keys. Signatures use <InfoTooltip term="eddsa" /> with deterministic
              nonces — immune to nonce-reuse attacks.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-1">Key Differences</div>
            <p className="text-xs text-muted-foreground">
              secp256k1 ECDSA uses a random nonce per signature (nonce reuse leaks the private key).
              Ed25519 EdDSA derives the nonce deterministically from the message, eliminating this
              class of vulnerability entirely.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Sources: SEC 2 v2 (Certicom Research, 2010), RFC 8032 &mdash; Edwards-Curve Digital
          Signature Algorithm (Josefsson &amp; Liusvaara, 2017)
        </p>
      </section>

      {/* Section 3: Address Derivation */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Wallet size={20} /> Address Derivation Across Chains
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          The same mathematical operation (private key &times; generator point = public key) is just
          the first step. Each blockchain then applies a different hashing and encoding pipeline to
          derive the final address:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border font-mono text-sm space-y-3">
          <div>
            <span className="text-primary font-bold">Bitcoin</span>
            <span className="text-muted-foreground ml-3 text-xs">
              PubKey &rarr; <InfoTooltip term="sha256" /> &rarr; <InfoTooltip term="ripemd160" />{' '}
              &rarr; <InfoTooltip term="base58check" /> &rarr;{' '}
              <code className="text-primary">1...</code>
            </span>
          </div>
          <div>
            <span className="text-accent font-bold">Ethereum</span>
            <span className="text-muted-foreground ml-3 text-xs">
              PubKey (uncompressed, 64B) &rarr; <InfoTooltip term="keccak256" /> &rarr; Last 20
              bytes &rarr; <InfoTooltip term="eip55" /> &rarr;{' '}
              <code className="text-accent">0x...</code>
            </span>
          </div>
          <div>
            <span className="text-success font-bold">Solana</span>
            <span className="text-muted-foreground ml-3 text-xs">
              PubKey (32B) &rarr; <InfoTooltip term="base58" /> encoding &rarr; Address = public key
              itself
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Bitcoin uses a double-hash (SHA-256 then RIPEMD-160) to produce a 20-byte hash before
          encoding. Ethereum uses Keccak-256 (note: this is the original Keccak submission, not the
          NIST SHA3-256 standard — they differ in padding). Solana is the simplest: the 32-byte
          Ed25519 public key is directly Base58-encoded as the address.
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Sources: Bitcoin Wiki &mdash; Technical background of addresses, EIP-55 (Buterin, 2016),
          Solana Documentation &mdash; Account Model
        </p>
      </section>

      {/* Section 4: Digital Signatures */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <PenTool size={20} /> Digital Signatures: ECDSA vs EdDSA
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Digital signatures prove that a transaction was authorized by the holder of a private key
          without revealing the key itself. Each chain uses a different signature scheme with
          different trade-offs:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground font-mono text-xs mt-0.5">1.</span>
            <span className="text-foreground/80">
              <strong className="text-primary">Hash the message</strong> — Bitcoin: double SHA-256.
              Ethereum: Keccak-256. Solana (Ed25519): the message is signed directly (hashing is
              internal to EdDSA).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground font-mono text-xs mt-0.5">2.</span>
            <span className="text-foreground/80">
              <strong className="text-warning">Sign with private key</strong> —{' '}
              <InfoTooltip term="ecdsa" /> produces (r, s) using a random nonce k.{' '}
              <InfoTooltip term="eddsa" /> produces (R, s) using a deterministic nonce derived from
              the private key and message — no random number generator needed.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground font-mono text-xs mt-0.5">3.</span>
            <span className="text-foreground/80">
              <strong className="text-success">Verify with public key</strong> — Anyone can verify
              the signature using the signer&apos;s public key + the original message + the
              signature. This is the foundation of trustless transaction validation.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground font-mono text-xs mt-0.5">4.</span>
            <span className="text-foreground/80">
              <strong className="text-accent">Ethereum special case</strong> — ECDSA signatures
              include a <InfoTooltip term="recoveryParam" /> (v) per EIP-155, allowing the
              signer&apos;s public key (and therefore address) to be recovered from the signature
              itself. This is why Ethereum transactions don&apos;t need to include the sender&apos;s
              public key.
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Sources: FIPS 186-5 &mdash; Digital Signature Standard (NIST, 2023), RFC 8032 &mdash;
          EdDSA (IETF, 2017), EIP-155 &mdash; Simple Replay Attack Protection (Buterin, 2016)
        </p>
      </section>

      {/* Section 5: HD Wallets */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <GitBranch size={20} /> HD Wallets and Key Management
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Rather than managing separate private keys for each address, Hierarchical Deterministic
          (HD) wallets derive an unlimited number of keys from a single seed. The{' '}
          <InfoTooltip term="bip39" /> standard converts random entropy into a 24-word mnemonic
          phrase for human-readable backup. <InfoTooltip term="bip32" /> defines the tree
          derivation, and <InfoTooltip term="bip44" /> standardizes the path structure across
          chains.
        </p>

        <HDWalletFlowDiagram />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 font-semibold text-foreground">Chain</th>
                <th className="p-2 font-semibold text-foreground">Derivation Path</th>
                <th className="p-2 font-semibold text-foreground">Standard</th>
                <th className="p-2 font-semibold text-foreground">Notes</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium text-foreground">Bitcoin</td>
                <td className="p-2 font-mono text-xs">
                  {DERIVATION_PATH_EXPLANATIONS.bitcoin.path}
                </td>
                <td className="p-2">BIP-32 / BIP-44</td>
                <td className="p-2 text-xs">Coin type 0, supports non-hardened child keys</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium text-foreground">Ethereum</td>
                <td className="p-2 font-mono text-xs">
                  {DERIVATION_PATH_EXPLANATIONS.ethereum.path}
                </td>
                <td className="p-2">BIP-32 / BIP-44</td>
                <td className="p-2 text-xs">Coin type 60, same derivation as Bitcoin</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-foreground">Solana</td>
                <td className="p-2 font-mono text-xs">
                  {DERIVATION_PATH_EXPLANATIONS.solana.path}
                </td>
                <td className="p-2">
                  <InfoTooltip term="slip0010" />
                </td>
                <td className="p-2 text-xs">
                  All segments hardened — Ed25519 does not support non-hardened derivation
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Sources: BIP-32 (Wuille, 2012), BIP-39 (Palatinus et al., 2013), BIP-44 (Palatinus &amp;
          Rusnak, 2014), SLIP-0010 (SatoshiLabs)
        </p>
      </section>

      {/* Section 6: PQC Threats */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          Post-Quantum Threats to Blockchains
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Every cryptographic algorithm covered above — <InfoTooltip term="secp256k1" /> (ECDSA),{' '}
          <InfoTooltip term="ed25519" /> (EdDSA), and the elliptic curves underlying HD wallets — is
          vulnerable to <InfoTooltip term="shors" />. Understanding these threats is essential
          before working with blockchain cryptography hands-on.
        </p>

        <PQCThreatSummary />

        <div className="mt-4">
          <button
            onClick={onNavigateToWorkshop}
            className="btn btn-primary flex items-center gap-2 px-4 py-2"
          >
            Try It in the Workshop <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* References */}
      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-foreground mb-3">References</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-2">
              Standards & Specifications
            </h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BIP-32: Hierarchical Deterministic Wallets
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BIP-39: Mnemonic Code for Deterministic Keys
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BIP-44: Multi-Account Hierarchy
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/satoshilabs/slips/blob/master/slip-0010.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SLIP-0010: Universal Ed25519 HD Derivation
                </a>
              </li>
              <li>
                <a
                  href="https://eips.ethereum.org/EIPS/eip-55"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  EIP-55: Mixed-case Checksum Address Encoding
                </a>
              </li>
              <li>
                <a
                  href="https://eips.ethereum.org/EIPS/eip-155"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  EIP-155: Simple Replay Attack Protection
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-2">
              Cryptographic Standards & Documentation
            </h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://www.secg.org/sec2-v2.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SEC 2 v2: Recommended Elliptic Curve Parameters (secp256k1)
                </a>
              </li>
              <li>
                <a
                  href="https://datatracker.ietf.org/doc/html/rfc8032"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  RFC 8032: Edwards-Curve Digital Signature Algorithm (EdDSA)
                </a>
              </li>
              <li>
                <a
                  href="https://csrc.nist.gov/pubs/fips/186-5/final"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  FIPS 186-5: Digital Signature Standard (NIST, 2023)
                </a>
              </li>
              <li>
                <a
                  href="https://ethereum.github.io/yellowpaper/paper.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ethereum Yellow Paper (Wood, 2014)
                </a>
              </li>
              <li>
                <a
                  href="https://bitcoin.org/bitcoin.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Bitcoin: A Peer-to-Peer Electronic Cash System (Nakamoto, 2008)
                </a>
              </li>
              <li>
                <a
                  href="https://www.openssl.org/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenSSL 3.x Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
