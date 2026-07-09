// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { BookOpen, ListTree, Atom, Globe, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ALGORITHM_FAMILIES,
  CURVE_CATEGORIES,
  totalCurveCount,
} from '@/data/cyclonedxCryptoRegistry'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

/** ● = grounded in a primary standard · ◆ = practitioner / framework view */
const Badge: FC<{ kind: 'std' | 'view' }> = ({ kind }) => (
  <span
    className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mr-1 align-middle ${
      kind === 'std'
        ? 'bg-status-success/15 text-status-success'
        : 'bg-status-info/15 text-status-info'
    }`}
  >
    {kind === 'std' ? '● standard' : '◆ practitioner'}
  </span>
)

const Section: FC<{
  id: string
  icon: typeof BookOpen
  title: string
  children: React.ReactNode
}> = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="glass-panel p-5 scroll-mt-24">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">{children}</div>
  </section>
)

const SECTIONS = [
  { id: 'registry-why', label: 'Why a Registry' },
  { id: 'registry-scope', label: "What's Inside" },
  { id: 'registry-pqc', label: 'PQC Coverage' },
  { id: 'registry-independent', label: 'Beyond CBOM' },
  { id: 'registry-practice', label: 'Using It' },
]

const primitiveCount = new Set(ALGORITHM_FAMILIES.flatMap((f) => f.variant.map((v) => v.primitive)))
  .size

export const CryptoRegistryIntroduction: FC<Props> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-5">
    <div className="glass-panel p-4 flex flex-wrap gap-2">
      <span className="text-xs text-muted-foreground self-center mr-1">In this module:</span>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          {s.label}
        </a>
      ))}
    </div>

    <Section id="registry-why" icon={BookOpen} title="Why a registry, not just a spec">
      <p>
        <Badge kind="view" />
        The same cryptographic mechanism gets a different name from every angle you look at it —{' '}
        <code>CKM_ECDSA_SHA256</code> to an HSM, OID <code>1.2.840.10045.4.3.2</code> to a
        certificate, <code>ES256</code> to a JWT, code point <code>0x0403</code> to TLS 1.3. A CBOM
        (or any inventory) built from several discovery tools inherits all of these inconsistent
        names — and nothing lines up until you normalize them.
      </p>
      <p>
        <Badge kind="std" />
        CycloneDX v1.7 answers this with the <strong>Cryptography Registry</strong>: one versioned,
        machine-readable list of canonical algorithm-family and elliptic-curve names, each backed by
        its standardization reference (RFC, FIPS, IEEE, ISO).
      </p>
    </Section>

    <Section id="registry-scope" icon={ListTree} title="What's inside: families and curves">
      <p>
        <Badge kind="std" />
        <strong>{ALGORITHM_FAMILIES.length} algorithm families</strong> across {primitiveCount}{' '}
        primitive types — signatures, key encapsulation, key agreement, block and stream ciphers,
        authenticated encryption, MACs, hashes, XOFs, KDFs, key-wrap and DRBGs — each with
        standardization references and naming-pattern templates for its parameterized variants (e.g.
        key length, hash choice).
      </p>
      <p>
        <Badge kind="std" />
        <strong>
          {totalCurveCount} elliptic curves across {CURVE_CATEGORIES.length} standardization
          categories
        </strong>{' '}
        (NIST, SECG, Brainpool, ANSSI, BLS, GOST, X9.62/X9.63 and more) — each entry carries its
        OID, algebraic form (Weierstrass, Edwards, Montgomery), and cross-referenced aliases, so{' '}
        <code>P-256</code>, <code>secp256r1</code> and <code>prime256v1</code> are recorded as the
        same curve.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigateToWorkshop?.(1)}
        className="border-primary text-primary hover:bg-primary/10"
      >
        Try the Curve Identifier Lookup →
      </Button>
    </Section>

    <Section id="registry-pqc" icon={Atom} title="PQC is a first-class citizen, not a footnote">
      <p>
        <Badge kind="std" />
        <strong>ML-KEM, ML-DSA, SLH-DSA, XMSS</strong> and <strong>LMS</strong> are registered
        algorithm families alongside RSA, ECDSA and AES — not a separate or bolted-on list. For a
        PQC-readiness review, that means one place to check whether a mechanism a scanner found is
        quantum-safe, quantum-vulnerable, or a stateful hash-based signature that needs its own
        state-management scrutiny.
      </p>
      <p>
        <Badge kind="view" />
        PQC makes normalization harder, not easier: ML-DSA registers{' '}
        <em>one OID per parameter set</em> (RFC 9881&apos;s <code>id-ml-dsa-44/65/87</code>), so a
        single family fans out into several distinct identifiers a tool must still resolve back to
        &ldquo;ML-DSA&rdquo;.
      </p>
    </Section>

    <Section
      id="registry-independent"
      icon={Globe}
      title="Broader than CBOM, broader than CycloneDX"
    >
      <p>
        <Badge kind="std" />
        The registry ships as its own <strong>versioned JSON + JSON Schema</strong>, decoupled from
        the CycloneDX specification release cycle — it can add a new algorithm family without
        waiting for the next CycloneDX version.
      </p>
      <p>
        <Badge kind="view" />
        It is explicitly designed for use <em>outside</em> CBOM or CycloneDX entirely: an SPDX-based
        scanner, a homegrown inventory format, or a compliance dashboard can all adopt the same
        canonical names — CBOM is simply CycloneDX&apos;s own consumer of it.
      </p>
    </Section>

    <Section id="registry-practice" icon={Wrench} title="Using it in practice">
      <p>
        <Badge kind="view" />
        Every discovery source you already run — HSM query, certificate scan, source-code scanner,
        network capture — hands you a mechanism name in its own notation. The registry is the lookup
        table that resolves each one to a single canonical family or curve before it goes into your
        inventory, which is what makes a policy-as-code check (quantum-safe / quantum-vulnerable /
        unknown) match reliably across sources.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(0)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Try the Algorithm Name Normalizer →
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(1)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Try the Curve Identifier Lookup →
        </Button>
      </div>
    </Section>
  </div>
)
