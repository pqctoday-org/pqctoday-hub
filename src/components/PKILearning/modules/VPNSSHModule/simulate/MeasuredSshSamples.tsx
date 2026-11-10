// SPDX-License-Identifier: AGPL-3.0-only
import type { ProtocolSizeEntry } from '../data/protocolSizeComparisons'
import { sshSample } from '../data/measuredSshHandshake'

export function MeasuredSshSamples({ entries }: { entries: ProtocolSizeEntry[] }) {
  if (!entries.length) return null
  return (
    <section aria-label="Measured SSH transport examples" className="glass-panel p-4 space-y-3">
      <h4 className="text-sm font-bold text-foreground">What the SSH totals include</h4>
      <p className="text-xs text-muted-foreground">
        Captured 9 November 2026 using experimental OQS-OpenSSH 10.3 with OpenSSL 3.6.3, fictional
        keys, aes128-ctr encryption, hmac-sha2-256 and no negotiated compression. Key exchange and
        host authentication are configured separately. The first two samples use Ed25519 host
        authentication; the third uses ML-DSA-65.
      </p>
      <p className="text-xs text-muted-foreground">
        Each total includes both identification lines, both KEXINIT packets, client initialization,
        the signed server reply and both NEWKEYS packets. Actual packet lengths, string wrappers and
        padding are included. Client login, application data and TCP/IP overhead are excluded. These
        are sample transport byte counts, not universal sizes or measured latency.
      </p>
      <p className="text-xs text-muted-foreground">
        The pure ML-KEM/ML-DSA case measures this experimental implementation; it is not a claim of
        support in an ordinary OpenSSH installation. Its SSH exchange and authentication proposals
        remain drafts. A hybrid exchange can also be paired with PQC authentication; this table’s
        hybrid sample deliberately retains Ed25519 so the exchange-size change can be compared.
      </p>
      {entries.map((entry) => {
        const sample = sshSample(entry.mode)
        return (
          <details key={entry.mode} className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-xs font-semibold text-foreground">
              {entry.modeLabel}: {sample.totalBytes.toLocaleString()} B
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              Client key share: {sample.clientShareBytes.toLocaleString()} B. Server key share:{' '}
              {sample.serverShareBytes.toLocaleString()} B. ML-KEM ciphertext component:{' '}
              {sample.ciphertextBytes.toLocaleString()} B. The key/share column shows the client
              share, not the complete exchange.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Host public key: {sample.rawPublicKeyBytes.toLocaleString()} B raw,{' '}
              {sample.hostKeyBlobBytes.toLocaleString()} B as an SSH key blob. Host signature:{' '}
              {sample.rawSignatureBytes.toLocaleString()} B raw,{' '}
              {sample.signatureBlobBytes.toLocaleString()} B as an SSH signature blob. The server
              reply below includes both blobs, its key share and their enclosing fields.
            </p>
            <table className="mt-3 w-full table-fixed text-xs">
              <caption className="text-left font-semibold mb-1">
                Captured SSH transport bytes
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left py-1 w-[35%]">
                    Direction
                  </th>
                  <th scope="col" className="text-left py-1">
                    Unit
                  </th>
                  <th scope="col" className="text-right py-1 w-[20%]">
                    Bytes
                  </th>
                </tr>
              </thead>
              <tbody>
                {sample.messages.map((message, index) => (
                  <tr key={`${message.direction}-${index}`} className="border-b border-border/50">
                    <td className="py-1">
                      {message.direction === 'client-to-server'
                        ? 'Client → server'
                        : 'Server → client'}
                    </td>
                    <td className="py-1 break-all">{message.name}</td>
                    <td className="text-right py-1">{message.bytes.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2} className="text-left py-1">
                    Total
                  </th>
                  <td className="text-right py-1 font-semibold">
                    {sample.totalBytes.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </details>
        )
      })}
      <p className="text-xs text-muted-foreground">
        Capture both directions with your production tools, confirm the negotiated exchange and host
        signature algorithm, and state the counting boundary. Authentication keys and signatures,
        negotiation lists and framing all affect the size. The separate TLS examples count TLS
        handshake messages without TLS record framing, so these totals are not an identical
        wire-overhead boundary across protocols.
      </p>
    </section>
  )
}
