import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { glossaryTerms } from '@/data/glossaryData'
import { libraryData } from '@/data/libraryData'
import { timelineData } from '@/data/timelineData'
import { complianceFrameworks } from '@/data/complianceData'
import { softwareData } from '@/data/migrateData'
import { leadersData } from '@/data/leadersData'
import { threatsData } from '@/data/threatsData'
import { authoritativeSources } from '@/data/authoritativeSourcesData'
import { loadAlgorithmsData } from '@/data/algorithmsData'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { MODULE_CATALOG, MODULE_TRACKS } from '@/components/PKILearning/moduleData'
import { quizQuestions, quizCategories } from '@/data/quizDataLoader'

function header(title: string, description: string): string {
  return `# ${title}\n\n${description}\n\n---\n\n`
}

function generateGlossary(): string {
  let md = header(
    'PQC Glossary',
    `${glossaryTerms.length} terms covering post-quantum cryptography concepts, algorithms, protocols, standards, and organizations.`
  )
  const grouped: Record<string, typeof glossaryTerms> = {}
  for (const t of glossaryTerms) {
    const cat = t.category
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(t)
  }
  for (const [cat, terms] of Object.entries(grouped)) {
    md += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`
    for (const t of terms) {
      md += `### ${t.term}${t.acronym ? ` (${t.acronym})` : ''}\n\n`
      md += `- **Category:** ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`
      md += `${t.definition}\n\n`
      if (t.technicalNote) md += `*Technical Note:* ${t.technicalNote}\n\n`
      md += `*Complexity:* ${t.complexity}\n\n`
    }
  }
  return md
}

async function generateAlgorithms(): Promise<string> {
  const algos = await loadPQCAlgorithmsData()
  let md = header(
    'PQC Algorithm Reference',
    `${algos.length} algorithm variants with security levels, key sizes, and performance metrics.`
  )
  const grouped: Record<string, typeof algos> = {}
  for (const a of algos) {
    if (!grouped[a.family]) grouped[a.family] = []
    grouped[a.family].push(a)
  }
  for (const [family, members] of Object.entries(grouped)) {
    md += `## ${family}\n\n`
    md +=
      '| Algorithm | Security Level | Public Key | Private Key | Sig/Ciphertext | FIPS Standard |\n'
    md +=
      '|-----------|---------------|------------|-------------|----------------|---------------|\n'
    for (const a of members) {
      md += `| ${a.name} | ${a.securityLevel ?? 'N/A'} | ${a.publicKeySize} B | ${a.privateKeySize} B | ${a.signatureCiphertextSize ?? '—'} B | ${a.fipsStandard || '—'} |\n`
    }
    md += '\n'
  }
  return md
}

async function generateTransitions(): Promise<string> {
  const transitions = await loadAlgorithmsData()
  let md = header(
    'Algorithm Transition Roadmap',
    `${transitions.length} classical-to-PQC migration mappings with deprecation and standardization timelines.`
  )
  md +=
    '| Classical Algorithm | Key Size | PQC Replacement | Function | Deprecation | Standardization |\n'
  md +=
    '|-------------------|----------|-----------------|----------|-------------|----------------|\n'
  for (const t of transitions) {
    md += `| ${t.classical} | ${t.keySize || '—'} | ${t.pqc} | ${t.function} | ${t.deprecationDate} | ${t.standardizationDate} |\n`
  }
  return md
}

function generateTimeline(): string {
  let md = header(
    'Global PQC Migration Timeline',
    `${timelineData.length} countries and regions with regulatory milestones and migration phases.`
  )
  for (const country of timelineData) {
    md += `## ${country.countryName}\n\n`
    for (const body of country.bodies) {
      md += `### ${body.fullName || body.name}\n\n`
      for (const event of body.events) {
        md += `- **${event.title}** (${event.startYear}–${event.endYear})\n`
        md += `  ${event.phase} ${event.type} — ${event.description}\n`
        if (event.sourceUrl) md += `  Source: ${event.sourceUrl}\n`
        md += '\n'
      }
    }
  }
  return md
}

function generateThreats(): string {
  let md = header(
    'Quantum Threat Landscape',
    `${threatsData.length} quantum threats by industry with criticality ratings and PQC countermeasures.`
  )
  const grouped: Record<string, typeof threatsData> = {}
  for (const t of threatsData) {
    if (!grouped[t.industry]) grouped[t.industry] = []
    grouped[t.industry].push(t)
  }
  for (const [industry, threats] of Object.entries(grouped)) {
    md += `## ${industry}\n\n`
    for (const t of threats) {
      md += `### ${t.description}\n\n`
      md += `- **Industry:** ${industry}\n`
      md += `- **Criticality:** ${t.criticality}\n`
      md += `- **Cryptography at Risk:** ${t.cryptoAtRisk}\n`
      md += `- **PQC Replacement:** ${t.pqcReplacement}\n`
      md += `- **Source:** ${t.mainSource}\n`
      if (t.sourceUrl) md += `- **Source URL:** ${t.sourceUrl}\n`
      md += '\n'
    }
  }
  return md
}

function generateCompliance(): string {
  let md = header(
    'PQC Compliance Frameworks',
    `${complianceFrameworks.length} regulatory frameworks and standards requiring PQC adoption.`
  )
  for (const fw of complianceFrameworks) {
    md += `## ${fw.label}\n\n`
    md += `${fw.description}\n\n`
    md += `- **Industries:** ${fw.industries.join(', ')}\n`
    md += `- **Countries:** ${fw.countries.join(', ')}\n`
    md += `- **Requires PQC:** ${fw.requiresPQC ? 'Yes' : 'No'}\n`
    md += `- **Deadline:** ${fw.deadline || 'N/A'}\n`
    md += `- **Enforcement Body:** ${fw.enforcementBody}\n`
    if (fw.notes) md += `- **Notes:** ${fw.notes}\n`
    if (fw.libraryRefs.length) md += `- **Library References:** ${fw.libraryRefs.join(', ')}\n`
    if (fw.timelineRefs.length) md += `- **Timeline References:** ${fw.timelineRefs.join(', ')}\n`
    md += '\n'
  }
  return md
}

function generateLibrary(): string {
  let md = header(
    'PQC Reference Library',
    `${libraryData.length} reference documents, standards, and resources.`
  )
  for (const doc of libraryData) {
    md += `## ${doc.documentTitle}\n\n`
    md += `${doc.shortDescription}\n\n`
    md += `- **Type:** ${doc.documentType}\n`
    md += `- **Authors:** ${doc.authorsOrOrganization}\n`
    md += `- **Algorithm Family:** ${doc.algorithmFamily || '—'}\n`
    md += `- **Migration Urgency:** ${doc.migrationUrgency || '—'}\n`
    md += `- **Region:** ${doc.regionScope}\n`
    if (doc.downloadUrl) md += `- **URL:** ${doc.downloadUrl}\n`
    md += '\n'
  }
  return md
}

function generateMigrate(): string {
  let md = header(
    'PQC-Ready Software Catalog',
    `${softwareData.length} software products evaluated for post-quantum readiness.`
  )
  const grouped: Record<string, typeof softwareData> = {}
  for (const s of softwareData) {
    const layer = s.infrastructureLayer || 'Other'
    if (!grouped[layer]) grouped[layer] = []
    grouped[layer].push(s)
  }
  for (const [layer, products] of Object.entries(grouped)) {
    md += `## ${layer}\n\n`
    for (const s of products) {
      md += `### ${s.softwareName}\n\n`
      md += `- **Infrastructure Layer:** ${layer}\n`
      md += `- **Category:** ${s.categoryName}\n`
      md += `- **PQC Support:** ${s.pqcSupport}\n`
      md += `- **FIPS Validated:** ${s.fipsValidated}\n`
      md += `- **Version:** ${s.latestVersion}\n`
      md += `- **License:** ${s.licenseType}\n`
      if (s.pqcCapabilityDescription) md += `- **Capabilities:** ${s.pqcCapabilityDescription}\n`
      if (s.productBrief) md += `- **Product Brief:** ${s.productBrief}\n`
      if (s.targetIndustries) md += `- **Target Industries:** ${s.targetIndustries}\n`
      if (s.migrationPhases) md += `- **Migration Phases:** ${s.migrationPhases}\n`
      if (s.primaryPlatforms) md += `- **Platforms:** ${s.primaryPlatforms}\n`
      if (s.releaseDate) md += `- **Release Date:** ${s.releaseDate}\n`
      if (s.repositoryUrl) md += `- **Repository:** ${s.repositoryUrl}\n`
      md += '\n'
    }
  }
  return md
}

function generateLeaders(): string {
  let md = header(
    'PQC Industry Leaders',
    `${leadersData.length} key individuals and organizations driving the post-quantum transition.`
  )
  const grouped: Record<string, typeof leadersData> = {}
  for (const l of leadersData) {
    if (!grouped[l.category]) grouped[l.category] = []
    grouped[l.category].push(l)
  }
  for (const [cat, leaders] of Object.entries(grouped)) {
    md += `## ${cat}\n\n`
    for (const l of leaders) {
      md += `### ${l.name}\n\n`
      md += `- **Leader Category:** ${cat}\n`
      if (l.title) md += `- **Title:** ${l.title}\n`
      md += `- **Country:** ${l.country}\n`
      md += `- **Organizations:** ${l.organizations.join(', ')}\n`
      md += `- **Type:** ${l.type}\n`
      md += `- **Contribution:** ${l.bio}\n`
      if (l.websiteUrl) md += `- **Website:** ${l.websiteUrl}\n`
      if (l.keyResourceUrl) md += `- **Key Resource:** ${l.keyResourceUrl}\n`
      md += '\n'
    }
  }
  return md
}

function generateModules(): string {
  let md = header(
    'PQC Learning Modules',
    `${Object.keys(MODULE_CATALOG).length} interactive learning modules organized by track.`
  )
  for (const track of MODULE_TRACKS) {
    md += `## Track: ${track.track}\n\n`
    for (const mod of track.modules) {
      md += `### ${mod.title}\n\n`
      md += `${mod.description}\n\n`
      md += `- **Duration:** ${mod.duration}\n`
      md += `- **URL:** https://pqctoday.com/learn/${mod.id}\n\n`
    }
  }
  return md
}

function generateQuiz(): string {
  let md = header(
    'PQC Quiz Question Bank',
    `${quizQuestions.length} questions across ${quizCategories.length} categories for self-assessment and study.`
  )
  const catLabelMap: Record<string, string> = {}
  for (const c of quizCategories) {
    catLabelMap[c.id] = c.label
  }
  const grouped: Record<string, typeof quizQuestions> = {}
  for (const q of quizQuestions) {
    const cat = q.category
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(q)
  }
  for (const [cat, questions] of Object.entries(grouped)) {
    md += `## ${catLabelMap[cat] || cat}\n\n`
    for (const q of questions) {
      md += `### ${q.question}\n\n`
      md += `*Category:* ${catLabelMap[cat] || cat} | *Difficulty:* ${q.difficulty} | *Type:* ${q.type}\n\n`
      for (const opt of q.options) {
        const isCorrect = Array.isArray(q.correctAnswer)
          ? q.correctAnswer.includes(opt.id)
          : q.correctAnswer === opt.id
        md += `- ${opt.id.toUpperCase()}) ${opt.text}${isCorrect ? ' **[correct]**' : ''}\n`
      }
      md += `\n**Explanation:** ${q.explanation}\n`
      if (q.learnMorePath) md += `\n*Learn more:* https://pqctoday.com${q.learnMorePath}\n`
      md += '\n'
    }
  }
  return md
}

function generateAuthoritativeSources(): string {
  let md = header(
    'Authoritative Sources',
    `${authoritativeSources.length} verified organizations and institutions sourcing PQC Today data.`
  )
  const grouped: Record<string, typeof authoritativeSources> = {}
  for (const s of authoritativeSources) {
    const type = s.sourceType
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(s)
  }
  for (const [type, sources] of Object.entries(grouped)) {
    md += `## ${type}\n\n`
    for (const s of sources) {
      md += `### ${s.sourceName}\n\n`
      md += `${s.description}\n\n`
      md += `- **Region:** ${s.region}\n`
      md += `- **URL:** ${s.primaryUrl}\n`
      const feeds: string[] = []
      if (s.leadersCsv) feeds.push('Leaders')
      if (s.libraryCsv) feeds.push('Library')
      if (s.algorithmCsv) feeds.push('Algorithms')
      if (s.threatsCsv) feeds.push('Threats')
      if (s.timelineCsv) feeds.push('Timeline')
      if (s.complianceCsv) feeds.push('Compliance')
      if (s.migrateCsv) feeds.push('Migrate')
      if (feeds.length) md += `- **Data Feeds:** ${feeds.join(', ')}\n`
      md += `- **Last Verified:** ${s.lastVerifiedDate}\n\n`
    }
  }
  return md
}

function generateReadme(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `# PQC Today Study Pack

Generated on ${date} from [PQC Today](https://pqctoday.com).

## How to Use with Google NotebookLM

1. Go to [NotebookLM](https://notebooklm.google.com)
2. Create a new notebook
3. Upload the markdown files from this ZIP as sources
4. Start asking questions about post-quantum cryptography!

## Contents

| File | Description |
|------|-------------|
| 01-glossary.md | ${glossaryTerms.length}+ PQC terms and definitions |
| 02-algorithms.md | Algorithm specs, key sizes, and performance |
| 03-algorithm-transitions.md | Classical to PQC migration mappings |
| 04-timeline.md | Country-by-country migration timelines |
| 05-threats.md | Quantum threats by industry |
| 06-compliance.md | Regulatory frameworks and deadlines |
| 07-library.md | Reference documents and resources |
| 08-migrate-catalog.md | PQC-ready software products |
| 09-leaders.md | Industry leaders and organizations |
| 10-learning-modules.md | Interactive learning module summaries |
| 11-quiz-questions.md | ${quizQuestions.length}+ quiz questions with explanations |
| 12-authoritative-sources.md | ${authoritativeSources.length}+ verified data sources |

## Sources

All data is sourced from authoritative references including NIST, ANSSI, BSI, Common Criteria,
and ${authoritativeSources.length}+ verified organizations. See the Authoritative Sources page
on PQC Today for the full list.

---

*PQC Today — Making post-quantum cryptography accessible to everyone.*
`
}

export async function generateStudyPack(): Promise<void> {
  const zip = new JSZip()

  const [algos, transitions] = await Promise.all([generateAlgorithms(), generateTransitions()])

  zip.file('01-glossary.md', generateGlossary())
  zip.file('02-algorithms.md', algos)
  zip.file('03-algorithm-transitions.md', transitions)
  zip.file('04-timeline.md', generateTimeline())
  zip.file('05-threats.md', generateThreats())
  zip.file('06-compliance.md', generateCompliance())
  zip.file('07-library.md', generateLibrary())
  zip.file('08-migrate-catalog.md', generateMigrate())
  zip.file('09-leaders.md', generateLeaders())
  zip.file('10-learning-modules.md', generateModules())
  zip.file('11-quiz-questions.md', generateQuiz())
  zip.file('12-authoritative-sources.md', generateAuthoritativeSources())
  zip.file('README.md', generateReadme())

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `pqc-today-study-pack-${new Date().toISOString().slice(0, 10)}.zip`)
}
