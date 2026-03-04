export interface EmscriptenFS {
  mkdir(path: string): void
  writeFile(path: string, data: string | Uint8Array, opts?: object): void
  readFile(path: string, opts?: object): Uint8Array
  mount(type: object, opts: object, mountpoint: string): object
  unmount(mountpoint: string): void
}

export interface SoftHSMModule {
  // Emscripten runtime
  HEAPU8: Uint8Array
  HEAP32: Int32Array
  FS: EmscriptenFS
  _malloc(size: number): number
  _free(ptr: number): void
  getValue(ptr: number, type: string): number
  setValue(ptr: number, value: number, type: string): void
  UTF8ToString(ptr: number, maxBytesToRead?: number): string
  stringToUTF8(str: string, outPtr: number, maxBytesToWrite: number): number
  lengthBytesUTF8(str: string): number

  // PKCS#11 v2/v3/v3.2 — all return CK_RV as number
  _C_Initialize(pInitArgs: number): number
  _C_Finalize(pReserved: number): number
  _C_GetInfo(pInfo: number): number
  _C_GetFunctionList(ppFunctionList: number): number
  _C_GetSlotList(tokenPresent: number, pSlotList: number, pulCount: number): number
  _C_GetSlotInfo(slotID: number, pInfo: number): number
  _C_GetTokenInfo(slotID: number, pInfo: number): number
  _C_GetMechanismList(slotID: number, pMechanismList: number, pulCount: number): number
  _C_GetMechanismInfo(slotID: number, type: number, pInfo: number): number
  _C_InitToken(slotID: number, pPin: number, ulPinLen: number, pLabel: number): number
  _C_InitPIN(hSession: number, pPin: number, ulPinLen: number): number
  _C_SetPIN(
    hSession: number,
    pOldPin: number,
    ulOldLen: number,
    pNewPin: number,
    ulNewLen: number
  ): number
  _C_OpenSession(
    slotID: number,
    flags: number,
    pApp: number,
    Notify: number,
    phSession: number
  ): number
  _C_CloseSession(hSession: number): number
  _C_CloseAllSessions(slotID: number): number
  _C_GetSessionInfo(hSession: number, pInfo: number): number
  _C_GetOperationState(hSession: number, pState: number, pulStateLen: number): number
  _C_SetOperationState(
    hSession: number,
    pState: number,
    ulStateLen: number,
    hEncKey: number,
    hAuthKey: number
  ): number
  _C_Login(hSession: number, userType: number, pPin: number, ulPinLen: number): number
  _C_Logout(hSession: number): number
  _C_CreateObject(hSession: number, pTemplate: number, ulCount: number, phObject: number): number
  _C_CopyObject(
    hSession: number,
    hObject: number,
    pTemplate: number,
    ulCount: number,
    phNewObject: number
  ): number
  _C_DestroyObject(hSession: number, hObject: number): number
  _C_GetObjectSize(hSession: number, hObject: number, pulSize: number): number
  _C_GetAttributeValue(
    hSession: number,
    hObject: number,
    pTemplate: number,
    ulCount: number
  ): number
  _C_SetAttributeValue(
    hSession: number,
    hObject: number,
    pTemplate: number,
    ulCount: number
  ): number
  _C_FindObjectsInit(hSession: number, pTemplate: number, ulCount: number): number
  _C_FindObjects(hSession: number, phObject: number, ulMax: number, pulCount: number): number
  _C_FindObjectsFinal(hSession: number): number
  _C_EncryptInit(hSession: number, pMechanism: number, hKey: number): number
  _C_Encrypt(
    hSession: number,
    pData: number,
    ulDataLen: number,
    pOut: number,
    pulOutLen: number
  ): number
  _C_EncryptUpdate(
    hSession: number,
    pPart: number,
    ulPartLen: number,
    pOut: number,
    pulOutLen: number
  ): number
  _C_EncryptFinal(hSession: number, pOut: number, pulOutLen: number): number
  _C_DecryptInit(hSession: number, pMechanism: number, hKey: number): number
  _C_Decrypt(
    hSession: number,
    pEncData: number,
    ulEncDataLen: number,
    pOut: number,
    pulOutLen: number
  ): number
  _C_DecryptUpdate(
    hSession: number,
    pEncPart: number,
    ulEncPartLen: number,
    pOut: number,
    pulOutLen: number
  ): number
  _C_DecryptFinal(hSession: number, pOut: number, pulOutLen: number): number
  _C_DigestInit(hSession: number, pMechanism: number): number
  _C_Digest(
    hSession: number,
    pData: number,
    ulDataLen: number,
    pDigest: number,
    pulDigestLen: number
  ): number
  _C_DigestUpdate(hSession: number, pPart: number, ulPartLen: number): number
  _C_DigestKey(hSession: number, hKey: number): number
  _C_DigestFinal(hSession: number, pDigest: number, pulDigestLen: number): number
  _C_SignInit(hSession: number, pMechanism: number, hKey: number): number
  _C_Sign(
    hSession: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    pulSigLen: number
  ): number
  _C_SignUpdate(hSession: number, pPart: number, ulPartLen: number): number
  _C_SignFinal(hSession: number, pSig: number, pulSigLen: number): number
  _C_SignRecoverInit(hSession: number, pMechanism: number, hKey: number): number
  _C_SignRecover(
    hSession: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    pulSigLen: number
  ): number
  _C_VerifyInit(hSession: number, pMechanism: number, hKey: number): number
  _C_Verify(
    hSession: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    ulSigLen: number
  ): number
  _C_VerifyUpdate(hSession: number, pPart: number, ulPartLen: number): number
  _C_VerifyFinal(hSession: number, pSig: number, ulSigLen: number): number
  _C_VerifyRecoverInit(hSession: number, pMechanism: number, hKey: number): number
  _C_VerifyRecover(
    hSession: number,
    pSig: number,
    ulSigLen: number,
    pData: number,
    pulDataLen: number
  ): number
  _C_DigestEncryptUpdate(
    hSession: number,
    pPart: number,
    ulPartLen: number,
    pEncPart: number,
    pulEncPartLen: number
  ): number
  _C_DecryptDigestUpdate(
    hSession: number,
    pEncPart: number,
    ulEncPartLen: number,
    pPart: number,
    pulPartLen: number
  ): number
  _C_SignEncryptUpdate(
    hSession: number,
    pPart: number,
    ulPartLen: number,
    pEncPart: number,
    pulEncPartLen: number
  ): number
  _C_DecryptVerifyUpdate(
    hSession: number,
    pEncPart: number,
    ulEncPartLen: number,
    pPart: number,
    pulPartLen: number
  ): number
  _C_GenerateKey(
    hSession: number,
    pMechanism: number,
    pTemplate: number,
    ulCount: number,
    phKey: number
  ): number
  _C_GenerateKeyPair(
    hSession: number,
    pMechanism: number,
    pPubTemplate: number,
    ulPubCount: number,
    pPrvTemplate: number,
    ulPrvCount: number,
    phPub: number,
    phPrv: number
  ): number
  _C_WrapKey(
    hSession: number,
    pMechanism: number,
    hWrappingKey: number,
    hKey: number,
    pWrapped: number,
    pulWrappedLen: number
  ): number
  _C_UnwrapKey(
    hSession: number,
    pMechanism: number,
    hUnwrappingKey: number,
    pWrapped: number,
    ulWrappedLen: number,
    pTemplate: number,
    ulCount: number,
    phKey: number
  ): number
  _C_DeriveKey(
    hSession: number,
    pMechanism: number,
    hBaseKey: number,
    pTemplate: number,
    ulCount: number,
    phKey: number
  ): number
  _C_SeedRandom(hSession: number, pSeed: number, ulSeedLen: number): number
  _C_GenerateRandom(hSession: number, pRandom: number, ulRandomLen: number): number
  _C_GetFunctionStatus(hSession: number): number
  _C_CancelFunction(hSession: number): number
  _C_WaitForSlotEvent(flags: number, pSlot: number, pReserved: number): number

  // PKCS#11 v3.0+
  _C_GetInterfaceList(pInterfacesList: number, pulCount: number): number
  _C_GetInterface(
    pInterfaceName: number,
    pVersion: number,
    ppInterface: number,
    flags: number
  ): number
  _C_LoginUser(
    hSession: number,
    userType: number,
    pPin: number,
    ulPinLen: number,
    pUsername: number,
    ulUsernameLen: number
  ): number
  _C_SessionCancel(hSession: number, flags: number): number
  _C_MessageEncryptInit(hSession: number, pMechanism: number, hKey: number): number
  _C_EncryptMessage(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pAD: number,
    ulADLen: number,
    pPT: number,
    ulPTLen: number,
    pCT: number,
    pulCTLen: number
  ): number
  _C_EncryptMessageBegin(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pAD: number,
    ulADLen: number
  ): number
  _C_EncryptMessageNext(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pPTPart: number,
    ulPTPartLen: number,
    pCTPart: number,
    pulCTPartLen: number,
    flags: number
  ): number
  _C_MessageEncryptFinal(hSession: number): number
  _C_MessageDecryptInit(hSession: number, pMechanism: number, hKey: number): number
  _C_DecryptMessage(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pAD: number,
    ulADLen: number,
    pCT: number,
    ulCTLen: number,
    pPT: number,
    pulPTLen: number
  ): number
  _C_DecryptMessageBegin(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pAD: number,
    ulADLen: number
  ): number
  _C_DecryptMessageNext(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pCTPart: number,
    ulCTPartLen: number,
    pPTPart: number,
    pulPTPartLen: number,
    flags: number
  ): number
  _C_MessageDecryptFinal(hSession: number): number
  _C_MessageSignInit(hSession: number, pMechanism: number, hKey: number): number
  _C_SignMessage(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    pulSigLen: number
  ): number
  _C_SignMessageBegin(hSession: number, pParam: number, ulParamLen: number): number
  _C_SignMessageNext(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pData: number,
    ulDataLen: number,
    pbIsLast: number
  ): number
  _C_MessageSignFinal(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pSig: number,
    pulSigLen: number
  ): number
  _C_MessageVerifyInit(hSession: number, pMechanism: number, hKey: number): number
  _C_VerifyMessage(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    ulSigLen: number
  ): number
  _C_VerifyMessageBegin(hSession: number, pParam: number, ulParamLen: number): number
  _C_VerifyMessageNext(
    hSession: number,
    pParam: number,
    ulParamLen: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    ulSigLen: number,
    pbIsLast: number
  ): number
  _C_MessageVerifyFinal(hSession: number): number

  // PKCS#11 v3.2 — PQC KEM
  _C_EncapsulateKey(
    hSession: number,
    pMechanism: number,
    hPublicKey: number,
    pTemplate: number,
    ulAttributeCount: number,
    pCiphertext: number,
    pulCiphertextLen: number,
    phKey: number
  ): number
  _C_DecapsulateKey(
    hSession: number,
    pMechanism: number,
    hPrivateKey: number,
    pTemplate: number,
    ulAttributeCount: number,
    pCiphertext: number,
    ulCiphertextLen: number,
    phKey: number
  ): number
  _C_VerifySignatureInit(hSession: number, pMechanism: number, hKey: number): number
  _C_VerifySignature(
    hSession: number,
    pData: number,
    ulDataLen: number,
    pSig: number,
    ulSigLen: number
  ): number
  _C_VerifySignatureUpdate(hSession: number, pPart: number, ulPartLen: number): number
  _C_VerifySignatureFinal(hSession: number, pSig: number, ulSigLen: number): number
  _C_GetSessionValidationFlags(hSession: number, flags: number, pFlags: number): number
  _C_AsyncComplete(hSession: number, phObject: number): number
  _C_AsyncGetID(hSession: number, pulID: number): number
  _C_AsyncJoin(hSession: number, ulID: number, pTemplate: number, ulCount: number): number
  _C_WrapKeyAuthenticated(
    hSession: number,
    pMechanism: number,
    hWrappingKey: number,
    hKey: number,
    pAD: number,
    ulADLen: number,
    pWrapped: number,
    pulWrappedLen: number
  ): number
  _C_UnwrapKeyAuthenticated(
    hSession: number,
    pMechanism: number,
    hUnwrappingKey: number,
    pWrapped: number,
    ulWrappedLen: number,
    pAD: number,
    ulADLen: number,
    pTemplate: number,
    ulCount: number,
    phKey: number
  ): number
}

declare function createSoftHSMModule(moduleArg?: object): Promise<SoftHSMModule>
export { createSoftHSMModule }
export default createSoftHSMModule
