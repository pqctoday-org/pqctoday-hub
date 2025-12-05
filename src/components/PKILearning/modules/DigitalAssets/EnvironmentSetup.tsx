import React from 'react'

export const EnvironmentSetup: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Part 2: Environment Setup</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">2.1 OpenSSL Verification</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# Verify OpenSSL version
openssl version
# Expected: OpenSSL 3.5.4 or higher

# Verify secp256k1 support
openssl ecparam -list_curves | grep secp256k1

# Verify Ed25519 support
openssl genpkey -algorithm Ed25519 -out /dev/null 2>&1 && echo "Ed25519 supported"

# Create working directory
mkdir -p ~/crypto_education && cd ~/crypto_education
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">2.2 Node.js Environment Setup</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# Initialize Node.js project
npm init -y

# Install Noble/Scure ecosystem (audited, minimal dependencies)
npm install @noble/hashes @noble/curves @scure/base @scure/bip32 @scure/bip39

# Install blockchain-specific libraries
npm install ed25519-hd-key micro-eth-signer

# Optional: WebAssembly high-performance hashing
npm install hash-wasm
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">2.3 Package.json Configuration</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
{
  "name": "crypto-education",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "bitcoin": "node bitcoin_flow.js",
    "ethereum": "node ethereum_flow.js",
    "solana": "node solana_flow.js",
    "hd-wallet": "node hd_wallet_flow.js"
  },
  "dependencies": {
    "@noble/hashes": "^1.3.0",
    "@noble/curves": "^1.3.0",
    "@scure/base": "^1.1.0",
    "@scure/bip32": "^1.3.0",
    "@scure/bip39": "^1.2.0",
    "ed25519-hd-key": "^1.3.0",
    "micro-eth-signer": "^0.8.0",
    "hash-wasm": "^4.12.0"
  }
}
          `}</pre>
        </div>
      </section>
    </div>
  )
}
