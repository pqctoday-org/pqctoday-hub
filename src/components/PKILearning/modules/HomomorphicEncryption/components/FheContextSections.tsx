// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Gauge, Lightbulb, ListChecks, Scale, Sparkles } from 'lucide-react'
import {
  FHE_ACCELERATION,
  FHE_OVERHEAD_QUOTES,
  FHE_PET_COMPARISON,
  FHE_PROMISE_ROWS,
  FHE_REFERENCE_GROUPS,
  FHE_SCHEME_FIT,
  FHE_STANDARDS,
  FHE_UNCONFIRMED_CLAIMS,
  FHE_USE_CASES,
  TAKEAWAYS,
  type FheEvidenceLevel,
} from '../data/fheContextData'

/** Small bordered summary box shown at the top of each Learn section. */
export const KeyTakeaways: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
    <div className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
      <Lightbulb size={13} className="text-primary" aria-hidden="true" />
      Key takeaways
    </div>
    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
)

const TH = 'text-left p-1.5 text-muted-foreground font-medium'

/** Section 1 box: what "fully homomorphic" promises, and what it does not. */
export const FhePromiseBox: React.FC = () => (
  <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
      <Sparkles size={14} className="text-primary" />
      What &ldquo;fully homomorphic&rdquo; promises, and what it does not
    </h3>
    <p className="text-xs text-muted-foreground">
      Gentry proposed a fully homomorphic encryption scheme, &ldquo;a scheme that allows one to
      evaluate circuits over encrypted data without being able to decrypt&rdquo; (Gentry, STOC
      2009). &ldquo;Fully&rdquo; means there is no limit on which circuit can be evaluated: with
      bootstrapping, additions and multiplications can be chained without end. It is a statement
      about what is possible, not about precision, speed, integrity or who sees the result. The name
      invites expectations that the sources qualify:
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className={TH}>The name invites</th>
            <th className={TH}>What the sources show</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {FHE_PROMISE_ROWS.map((row) => (
            <tr key={row.expectation} className="border-b border-border/50 align-top">
              <td className="p-1.5 font-medium text-foreground">{row.expectation}</td>
              <td className="p-1.5">{row.sourcesShow}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

/** Section 2: fixed-point (not floating-point) CKKS, and which scheme fits which data. */
export const FheFixedPointAndFit: React.FC = () => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-bold text-foreground mb-1">Fixed-point, not floating-point</h3>
      <p className="text-xs text-muted-foreground">
        CKKS was built as &ldquo;a homomorphic encryption scheme for approximate arithmetic&rdquo;
        (Cheon, Kim, Kim &amp; Song 2017). A real value is multiplied by a scale, a power of two
        (2^scale), and rounded to an integer before encryption, so every value carries a fixed
        number of fractional bits; there is no exponent as in floating point. Lattigo describes its
        CKKS package as providing &ldquo;fixed-point approximate arithmetic over the complex
        numbers&rdquo;. Values must stay within the range the parameters allow, and the last bits of
        every result are noise. TFHE, BFV and BGV compute exactly on integers (TFHE also on
        booleans), with no approximation as long as the noise stays within bounds.
      </p>
    </div>
    <div>
      <h3 className="text-sm font-bold text-foreground mb-1">Which scheme for which data</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Data and computation</th>
              <th className={TH}>Scheme</th>
              <th className={TH}>Why</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {FHE_SCHEME_FIT.map((row) => (
              <tr key={row.need} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.need}</td>
                <td className="p-1.5 font-mono">{row.scheme}</td>
                <td className="p-1.5">{row.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const LEVEL_COLORS: Record<FheEvidenceLevel, string> = {
  Production: 'text-status-success border-success/30',
  'Peer-reviewed': 'text-primary border-primary/30',
  'Regulator case study': 'text-secondary border-secondary/30',
  Pilot: 'text-secondary border-secondary/30',
  'Vendor documentation': 'text-status-warning border-warning/30',
  'Research only': 'text-muted-foreground border-border',
}

/** Learn section 3: where FHE is used, ranked by evidence level. */
export const FheUseCasesSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.useCases} />

    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <ListChecks size={16} className="text-primary" />
        Use cases, ranked by evidence
      </h3>
      <p className="text-xs text-muted-foreground">
        Costs are as reported by each source, on its own hardware and baseline; they are not
        comparable across rows. Sources are in the References list at the end of this tab.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Use case</th>
              <th className={TH}>Evidence</th>
              <th className={TH}>Scheme</th>
              <th className={TH}>Reported cost</th>
              <th className={TH}>Source</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {FHE_USE_CASES.map((row) => (
              <tr key={row.useCase} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.useCase}</td>
                <td className="p-1.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold whitespace-nowrap ${LEVEL_COLORS[row.level]}`}
                  >
                    {row.level}
                  </span>
                </td>
                <td className="p-1.5">{row.scheme}</td>
                <td className="p-1.5">{row.cost}</td>
                <td className="p-1.5">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        <strong>AI inference and training.</strong> Encrypted inference is well studied: CryptoNets
        (2016) classified handwritten digits at 99% accuracy. Encrypted training has been shown for
        small models and takes hours (logistic regression on 422,108 samples in about 17 hours, Han
        et al. 2019). TFHE-based tools work on small integers: Concrete ML&apos;s documentation
        states that &ldquo;FHE requires all inputs, constants, and intermediate values to be
        integers of maximum 16 bits&rdquo;.
      </p>
    </div>

    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground">
        When FHE&apos;s value justifies its cost
      </h3>
      <p className="text-xs text-muted-foreground">
        A pattern runs through the deployments above, offered as a reading of the sources rather
        than a rule. The query or computation is small or simple (a lookup, a match, a count, a
        linear model). A response in seconds to hours is acceptable: Mastercard notes that
        &ldquo;for now, FHE is more suited to needs requiring a response measured in seconds rather
        than milliseconds&rdquo;. And a legal or trust barrier keeps the data from being shared in
        the clear, such as cross-border rules on financial data or a service that must not learn
        what a user looks up. The UK NCSC advises organisations to &ldquo;first consider whether
        traditional cryptography will solve your data processing problem&rdquo;.
      </p>
    </div>

    <div className="rounded-lg p-3 border border-border">
      <div className="text-xs font-bold text-foreground mb-1">
        Not confirmed by a primary source
      </div>
      <p className="text-xs text-muted-foreground mb-1">
        These claims circulate online; we could not confirm them from a primary source, so this
        module does not repeat them:
      </p>
      <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
        {FHE_UNCONFIRMED_CLAIMS.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  </div>
)

/** Learn section 4: the cost of FHE and how it is being reduced. */
export const FheCostSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.cost} />

    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Gauge size={16} className="text-primary" />
        How much slower?
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Source</th>
              <th className={TH}>Date</th>
              <th className={TH}>Statement</th>
              <th className={TH}>Caveat</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {FHE_OVERHEAD_QUOTES.map((row) => (
              <tr key={row.who} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.who}</td>
                <td className="p-1.5 whitespace-nowrap">{row.when}</td>
                <td className="p-1.5">{row.quote}</td>
                <td className="p-1.5">{row.caveat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        The figures differ by orders of magnitude because they describe different workloads, schemes
        and years. Beyond computation, the UN PET Guide lists &ldquo;message expansion,
        computational cost, and engineering cost&rdquo;: ciphertexts and keys are much larger than
        the data they protect.
      </p>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Scale size={16} className="text-primary" />
        FHE and the other privacy-enhancing technologies
      </h3>
      <p className="text-xs text-muted-foreground">
        Each technique has a different cost and asks you to trust something different. They are
        often combined.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Technique</th>
              <th className={TH}>Cost</th>
              <th className={TH}>What you must trust, and what it leaves open</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {FHE_PET_COMPARISON.map((row) => (
              <tr key={row.pet} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.pet}</td>
                <td className="p-1.5">{row.cost}</td>
                <td className="p-1.5">{row.trust}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground">How the cost is being reduced</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Approach</th>
              <th className={TH}>Example</th>
              <th className={TH}>Reported result</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {FHE_ACCELERATION.map((row) => (
              <tr key={row.example} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground whitespace-nowrap">
                  {row.approach}
                </td>
                <td className="p-1.5">{row.example}</td>
                <td className="p-1.5">{row.reported}</td>
                <td className="p-1.5">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        <strong>Reading these numbers:</strong> each speedup is measured against that paper&apos;s
        own baseline, often a single CPU thread, so the figures cannot be compared with each other
        or multiplied together. DARPA&apos;s DPRIVE programme set the goal of bringing FHE
        &ldquo;within a factor of ten of unencrypted computations&rdquo;; none of the sources above
        shows that goal met.
      </p>
      {/* MEASURED-RESULTS: our own board measurements (CKKS key generation and streaming on
          embedded boards) go here once their evidence records are published. */}
    </div>
  </div>
)

/** Learn section 7: standards and compliance. */
export const FheStandardsSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.standards} />

    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className={TH}>Standard or body</th>
            <th className={TH}>Covers FHE?</th>
            <th className={TH}>Status</th>
            <th className={TH}>Source</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {FHE_STANDARDS.map((row) => (
            <tr key={row.body} className="border-b border-border/50 align-top">
              <td className="p-1.5 font-medium text-foreground">{row.body}</td>
              <td className="p-1.5">{row.coversFhe}</td>
              <td className="p-1.5">{row.status}</td>
              <td className="p-1.5">{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground">What you can and cannot claim</h3>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>Can:</strong> the conventional cryptography around an FHE service (TLS, AES, key
          wrapping, signatures, random number generation) can run in a FIPS 140-3 validated module.
          The CMVP certificate of an FHE-related product (#5175) lists only such conventional
          algorithms.
        </li>
        <li>
          <strong>Cannot:</strong> that FHE itself is FIPS-validated or FIPS-approved. FHE is not
          among the approved security functions, and a non-approved function does not run in a
          module&apos;s approved mode.
        </li>
        <li>
          <strong>Cannot:</strong> that FHE is CNSA 2.0-approved (NSA lists homomorphic encryption
          among uses with no generally approved solutions) or Common Criteria-certified (no
          protection profile or certified product covers it).
        </li>
        <li>
          <strong>Cannot yet:</strong> conformance to a published ISO/IEC FHE standard; ISO/IEC
          28033 is still at DIS and FDIS. The HomomorphicEncryption.org Security Standard v1.1
          (2018) is a community standard for parameter selection.
        </li>
        <li>
          <strong>Data protection:</strong> encryption is not anonymisation. The EDPB&apos;s draft
          anonymisation guidelines (02/2026, paragraph 91) say &ldquo;encryption is, by its very
          nature, intended to be reversible and differs from anonymisation&rdquo;, and that it is
          important to assess whether those with access to the data could still decrypt it
          &ldquo;with means reasonably likely to be used&rdquo;, even without the key today.
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        The FHE mechanisms in the pqctoday HSM simulation used by the workshop are vendor-defined
        educational mechanisms. They are outside any FIPS 140-3 approved mode and are not certified.
      </p>
    </div>
  </div>
)

/** One References list for the whole Learn tab, grouped by topic. */
export const FheReferencesList: React.FC = () => (
  <section className="glass-panel p-6 space-y-4" aria-labelledby="fhe-references-heading">
    <h3 id="fhe-references-heading" className="text-lg font-bold text-gradient">
      References
    </h3>
    {FHE_REFERENCE_GROUPS.map((group) => (
      <div key={group.topic} className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">{group.topic}</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {group.refs.map((ref) => (
            <li key={ref.text}>
              {ref.text}
              {ref.url && (
                <>
                  {' '}
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {ref.url.replace(/^https?:\/\//, '')}
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </section>
)
