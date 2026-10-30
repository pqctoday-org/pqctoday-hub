// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Boxes,
  FileJson,
  GitCompareArrows,
  Layers,
  ListChecks,
  Plug,
  Scale,
  ShieldAlert,
  Shuffle,
  Users,
} from 'lucide-react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { usePersonaStore } from '@/store/usePersonaStore'
import { EVIDENCE_CLASSES, EVIDENCE_CLASS_IDS } from '@/data/validation/evidenceClasses'
import validationCounts from '@/data/validation/validation-counts.generated.json'
import { Cite } from './Cite'
import { ReviewStatusNotice } from './ReviewStatusNotice'
import { CLAIM_LADDER, HUB_REACHABLE_MAX_RUNG } from '../data/evidenceLevels'

interface AcvpLabIntroductionProps {
  onNavigateToWorkshop: () => void
}

interface SectionProps {
  id: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ id, title, icon, children }) => (
  <section data-section-id={id} className="glass-panel p-6 scroll-mt-20">
    <div className="mb-4 flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
      <h2 className="text-xl font-bold text-gradient">{title}</h2>
    </div>
    <div className="space-y-4 text-sm text-foreground/80">{children}</div>
  </section>
)

const Callout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
    <h3 className="mb-1 font-bold text-primary">{title}</h3>
    <div className="space-y-2 text-xs text-muted-foreground">{children}</div>
  </div>
)

// Abbreviated from the registration example in the ACVP ML-DSA sub-specification
// (sigGen Registration Properties, usnistgov/ACVP @ 892fd14): the hashAlgs list
// is shortened; every other key and value is as published.
const REGISTRATION_EXAMPLE = `{
  "algorithm": "ML-DSA",
  "mode": "sigGen",
  "revision": "FIPS204-tr1",
  "prereqVals": [{ "algorithm": "SHA", "valValue": "123456" }],
  "capabilities": [{
    "parameterSets": ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"],
    "messageLength": [{ "min": 8, "max": 65536, "increment": 8 }],
    "hashAlgs": ["SHA2-256", "SHA2-512", "SHAKE-256"],
    "contextLength": [{ "min": 0, "max": 2040, "increment": 8 }]
  }],
  "deterministic": [true, false],
  "externalMu": [true, false],
  "signatureInterfaces": ["external", "internal"],
  "preHash": ["pure", "preHash"],
  "keyFormats": ["expanded", "seed"]
}`

const LIFECYCLE_STEPS: { step: string; call: string; note: React.ReactNode }[] = [
  {
    step: 'Register capabilities',
    call: 'POST /testSessions',
    note: 'The registration lists each algorithm / mode / revision and the options the implementation supports. The server answers with a test session and one vector-set URL per algorithm.',
  },
  {
    step: 'Download each prompt',
    call: 'GET /testSessions/{id}/vectorSets/{vsId}',
    note: 'The prompt (the spec also calls it the request) holds test groups (tgId) of test cases (tcId). Exactly one prompt exists per vector set.',
  },
  {
    step: 'Submit the response',
    call: 'POST …/vectorSets/{vsId}/results',
    note: 'The client returns the implementation’s output for every test case, linked to the prompt by vsId.',
  },
  {
    step: 'Read the disposition',
    call: 'GET …/vectorSets/{vsId}/results',
    note: 'The server reports a disposition for the vector set and for each test case: passed, fail, incomplete, expired, missing or unreceived. “error” applies to the vector set only, not to individual test cases.',
  },
  {
    step: 'Certify the session',
    call: 'PUT /testSessions/{id}',
    note: 'Allowed only when the session is both publishable and passed. The request associates the module and its operational environment (OE) and lists any prerequisite validations.',
  },
  {
    step: 'Retrieve the validation',
    call: 'GET /requests/{requestId}',
    note: 'The certification is a request; once approved it yields the identifier of the validation record.',
  },
]

export const AcvpLabIntroduction: React.FC<AcvpLabIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()
  const certificationEngineer =
    usePersonaStore((state) => state.selectedPersona) === 'cert-engineer'
  const counts = validationCounts as {
    vectorFiles: { active: number }
    nistReferenceSampleFileCount: number
    nistReferenceSampleCaseCount: number
    activeCasesByClass: Record<string, number>
  }

  return (
    <div className="w-full space-y-8">
      <ReviewStatusNotice />

      <div
        className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground"
        data-testid="acvp-audience-route"
      >
        <p className="font-semibold">
          {certificationEngineer
            ? 'Certification engineer route'
            : 'General security practitioner route'}
        </p>
        <p className="mt-1 text-foreground/80">
          {certificationEngineer
            ? 'Track exact protocol and algorithm-specification revisions, operational-environment identity, adapter limits and the evidence rung each artifact reaches.'
            : 'Focus on the lifecycle and claim boundaries: a passing sample, an ACVTS disposition and a validation certificate are different evidence.'}
        </p>
      </div>

      <div className="glass-panel p-5 text-sm text-foreground/80">
        <p>
          This is the algorithm-testing companion to{' '}
          <Link to="/learn/pqc-testing-validation" className="text-primary hover:underline">
            PQC Network Testing &amp; Validation
          </Link>
          , whose workshop walks the ACVP workflow at overview level. Here the same workflow is
          taken apart the way a testing laboratory meets it: what a registration commits you to,
          what each test type asks the implementation to do, where a PKCS#11 interface cannot
          follow, and how to state a result without claiming more than the evidence shows. The
          programme landscape itself (who runs CAVP, CMVP and the testing labs) is covered in{' '}
          <Link to="/learn/standards-bodies" className="text-primary hover:underline">
            Standards, Certification &amp; Compliance Bodies
          </Link>
          .
        </p>
      </div>

      <Callout title="Revision discipline: ACVP is a moving protocol family">
        <p>
          The core protocol used here is <strong>draft-ietf-acvp-spec-01</strong>, an independent
          draft whose name has stayed the same while NIST has kept revising its protocol sections in
          the repository (the latest change is dated 16 October 2025); this module pins it by
          repository commit <Cite s="acvpSpec" />. What changes is the algorithm JSON
          specifications, which evolve separately, so evidence must name the exact core draft,
          algorithm-specification revision, operational environment and vector-set source.
        </p>
        <p>
          The eight evidence classes and the nine-rung claim ladder in this module are PQC Today’s
          own scale for describing test results; NIST does not define one. The scale prevents a
          public ACVP-Server sample, an imported prompt and an ACVTS-issued vector set from being
          reported as if they were interchangeable.
        </p>
      </Callout>

      {/* 1 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="algorithm-vs-module"
        title="Algorithm Validation vs Module Validation"
        icon={<Layers size={24} className="text-primary" />}
      >
        <p>
          Two NIST programmes are routinely blurred together. The{' '}
          <strong>Cryptographic Algorithm Validation Program (CAVP)</strong> validates
          implementations of approved algorithms and their components; NIST calls algorithm
          validation “a prerequisite of cryptographic module validation” <Cite s="cavp" />. The{' '}
          <strong>Cryptographic Module Validation Program (CMVP)</strong>, run jointly by NIST and
          the Canadian Centre for Cyber Security, validates whole cryptographic modules to FIPS
          140-3, using independent NVLAP-accredited Cryptographic and Security Testing (CST)
          laboratories <Cite s="fips1403" />.
        </p>
        <ResponsiveTable
          caption="Algorithm validation compared with module validation"
          head={['Question', 'Algorithm validation (CAVP)', 'Module validation (CMVP)']}
          rows={[
            [
              <>What is tested?</>,
              <>
                An algorithm implementation, by comparing its outputs with known or expected answers{' '}
                <Cite s="cmvpMM" at="§1.4" />
              </>,
              <>
                A defined module against FIPS 140-3’s eleven requirement areas — module
                specification, interfaces, roles/services/authentication, software/firmware,
                operating environment, physical, non-invasive, SSP management, self-tests,
                life-cycle assurance, mitigation of other attacks — at one of four security levels{' '}
                <Cite s="fips1403" />
              </>,
            ],
            [
              <>Which algorithms?</>,
              <>
                Approved algorithms; NIST points to SP 800-140C and SP 800-140D for the lists{' '}
                <Cite s="cavp" /> <Cite s="sp800140c" />
              </>,
              <>
                The approved algorithms the module claims; the lab confirms each complies with all
                requirements of its standard, including those CAVP tests do not reach{' '}
                <Cite s="cmvpMM" at="§2.6.2" />
              </>,
            ],
            [
              <>How is it run?</>,
              <>
                Black-box, through the Automated Cryptographic Validation Testing System (ACVTS):
                the implementation is never sent to NIST <Cite s="cavp" />
              </>,
              <>
                A CST laboratory tests the module, reviews documentation and source, and submits a
                report to the CMVP validation authorities <Cite s="cmvpMM" at="§2.6.2" />
              </>,
            ],
            [
              <>What is published?</>,
              <>
                An algorithm validation certificate on the CAVP validation list <Cite s="cavp" />
              </>,
              <>
                A module certificate; its entry links to the CAVP certificates of the algorithms the
                module uses <Cite s="cmvpMM" at="§4.9.3.5" />
              </>,
            ],
          ]}
        />
        <Callout title="Algorithm testing does not cover every algorithm requirement">
          <p>
            The CMVP Management Manual requires the laboratory to confirm compliance with the
            algorithm standards’ “shall” statements that CAVP testing does not address{' '}
            <Cite s="cmvpMM" at="§2.6.2" />. The ACVP sub-specifications say the same from the other
            side: the ML-DSA test types do not test zeroization of intermediate values, DRBG
            strength, or incorrect-length keys and signatures <Cite s="acvpMlDsa" />. The ML-KEM
            sub-specification carries the same list word for word, including “signatures”, which
            ML-KEM does not produce: the section was copied from ML-DSA <Cite s="acvpMlKem" />.
          </p>
        </Callout>
        <p className="text-xs text-muted-foreground">
          Where this Hub stands: it runs neither programme. It executes selected public reference
          vectors, standards tests, conformance cases and probes, and its results are never an ACVTS
          verdict or a CAVP/CMVP certificate (see the notice at the top of this page).
        </p>
        <p>
          The module side (security levels, the Modules In Process queue, and the CMVP routes for
          adding ML-KEM or ML-DSA to an already-validated module) is taught in{' '}
          <Link to="/learn/fips-140-3-certification" className="text-primary hover:underline">
            FIPS 140-3 Certification
          </Link>
          .
        </p>
      </Section>

      {/* 2 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="capability-registration"
        title="Capability Registration & Vector-Set Negotiation"
        icon={<ListChecks size={24} className="text-primary" />}
      >
        <p>
          ACVP testing starts with the client, not the server. A <strong>registration</strong> is
          the client’s description of the capabilities of one or more algorithm / mode / revision
          combinations <Cite s="acvpSpec" at="§3.2.2" />. ACVTS generates test cases that match
          those capabilities and hands the inputs to the implementation <Cite s="cavp" />. Each
          algorithm in the registration becomes one <strong>test vector set</strong> (identified by{' '}
          <code>vsId</code>), made of <strong>test groups</strong> (<code>tgId</code>) that share
          properties, made of <strong>test cases</strong> (<code>tcId</code>){' '}
          <Cite s="acvpSpec" at="§5.4" />.
        </p>
        <p>
          The registration below is the ML-DSA sigGen example from the ACVP ML-DSA
          sub-specification, with its hash list shortened. Every array is a promise: the server will
          generate test groups for combinations of these values, and the implementation has to
          answer all of them <Cite s="acvpMlDsaCaps" /> <Cite s="acvpMlDsa" />.
        </p>
        <CodeBlock code={REGISTRATION_EXAMPLE} language="json" />
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code>deterministic: [true, false]</code> commits the implementation to both signing
            variants, including hedged groups that carry the server’s randomness{' '}
            <Cite s="acvpMlDsa" />.
          </li>
          <li>
            <code>signatureInterfaces: [&quot;internal&quot;]</code> commits it to answering
            ML-DSA.Sign_internal on a formatted message, and <code>externalMu: [true]</code> to
            accepting a message representative μ computed outside the module{' '}
            <Cite s="acvpMlDsaCaps" /> <Cite s="fips204" at="Alg. 7" />.
          </li>
          <li>
            <code>prereqVals</code> names prerequisite algorithm validations (here SHA){' '}
            <Cite s="acvpMlDsaCaps" />.
          </li>
          <li>
            The <code>revision</code> is part of the identity: the sub-specification lists ML-DSA /
            sigGen as both <code>FIPS204</code> and <code>FIPS204-tr1</code>, “a new test revision
            against the same standard” <Cite s="acvpMlDsaSupported" />.
          </li>
        </ul>
        <Callout title="Register what you can answer, not what you implement">
          <p>
            A module may implement hedged signing and still be unable to answer a hedged sigGen
            test, because the test must inject the randomness. The registration therefore has to
            match what the test harness can drive, not just what the product does. The Hub’s own
            ACVP-format prototype makes the same decision in reverse: it accepts only the algorithm
            / mode / revision triples it pins, and rejects any other with a diagnostic rather than
            guessing a closest revision.
          </p>
        </Callout>
      </Section>

      {/* 3 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="prompt-response-lifecycle"
        title="Prompt → Response → Disposition → Validation"
        icon={<FileJson size={24} className="text-primary" />}
      >
        <p>
          The ACVP specification’s minimal message flow has six exchanges{' '}
          <Cite s="acvpSpec" at="§12.4" />:
        </p>
        <ol className="space-y-2">
          {LIFECYCLE_STEPS.map((s, i) => (
            <li key={s.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  {s.step} <code className="ml-1 text-[11px] text-muted-foreground">{s.call}</code>
                </p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          Sources for the steps: <Cite s="acvpSpec" at="§5.4" /> <Cite s="acvpSpec" at="§12.16.4" />{' '}
          <Cite s="acvpSpec" at="§12.17.4" />.
        </p>
        <Callout title="Details that decide what a result means">
          <p>
            A <strong>passed</strong> disposition means every test case in the vector set was
            processed and passed, and indicates the algorithm is ready for validation — it is not
            itself the validation <Cite s="acvpSpec" at="§5.4, §12.17.4" />.
          </p>
          <p>
            A session created with <code>isSample: true</code> lets the client retrieve the expected
            results, and its vector sets may be smaller <Cite s="acvpSpec" at="§12.16, §12.17.7" />.
            For a validation authority, vector sets are one-time use: an old vector set can never be
            reused to obtain a new certificate <Cite s="acvpSpec" at="§14" />.
          </p>
          <p>
            NIST runs two ACVTS environments. <strong>Demo</strong> is a semi-volatile sandbox for
            testing implementations and ACVP clients. <strong>Prod</strong> is restricted to
            accredited CST laboratories and 17ACVT laboratories; a lab may run an algorithm in Prod
            only after running it at least once through certification in Demo{' '}
            <Cite s="acvtsAccess" />. Only Prod creates the algorithm validation certificates on the
            CAVP list <Cite s="cavp" />.
          </p>
        </Callout>
        <p>
          Map this onto the Hub’s claim ladder and the boundary is exact: generating a response to
          an issued prompt is rung 7; the disposition is rung 8; a published validation record is
          rung 9. The Hub’s ACVP-format prototype stops at local import and response export — it has
          no ACVTS session, credentials, submission or verdict retrieval.
        </p>
      </Section>

      {/* 4 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="test-types"
        title="AFT, VAL, MCT and Algorithm-Specific Test Types"
        icon={<Boxes size={24} className="text-primary" />}
      >
        <p>
          A test type describes the <em>format</em> of a test rather than its intention; several
          tests of the same type can cover different assurances <Cite s="acvpMlDsa" />. The
          vocabulary is defined per algorithm, in each ACVP sub-specification:
        </p>
        <ResponsiveTable
          caption="ACVP test types by algorithm"
          head={['Algorithm / mode', 'Test type', 'What the implementation must do']}
          rows={[
            [
              <>SHA-1 / SHA-2</>,
              <>AFT</>,
              <>
                Hash single, multiple and partial blocks of random data — checks chunking and
                padding <Cite s="acvpSha" />
              </>,
            ],
            [
              <>SHA-1 / SHA-2</>,
              <>MCT</>,
              <>
                Monte Carlo Test: from one seed, run 100 × 1,000 chained hashes where each digest
                feeds the next message; aimed at state, allocation and error-handling faults{' '}
                <Cite s="acvpSha" />
              </>,
            ],
            [
              <>SHA-1 / SHA-2</>,
              <>LDT</>,
              <>
                Large Data Test: hash a multi-gigabyte message described, not transmitted, by the
                prompt <Cite s="acvpSha" />
              </>,
            ],
            [
              <>ML-KEM / keyGen</>,
              <>AFT</>,
              <>
                Generate a key pair from a provided seed (ML-KEM.KeyGen_internal){' '}
                <Cite s="acvpMlKem" />
              </>,
            ],
            [
              <>ML-KEM / encapDecap</>,
              <>AFT</>,
              <>
                Encapsulate with a server-chosen <code>m</code> (ML-KEM.Encaps_internal) and return{' '}
                <code>c</code> and <code>k</code> <Cite s="acvpMlKem" />
              </>,
            ],
            [
              <>ML-KEM / encapDecap</>,
              <>VAL</>,
              <>
                Decapsulate valid or modified ciphertexts (ML-KEM.Decaps_internal), or decide
                whether an encapsulation key (FIPS 203 §7.2) or decapsulation key (§7.3) is valid{' '}
                <Cite s="acvpMlKem" />
              </>,
            ],
            [
              <>ML-DSA / keyGen, sigGen, sigVer</>,
              <>AFT</>,
              <>
                Key pair from a seed; signatures compared with the server’s known signature;
                validity decisions on modified signatures <Cite s="acvpMlDsa" />
              </>,
            ],
            [
              <>SLH-DSA / keyGen, sigGen, sigVer</>,
              <>AFT</>,
              <>
                Key pair from SK.seed, SK.prf and PK.seed; signatures from provided keys and
                randomness; validity decisions on modified signatures <Cite s="acvpSlhDsa" />
              </>,
            ],
          ]}
        />
        <Callout title="Minimums are part of the test design">
          <p>
            The sub-specifications fix minimum test counts per combination of capabilities — for
            example at least 15 ML-DSA sigGen tests and at least 3 ML-DSA sigVer tests per
            modification type <Cite s="acvpMlDsa" />, and at least 13 SLH-DSA sigGen tests{' '}
            <Cite s="acvpSlhDsa" />. ML-DSA sigGen also requires tests that drive every rejection
            path of ML-DSA.Sign_internal, and tests that force at least 32 rejections, on the
            internal, deterministic interface <Cite s="acvpMlDsa" />.
          </p>
          <p>
            A single passing case per parameter set is therefore a <em>sample</em> of an ACVP test
            type, never its coverage.
          </p>
        </Callout>
      </Section>

      {/* 5 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="deterministic-randomized"
        title="Deterministic vs Randomized Algorithms"
        icon={<Shuffle size={24} className="text-primary" />}
      >
        <p>
          FIPS 203, 204 and 205 each split their algorithms into an <strong>external</strong>{' '}
          interface, which generates its own randomness, and an <strong>internal</strong> interface
          that takes the randomness as an input. Tests that must supply the random input use the
          internal interfaces; the current ACVP ML-DSA specification supports testing both the
          internal and the external interface <Cite s="acvpMlDsa" at="§6.1.2" />. Each standard says
          they should not be offered to applications other than for testing, because the random
          values shall be generated by the module <Cite s="fips203" at="§6" />{' '}
          <Cite s="fips204" at="§6" /> <Cite s="fips205" at="§9" />.
        </p>
        <ResponsiveTable
          caption="Where randomness enters each PQC algorithm"
          head={['Operation', 'Randomness', 'Consequence for testing']}
          rows={[
            [
              <>ML-KEM.Encaps</>,
              <>
                32-byte <code>m</code> drawn inside the module; Encaps_internal(ek, m) takes it as
                input <Cite s="fips203" at="Alg. 17, 20" />
              </>,
              <>Byte-exact testing needs the internal interface with the server’s m.</>,
            ],
            [
              <>ML-DSA.Sign</>,
              <>
                Default <em>hedged</em>: <code>rnd</code> from an RBG. Optional{' '}
                <em>deterministic</em>: <code>rnd</code> = 32 zero bytes; that is the only
                difference <Cite s="fips204" at="§3.4, Alg. 2, Alg. 7" />
              </>,
              <>
                Deterministic signatures can be compared byte for byte; hedged ones only if the test
                can inject <code>rnd</code>.
              </>,
            ],
            [
              <>SLH-DSA sign</>,
              <>
                Default hedged: <code>opt_rand</code> = <code>addrnd</code>. Deterministic:{' '}
                <code>opt_rand</code> = PK.seed <Cite s="fips205" at="§9.2, Alg. 19" />
              </>,
              <>Same split as ML-DSA.</>,
            ],
          ]}
        />
        <p>
          FIPS 204 treats the variants differently for security, not only for testing: hedged
          signing helps mitigate side-channel attacks, the deterministic variant “should not be used
          on platforms where side-channel attacks are a concern and where they cannot be otherwise
          mitigated”, and implementing the hedged variant alone is sufficient for interoperability{' '}
          <Cite s="fips204" at="§3.4" />.
        </p>
        <Callout title="Comparator policy follows from the algorithm">
          <p>
            You are comparing two implementations of ML-DSA, the post-quantum digital-signature
            algorithm. They sign the same message with the same key, context and settings. In normal
            hedged signing, each call uses fresh random input, so the signatures can differ without
            either implementation being wrong. Check that both signatures verify; different bytes
            alone do not establish a fault.
          </p>
          <p>
            In an ACVP signature-generation test, however, the test supplies the random input as
            well as the other inputs. The implementation must use those inputs and produce the
            expected signature exactly. Successful verification alone is not enough to pass that
            test <Cite s="acvpMlDsa" at="§6.1.2" />.
          </p>
        </Callout>
      </Section>

      {/* 6 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="pkcs11-adapter-boundaries"
        title="PKCS#11 Adapter Boundaries"
        icon={<Plug size={24} className="text-primary" />}
      >
        <p>
          ACVP talks to an implementation through whatever interface the test harness can reach{' '}
          <Cite s="acvpSpec" at="§4.2, §5" />. For the Hub that interface is PKCS#11 v3.2, on two
          WASM engines (C++ and Rust). An ACVP test group can only be answered if the interface
          takes exactly the inputs the group supplies — nothing coerced, nothing defaulted. Where
          standard PKCS#11 has no field for an input, this HSM accepts it as an optional test input
          outside the standard, and every result that used one says so.
        </p>
        <ResponsiveTable
          caption="How each ACVP test group reaches the HSM: standard PKCS#11, or an optional test input outside it"
          head={['ACVP test group', 'Interface path', 'Hub disposition']}
          rows={[
            [
              <>ML-KEM decapsulation (VAL)</>,
              <>
                Import dk, then C_DecapsulateKey with CKM_ML_KEM (ML-KEM.Decaps){' '}
                <Cite s="pkcs11" at="§6.68" />
              </>,
              <>Executed; k is the derived key’s CKA_VALUE</>,
            ],
            [
              <>ML-KEM encapsulation (AFT)</>,
              <>
                Standard PKCS#11 has no field for <code>m</code>: C_EncapsulateKey takes a
                public-key handle and a template <Cite s="pkcs11" at="§5.18.8" />. This HSM accepts{' '}
                <code>m</code> (32 bytes) as an optional test input, the CKM_ML_KEM mechanism
                parameter <Cite s="fips203" at="Alg. 17" />
              </>,
              <>
                Executed on both engines in the Playground suite and in Step 3: c and k are
                byte-compared with NIST’s, and each result is labelled “test input supplied (outside
                the standard)”. Step 3 first checks that the engine really uses the supplied{' '}
                <code>m</code> (the same <code>m</code> twice gives the same output, a different{' '}
                <code>m</code> a different ciphertext); if not, nothing is answered
              </>,
            ],
            [
              <>ML-KEM key checks (VAL)</>,
              <>
                None: in the PKCS#11 v3.2 text read for this module the ML-KEM mechanism covers
                ML-KEM.Encaps and ML-KEM.Decaps <Cite s="pkcs11" at="§6.68" />, and the FIPS 203
                §7.2/§7.3 input checks have no operation of their own{' '}
                <Cite s="fips203" at="§7.2, §7.3" />
              </>,
              <>
                Executed in Step 3 from what these engines do when the key is imported (PKCS#11
                itself does not require a key check at import; these engines run one): accepted
                means valid, refused with exactly CKR_ATTRIBUTE_VALUE_INVALID means invalid, and any
                other result is an error, never a guess. evidence.json keeps the return code for
                every key
              </>,
            ],
            [
              <>ML-DSA sigVer, external, pure / preHash</>,
              <>
                CKM_ML_DSA (ML-DSA.Verify) or CKM_HASH_ML_DSA_&lt;hash&gt;, context in
                CK_SIGN_ADDITIONAL_CONTEXT <Cite s="pkcs11" at="§6.67.5–6.67.7" />
              </>,
              <>
                Executed. SHA2-512/224 and SHA2-512/256 have no CKM_HASH_ML_DSA_&lt;hash&gt;
                mechanism <Cite s="pkcs11" at="§6.67" />; the generic CKM_HASH_ML_DSA takes them as
                its <code>hash</code> (CKM_SHA512_224 / CKM_SHA512_256) with the caller computing
                PH(M). Step 3 runs these through that route too, labelled “computed outside the
                engine”
              </>,
            ],
            [
              <>ML-DSA internal interface on M′ (externalMu false)</>,
              <>
                CKM_ML_DSA implements FIPS 204 Algorithms 2 and 3 on the message M{' '}
                <Cite s="pkcs11" at="§6.67.5" />, but the internal interface only ever signs μ =
                SHAKE256(tr ‖ M′, 64) <Cite s="fips204" at="Alg. 7, line 6" />. The harness computes
                μ from the public key and M′ and uses the external-μ mechanism below — no extension
              </>,
              <>
                Playground suite: executed on both engines (sigGen byte-match and sigVer). Step 3
                runs the sigVer groups the same way, labelled “computed outside the engine”
              </>,
            ],
            [
              <>ML-DSA internal interface with external μ</>,
              <>
                No PKCS#11 v3.2 mechanism. The Hub’s engines use a non-standard mechanism code,
                0x403c, for it; FIPS 204 allows μ to be computed in a different module{' '}
                <Cite s="fips204" at="Alg. 7, line 6" />
              </>,
              <>
                Executed (Playground suite and ACVP-format prototype) where an engine advertises
                0x403c, labelled vendor-defined in evidence.json
              </>,
            ],
            [
              <>ML-DSA sigGen, deterministic</>,
              <>
                Import sk, sign with hedgeVariant CKH_DETERMINISTIC_REQUIRED{' '}
                <Cite s="pkcs11" at="§6.67.5" />
              </>,
              <>Byte-comparable with NIST’s deterministic sigGen sample (Playground suite)</>,
            ],
            [
              <>ML-DSA sigGen, hedged</>,
              <>
                Standard PKCS#11 has no field for <code>rnd</code>: CKH_HEDGE_REQUIRED demands
                hedging but offers no input for it <Cite s="pkcs11" at="§6.67.5" />. This HSM
                accepts <code>rnd</code> as an optional test input in an extended signing structure:
                the standard CK_SIGN_ADDITIONAL_CONTEXT fields, then <code>pRandom</code>,{' '}
                <code>ulRandomLen</code> and <code>messageEncoding</code>
              </>,
              <>
                Playground suite: byte-comparable with NIST’s hedged sigGen, labelled “test input
                supplied (outside the standard)”
              </>,
            ],
            [
              <>SLH-DSA sigGen hedged, and sign / verify on the internal interface</>,
              <>
                Standard PKCS#11 has no field for <code>addrnd</code> and no internal-interface
                mechanism <Cite s="pkcs11" at="§6.69" />. This HSM accepts <code>addrnd</code> and{' '}
                <code>messageEncoding = internal</code> (slh_sign_internal / slh_verify_internal) in
                the same extended structure <Cite s="fips205" at="§9.2–9.3, Alg. 19–20" />
              </>,
              <>
                Playground suite: executed on both engines, labelled “test input supplied (outside
                the standard)”
              </>,
            ],
            [
              <>ECDSA sigGen (AFT, NIST’s k)</>,
              <>
                Standard CKM_ECDSA takes no parameter and draws k itself{' '}
                <Cite s="pkcs11" at="§6.3" />. This HSM accepts k as the optional CKM_ECDSA
                parameter
              </>,
              <>
                Playground suite: r ‖ s byte-compared with NIST’s, labelled “test input supplied
                (outside the standard)”
              </>,
            ],
            [
              <>ML-DSA keyGen (AFT)</>,
              <>
                CKM_ML_DSA_KEY_PAIR_GEN with the seed ξ supplied as CKA_SEED. The specification
                lists CKA_SEED among the attributes the mechanism <em>contributes</em>, so accepting
                a caller’s seed is engine behaviour, not a PKCS#11 requirement{' '}
                <Cite s="pkcs11" at="§6.67.4" />
              </>,
              <>Byte-comparable public key (Playground suite), engine-specific path</>,
            ],
          ]}
        />
        <Callout title="Optional test inputs: outside the standard, for testing only">
          <p>
            Standard PKCS#11 has no field for the random value an operation draws (ML-KEM{' '}
            <code>m</code>, ML-DSA <code>rnd</code>, SLH-DSA <code>addrnd</code>, ECDSA k) or for
            the SLH-DSA internal interface. This HSM accepts each as an{' '}
            <strong>optional test input</strong>: left out, the HSM draws the value itself exactly
            as the standard says, so a caller using only standard PKCS#11 sees no difference.
          </p>
          <p>
            FIPS 203, 204 and 205 reserve these internal interfaces for testing; outside testing the
            module must generate the random values itself <Cite s="fips203" at="§6" />{' '}
            <Cite s="fips204" at="§6" /> <Cite s="fips205" at="§9" />. A validated module would keep
            such inputs out of its approved mode. ML-DSA’s internal interface needs no input of this
            kind: it goes through the external-μ mechanism with a μ the harness computes. A known
            ECDSA k recovers the private key from one signature, which is why FIPS 186-5 requires k
            to be protected from disclosure and no real module should accept one outside testing{' '}
            <Cite s="fips1865" at="§6.3, §6.3.2" />.
          </p>
        </Callout>
        <Callout title="The adapter’s three honest outcomes">
          <p>
            For every test case the Hub’s dispatcher produces exactly one of: an{' '}
            <strong>answer</strong> (e.g. CKR_OK → <code>testPassed: true</code>;
            CKR_SIGNATURE_INVALID or CKR_SIGNATURE_LEN_RANGE → <code>false</code>), an{' '}
            <strong>unsupported</strong> record with the reason, or an <strong>error</strong> (any
            other return value, which produces no response entry). Unsupported is never counted as a
            pass, and an API failure is never reported as “signature invalid”.
          </p>
        </Callout>
      </Section>

      {/* 7 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="negative-testing"
        title="Negative and Failure Testing"
        icon={<ShieldAlert size={24} className="text-primary" />}
      >
        <p>
          ACVP builds negative cases into the vector sets. An implementation that answers “valid” to
          everything fails them:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>ML-DSA sigVer</strong>: the server modifies a valid signature — modified
            message, modified commitment, modified z, modified hint — and includes at least 3 tests
            per modification type <Cite s="acvpMlDsa" />.
          </li>
          <li>
            <strong>SLH-DSA sigVer</strong> adds modified R, SIG<sub>FORS</sub> and SIG
            <sub>HT</sub>, and signatures that are too long or too short <Cite s="acvpSlhDsa" />.
          </li>
          <li>
            <strong>ML-KEM VAL</strong>: modified ciphertexts must go through implicit rejection and
            still return a key; invalid encapsulation and decapsulation keys must be detected{' '}
            <Cite s="acvpMlKem" /> <Cite s="fips203" at="Alg. 18, §7.2, §7.3" />.
          </li>
        </ul>
        <Callout title="Why rejecting a bad signature is a passing test">
          <p>
            We deliberately give the module a bad signature. If it rejects that signature, the test
            passes—the module did its job correctly.
          </p>
          <p>
            A failed internal self-test means something different: the module checked its own
            cryptographic implementation and that check failed. This does not prove it correctly
            examined our bad signature.
          </p>
          <p>
            Therefore, our test must check why the operation failed—not treat every error as a
            correct rejection.
          </p>
        </Callout>
        <Callout title="Implicit rejection is not an error path">
          <p>
            You are testing a cryptographic implementation&rsquo;s ML-KEM decapsulation operation:
            the step that uses the recipient&rsquo;s private key and the received ciphertext to
            recover a shared secret. This ACVP test supplies a ciphertext of the correct length that
            triggers the algorithm&rsquo;s internal rejection check, with otherwise valid inputs.
            The expected result is the fallback shared secret prescribed by FIPS 203—not an error
            and not an arbitrary random secret. The test passes only if the returned secret exactly
            matches the expected value. This test checks ML-KEM itself; it does not need to encrypt
            or decrypt application data. A wrong-length ciphertext is a separate input-error case{' '}
            <Cite s="fips203" at="§6.3, §7.3" /> <Cite s="acvpMlKem" at="§6.1" />.
          </p>
          <p>
            <strong>Try it.</strong> Run the ML-KEM tests in the{' '}
            <Link
              to="/playground/hsm?tab=developer&dtab=acvp"
              className="text-primary hover:underline"
            >
              ACVP suite
            </Link>{' '}
            and compare two results. The row &ldquo;PKCS#11 boundary · product-authored probe ·
            C_DecapsulateKey with a … (1 short)&rdquo; gives a ciphertext of the wrong length; the
            correct result is an input error. A row &ldquo;Decapsulate · NIST encapDecap VAL … ·
            modified ciphertext → implicit rejection k&rdquo; gives a correct-length ciphertext that
            was altered; the correct result is success, with the returned secret equal to
            NIST&rsquo;s expected fallback value. Both outcomes are correct: the first input breaks
            the rules before decapsulation starts, the second passes those checks and is handled by
            implicit rejection inside the algorithm.
          </p>
        </Callout>
        <p>
          Two kinds of negative testing sit outside ACVP.{' '}
          <strong>Requirements ACVP does not test</strong> — the sub-specifications list
          zeroization, DRBG strength and incorrect-length keys and signatures for ML-DSA{' '}
          <Cite s="acvpMlDsa" /> (the ML-KEM sub-specification repeats the ML-DSA list, a copy
          error, as it names signatures <Cite s="acvpMlKem" />
          ). And <strong>API behaviour</strong>: wrong key type, wrong state, short buffers and
          other PKCS#11 return codes, which OASIS profile cases and product probes exercise{' '}
          <Cite s="pkcs11Profiles" />.
        </p>
        <p className="text-xs text-muted-foreground">
          Vocabulary the Hub holds itself to: one happy-path case is “sampled”, never “covered”;
          positive, negative, boundary and error-path coverage are reported separately, so a passing
          round-trip can never turn a negative-coverage cell green.
        </p>
      </Section>

      {/* 8 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="evidence-provenance"
        title="Evidence Provenance & Reproducibility"
        icon={<Scale size={24} className="text-primary" />}
      >
        <p>
          The Hub gives every result exactly one of eight evidence classes, each with the only claim
          a passing result of that class may make <Cite s="hubPolicy" />. The classes are the Hub’s
          policy, not a NIST taxonomy:
        </p>
        <ResponsiveTable
          caption="The eight evidence classes and their permitted claims"
          head={['Evidence class', 'Meaning', 'Permitted claim']}
          rows={EVIDENCE_CLASS_IDS.map((id) => [
            <>
              <span className="font-semibold text-foreground">{EVIDENCE_CLASSES[id].label}</span>
              <br />
              <code className="text-[10px] text-muted-foreground">{id}</code>
            </>,
            EVIDENCE_CLASSES[id].meaning,
            <>“{EVIDENCE_CLASSES[id].permittedClaim}”</>,
          ])}
        />
        <div>
          <h3 className="mb-2 font-semibold text-foreground">The claim ladder</h3>
          <p className="mb-2">
            Public wording stays on the highest rung actually reached. Passing rung 6 does not imply
            rungs 7–9 <Cite s="hubPolicy" />.
          </p>
          <ol className="space-y-1">
            {CLAIM_LADDER.map((rung, i) => (
              <li key={rung} className="flex items-center gap-2 text-xs">
                <span
                  className={
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ' +
                    (i + 1 <= HUB_REACHABLE_MAX_RUNG
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground')
                  }
                >
                  {i + 1}
                </span>
                <span>{rung}</span>
                {i + 1 > HUB_REACHABLE_MAX_RUNG ? (
                  <span className="text-muted-foreground">— needs ACVTS and NIST</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <Callout title="Provenance is a hash, not a label">
          <p>
            A result is publishable only with its tested scope attached: algorithm and revision,
            operation, parameters, positive or negative expectation, vector source with an immutable
            hash (or oracle name and version), engine and build identity, runner and test ID, actual
            and expected result, timestamp and known limitations.
          </p>
          <p>
            The Hub’s public NIST fixtures are pinned by ACVP-Server commit and SHA-256{' '}
            <Cite s="acvpServer" />. Its ACVP-format prototype calls a prompt a public reference
            sample only when the prompt’s SHA-256 matches one of those pins; any other prompt is
            recorded as an unverified imported vector set. When a vector is transformed — for
            example a sigGen output reused as a positive sigVer case — both the upstream and the
            local operation are recorded.
          </p>
        </Callout>
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-1 font-semibold text-foreground">
            Generated counts, never typed by hand
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Read at build time from the Hub’s vector manifest
            (src/data/validation/validation-counts.generated.json): {counts.vectorFiles.active}{' '}
            active vector files, of which {counts.nistReferenceSampleFileCount} carry public NIST
            ACVP-Server reference samples ({counts.nistReferenceSampleCaseCount} active cases).
          </p>
          <ResponsiveTable
            caption="Active validation cases by evidence class"
            head={['Evidence class', 'Active cases']}
            rows={EVIDENCE_CLASS_IDS.map((id) => [
              EVIDENCE_CLASSES[id].label,
              counts.activeCasesByClass[id] ?? 0,
            ])}
          />
        </div>
      </Section>

      {/* 9 ─────────────────────────────────────────────────────────────── */}
      <Section
        id="cross-implementation-limits"
        title="Cross-Implementation & Cross-Platform Limits"
        icon={<GitCompareArrows size={24} className="text-primary" />}
      >
        <p>
          Running the same case on two implementations or two platforms is valuable — a disagreement
          is always a finding. Agreement is weaker than it looks:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Shared layers.</strong> In the Hub’s ACVP-format prototype, the C++ and Rust
            engines are driven by one dispatcher and one response builder. A defect in that shared
            code makes both engines agree and both be wrong, so dual-engine agreement is
            differential evidence, not independent validation. External expected values — a NIST
            sample, a published KAT — are what break the tie.
          </li>
          <li>
            <strong>Byte vs semantic equivalence.</strong> Hedged signatures differ on every run by
            design <Cite s="fips204" at="§3.4" />; the comparison policy must be declared per
            operation.
          </li>
          <li>
            <strong>Environment identity.</strong> ACVP binds testing to an operational environment
            — “the specific hardware and/or software the client’s cryptographic implementation uses
            to run” — and certification associates the module with its OE{' '}
            <Cite s="acvpSpec" at="§5.4, §12.16.4" />. A result from WebAssembly in a browser says
            nothing about a native build, a different CPU, or a hardware accelerator until that
            target runs the same cases and records its own identity.
          </li>
          <li>
            <strong>Confirm the execution path.</strong> An “acceleration enabled” setting does not
            prove that a test used the accelerator. A library may choose different implementations
            for different operations, or fall back to software. To claim hardware-path coverage,
            retain evidence showing which implementation handled the tested operation—for example,
            an implementation-specific execution trace or counter. If that evidence is unavailable,
            say that the execution path was not confirmed.
          </li>
          <li>
            <strong>Honest statuses.</strong> Cross-target reports keep pass, fail, unsupported, not
            run and not comparable apart; the last three never add up to a pass.
          </li>
        </ul>
      </Section>

      {/* 10 ────────────────────────────────────────────────────────────── */}
      <Section
        id="contributing-tests"
        title="Contributing a Source-Backed Test"
        icon={<Users size={24} className="text-primary" />}
      >
        <p>
          The Hub accepts a new expected-value vector only with its provenance. Every vector file
          under <code>src/data/acvp/</code> must have an entry in the vector manifest, and the gate
          fails until it does. The manifest’s own header documents the procedure:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Add the vector file under src/data/acvp/.</li>
          <li>
            Generate a skeleton entry with the maintainers’ vector-manifest tool — it records the
            file’s SHA-256 and one case record per test case.
          </li>
          <li>
            Fill every TODO: the evidence class; the source (for NIST ACVP-Server material the
            commit, upstream path, retrieval date and upstream SHA-256); each case’s operation,
            parameters and positive/negative expectation; and a lineage record for any subset,
            rename or change of operation.
          </li>
          <li>
            The maintainers then run the vector-manifest check and regenerate the validation counts.
          </li>
        </ol>
        <Callout title="What a reviewer will check">
          <ul className="list-disc space-y-1 pl-4">
            <li>The source is primary and immutable (a commit, a published document revision).</li>
            <li>A licence or redistribution note exists for the copied values.</li>
            <li>The expected behaviour is stated, including every negative case.</li>
            <li>
              The Hub’s evidence policy asks for two reviewers — one verifies the source, a
              different one reviews the implementation — and the author is not the only reviewer.
            </li>
            <li>
              Nothing issued to a real ACVTS session is committed: issued vector sets may be
              controlled laboratory data and are processed locally only.
            </li>
          </ul>
        </Callout>
        <p>
          Propose the test with the{' '}
          <a
            href="https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=validation_contribution.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            validation contribution issue template
          </a>
          : it asks for the algorithm and parameters, the immutable source, the licence note and the
          expected behaviour, which is what a reviewer checks above.
        </p>
        <p>
          Not a coder? Open a{' '}
          <a
            href="https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=data_suggestion.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Data Suggestion issue
          </a>{' '}
          with the source URL and the exact case, and the maintainer does the manifest work.
        </p>
      </Section>

      <ReadingCompleteButton />

      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-bold"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Classify evidence, dissect a public NIST vector set, and produce a response artifact.
        </p>
      </div>
    </div>
  )
}
