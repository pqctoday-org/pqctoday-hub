# Certificate and HSM calculator remediation plan

Status: implemented and verified locally on 2026-10-19. No commit, push, deployment or video rebuild performed. Reintroducing these calculators into videos remains parked.

The calculators will teach how cryptographic choices affect certificate sizes, storage, and assumed HSM demand. Their calculations, explanations, and exports must agree. Hypothetical inputs must remain identifiable wherever results appear.

## Approved model choices

| Area                         | Decision                                                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose                      | Retain both calculators as educational tools. Production capacity claims remain outside their scope.                                                                                                                                                                       |
| Certificate performance      | Remove CPU comparisons and signing-capacity predictions until supported by reproducible benchmarks.                                                                                                                                                                        |
| Certificate chains           | Offer entirely classical and entirely PQC example chains. Use a consistent algorithm and parameter set within each example; omit independent leaf and issuer selectors and mixed-chain examples. State this simplification.                                                |
| Chain depth and transmission | Assume three levels: root CA → intermediate CA → leaf. Include the intermediate and leaf in the TLS payload estimate; exclude the root by default. Distinguish transmitted bytes from certificate archive storage.                                                         |
| TLS payload                  | Describe the result as certificate-related TLS payload. It does not represent the entire handshake.                                                                                                                                                                        |
| HSM performance              | Retain explicitly fictional performance profiles for exploring trade-offs. Preserve that status in the interface and exports.                                                                                                                                              |
| HSM utilisation              | Default to an adjustable 70% target utilisation, leaving 30% of nominal capacity as headroom. Present this as a teaching assumption, not a universal operating threshold. Apply it before local redundancy.                                                                |
| HSM local redundancy         | Default to N+1 per site, with 2N selectable. For each separate fleet, apply redundancy after utilisation sizing: add one device to a nonzero requirement for N+1, or double it for 2N.                                                                                     |
| HSM workload scope           | Workload inputs describe traffic handled by one site. Show aggregate traffic across all sites separately. When the same input is applied to every site, label the equal-load assumption and calculate the aggregate as per-site traffic multiplied by the number of sites. |
| HSM TLS workload             | Count both certificate signing and key exchange inside the HSM. Make the offload assumption visible.                                                                                                                                                                       |
| PQC TLS example              | Combine an entirely PQC certificate chain with hybrid classical plus ML-KEM key exchange. Certificate authentication and key exchange are independent choices.                                                                                                             |
| Payment workloads            | Separate payment-HSM workloads and capacity from general-purpose HSM fleets.                                                                                                                                                                                               |
| Videos                       | Keep the calculators parked while corrections are implemented and reviewed. Existing approval of measurement-based Operations sizing remains in effect.                                                                                                                    |

The all-PQC example is an educational scenario, not a statement that every required product and protocol integration is deployable. The all-classical/all-PQC chain restriction is a teaching choice, not a claim that mixed chains do not exist.

## Certificate calculator corrections

1. **Define the quantities before changing the formulas.** Present estimated bytes per certificate, transmitted chain bytes, certificate-related payload per full server-authenticated TLS handshake, and annual leaf-certificate issuance storage. Explain which inputs affect each output.
2. **Correct renewal arithmetic.** Use `365 / renewalDays` for the annualized issuance rate and round only displayed results. Label this as a steady-state annual estimate, not a calendar count. Do not silently include an initial issuance or multiply intermediates by the leaf renewal rate. A total archive-retention estimate would need a separate retention assumption.
3. **Build the chain explicitly.** Assume three levels: root CA, one intermediate CA, and the leaf. Calculate each included certificate from its key material, issuer signature, encoding allowances, and template overhead. Sum the leaf and intermediate for default TLS transmission; exclude the root. Add one server CertificateVerify signature contribution per full handshake; do not add one for each intermediate.
4. **Reconcile size representations.** Check raw versus encoded keys, variable DER signature lengths, public-key wrappers, and certificate overhead. Define which bytes each allowance includes so they cannot be counted twice. Use KiB/MiB where the calculation divides by powers of 1024.
5. **Keep the payload boundary visible.** State that the estimate covers the modelled certificate chain and server signature contribution. Identify omitted TLS framing, other handshake messages, key shares, and optional certificate extensions. Accept a full-handshake rate; resumed connections must not silently be charged as full certificate exchanges.
6. **Remove performance outputs throughout the feature.** Remove the CPU chart, single-core signing-capacity comparison, associated summary claims, and corresponding CSV and Operations Pack fields. Remove unsupported “equivalent security” shorthand from algorithm comparisons; name the selected parameter sets.
7. **Replace mixed-chain guidance.** Remove independent issuer/leaf selection and the mixed-chain worked example. Explain that the examples hold the certificate family and parameter set consistent across the three-level chain. Show the contribution of each transmitted certificate and its overhead.

Implementation targets:

- `src/components/PKILearning/modules/PKIWorkshop/CertCapacityCalculator.tsx`
- `src/data/certCapacityDefaults.ts`
- Certificate artifacts and tests in `src/services/opsArtifacts.ts` and its consumers
- Certificate evidence labels in `src/components/Playground/toolEvidence.ts`

## HSM calculator corrections

1. **Preserve the actual inventory.** Replace rounding up a uniform per-site allocation with explicit site counts. An automatic initial distribution may split the remainder across sites, but the sum must equal the entered inventory. Assess each site's allocation; do not manufacture extra devices to make the sites uniform.
   Workload inputs are per site. Keep that label on controls, results, and exports; show aggregate traffic separately. Applying the same workload to every site assumes equal traffic, even when device allocations differ. This does not simulate redistribution after a site failure.
2. **Make performance profiles unmistakably hypothetical.** Use names such as “Illustrative profile A” and “Illustrative profile B.” Remove vendor associations and implied product-generation guarantees from fictional rates. Associate each rate with the operation it measures or assumes: signing, encapsulation, decapsulation, or another explicitly defined operation.
3. **Make the TLS operation recipe explicit.** Count server handshake signing and the server-side operations for the selected key exchange inside the HSM. For hybrid exchange, include the classical and ML-KEM components. Account for ephemeral key generation or state explicitly when a supplied rate includes it. Certificate-chain length must not multiply server handshake signing demand: CA issuance and the peer's verification are separate workloads.
4. **Separate payment capacity.** Give payment workloads their own profile, operation recipe, inventory, and results. Prevent payment demand from being absorbed by spare general-purpose capacity. Keep unverified payment operation ratios clearly hypothetical; remove unsupported attribution to PCI, EMV, or other requirements.
5. **Align the resource-sharing explanation and calculation.** Retain a simple shared-device-time model where applicable: sum each operation's demand divided by its assumed rate, then divide by the selected utilization target before rounding up. Default to an adjustable 70% target, leaving 30% nominal headroom, and apply local redundancy afterwards. Headroom and spare devices must remain distinct. Correct the stale explanation that describes taking the maximum. Explain that isolated-operation rates do not establish actual mixed-workload concurrency.
6. **Separate local redundancy from site failure.** Default to N+1 per site and retain 2N as an alternative. Apply local redundancy separately to payment and general-purpose fleets after utilisation sizing. Remove any implication that repeating per-site demand proves geographic failover capacity. Do not make site-failure readiness claims without an explicit redistribution of traffic and a surviving-site calculation.
7. **Handle missing capability explicitly.** Nonzero demand for an unsupported operation must make that scenario unsupported. Missing, zero, non-finite, or negative rates must not turn demand into zero resource consumption or a passing result.
8. **Audit use-case explanations and maturity claims.** Check workload ratios, HSM operation counts, code-signing guidance, and references. Distinguish algorithm availability, protocol specification status, and product integration. Correct the SP 800-208 attribution: its scope is LMS/XMSS and their multi-tree variants, not SLH-DSA.
9. **Review storage independently.** Keep HSM key-object storage separate from certificate-archive and TLS-chain storage. Explicitly identify assumptions about certificates stored on the HSM, seed versus expanded private keys, wrapper overhead, and object limits. Make simplified hybrid storage descriptions distinguishable from a real certificate encoding.
10. **Narrow result language.** Replace unqualified readiness or replacement claims with results conditional on the selected assumptions. Remove the single-algorithm “equivalent fleet” shortcut from any general replacement recommendation; it does not cover the whole workload, site placement, or redundancy.

Implementation targets:

- `src/components/Playground/hsm/HsmCapacityCalculator.tsx`
- `src/data/hsmCapacityDefaults.ts`
- `src/data/hsmKeyStorageDefaults.ts`
- HSM capacity, storage, consistency, and protocol-matrix tests
- HSM artifacts in `src/services/opsArtifacts.ts` and evidence labels

## Challenges and limits

| Challenge                                                                                      | Resolution in this correction pass                                                                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A disclaimer could leave misleading calculations intact.                                       | Correct arithmetic, output names, and explanatory claims as well as the educational label.                   |
| Replacing CPU measurements with browser timings could introduce another misleading comparison. | Remove certificate CPU results. A benchmark feature would require a separate methodology.                    |
| A complete TLS simulator would greatly expand the scope.                                       | Retain the explicitly bounded certificate-related payload estimate and explain its exclusions.               |
| All-PQC certificates could be confused with pure-PQC key exchange.                             | Show certificate authentication and hybrid key exchange as separate settings or scenario attributes.         |
| Fictional HSM profiles could still imply a universal PQC slowdown or hardware-upgrade ratio.   | Describe comparisons as properties of the selected fictional inputs and avoid generic migration conclusions. |
| An accurate shared-time sum could still be wrong for a physical accelerator.                   | Present resource sharing as a model assumption. Do not infer physical mixed-workload throughput.             |
| Separating payment HSMs could require a new payment engineering simulator.                     | Provide a separate educational workload and capacity model; defer complete payment-protocol simulation.      |
| A certificate-size fact could become an unjustified HSM-storage prediction.                    | Keep raw size facts, encoding assumptions, and physical storage assumptions distinct.                        |

## Implementation sequence

1. Define the corrected input/output contracts and independent worked examples.
2. Correct calculation functions and add tests that reproduce the identified defects.
3. Update scenarios, controls, terminology, and explanatory text to match those contracts.
4. Update CSV exports and saved Operations Pack reports with the same inputs, units, assumptions, and model version. Preserve or explicitly identify older saved reports rather than silently reinterpreting them.
5. Review source attribution and scenario maturity statements against primary references.
6. Run focused tests, applicable repository checks, and a visual review of both calculators and their exported results.

## Acceptance criteria

- Ten HSMs across three sites are represented as ten devices, for example 4/3/3. The model identifies a site shortfall when its local allocation is inadequate. Fewer devices than sites is also handled.
- A workload of 1,000 transactions/second per site across three equally loaded sites displays 3,000 transactions/second in aggregate while sizing each site for 1,000. Aggregate transactions and cryptographic operation counts remain separately labelled.
- Annualized renewals at 240 days use approximately 1.520833 before display rounding. Annual storage changes smoothly with renewal interval.
- Certificate-chain examples assume root CA → intermediate CA → leaf. Default TLS transmission includes exactly two certificates, the intermediate and leaf, and excludes the root.
- The payload model includes one server CertificateVerify contribution per full handshake. Increasing chain length does not multiply server HSM signing demand.
- Entirely classical and entirely PQC certificate scenarios are available without independent issuer/leaf selectors. The PQC HSM TLS scenario retains hybrid classical plus ML-KEM exchange.
- Certificate CPU results are absent from the interface, CSV, and newly saved reports.
- Payment demand cannot change general-purpose fleet capacity results, and spare general-purpose capacity cannot satisfy payment demand.
- Zero demand, unsupported operations, invalid inputs, non-finite rates, and uneven allocations have explicit expected outcomes.
- Increasing demand cannot reduce required capacity while other assumptions remain fixed. Reducing a positive operation rate cannot reduce that workload's requirement.
- The default target utilisation is 70% and remains adjustable. A workload consuming one nominal HSM-equivalent requires `ceil(1 / 0.70) = 2` devices before local redundancy. The interface and exports distinguish utilisation headroom from redundancy.
- N+1 is the default local redundancy setting; 2N is selectable. A two-device requirement after utilisation sizing becomes three devices per site under N+1 or four under 2N. Zero demand does not create a spare-device requirement.
- Tests use independent expected examples and invariants, including the 10-device and 240-day cases. Existing passing tests alone are insufficient acceptance evidence.
- Every fictional performance profile remains labelled in the interface and exports. Reports retain assumptions and units alongside results.
- Explanations, results, and exports agree. No result claims production readiness, certification, or a vendor-backed replacement ratio.

## Evidence references

- [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) for ML-DSA definitions and parameter sizes.
- [RFC 5480](https://www.rfc-editor.org/rfc/rfc5480.html) for elliptic-curve public-key encoding in certificates.
- [RFC 8446 section 4.4](https://www.rfc-editor.org/rfc/rfc8446.html#section-4.4) for TLS certificate and CertificateVerify message boundaries.
- [SP 800-208](https://csrc.nist.gov/pubs/sp/800/208/final) for the scope of stateful hash-based signature guidance.
- [RFC 9881](https://www.rfc-editor.org/rfc/rfc9881.html) for ML-DSA certificate identifiers and public-key encoding.

These references do not establish product throughput.

## Implementation and verification record — 2026-10-19

- Both tool registry versions are now `2.0.0`; exported calculation model versions are `2`.
- Certificate calculations live in `src/data/certCapacityDefaults.ts`. CPU outputs were removed; annual issuance uses unrounded `365 / renewalDays`. The homogeneous three-level chain sends exactly two certificates and adds one server signature contribution.
- HSM calculations live in `src/data/hsmCapacityModel.ts`. Inventory is distributed without adding devices, each site is assessed independently, payment capacity has its own profile and inventory, and unsupported rates cannot produce a passing result. The adjustable 70% target precedes local N+1 or 2N.
- Storage remains a separate, qualified object-byte model with explicit certificate/seed toggles, editable encoding allowances and its own assumptions export.
- CSV and Operations Pack snapshots include model versions, inputs and assumptions. HSM reports preserve workload recipes, rate provenance and actual site allocations. Existing stored report text is not recalculated on load; saving a new result uses the existing revision-preserving artifact workflow.
- Updated calculator-specific role guidance, practice questions, tool introductions, evidence notices, mobile summaries and generated route descriptions. Opening an arithmetic calculator no longer records a real-cryptography tool execution.
- **229 tests passed across 17 suites**, covering model arithmetic, unsupported and invalid inputs, monotonicity, payment isolation, 4/3/3 allocation, 240-day renewals, N+1/2N explanations, screen interactions, CSV/report consistency and related metadata.
- **TypeScript build check passed.** Scoped ESLint completed with no errors; advisory warnings remain. `git diff --check` passed. Generated tool-route metadata is current.
- Independently cross-checked native-crypto DER public-key exports: RSA-2048 294 B, P-256 91 B, ML-DSA-44 1,334 B, ML-DSA-65 1,974 B and ML-DSA-87 2,614 B. These checks validate public-key encoding sizes, not total certificate sizes or performance.
- Browser checks at 1280 px and 390 px covered both calculators, input changes, uneven allocations and switching N+1/2N. No page errors or page-wide horizontal overflow were observed; result tables scroll within their containers on phones.
- Full production build, repository-wide release gate and deployment were not run. Existing unrelated payment-module edits and learn-module review dates were left untouched.

The models remain educational. Real mixed-workload performance, vendor storage limits, latency and whole-site failover still require measurements on the target deployment; these are intentionally outside this implementation.
