import React, { useState } from 'react'
import {
  Send,
  ThumbsUp,
  MessageSquare,
  Info,
  Shield,
  TriangleAlert,
  GithubIcon,
} from 'lucide-react'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import { MobileAboutView } from './MobileAboutView'
import { useTheme } from '../../hooks/useTheme'

export function AboutView() {
  const { theme, setTheme } = useTheme()
  const [changeRequest, setChangeRequest] = useState({
    userType: 'Technical',
    feature: '',
    subfeature: '',
    category: 'Feature Request',
    description: '',
  })

  const [kudos, setKudos] = useState({
    likes: [] as string[],
    dislikes: [] as string[],
    getRidOf: [] as string[],
    message: '',
  })

  const features = [
    'Timeline',
    'Algorithms',
    'Library',
    'Playground',
    'OpenSSL Studio',
    'Compliance',
    'Threats',
    'Leaders',
    'Learn',
  ]

  const featureSubfeatures: Record<string, string[]> = {
    Timeline: ['Visualization', 'Data Source', 'Milestones'],
    Algorithms: ['NIST Round 1', 'NIST Round 2', 'NIST Round 3', 'NIST Round 4', 'Details'],
    Library: ['Research Papers', 'Whitepapers', 'Standards', 'Search'],
    Playground: ['KEM', 'Signature', 'Hybrid', 'Performance'],
    'OpenSSL Studio': ['Builder', 'Configurator', 'Output'],
    Compliance: ['NIST FIPS', 'ANSSI', 'Common Criteria', 'Visualization'],
    Threats: ['Quantum Threat Timeline', 'Industry Impact', 'Risk Assessment'],
    Leaders: ['Academic', 'Industry', 'Government', 'Profiles'],
    Learn: ['PKI Workshop', 'Digital Assets', '5G Security', 'EUDI Wallet', 'TLS Basics'],
  }

  const handleChangeRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = `Change Request: ${changeRequest.category} - ${changeRequest.feature}`
    const body = `
User Type: ${changeRequest.userType}
Feature: ${changeRequest.feature}
Subfeature: ${changeRequest.subfeature}
Category: ${changeRequest.category}

Description:
${changeRequest.description}
    `.trim()

    window.location.href = `mailto:submitchangerequest@pqctoday.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  const handleKudosSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = `Kudos for PQC Today`
    const body = `
What I like:
${kudos.likes.join(', ') || 'None selected'}

What can be improved:
${kudos.dislikes.join(', ') || 'None selected'}

Get rid of it!:
${kudos.getRidOf.join(', ') || 'None selected'}

Message:
${kudos.message}
    `.trim()

    window.location.href = `mailto:kudos@pqctoday.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  const toggleLike = (feature: string) => {
    setKudos((prev) => ({
      ...prev,
      likes: prev.likes.includes(feature)
        ? prev.likes.filter((f) => f !== feature)
        : [...prev.likes, feature],
    }))
  }

  const toggleDislike = (feature: string) => {
    setKudos((prev) => ({
      ...prev,
      dislikes: prev.dislikes.includes(feature)
        ? prev.dislikes.filter((f) => f !== feature)
        : [...prev.dislikes, feature],
    }))
  }

  const toggleGetRidOf = (feature: string) => {
    setKudos((prev) => ({
      ...prev,
      getRidOf: prev.getRidOf.includes(feature)
        ? prev.getRidOf.filter((f) => f !== feature)
        : [...prev.getRidOf, feature],
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile View: Light Experience */}
      <div className="md:hidden px-4 py-4">
        <MobileAboutView />
      </div>

      {/* Desktop View: Full Experience */}
      <div className="hidden md:block space-y-8">
        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Info className="text-primary" size={24} />
              <h2 className="text-2xl font-bold">About PQC Today</h2>
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-muted-foreground">
              PQC Today is your comprehensive resource for tracking the transition to Post-Quantum
              Cryptography. We provide real-time updates on standardization efforts, detailed
              algorithm analysis, and interactive tools to help organizations prepare for the
              quantum future.
            </p>
            <p className="text-muted-foreground mt-4">
              Our mission is to demystify quantum threats and make PQC adoption accessible to
              everyone, from security researchers to business leaders.
            </p>
            <p className="text-muted-foreground mt-4">
              Connect with me on LinkedIn:{' '}
              <a
                href="https://www.linkedin.com/in/eric-amador-971850a"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Eric Amador
              </a>
            </p>
            <p className="text-muted-foreground mt-4">
              See the latest updates:{' '}
              <a href="/changelog" className="text-primary hover:underline">
                View Changelog
              </a>
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Change Request Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="text-accent" size={24} />
              <h2 className="text-xl font-bold">Submit Change Request</h2>
            </div>
            <form onSubmit={handleChangeRequestSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="user-type"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  I am a...
                </label>
                <select
                  id="user-type"
                  value={changeRequest.userType}
                  onChange={(e) => setChangeRequest({ ...changeRequest, userType: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none text-base md:text-sm"
                >
                  <option value="Technical">Technical User</option>
                  <option value="Sales">Sales Professional</option>
                  <option value="Marketing">Marketing Professional</option>
                  <option value="Curious">Curious Observer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="feature"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Feature
                  </label>
                  <select
                    id="feature"
                    value={changeRequest.feature}
                    onChange={(e) =>
                      setChangeRequest({
                        ...changeRequest,
                        feature: e.target.value,
                        subfeature: '',
                      })
                    }
                    className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none text-base md:text-sm"
                    required
                  >
                    <option value="">Select Feature</option>
                    {features.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="subfeature"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Subfeature
                  </label>
                  <select
                    id="subfeature"
                    value={changeRequest.subfeature}
                    onChange={(e) =>
                      setChangeRequest({ ...changeRequest, subfeature: e.target.value })
                    }
                    className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none text-base md:text-sm"
                    disabled={!changeRequest.feature}
                  >
                    <option value="">Select Subfeature</option>
                    {changeRequest.feature &&
                      featureSubfeatures[changeRequest.feature]?.map((sf) => (
                        <option key={sf} value={sf}>
                          {sf}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={changeRequest.category}
                  onChange={(e) => setChangeRequest({ ...changeRequest, category: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none text-base md:text-sm"
                >
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Content Update">Content Update</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={changeRequest.description}
                  onChange={(e) =>
                    setChangeRequest({ ...changeRequest, description: e.target.value })
                  }
                  className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none min-h-[100px] text-base md:text-sm"
                  placeholder="Describe the change you'd like to see..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={18} />
                Send Request
              </button>
            </form>
          </motion.div>

          {/* Kudos Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <ThumbsUp className="text-success" size={24} />
              <h2 className="text-xl font-bold">Give Kudos</h2>
            </div>
            <form onSubmit={handleKudosSubmit} className="space-y-6">
              <div>
                <span className="block text-sm font-medium text-muted-foreground mb-2">
                  What do you like?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <label
                      key={`like-${feature}`}
                      className={clsx(
                        'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border',
                        kudos.likes.includes(feature)
                          ? 'bg-success/20 border-success/50 text-success'
                          : 'bg-muted/30 border-transparent hover:bg-muted/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={kudos.likes.includes(feature)}
                        onChange={() => toggleLike(feature)}
                        className="hidden"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-muted-foreground mb-2">
                  What can we improve?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <label
                      key={`dislike-${feature}`}
                      className={clsx(
                        'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border',
                        kudos.dislikes.includes(feature)
                          ? 'bg-destructive/20 border-destructive/50 text-destructive'
                          : 'bg-muted/30 border-transparent hover:bg-muted/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={kudos.dislikes.includes(feature)}
                        onChange={() => toggleDislike(feature)}
                        className="hidden"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-muted-foreground mb-2">
                  Get rid of it!
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <label
                      key={`getridof-${feature}`}
                      className={clsx(
                        'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border',
                        kudos.getRidOf.includes(feature)
                          ? 'bg-warning/20 border-warning/50 text-warning'
                          : 'bg-muted/30 border-transparent hover:bg-muted/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={kudos.getRidOf.includes(feature)}
                        onChange={() => toggleGetRidOf(feature)}
                        className="hidden"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="kudos-message"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Message
                </label>
                <textarea
                  id="kudos-message"
                  value={kudos.message}
                  onChange={(e) => setKudos({ ...kudos, message: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none min-h-[100px] text-base md:text-sm"
                  placeholder="Tell us what you think..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-success/20 hover:bg-success/30 text-success-foreground border border-success/50 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={18} />
                Send Kudos
              </button>
            </form>
          </motion.div>
        </div>

        {/* Browser Recommendation (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel p-4 border-l-4 border-l-warning"
        >
          <div className="flex items-center gap-3">
            <TriangleAlert className="text-warning shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-sm inline mr-2">Browser Recommendation:</h3>
              <span className="text-sm text-muted-foreground">
                For heavy OpenSSL operations, <strong>Chromium-based browsers</strong> are
                recommended for optimal performance.
              </span>
            </div>
          </div>
        </motion.div>

        {/* SBOM Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold">Software Bill of Materials (SBOM)</h2>
          </div>
          <div className="columns-1 md:columns-3 gap-6 space-y-6">
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">UI Frameworks & Libraries</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React</span>
                  <span className="text-xs text-muted-foreground/60">v19.2.3</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Framer Motion</span>
                  <span className="text-xs text-muted-foreground/60">v12.24.7</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Lucide React</span>
                  <span className="text-xs text-muted-foreground/60">v0.562.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Tailwind CSS</span>
                  <span className="text-xs text-muted-foreground/60">v4.1.18</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">clsx</span>
                  <span className="text-xs text-muted-foreground/60">v2.1.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">tailwind-merge</span>
                  <span className="text-xs text-muted-foreground/60">v3.4.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">class-variance-authority</span>
                  <span className="text-xs text-muted-foreground/60">v0.7.1</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Utilities</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">localforage</span>
                  <span className="text-xs text-muted-foreground/60">v1.10.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">jszip</span>
                  <span className="text-xs text-muted-foreground/60">v3.10.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">file-saver</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.5</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">papaparse</span>
                  <span className="text-xs text-muted-foreground/60">v5.5.3</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">pdf-parse</span>
                  <span className="text-xs text-muted-foreground/60">v2.4.5</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Cryptography & PQC</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">OpenSSL WASM</span>
                  <span className="text-xs text-muted-foreground/60">v3.6.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Web Crypto API (X25519, P-256)</span>
                  <span className="text-xs text-muted-foreground/60">Native</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">pqcrypto</span>
                  <span className="text-xs text-muted-foreground/60">v1.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@noble/hashes</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@noble/curves</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/bip32</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/bip39</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">@scure/base</span>
                  <span className="text-xs text-muted-foreground/60">v2.0.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">micro-eth-signer</span>
                  <span className="text-xs text-muted-foreground/60">v0.18.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">ed25519-hd-key</span>
                  <span className="text-xs text-muted-foreground/60">v1.3.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">State Management</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Zustand</span>
                  <span className="text-xs text-muted-foreground/60">v5.0.9</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Immer</span>
                  <span className="text-xs text-muted-foreground/60">v11.1.3</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Analytics</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">React GA4</span>
                  <span className="text-xs text-muted-foreground/60">v2.1.0</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Build & Development</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Vite</span>
                  <span className="text-xs text-muted-foreground/60">v7.3.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">TypeScript</span>
                  <span className="text-xs text-muted-foreground/60">v5.9.3</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">tsx</span>
                  <span className="text-xs text-muted-foreground/60">v4.21.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">ESLint</span>
                  <span className="text-xs text-muted-foreground/60">v9.39.2</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Prettier</span>
                  <span className="text-xs text-muted-foreground/60">v3.7.4</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Husky</span>
                  <span className="text-xs text-muted-foreground/60">v9.1.7</span>
                </li>
              </ul>
            </div>
            <div className="break-inside-avoid">
              <h3 className="text-lg font-semibold text-primary mb-3">Testing</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Vitest</span>
                  <span className="text-xs text-muted-foreground/60">v4.0.16</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Playwright</span>
                  <span className="text-xs text-muted-foreground/60">v1.57.0</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">Testing Library (React)</span>
                  <span className="text-xs text-muted-foreground/60">v16.3.1</span>
                </li>
                <li className="flex justify-between items-center text-sm border-b border-border pb-1">
                  <span className="text-muted-foreground">axe-playwright (Accessibility)</span>
                  <span className="text-xs text-muted-foreground/60">v2.2.2</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* License Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-secondary" size={24} />
            <h2 className="text-xl font-bold">Open Source License</h2>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              PQC Today is open source software released under the{' '}
              <strong>GNU General Public License v3.0 (GPLv3)</strong>.
            </p>
            <p className="text-muted-foreground mt-2">
              You are free to copy, distribute, and modify this software, provided that any
              modifications are also released under the same license terms. This ensures that the
              project remains free and accessible to the PQC community.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="https://github.com/pqctoday/pqc-timeline-app/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                <Info size={16} />
                View Full License
              </a>
              <a
                href="https://github.com/pqctoday/pqc-timeline-app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                <GithubIcon size={16} />
                View GitHub Repository
              </a>
            </div>
          </div>
        </motion.div>

        {/* AI Acknowledgment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 text-center"
        >
          <h3 className="text-lg font-bold mb-2">AI Technology Acknowledgment</h3>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            This site is developed, documented, validated and deployed using advanced AI
            technologies including Google Antigravity, ChatGPT, Claude AI, Perplexity, and Gemini
            Pro. While the presented information has been manually curated, it may still contain
            inaccuracies.
          </p>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel p-6 flex flex-col items-center justify-center gap-4"
        >
          <h3 className="text-lg font-bold">Appearance</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Choose your preferred color scheme.
          </p>
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize flex items-center gap-2',
                  theme === t
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                )}
              >
                {t === 'light' && '☀️'}
                {t === 'dark' && '🌙'}
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
