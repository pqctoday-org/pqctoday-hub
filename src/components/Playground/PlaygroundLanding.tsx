// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, BookOpen, FlaskConical, Compass, ArrowRight, Cpu } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { Input } from '../ui/input'
import { WORKSHOP_TOOLS, CATEGORIES } from './workshopRegistry'
import { SANDBOX_SCENARIOS, SANDBOX_TRACKS } from '@/data/sandboxScenarios'

const TOOL_COUNT = WORKSHOP_TOOLS.filter((t) => t.category !== 'Sandbox').length
const TOOL_CATEGORY_COUNT = CATEGORIES.length
const DEMO_COUNT = SANDBOX_SCENARIOS.length
const TRACK_COUNT = SANDBOX_TRACKS.length
const TOTAL_COUNT = TOOL_COUNT + DEMO_COUNT

interface GoalCardProps {
  to: string
  icon: React.ElementType
  title: string
  body: string
  meta: string
}

const GoalCard = ({ to, icon: Icon, title, body, meta }: GoalCardProps) => (
  <Link
    to={to}
    className="glass-panel p-6 flex flex-col gap-3 hover:border-primary/60 hover:-translate-y-0.5 transition-all duration-200 group"
  >
    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
    </div>
    <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
      {title}
    </p>
    <p className="text-sm text-muted-foreground flex-1">{body}</p>
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mt-1">
      {meta}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </span>
  </Link>
)

export const PlaygroundLanding = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/playground/all?q=${encodeURIComponent(q)}` : '/playground/all')
  }

  return (
    <div>
      <PageHeader
        icon={FlaskConical}
        pageId="playground"
        title="Crypto Lab"
        description="Run real cryptography in your browser. Pick a starting point below — or search if you already know what you're after."
        shareTitle="PQC Crypto Lab — Interactive Cryptography in Your Browser"
        shareText="Run real post-quantum cryptographic operations in your browser — key generation, PKCS#11 HSM, ML-KEM, ML-DSA and more via WASM."
      />

      {/* Power-user row: search everything + escape hatch to the flat catalog */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search all ${TOTAL_COUNT} tools & demos…`}
            aria-label="Search all tools and demos"
            className="pl-9 h-11"
          />
        </form>
        <Link
          to="/playground/all"
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap px-2"
        >
          Browse everything
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* The three goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
        <GoalCard
          to="/playground/tools"
          icon={BookOpen}
          title="Learn a concept"
          body="Bite-size, hands-on tools that each demonstrate one idea — key generation, signing, hashing, entropy, and more."
          meta={`${TOOL_COUNT} tools · ${TOOL_CATEGORY_COUNT} categories`}
        />
        <GoalCard
          to="/playground/sandbox"
          icon={FlaskConical}
          title="Try a real protocol end-to-end"
          body="Full end-to-end demos of real protocols and systems — TLS, SSH, PKI, KMIP, and more, running the actual stack."
          meta={`${DEMO_COUNT} demos · ${TRACK_COUNT} categories`}
        />
        <GoalCard
          to="/playground/path"
          icon={Compass}
          title="Find what fits my role"
          body="Tell us your job — developer, architect, executive, ops, researcher — and get a short, ordered track to work through."
          meta="Tailored to your role"
        />
      </div>

      {/* Featured: the in-browser crypto-agile KMIP control plane */}
      <div className="pt-4">
        <GoalCard
          to="/playground/cacp"
          icon={Cpu}
          title="Crypto-Agility Control Plane (CACP)"
          body="A full KMIP 3.0 control plane + PKCS#11 HSM compiled to WebAssembly, running entirely in your browser. Flip a crypto-agility policy and watch the same operation switch between classical and post-quantum — no install, no server."
          meta="Runs in your browser · ML-KEM / ML-DSA"
        />
      </div>
    </div>
  )
}
