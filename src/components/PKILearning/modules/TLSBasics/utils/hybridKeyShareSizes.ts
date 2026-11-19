// SPDX-License-Identifier: AGPL-3.0-only

/** RFC 10024 §§4.1–4.3, in bytes. Shares exclude the TLS KeyShareEntry header. */
export const HYBRID_TLS_KEY_SHARES = {
  X25519MLKEM768: { client: 1216, server: 1120, scheduleInput: 64 },
  SecP256r1MLKEM768: { client: 1249, server: 1153, scheduleInput: 64 },
  SecP384r1MLKEM1024: { client: 1665, server: 1665, scheduleInput: 80 },
} as const
