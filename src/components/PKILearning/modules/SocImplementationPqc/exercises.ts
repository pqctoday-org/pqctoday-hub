// SPDX-License-Identifier: GPL-3.0-only
export interface SocExercise {
  title: string
  prompt: string
}

/**
 * Scenarios mirror the five named tabletop exercises from the Applied Quantum
 * "SOC Implementation" section (pp. 173). Each tests a specific SOC capability.
 */
export const SOC_QUANTUM_EXERCISES: SocExercise[] = [
  {
    title: 'Tabletop: The Friday Afternoon CVE',
    prompt:
      'A critical CVE is published at 16:30 on a Friday against the specific liboqs version deployed in your production TLS termination layer. Using the cryptographic posture registry, can the SOC identify all affected systems within 4 hours? Who authorizes emergency patching outside the normal change window? Walk through Playbook 1 (PQC Algorithm Vulnerability Disclosure): the CTI severity-and-scope assessment, the registry query, and the named incident commander and pre-authorized emergency change window.',
  },
  {
    title: 'Tabletop: The Ambiguous Cryptanalysis Paper',
    prompt:
      'An arXiv preprint from a credible group claims a polynomial-time attack against ML-KEM at security level 3. Within 24 hours, cryptographers disagree on the claim’s validity. How does the CTI team evaluate credibility (sources, peer reaction, reproducibility)? At what point does the SOC escalate, and what is the difference between an implementation bug and a full algorithm break in your impact assessment?',
  },
  {
    title: 'Tabletop: Silent Downgrade',
    prompt:
      'A cluster of internal services has been negotiating classical-only TLS for 72 hours, coinciding with a vendor load-balancer firmware update. Was the downgrade detected automatically by your hybrid-downgrade rule, or did it slip through as a middlebox-induced false positive? Determine whether it is misconfiguration or adversary exploitation, then run Playbook 2: isolate the path, preserve packet captures, assess scope, and decide whether to escalate to the CISO.',
  },
  {
    title: 'Tabletop: The CRQC Announcement',
    prompt:
      'A credible national laboratory announces Shor’s algorithm factoring a 1024-bit RSA key in under 8 hours. Execute Playbook 3: invoke crisis communications, produce an exposure assessment (what percentage is migrated, which highest-sensitivity data is still protected by classical-only algorithms, which signature-dependent systems are most exposed to TNFL), and activate emergency migration for the highest-priority remaining systems. Where do your pre-drafted external communications come from?',
  },
  {
    title: 'Tabletop: Signing Key Compromise',
    prompt:
      'The SOC detects an unauthorized code-signing event; the signed firmware has already been distributed to three branch offices. Test your TNFL detection (MTD-Signing under 15 minutes), artifact identification, rollback procedures, and key revocation without disrupting legitimate signed artifacts. Which team owns each step when signing telemetry is fragmented across dev, OT, and PKI?',
  },
]
