// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getStandard } from '@/data/standardsRegistry'
import {
  BINANCE_INCIDENT_ATTRIBUTION,
  BINANCE_INCIDENT_CONTAINMENT,
  BINANCE_INCIDENT_IMPACT,
  BINANCE_INCIDENT_METADATA,
  BINANCE_INCIDENT_SOURCE_IDS,
  BINANCE_INCIDENT_STAGES,
  CANONICAL_BINANCE_INCIDENT,
  getBinanceIncidentStage,
  type BinanceAiBranchStageId,
  type BinanceIncidentCausalRole,
  type BinanceIncidentSourceId,
  type BinanceIncidentStageId,
} from '@/data/canonicalBinanceIncident'

const SOURCE_FILE_PATH = path.resolve(process.cwd(), 'src', 'data', 'canonicalBinanceIncident.ts')

function collectSourceIds(record: typeof CANONICAL_BINANCE_INCIDENT): BinanceIncidentSourceId[] {
  const ids = new Set<BinanceIncidentSourceId>()
  for (const id of record.metadata.sourceIds) ids.add(id)
  for (const id of record.impact.sourceIds) ids.add(id)
  for (const outflow of record.impact.publishedAssetOutflows) ids.add(outflow.sourceId)
  for (const stage of record.stages) ids.add(stage.sourceId)
  ids.add(record.containment.sourceId)
  ids.add(record.attribution.victimStatementReference.sourceId)
  ids.add(record.attribution.officialGovernmentAttribution.sourceId)
  return [...ids]
}

describe('canonicalBinanceIncident', () => {
  it('resolves both primary Library IDs and all embedded source references via getStandard', () => {
    const binanceStd = getStandard(BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport)
    const fbiStd = getStandard(BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert)

    expect(binanceStd.id).toBe('Binance-Security-Incident-Update-and-Initial-Findings-Report')
    expect(binanceStd.deepLink).toBe(
      '/library?ref=Binance-Security-Incident-Update-and-Initial-Findings-Report'
    )
    expect(binanceStd.organization).toBe('Binance')

    expect(fbiStd.id).toBe('North-Korea-Responsible-for-6-Billion-Binance-Attack-FBI')
    expect(fbiStd.deepLink).toBe(
      '/library?ref=North-Korea-Responsible-for-6-Billion-Binance-Attack-FBI'
    )
    expect(fbiStd.organization).toContain('FBI')

    const validIds = new Set<string>(Object.values(BINANCE_INCIDENT_SOURCE_IDS))
    for (const id of collectSourceIds(CANONICAL_BINANCE_INCIDENT)) {
      expect(validIds.has(id)).toBe(true)
      const resolved = getStandard(id)
      expect(resolved.id).toBe(id)
      expect(resolved.deepLink.startsWith('/library?ref=')).toBe(true)
    }
  })

  it('maintains data completeness and structural integrity across all sections', () => {
    expect(CANONICAL_BINANCE_INCIDENT.metadata).toBe(BINANCE_INCIDENT_METADATA)
    expect(CANONICAL_BINANCE_INCIDENT.impact).toBe(BINANCE_INCIDENT_IMPACT)
    expect(CANONICAL_BINANCE_INCIDENT.stages).toBe(BINANCE_INCIDENT_STAGES)
    expect(CANONICAL_BINANCE_INCIDENT.containment).toBe(BINANCE_INCIDENT_CONTAINMENT)
    expect(CANONICAL_BINANCE_INCIDENT.attribution).toBe(BINANCE_INCIDENT_ATTRIBUTION)

    expect(BINANCE_INCIDENT_METADATA.incidentId).toBe('binance-2026-10-29')
    expect(BINANCE_INCIDENT_METADATA.epistemicStatus.toLowerCase()).toContain('initial')
    expect(BINANCE_INCIDENT_STAGES).toHaveLength(5)
    expect(BINANCE_INCIDENT_IMPACT.publishedAssetOutflows).toHaveLength(5)

    for (const stage of BINANCE_INCIDENT_STAGES) {
      expect(stage.id.length).toBeGreaterThan(0)
      expect(stage.title.length).toBeGreaterThan(0)
      expect(stage.date.length).toBeGreaterThan(0)
      expect(stage.dateDisplay.length).toBeGreaterThan(0)
      expect(stage.actors.length).toBeGreaterThanOrEqual(1)
      expect(stage.summary.length).toBeGreaterThan(20)
      expect(stage.technicalDetails.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('records exact published dates, financial amounts, replenishment status, and all five asset outflows', () => {
    expect(BINANCE_INCIDENT_METADATA.incidentDate).toBe('2026-10-29')
    expect(BINANCE_INCIDENT_METADATA.binanceReportPublishedDate).toBe('2026-11-03')
    expect(BINANCE_INCIDENT_METADATA.fbiAlertPublishedDate).toBe('2026-10-31')
    expect(BINANCE_INCIDENT_METADATA.fbiAlertModifiedDate).toBe('2026-11-02')

    expect(BINANCE_INCIDENT_IMPACT.totalImpactedUsdApprox).toBe(6_340_000_000)
    expect(BINANCE_INCIDENT_IMPACT.totalImpactedUsdDisplay).toContain('USD 6.34 billion')
    expect(BINANCE_INCIDENT_IMPACT.fbiMinimumTheftUsdDisplay).toContain('$6 billion USD')
    expect(BINANCE_INCIDENT_IMPACT.frozenOrInterceptedUsdApprox).toBe(2_850_000_000)
    expect(BINANCE_INCIDENT_IMPACT.frozenOrInterceptedUsdDisplay).toContain('USD 2.85 billion')
    expect(BINANCE_INCIDENT_IMPACT.valuationCaveat).toContain(
      'reconciliation and market price volatility'
    )
    expect(BINANCE_INCIDENT_IMPACT.userImpactPolicy).toContain('100%')
    expect(BINANCE_INCIDENT_IMPACT.replenishmentAsOfDate).toBe('2026-10-31')
    expect(BINANCE_INCIDENT_IMPACT.replenishmentStatus).toContain('98%')
    expect(BINANCE_INCIDENT_IMPACT.replenishmentStatus).toContain('Proof of Reserves')

    const amounts = BINANCE_INCIDENT_IMPACT.publishedAssetOutflows.map((o) => o.amountDisplay)
    expect(amounts).toEqual([
      '233.46 million XRP',
      'Approximately 970,500 SOL',
      '44.2 million OP',
      '18,270 BTC',
      '2,961.9 ETH',
    ])
  })

  it('preserves chronological order, exact stage lookup, and source phrasing precision', () => {
    expect(BINANCE_INCIDENT_STAGES.map((s) => s.sequenceOrder)).toEqual([1, 2, 3, 4, 5])

    const expectedIds: readonly BinanceIncidentStageId[] = [
      'engineer-a-supply-chain',
      'engineer-b-social-engineering',
      'internal-ai-tool-pivot',
      'signing-service-exploitation',
      'containment-and-eip7702-revocation',
    ]
    expect(BINANCE_INCIDENT_STAGES.map((s) => s.id)).toEqual(expectedIds)
    expect(new Set(BINANCE_INCIDENT_STAGES.map((s) => s.id)).size).toBe(5)

    let previousDate = ''
    for (const stage of BINANCE_INCIDENT_STAGES) {
      if (previousDate) {
        expect(stage.date >= previousDate).toBe(true)
      }
      previousDate = stage.date
    }

    for (const id of expectedIds) {
      expect(getBinanceIncidentStage(id).id).toBe(id)
    }

    const aiBranchIds: readonly BinanceAiBranchStageId[] = [
      'engineer-a-supply-chain',
      'engineer-b-social-engineering',
      'internal-ai-tool-pivot',
    ]
    for (const branchId of aiBranchIds) {
      expect(getBinanceIncidentStage(branchId).phase).toBe('preparation')
    }

    const engineerA = getBinanceIncidentStage('engineer-a-supply-chain')
    const engineerAText = `${engineerA.title} ${engineerA.summary} ${engineerA.technicalDetails.join(' ')}`
    expect(engineerAText).toContain('tampered Homebrew installation')
    expect(engineerAText).not.toContain('Homebrew installer')

    const engineerB = getBinanceIncidentStage('engineer-b-social-engineering')
    const engineerBText = `${engineerB.summary} ${engineerB.technicalDetails.join(' ')}`
    expect(engineerBText).toContain('/opt/homebrew/Cellar/pyenv/2.8.0/libexec/pyenv_')
    expect(engineerBText).toContain('3,344 B')
    expect(engineerBText).toContain('3,414 B')
    expect(engineerBText).toContain('legitimate development tool component')
    expect(engineerBText).toContain('pyenv')

    const aiPivot = getBinanceIncidentStage('internal-ai-tool-pivot')
    const aiPivotText = `${aiPivot.summary} ${aiPivot.technicalDetails.join(' ')}`
    expect(aiPivotText).toContain('used an internal AI tool')
    expect(aiPivotText.toLowerCase()).not.toContain('misuse')

    const execution = getBinanceIncidentStage('signing-service-exploitation')
    const executionText = `${execution.dateDisplay} ${execution.summary} ${execution.technicalDetails.join(' ')}`
    expect(executionText).toContain('17:15')
    expect(executionText).toContain('19:56')
    expect(executionText).toContain('timezone omitted')
    expect(executionText).not.toMatch(/17:15[^.\n]*19:56\s*UTC/i)
  })

  it('keeps Binance victim initial findings strictly separate from FBI official attribution', () => {
    const { victimStatementReference, officialGovernmentAttribution } = BINANCE_INCIDENT_ATTRIBUTION

    expect(victimStatementReference.organization).toBe('Binance')
    expect(victimStatementReference.publishedDate).toBe('2026-11-03')
    expect(victimStatementReference.sourceId).toBe(BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport)
    expect(victimStatementReference.priorThreatContext).toContain('57')

    expect(officialGovernmentAttribution.leadAgency).toBe('Federal Bureau of Investigation (FBI)')
    expect(officialGovernmentAttribution.partnerAgencies).toEqual(['USSS', 'IRS-CI'])
    expect(officialGovernmentAttribution.publishedDate).toBe('2026-10-31')
    expect(officialGovernmentAttribution.modifiedDate).toBe('2026-11-02')
    expect(officialGovernmentAttribution.attributedStateActor).toContain('North Korea')
    expect(officialGovernmentAttribution.campaignName).toBe('TraderTraitor')
    expect(officialGovernmentAttribution.observedLaunderingAndGuidance).toContain('Ether (ETH)')
    expect(officialGovernmentAttribution.observedLaunderingAndGuidance).toContain('DeFi')
    expect(officialGovernmentAttribution.observedLaunderingAndGuidance).toContain(
      'instant swap services'
    )
    expect(officialGovernmentAttribution.sourceId).toBe(
      BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert
    )

    expect(victimStatementReference.sourceId).not.toBe(officialGovernmentAttribution.sourceId)
    expect(victimStatementReference.publishedDate).not.toBe(
      officialGovernmentAttribution.publishedDate
    )
    expect(victimStatementReference.statementSummary).not.toContain('TraderTraitor')
    expect(victimStatementReference.statementSummary).not.toContain('USSS')
    expect(victimStatementReference.statementSummary).not.toContain('IRS-CI')
  })

  it('captures EIP-7702 containment findings, MPC constraint, and zero-address revocation verbatim', () => {
    const { eip7702Exploitation, keyFinding, verbatimContainmentQuotes, onChainRevocation } =
      BINANCE_INCIDENT_CONTAINMENT

    expect(eip7702Exploitation.signingTransactionsCount).toBe(50)
    expect(eip7702Exploitation.targetHotWalletLabel).toBe('Binance14')
    expect(eip7702Exploitation.hotWalletArchitecture).toContain('Multi-Party Computation (MPC)')
    expect(eip7702Exploitation.hotWalletArchitecture).toContain('no single private key')
    expect(eip7702Exploitation.privateKeyExposureClaim).toContain(
      'without exposing the private key'
    )

    expect(keyFinding).toContain('did not automatically invalidate existing on-chain')
    expect(verbatimContainmentQuotes.join(' ')).toContain(
      'Furthermore, suspending withdrawals and shutting down hot wallet services did not automatically invalidate existing on-chain authorizations.'
    )

    expect(onChainRevocation.completedAtUtc).toBe('2026-10-30T00:10:00Z')
    expect(onChainRevocation.targetAddressClearedTo).toBe('the zero address')
    expect(onChainRevocation.finalUnauthorizedTransfer.amountDisplay).toBe('2,961.9 ETH')
    expect(onChainRevocation.finalUnauthorizedTransfer.finalizedAtUtc).toBe('2026-10-29T23:56:00Z')
  })

  it('keeps local AI causal-role verdicts out of shared stages and avoids internal-only references', () => {
    const allowedCausalRoles: readonly BinanceIncidentCausalRole[] = [
      'none shown',
      'not stated',
      'tool-mediated',
    ]
    const stageText = BINANCE_INCIDENT_STAGES.map((stage) =>
      [stage.title, stage.summary, ...stage.technicalDetails].join(' ')
    )
      .join(' ')
      .toLowerCase()

    for (const verdict of allowedCausalRoles) {
      expect(stageText).not.toContain(verdict)
    }

    // Read source text to verify public hygiene without embedding restricted strings literally.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sourceText = fs.readFileSync(SOURCE_FILE_PATH, 'utf-8')
    const lowerSource = sourceText.toLowerCase()
    const bannedSubstrings = [
      ['pqctoday', 'priv'].join('-'),
      ['pqctoday', 'admin'].join('-'),
      ['local', 'evidence', 'cache'].join('-'),
      ['to', 'verify'].join(' '),
      ['plan', 'a1'].join('-'),
      ['plan', 'a2'].join('-'),
      ['plan', 'ai'].join('-'),
      ['clau', 'de'].join(''),
      ['gem', 'ini'].join(''),
      ['co', 'dex'].join(''),
    ]
    for (const term of bannedSubstrings) {
      expect(lowerSource).not.toContain(term)
    }
    expect(sourceText).not.toMatch(/\ba[12]-tv-[0-9]+\b/i)
    expect(sourceText).not.toMatch(/\bm2\.[0-9]+\b/i)
  })
})
