# FHE + HSM scenario contract and validation evidence

Owner decision 2026-10-03: the Hub stays WebAssembly-only. The FHE + HSM flows are validated
by three producers, and each validation appears on the matching workshop step:

| Producer           | Runs on                                         | Evidence `level`                                        | Hub label                               |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------- |
| `pqctoday-sandbox` | reference libraries (OpenFHE, Lattigo, TFHE-rs) | `reference` (or `emulator`)                             | reference-validated (_library version_) |
| `pqctoday-fhe`     | KV260                                           | `board`, `board: "kv260"`                               | software token on KV260                 |
| `pqctoday-cacp`    | MX95, MX95 Pro (Ventuno Q later)                | `board`, `board: "mx95"` / `"mx95-pro"` / `"ventuno-q"` | software token on MX95 / MX95 Pro       |

A board run is a software token on that board. Nothing here may claim hardware custody or
"HSM-validated"; the validator rejects such claim scopes.

## Files

- `fhe-hsm-scenarios.v1.json`: the canonical scenario contract, with stable scenario and step
  ids, actors and trust zones, phases, data states and library calls. Ids are never reused or
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
   - `parameters` and `parameterHash` (sha256);
   - `method`, `result` (`pass`/`fail`) and `status` (`measured`/`reproduced`/`reviewed`);
   - `claimScope`;
   - `artifacts[{name, sha256, url}]` with https URLs;
   - `measuredAt` (ISO date).
2. Run `npx vitest run src/data/fhe`. Every record must validate.
3. Sign it with the release signing step, commit `fhe-evidence.v1.json.sig` and add a revisions
   entry.

Only passing, valid records raise a badge. Failed runs may be recorded for honesty and are
shown by nothing.
