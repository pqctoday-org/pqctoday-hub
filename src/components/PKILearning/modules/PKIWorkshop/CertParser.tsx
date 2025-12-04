import React, { useState } from 'react';
import { FileText, Search, Loader2, AlertTriangle, Download, ArrowRightLeft, Check } from 'lucide-react';
import { openSSLService } from '../../../../services/crypto/OpenSSLService';
import { useModuleStore } from '../../../../store/useModuleStore';
import { useOpenSSLStore } from '../../../OpenSSLStudio/store';

interface CertParserProps {
    onComplete: () => void;
}

export const CertParser: React.FC<CertParserProps> = ({ onComplete }) => {
    const csrs = useModuleStore(state => state.artifacts.csrs);
    const allCertificates = useModuleStore(state => state.artifacts.certificates);

    const rootCAs = allCertificates.filter(c => c.tags?.includes('root-ca'));
    const certificates = allCertificates.filter(c => !c.tags?.includes('root-ca'));

    const [certInput, setCertInput] = useState('');
    const [selectedArtifactId, setSelectedArtifactId] = useState('');
    const [selectedArtifactName, setSelectedArtifactName] = useState('');
    const [parsedOutput, setParsedOutput] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversionResult, setConversionResult] = useState<{ name: string, url: string, format: string } | null>(null);

    const handleArtifactSelect = (id: string) => {
        setSelectedArtifactId(id);
        setParsedOutput(null);
        setConversionResult(null);
        setError(null);

        if (!id) {
            setCertInput('');
            setSelectedArtifactName('');
            return;
        }

        // Search in all collections
        const csr = csrs.find(c => c.id === id);
        if (csr) {
            setCertInput(csr.pem);
            setSelectedArtifactName(csr.name);
            return;
        }

        const rootCA = rootCAs.find(c => c.id === id);
        if (rootCA) {
            setCertInput(rootCA.pem);
            setSelectedArtifactName(rootCA.name);
            return;
        }

        const cert = certificates.find(c => c.id === id);
        if (cert) {
            setCertInput(cert.pem);
            setSelectedArtifactName(cert.name);
            return;
        }
    };

    const handleParse = async () => {
        if (!certInput.trim()) return;

        setIsParsing(true);
        setError(null);
        setParsedOutput(null);

        try {
            const isCsr = certInput.includes('BEGIN CERTIFICATE REQUEST');
            // Use selected name or default
            const fileName = selectedArtifactName || (isCsr ? 'manual_input.csr' : 'manual_input.pem');

            const file = {
                name: fileName,
                data: new TextEncoder().encode(certInput)
            };

            const command = isCsr
                ? `openssl req -in ${fileName} -text -noout`
                : `openssl x509 -in ${fileName} -text -noout`;

            const result = await openSSLService.execute(command, [file]);

            if (result.error) {
                setError(result.error);
            } else {
                setParsedOutput(result.stdout);
                onComplete();
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsParsing(false);
        }
    };

    const handleConvert = async (format: 'DER' | 'P7B') => {
        if (!certInput.trim()) return;

        setIsConverting(true);
        setError(null);
        setConversionResult(null);

        try {
            const isCsr = certInput.includes('BEGIN CERTIFICATE REQUEST');
            const inputName = selectedArtifactName || (isCsr ? 'manual_input.csr' : 'manual_input.pem');
            const inputFile = {
                name: inputName,
                data: new TextEncoder().encode(certInput)
            };

            let command = '';
            let outputName = '';

            if (format === 'DER') {
                // Preserve base name if possible
                const baseName = inputName.replace(/\.(pem|crt|csr|key)$/, '');
                outputName = `${baseName}.der`;

                command = isCsr
                    ? `openssl req -in "${inputName}" -outform DER -out "${outputName}"`
                    : `openssl x509 -in "${inputName}" -outform DER -out "${outputName}"`;
            } else if (format === 'P7B') {
                if (isCsr) throw new Error('CSRs cannot be converted to P7B.');
                const baseName = inputName.replace(/\.(pem|crt|csr|key)$/, '');
                outputName = `${baseName}.p7b`;

                // P7B (PKCS#7) usually requires crl2pkcs7 in OpenSSL CLI for simple conversion
                command = `openssl crl2pkcs7 -nocrl -certfile "${inputName}" -out "${outputName}"`;
            }

            const result = await openSSLService.execute(command, [inputFile]);

            if (result.error) {
                setError(result.stderr || result.error);
            } else {
                const outFile = result.files.find(f => f.name === outputName);
                if (outFile) {
                    const blob = new Blob([outFile.data as any], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    setConversionResult({ name: outputName, url, format });

                    // Add to OpenSSL Store so it appears in Key Files
                    const { addFile } = useOpenSSLStore.getState();
                    addFile({
                        name: outputName,
                        type: 'binary', // DER and P7B are binary/structured
                        content: outFile.data,
                        size: outFile.data.length,
                        timestamp: Date.now()
                    });
                } else {
                    const availableFiles = result.files.map(f => f.name).join(', ');
                    throw new Error(`Conversion output file '${outputName}' not found. Available: ${availableFiles || 'None'}`);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsConverting(false);
        }
    };

    const loadExampleCert = () => {
        const example = `-----BEGIN CERTIFICATE-----
MIIDkzCCAnugAwIBAgIUBx9r0Vj+8+0R0+0R0+0R0+0R0+0wDQYJKoZIhvcNAQEL
BQAwUzELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAkNBMRQwEgYDVQQHDAtTYW4gRnJh
bmNpc2NvMRgwFgYDVQQKDA9QS0kgTGVhcm5pbmcgQ0EwHhcNMjMwMTAxMDAwMDAw
WhcNMjQwMTAxMDAwMDAwWjBZMQswCQYDVQQGEwJVUzELMAkGA1UECAwCQ0ExFDAS
BgNVBAcMC1NhbiBGcmFuY2lzY28xGDAWBgNVBAoMD1BLSSBMZWFybmluZyBDQTEP
MA0GA1UEAwwGRXhhbXBsZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB
AL9... (truncated for brevity) ...
-----END CERTIFICATE-----`;
        setCertInput(example);
        setSelectedArtifactId('');
        setSelectedArtifactName('example_cert.pem');
    };

    return (
        <div className="space-y-6">
            {/* Artifact Selection */}
            <div className="glass-panel p-5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Search className="text-primary" size={20} />
                    Inspect Generated Artifacts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-muted">Select a Certificate or CSR to inspect:</label>
                        <select
                            value={selectedArtifactId}
                            onChange={(e) => handleArtifactSelect(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                        >
                            <option value="">-- Select from Workshop --</option>

                            {csrs.length > 0 && (
                                <optgroup label="Certificate Signing Requests (CSR)">
                                    {csrs.map(csr => (
                                        <option key={csr.id} value={csr.id}>{csr.name}</option>
                                    ))}
                                </optgroup>
                            )}

                            {rootCAs.length > 0 && (
                                <optgroup label="Root CA Certificates">
                                    {rootCAs.map(ca => (
                                        <option key={ca.id} value={ca.id}>{ca.name}</option>
                                    ))}
                                </optgroup>
                            )}

                            {certificates.length > 0 && (
                                <optgroup label="Signed Certificates">
                                    {certificates.map(cert => (
                                        <option key={cert.id} value={cert.id}>{cert.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={loadExampleCert}
                            className="text-sm text-primary hover:text-primary/80 underline mb-2"
                        >
                            Or load example certificate
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Input Content (PEM)</h3>
                    </div>

                    <textarea
                        value={certInput}
                        onChange={(e) => {
                            setCertInput(e.target.value);
                            setSelectedArtifactId(''); // Clear selection on manual edit
                            setSelectedArtifactName('');
                        }}
                        className="w-full h-64 bg-black/20 border border-white/10 rounded p-3 text-white font-mono text-xs resize-none focus:border-primary/50 outline-none"
                        placeholder="Paste PEM content here..."
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleParse}
                            disabled={isParsing || !certInput}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isParsing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                            Parse Details
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleConvert('DER')}
                                disabled={isConverting || !certInput}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white font-medium rounded hover:bg-white/20 transition-colors disabled:opacity-50 text-xs"
                            >
                                {isConverting ? <Loader2 className="animate-spin" size={14} /> : <ArrowRightLeft size={14} />}
                                To DER
                            </button>
                            <button
                                onClick={() => handleConvert('P7B')}
                                disabled={isConverting || !certInput || certInput.includes('REQUEST')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white font-medium rounded hover:bg-white/20 transition-colors disabled:opacity-50 text-xs"
                                title="CSRs cannot be converted to P7B"
                            >
                                {isConverting ? <Loader2 className="animate-spin" size={14} /> : <ArrowRightLeft size={14} />}
                                To P7B
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 flex items-start gap-2 text-red-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <pre className="whitespace-pre-wrap font-mono">{error}</pre>
                        </div>
                    )}

                    {conversionResult && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded p-3 flex items-center justify-between text-green-400 text-sm">
                            <div className="flex items-center gap-2">
                                <Check size={16} />
                                <span>Converted to {conversionResult.format} successfully: <strong>{conversionResult.name}</strong></span>
                            </div>
                            <a
                                href={conversionResult.url}
                                download={conversionResult.name}
                                className="flex items-center gap-1 hover:underline font-bold"
                            >
                                <Download size={14} />
                                Download
                            </a>
                        </div>
                    )}
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Parsed Output</h3>
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-[400px] overflow-y-auto custom-scrollbar border border-white/10">
                        {parsedOutput ? (
                            <pre className="text-blue-300 whitespace-pre-wrap">{parsedOutput}</pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p>Parsed details will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
