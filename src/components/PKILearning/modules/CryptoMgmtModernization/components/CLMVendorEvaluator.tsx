// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, XCircle, ShieldCheck, Server, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const VENDORS = [
  { name: 'Venafi', api: true, hsm: true, hybrid: true },
  { name: 'AppViewX', api: true, hsm: true, hybrid: false },
  { name: 'Keyfactor', api: true, hsm: true, hybrid: true },
  { name: 'Legacy In-House', api: false, hsm: false, hybrid: false },
]

export const CLMVendorEvaluator: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState(VENDORS[0].name)

  const vendor = VENDORS.find((v) => v.name === selectedVendor)

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground">CLM Vendor Evaluator</h2>
        <p className="text-muted-foreground mt-2">
          Evaluate Certificate Lifecycle Management (CLM) vendors on their readiness to support PQC
          certificate orchestration, Hybrid X.509 issuance, and HSM integration.
        </p>
      </div>

      <div className="flex gap-4 justify-center mb-8 flex-wrap">
        {VENDORS.map((v) => (
          <Button
            variant={selectedVendor === v.name ? 'default' : 'outline'}
            key={v.name}
            onClick={() => setSelectedVendor(v.name)}
            className="px-4 py-2"
          >
            {v.name}
          </Button>
        ))}
      </div>

      {vendor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Criterion 1 */}
          <div
            className={`p-6 rounded-xl border ${vendor.api ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Server size={24} className={vendor.api ? 'text-success' : 'text-destructive'} />
              <h3 className="font-bold">47-Day ACME / EST Automation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              By 2029, TLS certificates will have a maximum lifespan of 47 days. Does the vendor
              support fully automated ACME/EST enrollment?
            </p>
            {vendor.api ? (
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <CheckCircle2 size={16} /> Fully Supported
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                <XCircle size={16} /> Manual / Partial
              </div>
            )}
          </div>

          {/* Criterion 2 */}
          <div
            className={`p-6 rounded-xl border ${vendor.hsm ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={24} className={vendor.hsm ? 'text-success' : 'text-destructive'} />
              <h3 className="font-bold">HSM ML-DSA Key Generation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Can the CLM orchestrate ML-DSA-65 key generation directly inside a FIPS 140-3 Level 3
              HSM via PKCS#11 v3.2?
            </p>
            {vendor.hsm ? (
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <CheckCircle2 size={16} /> Orchestrated
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                <XCircle size={16} /> Not Supported
              </div>
            )}
          </div>

          {/* Criterion 3 */}
          <div
            className={`p-6 rounded-xl border ${vendor.hybrid ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className={vendor.hybrid ? 'text-success' : 'text-warning'} />
              <h3 className="font-bold">Hybrid / Composite Certificates</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Can the vendor issue and parse draft-ounsworth-pq-composite-sigs where both an RSA and
              ML-DSA signature reside in the same X.509 structure?
            </p>
            {vendor.hybrid ? (
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <CheckCircle2 size={16} /> Draft Supported
              </div>
            ) : (
              <div className="flex items-center gap-2 text-warning font-medium text-sm">
                <AlertCircle size={16} /> Roadmap Only
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
