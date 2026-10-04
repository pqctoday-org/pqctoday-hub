// SPDX-License-Identifier: GPL-3.0-only
/**
 * The single source of truth for OpenSSL Studio command categories.
 *
 * Previously this union was declared independently in both
 * `OpenSSLStudioView` (as `OpenSSLCategory`) and `WorkbenchToolbar` (as
 * `WorkbenchCategory`). Both now derive from this one type, so the view's
 * command handling and the toolbar's category buttons can never drift apart
 * (e.g. the toolbar offering a category the view doesn't route).
 */
export const OPENSSL_CATEGORIES = [
  'genpkey',
  'req',
  'x509',
  'enc',
  'dgst',
  'hash',
  'rand',
  'version',
  'files',
  'kem',
  'pkcs12',
  'lms',
  'configutl',
  'kdf',
  'pkcs11',
] as const

export type OpenSSLCategory = (typeof OPENSSL_CATEGORIES)[number]
