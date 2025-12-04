import React from 'react';
import { BookOpen, CheckCircle, Circle, Clock, Globe } from 'lucide-react';
import { useModuleStore } from '../../store/useModuleStore';
// import { SaveRestorePanel } from './SaveRestorePanel';

interface DashboardProps {
    onSelectModule: (moduleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
    const { modules } = useModuleStore();

    interface ModuleItem {
        id: string;
        title: string;
        description: string;
        duration: string;
        disabled?: boolean;
    }

    const moduleList: ModuleItem[] = [
        {
            id: 'pki-workshop',
            title: 'PKI Workshop',
            description: 'Complete hands-on workshop: CSRs, Root CAs, Signing, and Parsing.',
            duration: '45 min'
        }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
                {/* PKI Series */}
                <div className="glass-panel p-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <BookOpen className="text-primary" />
                        PKI Series
                    </h2>
                    <div className="space-y-4">
                        {moduleList.map((module) => {
                            const status = modules[module.id]?.status || 'not-started';
                            return (
                                <div
                                    key={module.id}
                                    className={`p-4 rounded-lg border border-white/10 bg-white/5 transition-all
                    ${module.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}
                  `}
                                    onClick={() => !module.disabled && onSelectModule(module.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-semibold text-white mb-1">{module.title}</h3>
                                            <p className="text-muted mb-3">{module.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} /> {module.duration}
                                                </span>
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                          ${status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                        status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-gray-500/20 text-gray-400'}
                        `}>
                                                    {status === 'completed' ? 'Completed' :
                                                        status === 'in-progress' ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {status === 'completed' ? <CheckCircle className="text-green-400" /> : <Circle className="text-muted" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Future Series */}
                <div className="glass-panel p-6 opacity-75">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Globe className="text-blue-400" />
                        Upcoming Tracks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['5G Security', 'Digital Assets', 'Digital ID', 'TLS', 'VPN'].map((topic) => (
                            <div key={topic} className="p-4 rounded-lg border border-white/10 bg-white/5 flex items-center justify-between">
                                <span className="text-white font-medium">{topic}</span>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Coming Soon</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1">
                {/* SaveRestorePanel is temporarily commented out in previous steps, re-enabling it now to test if it still crashes. 
                    If it crashes, we will fix it in the next step.
                */}
                {/* <SaveRestorePanel /> */}
                <div className="text-white">Save/Restore Placeholder</div>
            </div>
        </div>
    );
};
