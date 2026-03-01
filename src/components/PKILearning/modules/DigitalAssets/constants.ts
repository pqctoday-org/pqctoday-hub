// SPDX-License-Identifier: GPL-3.0-only
export const DIGITAL_ASSETS_CONSTANTS = {
  // Helper to generate dynamic filenames
  getFilenames: (prefix: string) => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14) // YYYYMMDDHHMMSS
    return {
      PRIVATE_KEY: `${prefix}_key_${timestamp}.key`,
      PUBLIC_KEY: `${prefix}_key_${timestamp}_pub.pem`,
    }
  },
  COMMANDS: {
    BITCOIN: {
      GEN_KEY: (outFile: string) =>
        `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:secp256k1 -pkeyopt ec_param_enc:named_curve -out ${outFile}`,
      EXTRACT_PUB: (inFile: string, outFile: string) =>
        `openssl pkey -in ${inFile} -pubout -out ${outFile}`,
      SIGN: (keyFile: string, inFile: string, outFile: string) =>
        `openssl pkeyutl -sign -inkey ${keyFile} -in ${inFile} -out ${outFile}`,
      VERIFY: (keyFile: string, inFile: string, sigFile: string) =>
        `openssl pkeyutl -verify -pubin -inkey ${keyFile} -in ${inFile} -sigfile ${sigFile}`,
    },
    ETHEREUM: {
      GEN_KEY: (outFile: string) =>
        `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:secp256k1 -pkeyopt ec_param_enc:named_curve -out ${outFile}`,
      EXTRACT_PUB: (inFile: string, outFile: string) =>
        `openssl pkey -in ${inFile} -pubout -out ${outFile}`,
    },
    SOLANA: {
      GEN_KEY: (outFile: string) => `openssl genpkey -algorithm Ed25519 -out ${outFile}`,
      EXTRACT_PUB: (inFile: string, outFile: string) =>
        `openssl pkey -in ${inFile} -pubout -out ${outFile}`,
      SIGN: (keyFile: string, inFile: string, outFile: string) =>
        `openssl pkeyutl -sign -inkey ${keyFile} -in ${inFile} -out ${outFile} -rawin`,
      VERIFY: (keyFile: string, inFile: string, sigFile: string) =>
        `openssl pkeyutl -verify -pubin -inkey ${keyFile} -in ${inFile} -sigfile ${sigFile} -rawin`,
    },
    ML_DSA_65: {
      GEN_KEY: (out: string) => `openssl genpkey -algorithm ML-DSA-65 -out ${out}`,
      EXTRACT_PUB: (priv: string, out: string) => `openssl pkey -in ${priv} -pubout -out ${out}`,
      SIGN: (key: string, msg: string, sig: string) =>
        `openssl pkeyutl -sign -inkey ${key} -in ${msg} -out ${sig}`,
      VERIFY: (pub: string, msg: string, sig: string) =>
        `openssl pkeyutl -verify -pubin -inkey ${pub} -in ${msg} -sigfile ${sig}`,
    },
    COMMON: {
      GEN_ENTROPY: 'openssl rand -hex 32',
    },
  },
  DERIVATION_PATHS: {
    BITCOIN: "m/44'/0'/0'/0/0",
    ETHEREUM: "m/44'/60'/0'/0/0",
    SOLANA: "m/44'/501'/0'/0'",
  },
}
