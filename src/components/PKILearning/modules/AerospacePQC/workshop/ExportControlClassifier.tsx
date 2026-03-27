// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ShieldCheck, Globe } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { EXPORT_PRODUCTS, EXPORT_DESTINATIONS, classifyExport } from '../data/exportControlData'
import { LICENSE_EASE_COLORS } from '../data/aerospaceConstants'

const productItems = EXPORT_PRODUCTS.map((p) => ({ id: p.id, label: p.productType }))
const destinationItems = EXPORT_DESTINATIONS.map((d) => ({ id: d.id, label: d.country }))

export const ExportControlClassifier: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState(EXPORT_PRODUCTS[0].id)
  const [selectedDest, setSelectedDest] = useState(EXPORT_DESTINATIONS[0].id)

  const product = useMemo(
    () => EXPORT_PRODUCTS.find((p) => p.id === selectedProduct)!,
    [selectedProduct]
  )

  const destination = useMemo(
    () => EXPORT_DESTINATIONS.find((d) => d.id === selectedDest)!,
    [selectedDest]
  )

  const result = useMemo(() => classifyExport(product, destination), [product, destination])

  // Compare across all destinations for this product
  const allResults = useMemo(
    () =>
      EXPORT_DESTINATIONS.map((dest) => ({
        destination: dest,
        result: classifyExport(product, dest),
      })),
    [product]
  )

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="export-product"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            PQC Aerospace Product
          </label>
          <FilterDropdown
            items={productItems}
            selectedId={selectedProduct}
            onSelect={setSelectedProduct}
            label="Product"
          />
        </div>
        <div>
          <label
            htmlFor="export-dest"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Export Destination
          </label>
          <FilterDropdown
            items={destinationItems}
            selectedId={selectedDest}
            onSelect={setSelectedDest}
            label="Destination"
          />
        </div>
      </div>

      {/* Product Detail */}
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">{product.productType}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{product.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Regime:</span>{' '}
            <span className="font-bold text-foreground">{product.regime.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Classification:</span>{' '}
            <span className="font-bold text-foreground">{product.classification}</span>
          </div>
          <div>
            <span className="text-muted-foreground">CFR Citation:</span>{' '}
            <span className="font-bold text-foreground">{product.cfrCitation}</span>
          </div>
          <div>
            <span className="text-muted-foreground">License Exception:</span>{' '}
            <span className="font-bold text-foreground">{product.licenseException ?? 'None'}</span>
          </div>
        </div>
      </div>

      {/* Classification Result */}
      <div className="glass-panel p-4 space-y-3 border-l-4 border-primary">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Export to {destination.country}</h3>
          <span
            className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${LICENSE_EASE_COLORS[destination.licenseEase]}`}
          >
            {destination.licenseEase.charAt(0).toUpperCase() + destination.licenseEase.slice(1)}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alliance:</span>
            <span className="font-bold text-foreground">{destination.alliance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Applicable Regime:</span>
            <span className="font-bold text-foreground">{result.regime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">License Required:</span>
            <span
              className={`font-bold ${result.licenseRequired ? 'text-status-error' : 'text-status-success'}`}
            >
              {result.licenseRequired ? 'Yes' : 'No'}
            </span>
          </div>
          {result.licenseException && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exception:</span>
              <span className="font-bold text-status-success">{result.licenseException}</span>
            </div>
          )}
        </div>

        <div className={`text-sm font-bold ${result.verdictColor}`}>{result.verdict}</div>

        {result.sovereignMandates.length > 0 &&
          result.sovereignMandates[0] !== 'N/A — export prohibited' && (
            <div className="bg-status-warning/10 rounded-lg p-3 border border-status-warning/20">
              <h4 className="text-xs font-bold text-foreground mb-1">
                Sovereign Crypto Requirements
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {result.sovereignMandates.map((mandate, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-status-warning mt-0.5">&bull;</span>
                    {mandate}
                  </li>
                ))}
              </ul>
            </div>
          )}

        <p className="text-xs text-muted-foreground">{destination.notes}</p>
      </div>

      {/* All Destinations Comparison */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">
          All Destinations: {product.productType}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                  Destination
                </th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Alliance</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">License</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {allResults.map(({ destination: dest, result: r }) => (
                <tr
                  key={dest.id}
                  className={`border-b border-border/50 ${dest.id === selectedDest ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 px-3 font-medium text-foreground">{dest.country}</td>
                  <td className="py-2 px-3 text-muted-foreground">{dest.alliance}</td>
                  <td className="text-center py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${LICENSE_EASE_COLORS[dest.licenseEase]}`}
                    >
                      {dest.licenseEase}
                    </span>
                  </td>
                  <td className={`py-2 px-3 text-xs ${r.verdictColor}`}>{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
