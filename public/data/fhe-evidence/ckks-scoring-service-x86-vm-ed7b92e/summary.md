### 2026-10-15-id3-x1-vm

Server: ; 12 cores, 15.6 GiB, Linux 6.12.111+deb13-cloud-amd64 x86_64. Token: pqc-rust container on the Mac (linux/arm64), no board. Client: container on the Mac. Result: PASS. Batch 32768 customers, 1 worker(s).

| Measurement | Value |
|---|---|
| Customers in the request | 32,768 (6,000 held-out rows, repeated) |
| Request: 23 ciphertexts of 8,388,632 bytes | 192,938,536 bytes (184.0 MiB) |
| **Server time, first batch** | **275 ms** (weighted sum and t 42, t^2 45, t^3 27, a t 12, final add 0, total 274) |
| Client: encrypt the batch (on the Mac) / upload until accepted / wait / download | 3.6 s / 1.65 s / 0.41 s / 31 ms |
| **Server time per batch, 3 repetitions** (each / median) | **277 / 273 / 281 ms** / 277 ms |
| Upload until accepted, repetitions (each) | 1654 / 1651 / 1650 ms |
| Whole cycle per request (upload, queue, run, download), mean | 1986 ms (1,812 requests per hour; bounded by the server's run time alone: 12,991) |
| Four requests submitted together (2 uploads at a time) | 7174 ms wall, 2,007 per hour; run times 305 / 304 / 283 / 286 ms |
| Server wall time over all 8 jobs of the run (min / median / max) | 273 / 282 / 305 ms |
| Server CPU time of the evaluating thread, same jobs (min / median / max) | 269 / 281 / 303 ms |
| Key admission (token-signed manifest, public key, relinearization key; server verify / assemble / Mac client wall) | 40 / 100 / 999 ms |
| **Server peak resident set** (/proc VmHWM / the service's own figure / Go heap in use at the end) | **1311 MiB** / 1311 MiB / 554 MiB |
| Token: key-set export (registry ID 3, 1,201 bounded calls, 4.41 GB generated) | 13 s on the token (327.8 MB/s), token peak resident set 73 MiB |
| Token stream to the Mac (all frames hashed; 32 files / 94 MB stored) | 14 s (326.4 MB/s), manifest mismatches 0 / 0 |
| Token init / export wall time / decrypt of the score | 0 s / 14 s / released 524292 B in 0.014 s |
| Total wall time of the run | 47 s |

| Accuracy | Value |
|---|---|
| Released score vs plaintext cubic, 6,000 held-out rows | max error 4.77e-07 = **21.00 bits**, mean 2.4e-07 |
| Same, all 32,768 slots of the batch | max 4.77e-07 = 21.00 bits |
| Released score vs exact sigmoid | max 0.104 = **3.27 bits**, mean 0.00623 |
| Plaintext cubic vs exact sigmoid (the model's approximation) | max 0.104 = 3.27 bits, mean 0.00623 |
| Release rounding step (token policy) | 2^-20 = 9.54e-07 |
| Decision agreement at 0.5 / 0.25, released vs plaintext cubic | 100.000 % / 100.000 % |
| Decision agreement at 0.5, released vs exact sigmoid / plaintext cubic vs exact sigmoid | 99.03 % / 99.03 % |
| AUC on the held-out rows: encrypted / plaintext cubic / exact sigmoid | 0.717298 / 0.717299 / 0.717299 |
| Imaginary parts of the released slots | max 0 |
