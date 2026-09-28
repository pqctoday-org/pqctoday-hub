// SPDX-License-Identifier: BSD-2-Clause
/*
 * @pqctoday/softhsm-wasm — SoftHSMv3 compiled to WebAssembly (PKCS#11 v3.2).
 *
 * Notice: Educational and demonstration build — not for production use, in any
 * environment. Not security-audited, not certified, and not intended to
 * protect real data.
 *
 * This applies wherever this module runs, Node.js included — not only in a
 * browser. Keys live in ordinary process memory with no tamper resistance, no
 * key-isolation boundary and no side-channel analysis; no result it produces is
 * a CAVP/CMVP certificate or an ACVTS verdict. Do not use this module, or
 * anything it produces, to protect real data or real systems. See ./NOTICE.
 */
'use strict'

const createSoftHSMModule = require('./wasm/softhsm.js')
const CK = require('./constants.js')

module.exports = createSoftHSMModule
module.exports.createSoftHSMModule = createSoftHSMModule
module.exports.default = createSoftHSMModule // ESM dynamic import compat
module.exports.CK = CK
