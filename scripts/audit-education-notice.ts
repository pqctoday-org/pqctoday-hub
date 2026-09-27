#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-education-notice.ts — the education / not-for-production status gate.
 *
 * Counterpart to the §2.2 validation-disclaimer gate in
 * `generate-release-evidence.ts` (DISCLAIMER_SURFACES / DoD item #4). That gate
 * asks "does this result over-claim?". This one asks the question nobody was
 * asking: "does a reader who never sees our UI know this is a teaching
 * platform?" — the gap that let `@pqctoday/softhsm-wasm` ship a publishable npm
 * package advertising a production PKCS#11 token for Node.js with no status
 * statement anywhere in its packed files.
 *
 * Four checks, in the order the remediation ran:
 *
 *   1. DOWNSTREAM — the engine package's own metadata and packed files.
 *   2. SURFACES    — files that must render <EducationNotice/>.
 *   3. ARTEFACTS   — published static machine-readable artefacts and root docs.
 *   4. EXPORTS     — the INVERSE gate: every export/copy affordance in `src`
 *                    must carry a notice, or be named in the grandfather list.
 *
 * Check 4 is deliberately inverted. The default is "covered": a new download
 * button fails the gate until someone either injects the notice or records an
 * explicit exemption. Every other approach tried here has failed the same way —
 * a list of surfaces to check never grows as fast as the surfaces do.
 *
 * Usage: npx tsx scripts/audit-education-notice.ts [--json]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EDUCATION_NOTICE, ENGINE_NOTICE } from '../src/data/educationNotice'

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Files that must render <EducationNotice/>. The notice must be unconditional
 *  there: not inside a `role === …` branch, not behind a disclosure. */
export const EDUCATION_SURFACES = [
  // The desktop + mobile playground shell. Before this remediation the status
  // was stated only in MobilePlaygroundView's "Powered By" footer.
  'src/components/Playground/PlaygroundView.tsx',
  // The HSM Playground. Before this remediation its only honest sentence lived
  // inside a banner rendered for role === 'executive' || 'grc' only, so the
  // developer persona — the one most likely to export something — saw nothing.
  'src/components/Playground/HsmPlayground.tsx',
] as const

/** The engine package that ships downstream, and what must be true of it. */
export const ENGINE_PKG = 'src/vendor/softhsm-wasm'

/** Published static artefacts and root docs that must state the status. */
export const ARTEFACT_SURFACES: Array<{ file: string; needle: string; what: string }> = [
  { file: 'README.md', needle: EDUCATION_NOTICE, what: 'the README preamble' },
  { file: 'SECURITY.md', needle: EDUCATION_NOTICE, what: "SECURITY.md's Cryptographic Disclaimer" },
  {
    file: 'public/data/pqctoday-cbom.json',
    needle: EDUCATION_NOTICE,
    what: 'the published CBOM (metadata.component.description / metadata.properties)',
  },
]

/**
 * Call patterns that mean "a payload leaves the browser": a download, a
 * clipboard write, a file-saver call.
 */
const EXPORT_PATTERNS = [/createObjectURL/, /clipboard\.writeText/, /\.download = /, /\bsaveAs\(/]

/** Tokens whose presence in a file means that file's payloads carry a notice. */
const NOTICE_TOKENS =
  /EDUCATION_NOTICE|ENGINE_NOTICE|educationNotice|VALIDATION_DISCLAIMER|EducationNotice/

/**
 * GRANDFATHER LIST — BURN-DOWN, NOT A POLICY.
 *
 * Built from the real state of the tree on 2026-09-26: 143 export/copy call
 * sites across 86 non-test files, of which 10 files carried a notice (the ones
 * this remediation covered, plus the validation-disclaimer surfaces that
 * already did) and these 76 did not. They are listed so the gate can be
 * switched on TODAY with the default set to "covered" instead of "forgotten" —
 * every NEW export path fails until it carries the notice or is argued onto
 * this list.
 *
 * The entries are FILE paths, not line numbers, on purpose: a line-keyed list
 * rots on the first unrelated edit and then gets bulk-regenerated, which is how
 * an exemption list quietly becomes permanent.
 *
 * BURN-DOWN: this list must only ever get shorter. Adding an entry means
 * shipping an export with no status notice, and needs a stated reason. The
 * highest-value remaining clusters, in order:
 *   - OpenSSLStudio/* (WorkbenchFileManager, artefact + key downloads)
 *   - PKILearning/modules/HybridCrypto/workshop/* (cert/PEM/format exports)
 *   - Report/* and BusinessCenter/* (board-facing reports and artefacts)
 *   - Migrate/Workbench/cbomExport.ts (should route through services/cbom)
 *   - utils/csvExport.ts + utils/timelineIcs.ts (shared, so high leverage)
 *   - Playground/kmip/* and Simulation/* (protocol logs and captures)
 */
export const EXPORT_GRANDFATHERED: readonly string[] = [
  'src/components/About/SampleQuestionsModal.tsx', // 1
  'src/components/Assess/redesign/AssessQuestionPane.tsx', // 1
  'src/components/BusinessCenter/ArtifactDrawer.tsx', // 2
  'src/components/BusinessCenter/BusinessCenterView.tsx', // 2
  'src/components/Chat/ChatMessage.tsx', // 2
  'src/components/Compliance/ComplianceTable.tsx', // 1
  'src/components/Compliance/views/DeveloperImplementationView.tsx', // 1
  'src/components/Executive/ExecutiveView.tsx', // 1
  'src/components/Leaders/LeaderConsentModal.tsx', // 1
  'src/components/Migrate/Workbench/cbomExport.ts', // 3
  'src/components/OpenSSLStudio/FileManager.tsx', // 2
  'src/components/OpenSSLStudio/TerminalOutput.tsx', // 2
  'src/components/OpenSSLStudio/components/WorkbenchFileManager.tsx', // 4
  'src/components/OpenSSLStudio/components/WorkbenchPreview.tsx', // 1
  'src/components/OpenSSLStudio/components/configs/Pkcs11Config.tsx', // 1
  'src/components/PKILearning/common/OpsConfigGenerator.tsx', // 1
  'src/components/PKILearning/common/roleGuide/RoleHowToAct.tsx', // 3
  'src/components/PKILearning/modules/APISecurityJWT/workshop/JOSEProtocolMatrixAudit.tsx', // 2
  'src/components/PKILearning/modules/APISecurityJWT/workshop/JWTInspector.tsx', // 1
  'src/components/PKILearning/modules/APISecurityJWT/workshop/PQCJWTSigning.tsx', // 1
  'src/components/PKILearning/modules/AcvpLabWorkflow/data/publicFixtures.ts', // 2
  'src/components/PKILearning/modules/CodeSigning/workshop/BinarySigning.tsx', // 1
  'src/components/PKILearning/modules/CryptoMgmtModernization/components/CryptoArchitectureDiagram.tsx', // 1
  'src/components/PKILearning/modules/DataAssetSensitivity/workshop/PQCMigrationPriorityMap.tsx', // 2
  'src/components/PKILearning/modules/DigitalAssets/components/DownloadButton.tsx', // 2
  'src/components/PKILearning/modules/EmailSigning/workshop/MLDSASignDemo.tsx', // 2
  'src/components/PKILearning/modules/Entropy/workshop/evidenceLab/EntropyEvidenceLab.tsx', // 3
  'src/components/PKILearning/modules/FiveG/components/GsmaTestDataModal.tsx', // 1
  'src/components/PKILearning/modules/HybridCrypto/workshop/HybridCertFormats.tsx', // 3
  'src/components/PKILearning/modules/HybridCrypto/workshop/HybridCertInspector.tsx', // 4
  'src/components/PKILearning/modules/IAMPQC/workshop/VendorReadinessScorer.tsx', // 2
  'src/components/PKILearning/modules/IAMPQC/workshop/ZeroTrustIdentityArchitect.tsx', // 2
  'src/components/PKILearning/modules/KmsPqc/workshop/EnvelopeEncryptionDemo.tsx', // 1
  'src/components/PKILearning/modules/MerkleTreeCerts/workshop/InclusionProofGenerator.tsx', // 1
  'src/components/PKILearning/modules/PKIWorkshop/AcmePqcWalkthrough.tsx', // 2
  'src/components/PKILearning/modules/PKIWorkshop/CertParser.tsx', // 1
  'src/components/PKILearning/modules/SecureBootPQC/workshop/FirmwareSigningMigrator.tsx', // 2
  'src/components/PKILearning/modules/StatefulSignatures/workshop/StateManagementVisualizer.tsx', // 1
  'src/components/PKILearning/modules/StatefulSignatures/workshop/XMSSKeyGenDemo.tsx', // 1
  'src/components/PKILearning/modules/TLSBasics/TLSClientPanel.tsx', // 2
  'src/components/PKILearning/modules/TLSBasics/TLSServerPanel.tsx', // 2
  'src/components/PKILearning/modules/TLSBasics/components/CryptoLogDisplay.tsx', // 1
  'src/components/PKILearning/modules/TLSBasics/components/KeyOverview.tsx', // 1
  'src/components/PKILearning/modules/TLSBasics/components/TLSNegotiationResults.tsx', // 1
  'src/components/PKILearning/modules/WebGatewayPQC/workshop/VendorReadinessMatrix.tsx', // 1
  'src/components/Playground/TpmPlayground/ComplianceRunner.tsx', // 2
  'src/components/Playground/TpmPlayground/ExecutionLog.tsx', // 1
  'src/components/Playground/TpmPlayground/V2p7EkCertReader.tsx', // 2
  'src/components/Playground/TpmPlayground/learn/TpmLearnView.tsx', // 1
  'src/components/Playground/acvpio/AcvpFormatPrototypePanel.tsx', // 2
  'src/components/Playground/dev/kmipPipeline/KmipPipelineBuilder.tsx', // 2
  'src/components/Playground/dev/pipeline/PkcsDevWorkbench.tsx', // 2
  'src/components/Playground/dev/pipeline/suites/SuiteShell.tsx', // 2
  'src/components/Playground/hsm/VpnSimulationPanel.tsx', // 1
  'src/components/Playground/hsm/symmetric/KeyWrapPanel.tsx', // 1
  'src/components/Playground/kmip/Inspector.tsx', // 2
  'src/components/Playground/tabs/HashingTab.tsx', // 1
  'src/components/Playground/tabs/LogsTab.tsx', // 1
  'src/components/Report/NiceGapReportSection.tsx', // 2
  'src/components/Report/sections/reportContentActions.ts', // 3
  'src/components/RightPanel/BookmarksPanel.tsx', // 2
  'src/components/Simulation/SimulationView.tsx', // 4
  'src/components/Simulation/mermaidRender.ts', // 1
  'src/components/Timeline/SimpleGanttChart.tsx', // 2
  'src/components/Timeline/TimelineView.tsx', // 1
  'src/components/ui/CopyButton.tsx', // 1
  'src/components/ui/CopyableOutput.tsx', // 2
  'src/components/ui/LinkToUsButton.tsx', // 1
  'src/components/ui/ShareButton.tsx', // 1
  'src/services/chat/exportConversation.ts', // 2
  'src/services/export/pptxExport.ts', // 1
  'src/services/storage/ProgressService.ts', // 1
  'src/services/storage/UnifiedStorageService.ts', // 1
  'src/utils/clipboard.ts', // 1
  'src/utils/csvExport.ts', // 2
  'src/utils/timelineIcs.ts', // 2
] as const

// ── helpers ──────────────────────────────────────────────────────────────────

export interface Problem {
  check: 'downstream' | 'surfaces' | 'artefacts' | 'exports'
  file: string
  problem: string
}

const read = (root: string, rel: string): string => {
  const p = path.join(root, rel)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''
}

/** Every non-test source file under `src`, relative to `root`. */
export function listSourceFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '__mocks__') continue
        walk(rel)
      } else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.|\.local\.test\./.test(e.name)) {
        out.push(rel)
      }
    }
  }
  walk('src')
  return out.sort()
}

// ── the four checks ──────────────────────────────────────────────────────────

/** 1 — the downstream engine package states its status in its own metadata. */
export function checkDownstream(root: string): Problem[] {
  const out: Problem[] = []
  const rel = `${ENGINE_PKG}/package.json`
  const raw = read(root, rel)
  if (!raw) return [{ check: 'downstream', file: rel, problem: 'missing' }]
  const pkg = JSON.parse(raw) as {
    description?: string
    keywords?: string[]
    files?: string[]
    private?: boolean
  }
  // Publishable (no `private` flag, has prepublishOnly) means the description is
  // the one line an npm consumer is guaranteed to read. The status must LEAD it.
  if (!pkg.description?.startsWith(ENGINE_NOTICE.split('—')[0].trim())) {
    out.push({
      check: 'downstream',
      file: rel,
      problem: 'description does not LEAD with the engine status notice',
    })
  }
  for (const k of ['educational', 'not-for-production']) {
    if (!pkg.keywords?.includes(k)) {
      out.push({ check: 'downstream', file: rel, problem: `keywords is missing "${k}"` })
    }
  }
  // A NOTICE that is not in `files` is not packed, so it does not exist for a
  // consumer — this is the failure mode that made the whole gap invisible.
  if (!pkg.files?.includes('NOTICE')) {
    out.push({
      check: 'downstream',
      file: rel,
      problem: 'NOTICE is not in the `files` array, so it is not packed',
    })
  }
  const notice = read(root, `${ENGINE_PKG}/NOTICE`)
  if (!notice.includes(ENGINE_NOTICE.split('—')[0].trim())) {
    out.push({
      check: 'downstream',
      file: `${ENGINE_PKG}/NOTICE`,
      problem: 'missing or has no status notice',
    })
  }
  // The notice must not be browser-scoped: the package advertises Node.js.
  if (notice && !/not limited to browser use|wherever it runs|in any environment/i.test(notice)) {
    out.push({
      check: 'downstream',
      file: `${ENGINE_PKG}/NOTICE`,
      problem: 'does not say the status applies outside a browser',
    })
  }
  for (const f of ['index.js', 'index.d.ts']) {
    const src = read(root, `${ENGINE_PKG}/${f}`)
    if (!/Educational and demonstration build/.test(src)) {
      out.push({
        check: 'downstream',
        file: `${ENGINE_PKG}/${f}`,
        problem: 'no status banner comment',
      })
    }
  }
  // SECURITY.md must bind the engines wherever they run, not only in a browser.
  const sec = read(root, 'SECURITY.md')
  if (!/not scoped to the browser|wherever they run/i.test(sec)) {
    out.push({
      check: 'downstream',
      file: 'SECURITY.md',
      problem: 'the cryptographic disclaimer is still scoped to the browser',
    })
  }
  return out
}

/** 2 — the named UI surfaces render the notice, unconditionally. */
export function checkSurfaces(root: string): Problem[] {
  const out: Problem[] = []
  for (const rel of EDUCATION_SURFACES) {
    const src = read(root, rel)
    if (!src) {
      out.push({ check: 'surfaces', file: rel, problem: 'missing' })
      continue
    }
    if (!/<EducationNotice\b/.test(src)) {
      out.push({ check: 'surfaces', file: rel, problem: 'does not render <EducationNotice/>' })
      continue
    }
    // Unconditional: the notice must not sit inside a persona/role condition.
    // This is the exact failure the HSM Playground had — an honest sentence
    // rendered only for role === 'executive' || 'grc'.
    for (const line of src.split('\n')) {
      if (
        /<EducationNotice\b/.test(line) &&
        /role ===|persona ===|\?\s*<EducationNotice/.test(line)
      ) {
        out.push({
          check: 'surfaces',
          file: rel,
          problem: '<EducationNotice/> appears to be behind a role/persona condition',
        })
      }
    }
  }
  return out
}

/** 3 — published artefacts and root docs state the status. */
export function checkArtefacts(root: string): Problem[] {
  return ARTEFACT_SURFACES.filter((s) => !read(root, s.file).includes(s.needle)).map((s) => ({
    check: 'artefacts' as const,
    file: s.file,
    problem: `does not carry the notice in ${s.what}`,
  }))
}

/**
 * 4 — INVERSE GATE. Any file with an export/copy affordance must carry a
 * notice, or be grandfathered. New export paths fail by default.
 */
export function checkExports(root: string): Problem[] {
  const grandfathered = new Set(EXPORT_GRANDFATHERED)
  const out: Problem[] = []
  const stillListed = new Set<string>()
  for (const rel of listSourceFiles(root)) {
    const src = read(root, rel)
    const hits = EXPORT_PATTERNS.filter((re) => re.test(src))
    if (hits.length === 0) continue
    const covered = NOTICE_TOKENS.test(src)
    if (grandfathered.has(rel)) {
      stillListed.add(rel)
      // A grandfathered file that has since been covered should leave the list —
      // that is how the burn-down actually shrinks instead of stalling.
      if (covered) {
        out.push({
          check: 'exports',
          file: rel,
          problem: 'now carries a notice — remove it from EXPORT_GRANDFATHERED',
        })
      }
      continue
    }
    if (!covered) {
      out.push({
        check: 'exports',
        file: rel,
        problem:
          'has an export/copy affordance but no status notice. Inject one (see src/data/educationNotice.ts helpers) — do not add it to EXPORT_GRANDFATHERED without a stated reason.',
      })
    }
  }
  // A stale exemption is a lie about the tree, so it fails too.
  for (const rel of EXPORT_GRANDFATHERED) {
    if (!stillListed.has(rel) && !fs.existsSync(path.join(root, rel))) {
      out.push({
        check: 'exports',
        file: rel,
        problem: 'grandfathered file no longer exists — remove it from EXPORT_GRANDFATHERED',
      })
    }
  }
  return out
}

export function auditEducationNotice(root = ROOT): Problem[] {
  return [
    ...checkDownstream(root),
    ...checkSurfaces(root),
    ...checkArtefacts(root),
    ...checkExports(root),
  ]
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  const problems = auditEducationNotice(ROOT)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ problems, grandfathered: EXPORT_GRANDFATHERED.length }, null, 2))
  } else {
    const total = listSourceFiles(ROOT).filter((rel) =>
      EXPORT_PATTERNS.some((re) => re.test(read(ROOT, rel)))
    ).length
    console.log(
      `education-notice gate: ${EDUCATION_SURFACES.length} UI surface(s), ${ARTEFACT_SURFACES.length} artefact(s), ` +
        `${total} file(s) with an export/copy affordance, ${EXPORT_GRANDFATHERED.length} grandfathered (burn-down).`
    )
    for (const p of problems) console.error(`  [${p.check}] ${p.file}: ${p.problem}`)
  }
  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} education-notice problem(s).`)
    process.exit(1)
  }
  console.log('✓ education-notice gate passed.')
}
