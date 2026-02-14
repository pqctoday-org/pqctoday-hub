import React from 'react'
import type { WalletInstance } from '../../types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import { Button } from '../../../../../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../ui/tabs'
import { Shield, Key, FileText, Plus, Smartphone } from 'lucide-react'

interface WalletComponentProps {
  wallet: WalletInstance
  onAddCredential: () => void
}

export const WalletComponent: React.FC<WalletComponentProps> = ({ wallet, onAddCredential }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-status-info" />
            EUDI Wallet
          </h2>
          <p className="text-muted-foreground">Managed by: {wallet.owner.legalName}</p>
        </div>
        <Button onClick={onAddCredential} className="gap-2">
          <Plus className="w-4 h-4" /> Add Credential
        </Button>
      </div>

      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">PQC Readiness</p>
        <p>
          Current EUDI credentials use classical algorithms (P-256, P-384). Future ARF versions are
          expected to mandate PQC-safe algorithms (ML-DSA, SLH-DSA) for long-lived credentials to
          protect against quantum threats.
        </p>
      </div>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credentials" className="gap-2">
            <FileText className="w-4 h-4" /> Credentials
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="w-4 h-4" /> Hardware Keys
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Shield className="w-4 h-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="mt-4 space-y-4">
          {wallet.credentials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mb-2 opacity-50" />
                <p>No credentials installed yet.</p>
                <Button variant="link" onClick={onAddCredential}>
                  Get your first ID
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallet.credentials.map((cred) => (
                <Card
                  key={cred.id}
                  className="relative overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-muted/50"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <FileText className="w-24 h-24" />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {cred.type.includes('PersonIdentificationData') || cred.format === 'mso_mdoc'
                        ? '🇪🇺'
                        : '🎓'}
                      {cred.type.includes('PersonIdentificationData')
                        ? 'Person Identification Data'
                        : 'University Diploma'}
                    </CardTitle>
                    <CardDescription>{cred.issuer}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-semibold">Format:</span> {cred.format}
                      </p>
                      <p>
                        <span className="font-semibold">Issued:</span>{' '}
                        {new Date(cred.issuanceDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span> Valid
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>HSM Secure Storage</CardTitle>
              <CardDescription>
                Cryptographic keys stored in the simulated Remote HSM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.keys.length === 0 ? (
                <p className="text-muted-foreground">No keys generated yet.</p>
              ) : (
                <div className="space-y-4">
                  {wallet.keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Key className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{key.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {key.algorithm} / {key.curve}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Created: {new Date(key.created).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {wallet.history.length === 0 ? (
                <p className="text-muted-foreground">No activity recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {wallet.history.map((log) => (
                    <li key={log.id} className="text-sm p-2 border-l-2 pl-4 border-primary">
                      <span className="font-semibold">{log.type}</span>: {log.details}
                      <span className="block text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
