// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Terminal,
  Library,
  Layers,
  Lock,
  Globe,
  FileCode2,
  Shield,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { VULNERABILITY_TABLE, JOSE_HEADER_COMPARISONS, OAUTH_MIGRATION_ITEMS } from '../constants'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface APISecurityIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const APISecurityIntroduction: React.FC<APISecurityIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1: JWT/JWS/JWE Fundamentals */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileCode2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">JWT/JWS/JWE Fundamentals</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>
              <InlineTooltip term="JWT">JSON Web Tokens (JWT)</InlineTooltip>
            </strong>{' '}
            are the foundation of modern API authentication. A JWT is a compact, URL-safe means of
            representing claims between two parties. The token format is defined in RFC 7519, with
            signing (<InlineTooltip term="JWS">JWS</InlineTooltip>, RFC 7515) and encryption (
            <InlineTooltip term="JWE">JWE</InlineTooltip>, RFC 7516) as separate specifications.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">
              JWT Compact Serialization (JWS)
            </div>
            <div className="font-mono text-xs space-y-1">
              <div className="flex flex-wrap gap-1 items-center">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                  BASE64URL(Header)
                </span>
                <span className="text-muted-foreground font-bold">.</span>
                <span className="px-2 py-1 rounded bg-success/10 text-success">
                  BASE64URL(Payload)
                </span>
                <span className="text-muted-foreground font-bold">.</span>
                <span className="px-2 py-1 rounded bg-destructive/10 text-destructive">
                  BASE64URL(Signature)
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              The header specifies the algorithm (<code className="text-foreground/70">alg</code>)
              and token type (<code className="text-foreground/70">typ</code>). The payload carries
              claims. The signature covers both header and payload.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Header</div>
              <p className="text-xs text-muted-foreground">
                <InlineTooltip term="JOSE">JOSE</InlineTooltip> header with{' '}
                <code className="text-foreground/70">alg</code> (signing algorithm) and{' '}
                <code className="text-foreground/70">typ</code> (token type). Base64url-encoded
                JSON.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Payload</div>
              <p className="text-xs text-muted-foreground">
                Claims: <code className="text-foreground/70">sub</code>,{' '}
                <code className="text-foreground/70">iss</code>,{' '}
                <code className="text-foreground/70">exp</code>,{' '}
                <code className="text-foreground/70">aud</code>, plus custom claims.
                Base64url-encoded JSON.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Signature</div>
              <p className="text-xs text-muted-foreground">
                Cryptographic signature over{' '}
                <code className="text-foreground/70">header.payload</code> using the algorithm
                specified in the header. This is where PQC changes everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Current JWT Algorithms & Quantum Vulnerability */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Current JWT Algorithms &amp; Quantum Vulnerability
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Every JWT signing algorithm in production today &mdash;{' '}
            <InlineTooltip term="RSA">RS256</InlineTooltip> (RSA-PKCS1-v1_5),{' '}
            <InlineTooltip term="ECDSA">ES256</InlineTooltip> (ECDSA P-256), and{' '}
            <InlineTooltip term="EdDSA">EdDSA</InlineTooltip> (Ed25519) &mdash; relies on
            mathematical problems that{' '}
            <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip> solves
            efficiently on a quantum computer. Key agreement algorithms like ECDH-ES are equally
            vulnerable.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">JOSE ID</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Quantum Attack
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {VULNERABILITY_TABLE.map((row) => (
                  <tr key={row.jose} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{row.algorithm}</td>
                    <td className="p-2 font-mono text-xs text-foreground">{row.jose}</td>
                    <td className="p-2 text-muted-foreground">{row.type}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.attack}</td>
                    <td className="p-2">
                      {row.broken ? (
                        <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-destructive/20 text-destructive border-destructive/50">
                          Quantum Vulnerable
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
                          Quantum Safe
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Harvest Now, Decrypt Later (HNDL):</strong> Attackers can capture signed JWTs
            today and forge signatures once quantum computers break the signing algorithms. For
            long-lived tokens (refresh tokens, ID tokens with long expiry), this is an immediate
            concern.
          </p>
        </div>
      </section>

      {/* Section 3: PQC JWT Signing with ML-DSA */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <ShieldCheck size={24} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-gradient">PQC JWT Signing with ML-DSA</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The <InlineTooltip term="IETF">IETF</InlineTooltip> JOSE working group is developing{' '}
            <strong>draft-ietf-jose-pqc</strong> (active draft, pending ratification), which defines
            new <code className="text-foreground/70">alg</code> values for post-quantum algorithms
            in JWS and JWE. <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (
            <InlineTooltip term="FIPS 204">FIPS 204</InlineTooltip>) replaces ECDSA and RSA for JWT
            signing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">ML-DSA-44</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <InlineTooltip term="NIST">NIST</InlineTooltip> Level 2
                </p>
                <p>Public key: 1,312 bytes</p>
                <p>Signature: 2,420 bytes</p>
                <p className="text-foreground/70 italic">Comparable to AES-128 security</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">ML-DSA-65</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>NIST Level 3</p>
                <p>Public key: 1,952 bytes</p>
                <p>Signature: 3,309 bytes</p>
                <p className="text-foreground/70 italic">Recommended for general use</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">ML-DSA-87</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>NIST Level 5</p>
                <p>Public key: 2,592 bytes</p>
                <p>Signature: 4,627 bytes</p>
                <p className="text-foreground/70 italic">Maximum security, largest size</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: PQC JWT Key Agreement with ML-KEM */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <KeyRound size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">PQC JWT Key Agreement with ML-KEM</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="JWE">JWE</InlineTooltip> (JSON Web Encryption) protects token
            payloads with authenticated encryption.{' '}
            <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> (
            <InlineTooltip term="FIPS 203">FIPS 203</InlineTooltip>) replaces ECDH-ES for key
            agreement in JWE, using a{' '}
            <InlineTooltip term="KEM">Key Encapsulation Mechanism</InlineTooltip> instead of
            Diffie-Hellman key exchange.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-destructive mb-2">
                Classical: ECDH-ES Key Agreement
              </div>
              <div className="space-y-2 text-center">
                <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                  Sender generates ephemeral EC keypair
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs font-bold">
                  ECDH(ephemeral_sk, recipient_pk) &rarr; shared secret
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                  Concat KDF &rarr; Content Encryption Key (CEK)
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                ECDH is broken by Shor&apos;s algorithm (discrete log on elliptic curves).
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-success mb-2">PQC: ML-KEM Encapsulation</div>
              <div className="space-y-2 text-center">
                <div className="p-2 rounded bg-success/10 text-success text-xs font-bold">
                  ML-KEM.Encaps(recipient_pk) &rarr; (ct, shared_secret)
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-success/10 text-success text-xs font-bold">
                  <InlineTooltip term="HKDF">HKDF</InlineTooltip>
                  (shared_secret) &rarr; CEK
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                  AES-GCM-Encrypt(CEK, payload) &rarr; ciphertext
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                ML-KEM is a lattice-based KEM, resistant to quantum attacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: JOSE Header Changes */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <FileCode2 size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">JOSE Header Changes</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Migrating to PQC requires updating the <InlineTooltip term="JOSE">JOSE</InlineTooltip>{' '}
            header&apos;s <code className="text-foreground/70">alg</code> field. The rest of the JWT
            structure remains identical &mdash; the JOSE framework was designed for algorithm
            agility.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-destructive mb-2">Classical Header</div>
              <pre className="text-xs font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto">
                {`{
  "alg": "ES256",
  "typ": "JWT",
  "kid": "ec-key-2024"
}`}
              </pre>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-success mb-2">PQC Header</div>
              <pre className="text-xs font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto">
                {`{
  "alg": "ML-DSA-65",
  "typ": "JWT",
  "kid": "ml-dsa-key-2025"
}`}
              </pre>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Field</th>
                  <th className="text-left p-2 font-bold">
                    <span className="text-destructive">Classical</span>
                  </th>
                  <th className="text-left p-2 font-bold">
                    <span className="text-success">PQC</span>
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {JOSE_HEADER_COMPARISONS.map((row) => (
                  <tr key={row.field} className="border-b border-border/50">
                    <td className="p-2 font-mono text-xs text-muted-foreground font-medium">
                      {row.field}
                    </td>
                    <td className="p-2 font-mono text-xs text-foreground">{row.classical}</td>
                    <td className="p-2 font-mono text-xs text-foreground">{row.pqc}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 6: Token Size Implications */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle size={24} className="text-warning" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Token Size Implications</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The most significant practical impact of PQC JWTs is <strong>token size</strong>.
            ML-DSA-65 signatures are 3,309 bytes vs 64 bytes for ES256 &mdash; a 51x increase. This
            has cascading effects on HTTP headers, cookies, bandwidth, and storage.
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">ES256 JWT (~300 bytes)</span>
                <span className="font-mono text-foreground">~300 B</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-success/60 h-3 rounded-full transition-all"
                  style={{ width: '4%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">ML-DSA-65 JWT (~4,700 bytes)</span>
                <span className="font-mono text-foreground">~4.7 KB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-warning/60 h-3 rounded-full transition-all"
                  style={{ width: '59%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">HTTP Header Limit (default)</span>
                <span className="font-mono text-destructive">8 KB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-destructive/60 h-3 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              {
                t: 'HTTP Header Limits',
                d: 'Many servers default to 8 KB header limits. A single ML-DSA-65 JWT in an Authorization header uses ~60% of that budget. With DPoP, two PQC JWTs could exceed the limit.',
              },
              {
                t: 'Cookie Storage',
                d: 'Browser cookies are limited to ~4 KB per cookie. PQC JWTs cannot fit in a single cookie. Session tokens may need to move from cookies to request bodies.',
              },
              {
                t: 'Bandwidth',
                d: 'Mobile APIs with high request rates will see measurable bandwidth increases. Consider token caching and reference tokens as mitigation strategies.',
              },
            ].map((item) => (
              <div key={item.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{item.t}</div>
                  <p className="text-xs text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: OAuth 2.0 / OIDC with PQC */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">OAuth 2.0 / OIDC with PQC</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            OAuth 2.0 and <InlineTooltip term="OIDC">OpenID Connect</InlineTooltip> rely heavily on
            JWTs for access tokens, ID tokens, and <InlineTooltip term="DPoP">DPoP</InlineTooltip>{' '}
            proofs. Migrating these ecosystems to PQC requires coordinated changes across
            authorization servers, resource servers, and client applications.
          </p>
          <div className="space-y-3">
            {OAUTH_MIGRATION_ITEMS.map((item) => (
              <div key={item.component} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-foreground">{item.component}</div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                      item.priority === 'high'
                        ? 'bg-destructive/20 text-destructive border-destructive/50'
                        : item.priority === 'medium'
                          ? 'bg-warning/20 text-warning border-warning/50'
                          : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {item.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
                <p className="text-xs text-foreground/80">{item.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/openssl"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Terminal size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">OpenSSL Studio</div>
              <div className="text-xs text-muted-foreground">
                Generate ML-DSA keys and sign data interactively
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Layers size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Composite signatures and dual-algorithm approaches
              </div>
            </div>
          </Link>
          <Link
            to="/library"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Library size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Standards Library</div>
              <div className="text-xs text-muted-foreground">
                Browse JOSE PQC drafts, FIPS 203, and FIPS 204
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Lock size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS & PQC Key Management</div>
              <div className="text-xs text-muted-foreground">
                <InlineTooltip term="JWKS">JWKS</InlineTooltip> key rotation and lifecycle for PQC
                keys
              </div>
            </div>
          </Link>
          <Link
            to="/learn/iam-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">IAM &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                JWT/SAML/OIDC token migration &amp; identity provider PQC readiness
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try it in the Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Decode JWTs, sign with ML-DSA, create hybrid tokens, and analyze sizes interactively.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
