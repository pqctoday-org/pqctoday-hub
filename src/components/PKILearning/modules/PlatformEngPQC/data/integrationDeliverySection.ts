// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const INTEGRATION_DELIVERY_SECTION: SourcedSectionData = {
  id: 'continuous-integration-delivery',
  title: 'Continuous Integration and Continuous Delivery Pipelines',
  lead: 'Continuous integration and continuous delivery pipelines automate how software is built, tested, packaged, and released. Understanding their stages, verification checks, and access controls helps engineering teams ship reliable software and track cryptographic components across deployments.',
  nice: [
    { id: 'K1370', statement: 'Knowledge of continuous integration processes and procedures' },
    { id: 'K1371', statement: 'Knowledge of continuous delivery processes and procedures' },
  ],
  blocks: [
    {
      heading: 'How CI/CD Pipelines Are Structured',
      sentences: [
        {
          id: 'K1371-13',
          text: 'NIST SP 800-204D states that CI/CD pipelines move software through build, test, package, and deploy stages, where build artifacts are tested, packaged, stored in repositories, and scanned before deployment to testing or production environments.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Abstract, PDF page 5; Section 4, PDF page 22',
        },
        {
          id: 'K1371-12',
          text: 'According to NIST SP 800-204D, higher-level CI and CD driver tools invoke a sequence of function-specific tools for code checkouts, compilation, code commits, and security testing such as SAST, DAST, and SCA.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 5 Integrating SSC Security Into CI/CD Pipelines, PDF page 24',
        },
        {
          id: 'K1370-02',
          text: 'NIST SP 800-204D states that activating CI/CD pipelines requires hardening the execution environment to reduce its attack surface, with driver tools or the build control plane executing at higher trust than individual build steps.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 5. Integrating SSC Security Into CI/CD Pipelines, PDF p. 24',
        },
      ],
    },
    {
      heading: 'Automated Checks and Cryptographic Inventories',
      bridge:
        'During integration, automated checks evaluate source code, dependencies, and cryptographic inventories before artifacts move forward.',
      sentences: [
        {
          id: 'K1370-07',
          text: 'The OWASP Secrets Management Cheat Sheet recommends considering secrets detection at the developer level—in the IDE, during test-driven development, or via a pre-commit hook—to avoid committing secrets into code.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 8.1 general detection approaches',
        },
        {
          id: 'K1370-05',
          text: 'NIST SP 800-204D states that code analysis tools should be implemented to catch common mistakes while avoiding inundating developers with excessive false positives that cause alert fatigue.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 3, PDF p. 21',
        },
        {
          id: 'K1370-06',
          text: 'NIST SP 800-204D states that when open-source modules and libraries are used, dependencies must be enumerated, understood, and evaluated for policy, and the security conditions they should meet for their inclusion must also be tested.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Appendix A, Table 2, Section 5.1.4 Secure Code Commits, PDF p. 37',
        },
        {
          id: 'K1370-10',
          text: 'India CERT-In Technical Guidelines v2.0 recommend automating the generation, analysis, and compliance validation of CBOMs and QBOMs using tooling that integrates with development and deployment workflows.',
          sourceId: 'IN-CERTIN-QBOM-Guidelines-2025',
          edition:
            'India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0, 2025-07',
          locator: 'Section 8.4.2.5 Automation, PDF p. 51',
        },
        {
          id: 'K1370-11',
          text: 'India CERT-In Technical Guidelines v2.0 state that established workflows must ensure CBOMs and QBOMs are updated when components, cryptographic algorithms, or quantum technologies are introduced, modified, or deprecated.',
          sourceId: 'IN-CERTIN-QBOM-Guidelines-2025',
          edition:
            'India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0, 2025-07',
          locator: 'Section 8.4.1.13, PDF p. 50',
        },
      ],
    },
    {
      heading: 'Artifact Verification and Delivery Controls',
      bridge:
        'Before and during delivery, teams verify release artifacts, restrict pipeline credentials, and record what reaches production.',
      sentences: [
        {
          id: 'K1371-15',
          text: 'SLSA v1.2 Build Track Basics states that at Build L1, provenance showing how a package was built may be unsigned, yet with verification it prevents release mistakes such as building from a commit absent from the upstream repository.',
          sourceId: 'SLSA-v1-2-Build-Track-Basics',
          edition: 'SLSA v1.2 Build: Track Basics',
          locator: 'Build Track Basics, Build L1',
        },
        {
          id: 'K1371-07',
          text: 'The Update Framework Specification states that only target files referenced by properly signed and timely metadata are made available, and application code is not given access until security checks confirm the downloaded file matches the signed metadata.',
          sourceId: 'TUF-Specification-v1-0-37',
          edition: 'The Update Framework Specification, version 1.0.37, 2026-10',
          locator: 'Section 2 Fetching',
        },
        {
          id: 'K1371-03',
          text: 'The Secrets Management OWASP Cheat Sheet states that CI/CD service accounts must operate with least privilege, scoped strictly to required secrets or deployment targets, and authenticate pipelines using OIDC workload identity federation where supported.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 3.3 Authentication and authorization of CI/CD tooling',
        },
        {
          id: 'K1371-04',
          text: 'The Secrets Management OWASP Cheat Sheet recommends avoiding passing application runtime secrets through the CI/CD pipeline, instead having the deployed service retrieve its own secrets directly from the secrets manager at runtime.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 3.2.3 Not touched by CI/CD at all',
        },
        {
          id: 'K1371-16',
          text: 'India CERT-In Technical Guidelines v2.0 (2025-07-09) requires consumer organizations to create an internal CBOM/QBOM aligned with supplier data to accurately represent what is deployed.',
          sourceId: 'IN-CERTIN-QBOM-Guidelines-2025',
          edition:
            'India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0, 2025-07',
          locator: 'Section 8.4.1.8, PDF page 50',
        },
      ],
    },
  ],
}
