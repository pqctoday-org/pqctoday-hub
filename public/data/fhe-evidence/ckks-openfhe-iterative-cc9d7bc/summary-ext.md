Runs: 2 with OpenFHE's own keys, 2 with the token's keys (each run: new encryption randomness; own keys: new key generation).

OpenFHE decrypts (own keys: own secret; token keys: the test seed's secret, diagnostic). Precision in bits, mean (min to max):

| stage | numIterations | precision arg | own keys | token's keys | levels left | own s | token s |
|---|---|---|---|---|---|---|---|
| boot1 | 1 | - | 12.98 (12.94 to 13.01) | 13.35 (13.30 to 13.39) | 8 | 3.018 | 3.256 |
| boot2_p16 | 2 | 16 | 29.12 (29.03 to 29.22) | 29.24 (29.22 to 29.25) | 7 | 5.730 | 6.121 |
| boot2_p17 | 2 | 17 | 30.25 (30.16 to 30.35) | 29.88 (29.79 to 29.98) | 7 | 6.361 | 6.141 |
| boot2_p18 | 2 | 18 | 31.14 (31.12 to 31.15) | 31.00 (30.97 to 31.03) | 7 | 6.335 | 6.259 |
| boot2_p19 | 2 | 19 | 31.88 (31.80 to 31.95) | 31.80 (31.78 to 31.81) | 7 | 6.137 | 6.184 |
| boot2_p20 | 2 | 20 | 31.84 (31.83 to 31.85) | 31.73 (31.67 to 31.79) | 7 | 6.008 | 5.906 |
| boot2_p22 | 2 | 22 | 28.02 (28.00 to 28.04) | 28.02 (28.02 to 28.03) | 7 | 5.938 | 5.725 |
| boot2_p24 | 2 | 24 | 24.06 (24.01 to 24.12) | 24.23 (24.19 to 24.28) | 7 | 5.861 | 5.764 |
| boot1_warm | 1 | - | 12.98 (12.94 to 13.01) | 13.35 (13.30 to 13.39) | 8 | 2.867 | 2.759 |
| boot1_mult | 1 | - | 13.07 (13.03 to 13.10) | 13.32 (13.26 to 13.38) | 7 | 0.021 | 0.022 |
| boot2_p16_mult | 2 | 16 | 28.83 (28.66 to 29.00) | 28.99 (28.80 to 29.17) | 6 | 0.018 | 0.020 |

Through the token's owner release (rounding 2^-30), mean over the runs (min to max): as released, and after multiplying the release by 2^52 / (the ciphertext's true scale):

| stage | as released | scale-corrected |
|---|---|---|
| boot1 | 13.35 (13.30 to 13.39) | 13.35 (13.30 to 13.39) |
| boot2_p16 | 26.89 (26.89 to 26.90) | 29.10 (29.09 to 29.11) |
| boot2_p17 | 26.99 (26.99 to 26.99) | 29.84 (29.79 to 29.90) |
| boot2_p18 | 27.01 (27.01 to 27.02) | 30.28 (30.23 to 30.32) |
| boot2_p19 | 27.02 (27.01 to 27.02) | 30.53 (30.50 to 30.56) |
| boot2_p20 | 27.02 (27.02 to 27.02) | 30.45 (30.44 to 30.45) |
| boot2_p22 | 26.79 (26.75 to 26.83) | 27.97 (27.90 to 28.05) |
| boot2_p24 | 24.16 (24.16 to 24.17) | 24.23 (24.19 to 24.28) |
| boot1_warm | 13.35 (13.30 to 13.39) | 13.35 (13.30 to 13.39) |
| boot1_mult | 13.32 (13.26 to 13.38) | 13.32 (13.26 to 13.38) |
| boot2_p16_mult | 26.38 (26.37 to 26.40) | 28.79 (28.56 to 29.01) |

Peak memory of the OpenFHE process (GiB): own keys 16.6, token's keys 16.6.
