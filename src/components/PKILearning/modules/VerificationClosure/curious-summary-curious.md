# Decommissioning & Program Closure — For the Curious

## What This Is About

Picture renovating a building: fitting new locks is only part of the job. You also need to account for old access paths, spare keys and the people who maintain them. A cryptography migration similarly needs clear retirement criteria, checks of remaining dependencies and an ongoing owner.

## Why It Matters

The risky assumption is that completing a removal task proves that every dependent copy is gone. A signing key can be removed while a verifier still trusts its old public key. A library can be replaced in one application while an older container still uses it. Your production tools need to find these remaining uses and show what their checks covered.

Using traditional and post-quantum algorithms together does not automatically make a migration incomplete. A documented hybrid construction combines components; a path that can use only the traditional algorithm is a different case. Check the required profile and whether the remaining path meets the intended security goal. [NIST IR 8547, Section 3.2](https://nvlpubs.nist.gov/nistpubs/ir/2026/NIST.IR.8547.pdf) distinguishes hybrid constructions from algorithms deployed alongside one another. Its transition schedule applies under NIST standards and guidelines; check the rules and earlier deadlines applicable to your organization rather than treating one date as universal.

## The Key Takeaway

Compare a completed action with a separate observation. In the fictional Decommission Checklist, removing the Nightly Batch Signer can still leave its old public key trusted by an offline verifier. Read the sample finding, address that dependency in the scenario, and check the separately authored follow-up observation before logging completion. A clean sample result covers only its stated scope; it does not inspect a deployed system.

Use the same reasoning with your own tools: look for discovery of active use, stored keys, trust settings and dependent copies; coverage and observation dates; and a way to retain exceptions and recheck after changes. Assign ongoing ownership of the inventory, monitoring and remaining work so retirement remains a maintained state rather than a one-time status label.
