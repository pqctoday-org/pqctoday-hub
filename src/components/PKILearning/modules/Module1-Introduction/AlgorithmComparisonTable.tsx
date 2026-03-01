// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

// NIST-specified key and output sizes (bytes)
const ALGO_DATA = [
  {
    name: 'RSA-2048',
    type: 'KEM + Sig',
    quantumSafe: false,
    nistStd: '—',
    pubKeyB: 256,
    privKeyB: 1192,
    outputB: 256,
    level: 'Classical',
    note: "Broken by Shor's Algorithm on a sufficiently large quantum computer.",
  },
  {
    name: 'ECC P-256',
    type: 'KEM + Sig',
    quantumSafe: false,
    nistStd: 'FIPS 186-5',
    pubKeyB: 65,
    privKeyB: 32,
    outputB: 64,
    level: 'Classical',
    note: "Broken by Shor's Algorithm. Widely used today in TLS, SSH, and code signing.",
  },
  {
    name: 'ML-KEM-768',
    type: 'KEM',
    quantumSafe: true,
    nistStd: 'FIPS 203',
    pubKeyB: 1184,
    privKeyB: 2400,
    outputB: 1088,
    level: 'L3 (AES-192)',
    note: 'Based on Module-LWE. No known quantum or classical algorithm breaks it efficiently.',
  },
  {
    name: 'ML-DSA-65',
    type: 'Signature',
    quantumSafe: true,
    nistStd: 'FIPS 204',
    pubKeyB: 1952,
    privKeyB: 4032,
    outputB: 3309,
    level: 'L3 (AES-192)',
    note: 'Lattice-based signature. Drop-in replacement for ECDSA in certificates and code signing.',
  },
  {
    name: 'SLH-DSA-128s',
    type: 'Signature',
    quantumSafe: true,
    nistStd: 'FIPS 205',
    pubKeyB: 32,
    privKeyB: 64,
    outputB: 7856,
    level: 'L1 (AES-128)',
    note: 'Hash-based. Tiny keys but large signatures. Stateless and conservative security assumption.',
  },
]

const fmt = (b: number) => (b >= 1000 ? `${(b / 1000).toFixed(1)} KB` : `${b} B`)

export const AlgorithmComparisonTable: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Classical vs Post-Quantum: Algorithm Comparison
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Compare key sizes, output sizes, and quantum resilience across the major algorithm
          families.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Algorithm</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Quantum-Safe</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">NIST Std</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Public Key</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Private Key</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">
                Ciphertext / Sig
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Level</th>
            </tr>
          </thead>
          <tbody>
            {ALGO_DATA.map((algo, idx) => (
              <tr
                key={algo.name}
                className={`border-b border-border last:border-0 transition-colors ${
                  algo.quantumSafe
                    ? 'bg-success/5 hover:bg-success/10'
                    : 'bg-destructive/5 hover:bg-destructive/10'
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-foreground">{algo.name}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{algo.type}</td>
                <td className="px-4 py-3 text-center">
                  {algo.quantumSafe ? (
                    <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                      <ShieldCheck size={14} /> Safe
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-semibold">
                      <ShieldAlert size={14} /> Vulnerable
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                  {algo.nistStd}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono tabular-nums ${idx === 1 ? 'font-bold text-primary' : 'text-foreground'}`}
                >
                  {fmt(algo.pubKeyB)}
                  {idx === 1 && <span className="text-xs text-primary ml-1">↑</span>}
                  {algo.name === 'ML-KEM-768' && (
                    <span className="text-xs text-success ml-1">↑</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                  {fmt(algo.privKeyB)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                  {fmt(algo.outputB)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{algo.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exercise 5 callout */}
      <div className="glass-panel p-4 border-l-4 border-l-primary bg-primary/5">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Exercise 5 preview:</span> ECC P-256 has a{' '}
          <span className="font-mono font-bold text-primary">{fmt(65)}</span> public key. ML-KEM-768
          has a <span className="font-mono font-bold text-success">{fmt(1184)}</span> public key —
          roughly <span className="font-bold">18× larger</span>. This size increase is the main
          migration cost of PQC.
        </p>
      </div>

      {/* Exercise 4 callout — M-LWE explanation */}
      <div className="glass-panel p-5 border-l-4 border-l-success">
        <h3 className="font-semibold text-foreground mb-2">Why is ML-KEM quantum-resistant?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ML-KEM is built on the{' '}
          <strong className="text-foreground">Module Learning With Errors (M-LWE)</strong> problem.
          RSA relies on integer factorisation — solvable by Shor&apos;s Algorithm on a quantum
          computer. ECC relies on the discrete logarithm — same problem. M-LWE is fundamentally
          different: no known algorithm (quantum or classical) solves it efficiently. This is why
          NIST chose lattice-based cryptography as the primary PQC standard.
        </p>
      </div>
    </div>
  )
}
