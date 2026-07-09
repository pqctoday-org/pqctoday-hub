// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Search, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeAlgorithmName } from '@/data/cyclonedxCryptoRegistry'

/**
 * Algorithm Name Normalizer — the "one mechanism, many names" problem made
 * hands-on: type (or pick) a real-world identifier as an HSM, certificate,
 * JWT service or scanner would report it, and resolve it to the registry's
 * canonical family, primitive type, and standardization references.
 */

const PRESETS: { input: string; source: string }[] = [
  { input: 'CKM_ECDSA_SHA256', source: 'PKCS#11 / HSM mechanism' },
  { input: 'ES256', source: 'JOSE / JWT alg value' },
  { input: 'aes_256_gcm', source: 'Library / config string' },
  { input: 'id-ml-dsa-65', source: 'OID-style PQC identifier' },
  { input: 'RSA2048', source: 'Vendor scanner (under-specified)' },
]

export function AlgorithmNormalizer() {
  const [query, setQuery] = useState('')

  const match = useMemo(() => (query.trim() ? normalizeAlgorithmName(query) : null), [query])
  const searched = query.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <Search size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Resolve a messy identifier</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste an identifier the way a real tool would report it, or pick one below.
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. CKM_ECDSA_SHA256"
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
                <CheckCircle2 size={16} /> Resolved to a canonical family
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{match.family.family}</span>
                <span className="text-xs text-muted-foreground">
                  matched via {match.matchedOn.replace('-', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(match.family.variant.map((v) => v.primitive))].map((p) => (
                  <span
                    key={p}
                    className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
              {match.family.standard.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Standardized by:{' '}
                  {match.family.standard.map((s, i) => (
                    <span key={s.name}>
                      {i > 0 && ', '}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {s.name}
                      </a>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-status-error">
                <XCircle size={16} /> No canonical family found
              </div>
              <p className="text-xs text-muted-foreground">
                Some real-world identifiers are under-specified — the registry has no bare
                &ldquo;RSA&rdquo; family because it splits signature (RSASSA-PKCS1/PSS) from
                encryption (RSAES-PKCS1/OAEP) from other uses. A scanner reporting just
                &ldquo;RSA2048&rdquo; hasn&apos;t told you which one it found; that ambiguity is
                exactly what a fully-qualified name is supposed to remove.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
