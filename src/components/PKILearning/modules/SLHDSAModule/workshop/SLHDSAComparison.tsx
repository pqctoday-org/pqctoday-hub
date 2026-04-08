// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'

const ROWS = [
  {
    label: 'Standardized in',
    lms: 'NIST SP 800-208 / RFC 8554',
    xmss: 'NIST SP 800-208 / RFC 8391',
    slhdsa: 'FIPS 205 (Aug 2024)',
  },
  {
    label: 'Statefulness',
    lms: 'Stateful — must track leaf index',
    xmss: 'Stateful — must track leaf index',
    slhdsa: 'Stateless — no counter',
  },
  {
    label: 'Max signatures',
    lms: 'Up to 2^H (H=5…20)',
    xmss: 'Up to 2^H (H=10…20)',
    slhdsa: 'Unlimited',
  },
  { label: 'Public key (Level 3)', lms: '56 B', xmss: '64 B', slhdsa: '48 B (192-bit)' },
  {
    label: 'Signature (Level 3)',
    lms: '~1,616–4,457 B',
    xmss: '~2,500 B',
    slhdsa: '16,224 B (-s) / 35,664 B (-f)',
  },
  { label: 'Signing speed', lms: 'Fast (ms)', xmss: 'Fast (ms)', slhdsa: 'Slower (10s ms to ~1s)' },
  { label: 'Verification speed', lms: 'Fast', xmss: 'Fast', slhdsa: 'Moderate' },
  {
    label: 'State management risk',
    lms: 'High — key exhaustion fatal',
    xmss: 'High — key exhaustion fatal',
    slhdsa: 'None',
  },
  {
    label: 'Distributed deployment',
    lms: 'Hard (state sync required)',
    xmss: 'Hard (state sync required)',
    slhdsa: 'Easy (stateless)',
  },
  {
    label: 'CNSA 2.0',
    lms: 'Allowed (limited use)',
    xmss: 'Allowed (limited use)',
    slhdsa: 'Allowed',
  },
  {
    label: 'Best use cases',
    lms: 'HSM, firmware signing',
    xmss: 'Offline root CA, code signing',
    slhdsa: 'General PQC signing, code signing, certificates',
  },
]

export const SLHDSAComparison: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground leading-relaxed">
      All three schemes are hash-based and provide quantum-safe security with no new hardness
      assumptions. The choice comes down to state management requirements, signature size
      constraints, and signing frequency.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium w-40">Property</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">LMS/HSS</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">XMSS/XMSS^MT</th>
            <th className="text-left px-3 py-2 text-primary font-medium">SLH-DSA (FIPS 205)</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
              <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                {row.label}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{row.lms}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.xmss}</td>
              <td className="px-3 py-2 text-foreground">{row.slhdsa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-muted/40 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
      <strong className="text-foreground">Recommendation:</strong> For new deployments, prefer
      SLH-DSA unless signing frequency is very high and signature size is a concern. For embedded or
      HSM-only environments where state management is well-controlled, LMS remains a strong choice
      due to smaller signature sizes.
    </div>
  </div>
)
