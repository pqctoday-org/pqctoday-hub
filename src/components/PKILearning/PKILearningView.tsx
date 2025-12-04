import React, { useState } from 'react';
import { Dashboard } from './Dashboard';
import { ArrowLeft } from 'lucide-react';

import { PKIWorkshop } from './modules/PKIWorkshop';

export const PKILearningView: React.FC = () => {
    const [activeModule, setActiveModule] = useState<string | null>(null);

    return (
        <div className="container mx-auto p-4 animate-fade-in">
            {activeModule ? (
                <div>
                    <button
                        onClick={() => setActiveModule(null)}
                        className="flex items-center gap-2 text-muted hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>

                    {/* Render active module here */}
                    {activeModule === 'pki-workshop' && <PKIWorkshop />}
                </div>
            ) : (
                <Dashboard onSelectModule={setActiveModule} />
            )}
        </div>
    );
};
