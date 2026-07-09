// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Waypoints, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lookupCurve } from '@/data/cyclonedxCryptoRegistry'

/**
 * Curve Identifier Lookup — the elliptic-curve half of normalization: resolve
 * a curve name, vendor/library alias, or OID to its canonical registry entry,
 * showing the standardization category and algebraic form.
 */

const PRESETS: { input: string; source: string }[] = [
  { input: 'P-256', source: 'NIST name' },
  { input: 'secp256r1', source: 'SECG / OpenSSL name' },
  { input: 'prime256v1', source: 'X9.62 / OpenSSL alias' },
  { input: '1.2.840.10045.3.1.7', source: 'OID' },
  { input: 'X25519', source: 'IETF / TLS key-agreement name' },
]

export function CurveLookup() {
  const [query, setQuery] = useState('')

  const match = useMemo(() => (query.trim() ? lookupCurve(query) : null), [query])
  const searched = query.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <Waypoints size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Resolve a curve name or OID</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a curve as reported by a certificate, library, or protocol — or pick one below.
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. secp256r1 or 1.2.840.10045.3.1.7"
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.input}
              variant="outline"
              size="sm"
              onClick={() => setQuery(p.input)}
              className={query === p.input ? 'border-primary bg-primary/15 text-primary' : ''}
              title={p.source}
            >
              {p.input}
            </Button>
          ))}
        </div>
      </div>

      {searched && (
        <div className="glass-panel p-4">
          {match ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-status-success">
                <CheckCircle2 size={16} /> Resolved to a canonical curve
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{match.curve.name}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {match.category.name}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                  <div className="text-[11px] font-bold text-primary mb-0.5">OID</div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {match.curve.oid ?? 'Not assigned'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                  <div className="text-[11px] font-bold text-primary mb-0.5">Form</div>
                  <p className="text-xs text-muted-foreground">{match.curve.form ?? 'Unknown'}</p>
                </div>
              </div>
              {match.category.description && (
                <p className="text-xs text-muted-foreground">{match.category.description}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-status-error">
                <XCircle size={16} /> No canonical curve found
              </div>
              <p className="text-xs text-muted-foreground">
                Check the spelling, or try the curve&apos;s OID instead of its name — different
                standards bodies (NIST, SECG, ANSI X9.62) sometimes assign different names to the
                same underlying curve, but the OID is unambiguous.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
