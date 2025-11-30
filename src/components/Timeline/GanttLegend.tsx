import { Flag } from 'lucide-react';
import { phaseColors, type Phase } from '../../data/timelineData';

interface GanttLegendProps {
    className?: string;
}

export const GanttLegend = ({ className = '' }: GanttLegendProps) => {
    const phases: Phase[] = ['Discovery', 'Testing', 'POC', 'Migration', 'Deadline', 'Standardization'];

    return (
        <div className={`glass-panel p-4 ${className}`}>
            <h3 className="text-sm font-bold text-white mb-4 border-b border-white/10 pb-2">Phase Color Code</h3>

            <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full border-collapse">
                    <tbody>
                        <tr>
                            {phases.map(phase => {
                                const colors = phaseColors[phase];
                                return (
                                    <td
                                        key={phase}
                                        className="p-3 text-center border-r border-white/10 last:border-r-0 transition-all hover:opacity-90"
                                        style={{
                                            background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
                                            boxShadow: `inset 0 0 10px ${colors.glow}`,
                                        }}
                                    >
                                        <span className="text-xs font-bold text-white drop-shadow-md">
                                            {phase}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <Flag className="w-4 h-4 text-blue-500 fill-blue-500" />
                        <Flag className="w-4 h-4 text-purple-500 fill-purple-500" />
                    </div>
                    <span className="text-xs text-muted">
                        <strong>Milestones:</strong> Flag markers indicate key events, colored according to their phase.
                    </span>
                </div>
            </div>
        </div>
    );
};
