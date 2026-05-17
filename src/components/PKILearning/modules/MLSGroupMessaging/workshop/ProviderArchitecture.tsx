// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { CheckCircle2, AlertCircle, Cpu, Lock } from 'lucide-react'
import { CRYPTO_ROUTING, MLS_LIBRARY_REFS } from '../data/mlsData'

export const ProviderArchitecture: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              How <code className="text-primary">openmls_pqctoday_crypto</code> wires OpenMLS to the
              HSM
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              OpenMLS expects a single <code>OpenMlsProvider</code> trait combining crypto,
              randomness, and storage. Our provider routes each crypto trait method through PKCS#11
              v3.2 against softhsmv3. The table below reflects the v0.2 implementation (Phase 1 +
              Phase 2 of the provider roadmap).
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-4">OpenMLS operation</th>
                <th className="py-2 pr-4">PKCS#11 mechanism</th>
                <th className="py-2 pr-4">HSM-resident</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {CRYPTO_ROUTING.map((r) => (
                <tr key={r.op} className="border-b border-border/40 align-top">
                  <td className="py-3 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
                    {r.op}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{r.pkcs11Mechanism}</td>
                  <td className="py-3 pr-4">
                    {r.hsmResident ? (
                      <span className="inline-flex items-center gap-1 text-status-success">
                        <CheckCircle2 size={14} /> yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-status-warning">
                        <AlertCircle size={14} /> Phase 2.1
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-status-success/10 p-2 text-status-success">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Signature key custody</h3>
            <p className="text-sm text-muted-foreground mt-1">
              When OpenMLS calls <code>signature_key_gen()</code>, our provider runs{' '}
              <code>C_GenerateKeyPair</code> with <code>CKA_SENSITIVE=TRUE</code> and{' '}
              <code>CKA_EXTRACTABLE=FALSE</code>. What we return to OpenMLS as the &quot;private
              key&quot; is an opaque, versioned handle blob.
            </p>
          </div>
        </div>

        <pre className="mt-4 bg-muted/40 rounded p-3 overflow-x-auto text-xs leading-relaxed">
          {`HsmKeyHandle wire format
┌────────┬─────────┬──────────┬──────────────┬────────────┐
│ "PQTH" │ ver (1) │ sig sch. │ cka_id_len   │  cka_id    │
│  4 B   │   1 B   │   2 B    │     2 B      │   N bytes  │
└────────┴─────────┴──────────┴──────────────┴────────────┘`}
        </pre>

        <p className="mt-4 text-sm text-muted-foreground">
          On every <code>sign()</code> call, the provider decodes the handle, looks up the token
          object via <code>C_FindObjects&#123; CKA_CLASS=PRIVATE_KEY, CKA_ID=… &#125;</code>, and
          runs <code>C_SignInit</code> + <code>C_Sign</code> inside the HSM. Real key bytes never
          exist in process memory.
        </p>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold">Authoritative references</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The library entries that anchor this module&apos;s claims:
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {MLS_LIBRARY_REFS.map((ref) => (
            <li key={ref} className="font-mono text-xs text-foreground">
              • {ref}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
