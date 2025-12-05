import React from 'react'

export const EthereumImplementation: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Part 4: Ethereum Implementation</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">4.1 Flow Diagram</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ETHEREUM KEY & TRANSACTION FLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    OpenSSL     ┌──────────────┐    OpenSSL              │
│   │   Entropy    │───────────────▶│ Private Key  │───────────────▶         │
│   │  (256 bits)  │   ecparam      │ (secp256k1)  │   ec -pubout           │
│   └──────────────┘                └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Public Key   │                         │
│                                   │(uncompressed)│                         │
│                                   │  64 bytes    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│              ⚠️ JS REQUIRED ───▶  │ Keccak-256   │  ◀─── NOT in OpenSSL   │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Last 20 bytes│                         │
│                                   │  = Address   │                         │
│                                   │  (0x....)    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                          ┌───────────────┴───────────────┐                 │
│                          ▼                               ▼                 │
│                    ┌──────────────┐              ┌──────────────┐          │
│     ⚠️ JS ────▶    │ RLP Encode   │              │ Keccak-256   │ ◀── JS  │
│                    │ Transaction  │              │  Tx Hash     │          │
│                    └──────────────┘              └──────────────┘          │
│                                                        │                   │
│                                                        ▼                   │
│                                                  ┌──────────────┐          │
│                                   ⚠️ JS ────▶    │ Sign (ECDSA) │          │
│                                                  │ + Recovery v │          │
│                                                  └──────────────┘          │
│                                                                             │
│   Legend: ⚠️ = JavaScript required (not supported by OpenSSL)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">
          4.2 Critical Limitation: Keccak-256 ≠ SHA3-256
        </h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ⚠️  CRITICAL: OpenSSL SHA3 vs Keccak                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   OpenSSL's SHA3-256 is NOT compatible with Ethereum's Keccak-256!          ║
║                                                                              ║
║   • Keccak-256 was the SHA3 candidate (pre-standardization)                 ║
║   • NIST SHA3-256 uses different padding than original Keccak               ║
║   • Ethereum uses the original Keccak-256, not NIST SHA3-256                ║
║                                                                              ║
║   Test vector for "hello":                                                   ║
║   • Keccak-256: 1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7... ║
║   • SHA3-256:   3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202... ║
║                                                                              ║
║   SOLUTION: Use @noble/hashes or hash-wasm for Ethereum operations          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">4.3 Step-by-Step: Direct Key Generation</h3>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 1: Generate Private Key (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
# Generate secp256k1 private key
openssl ecparam -name secp256k1 -genkey -noout -out userA_eth_private.pem

# Extract raw 32-byte private key
openssl ec -in userA_eth_private.pem -text -noout 2>/dev/null | \\
  grep -A 3 "priv:" | tail -3 | tr -d ' :\\n' | cut -c1-64
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">
          Step 2: Extract Uncompressed Public Key (OpenSSL)
        </h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
# Export public key as DER
openssl ec -in userA_eth_private.pem -pubout -outform DER -out userA_eth_pub.der 2>/dev/null

# Extract 64-byte uncompressed public key (remove DER header and 0x04 prefix)
# The last 65 bytes are: 04 || X (32 bytes) || Y (32 bytes)
# We need just X || Y (64 bytes)
tail -c 65 userA_eth_pub.der | tail -c 64 > userA_eth_pubkey_raw.bin
xxd -p userA_eth_pubkey_raw.bin | tr -d '\\n'
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">
          Step 3: Derive Address (JavaScript Required)
        </h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
// ethereum_address.js
import { keccak_256 } from '@noble/hashes/sha3';
import { readFileSync } from 'fs';

// Read raw 64-byte public key from OpenSSL output
const publicKey = readFileSync('userA_eth_pubkey_raw.bin');

// Keccak-256 hash
const hash = keccak_256(publicKey);

// Take last 20 bytes
const addressBytes = hash.slice(-20);

// Convert to checksummed address (EIP-55)
const addressHex = Buffer.from(addressBytes).toString('hex');
const addressHash = Buffer.from(keccak_256(addressHex)).toString('hex');

let checksumAddress = '0x';
for (let i = 0; i < 40; i++) {
  if (parseInt(addressHash[i], 16) >= 8) {
    checksumAddress += addressHex[i].toUpperCase();
  } else {
    checksumAddress += addressHex[i].toLowerCase();
  }
}

console.log('Ethereum Address:', checksumAddress);
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">
          Step 4: Sign Transaction (JavaScript Required)
        </h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
// ethereum_sign.js
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { RLP } from 'micro-eth-signer/rlp.js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Extract private key from PEM
const pemContent = readFileSync('userA_eth_private.pem', 'utf8');
const privateKeyHex = execSync(
  "openssl ec -in userA_eth_private.pem -text -noout 2>/dev/null | grep -A 3 'priv:' | tail -3 | tr -d ' :\\\\n'"
).toString().trim().slice(0, 64);
const privateKey = Buffer.from(privateKeyHex, 'hex');

// Create EIP-1559 transaction
const tx = {
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2000000000n,  // 2 gwei
  maxFeePerGas: 50000000000n,          // 50 gwei
  gasLimit: 21000n,
  to: Buffer.from('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'hex'),
  value: 1000000000000000000n,         // 1 ETH
  data: Buffer.alloc(0),
  accessList: [],
};

// RLP encode for signing
const txType = 0x02;
const encoded = RLP.encode([
  tx.chainId, tx.nonce, tx.maxPriorityFeePerGas, tx.maxFeePerGas,
  tx.gasLimit, tx.to, tx.value, tx.data, tx.accessList
]);
const txForSigning = Buffer.concat([Buffer.from([txType]), encoded]);

// Keccak-256 hash
const txHash = keccak_256(txForSigning);

// Sign with recovery
const signature = secp256k1.sign(txHash, privateKey, { lowS: true });

console.log('Transaction Hash:', Buffer.from(txHash).toString('hex'));
console.log('Signature r:', signature.r.toString(16).padStart(64, '0'));
console.log('Signature s:', signature.s.toString(16).padStart(64, '0'));
console.log('Recovery v:', signature.recovery);
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">
          4.4 Complete Ethereum Script (JavaScript-Heavy)
        </h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
// ethereum_flow.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

console.log('═══════════════════════════════════════════════════════════════');
console.log('              ETHEREUM CRYPTOGRAPHIC FLOW                       ');
console.log('═══════════════════════════════════════════════════════════════\\n');

// Helper: Get checksummed address
function toChecksumAddress(address) {
  const addr = address.toLowerCase().replace('0x', '');
  const hash = bytesToHex(keccak_256(addr));
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += parseInt(hash[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i];
  }
  return result;
}

// Helper: Extract private key from OpenSSL PEM
function extractPrivateKey(pemFile) {
  const output = execSync(
    \`openssl ec -in \${pemFile} -text -noout 2>/dev/null | grep -A 3 'priv:' | tail -3 | tr -d ' :\\\\n'\`
  ).toString().trim();
  return hexToBytes(output.slice(0, 64));
}

// ========== USER A (SENDER) ==========
console.log('>>> USER A (Sender) <<<\\n');

// Step 1: Generate private key (OpenSSL)
console.log('Step 1: Generating secp256k1 private key (OpenSSL)...');
execSync('openssl ecparam -name secp256k1 -genkey -noout -out userA_eth.pem');

// Step 2: Extract private key and derive public key (JS for uncompressed)
console.log('Step 2: Deriving uncompressed public key...');
const privKeyA = extractPrivateKey('userA_eth.pem');
const pubKeyA = secp256k1.getPublicKey(privKeyA, false).slice(1); // Remove 04 prefix

// Step 3: Derive address using Keccak-256 (JS Required)
console.log('Step 3: Deriving address using Keccak-256 (JavaScript)...');
const hashA = keccak_256(pubKeyA);
const addressA = toChecksumAddress(bytesToHex(hashA.slice(-20)));
console.log(\`   Address: \${addressA}\\n\`);

// ========== USER B (RECEIVER) ==========
console.log('>>> USER B (Receiver) <<<\\n');

execSync('openssl ecparam -name secp256k1 -genkey -noout -out userB_eth.pem');
const privKeyB = extractPrivateKey('userB_eth.pem');
const pubKeyB = secp256k1.getPublicKey(privKeyB, false).slice(1);
const hashB = keccak_256(pubKeyB);
const addressB = toChecksumAddress(bytesToHex(hashB.slice(-20)));
console.log(\`   Address: \${addressB}\\n\`);

// ========== TRANSACTION SIGNING ==========
console.log('>>> TRANSACTION SIGNING <<<\\n');

// Step 4: Create transaction message
const txMessage = \`Transfer 1.5 ETH from \${addressA} to \${addressB}\`;
console.log(\`Step 4: Transaction: "\${txMessage}"\`);

// Step 5: Hash with Keccak-256 (JS Required)
console.log('Step 5: Computing Keccak-256 hash (JavaScript)...');
const messageBytes = new TextEncoder().encode(txMessage);
const txHash = keccak_256(messageBytes);
console.log(\`   Hash: 0x\${bytesToHex(txHash)}\`);

// Step 6: Sign with ECDSA + recovery (JS Required for v)
console.log('Step 6: Signing with ECDSA (JavaScript for recovery param)...');
const signature = secp256k1.sign(txHash, privKeyA, { lowS: true });
console.log(\`   r: 0x\${signature.r.toString(16).padStart(64, '0')}\`);
console.log(\`   s: 0x\${signature.s.toString(16).padStart(64, '0')}\`);
console.log(\`   v: \${signature.recovery + 27}\`);

// Step 7: Verify signature
console.log('Step 7: Verifying signature...');
const isValid = secp256k1.verify(signature, txHash, secp256k1.getPublicKey(privKeyA));
console.log(\`   Valid: \${isValid}\`);

// Step 8: Recover public key from signature
console.log('Step 8: Recovering public key from signature...');
const recoveredPubKey = signature.recoverPublicKey(txHash).toRawBytes(false).slice(1);
const recoveredHash = keccak_256(recoveredPubKey);
const recoveredAddress = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)));
console.log(\`   Recovered Address: \${recoveredAddress}\`);
console.log(\`   Matches Sender: \${recoveredAddress === addressA}\`);

console.log('\\n═══════════════════════════════════════════════════════════════');
console.log('              ETHEREUM FLOW COMPLETE                            ');
console.log('═══════════════════════════════════════════════════════════════');
          `}</pre>
        </div>
      </section>
    </div>
  )
}
