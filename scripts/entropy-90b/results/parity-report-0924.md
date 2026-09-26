# SP 800-90B WASM parity report (W1)

Generated 2026-09-25T04:25:02.482Z by `scripts/entropy-90b/parity.ts`; Node v22.23.1.
NIST tool commit `87c104d0ed4cbc96103e7b8b38d6f2c7e0a6b289`; WASM built with emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 6.0.10 (d6c521a7f05449857c76bd99e396895583cf2083).

WASM artefacts measured:

- `ea_iid.wasm` sha256 `6c06533b3985e4fb75183461f3ca69cbe4bcc468b7dfb6627287745496a6e2a6`
- `ea_non_iid.wasm` sha256 `d0c2a5faca24319c97ac3dafb3de3a1c4469647f8e5047cce14f5eabf92c78cc`
- `ea_restart.wasm` sha256 `7b5b1eacf512581ed452cbbd052b2202fe2b468eb4aa4096e3de8bacaaee2de5`

Native references (scripts/entropy-90b/Dockerfile.native, Debian trixie, g++ 14.2, glibc 2.41):

- `native-arm64-strict`: linux/arm64, upstream flags + `-ffp-contract=off`. **The parity reference.**
- `native-arm64`: linux/arm64, upstream Makefile flags unchanged.
- `native-amd64`: linux/amd64 (OrbStack/Rosetta), upstream flags incl. `-march=native` (FMA on).
- `native-amd64-strict`: linux/amd64, no `-march=native`, `-ffp-contract=off`.

Why a "strict" reference: g++ compiles C++ with `-ffp-contract=fast` by default, fusing a*b+c into FMA wherever the CPU has it, and amd64 `long double` is x87 80-bit while arm64/WASM use IEEE binary128. The upstream-flag builds therefore disagree with EACH OTHER in the last bits; the reference tool is not bit-reproducible across its own platforms. WebAssembly has no implicit FMA and uses binary128, so the like-for-like native is arm64 without contraction.

"stdout" compares every verbose line (-v -v prints each estimator's intermediates with %.17g / %.22Lg). IID/restart "seeded" runs replace /dev/urandom with a fixed 32-byte seed (sha256 of it: `7c5d7e2b38facdb37eedb0af0666babe1f2fe8bec1e641f58f91f96d0aade332`) and use OMP_NUM_THREADS=1 natively; "unseeded" runs are the tool as shipped, 5 runs per platform.

## Reading this report

- **These numbers are parity measurements, not entropy claims.** "real" rows are the D2/D3 device datasets (pqctoday-priv local-evidence-cache/entropy/0924), reduced for the tool with jitterentropy's default `extractlsb FF:8` (scripts/entropy-90b/convert-jent-raw.ts). They are not a validated entropy source or an ESV submission (plan §1 item 9); the `contrast` rows are conditioned/DRBG output, which is exactly the input SP 800-90B assessment must NOT be run on. "synthetic-d4" rows are generated data (public/data/entropy/d4-synthetic-manifest.json).
- **IID permutation test determinism** (read from the code, iid/permutation_tests.h + shared/utils.h seed()): every run seeds xoshiro256** from 32 bytes of /dev/urandom, and with OpenMP each thread takes its own jumped stream while shared per-test status flags decide when permuting stops, so the counters depend on the seed and on thread scheduling. It is therefore NOT deterministic as shipped (5 unseeded runs of the same native binary gave 5 different counter sets). With /dev/urandom pinned and one thread it is deterministic, and WASM then matches native exactly, counters included. The restart sanity-check cutoff (X_cutoff) is a Monte-Carlo quantile seeded the same way.
- **Upstream JSON quirk:** ea_iid writes `hAssessed` = the symbol width unless run with `-v -v` (iid_main.cpp only computes it at verbose > 2). The Hub runner defaults to `-v -v`; parity used `-v -v` everywhere.

## Summary — non-IID track (ea_non_iid), WASM vs each native

| dataset                                                     | source       | bits | WASM H_assessed                                             | vs arm64-strict               | vs arm64 (upstream)                               | vs amd64 (upstream)                               |
| ----------------------------------------------------------- | ------------ | ---- | ----------------------------------------------------------- | ----------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| kat-markov-1bit-20k                                         | kat          | 1    | 0.2748248562298956                                          | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp | 2 field(s) differ, max abs 2.3e-15, equal at 6 dp |
| kat-biased-1bit-20k                                         | kat          | 1    | 0.24148095080836415                                         | **identical** (JSON + stdout) | JSON identical                                    | JSON identical                                    |
| d4-stuck-8bit                                               | synthetic-d4 | 8    | Symbol alphabet consists of 1 symbol. No entropy awarded... | **identical** (JSON + stdout) | **identical** (JSON + stdout)                     | **identical** (JSON + stdout)                     |
| d4-biased-1bit                                              | synthetic-d4 | 1    | 0.24986677682420314                                         | **identical** (JSON + stdout) | 1 field(s) differ, max abs 5.6e-17, equal at 6 dp | 1 field(s) differ, max abs 5.6e-17, equal at 6 dp |
| d4-markov-1bit                                              | synthetic-d4 | 1    | 0.29269606813553806                                         | **identical** (JSON + stdout) | JSON identical                                    | 1 field(s) differ, max abs 8.0e-14, equal at 6 dp |
| d4-healthy-iid-8bit                                         | synthetic-d4 | 8    | 7.416885324722426                                           | **identical** (JSON + stdout) | JSON identical                                    | JSON identical                                    |
| d4-sha256-conditioned-stuck-8bit                            | synthetic-d4 | 8    | 7.4369474811097325                                          | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp |
| real-frdm-imx95-contrast-getrandom                          | real         | 8    | 7.157023206337434                                           | **identical** (JSON + stdout) | 1 field(s) differ, max abs 8.9e-16, equal at 6 dp | 2 field(s) differ, max abs 8.0e-13, equal at 6 dp |
| real-frdm-imx95-contrast-hwrng                              | real         | 8    | 7.301731549423331                                           | **identical** (JSON + stdout) | JSON identical                                    | JSON identical                                    |
| real-frdm-imx95-idle-sequential-jent-raw-noise              | real         | 8    | 2.6223579453440675                                          | **identical** (JSON + stdout) | JSON identical                                    | 5 field(s) differ, max abs 8.6e-13, equal at 6 dp |
| real-frdm-imx95-loaded-sequential-jent-raw-noise            | real         | 8    | 3.0213052927483015                                          | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp | 7 field(s) differ, max abs 1.1e-12, equal at 6 dp |
| real-kv260-contrast-getrandom                               | real         | 8    | 7.052563292960682                                           | **identical** (JSON + stdout) | JSON identical                                    | JSON identical                                    |
| real-kv260-idle-sequential-jent-raw-noise                   | real         | 8    | 2.819614073435354                                           | **identical** (JSON + stdout) | JSON identical                                    | 1 field(s) differ, max abs 9.1e-13, equal at 6 dp |
| real-kv260-loaded-sequential-jent-raw-noise                 | real         | 8    | 2.9035786643328323                                          | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp |
| real-mac-m5max-native-contrast-urandom                      | real         | 8    | 6.638382735456088                                           | **identical** (JSON + stdout) | JSON identical                                    | 3 field(s) differ, max abs 1.8e-12, equal at 6 dp |
| real-mac-m5max-native-idle-sequential-jent-raw-noise        | real         | 8    | 1.5641523532665877                                          | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.9e-15, equal at 6 dp | 7 field(s) differ, max abs 6.7e-13, equal at 6 dp |
| real-mac-m5max-native-loaded-sequential-jent-raw-noise      | real         | 8    | 1.3861930693786795                                          | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.9e-15, equal at 6 dp | 7 field(s) differ, max abs 5.2e-13, equal at 6 dp |
| real-mac-orbstack-linux-vm-contrast-getrandom               | real         | 8    | 7.131205356064996                                           | **identical** (JSON + stdout) | 1 field(s) differ, max abs 1.1e-16, equal at 6 dp | 2 field(s) differ, max abs 9.1e-13, equal at 6 dp |
| real-mac-orbstack-linux-vm-idle-sequential-jent-raw-noise   | real         | 8    | 2.048686341308285                                           | **identical** (JSON + stdout) | JSON identical                                    | 7 field(s) differ, max abs 1.0e-12, equal at 6 dp |
| real-mac-orbstack-linux-vm-loaded-sequential-jent-raw-noise | real         | 8    | 2.2548444246448827                                          | **identical** (JSON + stdout) | JSON identical                                    | 7 field(s) differ, max abs 7.9e-13, equal at 6 dp |

## Summary — IID track (ea_iid)

| dataset                          | seeded: vs arm64-strict       | seeded: vs arm64              | seeded: vs amd64              | unseeded verdicts (all platforms × runs)                                    | unseeded deterministic-field diffs |
| -------------------------------- | ----------------------------- | ----------------------------- | ----------------------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| kat-markov-1bit-20k              | **identical** (JSON + stdout) | JSON identical                | JSON identical                | chi2=false lrs=true perm=false (25 runs)                                    | 0                                  |
| kat-biased-1bit-20k              | **identical** (JSON + stdout) | JSON identical                | JSON identical                | chi2=true lrs=true perm=true (25 runs)                                      | 0                                  |
| d4-stuck-8bit                    | **identical** (JSON + stdout) | **identical** (JSON + stdout) | **identical** (JSON + stdout) | error:Symbol alphabet consists of 1 symbol. No entropy awarded... (25 runs) | 0                                  |
| d4-biased-1bit                   | **identical** (JSON + stdout) | JSON identical                | JSON identical                | chi2=true lrs=true perm=true (25 runs)                                      | 0                                  |
| d4-healthy-iid-8bit              | **identical** (JSON + stdout) | JSON identical                | JSON identical                | chi2=true lrs=true perm=true (25 runs)                                      | 0                                  |
| d4-sha256-conditioned-stuck-8bit | **identical** (JSON + stdout) | JSON identical                | JSON identical                | chi2=true lrs=true perm=true (25 runs)                                      | 0                                  |

## Summary — restart track (ea_restart)

| dataset                                          | H_I used           | seeded: vs arm64-strict       | seeded: vs arm64              | seeded: vs amd64                                  | unseeded verdicts                              | X_cutoff seen |
| ------------------------------------------------ | ------------------ | ----------------------------- | ----------------------------- | ------------------------------------------------- | ---------------------------------------------- | ------------- |
| d4-healthy-iid-8bit-restart                      | 7.416885324722426  | **identical** (JSON + stdout) | **identical** (JSON + stdout) | JSON identical                                    | passed (25 runs)                               | 23            |
| d4-restart-correlated-8bit                       | 7.416885324722426  | **identical** (JSON + stdout) | **identical** (JSON + stdout) | **identical** (JSON + stdout)                     | failed: Restart Sanity Check Failed. (25 runs) | 23            |
| real-frdm-imx95-idle-restart-matrix              | 2.6223579453440675 | **identical** (JSON + stdout) | **identical** (JSON + stdout) | 5 field(s) differ, max abs 1.0e-12, equal at 6 dp | not run                                        | —             |
| real-frdm-imx95-loaded-restart-matrix            | 3.0213052927483015 | **identical** (JSON + stdout) | **identical** (JSON + stdout) | 7 field(s) differ, max abs 1.1e-12, equal at 6 dp | not run                                        | —             |
| real-kv260-idle-restart-matrix                   | 2.819614073435354  | **identical** (JSON + stdout) | **identical** (JSON + stdout) | JSON identical                                    | not run                                        | —             |
| real-kv260-loaded-restart-matrix                 | 2.9035786643328323 | **identical** (JSON + stdout) | **identical** (JSON + stdout) | JSON identical                                    | not run                                        | —             |
| real-mac-m5max-native-idle-restart-matrix        | 1.5641523532665877 | **identical** (JSON + stdout) | **identical** (JSON + stdout) | 5 field(s) differ, max abs 9.1e-13, equal at 6 dp | not run                                        | —             |
| real-mac-m5max-native-loaded-restart-matrix      | 1.3861930693786795 | **identical** (JSON + stdout) | **identical** (JSON + stdout) | 4 field(s) differ, max abs 9.1e-13, equal at 6 dp | not run                                        | —             |
| real-mac-orbstack-linux-vm-idle-restart-matrix   | 2.048686341308285  | **identical** (JSON + stdout) | **identical** (JSON + stdout) | 6 field(s) differ, max abs 8.8e-13, equal at 6 dp | not run                                        | —             |
| real-mac-orbstack-linux-vm-loaded-restart-matrix | 2.2548444246448827 | **identical** (JSON + stdout) | **identical** (JSON + stdout) | **identical** (JSON + stdout)                     | not run                                        | —             |

## Detail — every estimator value (non-IID), WASM and each native

Blank native cell = identical to WASM. A value is shown only where it differs.

### kat-markov-1bit-20k

sha256 `c9443b93e2f390ba1e4f362d437a927af66e3fa7aa6e7d8be6e7df5daaa47f04`, 1-bit samples, source: kat.

| estimator / field                                            | WASM               | native-arm64-strict | native-arm64           | native-amd64           | native-amd64-strict    |
| ------------------------------------------------------------ | ------------------ | ------------------- | ---------------------- | ---------------------- | ---------------------- |
| Most Common Value / hOriginal                                | 0.959159016531773  |                     |                        |                        |                        |
| Most Common Value / mcvEstimateMode                          | 10105              |                     |                        |                        |                        |
| Most Common Value / mcvEstimatePHat                          | 0.50525            |                     |                        |                        |                        |
| Most Common Value / mcvEstimatePU                            | 0.5143566574744197 |                     |                        |                        |                        |
| Collision Test (for bit strings only) / hOriginal            | 0.2748248562298956 |                     |                        |                        |                        |
| Markov Test (for bit strings only) / hOriginal               | 0.5220577322278712 |                     | **0.5220577322278711** | **0.5220577322278711** |                        |
| Compression Test (for bit strings only) / hOriginal          | 0.3416613008703955 |                     |                        |                        |                        |
| T-Tuple Test / tTupleRes                                     | 0.5001803103643944 |                     |                        |                        |                        |
| LRS Test / lrsRes                                            | 0.7770158293454122 |                     |                        |                        |                        |
| Multi Most Common in Window Test / hOriginal                 | 0.900522962326061  |                     |                        | **0.9005229623260587** | **0.9005229623260587** |
| Lag Prediction Test / hOriginal                              | 0.508354637992731  |                     |                        |                        |                        |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal | 0.5083853022418827 |                     |                        |                        |                        |
| LZ78Y Test / hOriginal                                       | 0.5078266994786679 |                     |                        |                        |                        |
| Overall / dataWordSize                                       | 1                  |                     |                        |                        |                        |
| Overall / hAssessed                                          | 0.2748248562298956 |                     |                        |                        |                        |
| Overall / hOriginal                                          | 0.2748248562298956 |                     |                        |                        |                        |

### kat-biased-1bit-20k

sha256 `81c1c7f99eda513a0fe7ebdff3c2962933da61a69ac8d9ee257275f7be6d8fe3`, 1-bit samples, source: kat.

| estimator / field                                            | WASM                | native-arm64-strict | native-arm64 | native-amd64 | native-amd64-strict |
| ------------------------------------------------------------ | ------------------- | ------------------- | ------------ | ------------ | ------------------- |
| Most Common Value / hOriginal                                | 0.3954321122196466  |                     |              |              |                     |
| Most Common Value / mcvEstimateMode                          | 15048               |                     |              |              |                     |
| Most Common Value / mcvEstimatePHat                          | 0.7524              |                     |              |              |                     |
| Most Common Value / mcvEstimatePU                            | 0.7602616309535842  |                     |              |              |                     |
| Collision Test (for bit strings only) / hOriginal            | 0.3876102213516465  |                     |              |              |                     |
| Markov Test (for bit strings only) / hOriginal               | 0.41439912503706855 |                     |              |              |                     |
| Compression Test (for bit strings only) / hOriginal          | 0.24148095080836415 |                     |              |              |                     |
| T-Tuple Test / tTupleRes                                     | 0.38530729773701555 |                     |              |              |                     |
| LRS Test / lrsRes                                            | 0.6477045272045873  |                     |              |              |                     |
| Multi Most Common in Window Test / hOriginal                 | 0.39499418493681704 |                     |              |              |                     |
| Lag Prediction Test / hOriginal                              | 0.6620992653609734  |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal | 0.3954778564417162  |                     |              |              |                     |
| LZ78Y Test / hOriginal                                       | 0.39610323709028045 |                     |              |              |                     |
| Overall / dataWordSize                                       | 1                   |                     |              |              |                     |
| Overall / hAssessed                                          | 0.24148095080836415 |                     |              |              |                     |
| Overall / hOriginal                                          | 0.24148095080836415 |                     |              |              |                     |

### d4-stuck-8bit

sha256 `d29751f2649b32ff572b5e0a9f541ea660a50f94ff0beedfb0b692b924cc8025`, 8-bit samples, source: synthetic-d4.

| estimator / field | WASM                                                        | native-arm64-strict | native-arm64 | native-amd64 | native-amd64-strict |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------ | ------------ | ------------------- |
| error             | Symbol alphabet consists of 1 symbol. No entropy awarded... |                     |              |              |                     |

### d4-biased-1bit

sha256 `d7bebe423cb6e3c70629e47243906a11319312f19f6b75039272bd9dfe8742eb`, 1-bit samples, source: synthetic-d4.

| estimator / field                                            | WASM                | native-arm64-strict | native-arm64            | native-amd64            | native-amd64-strict |
| ------------------------------------------------------------ | ------------------- | ------------------- | ----------------------- | ----------------------- | ------------------- |
| Most Common Value / hOriginal                                | 0.41322924813933704 |                     |                         |                         |                     |
| Most Common Value / mcvEstimateMode                          | 749825              |                     |                         |                         |                     |
| Most Common Value / mcvEstimatePHat                          | 0.749825            |                     |                         |                         |                     |
| Most Common Value / mcvEstimatePU                            | 0.7509406274949888  |                     |                         |                         |                     |
| Collision Test (for bit strings only) / hOriginal            | 0.4125160540159102  |                     |                         |                         |                     |
| Markov Test (for bit strings only) / hOriginal               | 0.415600216293067   |                     | **0.41560021629306704** | **0.41560021629306704** |                     |
| Compression Test (for bit strings only) / hOriginal          | 0.24986677682420314 |                     |                         |                         |                     |
| T-Tuple Test / tTupleRes                                     | 0.41094083185733465 |                     |                         |                         |                     |
| LRS Test / lrsRes                                            | 0.6497111443162181  |                     |                         |                         |                     |
| Multi Most Common in Window Test / hOriginal                 | 0.41323831443950754 |                     |                         |                         |                     |
| Lag Prediction Test / hOriginal                              | 0.6768118664138895  |                     |                         |                         |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal | 0.4132417158880351  |                     |                         |                         |                     |
| LZ78Y Test / hOriginal                                       | 0.41323738868975957 |                     |                         |                         |                     |
| Overall / dataWordSize                                       | 1                   |                     |                         |                         |                     |
| Overall / hAssessed                                          | 0.24986677682420314 |                     |                         |                         |                     |
| Overall / hOriginal                                          | 0.24986677682420314 |                     |                         |                         |                     |

### d4-markov-1bit

sha256 `974dbc8bb0253ef6a18b8277150f146bef3ae68ab9513aee640b6335b99f5e47`, 1-bit samples, source: synthetic-d4.

| estimator / field                                            | WASM                | native-arm64-strict | native-arm64 | native-amd64           | native-amd64-strict    |
| ------------------------------------------------------------ | ------------------- | ------------------- | ------------ | ---------------------- | ---------------------- |
| Most Common Value / hOriginal                                | 0.995428381947596   |                     |              |                        |                        |
| Most Common Value / mcvEstimateMode                          | 500299              |                     |              |                        |                        |
| Most Common Value / mcvEstimatePHat                          | 0.500299            |                     |              |                        |                        |
| Most Common Value / mcvEstimatePU                            | 0.5015869150654505  |                     |              |                        |                        |
| Collision Test (for bit strings only) / hOriginal            | 0.29269606813553806 |                     |              |                        |                        |
| Markov Test (for bit strings only) / hOriginal               | 0.5199480566752913  |                     |              |                        |                        |
| Compression Test (for bit strings only) / hOriginal          | 0.3518473042356598  |                     |              |                        |                        |
| T-Tuple Test / tTupleRes                                     | 0.5416636076646117  |                     |              |                        |                        |
| LRS Test / lrsRes                                            | 0.7734910461161928  |                     |              |                        |                        |
| Multi Most Common in Window Test / hOriginal                 | 0.7913772777262754  |                     |              | **0.7913772777261958** | **0.7913772777261958** |
| Lag Prediction Test / hOriginal                              | 0.5141112409754742  |                     |              |                        |                        |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal | 0.514118033257503   |                     |              |                        |                        |
| LZ78Y Test / hOriginal                                       | 0.5141149575464082  |                     |              |                        |                        |
| Overall / dataWordSize                                       | 1                   |                     |              |                        |                        |
| Overall / hAssessed                                          | 0.29269606813553806 |                     |              |                        |                        |
| Overall / hOriginal                                          | 0.29269606813553806 |                     |              |                        |                        |

### d4-healthy-iid-8bit

sha256 `603ce2d3d7429242a88ff9cea83869ffd40665b0e9aec19723d41ad745cf6968`, 8-bit samples, source: synthetic-d4.

| estimator / field                                             | WASM                 | native-arm64-strict | native-arm64 | native-amd64 | native-amd64-strict |
| ------------------------------------------------------------- | -------------------- | ------------------- | ------------ | ------------ | ------------------- |
| Most Common Value / hBitstring                                | 0.9980011706723845   |                     |              |              |                     |
| Most Common Value / hOriginal                                 | 7.876484395264145    |                     |              |              |                     |
| Most Common Value / mcvEstimateMode                           | 4091                 |                     |              |              |                     |
| Most Common Value / mcvEstimatePHat                           | 0.004091             |                     |              |              |                     |
| Most Common Value / mcvEstimatePU                             | 0.004255415162114699 |                     |              |              |                     |
| Collision Test (for bit strings only) / hBitstring            | 0.9343910450165258   |                     |              |              |                     |
| Markov Test (for bit strings only) / hBitstring               | 0.9991085676707075   |                     |              |              |                     |
| Compression Test (for bit strings only) / hBitstring          | 0.9271106655903032   |                     |              |              |                     |
| T-Tuple Test / binTTupleRes                                   | 0.9294675887066989   |                     |              |              |                     |
| T-Tuple Test / tTupleRes                                      | 7.876484395264145    |                     |              |              |                     |
| LRS Test / binLrsRes                                          | 0.996353663389543    |                     |              |              |                     |
| LRS Test / lrsRes                                             | 7.864200611802139    |                     |              |              |                     |
| Multi Most Common in Window Test / hBitstring                 | 0.998771965028285    |                     |              |              |                     |
| Multi Most Common in Window Test / hOriginal                  | 7.960796322957976    |                     |              |              |                     |
| Lag Prediction Test / hBitstring                              | 0.9984624474823383   |                     |              |              |                     |
| Lag Prediction Test / hOriginal                               | 7.972673992696105    |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.99800405173457     |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.918949773687415    |                     |              |              |                     |
| LZ78Y Test / hBitstring                                       | 0.9993403801874724   |                     |              |              |                     |
| LZ78Y Test / hOriginal                                        | 7.91892813474644     |                     |              |              |                     |
| Overall / dataWordSize                                        | 8                    |                     |              |              |                     |
| Overall / hAssessed                                           | 7.416885324722426    |                     |              |              |                     |
| Overall / hBitstring                                          | 0.9271106655903032   |                     |              |              |                     |
| Overall / hOriginal                                           | 7.864200611802139    |                     |              |              |                     |

### d4-sha256-conditioned-stuck-8bit

sha256 `07435bb8db483643a74516697f9980493498d7b82561abb0d6e2546412395ccb`, 8-bit samples, source: synthetic-d4.

| estimator / field                                             | WASM                 | native-arm64-strict | native-arm64           | native-amd64           | native-amd64-strict |
| ------------------------------------------------------------- | -------------------- | ------------------- | ---------------------- | ---------------------- | ------------------- |
| Most Common Value / hBitstring                                | 0.9983242831813781   |                     |                        |                        |                     |
| Most Common Value / hOriginal                                 | 7.8688967585902265   |                     |                        |                        |                     |
| Most Common Value / mcvEstimateMode                           | 4113                 |                     |                        |                        |                     |
| Most Common Value / mcvEstimatePHat                           | 0.004113             |                     |                        |                        |                     |
| Most Common Value / mcvEstimatePU                             | 0.004277854832758939 |                     |                        |                        |                     |
| Collision Test (for bit strings only) / hBitstring            | 0.9472269682317923   |                     |                        |                        |                     |
| Markov Test (for bit strings only) / hBitstring               | 0.9994609450921483   |                     | **0.9994609450921482** | **0.9994609450921482** |                     |
| Compression Test (for bit strings only) / hBitstring          | 0.9296184351387166   |                     |                        |                        |                     |
| T-Tuple Test / binTTupleRes                                   | 0.9335692443037781   |                     |                        |                        |                     |
| T-Tuple Test / tTupleRes                                      | 7.8688967585902265   |                     |                        |                        |                     |
| LRS Test / binLrsRes                                          | 0.9963210414594342   |                     |                        |                        |                     |
| LRS Test / lrsRes                                             | 7.908302533028919    |                     |                        |                        |                     |
| Multi Most Common in Window Test / hBitstring                 | 0.9986678219359711   |                     |                        |                        |                     |
| Multi Most Common in Window Test / hOriginal                  | 7.954573190648349    |                     |                        |                        |                     |
| Lag Prediction Test / hBitstring                              | 0.998607651493025    |                     |                        |                        |                     |
| Lag Prediction Test / hOriginal                               | 7.949922001947857    |                     |                        |                        |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.9988103489789407   |                     |                        |                        |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.960884323447434    |                     |                        |                        |                     |
| LZ78Y Test / hBitstring                                       | 0.999086243178289    |                     |                        |                        |                     |
| LZ78Y Test / hOriginal                                        | 7.961229597139845    |                     |                        |                        |                     |
| Overall / dataWordSize                                        | 8                    |                     |                        |                        |                     |
| Overall / hAssessed                                           | 7.4369474811097325   |                     |                        |                        |                     |
| Overall / hBitstring                                          | 0.9296184351387166   |                     |                        |                        |                     |
| Overall / hOriginal                                           | 7.8688967585902265   |                     |                        |                        |                     |

### real-frdm-imx95-contrast-getrandom

sha256 `658583c7aa59e7e21f1107e6dab4bd4d5ac36f17124ac8205d6b88c5c2435903`, 8-bit samples, source: real.

| estimator / field                                             | WASM                 | native-arm64-strict | native-arm64           | native-amd64           | native-amd64-strict    |
| ------------------------------------------------------------- | -------------------- | ------------------- | ---------------------- | ---------------------- | ---------------------- |
| Most Common Value / hBitstring                                | 0.9986063904451192   |                     |                        |                        |                        |
| Most Common Value / hOriginal                                 | 7.882722585054418    |                     |                        |                        |                        |
| Most Common Value / mcvEstimateMode                           | 4073                 |                     |                        |                        |                        |
| Most Common Value / mcvEstimatePHat                           | 0.004073             |                     |                        |                        |                        |
| Most Common Value / mcvEstimatePU                             | 0.004237054540587136 |                     |                        |                        |                        |
| Collision Test (for bit strings only) / hBitstring            | 0.9466701610048351   |                     |                        |                        |                        |
| Markov Test (for bit strings only) / hBitstring               | 0.9994416139386699   |                     |                        |                        |                        |
| Compression Test (for bit strings only) / hBitstring          | 0.8946279007921792   |                     |                        |                        |                        |
| T-Tuple Test / binTTupleRes                                   | 0.9237031354634258   |                     |                        |                        |                        |
| T-Tuple Test / tTupleRes                                      | 7.333765872584084    |                     |                        |                        |                        |
| LRS Test / binLrsRes                                          | 0.9382564317573393   |                     |                        |                        |                        |
| LRS Test / lrsRes                                             | 7.940072467840486    |                     |                        |                        |                        |
| Multi Most Common in Window Test / hBitstring                 | 0.9991860893443608   |                     |                        |                        |                        |
| Multi Most Common in Window Test / hOriginal                  | 7.953477800874841    |                     | **7.9534778008748415** | **7.9534778008748415** |                        |
| Lag Prediction Test / hBitstring                              | 0.9986912495186472   |                     |                        |                        |                        |
| Lag Prediction Test / hOriginal                               | 8                    |                     |                        |                        |                        |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.999305591481398    |                     |                        |                        |                        |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.9616182430791405   |                     |                        |                        |                        |
| LZ78Y Test / hBitstring                                       | 0.9505661679344829   |                     |                        | **0.9505661679336799** | **0.9505661679336799** |
| LZ78Y Test / hOriginal                                        | 7.960862684480493    |                     |                        |                        |                        |
| Overall / dataWordSize                                        | 8                    |                     |                        |                        |                        |
| Overall / hAssessed                                           | 7.157023206337434    |                     |                        |                        |                        |
| Overall / hBitstring                                          | 0.8946279007921792   |                     |                        |                        |                        |
| Overall / hOriginal                                           | 7.333765872584084    |                     |                        |                        |                        |

### real-frdm-imx95-contrast-hwrng

sha256 `fd37a63cef201d8a97ab629aa00af25e8ac0cceefffe2acd527accb216fd5c97`, 8-bit samples, source: real.

| estimator / field                                             | WASM                 | native-arm64-strict | native-arm64 | native-amd64 | native-amd64-strict |
| ------------------------------------------------------------- | -------------------- | ------------------- | ------------ | ------------ | ------------------- |
| Most Common Value / hBitstring                                | 0.9977130600745439   |                     |              |              |                     |
| Most Common Value / hOriginal                                 | 7.878560765856192    |                     |              |              |                     |
| Most Common Value / mcvEstimateMode                           | 4085                 |                     |              |              |                     |
| Most Common Value / mcvEstimatePHat                           | 0.004085             |                     |              |              |                     |
| Most Common Value / mcvEstimatePU                             | 0.004249295044342793 |                     |              |              |                     |
| Collision Test (for bit strings only) / hBitstring            | 0.9438369441138743   |                     |              |              |                     |
| Markov Test (for bit strings only) / hBitstring               | 0.9994521328562412   |                     |              |              |                     |
| Compression Test (for bit strings only) / hBitstring          | 0.9127164436779164   |                     |              |              |                     |
| T-Tuple Test / binTTupleRes                                   | 0.9294675887066989   |                     |              |              |                     |
| T-Tuple Test / tTupleRes                                      | 7.878560765856192    |                     |              |              |                     |
| LRS Test / binLrsRes                                          | 0.9728721070769432   |                     |              |              |                     |
| LRS Test / lrsRes                                             | 7.941577186734111    |                     |              |              |                     |
| Multi Most Common in Window Test / hBitstring                 | 0.9986588133715518   |                     |              |              |                     |
| Multi Most Common in Window Test / hOriginal                  | 7.889944193688296    |                     |              |              |                     |
| Lag Prediction Test / hBitstring                              | 0.9982747488376594   |                     |              |              |                     |
| Lag Prediction Test / hOriginal                               | 7.962721272943603    |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.9989782942529364   |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.9404862539904      |                     |              |              |                     |
| LZ78Y Test / hBitstring                                       | 0.9982279158233464   |                     |              |              |                     |
| LZ78Y Test / hOriginal                                        | 7.939741474570171    |                     |              |              |                     |
| Overall / dataWordSize                                        | 8                    |                     |              |              |                     |
| Overall / hAssessed                                           | 7.301731549423331    |                     |              |              |                     |
| Overall / hBitstring                                          | 0.9127164436779164   |                     |              |              |                     |
| Overall / hOriginal                                           | 7.878560765856192    |                     |              |              |                     |

### real-frdm-imx95-idle-sequential-jent-raw-noise

sha256 `42ed98d11733478587eb90a83d30104ebe632d3ec464d2bac0d4873ef9eac0e8`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64 | native-amd64            | native-amd64-strict     |
| ------------------------------------------------------------- | ------------------- | ------------------- | ------------ | ----------------------- | ----------------------- |
| Most Common Value / hBitstring                                | 0.8133560930541404  |                     |              |                         |                         |
| Most Common Value / hOriginal                                 | 3.4899739385518087  |                     |              |                         |                         |
| Most Common Value / mcvEstimateMode                           | 88274               |                     |              |                         |                         |
| Most Common Value / mcvEstimatePHat                           | 0.088274            |                     |              |                         |                         |
| Most Common Value / mcvEstimatePU                             | 0.08900474502933195 |                     |              |                         |                         |
| Collision Test (for bit strings only) / hBitstring            | 0.7267214571912685  |                     |              |                         |                         |
| Markov Test (for bit strings only) / hBitstring               | 0.8074583392324108  |                     |              |                         |                         |
| Compression Test (for bit strings only) / hBitstring          | 0.32779474316800844 |                     |              |                         |                         |
| T-Tuple Test / binTTupleRes                                   | 0.36887334398627397 |                     |              |                         |                         |
| T-Tuple Test / tTupleRes                                      | 2.66074109826624    |                     |              |                         |                         |
| LRS Test / binLrsRes                                          | 0.4391155874707676  |                     |              |                         |                         |
| LRS Test / lrsRes                                             | 3.227836995271567   |                     |              |                         |                         |
| Multi Most Common in Window Test / hBitstring                 | 0.7736609555295091  |                     |              |                         |                         |
| Multi Most Common in Window Test / hOriginal                  | 3.517728026462738   |                     |              |                         |                         |
| Lag Prediction Test / hBitstring                              | 0.4962037844781436  |                     |              | **0.49620378447731445** | **0.49620378447731445** |
| Lag Prediction Test / hOriginal                               | 3.7798743187804753  |                     |              | **3.7798743187813284**  | **3.7798743187813284**  |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.44608878970105176 |                     |              | **0.4460887897004135**  | **0.4460887897004135**  |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 3.301738046784277   |                     |              | **3.301738046785141**   | **3.301738046785141**   |
| LZ78Y Test / hBitstring                                       | 0.8133634855099882  |                     |              |                         |                         |
| LZ78Y Test / hOriginal                                        | 3.301735302980927   |                     |              | **3.301735302980537**   | **3.301735302980537**   |
| Overall / dataWordSize                                        | 8                   |                     |              |                         |                         |
| Overall / hAssessed                                           | 2.6223579453440675  |                     |              |                         |                         |
| Overall / hBitstring                                          | 0.32779474316800844 |                     |              |                         |                         |
| Overall / hOriginal                                           | 2.66074109826624    |                     |              |                         |                         |

### real-frdm-imx95-loaded-sequential-jent-raw-noise

sha256 `d01a9a61e1a028cf0bffb6876925bec9d18104b8876e3044051124e1cd3c54df`, 8-bit samples, source: real.

| estimator / field                                             | WASM               | native-arm64-strict | native-arm64           | native-amd64           | native-amd64-strict    |
| ------------------------------------------------------------- | ------------------ | ------------------- | ---------------------- | ---------------------- | ---------------------- |
| Most Common Value / hBitstring                                | 0.8413965391478402 |                     |                        |                        |                        |
| Most Common Value / hOriginal                                 | 3.8661918266130786 |                     |                        |                        |                        |
| Most Common Value / mcvEstimateMode                           | 67926              |                     |                        |                        |                        |
| Most Common Value / mcvEstimatePHat                           | 0.067926           |                     |                        |                        |                        |
| Most Common Value / mcvEstimatePU                             | 0.0685741275969853 |                     |                        |                        |                        |
| Collision Test (for bit strings only) / hBitstring            | 0.7458680426965668 |                     |                        |                        |                        |
| Markov Test (for bit strings only) / hBitstring               | 0.8143312781593529 |                     | **0.8143312781593528** | **0.8143312781593528** |                        |
| Compression Test (for bit strings only) / hBitstring          | 0.3776631615935377 |                     |                        |                        |                        |
| T-Tuple Test / binTTupleRes                                   | 0.4372744721819089 |                     |                        |                        |                        |
| T-Tuple Test / tTupleRes                                      | 3.1488065698994605 |                     |                        |                        |                        |
| LRS Test / binLrsRes                                          | 0.5438955767973503 |                     |                        |                        |                        |
| LRS Test / lrsRes                                             | 3.872577932559578  |                     |                        |                        |                        |
| Multi Most Common in Window Test / hBitstring                 | 0.8108892254817852 |                     |                        |                        |                        |
| Multi Most Common in Window Test / hOriginal                  | 3.779861395177073  |                     |                        | **3.77986139517811**   | **3.77986139517811**   |
| Lag Prediction Test / hBitstring                              | 0.6699896298932339 |                     |                        | **0.6699896298921052** | **0.6699896298921052** |
| Lag Prediction Test / hOriginal                               | 4.416496938375501  |                     |                        | **4.416496938374595**  | **4.416496938374595**  |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.4871053325850518 |                     |                        | **0.487105332584119**  | **0.487105332584119**  |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 3.301738046784277  |                     |                        | **3.301738046785141**  | **3.301738046785141**  |
| LZ78Y Test / hBitstring                                       | 0.8414021984546025 |                     |                        |                        |                        |
| LZ78Y Test / hOriginal                                        | 3.301735302980927  |                     |                        | **3.301735302980537**  | **3.301735302980537**  |
| Overall / dataWordSize                                        | 8                  |                     |                        |                        |                        |
| Overall / hAssessed                                           | 3.0213052927483015 |                     |                        |                        |                        |
| Overall / hBitstring                                          | 0.3776631615935377 |                     |                        |                        |                        |
| Overall / hOriginal                                           | 3.1488065698994605 |                     |                        |                        |                        |

### real-kv260-contrast-getrandom

sha256 `8506530d8ff3494485b6d7f792f0b6954c6f864519e7d23677e8cbe201f1f4bf`, 8-bit samples, source: real.

| estimator / field                                             | WASM                 | native-arm64-strict | native-arm64 | native-amd64 | native-amd64-strict |
| ------------------------------------------------------------- | -------------------- | ------------------- | ------------ | ------------ | ------------------- |
| Most Common Value / hBitstring                                | 0.9984302020405313   |                     |              |              |                     |
| Most Common Value / hOriginal                                 | 7.885503884082155    |                     |              |              |                     |
| Most Common Value / mcvEstimateMode                           | 4065                 |                     |              |              |                     |
| Most Common Value / mcvEstimatePHat                           | 0.004065             |                     |              |              |                     |
| Most Common Value / mcvEstimatePU                             | 0.004228894005442876 |                     |              |              |                     |
| Collision Test (for bit strings only) / hBitstring            | 0.9382859097767847   |                     |              |              |                     |
| Markov Test (for bit strings only) / hBitstring               | 0.9994624788938282   |                     |              |              |                     |
| Compression Test (for bit strings only) / hBitstring          | 0.8815704116200852   |                     |              |              |                     |
| T-Tuple Test / binTTupleRes                                   | 0.9294675887066989   |                     |              |              |                     |
| T-Tuple Test / tTupleRes                                      | 7.885503884082155    |                     |              |              |                     |
| LRS Test / binLrsRes                                          | 0.998146656112768    |                     |              |              |                     |
| LRS Test / lrsRes                                             | 7.718814129976409    |                     |              |              |                     |
| Multi Most Common in Window Test / hBitstring                 | 0.9989330593037271   |                     |              |              |                     |
| Multi Most Common in Window Test / hOriginal                  | 7.947286415367585    |                     |              |              |                     |
| Lag Prediction Test / hBitstring                              | 0.9987211586106199   |                     |              |              |                     |
| Lag Prediction Test / hOriginal                               | 7.916815325448953    |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.998148489167379    |                     |              |              |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.926092571028164    |                     |              |              |                     |
| LZ78Y Test / hBitstring                                       | 0.9998837708823042   |                     |              |              |                     |
| LZ78Y Test / hOriginal                                        | 7.926070932082738    |                     |              |              |                     |
| Overall / dataWordSize                                        | 8                    |                     |              |              |                     |
| Overall / hAssessed                                           | 7.052563292960682    |                     |              |              |                     |
| Overall / hBitstring                                          | 0.8815704116200852   |                     |              |              |                     |
| Overall / hOriginal                                           | 7.718814129976409    |                     |              |              |                     |

### real-kv260-idle-sequential-jent-raw-noise

sha256 `5d9e7dc34e4ab4489f48248fac1cd51ef58c473003b7330bb89cc954f6ef29ec`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64 | native-amd64          | native-amd64-strict   |
| ------------------------------------------------------------- | ------------------- | ------------------- | ------------ | --------------------- | --------------------- |
| Most Common Value / hBitstring                                | 0.9981308392322152  |                     |              |                       |                       |
| Most Common Value / hOriginal                                 | 4.244717427899894   |                     |              |                       |                       |
| Most Common Value / mcvEstimateMode                           | 52176               |                     |              |                       |                       |
| Most Common Value / mcvEstimatePHat                           | 0.052176            |                     |              |                       |                       |
| Most Common Value / mcvEstimatePU                             | 0.0527488178437305  |                     |              |                       |                       |
| Collision Test (for bit strings only) / hBitstring            | 1                   |                     |              |                       |                       |
| Markov Test (for bit strings only) / hBitstring               | 0.9073391855152779  |                     |              |                       |                       |
| Compression Test (for bit strings only) / hBitstring          | 0.35245175917941923 |                     |              |                       |                       |
| T-Tuple Test / binTTupleRes                                   | 0.521533484570088   |                     |              |                       |                       |
| T-Tuple Test / tTupleRes                                      | 3.6776417964560992  |                     |              |                       |                       |
| LRS Test / binLrsRes                                          | 0.5892331866620389  |                     |              |                       |                       |
| LRS Test / lrsRes                                             | 4.320454572501267   |                     |              |                       |                       |
| Multi Most Common in Window Test / hBitstring                 | 1                   |                     |              |                       |                       |
| Multi Most Common in Window Test / hOriginal                  | 4.283668188507438   |                     |              |                       |                       |
| Lag Prediction Test / hBitstring                              | 0.7638512571586495  |                     |              |                       |                       |
| Lag Prediction Test / hOriginal                               | 4.416496938375501   |                     |              | **4.416496938374595** | **4.416496938374595** |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.5630405912356486  |                     |              |                       |                       |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 4.25165930470689    |                     |              |                       |                       |
| LZ78Y Test / hBitstring                                       | 0.9053910763927447  |                     |              |                       |                       |
| LZ78Y Test / hOriginal                                        | 4.263036686578234   |                     |              |                       |                       |
| Overall / dataWordSize                                        | 8                   |                     |              |                       |                       |
| Overall / hAssessed                                           | 2.819614073435354   |                     |              |                       |                       |
| Overall / hBitstring                                          | 0.35245175917941923 |                     |              |                       |                       |
| Overall / hOriginal                                           | 3.6776417964560992  |                     |              |                       |                       |

### real-kv260-loaded-sequential-jent-raw-noise

sha256 `570f1995af0d82bb0ffd6c3dcac497dfcbf5ab3ac8011ea4fd072f305517336b`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64           | native-amd64           | native-amd64-strict |
| ------------------------------------------------------------- | ------------------- | ------------------- | ---------------------- | ---------------------- | ------------------- |
| Most Common Value / hBitstring                                | 0.9942408185157176  |                     |                        |                        |                     |
| Most Common Value / hOriginal                                 | 4.2834765957153     |                     |                        |                        |                     |
| Most Common Value / mcvEstimateMode                           | 50785               |                     |                        |                        |                     |
| Most Common Value / mcvEstimatePHat                           | 0.050785            |                     |                        |                        |                     |
| Most Common Value / mcvEstimatePU                             | 0.05135054520088968 |                     |                        |                        |                     |
| Collision Test (for bit strings only) / hBitstring            | 1                   |                     |                        |                        |                     |
| Markov Test (for bit strings only) / hBitstring               | 0.9033458458690451  |                     | **0.9033458458690452** | **0.9033458458690452** |                     |
| Compression Test (for bit strings only) / hBitstring          | 0.36294733304160404 |                     |                        |                        |                     |
| T-Tuple Test / binTTupleRes                                   | 0.5440793829196592  |                     |                        |                        |                     |
| T-Tuple Test / tTupleRes                                      | 3.959264214521601   |                     |                        |                        |                     |
| LRS Test / binLrsRes                                          | 0.6111899669789106  |                     |                        |                        |                     |
| LRS Test / lrsRes                                             | 4.51311260208928    |                     |                        |                        |                     |
| Multi Most Common in Window Test / hBitstring                 | 1                   |                     |                        |                        |                     |
| Multi Most Common in Window Test / hOriginal                  | 4.3197093093911585  |                     |                        |                        |                     |
| Lag Prediction Test / hBitstring                              | 0.7016045366636763  |                     |                        |                        |                     |
| Lag Prediction Test / hOriginal                               | 4.816667509126807   |                     |                        |                        |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.5499407446052432  |                     |                        |                        |                     |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 4.287631449761541   |                     |                        |                        |                     |
| LZ78Y Test / hBitstring                                       | 0.9013864148656346  |                     |                        |                        |                     |
| LZ78Y Test / hOriginal                                        | 4.287524843433781   |                     |                        |                        |                     |
| Overall / dataWordSize                                        | 8                   |                     |                        |                        |                     |
| Overall / hAssessed                                           | 2.9035786643328323  |                     |                        |                        |                     |
| Overall / hBitstring                                          | 0.36294733304160404 |                     |                        |                        |                     |
| Overall / hOriginal                                           | 3.959264214521601   |                     |                        |                        |                     |

### real-mac-m5max-native-contrast-urandom

sha256 `075b87d1627406983deedc8724eaf71dd87f59601e794353e8fd1f0713500776`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64 | native-amd64          | native-amd64-strict   |
| ------------------------------------------------------------- | ------------------- | ------------------- | ------------ | --------------------- | --------------------- |
| Most Common Value / hBitstring                                | 0.9974631707711649  |                     |              |                       |                       |
| Most Common Value / hOriginal                                 | 7.878907121291836   |                     |              |                       |                       |
| Most Common Value / mcvEstimateMode                           | 4084                |                     |              |                       |                       |
| Most Common Value / mcvEstimatePHat                           | 0.004084            |                     |              |                       |                       |
| Most Common Value / mcvEstimatePU                             | 0.00424827501603375 |                     |              |                       |                       |
| Collision Test (for bit strings only) / hBitstring            | 0.9452930793515494  |                     |              |                       |                       |
| Markov Test (for bit strings only) / hBitstring               | 0.9990725318316316  |                     |              |                       |                       |
| Compression Test (for bit strings only) / hBitstring          | 0.9119446733094926  |                     |              |                       |                       |
| T-Tuple Test / binTTupleRes                                   | 0.9357063477806017  |                     |              |                       |                       |
| T-Tuple Test / tTupleRes                                      | 7.878907121291836   |                     |              |                       |                       |
| LRS Test / binLrsRes                                          | 0.9845018196574385  |                     |              |                       |                       |
| LRS Test / lrsRes                                             | 7.937063691751974   |                     |              |                       |                       |
| Multi Most Common in Window Test / hBitstring                 | 0.9998267927622018  |                     |              |                       |                       |
| Multi Most Common in Window Test / hOriginal                  | 6.638382735456088   |                     |              | **6.638382735457862** | **6.638382735457862** |
| Lag Prediction Test / hBitstring                              | 0.9979999098952496  |                     |              |                       |                       |
| Lag Prediction Test / hOriginal                               | 7.943383926252729   |                     |              |                       |                       |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.9978646707283947  |                     |              |                       |                       |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.977860663566709   |                     |              |                       |                       |
| LZ78Y Test / hBitstring                                       | 0.9978464809568007  |                     |              |                       |                       |
| LZ78Y Test / hOriginal                                        | 7.977839024589366   |                     |              |                       |                       |
| Overall / dataWordSize                                        | 8                   |                     |              |                       |                       |
| Overall / hAssessed                                           | 6.638382735456088   |                     |              | **6.638382735457862** | **6.638382735457862** |
| Overall / hBitstring                                          | 0.9119446733094926  |                     |              |                       |                       |
| Overall / hOriginal                                           | 6.638382735456088   |                     |              | **6.638382735457862** | **6.638382735457862** |

### real-mac-m5max-native-idle-sequential-jent-raw-noise

sha256 `1022b752d3527c8a9a6f4eb2986ab818a891842d501a3b7ff9640cd74031ec22`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64           | native-amd64            | native-amd64-strict     |
| ------------------------------------------------------------- | ------------------- | ------------------- | ---------------------- | ----------------------- | ----------------------- |
| Most Common Value / hBitstring                                | 0.9068022762256892  |                     |                        |                         |                         |
| Most Common Value / hOriginal                                 | 3.6327275296775796  |                     |                        |                         |                         |
| Most Common Value / mcvEstimateMode                           | 79921               |                     |                        |                         |                         |
| Most Common Value / mcvEstimatePHat                           | 0.079921            |                     |                        |                         |                         |
| Most Common Value / mcvEstimatePU                             | 0.08061949018932042 |                     |                        |                         |                         |
| Collision Test (for bit strings only) / hBitstring            | 0.63851093591685    |                     |                        |                         |                         |
| Markov Test (for bit strings only) / hBitstring               | 0.8837615808948268  |                     |                        |                         |                         |
| Compression Test (for bit strings only) / hBitstring          | 0.36636662852613777 |                     | **0.3663666285261397** | **0.3663666285261397**  |                         |
| T-Tuple Test / binTTupleRes                                   | 0.2364616607454963  |                     |                        |                         |                         |
| T-Tuple Test / tTupleRes                                      | 1.5641523532665877  |                     |                        |                         |                         |
| LRS Test / binLrsRes                                          | 0.2682358898386038  |                     |                        |                         |                         |
| LRS Test / lrsRes                                             | 1.9170218890015367  |                     |                        |                         |                         |
| Multi Most Common in Window Test / hBitstring                 | 0.9083039938406767  |                     |                        |                         |                         |
| Multi Most Common in Window Test / hOriginal                  | 2.6314157003027816  |                     |                        | **2.631415700302115**   | **2.631415700302115**   |
| Lag Prediction Test / hBitstring                              | 0.30180926137119957 |                     |                        | **0.3018092613708335**  | **0.3018092613708335**  |
| Lag Prediction Test / hOriginal                               | 2.1841357396080743  |                     |                        | **2.18413573960789**    | **2.18413573960789**    |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.237600299299741   |                     |                        | **0.23760029929965695** | **0.23760029929965695** |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 1.8646447932056422  |                     |                        | **1.8646447932056494**  | **1.8646447932056494**  |
| LZ78Y Test / hBitstring                                       | 0.9068103690195491  |                     |                        |                         |                         |
| LZ78Y Test / hOriginal                                        | 1.8646432044707664  |                     |                        | **1.8646432044711514**  | **1.8646432044711514**  |
| Overall / dataWordSize                                        | 8                   |                     |                        |                         |                         |
| Overall / hAssessed                                           | 1.5641523532665877  |                     |                        |                         |                         |
| Overall / hBitstring                                          | 0.2364616607454963  |                     |                        |                         |                         |
| Overall / hOriginal                                           | 1.5641523532665877  |                     |                        |                         |                         |

### real-mac-m5max-native-loaded-sequential-jent-raw-noise

sha256 `2bd2930b5e22017bb6d1a55305c346bfbf888ffc8c72b938cec1ddbc5e0fbff7`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64           | native-amd64            | native-amd64-strict     |
| ------------------------------------------------------------- | ------------------- | ------------------- | ---------------------- | ----------------------- | ----------------------- |
| Most Common Value / hBitstring                                | 0.8972652580862597  |                     |                        |                         |                         |
| Most Common Value / hOriginal                                 | 3.1695106361923946  |                     |                        |                         |                         |
| Most Common Value / mcvEstimateMode                           | 110336              |                     |                        |                         |                         |
| Most Common Value / mcvEstimatePHat                           | 0.110336            |                     |                        |                         |                         |
| Most Common Value / mcvEstimatePU                             | 0.11114302859502191 |                     |                        |                         |                         |
| Collision Test (for bit strings only) / hBitstring            | 0.606808107550809   |                     |                        |                         |                         |
| Markov Test (for bit strings only) / hBitstring               | 0.8797767488240918  |                     |                        |                         |                         |
| Compression Test (for bit strings only) / hBitstring          | 0.3493678125186544  |                     | **0.3493678125186563** | **0.3493678125186563**  |                         |
| T-Tuple Test / binTTupleRes                                   | 0.2087929632094109  |                     |                        |                         |                         |
| T-Tuple Test / tTupleRes                                      | 1.3861930693786795  |                     |                        |                         |                         |
| LRS Test / binLrsRes                                          | 0.2056405877245641  |                     |                        |                         |                         |
| LRS Test / lrsRes                                             | 1.489731140659631   |                     |                        |                         |                         |
| Multi Most Common in Window Test / hBitstring                 | 0.8981247167491575  |                     |                        |                         |                         |
| Multi Most Common in Window Test / hOriginal                  | 2.1841281058948794  |                     |                        | **2.184128105894846**   | **2.184128105894846**   |
| Lag Prediction Test / hBitstring                              | 0.25667601429417697 |                     |                        | **0.2566760142941242**  | **0.2566760142941242**  |
| Lag Prediction Test / hOriginal                               | 1.8646448991204507  |                     |                        | **1.8646448991209688**  | **1.8646448991209688**  |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.2332549398200404  |                     |                        | **0.23325493982042825** | **0.23325493982042825** |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 1.625180705105821   |                     |                        | **1.6251807051059832**  | **1.6251807051059832**  |
| LZ78Y Test / hBitstring                                       | 0.8972934292551303  |                     |                        |                         |                         |
| LZ78Y Test / hOriginal                                        | 1.6251793107457748  |                     |                        | **1.625179310745423**   | **1.625179310745423**   |
| Overall / dataWordSize                                        | 8                   |                     |                        |                         |                         |
| Overall / hAssessed                                           | 1.3861930693786795  |                     |                        |                         |                         |
| Overall / hBitstring                                          | 0.2056405877245641  |                     |                        |                         |                         |
| Overall / hOriginal                                           | 1.3861930693786795  |                     |                        |                         |                         |

### real-mac-orbstack-linux-vm-contrast-getrandom

sha256 `4da1011b4b6c6b6cddcd9f6b6c2c3813cba4c040adc1ac64a65719b9d0d36753`, 8-bit samples, source: real.

| estimator / field                                             | WASM                  | native-arm64-strict | native-arm64          | native-amd64           | native-amd64-strict    |
| ------------------------------------------------------------- | --------------------- | ------------------- | --------------------- | ---------------------- | ---------------------- |
| Most Common Value / hBitstring                                | 0.9985332462229612    |                     |                       |                        |                        |
| Most Common Value / hOriginal                                 | 7.880640159507053     |                     |                       |                        |                        |
| Most Common Value / mcvEstimateMode                           | 4079                  |                     |                       |                        |                        |
| Most Common Value / mcvEstimatePHat                           | 0.004079              |                     |                       |                        |                        |
| Most Common Value / mcvEstimatePU                             | 0.0042431748372323995 |                     |                       |                        |                        |
| Collision Test (for bit strings only) / hBitstring            | 0.9615476648204596    |                     |                       |                        |                        |
| Markov Test (for bit strings only) / hBitstring               | 0.9993765621468911    |                     | **0.999376562146891** | **0.999376562146891**  |                        |
| Compression Test (for bit strings only) / hBitstring          | 0.8914006695081245    |                     |                       |                        |                        |
| T-Tuple Test / binTTupleRes                                   | 0.9335692443037781    |                     |                       |                        |                        |
| T-Tuple Test / tTupleRes                                      | 7.880640159507053     |                     |                       |                        |                        |
| LRS Test / binLrsRes                                          | 0.9986765575843884    |                     |                       |                        |                        |
| LRS Test / lrsRes                                             | 7.941812249902919     |                     |                       |                        |                        |
| Multi Most Common in Window Test / hBitstring                 | 0.999149321537492     |                     |                       |                        |                        |
| Multi Most Common in Window Test / hOriginal                  | 7.954573190648349     |                     |                       |                        |                        |
| Lag Prediction Test / hBitstring                              | 0.9993558821672546    |                     |                       |                        |                        |
| Lag Prediction Test / hOriginal                               | 7.9118439687548       |                     |                       |                        |                        |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.9985714391017299    |                     |                       |                        |                        |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 7.930036392287813     |                     |                       |                        |                        |
| LZ78Y Test / hBitstring                                       | 0.9187775279241779    |                     |                       | **0.9187775279232692** | **0.9187775279232692** |
| LZ78Y Test / hOriginal                                        | 7.930373823243518     |                     |                       |                        |                        |
| Overall / dataWordSize                                        | 8                     |                     |                       |                        |                        |
| Overall / hAssessed                                           | 7.131205356064996     |                     |                       |                        |                        |
| Overall / hBitstring                                          | 0.8914006695081245    |                     |                       |                        |                        |
| Overall / hOriginal                                           | 7.880640159507053     |                     |                       |                        |                        |

### real-mac-orbstack-linux-vm-idle-sequential-jent-raw-noise

sha256 `cca4fb2b9ac4453dd6459b8dfeeb8dcc65e1ef7a2c4f9b6cc3c7ef4b8b8c6f27`, 8-bit samples, source: real.

| estimator / field                                             | WASM                | native-arm64-strict | native-arm64 | native-amd64           | native-amd64-strict    |
| ------------------------------------------------------------- | ------------------- | ------------------- | ------------ | ---------------------- | ---------------------- |
| Most Common Value / hBitstring                                | 0.933302215951196   |                     |              |                        |                        |
| Most Common Value / hOriginal                                 | 4.406876155817153   |                     |              |                        |                        |
| Most Common Value / mcvEstimateMode                           | 46598               |                     |              |                        |                        |
| Most Common Value / mcvEstimatePHat                           | 0.046598            |                     |              |                        |                        |
| Most Common Value / mcvEstimatePU                             | 0.04714092390556691 |                     |              |                        |                        |
| Collision Test (for bit strings only) / hBitstring            | 1                   |                     |              |                        |                        |
| Markov Test (for bit strings only) / hBitstring               | 0.8570578714290946  |                     |              |                        |                        |
| Compression Test (for bit strings only) / hBitstring          | 0.25608579266353565 |                     |              |                        |                        |
| T-Tuple Test / binTTupleRes                                   | 0.3247838034598323  |                     |              |                        |                        |
| T-Tuple Test / tTupleRes                                      | 2.350836467390609   |                     |              |                        |                        |
| LRS Test / binLrsRes                                          | 0.3687997567211933  |                     |              |                        |                        |
| LRS Test / lrsRes                                             | 2.7669759391292668  |                     |              |                        |                        |
| Multi Most Common in Window Test / hBitstring                 | 0.8867556035849632  |                     |              |                        |                        |
| Multi Most Common in Window Test / hOriginal                  | 2.3874615188025254  |                     |              | **2.3874615188029455** | **2.3874615188029455** |
| Lag Prediction Test / hBitstring                              | 0.3371036254451017  |                     |              | **0.3371036254452466** | **0.3371036254452466** |
| Lag Prediction Test / hOriginal                               | 2.9294621054159617  |                     |              | **2.929462105416496**  | **2.929462105416496**  |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.30901592619140844 |                     |              | **0.3090159261921226** | **0.3090159261921226** |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 2.3874696951630847  |                     |              | **2.3874696951633703** | **2.3874696951633703** |
| LZ78Y Test / hBitstring                                       | 0.7435818797815416  |                     |              | **0.7435818797825724** | **0.7435818797825724** |
| LZ78Y Test / hOriginal                                        | 2.3874676846289806  |                     |              | **2.3874676846283256** | **2.3874676846283256** |
| Overall / dataWordSize                                        | 8                   |                     |              |                        |                        |
| Overall / hAssessed                                           | 2.048686341308285   |                     |              |                        |                        |
| Overall / hBitstring                                          | 0.25608579266353565 |                     |              |                        |                        |
| Overall / hOriginal                                           | 2.350836467390609   |                     |              |                        |                        |

### real-mac-orbstack-linux-vm-loaded-sequential-jent-raw-noise

sha256 `7339da5a5d1d3103ba890df9a280190fe8d41cb9f4e2ef4a82e2cc9d7a26c5bc`, 8-bit samples, source: real.

| estimator / field                                             | WASM                 | native-arm64-strict | native-arm64 | native-amd64            | native-amd64-strict     |
| ------------------------------------------------------------- | -------------------- | ------------------- | ------------ | ----------------------- | ----------------------- |
| Most Common Value / hBitstring                                | 0.9881130852630722   |                     |              |                         |                         |
| Most Common Value / hOriginal                                 | 4.771393145305838    |                     |              |                         |                         |
| Most Common Value / mcvEstimateMode                           | 36135                |                     |              |                         |                         |
| Most Common Value / mcvEstimatePHat                           | 0.036135             |                     |              |                         |                         |
| Most Common Value / mcvEstimatePU                             | 0.036615716945463554 |                     |              |                         |                         |
| Collision Test (for bit strings only) / hBitstring            | 1                    |                     |              |                         |                         |
| Markov Test (for bit strings only) / hBitstring               | 0.8202209264683611   |                     |              |                         |                         |
| Compression Test (for bit strings only) / hBitstring          | 0.28185555308061033  |                     |              |                         |                         |
| T-Tuple Test / binTTupleRes                                   | 0.355350584516543    |                     |              |                         |                         |
| T-Tuple Test / tTupleRes                                      | 2.7728579349591294   |                     |              |                         |                         |
| LRS Test / binLrsRes                                          | 0.4275285571698583   |                     |              |                         |                         |
| LRS Test / lrsRes                                             | 3.158902871496054    |                     |              |                         |                         |
| Multi Most Common in Window Test / hBitstring                 | 0.9260241821235538   |                     |              |                         |                         |
| Multi Most Common in Window Test / hOriginal                  | 3.3017268883934836   |                     |              | **3.3017268883935986**  | **3.3017268883935986**  |
| Lag Prediction Test / hBitstring                              | 0.3870535935351544   |                     |              | **0.38705359353436264** | **0.38705359353436264** |
| Lag Prediction Test / hOriginal                               | 2.9294621054159617   |                     |              | **2.929462105416496**   | **2.929462105416496**   |
| Multi Markov Model with Counting Test (MultiMMC) / hBitstring | 0.37062268395495185  |                     |              | **0.3706226839555091**  | **0.3706226839555091**  |
| Multi Markov Model with Counting Test (MultiMMC) / hOriginal  | 2.9294619423778574   |                     |              | **2.929461942377898**   | **2.929461942377898**   |
| LZ78Y Test / hBitstring                                       | 0.7049199822911671   |                     |              | **0.7049199822918744**  | **0.7049199822918744**  |
| LZ78Y Test / hOriginal                                        | 2.929459496786682    |                     |              | **2.929459496786783**   | **2.929459496786783**   |
| Overall / dataWordSize                                        | 8                    |                     |              |                         |                         |
| Overall / hAssessed                                           | 2.2548444246448827   |                     |              |                         |                         |
| Overall / hBitstring                                          | 0.28185555308061033  |                     |              |                         |                         |
| Overall / hOriginal                                           | 2.7728579349591294   |                     |              |                         |                         |

## W2 — Node runtime and memory (one run per fresh process)

Measured with scripts/entropy-90b/measure-node.ts on an Apple M5 Max (Node 22, single thread) while other sessions kept the host load average around 24, so treat times as upper-side. "WASM memory" is the size the module memory grew to (it never shrinks, so it is the peak). A laptop-browser measurement (plan W2) is NOT done yet.

| tool    | dataset                                             | samples | bits | wall time | WASM memory | process peak RSS | H_assessed          |
| ------- | --------------------------------------------------- | ------- | ---- | --------- | ----------- | ---------------- | ------------------- |
| non_iid | d4-healthy-iid-8bit.bin                             | 1000000 | 8    | 19.3 s    | 238 MiB     | 325 MiB          | 7.416885324722426   |
| non_iid | d4-markov-1bit.bin                                  | 1000000 | 1    | 2.5 s     | 64 MiB      | 101 MiB          | 0.29269606813553806 |
| non_iid | d4-sha256-conditioned-stuck-8bit.bin                | 1000000 | 8    | 16.7 s    | 238 MiB     | 314 MiB          | 7.4369474811097325  |
| iid     | d4-healthy-iid-8bit.bin                             | 1000000 | 8    | 6.6 s     | 64 MiB      | 141 MiB          | —                   |
| restart | d4-restart-correlated-8bit.bin                      | 1000000 | 8    | 31.4 s    | 64 MiB      | 105 MiB          | —                   |
| restart | d4-healthy-iid-8bit-restart.bin                     | 1000000 | 8    | 46.7 s    | 275 MiB     | 315 MiB          | —                   |
| non_iid | kv260-idle-sequential-jent-raw-noise.bin            | 1000000 | 8    | 13.8 s    | 238 MiB     | 308 MiB          | 2.819614073435354   |
| non_iid | mac-m5max-native-idle-sequential-jent-raw-noise.bin | 1000000 | 8    | 13.7 s    | 238 MiB     | 293 MiB          | 1.5641523532665877  |
