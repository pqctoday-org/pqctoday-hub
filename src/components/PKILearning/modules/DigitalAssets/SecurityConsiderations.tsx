import React from 'react'

export const SecurityConsiderations: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Part 9: Security Considerations</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">9.1 Private Key Handling</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SECURITY BEST PRACTICES                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   DO:                                                                        ║
║   ✅ Use secure random sources (openssl rand, crypto.getRandomValues)       ║
║   ✅ Wipe private keys from memory after use                                ║
║   ✅ Store mnemonics offline (paper, metal backup)                          ║
║   ✅ Use hardware wallets for production                                    ║
║   ✅ Validate all inputs before cryptographic operations                    ║
║   ✅ Use audited libraries (Noble, Scure ecosystem)                         ║
║                                                                              ║
║   DON'T:                                                                     ║
║   ❌ Log private keys or mnemonics                                          ║
║   ❌ Store private keys in version control                                  ║
║   ❌ Use Math.random() for cryptographic operations                         ║
║   ❌ Trust user input without validation                                    ║
║   ❌ Use unaudited cryptographic libraries                                  ║
║   ❌ Reuse keys across different blockchains                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">9.2 Secure Key Wiping</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
// Example: Wipe sensitive data
import { HDKey } from '@scure/bip32';

const hdkey = HDKey.fromMasterSeed(seed);
const derived = hdkey.derive("m/44'/0'/0'/0/0");

// Use the key...
const signature = derived.sign(hash);

// Wipe private data when done
derived.wipePrivateData();

// Zero out buffers
function secureWipe(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = 0;
  }
}

secureWipe(seed);
secureWipe(privateKey);
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">9.3 Production Recommendations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-2">Component</th>
                <th className="p-2">Development</th>
                <th className="p-2">Production</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="p-2">Key Generation</td>
                <td className="p-2">OpenSSL/JS</td>
                <td className="p-2">Hardware Security Module (HSM)</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">Key Storage</td>
                <td className="p-2">File system</td>
                <td className="p-2">Hardware wallet / Secure enclave</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">Signing</td>
                <td className="p-2">Software</td>
                <td className="p-2">Hardware wallet / HSM</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">Mnemonic Storage</td>
                <td className="p-2">Plain text</td>
                <td className="p-2">Encrypted / Metal backup</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-2">Network</td>
                <td className="p-2">Testnet</td>
                <td className="p-2">Mainnet with audited code</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">References</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg">Standards Documents</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BIP32: Hierarchical Deterministic Wallets
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BIP39: Mnemonic Code for Deterministic Keys
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  BIP44: Multi-Account Hierarchy
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
                  href="https://ethereum.github.io/yellowpaper/paper.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ethereum Yellow Paper
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Library Documentation</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>
                <a
                  href="https://paulmillr.com/noble/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Noble Cryptography
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/paulmillr?tab=repositories&q=scure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Scure Libraries
                </a>
              </li>
              <li>
                <a
                  href="https://www.openssl.org/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenSSL 3.5 Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://solana-labs.github.io/solana-web3.js/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Solana Web3.js
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
