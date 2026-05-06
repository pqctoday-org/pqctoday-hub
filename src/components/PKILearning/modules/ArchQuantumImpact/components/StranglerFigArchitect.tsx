// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Server, Share2, Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const StranglerFigArchitect: React.FC = () => {
  const [migrationStep, setMigrationStep] = useState(0)

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground">Strangler Fig Architect</h2>
        <p className="text-muted-foreground mt-2">
          The "Strangler Fig" pattern allows you to gradually migrate a legacy monolithic database
          or crypto service to PQC without a massive, risky "big bang" cutover.
        </p>
      </div>

      <div className="p-6 bg-muted/20 border border-border rounded-xl">
        <div className="flex justify-between items-center mb-8">
          {[0, 1, 2].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${migrationStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {step + 1}
              </div>
              <p
                className={`text-xs mt-2 font-medium ${migrationStep >= step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {step === 0
                  ? 'Legacy State'
                  : step === 1
                    ? 'API Gateway Interception'
                    : 'Microservice Carve-out'}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative min-h-[300px]">
          {/* External Traffic */}
          <div className="flex flex-col items-center justify-center border-r border-border/50">
            <Share2 size={48} className="text-muted-foreground mb-4" />
            <h3 className="font-bold">Client Traffic</h3>
            <p className="text-xs text-muted-foreground text-center px-4 mt-2">
              Incoming application requests.
            </p>
          </div>

          {/* Middleware / Gateway */}
          <div className="flex flex-col items-center justify-center relative">
            {migrationStep > 0 && (
              <div className="animate-fade-in flex flex-col items-center p-4 bg-primary/10 border border-primary/30 rounded-lg w-full">
                <Shield size={32} className="text-primary mb-2" />
                <h3 className="font-bold text-primary">PQC API Gateway</h3>
                <p className="text-xs text-center mt-2">
                  Intercepts all traffic. Routes legacy calls to the monolith, and new PQC calls to
                  microservices.
                </p>
              </div>
            )}
            {migrationStep === 0 && (
              <ArrowRight size={32} className="text-muted-foreground/30 animate-pulse" />
            )}
          </div>

          {/* Backend Services */}
          <div className="flex flex-col gap-4 justify-center">
            <div
              className={`p-4 rounded-lg flex items-center gap-4 transition-all ${migrationStep === 2 ? 'bg-muted/50 border border-dashed border-border' : 'bg-destructive/10 border border-destructive/30'}`}
            >
              <Server
                size={32}
                className={migrationStep === 2 ? 'text-muted-foreground' : 'text-destructive'}
              />
              <div>
                <h3
                  className={`font-bold ${migrationStep === 2 ? 'text-muted-foreground' : 'text-destructive'}`}
                >
                  Legacy Monolith
                </h3>
                <p className="text-xs mt-1">Classical RSA/ECC Crypto.</p>
              </div>
            </div>

            {migrationStep === 2 && (
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-4 animate-fade-in">
                <Server size={32} className="text-success" />
                <div>
                  <h3 className="font-bold text-success">PQC Microservice</h3>
                  <p className="text-xs mt-1">ML-DSA / ML-KEM Enabled.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
        {migrationStep === 0 && (
          <Button onClick={() => setMigrationStep(1)} className="w-full sm:w-auto">
            Deploy PQC API Gateway (Step 1)
          </Button>
        )}
        {migrationStep === 1 && (
          <Button onClick={() => setMigrationStep(2)} className="w-full sm:w-auto">
            Carve out PQC Microservice (Step 2)
          </Button>
        )}
        {migrationStep === 2 && (
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-success font-bold text-lg mb-2">
              <CheckCircle2 /> Migration Complete
            </div>
            <p className="text-sm text-muted-foreground">
              The legacy monolith has been successfully "strangled". All new cryptographic traffic
              is handled by the PQC microservice.
            </p>
            <Button variant="outline" onClick={() => setMigrationStep(0)} className="mt-4">
              Reset Architecture
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
