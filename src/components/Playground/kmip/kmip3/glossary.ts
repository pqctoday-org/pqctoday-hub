// SPDX-License-Identifier: GPL-3.0-only
//
// glossary.ts — the KMIP 3.0 Command Lab's "explain everything" data layer:
// wire-tag meanings (ported from the design handoff's cacp3-glossary.js,
// cross-checked entry-by-entry against kmipMeta.ts's TAG_NAMES — a hex
// codepoint is included only where that check passed; unverified tags carry
// name + meaning only, never an invented codepoint) and broader protocol/PQC
// concept terms. Shared by `Term`, `GlossaryRail`, and `WireTreeView`'s
// `annotated` mode.

export interface TagGlossaryEntry {
  /** Verified KMIP 3.0 TTLV codepoint (0x42xxxx) — omitted when not
   * cross-checked against `kmipMeta.ts`'s `TAG_NAMES` table. */
  hex?: string
  def: string
}

/** Keyed by the human tag name — the shape `tagName()` in `kmipMeta.ts`
 * returns and `opTemplates.ts`/`nodes.ts` use (e.g. `leaf('UniqueIdentifier', ...)`). */
export const TAG_GLOSSARY: Record<string, TagGlossaryEntry> = {
  Attribute: {
    hex: '0x420008',
    def: 'A single named property attached to a managed object — its algorithm, usage mask, or a custom governance tag.',
  },
  AttributeName: { hex: '0x42000A', def: 'The name half of an Attribute pair.' },
  AttributeValue: { hex: '0x42000B', def: 'The value half of an Attribute pair.' },
  BatchItem: {
    hex: '0x42000F',
    def: 'One operation inside a batch — a single Request/Response Message can carry several of these in one wire round trip.',
  },
  BatchErrorContinuationOption: {
    hex: '0x42000E',
    def: 'How a batch handles a failed item: Continue (run them all), Stop (halt at the first failure), or Undo (halt AND roll back earlier successes).',
  },
  CryptographicAlgorithm: {
    hex: '0x420028',
    def: 'Which algorithm this object or operation uses — the single field crypto-agility hinges on. Swap this value and everything downstream (key/signature/ciphertext sizes) follows.',
  },
  CryptographicLength: {
    hex: '0x42002A',
    def: 'Key size in bits (256 for AES-256, 3072 for RSA-3072). PQC parameter sets like ML-DSA-65 already fix this, so it is often omitted.',
  },
  CryptographicUsageMask: {
    hex: '0x42002C',
    def: 'A bitmask of what the key may be used for — Sign, Verify, Encrypt, Decrypt, KeyAgreement, … The server enforces this at every operation, independent of any Plane-1 policy.',
  },
  CryptographicParameters: {
    def: "Mechanism-level overrides for an operation — padding, block mode, hash, or (for Sign) an explicit algorithm — layered on top of the key's own CryptographicAlgorithm.",
  },
  Data: {
    hex: '0x4200C2',
    def: 'The actual bytes being operated on — plaintext to Encrypt, a message to Sign, a KEM ciphertext to Decapsulate. Carried as a ByteString (hex on the wire).',
  },
  IVCounterNonce: {
    hex: '0x42003D',
    def: 'The initialization vector / nonce for a symmetric mode like AES-GCM. Must travel with the ciphertext — the recipient needs it to decrypt.',
  },
  KeyBlock: {
    hex: '0x420040',
    def: "The structure wrapping a key's actual bytes plus the metadata (format, algorithm, length) needed to interpret them.",
  },
  KeyFormatType: {
    hex: '0x420042',
    def: 'How the key material inside KeyBlock is encoded — Raw, PKCS#1, PKCS#8, TransparentECPublicKey, …',
  },
  KeyMaterial: { hex: '0x420043', def: 'The raw key bytes themselves, inside KeyValue.' },
  KeyValue: {
    hex: '0x420045',
    def: 'Wraps KeyMaterial (and, for a private key, may wrap it again for wire-level protection).',
  },
  Key: { hex: '0x42003F', def: 'Generic container tag for key data in some response shapes.' },
  ObjectType: {
    hex: '0x420057',
    def: 'What kind of managed object this is — SymmetricKey, PublicKey, PrivateKey, Certificate, SecretData, OpaqueObject, SplitKey.',
  },
  Operation: { hex: '0x42005C', def: 'Which of the KMIP 3.0 operations this batch item invokes.' },
  ProtocolVersion: {
    hex: '0x420069',
    def: 'The KMIP protocol version client and server negotiate.',
  },
  ProtocolVersionMajor: { hex: '0x42006A', def: 'Major version — 3 here.' },
  ProtocolVersionMinor: { hex: '0x42006B', def: 'Minor version — 0 here (draft WD19).' },
  QueryFunction: {
    hex: '0x420074',
    def: "Which category of server capability you're asking about — QueryOperations, QueryObjects, QueryServerInformation, …",
  },
  RequestHeader: {
    hex: '0x420077',
    def: 'The envelope wrapping every request: protocol version, batch count, and options.',
  },
  RequestMessage: { hex: '0x420078', def: 'The outermost element of any KMIP request.' },
  RequestPayload: {
    hex: '0x420079',
    def: 'The operation-specific fields — shaped completely differently from op to op.',
  },
  ResponseHeader: {
    hex: '0x42007A',
    def: "The response's mirror of the request header: protocol version, timestamp, batch count.",
  },
  ResponseMessage: { hex: '0x42007B', def: 'The outermost element of any KMIP response.' },
  ResponsePayload: { hex: '0x42007C', def: 'The operation-specific result fields.' },
  ResultMessage: {
    hex: '0x42007D',
    def: 'A human-readable string explaining the ResultStatus, when present.',
  },
  ResultReason: {
    hex: '0x42007E',
    def: 'WHY an operation failed — a specific enumerated cause (PermissionDenied, OperationNotSupported, InvalidMessage, …) distinct from the pass/fail ResultStatus.',
  },
  ResultStatus: {
    hex: '0x42007F',
    def: 'Did the operation succeed? Success, Operation Failed, Operation Pending, or Operation Undone (the last only appears inside a batch rolled back by Undo continuation).',
  },
  RevocationReason: { hex: '0x420081', def: 'Wraps the reason code Revoke records against a key.' },
  RevocationReasonCode: {
    hex: '0x420082',
    def: "Why a key was revoked — required by Revoke, kept in the object's history.",
  },
  ServerInformation: {
    hex: '0x420088',
    def: 'Vendor-specific server metadata returned by Query.',
  },
  State: {
    hex: '0x42008D',
    def: 'Where this object sits in the KMIP lifecycle: Pre-Active → Active → Deactivated → Compromised → Destroyed. Several operations are gated purely by this — Sign requires Active regardless of any policy.',
  },
  SymmetricKey: {
    hex: '0x42008F',
    def: 'The managed-object container for a symmetric key, holding a KeyBlock.',
  },
  PublicKey: { hex: '0x42006D', def: 'The managed-object container for a public key.' },
  PrivateKey: { hex: '0x420064', def: 'The managed-object container for a private key.' },
  TimeStamp: { hex: '0x420092', def: 'When the response was generated, server-side.' },
  UniqueIdentifier: {
    hex: '0x420094',
    def: 'The server-assigned handle for a managed object — opaque to the client, used in every later request that touches this object. CreateKeyPair returns two: one for the private key, one for the public key.',
  },
  ValidityIndicator: {
    hex: '0x42009B',
    def: "SignatureVerify's or Validate's answer: Valid, Invalid, or Unknown — the one field your verification code should actually branch on. For Validate specifically, Unknown means \"couldn't be affirmed\" (e.g. the chain's issuer wasn't supplied) — never a false Valid.",
  },
  VendorIdentification: {
    hex: '0x42009D',
    def: 'A free-text string identifying the server implementation, returned by Query.',
  },
  CommonAttributes: {
    hex: '0x420126',
    def: 'For CreateKeyPair: attributes shared by both halves of the pair (e.g. the algorithm both keys must agree on).',
  },
  PrivateKeyAttributes: {
    hex: '0x420127',
    def: 'CreateKeyPair attributes that apply only to the private half.',
  },
  PublicKeyAttributes: {
    hex: '0x420128',
    def: 'CreateKeyPair attributes that apply only to the public half.',
  },
  Attributes: {
    hex: '0x420125',
    def: 'A named bundle of Attribute values attached at object creation, or fetched via GetAttributes.',
  },
  Name: {
    hex: '0x420053',
    def: "A human-assigned label for a managed object — distinct from its UniqueIdentifier, purely for the operator's convenience.",
  },
  SignatureData: {
    hex: '0x4200C3',
    def: 'The actual signature bytes Sign returns / SignatureVerify checks — the field whose size jumps hardest under PQC.',
  },
  Modulus: {
    hex: '0x420052',
    def: 'RSA-specific key component, visible when a key is exported/registered in a transparent (non-opaque) key format.',
  },
  PrivateExponent: { hex: '0x420063', def: 'RSA-specific private key component.' },
  PublicExponent: {
    hex: '0x42006C',
    def: 'RSA-specific public key component — conventionally 65537.',
  },
  // Tags used by the Reference tab's op forms that aren't in the verified
  // hex table — shown with name + meaning only, no invented codepoint.
  LeaseTime: {
    def: 'How long (seconds) a Login session stays valid before re-authentication is required.',
  },
  RequestCount: { def: 'Caps how many requests a leased Login session may make.' },
  Ticket: {
    def: 'An opaque session credential returned by Login and presented on Logout / later requests.',
  },
  LogMessage: {
    def: 'Free-text diagnostic string carried by Log — for client-side event forwarding, not policy-relevant.',
  },
  CredentialType: {
    def: 'Which credential shape follows — UsernameAndPassword here; KMIP also defines device and attestation credential types.',
  },
  PasswordCredential: { def: 'The username+password pair for CreateCredential / Login.' },
  Username: { def: "The credential's username field." },
  Password: { def: "The credential's password field." },
  EndpointRole: {
    def: 'Declares whether this endpoint is acting as a Server or Client — relevant for peer-to-peer KMIP deployments.',
  },
  DerivationMethod: {
    def: 'Which KDF DeriveKey uses to turn a base key into a new one — e.g. NIST SP 800-108 Counter Mode.',
  },
  DerivationParameters: { def: "Wraps the KDF's inputs for DeriveKey." },
  DerivationData: { def: 'The KDF’s label/context bytes mixed into the derivation.' },
  Offset: {
    def: "For ReKey/ReKeyKeyPair: seconds after now to set the new key's activation date — lets you pre-provision a successor key. Re-certify reuses the same tag the same way, for the renewed certificate's activation date.",
  },
  Certificate: {
    hex: '0x420013',
    def: 'One candidate in the chain Validate checks — an outer wrapper around the raw CertificateValue DER.',
  },
  CertificateValue: {
    hex: '0x42001E',
    def: 'The actual X.509 certificate, DER-encoded — what a browser or `openssl x509` would parse.',
  },
  CertificateRequest: {
    hex: '0x420018',
    def: 'The inbound PKCS#10 CSR (Certificate Signing Request), DER-encoded — see CSR below.',
  },
  CertificateRequestType: {
    hex: '0x420019',
    def: 'Which CSR format follows — this server only accepts PKCS10; CRMF and PEM are recognized codepoints but not implemented.',
  },
  ValidityDate: {
    hex: '0x42009A',
    def: 'The instant Validate checks each certificate\'s not-before/not-after window against — omit it to mean "now".',
  },
  CSR: {
    def: "Certificate Signing Request (PKCS#10, RFC 2986) — a subject's public key plus a self-signature proving they hold the matching private key, submitted to a CA for issuance. Certify verifies that self-signature before issuing.",
  },
  'trust anchor': {
    def: "A self-signed (root) certificate a validator is willing to trust without further checking — Validate's chain must terminate in one PRESENT IN THE SUPPLIED SET (this server holds no separate trust-anchor store) to return Valid.",
  },
  'chain validation': {
    def: "Confirming a certificate chain both parses and cryptographically checks out: every non-root certificate's signature verifies against its issuer's public key, every certificate is within its validity window, and the chain reaches a trust anchor.",
  },
  DataLength: { def: 'How many random bytes to return from RNGRetrieve.' },
  PKCS11Function: {
    def: 'The specific PKCS#11 (Cryptoki) C function being invoked through the passthrough operation.',
  },
  PKCS11InputParameters: { def: "That function's raw input parameters." },
  HashingAlgorithm: {
    def: "Which hash function Hash (or a signature's mechanism parameters) should use — SHA-256, SHA-384, SHA-3, …",
  },
  MACData: { def: 'The MAC tag MACVerify checks against a freshly-computed one.' },
  AdjustmentType: {
    def: "AdjustAttribute's arithmetic operator: Increment, Decrement, or Negate.",
  },
  AdjustmentValue: { def: 'The amount to adjust by, if not the implicit default of 1.' },
  AttributeReference: { def: 'Which attribute (by name) an Attributes operation targets.' },
  NewAttribute: {
    def: 'The replacement value wrapper used by AddAttribute / ModifyAttribute / SetAttribute.',
  },
  ReplaceExisting: {
    def: "Import's flag for whether to overwrite an object already registered under the same UID.",
  },
  UsageLimitsCount: {
    def: 'How many more operations (or bytes) this key is permitted before the server retires it.',
  },
  DefaultsInformation: { def: "SetDefaults' payload wrapper." },
  ObjectDefaults: {
    def: 'The attribute defaults the server should apply to future objects of a given type.',
  },
}

export type TermCategory = 'wire' | 'protocol' | 'pqc'

export interface GlossaryTerm {
  id: string
  label: string
  cat: TermCategory
  def: string
}

/** Broader protocol/crypto concepts, not tied to one wire tag. */
export const TERMS: GlossaryTerm[] = [
  {
    id: 'ttlv',
    label: 'TTLV',
    cat: 'wire',
    def: 'Tag-Type-Length-Value — the binary wire encoding every KMIP message uses: each field is a tag (what), a type (how to read it), a length, then the value bytes.',
  },
  {
    id: 'managed-object',
    label: 'Managed object',
    cat: 'protocol',
    def: 'Anything the server tracks with its own UniqueIdentifier and lifecycle State — a key, a certificate, a secret, an opaque blob.',
  },
  {
    id: 'op-vs-payload',
    label: 'Operation vs. Payload',
    cat: 'protocol',
    def: 'A request names an Operation (e.g. Sign) and carries one RequestPayload shaped specifically for it — payload fields differ completely from op to op.',
  },
  {
    id: 'batch',
    label: 'Batch',
    cat: 'protocol',
    def: 'One Request Message can carry several Batch Items, each its own operation, submitted — and, depending on continuation option, rolled back — together: a single wire round trip, not N of them.',
  },
  {
    id: 'lifecycle',
    label: 'Object lifecycle state',
    cat: 'protocol',
    def: 'Pre-Active → Active → Deactivated → Compromised → Destroyed. Several operations are gated purely by state — e.g. Sign requires Active — independent of any Plane-1 policy decision.',
  },
  {
    id: 'agility',
    label: 'Crypto-agility',
    cat: 'protocol',
    def: 'Architecting so the algorithm is a swappable parameter, not something baked into your integration code.',
  },
  {
    id: 'kem',
    label: 'KEM (Key Encapsulation Mechanism)',
    cat: 'pqc',
    def: "A primitive shaped as Encapsulate (recipient's public key → ciphertext + shared secret) / Decapsulate (ciphertext + private key → the same shared secret). ML-KEM is a KEM; classical Diffie-Hellman is not — it's a different shape entirely.",
  },
  {
    id: 'lattice',
    label: 'Lattice-based cryptography',
    cat: 'pqc',
    def: 'Security rests on the hardness of geometry problems in high-dimensional lattices (e.g. Learning With Errors) — believed hard even for a quantum computer. ML-KEM and ML-DSA are lattice-based.',
  },
  {
    id: 'hash-based',
    label: 'Hash-based signature',
    cat: 'pqc',
    def: "Security rests on nothing but the hash function's own security (preimage/PRF-type properties, deliberately NOT collision resistance — the design is collision-resilient by construction) — the most conservative assumption class available. SLH-DSA is hash-based: tiny keys, large signatures.",
  },
  {
    id: 'hybrid',
    label: 'Hybrid / composite',
    cat: 'pqc',
    def: 'Running a classical and a PQC algorithm together so the construction stays secure even if one of the two is broken. KMIP 3.0 (WD19) has two first-class hybrid KEMs (X25519MLKEM768, SecP256r1MLKEM768); hybrid signatures have no native KMIP algorithm yet.',
  },
  {
    id: 'shor',
    label: "Shor's algorithm",
    cat: 'pqc',
    def: 'A quantum algorithm giving an exponential speedup at integer factorization and discrete logarithms — breaks RSA, ECDSA, ECDH outright once a large enough quantum computer exists. The reason asymmetric crypto must migrate.',
  },
  {
    id: 'grover',
    label: "Grover's algorithm",
    cat: 'pqc',
    def: "A quantum algorithm giving only a quadratic speedup at unstructured search — halves a symmetric key's effective strength. AES-256 loses headroom it already had to spare.",
  },
  {
    id: 'fips',
    label: 'FIPS 203 / 204 / 205',
    cat: 'pqc',
    def: "NIST's finalized PQC standards (Aug 2024): FIPS 203 = ML-KEM (key establishment), FIPS 204 = ML-DSA (signatures), FIPS 205 = SLH-DSA (hash-based signatures).",
  },
  {
    id: 'split-key',
    label: 'Split key (M-of-N shares)',
    cat: 'protocol',
    def: 'A key divided into N share objects where any M — the threshold — reconstruct it and fewer genuinely cannot (Create Split Key / Join Split Key, §6.1.12/§6.1.31). The polynomial methods are Shamir secret sharing; the XOR method needs every share.',
  },
  {
    id: 'threshold',
    label: 'Threshold',
    cat: 'protocol',
    def: 'The M in M-of-N secret sharing: the minimum number of shares that must combine to recover the split key. Below it, the shares reveal nothing about the key — that is the mathematical point of the scheme.',
  },
  {
    id: 'correlation-value',
    label: 'Asynchronous correlation value',
    cat: 'protocol',
    def: 'The claim ticket for an asynchronous job (§9.1): a server-generated byte string returned with OperationPending, later redeemed via Poll / Cancel / Process / Query Asynchronous Requests.',
  },
  {
    id: 'async-processing',
    label: 'Asynchronous processing',
    cat: 'protocol',
    def: "KMIP 3.0 §8.1.2: a request marked 'Asynchronous Indicator = Mandatory' is enqueued as a real background job instead of blocking — the response is OperationPending plus a correlation value, and Poll's eventual answer is identical to what the synchronous op would have returned.",
  },
  {
    id: 'rekey-sweep',
    label: 'ReKey sweep',
    cat: 'protocol',
    def: 'Migrating keys proactively with ReKey / ReKeyKeyPair rather than waiting for each key\'s first use — the "migrate all remaining" pass. With substitution-aware policies, the sweep retargets each key to its policy-chosen successor algorithm.',
  },
  {
    id: 'label-only',
    label: 'Label-only agility',
    cat: 'protocol',
    def: "The Migration estate's contract: the application passes only a business key NAME (e.g. firmware-release-signing); the active policy's name_pattern rules decide every crypto parameter. Flip the policy and the same labels resolve to quantum-safe algorithms.",
  },
  {
    id: 'zeroization',
    label: 'Zeroization / scrubbing',
    cat: 'protocol',
    def: 'Actually erasing key material — overwriting the bytes in memory and securely deleting them from storage — rather than merely marking the object Destroyed. "The key material SHALL be destroyed" is a claim about bytes, not about a status flag.',
  },
]

export const TERM_BY_ID: Record<string, GlossaryTerm> = Object.fromEntries(
  TERMS.map((t) => [t.id, t])
)

/** Resolve a glossary hover/pin key (a `TAG_GLOSSARY` tag name or a `TERMS` id)
 * to its definition, checking both namespaces (they never collide — tag names
 * are PascalCase, term ids are kebab-case). */
export const lookupGlossaryDef = (key: string): string | undefined =>
  // eslint-disable-next-line security/detect-object-injection -- read-only lookup against this module's own fixed glossary catalogs, never used to write; `key` is always a wire tag name or TERMS id, never raw user input.
  TAG_GLOSSARY[key]?.def ?? TERM_BY_ID[key]?.def
