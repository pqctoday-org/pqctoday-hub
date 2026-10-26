# Extended Results Plan — PQC Hardware Acceleration learning module

**Status:** implementation plan  
**Module:** `PQCHardwareAcceleration` (`LM-072`)  
**Prepared:** 2026-10-25

## Outcome

Extend the Hub learning module with the current, common PQC Today CPU benchmark across all seven available platforms, while retaining the existing Arm-and-FPGA lesson as historical evidence.

The module must make one distinction unmissable:

| Evidence set                     | What it answers                                                                               | Do not use it to claim                     |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Scenario 39 common benchmark** | How fast the same PKCS#11 workload runs on each platform, with one worker and the whole board | That an FPGA, GPU, or NPU was used         |
| **Historical Arm/KV260 study**   | Why an instruction set or a purpose-built KV260 bitstream changed a specific algorithm        | A fair seven-platform ranking              |
| **X1 ISA investigation**         | Which x86 instructions the actual X1 build used, helped, or failed to help                    | That every operation benefits from AVX-512 |

The result should teach a learner how to read a performance claim, not merely present a winner table.

## Evidence to publish

Create a versioned, hand-reviewed Scenario 39 snapshot in the module. Do **not** scrape the generated dashboard at run time.

### Platforms

Include the seven completed targets, with an explicit CPU/core description and an evidence link for each result:

1. AMD AI X1 Pro VM — 12 exposed vCPUs, Ryzen AI 9 HX 370 host
2. NXP i.MX95 Pro
3. NXP i.MX95
4. AMD Kria KV260 — four Cortex-A53 CPU cores, **CPU-only in Scenario 39**
5. Ventuno Q — four Cortex-A78C plus four Cortex-A55 cores
6. Apple M4 Pro — 14 CPU cores
7. Apple M5 Max — 18 CPU cores

For every platform/operation pair, preserve both measurements:

- **One-worker throughput:** the per-core/worker view. This is not a promise that every physical core has the same speed.
- **Whole-platform throughput:** the configured multi-worker result. Display the worker count used by that run.
- **Scaling ratio:** `whole-platform ÷ one-worker`; show it as measured scaling, not a claim of linear scaling. Mark a result as near-linear only against a documented tolerance and worker count.

The common benchmark operations are:

- ECDSA P-256 sign (classical signature)
- X25519 derive (classical key agreement)
- ML-DSA sign
- ML-KEM encapsulation
- PKCS#11 v3.3 hybrid signature
- PKCS#11 v3.3 hybrid KEM encapsulation

Each row must record: operation, operation direction, TPS, worker count, harness/engine revision, date, machine mode, and source evidence. The two tenant outputs are inputs to one benchmark result; they must not be added together.

Primary sources for the snapshot:

- `pqctoday-sandbox/pqc-performance-dashboard/dist/index.html` — reviewed Scenario 39 comparison
- `pqctoday-sandbox/evidence/scenario39/20261025-oneworker-gap-closure/` — raw M5 Max and KV260 gap-closure evidence
- `pqctoday-sandbox/docs/39-x1-isa-dispatch-and-rerun-plan.md` — X1 instruction-dispatch evidence and rejected experiments

## Learner-facing changes

### 1. Add a new Learn section: “A Common Seven-Platform Benchmark”

Place it after **Arm Across Three Generations** and before **What We Built on Arm**. It should explain:

- the difference between a common CPU comparison and an accelerator-specific study;
- why one-worker and whole-platform results answer different purchasing/deployment questions;
- why a heterogeneous system can have different fast and slow cores;
- what is held common (PKCS#11 harness, operation definition and workload) and what remains platform-specific (CPU, OS image, available worker count, engine revision);
- that this is a throughput comparison, not latency, energy, cost, security certification, or accelerator-offload comparison.

Use a small source/provenance card rather than embedding the entire dashboard table in prose. The primary learner takeaway is: **compare like with like before attributing a result to silicon or an instruction set.**

### 2. Add an X1 “instruction availability is not automatic use” callout

Put this in the new section or in **What We Built on Arm**, renamed to **What We Built and Verified**. It should use a plain-language status table:

| Capability on X1                     | Verified outcome to teach                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| AVX2 / AVX-512F / IFMA               | Available to the VM; AWS-LC RSA-PSS uses the IFMA path and showed about 2× sign throughput versus its deliberately masked comparison |
| AES-NI / SHA-NI                      | Runtime-dispatched for relevant AES and SHA workloads                                                                                |
| VAES-256 / VAES-512 candidate builds | Correct but slower for the tested AES and hybrid-KEM paths; deliberately rejected                                                    |
| ECDSA P-256 / X25519                 | The selected Rust implementations do not gain an AWS-LC IFMA path merely because the CPU exposes it                                  |
| ML-KEM / ML-DSA                      | Benchmark the actual dispatch; do not infer AVX-512 usage from CPU flags alone                                                       |

Link the failure register entries `X1-ISA-001` and `X1-ISA-002`. Rejected optimisations are valuable learning evidence and must remain visible rather than being silently removed.

### 3. Keep the FPGA teaching separate and correct

Retain the existing **FPGA Limits** and historical KV260 SLH-DSA/Keccak material. Add a persistent label wherever it is shown:

`Historical KV260 FPGA study — separate algorithm path and build; not a Scenario 39 result.`

Add the reciprocal label to the Scenario 39 KV260 entry:

`Scenario 39: Cortex-A53 CPU PKCS#11 result; no FPGA offload measured.`

This prevents the misleading conclusion that every current KV260 result includes fabric acceleration.

## Workshop changes

### 4. Preserve the current “Our Measurements” lab as a historical experiment

Do not overwrite `PlatformExplorer.tsx` or `data/measurements.ts`. It is a useful guided experiment because it demonstrates:

- A55 versus A53 on the historical signature workload;
- a before/after software update;
- an isolated M4 acceleration A/B test;
- a focused KV260 FPGA routing result.

Rename its visible title/description to make its time and scope clear, for example:

`Historical Arm and KV260 experiments (2026-09)`.

Its current workshop prompts and guided exercises should continue to refer to this lab.

### 5. Add a dedicated workshop step: “Common Platform Benchmark”

Insert a new component, for example `workshop/CommonPlatformBenchmark.tsx`, after the historical lab. Renumber later steps rather than replacing them.

The step should provide:

1. **Operation selector** — ECDSA, X25519, ML-DSA, ML-KEM, hybrid signature, hybrid KEM.
2. **Measurement selector** — one worker / whole platform.
3. **Accessible ranked table first** — fastest to slowest, with TPS, time/op, worker count, core description, scaling ratio, and a visible `CPU PKCS#11` badge.
4. **Optional bar chart** — derived from the same typed data; do not make colour the only identifier.
5. **Scaling explanation** — report `N×` measured scaling and classify it only as `near-linear`, `sub-linear`, or `not comparable` using documented rules. It must not call a 12-vCPU X1 VM “12 identical physical cores.”
6. **Provenance drawer** — run date, harness/revision, evidence path, and caveats for the selected result.
7. **Comparison guardrail** — no result may carry an `FPGA`, `NPU`, GPU, AVX-512, or “accelerated” badge unless the evidence record supplies that exact claim.

Add two guided exercises:

- _One worker or all workers?_ Have learners choose the right measurement for a latency-sensitive service and for maximum batch throughput.
- _CPU benchmark or accelerator experiment?_ Have learners identify why the Scenario 39 KV260 result cannot be compared directly with the historical SLH-DSA FPGA figure.

## Data and implementation design

### 6. Use a separate, typed data file

Add `data/scenario39.ts`; do not extend the legacy `PlatformId` in `data/measurements.ts`, because that file models a different experiment.

Suggested types:

```ts
type Scenario39PlatformId = 'x1Pro' | 'mx95Pro' | 'mx95' | 'kv260' | 'ventunoQ' | 'm4Pro' | 'm5Max'
type Scenario39OperationId =
  | 'ecdsaP256Sign'
  | 'x25519Derive'
  | 'mlDsaSign'
  | 'mlKemEncap'
  | 'hybridSignatureSign'
  | 'hybridKemEncap'
type EvidenceStatus = 'measured' | 'historical' | 'rejected-optimisation'

interface Scenario39Measurement {
  throughputPerSecond: number
  workerCount: number
  harnessRevision: string
  recordedAt: string
  evidencePath: string
}
```

The snapshot should include a dataset ID and a short protocol note. Derive rankings, time/op, and scaling ratios in pure functions rather than storing duplicated values. Unit-test every derived value and every data completeness rule.

### 7. Update module wiring and metadata

- Add the Learn section and workshop step to `manifest.ts`.
- Add the new workshop component and import to `index.tsx`.
- Update the shell description so it says that the module contains historical accelerator studies **and** a current common CPU comparison.
- Bump `contentVersion`, module content version, and `lastEdited` according to the repository’s version checks.
- Update the module’s `curious-summary.md` so it no longer says the evidence covers only M4 Pro, i.MX95, and KV260.
- Add algorithm registry entries only when their canonical names already exist in the Hub; otherwise use operation labels in the benchmark UI rather than creating ad-hoc algorithm records.

## Verification and acceptance criteria

### 8. Automated checks

Add focused tests beside the new data/component for:

- all seven platforms present for every common operation and both measurement profiles;
- no `TBC`, missing provenance, or derived rank stored as input data;
- rank order is deterministic and descending by throughput;
- scaling is calculated from the matching operation/platform profiles;
- KV260 Scenario 39 data is labelled CPU-only;
- historical FPGA values remain in `measurements.ts` unchanged;
- the X1 rejected-optimisation wording cannot be rendered as an enabled acceleration.

Run at minimum the targeted Vitest tests, then `npm run lint` for changed source and the relevant TypeScript/build check. Run the complete gate only when the broader worktree is ready, because it builds the full Hub and runs unrelated suites.

### 9. Definition of done

The update is complete only when:

- a learner can compare one-worker and whole-platform results for all seven systems and all six operations;
- every displayed number identifies its evidence and workload;
- the current CPU matrix is visibly distinct from historical FPGA experiments;
- instruction claims distinguish **available**, **measured in use**, **not applicable**, and **tested/rejected**;
- existing historical labs, FPGA limits, and exercises still render and retain their original evidence;
- no unsupported accelerator, NPU, or GPU result is implied.

## Deliberately out of scope

Do not add unmeasured X1 Radeon 890M/XDNA, Ventuno GPU/NPU, or generic KV260 FPGA numbers to the common matrix. They need their own workload contract, runner, evidence, and a separately labelled experiment before they can appear in this learning module.
