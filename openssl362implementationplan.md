# OpenSSL WASM Upgrade: 3.6.1 → 3.6.2

## Why

OpenSSL 3.6.2 (April 7, 2026) patches 7 CVEs. The two highest-severity ones are directly relevant
to this codebase:

- **CVE-2026-31790** — RSA KEM RSASVE encapsulation sends uninitialized memory to peer (info leak)
- **CVE-2026-28387** — DANE TLSA client use-after-free / double-free

The others (AES-CFB-128 AVX-512 OOB read, CRL null-deref, CMS crashes, 32-bit hex overflow) are
lower priority for a browser WASM build but are fixed for free by upgrading.

---

## Architecture Context

OpenSSL is **compiled from source** via Emscripten — not an npm package. The compiled binary
(`public/wasm/openssl.{js,wasm}`) is checked into the repo and served statically.

```
openssl-3.6.1-src/     ← vanilla tarball, gitignored
    └─ Configure linux-generic32 no-asm no-threads ...
build-wasm.sh          ← orchestrates Emscripten build
src/wasm/tls_simulation.c ← C wrapper compiled into the WASM
public/wasm/
    ├─ openssl.js      ← Emscripten JS loader (228 KB)
    ├─ openssl.wasm    ← WASM binary (3.9 MB)
    └─ openssl.cnf     ← config file, unchanged
src/components/OpenSSLStudio/worker/openssl.worker.ts ← loads WASM, wraps exports
src/services/crypto/OpenSSLService.ts ← manages worker lifecycle
```

**No C or TypeScript changes are needed.** `tls_simulation.c` uses only stable OpenSSL 3.x APIs
(none that are 3.6.1-specific). The worker is fully version-agnostic.

---

## Steps

### 1. Download and extract the 3.6.2 tarball

```bash
cd ~/antigravity/pqc-timeline-app

curl -LO https://www.openssl.org/source/openssl-3.6.2.tar.gz
# Verify SHA256 against https://www.openssl.org/source/openssl-3.6.2.tar.gz.sha256
sha256sum openssl-3.6.2.tar.gz

tar xf openssl-3.6.2.tar.gz
# Produces: openssl-3.6.2-src/
```

### 2. Edit `build-wasm.sh` (2 lines)

| Line | Before                                                     | After                                                      |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| 4    | `"Starting OpenSSL WASM Build (3.6.1 + HRR detection)..."` | `"Starting OpenSSL WASM Build (3.6.2 + HRR detection)..."` |
| 6    | `cd openssl-3.6.1-src`                                     | `cd openssl-3.6.2-src`                                     |

All Configure flags, compiler flags, excluded files, and exported symbols stay the same.

### 3. Update `.gitignore` and `.prettierignore`

Both reference `openssl-3.6.1-src/` by name — update to `openssl-3.6.2-src/`.

- `.gitignore` line 23
- `.prettierignore` line 21

### 4. Rebuild

```bash
./build-wasm.sh
```

Outputs `public/wasm/openssl.js` and `public/wasm/openssl.wasm`. The old 3.6.1 artifacts are
overwritten in place — no path changes needed anywhere.

### 5. Update README.md version strings

README currently says `v3.6.0` (already stale vs 3.6.1). Update all four occurrences to `v3.6.2`:

- Line 88: "OpenSSL Studio: Browser-based OpenSSL **v3.6.0** workbench"
- Line 100: "OpenSSL **3.6.0** support matrix"
- Line 106: "real OpenSSL WASM **v3.6.0** crypto"
- Line 627: "OpenSSL WASM **v3.6.0**"

### 6. Archive old source (optional, matches existing pattern)

```bash
mv openssl-3.6.1-src openssl-3.6.1-src.bak
# Mirrors openssl-3.6.0-src.bak already in the repo
```

---

## Files Changed

| File                       | Type   | Change                                      |
| -------------------------- | ------ | ------------------------------------------- |
| `build-wasm.sh`            | Script | Lines 4, 6: version string + directory name |
| `.gitignore`               | Config | Line 23: source dir name                    |
| `.prettierignore`          | Config | Line 21: source dir name                    |
| `README.md`                | Docs   | Lines 88, 100, 106, 627: version string     |
| `public/wasm/openssl.js`   | Asset  | Replaced by rebuild output                  |
| `public/wasm/openssl.wasm` | Asset  | Replaced by rebuild output                  |

**No changes needed:**

- `src/wasm/tls_simulation.c` — stable OpenSSL 3.x APIs throughout
- `src/components/OpenSSLStudio/worker/openssl.worker.ts` — WASM-agnostic
- `src/services/crypto/OpenSSLService.ts` — no version assumptions
- liboqs provider — patch-level bump, same API surface

---

## Verification

```bash
# 1. Build passes
./build-wasm.sh                      # exits 0

# 2. WASM size sanity (should be within ~5% of 3.9 MB)
ls -lh public/wasm/openssl.wasm

# 3. TypeScript + unit tests clean
npm run build
npm test

# 4. Dev server smoke test
npm run dev
# → navigate to /openssl
# → run: openssl version         (should show OpenSSL 3.6.2)
# → run: openssl genpkey -algorithm ML-KEM-768
# → run TLS simulation with ML-KEM group (HRR detection must still fire)
```

---

## Risk Assessment

| Risk                                               | Likelihood | Mitigation                                                          |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| 3.6.2 breaks a stable API used in tls_simulation.c | Very low   | All calls are 3.0-compatible; no 3.6-specific APIs                  |
| Emscripten build fails due to new source layout    | Low        | 3.6.x releases keep the same directory structure                    |
| liboqs provider incompatible                       | Very low   | Patch-level bump; OQS provider tracks the 3.x API, not sub-releases |
| WASM binary size grows significantly               | Very low   | Security-only patch, no new features                                |
