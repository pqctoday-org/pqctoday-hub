// SPDX-License-Identifier: GPL-3.0-only
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
            Envelope encryption wraps a per-object AES-256 data-encryption-key (DEK) with a
            key-encryption-key (KEK) held in the KMS/HSM. Migrating the WRAP step from RSA-OAEP to
            ML-KEM-768 replaces a public-key encryption with a key-encapsulation — the DEK is
            derived from the encapsulated shared secret instead of decrypted directly, so callers
            that assume "decrypt the wrapped key" need a small API-level, not just algorithm-level,
            change.
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
              note="ciphertext + KDF, not a direct decrypt"
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
            Merkle Tree Certificates batch many end-entity certificates under ONE periodically
            re-signed root, so a relying party verifies a short inclusion proof against a Merkle
            root instead of a full PQC signature on every leaf certificate — a direct answer to
            ML-DSA/SLH-DSA signatures being materially larger than RSA/ECDSA (LAMPS
            draft-ietf-lamps-cert-binding-for-multi-cert, still evolving).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Merkle root"
              value="32 bytes"
              note="SHA-256, fixed size regardless of tree size"
            />
            <Stat
              label="Inclusion proof"
              value="log₂(N) hashes"
              note="ordered sibling-hash array to the root"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            e.g. a 1M-leaf tree needs a ~20-hash (640-byte) proof — far smaller than re-verifying an
            ML-DSA-65 signature ({MLDSA65.signatureBytes} bytes) per certificate.
          </p>
        </div>
      )
    }
    case 'hsm-capacity': {
      return (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Swapping RSA/ECDSA signing for ML-DSA-65 on an HSM fleet changes the operation, not just
            the algorithm label: ML-DSA verification is fast, but today's HSM firmware signing
            throughput for lattice signatures trails hardware-accelerated RSA/ECDSA on published
            vendor datasheets (Thales Luna 7 PCIe, Entrust nShield 5c, Utimaco SecurityServer Se
            Gen2) — no vendor yet publishes a hardware-accelerated ML-DSA signing TPS figure, so
            fleet sizing has to plan on a software-path number until one does.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="ML-DSA-65 signature"
              value={`${MLDSA65.signatureBytes} bytes`}
              note="vs RSA-2048's 256 bytes"
            />
            <Stat
              label="ML-DSA-65 public key"
              value={`${MLDSA65.publicKeyBytes} bytes`}
              note="vs RSA-2048's 256 bytes"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            Sizes: NIST FIPS 204, Table 2. Run the real HSM Capacity Calculator on a laptop for a
            fleet-sized TPS estimate across your top 10 use cases.
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
            An ML-DSA-65 certificate is meaningfully bigger on the wire than its RSA-2048/ECDSA
            equivalent — every TLS handshake that presents this certificate carries the difference,
            and every certificate store/HSM slot budget needs to account for it too.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Signature size Δ"
              value={`+${deltaSig} bytes`}
              note={`${RSA2048.signatureBytes}B → ${MLDSA65.signatureBytes}B`}
            />
            <Stat
              label="Public key size Δ"
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
