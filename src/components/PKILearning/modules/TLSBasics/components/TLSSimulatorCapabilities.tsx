// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'

export const TLSSimulatorCapabilities = () => (
  <div className="glass-panel p-4 border-l-4 border-primary/50">
    <h3 className="text-sm font-semibold mb-2">TLS 1.3 key exchange and authentication</h3>
    <ul className="text-xs text-muted-foreground space-y-2">
      <li>
        <strong>Key exchange.</strong> Try X25519 for a classical baseline, or X25519MLKEM768,
        SecP256r1MLKEM768, or SecP384r1MLKEM1024 for hybrid key agreement (
        <a className="text-primary underline" href="https://www.rfc-editor.org/info/rfc10024">
          RFC 10024
        </a>
        ). Standalone ML-KEM groups are also available.
      </li>
      <li>
        <strong>Sample certificates.</strong> The client and server offer RSA-2048, ML-DSA-44 and
        ML-DSA-87 identities. The peers negotiate a handshake signature independently of the key
        exchange group.
      </li>
      <li>
        <strong>Composite certificates.</strong> Explore X.509 Composite ML-DSA (
        <a className="text-primary underline" href="https://www.rfc-editor.org/info/rfc10073">
          RFC 10073
        </a>
        ) in the{' '}
        <Link to="/playground/hybrid-certs" className="text-primary underline">
          Hybrid Certificates Playground
        </Link>
        . The{' '}
        <a
          className="text-primary underline"
          href="https://datatracker.ietf.org/doc/draft-ietf-tls-composite-mldsa/"
        >
          TLS working group’s Composite ML-DSA draft
        </a>{' '}
        proposes the handshake signature schemes. Here the simulator runs the RSA and
        single-algorithm ML-DSA identities listed above.
      </li>
    </ul>
  </div>
)
