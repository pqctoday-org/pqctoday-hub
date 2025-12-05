import React from 'react'

export const BitcoinImplementation: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Part 3: Bitcoin Implementation</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">3.1 Flow Diagram</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BITCOIN KEY & TRANSACTION FLOW                       │
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
│                                   │(compressed)  │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                          ┌───────────────┼───────────────┐                 │
│                          ▼               ▼               ▼                 │
│                    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│       OpenSSL───▶  │ SHA-256  │    │ SHA-256  │    │  Bech32  │ ◀──JS    │
│                    └──────────┘    └──────────┘    └──────────┘           │
│                          │               │               │                 │
│                          ▼               │               ▼                 │
│                    ┌──────────┐          │         ┌──────────┐           │
│       OpenSSL───▶  │RIPEMD160 │          │         │ SegWit   │           │
│                    └──────────┘          │         │ Address  │           │
│                          │               │         │ (bc1...) │           │
│                          ▼               │         └──────────┘           │
│                    ┌──────────┐          │                                 │
│          JS ───▶   │Base58Chk │          │                                 │
│                    └──────────┘          │                                 │
│                          │               │                                  │
│                          ▼               ▼                                  │
│                    ┌──────────┐    ┌──────────┐                            │
│                    │  Legacy  │    │  Sign    │◀─── OpenSSL                │
│                    │ Address  │    │ (ECDSA)  │                            │
│                    │ (1.....)│    └──────────┘                            │
│                    └──────────┘                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">3.2 Step-by-Step: Direct Key Generation</h3>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 1: Generate Private Key (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# Generate secp256k1 private key for User A
openssl ecparam -name secp256k1 -genkey -noout -out userA_btc_private.pem

# View private key details
openssl ec -in userA_btc_private.pem -text -noout

# Extract raw private key (32 bytes hex)
openssl ec -in userA_btc_private.pem -text -noout 2>/dev/null | \\
  grep -A 3 "priv:" | tail -3 | tr -d ' :\\n'
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 2: Derive Public Key (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# Extract public key
openssl ec -in userA_btc_private.pem -pubout -out userA_btc_public.pem

# Export as DER for processing
openssl ec -in userA_btc_private.pem -pubout -outform DER -out userA_btc_public.der

# View raw public key bytes
xxd -p userA_btc_public.der
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 3: Hash Public Key (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# SHA256 of public key
openssl dgst -sha256 -binary userA_btc_public.der > userA_sha256.bin

# RIPEMD160 of SHA256 result (Hash160)
openssl dgst -ripemd160 -binary userA_sha256.bin > userA_hash160.bin

# View Hash160 (20 bytes - this is the pubkey hash)
xxd -p userA_hash160.bin
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">
          Step 4: Encode Address (JavaScript Required)
        </h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
// bitcoin_address.js
import { sha256 } from '@noble/hashes/sha256';
import { createBase58check, bech32 } from '@scure/base';
import { readFileSync } from 'fs';

// Read Hash160 from OpenSSL output
const hash160 = readFileSync('userA_hash160.bin');

// Create Base58Check encoder with SHA256
const base58check = createBase58check(sha256);

// Legacy P2PKH Address (starts with 1)
const versionByte = Buffer.from([0x00]);  // Mainnet
const legacyAddress = base58check.encode(Buffer.concat([versionByte, hash160]));
console.log('Legacy Address:', legacyAddress);

// SegWit P2WPKH Address (starts with bc1)
const words = bech32.toWords(hash160);
const segwitAddress = bech32.encode('bc', [0x00, ...words]);
console.log('SegWit Address:', segwitAddress);
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 5: Sign Transaction (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# Create transaction data
cat > btc_transaction.txt << 'EOF'
Bitcoin Transaction
From: UserA
To: UserB  
Amount: 0.5 BTC
Fee: 0.0001 BTC
EOF

# Double SHA256 (Bitcoin's standard)
openssl dgst -sha256 -binary btc_transaction.txt > btc_hash1.bin
openssl dgst -sha256 -binary btc_hash1.bin > btc_sighash.bin

# Sign with ECDSA
openssl pkeyutl -sign \\
  -inkey userA_btc_private.pem \\
  -in btc_sighash.bin \\
  -out btc_signature.der

# View DER-encoded signature
xxd -p btc_signature.der
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 6: Verify Signature (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
# Verify signature
openssl pkeyutl -verify \\
  -pubin -inkey userA_btc_public.pem \\
  -in btc_sighash.bin \\
  -sigfile btc_signature.der

# Expected: "Signature Verified Successfully"
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">3.3 Complete Bitcoin Script (Hybrid)</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`
// bitcoin_flow.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { sha256 } from '@noble/hashes/sha256';
import { createBase58check, bech32 } from '@scure/base';

console.log('═══════════════════════════════════════════════════════════════');
console.log('              BITCOIN CRYPTOGRAPHIC FLOW                        ');
console.log('═══════════════════════════════════════════════════════════════\\n');

// ========== USER A (SENDER) ==========
console.log('>>> USER A (Sender) <<<\\n');

// Step 1: Generate private key (OpenSSL)
console.log('Step 1: Generating secp256k1 private key...');
execSync('openssl ecparam -name secp256k1 -genkey -noout -out userA_btc.pem');

// Step 2: Extract public key (OpenSSL)
console.log('Step 2: Deriving public key...');
execSync('openssl ec -in userA_btc.pem -pubout -outform DER -out userA_btc_pub.der 2>/dev/null');

// Step 3: Hash public key (OpenSSL)
console.log('Step 3: Computing Hash160 (SHA256 → RIPEMD160)...');
execSync('openssl dgst -sha256 -binary userA_btc_pub.der | openssl dgst -ripemd160 -binary > userA_hash160.bin');

// Step 4: Generate addresses (JavaScript)
console.log('Step 4: Generating addresses (JavaScript)...');
const hash160A = readFileSync('userA_hash160.bin');
const base58check = createBase58check(sha256);

const legacyA = base58check.encode(Buffer.concat([Buffer.from([0x00]), hash160A]));
const segwitWordsA = bech32.toWords(hash160A);
const segwitA = bech32.encode('bc', [0x00, ...segwitWordsA]);

console.log(\`   Legacy Address:  \${legacyA}\`);
console.log(\`   SegWit Address:  \${segwitA}\\n\`);

// ========== USER B (RECEIVER) ==========
console.log('>>> USER B (Receiver) <<<\\n');

execSync('openssl ecparam -name secp256k1 -genkey -noout -out userB_btc.pem');
execSync('openssl ec -in userB_btc.pem -pubout -outform DER -out userB_btc_pub.der 2>/dev/null');
execSync('openssl dgst -sha256 -binary userB_btc_pub.der | openssl dgst -ripemd160 -binary > userB_hash160.bin');

const hash160B = readFileSync('userB_hash160.bin');
const legacyB = base58check.encode(Buffer.concat([Buffer.from([0x00]), hash160B]));
console.log(\`   Legacy Address:  \${legacyB}\\n\`);

// ========== TRANSACTION SIGNING ==========
console.log('>>> TRANSACTION SIGNING <<<\\n');

// Create transaction data
const txData = \`Transfer 0.5 BTC from \${legacyA} to \${legacyB}\`;
writeFileSync('btc_tx.txt', txData);
console.log(\`Step 5: Transaction: "\${txData}"\`);

// Double SHA256 (OpenSSL)
console.log('Step 6: Computing double SHA256 (sighash)...');
execSync('openssl dgst -sha256 -binary btc_tx.txt | openssl dgst -sha256 -binary > btc_sighash.bin');

// Sign (OpenSSL)
console.log('Step 7: Signing with ECDSA...');
execSync('openssl pkeyutl -sign -inkey userA_btc.pem -in btc_sighash.bin -out btc_sig.der');

// Verify (OpenSSL)
console.log('Step 8: Verifying signature...');
execSync('openssl ec -in userA_btc.pem -pubout -out userA_btc_pub.pem 2>/dev/null');
const verifyResult = execSync('openssl pkeyutl -verify -pubin -inkey userA_btc_pub.pem -in btc_sighash.bin -sigfile btc_sig.der 2>&1').toString();
console.log(\`   Result: \${verifyResult.trim()}\`);

console.log('\\n═══════════════════════════════════════════════════════════════');
console.log('              BITCOIN FLOW COMPLETE                             ');
console.log('═══════════════════════════════════════════════════════════════');
          `}</pre>
        </div>
      </section>
    </div>
  )
}
