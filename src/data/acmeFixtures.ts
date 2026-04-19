// SPDX-License-Identifier: GPL-3.0-only
/**
 * Mocked ACME server responses (RFC 8555) for the interactive walkthrough.
 * Transport is simulated; crypto (ML-DSA-65 keypair, CSR, signature) is real via softhsmv3.
 */

export interface AcmeStep {
  id: string
  title: string
  description: string
  /** ACME RFC 8555 section reference */
  rfc: string
  /** Educational sidebar content */
  sidebarLines: string[]
  /** Mock HTTP request shown to user */
  mockRequest?: { method: string; url: string; body?: object }
  /** Mock HTTP response shown to user */
  mockResponse?: { status: number; headers?: Record<string, string>; body?: object }
}

export const ACME_STEPS: AcmeStep[] = [
  {
    id: 'directory',
    title: 'Step 1 — Discover the ACME Directory',
    description:
      'The client fetches the ACME server directory to discover endpoint URLs. This is the only unauthenticated request in the flow.',
    rfc: 'RFC 8555 §7.1.1',
    sidebarLines: [
      'The directory JSON tells your client where to send each request type.',
      'Always fetch the directory fresh — URLs can change between deployments.',
      'For PQC certs, look for "meta.externalAccountRequired" — some CAs require EAB for ML-DSA.',
    ],
    mockRequest: { method: 'GET', url: 'https://acme.example.com/directory' },
    mockResponse: {
      status: 200,
      body: {
        newNonce: 'https://acme.example.com/acme/new-nonce',
        newAccount: 'https://acme.example.com/acme/new-account',
        newOrder: 'https://acme.example.com/acme/new-order',
        newAuthz: 'https://acme.example.com/acme/new-authz',
        revokeCert: 'https://acme.example.com/acme/revoke-cert',
        keyChange: 'https://acme.example.com/acme/key-change',
        meta: { termsOfService: 'https://acme.example.com/terms', externalAccountRequired: false },
      },
    },
  },
  {
    id: 'account',
    title: 'Step 2 — Create / Locate Account',
    description:
      'The client registers an ACME account using its ML-DSA-65 public key. The server returns an account URL used to authenticate future requests.',
    rfc: 'RFC 8555 §7.3',
    sidebarLines: [
      'The account key is your long-term identity with the CA. Protect it.',
      'The JWS (JSON Web Signature) body is signed with your ML-DSA private key.',
      '"onlyReturnExisting: true" lets you look up an existing account without creating a new one.',
      'PQC note: Some CAs use "alg: ML-DSA-65" in the JWS header. IETF draft-ietf-acme-pqc documents the extension.',
    ],
    mockRequest: {
      method: 'POST',
      url: 'https://acme.example.com/acme/new-account',
      body: {
        protected: '<JWS header — alg: ML-DSA-65>',
        payload: { termsOfServiceAgreed: true },
        signature: '<ML-DSA-65 signature>',
      },
    },
    mockResponse: {
      status: 201,
      headers: { Location: 'https://acme.example.com/acme/acct/1' },
      body: { status: 'valid', contact: [], orders: 'https://acme.example.com/acme/acct/1/orders' },
    },
  },
  {
    id: 'order',
    title: 'Step 3 — Submit Order',
    description:
      'The client submits a certificate order listing the domain names it wants certified. The server returns an order object with authorization URLs.',
    rfc: 'RFC 8555 §7.4',
    sidebarLines: [
      'The "identifiers" array lists each domain name. Wildcards (*.example.com) require DNS-01 challenges.',
      'The server responds with "authorizations" — one per identifier — and a "finalize" URL.',
      'Order expiry is typically short (minutes to hours). Start the challenge flow immediately.',
    ],
    mockRequest: {
      method: 'POST',
      url: 'https://acme.example.com/acme/new-order',
      body: { identifiers: [{ type: 'dns', value: 'example.com' }] },
    },
    mockResponse: {
      status: 201,
      body: {
        status: 'pending',
        identifiers: [{ type: 'dns', value: 'example.com' }],
        authorizations: ['https://acme.example.com/acme/authz/1'],
        finalize: 'https://acme.example.com/acme/order/1/finalize',
        expires: new Date(Date.now() + 3600_000).toISOString(),
      },
    },
  },
  {
    id: 'challenge',
    title: 'Step 4 — Respond to HTTP-01 Challenge',
    description:
      'The CA challenges the client to prove control over the domain. For HTTP-01, a token file is served at a well-known URL. The client notifies the CA when ready.',
    rfc: 'RFC 8555 §8.3',
    sidebarLines: [
      'The token is a random value from the server. The key authorization = token + "." + base64url(thumbprint(accountKey)).',
      'For PQC keys, the thumbprint uses the ML-DSA public key bytes hashed with SHA-256.',
      'Serve the key authorization at: http://example.com/.well-known/acme-challenge/{token}',
      'DNS-01 and TLS-ALPN-01 alternatives exist for cases where HTTP is not available.',
    ],
    mockRequest: {
      method: 'POST',
      url: 'https://acme.example.com/acme/challenge/1',
      body: {},
    },
    mockResponse: {
      status: 200,
      body: {
        type: 'http-01',
        status: 'valid',
        token: 'pqcChallenge123',
        url: 'https://acme.example.com/acme/challenge/1',
      },
    },
  },
  {
    id: 'finalize',
    title: 'Step 5 — Finalize with ML-DSA-65 CSR',
    description:
      'With the domain validated, the client submits a Certificate Signing Request containing its ML-DSA-65 public key. This is the real crypto step — generated live in your browser.',
    rfc: 'RFC 8555 §7.4, RFC 2986 (PKCS#10)',
    sidebarLines: [
      'The CSR is encoded as PKCS#10 (RFC 2986), base64url-encoded in the finalize request.',
      'The CSR subject should match the domain names from the order.',
      'ML-DSA-65 CSRs use OID 2.16.840.1.101.3.4.3.18 (id-ML-DSA-65), per draft-ietf-lamps-dilithium-certificates.',
      'The CA verifies the CSR signature using the embedded ML-DSA public key before issuing.',
    ],
    mockRequest: {
      method: 'POST',
      url: 'https://acme.example.com/acme/order/1/finalize',
      body: { csr: '<base64url-encoded PKCS#10 CSR — generated below>' },
    },
    mockResponse: {
      status: 200,
      body: {
        status: 'valid',
        certificate: 'https://acme.example.com/acme/cert/1',
        identifiers: [{ type: 'dns', value: 'example.com' }],
      },
    },
  },
]
