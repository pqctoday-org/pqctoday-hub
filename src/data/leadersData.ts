// SPDX-License-Identifier: GPL-3.0-only
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV, splitSemicolon } from './csvUtils'

export interface Leader {
  id: string
  name: string
  country: string
  title: string
  organizations: string[]
  type: 'Public' | 'Private' | 'Academic'
  category: string
  bio: string
  imageUrl?: string
  websiteUrl?: string
  linkedinUrl?: string
  keyResourceUrl?: string
  status?: 'New' | 'Updated'
}

interface RawLeaderRow {
  Name: string
  Country: string
  Role: string
  Organization: string
  Type: string
  Category: string
  Contribution: string
  ImageUrl: string
  WebsiteUrl: string
  LinkedinUrl: string
  KeyResourceUrl: string
}

const modules = import.meta.glob('./leaders_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

type LeaderCore = Omit<Leader, 'id' | 'status'>

const {
  data: currentItems,
  previousData: previousItems,
  metadata,
} = loadLatestCSV<RawLeaderRow, LeaderCore>(
  modules,
  /leaders_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    name: row.Name,
    country: row.Country,
    title: row.Role,
    organizations: splitSemicolon(row.Organization),
    type: row.Type as Leader['type'],
    category: row.Category,
    bio: row.Contribution,
    imageUrl: row.ImageUrl,
    websiteUrl: row.WebsiteUrl,
    linkedinUrl: row.LinkedinUrl,
    keyResourceUrl: row.KeyResourceUrl,
  }),
  true // withPrevious for status badges
)

// Compute status map if previous data exists
const statusMap = previousItems
  ? compareDatasets(currentItems, previousItems, 'name')
  : new Map<string, ItemStatus>()

// Inject status into current items and export
export const leadersData: Leader[] = currentItems.map((item, index) => ({
  ...item,
  id: `${item.name}-${index}`,
  status: statusMap.get(item.name),
}))

export const leadersMetadata = metadata
