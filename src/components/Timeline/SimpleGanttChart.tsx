import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Flag } from 'lucide-react';
import type { GanttCountryData, TimelinePhase } from '../../types/timeline';
import { phaseColors } from '../../data/timelineData';
import { GanttDetailPopover } from './GanttDetailPopover';

interface SimpleGanttChartProps {
    data: GanttCountryData[];
}

const START_YEAR = 2024;
const END_YEAR = 2035;
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);


const PHASE_ORDER = ['Discovery', 'Testing', 'PoC', 'Migration', 'Standardization'];

export const SimpleGanttChart = ({ data }: SimpleGanttChartProps) => {
    const [filterText, setFilterText] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

    const processedData = useMemo(() => {
        const filtered = data.filter(d =>
            d.country.countryName.toLowerCase().includes(filterText.toLowerCase()) ||
            d.country.bodies.some(b => b.name.toLowerCase().includes(filterText.toLowerCase()))
        );

        const sortedCountries = filtered.sort((a, b) => {
            const nameA = a.country.countryName.toLowerCase();
            const nameB = b.country.countryName.toLowerCase();
            return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });

        return sortedCountries.map(country => ({
            ...country,
            phases: country.phases
                .filter(p => p.phase !== 'Deadline')
                .sort((a, b) => {
                    const indexA = PHASE_ORDER.indexOf(a.phase);
                    const indexB = PHASE_ORDER.indexOf(b.phase);
                    // Put unknown phases at the end
                    const valA = indexA === -1 ? 999 : indexA;
                    const valB = indexB === -1 ? 999 : indexB;
                    return valA - valB;
                })
        }));
    }, [data, filterText, sortDirection]);

    const toggleSort = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handlePhaseClick = (phase: TimelinePhase, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPopoverPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top
        });
        setSelectedPhase(phase);
    };

    const handleClosePopover = () => {
        setSelectedPhase(null);
        setPopoverPosition(null);
    };

    const renderPhaseCells = (phaseData: TimelinePhase) => {
        const cells = [];

        // Calculate start and end indices relative to our year range
        const startYear = Math.max(START_YEAR, phaseData.startYear);
        const endYear = Math.min(END_YEAR, phaseData.endYear);

        // If phase is completely out of range, render empty cells
        if (phaseData.endYear < START_YEAR || phaseData.startYear > END_YEAR) {
            for (let year = START_YEAR; year <= END_YEAR; year++) {
                cells.push(
                    <td key={year} className="p-0 h-10" style={{ borderRight: '1px solid #4b5563' }}></td>
                );
            }
            return cells;
        }

        const colors = phaseColors[phaseData.phase] || { start: '#64748b', end: '#94a3b8', glow: 'rgba(100, 116, 139, 0.5)' };
        const isMilestone = phaseData.type === 'Milestone';


        for (let year = START_YEAR; year <= END_YEAR; year++) {
            const isInPhase = year >= startYear && year <= endYear;
            const isFirstInPhase = year === startYear;
            const isLastInPhase = year === endYear;

            if (isInPhase) {
                cells.push(
                    <td
                        key={year}
                        className="p-0 h-10"
                        style={{
                            borderRight: isLastInPhase ? '1px solid #4b5563' : 'none',
                            backgroundColor: isMilestone ? 'transparent' : colors.start,
                            boxShadow: isMilestone ? 'none' : `0 0 8px ${colors.glow}`,
                            opacity: isMilestone ? 1 : 0.9
                        }}
                    >
                        <button
                            className="w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent"
                            onClick={(e) => handlePhaseClick(phaseData, e)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handlePhaseClick(phaseData, e as any);
                                }
                            }}
                            aria-label={`${phaseData.phase}: ${phaseData.title}`}
                        >
                            {isMilestone && isFirstInPhase ? (
                                <Flag
                                    className="w-4 h-4"
                                    style={{ color: colors.start, fill: colors.start }}
                                />
                            ) : isFirstInPhase && !isMilestone ? (
                                <span className="absolute left-2 text-[10px] font-bold text-white whitespace-nowrap drop-shadow-md select-none z-10 pointer-events-none">
                                    {phaseData.phase}
                                </span>
                            ) : null}
                        </button>
                    </td>
                );
            } else {
                cells.push(
                    <td key={year} className="p-0 h-10" style={{ borderRight: '1px solid #4b5563' }}></td>
                );
            }
        }

        return cells;
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 glass-panel rounded-xl">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Filter by country..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <button
                    onClick={toggleSort}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-medium"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    Sort
                    {sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b0d17]/50 backdrop-blur-sm">
                <table className="w-full min-w-[1000px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-30 bg-[#0b0d17] p-4 text-left w-[180px]" style={{ borderBottom: '1px solid #4b5563', borderRight: '1px solid #4b5563' }}>
                                <span className="font-bold text-white">Country</span>
                            </th>
                            <th className="sticky left-[180px] z-30 bg-[#0b0d17] p-4 text-left w-[200px]" style={{ borderBottom: '1px solid #4b5563', borderRight: '1px solid #4b5563' }}>
                                <span className="font-bold text-white">Organization</span>
                            </th>
                            {YEARS.map(year => (
                                <th key={year} className="p-2 text-center min-w-[80px] bg-[#0b0d17]/80" style={{ borderBottom: '1px solid #4b5563', borderRight: '1px solid #4b5563' }}>
                                    <span className={`font-mono text-sm ${year === new Date().getFullYear() ? 'text-primary font-bold' : 'text-muted'}`}>
                                        {year}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.map((countryData) => {
                            const { country, phases } = countryData;
                            const totalRows = phases.length;

                            return (
                                <>
                                    {phases.map((phaseData, index) => {
                                        const isLastRow = index === totalRows - 1;
                                        return (
                                            <tr
                                                key={`${country.countryName}-${phaseData.phase}-${index}`}
                                                className="hover:bg-white/5 transition-colors"
                                                style={isLastRow ? { borderBottom: '1px solid #4b5563' } : undefined}
                                            >
                                                {/* Country Cell - Only on first row */}
                                                {index === 0 && (
                                                    <td rowSpan={totalRows} className="sticky left-0 z-20 bg-[#1a1d2d] p-3 align-top" style={{ borderRight: '1px solid #4b5563' }}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl" role="img" aria-label={`Flag of ${country.countryName}`}>
                                                                {country.flagCode === 'US' && '🇺🇸'}
                                                                {country.flagCode === 'GB' && '🇬🇧'}
                                                                {country.flagCode === 'DE' && '🇩🇪'}
                                                                {country.flagCode === 'FR' && '🇫🇷'}
                                                                {country.flagCode === 'CN' && '🇨🇳'}
                                                                {country.flagCode === 'EU' && '🇪🇺'}
                                                                {country.flagCode === 'AU' && '🇦🇺'}
                                                                {country.flagCode === 'CA' && '🇨🇦'}
                                                                {country.flagCode === 'NL' && '🇳🇱'}
                                                                {country.flagCode === 'KR' && '🇰🇷'}
                                                                {country.flagCode === 'CZ' && '🇨🇿'}
                                                                {country.flagCode === 'JP' && '🇯🇵'}
                                                            </span>
                                                            <span className="font-bold text-white text-sm">{country.countryName}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Organization Cell - Only on first row */}
                                                {index === 0 && (
                                                    <td rowSpan={totalRows} className="sticky left-[180px] z-20 bg-[#1a1d2d] p-3 align-top" style={{ borderRight: '1px solid #4b5563' }}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted">{country.bodies[0].name}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Phase/Milestone Cells */}
                                                {renderPhaseCells(phaseData)}
                                            </tr>
                                        );
                                    })}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <GanttDetailPopover
                isOpen={!!selectedPhase}
                onClose={handleClosePopover}
                phase={selectedPhase}
                position={popoverPosition}
            />
        </div>
    );
};
