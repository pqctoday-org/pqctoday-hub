// SPDX-License-Identifier: GPL-3.0-only
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
import { EVIDENCE_CLASSES, EVIDENCE_CLASS_IDS } from '@/data/validation/evidenceClasses'
import validationCounts from '@/data/validation/validation-counts.generated.json'
import { UNSUPPORTED_REASONS } from '@/services/acvp/dispatch'
import { Cite } from './Cite'
import { DraftStatusNotice } from './DraftStatusNotice'
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

const TableShell: React.FC<{ caption: string; children: React.ReactNode }> = ({
  caption,
  children,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-xs">
      <caption className="sr-only">{caption}</caption>
      {children}
    </table>
  </div>
)

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th scope="col" className="border-b border-border py-2 pr-3 text-left font-semibold">
    {children}
  </th>
)
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="border-b border-border/50 py-2 pr-3 align-top">{children}</td>
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
    note: 'The server reports passed, fail, incomplete, expired, missing, unreceived or error for the vector set and for each test case.',
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
  const counts = validationCounts as {
    vectorFiles: { active: number }
    nistReferenceSampleFileCount: number
    nistReferenceSampleCaseCount: number
    activeCasesByClass: Record<string, number>
  }

  return (
    <div className="w-full space-y-8">
      <DraftStatusNotice />

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
        <TableShell caption="Algorithm validation compared with module validation">
          <thead>
            <tr>
              <Th>Question</Th>
              <Th>Algorithm validation (CAVP)</Th>
              <Th>Module validation (CMVP)</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>What is tested?</Td>
              <Td>
                An algorithm implementation, by comparing its outputs with known or expected answers{' '}
                <Cite s="cmvpMM" at="§1.4" />
              </Td>
              <Td>
                A defined module against FIPS 140-3’s eleven requirement areas — module
                specification, interfaces, roles/services/authentication, software/firmware,
                operating environment, physical, non-invasive, SSP management, self-tests,
                life-cycle assurance, mitigation of other attacks — at one of four security levels{' '}
                <Cite s="fips1403" />
              </Td>
            </tr>
            <tr>
              <Td>Which algorithms?</Td>
              <Td>
                Approved algorithms; NIST points to SP 800-140C and SP 800-140D for the lists{' '}
                <Cite s="cavp" /> <Cite s="sp800140c" />
              </Td>
              <Td>
                The approved algorithms the module claims; the lab confirms each complies with all
                requirements of its standard, including those CAVP tests do not reach{' '}
                <Cite s="cmvpMM" at="§2.6.2" />
              </Td>
            </tr>
            <tr>
              <Td>How is it run?</Td>
              <Td>
                Black-box, through the Automated Cryptographic Validation Testing System (ACVTS):
                the implementation is never sent to NIST <Cite s="cavp" />
              </Td>
              <Td>
                A CST laboratory tests the module, reviews documentation and source, and submits a
                report to the CMVP validation authorities <Cite s="cmvpMM" at="§2.6.2" />
              </Td>
            </tr>
            <tr>
              <Td>What is published?</Td>
              <Td>
                An algorithm validation certificate on the CAVP validation list <Cite s="cavp" />
              </Td>
              <Td>
                A module certificate; its entry links to the CAVP certificates of the algorithms the
                module uses <Cite s="cmvpMM" at="§4.9.3.5" />
              </Td>
            </tr>
          </tbody>
        </TableShell>
        <Callout title="Algorithm testing does not cover every algorithm requirement">
          <p>
            The CMVP Management Manual requires the laboratory to confirm compliance with the
            algorithm standards’ “shall” statements that CAVP testing does not address{' '}
            <Cite s="cmvpMM" at="§2.6.2" />. The ACVP sub-specifications say the same from the other
            side: the ML-KEM and ML-DSA test types do not test zeroization of intermediate values,
            DRBG strength, or incorrect-length keys and signatures <Cite s="acvpMlKem" />{' '}
            <Cite s="acvpMlDsa" />.
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
        <TableShell caption="ACVP test types by algorithm">
          <thead>
            <tr>
              <Th>Algorithm / mode</Th>
              <Th>Test type</Th>
              <Th>What the implementation must do</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>SHA-1 / SHA-2</Td>
              <Td>AFT</Td>
              <Td>
                Hash single, multiple and partial blocks of random data — checks chunking and
                padding <Cite s="acvpSha" />
              </Td>
            </tr>
            <tr>
              <Td>SHA-1 / SHA-2</Td>
              <Td>MCT</Td>
              <Td>
                Monte Carlo Test: from one seed, run 100 × 1,000 chained hashes where each digest
                feeds the next message; aimed at state, allocation and error-handling faults{' '}
                <Cite s="acvpSha" />
              </Td>
            </tr>
            <tr>
              <Td>SHA-1 / SHA-2</Td>
              <Td>LDT</Td>
              <Td>
                Large Data Test: hash a multi-gigabyte message described, not transmitted, by the
                prompt <Cite s="acvpSha" />
              </Td>
            </tr>
            <tr>
              <Td>ML-KEM / keyGen</Td>
              <Td>AFT</Td>
              <Td>
                Generate a key pair from a provided seed (ML-KEM.KeyGen_internal){' '}
                <Cite s="acvpMlKem" />
              </Td>
            </tr>
            <tr>
              <Td>ML-KEM / encapDecap</Td>
              <Td>AFT</Td>
              <Td>
                Encapsulate with a server-chosen <code>m</code> (ML-KEM.Encaps_internal) and return{' '}
                <code>c</code> and <code>k</code> <Cite s="acvpMlKem" />
              </Td>
            </tr>
            <tr>
              <Td>ML-KEM / encapDecap</Td>
              <Td>VAL</Td>
              <Td>
                Decapsulate valid or modified ciphertexts (ML-KEM.Decaps_internal), or decide
                whether an encapsulation key (FIPS 203 §7.2) or decapsulation key (§7.3) is valid{' '}
                <Cite s="acvpMlKem" />
              </Td>
            </tr>
            <tr>
              <Td>ML-DSA / keyGen, sigGen, sigVer</Td>
              <Td>AFT</Td>
              <Td>
                Key pair from a seed; signatures compared with the server’s known signature;
                validity decisions on modified signatures <Cite s="acvpMlDsa" />
              </Td>
            </tr>
            <tr>
              <Td>SLH-DSA / keyGen, sigGen, sigVer</Td>
              <Td>AFT</Td>
              <Td>
                Key pair from SK.seed, SK.prf and PK.seed; signatures from provided keys and
                randomness; validity decisions on modified signatures <Cite s="acvpSlhDsa" />
              </Td>
            </tr>
          </tbody>
        </TableShell>
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
          that takes the randomness as an input. The internal interfaces are the ones CAVP tests,
          and each standard says they should not be offered to applications other than for testing,
          because the random values shall be generated by the module <Cite s="fips203" at="§6" />{' '}
          <Cite s="fips204" at="§6" /> <Cite s="fips205" at="§9" />.
        </p>
        <TableShell caption="Where randomness enters each PQC algorithm">
          <thead>
            <tr>
              <Th>Operation</Th>
              <Th>Randomness</Th>
              <Th>Consequence for testing</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>ML-KEM.Encaps</Td>
              <Td>
                32-byte <code>m</code> drawn inside the module; Encaps_internal(ek, m) takes it as
                input <Cite s="fips203" at="Alg. 17, 20" />
              </Td>
              <Td>Byte-exact testing needs the internal interface with the server’s m.</Td>
            </tr>
            <tr>
              <Td>ML-DSA.Sign</Td>
              <Td>
                Default <em>hedged</em>: <code>rnd</code> from an RBG. Optional{' '}
                <em>deterministic</em>: <code>rnd</code> = 32 zero bytes; that is the only
                difference <Cite s="fips204" at="§3.4, Alg. 2, Alg. 7" />
              </Td>
              <Td>
                Deterministic signatures can be compared byte for byte; hedged ones only if the test
                can inject <code>rnd</code>.
              </Td>
            </tr>
            <tr>
              <Td>SLH-DSA sign</Td>
              <Td>
                Default hedged: <code>opt_rand</code> = <code>addrnd</code>. Deterministic:{' '}
                <code>opt_rand</code> = PK.seed <Cite s="fips205" at="§9.2, Alg. 19" />
              </Td>
              <Td>Same split as ML-DSA.</Td>
            </tr>
          </tbody>
        </TableShell>
        <p>
          FIPS 204 treats the variants differently for security, not only for testing: hedged
          signing helps mitigate side-channel attacks, the deterministic variant “should not be used
          on platforms where side-channel attacks are a concern and where they cannot be otherwise
          mitigated”, and implementing the hedged variant alone is sufficient for interoperability{' '}
          <Cite s="fips204" at="§3.4" />.
        </p>
        <Callout title="Comparator policy follows from the algorithm">
          <p>
            Two correct implementations of a hedged signature scheme will not produce the same
            bytes. Across engines or platforms, randomized outputs are compared semantically (does
            it verify?) and deterministic outputs byte for byte. Choosing the comparator per
            operation is part of the test design, not an afterthought.
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
          WASM engines (C++ and Rust). An ACVP test group can only be answered if PKCS#11 can carry
          exactly the inputs the group supplies — nothing coerced, nothing defaulted.
        </p>
        <TableShell caption="Which ACVP test groups a PKCS#11 v3.2 interface can carry">
          <thead>
            <tr>
              <Th>ACVP test group</Th>
              <Th>PKCS#11 v3.2 path</Th>
              <Th>Hub disposition</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>ML-KEM decapsulation (VAL)</Td>
              <Td>
                Import dk, then C_DecapsulateKey with CKM_ML_KEM (ML-KEM.Decaps){' '}
                <Cite s="pkcs11" at="§6.68" />
              </Td>
              <Td>Executed; k is the derived key’s CKA_VALUE</Td>
            </tr>
            <tr>
              <Td>ML-KEM encapsulation (AFT)</Td>
              <Td>
                None: C_EncapsulateKey takes a public-key handle and a template, with no input for{' '}
                <code>m</code> <Cite s="pkcs11" at="§5.18.8" />
              </Td>
              <Td>Unsupported — {UNSUPPORTED_REASONS.mlKemEncapsulation}</Td>
            </tr>
            <tr>
              <Td>ML-KEM key checks (VAL)</Td>
              <Td>
                None: FIPS 203 §7.2/§7.3 checks are not a PKCS#11 operation{' '}
                <Cite s="fips203" at="§7.2, §7.3" />
              </Td>
              <Td>
                Unsupported (reading an object-creation return code as a verdict would be an
                inference)
              </Td>
            </tr>
            <tr>
              <Td>ML-DSA sigVer, external, pure / preHash</Td>
              <Td>
                CKM_ML_DSA (ML-DSA.Verify) or CKM_HASH_ML_DSA_&lt;hash&gt;, context in
                CK_SIGN_ADDITIONAL_CONTEXT <Cite s="pkcs11" at="§6.67.5–6.67.7" />
              </Td>
              <Td>
                Executed; hashAlgs SHA2-512/224 and SHA2-512/256 have no CKM_HASH_ML_DSA_* mechanism
                and are unsupported per test
              </Td>
            </tr>
            <tr>
              <Td>ML-DSA internal interface on M′ (externalMu false)</Td>
              <Td>
                None: CKM_ML_DSA implements FIPS 204 Algorithms 2 and 3 on the message M{' '}
                <Cite s="pkcs11" at="§6.67.5" />
              </Td>
              <Td>Unsupported</Td>
            </tr>
            <tr>
              <Td>ML-DSA internal interface with external μ</Td>
              <Td>
                No PKCS#11 v3.2 mechanism. The Hub’s engines use a non-standard mechanism code,
                0x403c, for it; FIPS 204 allows μ to be computed in a different module{' '}
                <Cite s="fips204" at="Alg. 7, line 6" />
              </Td>
              <Td>
                Product-specific: executed (Playground suite and ACVP-format prototype) only where
                an engine advertises 0x403c, and labelled vendor-defined in evidence.json; shown as
                a skip otherwise
              </Td>
            </tr>
            <tr>
              <Td>ML-DSA sigGen, deterministic</Td>
              <Td>
                Import sk, sign with hedgeVariant CKH_DETERMINISTIC_REQUIRED{' '}
                <Cite s="pkcs11" at="§6.67.5" />
              </Td>
              <Td>Byte-comparable with NIST’s deterministic sigGen sample (Playground suite)</Td>
            </tr>
            <tr>
              <Td>ML-DSA sigGen, hedged</Td>
              <Td>
                CKH_HEDGE_REQUIRED demands hedging but offers no input for <code>rnd</code>{' '}
                <Cite s="pkcs11" at="§6.67.5" />
              </Td>
              <Td>Not reachable on either engine; shown as an explicit skip</Td>
            </tr>
            <tr>
              <Td>ML-DSA keyGen (AFT)</Td>
              <Td>
                CKM_ML_DSA_KEY_PAIR_GEN with the seed ξ supplied as CKA_SEED. The specification
                lists CKA_SEED among the attributes the mechanism <em>contributes</em>, so accepting
                a caller’s seed is engine behaviour, not a PKCS#11 requirement{' '}
                <Cite s="pkcs11" at="§6.67.4" />
              </Td>
              <Td>Byte-comparable public key (Playground suite), engine-specific path</Td>
            </tr>
          </tbody>
        </TableShell>
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
        <Callout title="Implicit rejection is not an error path">
          <p>
            A decapsulation test that expects an error return for a modified ML-KEM ciphertext is
            wrong: ML-KEM.Decaps_internal returns a key derived from the secret value z and the
            ciphertext instead <Cite s="fips203" at="§6.3, Alg. 18" />. The negative assertion is
            that the key differs from the one the unmodified ciphertext yields — made without
            exposing secret-dependent diagnostics.
          </p>
        </Callout>
        <p>
          Two kinds of negative testing sit outside ACVP.{' '}
          <strong>Requirements ACVP does not test</strong> — the sub-specifications list
          zeroization, DRBG strength and incorrect-length ML-KEM/ML-DSA inputs{' '}
          <Cite s="acvpMlKem" /> <Cite s="acvpMlDsa" />. And <strong>API behaviour</strong>: wrong
          key type, wrong state, short buffers and other PKCS#11 return codes, which OASIS profile
          cases and product probes exercise <Cite s="pkcs11Profiles" />.
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
        <TableShell caption="The eight evidence classes and their permitted claims">
          <thead>
            <tr>
              <Th>Evidence class</Th>
              <Th>Meaning</Th>
              <Th>Permitted claim</Th>
            </tr>
          </thead>
          <tbody>
            {EVIDENCE_CLASS_IDS.map((id) => (
              <tr key={id}>
                <Td>
                  <span className="font-semibold text-foreground">
                    {EVIDENCE_CLASSES[id].label}
                  </span>
                  <br />
                  <code className="text-[10px] text-muted-foreground">{id}</code>
                </Td>
                <Td>{EVIDENCE_CLASSES[id].meaning}</Td>
                <Td>“{EVIDENCE_CLASSES[id].permittedClaim}”</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
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
          <TableShell caption="Active validation cases by evidence class">
            <thead>
              <tr>
                <Th>Evidence class</Th>
                <Th>Active cases</Th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE_CLASS_IDS.map((id) => (
                <tr key={id}>
                  <Td>{EVIDENCE_CLASSES[id].label}</Td>
                  <Td>{counts.activeCasesByClass[id] ?? 0}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
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
            Print a skeleton entry with{' '}
            <code>
              npx tsx scripts/audit-validation-manifest.ts --scaffold
              src/data/acvp/&lt;file&gt;.json
            </code>{' '}
            — it records the file’s SHA-256 and one case record per test case.
          </li>
          <li>
            Fill every TODO: the evidence class; the source (for NIST ACVP-Server material the
            commit, upstream path, retrieval date and upstream SHA-256); each case’s operation,
            parameters and positive/negative expectation; and a lineage record for any subset,
            rename or change of operation.
          </li>
          <li>
            Run <code>npm run audit:validation-manifest</code> and{' '}
            <code>npm run gen:validation-counts</code>.
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
