/* tslint:disable */
/* eslint-disable */

export class SoftHsmRust {
    free(): void;
    [Symbol.dispose](): void;
    aes_ctr_decrypt(key_handle: number, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array;
    aes_ctr_encrypt(key_handle: number, iv: Uint8Array, plaintext: Uint8Array): Uint8Array;
    generate_aes_key(key_size: number): number;
    init_token(slot_id: number, pin: string, label: string): boolean;
    constructor();
}

export function _C_AsyncComplete(_h_session: number, _p_function_name: number, _p_result: number): number;

export function _C_AsyncGetID(_h_session: number, _p_function_name: number, _pul_id: number): number;

export function _C_AsyncJoin(_h_session: number, _p_function_name: number, _ul_id: number, _p_data: number, _ul_data_len: number): number;

/**
 * §5.21 (legacy) — always CKR_FUNCTION_NOT_PARALLEL per spec.
 */
export function _C_CancelFunction(_h_session: number): number;

/**
 * PKCS#11 v3.2 §5.6 — close every session on the slot (op-state cleanup +
 * session-object destruction per C_CloseSession semantics).
 */
export function _C_CloseAllSessions(slot_id: number): number;

export function _C_CloseSession(h_session: number): number;

export function _C_CopyObject(_h_session: number, _h_object: number, _p_template: number, _ul_count: number, _ph_new_object: number): number;

export function _C_CreateObject(_h_session: number, p_template: number, count: number, ph_object: number): number;

export function _C_DecapsulateKey(_h_session: number, p_mechanism: number, h_private_key: number, _p_template: number, _ul_attribute_count: number, p_ciphertext: number, ul_ciphertext_len: number, ph_key: number): number;

export function _C_Decrypt(h_session: number, p_encrypted_data: number, ul_encrypted_data_len: number, p_data: number, pul_data_len: number): number;

export function _C_DecryptDigestUpdate(_h_session: number, _p_encrypted_part: number, _ul_encrypted_part_len: number, _p_part: number, _pul_part_len: number): number;

export function _C_DecryptFinal(h_session: number, p_last_part: number, pul_last_part_len: number): number;

export function _C_DecryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_DecryptMessage(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number, p_ciphertext: number, ul_ciphertext_len: number, p_plaintext: number, pul_plaintext_len: number): number;

export function _C_DecryptMessageBegin(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number): number;

export function _C_DecryptMessageNext(h_session: number, p_parameter: number, _ul_parameter_len: number, p_ciphertext_part: number, ul_ciphertext_part_len: number, p_plaintext_part: number, pul_plaintext_part_len: number, flags: number): number;

export function _C_DecryptUpdate(h_session: number, p_encrypted_part: number, ul_encrypted_part_len: number, p_part: number, pul_part_len: number): number;

export function _C_DecryptVerifyUpdate(_h_session: number, _p_encrypted_part: number, _ul_encrypted_part_len: number, _p_part: number, _pul_part_len: number): number;

export function _C_DeriveKey(_h_session: number, p_mechanism: number, h_base_key: number, p_template: number, ul_attribute_count: number, ph_key: number): number;

export function _C_DestroyObject(h_session: number, h_object: number): number;

export function _C_Digest(h_session: number, p_data: number, ul_data_len: number, p_digest: number, pul_digest_len: number): number;

export function _C_DigestEncryptUpdate(_h_session: number, _p_part: number, _ul_part_len: number, _p_encrypted_part: number, _pul_encrypted_part_len: number): number;

export function _C_DigestFinal(h_session: number, p_digest: number, pul_digest_len: number): number;

export function _C_DigestInit(h_session: number, p_mechanism: number): number;

export function _C_DigestKey(_h_session: number, _h_key: number): number;

export function _C_DigestUpdate(h_session: number, p_part: number, ul_part_len: number): number;

export function _C_EncapsulateKey(_h_session: number, p_mechanism: number, h_key: number, _p_template: number, _ul_attribute_count: number, p_ciphertext: number, pul_ciphertext_len: number, ph_key: number): number;

export function _C_Encrypt(h_session: number, p_data: number, ul_data_len: number, p_encrypted_data: number, pul_encrypted_data_len: number): number;

export function _C_EncryptFinal(h_session: number, p_last_encrypted_part: number, pul_last_encrypted_part_len: number): number;

export function _C_EncryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_EncryptMessage(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number, p_plaintext: number, ul_plaintext_len: number, p_ciphertext: number, pul_ciphertext_len: number): number;

export function _C_EncryptMessageBegin(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number): number;

export function _C_EncryptMessageNext(h_session: number, p_parameter: number, _ul_parameter_len: number, p_plaintext_part: number, ul_plaintext_part_len: number, p_ciphertext_part: number, pul_ciphertext_part_len: number, flags: number): number;

export function _C_EncryptUpdate(h_session: number, p_part: number, ul_part_len: number, p_encrypted_part: number, pul_encrypted_part_len: number): number;

export function _C_Finalize(p_reserved: number): number;

export function _C_FindObjects(h_session: number, ph_object: number, ul_max_object_count: number, pul_object_count: number): number;

export function _C_FindObjectsFinal(h_session: number): number;

export function _C_FindObjectsInit(h_session: number, p_template: number, ul_count: number): number;

export function _C_GenerateKey(_h_session: number, p_mechanism: number, p_template: number, ul_count: number, ph_key: number): number;

export function _C_GenerateKeyPair(_h_session: number, p_mechanism: number, p_public_key_template: number, ul_public_key_attribute_count: number, p_private_key_template: number, ul_private_key_attribute_count: number, ph_public_key: number, ph_private_key: number): number;

export function _C_GenerateRandom(_h_session: number, p_random_data: number, ul_random_len: number): number;

export function _C_GetAttributeValue(h_session: number, h_object: number, p_template: number, count: number): number;

/**
 * §5.21 (legacy) — always CKR_FUNCTION_NOT_PARALLEL per spec.
 */
export function _C_GetFunctionStatus(_h_session: number): number;

/**
 * CK_INFO: cryptokiVersion(2) + manufacturerID(32) + flags(4) + libraryDescription(32) + libraryVersion(2) = 72 bytes
 */
export function _C_GetInfo(p_info: number): number;

/**
 * §5.5 — C_GetInterface. NULL name/version match the default interface.
 */
export function _C_GetInterface(p_interface_name: number, p_version: number, pp_interface: number, _flags: number): number;

/**
 * C_GetSlotInfo: returns basic slot info for slot 0.
 * CK_SLOT_INFO: slotDescription(64) + manufacturerID(32) + flags(4) + hardwareVersion(2) + firmwareVersion(2) = 104 bytes
 * PKCS#11 v3.2 §5.5 — C_GetInterfaceList. Reports one interface,
 * "PKCS 11" version 3.2. wasm constraint: exported functions are not
 * addressable as C function pointers in linear memory, so pFunctionList
 * points to a CK_VERSION{3,2} header only; symbol binding happens in the
 * JS shim (each `_C_*` export), which is the function table for every
 * real consumer of this engine. CK_INTERFACE (wasm32, 12 B):
 * pInterfaceName, pFunctionList, flags.
 */
export function _C_GetInterfaceList(p_interfaces_list: number, pul_count: number): number;

export function _C_GetMechanismInfo(_slot_id: number, mech_type: number, p_info: number): number;

export function _C_GetMechanismList(_slot_id: number, p_mechanism_list: number, pul_count: number): number;

export function _C_GetObjectSize(_h_session: number, _h_object: number, _pul_size: number): number;

export function _C_GetOperationState(_h_session: number, _p_operation_state: number, _pul_operation_state_len: number): number;

export function _C_GetSessionInfo(h_session: number, p_info: number): number;

export function _C_GetSessionValidationFlags(_h_session: number, _type: number, _p_flags: number): number;

export function _C_GetSlotInfo(_slot_id: number, p_info: number): number;

export function _C_GetSlotList(token_present: number, p_slot_list: number, pul_count: number): number;

export function _C_GetTokenInfo(slot_id: number, p_info: number): number;

export function _C_InitPIN(h_session: number, p_pin: number, ul_pin_len: number): number;

export function _C_InitToken(slot_id: number, p_pin: number, ul_pin_len: number, p_label: number): number;

export function _C_Initialize(p_init_args: number): number;

export function _C_Login(h_session: number, user_type: number, p_pin: number, ul_pin_len: number): number;

/**
 * PKCS#11 v3.0+ §5.6 — C_Login with a username. This single-user token
 * accepts only an empty username (delegates to C_Login); anything else is
 * CKR_OPERATION_NOT_SUPPORTED... which v3.2 spells CKR_FUNCTION_NOT_SUPPORTED
 * for an unsupported variant.
 */
export function _C_LoginUser(h_session: number, user_type: number, p_pin: number, ul_pin_len: number, _p_username: number, ul_username_len: number): number;

export function _C_Logout(h_session: number): number;

export function _C_MessageDecryptFinal(h_session: number): number;

export function _C_MessageDecryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_MessageEncryptFinal(h_session: number): number;

export function _C_MessageEncryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_MessageSignFinal(h_session: number): number;

export function _C_MessageSignInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_MessageVerifyFinal(h_session: number): number;

export function _C_MessageVerifyInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_OpenSession(slot_id: number, flags: number, _p_application: number, _notify: number, ph_session: number): number;

export function _C_SeedRandom(_h_session: number, _p_seed: number, _ul_seed_len: number): number;

/**
 * PKCS#11 v3.0+ §5.6 — cancel active operations selected by `flags`
 * (CKF_ENCRYPT 0x100, CKF_DECRYPT 0x200, CKF_DIGEST 0x400, CKF_SIGN 0x800,
 * CKF_VERIFY 0x2000, CKF_FIND_OBJECTS 0x40, CKF_MESSAGE_ENCRYPT 0x2,
 * CKF_MESSAGE_DECRYPT 0x4, CKF_MESSAGE_SIGN 0x8, CKF_MESSAGE_VERIFY 0x10).
 * flags == 0 cancels nothing.
 */
export function _C_SessionCancel(h_session: number, flags: number): number;

export function _C_SetAttributeValue(_h_session: number, _h_object: number, _p_template: number, _ul_count: number): number;

export function _C_SetOperationState(_h_session: number, _p_operation_state: number, _ul_operation_state_len: number, _h_encryption_key: number, _h_authentication_key: number): number;

export function _C_SetPIN(_h_session: number, _p_old_pin: number, _ul_old_len: number, _p_new_pin: number, _ul_new_len: number): number;

export function _C_Sign(h_session: number, p_data: number, ul_data_len: number, p_signature: number, pul_signature_len: number): number;

export function _C_SignEncryptUpdate(_h_session: number, _p_part: number, _ul_part_len: number, _p_encrypted_part: number, _pul_encrypted_part_len: number): number;

export function _C_SignFinal(_h_session: number, _p_signature: number, _pul_signature_len: number): number;

export function _C_SignInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_SignMessage(h_session: number, _p_param: number, _ul_param_len: number, p_data: number, ul_data_len: number, p_signature: number, pul_signature_len: number): number;

/**
 * §5.14 — start one multipart message inside an active message-sign op.
 */
export function _C_SignMessageBegin(h_session: number, _p_param: number, _ul_param_len: number): number;

/**
 * §5.14 — feed a message part. `pulSignatureLen == NULL` marks a non-final
 * part; non-NULL marks the final part (then NULL `pSignature` is the §5.2
 * length query, which does not consume the accumulated message).
 */
export function _C_SignMessageNext(h_session: number, _p_param: number, _ul_param_len: number, p_part: number, ul_part_len: number, p_signature: number, pul_signature_len: number): number;

export function _C_SignRecover(_h_session: number, _p_data: number, _ul_data_len: number, _p_signature: number, _pul_signature_len: number): number;

export function _C_SignRecoverInit(_h_session: number, _p_mechanism: number, _h_key: number): number;

export function _C_SignUpdate(_h_session: number, _p_part: number, _ul_part_len: number): number;

export function _C_UnwrapKey(_h_session: number, p_mechanism: number, h_unwrapping_key: number, p_wrapped_key: number, ul_wrapped_key_len: number, p_template: number, ul_attribute_count: number, ph_key: number): number;

export function _C_UnwrapKeyAuthenticated(_h_session: number, p_mechanism: number, h_unwrapping_key: number, p_wrapped_key: number, ul_wrapped_key_len: number, p_template: number, ul_attribute_count: number, p_associated_data: number, ul_associated_data_len: number, ph_key: number): number;

export function _C_Verify(h_session: number, p_data: number, ul_data_len: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifyFinal(_h_session: number, _p_signature: number, _ul_signature_len: number): number;

export function _C_VerifyInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_VerifyMessage(h_session: number, _p_param: number, _ul_param_len: number, p_data: number, ul_data_len: number, p_signature: number, ul_signature_len: number): number;

/**
 * §5.15 — start one multipart message inside an active message-verify op.
 */
export function _C_VerifyMessageBegin(h_session: number, _p_param: number, _ul_param_len: number): number;

/**
 * §5.15 — feed a message part. NULL `pSignature` marks a non-final part;
 * non-NULL carries the signature and finalizes the message.
 */
export function _C_VerifyMessageNext(h_session: number, _p_param: number, _ul_param_len: number, p_part: number, ul_part_len: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifyRecover(_h_session: number, _p_signature: number, _ul_signature_len: number, _p_data: number, _pul_data_len: number): number;

export function _C_VerifyRecoverInit(_h_session: number, _p_mechanism: number, _h_key: number): number;

export function _C_VerifySignature(h_session: number, p_data: number, ul_data_len: number): number;

export function _C_VerifySignatureFinal(h_session: number): number;

export function _C_VerifySignatureInit(h_session: number, p_mechanism: number, h_key: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifySignatureUpdate(h_session: number, p_part: number, ul_part_len: number): number;

export function _C_VerifyUpdate(_h_session: number, _p_part: number, _ul_part_len: number): number;

/**
 * §5.5 — no slot events exist on this soft token. Non-blocking poll gets
 * CKR_NO_EVENT; a blocking wait would never return, so refuse it.
 */
export function _C_WaitForSlotEvent(flags: number, _p_slot: number, _p_reserved: number): number;

export function _C_WrapKey(_h_session: number, p_mechanism: number, h_wrapping_key: number, h_key: number, p_wrapped_key: number, pul_wrapped_key_len: number): number;

export function _C_WrapKeyAuthenticated(_h_session: number, p_mechanism: number, h_wrapping_key: number, h_key: number, p_associated_data: number, ul_associated_data_len: number, p_wrapped_key: number, pul_wrapped_key_len: number): number;

export function _free(ptr: number, _js_size: number): void;

export function _malloc(size: number): number;

export function _set_kat_seed(seed_ptr: number, seed_len: number): void;

export function wasm_start(): void;
