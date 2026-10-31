// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import {
  COMPARED_LMS,
  COMPARED_SIZES,
  COMPARED_XMSS,
  bytesLabel,
} from '../../StatefulSignatures/data/signatureSizes'

// Size rows name the parameter set they print (SP 800-208 SHA-256/192 sets against the FIPS 205
// 192-bit sets) and take LMS and XMSS sizes from the RFC 8554 / RFC 8391 layouts, the same values
// the Stateful Hash Signatures module prints. SP 800-208 assigns no NIST security category to LMS
// or XMSS, so the rows compare size classes, not equal security. The CNSA 2.0 row is the NSA
// CNSA 2.0 FAQ, version 2.2 (October 2026).
const ROWS = [
  {
    label: 'Standardized in',
    lms: 'NIST SP 800-208 / RFC 8554',
    xmss: 'NIST SP 800-208 / RFC 8391',
    slhdsa: 'FIPS 205 (Aug 2024)',
  },
  {
    label: 'Parameter set shown in the size rows',
    lms: COMPARED_LMS.name,
    xmss: COMPARED_XMSS.name,
    slhdsa: 'SLH-DSA-SHA2-192s (-s) and SLH-DSA-SHA2-192f (-f)',
  },
  {
    label: 'Statefulness',
    lms: 'Stateful — must track leaf index',
    xmss: 'Stateful — must track leaf index',
    slhdsa: 'Stateless — no counter',
  },
  {
    label: 'Max signatures',
    lms: 'Up to 2^H (H = 5, 10, 15, 20 or 25)',
    xmss: 'Up to 2^H (H = 10, 16 or 20)',
    slhdsa: 'At most 2^64 messages/key in the FIPS 205 §11 security analysis; no leaf counter',
  },
  {
    label: 'Public key',
    lms: bytesLabel(COMPARED_SIZES.lms.publicKey),
    xmss: bytesLabel(COMPARED_SIZES.xmss.publicKey),
    slhdsa: bytesLabel(COMPARED_SIZES.slhdsa192s.publicKey),
  },
  {
    label: 'Signature',
    lms: bytesLabel(COMPARED_SIZES.lms.signature),
    xmss: bytesLabel(COMPARED_SIZES.xmss.signature),
    slhdsa: `${bytesLabel(COMPARED_SIZES.slhdsa192s.signature)} (-s) / ${bytesLabel(COMPARED_SIZES.slhdsa192f.signature)} (-f)`,
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
    lms: 'Single-tree LMS approved for firmware and software signing; LMS SHA-256/192 recommended; multi-tree HSS not allowed',
    xmss: 'Single-tree XMSS approved for firmware and software signing; multi-tree XMSS^MT not allowed',
    slhdsa: 'Not approved for any use in NSS',
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
      All three schemes are hash-based: their security rests only on hash-function properties (BSI
      TR-02102-1 section 5.3.4), which are believed to withstand large-scale quantum computers (SP
      800-208). The choice comes down to state management requirements, signature size constraints,
      and signing frequency.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium w-40">Property</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">LMS</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">XMSS</th>
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

    <p className="text-[10px] text-muted-foreground leading-relaxed">
      Sizes: LMS public key 4 + 4 + 16 + m bytes and signature 12 + n(p + 1) + m·h bytes (RFC 8554
      &sect;5.3 and &sect;5.4, with the SP 800-208 SHA-256/192 parameters n = m = {COMPARED_LMS.n},
      p = {COMPARED_LMS.p}, h = {COMPARED_LMS.h}); XMSS public key 4 + 2n bytes and signature 4 + n
      + len·n + h·n bytes (RFC 8391 &sect;4.1.7 and &sect;4.1.8, len = {COMPARED_XMSS.len}); SLH-DSA
      from FIPS 205 Table 2. An HSS key with one level adds 4 bytes to the LMS public key and to
      each signature. SP 800-208 assigns no NIST security category to LMS or XMSS, so these rows
      compare size classes, not equal security.
    </p>

    <div className="bg-muted/40 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
      <strong className="text-foreground">How to choose:</strong> start with the policy that applies
      to you. Under CNSA 2.0, SLH-DSA is not approved for any use in national security systems,
      while single-tree LMS and XMSS are approved for firmware and software signing (ML-DSA-87 is
      also allowed). Outside that scope, the main difference is state: SLH-DSA has no leaf counter
      to protect, at the cost of the larger signatures above. SP 800-208 requires LMS and XMSS key
      and signature generation to run in a hardware cryptographic module that does not allow secret
      keying material to be exported, even in encrypted form.
    </div>
  </div>
)
