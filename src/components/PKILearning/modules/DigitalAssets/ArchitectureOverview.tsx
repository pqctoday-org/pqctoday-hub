import React from 'react'

export const ArchitectureOverview: React.FC = () => {
  return (
    <div className="space-y-6 text-foreground">
      <h2 className="text-2xl font-bold mb-4">Part 1: Architecture Overview</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">1.1 Blockchain Cryptographic Requirements</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BLOCKCHAIN CRYPTOGRAPHIC REQUIREMENTS                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Blockchain     Curve         Signature    Address Derivation               ║
║   ─────────────────────────────────────────────────────────────────────────  ║
║   Bitcoin        secp256k1     ECDSA        SHA256 → RIPEMD160 → Base58Check ║
║   Ethereum       secp256k1     ECDSA        Keccak-256 → Last 20 bytes → Hex ║
║   Solana         Ed25519       EdDSA        Public Key → Base58              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">1.2 OpenSSL 3.5.4 Support Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-2">Operation</th>
                <th className="p-2">Bitcoin</th>
                <th className="p-2">Ethereum</th>
                <th className="p-2">Solana</th>
                <th className="p-2">OpenSSL Support</th>
                <th className="p-2">Alternative</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="p-2">secp256k1 keygen</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">Ed25519 keygen</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">ECDSA signing</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">EdDSA signing</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">SHA-256</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">SHA-512</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">RIPEMD-160</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">HMAC-SHA512</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ✅ <strong>Yes</strong>
                </td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>Keccak-256</strong>
                </td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>@noble/hashes</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>Base58</strong>
                </td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>@scure/base</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>Base58Check</strong>
                </td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>@scure/base</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>BIP32 HD</strong>
                </td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>@scure/bip32</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>BIP39 Mnemonic</strong>
                </td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>@scure/bip39</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>SLIP-0010 HD</strong>
                </td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>ed25519-hd-key</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>RLP Encoding</strong>
                </td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>micro-eth-signer</code>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">
                  <strong>Recovery Param (v)</strong>
                </td>
                <td className="p-2">-</td>
                <td className="p-2">✅</td>
                <td className="p-2">-</td>
                <td className="p-2">
                  ❌ <strong>NO</strong>
                </td>
                <td className="p-2">
                  <code>@noble/curves</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">1.3 Implementation Strategy</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HYBRID IMPLEMENTATION STRATEGY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        OpenSSL 3.5.4 Layer                          │   │
│   │  ✅ Key Generation (secp256k1, Ed25519)                             │   │
│   │  ✅ Basic Hashing (SHA-256, SHA-512, RIPEMD-160)                    │   │
│   │  ✅ HMAC Operations                                                 │   │
│   │  ✅ Digital Signatures (ECDSA, EdDSA)                               │   │
│   │  ✅ Signature Verification                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     JavaScript/WASM Layer                           │   │
│   │  ⚠️  Keccak-256 (Ethereum addresses)                                │   │
│   │  ⚠️  Base58/Base58Check encoding                                    │   │
│   │  ⚠️  BIP32/39/44 HD derivation                                      │   │
│   │  ⚠️  SLIP-0010 Ed25519 derivation                                   │   │
│   │  ⚠️  RLP encoding                                                   │   │
│   │  ⚠️  ECDSA recovery parameter                                       │   │
│   │  ⚠️  Transaction serialization                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>
    </div>
  )
}
