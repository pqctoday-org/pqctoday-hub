import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Key as KeyIcon, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileText, Code, Copy, Check, RefreshCw, Lock, Layers } from 'lucide-react';
import clsx from 'clsx';
import type { Key } from '../../types';
import { bytesToHex } from './DataInput';

interface KeyStoreViewProps {
    keyStore: Key[];
    setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>;
    algorithm: 'ML-KEM' | 'ML-DSA';
    keySize: string;
    loading: boolean;
    onAlgorithmChange: (algorithm: 'ML-KEM' | 'ML-DSA') => void;
    onKeySizeChange: (size: string) => void;
    onGenerateKeys: () => void;
    onUnifiedChange?: (algorithm: 'ML-KEM' | 'ML-DSA', keySize: string) => void;
    // Classical algorithm props
    classicalAlgorithm: string;
    classicalLoading: boolean;
    onClassicalAlgorithmChange: (algorithm: string) => void;
    onGenerateClassicalKeys: () => void;
}

type SortColumn = 'name' | 'type' | 'algorithm' | 'id' | 'timestamp';
type SortDirection = 'asc' | 'desc';

export const KeyStoreView = ({
    keyStore,
    setKeyStore,
    algorithm,
    keySize,
    loading,
    onAlgorithmChange,
    onKeySizeChange,
    onGenerateKeys,
    classicalAlgorithm,
    classicalLoading,
    onClassicalAlgorithmChange,
    onGenerateClassicalKeys,
    onUnifiedChange
}: KeyStoreViewProps) => {
    // Selection State
    const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

    // View Modes
    const [rawValueMode, setRawValueMode] = useState<'hex' | 'ascii'>('hex');
    const [pkcs8ValueMode, setPkcs8ValueMode] = useState<'hex' | 'ascii'>('hex');
    const [copiedRaw, setCopiedRaw] = useState(false);
    const [copiedPkcs8, setCopiedPkcs8] = useState(false);

    // Sorting State
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Column Resizing State
    const [columnWidths, setColumnWidths] = useState({
        name: 250,
        type: 100,
        algorithm: 150,
        id: 300,
        timestamp: 180
    });
    const [resizingColumn, setResizingColumn] = useState<SortColumn | null>(null);
    const resizeStartX = useRef<number>(0);
    const resizeStartWidth = useRef<number>(0);

    // Derived State
    const selectedKey = keyStore.find(k => k.id === selectedKeyId);

    // Handlers
    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const startResize = (e: React.MouseEvent, column: SortColumn) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(column);
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[column];
        document.body.style.cursor = 'col-resize';
    };

    const clearKeys = () => {
        if (confirm('Are you sure you want to clear all keys? This cannot be undone.')) {
            setKeyStore([]);
            setSelectedKeyId(null);
        }
    };

    const copyToClipboard = async (text: string, type: 'raw' | 'pkcs8') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'raw') {
                setCopiedRaw(true);
                setTimeout(() => setCopiedRaw(false), 2000);
            } else {
                setCopiedPkcs8(true);
                setTimeout(() => setCopiedPkcs8(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Resize Effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingColumn) {
                const diff = e.clientX - resizeStartX.current;
                const newWidth = Math.max(50, resizeStartWidth.current + diff);
                setColumnWidths(prev => ({
                    ...prev,
                    [resizingColumn]: newWidth
                }));
            }
        };

        const handleMouseUp = () => {
            if (resizingColumn) {
                setResizingColumn(null);
                document.body.style.cursor = 'default';
            }
        };

        if (resizingColumn) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn]);

    // Sorting Logic
    const sortedKeys = [...keyStore].sort((a, b) => {
        if (sortColumn === 'timestamp') {
            const aTime = a.timestamp || 0;
            const bTime = b.timestamp || 0;
            return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
        }

        const aValue = String(a[sortColumn]).toLowerCase();
        const bValue = String(b[sortColumn]).toLowerCase();

        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Helper to format key value
    const formatValue = (key: Key, mode: 'hex' | 'ascii') => {
        if (!key.data) return key.value; // Fallback for mock keys

        // If data is CryptoKey, use the pre-formatted hex value stored in key.value
        if (key.dataType === 'cryptokey' || !(key.data instanceof Uint8Array)) {
            if (mode === 'hex') return key.value;

            // ASCII Mode for CryptoKey (Hex -> ASCII)
            try {
                const hex = key.value;
                const match = hex.match(/.{1,2}/g);
                if (!match) return 'Invalid Hex';

                return match.map(byteHex => {
                    const byte = parseInt(byteHex, 16);
                    return (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
                }).join('');
            } catch (e) {
                return 'Error converting to ASCII';
            }
        }

        if (mode === 'hex') {
            return bytesToHex(key.data);
        } else {
            // Best effort ASCII - replace non-printable with .
            return Array.from(key.data)
                .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
                .join('');
        }
    };

    // Helper to simulate PKCS8 (wrapping in PEM)
    const formatPkcs8 = (key: Key, mode: 'hex' | 'ascii') => {
        if (!key.data) return 'PKCS#8 not available in Mock mode';

        // If data is CryptoKey, we can't easily convert to PKCS8 synchronously here
        // So we'll return a placeholder or the raw value
        if (key.dataType === 'cryptokey' || !(key.data instanceof Uint8Array)) {
            if (mode === 'hex') return key.value;

            // Convert Hex to Base64 (PEM body)
            try {
                // key.value is Hex string
                const hex = key.value;
                // Convert hex to bytes
                const match = hex.match(/.{1,2}/g);
                if (!match) return 'Invalid Hex';
                const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));

                // Convert bytes to binary string
                let binary = '';
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }

                // Convert to Base64
                const b64 = window.btoa(binary);

                // Wrap in PEM headers
                const label = key.type === 'private' ? 'PRIVATE KEY' : 'PUBLIC KEY';
                const header = `-----BEGIN ${label}-----`;
                const footer = `-----END ${label}-----`;

                // Split into lines of 64 chars
                const lines = b64.match(/.{1,64}/g) || [];
                return `${header}\n${lines.join('\n')}\n${footer}`;
            } catch (e) {
                return 'Error converting to PEM';
            }
        }

        const label = key.type === 'private' ? 'PRIVATE KEY' : 'PUBLIC KEY';
        const header = `-----BEGIN ${label}-----`;
        const footer = `-----END ${label}-----`;

        // In a real app, we would wrap the raw key in ASN.1 structure here.
        // For this demo, we'll just base64 encode the raw bytes for "ASCII" (PEM-like)
        // or show Hex for "HEX".

        if (mode === 'ascii') {
            // Convert to Base64 (PEM body)
            let binary = '';
            const len = key.data.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(key.data[i]);
            }
            const b64 = window.btoa(binary);
            // Split into lines of 64 chars
            const lines = b64.match(/.{1,64}/g) || [];
            return `${header}\n${lines.join('\n')}\n${footer}`;
        } else {
            // Just show hex with header/footer for structure visualization
            return `${header}\n(ASN.1 Structure Omitted)\n${bytesToHex(key.data)}\n${footer}`;
        }
    };

    const renderSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) return <ArrowUpDown size={14} className="opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
    };

    // Local editing state
    const [localRawValue, setLocalRawValue] = useState('');
    const [localPkcs8Value, setLocalPkcs8Value] = useState('');

    // Sync local state when selection or mode changes
    useEffect(() => {
        if (selectedKey) {
            setLocalRawValue(formatValue(selectedKey, rawValueMode));
            setLocalPkcs8Value(formatPkcs8(selectedKey, pkcs8ValueMode));
        }
    }, [selectedKey, rawValueMode, pkcs8ValueMode]);

    const ruler = "0123456789".repeat(13).substring(0, 128);

    return (
        <div className="h-full flex flex-col animate-fade-in gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <KeyIcon size={18} className="text-primary" /> Key Store
                </h4>
                {keyStore.length > 0 && (
                    <button onClick={clearKeys} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={14} /> Clear All Keys
                    </button>
                )}
            </div>

            {/* Key Generation Section */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <Layers size={16} className="text-secondary" />
                    <h5 className="text-sm font-bold text-white uppercase tracking-wider">Generate New Keys</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Algorithm & Key Size Selection */}
                    <div className="space-y-2">
                        <label htmlFor="keystore-key-size" className="text-xs font-medium text-muted block">Algorithm & Security Level</label>
                        <select
                            id="keystore-key-size"
                            value={keySize}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (['512', '768', '1024'].includes(val)) {
                                    if (onUnifiedChange) {
                                        onUnifiedChange('ML-KEM', val);
                                    } else {
                                        if (algorithm !== 'ML-KEM') onAlgorithmChange('ML-KEM');
                                        onKeySizeChange(val);
                                    }
                                } else {
                                    if (onUnifiedChange) {
                                        onUnifiedChange('ML-DSA', val);
                                    } else {
                                        if (algorithm !== 'ML-DSA') onAlgorithmChange('ML-DSA');
                                        onKeySizeChange(val);
                                    }
                                }
                            }}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary appearance-none transition-colors"
                        >
                            <optgroup label="ML-KEM (Key Encapsulation)">
                                <option value="512">ML-KEM-512 (NIST Level 1)</option>
                                <option value="768">ML-KEM-768 (NIST Level 3)</option>
                                <option value="1024">ML-KEM-1024 (NIST Level 5)</option>
                            </optgroup>
                            <optgroup label="ML-DSA (Digital Signatures)">
                                <option value="44">ML-DSA-44 (NIST Level 2)</option>
                                <option value="65">ML-DSA-65 (NIST Level 3)</option>
                                <option value="87">ML-DSA-87 (NIST Level 5)</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* Generate Button */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted block opacity-0 select-none">Action</label>
                        <button
                            onClick={onGenerateKeys}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2 h-[42px] text-sm shadow-lg shadow-primary/20"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <KeyIcon size={16} />}
                            Generate Keys
                        </button>
                    </div>
                </div>
            </div>

            {/* Classical Algorithms Key Generation Section */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-white/10">
                    <Lock size={16} className="text-accent" />
                    <h5 className="text-sm font-bold text-white uppercase tracking-wider">Generate Classical Keys</h5>
                    <span className="text-xs text-muted ml-auto">(Web Crypto API)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Algorithm Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted block">Classical Algorithm</label>
                        <select
                            value={classicalAlgorithm}
                            onChange={(e) => onClassicalAlgorithmChange(e.target.value)}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                        >
                            <optgroup label="Signature Algorithms">
                                <option value="RSA-2048">RSA-2048 (2048 bits)</option>
                                <option value="RSA-3072">RSA-3072 (3072 bits)</option>
                                <option value="RSA-4096">RSA-4096 (4096 bits)</option>
                                <option value="ECDSA-P256">ECDSA P-256 (NIST)</option>
                                <option value="Ed25519">Ed25519 (Curve25519)</option>
                            </optgroup>
                            <optgroup label="Key Exchange">
                                <option value="X25519">X25519 (Curve25519)</option>
                                <option value="P-256">P-256 ECDH (NIST)</option>
                            </optgroup>
                            <optgroup label="Symmetric Encryption">
                                <option value="AES-128">AES-128-GCM</option>
                                <option value="AES-256">AES-256-GCM</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* Generate Button */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted block opacity-0 select-none">Action</label>
                        <button
                            onClick={onGenerateClassicalKeys}
                            disabled={classicalLoading}
                            className="w-full btn-primary flex items-center justify-center gap-2 h-[42px] text-sm shadow-lg shadow-accent/20"
                        >
                            {classicalLoading ? <RefreshCw className="animate-spin" size={16} /> : <Lock size={16} />}
                            Generate Classical Keys
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px] overflow-hidden rounded-xl border border-white/10 bg-black/20 flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
                        <thead className="bg-white/5 text-muted uppercase text-xs sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                {(['name', 'type', 'algorithm', 'id', 'timestamp'] as SortColumn[]).map(col => (
                                    <th
                                        key={col}
                                        className="p-0 relative select-none group"
                                        style={{ width: columnWidths[col] }}
                                    >
                                        <button
                                            onClick={() => handleSort(col)}
                                            className="w-full h-full p-4 flex items-center gap-2 hover:bg-white/5 transition-colors text-left font-bold"
                                        >
                                            {col.charAt(0).toUpperCase() + col.slice(1)}
                                            {renderSortIcon(col)}
                                        </button>
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
                                            onMouseDown={(e) => startResize(e, col)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-white/30 italic">
                                        <div className="flex flex-col items-center gap-3">
                                            <KeyIcon size={32} className="opacity-20" />
                                            No keys generated yet. Go to Settings to generate keys.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedKeys.map(key => (
                                    <tr
                                        key={key.id}
                                        onClick={() => setSelectedKeyId(key.id)}
                                        className={clsx(
                                            "cursor-pointer transition-colors border-l-2",
                                            selectedKeyId === key.id
                                                ? "bg-primary/10 border-primary"
                                                : "hover:bg-white/5 border-transparent"
                                        )}
                                    >
                                        <td className="p-4 font-medium text-white truncate">{key.name}</td>
                                        <td className="p-4">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                                                key.type === 'public' ? "bg-primary/20 text-primary" :
                                                    key.type === 'private' ? "bg-secondary/20 text-secondary" :
                                                        "bg-accent/20 text-accent"
                                            )}>
                                                {key.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted truncate">{key.algorithm}</td>
                                        <td className="p-4 font-mono text-xs text-muted truncate">{key.id}</td>
                                        <td className="p-4 text-xs text-muted truncate font-mono">
                                            {key.timestamp ? new Date(key.timestamp).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail View */}
            {selectedKey && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectedKeyId}
                    className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-6"
                >
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className={clsx(
                            "p-2 rounded-lg",
                            selectedKey.type === 'public' ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                        )}>
                            <KeyIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{selectedKey.name}</h3>
                            <div className="flex gap-4 text-xs text-muted font-mono mt-1">
                                <span>ID: {selectedKey.id}</span>
                                <span>•</span>
                                <span>{selectedKey.algorithm}</span>
                                <span>•</span>
                                <span>{selectedKey.data ? (selectedKey.data instanceof Uint8Array ? `${selectedKey.data.length} bytes` : 'CryptoKey Object') : 'Mock Data'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Raw Value */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} /> Raw Value
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                                        <button
                                            onClick={() => setRawValueMode('hex')}
                                            className={clsx(
                                                "px-2 py-1 text-[10px] font-bold rounded-md transition-colors",
                                                rawValueMode === 'hex' ? "bg-white/10 text-white" : "text-muted hover:text-white"
                                            )}
                                        >
                                            HEX
                                        </button>
                                        <button
                                            onClick={() => setRawValueMode('ascii')}
                                            className={clsx(
                                                "px-2 py-1 text-[10px] font-bold rounded-md transition-colors",
                                                rawValueMode === 'ascii' ? "bg-white/10 text-white" : "text-muted hover:text-white"
                                            )}
                                        >
                                            ASCII
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(localRawValue, 'raw')}
                                        className="p-1.5 text-muted hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copiedRaw ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="relative group flex flex-col">
                                <div className="w-full">
                                    <textarea
                                        readOnly
                                        rows={1}
                                        value={ruler}
                                        className="w-full bg-black/30 border-x border-t border-white/10 rounded-t-lg p-3 text-[11px] text-muted/50 resize-none focus:outline-none overflow-hidden whitespace-pre select-none block"
                                        style={{ fontFamily: '"Courier New", Courier, monospace', lineHeight: '1.5' }}
                                    />
                                </div>
                                <div className="w-full">
                                    <textarea
                                        rows={8}
                                        value={localRawValue}
                                        onChange={(e) => setLocalRawValue(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-b-lg p-3 text-[11px] text-muted resize-none focus:outline-none focus:border-primary/50 break-all -mt-[1px] block"
                                        style={{ fontFamily: '"Courier New", Courier, monospace', lineHeight: '1.5' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PKCS8 Preview */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Code size={14} /> PKCS#8 Preview
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                                        <button
                                            onClick={() => setPkcs8ValueMode('hex')}
                                            className={clsx(
                                                "px-2 py-1 text-[10px] font-bold rounded-md transition-colors",
                                                pkcs8ValueMode === 'hex' ? "bg-white/10 text-white" : "text-muted hover:text-white"
                                            )}
                                        >
                                            HEX
                                        </button>
                                        <button
                                            onClick={() => setPkcs8ValueMode('ascii')}
                                            className={clsx(
                                                "px-2 py-1 text-[10px] font-bold rounded-md transition-colors",
                                                pkcs8ValueMode === 'ascii' ? "bg-white/10 text-white" : "text-muted hover:text-white"
                                            )}
                                        >
                                            PEM
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(localPkcs8Value, 'pkcs8')}
                                        className="p-1.5 text-muted hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copiedPkcs8 ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="relative group flex flex-col">
                                <div className="w-full">
                                    <textarea
                                        readOnly
                                        rows={1}
                                        value={ruler}
                                        className="w-full bg-black/30 border-x border-t border-white/10 rounded-t-lg p-3 text-[11px] text-muted/50 resize-none focus:outline-none overflow-hidden whitespace-pre select-none block"
                                        style={{ fontFamily: '"Courier New", Courier, monospace', lineHeight: '1.5' }}
                                    />
                                </div>
                                <div className="w-full">
                                    <textarea
                                        rows={8}
                                        value={localPkcs8Value}
                                        onChange={(e) => setLocalPkcs8Value(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-b-lg p-3 text-[11px] text-muted resize-none focus:outline-none focus:border-primary/50 break-all -mt-[1px] block"
                                        style={{ fontFamily: '"Courier New", Courier, monospace', lineHeight: '1.5' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
