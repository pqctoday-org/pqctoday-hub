// SPDX-License-Identifier: AGPL-3.0-only
import type { Track } from './evidenceLabLogic'

const estimators = [
  [
    'Most Common Value',
    'Counts the most frequent value: always guessing that value can already be a good strategy. A lower estimate means that this bias allows less entropy to be credited.',
  ],
  [
    'Collision',
    'Measures how soon a value repeats. Frequent early repeats can reveal unequal probabilities and reduce the estimate. This estimator operates on binary data.',
  ],
  [
    'Markov',
    'Examines whether the next bit depends on the previous bit. A lower estimate can expose predictable transitions even when zeros and ones are equally common.',
  ],
  [
    'Compression',
    'Uses the distances between repeated blocks to detect redundancy in binary data. A lower estimate means that this method credits less entropy because of the structure it observes; it is not a file-compression benchmark.',
  ],
  [
    't-Tuple',
    'Counts repeated groups of consecutive samples, such as pairs and triples. Common groups can make sequences easier to guess even when individual values look balanced; this reduces the estimate.',
  ],
  [
    'Longest Repeated Substring (LRS)',
    'Uses repeated sequences to estimate entropy. A low estimate can reveal structure missed by counting single values. This numerical estimator is different from the IID pass/fail LRS test.',
  ],
  [
    'Multi Most Common in Window',
    'Predicts the next value using the most common value in several recent windows. Successful guesses can expose local bias that changes over time and lower the estimate.',
  ],
  [
    'Lag Prediction',
    'Tries predicting the next value by copying values from earlier positions. Successful guesses can expose periodic or delayed repetition and lower the estimate.',
  ],
  [
    'MultiMMC Prediction',
    'Learns which values tend to follow recent sequences of different lengths. Successful guesses can expose dependence on recent history and lower the estimate.',
  ],
  [
    'LZ78Y Prediction',
    'Builds a dictionary of earlier sequences and uses it to predict what comes next. Successful guesses can expose recurring patterns and lower the estimate.',
  ],
] as const

export function SequentialTestExplanation({ track }: { track: Track }) {
  return (
    <section aria-label="How to interpret sequential tests" className="space-y-3 text-sm">
      <p>
        These estimators ask how easily the next sample could be guessed from bias or patterns. They
        return an entropy estimate, not a pass/fail score. A lower number means less
        unpredictability is credited per sample. Use the lowest applicable estimate, not the average
        or the most favourable result. A high number alone does not prove a secure source.
      </p>
      <p>
        “Samples” means the original values; “bit string” means those values unpacked into bits. The
        table converts both to bits of entropy per sample so they can be compared. A dash means no
        value was reported, not zero entropy or a passed test.
      </p>
      <details>
        <summary className="cursor-pointer font-semibold">What each estimator tells you</summary>
        <dl className="mt-3 space-y-3">
          {estimators
            .filter((_, index) => track !== 'iid' || index === 0)
            .map(([name, explanation]) => (
              <div key={name}>
                <dt className="font-semibold">{name}</dt>
                <dd>{explanation}</dd>
              </div>
            ))}
        </dl>
      </details>
      {track === 'iid' && (
        <div className="space-y-2">
          <p>
            IID assumes samples do not depend on earlier samples and their probabilities stay the
            same over time. It does not require all values to be equally likely.
          </p>
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Chi-square tests</dt>
              <dd>
                Check for dependence between samples and changes in value frequencies across parts
                of the file. Rejection means the IID assumption is not supported; use the non-IID
                track.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">IID longest repeated substring test</dt>
              <dd>
                Checks whether a repeated sequence is unusually long for the observed value
                frequencies under the IID assumption. Rejection means the IID assumption is not
                supported; use the non-IID track.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Permutation tests</dt>
              <dd>
                Compare the original order with shuffled copies, looking at trends, runs, repeats,
                periodicity, relationships between separated samples and compressibility. Unusual
                results in the original order can reveal dependence. Rejection means use the non-IID
                track.
              </dd>
            </div>
          </dl>
          <p>
            Not rejecting IID means these checks found no reason to reject it in these samples. It
            does not prove independence: a source-design justification is also needed. Missing
            results or a tool error are not a pass.
          </p>
        </div>
      )}
      <p>
        A tool error means the assessment needs investigation. Read the diagnostic: failure to
        finish is not, by itself, proof of zero entropy.
      </p>
      <a
        className="text-primary underline"
        href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90B.pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        Source: NIST SP 800-90B, §§3.1.2–3.1.3, 5 and 6
      </a>
    </section>
  )
}

export function RestartTestExplanation() {
  return (
    <section aria-label="How to interpret restart tests" className="space-y-2 text-sm">
      <p>
        A source can look healthy during a long run but repeat predictable behaviour whenever it
        starts again. Each row contains samples from one restart; each column compares the same
        sample position across restarts.
      </p>
      <p>
        <strong>Sanity check:</strong> looks for a value occurring too often in any row or column,
        given the initial estimate. Failure means the restart data do not support that estimate; no
        entropy estimate is awarded by this assessment.
      </p>
      <p>
        <strong>Row and column estimates:</strong> repeat entropy estimation in both arrangements.
        If either estimate is below half the initial estimate, the restart assessment fails.
        Otherwise, keep the lowest of the initial, row and column estimates. Passing can still
        reduce the amount of entropy credited.
      </p>
      <p>
        <strong>What a pass means:</strong> these restart data passed these checks, not that every
        startup condition is safe. Here, device collection restarts the software collector, not the
        board power supply. An error or an unrun test leaves the assessment incomplete; it is not a
        pass.
      </p>
      <a
        className="text-primary underline"
        href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90B.pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        Source: NIST SP 800-90B, §3.1.4
      </a>
    </section>
  )
}
