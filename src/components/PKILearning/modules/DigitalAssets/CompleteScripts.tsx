import React from 'react'

export const CompleteScripts: React.FC = () => {
  return (
    <div className="space-y-6 text-foreground">
      <h2 className="text-2xl font-bold mb-4">Part 8: Complete Working Scripts</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">8.1 Bitcoin (bitcoin_flow.js)</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { sha256 } from '@noble/hashes/sha256';
import { createBase58check, bech32 } from '@scure/base';

// ... (Full script content from Part 3.3)
// See Bitcoin Implementation section for details.
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">8.2 Ethereum (ethereum_flow.js)</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// ... (Full script content from Part 4.4)
// See Ethereum Implementation section for details.
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">8.3 Solana (solana_flow.js)</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { base58 } from '@scure/base';

// ... (Full script content from Part 5.3)
// See Solana Implementation section for details.
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">8.4 HD Wallet (hd_wallet_flow.js)</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
import { execSync } from 'child_process';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { derivePath } from 'ed25519-hd-key';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { keccak_256 } from '@noble/hashes/sha3';
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { base58, createBase58check, bech32 } from '@scure/base';
import { bytesToHex } from '@noble/hashes/utils';

// ... (Full script content from Part 6.3)
// See HD Wallet Implementation section for details.
          `}</pre>
        </div>
      </section>
    </div>
  )
}
