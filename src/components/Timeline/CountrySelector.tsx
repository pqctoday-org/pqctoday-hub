import clsx from 'clsx';
import type { CountryData } from '../../data/timelineData';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface CountrySelectorProps {
    countries: CountryData[];
    selectedCountry: CountryData | null;
    onSelect: (country: CountryData | null) => void;
    showAllCountries: boolean;
}

export const CountrySelector = ({ countries, selectedCountry, onSelect, showAllCountries }: CountrySelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            buttonRef.current?.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent, country: CountryData | null) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(country);
            setIsOpen(false);
            buttonRef.current?.focus();
        }
    };

    const displayText = showAllCountries ? 'All Countries' : selectedCountry?.countryName || 'Select Region';
    const displayFlag = showAllCountries ? '🌍' : selectedCountry?.flagCode || '';

    return (
        <div className="relative mb-8 z-10" ref={dropdownRef}>
            <div className="glass-panel p-2 inline-flex items-center gap-2">
                <span className="text-muted px-2" id="country-selector-label">Select Region:</span>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={() => setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        aria-labelledby="country-selector-label"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors min-w-[200px] justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <span className="flex items-center gap-2">
                            <span className="font-bold">{displayFlag}</span>
                            {displayText}
                        </span>
                        <ChevronDown size={16} aria-hidden="true" className={clsx("transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div
                            role="listbox"
                            aria-labelledby="country-selector-label"
                            className="absolute top-full left-0 mt-2 w-full glass-panel overflow-hidden transform origin-top"
                        >
                            {/* All Countries option */}
                            <button
                                role="option"
                                aria-selected={showAllCountries}
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                onKeyDown={(e) => handleOptionKeyDown(e, null)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-2 focus:outline-none focus-visible:bg-white/10 border-b border-white/10",
                                    showAllCountries ? "text-primary bg-white/5" : "text-muted"
                                )}
                            >
                                <span className="font-mono text-xs opacity-50">🌍</span>
                                All Countries
                            </button>

                            {countries.map((country) => (
                                <button
                                    key={country.countryName}
                                    role="option"
                                    aria-selected={!showAllCountries && selectedCountry?.countryName === country.countryName}
                                    onClick={() => {
                                        onSelect(country);
                                        setIsOpen(false);
                                    }}
                                    onKeyDown={(e) => handleOptionKeyDown(e, country)}
                                    className={clsx(
                                        "w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-2 focus:outline-none focus-visible:bg-white/10",
                                        !showAllCountries && selectedCountry?.countryName === country.countryName ? "text-primary bg-white/5" : "text-muted"
                                    )}
                                >
                                    <span className="font-mono text-xs opacity-50">{country.flagCode}</span>
                                    {country.countryName}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
