// SPDX-License-Identifier: GPL-3.0-only
/**
 * Federal PKI Profile Pair.
 *
 * Two certificate profiles from the same authority — one in force and
 * classical, one draft and post-quantum. Crypto agility as an actual document
 * lifecycle, and a reminder of the difference between "published" and
 * "bindable".
 */
import { FileBadge, ExternalLink, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router'
import { FPKI_PROFILE_PAIR } from '../data/mandateData'

const COLUMNS = [
  { key: 'classical' as const, tone: 'border-border bg-muted/50' },
  { key: 'postQuantum' as const, tone: 'border-primary/30 bg-primary/10' },
]

export const FpkiProfilePair = () => (
  <div className="space-y-6">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileBadge size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gradient">Federal PKI Profile Pair</h3>
          <p className="text-sm text-muted-foreground">
            The same authority maintaining a classical profile and a post-quantum one at the same
            time.
          </p>
        </div>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-2">
      {COLUMNS.map(({ key, tone }) => {
        const p = FPKI_PROFILE_PAIR[key]
        return (
          <section key={key} className={`glass-panel p-5 border ${tone}`}>
            <h4 className="font-semibold">{p.label}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{p.status}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Algorithms
                </dt>
                <dd className="mt-0.5 font-mono text-foreground">{p.algorithms}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Notes</dt>
                <dd className="mt-0.5 text-muted-foreground">{p.note}</dd>
              </div>
            </dl>
            <Link
              to={`/library?ref=${encodeURIComponent(p.libraryRef)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink size={12} /> Open the profile
            </Link>
          </section>
        )
      })}
    </div>

    <section className="glass-panel p-6 border-l-4 border-l-status-warning">
      <p className="text-sm">
        <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5 text-status-warning" />
        <strong className="text-foreground">Published is not the same as bindable.</strong> The PQC
        profile is a draft produced for CITE testing. It is strong evidence of direction and of the
        algorithms the Federal PKI intends to profile, and it is not something to write into a
        supplier contract yet. Treating a draft as a requirement is one of the more common ways
        migration programmes acquire commitments they cannot enforce.
      </p>
    </section>
  </div>
)
