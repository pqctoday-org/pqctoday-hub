// SPDX-License-Identifier: GPL-3.0-only
// Official HPKE test vectors, vendored verbatim from RFC 9180 Appendix A.3:
// DHKEM(P-256, HKDF-SHA256), HKDF-SHA256, AES-128-GCM — all four HPKE modes.
// Source: https://www.rfc-editor.org/rfc/rfc9180.html#appendix-A.3
//
// P-256 is the suite used here (not the A.1 X25519 suite) because the softhsmv3
// WASM PKCS#11 binding this hub uses only exposes a raw scalar import for
// P-256/P-384/P-521 (hsm_importECPrivateKey) — there is no X25519 private-key
// import — so P-256 is the only DHKEM family where every private key in this
// vector (skEm, skRm, skSm) can be forced to its exact published value and the
// resulting shared_secret/key/base_nonce/exporter_secret/ciphertexts reproduced
// byte-for-byte through real C_DeriveKey(CKM_ECDH1_DERIVE) + C_DeriveKey(CKM_HKDF_DERIVE)
// + C_Encrypt(CKM_AES_GCM) PKCS#11 calls. See hpkeService.test.ts.

export interface HpkeEncryptionVector {
  aad: string
  nonce: string
  ct: string
}

export interface HpkeP256Vector {
  id: string
  mode: number
  modeLabel: 'Base' | 'PSK' | 'Auth' | 'AuthPSK'
  kemId: number
  kdfId: number
  aeadId: number
  info: string
  skEm: string
  pkEm: string
  skRm: string
  pkRm: string
  psk?: string
  pskId?: string
  skSm?: string
  pkSm?: string
  enc: string
  sharedSecret: string
  keyScheduleContext: string
  secret: string
  key: string
  baseNonce: string
  exporterSecret: string
  pt: string
  encryptions: HpkeEncryptionVector[]
}

export const HPKE_RFC9180_A3_VECTORS: HpkeP256Vector[] = [
  {
    id: 'rfc9180-a3-base',
    mode: 0,
    modeLabel: 'Base',
    kemId: 16,
    kdfId: 1,
    aeadId: 1,
    info: '4f6465206f6e2061204772656369616e2055726e',
    skEm: '4995788ef4b9d6132b249ce59a77281493eb39af373d236a1fe415cb0c2d7beb',
    pkEm: '04a92719c6195d5085104f469a8b9814d5838ff72b60501e2c4466e5e67b325ac98536d7b61a1af4b78e5b7f951c0900be863c403ce65c9bfcb9382657222d18c4',
    skRm: 'f3ce7fdae57e1a310d87f1ebbde6f328be0a99cdbcadf4d6589cf29de4b8ffd2',
    pkRm: '04fe8c19ce0905191ebc298a9245792531f26f0cece2460639e8bc39cb7f706a826a779b4cf969b8a0e539c7f62fb3d30ad6aa8f80e30f1d128aafd68a2ce72ea0',
    enc: '04a92719c6195d5085104f469a8b9814d5838ff72b60501e2c4466e5e67b325ac98536d7b61a1af4b78e5b7f951c0900be863c403ce65c9bfcb9382657222d18c4',
    sharedSecret: 'c0d26aeab536609a572b07695d933b589dcf363ff9d93c93adea537aeabb8cb8',
    keyScheduleContext:
      '00b88d4e6d91759e65e87c470e8b9141113e9ad5f0c8ceefc1e088c82e6980500798e486f9c9c09c9b5c753ac72d6005de254c607d1b534ed11d493ae1c1d9ac85',
    secret: '2eb7b6bf138f6b5aff857414a058a3f1750054a9ba1f72c2cf0684a6f20b10e1',
    key: '868c066ef58aae6dc589b6cfdd18f97e',
    baseNonce: '4e0bc5018beba4bf004cca59',
    exporterSecret: '14ad94af484a7ad3ef40e9f3be99ecc6fa9036df9d4920548424df127ee0d99f',
    pt: '4265617574792069732074727574682c20747275746820626561757479',
    encryptions: [
      {
        aad: '436f756e742d30',
        nonce: '4e0bc5018beba4bf004cca59',
        ct: '5ad590bb8baa577f8619db35a36311226a896e7342a6d836d8b7bcd2f20b6c7f9076ac232e3ab2523f39513434',
      },
      {
        aad: '436f756e742d31',
        nonce: '4e0bc5018beba4bf004cca58',
        ct: 'fa6f037b47fc21826b610172ca9637e82d6e5801eb31cbd3748271affd4ecb06646e0329cbdf3c3cd655b28e82',
      },
      {
        aad: '436f756e742d32',
        nonce: '4e0bc5018beba4bf004cca5b',
        ct: '895cabfac50ce6c6eb02ffe6c048bf53b7f7be9a91fc559402cbc5b8dcaeb52b2ccc93e466c28fb55fed7a7fec',
      },
    ],
  },
  {
    id: 'rfc9180-a3-psk',
    mode: 1,
    modeLabel: 'PSK',
    kemId: 16,
    kdfId: 1,
    aeadId: 1,
    info: '4f6465206f6e2061204772656369616e2055726e',
    skEm: '57427244f6cc016cddf1c19c8973b4060aa13579b4c067fd5d93a5d74e32a90f',
    pkEm: '04305d35563527bce037773d79a13deabed0e8e7cde61eecee403496959e89e4d0ca701726696d1485137ccb5341b3c1c7aaee90a4a02449725e744b1193b53b5f',
    skRm: '438d8bcef33b89e0e9ae5eb0957c353c25a94584b0dd59c991372a75b43cb661',
    pkRm: '040d97419ae99f13007a93996648b2674e5260a8ebd2b822e84899cd52d87446ea394ca76223b76639eccdf00e1967db10ade37db4e7db476261fcc8df97c5ffd1',
    psk: '0247fd33b913760fa1fa51e1892d9f307fbe65eb171e8132c2af18555a738b82',
    pskId: '456e6e796e20447572696e206172616e204d6f726961',
    enc: '04305d35563527bce037773d79a13deabed0e8e7cde61eecee403496959e89e4d0ca701726696d1485137ccb5341b3c1c7aaee90a4a02449725e744b1193b53b5f',
    sharedSecret: '2e783ad86a1beae03b5749e0f3f5e9bb19cb7eb382f2fb2dd64c99f15ae0661b',
    keyScheduleContext:
      '01b873cdf2dff4c1434988053b7a775e980dd2039ea24f950b26b056ccedcb933198e486f9c9c09c9b5c753ac72d6005de254c607d1b534ed11d493ae1c1d9ac85',
    secret: 'f2f534e55931c62eeb2188c1f53450354a725183937e68c85e68d6b267504d26',
    key: '55d9eb9d26911d4c514a990fa8d57048',
    baseNonce: 'b595dc6b2d7e2ed23af529b1',
    exporterSecret: '895a723a1eab809804973a53c0ee18ece29b25a7555a4808277ad2651d66d705',
    pt: '4265617574792069732074727574682c20747275746820626561757479',
    encryptions: [
      {
        aad: '436f756e742d30',
        nonce: 'b595dc6b2d7e2ed23af529b1',
        ct: '90c4deb5b75318530194e4bb62f890b019b1397bbf9d0d6eb918890e1fb2be1ac2603193b60a49c2126b75d0eb',
      },
      {
        aad: '436f756e742d31',
        nonce: 'b595dc6b2d7e2ed23af529b0',
        ct: '9e223384a3620f4a75b5a52f546b7262d8826dea18db5a365feb8b997180b22d72dc1287f7089a1073a7102c27',
      },
      {
        aad: '436f756e742d32',
        nonce: 'b595dc6b2d7e2ed23af529b3',
        ct: 'adf9f6000773035023be7d415e13f84c1cb32a24339a32eb81df02be9ddc6abc880dd81cceb7c1d0c7781465b2',
      },
    ],
  },
  {
    id: 'rfc9180-a3-auth',
    mode: 2,
    modeLabel: 'Auth',
    kemId: 16,
    kdfId: 1,
    aeadId: 1,
    info: '4f6465206f6e2061204772656369616e2055726e',
    skEm: '6b8de0873aed0c1b2d09b8c7ed54cbf24fdf1dfc7a47fa501f918810642d7b91',
    pkEm: '042224f3ea800f7ec55c03f29fc9865f6ee27004f818fcbdc6dc68932c1e52e15b79e264a98f2c535ef06745f3d308624414153b22c7332bc1e691cb4af4d53454',
    skRm: 'd929ab4be2e59f6954d6bedd93e638f02d4046cef21115b00cdda2acb2a4440e',
    pkRm: '04423e363e1cd54ce7b7573110ac121399acbc9ed815fae03b72ffbd4c18b01836835c5a09513f28fc971b7266cfde2e96afe84bb0f266920e82c4f53b36e1a78d',
    skSm: '1120ac99fb1fccc1e8230502d245719d1b217fe20505c7648795139d177f0de9',
    pkSm: '04a817a0902bf28e036d66add5d544cc3a0457eab150f104285df1e293b5c10eef8651213e43d9cd9086c80b309df22cf37609f58c1127f7607e85f210b2804f73',
    enc: '042224f3ea800f7ec55c03f29fc9865f6ee27004f818fcbdc6dc68932c1e52e15b79e264a98f2c535ef06745f3d308624414153b22c7332bc1e691cb4af4d53454',
    sharedSecret: 'd4aea336439aadf68f9348880aa358086f1480e7c167b6ef15453ba69b94b44f',
    keyScheduleContext:
      '02b88d4e6d91759e65e87c470e8b9141113e9ad5f0c8ceefc1e088c82e6980500798e486f9c9c09c9b5c753ac72d6005de254c607d1b534ed11d493ae1c1d9ac85',
    secret: 'fd0a93c7c6f6b1b0dd6a822d7b16f6c61c83d98ad88426df4613c3581a2319f1',
    key: '19aa8472b3fdc530392b0e54ca17c0f5',
    baseNonce: 'b390052d26b67a5b8a8fcaa4',
    exporterSecret: 'f152759972660eb0e1db880835abd5de1c39c8e9cd269f6f082ed80e28acb164',
    pt: '4265617574792069732074727574682c20747275746820626561757479',
    encryptions: [
      {
        aad: '436f756e742d30',
        nonce: 'b390052d26b67a5b8a8fcaa4',
        ct: '82ffc8c44760db691a07c5627e5fc2c08e7a86979ee79b494a17cc3405446ac2bdb8f265db4a099ed3289ffe19',
      },
      {
        aad: '436f756e742d31',
        nonce: 'b390052d26b67a5b8a8fcaa5',
        ct: 'b0a705a54532c7b4f5907de51c13dffe1e08d55ee9ba59686114b05945494d96725b239468f1229e3966aa1250',
      },
      {
        aad: '436f756e742d32',
        nonce: 'b390052d26b67a5b8a8fcaa6',
        ct: '8dc805680e3271a801790833ed74473710157645584f06d1b53ad439078d880b23e25256663178271c80ee8b7c',
      },
    ],
  },
  {
    id: 'rfc9180-a3-authpsk',
    mode: 3,
    modeLabel: 'AuthPSK',
    kemId: 16,
    kdfId: 1,
    aeadId: 1,
    info: '4f6465206f6e2061204772656369616e2055726e',
    skEm: '36f771e411cf9cf72f0701ef2b991ce9743645b472e835fe234fb4d6eb2ff5a0',
    pkEm: '046a1de3fc26a3d43f4e4ba97dbe24f7e99181136129c48fbe872d4743e2b131357ed4f29a7b317dc22509c7b00991ae990bf65f8b236700c82ab7c11a84511401',
    skRm: 'bdf4e2e587afdf0930644a0c45053889ebcadeca662d7c755a353d5b4e2a8394',
    pkRm: '04d824d7e897897c172ac8a9e862e4bd820133b8d090a9b188b8233a64dfbc5f725aa0aa52c8462ab7c9188f1c4872f0c99087a867e8a773a13df48a627058e1b3',
    psk: '0247fd33b913760fa1fa51e1892d9f307fbe65eb171e8132c2af18555a738b82',
    pskId: '456e6e796e20447572696e206172616e204d6f726961',
    skSm: 'b0ed8721db6185435898650f7a677affce925aba7975a582653c4cb13c72d240',
    pkSm: '049f158c750e55d8d5ad13ede66cf6e79801634b7acadcad72044eac2ae1d0480069133d6488bf73863fa988c4ba8bde1c2e948b761274802b4d8012af4f13af9e',
    enc: '046a1de3fc26a3d43f4e4ba97dbe24f7e99181136129c48fbe872d4743e2b131357ed4f29a7b317dc22509c7b00991ae990bf65f8b236700c82ab7c11a84511401',
    sharedSecret: 'd4c27698391db126f1612d9e91a767f10b9b19aa17e1695549203f0df7d9aebe',
    keyScheduleContext:
      '03b873cdf2dff4c1434988053b7a775e980dd2039ea24f950b26b056ccedcb933198e486f9c9c09c9b5c753ac72d6005de254c607d1b534ed11d493ae1c1d9ac85',
    secret: '3bf9d4c7955da2740414e73081fa74d6f6f2b4b9645d0685219813ce99a2f270',
    key: '4d567121d67fae1227d90e11585988fb',
    baseNonce: '67c9d05330ca21e5116ecda6',
    exporterSecret: '3f479020ae186788e4dfd4a42a21d24f3faabb224dd4f91c2b2e5e9524ca27b2',
    pt: '4265617574792069732074727574682c20747275746820626561757479',
    encryptions: [
      {
        aad: '436f756e742d30',
        nonce: '67c9d05330ca21e5116ecda6',
        ct: 'b9f36d58d9eb101629a3e5a7b63d2ee4af42b3644209ab37e0a272d44365407db8e655c72e4fa46f4ff81b9246',
      },
      {
        aad: '436f756e742d31',
        nonce: '67c9d05330ca21e5116ecda7',
        ct: '51788c4e5d56276771032749d015d3eea651af0c7bb8e3da669effffed299ea1f641df621af65579c10fc09736',
      },
      {
        aad: '436f756e742d32',
        nonce: '67c9d05330ca21e5116ecda4',
        ct: '3b5a2be002e7b29927f06442947e1cf709b9f8508b03823127387223d712703471c266efc355f1bc2036f3027c',
      },
    ],
  },
]
