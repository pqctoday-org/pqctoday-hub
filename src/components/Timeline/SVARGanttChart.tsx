import { Gantt } from '@svar-ui/react-gantt';
import type { GanttCountryData } from '../../data/timelineData';
import { phaseColors } from '../../data/timelineData';

interface SVARGanttChartProps {
    data: GanttCountryData[];
}

export const SVARGanttChart = ({ data }: SVARGanttChartProps) => {
    // Transform data to SVAR format
    const tasks = data.flatMap((countryData, countryIdx) => {
        const country = countryData.country;
        const countryId = `country-${countryIdx}`;

        // Parent task for country
        const countryTask = {
            id: countryId,
            text: `${country.countryName} (${country.bodies[0].name})`,
            start: new Date(2024, 0, 1),
            end: new Date(2035, 11, 31),
            type: 'project',
            open: true,
        };

        // Phase tasks
        const phaseTasks = countryData.phases.map((phase, phaseIdx) => {
            const colors = phaseColors[phase.phase];

            return {
                id: `${countryId}-phase-${phaseIdx}`,
                text: phase.phase,
                start: new Date(phase.startYear, 0, 1),
                end: new Date(phase.endYear, 11, 31),
                parent: countryId,
                type: 'task',
                progress: 100,
                styles: {
                    bar: colors.start,
                },
            };
        });

        // Milestone tasks
        const milestoneTasks = countryData.milestones.map((milestone, milestoneIdx) => {
            const colors = phaseColors[milestone.phase];
            return {
                id: `${countryId}-milestone-${milestoneIdx}`,
                text: `📍 ${milestone.title}`,
                start: new Date(milestone.year, 5, 1),
                end: new Date(milestone.year, 5, 1),
                parent: countryId,
                type: 'milestone',
                styles: {
                    bar: colors.start,
                },
            };
        });

        return [countryTask, ...phaseTasks, ...milestoneTasks];
    });

    const links: any[] = [];

    const scales = [
        { unit: 'year', step: 1, format: 'yyyy' },
    ];

    return (
        <div className="svar-gantt-wrapper" style={{ height: '600px' }}>
            <style>{`
                .svar-gantt-wrapper {
                    background: transparent;
                }
                
                /* Dark theme overrides */
                .wx-gantt {
                    background: transparent !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                }
                
                .wx-gantt-header {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                }
                
                .wx-gantt-grid-cell {
                    border-color: rgba(255, 255, 255, 0.05) !important;
                    color: rgba(255, 255, 255, 0.8) !important;
                }
                
                .wx-gantt-row {
                    border-color: rgba(255, 255, 255, 0.05) !important;
                }
                
                .wx-gantt-row:hover {
                    background: rgba(255, 255, 255, 0.03) !important;
                }
                
                .wx-gantt-task-bar {
                    border-radius: 6px !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
                }
                
                .wx-gantt-grid {
                    background: transparent !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                }
                
                .wx-task-bar {
                    border-radius: 6px !important;
                }
            `}</style>

            <Gantt
                tasks={tasks}
                links={links}
                scales={scales}
                cellWidth={80}
                cellHeight={48}
            />
        </div>
    );
};
