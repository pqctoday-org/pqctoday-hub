'use strict'

const createSoftHSMModule = require('./wasm/softhsm.js')
const CK = require('./constants.js')

module.exports = createSoftHSMModule
module.exports.createSoftHSMModule = createSoftHSMModule
module.exports.default = createSoftHSMModule // ESM dynamic import compat
module.exports.CK = CK
