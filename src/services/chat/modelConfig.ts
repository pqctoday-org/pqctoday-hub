// SPDX-License-Identifier: AGPL-3.0-only

/** Pinned provider defaults used by stores, services, and snapshot restore. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
] as const
export const QWEN35_LOCAL_MODEL = 'Qwen3.5-9B-q4f16_1-MLC'
export const DEFAULT_LOCAL_MODEL = 'Qwen3-8B-q4f16_1-MLC'
export const QWEN3_LOCAL_MODEL = DEFAULT_LOCAL_MODEL
export const SUPPORTED_LOCAL_MODELS = [DEFAULT_LOCAL_MODEL, QWEN35_LOCAL_MODEL] as const
