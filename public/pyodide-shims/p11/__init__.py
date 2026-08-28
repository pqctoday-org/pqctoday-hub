"""
p11 — in-browser PKCS#11 v3.2 shim, API-mirror of pqctoday-sandbox's
samples/py/p11 package.

WHY THIS FILE MUST STAY A MIRROR, NOT A REWRITE:
The whole point of the hub's PKCS#11 Developer tab is that a script written
here also runs, unmodified, in the dev sandbox against the real
libsofthsmv3.so — only this file's *import* resolves differently (bridge
calls here, ctypes.CDLL there). Every public name, signature, and return
shape below must match samples/py/p11/__init__.py exactly. If the sandbox
package's public surface changes, this file must change with it — see the
parity test that checks that.

WHAT DIFFERS FROM THE REAL PACKAGE, AND WHY (both stated on the page too,
not just here — see the Developer tab's info panel):
  - `Module(path=None, legacy=False)`: `path` is accepted for signature
    parity but ignored (there is one WASM engine, not a loadable path);
    `legacy=True` raises NotImplementedError — the WASM build only exposes
    the v3.2 negotiated table, there is no v2.40 C_GetFunctionList shim to
    demonstrate the legacy fallback the docstring on the real class exists
    to explain.
  - Calls dispatch through a JS bridge (see p11Bridge.ts) instead of a
    ctypes.CFUNCTYPE resolved from C_GetInterface's returned table. The
    bridge exposes the SAME classic single-part functions
    (C_SignInit/C_Sign/C_VerifyInit/C_Verify/...) at the SAME PKCS#11 v3.2
    semantics — this is a transport swap, not a different API.

CK_ULONG packing: this module is built for a 64-bit target (matches the
`struct.pack('<Q', n)` convention the real samples use for CK_ULONG), so
every attribute/mechanism/handle slot here is 8 bytes, little-endian.
"""
import struct

from ._constants import CONSTANTS

globals().update(CONSTANTS)

# Same parameter-set values as the real package (not universally in
# pkcs11t.h as CKP_* — defined by name there too).
CKP_ML_KEM_512, CKP_ML_KEM_768, CKP_ML_KEM_1024 = 1, 2, 3
CKP_ML_DSA_44, CKP_ML_DSA_65, CKP_ML_DSA_87 = 1, 2, 3
CKP_SLH_DSA_SHA2_128S = 0x01
CKP_SLH_DSA_SHAKE_128S = 0x02
CKP_SLH_DSA_SHA2_128F = 0x03
CKP_SLH_DSA_SHA2_192S = 0x05
CKP_SLH_DSA_SHA2_256S = 0x09
CKP_LMS_SHA256_M32_H5 = 5
CKP_LMOTS_SHA256_N32_W8 = 4

DEFAULT_MODULE = '<in-browser softhsmv3 wasm engine>'

CKR_NAMES = {v: k for k, v in CONSTANTS.items() if k.startswith('CKR_')}

# EC OIDs — same DER bytes the real package embeds (RFC 5480 / RFC 8032).
EC_P256_OID = bytes.fromhex('06082a8648ce3d030107')
ED25519_OID = bytes.fromhex('06032b6570')


class PKCS11Error(Exception):
    def __init__(self, rv, where=''):
        self.rv = rv
        self.name = CKR_NAMES.get(rv, 'CKR_VENDOR_OR_UNKNOWN')
        super().__init__(f"{where + ': ' if where else ''}{self.name} (0x{rv:08X})")


def _check(rv, where):
    if rv != 0:
        raise PKCS11Error(rv, where)


# ── Bridge access ────────────────────────────────────────────────────────────
# `_bridge` is installed by pyRuntime.ts via pyodide.registerJsModule before
# this module is imported. Kept as a private indirection (not imported at
# module scope as `from js import p11_bridge`) so the parity test can import
# this file headlessly with a stub bridge, without a real WASM engine.
def _get_bridge():
    # pyodide.registerJsModule('p11_bridge', ...) makes the bridge importable
    # AS a module (`import p11_bridge`), not as an attribute of `js` — the
    # object is still a live JS proxy either way, just reached differently.
    import p11_bridge
    return p11_bridge


class _Alloc:
    """Tracks pointers allocated during one call so they can all be freed,
    mirroring the real package's ctypes keepalive lists (`keep = []`)."""

    def __init__(self, bridge):
        self.b = bridge
        self.ptrs = []

    def malloc(self, n):
        p = self.b.malloc(n)
        self.ptrs.append(p)
        return p

    def bytes(self, data):
        p = self.malloc(max(len(data), 1))
        self.b.writeBytes(p, bytes(data))
        return p, len(data)

    def u32(self, v=0):
        p = self.malloc(4)
        self.b.writeU32(p, v)
        return p

    def free_all(self):
        for p in self.ptrs:
            self.b.free(p)
        self.ptrs = []


# WASM32 struct sizes (see p11Bridge.ts's file-header note on CK_ULONG width —
# this build is ILP32, not the sandbox's native LP64): CK_ATTRIBUTE and
# CK_MECHANISM are both 3 x u32 = 12 bytes here, not the ctypes package's 24.
CK_ATTRIBUTE_SIZE = 12
CK_MECHANISM_SIZE = 12
PTR_SIZE = 4


def _attrs(alloc, template):
    """Build a CK_ATTRIBUTE[] in WASM memory: each entry is
    {type: u32, pValue: ptr32, ulValueLen: u32} = 12 bytes on this WASM32
    build (CK_ATTRIBUTE_SIZE), same field ORDER as the real package's
    ctypes.Structure — only the field width differs.

    ONE deliberate accommodation, and only one: real sandbox samples build
    CKA_PARAMETER_SET's value with `struct.pack('<Q', n)` (8 bytes, matching
    native LP64 Linux's CK_ULONG) — see e.g. samples/py/03-sign-verify.py's
    own `ck_ulong()` helper. This WASM32 build's CK_ULONG is 4 bytes (same
    fact as CK_ATTRIBUTE_SIZE above), so an 8-byte value here is a real,
    reproducible CKR_ATTRIBUTE_VALUE_INVALID on C_GenerateKeyPair — confirmed
    live (dev-tabs-pkcs11-kmip plan P1 gate). Rather than requiring every
    real sandbox sample to be edited before it runs in the hub, this is the
    ONE attribute the shim repacks transparently: an 8-byte little-endian
    value narrows to its low 4 bytes (every real parameter-set enum fits in
    one byte, so this is lossless for every value any sample actually
    sends). No other attribute gets this treatment — a real 8-byte
    CKA_VALUE_LEN or similar is passed through untouched, exactly as the
    sandbox script wrote it, and would fail the same way it does today if
    the engine actually needed 8 bytes for it."""
    b = alloc.b
    arr = alloc.malloc(CK_ATTRIBUTE_SIZE * max(len(template), 1))
    for i, (t, val) in enumerate(template):
        if t == CONSTANTS['CKA_PARAMETER_SET'] and isinstance(val, (bytes, bytearray)) and len(val) == 8:
            val = bytes(val[:4])
        if isinstance(val, bool):
            vptr, vlen = alloc.bytes(bytes([1 if val else 0]))
        elif isinstance(val, int):
            vp = alloc.u32(val)
            vptr, vlen = vp, 4
        elif isinstance(val, (bytes, bytearray)):
            vptr, vlen = alloc.bytes(bytes(val))
        elif isinstance(val, str):
            vptr, vlen = alloc.bytes(val.encode('utf-8'))
        else:
            raise TypeError(f'unsupported attribute value type: {type(val)}')
        off = arr + i * CK_ATTRIBUTE_SIZE
        b.writeU32(off, t)
        b.writeU32(off + 4, vptr)
        b.writeU32(off + 8, vlen)
    return arr


def _mech(alloc, mechanism, param_bytes=None):
    """Build a CK_MECHANISM in WASM memory: {mechanism: u32, pParameter: ptr32,
    ulParameterLen: u32} = 12 bytes on this WASM32 build."""
    b = alloc.b
    m = alloc.malloc(CK_MECHANISM_SIZE)
    b.writeU32(m, mechanism)
    if param_bytes is not None:
        pptr, plen = alloc.bytes(param_bytes)
    else:
        pptr, plen = 0, 0
    b.writeU32(m + 4, pptr)
    b.writeU32(m + 8, plen)
    return m


class Session:
    """A logged-in (or anonymous) PKCS#11 session — mirrors
    samples/py/p11.Session's public surface. Every method signature and
    return shape below is identical to the real package."""

    def __init__(self, module, handle):
        self._m = module
        self.h = handle

    # ── auth / lifecycle ─────────────────────────────────────────────────────
    def login(self, pin, user=None):
        user = CONSTANTS['CKU_USER'] if user is None else user
        pin_b = pin.encode() if isinstance(pin, str) else pin
        b = self._m._b
        alloc = _Alloc(b)
        try:
            pptr, plen = alloc.bytes(pin_b)
            rv = b.call('C_Login', [self.h, user, pptr, plen])
            _check(rv, 'C_Login')
        finally:
            alloc.free_all()
        return self

    def logout(self):
        _check(self._m._b.call('C_Logout', [self.h]), 'C_Logout')

    def close(self):
        _check(self._m._b.call('C_CloseSession', [self.h]), 'C_CloseSession')

    # ── key generation ───────────────────────────────────────────────────────
    def generate_keypair(self, mechanism, pub_template, priv_template, parameter=None):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            pa = _attrs(alloc, pub_template)
            pra = _attrs(alloc, priv_template)
            mech = _mech(alloc, mechanism, parameter)
            pub_p = alloc.u32(0)
            priv_p = alloc.u32(0)
            rv = b.call('C_GenerateKeyPair', [
                self.h, mech, pa, len(pub_template), pra, len(priv_template),
                pub_p, priv_p,
            ])
            _check(rv, 'C_GenerateKeyPair')
            return int(b.readU32(pub_p)), int(b.readU32(priv_p))
        finally:
            alloc.free_all()

    def generate_secret_key(self, mechanism, template):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            pa = _attrs(alloc, template)
            mech = _mech(alloc, mechanism)
            h_p = alloc.u32(0)
            rv = b.call('C_GenerateKey', [self.h, mech, pa, len(template), h_p])
            _check(rv, 'C_GenerateKey')
            return int(b.readU32(h_p))
        finally:
            alloc.free_all()

    def generate_ml_kem(self, param_set, token=False):
        C = CONSTANTS
        pub = [(C['CKA_CLASS'], C['CKO_PUBLIC_KEY']), (C['CKA_KEY_TYPE'], C['CKK_ML_KEM']),
               (C['CKA_ENCAPSULATE'], True), (C['CKA_PARAMETER_SET'], param_set),
               (C['CKA_TOKEN'], token)]
        priv = [(C['CKA_CLASS'], C['CKO_PRIVATE_KEY']), (C['CKA_KEY_TYPE'], C['CKK_ML_KEM']),
                (C['CKA_DECAPSULATE'], True), (C['CKA_PARAMETER_SET'], param_set),
                (C['CKA_TOKEN'], token)]
        return self.generate_keypair(C['CKM_ML_KEM_KEY_PAIR_GEN'], pub, priv)

    def generate_ml_dsa(self, param_set, token=False):
        C = CONSTANTS
        pub = [(C['CKA_CLASS'], C['CKO_PUBLIC_KEY']), (C['CKA_KEY_TYPE'], C['CKK_ML_DSA']),
               (C['CKA_VERIFY'], True), (C['CKA_PARAMETER_SET'], param_set),
               (C['CKA_TOKEN'], token)]
        priv = [(C['CKA_CLASS'], C['CKO_PRIVATE_KEY']), (C['CKA_KEY_TYPE'], C['CKK_ML_DSA']),
                (C['CKA_SIGN'], True), (C['CKA_PARAMETER_SET'], param_set),
                (C['CKA_TOKEN'], token)]
        return self.generate_keypair(C['CKM_ML_DSA_KEY_PAIR_GEN'], pub, priv)

    def generate_slh_dsa(self, param_set, token=False):
        C = CONSTANTS
        pub = [(C['CKA_CLASS'], C['CKO_PUBLIC_KEY']), (C['CKA_KEY_TYPE'], C['CKK_SLH_DSA']),
               (C['CKA_VERIFY'], True), (C['CKA_PARAMETER_SET'], param_set),
               (C['CKA_TOKEN'], token)]
        priv = [(C['CKA_CLASS'], C['CKO_PRIVATE_KEY']), (C['CKA_KEY_TYPE'], C['CKK_SLH_DSA']),
                (C['CKA_SIGN'], True), (C['CKA_PARAMETER_SET'], param_set),
                (C['CKA_TOKEN'], token)]
        return self.generate_keypair(C['CKM_SLH_DSA_KEY_PAIR_GEN'], pub, priv)

    def generate_rsa(self, bits=2048, token=False):
        C = CONSTANTS
        pub = [(C['CKA_CLASS'], C['CKO_PUBLIC_KEY']), (C['CKA_KEY_TYPE'], C['CKK_RSA']),
               (C['CKA_MODULUS_BITS'], bits), (C['CKA_PUBLIC_EXPONENT'], bytes((0x01, 0x00, 0x01))),
               (C['CKA_VERIFY'], True), (C['CKA_ENCRYPT'], True), (C['CKA_TOKEN'], token)]
        priv = [(C['CKA_CLASS'], C['CKO_PRIVATE_KEY']), (C['CKA_KEY_TYPE'], C['CKK_RSA']),
                (C['CKA_SIGN'], True), (C['CKA_DECRYPT'], True),
                (C['CKA_SENSITIVE'], True), (C['CKA_TOKEN'], token)]
        return self.generate_keypair(C['CKM_RSA_PKCS_KEY_PAIR_GEN'], pub, priv)

    def generate_ec_p256(self, token=False):
        C = CONSTANTS
        pub = [(C['CKA_CLASS'], C['CKO_PUBLIC_KEY']), (C['CKA_KEY_TYPE'], C['CKK_EC']),
               (C['CKA_EC_PARAMS'], EC_P256_OID), (C['CKA_VERIFY'], True),
               (C['CKA_DERIVE'], True), (C['CKA_TOKEN'], token)]
        priv = [(C['CKA_CLASS'], C['CKO_PRIVATE_KEY']), (C['CKA_KEY_TYPE'], C['CKK_EC']),
                (C['CKA_SIGN'], True), (C['CKA_DERIVE'], True),
                (C['CKA_SENSITIVE'], True), (C['CKA_TOKEN'], token)]
        return self.generate_keypair(C['CKM_EC_KEY_PAIR_GEN'], pub, priv)

    def generate_ed25519(self, token=False):
        C = CONSTANTS
        pub = [(C['CKA_CLASS'], C['CKO_PUBLIC_KEY']), (C['CKA_KEY_TYPE'], C['CKK_EC_EDWARDS']),
               (C['CKA_EC_PARAMS'], ED25519_OID), (C['CKA_VERIFY'], True),
               (C['CKA_TOKEN'], token)]
        priv = [(C['CKA_CLASS'], C['CKO_PRIVATE_KEY']), (C['CKA_KEY_TYPE'], C['CKK_EC_EDWARDS']),
                (C['CKA_SIGN'], True), (C['CKA_SENSITIVE'], True), (C['CKA_TOKEN'], token)]
        return self.generate_keypair(C['CKM_EC_EDWARDS_KEY_PAIR_GEN'], pub, priv)

    def generate_aes256(self, token=False):
        C = CONSTANTS
        return self.generate_secret_key(C['CKM_AES_KEY_GEN'], [
            (C['CKA_CLASS'], C['CKO_SECRET_KEY']), (C['CKA_KEY_TYPE'], C['CKK_AES']),
            (C['CKA_VALUE_LEN'], 32), (C['CKA_ENCRYPT'], True), (C['CKA_DECRYPT'], True),
            (C['CKA_TOKEN'], token),
        ])

    # ── mechanism-parameter helpers (byte-identical struct layouts) ────────────
    @staticmethod
    def oaep_params(hash_alg=None, mgf=None):
        C = CONSTANTS
        h = C['CKM_SHA256'] if hash_alg is None else hash_alg
        m = C['CKG_MGF1_SHA256'] if mgf is None else mgf
        # CK_RSA_PKCS_OAEP_PARAMS on WASM32: hashAlg u32, mgf u32, source u32,
        # pSourceData ptr32, ulSourceDataLen u32 (5 x 4 = 20 bytes; LP64 would be 40).
        return struct.pack('<IIIII', h, m, C['CKZ_DATA_SPECIFIED'], 0, 0)

    @staticmethod
    def pss_params(hash_alg=None, mgf=None, salt_len=32):
        C = CONSTANTS
        h = C['CKM_SHA256'] if hash_alg is None else hash_alg
        m = C['CKG_MGF1_SHA256'] if mgf is None else mgf
        # CK_RSA_PKCS_PSS_PARAMS on WASM32: hashAlg u32, mgf u32, sLen u32.
        return struct.pack('<III', h, m, salt_len)

    # ── sign / verify ────────────────────────────────────────────────────────
    def sign(self, priv_handle, data, mechanism, parameter=None):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, mechanism, parameter)
            _check(b.call('C_SignInit', [self.h, mech, priv_handle]), 'C_SignInit')
            dptr, dlen = alloc.bytes(data)
            n_p = alloc.u32(0)
            _check(b.call('C_Sign', [self.h, dptr, dlen, 0, n_p]), 'C_Sign(size)')
            n = int(b.readU32(n_p))
            out_p = alloc.malloc(max(n, 1))
            b.writeU32(n_p, n)
            _check(b.call('C_Sign', [self.h, dptr, dlen, out_p, n_p]), 'C_Sign')
            n2 = int(b.readU32(n_p))
            return bytes(b.readBytes(out_p, n2))
        finally:
            alloc.free_all()

    def verify(self, pub_handle, data, signature, mechanism, parameter=None):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, mechanism, parameter)
            _check(b.call('C_VerifyInit', [self.h, mech, pub_handle]), 'C_VerifyInit')
            dptr, dlen = alloc.bytes(data)
            sptr, slen = alloc.bytes(signature)
            rv = b.call('C_Verify', [self.h, dptr, dlen, sptr, slen])
        finally:
            alloc.free_all()
        if rv == CONSTANTS['CKR_OK']:
            return True
        if rv == CONSTANTS['CKR_SIGNATURE_INVALID']:
            return False
        raise PKCS11Error(rv, 'C_Verify')

    # ── ML-KEM encapsulate / decapsulate (v3.2) ─────────────────────────────
    def _ss_template(self, length=32):
        C = CONSTANTS
        return [(C['CKA_CLASS'], C['CKO_SECRET_KEY']), (C['CKA_KEY_TYPE'], C['CKK_GENERIC_SECRET']),
                (C['CKA_VALUE_LEN'], length), (C['CKA_EXTRACTABLE'], True),
                (C['CKA_TOKEN'], False)]

    def encapsulate(self, pub_handle, secret_len=32, template=None):
        C = CONSTANTS
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, C['CKM_ML_KEM'])
            tmpl = template or self._ss_template(secret_len)
            ta = _attrs(alloc, tmpl)
            ct_len_p = alloc.u32(0)
            key_p = alloc.u32(0)
            _check(b.call('C_EncapsulateKey', [
                self.h, mech, pub_handle, ta, len(tmpl), 0, ct_len_p, key_p,
            ]), 'C_EncapsulateKey(size)')
            ct_len = int(b.readU32(ct_len_p))
            ct_p = alloc.malloc(max(ct_len, 1))
            b.writeU32(ct_len_p, ct_len)
            _check(b.call('C_EncapsulateKey', [
                self.h, mech, pub_handle, ta, len(tmpl), ct_p, ct_len_p, key_p,
            ]), 'C_EncapsulateKey')
            ct = bytes(b.readBytes(ct_p, int(b.readU32(ct_len_p))))
            return ct, int(b.readU32(key_p))
        finally:
            alloc.free_all()

    def decapsulate(self, priv_handle, ciphertext, secret_len=32, template=None):
        C = CONSTANTS
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, C['CKM_ML_KEM'])
            tmpl = template or self._ss_template(secret_len)
            ta = _attrs(alloc, tmpl)
            ctptr, ctlen = alloc.bytes(ciphertext)
            key_p = alloc.u32(0)
            _check(b.call('C_DecapsulateKey', [
                self.h, mech, priv_handle, ta, len(tmpl), ctptr, ctlen, key_p,
            ]), 'C_DecapsulateKey')
            return int(b.readU32(key_p))
        finally:
            alloc.free_all()

    def derive_key(self, base_handle, mechanism, template, parameter=None):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, mechanism, parameter)
            ta = _attrs(alloc, template)
            h_p = alloc.u32(0)
            _check(b.call('C_DeriveKey', [self.h, mech, base_handle, ta, len(template), h_p]),
                   'C_DeriveKey')
            return int(b.readU32(h_p))
        finally:
            alloc.free_all()

    def ecdh_derive(self, priv_handle, peer_point, secret_len=32, template=None):
        C = CONSTANTS
        # CK_ECDH1_DERIVE_PARAMS on WASM32: kdf u32, ulSharedDataLen u32,
        # pSharedData ptr32, ulPublicDataLen u32, pPublicData ptr32
        # (5 x 4 = 20 bytes; LP64 would be 40) — build with an outer alloc so
        # the peer-point buffer outlives the derive_key call.
        b = self._m._b
        alloc = _Alloc(b)
        try:
            pp_ptr, pp_len = alloc.bytes(peer_point)
            params = struct.pack('<IIIII', C['CKD_NULL'], 0, 0, pp_len, pp_ptr)
            tmpl = template or self._ss_template(secret_len)
            key = self.derive_key(priv_handle, C['CKM_ECDH1_DERIVE'], tmpl, params)
            return key
        finally:
            alloc.free_all()

    def ec_point(self, pub_handle):
        return self.get_attribute(pub_handle, CONSTANTS['CKA_EC_POINT'])

    def encrypt(self, key_handle, mechanism, plaintext, parameter=None):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, mechanism, parameter)
            _check(b.call('C_EncryptInit', [self.h, mech, key_handle]), 'C_EncryptInit')
            pptr, plen = alloc.bytes(plaintext)
            n_p = alloc.u32(0)
            _check(b.call('C_Encrypt', [self.h, pptr, plen, 0, n_p]), 'C_Encrypt(size)')
            n = int(b.readU32(n_p))
            out_p = alloc.malloc(max(n, 1))
            b.writeU32(n_p, n)
            _check(b.call('C_Encrypt', [self.h, pptr, plen, out_p, n_p]), 'C_Encrypt')
            return bytes(b.readBytes(out_p, int(b.readU32(n_p))))
        finally:
            alloc.free_all()

    def encrypt_gcm(self, key_handle, plaintext, iv, aad=b'', tag_bits=128):
        C = CONSTANTS
        b = self._m._b
        alloc = _Alloc(b)
        try:
            iv_ptr, iv_len = alloc.bytes(iv)
            aad_ptr, aad_len = alloc.bytes(aad) if aad else (0, 0)
            # CK_GCM_PARAMS on WASM32: pIv ptr32, ulIvLen u32, ulIvBits u32,
            # pAAD ptr32, ulAADLen u32, ulTagBits u32 (6 x 4 = 24; LP64 = 48).
            params = struct.pack('<IIIIII', iv_ptr, iv_len, iv_len * 8, aad_ptr, aad_len, tag_bits)
            return self.encrypt(key_handle, C['CKM_AES_GCM'], plaintext, params)
        finally:
            alloc.free_all()

    def decrypt(self, key_handle, mechanism, ciphertext, parameter=None):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, mechanism, parameter)
            _check(b.call('C_DecryptInit', [self.h, mech, key_handle]), 'C_DecryptInit')
            cptr, clen = alloc.bytes(ciphertext)
            n_p = alloc.u32(0)
            _check(b.call('C_Decrypt', [self.h, cptr, clen, 0, n_p]), 'C_Decrypt(size)')
            n = int(b.readU32(n_p))
            out_p = alloc.malloc(max(n, 1))
            b.writeU32(n_p, n)
            _check(b.call('C_Decrypt', [self.h, cptr, clen, out_p, n_p]), 'C_Decrypt')
            return bytes(b.readBytes(out_p, int(b.readU32(n_p))))
        finally:
            alloc.free_all()

    def decrypt_gcm(self, key_handle, ciphertext, iv, aad=b'', tag_bits=128):
        C = CONSTANTS
        b = self._m._b
        alloc = _Alloc(b)
        try:
            iv_ptr, iv_len = alloc.bytes(iv)
            aad_ptr, aad_len = alloc.bytes(aad) if aad else (0, 0)
            # CK_GCM_PARAMS on WASM32 (see encrypt_gcm's identical note): 6 x u32 = 24 bytes.
            params = struct.pack('<IIIIII', iv_ptr, iv_len, iv_len * 8, aad_ptr, aad_len, tag_bits)
            return self.decrypt(key_handle, C['CKM_AES_GCM'], ciphertext, params)
        finally:
            alloc.free_all()

    def digest(self, mechanism, data):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            mech = _mech(alloc, mechanism)
            _check(b.call('C_DigestInit', [self.h, mech]), 'C_DigestInit')
            dptr, dlen = alloc.bytes(data)
            n_p = alloc.u32(0)
            _check(b.call('C_Digest', [self.h, dptr, dlen, 0, n_p]), 'C_Digest(size)')
            n = int(b.readU32(n_p))
            out_p = alloc.malloc(max(n, 1))
            b.writeU32(n_p, n)
            _check(b.call('C_Digest', [self.h, dptr, dlen, out_p, n_p]), 'C_Digest')
            return bytes(b.readBytes(out_p, int(b.readU32(n_p))))
        finally:
            alloc.free_all()

    def create_object(self, template):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            ta = _attrs(alloc, template)
            h_p = alloc.u32(0)
            _check(b.call('C_CreateObject', [self.h, ta, len(template), h_p]), 'C_CreateObject')
            return int(b.readU32(h_p))
        finally:
            alloc.free_all()

    def import_secret(self, raw, key_type=None, derive=True, extractable=True):
        C = CONSTANTS
        kt = C['CKK_GENERIC_SECRET'] if key_type is None else key_type
        return self.create_object([
            (C['CKA_CLASS'], C['CKO_SECRET_KEY']), (C['CKA_KEY_TYPE'], kt),
            (C['CKA_VALUE'], raw), (C['CKA_DERIVE'], derive),
            (C['CKA_EXTRACTABLE'], extractable), (C['CKA_TOKEN'], False),
        ])

    def value(self, handle):
        return self.get_attribute(handle, CONSTANTS['CKA_VALUE'])

    def get_attribute(self, handle, attr_type):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            arr = alloc.malloc(CK_ATTRIBUTE_SIZE)
            b.writeU32(arr, attr_type)
            b.writeU32(arr + 4, 0)
            len_p = arr + 8
            _check(b.call('C_GetAttributeValue', [self.h, handle, arr, 1]),
                   'C_GetAttributeValue(size)')
            n = int(b.readU32(len_p))
            if n in (0, 0xFFFFFFFF):
                return b''
            out_p = alloc.malloc(n)
            b.writeU32(arr + 4, out_p)
            b.writeU32(len_p, n)
            _check(b.call('C_GetAttributeValue', [self.h, handle, arr, 1]),
                   'C_GetAttributeValue')
            return bytes(b.readBytes(out_p, n))
        finally:
            alloc.free_all()

    def find_objects(self, template, max_count=64):
        b = self._m._b
        alloc = _Alloc(b)
        try:
            ta = _attrs(alloc, template)
            _check(b.call('C_FindObjectsInit', [self.h, ta, len(template)]),
                   'C_FindObjectsInit')
            out_arr = alloc.malloc(PTR_SIZE * max_count)  # CK_OBJECT_HANDLE[] = u32[]
            n_p = alloc.u32(0)
            _check(b.call('C_FindObjects', [self.h, out_arr, max_count, n_p]),
                   'C_FindObjects')
            n = int(b.readU32(n_p))
            handles = [int(b.readU32(out_arr + i * PTR_SIZE)) for i in range(n)]
        finally:
            b.call('C_FindObjectsFinal', [self.h])
            alloc.free_all()
        return handles

    def destroy(self, handle):
        _check(self._m._b.call('C_DestroyObject', [self.h, handle]), 'C_DestroyObject')


class Module:
    """Mirrors samples/py/p11.Module's public surface. `path` accepted for
    signature parity, ignored (see module docstring). `legacy=True` is not
    supported in the browser build — raises NotImplementedError."""

    def __init__(self, path=None, legacy=False):
        if legacy:
            raise NotImplementedError(
                'p11.Module(legacy=True) is not available in the hub — the WASM '
                'build only exposes the v3.2 negotiated interface, not the classic '
                'C_GetFunctionList table. Use the dev sandbox for legacy-mode samples.'
            )
        self.path = path or DEFAULT_MODULE
        self.interface_version = (3, 2)
        self._b = _get_bridge()
        rv = self._b.call('C_Initialize', [0])
        # CKR_CRYPTOKI_ALREADY_INITIALIZED (0x191) is expected here, not an
        # error: there is exactly ONE softhsmv3 engine instance per browser
        # tab (unlike a real deployment, which can load a fresh module per
        # process), and the Developer tab's own token bootstrap (equivalent
        # to the sandbox container's pre-seeded token — see the sandbox's
        # entrypoint, which initializes the token before any sample runs)
        # already called C_Initialize before this script started. A real
        # PKCS#11 module tolerates a second C_Initialize the same way for
        # the same reason (PKCS#11 v3.2 §5.3): it is not this session's job
        # to fail just because setup already ran.
        if rv != CONSTANTS['CKR_OK'] and rv != CONSTANTS['CKR_CRYPTOKI_ALREADY_INITIALIZED']:
            _check(rv, 'C_Initialize')

    def slots(self, token_present=True, initialized_only=True):
        b = self._b
        alloc = _Alloc(b)
        try:
            n_p = alloc.u32(0)
            _check(b.call('C_GetSlotList', [1 if token_present else 0, 0, n_p]),
                   'C_GetSlotList(size)')
            n = int(b.readU32(n_p))
            arr = alloc.malloc(PTR_SIZE * max(n, 1))  # CK_SLOT_ID[] = u32[]
            b.writeU32(n_p, n)
            _check(b.call('C_GetSlotList', [1 if token_present else 0, arr, n_p]),
                   'C_GetSlotList')
            n2 = int(b.readU32(n_p))
            out = []
            for i in range(n2):
                slot = int(b.readU32(arr + i * PTR_SIZE))
                if initialized_only and not self._token_initialized(slot):
                    continue
                out.append(slot)
            return out
        finally:
            alloc.free_all()

    def token_info(self, slot):
        b = self._b
        alloc = _Alloc(b)
        try:
            buf = alloc.malloc(1024)
            rv = b.call('C_GetTokenInfo', [slot, buf])
            if rv != 0:
                return {}
            raw = bytes(b.readBytes(buf, 1024))
            label = raw[0:32].decode('utf-8', 'replace').strip('\x00 ')
            flags = int.from_bytes(raw[96:104], 'little')
            return {'label': label, 'initialized': bool(flags & CONSTANTS['CKF_TOKEN_INITIALIZED'])}
        finally:
            alloc.free_all()

    def _token_initialized(self, slot):
        return bool(self.token_info(slot).get('initialized'))

    def open_session(self, slot=None, rw=True, pin=None):
        if slot is None:
            avail = self.slots()
            if not avail:
                raise PKCS11Error(CONSTANTS['CKR_TOKEN_NOT_PRESENT'], 'no initialized token')
            slot = avail[0]
        flags = CONSTANTS['CKF_SERIAL_SESSION'] | (CONSTANTS['CKF_RW_SESSION'] if rw else 0)
        b = self._b
        alloc = _Alloc(b)
        try:
            h_p = alloc.u32(0)
            _check(b.call('C_OpenSession', [slot, flags, 0, 0, h_p]), 'C_OpenSession')
            h = int(b.readU32(h_p))
        finally:
            alloc.free_all()
        s = Session(self, h)
        if pin is not None:
            s.login(pin)
        return s

    def finalize(self):
        # Deliberately NOT forwarded to C_Finalize — see the Developer tab's
        # dedicated-slot design note (plan D6): C_Finalize is module-global
        # and would tear down every other open playground tab's session.
        # The real package's finalize() does call C_Finalize; this override
        # is the one intentional behavioral gap, and it is a safety
        # subtraction (no-op instead of a destructive global call), not a
        # different code path a script could observe succeeding differently.
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.finalize()
