// SPDX-License-Identifier: AGPL-3.0-only
/**
 * How deployed hybrid KEMs combine their two shared secrets, and what makes
 * X-Wing different. Formulas are copied from the cited drafts.
 */
import React from 'react'
import { Link } from 'react-router'
import { GitCompare } from 'lucide-react'

interface CombinerRow {
  design: string
  combines: string
  binding: string
  scope: string
  refId: string
  refLabel: string
}

const ROWS: CombinerRow[] = [
  {
    design: 'TLS 1.3 hybrid groups',
    combines:
      'The two shared secrets, concatenated in the order the group defines, enter the TLS 1.3 key schedule (HKDF) as its shared-secret input.',
    binding: 'The handshake transcript, which includes both key shares.',
    scope: 'X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024.',
    refId: 'RFC-10024',
    refLabel: 'RFC 10024',
  },
  {
    design: 'X-Wing',
    combines: 'SHA3-256(ss_M ‖ ss_X ‖ ct_X ‖ pk_X ‖ XWingLabel)',
    binding:
      'Hashes the X25519 ciphertext and public key. Leaves out the ML-KEM ciphertext and public key.',
    scope: 'ML-KEM-768 + X25519 only. A 32-byte private seed.',
    refId: 'draft-connolly-cfrg-xwing-kem-11',
    refLabel: 'X-Wing draft -11',
  },
  {
    design: 'Composite ML-KEM (LAMPS)',
    combines: 'SHA3-256(mlkemSS ‖ tradSS ‖ tradCT ‖ tradPK ‖ Label)',
    binding:
      'The same shape as X-Wing: the traditional ciphertext and public key are hashed, with a label per algorithm.',
    scope:
      'Twelve pairings with RSA-OAEP, ECDH (P-256, P-384, P-521, Brainpool), X25519 and X448, for X.509 and CMS.',
    refId: 'draft-ietf-lamps-pq-composite-kem-23',
    refLabel: 'Composite ML-KEM -23',
  },
  {
    design: 'CFRG concrete hybrid KEMs',
    combines:
      'The generic CFRG framework with SHAKE256 as the PRG and SHA3-256 as the KDF, and a label per instance.',
    binding: 'The traditional ciphertext and public key, as in X-Wing.',
    scope:
      'MLKEM768-P256, MLKEM768-X25519 (stated to be identical to X-Wing) and MLKEM1024-P384; used by HPKE.',
    refId: 'draft-irtf-cfrg-concrete-hybrid-kems-04',
    refLabel: 'CFRG concrete -04',
  },
  {
    design: 'ETSI CatKDF / CasKDF',
    combines:
      'CatKDF: secret = psk ‖ k1 ‖ k2, then one KDF (HMAC, KMAC or HKDF) with a label and context. CasKDF runs one KDF stage per component, chaining them.',
    binding:
      'CatKDF puts all public keys and ciphertexts of both components into its context, which the composite ML-KEM draft calls the more conservative choice.',
    scope:
      'Agreed in the EU certification mechanisms (ACM v2.0): TLS and IKE child SAs use the concatenate principle, the IKE SA uses the cascade.',
    refId: 'ETSI TS 103 744',
    refLabel: 'ETSI TS 103 744',
  },
]

const libraryLink = (refId: string) => `/library?ref=${encodeURIComponent(refId)}`

export const CombinerComparison: React.FC = () => (
  <div
    data-testid="combiner-comparison"
    className="bg-muted/50 rounded-lg p-4 border border-border space-y-4"
  >
    <div className="flex items-center gap-2">
      <GitCompare size={16} className="text-primary shrink-0" />
      <h4 className="text-sm font-bold text-foreground">Combiners Compared, and X-Wing</h4>
    </div>
    <p className="text-xs text-muted-foreground">
      Every hybrid KEM merges two shared secrets, but designs differ in what else goes into the
      final key. Hashing the exchanged values (ciphertexts, public keys) ties the key to this
      exchange; TLS gets the same effect from its transcript.
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-bold text-foreground py-1.5 pr-3">Design</th>
            <th className="text-left font-bold text-foreground py-1.5 pr-3">What is combined</th>
            <th className="text-left font-bold text-foreground py-1.5 pr-3">
              What ties it to the exchange
            </th>
            <th className="text-left font-bold text-foreground py-1.5 pr-3">Scope</th>
            <th className="text-left font-bold text-foreground py-1.5">Source</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {ROWS.map((r) => (
            <tr key={r.design} className="border-b border-border/50 align-top">
              <td className="py-1.5 pr-3 font-semibold text-foreground">{r.design}</td>
              <td className="py-1.5 pr-3">
                {r.combines.startsWith('SHA3-256(') ? (
                  <code className="text-[10px] break-words">{r.combines}</code>
                ) : (
                  r.combines
                )}
              </td>
              <td className="py-1.5 pr-3">{r.binding}</td>
              <td className="py-1.5 pr-3">{r.scope}</td>
              <td className="py-1.5">
                <Link to={libraryLink(r.refId)} className="text-primary hover:underline">
                  {r.refLabel}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="space-y-2">
      <h5 className="text-xs font-bold text-foreground">What makes X-Wing different</h5>
      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
        <li>
          <strong className="text-foreground">It omits the ML-KEM ciphertext and key.</strong> The
          draft explains that X-Wing&apos;s security relies on the specifics of ML-KEM-768&apos;s
          Fujisaki-Okamoto transform, and warns that the combiner &ldquo;cannot be assumed to be
          secure, when used with different KEMs&rdquo;: it is &ldquo;not known to be safe to leave
          out the post-quantum ciphertext from the combiner in the general case&rdquo;.
        </li>
        <li>
          <strong className="text-foreground">Its security claim.</strong> If SHA3-256, SHA3-512 and
          SHAKE-256 are modelled as random oracles, X-Wing&apos;s IND-CCA security is bounded by
          that of ML-KEM-768 and the gap-CDH security of Curve25519.
        </li>
        <li>
          <strong className="text-foreground">Binding.</strong> The draft states that X-Wing binds
          the shared key to the public key and to the ciphertext (MAL-BIND-K-PK and MAL-BIND-K-CT),
          properties ML-KEM on its own does not achieve.
        </li>
        <li>
          <strong className="text-foreground">One fixed KEM with a seed key.</strong> X-Wing pairs
          only ML-KEM-768 with X25519. Its private key is a 32-byte seed that SHAKE256 expands into
          both component keys; the public key is 1,216 bytes, the ciphertext 1,120 bytes and the
          shared secret 32 bytes. That seed expansion is why the FIPS 140-3 guidance says X-Wing
          cannot yet be an approved hybrid service (see Implementation &amp; Validation).
        </li>
        <li>
          <strong className="text-foreground">
            The same construction, standardized elsewhere.
          </strong>{' '}
          The CFRG&apos;s concrete MLKEM768-X25519 is stated to be identical to X-Wing. The
          composite ML-KEM draft calls X-Wing and its MLKEM768-X25519 entry &ldquo;largely
          interchangeable&rdquo;: the one difference is that X-Wing generates both private keys from
          the same seed, while composite ML-KEM assumes independently generated components, for
          example separately validated ones. An X-Wing implementation counts as compliant composite
          ML-KEM, but not the other way round.
        </li>
      </ul>
    </div>
  </div>
)
