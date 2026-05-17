// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { GitBranch, MessageSquare, Shield, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LEARN_CHAPTERS } from '../content'
import { MLS_CIPHERSUITES } from '../data/mlsData'

interface MLSIntroductionProps {
  onNavigateToWorkshop: () => void
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  baseline: { label: 'RFC 9420 baseline', cls: 'bg-primary/15 text-primary' },
  'draft-pq': {
    label: 'PQ draft',
    cls: 'bg-status-info/15 text-status-info',
  },
  'draft-hybrid': {
    label: 'Hybrid combiner draft',
    cls: 'bg-status-warning/15 text-status-warning',
  },
}

export const MLSIntroduction: React.FC<MLSIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Network size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gradient">
              Group messaging at scale, with PQC custody
            </h2>
            <p className="mt-2 text-muted-foreground">
              The Messaging Layer Security protocol (RFC 9420) gives groups of thousands the same
              forward secrecy and post-compromise guarantees Signal offers pairs. Our
              <span className="text-primary"> openmls_pqctoday_crypto</span> Rust provider wires the
              OpenMLS reference implementation to PKCS#11 v3.2 so signature keys live in an HSM and
              HPKE runs end-to-end inside the token.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <MessageSquare size={20} className="text-primary mb-2" />
          <h3 className="font-semibold">RFC 9420 baseline</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Asynchronous group key agreement via TreeKEM. Forward secrecy + post-compromise security
            with O(log N) Commit cost.
          </p>
        </div>
        <div className="glass-panel p-4">
          <GitBranch size={20} className="text-primary mb-2" />
          <h3 className="font-semibold">PQ ciphersuites</h3>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-foreground">draft-ietf-mls-pq-ciphersuites-04</span> registers
            ML-KEM-768 + ML-DSA-65 suites. WG Last Call as of March 2026.
          </p>
        </div>
        <div className="glass-panel p-4">
          <Shield size={20} className="text-primary mb-2" />
          <h3 className="font-semibold">HSM custody</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Our PKCS#11 provider holds signature keys as token objects with{' '}
            <span className="text-foreground">CKA_SENSITIVE=TRUE</span>. OpenMLS sees opaque
            handles, never raw bytes.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {LEARN_CHAPTERS.map((ch) => (
          <section key={ch.id} className="glass-panel p-6">
            <h3 className="text-xl font-semibold text-foreground">{ch.title}</h3>
            <div className="mt-3 space-y-3 text-muted-foreground">
              {ch.body.map((para, i) => (
                <p key={`${ch.id}-${i}`} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="glass-panel p-6">
        <h3 className="text-xl font-semibold text-foreground">Ciphersuites at a glance</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-4">Suite</th>
                <th className="py-2 pr-4">KEM</th>
                <th className="py-2 pr-4">Signature</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              {MLS_CIPHERSUITES.map((s) => {
                const badge = statusLabel[s.status]
                return (
                  <tr key={s.id} className="border-b border-border/40">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">{s.label}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{s.kem}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{s.signature}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{s.referenceId}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={onNavigateToWorkshop}>
          Open the workshop →
        </Button>
      </div>
    </div>
  )
}
