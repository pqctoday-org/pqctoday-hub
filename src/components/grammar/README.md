# UX grammar components

One copy of each piece; pages only compose. Import from `@/components/grammar` (the barrel
`index.ts`). The spec is the UX grammar handoff v2.1; the section column below names the part of it
each piece implements. Facts live in one table each: chips in `chipRegistry.ts`, verbs in
`verbs.ts`, record types in `src/data/recordTypes.ts`, colours and type styles in
`src/styles/grammarTokens.json` (generated into `grammar-tokens.css`; run
`npm run gen:grammar-tokens`).

**Rule for lanes:** a published prop keeps its name and meaning. New behaviour arrives as a new
optional prop, listed in the change log at the end of this file.

## Element rules (section 2)

| Export                                   | File                            | Props (main ones)                                                                                                                                                                            | Section  |
| ---------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `Chip`                                   | `Chip.tsx`                      | `family`, `word` (typed per family), optional `value` (Confidence), `date` (Verified), `from` (Seeded)                                                                                       | 2.1      |
| `ChipRow`                                | `Chip.tsx`                      | `chips: ChipProps[]`, `label`; Source and Evidence on one row throws in development                                                                                                          | 2.1      |
| `CHIP_FAMILIES`, `chipWordSpec`          | `chipRegistry.ts`               | the table of words, tones and glyphs                                                                                                                                                         | 2.1      |
| `RoleButton`                             | `RoleButton.tsx`                | `emphasis` `primary` / `secondary` (default) / `quiet`, `dense`; the existing `Button` set to a role                                                                                         | 2.2      |
| `FacetPill`                              | `FacetPill.tsx`                 | `label`, `pressed`, `onToggle`, `count`; a toggle with `aria-pressed`                                                                                                                        | 2.2      |
| `VERBS`, `verbLabel`, `verbIcon`         | `verbs.ts`                      | `verbLabel('add', 'risk')` gives "Add risk"                                                                                                                                                  | 2.3      |
| `ProvenanceLine`                         | `FixedLines.tsx`                | `reviewed`, `draftedByAi`, `verified`, `sourceHref`                                                                                                                                          | 2.5      |
| `NoticeLine` (part B)                    | `FixedLines.tsx`                | `notA`, `onMore` or `moreHref`                                                                                                                                                               | 2.5      |
| `EmptyState`                             | `FixedLines.tsx`                | `thing`, `reason`, `action`                                                                                                                                                                  | 2.5      |
| `Expander`                               | `FixedLines.tsx`                | `title`, `defaultOpen`, `open`, `onOpenChange`                                                                                                                                               | 2.5      |
| `DataSourceLine`                         | `FixedLines.tsx`                | `name`, `updated`                                                                                                                                                                            | 2.5      |
| type styles                              | `src/styles/grammar-tokens.css` | classes `type-hero`, `type-section-title`, `type-block-title`, `type-eyebrow`, `type-body`, `type-small`, `type-button`, `type-chip`, `type-code`, `type-field` (the page title is not here) | 2.6      |
| `recordTypes`, `labelFor`, `countryName` | `src/data/recordTypes.ts`       | the 46-type table, label dictionary (D6)                                                                                                                                                     | 2.10, D6 |

## Page parts A to I (section 4.1)

| Part | Export         | Props (main ones)                                                                                                                      |
| ---- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| A    | `PageHeader`   | `breadcrumb`, `title`, `summary`, `count`, `forYou`, `titleClassName`                                                                  |
| B    | `NoticeLine`   | see above                                                                                                                              |
| C    | `PageTabBar`   | `tabs` (`slug`, `label`, `hidden`), `value`, `onChange`, `label`; at most 6 tabs; arrows, Home, End                                    |
| D    | `LensBar`      | `dimensions` (`dimension`, `options`, `value`, `available`, `notMappedPercent`), `onChange`                                            |
| E    | `FilterRow`    | `facetKey`, `facets`, `value`, `onFacetChange`, `search`, `view`                                                                       |
| F    | `RecordRow`    | `tag`, `title`, `titleFromSummary`, `meta`, `chips`, `onOpen`, `selected`; keeps `data-record-tag`                                     |
| G    | `ListFooter`   | `shown`, `total`, `onShowMore`                                                                                                         |
| H    | `RecordViewer` | `record` (`ViewerRecord`, null is closed), `onClose`, `onAskAssistant`, `onCopyLink`, `onSave`, `onOpenRelated`, `onEndorse`, `onFlag` |
| I    | `RelatedPanel` | `items` (`tag`, `title`, `type`, `phrase`), `onOpen`, `title`                                                                          |

## Section blocks 1 to 12 (section 4.2)

Every block takes `title`, `hideTitle`, `status` (`ready`, `loading`, `empty`, `error`, `partial`),
`emptyThing`, `activeFilter`, `onClearFilters`, `onSuggest`, `onRetry`, `onReport`, `partialNote`,
`skeleton` (section 3.3) through `BlockFrame`.

| #   | Export           | Block props                                                                                      |
| --- | ---------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `RecordList`     | `rows`, `total`, `toRow`, `onOpen`, `openTag`, `pageSize` (25)                                   |
| 2   | `DataTable`      | `columns` (`key`, `header`, `render`, `numeric`, `phone`), `rows`, `getTag`, `onOpen`, `openTag` |
| 3   | `CompareBlock`   | `fields`, `columns` (3 at most), `onRemove`                                                      |
| 4   | `StatTiles`      | `tiles` (`id`, `label`, `value`, `hint`, `onSelect`, `pressed`)                                  |
| 5   | `ChartPanel`     | `children` (the chart), `table`, `source`, `bars` (phone)                                        |
| 6   | `CardGrid`       | `cards` (`id`, `title`, `body`, `chips`, `action`)                                               |
| 7   | `AccordionGroup` | `items`, `defaultOpenId`                                                                         |
| 8   | `TimelineLanes`  | `lanes`, `onOpen`                                                                                |
| 9   | `WizardStep`     | `step`, `total`, `question`, `options`, `value`, `onChange`, `onContinue`, `onBack`, `last`      |
| 10  | `Workbench`      | `controls`, `run`, `instrument`                                                                  |
| 11  | `ProseBlock`     | `sections` (`id`, `heading`, `body`)                                                             |
| 12  | `StepStrip`      | `steps`, `currentId`, `doneIds`, `onSelect`, `label`                                             |

## URL contract (section 3.2)

`url/recordUrl.ts` (pure) and `url/useGrammarUrl.ts` (React Router): `parseGrammarSearch`,
`applyGrammarChange` (returns the new search and `push` or `replace`), `rewriteRecordAliases`
(old record keys to `?open=`, by page), `RECORD_KEY_ALIASES`, `TAB_KEY_ALIASES`,
`FACET_KEY_BY_PAGE`, `slugify`, `goPath`. Hooks: `useGrammarUrl(facetKey?)` and
`useRecordParam()` (`const [open, setOpen] = useRecordParam()`).

## Tool frame (section 7)

`ToolFrame` (`archetype`, `slots` keyed `T1`, `B`, `S`, `T2` to `T12`; `ARCHETYPE_SLOTS` says which
slots an archetype uses) and the shared components in `tool/components.tsx`: `EngineBar` (T3),
`Pkcs11Panel` (T9), `WizardFooter` (T6), `KnownAnswerTable` and `TamperTest` (T8), `Verdict`,
`ValueCard` and `OperationLog` (T7), `CheckYourself` (T10), `RecordExportBar` (T12),
`SeededFromLine` (S), `OriginChip`, `EvidenceChip`, `HowItRunsChip`, `OutputKindChip`. `StepStrip`
is block 12.

## Change log of published props

- 4.229.0: first publication.
