// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { Link2, Map, RefreshCw, Stamp, Repeat, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import { CHAIN_LINKS, NEIGHBOUR_TOPICS } from '../data/chainData'
import { STATUS_GROUPS, STATUS_LABELS } from '../data/statusMapData'
import { ClaimLine, ReadingNote } from './ClaimLine'

interface Props {
  onNavigateToWorkshop: () => void
}

const ModuleLinks: React.FC<{ links: { label: string; to: string }[] }> = ({ links }) => (
  <>
    {links.map((m, i) => (
      <React.Fragment key={m.to}>
        {i > 0 ? ', ' : ''}
        <Link to={m.to} className="text-primary hover:underline">
          {m.label}
        </Link>
      </React.Fragment>
    ))}
  </>
)

export const SoftwareSupplyChainIntroduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      <LearnSection
        sectionId="chain"
        title="1. The chain, one control per link"
        icon={<Link2 size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          Software reaches a device through a series of hand-offs, and at each hand-off some control
          is meant to tell the receiver that what arrived is what was sent. Many of those controls
          are signatures. This lesson reads the signature links from their own documents, one link
          at a time, and says for each what the document states about post-quantum signatures and
          where it is silent.
        </p>

        <ReadingNote title="The eight links, as this lesson draws them">
          <p>
            This table is the lesson&rsquo;s own map, not a statement from any source. It shows
            which kind of control each link relies on and where the topic is taught in depth, so
            that this lesson can leave those parts to the modules that own them.
          </p>
        </ReadingNote>

        <div className="space-y-2">
          {CHAIN_LINKS.map((l, i) => (
            <div key={l.id} className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm">
                <strong className="text-foreground">
                  {i + 1}. {l.link}
                </strong>{' '}
                <span className="text-xs text-muted-foreground">({l.control})</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{l.what}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {l.taughtIn.length > 0 ? (
                  <>
                    Taught in: <ModuleLinks links={l.taughtIn} />
                  </>
                ) : null}
                {l.taughtIn.length > 0 && l.here ? '. ' : ''}
                {l.here ? <>Read in this lesson: {l.here}.</> : null}
              </p>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground">
          Two sourced statements anchor the map. The first is from NIST&rsquo;s Secure Software
          Development Framework, the second from its guidance on integrating supply chain security
          into DevSecOps.
        </p>
        <ClaimLine id="SC-1.1" />
        <ClaimLine id="SC-1.2" />

        <ReadingNote title="What this lesson leaves to other modules">
          <ul className="list-disc pl-5 space-y-1">
            {NEIGHBOUR_TOPICS.map((n) => (
              <li key={n.topic}>
                {n.topic}: <ModuleLinks links={[n.module]} />
              </li>
            ))}
          </ul>
        </ReadingNote>
      </LearnSection>

      <LearnSection
        sectionId="status"
        title="2. Status map: the signature links, one document at a time"
        icon={<Map size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          For each ecosystem below, the lesson reports what the held edition of one document says. A
          label next to a sentence says what kind of statement it is. The labels are about the
          document, never about a plan or a date.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {Object.values(STATUS_LABELS).map((l) => (
            <div key={l.text} className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">{l.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{l.meaning}</p>
            </div>
          ))}
        </div>

        {STATUS_GROUPS.map((g) => (
          <div key={g.id} className="space-y-3">
            <h3 className="font-semibold text-foreground">{g.title}</h3>
            <p className="text-sm text-muted-foreground">{g.intro}</p>
            {g.rows.map((r) => (
              <div key={r.id} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{r.ecosystem}</h4>
                {r.entries.map((e) => (
                  <ClaimLine key={e.claim} id={e.claim} chip={STATUS_LABELS[e.label].text} />
                ))}
              </div>
            ))}
          </div>
        ))}

        <ReadingNote title="How to read a silent entry">
          <p>
            A silent entry means the held text of one edition contains none of these terms:
            post-quantum, quantum, PQC, ML-DSA, SLH-DSA, Dilithium, SPHINCS, LMS, XMSS, hash-based
            signature, Kyber, ML-KEM. It does not say that anyone plans or declines a migration, and
            it does not describe other editions of the same document.
          </p>
        </ReadingNote>
      </LearnSection>

      <LearnSection
        sectionId="updates"
        title="3. Update frameworks: TUF and Uptane"
        icon={<RefreshCw size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          TUF and Uptane are two update frameworks that spread trust across several roles and keys.
          This section reads them from their specifications.
        </p>

        <h3 className="font-semibold text-foreground">TUF: roles and thresholds</h3>
        <ClaimLine id="SC-3.3" />
        <ClaimLine id="SC-3.6" />
        <ClaimLine id="SC-3.7" />

        <ReadingNote title="Reading a threshold">
          <p>
            A role that requires <em>t</em> signatures from <em>n</em> keys is trusted only when at
            least <em>t</em> of its keys signed. By simple counting, an attacker who holds fewer
            than <em>t</em> of the role&rsquo;s keys cannot sign for it alone, and an attacker who
            holds <em>t</em> or more can. With <em>t</em> equal to 1, any single key is enough. The
            Roles and Thresholds step of the Workshop lets you set <em>t</em>, <em>n</em> and the
            keys an attacker holds.
          </p>
        </ReadingNote>

        <h3 className="font-semibold text-foreground">TUF: when keys are lost</h3>
        <ClaimLine id="SC-3.8" />
        <ClaimLine id="SC-3.9" />

        <h3 className="font-semibold text-foreground">
          Uptane: two repositories and a cross-check
        </h3>
        <ClaimLine id="SC-3.1" />
        <ClaimLine id="SC-3.10" />
        <ClaimLine id="SC-3.2" />

        <h3 className="font-semibold text-foreground">Firmware-specific guidance</h3>
        <p className="text-muted-foreground">
          Two further documents describe the signature elements of firmware updates. For SUIT and
          device constraints, see{' '}
          <Link to="/learn/iot-pqc" className="text-primary hover:underline">
            IoT
          </Link>
          .
        </p>
        <ClaimLine id="SC-3.4" />
        <ClaimLine id="SC-3.5" />

        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Try Roles and Thresholds in the Workshop <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <LearnSection
        sectionId="provenance"
        title="4. Provenance and attestation"
        icon={<Stamp size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Provenance records how an artifact was built. The SLSA v1.2 pages call it an attestation
          and ask for it to be signed from Build L2. This section reads the SLSA v1.2 Build pages
          and the in-toto Statement page for what each says about signatures.
        </p>

        <ClaimLine id="SC-4.2" />
        <ClaimLine id="SC-4.1" />
        <ClaimLine id="SC-4.3" />
        <ClaimLine id="SC-4.4" />
        <ClaimLine id="SC-4.5" />

        <h3 className="font-semibold text-foreground">What these pages do not name</h3>
        <ClaimLine id="SC-4.6n" chip={STATUS_LABELS.silent.text} />
        <ClaimLine id="SC-4.7n" chip={STATUS_LABELS.silent.text} />
        <ClaimLine id="SC-4.8n" chip={STATUS_LABELS.silent.text} />
        <ClaimLine id="SC-4.9n" chip={STATUS_LABELS.silent.text} />

        <ReadingNote>
          <p>
            Because none of these pages names a signature algorithm, the algorithm behind a
            provenance signature is not decided on these pages. In this lesson&rsquo;s reading, the
            status of that signature is the status of its algorithm&rsquo;s encodings in section 2:
            a hash-based or ML-DSA signature can be carried only where an encoding exists for it.
            The Provenance Chain Check step of the Workshop traces one artifact through build,
            provenance and verification and marks, at each signature, which section 2 entry applies.
          </p>
        </ReadingNote>
      </LearnSection>

      <LearnSection
        sectionId="transition"
        title="5. Changing an algorithm after the verifier has shipped"
        icon={<Repeat size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The hard case is a verifier that is already deployed. This section reads what the
          documents say about verifiers that cannot be updated, about carrying two signatures during
          a change, and about combining algorithms.
        </p>

        <h3 className="font-semibold text-foreground">A verifier that cannot change</h3>
        <ClaimLine id="SC-5.1" />

        <h3 className="font-semibold text-foreground">Two signatures during a change</h3>
        <ClaimLine id="SC-2.5" />

        <h3 className="font-semibold text-foreground">Combining algorithms</h3>
        <ClaimLine id="SC-5.2a" chip={STATUS_LABELS.draft.text} />
        <ClaimLine id="SC-5.2b" />

        <h3 className="font-semibold text-foreground">What government and standards bodies name</h3>
        <ClaimLine id="SC-5.3" />
        <ClaimLine id="SC-2.11" chip={STATUS_LABELS.recommended.text} />
        <p className="text-sm text-muted-foreground">
          For how LMS and XMSS state is managed, see{' '}
          <Link to="/learn/stateful-signatures" className="text-primary hover:underline">
            Stateful Signatures
          </Link>
          ; for the CNSA 2.0 timeline, see{' '}
          <Link to="/learn/code-signing" className="text-primary hover:underline">
            Code Signing
          </Link>
          .
        </p>

        <ReadingNote title="Who decides what (a learning aid, not a rule)">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Architect: where the verifier lives (unchangeable ROM or updatable code), and whether
              an update can carry a second signature.
            </li>
            <li>
              Governance and compliance: which document and which edition a requirement cites, and
              whether that edition names a post-quantum algorithm.
            </li>
            <li>
              Developer: which encoding carries the signature (CMS, COSE, X.509 or OpenPGP) and
              whether it is an RFC or a draft.
            </li>
            <li>
              Operations: who holds each role&rsquo;s keys, what the threshold is, and what happens
              when a role key is lost.
            </li>
            <li>
              Researcher: which links are silent in the held editions and which have a mechanism.
            </li>
          </ul>
        </ReadingNote>

        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Plan a transition in the Workshop <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
