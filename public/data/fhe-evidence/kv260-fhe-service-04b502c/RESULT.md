# kv260-fhe-server on the KV260 Cortex-A53 (2026-10-03, 18:03–18:04 UTC)

The TFHE compute service ran on the board (pqctoday-fhe `3170872`, no uncommitted changes) as a transient systemd unit (`MemoryMax=3G`, no swap).

- **Network:** it listened on the board's loopback, reached through an SSH tunnel from the owner's Mac. No firewall change was needed.
- **TLS:** it used the board's own per-boot crypto-port certificate and the CACP client CA, with mTLS over TLS 1.3. Only hybrid ML-KEM groups are offered on either side, so the handshake necessarily used one of them.
- **Client:** the data-owner client ran in a linux/arm64 container with the board's CACP client identity, fetched for the run and deleted afterwards.
- **Keys:** the server key, the lists and the decryption came from the Mac software token (the stage F token, signer `891ce509…c3bc`, lineage `1492bcc8…b107`). The keys are software-held, so this run makes no hardware-custody claim.

## Results (`client.txt`, `job.json`, `server.log`, `token-decrypt.txt`)

| Check | Result |
|---|---|
| `GET /v1/health` | ok; it lists the pins and limits |
| Server key with one bit flipped | **refused, 403** ("SHA-384 of the server key does not match the manifest") |
| Genuine signed server key | **admitted**: signature, pins and SHA-384 checked in **241 ms**, then conformant load + decompress in **1.42 s** |
| Demo program (`examples/demo-program.json`; 6 steps over u32 and u8, 5 outputs) | estimated 27.0 s; **ran in 23.3 s** on the board (24.2 s wall at the client, including polling). List expansion took 4.82 s. Steps: add 5.87 s, gt-const 1.56 s, select 5.80 s, min (u8) 2.10 s, xor-const (u8) 0.40 s, eq (u32) 2.71 s |
| Token decrypts the 5 outputs under its policy | **all correct:** r = 2615157863, big = true, m = 92, x = 72, e = false |
| Memory (`memory.txt`) | cgroup peak 293,023,744 B (279 MiB); RSS after the job was 210,080 kB |

The cost model was conservative on this program: it estimated `select` at 12 s and `gt` against a constant at 3.1 s, and they measured 5.8 s and 1.6 s.

**Not covered in this run:**
- direct client access over the network (that needs a firewall rule for port 5730);
- concurrent clients and queue-full behaviour on the board (both were tested only locally);
- a Yocto service unit.

Do not publish `provenance.txt` or `run.log`, which contain internal hosts. The other files pass the host scan.
