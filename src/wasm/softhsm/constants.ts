export const CKM_AES_KEY_WRAP = 0x00000100
export const CKM_SHA256 = 0x00000250
export const CKM_SHA256_RSA_PKCS = 0x00000040
export const CKF_FLAG_NAMES: [number, string][] = []
export const MECH_TABLE: Record<number, any> = {}

export interface AttrDef {
  type: number
  ulongVal?: number
  boolVal?: boolean
  bytesLen?: number
  bytesPtr?: number
}
export const RV_NAMES: Record<number, string> = {}
export const PKCS11_PARAMS: Record<string, number> = {}
export type MechanismFamily = 'pqc' | 'asymmetric' | 'symmetric' | 'hash' | 'kdf' | 'other'

export const CKM_ML_KEM_KEY_PAIR_GEN = 0
export const CKM_ML_DSA = 0
export const CKM_ML_DSA_KEY_PAIR_GEN = 0
export const CKP_SLH_DSA_SHA2_128S = 0
export const CKP_SLH_DSA_SHAKE_128S = 0
export const CKP_SLH_DSA_SHA2_128F = 0
export const CKP_SLH_DSA_SHAKE_128F = 0
export const CKP_SLH_DSA_SHA2_192S = 0
export const CKP_SLH_DSA_SHAKE_192S = 0
export const CKP_SLH_DSA_SHA2_192F = 0
export const CKP_SLH_DSA_SHAKE_192F = 0
export const CKP_SLH_DSA_SHA2_256S = 0
export const CKP_SLH_DSA_SHAKE_256S = 0
export const CKP_SLH_DSA_SHA2_256F = 0
export const CKP_SLH_DSA_SHAKE_256F = 0
export const CK_ATTRIBUTE_SIZE = 16
export const CKF_RW_SESSION = 0x40
export const CKF_SERIAL_SESSION = 0x80
export const CKU_SO = 0
export const CKU_USER = 1

export interface MechanismInfo {
  type: number
  typeHex: string
  name: string
  description: string
  ulMinKeySize: number
  ulMaxKeySize: number
  flags: number
  flagNames: string[]
  family: string
}

export const CKM_SHA256_HMAC = 0x00000251
export const CKM_SHA384_HMAC = 0x00000261
export const CKM_SHA512_HMAC = 0x00000271
export const CKM_SHA3_256_HMAC = 0x000002b1
export const CKM_SHA3_512_HMAC = 0x000002d1

export const CKO_SECRET_KEY = 4
export const CKA_CLASS = 0
export const CKA_KEY_TYPE = 256
export const CKA_TOKEN = 257
export const CKA_EXTRACTABLE = 354
export const CKA_VALUE_LEN = 353
export const CKK_AES = 31
