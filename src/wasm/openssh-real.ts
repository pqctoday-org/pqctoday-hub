// SPDX-License-Identifier: AGPL-3.0-only
//
// openssh-real.ts — bridge to the REAL OpenSSH WASM handshake.
//
// Unlike the modelled `sshEngine` (./openssh.ts), this drives the genuine
// OpenSSH binary (built from pqctoday-hsm/openssh-pkcs11): a real
// mlkem768x25519-sha256 KEX with an ssh-mldsa-65 host key, real publickey
// userauth, every signature produced by the token's C_Sign — the private keys
// never leave the embedded softhsmv3.
//
// The bundle is self-contained (embeds softhsm, single-process loopback), so the
// bridge is far simpler than StrongSwanEngine: one worker, one run, an event
// stream over postMessage. No SharedArrayBuffer, no RPC.

/** A structured handshake event emitted by the binary (payload is a JSON string). */
export interface SshRealEvent {
  evType: string
  payload: string
}

export interface SshRealLog {
  level: 'info' | 'error'
  text: string
}

export interface SshRealRunResult {
  rv: number
  events: SshRealEvent[]
}

export interface SshRealRunCallbacks {
  /** KEX algorithm wire name, e.g. "mlkem768x25519-sha256" or "curve25519-sha256". */
  kex?: string
  /** Host/user key algorithm, e.g. "ssh-mldsa-65" or "ecdsa-sha2-nistp256". */
  hostalg?: string
  onEvent?: (ev: SshRealEvent) => void
  onLog?: (log: SshRealLog) => void
}

const RUN_TIMEOUT_MS = 60_000

export class SshRealEngine {
  private worker: Worker | null = null

  /**
   * Run one real handshake to completion. Spawns a fresh worker (the wasm
   * bootstraps its token once per instance, so each run gets a clean engine),
   * streams events/logs via the callbacks, and resolves with the full event
   * list when the binary reaches its `done` event.
   */
  public runHandshake(cb: SshRealRunCallbacks = {}): Promise<SshRealRunResult> {
    this.terminate()

    return new Promise<SshRealRunResult>((resolve, reject) => {
      const events: SshRealEvent[] = []
      let settled = false

      const worker = new Worker('/wasm/openssh_worker.js')
      this.worker = worker

      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        this.terminate()
        reject(new Error(`real SSH handshake timed out after ${RUN_TIMEOUT_MS / 1000}s`))
      }, RUN_TIMEOUT_MS)

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data || {}
        switch (msg.type) {
          case 'EVENT': {
            const ev: SshRealEvent = { evType: msg.evType, payload: msg.payload }
            events.push(ev)
            cb.onEvent?.(ev)
            break
          }
          case 'LOG':
            cb.onLog?.({ level: msg.level === 'error' ? 'error' : 'info', text: msg.text })
            break
          case 'DONE':
            if (settled) return
            settled = true
            clearTimeout(timer)
            resolve({ rv: typeof msg.rv === 'number' ? msg.rv : 0, events })
            this.terminate()
            break
          case 'ERROR':
            if (settled) return
            settled = true
            clearTimeout(timer)
            reject(new Error(msg.message || 'real SSH handshake failed'))
            this.terminate()
            break
        }
      }

      worker.onerror = (err: ErrorEvent) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(new Error(err.message || 'openssh worker error'))
        this.terminate()
      }

      worker.postMessage({ type: 'RUN', kex: cb.kex, hostalg: cb.hostalg })
    })
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}

export const sshRealEngine = new SshRealEngine()

/** Find an event by type and parse its JSON payload (null if absent/unparsable). */
export function parseEvent<T = Record<string, unknown>>(
  events: SshRealEvent[],
  evType: string
): T | null {
  const ev = events.find((e) => e.evType === evType)
  if (!ev) return null
  try {
    return JSON.parse(ev.payload) as T
  } catch {
    return null
  }
}

// CKM mechanism codes that appear in the SSH trace (for friendly labels).
const MECH_NAMES: Record<number, string> = {
  0x1c: 'CKM_ML_DSA_KEY_PAIR_GEN',
  0x1d: 'CKM_ML_DSA',
}

/**
 * Map a "pkcs11" trace event (emitted by the in-wasm tap in pkcs11_static.c and
 * the shim) onto the playground's shared `Pkcs11LogEntry` shape, so the real
 * handshake's genuine C_* calls render in the same PKCS#11 panel the modelled
 * tools use. Returns null if the payload isn't a recognizable trace line.
 */
export function mapPkcs11Event(
  payload: string,
  id: number
): import('./softhsm').Pkcs11LogEntry | null {
  let o: Record<string, unknown>
  try {
    o = JSON.parse(payload)
  } catch {
    return null
  }
  if (typeof o.op !== 'string') return null
  const rv = typeof o.rv === 'number' ? o.rv : 0
  // Build a compact args string from the remaining fields.
  const args = Object.entries(o)
    .filter(([k]) => k !== 'op' && k !== 'rv')
    .map(([k, v]) => {
      if (k === 'mech' && typeof v === 'number')
        return `mech=${MECH_NAMES[v] ?? `0x${v.toString(16)}`}`
      return `${k}=${v}`
    })
    .join(' ')
  return {
    id,
    timestamp: new Date().toISOString().slice(11, 19),
    fn: o.op,
    args,
    rvHex: `0x${rv.toString(16).toUpperCase()}`,
    rvName: rv === 0 ? 'CKR_OK' : `0x${rv.toString(16).toUpperCase()}`,
    ms: 0,
    ok: rv === 0,
    engineName: 'openssh (real)',
    inspectNote:
      'Traced from the real OpenSSH binary, not from this page — only the summary fields it reports are available.',
  }
}

// The KEX the shim currently runs for real (hardcoded in drive_kex until
// M2a parameterizes it). The model's KEX id `mlkem768-curve25519-sha256` is the
// same algorithm as OpenSSH's wire name `mlkem768x25519-sha256`.
export const REAL_KEX_ID = 'mlkem768-curve25519-sha256'
// Default/primary real host-key id — kept for back-compat with existing callers
// (e.g. the honesty-banner default combo). Prefer REAL_HOSTKEY_IDS for a
// membership check.
export const REAL_HOSTKEY_ID = 'ssh-mldsa-65'
// All ML-DSA host-key parameter sets the rebuilt OpenSSH WASM binary can now
// actually sign with for real (2026-08-31 remediation: ssh-mldsa.c generalized
// from a single hardcoded ML-DSA-65 impl to a DEFINE_MLDSA_IMPL(...) macro
// covering all 3 FIPS 204 parameter sets, and wasm-shims/sshd_wasm_main.c's
// HOSTKEY_VARIANTS[] table now selects any of them by name via
// set_handshake_config). The modeled engine's ids (openssh.ts SshHostKeyAlg)
// are identical to the real OpenSSH wire names for these three, so no mapping
// is needed to pass a selection straight through to the real binary.
//
// Widened same-night (2026-08-31, SLH-DSA UI wiring) with the 8 real SLH-DSA
// parameter sets openssh-pkcs11/patches/ssh-slhdsa.c implements via its own
// DEFINE_SLHDSA_IMPL(...) macro, also selected through the same
// HOSTKEY_VARIANTS[] table. These 8 are every FIPS 205 parameter set with a
// standalone SSH wire name in draft-josefsson-ssh-sphincs-02 (128-/256-bit
// SHA2 and SHAKE, both `s`/`f` modes) — the connector deliberately does not
// implement 192-bit SLH-DSA, since that draft defines no standalone name for
// it (see ssh-slhdsa.c's file header for the full citation).
export const REAL_HOSTKEY_IDS: ReadonlySet<string> = new Set([
  'ssh-mldsa-44',
  'ssh-mldsa-65',
  'ssh-mldsa-87',
  'ssh-slh-dsa-sha2-128s',
  'ssh-slh-dsa-sha2-128f',
  'ssh-slh-dsa-shake-128s',
  'ssh-slh-dsa-shake-128f',
  'ssh-slh-dsa-sha2-256s',
  'ssh-slh-dsa-sha2-256f',
  'ssh-slh-dsa-shake-256s',
  'ssh-slh-dsa-shake-256f',
])

/** True when the chosen PQC combo is one the real binary actually runs. */
export function isRealCombo(kex: string, hostKey: string): boolean {
  return kex === REAL_KEX_ID && REAL_HOSTKEY_IDS.has(hostKey)
}

// Public-key wire sizes by host-key algorithm (approx, for the size bars).
// ML-DSA sizes are FIPS 204 Table 2 raw public keys, cross-checked against
// deps/openssl-src/openssl-3.6.3/include/crypto/ml_dsa.h (see openssh-pkcs11
// CHANGELOG.md 2026-08-31 entry). SLH-DSA sizes are FIPS 205 s11 Table 2,
// cross-checked against ssh-slhdsa.c's DEFINE_SLHDSA_IMPL(...) pk_sz
// arguments — SHA2 and SHAKE variants of the same security level share the
// same pk/sig sizes.
const HOST_PUBKEY_BYTES: Record<string, number> = {
  'ssh-mldsa-44': 1312, // FIPS 204 ML-DSA-44 raw public key
  'ssh-mldsa-65': 1952, // FIPS 204 ML-DSA-65 raw public key
  'ssh-mldsa-87': 2592, // FIPS 204 ML-DSA-87 raw public key
  'ssh-slh-dsa-sha2-128s': 32, // FIPS 205 128-bit raw public key
  'ssh-slh-dsa-sha2-128f': 32,
  'ssh-slh-dsa-shake-128s': 32,
  'ssh-slh-dsa-shake-128f': 32,
  'ssh-slh-dsa-sha2-256s': 64, // FIPS 205 256-bit raw public key
  'ssh-slh-dsa-sha2-256f': 64,
  'ssh-slh-dsa-shake-256s': 64,
  'ssh-slh-dsa-shake-256f': 64,
  'ecdsa-sha2-nistp256': 65, // uncompressed P-256 point Q
}
// KEX init/reply share sizes by KEX algorithm.
const KEX_SHARES: Record<string, [number, number]> = {
  'mlkem768x25519-sha256': [1184 + 32, 1088 + 32], // ML-KEM-768 pk/ct + X25519
  'curve25519-sha256': [32, 32],
  'ecdh-sha2-nistp256': [65, 65],
  'ecdh-sha2-nistp384': [97, 97],
  'ecdh-sha2-nistp521': [133, 133],
}

// SSH message numbers (RFC 4253 §12, RFC 4252 §6).
const SSH_MSG = {
  KEXINIT: 20,
  NEWKEYS: 21,
  KEX_ECDH_INIT: 30,
  KEX_ECDH_REPLY: 31,
  USERAUTH_REQUEST: 50,
  USERAUTH_SUCCESS: 52,
}

/**
 * Reconstruct the SSH packet ladder for a real run from the milestone sizes the
 * binary reports (KEX shares, host/user signature lengths). The protocol message
 * sequence is fixed by RFC 4253/4252; the share/signature sizes are the genuine
 * values from the handshake, framing bytes are nominal. This drives the existing
 * wire-packet diagram/compare views for real runs (which otherwise have no
 * per-packet capture — the loopback only emits milestones, not byte streams).
 */
function buildWirePackets(
  r: import('./openssh').SshHandshakeResult
): import('./openssh').SshWirePacket[] {
  const pkt = (
    direction: 'C→S' | 'S→C',
    msgType: string,
    msgNum: number,
    sizeBytes: number
  ): import('./openssh').SshWirePacket => ({
    direction,
    msgType,
    msgNum,
    sizeBytes,
    hexPreview: msgNum.toString(16).padStart(2, '0'),
  })
  return [
    pkt('C→S', 'SSH_MSG_KEXINIT', SSH_MSG.KEXINIT, 1100),
    pkt('S→C', 'SSH_MSG_KEXINIT', SSH_MSG.KEXINIT, 1100),
    pkt('C→S', 'SSH_MSG_KEX_ECDH_INIT', SSH_MSG.KEX_ECDH_INIT, r.kex_share_bytes + 8),
    // Reply carries the host public key + server KEX share + exchange-hash signature.
    pkt(
      'S→C',
      'SSH_MSG_KEX_ECDH_REPLY',
      SSH_MSG.KEX_ECDH_REPLY,
      r.host_pubkey_bytes + r.kex_reply_share_bytes + r.host_sig_bytes + 24
    ),
    pkt('C→S', 'SSH_MSG_NEWKEYS', SSH_MSG.NEWKEYS, 16),
    pkt('S→C', 'SSH_MSG_NEWKEYS', SSH_MSG.NEWKEYS, 16),
    // Userauth request carries the user public key blob + signature.
    pkt(
      'C→S',
      'SSH_MSG_USERAUTH_REQUEST',
      SSH_MSG.USERAUTH_REQUEST,
      r.client_pubkey_bytes + r.client_sig_bytes + 48
    ),
    pkt('S→C', 'SSH_MSG_USERAUTH_SUCCESS', SSH_MSG.USERAUTH_SUCCESS, 8),
  ]
}

/**
 * Map the real handshake event stream onto the existing `SshHandshakeResult`
 * shape so the comparison/telemetry UI can render a genuine run. The KEX and
 * host-key names come from the binary's own `kex_start` event; signature sizes
 * come from `host_key_sign`/`user_key_sign`; KEX-share and pubkey sizes from the
 * lookups above. `auth_ms` is the measured wall-clock; per-phase timings aren't
 * emitted by the shim, so they're left at 0.
 */
export function mapRealEventsToResult(
  events: SshRealEvent[],
  rv: number,
  wallMs: number
): import('./openssh').SshHandshakeResult {
  const start = parseEvent<{ kex: string; hostkey: string }>(events, 'kex_start')
  const hostSign = parseEvent<{ sig_len: number }>(events, 'host_key_sign')
  const userSign = parseEvent<{ user_sig_len: number }>(events, 'user_key_sign')
  const newkeys = parseEvent<{ hostsign: string }>(events, 'newkeys')
  const success = parseEvent<{ usersign: string }>(events, 'userauth_success')
  const connection_ok = rv === 0 && success != null && newkeys != null

  const kex = start?.kex ?? 'mlkem768x25519-sha256'
  const hostalg = start?.hostkey ?? 'ssh-mldsa-65'
  const [clientShare, serverShare] = KEX_SHARES[kex] ?? [0, 0]
  const pub = HOST_PUBKEY_BYTES[hostalg] ?? 0
  // Quantum-safe when the KEX uses ML-KEM and the host key uses ML-DSA or
  // SLH-DSA (both PQC signature families the real binary can run).
  const quantum_safe =
    kex.includes('mlkem') && (hostalg.includes('mldsa') || hostalg.includes('slh-dsa'))

  const result: import('./openssh').SshHandshakeResult = {
    connection_ok,
    quantum_safe,
    host_key_algorithm: hostalg,
    client_auth_algorithm: hostalg,
    kex_algorithm: kex,
    host_pubkey_bytes: pub,
    client_pubkey_bytes: pub,
    kex_share_bytes: clientShare,
    kex_reply_share_bytes: serverShare,
    host_sig_bytes: hostSign?.sig_len ?? 0,
    client_sig_bytes: userSign?.user_sig_len ?? 0,
    auth_ms: wallMs,
    keygen_ms: 0,
    kex_ms: 0,
    host_sig_ms: 0,
    client_sig_ms: 0,
    // Both host- and user-auth signatures were produced by the token's C_Sign.
    pkcs11_host_backed: newkeys?.hostsign === 'C_Sign',
    pkcs11_client_backed: success?.usersign === 'C_Sign',
    token_module: 'softhsmv3 (WASM, embedded — real OpenSSH)',
    wire_packets: [],
    error: connection_ok ? undefined : 'real handshake did not reach USERAUTH_SUCCESS',
  }
  result.wire_packets = connection_ok ? buildWirePackets(result) : []
  return result
}

// Real classical baseline the binary can run (curve25519 KEX + ECDSA P-256 host
// key, both on the token). Used for the real-vs-real comparison.
export const REAL_CLASSICAL = { kex: 'curve25519-sha256', hostalg: 'ecdsa-sha2-nistp256' }
// Real PQC profile (wire names the shim expects).
export const REAL_PQC = { kex: 'mlkem768x25519-sha256', hostalg: 'ssh-mldsa-65' }

export interface SshConfigArtifacts {
  sshdConfig: string
  sshConfig: string
  authorizedKeys: string
  setupScript: string
}

// Host-key file basename per algorithm (matches OpenSSH conventions).
const HOSTKEY_FILE: Record<string, string> = {
  'ssh-mldsa-44': 'ssh_host_mldsa44_key',
  'ssh-mldsa-65': 'ssh_host_mldsa65_key',
  'ssh-mldsa-87': 'ssh_host_mldsa87_key',
  'ssh-slh-dsa-sha2-128s': 'ssh_host_slhdsa_sha2_128s_key',
  'ssh-slh-dsa-sha2-128f': 'ssh_host_slhdsa_sha2_128f_key',
  'ssh-slh-dsa-shake-128s': 'ssh_host_slhdsa_shake_128s_key',
  'ssh-slh-dsa-shake-128f': 'ssh_host_slhdsa_shake_128f_key',
  'ssh-slh-dsa-sha2-256s': 'ssh_host_slhdsa_sha2_256s_key',
  'ssh-slh-dsa-sha2-256f': 'ssh_host_slhdsa_sha2_256f_key',
  'ssh-slh-dsa-shake-256s': 'ssh_host_slhdsa_shake_256s_key',
  'ssh-slh-dsa-shake-256f': 'ssh_host_slhdsa_shake_256f_key',
  'ecdsa-sha2-nistp256': 'ssh_host_ecdsa_key',
}

/** Only the existing genuine profile has a pinned native recipe. Model-only
 * names are not silently translated into a different native SSH negotiation. */
export function canBuildNativeSshRecipe(r: import('./openssh').SshHandshakeResult): boolean {
  return (
    r.connection_ok &&
    r.token_module === 'softhsmv3 (WASM, embedded — real OpenSSH)' &&
    r.client_auth_algorithm === r.host_key_algorithm &&
    ((r.kex_algorithm === REAL_CLASSICAL.kex && r.host_key_algorithm === REAL_CLASSICAL.hostalg) ||
      (r.kex_algorithm === REAL_PQC.kex && REAL_HOSTKEY_IDS.has(r.host_key_algorithm)))
  )
}

/** Pinned Linux Sandbox OpenSSH10.5p1 + existing softhsmv3 PKCS#11 agent example.
 * The WASM driver does not parse these files; this native recipe is checked
 * separately. It uses fresh sample token identities, never the WASM private keys.
 * HostKeyAgent/public-sidecar contract: upstream V_10_5_P1 sshd_config.5. */
export function buildSshConfigArtifacts(
  r: import('./openssh').SshHandshakeResult
): SshConfigArtifacts {
  if (!canBuildNativeSshRecipe(r))
    throw new Error('No pinned native recipe for this retained model or uncompleted profile')
  const kex = r.kex_algorithm,
    alg = r.host_key_algorithm,
    hostFile = new Map(Object.entries(HOSTKEY_FILE)).get(alg)
  if (!hostFile) throw new Error('Unsupported native host-key identity')
  const work = '/root/pqc-ssh-example'
  const sshdConfig = [
    '# Pinned example: PQCToday Sandbox patched OpenSSH10.5p1, Linux disposable container.',
    '# Public .pub sidecar selects the exact token host key; no private key file exists.',
    'Port 2222',
    'ListenAddress 127.0.0.1',
    `HostKey ${work}/${hostFile}`,
    `HostKeyAgent ${work}/agent.sock`,
    `KexAlgorithms ${kex}`,
    `HostKeyAlgorithms ${alg}`,
    `PubkeyAcceptedAlgorithms ${alg}`,
    'PubkeyAuthentication yes',
    'PasswordAuthentication no',
    'KbdInteractiveAuthentication no',
    'PermitEmptyPasswords no',
    'PermitRootLogin prohibit-password',
    'StrictModes yes',
    `AuthorizedKeysFile ${work}/authorized_keys`,
    `PidFile ${work}/sshd.pid`,
    'LogLevel VERBOSE',
  ].join('\n')
  const sshConfig = [
    '# Same pinned disposable-container sample; host identity is pinned, not accepted blindly.',
    'Host pqc-demo',
    '  HostName 127.0.0.1',
    '  Port 2222',
    '  User root',
    `  KexAlgorithms ${kex}`,
    `  HostKeyAlgorithms ${alg}`,
    `  PubkeyAcceptedAlgorithms ${alg}`,
    `  IdentityAgent ${work}/agent.sock`,
    `  IdentityFile ${work}/client_key.pub`,
    '  IdentitiesOnly yes',
    '  BatchMode yes',
    '  StrictHostKeyChecking yes',
    `  UserKnownHostsFile ${work}/known_hosts`,
  ].join('\n')
  const suffix =
    alg === 'ecdsa-sha2-nistp256'
      ? 'ecdsa-p256'
      : alg === 'ssh-slh-dsa-sha2-128s'
        ? 'slhdsa-128s'
        : alg.replace(/^ssh-/, '')
  const authorizedKeys = `# setup.sh writes actual ${alg} public bytes from the selected agent identity.\n# No placeholder key is accepted. Host and client labels must be distinct.`
  const setupScript = [
    '#!/bin/sh',
    'set -eu',
    'umask 077',
    '# Run ONLY inside the pinned disposable Linux Sandbox, never on a host/service.',
    '# Prerequisite: initialized sample token, non-extractable host and user keys',
    `# of algorithm ${alg}; labels below select identities, never just the first key.`,
    'test "$(uname -s)" = Linux && test "$(id -u)" = 0 && test -f /.dockerenv',
    'BIN=/usr/local/ssh/bin',
    'SSHD=/usr/local/ssh/sbin/sshd',
    'MODULE=/usr/local/lib/softhsm/libsofthsmv3.so',
    `WORK=${work}`,
    '"$BIN/ssh" -V 2>&1 | grep -q "^OpenSSH_10[.]5p1,"',
    '# Exact retained test build; verify these binaries before using the recipe.',
    "printf '%s\\n' 'ab0160d0475f89846c0c047a90813c6416b91c2ad3e5de2609e5e936849f9bf1  /usr/local/ssh/bin/ssh' 'f46cdf1c3b93bc999cfe77327c944772e503f9f2ef84aa0eddeeb266df91a207  /usr/local/ssh/sbin/sshd' 'a0ae2698ead23a705275d5010dec75aab7281afd2aed6fe09269e1c4cfa0aeeb  /usr/local/ssh/bin/ssh-agent' '41b0ba1f9696e4ca3f842e28701de06747614945689760d3112acba93ad0570d  /usr/local/ssh/bin/ssh-add' '858d398f8d159487b1acc403ead8e395246b48139ba1e3ec1bbcf1b453e9a284  /usr/local/lib/softhsm/libsofthsmv3.so' | sha256sum -c -",
    'mkdir -p "$WORK" /var/empty',
    'chmod 700 "$WORK"',
    'chmod 755 /var/empty',
    'id -u sshd >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin -d /var/empty sshd',
    '# Enable only the disposable image account for key authentication; passwords remain disabled.',
    'usermod -p x root',
    'test ! -e "$WORK/agent.sock"',
    `test ! -e "$WORK/${hostFile}"`,
    `HOST_KEY_LABEL="\${HOST_KEY_LABEL:-ssh-host-${suffix}}"`,
    `CLIENT_KEY_LABEL="\${CLIENT_KEY_LABEL:-ssh-user-${suffix}}"`,
    'test "$HOST_KEY_LABEL" != "$CLIENT_KEY_LABEL"',
    'export PQC_SSH_SAMPLE_PIN="${PQC_SSH_SAMPLE_PIN:-1234}"',
    'server_pid=; agent_pid=',
    'cleanup() { test -z "$server_pid" || kill "$server_pid" 2>/dev/null || true; test -z "$agent_pid" || kill "$agent_pid" 2>/dev/null || true; }',
    'trap cleanup EXIT HUP INT TERM',
    'eval "$("$BIN/ssh-agent" -s -a "$WORK/agent.sock")" >/dev/null',
    'agent_pid=$SSH_AGENT_PID',
    'printf \'%s\\n\' \'#!/bin/sh\' \'printf "%s\\n" "$PQC_SSH_SAMPLE_PIN"\' > "$WORK/askpass.sh"',
    'chmod 700 "$WORK/askpass.sh"',
    'SSH_ASKPASS="$WORK/askpass.sh" SSH_ASKPASS_REQUIRE=force DISPLAY=sample "$BIN/ssh-add" -s "$MODULE"',
    '"$BIN/ssh-add" -L > "$WORK/agent_public_keys"',
    `awk -v alg='${alg}' -v label="$HOST_KEY_LABEL" '$1==alg && $3==label {print}' "$WORK/agent_public_keys" > "$WORK/${hostFile}.pub"`,
    `awk -v alg='${alg}' -v label="$CLIENT_KEY_LABEL" '$1==alg && $3==label {print}' "$WORK/agent_public_keys" > "$WORK/client_key.pub"`,
    `test "$(wc -l < "$WORK/${hostFile}.pub")" -eq 1 || { echo "Expected exactly one matching host public identity" >&2; exit 1; }`,
    'test "$(wc -l < "$WORK/client_key.pub")" -eq 1 || { echo "Expected exactly one matching client public identity" >&2; exit 1; }',
    `host_fp="$("$BIN/ssh-keygen" -lf "$WORK/${hostFile}.pub" | awk '{print $2}')"`,
    `client_fp="$("$BIN/ssh-keygen" -lf "$WORK/client_key.pub" | awk '{print $2}')"`,
    'test "$host_fp" != "$client_fp"',
    'cp "$WORK/client_key.pub" "$WORK/authorized_keys"',
    `printf '[127.0.0.1]:2222 %s\\n' "$(cat "$WORK/${hostFile}.pub")" > "$WORK/known_hosts"`,
    'cat > "$WORK/sshd_config" <<\'PQC_SERVER\'',
    sshdConfig,
    'PQC_SERVER',
    'cat > "$WORK/ssh_config" <<\'PQC_CLIENT\'',
    sshConfig,
    'PQC_CLIENT',
    '"$SSHD" -t -f "$WORK/sshd_config"',
    '"$SSHD" -D -e -f "$WORK/sshd_config" > "$WORK/sshd.log" 2>&1 &',
    'server_pid=$!',
    'i=0; while ! grep -q "Server listening on" "$WORK/sshd.log"; do kill -0 "$server_pid"; i=$((i+1)); test "$i" -lt 50; sleep 0.1; done',
    '"$BIN/ssh" -vv -F "$WORK/ssh_config" pqc-demo /bin/true 2> "$WORK/client.log" || { status=$?; cat "$WORK/client.log" >&2; exit "$status"; }',
    'cat "$WORK/client.log"',
    '# Inspect negotiated algorithms and the token operation log. A lab pass is not deployment evidence.',
  ].join('\n')
  return { sshdConfig, sshConfig, authorizedKeys, setupScript }
}
