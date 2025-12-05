import React from 'react'

export const SolanaImplementation: React.FC = () => {
  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Part 5: Solana Implementation</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">5.1 Flow Diagram</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLANA KEY & TRANSACTION FLOW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    OpenSSL     ┌──────────────┐    OpenSSL              │
│   │   Entropy    │───────────────▶│ Private Key  │───────────────▶         │
│   │  (256 bits)  │   genpkey      │  (Ed25519)   │   pkey -pubout         │
│   └──────────────┘   Ed25519      │  32 bytes    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Public Key   │                         │
│                                   │  32 bytes    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│              ⚠️ JS REQUIRED ───▶  │   Base58     │  ◀─── NOT in OpenSSL   │
│                                   │   Encode     │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │   Solana     │                         │
│                                   │   Address    │                         │
│                                   │  (Base58)    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                    OpenSSL ───▶   │ Sign (EdDSA) │  ◀─── SUPPORTED!       │
│                                   │  Raw message │                         │
│                                   │  (no hash)   │                         │
│                                   └──────────────┘                         │
│                                                                             │
│   ✅ Solana is the BEST supported by OpenSSL (except Base58 encoding)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">5.2 Step-by-Step: Direct Key Generation</h3>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 1: Generate Ed25519 Key (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
# Generate Ed25519 private key
openssl genpkey -algorithm Ed25519 -out userA_sol_private.pem

# View key details
openssl pkey -in userA_sol_private.pem -text -noout
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 2: Extract Public Key (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
# Extract public key
openssl pkey -in userA_sol_private.pem -pubout -out userA_sol_public.pem

# Export raw 32-byte public key
openssl pkey -in userA_sol_private.pem -pubout -outform DER | tail -c 32 > userA_sol_pubkey.bin

# View raw public key
xxd -p userA_sol_pubkey.bin
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">
          Step 3: Generate Address (JavaScript Required)
        </h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
// solana_address.js
import { base58 } from '@scure/base';
import { readFileSync } from 'fs';

// Read raw 32-byte public key
const publicKey = readFileSync('userA_sol_pubkey.bin');

// Solana address IS the Base58-encoded public key
const solanaAddress = base58.encode(publicKey);

console.log('Solana Address:', solanaAddress);
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">
          Step 4: Sign Message (OpenSSL - Fully Supported!)
        </h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
# Create message
echo -n "Transfer 2 SOL from UserA to UserB" > sol_message.txt

# Sign with Ed25519 (raw message, no prehashing)
openssl pkeyutl -sign \\
  -inkey userA_sol_private.pem \\
  -in sol_message.txt \\
  -out sol_signature.bin \\
  -rawin

# View 64-byte signature
xxd -p sol_signature.bin
          `}</pre>
        </div>

        <h4 className="text-lg font-medium mb-2 mt-4">Step 5: Verify Signature (OpenSSL)</h4>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
# Verify signature
openssl pkeyutl -verify \\
  -pubin -inkey userA_sol_public.pem \\
  -in sol_message.txt \\
  -sigfile sol_signature.bin \\
  -rawin

# Expected: "Signature Verified Successfully"
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">5.3 Complete Solana Script (Hybrid)</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap break-all">{`
// solana_flow.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { base58 } from '@scure/base';

console.log('═══════════════════════════════════════════════════════════════');
console.log('              SOLANA CRYPTOGRAPHIC FLOW                         ');
console.log('═══════════════════════════════════════════════════════════════\\n');

// ========== USER A (SENDER) ==========
console.log('>>> USER A (Sender) <<<\\n');

// Step 1: Generate Ed25519 key (OpenSSL)
console.log('Step 1: Generating Ed25519 private key (OpenSSL)...');
execSync('openssl genpkey -algorithm Ed25519 -out userA_sol.pem');

// Step 2: Extract public key (OpenSSL)
console.log('Step 2: Extracting public key...');
execSync('openssl pkey -in userA_sol.pem -pubout -outform DER | tail -c 32 > userA_sol_pub.bin');

// Step 3: Encode address (JavaScript)
console.log('Step 3: Encoding Base58 address (JavaScript)...');
const pubKeyA = readFileSync('userA_sol_pub.bin');
const addressA = base58.encode(pubKeyA);
console.log(\`   Address: \${addressA}\\n\`);

// ========== USER B (RECEIVER) ==========
console.log('>>> USER B (Receiver) <<<\\n');

execSync('openssl genpkey -algorithm Ed25519 -out userB_sol.pem');
execSync('openssl pkey -in userB_sol.pem -pubout -outform DER | tail -c 32 > userB_sol_pub.bin');
const pubKeyB = readFileSync('userB_sol_pub.bin');
const addressB = base58.encode(pubKeyB);
console.log(\`   Address: \${addressB}\\n\`);

// ========== TRANSACTION SIGNING ==========
console.log('>>> TRANSACTION SIGNING <<<\\n');

// Step 4: Create message
const message = \`Transfer 2 SOL from \${addressA} to \${addressB}\`;
writeFileSync('sol_msg.txt', message);
console.log(\`Step 4: Message: "\${message}"\`);

// Step 5: Sign with Ed25519 (OpenSSL)
console.log('Step 5: Signing with Ed25519 (OpenSSL)...');
// Note: -rawin is crucial for Ed25519 to prevent double hashing
execSync('openssl pkeyutl -sign -inkey userA_sol.pem -in sol_msg.txt -out sol_sig.bin -rawin');

// Step 6: Verify signature (OpenSSL)
console.log('Step 6: Verifying signature (OpenSSL)...');
execSync('openssl pkey -in userA_sol.pem -pubout -out userA_sol_pub.pem');
const verifyResult = execSync('openssl pkeyutl -verify -pubin -inkey userA_sol_pub.pem -in sol_msg.txt -sigfile sol_sig.bin -rawin 2>&1').toString();
console.log(\`   Result: \${verifyResult.trim()}\`);

console.log('\\n═══════════════════════════════════════════════════════════════');
console.log('              SOLANA FLOW COMPLETE                              ');
console.log('═══════════════════════════════════════════════════════════════');
          `}</pre>
        </div>
      </section>
    </div>
  )
}
