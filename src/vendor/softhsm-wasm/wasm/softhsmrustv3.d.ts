/* tslint:disable */
/* eslint-disable */

export class SoftHsmRust {
  free(): void
  [Symbol.dispose](): void
  aes_ctr_decrypt(key_handle: number, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array
  aes_ctr_encrypt(key_handle: number, iv: Uint8Array, plaintext: Uint8Array): Uint8Array
  generate_aes_key(key_size: number): number
  init_token(slot_id: number, pin: string, label: string): boolean
  constructor()
}

export function _C_CloseSession(h_session: number): number

export function _C_CopyObject(
  _h_session: number,
  _h_object: number,
  _p_template: number,
  _ul_count: number,
  _ph_new_object: number
): number

export function _C_CreateObject(
  _h_session: number,
  p_template: number,
  count: number,
  ph_object: number
): number

export function _C_DecapsulateKey(
  _h_session: number,
  p_mechanism: number,
  h_private_key: number,
  _p_template: number,
  _ul_attribute_count: number,
  p_ciphertext: number,
  ul_ciphertext_len: number,
  ph_key: number
): number

export function _C_Decrypt(
  h_session: number,
  p_encrypted_data: number,
  ul_encrypted_data_len: number,
  p_data: number,
  pul_data_len: number
): number

export function _C_DecryptFinal(
  _h_session: number,
  _p_last_part: number,
  _pul_last_part_len: number
): number

export function _C_DecryptInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_DecryptUpdate(
  _h_session: number,
  _p_encrypted_part: number,
  _ul_encrypted_part_len: number,
  _p_part: number,
  _pul_part_len: number
): number

export function _C_DeriveKey(
  _h_session: number,
  p_mechanism: number,
  h_base_key: number,
  p_template: number,
  ul_attribute_count: number,
  ph_key: number
): number

export function _C_DestroyObject(_h_session: number, h_object: number): number

export function _C_Digest(
  h_session: number,
  p_data: number,
  ul_data_len: number,
  p_digest: number,
  pul_digest_len: number
): number

export function _C_DigestFinal(h_session: number, p_digest: number, pul_digest_len: number): number

export function _C_DigestInit(h_session: number, p_mechanism: number): number

export function _C_DigestKey(_h_session: number, _h_key: number): number

export function _C_DigestUpdate(h_session: number, p_part: number, ul_part_len: number): number

export function _C_EncapsulateKey(
  _h_session: number,
  p_mechanism: number,
  h_key: number,
  _p_template: number,
  _ul_attribute_count: number,
  p_ciphertext: number,
  pul_ciphertext_len: number,
  ph_key: number
): number

export function _C_Encrypt(
  h_session: number,
  p_data: number,
  ul_data_len: number,
  p_encrypted_data: number,
  pul_encrypted_data_len: number
): number

export function _C_EncryptFinal(
  _h_session: number,
  _p_last_encrypted_part: number,
  _pul_last_encrypted_part_len: number
): number

export function _C_EncryptInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_EncryptUpdate(
  _h_session: number,
  _p_part: number,
  _ul_part_len: number,
  _p_encrypted_part: number,
  _pul_encrypted_part_len: number
): number

export function _C_Finalize(_p_reserved: number): number

export function _C_FindObjects(
  h_session: number,
  ph_object: number,
  ul_max_object_count: number,
  pul_object_count: number
): number

export function _C_FindObjectsFinal(h_session: number): number

export function _C_FindObjectsInit(h_session: number, p_template: number, ul_count: number): number

export function _C_GenerateKey(
  _h_session: number,
  p_mechanism: number,
  p_template: number,
  ul_count: number,
  ph_key: number
): number

export function _C_GenerateKeyPair(
  _h_session: number,
  p_mechanism: number,
  p_public_key_template: number,
  ul_public_key_attribute_count: number,
  p_private_key_template: number,
  ul_private_key_attribute_count: number,
  ph_public_key: number,
  ph_private_key: number
): number

export function _C_GenerateRandom(
  _h_session: number,
  p_random_data: number,
  ul_random_len: number
): number

export function _C_GetAttributeValue(
  _h_session: number,
  h_object: number,
  p_template: number,
  count: number
): number

/**
 * CK_INFO: cryptokiVersion(2) + manufacturerID(32) + flags(4) + libraryDescription(32) + libraryVersion(2) = 72 bytes
 */
export function _C_GetInfo(p_info: number): number

export function _C_GetMechanismInfo(_slot_id: number, mech_type: number, p_info: number): number

export function _C_GetMechanismList(
  _slot_id: number,
  p_mechanism_list: number,
  pul_count: number
): number

export function _C_GetObjectSize(_h_session: number, _h_object: number, _pul_size: number): number

export function _C_GetOperationState(
  _h_session: number,
  _p_operation_state: number,
  _pul_operation_state_len: number
): number

export function _C_GetSessionInfo(h_session: number, p_info: number): number

/**
 * C_GetSlotInfo: returns basic slot info for slot 0.
 * CK_SLOT_INFO: slotDescription(64) + manufacturerID(32) + flags(4) + hardwareVersion(2) + firmwareVersion(2) = 104 bytes
 */
export function _C_GetSlotInfo(_slot_id: number, p_info: number): number

export function _C_GetSlotList(
  token_present: number,
  p_slot_list: number,
  pul_count: number
): number

export function _C_GetTokenInfo(_slot_id: number, p_info: number): number

export function _C_InitPIN(h_session: number, p_pin: number, ul_pin_len: number): number

export function _C_InitToken(
  slot_id: number,
  p_pin: number,
  ul_pin_len: number,
  p_label: number
): number

export function _C_Initialize(p_init_args: number): number

export function _C_Login(
  h_session: number,
  user_type: number,
  p_pin: number,
  ul_pin_len: number
): number

export function _C_Logout(h_session: number): number

export function _C_MessageSignFinal(
  h_session: number,
  _p_param: number,
  _ul_param_len: number,
  _p_signature: number,
  _pul_signature_len: number
): number

export function _C_MessageSignInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_MessageVerifyFinal(h_session: number): number

export function _C_MessageVerifyInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_OpenSession(
  slot_id: number,
  flags: number,
  _p_application: number,
  _notify: number,
  ph_session: number
): number

export function _C_SeedRandom(_h_session: number, _p_seed: number, _ul_seed_len: number): number

export function _C_SetAttributeValue(
  _h_session: number,
  _h_object: number,
  _p_template: number,
  _ul_count: number
): number

export function _C_SetOperationState(
  _h_session: number,
  _p_operation_state: number,
  _ul_operation_state_len: number,
  _h_encryption_key: number,
  _h_authentication_key: number
): number

export function _C_SetPIN(
  _h_session: number,
  _p_old_pin: number,
  _ul_old_len: number,
  _p_new_pin: number,
  _ul_new_len: number
): number

export function _C_Sign(
  h_session: number,
  p_data: number,
  ul_data_len: number,
  p_signature: number,
  pul_signature_len: number
): number

export function _C_SignFinal(
  _h_session: number,
  _p_signature: number,
  _pul_signature_len: number
): number

export function _C_SignInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_SignMessage(
  h_session: number,
  _p_param: number,
  _ul_param_len: number,
  p_data: number,
  ul_data_len: number,
  p_signature: number,
  pul_signature_len: number
): number

export function _C_SignUpdate(_h_session: number, _p_part: number, _ul_part_len: number): number

export function _C_UnwrapKey(
  _h_session: number,
  p_mechanism: number,
  h_unwrapping_key: number,
  p_wrapped_key: number,
  ul_wrapped_key_len: number,
  p_template: number,
  ul_attribute_count: number,
  ph_key: number
): number

export function _C_UnwrapKeyAuthenticated(
  _h_session: number,
  p_mechanism: number,
  h_unwrapping_key: number,
  p_wrapped_key: number,
  ul_wrapped_key_len: number,
  p_template: number,
  ul_attribute_count: number,
  _p_associated_data: number,
  _ul_associated_data_len: number,
  ph_key: number
): number

export function _C_Verify(
  h_session: number,
  p_data: number,
  ul_data_len: number,
  p_signature: number,
  ul_signature_len: number
): number

export function _C_VerifyFinal(
  _h_session: number,
  _p_signature: number,
  _ul_signature_len: number
): number

export function _C_VerifyInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_VerifyMessage(
  h_session: number,
  _p_param: number,
  _ul_param_len: number,
  p_data: number,
  ul_data_len: number,
  p_signature: number,
  ul_signature_len: number
): number

export function _C_VerifyUpdate(_h_session: number, _p_part: number, _ul_part_len: number): number

export function _C_WrapKey(
  _h_session: number,
  p_mechanism: number,
  h_wrapping_key: number,
  h_key: number,
  p_wrapped_key: number,
  pul_wrapped_key_len: number
): number

export function _C_WrapKeyAuthenticated(
  _h_session: number,
  p_mechanism: number,
  h_wrapping_key: number,
  h_key: number,
  _p_associated_data: number,
  _ul_associated_data_len: number,
  p_wrapped_key: number,
  pul_wrapped_key_len: number
): number

export function _free(ptr: number, _js_size: number): void

export function _malloc(size: number): number

export function _set_kat_seed(seed_ptr: number, seed_len: number): void

export function wasm_start(): void

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module

export interface InitOutput {
  readonly memory: WebAssembly.Memory
  readonly _C_CloseSession: (a: number) => number
  readonly _C_CopyObject: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_CreateObject: (a: number, b: number, c: number, d: number) => number
  readonly _C_DecapsulateKey: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number
  ) => number
  readonly _C_Decrypt: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_DecryptFinal: (a: number, b: number, c: number) => number
  readonly _C_DecryptInit: (a: number, b: number, c: number) => number
  readonly _C_DeriveKey: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ) => number
  readonly _C_DestroyObject: (a: number, b: number) => number
  readonly _C_Digest: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_DigestFinal: (a: number, b: number, c: number) => number
  readonly _C_DigestInit: (a: number, b: number) => number
  readonly _C_DigestKey: (a: number, b: number) => number
  readonly _C_DigestUpdate: (a: number, b: number, c: number) => number
  readonly _C_EncapsulateKey: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number
  ) => number
  readonly _C_Encrypt: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_EncryptInit: (a: number, b: number, c: number) => number
  readonly _C_Finalize: (a: number) => number
  readonly _C_FindObjects: (a: number, b: number, c: number, d: number) => number
  readonly _C_FindObjectsFinal: (a: number) => number
  readonly _C_FindObjectsInit: (a: number, b: number, c: number) => number
  readonly _C_GenerateKey: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_GenerateKeyPair: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number
  ) => number
  readonly _C_GenerateRandom: (a: number, b: number, c: number) => number
  readonly _C_GetAttributeValue: (a: number, b: number, c: number, d: number) => number
  readonly _C_GetInfo: (a: number) => number
  readonly _C_GetMechanismInfo: (a: number, b: number, c: number) => number
  readonly _C_GetSessionInfo: (a: number, b: number) => number
  readonly _C_GetSlotInfo: (a: number, b: number) => number
  readonly _C_GetSlotList: (a: number, b: number, c: number) => number
  readonly _C_GetTokenInfo: (a: number, b: number) => number
  readonly _C_InitPIN: (a: number, b: number, c: number) => number
  readonly _C_InitToken: (a: number, b: number, c: number, d: number) => number
  readonly _C_Initialize: (a: number) => number
  readonly _C_Login: (a: number, b: number, c: number, d: number) => number
  readonly _C_Logout: (a: number) => number
  readonly _C_MessageSignFinal: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_MessageSignInit: (a: number, b: number, c: number) => number
  readonly _C_MessageVerifyFinal: (a: number) => number
  readonly _C_MessageVerifyInit: (a: number, b: number, c: number) => number
  readonly _C_OpenSession: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_SetAttributeValue: (a: number, b: number, c: number, d: number) => number
  readonly _C_Sign: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_SignInit: (a: number, b: number, c: number) => number
  readonly _C_SignMessage: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number
  ) => number
  readonly _C_UnwrapKey: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number
  ) => number
  readonly _C_UnwrapKeyAuthenticated: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number
  ) => number
  readonly _C_Verify: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_VerifyInit: (a: number, b: number, c: number) => number
  readonly _C_VerifyMessage: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number
  ) => number
  readonly _C_WrapKey: (a: number, b: number, c: number, d: number, e: number, f: number) => number
  readonly _C_WrapKeyAuthenticated: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number
  ) => number
  readonly __wbg_softhsmrust_free: (a: number, b: number) => void
  readonly _set_kat_seed: (a: number, b: number) => void
  readonly softhsmrust_aes_ctr_decrypt: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ) => any
  readonly softhsmrust_aes_ctr_encrypt: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ) => any
  readonly softhsmrust_generate_aes_key: (a: number, b: number) => number
  readonly softhsmrust_init_token: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ) => number
  readonly softhsmrust_new: () => number
  readonly _C_DecryptUpdate: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_EncryptUpdate: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_SetOperationState: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_SetPIN: (a: number, b: number, c: number, d: number, e: number) => number
  readonly _C_EncryptFinal: (a: number, b: number, c: number) => number
  readonly _C_GetObjectSize: (a: number, b: number, c: number) => number
  readonly _C_GetOperationState: (a: number, b: number, c: number) => number
  readonly _C_SeedRandom: (a: number, b: number, c: number) => number
  readonly _C_SignFinal: (a: number, b: number, c: number) => number
  readonly _C_SignUpdate: (a: number, b: number, c: number) => number
  readonly _C_VerifyFinal: (a: number, b: number, c: number) => number
  readonly _C_VerifyUpdate: (a: number, b: number, c: number) => number
  readonly _free: (a: number, b: number) => void
  readonly _malloc: (a: number) => number
  readonly wasm_start: () => void
  readonly _C_GetMechanismList: (a: number, b: number, c: number) => number
  readonly __wbindgen_exn_store: (a: number) => void
  readonly __externref_table_alloc: () => number
  readonly __wbindgen_externrefs: WebAssembly.Table
  readonly __wbindgen_free: (a: number, b: number, c: number) => void
  readonly __wbindgen_malloc: (a: number, b: number) => number
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number
  readonly __wbindgen_start: () => void
}

export type SyncInitInput = BufferSource | WebAssembly.Module

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>
): Promise<InitOutput>
