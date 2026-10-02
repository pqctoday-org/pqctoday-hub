// SPDX-License-Identifier: GPL-3.0-only
/**
 * Learn tab for IoT & Embedded Device PQC (LM-074). Rewritten 2026-10-01.
 *
 * RULE: every number in this prose is computed from constants.ts / utils/*
 * (the same values the workshop shows) or is a standard's own value quoted
 * with its source. IoTPQC.learnFacts.test.ts pins the computed ones and bans
 * the figures the 2026-10-01 audit found wrong.
 */
import React from 'react'
import { Link } from 'react-router'
import {
  Cpu,
  Shield,
  FileCode,
  Network,
  Link2,
  KeyRound,
  CircuitBoard,
  Layers,
  Scale,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'
import { BENCH_SOURCES, DEVICE_CLASSES, IOT_PROTOCOLS, algorithmById } from '../constants'
import { LEARN_FACTS as F } from '../learnFacts'

interface IoTPQCIntroductionProps {
  onNavigateToWorkshop: () => void
}

const n = (x: number) => x.toLocaleString('en-US')
const kib = (b: number) => `${(b / 1024).toFixed(1)} KiB`

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section data-section-id={id} className="glass-panel p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
        <h2 className="text-xl font-bold text-gradient">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">{children}</div>
    </section>
  )
}

const Callout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-muted/50 rounded-lg p-3 border border-primary/20">
    <div className="text-xs font-bold text-primary mb-1">{title}</div>
    <div className="text-xs text-muted-foreground space-y-1">{children}</div>
  </div>
)

const L = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="text-primary hover:underline font-medium">
    {children}
  </Link>
)

export const IoTPQCIntroduction: React.FC<IoTPQCIntroductionProps> = ({ onNavigateToWorkshop }) => {
  useSectionAnchors()
  const mlkem768 = algorithmById('ml-kem-768')
  const mldsa44 = algorithmById('ml-dsa-44')
  const fndsa = algorithmById('fn-dsa-512')
  const lms = algorithmById('lms-h10-w4')
  const frodo = algorithmById('frodokem-640')
  const xmss = algorithmById('xmss-h10')
  const mldsa87 = algorithmById('ml-dsa-87')

  return (
    <div className="space-y-8 w-full">
      {/* 1 ─ Why IoT is different */}
      <Section
        id="why-iot"
        icon={<Cpu size={24} className="text-primary" />}
        title="Why IoT is different: device classes"
      >
        <p>
          A constrained device cannot borrow more memory for a bigger signature, often cannot be
          reached for an update, and may stay in service for 10–20 years. Devices shipped now will
          still be verifying firmware and opening sessions when a cryptographically relevant quantum
          computer may exist — so the choice of algorithm, protocol and hardware is made today and
          lived with for a decade.
        </p>
        <div
          className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <div className="text-xs font-bold text-foreground mb-2">
            Classes of constrained devices
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2 font-medium">Class</th>
                <th className="text-left p-2 font-medium">Data (RAM)</th>
                <th className="text-left p-2 font-medium">Code (flash)</th>
                <th className="text-left p-2 font-medium">Example</th>
                <th className="text-left p-2 font-medium">Defined in</th>
              </tr>
            </thead>
            <tbody>
              {DEVICE_CLASSES.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-2 font-medium text-foreground">{c.name}</td>
                  <td className="p-2 font-mono">{c.ramSpec}</td>
                  <td className="p-2 font-mono">{c.flashSpec}</td>
                  <td className="p-2">{c.example}</td>
                  <td className="p-2">{c.definedIn}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-2">
            RFC 7228 defines Classes 0–2 only. Classes 3 and 4 come from draft-ietf-iotops-7228bis,
            which also classifies link-layer frame sizes: an IEEE 802.15.4 frame is 127 bytes, with
            about {F.radioFramePayload} bytes left for payload once link security is on.
          </p>
        </div>
        <div className="space-y-2">
          {[
            {
              t: 'Memory',
              d: `Class 1 is ~10 KiB of RAM for everything — application, network stack and crypto. A PQC key exchange on such a device must hold its key pair and the peer's ciphertext while it runs (ML-KEM-768: ${n(mlkem768.publicKeyBytes)} + ${n(mlkem768.secretKeyBytes)} + ${n(mlkem768.outputBytes)} bytes) on top of the algorithm's own stack.`,
            },
            {
              t: 'Radio',
              d: `One ML-KEM-768 ciphertext is ${n(mlkem768.outputBytes)} bytes: about ${F.mlkem768CtFrames} IEEE 802.15.4 frames, or ${F.mlkem768CtNbIotSeconds} s of NB-IoT Cat-NB1 downlink at its ~26 kbit/s peak (model estimate).`,
            },
            {
              t: 'Reach and lifetime',
              d: 'Many devices update rarely, through gateways, or never. Crypto-agility — room in flash and RAM, an update path, and protocols that negotiate algorithms — has to be designed in before shipment.',
            },
            {
              t: 'Energy',
              d: 'Every extra byte on air and every extra million cycles costs battery. That favours session resumption over repeated full handshakes, and verifying on the device while signing elsewhere.',
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
        <Callout title="Symmetric crypto is not the problem">
          <p>
            AES and SHA-2 stay; a quantum computer weakens them only modestly. For devices too small
            for AES-GCM, NIST standardised the lightweight{' '}
            <InlineTooltip term="Ascon">Ascon</InlineTooltip> family in SP 800-232 (final, August
            2025). PQC replaces the public-key parts: key establishment and signatures.
          </p>
        </Callout>
        <p className="text-xs text-muted-foreground">
          Industrial control systems (SCADA, PLCs, zones and conduits) are covered in{' '}
          <L to="/learn/ot-pqc">OT &amp; Industrial Control Systems PQC</L>; vehicle networks and
          V2X in <L to="/learn/automotive-pqc">Automotive PQC</L>; boot chains in{' '}
          <L to="/learn/secure-boot-pqc">Secure Boot PQC</L>.
        </p>
      </Section>

      {/* 2 ─ Algorithm selection */}
      <Section
        id="algorithm-selection"
        icon={<Shield size={24} className="text-secondary" />}
        title="Algorithm selection: verify vs sign"
      >
        <p>
          Most devices <strong>verify</strong> far more than they <strong>sign</strong>: they check
          firmware and server certificates, while signing happens on a build server or HSM. The two
          operations have very different costs, so &quot;does FN-DSA fit on a sensor?&quot; has two
          answers.
        </p>
        <div
          className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <div className="text-xs font-bold text-foreground mb-2">
            Stack RAM on an Arm Cortex-M4 (benchmark; varies by implementation)
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2 font-medium">Algorithm</th>
                <th className="text-right p-2 font-medium">Verify / decaps</th>
                <th className="text-right p-2 font-medium">Sign / keygen</th>
                <th className="text-left p-2 font-medium">Build · source</th>
              </tr>
            </thead>
            <tbody>
              {F.ramTable.map((r) => (
                <tr key={`${r.name}-${r.build}`} className="border-b border-border/50">
                  <td className="p-2 text-foreground">{r.name}</td>
                  <td className="p-2 text-right font-mono">{n(r.light)} B</td>
                  <td className="p-2 text-right font-mono">{n(r.heavy)} B</td>
                  <td className="p-2 text-muted-foreground">
                    {r.build} · {BENCH_SOURCES[r.source].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> is small when built for stack:
            ML-KEM-768 decapsulation needs {n(F.mlkem768StackDecaps)} B of stack in pqm4&apos;s
            m4fstack build versus {n(F.mlkem768SpeedDecaps)} B in m4fspeed. Counting its keys and
            ciphertext, the stack build fits a Class 1 budget; the speed build does not (model, step
            1).
          </li>
          <li>
            <InlineTooltip term="ML-DSA">ML-DSA-44</InlineTooltip> verification needs{' '}
            {n(F.mldsa44StackVerify)} B (stack build) and signing {n(F.mldsa44StackSign)} B; the
            speed build verifies in fewer cycles but needs {n(F.mldsa44SpeedVerify)} B.
          </li>
          <li>
            <InlineTooltip term="FN-DSA">FN-DSA-512</InlineTooltip> verifies with {n(F.fndsaVerify)}{' '}
            B — but signing needs {n(F.fndsaSign)} B of stack and the full scheme is{' '}
            {n(F.fndsaCode)} B of code. Verify on the device; sign elsewhere. FIPS 206 is not yet
            published; sizes here follow the Falcon v1.2 specification ({n(fndsa.outputBytes)} B in
            its padded, fixed-length format).
          </li>
          <li>
            <InlineTooltip term="LMS/HSS">LMS</InlineTooltip> verification is hashing only (
            {n(F.lmsVerifyStack)} B of stack in the reference implementation measured by Campos et
            al.), with a {n(lms.publicKeyBytes)}-byte public key.
          </li>
          <li>
            <InlineTooltip term="FrodoKEM">FrodoKEM-640</InlineTooltip> needs {n(F.frodoDecaps)} B
            of stack to decapsulate and {n(frodo.publicKeyBytes)}-byte keys — out of reach below
            Class 4.
          </li>
        </ul>
        <p className="text-xs">
          Under the module&apos;s fit model (benchmark stack plus buffers, step 1), a Class 1 device
          using stack-optimised builds can verify with{' '}
          <strong>{[...F.class1Verify.fits, ...F.class1Verify.tight].join(', ')}</strong>, and run
          key establishment with <strong>{F.class1Kem.tight.join(', ')}</strong> (tight). Class 0
          devices fit none of them and need a gateway.
        </p>
      </Section>

      {/* 3 ─ Firmware signing */}
      <Section
        id="firmware-signing"
        icon={<FileCode size={24} className="text-primary" />}
        title="Firmware and update signing (SUIT, COSE)"
      >
        <p>
          A forged firmware image is the worst outcome for a device fleet, and the update signature
          must stay unforgeable for the device&apos;s whole life. Three families are standardised
          for it:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Callout title="LMS / HSS (RFC 8554, SP 800-208)">
            <p>
              {n(lms.publicKeyBytes)} B public key, {n(lms.outputBytes)} B signature (H10/W4 as HSS
              L = 1). Stateful: each one-time key may sign once, so the signer&apos;s counter must
              never roll back — keep it in an HSM.
            </p>
          </Callout>
          <Callout title="XMSS (RFC 8391, SP 800-208)">
            <p>
              {n(xmss.publicKeyBytes)} B public key, {n(xmss.outputBytes)} B signature
              (SHA2_10_256). Also stateful. BSI TR-02102-1 accepts both XMSS and LMS.
            </p>
          </Callout>
          <Callout title="ML-DSA (FIPS 204)">
            <p>
              Stateless: no counter to protect. ML-DSA-44 is {n(mldsa44.publicKeyBytes)} B /{' '}
              {n(mldsa44.outputBytes)} B; ML-DSA-87 is {n(mldsa87.publicKeyBytes)} B /{' '}
              {n(mldsa87.outputBytes)} B.
            </p>
          </Callout>
        </div>
        <p className="text-xs">
          <strong>Verification speed on a Cortex-M4</strong> (fastest benchmarked build of each):{' '}
          {F.verifyRanking.map((r, i) => (
            <span key={r.name}>
              {i > 0 && ' < '}
              {r.name} {r.mcycles} M
            </span>
          ))}{' '}
          cycles. LMS is not the fastest verifier; its case is the tiny key and hash-only security
          assumption. The LMS-vs-XMSS gap ({F.xmssOverLms}× in that benchmark) comes from the
          reference code, as its authors note.
        </p>
        <Callout title="CNSA 2.0 (national security systems)">
          <p>
            Firmware and software signing should prefer CNSA 2.0 algorithms from 2025 and use them
            exclusively by 2030. CNSA 2.0 accepts only <strong>ML-DSA-87</strong> or{' '}
            <strong>LMS/XMSS</strong> (SP 800-208) for this — ML-DSA-44 and ML-DSA-65 are fine for
            commercial FIPS 204 products but not for NSS.
          </p>
        </Callout>
        <p>
          <InlineTooltip term="SUIT">SUIT</InlineTooltip> is three documents: RFC 9019 is the update
          architecture, RFC 9124 the manifest information model, and draft-ietf-suit-manifest the
          CBOR manifest format itself. The manifest carries the image digest and conditions and is
          signed with COSE: HSS-LMS is registered for COSE by RFC 8778 and ML-DSA by RFC 9964;
          SLH-DSA and FN-DSA are still drafts. Step 2 signs a manifest with ML-DSA or LMS for real
          and shows the COSE_Sign1 layout.
        </p>
        <p className="text-xs text-muted-foreground">
          The boot-time side — verifying the image before it runs — is in{' '}
          <L to="/learn/secure-boot-pqc">Secure Boot PQC</L>; LMS/XMSS state management in{' '}
          <L to="/learn/stateful-signatures">Stateful Hash Signatures</L>.
        </p>
      </Section>

      {/* 4 ─ Constrained protocols */}
      <Section
        id="constrained-protocols"
        icon={<Network size={24} className="text-primary" />}
        title="Constrained protocols"
      >
        <div
          className="overflow-x-auto"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2 font-medium">Protocol</th>
                <th className="text-left p-2 font-medium">Size reality</th>
                <th className="text-left p-2 font-medium">Public-key crypto today</th>
                <th className="text-left p-2 font-medium">PQC path</th>
              </tr>
            </thead>
            <tbody>
              {IOT_PROTOCOLS.map((p) => (
                <tr key={p.name} className="border-b border-border/50 align-top">
                  <td className="p-2 font-medium text-foreground">{p.name}</td>
                  <td className="p-2">{p.sizeFact}</td>
                  <td className="p-2">{p.publicKeyCrypto}</td>
                  <td className="p-2">{p.pqcPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout title="DTLS 1.3 vs EDHOC — model estimate">
          <p>
            A classical <InlineTooltip term="DTLS">DTLS</InlineTooltip> 1.3 handshake with an ECDSA
            certificate chain is about {n(F.dtlsClassical.totalBytes)} B (
            {n(F.dtlsClassical.radioFrames)} radio frames). With ML-KEM-768 and an ML-DSA-44 chain
            it grows to about {n(F.dtlsPq.totalBytes)} B: {F.dtlsPq.datagrams} IPv6 datagrams and{' '}
            {n(F.dtlsPq.radioFrames)} IEEE 802.15.4 frames. EDHOC with credentials sent by reference
            moves {n(F.edhocClassical.totalBytes)} B classically and about {n(F.edhocPq.totalBytes)}{' '}
            B with the same PQC algorithms — no certificate chain crosses the air.
          </p>
        </Callout>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>MQTT 5</strong> runs over TCP and TLS; its maximum packet is 268,435,455 bytes,
            so PQC there is a bandwidth cost, not a size limit.
          </li>
          <li>
            <strong>Matter</strong> commissions with PASE (SPAKE2+ over P-256), checks a DAC → PAI →
            PAA attestation chain, then uses CASE (ECDH + ECDSA). A PQC Matter needs new CASE suites
            and PQC attestation certificates.
          </li>
          <li>
            <strong>Bluetooth Mesh</strong> provisioning exchanges P-256 keys in PB-ADV segments;
            Mesh Protocol 1.1 adds certificate-based provisioning. An ML-KEM-768 key would take{' '}
            {F.bleMlkem768Segments} segments where a P-256 key takes {F.bleP256Segments}.
          </li>
          <li>
            <strong>LoRaWAN 1.1</strong> has no public-key exchange on the air (AES-128 root keys
            and session keys), so its radio link is not a Shor target. The exposure is the backend:
            join server and network server TLS, and how root keys were provisioned.
          </li>
        </ul>
      </Section>

      {/* 5 ─ Certificates and identity */}
      <Section
        id="certificates-identity"
        icon={<Link2 size={24} className="text-primary" />}
        title="Certificates and device identity"
      >
        <p>
          Each certificate holds its subject&apos;s public key and its{' '}
          <strong>issuer&apos;s</strong> signature (RFC 5280). In a TLS or DTLS handshake the server
          sends its leaf and intermediate and leaves the root out (RFC 8446 §4.4.2), so the chain on
          the wire carries two public keys and two signatures.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            Chain bytes sent (leaf + intermediate, root stored) — model estimate
          </div>
          <div className="space-y-2">
            {F.chainTable.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-mono text-foreground">
                    {n(c.sent)} B ({kib(c.sent)})
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${c.quantumSafe ? 'bg-success/60' : 'bg-destructive/60'}`}
                    style={{ width: `${(c.sent / F.chainMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            An all-ML-DSA-65 chain is {F.chainMldsa65OverEcdsa}× the ECDSA one — larger than a Class
            1 device&apos;s whole RAM.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Callout title="Ways to send fewer bytes">
            <p>
              <strong>RFC 8879 compression</strong> saves only the structured part — PQC keys and
              signatures are random and do not compress. <strong>C509</strong> re-encodes the
              certificate in CBOR (same key, same signature).{' '}
              <strong>RFC 7250 raw public keys</strong> drop the chain but need a key pinned at
              provisioning. <strong>PSK resumption</strong> sends no certificate after the first
              handshake.
            </p>
          </Callout>
          <Callout title="Merkle Tree Certificates — with a condition">
            <p>
              draft-ietf-plants-merkle-tree-certs replaces the CA signature with an inclusion proof
              of {F.mtcHashBytes} bytes per tree level, and drops the intermediate. It works only if
              the relying party already holds current trusted tree heads, distributed out of band —
              a device that is offline for months needs a fallback chain. See{' '}
              <L to="/learn/merkle-tree-certs">Merkle Tree Certificates</L>.
            </p>
          </Callout>
        </div>
        <p>
          <strong>Device identity</strong> starts at manufacture. An IEEE 802.1AR initial device
          identifier (IDevID) is a certificate and key installed in the factory; NIST SP 1800-36B
          shows it anchoring trusted network-layer onboarding. FIDO Device Onboard 1.1 transfers
          ownership late, with an ownership voucher. EST-coaps (RFC 9148) enrols operational
          certificates over CoAP. Each of these is a long-lived signature key that PQC must replace
          — and an IDevID baked into silicon today cannot be swapped later.
        </p>
      </Section>

      {/* 6 ─ Fleet keys and LPWAN */}
      <Section
        id="fleet-keys-lpwan"
        icon={<KeyRound size={24} className="text-primary" />}
        title="Fleet key management and LPWAN"
      >
        <p>
          Rotating keys on millions of devices is a scheduling problem. Devices sit in thousands of
          cells or collectors that work in parallel, but every key update passes through the same
          head-end HSM. In the step 5 default — {n(F.fleet.fleetSize)} smart meters, ML-KEM-768, an
          illustrative {n(F.fleet.hsmOpsPerSec)} operations/s HSM — a cell finishes its radio
          exchange in about {F.fleet.networkMinutesPerCell} minutes while the HSM needs about{' '}
          {F.fleet.hsmHours} hours: the HSM, not the radio, sets the pace (model estimate).
        </p>
        <p>
          Smart-meter data is a harvest-now-decrypt-later target: interval readings reveal when a
          home is occupied, and meters stay installed 15 years or more. DLMS/COSEM Suite 1 and 2
          meters agree keys with ECDH; Suite 0 meters use symmetric key wrap only and have no
          public-key exchange to break.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Callout title="Wi-SUN FAN 1.1">
            <p>
              IPv6 mesh for utilities. FSK modes run 50–300 kbit/s; FAN 1.1 adds OFDM modes up to
              2.4 Mbit/s.
            </p>
          </Callout>
          <Callout title="LoRaWAN 1.1">
            <p>
              51–222 B of payload per uplink (EU868) and a 1% duty cycle; symmetric on the air.
              Large updates go by multicast with fragmentation.
            </p>
          </Callout>
          <Callout title="NB-IoT">
            <p>
              Licensed cellular; Cat-NB1 peaks around 26 kbit/s downlink and 62.5 kbit/s uplink
              (3GPP TS 36.306).
            </p>
          </Callout>
        </div>
        <p className="text-xs">
          <strong>What a PQC signature really costs a firmware update:</strong> on a{' '}
          {F.airtime.firmwareKB} KiB image an ML-DSA-87 signature is {F.airtime.mldsa87SharePct}% of
          the bytes (ML-DSA-44: {F.airtime.mldsa44SharePct}%). Pushing that update unicast to{' '}
          {n(F.airtime.devices)} NB-IoT devices takes about {F.airtime.nbiotUnicastHours} hours of
          downlink — with ECDSA too — while multicast takes {F.airtime.nbiotMulticastMinutes}{' '}
          minutes. Image size and delivery mode decide whether a cell can be updated (step 6).
        </p>
      </Section>

      {/* 7 ─ Hardware */}
      <Section
        id="hardware-support"
        icon={<CircuitBoard size={24} className="text-primary" />}
        title="Hardware support: secure elements and TPMs"
      >
        <ul className="list-disc pl-5 space-y-2 text-xs">
          <li>
            <strong>Secure elements with PQC on the chip now exist.</strong> Infineon reports Common
            Criteria EAL6 certification for an ML-KEM implementation on its TEGRION security
            controllers; Samsung&apos;s S3SSE2A was among the first products to receive an ANSSI PQC
            security certification (2025); STMicroelectronics has announced PQC for its ST54M secure
            element. Check each certificate&apos;s scope — it covers one target of evaluation, not
            &quot;PQC&quot; in general.
          </li>
          <li>
            <strong>Many deployed secure elements are ECC-only.</strong> Microchip&apos;s ATECC608B,
            for example, does ECDSA/ECDH on P-256, SHA-256 and AES-128 — it cannot offload ML-KEM or
            ML-DSA. A device built around it needs PQC in MCU firmware or a new part.
          </li>
          <li>
            <strong>TrustZone-M is isolation, not a secure element.</strong> The Armv8-M security
            extension separates secure and non-secure software on the same core; PQC code in the
            secure world uses the same RAM, flash and cycles. It protects keys from the application,
            it does not add capacity or acceleration.
          </li>
          <li>
            <strong>TPM 2.0.</strong> The TCG TPM 2.0 Library Specification version 1.85 adds ML-KEM
            and ML-DSA; shipping TPMs will follow the specification with a lag.
          </li>
          <li>
            <strong>Assurance schemes.</strong> PSA Certified (Level 2 builds on the SESIP
            methodology) and EN 17927 (SESIP as a European standard) are how many IoT chips document
            their security — useful evidence when a regulation asks for &quot;state of the art&quot;
            protection.
          </li>
        </ul>
      </Section>

      {/* 8 ─ Hybrid */}
      <Section
        id="hybrid"
        icon={<Layers size={24} className="text-primary" />}
        title="Hybrid on constrained hardware"
      >
        <p>
          A hybrid key exchange such as X25519MLKEM768 combines a classical and a PQC shared secret;
          the result stays secret as long as <strong>either</strong> component is unbroken. On a
          device that already runs ML-KEM-768 the classical half costs little: X25519 adds{' '}
          {F.hybridExtraBytes} bytes to each direction, and its ECC routine (at most{' '}
          {n(F.ecdhStack)} B of stack in the benchmark) runs before or after ML-KEM rather than on
          top of its peak. Hybrid does not double the cost; the PQC half dominates it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Callout title="Gateway-mediated (Class 0–1)">
            <p>
              Field devices keep symmetric or classical crypto to a nearby gateway, which runs PQC
              or hybrid to the cloud. Protects the long-haul link without touching the devices — but
              the device-to-gateway link stays classical, so its traffic remains harvestable unless
              it is symmetric-only.
            </p>
          </Callout>
          <Callout title="Native (Class 2 and up; Class 1 with stack builds)">
            <p>
              The device runs the hybrid itself. Composite or dual signatures cost both signatures
              on the wire, so certificate chains grow by the classical sizes too.
            </p>
          </Callout>
        </div>
        <p className="text-xs text-muted-foreground">
          See <L to="/learn/hybrid-crypto">Hybrid Cryptography</L> for combiners and composite
          certificates.
        </p>
      </Section>

      {/* 9 ─ Regulations */}
      <Section
        id="regulations"
        icon={<Scale size={24} className="text-primary" />}
        title="IoT security regulations"
      >
        <p>
          None of these rules names a PQC algorithm. What they require — secure updates over a
          support period, state-of-the-art protection, vulnerability handling — is what makes a
          later PQC migration possible or impossible.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs">
          <li>
            <strong>EU Cyber Resilience Act</strong> (Regulation (EU) 2024/2847): vulnerability and
            incident reporting obligations apply from 11 September 2026; the essential requirements
            (secure by design, security updates for the support period) from 11 December 2027.
          </li>
          <li>
            <strong>ETSI EN 303 645</strong>: the consumer-IoT baseline — no universal default
            passwords, a vulnerability disclosure policy, software updates, secure storage of
            parameters and secure communication with best-practice cryptography.
          </li>
          <li>
            <strong>EU Radio Equipment Directive</strong>: Delegated Regulation (EU) 2022/30 makes
            cybersecurity essential requirements apply to internet-connected radio equipment from 1
            August 2025; EN 18031-1/-2/-3 are the harmonised standards, cited (with restrictions) by
            Implementing Decision (EU) 2025/138.
          </li>
          <li>
            <strong>US Cyber Trust Mark</strong> (FCC 24-26): a voluntary label for consumer IoT
            products meeting NIST-derived criteria.
          </li>
          <li>
            <strong>UK PSTI</strong> (Regulations 2023, SI 2023/1007): bans universal default
            passwords and requires a vulnerability disclosure policy and a stated minimum
            security-update period.
          </li>
          <li>
            <strong>NIST IR 8259 / 8259A</strong>: foundational activities for manufacturers and the
            core device-capability baseline. NIST IR 8259 was withdrawn on 2026-04-20 and replaced
            by NIST IR 8259r1; 8259A remains the capability baseline.
          </li>
        </ul>
      </Section>

      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg"
        >
          Try it in the Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Check algorithm fit, sign a manifest for real, compare DTLS and EDHOC, size a chain, plan
          a fleet rotation and model LPWAN airtime.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Hardware" migrateDomain="hardware" />
      <ReadingCompleteButton />
    </div>
  )
}
