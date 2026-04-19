// SPDX-License-Identifier: GPL-3.0-only
// Per-step UX metadata for the 5G SUCI Playground.
// Kept separate from constants.ts so FiveGService step-reads stay unchanged
// and this UX layer can be reverted independently.

export type SuciPhase = 'setup' | 'construct' | 'inspect' | 'decrypt'
export type SuciProfile = 'A' | 'B' | 'C'

export interface SuciStepMeta {
  phase: SuciPhase
  plainEnglish: string[]
  attackerObserves: string
  isClimax?: boolean
}

export const SUCI_PHASE_LABELS: Record<SuciPhase, string> = {
  setup: 'Setup',
  construct: 'UE · SUCI',
  inspect: 'Inspect',
  decrypt: 'Network · SIDF',
}

// Steps 1–3 → setup, 4–8 → construct, 9 → inspect, 10–11 → decrypt
const PHASE_BY_STEP_ID: Record<string, SuciPhase> = {
  init_network_key: 'setup',
  provision_usim: 'setup',
  retrieve_key: 'setup',
  gen_ephemeral_key: 'construct',
  compute_shared_secret: 'construct',
  derive_keys: 'construct',
  encrypt_msin: 'construct',
  compute_mac: 'construct',
  visualize_suci: 'inspect',
  assemble_suci: 'decrypt',
  sidf_decryption: 'decrypt',
}

// Static per-step "what the eavesdropper captures" copy.
// Keep short — this renders as a red-bordered addendum, not a full essay.
const ATTACKER_BY_STEP: Record<string, Partial<Record<SuciProfile, string>>> = {
  init_network_key: {
    A: 'Nothing — operator key generation happens inside the HN HSM, never on air.',
    B: 'Nothing — operator key generation happens inside the HN HSM, never on air.',
    C: 'Nothing — ML-KEM/X25519 keypairs stay inside the HN HSM.',
  },
  provision_usim: {
    A: 'Nothing — SIM personalization is an out-of-band factory step.',
    B: 'Nothing — SIM personalization is an out-of-band factory step.',
    C: 'Nothing — even the 1184-byte ML-KEM pubkey is loaded off-air.',
  },
  retrieve_key: {
    A: 'Nothing — the USIM reads EF_SUCI_Calc_Info locally inside the secure element.',
    B: 'Nothing — the USIM reads EF_SUCI_Calc_Info locally inside the secure element.',
    C: 'Nothing — the USIM reads the 1184-byte HN pubkey locally.',
  },
  gen_ephemeral_key: {
    A: 'Nothing yet — the ephemeral X25519 keypair stays in the USIM until Step 10.',
    B: 'Nothing yet — the ephemeral P-256 keypair stays in the USIM until Step 10.',
    C: 'Nothing yet — hybrid X25519 key (if any) stays local; ML-KEM has no separate UE ephemeral key.',
  },
  compute_shared_secret: {
    A: 'Nothing — Z is derived inside the USIM and never leaves it.',
    B: 'Nothing — Z is derived inside the USIM and never leaves it.',
    C: 'Nothing — Z_kem, Z_ecdh, and the combined Z all stay inside the USIM.',
  },
  derive_keys: {
    A: 'Nothing — K_enc (AES-128) and K_mac stay inside the USIM HSM.',
    B: 'Nothing — K_enc (AES-128) and K_mac stay inside the USIM HSM.',
    C: 'Nothing — K_enc (AES-256) and K_mac (HMAC-SHA3-256) stay inside the USIM.',
  },
  encrypt_msin: {
    A: 'Still nothing on air — the AES-128-CTR ciphertext is buffered for Step 10.',
    B: 'Still nothing on air — the AES-128-CTR ciphertext is buffered for Step 10.',
    C: 'Still nothing on air — the AES-256-CTR ciphertext is buffered for Step 10.',
  },
  compute_mac: {
    A: 'Nothing yet — the 8-byte HMAC-SHA-256 tag is buffered for Step 10.',
    B: 'Nothing yet — the 8-byte HMAC-SHA-256 tag is buffered for Step 10.',
    C: 'Nothing yet — the 8-byte HMAC-SHA3-256 tag is buffered for Step 10.',
  },
  visualize_suci: {
    A: 'Still nothing — this is a local inspection, no packets are sent.',
    B: 'Still nothing — this is a local inspection, no packets are sent.',
    C: 'Still nothing — this is a local inspection, no packets are sent.',
  },
  assemble_suci: {
    A: 'Now it goes on air: scheme ID (1) + routing indicator + 32-byte raw X25519 eph pub + ciphertext (same length as MSIN) + 8-byte MAC tag. NO plaintext IMSI.',
    B: 'Now it goes on air: scheme ID (2) + routing indicator + 33-byte compressed P-256 eph pub + ciphertext + 8-byte MAC tag. NO plaintext IMSI.',
    C: 'Now it goes on air: scheme ID (3) + routing indicator + 1088-byte ML-KEM ciphertext + (hybrid only: 32-byte X25519 eph pub) + encrypted MSIN + 8-byte MAC tag. NO plaintext IMSI.',
  },
  sidf_decryption: {
    A: 'Nothing extra — decryption happens at the Home Network SIDF, not over the air.',
    B: 'Nothing extra — decryption happens at the Home Network SIDF, not over the air.',
    C: 'Nothing extra — ML-KEM decap and MAC verification happen inside the HN SIDF HSM.',
  },
}

// Plain-English rail bullets. Short, past-tense ("just happened"), 3–5 per step.
// Reused across profiles unless the crypto materially differs (Profile C overrides).
const PE_DEFAULT: Record<string, string[]> = {
  init_network_key: [
    'The home network created a long-term keypair inside its HSM.',
    'The private key stays in the HSM forever; only the public key gets shared.',
    'This pubkey will later let every SIM on the network encrypt its identity to you — and only you can decrypt.',
  ],
  provision_usim: [
    'The SIM card was loaded with the home network public key at the factory.',
    'It also learned which scheme ID to use (1 = X25519, 2 = P-256, 3 = PQC).',
    'A routing indicator was stored so roaming networks can forward your SUCI to the right home UDM.',
  ],
  retrieve_key: [
    'The SIM just read the home network public key out of its own secure storage.',
    'No network traffic happened — this is a local file read inside the USIM.',
    'Everything needed to encrypt the identity is now on the SIM.',
  ],
  gen_ephemeral_key: [
    'The SIM created a fresh, one-time keypair just for this connection attempt.',
    'Private key stays in the SIM HSM; public key will be sent later inside the SUCI.',
    'Because it is single-use, even a future key compromise cannot retro-decrypt this session (forward secrecy).',
  ],
  compute_shared_secret: [
    'The SIM combined its ephemeral private key with the home network public key.',
    'The result (Z) is a 32-byte shared secret that only the SIM and the home network can derive.',
    'An attacker would need one of the two private keys — it has neither.',
  ],
  derive_keys: [
    'Z was expanded into two purpose-specific keys using the ANSI X9.63 KDF.',
    'K_enc will encrypt your identity; K_mac will authenticate the ciphertext.',
    'Separate keys for separate jobs — a standard cryptographic hygiene pattern.',
  ],
  encrypt_msin: [
    'Your MSIN (the subscriber part of the IMSI) was just encrypted with AES-CTR under K_enc.',
    'CTR mode is length-preserving: ciphertext is exactly the same byte-count as the plaintext.',
    'The original MSIN is no longer in memory outside the HSM.',
  ],
  compute_mac: [
    'The ciphertext just got a cryptographic integrity tag using K_mac.',
    'The 64-bit tag (truncated) is enough to detect any bit-flip by an attacker.',
    'The home network will verify this BEFORE decrypting — authenticate-then-decrypt.',
  ],
  visualize_suci: [
    'Compare the plaintext SUPI (top) with the protected SUCI (bottom).',
    'The MCC/MNC stay visible — the network needs them to route to your home operator.',
    'Only the MSIN (the part that identifies you specifically) is concealed.',
  ],
  assemble_suci: [
    'All the pieces are now packed into the final SUCI byte string.',
    'This is what the SIM will broadcast in its 5G NAS registration message.',
    'An IMSI catcher listening on radio will see only this — no plaintext identity.',
  ],
  sidf_decryption: [
    'The home network SIDF re-derived Z using its private key and the SUCI ephemeral key.',
    'It verified the MAC FIRST — if that failed, decryption would not even start.',
    'After MAC passed, it decrypted the MSIN and recovered the original SUPI.',
  ],
}

const PE_PROFILE_C_OVERRIDES: Record<string, string[]> = {
  init_network_key: [
    'The home network created TWO keypairs: ML-KEM-768 (post-quantum) and X25519 (classical).',
    'The large ML-KEM public key is 1184 bytes — orders of magnitude bigger than Profile A/B pubkeys.',
    'Both private keys live in the HN HSM; only a harvest-now-decrypt-later attacker is defeated by ML-KEM.',
  ],
  compute_shared_secret: [
    'ML-KEM encapsulation just produced Z_kem plus a 1088-byte ciphertext that only the HN can decapsulate.',
    'In hybrid mode, the SIM also did classical X25519 ECDH to get Z_ecdh.',
    'Final Z = SHA-256(Z_ecdh ‖ Z_kem) — safe if EITHER component survives future attacks.',
  ],
  derive_keys: [
    'Z was expanded using SHA3-256 (instead of SHA-256) for post-quantum KDF security.',
    'K_enc is now 256 bits (AES-256) to match ML-KEM-768’s 128-bit PQ security level.',
    'K_mac uses HMAC-SHA3-256 — the full 32-byte output; only 8 bytes go on air.',
  ],
  encrypt_msin: [
    'Your MSIN was encrypted with AES-256-CTR (stronger than Profiles A/B).',
    'CTR mode still preserves length — ciphertext size matches plaintext size.',
    'AES-256 keeps ~128 bits of security even under Grover’s quantum algorithm.',
  ],
  compute_mac: [
    'The ciphertext got an HMAC-SHA3-256 integrity tag, truncated to 64 bits on air.',
    'SHA3 replaces SHA-2 here to keep the MAC safe in a post-quantum world.',
    'The home network will verify this BEFORE touching the ciphertext.',
  ],
  sidf_decryption: [
    'The HN SIDF ran ML-KEM decapsulation to recover Z_kem using its private key.',
    'In hybrid mode it also did X25519 ECDH to get Z_ecdh, then combined them into Z.',
    'MAC verified first, then AES-256-CTR decrypted the MSIN — SUPI fully recovered.',
  ],
}

export function getSuciStepMeta(profile: SuciProfile, stepId: string): SuciStepMeta | undefined {
  const phase = PHASE_BY_STEP_ID[stepId]
  if (!phase) return undefined

  const profileAttacker = ATTACKER_BY_STEP[stepId]?.[profile]
  const attackerObserves = profileAttacker ?? 'Nothing observable on the radio at this step.'

  const plainEnglish =
    (profile === 'C' && PE_PROFILE_C_OVERRIDES[stepId]) || PE_DEFAULT[stepId] || []

  return {
    phase,
    plainEnglish,
    attackerObserves,
    isClimax: stepId === 'sidf_decryption',
  }
}
