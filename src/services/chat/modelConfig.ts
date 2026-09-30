// SPDX-License-Identifier: GPL-3.0-only

/** Pinned provider defaults used by stores, services, and snapshot restore. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
export const DEFAULT_LOCAL_MODEL = 'Qwen3.5-9B-q4f16_1-MLC'
export const QWEN3_LOCAL_MODEL = 'Qwen3-8B-q4f16_1-MLC'
export const SUPPORTED_LOCAL_MODELS = [DEFAULT_LOCAL_MODEL, QWEN3_LOCAL_MODEL] as const
