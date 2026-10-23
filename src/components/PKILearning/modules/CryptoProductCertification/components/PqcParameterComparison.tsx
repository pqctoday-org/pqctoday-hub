// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'

const rows = [
  {
    name: 'ML-KEM — establish a shared secret',
    sets: '512 / 768 / 1024: NIST security categories 1 / 3 / 5.',
    choices:
      'Key generation, encapsulation and decapsulation are separate operations. Internal hash functions are fixed by FIPS 203; there is no pure/pre-hash signing choice.',
    source: '203',
    section: '§§4, 7–8',
  },
  {
    name: 'ML-DSA — sign and verify',
    sets: '44 / 65 / 87: categories 2 / 3 / 5. An approved RBG with at least 128 but less than 192 bits of security reduces ML-DSA-44 to category 1 (§3.6.1).',
    choices:
      'Pure ML-DSA or pre-hash HashML-DSA; deterministic or hedged signing (with fresh randomness). Record the context string and, for pre-hash, the hash function and digest length.',
    source: '204',
    section: '§§3.4–3.6, 4–5',
  },
  {
    name: 'SLH-DSA — sign and verify',
    sets: 'SHA2 or SHAKE × 128 / 192 / 256 (categories 1 / 3 / 5) × s / f: 12 sets. “s” targets smaller signatures; “f” targets faster signing.',
    choices:
      'Pure SLH-DSA or pre-hash HashSLH-DSA; deterministic or hedged signing. Record context and any pre-hash separately: the SHA2/SHAKE parameter-set name does not identify the message pre-hash.',
    source: '205',
    section: '§§9–11',
  },
] as const

export const PqcParameterComparison = () => (
  <section aria-label="PQC parameter coverage" className="space-y-3">
    <h3 className="text-base font-semibold text-foreground">
      More than key size: what was tested?
    </h3>
    <p>
      “ML-DSA passed” is incomplete. Which parameter set, operation and signing mode passed? Compare
      three lists: what the standard defines, what this product supports, and what the report
      actually tested. They are not necessarily the same.
    </p>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <caption className="sr-only">
          Algorithm-specific choices to identify in test evidence
        </caption>
        <thead className="bg-muted/60">
          <tr>
            <th scope="col" className="p-3">
              Algorithm and source
            </th>
            <th scope="col" className="p-3">
              Parameter sets
            </th>
            <th scope="col" className="p-3">
              Other distinctions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.source} className="border-t border-border align-top">
              <th scope="row" className="p-3 font-medium">
                {row.name}
                <a
                  className="mt-2 block text-primary underline"
                  href={`https://doi.org/10.6028/NIST.FIPS.${row.source}`}
                >
                  FIPS {row.source} {row.section}
                </a>
              </th>
              <td className="p-3">{row.sets}</td>
              <td className="p-3">{row.choices}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      Example: a passing ML-DSA-65 pure, deterministic signing test does not by itself establish
      coverage of ML-DSA-87, hedged signing or HashML-DSA. Look for evidence covering the
      combinations the product claims to support, including whether tests exercise an internal
      algorithm function or the application-facing interface. This is a review aid, not a new
      universal certification checklist; the applicable validation or evaluation rules determine
      required coverage. NIST security categories are not CC assurance levels or EUCC assurance
      levels.
    </p>
    <p>
      Also identify the software version and execution environment. For key import, export or
      wrapping, name the key representation: a regeneration seed and an expanded private key are not
      interchangeable byte strings. A correct signing result alone does not test backup and restore.
      Keep measured speed and memory use separate from correctness and certification claims.
    </p>
    <p>
      Explore the existing{' '}
      <Link className="text-primary underline" to="/learn/slh-dsa">
        SLH-DSA parameter and signing exercises
      </Link>
      . For LMS or XMSS, use the{' '}
      <Link className="text-primary underline" to="/learn/stateful-signatures">
        state-management exercise and review guide
      </Link>
      : a signature can verify even when unsafe reuse of a one-time signing key has occurred. These
      Hub exercises are learning tools, not product certification evidence.
    </p>
  </section>
)
