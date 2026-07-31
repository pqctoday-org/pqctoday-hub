// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import {
  Globe,
  ArrowRightLeft,
  CreditCard,
  ShieldCheck,
  Monitor,
  AlertTriangle,
  Landmark,
  Scale,
} from 'lucide-react'
import { EMVPaymentIntroduction } from './components/EMVPaymentIntroduction'
import { EMVPaymentExercises } from './components/EMVPaymentExercises'
import { NetworkComparator } from './workshop/NetworkComparator'
import { TransactionSimulator } from './workshop/TransactionSimulator'
import { CardProvisioningVisualizer } from './workshop/CardProvisioningVisualizer'
import { TokenizationExplorer } from './workshop/TokenizationExplorer'
import { POSCryptoAnalyzer } from './workshop/POSCryptoAnalyzer'
import { MigrationRiskMatrix } from './workshop/MigrationRiskMatrix'
import { SettlementExposureModeller } from './workshop/SettlementExposureModeller'
import { SectorRegulationTimeline } from './workshop/SectorRegulationTimeline'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'network-comparator',
    title: 'Step 1: Payment Network Comparator',
    description:
      'Compare Visa, Mastercard, Amex, UnionPay, and Discover by scale, crypto stack, and PQC readiness.',
    icon: Globe,
  },
  {
    id: 'transaction-simulator',
    title: 'Step 2: Transaction Simulator',
    description:
      'Step through EMV online, offline DDA/CDA, contactless, and mobile payment flows with quantum vulnerability analysis.',
    icon: ArrowRightLeft,
  },
  {
    id: 'card-provisioning',
    title: 'Step 3: Card Provisioning',
    description:
      'Visualize the 5-phase card personalization process and compare RSA vs ML-DSA vs FN-DSA certificate chains.',
    icon: CreditCard,
  },
  {
    id: 'tokenization-explorer',
    title: 'Step 4: Tokenization Explorer',
    description:
      'Explore TSP architectures (Visa VTS, MC MDES, Amex EST) and mobile wallet provisioning with PQC overlay.',
    icon: ShieldCheck,
  },
  {
    id: 'pos-crypto-analyzer',
    title: 'Step 5: POS Crypto Analyzer',
    description:
      'Analyze DUKPT key management, key injection ceremonies, and PQC algorithm fit for constrained terminals.',
    icon: Monitor,
  },
  {
    id: 'migration-risk-matrix',
    title: 'Step 6: Migration Risk Matrix',
    description:
      'Map 10 payment components on a severity-effort matrix with dependency chains and migration timelines.',
    icon: AlertTriangle,
  },
  {
    id: 'settlement-exposure',
    title: 'Step 7: Settlement Exposure Modeller',
    description:
      'Model harvest-now-decrypt-later exposure for Swift messaging, domestic RTGS, and correspondent chains — driven by data retention rather than a guessed CRQC date.',
    icon: Landmark,
  },
  {
    id: 'regulation-timeline',
    title: 'Step 8: Sector Regulation Timeline',
    description:
      'Filter the financial sector’s PQC guidance by jurisdiction — BIS, G7 CEG, CMORG, Europol QSFF, FS-ISAC, MAS, DORA — and open each source document.',
    icon: Scale,
  },
]

export const EMVPaymentPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Card authentication, tokenization, authorization networks and POS terminals; interbank settlement rails, bank key management and key blocks; and the sector regulation that sets the migration pace."
    learn={(api) => <EMVPaymentIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <EMVPaymentExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <NetworkComparator key={`net-comp-${configKey}`} />
        case 1:
          return <TransactionSimulator key={`txn-sim-${configKey}`} />
        case 2:
          return <CardProvisioningVisualizer key={`card-prov-${configKey}`} />
        case 3:
          return <TokenizationExplorer key={`token-exp-${configKey}`} />
        case 4:
          return <POSCryptoAnalyzer key={`pos-crypto-${configKey}`} />
        case 5:
          return <MigrationRiskMatrix key={`mig-risk-${configKey}`} />
        case 6:
          return <SettlementExposureModeller key={`settlement-${configKey}`} />
        case 7:
          return <SectorRegulationTimeline key={`regulation-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
