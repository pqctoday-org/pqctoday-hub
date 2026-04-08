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

export function _C_AsyncComplete(
  _h_session: number,
  _p_function_name: number,
  _p_result: number
): number

export function _C_AsyncGetID(_h_session: number, _p_function_name: number, _pul_id: number): number

export function _C_AsyncJoin(
  _h_session: number,
  _p_function_name: number,
  _ul_id: number,
  _p_data: number,
  _ul_data_len: number
): number

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

export function _C_DecryptMessage(
  h_session: number,
  p_parameter: number,
  _ul_parameter_len: number,
  p_associated_data: number,
  ul_associated_data_len: number,
  p_ciphertext: number,
  ul_ciphertext_len: number,
  p_plaintext: number,
  pul_plaintext_len: number
): number

export function _C_DecryptMessageBegin(
  h_session: number,
  p_parameter: number,
  _ul_parameter_len: number,
  p_associated_data: number,
  ul_associated_data_len: number
): number

export function _C_DecryptMessageNext(
  h_session: number,
  p_parameter: number,
  _ul_parameter_len: number,
  p_ciphertext_part: number,
  ul_ciphertext_part_len: number,
  p_plaintext_part: number,
  pul_plaintext_part_len: number,
  flags: number
): number

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

export function _C_EncryptMessage(
  h_session: number,
  p_parameter: number,
  _ul_parameter_len: number,
  p_associated_data: number,
  ul_associated_data_len: number,
  p_plaintext: number,
  ul_plaintext_len: number,
  p_ciphertext: number,
  pul_ciphertext_len: number
): number

export function _C_EncryptMessageBegin(
  h_session: number,
  p_parameter: number,
  _ul_parameter_len: number,
  p_associated_data: number,
  ul_associated_data_len: number
): number

export function _C_EncryptMessageNext(
  h_session: number,
  p_parameter: number,
  _ul_parameter_len: number,
  p_plaintext_part: number,
  ul_plaintext_part_len: number,
  p_ciphertext_part: number,
  pul_ciphertext_part_len: number,
  flags: number
): number

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

export function _C_GetSessionValidationFlags(
  _h_session: number,
  _type: number,
  _p_flags: number
): number

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

export function _C_MessageDecryptFinal(h_session: number): number

export function _C_MessageDecryptInit(h_session: number, p_mechanism: number, h_key: number): number

export function _C_MessageEncryptFinal(h_session: number): number

export function _C_MessageEncryptInit(h_session: number, p_mechanism: number, h_key: number): number

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

export function _C_VerifySignature(h_session: number, p_data: number, ul_data_len: number): number

export function _C_VerifySignatureFinal(h_session: number): number

export function _C_VerifySignatureInit(
  h_session: number,
  p_mechanism: number,
  h_key: number,
  p_signature: number,
  ul_signature_len: number
): number

export function _C_VerifySignatureUpdate(
  h_session: number,
  p_part: number,
  ul_part_len: number
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
