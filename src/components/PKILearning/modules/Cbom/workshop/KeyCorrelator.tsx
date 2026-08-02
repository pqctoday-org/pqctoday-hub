// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Fingerprint, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_INVENTORY, type ToolId } from '@/data/cryptoEstate'

/**
 * Key Correlator — each asymmetric key in the estate is found by several tools,
 * and each tool labels it with a different ASSIGNED identifier (HSM handle,
 * cert thumbprint, code call, TLS scheme, KMS id). Those ids don't line up; the
 * content-derived SPKI fingerprint does — so it collapses the raw findings into
 * logical keys. Built over the shared @/data/cryptoEstate.
 */

// The identifier each tool assigns to the same key — deliberately all different.
function assignedId(tool: ToolId, algo: string): { system: string; id: string } {
  switch (tool) {
    case 'hsm-query':
      return { system: 'HSM (PKCS#11)', id: 'CKA_ID 0x9f…2a' }
    case 'clm':
      return { system: 'Certificate (X.509)', id: 'SKI / thumbprint c4…' }
    case 'vuln-scanner':
      return {
        system: 'Network scan',
        id: algo.includes('ECDSA') ? 'ecdsa_secp256r1_sha256 (0x0403)' : 'rsa_pkcs1_sha256',
      }
    case 'cbomkit-source':
      return { system: 'Source scan', id: 'Signature.getInstance("…")' }
    case 'cspm':
      return { system: 'Cloud KMS', id: 'arn:aws:kms:…:key/8f3c…' }
    case 'cbomkit-theia':
      return { system: 'Binary scan', id: 'offset 0x4120' }
    case 'sbom':
      return { system: 'SBOM', id: 'pkg:maven/…' }
  }
}

interface Finding {
  assetId: string
  name: string
  algo: string
  spki: string
  management: string
  owner: string
  system: string
  id: string
}

export function KeyCorrelator() {
  const [correlated, setCorrelated] = useState(false)

  const findings = useMemo<Finding[]>(() => {
    const out: Finding[] = []
    for (const a of SAMPLE_INVENTORY) {
      if (!a.spki) continue // symmetric / unparsed — no public-key fingerprint
      for (const tool of a.discoverableBy) {
        const ai = assignedId(tool, a.currentAlgorithm)
        out.push({
          assetId: a.id,
          name: a.name,
          algo: a.currentAlgorithm,
          spki: a.spki,
          management: a.management,
          owner: a.owner,
          system: ai.system,
          id: ai.id,
        })
      }
    }
    return out
  }, [])

  const keys = useMemo(() => {
    const byFp = new Map<string, Finding[]>()
    for (const f of findings) {
      const arr = byFp.get(f.spki) ?? []
      arr.push(f)
      byFp.set(f.spki, arr)
    }
    return [...byFp.entries()]
  }, [findings])

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="mb-1 font-semibold text-foreground">Collapse findings into logical keys</h3>
        <p className="text-sm text-muted-foreground">
          {findings.length} raw findings across your tools — each labels the key differently. The
          assigned ids don&apos;t line up; the SPKI fingerprint does.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCorrelated((v) => !v)}
          className="mt-3 gap-1.5 border-primary bg-primary/15 text-primary hover:bg-primary/25"
        >
          <Link2 size={14} /> {correlated ? 'Show raw findings' : 'Correlate by SPKI fingerprint'}
        </Button>
      </div>

      {!correlated ? (
        <div className="space-y-1.5">
          {findings.map((f, i) => (
            <div key={i} className="glass-panel flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <span className="text-sm text-foreground">{f.system}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{f.id}</span>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{f.algo}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {findings.length} rows, {findings.length} different identifiers — looks like{' '}
            {findings.length} keys.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="glass-panel border border-primary/30 p-3 text-sm text-foreground">
            <Fingerprint size={15} className="mr-1 inline text-primary" />
            {findings.length} findings → <strong>{keys.length} logical keys</strong> (deduped by
            fingerprint).
          </div>
          {keys.map(([fp, group]) => (
            <div key={fp} className="glass-panel p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-primary">{fp}</span>
                <span className="text-xs text-muted-foreground">
                  {group[0].algo.split(' / ')[0]} · {group[0].management} · {group[0].owner}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {group.map((g, i) => (
                  <span
                    key={i}
                    className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {g.system}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Record both — the home-system id (to act on the key) and the SPKI fingerprint (to
            correlate). Symmetric keys (no public half) are excluded — they correlate by KCV.
          </p>
        </div>
      )}
    </div>
  )
}
