// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'

/** Keep the standard, evaluation criteria and scheme distinct at lesson entry. */
export const CertificationContexts = () => (
  <section
    aria-label="Separate certification contexts"
    className="rounded-lg border border-border p-4 space-y-3 text-sm"
  >
    <h3 className="font-semibold">FIPS 140-3, Common Criteria and EUCC are not interchangeable</h3>
    <dl className="space-y-3">
      <div>
        <dt className="font-semibold">
          <Link className="text-primary underline" to="/learn/fips-140-3-certification">
            FIPS 140-3 — cryptographic module requirements
          </Link>
        </dt>
        <dd>
          CMVP validates a defined cryptographic module against FIPS 140-3. When adding PQC, check
          the module’s approved services, algorithm validations and applicable CMVP change
          requirements.
        </dd>
      </div>
      <div>
        <dt className="font-semibold">
          <Link className="text-primary underline" to="/learn/cc-eucc-certification?path=cc">
            Common Criteria — evaluation criteria
          </Link>
        </dt>
        <dd>
          CC provides criteria for evaluating a defined product (the TOE) against its Security
          Target and any claimed Protection Profile. When adding PQC, check which security claims,
          requirements and evaluation evidence change. Identify the certification scheme separately.
        </dd>
      </div>
      <div>
        <dt className="font-semibold">
          <Link className="text-primary underline" to="/learn/cc-eucc-certification?path=eucc">
            EUCC — an EU certification scheme using Common Criteria
          </Link>
        </dt>
        <dd>
          For an EUCC evaluation, apply CC together with EUCC’s scheme-specific rules and applicable
          cryptographic guidance. EUCC rules are not automatically requirements for every CC
          evaluation. eIDAS is a separate legal context, relevant only where its requirements apply.
        </dd>
      </div>
    </dl>
    <p>
      <Link className="text-primary underline" to="/learn/cc-eucc-certification?path=eucc-eidas">
        eIDAS — device and trust-service requirements (optional)
      </Link>
    </p>
    <p>
      A passing algorithm test does not establish module validation or product certification.
      Evidence accepted in one context does not automatically satisfy another.
    </p>
    <p className="text-muted-foreground">
      Sources:{' '}
      <a
        className="underline"
        href="https://csrc.nist.gov/projects/fips-140-3-transition-effort/fips-140-3-docs"
      >
        NIST FIPS 140-3
      </a>
      ;{' '}
      <a
        className="underline"
        href="https://commoncriteriaportal.org/files/ccfiles/CC2022PART1R1.pdf"
      >
        CC:2022 Part 1
      </a>
      ;{' '}
      <a className="underline" href="https://certification.enisa.europa.eu/browse-topic/eucc_en">
        ENISA EUCC overview
      </a>
      .
    </p>
  </section>
)

/**
 * One line for the scheme deep dives that follow the Fundamentals module, which carries the full
 * side-by-side comparison above.
 */
export const CertificationContextsPointer = () => (
  <section
    aria-label="Separate certification contexts"
    className="rounded-lg border border-border p-4 text-sm"
  >
    FIPS 140-3, Common Criteria and EUCC answer different questions, and evidence accepted in one
    does not automatically satisfy another. The side-by-side comparison is in{' '}
    <Link className="text-primary underline" to="/learn/crypto-product-certification">
      Cryptographic Product Certification: Fundamentals
    </Link>
    .
  </section>
)
