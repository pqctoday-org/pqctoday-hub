import React from 'react'
import type { X509Attribute } from './types'

interface AttributeTableProps {
  attributes: X509Attribute[]
  onAttributeChange: (id: string, field: keyof X509Attribute, value: string | boolean) => void
  showSource?: boolean
}

export const AttributeTable: React.FC<AttributeTableProps> = ({
  attributes,
  onAttributeChange,
  showSource = false,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-muted-foreground text-xs uppercase tracking-wider">
            <th className="p-3 w-10 text-center">Use</th>
            {showSource && <th className="p-3">Source</th>}
            <th className="p-3">Type</th>
            <th className="p-3">Name</th>
            <th className="p-3 w-1/3">Value</th>
            <th className="p-3">Rec. / Desc.</th>
          </tr>
        </thead>
        <tbody>
          {attributes.map((attr) => (
            <tr
              key={attr.id}
              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!attr.enabled ? 'opacity-50' : ''}`}
            >
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={attr.enabled}
                  disabled={attr.status === 'mandatory'}
                  onChange={(e) => onAttributeChange(attr.id, 'enabled', e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                />
              </td>
              {showSource && (
                <td className="p-3">
                  {attr.source === 'CSR' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-status-info text-status-info border-status-info/50">
                      CSR
                    </span>
                  )}
                  {attr.source === 'CA' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/10 text-secondary border-secondary/20">
                      CA
                    </span>
                  )}
                  {(!attr.source || attr.source === 'Manual') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border-border">
                      Manual
                    </span>
                  )}
                </td>
              )}
              <td className="p-3 text-muted-foreground text-xs">{attr.elementType}</td>
              <td className="p-3 text-foreground font-medium text-sm">
                <div className="flex flex-col">
                  <span>{attr.label}</span>
                  <div className="flex gap-1 mt-1">
                    {attr.status === 'mandatory' && (
                      <span className="text-[10px] bg-status-error text-status-error px-1.5 py-0.5 rounded w-fit">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => onAttributeChange(attr.id, 'value', e.target.value)}
                  placeholder={attr.placeholder}
                  disabled={!attr.enabled || (showSource && attr.source === 'CSR')}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-accent-foreground focus:border-primary/50 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:cursor-text cursor-not-allowed md:pointer-events-auto pointer-events-none"
                  readOnly={true}
                />
              </td>
              <td className="p-3 text-muted-foreground text-xs max-w-[200px]">
                {attr.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
