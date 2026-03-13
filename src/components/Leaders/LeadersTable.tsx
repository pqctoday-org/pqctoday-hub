// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Info, User } from 'lucide-react'
import type { Leader } from '../../data/leadersData'
import { CountryFlag } from '../common/CountryFlag'
import { StatusBadge } from '../common/StatusBadge'
import { FLAG_CODE_MAP } from './leadersConstants'
import clsx from 'clsx'

type SortKey = 'name' | 'title' | 'organization' | 'country' | 'type'
type SortDirection = 'asc' | 'desc'

interface LeadersTableProps {
  data: Leader[]
  onViewDetails: (leader: Leader) => void
}

export const LeadersTable = ({ data, onViewDetails }: LeadersTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = useMemo(() => {
    const items = [...data]
    const dir = sortDir === 'asc' ? 1 : -1
    items.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'organization':
          cmp = (a.organizations[0] ?? '').localeCompare(b.organizations[0] ?? '')
          break
        case 'country':
          cmp = a.country.localeCompare(b.country)
          break
        case 'type':
          cmp = a.type.localeCompare(b.type)
          break
      }
      return cmp * dir
    })
    return items
  }, [data, sortKey, sortDir])

  const sortIcon = (column: SortKey) => {
    if (sortKey !== column)
      return <ArrowUpDown size={12} className="text-muted-foreground/50" aria-hidden="true" />
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-primary" aria-hidden="true" />
    ) : (
      <ArrowDown size={12} className="text-primary" aria-hidden="true" />
    )
  }

  const thClass =
    'px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none'

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className={thClass} onClick={() => handleSort('name')}>
                <span className="flex items-center gap-1.5">Name {sortIcon('name')}</span>
              </th>
              <th
                className={clsx(thClass, 'hidden lg:table-cell')}
                onClick={() => handleSort('title')}
              >
                <span className="flex items-center gap-1.5">Title {sortIcon('title')}</span>
              </th>
              <th
                className={clsx(thClass, 'hidden md:table-cell')}
                onClick={() => handleSort('organization')}
              >
                <span className="flex items-center gap-1.5">
                  Organization {sortIcon('organization')}
                </span>
              </th>
              <th className={thClass} onClick={() => handleSort('country')}>
                <span className="flex items-center gap-1.5">Country {sortIcon('country')}</span>
              </th>
              <th
                className={clsx(thClass, 'hidden sm:table-cell')}
                onClick={() => handleSort('type')}
              >
                <span className="flex items-center gap-1.5">Sector {sortIcon('type')}</span>
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[60px]">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((leader) => (
              <LeaderRow key={leader.id} leader={leader} onViewDetails={onViewDetails} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const LeaderRow = ({
  leader,
  onViewDetails,
}: {
  leader: Leader
  onViewDetails: (leader: Leader) => void
}) => {
  const [imgError, setImgError] = useState(false)
  const flagCode = FLAG_CODE_MAP[leader.country] ?? 'un'

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      {/* Name with avatar */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          {leader.imageUrl && !imgError ? (
            <img
              src={leader.imageUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-primary/20 shrink-0"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <User size={14} />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-semibold text-foreground truncate block">{leader.name}</span>
            <StatusBadge status={leader.status} size="sm" />
          </div>
        </div>
      </td>

      {/* Title */}
      <td className="px-3 py-3 hidden lg:table-cell">
        <span className="text-muted-foreground truncate block max-w-[200px]">{leader.title}</span>
      </td>

      {/* Organization */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-foreground truncate block max-w-[180px]">
          {leader.organizations[0] ?? ''}
        </span>
      </td>

      {/* Country */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <CountryFlag code={flagCode} width={18} height={12} />
          <span className="text-muted-foreground text-xs">{leader.country}</span>
        </div>
      </td>

      {/* Sector */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <span
          className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
            leader.type === 'Public'
              ? 'bg-status-info text-status-info border-status-info'
              : leader.type === 'Private'
                ? 'bg-secondary/10 text-secondary border-secondary/20'
                : 'bg-status-success text-status-success border-status-success'
          )}
        >
          {leader.type}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 text-right">
        <button
          onClick={() => onViewDetails(leader)}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
          aria-label={`View details for ${leader.name}`}
        >
          <Info size={16} />
        </button>
      </td>
    </tr>
  )
}
