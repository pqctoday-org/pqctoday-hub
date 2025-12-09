import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import { Landmark } from 'lucide-react'
import { RelyingPartyFlow } from '../../flows/RelyingPartyFlow'
import type { WalletInstance } from '../../types'

interface RelyingPartyComponentProps {
  wallet: WalletInstance
  onBack: () => void
}

export const RelyingPartyComponent: React.FC<RelyingPartyComponentProps> = ({ onBack }) => {
  return (
    <Card className="max-w-4xl mx-auto border-emerald-200 shadow-xl">
      <CardHeader className="bg-emerald-50/50">
        <CardTitle className="text-emerald-800 flex items-center gap-2">
          <Landmark className="w-6 h-6" />
          EuroBank (Relying Party)
        </CardTitle>
        <CardDescription>Open a new bank account using your Digital ID</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <RelyingPartyFlow onBack={onBack} />
      </CardContent>
    </Card>
  )
}
