# FHE + HSM scenario contract and validation evidence

Owner decision 2026-10-03: the Hub stays WebAssembly-only. The FHE + HSM flows are validated
by three producers, and each validation appears on the matching workshop step:

| Producer           | Runs on                                         | Evidence `level`                                        | Hub label                               |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------- |
| `pqctoday-sandbox` | reference libraries (OpenFHE, Lattigo, TFHE-rs) | `reference` (or `emulator`)                             | reference-validated (_library version_) |
| `pqctoday-fhe`     | KV260                                           | `board`, `board: "kv260"`                               | software token on KV260                 |
| `pqctoday-cacp`    | MX95, MX95 Pro (Ventuno Q later)                | `board`, `board: "mx95"` / `"mx95-pro"` / `"ventuno-q"` | software token on MX95 / MX95 Pro       |

Lattigo's `conformance-mapped` target is conditional on the FHE plan's P0A and P5 gates
(§6.4); its contract carries the `conformance-gated-p0a-p5` disclosure.

A board run is a software token on that board. Nothing here may claim hardware custody or
"HSM-validated"; the validator rejects such claim scopes.

## Files

- `fhe-hsm-scenarios.v1.json`: the canonical scenario contract, with stable scenario and step
  ids, actors and trust zones, phases, data states, the engine status per step and library
  calls. Per scenario it also holds the FHE plan §1.1 validation target label,
  `disclosures` (stable ids), `budgets` (metric names, null until a versioned P0A update
  freezes them) and `fixtures` (deterministic input/output hashes). Ids are never reused or
  renamed; a changed step gets a new id. The workshop data is tested against this file.
- `fhe-evidence.v1.json`: evidence records. It is empty until results arrive, and with no
  records the Hub shows no validation claim.
- `fhe-evidence.v1.json.sig`: the ML-DSA-65 signature (existing maintainer kid), produced by the
  release signer. The file is registered in `scripts/ci/trust-artifacts.json`, and a unit test
  refuses records without it.
- `fheEvidence.ts`: types, the record validator and the per-step lookup used by the workshop.

## Adding results (stage 5 is a data-only change)

1. Append one record per run to `records`. A record needs:
   - `scenarioId` and `stepIds` taken from the contract;
   - `level`, `producer` and `board` (board allowed only for that producer);
   - `library {name, version, commit}`, and `engine {repo, commit}` for emulator and board runs;
   - `parameters` (the canonical parameter-set name), `config`, and `parameterHash`, which
     is the SHA-256 (hex) of UTF-8 `parameters + "\n" + config`;
   - `environment {hardware, os, browser?, toolchain, features}`;
   - `method {warmup, samples, distribution, peakMemoryMethod}` (a single run says
     `samples: 1`);
   - `result` (`pass`/`fail`) and `status` (`estimate`/`measured`/`reproduced`/
     `independently-reviewed`; an estimate never raises a badge);
   - `claimScope` (`reference-library` / `browser-emulator` / `native-software-token` /
     `board-software-token`, matching the level) and an optional `claimLabel` such as
     "software token on KV260";
   - `artifacts[{name, sha256, url}]` with https URLs;
   - `measuredAt` (ISO date);
   - an optional per-record `signature {keyId, alg: "ML-DSA-65", value}`. Without it, a
     record is hash-pinned and covered only by the manifest signature.
2. Run `npx vitest run src/data/fhe`. Every record must validate.
3. Sign it with the release signing step, commit `fhe-evidence.v1.json.sig` and add a revisions
   entry.

Only passing, valid records raise a badge. Failed runs may be recorded for honesty and are
shown by nothing.
