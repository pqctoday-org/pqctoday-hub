// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pinned registry of the ACVP {algorithm, mode, revision} triples this
 * prototype accepts (F-1). A triple not listed here is rejected — there is no
 * "closest revision" fallback. Each entry names the exact usnistgov/ACVP
 * commit + sections its prompt/response schemas were transcribed from.
 */
import mlKemPrompt from './ml-kem-encapdecap-fips203.prompt.schema.json'
import mlKemResponse from './ml-kem-encapdecap-fips203.response.schema.json'
import mlDsaPrompt from './ml-dsa-sigver-fips204.prompt.schema.json'
import mlDsaResponse from './ml-dsa-sigver-fips204.response.schema.json'
import type { SupportedSchemaId } from '../ir'

export interface PinnedSpecSource {
  repository: string
  commit: string
  document: string
  sections: string[]
}

export interface PinnedVectorSetSchema {
  id: SupportedSchemaId
  algorithm: string
  mode: string
  revision: string
  promptSchema: Record<string, unknown>
  responseSchema: Record<string, unknown>
  promptSchemaFile: string
  responseSchemaFile: string
  specSource: PinnedSpecSource
}

export const PINNED_SCHEMAS: readonly PinnedVectorSetSchema[] = [
  {
    id: 'ML-KEM/encapDecap/FIPS203',
    algorithm: 'ML-KEM',
    mode: 'encapDecap',
    revision: 'FIPS203',
    promptSchema: mlKemPrompt as Record<string, unknown>,
    responseSchema: mlKemResponse as Record<string, unknown>,
    promptSchemaFile: 'src/services/acvp/schemas/ml-kem-encapdecap-fips203.prompt.schema.json',
    responseSchemaFile: 'src/services/acvp/schemas/ml-kem-encapdecap-fips203.response.schema.json',
    specSource: {
      repository: 'https://github.com/usnistgov/ACVP',
      commit: 'bccef3648f6c05b224a051188ffe66f447cfdb6d',
      document: 'draft-celi-acvp-ml-kem (src/draft-celi-acvp-ml-kem.adoc)',
      sections: [
        'src/ml-kem/sections/04-testtypes.adoc — Test Types (encapDecap AFT/VAL)',
        'src/ml-kem/sections/06-test-vectors.adoc — Top Level Test Vector JSON Elements',
        'src/ml-kem/sections/06-ml-kem-encapdecap-test-vectors.adoc — [[ML-KEM_encapDecap_vs_tg_table]], [[ML-KEM_encapDecap_vs_tc_table]]',
        'src/ml-kem/sections/07-responses.adoc — [[response_table]], [[response_group_table]]',
        'src/ml-kem/sections/07-ml-kem-encapdecap-responses.adoc — [[ML-KEM_encapDecap_vs_tr_table]]',
      ],
    },
  },
  {
    id: 'ML-DSA/sigVer/FIPS204',
    algorithm: 'ML-DSA',
    mode: 'sigVer',
    revision: 'FIPS204',
    promptSchema: mlDsaPrompt as Record<string, unknown>,
    responseSchema: mlDsaResponse as Record<string, unknown>,
    promptSchemaFile: 'src/services/acvp/schemas/ml-dsa-sigver-fips204.prompt.schema.json',
    responseSchemaFile: 'src/services/acvp/schemas/ml-dsa-sigver-fips204.response.schema.json',
    specSource: {
      repository: 'https://github.com/usnistgov/ACVP',
      commit: '892fd14710f3a7edbea230d0aecc5511e0257f8e',
      document: 'draft-celi-acvp-ml-dsa (src/draft-celi-acvp-ml-dsa.adoc)',
      sections: [
        'src/ml-dsa/sections/04-testtypes.adoc — ML-DSA SigVer Test Types (AFT)',
        'src/ml-dsa/sections/05-ml-dsa-sigver-capabilities.adoc — hashAlgs vocabulary',
        'src/ml-dsa/sections/06-ml-dsa-sigver-test-vectors.adoc — [[ML-DSA_sigVer_vs_tg_table]], [[ML-DSA_sigVer_vs_tc_table]]',
        'src/ml-dsa/sections/07-responses.adoc — Response JSON Object',
        'src/ml-dsa/sections/07-ml-dsa-sigver-responses.adoc — [[ML-DSA_sigVer_vs_tr_table]]',
      ],
    },
  },
]

export const findPinnedSchema = (id: SupportedSchemaId): PinnedVectorSetSchema => {
  const s = PINNED_SCHEMAS.find((p) => p.id === id)
  if (!s) throw new Error(`no pinned schema ${id}`)
  return s
}
