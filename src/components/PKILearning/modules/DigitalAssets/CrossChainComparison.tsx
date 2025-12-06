import React from 'react'

export const CrossChainComparison: React.FC = () => {
  return (
    <div className="space-y-6 text-foreground">
      <h2 className="text-2xl font-bold mb-4">Part 7: Cross-Chain Comparison</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">7.1 Implementation Complexity</h3>
        <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    IMPLEMENTATION COMPLEXITY COMPARISON                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Feature              │ Bitcoin │ Ethereum │ Solana  │ OpenSSL Alone?      ║
║   ─────────────────────┼─────────┼──────────┼─────────┼─────────────────────║
║   Key Generation       │ ✅ Easy │ ✅ Easy  │ ✅ Easy │ ✅ Yes              ║
║   Public Key Derivation│ ✅ Easy │ ✅ Easy  │ ✅ Easy │ ✅ Yes              ║
║   Hashing for Address  │ ✅ Easy │ ⚠️ JS    │ N/A     │ Partial             ║
║   Address Encoding     │ ⚠️ JS   │ ✅ Easy  │ ⚠️ JS   │ ❌ No               ║
║   Transaction Signing  │ ✅ Easy │ ⚠️ JS    │ ✅ Easy │ Partial             ║
║   Signature Verify     │ ✅ Easy │ ⚠️ JS    │ ✅ Easy │ Partial             ║
║   HD Key Derivation    │ ⚠️ JS   │ ⚠️ JS    │ ⚠️ JS   │ ❌ No               ║
║   Transaction Building │ ⚠️ JS   │ ⚠️ JS    │ ⚠️ JS   │ ❌ No               ║
║   ─────────────────────┼─────────┼──────────┼─────────┼─────────────────────║
║   Overall OpenSSL Use  │ ~60%    │ ~30%     │ ~70%    │                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Legend: ✅ = Fully supported by OpenSSL
        ⚠️ = Requires JavaScript
        ❌ = Not possible with OpenSSL alone
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">7.2 Quick Reference Commands</h3>

        <h4 className="text-lg font-medium mb-2 mt-4">Bitcoin Quick Reference</h4>
        <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# OpenSSL Commands
openssl ecparam -name secp256k1 -genkey -noout -out btc.pem  # Generate key
openssl ec -in btc.pem -pubout -out btc_pub.pem              # Extract pubkey
openssl dgst -sha256 -binary file | openssl dgst -sha256 -binary  # Double SHA256
openssl dgst -ripemd160 -binary file                         # RIPEMD160
openssl pkeyutl -sign -inkey btc.pem -in hash -out sig       # Sign

# JavaScript Required For
- Base58Check address encoding
- Bech32/Bech32m encoding
- BIP32/39/44 HD derivation
- Transaction serialization
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Ethereum Quick Reference</h4>
        <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# OpenSSL Commands
openssl ecparam -name secp256k1 -genkey -noout -out eth.pem  # Generate key

# JavaScript Required For (most operations)
- Keccak-256 hashing (address derivation)
- Checksummed address (EIP-55)
- RLP encoding
- Transaction signing with recovery parameter (v)
- BIP32/39/44 HD derivation
- EIP-712 typed data signing
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Solana Quick Reference</h4>
        <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# OpenSSL Commands (Best Supported!)
openssl genpkey -algorithm Ed25519 -out sol.pem              # Generate key
openssl pkey -in sol.pem -pubout -out sol_pub.pem            # Extract pubkey
openssl pkeyutl -sign -inkey sol.pem -in msg -out sig -rawin # Sign
openssl pkeyutl -verify -pubin -inkey sol_pub.pem -in msg -sigfile sig -rawin

# JavaScript Required For
- Base58 address encoding
- SLIP-0010 HD derivation
- Transaction message serialization
          `}</pre>
        </div>
      </section>
    </div>
  )
}
