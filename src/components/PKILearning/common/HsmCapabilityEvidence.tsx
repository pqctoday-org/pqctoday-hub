// SPDX-License-Identifier: AGPL-3.0-only
import { getHsmFactsForSoftware } from '@/data/hsmCapabilityXrefData'

export function HsmCapabilityEvidence({ softwareName }: { softwareName?: string }) {
  const facts = getHsmFactsForSoftware(softwareName)
  return (
    <section aria-label="HSM algorithm evidence" className="space-y-3 text-sm">
      <h5 className="font-bold text-foreground">Algorithm availability and validation evidence</h5>
      <p className="text-muted-foreground">
        Availability does not establish certification. These family-level records do not establish
        support for every parameter set, firmware or operating environment. Check the source for the
        exact scope.
      </p>
      {!facts.length && (
        <p className="text-muted-foreground">
          No capability evidence recorded for this product. Do not infer support from another
          product by the same vendor.
        </p>
      )}
      {facts.map((fact) => (
        <details
          key={`${fact.productId}:${fact.algorithm}`}
          className="rounded border border-border p-2"
        >
          <summary className="cursor-pointer text-foreground">
            {fact.algorithm}: {fact.available} · Review: {fact.verificationStatus}
          </summary>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground [&>div]:min-w-0 [&_dd]:[overflow-wrap:anywhere]">
            <div>
              <dt>PKCS#11 mechanism</dt>
              <dd>
                {fact.pkcs11Mechanism}
                {fact.mechanismName ? `: ${fact.mechanismName}` : ''}
              </dd>
            </div>
            <div>
              <dt>CAVP implementation certificate</dt>
              <dd>{fact.cavpCert}</dd>
            </div>
            <div>
              <dt>Approved mode</dt>
              <dd>{fact.approvedMode}</dd>
            </div>
            <div>
              <dt>Listed on the CMVP certificate</dt>
              <dd>
                {fact.cmvpCertListsIt}
                {fact.cmvpCert ? ` (${fact.cmvpCert})` : ''}
              </dd>
            </div>
            <div>
              <dt>Checked on</dt>
              <dd>{fact.verifiedOn || 'Not recorded'}</dd>
            </div>
          </dl>
          {fact.sourceUrl && /^https?:\/\//.test(fact.sourceUrl) && (
            <a
              className="text-primary underline break-words"
              href={fact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the source and scope
            </a>
          )}
          {fact.note && (
            <p className="mt-2 text-muted-foreground whitespace-pre-wrap break-words">
              {fact.note}
            </p>
          )}
        </details>
      ))}
    </section>
  )
}
