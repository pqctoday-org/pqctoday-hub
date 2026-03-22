// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'



/**
 * Eagerly load all curious-summary.md files at bundle time.
 * Keyed by relative path like '../modules/Module1-Introduction/curious-summary.md'.
 */
const curiousSummaries = import.meta.glob('../modules/*/curious-summary.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Map directory names to moduleId slugs (same as route paths).
 * Only entries where dir name !== moduleId need to be listed.
 */
const DIR_TO_MODULE_ID: Record<string, string> = {
  'Module1-Introduction': 'pqc-101',
  QuantumThreats: 'quantum-threats',
  HybridCrypto: 'hybrid-crypto',
  CryptoAgility: 'crypto-agility',
  TLSBasics: 'tls-basics',
  VPNSSH: 'vpn-ssh-pqc',
  EmailSigning: 'email-signing',
  PKIWorkshop: 'pki-workshop',
  KmsPqc: 'kms-pqc',
  HsmPqc: 'hsm-pqc',
  DataAssetSensitivity: 'data-asset-sensitivity',
  StatefulSignatures: 'stateful-signatures',
  DigitalAssets: 'digital-assets',
  FiveG: '5g-security',
  DigitalID: 'digital-id',
  Entropy: 'entropy-randomness',
  MerkleTreeCerts: 'merkle-tree-certs',
  QKD: 'qkd',
  VendorRisk: 'vendor-risk',
  ComplianceStrategy: 'compliance-strategy',
  MigrationProgram: 'migration-program',
  PQCRiskManagement: 'pqc-risk-management',
  PQCBusinessCase: 'pqc-business-case',
  PQCGovernance: 'pqc-governance',
  CodeSigning: 'code-signing',
  APISecurityJWT: 'api-security-jwt',
  IoTOT: 'iot-ot-pqc',
  ConfidentialComputing: 'confidential-computing',
  WebGatewayPQC: 'web-gateway-pqc',
  EMVPaymentPQC: 'emv-payment-pqc',
  CryptoDevAPIs: 'crypto-dev-apis',
  PlatformEngPQC: 'platform-eng-pqc',
  EnergyUtilities: 'energy-utilities-pqc',
  HealthcarePQC: 'healthcare-pqc',
  AerospaceSpacePQC: 'aerospace-pqc',
  AutomotivePQC: 'automotive-pqc',
  ExecQuantumImpact: 'exec-quantum-impact',
  DevQuantumImpact: 'dev-quantum-impact',
  ArchQuantumImpact: 'arch-quantum-impact',
  OpsQuantumImpact: 'ops-quantum-impact',
  ResearchQuantumImpact: 'research-quantum-impact',
  StandardsBodies: 'standards-bodies',
  AISecurityPQC: 'ai-security-pqc',
  SecretsManagementPQC: 'secrets-management-pqc',
  NetworkSecurityPQC: 'network-security-pqc',
  DatabaseEncryptionPQC: 'database-encryption-pqc',
  IAMPQC: 'iam-pqc',
  SecureBootPQC: 'secure-boot-pqc',
  OSPQC: 'os-pqc',
}

/** Build a moduleId → markdown content lookup from the glob results */
const contentByModuleId: Record<string, string> = {}
for (const [filePath, content] of Object.entries(curiousSummaries)) {
  // Extract dir name: '../modules/FooBar/curious-summary.md' → 'FooBar'
  const match = filePath.match(/\/modules\/([^/]+)\/curious-summary\.md$/)
  if (!match) continue
  const dirName = match[1]
  const moduleId = DIR_TO_MODULE_ID[dirName] ?? dirName.toLowerCase() // eslint-disable-line security/detect-object-injection
  contentByModuleId[moduleId] = content // eslint-disable-line security/detect-object-injection
}

interface CuriousSummaryBannerProps {
  moduleId: string
  isFullPage?: boolean
}

/**
 * Collapsible "In Simple Terms" banner shown above module tabs when
 * experienceLevel === 'curious'. Renders the module's curious-summary.md.
 */
export const CuriousSummaryBanner = ({ moduleId, isFullPage = false }: CuriousSummaryBannerProps) => {
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isCuriousMode = experienceLevel === 'curious' || selectedPersona === 'curious'
  const [expanded, setExpanded] = useState(true)

  if (!isCuriousMode && !isFullPage) return null

  const content = contentByModuleId[moduleId] // eslint-disable-line security/detect-object-injection
  if (!content) return null

  // Strip the H1 title — we render our own heading
  const body = content.replace(/^#\s+.+\n+/, '')

  return (
    <div className={isFullPage ? 'w-full' : 'glass-panel border-l-4 border-l-amber-500/50 mb-3 overflow-hidden'}>
      {!isFullPage && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-between w-full px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Lightbulb size={16} className="shrink-0" />
            In Simple Terms
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
          )}
        </button>
      )}

      {(expanded || isFullPage) && (
        <div className={isFullPage ? '' : 'px-4 pb-4 -mt-1'}>
          <Tabs defaultValue="infographic" className="w-full">
            <TabsList className="w-full sm:w-auto mb-4 bg-muted/50 border border-border">
              <TabsTrigger value="infographic">Infographic</TabsTrigger>
              <TabsTrigger value="text">Text (In Simple Terms)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="infographic" className="mt-0">
              <div className="w-full flex justify-center bg-black/20 rounded-lg border border-border p-3">
                <img 
                  src={`/images/infographics/${moduleId}.png`} 
                  alt={`Infographic in simple terms for ${moduleId}`}
                  className="max-w-full h-auto rounded-md shadow-md"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="mt-0">
              <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-p:text-sm prose-p:leading-relaxed prose-strong:text-foreground prose-ul:text-sm prose-li:text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
