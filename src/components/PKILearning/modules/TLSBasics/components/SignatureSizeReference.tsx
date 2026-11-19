// SPDX-License-Identifier: AGPL-3.0-only
import { clsx } from 'clsx'

import { TLS_SIGNATURE_SIZES } from '../utils/tlsSignatureSizes'

export function SignatureSizeReference({ selected }: { selected: string[] }) {
  return (
    <details className="space-y-2 text-xs">
      <summary className="min-h-8 cursor-pointer text-muted-foreground hover:text-foreground">
        Signature and public key sizes
      </summary>
      <p className="text-muted-foreground">
        The public values below omit the SubjectPublicKeyInfo wrapper. RSA-2048 also needs the
        exponent. Measure the actual encoded key and certificate when sizing a buffer.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <caption className="sr-only">TLS signature and public key encodings</caption>
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th scope="col" className="p-1.5 text-left font-medium">
                Signature scheme
              </th>
              <th scope="col" className="p-1.5 text-left font-medium">
                Signature
              </th>
              <th scope="col" className="p-1.5 text-left font-medium">
                Public key value or component
              </th>
            </tr>
          </thead>
          <tbody>
            {[...TLS_SIGNATURE_SIZES].map(([scheme, { signature, publicValue }]) => (
              <tr key={scheme} className="border-t border-border odd:bg-card even:bg-muted/30">
                <th
                  scope="row"
                  className={clsx(
                    'break-all p-1.5 text-left font-mono font-normal',
                    selected.includes(scheme) && 'font-bold text-primary'
                  )}
                >
                  {scheme}
                </th>
                <td className="p-1.5">{signature}</td>
                <td className="p-1.5">{publicValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-x-2 text-primary">
        <a className="underline" href="https://csrc.nist.gov/pubs/fips/204/final">
          FIPS 204 sizes
        </a>
        <a className="underline" href="https://www.rfc-editor.org/rfc/rfc5480.html#section-2.2">
          RFC 5480 EC points
        </a>
        <a className="underline" href="https://www.rfc-editor.org/rfc/rfc8017.html#appendix-A.1.1">
          RFC 8017 RSA public keys
        </a>
        <a className="underline" href="https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1.5">
          RFC 8032 Ed25519
        </a>
      </p>
    </details>
  )
}
