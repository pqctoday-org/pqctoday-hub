"""
pqctoday_kmip — in-browser KMIP 3.0 + CACP shim, API-mirror of
pqctoday-hsm/kmip/python-client's real pqctoday_kmip package.

WHY THIS FILE MUST STAY A MIRROR, NOT A REWRITE: same rule as the p11 shim
(see the sibling ../p11/__init__.py's docstring) — a script written
here should also run, with only its import/constructor resolving
differently, against the real pqc-kmip server via the real client. Every
public class/method/property name and behavior below is taken from reading
the real package's source directly (pqctoday-hsm/kmip/python-client/src/
pqctoday_kmip/kmip.py), not guessed.

WHAT THE REAL CLIENT DOES THAT THIS SHIM CANNOT — stated here and on the
Developer tab's info panel, not hidden:
  - No real TLS/TTLV connection. `runOp` is a synchronous in-page wasm call
    to the SAME engine the rest of the KMIP/CACP playground already booted
    — real KMIP request/response semantics and a REAL crypto-agility policy
    evaluation (Plane 1) on every call, just no network hop. Every
    constructor arg that only makes sense for a real connection (timeout,
    insecure, ca_cert, client_cert, client_key) is accepted for signature
    parity and ignored.
  - `negotiated_group()` / `assert_quantum_safe_channel()` /
    `serve_as_endpoint()` need a real TLS handshake or a real listening
    socket — neither exists in a browser tab. These raise
    NotImplementedError pointing at the dev sandbox, the same pattern the
    p11 shim uses for `Module(legacy=True)`.
  - `get_attributes(uid)` is a DISTINCT KMIP operation on the real client
    and the real wire, but the hub's KmipEngine has no separate
    GetAttributes verb in its `OpSpec.op` union (confirmed by reading
    kmipEngine.ts's OpSpec type). Routing it through the SAME `Get` op
    `get()` uses was tried first and rejected: confirmed live that `Get`
    legitimately REFUSES a non-extractable private key's material ("KMIP
    NotExtractable... material is held by the engine and is not
    extractable") — correct engine behavior, but wrong for
    get_attributes(), which never needs key material. This shim instead
    builds the result from `listObjects()` — the engine's metadata-only
    view (algorithm/length/state/name/usageMask, no key material — see
    `KmipObject` in kmipEngine.ts), which is what real GetAttributes
    actually returns. Genuinely correct, not a documented-but-imperfect
    substitution, on every real sandbox sample tested.

RESULT SHAPE (KmipResult): mirrors the real dataclass's public surface
exactly — `.ok` (bool property), `.get(tag)` (one positional arg, tag-name
lookup, punctuation/case-insensitive-ish via the same _norm scheme the real
package's TTLV tag matching uses), `.operation`, `.status`, `.reason`,
`.message`. The real class also carries `.payload`/`.raw` (actual TTLV
tree nodes) — this shim has no TTLV tree (the hub engine returns a flat,
already-decoded `summary` dict, not wire bytes), so those two fields are
always None here. Nothing in the real sample reads them directly (only
through `.get(tag)`), so this is invisible to real sample code.

BYTESTRING CONVENTION: identical to the real client — `bytes` arguments are
hex-encoded before crossing to the engine, and any ByteString-shaped result
field comes back as a hex STRING, never raw bytes (samples call
`bytes.fromhex(...)` themselves, exactly as they do against the real
client).

ALGORITHM NAME NORMALIZATION: the real KMIP server accepts "ML_DSA_65",
"ML-DSA-65", "ML DSA 65" interchangeably (its `_norm()` strips everything
but alphanumerics before an enum-table lookup — confirmed from the real
client's source). The hub's engine expects hyphenated names ("ML-DSA-65" —
confirmed from KmipPlaygroundView.tsx's own calls). This shim normalizes
the SAME way the real server does internally, invisibly to callers, so a
script written with the sandbox's own underscore convention
("ML_DSA_65", as 17-kmip-cacp.py actually uses) still resolves correctly.
"""
import json
import re

RESULT_SUCCESS = 0
RESULT_OP_FAILED = 1
RESULT_OP_PENDING = 2
RESULT_OP_UNDONE = 3


def _get_bridge():
    # See p11/__init__.py's identical helper for why this is a private
    # indirection rather than a module-scope `from js import kmip_bridge`.
    import kmip_bridge
    return kmip_bridge


# ── Real KMIP 3.0 request grammar (dev-tabs Python-grammar-realignment plan,
# Phase 1) — leaf()/struct() build a real KMIP request payload: real
# Attribute names (KMIP 3.0 Sec.3/Sec.4, e.g. 'CryptographicAlgorithm') and
# real Item Types (Sec.9.1.1 — 'Enumeration', 'Integer', 'TextString', ...),
# the same shape pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/_ttlv.py's
# own leaf()/struct() build requests with (that module is the real client's
# own request-building layer, not invented here). `struct` names a KMIP
# Structure (a field that groups other fields, e.g. Attributes,
# CryptographicParameters); `leaf` names the opposite case — a single
# named field with one value.
def leaf(tag, ttlv_type, value):
    """One request field: `tag` (a real KMIP Attribute/field name, e.g.
    'CryptographicAlgorithm'), `ttlv_type` (one of the 11 KMIP 3.0 Sec.9.1.1
    item types — 'Enumeration', 'Integer', 'TextString', 'ByteString',
    'Boolean', ...), `value`."""
    return {'tag': tag, 'type': ttlv_type, 'value': value}


def struct(tag, *children):
    """A KMIP Structure field: `tag` plus its nested leaf()/struct() fields —
    e.g. struct('Attributes', leaf('CryptographicAlgorithm', ...), ...)."""
    return {'tag': tag, 'type': 'Structure', 'children': list(children)}


def find(node, tag):
    """First descendant (breadth-first) of a response `.payload` tree whose
    tag matches — mirrors the real client's own `_ttlv.find()`. Punctuation/
    spacing-insensitive (same `_norm()` the rest of this shim already uses
    for `.get(tag)`) because a decoded response's tag names come back in
    their spec DISPLAY form ('Unique Identifier', with a space) — not the
    no-space PascalCase leaf()/struct() calls use on the request side."""
    if node is None:
        return None
    want = _norm(tag)
    queue = [node]
    while queue:
        n = queue.pop(0)
        if _norm(n.get('tag') or '') == want:
            return n
        queue.extend(n.get('children') or [])
    return None


def find_all(node, tag):
    """Every descendant whose tag matches — mirrors `_ttlv.find_all()`.
    Needed for a response that legitimately repeats a tag (e.g. Locate's
    UniqueIdentifier, once per matching object) — `KmipResult.get()` only
    ever surfaces the first one."""
    if node is None:
        return []
    want = _norm(tag)
    out = []
    queue = [node]
    while queue:
        n = queue.pop(0)
        if _norm(n.get('tag') or '') == want:
            out.append(n)
        queue.extend(n.get('children') or [])
    return out


def _flatten_response(node, out):
    """Walk a decoded response tree into a flat {tag: value} dict, so
    `KmipResult.get(tag)` works the same way for `submit()` as it already
    does for every friendly op method below."""
    if not node:
        return out
    tag = node.get('tag')
    if tag is not None and 'value' in node and node.get('value') is not None:
        out.setdefault(tag, node['value'])
    for child in node.get('children') or []:
        _flatten_response(child, out)
    return out


# Hub KmipEngine `summary` key -> real KMIP tag name, confirmed by reading
# every runOp call site in src/components/Playground/kmip/*.tsx that reads
# a summary field (KmipPlaygroundView.tsx, migration/MigrationKeyCard.tsx):
#   privateKeyUid/publicKeyUid (CreateKeyPair), uid (Create, and ALSO
#   Encapsulate/Decapsulate's own derived-secret object id — confirmed at
#   MigrationKeyCard.tsx's onEstablish/onDecapsulate, which is exactly the
#   field 17-kmip-cacp.py's shared-secret comparison needs via
#   enc.get("UniqueIdentifier")/dec.get("UniqueIdentifier")), signatureHex
#   (Sign), ciphertextHex (Encapsulate's own Data field, and Encrypt),
#   keyMaterialHex (Get). NOT a fuzzy/normalized match against the KMIP tag
#   name — "privateKeyUid" and "PrivateKeyUniqueIdentifier" share no
#   sub-string relationship punctuation-stripping could ever bridge, so
#   this has to be an explicit table, not a derived one.
_SUMMARY_TO_TAG = {
    'privateKeyUid': 'PrivateKeyUniqueIdentifier',
    'publicKeyUid': 'PublicKeyUniqueIdentifier',
    'uid': 'UniqueIdentifier',
    'signatureHex': 'SignatureData',
    'ciphertextHex': 'Data',
    'tagHex': 'AuthenticatedEncryptionTag',
    'ivHex': 'IvCounterNonce',
    'keyMaterialHex': 'KeyMaterial',
    'validityIndicator': 'ValidityIndicator',
    'plaintextHex': 'Data',
}


def _translate_summary(summary):
    out = {}
    for k, v in (summary or {}).items():
        out[_SUMMARY_TO_TAG.get(k, k)] = v
    return out


def _norm(s):
    """Strip everything but alphanumerics — the same tag/enum matching
    convention the real client's _norm() uses (case still matters, only
    punctuation/spacing is stripped)."""
    return re.sub(r'[^0-9A-Za-z]', '', s)


def _normalize_algorithm(name):
    """'ML_DSA_65' / 'ML DSA 65' -> 'ML-DSA-65' (the hub engine's own
    convention) — same invisible normalization the real KMIP server does
    internally against its own enum table, just a different target
    spelling. Only touches known ML-*/SLH-DSA family names; anything else
    passes through unchanged (the hub engine's own error surfaces if it
    doesn't recognize it, exactly as it would for a typo against the real
    server's table)."""
    if name is None:
        return None
    parts = re.split(r'[-_\s]+', name)
    if len(parts) >= 2 and parts[0].upper() in ('ML', 'SLH'):
        return '-'.join(p.upper() if i < 2 else p for i, p in enumerate(parts))
    return name


class KmipResult:
    """Mirrors the real pqctoday_kmip.KmipResult dataclass's public surface."""

    def __init__(self, operation, status, reason=None, message=None, fields=None, tree=None):
        self.operation = operation
        self.status = status
        self.reason = reason
        self.message = message
        # `tree` is the response's real decoded fields, tag names already
        # resolved — populated by submit() (the real-grammar path, which
        # genuinely has one), still None for every friendly op method below
        # (matching the module docstring's original note: this shim has no
        # response tree from THOSE calls). find()/find_all() below walk
        # this — needed for e.g. Locate, whose response repeats
        # UniqueIdentifier once per match, which a flat {tag: value} dict
        # (what `.get()` reads) can only ever hold one of.
        self.payload = tree
        self.raw = None
        self._fields = fields or {}

    @property
    def ok(self):
        return self.status == RESULT_SUCCESS

    def get(self, tag):
        """First value whose KEY matches `tag` under _norm() — mirrors the
        real client's punctuation/case-insensitive-ish TTLV tag BFS, just
        over a flat dict instead of a tree (this shim has no nested
        structure to walk; every field the hub engine's `summary` exposes
        is already flat)."""
        target = _norm(tag)
        for k, v in self._fields.items():
            if _norm(k) == target:
                return v
        return None

    def __str__(self):
        if self.ok:
            return f'{self.operation}: SUCCESS'
        extra = self.message or (f'reason={self.reason}' if self.reason is not None else '')
        return f'{self.operation}: FAILED ({extra})'


class KmipClient:
    """Mirrors the real pqctoday_kmip.KmipClient's public surface — see
    module docstring for exactly what differs and why."""

    def __init__(self, host='127.0.0.1', port=5696, *, timeout=5.0,
                 insecure=True, ca_cert=None, username=None, password=None,
                 client_cert=None, client_key=None):
        # All accepted for signature parity with the real client; none used
        # (see module docstring — there is no real transport here).
        self.host = host
        self.port = port
        self.timeout = timeout
        self.username = username
        self.password = password
        self._bridge = _get_bridge()

    # ── channel assurance (needs a real TLS handshake — not available) ──────
    @staticmethod
    def openssl_is_hybrid_capable():
        raise NotImplementedError(
            'openssl_is_hybrid_capable() needs a real OpenSSL binding — use the dev sandbox.'
        )

    def negotiated_group(self):
        raise NotImplementedError(
            'negotiated_group() needs a real TLS handshake — use the dev sandbox.'
        )

    def assert_quantum_safe_channel(self):
        raise NotImplementedError(
            'assert_quantum_safe_channel() needs a real TLS handshake — use the dev sandbox.'
        )

    # ── HUB-ONLY policy-plane convenience (dev-tabs-pkcs11-kmip plan D3) ────
    # NOT part of the real pqctoday_kmip.KmipClient. On the real system,
    # loading/dry-running a policy is a separate REST/mTLS AdminClient call
    # (pqctoday-hsm/kmip/python-client's admin.py) — a different connection
    # to a different port than the KMIP data-plane calls above. Collapsed
    # onto this one object here purely for the Developer tab's pipeline
    # builder, which teaches the crypto-agility POLICY PLANE as first-class
    # steps (D3) without asking a learner to juggle two client objects for
    # what is, in the browser, one and the same in-page engine anyway.
    def load_policy(self, yaml_text):
        raw = self._bridge.loadPolicyJson(yaml_text)
        r = json.loads(raw)
        status = RESULT_SUCCESS if r.get('ok') else RESULT_OP_FAILED
        fields = {}
        if r.get('warnings'):
            fields['Warnings'] = r['warnings']
        return KmipResult(operation='LoadPolicy', status=status,
                           message=r.get('error'), fields=fields)

    def dry_run(self, op, algorithm=None, **kwargs):
        spec = {'op': op}
        if algorithm is not None:
            spec['algorithm'] = _normalize_algorithm(algorithm)
        spec.update(kwargs)
        raw = self._bridge.dryRunJson(json.dumps(spec))
        r = json.loads(raw)
        fields = {
            'Kind': r.get('kind'),
            'Algorithm': r.get('algorithm'),
            'Reason': r.get('reason') or r.get('denyReason'),
            'Rule': r.get('rule'),
        }
        # dry_run has no ok/fail concept on the real system either way — it
        # always "succeeds" at telling you what WOULD happen (Allow/Deny/Rekey
        # are all valid answers, not error states).
        return KmipResult(operation='DryRun', status=RESULT_SUCCESS, fields=fields)

    def policy_status(self):
        raw = self._bridge.policyStatusJson()
        r = json.loads(raw)
        fields = {
            'Active': r.get('active'),
            'Name': r.get('name'),
            'Fingerprint': r.get('fingerprint'),
            'Rules': r.get('rules'),
        }
        return KmipResult(operation='PolicyStatus', status=RESULT_SUCCESS, fields=fields)

    def serve_as_endpoint(self, on_message=None, *, max_messages=64,
                           speaks_versions=((3, 0),),
                           handles_operations=('Notify', 'Put'),
                           include_control=False):
        raise NotImplementedError(
            'serve_as_endpoint() needs a real listening socket — use the dev sandbox.'
        )

    # ── real KMIP 3.0 grammar (Phase 1 — see leaf()/struct() above) ─────────
    def submit(self, operation, *payload):
        """Send `operation` (a real KMIP 3.0 Operation name, e.g.
        'CreateKeyPair') with `payload` (leaf()/struct() nodes making up
        the RequestPayload) as a real KMIP 3.0 request — the same
        RequestHeader{ProtocolVersion} + BatchItem{Operation,
        RequestPayload} envelope real_client.request() builds, encoded and
        dispatched through the SAME decode -> policy -> engine -> encode
        path a real KMIP/CACP server request
        takes (not a shortcut through the friendly op vocabulary the other
        methods on this class use). Not part of the real
        pqctoday_kmip.KmipClient's public surface under this exact name —
        the real client's equivalent is `request()`; this hub-only
        addition exists so the Developer tab's generated script can show
        real KMIP grammar without needing a matching change upstream
        first (see the 2026-08-30 plan doc's Phase 1)."""
        raw = self._bridge.submitOpJson(operation, json.dumps(list(payload)))
        r = json.loads(raw)
        status = RESULT_SUCCESS if r.get('ok') else RESULT_OP_FAILED
        tree = r.get('namedResponseTree')
        fields = _flatten_response(tree, {})
        return KmipResult(operation=operation, status=status,
                           reason=r.get('resultReason'), message=r.get('resultMessage'),
                           fields=fields, tree=tree)

    # ── core dispatch ────────────────────────────────────────────────────────
    def _run(self, op_dict):
        raw = self._bridge.runOpJson(json.dumps(op_dict))
        r = json.loads(raw)
        status = RESULT_SUCCESS if r.get('ok') else RESULT_OP_FAILED
        fields = _translate_summary(r.get('summary'))
        # Also reachable via .get("ResultReason")/.get("ResultMessage") —
        # expect_deny()'s pass/fail only depends on `not result.ok`, but its
        # printed detail reads these through .get(), not the .reason/.message
        # attributes directly, so both paths need to work.
        if r.get('resultReason') is not None:
            fields.setdefault('ResultReason', r.get('resultReason'))
        if r.get('message') is not None:
            fields.setdefault('ResultMessage', r.get('message'))
        return KmipResult(
            operation=op_dict.get('op'),
            status=status,
            reason=r.get('resultReason'),
            message=r.get('message'),
            fields=fields,
        )

    # ── operations ───────────────────────────────────────────────────────────
    def create_symmetric(self, algorithm='AES', length=256, name=None, usage='Encrypt Decrypt'):
        spec = {'op': 'Create', 'algorithm': _normalize_algorithm(algorithm), 'length': length}
        if name is not None:
            spec['name'] = name
        return self._run(spec)

    def create_key_pair(self, algorithm, usage):
        return self._run({'op': 'CreateKeyPair', 'algorithm': _normalize_algorithm(algorithm)})

    def activate(self, uid):
        return self._run({'op': 'Activate', 'uid': uid})

    def get(self, uid, key_format_type=None):
        return self._run({'op': 'Get', 'uid': uid})

    def get_attributes(self, uid):
        # NOT routed through Get: confirmed live (dev-tabs-pkcs11-kmip plan
        # P3) that Get legitimately REFUSES a non-extractable private key's
        # material ("KMIP NotExtractable... material is held by the engine
        # and is not extractable") — correct engine behavior, but it made
        # get_attributes() on a signing key fail even though a real
        # GetAttributes never touches key material at all. listObjects()
        # (metadata-only: algorithm/length/state/name/usageMask, no key
        # material — see KmipObject in kmipEngine.ts) is what actually
        # matches GetAttributes' real semantics, so that is the surface
        # this uses.
        objects = json.loads(self._bridge.listObjectsJson())
        match = next((o for o in objects if o.get('uid') == uid), None)
        if match is None:
            return KmipResult(operation='GetAttributes', status=RESULT_OP_FAILED,
                               message=f'object not found: {uid}')
        fields = {
            'UniqueIdentifier': match.get('uid'),
            'ObjectType': match.get('objectType'),
            'CryptographicAlgorithm': match.get('algorithm'),
            'CryptographicLength': match.get('length'),
            'State': match.get('state'),
            'Name': match.get('name'),
            'CryptographicUsageMask': match.get('usageMask'),
        }
        return KmipResult(operation='GetAttributes', status=RESULT_SUCCESS, fields=fields)

    def encrypt(self, uid, data, *, block_cipher_mode=None, iv=None):
        spec = {'op': 'Encrypt', 'uid': uid, **_bytes_to_spec_field(data)}
        if iv is not None:
            spec['ivHex'] = iv.hex() if isinstance(iv, (bytes, bytearray)) else iv
        return self._run(spec)

    def sign(self, uid, data, algorithm):
        return self._run({
            'op': 'Sign', 'uid': uid,
            **_bytes_to_spec_field(data),
            'algorithm': _normalize_algorithm(algorithm),
        })

    def signature_verify(self, uid, data, signature, algorithm=None):
        sig_hex = signature.hex() if isinstance(signature, (bytes, bytearray)) else signature
        spec = {'op': 'SignatureVerify', 'uid': uid, **_bytes_to_spec_field(data), 'signature': sig_hex}
        if algorithm is not None:
            spec['algorithm'] = _normalize_algorithm(algorithm)
        return self._run(spec)

    @staticmethod
    def validity(result):
        v = result.get('ValidityIndicator')
        if v is None:
            return None
        return {1: 'Valid', 2: 'Invalid', 3: 'Unknown'}.get(v, 'Unknown')

    def register(self, key_material, *, algorithm='AES', length=None, usage='Encrypt Decrypt',
                 name=None, key_format_type='Raw'):
        if length is not None and length != len(key_material) * 8:
            raise ValueError(
                f'length={length} disagrees with len(key_material)*8={len(key_material) * 8}'
            )
        raise NotImplementedError(
            'register() is not part of the hub Developer tab\'s KMIP vocabulary '
            '(D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )

    def encapsulate(self, uid):
        return self._run({'op': 'Encapsulate', 'uid': uid})

    def decapsulate(self, uid, ciphertext):
        ct_hex = ciphertext.hex() if isinstance(ciphertext, (bytes, bytearray)) else ciphertext
        return self._run({'op': 'Decapsulate', 'uid': uid, 'data': ct_hex})

    def destroy(self, uid):
        return self._run({'op': 'Destroy', 'uid': uid})

    def revoke(self, uid, reason='Unspecified'):
        return self._run({'op': 'Revoke', 'uid': uid})

    def locate(self):
        return self._run({'op': 'Locate'})

    def get_usage_allocation(self, uid, usage_limits_count=None):
        raise NotImplementedError(
            'get_usage_allocation() is not part of the hub Developer tab\'s KMIP '
            'vocabulary (D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )

    def get_constraints(self):
        raise NotImplementedError(
            'get_constraints() is not part of the hub Developer tab\'s KMIP '
            'vocabulary (D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )

    def set_endpoint_role(self, role='Server'):
        raise NotImplementedError('set_endpoint_role() needs a real connection — use the dev sandbox.')

    def set_defaults(self, object_type, name=None):
        raise NotImplementedError(
            'set_defaults() is not part of the hub Developer tab\'s KMIP vocabulary '
            '(D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )

    def derive_key(self, base_uid, *, derivation_data, object_type='SymmetricKey',
                    method='NIST800-108-C', algorithm='AES', length=256,
                    usage='Encrypt Decrypt'):
        raise NotImplementedError(
            'derive_key() is not part of the hub Developer tab\'s KMIP vocabulary '
            '(D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )

    def rekey(self, uid, *, offset=None):
        raise NotImplementedError(
            'rekey() is not part of the hub Developer tab\'s KMIP vocabulary '
            '(D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )

    def rekey_key_pair(self, uid, *, offset=None):
        raise NotImplementedError(
            'rekey_key_pair() is not part of the hub Developer tab\'s KMIP vocabulary '
            '(D3 scope: lifecycle + policy steps) — use the dev sandbox.'
        )


def _bytes_to_spec_field(data):
    """Real gap closed 2026-08-28 (dev-tabs-pkcs11-kmip plan G9, W3b): the
    comment this replaced said the engine had no hex Data field for Sign/
    Encrypt and could only take UTF-8 `text` — checked directly against the
    engine's own Rust source (wasm/src/lib.rs, `spec_bytes(spec, "data",
    "text")`, used identically for both Sign and Encrypt) and that was
    already wrong: `data` (hex) is read in PREFERENCE to `text`, has been
    since before this shim existed. Returns the one spec field to set:
    `{'text': ...}` for genuinely UTF-8 content (keeps generated scripts and
    engine logs human-readable — no behavior change from before), `{'data':
    ...}` (hex) for anything that isn't, which the engine already accepts
    for Sign and Encrypt exactly like it already did for Decapsulate/
    Decrypt's ciphertext. No more NotImplementedError — there was nothing to
    implement, the capability already existed."""
    if isinstance(data, str):
        return {'text': data}
    try:
        return {'text': data.decode('utf-8')}
    except UnicodeDecodeError:
        return {'data': data.hex()}
