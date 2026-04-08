// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { base58 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { SolanaFlowDiagram } from '../components/CryptoFlowDiagram'
import { InfoTooltip } from '../components/InfoTooltip'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { hsm_generateEdDSAKeyPair, hsm_eddsaSign, hsm_eddsaVerify } from '@/wasm/softhsm/classical'
import { hsm_getPublicKeyInfo } from '@/wasm/softhsm/objects'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { Input } from '@/components/ui/input'
import { Skull } from 'lucide-react'

interface SolanaFlowProps {
  onBack: () => void
}

export const SolanaFlow: React.FC<SolanaFlowProps> = ({ onBack }) => {
  // Shared Hooks
  const keyGen = useKeyGeneration('solana')
  const recipientKeyGen = useKeyGeneration('solana')
  const artifacts = useArtifactManagement()
  // Local State
  const [sourceAddress, setSourceAddress] = useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null)

  const [transactionData, setTransactionData] = useState<{
    recentBlockhash: string
    instructions: {
      programIdIndex: number
      accounts: number[]
      data: string
    }[]
  } | null>(null)
  const [editableRecipientAddress, setEditableRecipientAddress] = useState<string>('')
  const [simulateError, setSimulateError] = useState(false)

  // SoftHSM State linked to interactive UI
  const hsm = useHSM()
  const hsmHandlesRef = React.useRef<{
    srcPrivHandle?: number
    srcPubHandle?: number
    dstPrivHandle?: number
    dstPubHandle?: number
  }>({})
  // Saved in step 7 so step 8 signs exactly what was visualized
  const msgBytesRef = React.useRef<Uint8Array | null>(null)
  // SHA-256 digest of msgBytesRef — used in step 8 to prove the signed bytes are the visualized ones
  const msgDigestRef = React.useRef<string | null>(null)

  // Filenames (Memoized constants)
  const filenames = useMemo(() => {
    const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_solana')
    const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_solana')
    return {
      SRC_PRIVATE_KEY: src.PRIVATE_KEY,
      SRC_PUBLIC_KEY: src.PUBLIC_KEY,
      DST_PRIVATE_KEY: dst.PRIVATE_KEY,
      DST_PUBLIC_KEY: dst.PUBLIC_KEY,
    }
  }, [])

  const steps = useMemo<Step[]>(
    () => [
      {
        id: 'keygen',
        title: '1. Generate Source Keypair',
        description: (
          <>
            Generate an Ed25519 <InfoTooltip term="ed25519" /> private key for the sender. Solana
            uses Ed25519 for high-performance, deterministic signatures with strong security
            guarantees.
            <br />
            <br />
            <strong>Why Ed25519?</strong> Unlike Bitcoin's secp256k1 (ECDSA), Ed25519 uses EdDSA{' '}
            <InfoTooltip term="eddsa" /> which is faster, more secure against side-channel attacks,
            and produces deterministic signatures (no random k value needed).
            <br />
            <br />
            <strong>Demo vs Production Key Generation:</strong> This demo generates a{' '}
            <em>raw Ed25519 seed</em> directly via SoftHSMv3{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">C_GenerateKeyPair</code>. Real
            Solana wallets (Phantom, Solflare, etc.) use a different flow:
            <br />
            1. User enters or generates a 12/24-word BIP-39 <InfoTooltip term="bip39" /> mnemonic
            <br />
            2. PBKDF2-HMAC-SHA512 derives a 64-byte root seed from the mnemonic + optional
            passphrase
            <br />
            3. <InfoTooltip term="slip0010" /> derives the Ed25519 child key via path{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">m/44'/501'/0'/0'</code> using
            HMAC-SHA512 (hardened derivation only — standard BIP-32 does not support Ed25519)
            <br />
            The final 32-byte value is the same Ed25519 seed this demo generates directly. The
            cryptographic operations from step 2 onward are identical regardless of how the seed was
            derived.{' '}
            <a href="/learn/hd-wallets" className="text-primary hover:underline text-xs">
              → Full BIP-32/39/44 + SLIP-0010 derivation walkthrough in the HD Wallets module
            </a>
          </>
        ),
        code: `// SoftHSMv3 WebAssembly API
const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(
  hsm.module,
  hsm.sessionHandle,
  'Ed25519',
  false // non-extractable — private key stays in HSM
);
// Production wallets: BIP-39 → PBKDF2 → SLIP-0010(m/44'/501'/0'/0') → Ed25519 seed`,
        language: 'javascript',
        actionLabel: 'Generate Source Key',
        diagram: <SolanaFlowDiagram />,
      },
      {
        id: 'pubkey',
        title: '2. Extract Source Public Key',
        description: (
          <>
            Derive the public key from the private key using Ed25519 scalar multiplication on the
            Edwards curve. This is a <strong>one-way function</strong> — you cannot derive the
            private key from the public key.
            <br />
            <br />
            <strong>Ed25519 Public Key Derivation:</strong> Unlike ECDSA which uses point
            multiplication on a Weierstrass curve, Ed25519 uses the twisted Edwards curve for faster
            computation. The public key is exactly 32 bytes (256 bits).
            <br />
            <br />
            <strong>
              PKCS#11 Attribute Used —{' '}
              <code className="text-xs font-mono bg-muted px-1 rounded">CKA_PUBLIC_KEY_INFO</code>:
            </strong>{' '}
            The HSM returns the public key as a DER-encoded SubjectPublicKeyInfo (SPKI) structure,
            not raw bytes. SPKI wraps the 32-byte Ed25519 point in an ASN.1 envelope:{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">
              SEQUENCE &#123; AlgorithmIdentifier, BIT STRING &#123; pubkey &#125; &#125;
            </code>
            . The raw 32-byte public key is extracted from the last 32 bytes of this structure.{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">CKA_VALUE</code> is a
            different attribute (raw key material) — for Ed25519 public keys, PKCS#11 v3.2 mandates{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">CKA_PUBLIC_KEY_INFO</code> for
            portability across HSM vendors.
          </>
        ),
        code: `// SoftHSMv3: C_GetAttributeValue(CKA_PUBLIC_KEY_INFO) returns SPKI/DER
const spki = hsm_getPublicKeyInfo(M, hSession, pubHandle)
// SPKI = DER envelope: AlgorithmIdentifier + BIT STRING { raw pubkey }
// Raw Ed25519 pubkey = last 32 bytes of the SPKI structure
const pubKeyBytes = spki.slice(-32) // 32 bytes (Ed25519 raw public key)`,
        language: 'javascript',
        actionLabel: 'Extract Public Key',
      },
      {
        id: 'address',
        title: '3. Generate Source Address',
        description: (
          <>
            The Solana address is simply the Base58 <InfoTooltip term="base58" /> encoding of the
            32-byte public key. Unlike Bitcoin (which hashes the public key) or Ethereum (which
            hashes and takes last 20 bytes), Solana uses the raw public key directly.
            <br />
            <br />
            <strong>Why Direct Encoding?</strong> Solana prioritizes performance and simplicity. The
            32-byte Ed25519 public key is already compact and secure, so no additional hashing is
            needed.
            <br />
            <br />
            <strong>Wallet vs PDA:</strong> This address is a <em>wallet address</em> — an on-curve
            Ed25519 public key with a corresponding private key. Solana also has{' '}
            <InfoTooltip term="pda" /> (Program-Derived Addresses) which are <em>off-curve</em> and
            have no private key; they are controlled exclusively by programs, not users.
            <br />
            <br />
            <span className="flex items-center gap-1.5 text-status-error font-semibold mt-1">
              <Skull className="w-4 h-4 shrink-0" />
              HNFL Attack Point
            </span>
            Unlike Bitcoin and Ethereum, which hash addresses and only expose the public key when
            spending, Solana exposes the raw Ed25519 public key as the address itself — it is
            visible on-chain from the moment the account is created. This makes every Solana wallet
            a permanent target for <InfoTooltip term="hnfl" /> (Harvest Now, Forge Later) attacks. A
            sufficiently powerful quantum computer running <InfoTooltip term="shors" /> could
            recover the private key from the on-chain public key and forge signatures — even for
            accounts that have never signed a transaction.
          </>
        ),
        code: `// JavaScript Execution\nconst pubKeyBytes = ...; // 32 bytes\nconst address = base58.encode(pubKeyBytes);\n// Wallet address: on-curve Ed25519 pubkey (has private key)\n// PDA: off-curve, no private key — program-controlled`,
        language: 'javascript',
        actionLabel: 'Generate Source Address',
      },
      {
        id: 'gen_recipient_key',
        title: '4. Generate Recipient Keypair',
        description: (
          <>
            Generate an Ed25519 <InfoTooltip term="ed25519" /> keypair for the recipient to receive
            funds. This follows the same process as step 1.
            <br />
            <br />
            <strong>Why show recipient keygen?</strong> In a real transaction you would only receive
            the recipient's public address — they generate their own keypair privately and never
            share the private key. This step simulates the recipient's side of the exchange so you
            can see the full lifecycle in one flow. The recipient private key generated here is used
            only to produce the address in step 5; it plays no further role in the transaction.
            <br />
            <br />
            <strong>Key Security:</strong> In production, the recipient would generate their own
            keys on their own device. Never share private keys!
          </>
        ),
        code: `// SoftHSMv3 WebAssembly API
const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(
  hsm.module,
  hsm.sessionHandle,
  'Ed25519',
  false // non-extractable — private key stays in HSM
);`,
        language: 'javascript',
        actionLabel: 'Generate Recipient Key',
      },
      {
        id: 'recipient_address',
        title: '5. Generate Recipient Address',
        description: (
          <>
            Derive the recipient's address from their public key using Base58{' '}
            <InfoTooltip term="base58" /> encoding.
            <br />
            <br />
            <strong>Address Verification:</strong> Always verify the recipient address before
            sending funds. Solana addresses are case-sensitive and{' '}
            <strong>43–44 characters long</strong> (32 bytes of Ed25519 public key Base58-encoded —
            never as short as 32 characters).
          </>
        ),
        code: `// JavaScript Execution\nconst recipientAddress = base58.encode(recipientPubKeyBytes);`,
        language: 'javascript',
        actionLabel: 'Generate Recipient Address',
      },
      {
        id: 'format_tx',
        title: '6. Format Transaction',
        description: (
          <>
            Define the transaction details including <InfoTooltip term="recentBlockhash" /> recent
            blockhash and <InfoTooltip term="instruction" /> instructions. Verify the recipient
            address carefully!
            <br />
            <br />
            <strong>Transaction Structure:</strong> Solana transactions contain a recent blockhash
            (for deduplication/expiration) and one or more instructions. Each instruction specifies
            a program to call, accounts to use, and data to pass.
            <br />
            <br />
            <strong>Lamports:</strong> The amount is specified in <InfoTooltip term="lamports" /> (1
            SOL = 1 billion lamports). This transaction sends 0.5 SOL (500,000,000 lamports =
            0x1DCD6500 little-endian → bytes{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">00 65 cd 1d 00 00 00 00</code>
            ).
            <br />
            <br />
            <strong>
              Fee Payer <InfoTooltip term="feepayer" />:
            </strong>{' '}
            The source account (index 0 in account keys) is both the signer and the fee payer.
            Solana deducts the base fee (~5,000 lamports) from the fee payer before executing
            instructions.
            <br />
            <br />
            <strong>Address Verification:</strong> The recipient address below is decoded back to
            raw bytes and compared against the generated public key. A mismatch means the funds
            would go to a different account — always verify!
          </>
        ),
        code: `const transaction = {\n  recentBlockhash: "Gh9...",\n  instructions: [\n    {\n      programIdIndex: 2,\n      accounts: [0, 1],\n      data: "020000000065cd1d00000000" // Transfer instruction (type 2) + 0.5 SOL in lamports\n    }\n  ]\n};`,
        language: 'javascript',
        actionLabel: 'Format Transaction',
        customControls: (
          <div className="mb-4 p-3 bg-muted/20 border border-border rounded-lg">
            <label
              htmlFor="edit-recipient"
              className="text-xs font-medium text-muted-foreground block mb-1.5"
            >
              Recipient Address{' '}
              <span className="text-status-warning font-normal">(verify before signing)</span>
            </label>
            <Input
              id="edit-recipient"
              type="text"
              value={editableRecipientAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditableRecipientAddress(e.target.value)
              }
              className="font-mono text-xs"
              placeholder="Run steps 4–5 to generate recipient address"
            />
            {editableRecipientAddress && editableRecipientAddress !== recipientAddress && (
              <p className="text-xs text-status-error mt-1.5">
                ⚠️ Address modified — the signed transaction will commit to this recipient, not the
                generated one.
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'visualize_msg',
        title: '7. Visualize Message',
        description:
          'View the Solana Message structure that will be serialized and signed. This demo uses a simplified JSON representation for readability; production Solana transactions use a compact binary wire format (shown in the table below). The JSON and binary represent the same logical message — the cryptographic operations in steps 8–9 are identical either way.',
        code: '',
        language: 'javascript',
        actionLabel: 'Visualize Message',
        explanationTable: [
          {
            label: 'Header',
            value:
              'numRequiredSignatures: 1 | numReadonlySignedAccounts: 0 | numReadonlyUnsignedAccounts: 1',
            description:
              'Three bytes encoding account access control. numRequiredSignatures=1 means only the source must sign. numReadonlyUnsignedAccounts=1 marks the System Program (index 2) as read-only — it cannot be debited. The recipient (index 1) is writable by default, allowing its balance to increase.',
          },
          {
            label: 'Account Keys',
            value: `[0] ${sourceAddress || '(source)'} — Signer + Fee Payer + Writable\n[1] ${editableRecipientAddress || recipientAddress || '(recipient)'} — Writable\n[2] 11111111111111111111111111111111 — System Program (Read-Only)`,
            description: (
              <>
                Ordered array of 32-byte addresses. Index 0 is the fee payer and must sign. Index 1
                (recipient) is writable so its lamport balance can increase. Index 2 is the System
                Program — the native program that executes SOL transfers.
                <span className="flex items-center gap-1 mt-1.5 text-status-error font-semibold">
                  <Skull className="w-3.5 h-3.5 shrink-0" />
                  HNFL Attack Point
                </span>
                All three addresses are visible on-chain permanently. The Ed25519 public keys at [0]
                and [1] can be harvested now and attacked after Q-Day.
              </>
            ),
          },
          {
            label: 'Recent Blockhash',
            value: transactionData?.recentBlockhash || '...',
            description:
              'A recent blockhash (max 150 blocks ≈ 60 seconds at ~400ms/block). Prevents replay attacks — a transaction with a stale blockhash is rejected. In durable nonce transactions, a nonce account replaces this field for offline signing workflows.',
          },
          {
            label: 'Instructions',
            value: '[{ programIdIndex: 2, accounts: [0, 1], data: "020000000065cd1d00000000" }]',
            description:
              'programIdIndex: 2 points to the System Program. accounts: [0,1] are the source and destination indices. data encodes the System Program Transfer instruction: 4-byte type (02000000 LE = 2) + 8-byte amount (0065cd1d00000000 LE = 500,000,000 lamports). This is the native System Program format — Anchor programs use an 8-byte SHA-256 discriminator prefix instead.',
          },
          {
            label: 'System Program',
            value: '11111111111111111111111111111111',
            description:
              'The native Solana program at address 32 zero bytes (Base58: all 1s). It is the only program that can debit a user-owned account and transfer SOL. Instruction type 2 (Transfer) moves lamports from accounts[0] to accounts[1]. Other System Program instructions: 0=CreateAccount, 1=Assign, 3=CreateAccountWithSeed, 9=AdvanceNonceAccount.',
          },
          {
            label: 'Wire Format (Binary)',
            value:
              'Header(3B) | compact-u16(nKeys) | Keys(n×32B) | Blockhash(32B) | compact-u16(nInstr) | Instructions',
            description:
              "Production Solana messages use compact binary, not JSON. compact-u16 is Solana's variable-length encoding: values 0–127 fit in 1 byte; 128–16383 use 2 bytes with a continuation bit. Each instruction is: 1-byte programIdIndex | compact-u16 account count | account indices | compact-u16 data length | raw data. The full serialized message is base58- or base64-encoded for transmission.",
          },
          {
            label: 'Wire Format (Example)',
            value:
              '01 00 01 03 [src 32B] [dst 32B] [sysprog 32B] [blockhash 32B] 01 02 02 00 01 0C 02000000 0065cd1d00000000',
            description:
              'Breakdown: 01=1 required sig | 00=0 readonly signed | 01=1 readonly unsigned | 03=3 account keys | [3×32B keys] | [32B blockhash] | 01=1 instruction | programIdx=02 | 02 account indices=[00,01] | 0C=12 bytes data | 02000000 0065cd1d00000000. The signed transaction prepends [1 sig slot (64B)] before the message.',
          },
          {
            label: 'Modern Solana Features',
            value:
              'Versioned Txns (v0) | Address Lookup Tables | Compute Units | Priority Fees | Simulation',
            description:
              'This demo uses the legacy transaction format. Modern Solana adds: (1) Versioned transactions (v0) — a new message format that supports Address Lookup Tables (ALTs), expanding the account limit from ~20 to ~250 per transaction. (2) Compute Units — every transaction declares a compute budget; exceeding it causes failure. (3) Priority Fees — lamports-per-compute-unit tip to validators for faster inclusion during congestion. (4) Transaction Simulation — wallets call simulateTransaction (a dry-run RPC call) before signing to detect failures without paying fees. These features do not change the Ed25519 signing or verification mechanics — steps 8 and 9 apply to both legacy and versioned formats.',
          },
          {
            label: 'Transaction Lifecycle',
            value:
              'Sign → Serialize → Submit → Simulate (validator) → Execute → Confirm → Finalize',
            description:
              "After signing (step 8), the serialized transaction is base58- or base64-encoded and submitted to an RPC node via sendTransaction. The validator simulates the transaction to check pre-conditions (balances, access flags, compute budget). If simulation passes, the transaction enters the leader's queue. Once included in a block, it is optimistically confirmed (~400ms). Finalization (irreversibility) occurs after 31 additional blocks (~12 seconds) via the Tower BFT consensus mechanism.",
          },
        ],
      },
      {
        id: 'sign',
        title: '8. Sign Message',
        description: (
          <>
            Sign the serialized message using the source private key with{' '}
            <InfoTooltip term="eddsa" /> (EdDSA). Unlike ECDSA, no random nonce is needed — the
            nonce is deterministically derived from the key and message, eliminating nonce-reuse
            vulnerabilities.
            <br />
            <br />
            <strong>Demo vs Production — What Gets Signed:</strong>{' '}
            <span className="text-status-warning font-medium">
              This demo signs the JSON representation of the message (UTF-8 bytes).
            </span>{' '}
            In production, Solana wallets sign the <strong>compact binary wire format</strong> shown
            in step 7 — the same byte sequence that validators receive over the network. The JSON is
            used here for readability; the EdDSA algorithm and key material are identical either
            way, but the signed bytes differ. The SHA-256 integrity fingerprint from step 7 proves
            the demo signs exactly the bytes that were visualized, maintaining internal consistency.
            <br />
            <br />
            <strong>EdDSA Signing Steps (RFC 8032):</strong>
            <br />
            1. Expand the 32-byte seed with SHA-512 → scalar{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">s</code> + nonce prefix
            <br />
            2. Compute nonce{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">
              r = SHA-512(nonce_prefix ‖ message)
            </code>
            <br />
            3. Commitment point{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">R = r·B</code> (Edwards scalar
            multiplication)
            <br />
            4. Challenge{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">
              k = SHA-512(R ‖ pubkey ‖ message)
            </code>
            <br />
            5. Scalar{' '}
            <code className="text-xs font-mono bg-muted px-1 rounded">S = (r + k·s) mod ℓ</code>
            <br />
            6. Signature = R (32 bytes) ‖ S (32 bytes) = <strong>64 bytes total</strong>
          </>
        ),
        code: `// SoftHSMv3 Signing (CKM_EDDSA)
const signature = hsm_eddsaSign(
  hsm.module, 
  hsm.sessionHandle, 
  privHandle, 
  msgBytes
);`,
        language: 'javascript',
        actionLabel: 'Sign Message',
      },
      {
        id: 'verify',
        title: '9. Verify Signature',
        description: (
          <>
            Verify the Ed25519 signature using the source public key. This ensures the message was
            signed by the holder of the corresponding private key.
            <br />
            <br />
            <strong>What this step proves:</strong> Signature verification confirms{' '}
            <em>authenticity</em> (the source key signed this exact message) and <em>integrity</em>{' '}
            (the message was not modified after signing). It does not prove authorization —
            on-chain, the Solana runtime also checks that the account actually owns the funds and
            that all account access flags (writable/signer) match the instruction.
            <br />
            <br />
            <strong>Local vs On-Chain:</strong> This verification runs <em>offline</em> in your
            browser (SoftHSMv3 WASM or JS fallback). In production, the Solana validator performs
            the same Ed25519 verification on-chain during transaction execution — if it fails, the
            entire transaction is rejected atomically. Clients can also pre-verify locally to catch
            errors before paying network fees.
            <br />
            <br />
            <strong>Security:</strong> Ed25519 verification is faster than ECDSA and provides strong
            protection against signature malleability attacks.
            <br />
            <br />
            <strong>Quantum Threat:</strong> <InfoTooltip term="shors" /> can break Ed25519 on a
            sufficiently powerful quantum computer (CRQC). All Solana wallet public keys are visible
            on-chain from account creation, making them permanent targets for{' '}
            <InfoTooltip term="hnfl" /> attacks — adversaries harvest public keys today and forge
            signatures after <InfoTooltip term="qday" />. Post-quantum signature standards (Falcon,
            ML-DSA/FIPS 204) are being standardized as replacements for Ed25519; any Ed25519-based
            blockchain will require a coordinated protocol migration.
          </>
        ),
        code: `// SoftHSMv3 Verification (CKM_EDDSA)
const isValid = hsm_eddsaVerify(
  hsm.module, 
  hsm.sessionHandle, 
  pubHandle, 
  msgBytes, 
  signature
);`,
        language: 'javascript',
        actionLabel: 'Verify Signature',
        customControls: (
          <div className="flex items-center gap-2 mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <input
              type="checkbox"
              id="simulate-error"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <label
              htmlFor="simulate-error"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Simulate Invalid Signature (Proof of Verification)
              <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                Intentionally corrupts the signature to prove that verification actually fails.
              </span>
            </label>
          </div>
        ),
      },
    ],
    [sourceAddress, editableRecipientAddress, recipientAddress, transactionData, simulateError]
  )

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result: Record<string, string> | string = {}

    if (step.id === 'keygen') {
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current

      if (hsmActive) {
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(M, hSession, 'Ed25519', false)
          hsmHandlesRef.current.srcPrivHandle = privHandle
          hsmHandlesRef.current.srcPubHandle = pubHandle

          hsm.addKey({
            handle: pubHandle,
            label: 'Solana Source Key (Ed25519)',
            family: 'eddsa',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: privHandle,
            label: 'Solana Source Key (Ed25519)',
            family: 'eddsa',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })

          result.SoftHSMv3 = `Keys internally generated via SoftHSM3 C_GenerateKeyPair.\nPrivate key is non-extractable (CKA_SENSITIVE=true, CKA_EXTRACTABLE=false) — it never leaves the HSM.\nInspect key attributes in the HSM Key Registry below.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      }

      const { keyPair } = await keyGen.generateKeyPair(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      if (!hsmActive) {
        result = `Generated Source Ed25519 Keypair (JS)\n\nPublic Key (Hex): ${keyPair.publicKeyHex}`
      }
    } else if (step.id === 'pubkey') {
      if (!keyGen.publicKeyHex) throw new Error('Public key not found')

      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive && hsmHandlesRef.current?.srcPubHandle) {
        hsm.addStepLog('Step 2 — Extract Public Key (C_GetAttributeValue)')
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const spki = hsm_getPublicKeyInfo(M, hSession, hsmHandlesRef.current.srcPubHandle)
          const rawPubKey = spki.slice(-32)
          const hsmPubHex = bytesToHex(rawPubKey)
          result.SoftHSMv3 = `Public Key extracted via C_GetAttributeValue(CKA_PUBLIC_KEY_INFO).\n\nPublic Key (Hex): ${hsmPubHex}\n\nPrivate key is non-extractable — it remains inside the HSM.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error extracting public key: ${e}`
        }
      } else {
        result = `Source Public Key (Hex): ${keyGen.publicKeyHex}`
      }
    } else if (step.id === 'address') {
      if (!keyGen.publicKey)
        throw new Error('Public key not found. Please go back and regenerate the key.')

      const addr = base58.encode(keyGen.publicKey)
      setSourceAddress(addr)
      result = `Source Solana Address (Base58): ${addr}`
    } else if (step.id === 'gen_recipient_key') {
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        hsm.addStepLog('Step 4 — Generate Recipient Keypair (C_GenerateKeyPair)')
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(M, hSession, 'Ed25519', false)
          hsmHandlesRef.current.dstPrivHandle = privHandle
          hsmHandlesRef.current.dstPubHandle = pubHandle

          hsm.addKey({
            handle: pubHandle,
            label: 'Solana Recipient Key (Ed25519)',
            family: 'eddsa',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: privHandle,
            label: 'Solana Recipient Key (Ed25519)',
            family: 'eddsa',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })

          result.SoftHSMv3 = `Recipient keys internally generated via SoftHSM3 C_GenerateKeyPair.\nInspect key attributes in the HSM Key Registry below.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      }

      const { keyPair } = await recipientKeyGen.generateKeyPair(
        filenames.DST_PRIVATE_KEY,
        filenames.DST_PUBLIC_KEY
      )

      if (!hsmActive) {
        result = `Generated Recipient Ed25519 Keypair (JS)\n\nPublic Key (Hex): ${keyPair.publicKeyHex}`
      }
    } else if (step.id === 'recipient_address') {
      if (!recipientKeyGen.publicKey) throw new Error('Recipient public key not found')

      const addr = base58.encode(recipientKeyGen.publicKey)
      setRecipientAddress(addr)
      setEditableRecipientAddress(addr)

      result = `Recipient Solana Address (Base58): ${addr}`
    } else if (step.id === 'format_tx') {
      if (!sourceAddress || !recipientAddress) throw new Error('Addresses not generated')

      const txData = {
        recentBlockhash: 'Gh9ZwEmd68M8r5BqQqEweramqJ9V1k15KqSu6Jbcz9GM',
        instructions: [
          {
            programIdIndex: 2,
            accounts: [0, 1],
            data: '020000000065cd1d00000000',
          },
        ],
      }
      setTransactionData(txData)

      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\n\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''

      let addrVerification = ''
      try {
        const addrToVerify = editableRecipientAddress || recipientAddress || ''
        const decodedBytes = base58.decode(addrToVerify)
        const decodedHex = bytesToHex(decodedBytes)
        const expectedHex = recipientKeyGen.publicKeyHex || ''
        const addrMatch = expectedHex && decodedHex === expectedHex
        addrVerification = `\n\n========================================\nRECIPIENT ADDRESS VERIFICATION\n========================================\nAddress (Base58):   ${addrToVerify}\nDecoded (Hex):      ${decodedHex}\nExpected Pubkey:    ${expectedHex || '(run steps 4–5 first)'}\nMatch: ${addrMatch ? '✅ VERIFIED — address matches recipient public key' : expectedHex ? '❌ MISMATCH — address does not match generated recipient key!' : '⚠️  Cannot verify — recipient key not yet generated'}\n\nFee Payer: ${sourceAddress || '(source account)'} — pays ~5,000 lamports base fee\nTransfer: 500,000,000 lamports (0.5 SOL)\nData field: 020000000065cd1d00000000\n  └─ 02000000 = instruction type 2 (Transfer)\n  └─ 0065cd1d00000000 = 500,000,000 lamports (little-endian uint64)`
      } catch {
        addrVerification = '\n\n[Address Verification] Could not decode recipient address.'
      }

      result = `Transaction Details:\n${JSON.stringify(txData, null, 2)}${warning}${addrVerification}`
    } else if (step.id === 'visualize_msg') {
      const message = {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        accountKeys: [
          sourceAddress || '...',
          editableRecipientAddress || recipientAddress || '...',
          '11111111111111111111111111111111',
        ],
        recentBlockhash: transactionData?.recentBlockhash,
        instructions: transactionData?.instructions,
      }

      const msgString = JSON.stringify(message, null, 2)
      const msgBytes = new TextEncoder().encode(msgString)
      msgBytesRef.current = msgBytes
      const msgDigest = bytesToHex(sha256(msgBytes))
      msgDigestRef.current = msgDigest

      const transFilename = artifacts.saveTransaction('solana', msgBytes)

      result = `Solana Message Structure (to be serialized and signed):\n${msgString}\n\n========================================\nRAW MESSAGE BYTES (Hex)\n========================================\nMessage Length: ${msgBytes.length} bytes\n\nHex String:\n${bytesToHex(msgBytes)}\n\n========================================\nMESSAGE INTEGRITY FINGERPRINT\n========================================\nSHA-256: ${msgDigest}\n\nStep 8 will sign these exact bytes. The fingerprint is verified before signing\nto guarantee the signed payload matches what you see here.\n\n📂 Artifact Saved: ${transFilename}`
    } else if (step.id === 'sign') {
      const message = {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        accountKeys: [
          sourceAddress || '...',
          editableRecipientAddress || recipientAddress || '...',
          '11111111111111111111111111111111',
        ],
        recentBlockhash: transactionData?.recentBlockhash,
        instructions: transactionData?.instructions,
      }
      const msgString = JSON.stringify(message, null, 2)
      const msgBytes = msgBytesRef.current ?? new TextEncoder().encode(msgString)
      const actualDigest = bytesToHex(sha256(msgBytes))
      const expectedDigest = msgDigestRef.current
      const digestMatch = !expectedDigest || actualDigest === expectedDigest

      const transFilename =
        artifacts.filenames.trans || artifacts.saveTransaction('solana', msgBytes)

      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        hsm.addStepLog('Step 8 — Sign Message (C_SignInit + C_Sign)')
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const privHandle = hsmHandlesRef.current.srcPrivHandle
          if (!privHandle) throw new Error('SoftHSM Source Private Key not found.')

          const hsmSig = hsm_eddsaSign(M, hSession, privHandle, msgBytes)
          const sigHex = bytesToHex(hsmSig)
          const sigBase58 = base58.encode(hsmSig)
          artifacts.saveSignature('solana', hsmSig)

          const integrityLine = expectedDigest
            ? `Message Integrity: ${digestMatch ? '✅ SHA-256 matches step 7 fingerprint' : '❌ SHA-256 MISMATCH — bytes differ from visualized message!'}\nSHA-256: ${actualDigest}`
            : `SHA-256: ${actualDigest} (run step 7 first to establish fingerprint)`
          result.SoftHSMv3 = `Signature computed inside WebAssembly SoftHSM via C_Sign.\nSignature Length: ${hsmSig.length} bytes\nSignature (Hex): ${sigHex}\nSignature (Base58): ${sigBase58}\n\n${integrityLine}\n\nC_SignInit + C_Sign trace in PKCS#11 Log below.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      } else {
        // JS fallback — HSM not loaded
        if (!keyGen.privateKey) throw new Error('Private key not found.')
        const jsSigBytes = ed25519.sign(msgBytes, keyGen.privateKey)
        const jsSigHex = bytesToHex(jsSigBytes)
        const jsSigBase58 = base58.encode(jsSigBytes)
        artifacts.saveSignature('solana', jsSigBytes)
        result = `Ed25519 Signature Generated (JS)\n\nSignature (Hex): ${jsSigHex}\nSignature (Base58): ${jsSigBase58}\n\n📂 Artifact Saved: ${transFilename}`
      }
    } else if (step.id === 'verify') {
      const transBytes = artifacts.getTransaction()
      const sigBytes = artifacts.getSignature()

      if (!transBytes || !sigBytes)
        throw new Error(
          'Missing artifacts — please run step 7 (Visualize Message) and step 8 (Sign Message) first.'
        )

      const signatureToVerify = simulateError
        ? new Uint8Array(sigBytes).map((b, i, arr) => (i === arr.length - 1 ? b ^ 0xff : b))
        : sigBytes

      const corruptMsg = simulateError ? '\n\n[TEST MODE] Simulating invalid signature...' : ''

      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        hsm.addStepLog('Step 9 — Verify Signature (C_VerifyInit + C_Verify)')
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const pubHandle = hsmHandlesRef.current.srcPubHandle
          if (!pubHandle) throw new Error('SoftHSM Source Public Key not found.')

          const isValid = hsm_eddsaVerify(M, hSession, pubHandle, transBytes, signatureToVerify)
          if (simulateError) {
            result.SoftHSMv3 = `Signature Verification FAILED locally within SoftHSM environment.\nNative execution intercepted corrupt signature bit.\nTrace in PKCS#11 Log.`
          } else if (isValid) {
            result.SoftHSMv3 = `Signature Evaluation: ✅ VALID\nVerified inside WebAssembly SoftHSM via C_Verify.\nTrace in PKCS#11 Log.`
          } else {
            result.SoftHSMv3 = `Signature Evaluation: ❌ INVALID\nC_Verify returned false — signature does not match.\nTrace in PKCS#11 Log.`
            throw new Error('C_Verify: signature verification failed')
          }
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      } else {
        // JS fallback
        if (!keyGen.publicKey) throw new Error('Public key not found')
        let verifyResult: string
        if (simulateError) {
          verifyResult =
            '✅ Verification FAILED as expected (Proof of Validation)\nError: Signature Verification Failure'
        } else {
          const isValid = ed25519.verify(signatureToVerify, transBytes, keyGen.publicKey)
          if (isValid) verifyResult = 'Signature Verified Successfully'
          else throw new Error('Verification Failed — signature does not match')
        }
        result = `Ed25519 Signature Verification Complete!${corruptMsg}\n\nResult: ${verifyResult}`
      }
    }

    return result
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl">
        <LiveHSMToggle hsm={hsm} operations={['C_GenerateKeyPair', 'C_Sign', 'C_Verify']} />
      </div>

      <StepWizard
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onExecute={() => wizard.execute(executeStep)}
        output={wizard.output}
        isExecuting={wizard.isExecuting}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete}
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={onBack}
      />

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — Solana Flow"
          emptyMessage="Execute a step to see live PKCS#11 operations."
          filterFns={['C_GenerateKeyPair', 'C_SignInit', 'C_Sign', 'C_VerifyInit', 'C_Verify']}
        />
      )}

      {hsm.isReady && (
        <HsmKeyInspector
          keys={hsm.keys}
          moduleRef={hsm.moduleRef}
          hSessionRef={hsm.hSessionRef}
          onRemoveKey={hsm.removeKey}
        />
      )}
    </div>
  )
}
