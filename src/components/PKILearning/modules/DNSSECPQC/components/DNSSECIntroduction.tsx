// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import {
  Shield,
  ArrowRight,
  Ruler,
  Globe,
  ListChecks,
  BookOpen,
  FlaskConical,
  Network,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DNSSECIntroductionProps {
  onNavigateToSimulate: () => void
}

export const DNSSECIntroduction: React.FC<DNSSECIntroductionProps> = ({ onNavigateToSimulate }) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: What DNSSEC Protects */}
      <section data-section-id="dnssec-basics" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">What DNSSEC Protects</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="DNSSEC">
              <strong>DNSSEC</strong>
            </InlineTooltip>{' '}
            (DNS Security Extensions, <InlineTooltip term="RFC 4034">RFC 4034</InlineTooltip>,
            consolidated in RFC 9364/BCP 237) adds cryptographic signatures to DNS answers. A
            resolver that validates DNSSEC can prove a DNS record came from the zone&apos;s real
            owner and was not altered or forged in transit &mdash; it chains trust from the DNS
            root, through each delegated zone&apos;s <strong>DS</strong> record, down to the{' '}
            <strong>DNSKEY</strong>/<strong>RRSIG</strong> pair that signs the actual answer.
          </p>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-bold text-primary mb-1">
              Why this is a forgery problem, not a privacy problem
            </h4>
            <p className="text-xs text-muted-foreground">
              DNSSEC is <strong>signature-only</strong> &mdash; it protects authenticity and
              integrity, not confidentiality. There is no ciphertext to harvest today and decrypt
              later. The quantum threat here is that a cryptographically relevant quantum computer
              would let an attacker <strong>forge</strong> a DNSSEC signature on any RSA- or
              ECDSA-signed zone, right now, the day such a computer exists &mdash; not
              retroactively.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Today&apos;s most widely deployed DNSSEC signature algorithms are RSA and ECDSA (RFC
            6605). Both rely on integer factorization or elliptic-curve discrete logarithm hardness
            &mdash; exactly the problems Shor&apos;s algorithm breaks.
          </p>
        </div>
      </section>

      {/* Section 2: ML-DSA-44 & Algorithm 18 */}
      <section data-section-id="mldsa44-mechanism" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Ruler size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>-44 & IANA Algorithm 18
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>draft-westerbaan-dnssec-mldsa</strong> (Westerbaan/Cloudflare, Schmieg/Google)
            specifies DNSSEC&apos;s DS, DNSKEY, and RRSIG resource records for{' '}
            <InlineTooltip term="FIPS 204">ML-DSA</InlineTooltip>-44 &mdash; the smallest of{' '}
            <InlineTooltip term="FIPS 204">FIPS 204</InlineTooltip>&apos;s three parameter sets (44
            / 65 / 87), chosen specifically to minimize DNS message size. IANA has assigned it{' '}
            <strong>DNSSEC algorithm number 18</strong> (mnemonic <code>MLDSA44</code>).
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Public key</div>
                <div className="text-sm font-bold text-foreground">1,312 B</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Signature</div>
                <div className="text-sm font-bold text-warning">2,420 B</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">ECDSA P-256 sig</div>
                <div className="text-sm font-bold text-muted-foreground">64 B</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Size ratio</div>
                <div className="text-sm font-bold text-warning">~38&times;</div>
              </div>
            </div>
          </div>
          <p>
            A 2,420-byte RRSIG dwarfs the DNS protocol&apos;s practical UDP response ceiling of
            roughly <strong>1,232 bytes</strong> (the modern recommended EDNS0 buffer size). Any
            answer carrying an ML-DSA-44 signature forces a fallback from UDP to TCP &mdash; a real
            operational cost, not just a theoretical one, and part of why this remains an individual
            draft rather than a working-group-adopted standard.
          </p>
          <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-warning" />
              <h4 className="font-bold text-warning text-sm">Downgrade risk</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              RFC 6840 recommends lenient validators accept any single valid signature path. If a
              zone is signed with <em>both</em> ML-DSA-44 and a quantum-vulnerable algorithm, a
              future quantum attacker could strip the ML-DSA-44 RRSIG and have a lenient validator
              accept the forged classical one instead. The draft&apos;s own fix: a validator that
              requires ML-DSA-44 whenever the zone&apos;s DS record advertises it avoids the
              downgrade.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Cloudflare's Real Pilot */}
      <section data-section-id="cloudflare-pilot" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Cloudflare&apos;s Real Pilot</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            On <strong>2026-09-10</strong>, Cloudflare enabled ML-DSA-44 (algorithm 18) DNSSEC
            validation <strong>by default</strong> on the <strong>1.1.1.1</strong> public resolver,
            and published <strong>dnstest.dev</strong> as a live, ML-DSA-44-signed test zone
            resolvers can validate against. This is the first real-world PQ DNSSEC deployment with
            production traffic behind it &mdash; not just a draft.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-success/5 rounded-lg p-3 border border-success/20">
              <div className="text-xs font-bold text-success mb-1">What this proves</div>
              <p className="text-xs text-muted-foreground">
                A production DNS resolver can validate ML-DSA-44 signatures by default, at
                Cloudflare&apos;s scale, against a real signed zone.
              </p>
            </div>
            <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
              <div className="text-xs font-bold text-warning mb-1">What it does not prove</div>
              <p className="text-xs text-muted-foreground">
                No production zone &mdash; not dnstest.dev&apos;s own real-world siblings, not a
                registry, not a registrar, not the DNS root &mdash; has been <strong>signed</strong>{' '}
                with a PQ algorithm. This is resolver-side validation of one test zone, not
                authoritative-side signing.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            See the{' '}
            <Link to="/algorithms" className="text-primary hover:underline">
              Protocol Support matrix&apos;s DNSSEC row
            </Link>{' '}
            for the full, continuously-tracked deployment record behind this claim.
          </p>
        </div>
      </section>

      {/* Section 4: What's Still Missing */}
      <section data-section-id="whats-missing" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <ListChecks size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">What&apos;s Still Missing</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Cloudflare&apos;s own roadmap names two concrete steps still ahead before PQ DNSSEC can
            run end-to-end in production:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-xs font-bold text-success shrink-0 w-32">Done (pilot)</span>
              <span className="text-xs text-foreground/80 flex-1">
                Resolver-side validation of ML-DSA-44 (1.1.1.1, by default)
              </span>
            </div>
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-xs font-bold text-warning shrink-0 w-32">Next</span>
              <span className="text-xs text-foreground/80 flex-1">
                Authoritative-side signing support &mdash; zones need to be <em>signable</em> with
                ML-DSA, not just validatable
              </span>
            </div>
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-xs font-bold text-warning shrink-0 w-32">Then</span>
              <span className="text-xs text-foreground/80 flex-1">
                Registrar DS-record support &mdash; parent-zone delegation needs algorithm-18 DS
                records for the chain of trust to reach a signed zone
              </span>
            </div>
          </div>
          <p>
            Cloudflare&apos;s own target for that full path is <strong>~2029</strong>. That is a{' '}
            <strong>different, narrower claim</strong> than the DNS root zone&apos;s own algorithm
            rollover, which Verisign estimates at the <strong>mid-2030s</strong> &mdash; the root
            has to wait for PQ support to reach every delegation up to it before the
            downgrade-safety design above is actually post-quantum-secure. Keep the two numbers
            separate: one vendor&apos;s roadmap, one global infrastructure migration.
          </p>
          <p className="text-xs text-muted-foreground">
            Two parallel efforts attack the same signature-size problem differently:{' '}
            <strong>draft-sheth-pqc-dnssec-strategy</strong> surveys SLH-DSA-MTL, Falcon, XMSS, and
            LMS as DNSSEC candidates, while <strong>draft-fregly-dnsop-slh-dsa-mtl-dnssec</strong>{' '}
            and <strong>draft-kaizer-dnsop-ml-dsa-mtl-dnssec</strong> both apply{' '}
            <em>Merkle Tree Ladder</em> mode &mdash; to SLH-DSA and ML-DSA respectively &mdash; to
            shrink the per-query signature cost. None of these has IETF working-group status yet.
          </p>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/algorithms"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Network size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Protocol Support Matrix</div>
              <div className="text-xs text-muted-foreground">
                Live-tracked DNSSEC deployment posture, refs, and stage
              </div>
            </div>
          </Link>
          <Link
            to="/library"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Standards Library</div>
              <div className="text-xs text-muted-foreground">
                RFCs and IETF drafts behind PQ DNSSEC
              </div>
            </div>
          </Link>
          <Link
            to="/learn/network-security-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Network Security</div>
              <div className="text-xs text-muted-foreground">
                Broader PQC migration across network security infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/learn/vpn-ssh-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">VPN/IPsec & SSH</div>
              <div className="text-xs text-muted-foreground">
                Another protocol facing the same PQC message-size pressure
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToSimulate}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Compare signature sizes, walk the validation chain, and track the deployment roadmap.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Network" />
      <ReadingCompleteButton />
    </div>
  )
}
