#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""PQC Today native ACVP-format runner (plan WS-H, H-2) — stdlib + ctypes only.

Executes an ACVP fixture bundle written by the hub's Node CLI
(`npx tsx scripts/acvp-respond.ts ... --emit-bundle <dir>`) against a native
PKCS#11 v3.2 shared library (softhsmv3 C++ `libsofthsmv3.so` or Rust
`libsofthsmrustv3.so`) and writes, into --out:

  response.json                 ACVP response (rules R1-R5, byte-for-byte the
                                layout the Node CLI writes)
  evidence.json                 sidecar valid against
                                src/services/acvp/schemas/evidence.schema.json
  execution-environment.json    WS-H H-1 record (hash-addressed envId)

It does NOT re-implement parsing or dispatch: it executes the bundle's own
plan.json (produced by the hub's TypeScript pipeline, rules D1-D7) after
verifying every bundle file's SHA-256 and the canonical-JSON SHA-256 of
ir.json/plan.json against manifest.json. Only the PKCS#11 execution and the
response/evidence serialisation happen here, and both mirror
src/services/acvp/engine.ts and response.ts call-for-call:

  ml-kem.decapsulate: C_CreateObject(CKO_PRIVATE_KEY, CKK_ML_KEM, CKA_VALUE=dk)
                      -> C_DecapsulateKey(CKM_ML_KEM, c) -> C_GetAttributeValue(CKA_VALUE)
  ml-dsa.verify:      C_CreateObject(CKO_PUBLIC_KEY, CKK_ML_DSA, CKA_VALUE=pk)
                      -> C_MessageVerifyInit(mech, CK_SIGN_ADDITIONAL_CONTEXT{ctx})
                      -> C_VerifyMessage -> C_MessageVerifyFinal

No PyKCS11 (by policy), no third-party modules, no network, no RNG seeding.
Local only: nothing is submitted anywhere.

IMPORT ORDER MATTERS: hashlib (which dlopens the interpreter's libcrypto) is
imported only AFTER the PKCS#11 module is loaded, so a C++ engine linked
against a different libcrypto.so.3 (e.g. /usr/local/ssl OpenSSL 3.6.3) gets
its own library instead of the soname-matched one Python loaded first.
"""
import argparse
import ctypes
import datetime
import json
import os
import platform
import shutil
import sys

RUNNER_NAME = "pqctoday acvp-native (Python/ctypes)"
RUNNER_VERSION = "1.0.0"

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # never leave __pycache__ in a (possibly shared) checkout
sys.path.insert(0, HERE)
import pkcs11_constants as K  # noqa: E402  (generated from the hub tables)

with open(os.path.join(HERE, "hub_contract.json"), encoding="utf-8") as _f:
    CONTRACT = json.load(_f)

SO_PIN = b"12345678"
USER_PIN = b"user1234"
TOKEN_LABEL = b"ACVP-IO prototype"
CKR_OK = 0
CKR_SIGNATURE_INVALID = 0xC0
CKR_SIGNATURE_LEN_RANGE = 0xC1
CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191
CKR_SESSION_EXISTS = 0xB6
CKR_USER_ANOTHER_ALREADY_LOGGED_IN = 0x104
EXPECTED_CT_LEN = {512: 768, 768: 1088, 1024: 1568}

CK_ULONG = ctypes.c_ulong
CK_BBOOL = ctypes.c_ubyte


class CK_ATTRIBUTE(ctypes.Structure):
    _fields_ = [("type", CK_ULONG), ("pValue", ctypes.c_void_p), ("ulValueLen", CK_ULONG)]


class CK_MECHANISM(ctypes.Structure):
    _fields_ = [("mechanism", CK_ULONG), ("pParameter", ctypes.c_void_p), ("ulParameterLen", CK_ULONG)]


class CK_SIGN_ADDITIONAL_CONTEXT(ctypes.Structure):
    _fields_ = [("hedgeVariant", CK_ULONG), ("pContext", ctypes.c_void_p), ("ulContextLen", CK_ULONG)]


class CK_VERSION(ctypes.Structure):
    _fields_ = [("major", ctypes.c_ubyte), ("minor", ctypes.c_ubyte)]


class CK_INFO(ctypes.Structure):
    _fields_ = [
        ("cryptokiVersion", CK_VERSION),
        ("manufacturerID", ctypes.c_char * 32),
        ("flags", CK_ULONG),
        ("libraryDescription", ctypes.c_char * 32),
        ("libraryVersion", CK_VERSION),
    ]


def now_iso():
    t = datetime.datetime.now(datetime.timezone.utc)
    return t.strftime("%Y-%m-%dT%H:%M:%S.") + "%03dZ" % (t.microsecond // 1000)


def canonical(o):
    """== canonicalJson() in src/services/acvp/ir.ts (integer-only documents)."""
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def mapped_libcrypto():
    """Distinct libcrypto files mapped into this process (Linux /proc only)."""
    try:
        with open("/proc/self/maps", encoding="utf-8", errors="replace") as f:
            paths = {line.split()[-1] for line in f if "libcrypto" in line and "/" in line}
        return sorted(p for p in paths if p.startswith("/"))
    except OSError:
        return None


class PkcsError(Exception):
    pass


class Engine:
    """The native twin of createPkcs11Engine() in src/services/acvp/engine.ts."""

    def __init__(self, lib, label):
        self.lib = lib
        self.label = label
        self._bind()
        rv = self.f.C_Initialize(None)
        if rv not in (CKR_OK, CKR_CRYPTOKI_ALREADY_INITIALIZED):
            raise PkcsError("C_Initialize -> %s" % K.rv_name(rv))
        self.slot = self._init_token(self._first_slot(False))
        self.h = self._open_user_session(self.slot)
        self.advertised = set(self._mechanism_list(self.slot))

    def _bind(self):
        u, p, v = CK_ULONG, ctypes.POINTER(CK_ULONG), ctypes.c_void_p
        sigs = {
            "C_Initialize": [v],
            "C_Finalize": [v],
            "C_GetInfo": [ctypes.POINTER(CK_INFO)],
            "C_GetSlotList": [CK_BBOOL, p, p],
            "C_InitToken": [u, ctypes.c_char_p, u, ctypes.c_char_p],
            "C_OpenSession": [u, u, v, v, p],
            "C_CloseSession": [u],
            "C_Login": [u, u, ctypes.c_char_p, u],
            "C_Logout": [u],
            "C_InitPIN": [u, ctypes.c_char_p, u],
            "C_GetMechanismList": [u, p, p],
            "C_CreateObject": [u, ctypes.POINTER(CK_ATTRIBUTE), u, p],
            "C_DestroyObject": [u, u],
            "C_GetAttributeValue": [u, u, ctypes.POINTER(CK_ATTRIBUTE), u],
            "C_DecapsulateKey": [u, ctypes.POINTER(CK_MECHANISM), u, ctypes.POINTER(CK_ATTRIBUTE), u, v, u, p],
            "C_MessageVerifyInit": [u, ctypes.POINTER(CK_MECHANISM), u],
            "C_VerifyMessage": [u, v, u, v, u, v, u],
            "C_MessageVerifyFinal": [u],
        }

        class F:
            pass

        self.f = F()
        for name, args in sigs.items():
            fn = getattr(self.lib, name)
            fn.argtypes = args
            fn.restype = CK_ULONG
            setattr(self.f, name, fn)

    def check(self, rv, what):
        if rv != CKR_OK:
            raise PkcsError("%s → %s (0x%08x)" % (what, K.rv_name(rv), rv))

    def info(self):
        i = CK_INFO()
        if self.f.C_GetInfo(ctypes.byref(i)) != CKR_OK:
            return None
        dec = lambda b: b.decode("utf-8", "replace").rstrip(" \x00")  # noqa: E731
        return {
            "cryptoki": "%d.%d" % (i.cryptokiVersion.major, i.cryptokiVersion.minor),
            "manufacturer": dec(i.manufacturerID),
            "description": dec(i.libraryDescription),
            "libraryVersion": "%d.%d" % (i.libraryVersion.major, i.libraryVersion.minor),
        }

    def _slots(self, token_present):
        n = CK_ULONG(0)
        self.check(self.f.C_GetSlotList(1 if token_present else 0, None, ctypes.byref(n)), "C_GetSlotList(count)")
        arr = (CK_ULONG * max(n.value, 1))()
        self.check(self.f.C_GetSlotList(1 if token_present else 0, arr, ctypes.byref(n)), "C_GetSlotList")
        return [arr[i] for i in range(n.value)]

    def _first_slot(self, token_present):
        slots = self._slots(token_present)
        if not slots:
            raise PkcsError("C_GetSlotList returned no slot")
        return slots[0]

    def _init_token(self, slot):
        label = TOKEN_LABEL[:32].ljust(32, b" ")
        rv = self.f.C_InitToken(slot, SO_PIN, len(SO_PIN), label)
        if rv not in (CKR_OK, CKR_SESSION_EXISTS):
            self.check(rv, "C_InitToken")
        return self._first_slot(True)

    def _open_user_session(self, slot):
        h = CK_ULONG(0)
        self.check(
            self.f.C_OpenSession(slot, K.CKF_RW_SESSION | K.CKF_SERIAL_SESSION, None, None, ctypes.byref(h)),
            "C_OpenSession",
        )
        rv = self.f.C_Login(h.value, K.CKU_SO, SO_PIN, len(SO_PIN))
        if rv == CKR_USER_ANOTHER_ALREADY_LOGGED_IN:
            return h.value
        self.check(rv, "C_Login(SO)")
        self.check(self.f.C_InitPIN(h.value, USER_PIN, len(USER_PIN)), "C_InitPIN")
        self.check(self.f.C_Logout(h.value), "C_Logout")
        self.check(self.f.C_Login(h.value, K.CKU_USER, USER_PIN, len(USER_PIN)), "C_Login(USER)")
        return h.value

    def _mechanism_list(self, slot):
        n = CK_ULONG(0)
        self.check(self.f.C_GetMechanismList(slot, None, ctypes.byref(n)), "C_GetMechanismList(count)")
        arr = (CK_ULONG * max(n.value, 1))()
        self.check(self.f.C_GetMechanismList(slot, arr, ctypes.byref(n)), "C_GetMechanismList")
        return [arr[i] & 0xFFFFFFFF for i in range(n.value)]

    # -- helpers -----------------------------------------------------------
    @staticmethod
    def _template(defs, keep):
        """defs: [(type, kind, value)] kind in ulong|bool|bytes; keep holds buffers alive."""
        arr = (CK_ATTRIBUTE * len(defs))()
        for i, (t, kind, val) in enumerate(defs):
            if kind == "ulong":
                buf = CK_ULONG(val)
                size = ctypes.sizeof(CK_ULONG)
            elif kind == "bool":
                buf = CK_BBOOL(1 if val else 0)
                size = 1
            else:
                buf = ctypes.create_string_buffer(val, len(val)) if val else None
                size = len(val)
            keep.append(buf)
            arr[i].type = t
            arr[i].pValue = ctypes.cast(ctypes.byref(buf), ctypes.c_void_p) if buf is not None else None
            arr[i].ulValueLen = size
        return arr

    def _create(self, defs, what):
        keep = []
        tpl = self._template(defs, keep)
        h = CK_ULONG(0)
        self.check(self.f.C_CreateObject(self.h, tpl, len(defs), ctypes.byref(h)), what)
        return h.value

    def _destroy(self, handle):
        try:
            self.f.C_DestroyObject(self.h, handle)
        except Exception:  # best effort, as in engine.ts
            pass

    def _extract_value(self, handle):
        a = (CK_ATTRIBUTE * 1)()
        a[0].type = K.CKA_VALUE
        a[0].pValue = None
        a[0].ulValueLen = 0
        self.check(self.f.C_GetAttributeValue(self.h, handle, a, 1), "C_GetAttributeValue(len)")
        n = a[0].ulValueLen
        buf = ctypes.create_string_buffer(n)
        a[0].pValue = ctypes.cast(buf, ctypes.c_void_p)
        a[0].ulValueLen = n
        self.check(self.f.C_GetAttributeValue(self.h, handle, a, 1), "C_GetAttributeValue")
        return buf.raw[: a[0].ulValueLen]

    # -- operations (mirror engine.ts) ----------------------------------------
    def execute(self, op):
        mech = getattr(K, op["mechanism"], None)
        if mech is None or mech not in self.advertised:
            return {"status": "unsupported", "reason": "%s does not list %s in C_GetMechanismList" % (self.label, op["mechanism"])}
        if op["operation"] == "ml-kem.decapsulate":
            return self._decapsulate(op)
        return self._verify(op, mech)

    def _decapsulate(self, op):
        variant = int(op["parameterSet"].rsplit("-", 1)[1])
        ps = {512: K.CKP_ML_KEM_512, 768: K.CKP_ML_KEM_768, 1024: K.CKP_ML_KEM_1024}[variant]
        priv = secret = 0
        try:
            dk = bytes.fromhex(op["dk"])
            ct = bytes.fromhex(op["c"])
            priv = self._create(
                [
                    (K.CKA_CLASS, "ulong", K.CKO_PRIVATE_KEY),
                    (K.CKA_KEY_TYPE, "ulong", K.CKK_ML_KEM),
                    (K.CKA_TOKEN, "bool", False),
                    (K.CKA_SENSITIVE, "bool", False),
                    (K.CKA_EXTRACTABLE, "bool", True),
                    (K.CKA_DECAPSULATE, "bool", True),
                    (K.CKA_PARAMETER_SET, "ulong", ps),
                    (K.CKA_VALUE, "bytes", dk),
                ],
                "C_CreateObject(Import ML-KEM PrivKey)",
            )
            if len(ct) != EXPECTED_CT_LEN[variant]:
                raise PkcsError(
                    "ML-KEM-%d: ciphertext length %d does not match expected %d" % (variant, len(ct), EXPECTED_CT_LEN[variant])
                )
            m = CK_MECHANISM(K.CKM_ML_KEM, None, 0)
            keep = []
            tpl = self._template(
                [
                    (K.CKA_CLASS, "ulong", K.CKO_SECRET_KEY),
                    (K.CKA_VALUE_LEN, "ulong", 32),
                    (K.CKA_SENSITIVE, "bool", False),
                    (K.CKA_EXTRACTABLE, "bool", True),
                ],
                keep,
            )
            ctbuf = ctypes.create_string_buffer(ct, len(ct))
            h = CK_ULONG(0)
            self.check(
                self.f.C_DecapsulateKey(self.h, ctypes.byref(m), priv, tpl, 4, ctypes.cast(ctbuf, ctypes.c_void_p), len(ct), ctypes.byref(h)),
                "C_DecapsulateKey",
            )
            secret = h.value
            return {"status": "ok", "value": self._extract_value(secret).hex().upper()}
        except Exception as e:  # noqa: BLE001 — every failure is an 'error' disposition
            return {"status": "error", "reason": str(e)}
        finally:
            if secret:
                self._destroy(secret)
            if priv:
                self._destroy(priv)

    def _verify(self, op, mech_value):
        variant = int(op["parameterSet"].rsplit("-", 1)[1])
        ps = {44: K.CKP_ML_DSA_44, 65: K.CKP_ML_DSA_65, 87: K.CKP_ML_DSA_87}[variant]
        pub = 0
        initialized = False
        try:
            ctx = bytes.fromhex(op["context"])
            msg = bytes.fromhex(op["message"])
            sig = bytes.fromhex(op["signature"])
            pub = self._create(
                [
                    (K.CKA_CLASS, "ulong", K.CKO_PUBLIC_KEY),
                    (K.CKA_KEY_TYPE, "ulong", K.CKK_ML_DSA),
                    (K.CKA_TOKEN, "bool", False),
                    (K.CKA_VERIFY, "bool", True),
                    (K.CKA_PARAMETER_SET, "ulong", ps),
                    (K.CKA_VALUE, "bytes", bytes.fromhex(op["pk"])),
                ],
                "C_CreateObject(Import ML-DSA PubKey)",
            )
            # Always passed — also for an empty context — so ctx = "" is explicit (as engine.ts).
            ctxbuf = ctypes.create_string_buffer(ctx, len(ctx)) if ctx else None
            param = CK_SIGN_ADDITIONAL_CONTEXT(
                K.CKH_HEDGE_PREFERRED, ctypes.cast(ctxbuf, ctypes.c_void_p) if ctxbuf is not None else None, len(ctx)
            )
            m = CK_MECHANISM(mech_value, ctypes.cast(ctypes.byref(param), ctypes.c_void_p), ctypes.sizeof(param))
            msgbuf = ctypes.create_string_buffer(msg, max(len(msg), 1))
            sigbuf = ctypes.create_string_buffer(sig, max(len(sig), 1))
            rv = self.f.C_MessageVerifyInit(self.h, ctypes.byref(m), pub)
            if rv != CKR_OK:
                return {"status": "error", "reason": "C_MessageVerifyInit(%s) → %s" % (op["mechanism"], K.rv_name(rv))}
            initialized = True
            rv = self.f.C_VerifyMessage(
                self.h, None, 0, ctypes.cast(msgbuf, ctypes.c_void_p), len(msg), ctypes.cast(sigbuf, ctypes.c_void_p), len(sig)
            )
            if rv == CKR_OK:
                return {"status": "ok", "value": True}
            if rv in (CKR_SIGNATURE_INVALID, CKR_SIGNATURE_LEN_RANGE):
                return {"status": "ok", "value": False, "detail": K.rv_name(rv)}
            return {"status": "error", "reason": "C_VerifyMessage(%s) → %s" % (op["mechanism"], K.rv_name(rv))}
        except Exception as e:  # noqa: BLE001
            return {"status": "error", "reason": str(e)}
        finally:
            if initialized:
                self.f.C_MessageVerifyFinal(self.h)
            if pub:
                self._destroy(pub)

    def close(self):
        try:
            self.f.C_CloseSession(self.h)
            self.f.C_Finalize(None)
        except Exception:  # noqa: BLE001
            pass


# -- plan execution / response / evidence (mirror dispatch.ts, response.ts, evidence.ts, compare.ts) --
def execute_plan(plan, engine):
    results = []
    for item in plan["items"]:
        if item["kind"] == "unsupported":
            results.append({"tgId": item["tgId"], "tcId": item["tcId"], "disposition": "unsupported", "scope": item["scope"], "reason": item["reason"]})
            continue
        try:
            out = engine.execute(item["op"])
        except Exception as e:  # noqa: BLE001
            out = {"status": "error", "reason": str(e)}
        base = {"tgId": item["tgId"], "tcId": item["tcId"]}
        if out["status"] == "ok":
            r = dict(base, disposition="answered", responseField=item["responseField"], value=out["value"])
            if out.get("detail"):
                r["detail"] = out["detail"]
        elif out["status"] == "unsupported":
            r = dict(base, disposition="unsupported", scope="engine", reason=out["reason"])
        else:
            r = dict(base, disposition="error", reason=out["reason"])
        results.append(r)
    return results


def build_response(ir, results):
    by_key = {(r["tgId"], r["tcId"]): r for r in results}
    groups = []
    for g in ir["testGroups"]:
        tests = []
        for t in g["tests"]:
            r = by_key.get((g["tgId"], t["tcId"]))
            if not r or r["disposition"] != "answered":
                continue
            tests.append({"tcId": t["tcId"], r["responseField"]: r["value"]})
        if tests:
            groups.append({"tgId": g["tgId"], "tests": tests})
    vs = {"vsId": ir["vsId"], "testGroups": groups}
    doc = [{"acvVersion": ir["acvVersion"]}, vs] if ir["framing"] == "envelope" else vs
    return doc, json.dumps(doc, indent=2, ensure_ascii=False) + "\n"


def compare_to_expected(response_doc, expected_doc):
    unwrap = lambda d: d[1] if isinstance(d, list) and len(d) == 2 else d  # noqa: E731
    norm = lambda v: v.upper() if isinstance(v, str) else (v if isinstance(v, bool) else None)  # noqa: E731
    resp, exp = unwrap(response_doc), unwrap(expected_doc)
    if resp["vsId"] != exp["vsId"]:
        raise ValueError("vsId mismatch")
    rt = {(g["tgId"], t["tcId"]): t for g in resp["testGroups"] for t in g["tests"]}
    seen = set()
    out = {"matched": 0, "mismatched": 0, "unanswered": 0, "unexpected": 0, "expectedTotal": 0}
    for g in exp["testGroups"]:
        for t in g["tests"]:
            out["expectedTotal"] += 1
            key = (g["tgId"], t["tcId"])
            r = rt.get(key)
            if r is None:
                out["unanswered"] += 1
                continue
            seen.add(key)
            ok = True
            for field, val in r.items():
                if field == "tcId":
                    continue
                e = norm(t.get(field))
                if e is None or e != norm(val):
                    ok = False
                    out["mismatched"] += 1
            if ok:
                out["matched"] += 1
    out["unexpected"] = len([k for k in rt if k not in seen])
    return out


def build_evidence(ir, prompt_sha, response_sha, results, engine_identity, started, finished, golden):
    count = lambda d: len([r for r in results if r["disposition"] == d])  # noqa: E731
    unsupported, idx = [], {}
    for r in results:
        if r["disposition"] != "unsupported":
            continue
        key = (r["tgId"], r.get("scope"), r.get("reason"))
        if key in idx:
            idx[key]["tcIds"].append(r["tcId"])
        else:
            row = {"tgId": r["tgId"], "scope": r.get("scope") or "test", "reason": r.get("reason") or "", "tcIds": [r["tcId"]]}
            idx[key] = row
            unsupported.append(row)
    fixture = next((f for f in CONTRACT["knownFixtures"] if f["sha256"] == prompt_sha), None)
    schema = next(s for s in CONTRACT["pinnedSchemas"] if s["id"] == ir["schemaId"])
    cases = []
    for r in results:
        c = {"tgId": r["tgId"], "tcId": r["tcId"], "disposition": r["disposition"]}
        if "reason" in r:
            c["reason"] = r["reason"]
        if "detail" in r:
            c["detail"] = r["detail"]
        cases.append(c)
    return {
        "evidenceVersion": CONTRACT["evidenceVersion"],
        "label": CONTRACT["label"],
        "disclaimers": list(CONTRACT["disclaimers"]),
        "evidenceClass": "nist-acvp-reference-sample" if fixture else "unverified-imported-vector-set",
        "generator": {
            "name": "PQC Today acvp-native runner (Python/ctypes) executing the hub-generated plan.json",
            "codePath": "cli",
            "appVersion": None,
            "irVersion": ir["irVersion"],
        },
        "prompt": {
            "sha256": prompt_sha,
            "knownPublicFixture": {k: fixture[k] for k in ("repository", "commit", "upstreamPath")} if fixture else None,
            "framing": ir["framing"],
            "acvVersion": ir["acvVersion"],
            "vsId": ir["vsId"],
            "algorithm": schema["algorithm"],
            "mode": schema["mode"],
            "revision": schema["revision"],
            "isSample": ir["vectorSet"].get("isSample") if isinstance(ir["vectorSet"].get("isSample"), bool) else None,
            "pinnedSchema": {
                "id": schema["id"],
                "promptSchemaFile": schema["promptSchemaFile"],
                "responseSchemaFile": schema["responseSchemaFile"],
                "specRepository": schema["specRepository"],
                "specCommit": schema["specCommit"],
                "specDocument": schema["specDocument"],
            },
        },
        "response": {"fileName": "response.json", "sha256": response_sha},
        "engine": engine_identity,
        "startedAt": started,
        "finishedAt": finished,
        "summary": {"testCases": len(results), "answered": count("answered"), "unsupported": count("unsupported"), "error": count("error")},
        "cases": cases,
        "unsupported": unsupported,
        "goldenComparison": golden,
    }


# -- execution environment (WS-H H-1) ---------------------------------------
def read_os_release():
    d = {}
    for p in ("/etc/os-release", "/usr/lib/os-release"):
        try:
            with open(p, encoding="utf-8") as f:
                for line in f:
                    if "=" in line:
                        k, v = line.rstrip("\n").split("=", 1)
                        d[k] = v.strip('"')
            break
        except OSError:
            continue
    return d


def cpu_info():
    model, features, vendor, impl, part = None, None, None, None, None
    try:
        with open("/proc/cpuinfo", encoding="utf-8", errors="replace") as f:
            for line in f:
                if ":" not in line:
                    continue
                k, v = [x.strip() for x in line.split(":", 1)]
                if k == "model name" and model is None:
                    model = v
                elif k == "vendor_id" and vendor is None:
                    vendor = v
                elif k in ("flags", "Features") and features is None:
                    features = v
                elif k == "CPU implementer" and impl is None:
                    impl = v
                elif k == "CPU part" and part is None:
                    part = v
    except OSError:
        pass
    if model is None and impl is not None:
        vendor_names = {"0x41": "Arm", "0x61": "Apple", "0x51": "Qualcomm", "0x48": "HiSilicon"}
        model = "ARMv8 CPU implementer %s (%s) part %s" % (impl, vendor_names.get(impl, "unknown"), part)
    return model, features, vendor


def detect_emulation(machine, vendor):
    checks = []
    rosetta = False
    try:
        with open("/proc/self/maps", encoding="utf-8", errors="replace") as f:
            rosetta = any("[rosetta]" in line or "/rosetta" in line for line in f)
        checks.append("/proc/self/maps rosetta mapping: %s" % ("present" if rosetta else "absent"))
    except OSError:
        checks.append("/proc/self/maps unreadable")
    checks.append("cpuinfo vendor_id: %s" % vendor)
    emulated = bool(rosetta or (machine == "x86_64" and vendor == "VirtualApple"))
    mechanism = "Rosetta 2 x86-64 binary translation (OrbStack linux/amd64 container on Apple silicon)" if emulated else None
    return emulated, mechanism, "; ".join(checks)


def openssl_runtime(module_path):
    """OpenSSL actually mapped for the module (after load): (linked, version, cpuinfo, source)."""
    maps = mapped_libcrypto()
    if maps is None:
        return None, None, None, "not determinable: /proc/self/maps unavailable on this OS"
    if not maps:
        return False, None, None, "no libcrypto mapped into the runner process after loading %s (/proc/self/maps)" % module_path
    if len(maps) > 1:
        return None, None, None, "ambiguous: several libcrypto files mapped %s" % maps
    lib = ctypes.CDLL(maps[0])
    lib.OpenSSL_version.restype = ctypes.c_char_p
    lib.OpenSSL_version.argtypes = [ctypes.c_int]
    ver = lib.OpenSSL_version(0).decode()
    cpu = lib.OpenSSL_version(9).decode()  # OPENSSL_CPU_INFO
    return True, ver, cpu, "OpenSSL_version(OPENSSL_VERSION) of %s, the only libcrypto mapped after loading the module" % maps[0]


def build_environment(args, module_path, module_sha, manifest_sha, manifest, lib_info, ossl, build_info):
    import hashlib  # noqa: F401  (already loaded; kept local on purpose)

    osr = read_os_release()
    machine = platform.machine()
    model, features, vendor = cpu_info()
    if platform.system() == "Darwin":
        model = model or platform.processor()
    emulated, mechanism, detection = detect_emulation(machine, vendor)
    linked, over, ocpu, osrc = ossl
    bi = build_info or {}
    eng = bi.get("engine", {})
    bld = bi.get("build", {})
    deps = bi.get("dependencies", {})
    crypto = deps.get("cryptoBackend") or (
        {"name": "OpenSSL libcrypto (EVP)", "version": over} if linked else {"name": None, "version": None}
    )
    accel_state = args.acceleration
    accel_detail = args.acceleration_detail or "not declared by the operator"
    if ocpu:
        accel_detail += "; OpenSSL %s" % ocpu
    notes = list(bi.get("notes", []))
    if lib_info:
        notes.append(
            "C_GetInfo: cryptoki %(cryptoki)s, manufacturer '%(manufacturer)s', library '%(description)s' %(libraryVersion)s" % lib_info
        )
    rec = {
        "envVersion": "pqctoday.execution-environment/1",
        "recordedAt": now_iso(),
        "target": {"id": args.target_id, "label": args.target_label, "class": args.target_class},
        "os": {
            "name": osr.get("PRETTY_NAME") or ("%s %s" % (platform.system(), platform.mac_ver()[0]) if platform.system() == "Darwin" else None),
            "version": osr.get("VERSION_ID") or (platform.mac_ver()[0] or None),
            "kernel": "%s %s" % (platform.system(), platform.release()),
            "image": {"name": args.image_name, "id": args.image_id},
        },
        "arch": {"machine": machine or None, "pointerBits": ctypes.sizeof(ctypes.c_void_p) * 8, "endianness": sys.byteorder},
        "cpu": {"model": model, "board": args.board, "features": features},
        "emulation": {"emulated": emulated, "mechanism": mechanism, "hostMachine": args.host_machine, "detection": detection},
        "engine": {
            "id": args.engine_id,
            "implementation": eng.get("implementation") or args.engine_id,
            "artifactKind": "shared-library",
            "artifactPath": module_path,
            "artifactSha256": module_sha,
            "sourceRepository": eng.get("sourceRepository"),
            "sourceCommit": eng.get("sourceCommit"),
            "sourceCommitEvidence": eng.get("sourceCommitEvidence") or "no --build-info supplied: source commit unknown",
            "builtAt": eng.get("builtAt"),
        },
        "build": {k: bld.get(k) for k in ("buildSystem", "compiler", "flags", "profile", "features", "location")},
        "dependencies": {
            "openssl": {"linked": linked, "version": over, "source": osrc},
            "cryptoBackend": {"name": crypto.get("name"), "version": crypto.get("version")},
            "runtime": [{"name": "python", "version": platform.python_version()}, {"name": "libc", "version": " ".join(platform.libc_ver()) or None}],
        },
        "acceleration": {"state": accel_state, "detail": accel_detail},
        "entropy": {
            "source": bi.get("entropy", {}).get("source"),
            "exercisedByTestedOperations": False,
        },
        "runner": {"name": RUNNER_NAME, "version": RUNNER_VERSION, "language": "python", "languageVersion": platform.python_version()},
        "fixtureBundle": {"manifestSha256": manifest_sha, "schemaId": manifest["schemaId"], "vsId": manifest["vsId"]},
        "notes": notes,
    }
    rec["envId"] = hashlib_sha256_hex(canonical(rec).encode())
    return rec


def hashlib_sha256_hex(b):
    import hashlib

    return hashlib.sha256(b).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--bundle", required=True, help="fixture bundle dir written by acvp-respond --emit-bundle")
    ap.add_argument("--module", required=True, help="PKCS#11 v3.2 shared library (.so)")
    ap.add_argument("--engine-id", required=True, choices=["cpp", "rust"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--target-id", required=True)
    ap.add_argument("--target-label", required=True)
    ap.add_argument("--target-class", default="native", choices=["native", "board"])
    ap.add_argument("--build-info", help="JSON with engine/build/dependencies/entropy/notes facts the runner cannot observe")
    ap.add_argument("--image-name")
    ap.add_argument("--image-id")
    ap.add_argument("--board")
    ap.add_argument("--host-machine")
    ap.add_argument("--acceleration", default="unknown", choices=["none", "enabled", "unknown"])
    ap.add_argument("--acceleration-detail")
    ap.add_argument("--work-dir", help="token dir parent (default /tmp/acvp-native-<pid>)")
    args = ap.parse_args(argv)

    module_path = os.path.abspath(args.module)
    work = args.work_dir or "/tmp/acvp-native-%d" % os.getpid()
    tokens = os.path.join(work, "tokens")
    os.makedirs(tokens, exist_ok=True)
    conf = os.path.join(work, "softhsm2.conf")
    with open(conf, "w", encoding="utf-8") as f:
        f.write("directories.tokendir = %s\nobjectstore.backend = file\nlog.level = ERROR\n" % tokens)
    os.environ["SOFTHSM2_CONF"] = conf

    pre = mapped_libcrypto()  # must be empty: see IMPORT ORDER in the module docstring
    lib = ctypes.CDLL(module_path)
    ossl = openssl_runtime(module_path)
    import hashlib  # noqa: E402 — only now (see docstring)

    def sha(b):
        return hashlib.sha256(b).hexdigest()

    # Verify the bundle before trusting a byte of it.
    with open(os.path.join(args.bundle, "manifest.json"), "rb") as f:
        manifest_bytes = f.read()
    manifest = json.loads(manifest_bytes)
    files = {}
    for name, want in manifest["files"].items():
        with open(os.path.join(args.bundle, name), "rb") as f:
            files[name] = f.read()
        if sha(files[name]) != want:
            print("[acvp-native] bundle file %s SHA-256 mismatch — refusing to run" % name, file=sys.stderr)
            return 3
    ir = json.loads(files["ir.json"])
    plan = json.loads(files["plan.json"])
    for key, doc in (("ir", ir), ("plan", plan)):
        if sha(canonical(doc).encode()) != manifest["canonicalSha256"][key]:
            print("[acvp-native] %s.json canonical SHA-256 mismatch — refusing to run" % key, file=sys.stderr)
            return 3
    if ir.get("irVersion") != CONTRACT["irVersion"] or plan.get("planVersion") != CONTRACT["planVersion"]:
        print("[acvp-native] IR/plan version not supported by this runner", file=sys.stderr)
        return 3

    with open(module_path, "rb") as f:
        module_sha = sha(f.read())
    build_info = None
    if args.build_info:
        with open(args.build_info, encoding="utf-8") as f:
            build_info = json.load(f)

    engine = Engine(lib, "softhsmv3 %s engine (native)" % ("C++" if args.engine_id == "cpp" else "Rust"))
    lib_info = engine.info()
    started = now_iso()
    try:
        results = execute_plan(plan, engine)
    finally:
        finished = now_iso()
        engine.close()

    doc, text = build_response(ir, results)
    golden = None
    if "expectedResults.json" in files:
        golden = compare_to_expected(doc, json.loads(files["expectedResults.json"]))
    bi_engine = (build_info or {}).get("engine", {})
    identity = {
        "id": args.engine_id,
        "label": engine.label,
        "implementation": bi_engine.get("implementation") or engine.label,
        "softhsmProductVersion": lib_info["libraryVersion"] if lib_info else None,
        "provenanceBundle": None,
        "hsmCommit": bi_engine.get("sourceCommit"),
        "builtAt": bi_engine.get("builtAt"),
        "artifactPath": module_path,
        "artifactSha256": module_sha,
        "artifactSha256Note": "SHA-256 of the exact shared library bytes dlopen()ed for this run; hsmCommit/builtAt from --build-info.",
    }
    evidence = build_evidence(ir, manifest["files"]["prompt.json"], sha(text.encode()), results, identity, started, finished, golden)
    env = build_environment(args, module_path, module_sha, sha(manifest_bytes), manifest, lib_info, ossl, build_info)
    if pre:
        env["notes"].append("WARNING: libcrypto already mapped before the module was loaded: %s" % pre)
        env["envId"] = sha(canonical({k: v for k, v in env.items() if k != "envId"}).encode())

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "response.json"), "w", encoding="utf-8") as f:
        f.write(text)
    with open(os.path.join(args.out, "evidence.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n")
    with open(os.path.join(args.out, "execution-environment.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(env, indent=2, ensure_ascii=False) + "\n")
    shutil.rmtree(work, ignore_errors=True)

    s = evidence["summary"]
    same = sha(canonical(doc).encode()) == manifest["canonicalSha256"]["response"]
    line = "[acvp-native] %s vsId=%s engine=%s: %d test cases — %d answered, %d unsupported, %d error; response %s the bundle's reference response" % (
        manifest["schemaId"], manifest["vsId"], args.engine_id, s["testCases"], s["answered"], s["unsupported"], s["error"],
        "MATCHES" if same else "DIFFERS FROM",
    )
    if golden:
        line += "; golden vs expectedResults: %d/%d matched, %d mismatched, %d unanswered, %d unexpected" % (
            golden["matched"], s["answered"], golden["mismatched"], golden["unanswered"], golden["unexpected"],
        )
    print(line)
    if s["error"] or (golden and (golden["mismatched"] or golden["unexpected"])):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
