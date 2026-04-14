export class SoftHsmRust {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SoftHsmRustFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_softhsmrust_free(ptr, 0);
    }
    /**
     * @param {number} key_handle
     * @param {Uint8Array} iv
     * @param {Uint8Array} ciphertext
     * @returns {Uint8Array}
     */
    aes_ctr_decrypt(key_handle, iv, ciphertext) {
        const ptr0 = passArray8ToWasm0(iv, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.softhsmrust_aes_ctr_decrypt(this.__wbg_ptr, key_handle, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {number} key_handle
     * @param {Uint8Array} iv
     * @param {Uint8Array} plaintext
     * @returns {Uint8Array}
     */
    aes_ctr_encrypt(key_handle, iv, plaintext) {
        const ptr0 = passArray8ToWasm0(iv, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(plaintext, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.softhsmrust_aes_ctr_encrypt(this.__wbg_ptr, key_handle, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {number} key_size
     * @returns {number}
     */
    generate_aes_key(key_size) {
        const ret = wasm.softhsmrust_generate_aes_key(this.__wbg_ptr, key_size);
        return ret >>> 0;
    }
    /**
     * @param {number} slot_id
     * @param {string} pin
     * @param {string} label
     * @returns {boolean}
     */
    init_token(slot_id, pin, label) {
        const ptr0 = passStringToWasm0(pin, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.softhsmrust_init_token(this.__wbg_ptr, slot_id, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.softhsmrust_new();
        this.__wbg_ptr = ret >>> 0;
        SoftHsmRustFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) SoftHsmRust.prototype[Symbol.dispose] = SoftHsmRust.prototype.free;

/**
 * @param {number} _h_session
 * @param {number} _p_function_name
 * @param {number} _p_result
 * @returns {number}
 */
export function _C_AsyncComplete(_h_session, _p_function_name, _p_result) {
    const ret = wasm._C_AsyncComplete(_h_session, _p_function_name, _p_result);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_function_name
 * @param {number} _pul_id
 * @returns {number}
 */
export function _C_AsyncGetID(_h_session, _p_function_name, _pul_id) {
    const ret = wasm._C_AsyncGetID(_h_session, _p_function_name, _pul_id);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_function_name
 * @param {number} _ul_id
 * @param {number} _p_data
 * @param {number} _ul_data_len
 * @returns {number}
 */
export function _C_AsyncJoin(_h_session, _p_function_name, _ul_id, _p_data, _ul_data_len) {
    const ret = wasm._C_AsyncJoin(_h_session, _p_function_name, _ul_id, _p_data, _ul_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_CloseSession(h_session) {
    const ret = wasm._C_CloseSession(h_session);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _h_object
 * @param {number} _p_template
 * @param {number} _ul_count
 * @param {number} _ph_new_object
 * @returns {number}
 */
export function _C_CopyObject(_h_session, _h_object, _p_template, _ul_count, _ph_new_object) {
    const ret = wasm._C_CopyObject(_h_session, _h_object, _p_template, _ul_count, _ph_new_object);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_template
 * @param {number} count
 * @param {number} ph_object
 * @returns {number}
 */
export function _C_CreateObject(_h_session, p_template, count, ph_object) {
    const ret = wasm._C_CreateObject(_h_session, p_template, count, ph_object);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_private_key
 * @param {number} _p_template
 * @param {number} _ul_attribute_count
 * @param {number} p_ciphertext
 * @param {number} ul_ciphertext_len
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_DecapsulateKey(_h_session, p_mechanism, h_private_key, _p_template, _ul_attribute_count, p_ciphertext, ul_ciphertext_len, ph_key) {
    const ret = wasm._C_DecapsulateKey(_h_session, p_mechanism, h_private_key, _p_template, _ul_attribute_count, p_ciphertext, ul_ciphertext_len, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_encrypted_data
 * @param {number} ul_encrypted_data_len
 * @param {number} p_data
 * @param {number} pul_data_len
 * @returns {number}
 */
export function _C_Decrypt(h_session, p_encrypted_data, ul_encrypted_data_len, p_data, pul_data_len) {
    const ret = wasm._C_Decrypt(h_session, p_encrypted_data, ul_encrypted_data_len, p_data, pul_data_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_last_part
 * @param {number} _pul_last_part_len
 * @returns {number}
 */
export function _C_DecryptFinal(_h_session, _p_last_part, _pul_last_part_len) {
    const ret = wasm._C_DecryptFinal(_h_session, _p_last_part, _pul_last_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_DecryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_DecryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @param {number} p_ciphertext
 * @param {number} ul_ciphertext_len
 * @param {number} p_plaintext
 * @param {number} pul_plaintext_len
 * @returns {number}
 */
export function _C_DecryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_ciphertext, ul_ciphertext_len, p_plaintext, pul_plaintext_len) {
    const ret = wasm._C_DecryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_ciphertext, ul_ciphertext_len, p_plaintext, pul_plaintext_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @returns {number}
 */
export function _C_DecryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len) {
    const ret = wasm._C_DecryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_ciphertext_part
 * @param {number} ul_ciphertext_part_len
 * @param {number} p_plaintext_part
 * @param {number} pul_plaintext_part_len
 * @param {number} flags
 * @returns {number}
 */
export function _C_DecryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_ciphertext_part, ul_ciphertext_part_len, p_plaintext_part, pul_plaintext_part_len, flags) {
    const ret = wasm._C_DecryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_ciphertext_part, ul_ciphertext_part_len, p_plaintext_part, pul_plaintext_part_len, flags);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_encrypted_part
 * @param {number} _ul_encrypted_part_len
 * @param {number} _p_part
 * @param {number} _pul_part_len
 * @returns {number}
 */
export function _C_DecryptUpdate(_h_session, _p_encrypted_part, _ul_encrypted_part_len, _p_part, _pul_part_len) {
    const ret = wasm._C_DecryptUpdate(_h_session, _p_encrypted_part, _ul_encrypted_part_len, _p_part, _pul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_base_key
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_DeriveKey(_h_session, p_mechanism, h_base_key, p_template, ul_attribute_count, ph_key) {
    const ret = wasm._C_DeriveKey(_h_session, p_mechanism, h_base_key, p_template, ul_attribute_count, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} h_object
 * @returns {number}
 */
export function _C_DestroyObject(_h_session, h_object) {
    const ret = wasm._C_DestroyObject(_h_session, h_object);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_digest
 * @param {number} pul_digest_len
 * @returns {number}
 */
export function _C_Digest(h_session, p_data, ul_data_len, p_digest, pul_digest_len) {
    const ret = wasm._C_Digest(h_session, p_data, ul_data_len, p_digest, pul_digest_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_digest
 * @param {number} pul_digest_len
 * @returns {number}
 */
export function _C_DigestFinal(h_session, p_digest, pul_digest_len) {
    const ret = wasm._C_DigestFinal(h_session, p_digest, pul_digest_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @returns {number}
 */
export function _C_DigestInit(h_session, p_mechanism) {
    const ret = wasm._C_DigestInit(h_session, p_mechanism);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _h_key
 * @returns {number}
 */
export function _C_DigestKey(_h_session, _h_key) {
    const ret = wasm._C_DigestKey(_h_session, _h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @returns {number}
 */
export function _C_DigestUpdate(h_session, p_part, ul_part_len) {
    const ret = wasm._C_DigestUpdate(h_session, p_part, ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @param {number} _p_template
 * @param {number} _ul_attribute_count
 * @param {number} p_ciphertext
 * @param {number} pul_ciphertext_len
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_EncapsulateKey(_h_session, p_mechanism, h_key, _p_template, _ul_attribute_count, p_ciphertext, pul_ciphertext_len, ph_key) {
    const ret = wasm._C_EncapsulateKey(_h_session, p_mechanism, h_key, _p_template, _ul_attribute_count, p_ciphertext, pul_ciphertext_len, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_encrypted_data
 * @param {number} pul_encrypted_data_len
 * @returns {number}
 */
export function _C_Encrypt(h_session, p_data, ul_data_len, p_encrypted_data, pul_encrypted_data_len) {
    const ret = wasm._C_Encrypt(h_session, p_data, ul_data_len, p_encrypted_data, pul_encrypted_data_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_last_encrypted_part
 * @param {number} _pul_last_encrypted_part_len
 * @returns {number}
 */
export function _C_EncryptFinal(_h_session, _p_last_encrypted_part, _pul_last_encrypted_part_len) {
    const ret = wasm._C_EncryptFinal(_h_session, _p_last_encrypted_part, _pul_last_encrypted_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_EncryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_EncryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @param {number} p_plaintext
 * @param {number} ul_plaintext_len
 * @param {number} p_ciphertext
 * @param {number} pul_ciphertext_len
 * @returns {number}
 */
export function _C_EncryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_plaintext, ul_plaintext_len, p_ciphertext, pul_ciphertext_len) {
    const ret = wasm._C_EncryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_plaintext, ul_plaintext_len, p_ciphertext, pul_ciphertext_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @returns {number}
 */
export function _C_EncryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len) {
    const ret = wasm._C_EncryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_plaintext_part
 * @param {number} ul_plaintext_part_len
 * @param {number} p_ciphertext_part
 * @param {number} pul_ciphertext_part_len
 * @param {number} flags
 * @returns {number}
 */
export function _C_EncryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_plaintext_part, ul_plaintext_part_len, p_ciphertext_part, pul_ciphertext_part_len, flags) {
    const ret = wasm._C_EncryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_plaintext_part, ul_plaintext_part_len, p_ciphertext_part, pul_ciphertext_part_len, flags);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_part
 * @param {number} _ul_part_len
 * @param {number} _p_encrypted_part
 * @param {number} _pul_encrypted_part_len
 * @returns {number}
 */
export function _C_EncryptUpdate(_h_session, _p_part, _ul_part_len, _p_encrypted_part, _pul_encrypted_part_len) {
    const ret = wasm._C_EncryptUpdate(_h_session, _p_part, _ul_part_len, _p_encrypted_part, _pul_encrypted_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _p_reserved
 * @returns {number}
 */
export function _C_Finalize(_p_reserved) {
    const ret = wasm._C_Finalize(_p_reserved);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} ph_object
 * @param {number} ul_max_object_count
 * @param {number} pul_object_count
 * @returns {number}
 */
export function _C_FindObjects(h_session, ph_object, ul_max_object_count, pul_object_count) {
    const ret = wasm._C_FindObjects(h_session, ph_object, ul_max_object_count, pul_object_count);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_FindObjectsFinal(h_session) {
    const ret = wasm._C_FindObjectsFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_template
 * @param {number} ul_count
 * @returns {number}
 */
export function _C_FindObjectsInit(h_session, p_template, ul_count) {
    const ret = wasm._C_FindObjectsInit(h_session, p_template, ul_count);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} p_template
 * @param {number} ul_count
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_GenerateKey(_h_session, p_mechanism, p_template, ul_count, ph_key) {
    const ret = wasm._C_GenerateKey(_h_session, p_mechanism, p_template, ul_count, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} p_public_key_template
 * @param {number} ul_public_key_attribute_count
 * @param {number} p_private_key_template
 * @param {number} ul_private_key_attribute_count
 * @param {number} ph_public_key
 * @param {number} ph_private_key
 * @returns {number}
 */
export function _C_GenerateKeyPair(_h_session, p_mechanism, p_public_key_template, ul_public_key_attribute_count, p_private_key_template, ul_private_key_attribute_count, ph_public_key, ph_private_key) {
    const ret = wasm._C_GenerateKeyPair(_h_session, p_mechanism, p_public_key_template, ul_public_key_attribute_count, p_private_key_template, ul_private_key_attribute_count, ph_public_key, ph_private_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_random_data
 * @param {number} ul_random_len
 * @returns {number}
 */
export function _C_GenerateRandom(_h_session, p_random_data, ul_random_len) {
    const ret = wasm._C_GenerateRandom(_h_session, p_random_data, ul_random_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} h_object
 * @param {number} p_template
 * @param {number} count
 * @returns {number}
 */
export function _C_GetAttributeValue(_h_session, h_object, p_template, count) {
    const ret = wasm._C_GetAttributeValue(_h_session, h_object, p_template, count);
    return ret >>> 0;
}

/**
 * CK_INFO: cryptokiVersion(2) + manufacturerID(32) + flags(4) + libraryDescription(32) + libraryVersion(2) = 72 bytes
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetInfo(p_info) {
    const ret = wasm._C_GetInfo(p_info);
    return ret >>> 0;
}

/**
 * @param {number} _slot_id
 * @param {number} mech_type
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetMechanismInfo(_slot_id, mech_type, p_info) {
    const ret = wasm._C_GetMechanismInfo(_slot_id, mech_type, p_info);
    return ret >>> 0;
}

/**
 * @param {number} _slot_id
 * @param {number} p_mechanism_list
 * @param {number} pul_count
 * @returns {number}
 */
export function _C_GetMechanismList(_slot_id, p_mechanism_list, pul_count) {
    const ret = wasm._C_GetMechanismList(_slot_id, p_mechanism_list, pul_count);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _h_object
 * @param {number} _pul_size
 * @returns {number}
 */
export function _C_GetObjectSize(_h_session, _h_object, _pul_size) {
    const ret = wasm._C_GetObjectSize(_h_session, _h_object, _pul_size);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_operation_state
 * @param {number} _pul_operation_state_len
 * @returns {number}
 */
export function _C_GetOperationState(_h_session, _p_operation_state, _pul_operation_state_len) {
    const ret = wasm._C_GetOperationState(_h_session, _p_operation_state, _pul_operation_state_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetSessionInfo(h_session, p_info) {
    const ret = wasm._C_GetSessionInfo(h_session, p_info);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _type
 * @param {number} _p_flags
 * @returns {number}
 */
export function _C_GetSessionValidationFlags(_h_session, _type, _p_flags) {
    const ret = wasm._C_GetSessionValidationFlags(_h_session, _type, _p_flags);
    return ret >>> 0;
}

/**
 * C_GetSlotInfo: returns basic slot info for slot 0.
 * CK_SLOT_INFO: slotDescription(64) + manufacturerID(32) + flags(4) + hardwareVersion(2) + firmwareVersion(2) = 104 bytes
 * @param {number} _slot_id
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetSlotInfo(_slot_id, p_info) {
    const ret = wasm._C_GetSlotInfo(_slot_id, p_info);
    return ret >>> 0;
}

/**
 * @param {number} token_present
 * @param {number} p_slot_list
 * @param {number} pul_count
 * @returns {number}
 */
export function _C_GetSlotList(token_present, p_slot_list, pul_count) {
    const ret = wasm._C_GetSlotList(token_present, p_slot_list, pul_count);
    return ret >>> 0;
}

/**
 * @param {number} _slot_id
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetTokenInfo(_slot_id, p_info) {
    const ret = wasm._C_GetTokenInfo(_slot_id, p_info);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @returns {number}
 */
export function _C_InitPIN(h_session, p_pin, ul_pin_len) {
    const ret = wasm._C_InitPIN(h_session, p_pin, ul_pin_len);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @param {number} p_label
 * @returns {number}
 */
export function _C_InitToken(slot_id, p_pin, ul_pin_len, p_label) {
    const ret = wasm._C_InitToken(slot_id, p_pin, ul_pin_len, p_label);
    return ret >>> 0;
}

/**
 * @param {number} p_init_args
 * @returns {number}
 */
export function _C_Initialize(p_init_args) {
    const ret = wasm._C_Initialize(p_init_args);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} user_type
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @returns {number}
 */
export function _C_Login(h_session, user_type, p_pin, ul_pin_len) {
    const ret = wasm._C_Login(h_session, user_type, p_pin, ul_pin_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_Logout(h_session) {
    const ret = wasm._C_Logout(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageDecryptFinal(h_session) {
    const ret = wasm._C_MessageDecryptFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageDecryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageDecryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageEncryptFinal(h_session) {
    const ret = wasm._C_MessageEncryptFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageEncryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageEncryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} _p_signature
 * @param {number} _pul_signature_len
 * @returns {number}
 */
export function _C_MessageSignFinal(h_session, _p_param, _ul_param_len, _p_signature, _pul_signature_len) {
    const ret = wasm._C_MessageSignFinal(h_session, _p_param, _ul_param_len, _p_signature, _pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageSignInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageSignInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageVerifyFinal(h_session) {
    const ret = wasm._C_MessageVerifyFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageVerifyInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageVerifyInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} flags
 * @param {number} _p_application
 * @param {number} _notify
 * @param {number} ph_session
 * @returns {number}
 */
export function _C_OpenSession(slot_id, flags, _p_application, _notify, ph_session) {
    const ret = wasm._C_OpenSession(slot_id, flags, _p_application, _notify, ph_session);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_seed
 * @param {number} _ul_seed_len
 * @returns {number}
 */
export function _C_SeedRandom(_h_session, _p_seed, _ul_seed_len) {
    const ret = wasm._C_SeedRandom(_h_session, _p_seed, _ul_seed_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _h_object
 * @param {number} _p_template
 * @param {number} _ul_count
 * @returns {number}
 */
export function _C_SetAttributeValue(_h_session, _h_object, _p_template, _ul_count) {
    const ret = wasm._C_SetAttributeValue(_h_session, _h_object, _p_template, _ul_count);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_operation_state
 * @param {number} _ul_operation_state_len
 * @param {number} _h_encryption_key
 * @param {number} _h_authentication_key
 * @returns {number}
 */
export function _C_SetOperationState(_h_session, _p_operation_state, _ul_operation_state_len, _h_encryption_key, _h_authentication_key) {
    const ret = wasm._C_SetOperationState(_h_session, _p_operation_state, _ul_operation_state_len, _h_encryption_key, _h_authentication_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_old_pin
 * @param {number} _ul_old_len
 * @param {number} _p_new_pin
 * @param {number} _ul_new_len
 * @returns {number}
 */
export function _C_SetPIN(_h_session, _p_old_pin, _ul_old_len, _p_new_pin, _ul_new_len) {
    const ret = wasm._C_SetPIN(_h_session, _p_old_pin, _ul_old_len, _p_new_pin, _ul_new_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_Sign(h_session, p_data, ul_data_len, p_signature, pul_signature_len) {
    const ret = wasm._C_Sign(h_session, p_data, ul_data_len, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_signature
 * @param {number} _pul_signature_len
 * @returns {number}
 */
export function _C_SignFinal(_h_session, _p_signature, _pul_signature_len) {
    const ret = wasm._C_SignFinal(_h_session, _p_signature, _pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_SignInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_SignInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_SignMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, pul_signature_len) {
    const ret = wasm._C_SignMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_part
 * @param {number} _ul_part_len
 * @returns {number}
 */
export function _C_SignUpdate(_h_session, _p_part, _ul_part_len) {
    const ret = wasm._C_SignUpdate(_h_session, _p_part, _ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_unwrapping_key
 * @param {number} p_wrapped_key
 * @param {number} ul_wrapped_key_len
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_UnwrapKey(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, ph_key) {
    const ret = wasm._C_UnwrapKey(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_unwrapping_key
 * @param {number} p_wrapped_key
 * @param {number} ul_wrapped_key_len
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} _p_associated_data
 * @param {number} _ul_associated_data_len
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_UnwrapKeyAuthenticated(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, _p_associated_data, _ul_associated_data_len, ph_key) {
    const ret = wasm._C_UnwrapKeyAuthenticated(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, _p_associated_data, _ul_associated_data_len, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_Verify(h_session, p_data, ul_data_len, p_signature, ul_signature_len) {
    const ret = wasm._C_Verify(h_session, p_data, ul_data_len, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_signature
 * @param {number} _ul_signature_len
 * @returns {number}
 */
export function _C_VerifyFinal(_h_session, _p_signature, _ul_signature_len) {
    const ret = wasm._C_VerifyFinal(_h_session, _p_signature, _ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_VerifyInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_VerifyInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_VerifyMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, ul_signature_len) {
    const ret = wasm._C_VerifyMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @returns {number}
 */
export function _C_VerifySignature(h_session, p_data, ul_data_len) {
    const ret = wasm._C_VerifySignature(h_session, p_data, ul_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_VerifySignatureFinal(h_session) {
    const ret = wasm._C_VerifySignatureFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_VerifySignatureInit(h_session, p_mechanism, h_key, p_signature, ul_signature_len) {
    const ret = wasm._C_VerifySignatureInit(h_session, p_mechanism, h_key, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @returns {number}
 */
export function _C_VerifySignatureUpdate(h_session, p_part, ul_part_len) {
    const ret = wasm._C_VerifySignatureUpdate(h_session, p_part, ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_part
 * @param {number} _ul_part_len
 * @returns {number}
 */
export function _C_VerifyUpdate(_h_session, _p_part, _ul_part_len) {
    const ret = wasm._C_VerifyUpdate(_h_session, _p_part, _ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_wrapping_key
 * @param {number} h_key
 * @param {number} p_wrapped_key
 * @param {number} pul_wrapped_key_len
 * @returns {number}
 */
export function _C_WrapKey(_h_session, p_mechanism, h_wrapping_key, h_key, p_wrapped_key, pul_wrapped_key_len) {
    const ret = wasm._C_WrapKey(_h_session, p_mechanism, h_wrapping_key, h_key, p_wrapped_key, pul_wrapped_key_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_wrapping_key
 * @param {number} h_key
 * @param {number} _p_associated_data
 * @param {number} _ul_associated_data_len
 * @param {number} p_wrapped_key
 * @param {number} pul_wrapped_key_len
 * @returns {number}
 */
export function _C_WrapKeyAuthenticated(_h_session, p_mechanism, h_wrapping_key, h_key, _p_associated_data, _ul_associated_data_len, p_wrapped_key, pul_wrapped_key_len) {
    const ret = wasm._C_WrapKeyAuthenticated(_h_session, p_mechanism, h_wrapping_key, h_key, _p_associated_data, _ul_associated_data_len, p_wrapped_key, pul_wrapped_key_len);
    return ret >>> 0;
}

/**
 * @param {number} ptr
 * @param {number} _js_size
 */
export function _free(ptr, _js_size) {
    wasm._free(ptr, _js_size);
}

/**
 * @param {number} size
 * @returns {number}
 */
export function _malloc(size) {
    const ret = wasm._malloc(size);
    return ret >>> 0;
}

/**
 * @param {number} seed_ptr
 * @param {number} seed_len
 */
export function _set_kat_seed(seed_ptr, seed_len) {
    wasm._set_kat_seed(seed_ptr, seed_len);
}

export function wasm_start() {
    wasm.wasm_start();
}
export function __wbg___wbindgen_is_function_49868bde5eb1e745(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
}
export function __wbg___wbindgen_is_object_40c5a80572e8f9d3(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
}
export function __wbg___wbindgen_is_string_b29b5c5a8065ba1a(arg0) {
    const ret = typeof(arg0) === 'string';
    return ret;
}
export function __wbg___wbindgen_is_undefined_c0cca72b82b86f4d(arg0) {
    const ret = arg0 === undefined;
    return ret;
}
export function __wbg___wbindgen_throw_81fc77679af83bc6(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbg_call_d578befcc3145dee() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments); }
export function __wbg_crypto_38df2bab126b63dc(arg0) {
    const ret = arg0.crypto;
    return ret;
}
export function __wbg_error_a6fa202b58aa1cd3(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
}
export function __wbg_getRandomValues_c44a50d8cfdaebeb() { return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
}, arguments); }
export function __wbg_length_0c32cb8543c8e4c8(arg0) {
    const ret = arg0.length;
    return ret;
}
export function __wbg_msCrypto_bd5a034af96bcba6(arg0) {
    const ret = arg0.msCrypto;
    return ret;
}
export function __wbg_new_227d7c05414eb861() {
    const ret = new Error();
    return ret;
}
export function __wbg_new_from_slice_2580ff33d0d10520(arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
    return ret;
}
export function __wbg_new_with_length_9cedd08484b73942(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return ret;
}
export function __wbg_node_84ea875411254db1(arg0) {
    const ret = arg0.node;
    return ret;
}
export function __wbg_process_44c7a14e11e9f69e(arg0) {
    const ret = arg0.process;
    return ret;
}
export function __wbg_prototypesetcall_3e05eb9545565046(arg0, arg1, arg2) {
    Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
}
export function __wbg_randomFillSync_6c25eac9869eb53c() { return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
}, arguments); }
export function __wbg_require_b4edbdcf3e2a1ef0() { return handleError(function () {
    const ret = module.require;
    return ret;
}, arguments); }
export function __wbg_stack_3b0d974bbf31e44f(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
export function __wbg_static_accessor_GLOBAL_THIS_a1248013d790bf5f() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_GLOBAL_f2e0f995a21329ff() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_SELF_24f78b6d23f286ea() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_WINDOW_59fd959c540fe405() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_subarray_0f98d3fb634508ad(arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
    return ret;
}
export function __wbg_versions_276b2795b1c6a219(arg0) {
    const ret = arg0.versions;
    return ret;
}
export function __wbindgen_cast_0000000000000001(arg0, arg1) {
    // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
    const ret = getArrayU8FromWasm0(arg0, arg1);
    return ret;
}
export function __wbindgen_cast_0000000000000002(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
}
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
}
const SoftHsmRustFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_softhsmrust_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
