# FHE + HSM scenario contract and validation evidence

Owner decisions 2026-10-03: the Hub stays WebAssembly-only. The FHE + HSM flows are validated
on lab devices, each playing one role in the workshop's lanes:

| Device            | Producer           | Role                                   | Claim scope               | Hub label                                                   |
| ----------------- | ------------------ | -------------------------------------- | ------------------------- | ----------------------------------------------------------- |
| Mac (M4 Pro)      | `pqctoday-sandbox` | data owner                             | `owner-device`            | data owner on Mac (M4 Pro)                                  |
| KV260             | `pqctoday-fhe`     | FHE server (untrusted, no token)       | `board-untrusted-compute` | FHE server on KV260 (untrusted compute, software-held keys) |
| MX95              | `pqctoday-cacp`    | custodian (primary) or threshold party | `board-software-token`    | custodian: software token on MX95                           |
| MX95 Pro          | `pqctoday-cacp`    | backup custodian or threshold party    | `board-software-token`    | backup custodian: software token on MX95 Pro                |
| Ventuno Q (later) | `pqctoday-cacp`    | custodian, backup or party             | `board-software-token`    | as above                                                    |

Reference-library runs come from `pqctoday-sandbox` (`level: reference`).

A device may claim only steps its role's actor takes part in (the step's `from` or `to`). A run
spanning devices is one `end-to-end` record with a `parts[]` entry per device; steps in no part
are the transfers between devices. Threshold scenarios are validated as 2-of-2 on the two
custodian boards, and records state `parties {threshold, total, placement}`, so the badge says
"2-of-2 (scenario shows 3-of-3)" instead of implying the full scenario ran. Lattigo's
`conformance-mapped` target is conditional on the FHE plan's P0A and P5 gates (§6.4). Nothing may
claim hardware custody or "HSM-validated". Budgets are named per actor
(`hsm.serverKeyExportBytes` vs `cloud.serverKeyBytes`).

## Files

- `fhe-hsm-scenarios.v1.json`: the canonical scenario contract, with stable scenario and step
  ids, actors and trust zones, phases, data states, the engine status per step and library
  calls. Per scenario it also holds the FHE plan §1.1 validation target label,
  `disclosures` (stable ids), `budgets` (metric names, null until a versioned P0A update
  freezes them) and `fixtures` (deterministic input/output hashes). Ids are never reused or
  renamed; a changed step gets a new id. The workshop data is tested against this file.
- `public/data/fhe-evidence/fhe-evidence.v1.json` (published with its artifacts; signed artifacts must live under `public/`): evidence records. It is empty until results arrive, and with no
  records the Hub shows no validation claim.
- `public/data/fhe-evidence/fhe-evidence.v1.json.sig`: the ML-DSA-65 signature (existing maintainer kid), produced by the
  release signer. The file is registered in `scripts/ci/trust-artifacts.json`, and a unit test
  refuses records without it.
- `fheEvidence.ts`: types, the record validator and the per-step lookup used by the workshop.

## Adding results (stage 5 is a data-only change)

1. Append one record per run to `records`. A record needs:
   - `scenarioId`;
   - `stepIds` (every step covered, transfers included);
   - `level` (`reference` / `emulator` / `device` / `end-to-end`);
   - for `reference` and `emulator`: `producer` and `claimScope`, plus `engine` for an emulator;
   - for `device` (one part) and `end-to-end` (two or more parts): `parts[{device, role,
producer, claimScope, stepIds, engine?}]`, with `engine` required for software-token
     parts;
   - for threshold scenarios on boards: `parties`;
   - `library {name, version, commit}`;
   - `parameters`, `config` and `parameterHash`, which is the SHA-256 (hex) of UTF-8
     `parameters + "\n" + config`;
   - `environment {hardware, os, browser?, toolchain, features}`;
   - `method {warmup, samples ≥ 1, distribution, peakMemoryMethod}`;
   - `result` and `status` (an `estimate` never raises a badge);
   - `artifacts[{name, sha256, https url}]`;
   - `measuredAt`;
   - optionally `claimLabel` and a per-record `signature {keyId, alg: "ML-DSA-65", value}`.
2. Run `npx vitest run src/data/fhe`. Every record must validate.
3. Sign it with the release signing step, commit `fhe-evidence.v1.json.sig` and add a revisions
   entry.

Only passing, valid records raise a badge. Failed runs may be recorded for honesty and are
shown by nothing.
