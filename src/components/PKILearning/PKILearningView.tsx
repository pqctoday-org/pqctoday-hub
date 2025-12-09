import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { ArrowLeft } from 'lucide-react'

import { PKIWorkshop } from './modules/PKIWorkshop'
import { DigitalAssetsModule } from './modules/DigitalAssets'
import { FiveGModule } from './modules/FiveG'
import { DigitalIDModule } from './modules/DigitalID'

export const PKILearningView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/learn' || location.pathname === '/learn/'

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      {!isDashboard && (
        <button
          onClick={() => navigate('/learn')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      )}

      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="pki-workshop" element={<PKIWorkshop />} />
        <Route path="digital-assets" element={<DigitalAssetsModule />} />
        <Route path="5g-security" element={<FiveGModule />} />
        <Route path="digital-id" element={<DigitalIDModule />} />
      </Routes>
    </div>
  )
}
