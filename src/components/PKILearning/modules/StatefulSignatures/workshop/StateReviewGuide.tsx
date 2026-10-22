// SPDX-License-Identifier: AGPL-3.0-only
export const StateReviewGuide = () => (
  <section
    aria-label="Reviewing state protection"
    className="rounded-lg border border-border p-4 space-y-3 text-sm"
  >
    <h3 className="font-bold">How does an engineer check that a leaf cannot be reused?</h3>
    <p>
      A leaf represents a one-time signing key. After using leaf 42, the signer must remember not to
      use it again—even after a crash. Skipping a leaf wastes capacity; reusing it breaks the
      single-use rule.
    </p>
    <p>
      <strong>NIST requirement:</strong> SP 800-208 §8.1 requires incrementing and durably storing
      the leaf index before exporting a signature or accepting another signing request. It prohibits
      generating more than one signature with the same one-time key. This is the NIST profile, not a
      universal CC/EUCC test procedure.
    </p>
    <p>Practical assessment methods—not a prescribed NIST test checklist:</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <strong>Design and code review:</strong> trace the counter update, persistent write and
        signature output. Check saving failures; a cached write may not survive power loss.
      </li>
      <li>
        <strong>Crash and power-loss tests:</strong> interrupt around the state update, restart and
        sign again. Check that consumed leaves cannot be reused.
      </li>
      <li>
        <strong>Concurrent requests:</strong> check that two requests cannot reserve the same leaf.
      </li>
      <li>
        <strong>Recovery and rollback:</strong> examine whether restore, failover or cloning can
        make consumed leaves available again.
      </li>
    </ul>
    <p>
      <strong>Reading results:</strong> associate signature leaf indices with the signing key and,
      for multi-tree schemes, the relevant tree. Two different messages signed with the same
      one-time key demonstrate failure even if both signatures verify. Repeated appearance of a
      stored parent-tree signature is not by itself evidence of generating it again.
    </p>
    <p>
      No reuse observed in finite tests does not prove reuse impossible. Combine results with design
      and implementation evidence. An algorithm-test pass alone does not establish crash-safe state
      management.
    </p>
    <p>
      <strong>Hub limit:</strong> this exercise does not perform hardware power-loss testing or
      prove validated hardware, persistent-storage guarantees or rollback resistance—even when live
      signing succeeds.
    </p>
    <a
      className="text-primary underline"
      href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-208.pdf"
    >
      NIST SP 800-208 (October 2020), §§8.1 and 9.1
    </a>
  </section>
)
