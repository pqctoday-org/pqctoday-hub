// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Fingerprint, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Key Correlator — the same key surfaces under different ASSIGNED identifiers in
 * each system (HSM handle, KMS id, cert thumbprint, code finding). Only the
 * CONTENT-DERIVED public-key (SPKI) fingerprint lines up across all of them, so
 * it is the join key that collapses the artifacts into one logical key.
 */

interface Sighting {
  source: string
  assignedId: string
  // all four share the same SPKI fingerprint
  spki: string
  managed: string
}

const SIGHTINGS: Sighting[] = [
  {
    source: 'HSM (PKCS#11)',
    assignedId: 'CKA_ID 0x9f…2a',
    spki: 'SHA256:7d41…b2',
    managed: 'HSM · non-exportable',
  },
  {
    source: 'Certificate (X.509)',
    assignedId: 'SKI 9f…2a / thumbprint c4…',
    spki: 'SHA256:7d41…b2',
    managed: 'HSM-backed',
  },
  {
    source: 'Source scan',
    assignedId: 'Signature.getInstance("…ECDSA")',
    spki: 'SHA256:7d41…b2',
    managed: 'declared in code',
  },
  {
    source: 'Network scan',
    assignedId: 'ecdsa_secp256r1_sha256 (0x0403)',
    spki: 'SHA256:7d41…b2',
    managed: 'on the wire',
  },
]

export function KeyCorrelator() {
  const [correlated, setCorrelated] = useState(false)

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <h3 className="font-semibold text-foreground mb-1">Collapse artifacts to one key</h3>
        <p className="text-sm text-muted-foreground">
          Four discovery layers found the same ECDSA P-256 key — but each names it differently. The
          assigned ids don&apos;t line up; the SPKI fingerprint does.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCorrelated((v) => !v)}
          className="mt-3 gap-1.5 border-primary bg-primary/15 text-primary hover:bg-primary/25"
        >
          <Link2 size={14} /> {correlated ? 'Show raw sightings' : 'Correlate by SPKI fingerprint'}
        </Button>
      </div>

      {!correlated ? (
        <div className="space-y-2">
          {SIGHTINGS.map((s) => (
            <div key={s.source} className="glass-panel p-3">
              <div className="text-sm font-medium text-foreground">{s.source}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                assigned id: {s.assignedId}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Four rows, four identifiers — looks like four keys.
          </p>
        </div>
      ) : (
        <div className="glass-panel p-4 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint size={18} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">
              1 logical key · SPKI SHA256:7d41…b2
            </span>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {SIGHTINGS.map((s) => (
              <li key={s.source} className="flex justify-between gap-3">
                <span className="text-foreground">{s.source}</span>
                <span className="font-mono">{s.managed}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Record both — the home-system id (to act on the key) and the SPKI fingerprint (to
            correlate). Provenance: ECDSA P-256, HSM-managed, non-exportable.
          </p>
        </div>
      )}
    </div>
  )
}
