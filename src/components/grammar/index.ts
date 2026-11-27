// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The UX grammar's shared components (handoff v2.1). One copy of each piece; pages only compose.
 * See README.md for what each one is, its props and the handoff section it implements.
 */

// Element rules
export { Chip, ChipRow, chipLabel, type ChipProps } from './Chip'
export {
  CHIP_FAMILIES,
  CHIP_FAMILY_NUMBER,
  EXCLUSIVE_FAMILIES,
  chipRowViolation,
  chipWordSpec,
  type ChipBorder,
  type ChipFamily,
  type ChipSpec,
  type ChipTone,
  type ChipWord,
  type ChipWordSpec,
} from './chipRegistry'
export { RoleButton, ROLE_VARIANT, type ButtonRole, type RoleButtonProps } from './RoleButton'
export { FacetPill, type FacetPillProps } from './FacetPill'
export { VERBS, VERB_ICONS, verbIcon, verbLabel, type VerbKey, type VerbIconName } from './verbs'
export {
  DataSourceLine,
  EmptyState,
  Expander,
  NoticeLine,
  ProvenanceLine,
  provenanceText,
  type DataSourceLineProps,
  type EmptyReason,
  type EmptyStateProps,
  type ExpanderProps,
  type NoticeLineProps,
  type ProvenanceLineProps,
} from './FixedLines'

// Page parts A to I
export {
  FilterRow,
  LENS_DIMENSIONS,
  LensBar,
  ListFooter,
  PageHeader,
  PageTabBar,
  RecordRow,
  metaDate,
  type Crumb,
  type FacetOption,
  type FilterRowProps,
  type LensBarProps,
  type LensDimension,
  type LensDimensionState,
  type ListFooterProps,
  type PageHeaderProps,
  type PageTab,
  type PageTabBarProps,
  type RecordRowProps,
} from './parts'
export {
  RecordViewer,
  firstSentence,
  type RecordViewerProps,
  type ViewerFact,
  type ViewerRecord,
} from './RecordViewer'
export {
  RelatedPanel,
  groupRelated,
  type RelatedItem,
  type RelatedPanelProps,
} from './RelatedPanel'

// Section blocks 1 to 12, and their four states
export {
  BlockFrame,
  BlockSkeleton,
  type BlockFrameProps,
  type BlockStateProps,
  type BlockStatus,
} from './BlockFrame'
export {
  AccordionGroup,
  CardGrid,
  ChartPanel,
  CompareBlock,
  DataTable,
  ProseBlock,
  RecordList,
  StatTiles,
  StepStrip,
  TimelineLanes,
  WizardStep,
  Workbench,
  type AccordionGroupProps,
  type AccordionItem,
  type CardGridProps,
  type ChartPanelProps,
  type CompareBlockProps,
  type CompareColumn,
  type DataColumn,
  type DataTableProps,
  type GridCard,
  type LaneItem,
  type ProseBlockProps,
  type ProseSection,
  type RecordListProps,
  type StatTile,
  type StatTilesProps,
  type StepStripProps,
  type StripStep,
  type TimelineLane,
  type TimelineLanesProps,
  type WizardOption,
  type WizardStepProps,
  type WorkbenchProps,
} from './blocks'

// URL contract
export {
  FACET_KEY_BY_PAGE,
  GRAMMAR_PARAMS,
  RECORD_KEY_ALIASES,
  TAB_KEY_ALIASES,
  applyGrammarChange,
  goPath,
  parseGrammarSearch,
  rewriteRecordAliases,
  slugify,
  type GrammarChange,
  type GrammarState,
  type GrammarUpdate,
  type HistoryMode,
  type RecordKeyAlias,
} from './url/recordUrl'
export { useGrammarUrl, useRecordParam, type GrammarUrl } from './url/useGrammarUrl'

// Tool frame (T1 to T12) and the shared tool components
export {
  ARCHETYPE_SLOTS,
  TOOL_SLOTS,
  ToolFrame,
  checkSlots,
  type BusinessArchetype,
  type PlaygroundArchetype,
  type ToolArchetype,
  type ToolFrameProps,
  type ToolFrameSlots,
  type ToolSlot,
} from './tool/ToolFrame'
export {
  CheckYourself,
  EngineBar,
  EvidenceChip,
  HowItRunsChip,
  KnownAnswerTable,
  OperationLog,
  OriginChip,
  OutputKindChip,
  Pkcs11Panel,
  RecordExportBar,
  SeededFromLine,
  TamperTest,
  ValueCard,
  Verdict,
  WizardFooter,
  type CheckQuestion,
  type EngineBarProps,
  type KnownAnswerRow,
  type OperationEntry,
  type Pkcs11Call,
  type Pkcs11Key,
  type Pkcs11PanelProps,
  type RecordExportBarProps,
  type TamperTestProps,
  type ValueCardProps,
  type VerdictWord,
  type WizardFooterProps,
} from './tool/components'
