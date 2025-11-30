import { useEffect, useRef } from 'react';
// @ts-ignore - frappe-gantt doesn't have TypeScript definitions
import Gantt from 'frappe-gantt';
import type { GanttCountryData } from '../../data/timelineData';
import { phaseColors } from '../../data/timelineData';

interface FrappeGanttProps {
    data: GanttCountryData[];
}

export const FrappeGanttChart = ({ data }: FrappeGanttProps) => {
    const ganttRef = useRef<HTMLDivElement>(null);
    const ganttInstance = useRef<any>(null);

    useEffect(() => {
        console.log('FrappeGanttChart data:', data);
        console.log('ganttRef.current:', ganttRef.current);

        if (!ganttRef.current) {
            console.error('ganttRef.current is null');
            return;
        }

        if (data.length === 0) {
            console.error('data is empty');
            return;
        }

        // Transform our data into Frappe Gantt format
        const tasks = data.flatMap((countryData) => {
            const countryName = countryData.country.countryName;
            const orgName = countryData.country.bodies[0].name;

            // Convert phases to tasks
            const phaseTasks = countryData.phases.map((phase, index) => ({
                id: `${countryName}-phase-${index}`,
                name: `${phase.phase}`,
                start: `${phase.startYear}-01-01`,
                end: `${phase.endYear}-12-31`,
                progress: 100,
                custom_class: `phase-${phase.phase.toLowerCase()}`,
                dependencies: '',
                label: `${countryName} (${orgName})`,
            }));

            // Convert milestones to tasks (1-day duration for visibility)
            const milestoneTasks = countryData.milestones.map((milestone, index) => ({
                id: `${countryName}-milestone-${index}`,
                name: `📍 ${milestone.title}`,
                start: `${milestone.year}-06-01`,
                end: `${milestone.year}-06-02`,
                progress: 100,
                custom_class: `milestone-${milestone.phase.toLowerCase()}`,
                dependencies: '',
                label: `${countryName} (${orgName})`,
            }));

            return [...phaseTasks, ...milestoneTasks];
        });

        console.log('Generated tasks:', tasks);
        console.log('Number of tasks:', tasks.length);

        // Create or update Gantt instance
        try {
            if (ganttInstance.current) {
                console.log('Refreshing existing Gantt instance');
                ganttInstance.current.refresh(tasks);
            } else {
                console.log('Creating new Gantt instance');
                ganttInstance.current = new Gantt(ganttRef.current, tasks, {
                    view_mode: 'Year',
                    bar_height: 30,
                    bar_corner_radius: 6,
                    arrow_curve: 5,
                    padding: 20,
                    view_modes: ['Year'],
                    date_format: 'YYYY-MM-DD',
                    language: 'en',
                    custom_popup_html: (task: any) => {
                        const startYear = task._start.getFullYear();
                        const endYear = task._end.getFullYear();
                        const yearRange = startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;

                        return `
                            <div class="gantt-tooltip">
                                <div class="font-bold text-white mb-1">${task.name}</div>
                                <div class="text-xs text-muted">${task.label}</div>
                                <div class="text-xs text-primary mt-1">${yearRange}</div>
                            </div>
                        `;
                    },
                });
                console.log('Gantt instance created successfully');
            }
        } catch (error) {
            console.error('Error creating/updating Gantt:', error);
        }

        // Cleanup
        return () => {
            if (ganttInstance.current) {
                ganttInstance.current = null;
            }
        };
    }, [data]);

    return (
        <div className="gantt-container">
            {/* Load Frappe Gantt CSS */}
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.min.css"
            />

            <style>{`
                .gantt-container {
                    background: transparent;
                    overflow-x: auto;
                    overflow-y: visible;
                }
                
                .gantt {
                    font-family: inherit;
                }
                
                .gantt .grid-background {
                    fill: transparent;
                }
                
                .gantt .grid-row {
                    fill: transparent;
                }
                
                .gantt .grid-row:nth-child(even) {
                    fill: rgba(255, 255, 255, 0.02);
                }
                
                .gantt .row-line {
                    stroke: rgba(255, 255, 255, 0.2);
                    stroke-width: 1;
                }
                
                .gantt .tick {
                    stroke: rgba(255, 255, 255, 0.1);
                    stroke-width: 0.5;
                }
                
                .gantt .tick.thick {
                    stroke: rgba(255, 255, 255, 0.2);
                    stroke-width: 1;
                }
                
                .gantt .today-highlight {
                    fill: rgba(59, 130, 246, 0.1);
                    stroke: rgba(59, 130, 246, 0.3);
                    stroke-width: 1;
                }
                
                /* Phase gradient bars */
                .gantt .bar.phase-discovery {
                    fill: url(#gradient-discovery);
                    filter: drop-shadow(0 0 8px ${phaseColors.Discovery.glow});
                }
                
                .gantt .bar.phase-testing {
                    fill: url(#gradient-testing);
                    filter: drop-shadow(0 0 8px ${phaseColors.Testing.glow});
                }
                
                .gantt .bar.phase-poc {
                    fill: url(#gradient-poc);
                    filter: drop-shadow(0 0 8px ${phaseColors.POC.glow});
                }
                
                .gantt .bar.phase-migration {
                    fill: url(#gradient-migration);
                    filter: drop-shadow(0 0 8px ${phaseColors.Migration.glow});
                }
                
                /* Milestone markers */
                .gantt .bar.milestone-deadline {
                    fill: ${phaseColors.Deadline.start};
                    filter: drop-shadow(0 0 10px ${phaseColors.Deadline.glow});
                    rx: 4;
                }
                
                .gantt .bar.milestone-standardization {
                    fill: ${phaseColors.Standardization.start};
                    filter: drop-shadow(0 0 10px ${phaseColors.Standardization.glow});
                    rx: 4;
                }
                
                .gantt .bar-progress {
                    fill: rgba(255, 255, 255, 0.15);
                }
                
                .gantt .bar-label {
                    fill: white;
                    font-size: 11px;
                    font-weight: 700;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }
                
                .gantt .lower-text {
                    fill: rgba(255, 255, 255, 0.8);
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .gantt .upper-text {
                    fill: rgba(255, 255, 255, 0.5);
                    font-size: 10px;
                }
                
                .gantt-tooltip {
                    background: rgba(11, 13, 23, 0.95);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    max-width: 300px;
                }
                
                /* Hover effects */
                .gantt .bar:hover {
                    opacity: 0.9;
                    cursor: pointer;
                }
            `}</style>

            {/* SVG Gradients */}
            <svg width="0" height="0">
                <defs>
                    <linearGradient id="gradient-discovery" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={phaseColors.Discovery.start} />
                        <stop offset="100%" stopColor={phaseColors.Discovery.end} />
                    </linearGradient>
                    <linearGradient id="gradient-testing" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={phaseColors.Testing.start} />
                        <stop offset="100%" stopColor={phaseColors.Testing.end} />
                    </linearGradient>
                    <linearGradient id="gradient-poc" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={phaseColors.POC.start} />
                        <stop offset="100%" stopColor={phaseColors.POC.end} />
                    </linearGradient>
                    <linearGradient id="gradient-migration" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={phaseColors.Migration.start} />
                        <stop offset="100%" stopColor={phaseColors.Migration.end} />
                    </linearGradient>
                </defs>
            </svg>

            <div ref={ganttRef} className="frappe-gantt"></div>
        </div>
    );
};
