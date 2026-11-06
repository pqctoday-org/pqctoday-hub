// SPDX-License-Identifier: AGPL-3.0-only
/**
 * WorkshopResultCard (sim-mobile-full-play WS-3, plan §4.4) — a pre-computed
 * result for the 6 gating `workshop` steps, shown inside SimBriefSheet on a
 * phone in place of the live playground tool (which needs a desktop-sized
 * interactive surface). Every number here is a REAL, cited reference value
 * already in the codebase's own data registries (ALGORITHM_REGISTRY,
 * CERT_CAPACITY_DEFAULTS) — nothing invented for this card, matching the
 * plan's "no new judging logic" constraint. Only 5 distinct `workshopId`s
 * exist across the 6 gating steps (`envelope-encrypt` gates two separate
 * steps, p5 and p6).
 */
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'
import { CERT_CAPACITY_DEFAULTS } from '@/data/certCapacityDefaults'

const RSA2048 = CERT_CAPACITY_DEFAULTS.find((a) => a.name === 'RSA-2048')!
const MLDSA65 = CERT_CAPACITY_DEFAULTS.find((a) => a.name === 'ML-DSA-65')!
const X25519 = ALGORITHM_REGISTRY['X25519']
const MLKEM768 = ALGORITHM_REGISTRY['ML-KEM-768']

const Stat = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="rounded-lg border border-border bg-card px-3 py-2">
    <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="text-sm font-extrabold text-foreground">{value}</div>
    {note && <div className="mt-0.5 text-[10.5px] text-muted-foreground">{note}</div>}
  </div>
)

export function WorkshopResultCard({ workshopId }: { workshopId: string }) {
  switch (workshopId) {
    case 'tls-simulator': {
      const classicalBytes = X25519.publicKeyBytes * 2 // client + server ephemeral keys
      const hybridBytes =
        classicalBytes + MLKEM768.publicKeyBytes + MLKEM768.signatureOrCiphertextBytes
      return (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            A TLS 1.3 handshake using a hybrid group (X25519MLKEM768, the group OpenSSL 3.5+
            negotiates by default) carries the classical X25519 exchange PLUS a full ML-KEM-768 key
            exchange in the same handshake — nothing is removed, PQC is added alongside.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Classical-only (X25519)"
              value={`${classicalBytes} bytes`}
              note="both ephemeral public keys"
            />
            <Stat
              label="Hybrid (X25519MLKEM768)"
              value={`${hybridBytes} bytes`}
              note={`+${MLKEM768.publicKeyBytes}B key +${MLKEM768.signatureOrCiphertextBytes}B ciphertext`}
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            Sizes: NIST FIPS 203 (ML-KEM-768). One extra round trip's worth of handshake bytes, not
            an extra round trip — TLS 1.3 keeps the same 1-RTT shape.
          </p>
        </div>
      )
    }
    case 'envelope-encrypt': {
      return (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Envelope encryption protects each payload with an AES-256 data-encryption-key (DEK) and
            stores that DEK wrapped under a key-encryption-key (KEK) held in the KMS/HSM. Migrating
            the WRAP step from RSA-OAEP to ML-KEM-768 replaces a public-key encryption with a
            key-encapsulation. Encapsulating to the KMS/HSM public key yields a KEM shared secret
            and a ciphertext; the shared secret goes through an approved key-derivation function (as
            required) to give a symmetric wrapping key, which wraps the existing DEK with an
            authenticated mode. What is stored is the KEM ciphertext plus the wrapped DEK — not the
            shared secret, and not the DEK in the clear — so callers that assume "decrypt the
            wrapped key" need an API-level, not just algorithm-level, change. The AES-256 payload
            encryption itself does not change.
          </p>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Rewrapping replaces only the wrapped DEK, so the stored payload ciphertext is untouched.
            Moving a payload to a new DEK needs full data re-encryption. Neither changes copies of
            the old ciphertext or old wrapped key that were already taken.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="RSA-2048-OAEP wrap"
              value={`${RSA2048.signatureBytes} bytes`}
              note="wrapped-key size"
            />
            <Stat
              label="ML-KEM-768 wrap"
              value={`${MLKEM768.signatureOrCiphertextBytes} bytes`}
              note="KEM ciphertext only; the wrapped DEK is stored as well"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">Sizes: NIST FIPS 203 (ML-KEM-768).</p>
        </div>
      )
    }
    case 'merkle-proof': {
      return (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Merkle Tree Certificates (IETF PLANTS working group,
            draft-ietf-plants-merkle-tree-certs-08 of 2 November 2026, still a work in progress)
            have the CA log every certificate it issues and sign checkpoints and subtrees of that
            log. A standalone certificate carries an inclusion proof to a signed subtree plus
            cosignatures from the CA and other cosigners on that subtree, so log entries do not grow
            with public-key and signature size, which matters because post-quantum signatures such
            as ML-DSA are much larger than current ones. An optional landmark-relative certificate
            needs no signatures, but only for up-to-date relying parties that already hold
            predistributed log information.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Merkle root"
              value="32 bytes"
              note="with SHA-256 (the draft recommends it); fixed size regardless of tree size"
            />
            <Stat
              label="Inclusion proof"
              value="log₂(N) hashes"
              note="sibling hashes from the entry up to a checkpoint or subtree"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            e.g. a 1M-leaf tree needs a ~20-hash (640-byte) inclusion proof with SHA-256, against an
            ML-DSA-65 signature of {MLDSA65.signatureBytes} bytes. This compares the proof alone: a
            standalone certificate also carries cosignatures on the subtree.
          </p>
        </div>
      )
    }
    case 'hsm-capacity': {
      return (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            The HSM calculator explores fictional operation rates, shared device time, utilisation
            headroom and local redundancy. Payment capacity is calculated separately. Its results
            are conditional on these assumptions, not measured hardware performance or a replacement
            recommendation.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="ML-DSA-65 signature"
              value={`${MLDSA65.signatureBytes} bytes`}
              note="vs RSA-2048's 256 bytes"
            />
            <Stat
              label="ML-DSA-65 raw public key"
              value={`${MLDSA65.publicKeyBytes} bytes`}
              note="vs RSA-2048's 256-byte modulus; encoding excluded"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            Sizes: NIST FIPS 204, Table 2. Key and signature sizes do not establish signing
            throughput or physical HSM storage limits.
          </p>
        </div>
      )
    }
    case 'cert-capacity': {
      const deltaSig = MLDSA65.signatureBytes - RSA2048.signatureBytes
      const deltaKey = MLDSA65.publicKeyBytes - RSA2048.publicKeyBytes
      return (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Compare classical and PQC three-level certificate chains. The model transmits the leaf
            and intermediate, excludes the root, and adds one server signature contribution per full
            handshake. It estimates certificate-related payload and annual leaf issuance, not the
            entire TLS handshake, CPU demand or physical HSM storage slots.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Signature size Δ"
              value={`+${deltaSig} bytes`}
              note={`${RSA2048.signatureBytes}B → ${MLDSA65.signatureBytes}B`}
            />
            <Stat
              label="Raw key-material size Δ"
              value={`+${deltaKey} bytes`}
              note={`${RSA2048.publicKeyBytes}B → ${MLDSA65.publicKeyBytes}B`}
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">Sizes: NIST FIPS 204, Table 2.</p>
        </div>
      )
    }
    default:
      return (
        <p className="text-[12.5px] text-muted-foreground">
          This workshop's live tool needs a wider screen — its result summary isn't available yet on
          a phone.
        </p>
      )
  }
}
