// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Step 2 comparison: the same two shared secrets through three combiners.
 * Runs in the browser on bytes the demo already read out of the token.
 */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { concatenationOnly, xwingCombiner, XWING_LABEL } from '../services/combinerVariants'
import { HYBRID_KEM_INFO } from '../services/hybridKemCombiner'

export interface CombinerInputs {
  ssM: Uint8Array
  ssX: Uint8Array
  /** The sender's X25519 public key (the key share, X-Wing's ct_X). */
  ctX: Uint8Array
  /** The recipient's X25519 public key (X-Wing's pk_X). */
  pkX: Uint8Array
  /** The demo's HKDF-SHA-256 output from Step 6. */
  hkdfKey: Uint8Array
}

type Variant = 'hkdf' | 'xwing' | 'concat'

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')

const Bytes: React.FC<{ label: string; value: Uint8Array }> = ({ label, value }) => (
  <div className="text-[11px]">
    <span className="text-muted-foreground">
      {label} ({value.length} B):
    </span>{' '}
    <code className="break-all text-foreground">{toHex(value)}</code>
  </div>
)

export const CombinerPanel: React.FC<{ inputs: CombinerInputs }> = ({ inputs }) => {
  const [variant, setVariant] = useState<Variant>('hkdf')
  const xwing = useMemo(
    () => xwingCombiner(inputs.ssM, inputs.ssX, inputs.ctX, inputs.pkX),
    [inputs]
  )
  const naive = useMemo(() => concatenationOnly(inputs.ssM, inputs.ssX), [inputs])

  return (
    <div data-testid="combiner-panel" className="glass-panel p-4 space-y-3 text-sm">
      <div>
        <p className="font-semibold text-foreground">Same two secrets, three combiners</p>
        <p className="text-xs text-muted-foreground mt-1">
          The shared secrets from Steps 3 and 6, fed through three designs. Only what goes into the
          final key changes.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a combiner">
        {(
          [
            ['hkdf', 'This demo (HKDF)'],
            ['xwing', 'X-Wing / composite ML-KEM'],
            ['concat', 'Concatenation only'],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={variant === id ? 'default' : 'outline'}
            size="sm"
            aria-pressed={variant === id}
            onClick={() => setVariant(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {variant === 'hkdf' && (
        <div className="space-y-2">
          <code className="text-[11px] block">
            HKDF-SHA-256(IKM = ss_M ‖ ss_X, salt = none, info = &quot;{HYBRID_KEM_INFO}&quot;)
          </code>
          <Bytes label="ss_M (ML-KEM-768)" value={inputs.ssM} />
          <Bytes label="ss_X (X25519)" value={inputs.ssX} />
          <Bytes label="Hybrid key" value={inputs.hkdfKey} />
          <p className="text-xs text-muted-foreground">
            The combiner form the FIPS 140-3 guidance accepts, but it binds only the two secrets and
            a fixed label, not the key shares or public keys.
          </p>
        </div>
      )}

      {variant === 'xwing' && (
        <div className="space-y-2">
          <code className="text-[11px] block">
            SHA3-256(ss_M ‖ ss_X ‖ ct_X ‖ pk_X ‖ XWingLabel)
          </code>
          <Bytes label="ss_M (ML-KEM-768)" value={inputs.ssM} />
          <Bytes label="ss_X (X25519)" value={inputs.ssX} />
          <Bytes label="ct_X (sender's X25519 key share)" value={inputs.ctX} />
          <Bytes label="pk_X (recipient's X25519 public key)" value={inputs.pkX} />
          <Bytes label="XWingLabel" value={XWING_LABEL} />
          <Bytes label="Hybrid key" value={xwing} />
          <p className="text-xs text-muted-foreground">
            Also hashes the X25519 key share and public key, tying the key to this exchange.
            Composite ML-KEM&apos;s MLKEM768-X25519 uses the same formula and label, so this
            combining step gives the same result (this function reproduces the composite
            draft&apos;s published example). The ML-KEM ciphertext and key are left out on purpose:
            the X-Wing draft relies on ML-KEM-768&apos;s own construction for that, and warns the
            shortcut is not known to be safe for other KEMs. In this demo the sender&apos;s X25519
            key is Alice&apos;s key pair from Step 1, standing in for X-Wing&apos;s fresh ephemeral
            key.
          </p>
        </div>
      )}

      {variant === 'concat' && (
        <div className="space-y-2">
          <code className="text-[11px] block">key = ss_M ‖ ss_X (no KDF)</code>
          <Bytes label="Hybrid key" value={naive} />
          <p className="text-xs text-status-warning">
            A counter-example, not a design. ETSI TR 103 966 warns that this &ldquo;concatenation
            only&rdquo; construction is not secure against active adversaries, whatever the strength
            of each component: changing one component ciphertext changes only its own half of the
            key. Each half of the key is also simply one raw component secret.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-2">
        <strong className="text-foreground">Where the combining happens.</strong> To show the bytes,
        this demo reads both component secrets out of the token into the page&apos;s memory, so
        anything that can read that memory can rebuild the session key. A token can instead combine
        them internally with key handles only (CKM_CONCATENATE_BASE_AND_KEY,
        CKM_CONCATENATE_BASE_AND_DATA, then CKM_SHA3_256_KEY_DERIVATION), as the HPKE step does for
        its X-Wing-style KEMs; the PKCS#11 v3.3 working draft offers the whole composite KEM as one
        mechanism.{' '}
        <Link
          to="/playground/hsm?tab=learn&ltrack=v33&lesson=v33-composite-mlkem"
          className="text-primary underline"
        >
          See composite ML-KEM in the PKCS#11 workshop →
        </Link>
      </p>
    </div>
  )
}
