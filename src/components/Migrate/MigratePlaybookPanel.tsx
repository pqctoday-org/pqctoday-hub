// SPDX-License-Identifier: GPL-3.0-only
/**
 * Phase-5 rollout playbook + cross-links, surfaced inside the Migration Framework
 * section on /migrate. Closes Migrate gap-closer rows 2, 4, 5, 6, 7, 8:
 *
 *  - row 2  Protocol-coverage cross-link → /algorithms?tab=support (matrix exists there)
 *  - row 3  Performance & key-size legend (per-product hints live on the cards/table)
 *  - row 4  Wave-sequencing overlay (Wave 0–5 ladder + prerequisites)
 *  - row 5  Data-at-rest strategy chooser (re-encrypt / key-wrap / crypto-shred)
 *  - row 6  Defense-in-depth note (AES-256 / tokenization / segmentation)
 *  - row 7  AI-assisted-migration provenance (human-review gate)
 *  - row 8  Deep-link discovery / PKI depth → Learn (link, do not duplicate)
 *
 * Additive: collapsed by default; nothing renders until the user opens it, so the
 * page behaves exactly as before when the feature is unused.
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Database,
  ShieldCheck,
  Bot,
  ExternalLink,
  Gauge,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MIGRATION_WAVES,
  DATA_AT_REST_STRATEGIES,
  DEFENSE_IN_DEPTH,
  AI_PROVENANCE_GATES,
} from './migratePlaybookData'

const SECTION_HEAD = 'flex items-center gap-2 text-sm font-semibold text-foreground mb-3'

export const MigratePlaybookPanel: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass-panel border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="migrate-playbook-body"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 h-auto rounded-none text-sm hover:bg-muted/30"
      >
        <span className="flex items-center gap-2 font-semibold text-foreground">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Layers size={16} className="text-primary" />
          Rollout Playbook (Phase 5) &amp; Cross-links
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Waves · data-at-rest · defense-in-depth · AI provenance
        </span>
      </Button>

      {open && (
        <div
          id="migrate-playbook-body"
          className="border-t border-border p-4 space-y-8 animate-fade-in"
        >
          {/* Cross-links: protocol matrix + Learn discovery/PKI depth (rows 2, 8) */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Link
              to="/algorithms?tab=support"
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            >
              <Gauge size={14} aria-hidden="true" />
              Protocol coverage matrix
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
            <Link
              to="/learn/crypto-agility"
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border bg-muted/20 text-foreground hover:bg-muted/40 transition-colors"
            >
              <GraduationCap size={14} aria-hidden="true" />
              Discovery &amp; CBOM depth
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
            <Link
              to="/learn/pki-workshop"
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border bg-muted/20 text-foreground hover:bg-muted/40 transition-colors"
            >
              <GraduationCap size={14} aria-hidden="true" />
              PKI migration depth
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </div>

          {/* Row 4 — Wave-sequencing overlay */}
          <section>
            <h4 className={SECTION_HEAD}>
              <Layers size={15} className="text-primary" />
              Wave sequencing (deploy order)
            </h4>
            <ol className="space-y-2">
              {MIGRATION_WAVES.map((w) => (
                <li
                  key={w.wave}
                  className="flex gap-3 text-sm bg-muted/20 rounded-md px-3 py-2 border border-border/50"
                >
                  <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    W{w.wave}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{w.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{w.focus}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      <span className="font-medium">Prereqs:</span> {w.prerequisites.join(' · ')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Row 5 — Data-at-rest strategy chooser */}
          <section>
            <h4 className={SECTION_HEAD}>
              <Database size={15} className="text-primary" />
              Data-at-rest strategy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DATA_AT_REST_STRATEGIES.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-border/50 bg-muted/20 px-3 py-2.5"
                >
                  <p className="font-medium text-sm text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground/80">Use when:</span> {s.whenToUse}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1">{s.tradeoff}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Row 6 — Defense-in-depth note */}
          <section>
            <h4 className={SECTION_HEAD}>
              <ShieldCheck size={15} className="text-primary" />
              Defense in depth (pair with PQC)
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEFENSE_IN_DEPTH.map((d) => (
                <li
                  key={d.title}
                  className="rounded-md border border-border/50 bg-muted/20 px-3 py-2.5"
                >
                  <p className="font-medium text-sm text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Row 7 — AI-assisted-migration provenance */}
          <section>
            <h4 className={SECTION_HEAD}>
              <Bot size={15} className="text-primary" />
              AI-assisted migration — provenance gates
            </h4>
            <ul className="space-y-2">
              {AI_PROVENANCE_GATES.map((g) => (
                <li
                  key={g.title}
                  className="flex gap-2.5 text-sm bg-muted/20 rounded-md px-3 py-2 border border-border/50"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">{g.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
