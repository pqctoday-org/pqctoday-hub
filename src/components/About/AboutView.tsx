import React, { useState } from 'react'
import { Send, ThumbsUp, MessageSquare, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export function AboutView() {
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
        'Threats',
        'Leaders',
    ]

    const featureSubfeatures: Record<string, string[]> = {
        Timeline: ['Visualization', 'Data Source', 'Milestones'],
        Algorithms: ['NIST Round 1', 'NIST Round 2', 'NIST Round 3', 'NIST Round 4', 'Details'],
        Library: ['Research Papers', 'Whitepapers', 'Standards', 'Search'],
        Playground: ['KEM', 'Signature', 'Hybrid', 'Performance'],
        'OpenSSL Studio': ['Builder', 'Configurator', 'Output'],
        Threats: ['Quantum Threat Timeline', 'Industry Impact', 'Risk Assessment'],
        Leaders: ['Academic', 'Industry', 'Government', 'Profiles'],
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
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Bio Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6"
            >
                <div className="flex items-center gap-3 mb-4">
                    <Info className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold">About PQC Today</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-muted">
                        PQC Today is your comprehensive resource for tracking the transition to Post-Quantum
                        Cryptography. We provide real-time updates on standardization efforts, detailed
                        algorithm analysis, and interactive tools to help organizations prepare for the quantum
                        future.
                    </p>
                    <p className="text-muted mt-4">
                        Our mission is to demystify quantum threats and make PQC adoption accessible to
                        everyone, from security researchers to business leaders.
                    </p>
                    <p className="text-muted mt-4">
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
                            <label className="block text-sm font-medium text-muted mb-1">I am a...</label>
                            <select
                                value={changeRequest.userType}
                                onChange={(e) => setChangeRequest({ ...changeRequest, userType: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary outline-none"
                            >
                                <option value="Technical">Technical User</option>
                                <option value="Sales">Sales Professional</option>
                                <option value="Marketing">Marketing Professional</option>
                                <option value="Curious">Curious Observer</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Feature</label>
                                <select
                                    value={changeRequest.feature}
                                    onChange={(e) =>
                                        setChangeRequest({
                                            ...changeRequest,
                                            feature: e.target.value,
                                            subfeature: '', // Reset subfeature when feature changes
                                        })
                                    }
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary outline-none"
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
                                <label className="block text-sm font-medium text-muted mb-1">Subfeature</label>
                                <select
                                    value={changeRequest.subfeature}
                                    onChange={(e) =>
                                        setChangeRequest({ ...changeRequest, subfeature: e.target.value })
                                    }
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary outline-none"
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
                            <label className="block text-sm font-medium text-muted mb-1">Category</label>
                            <select
                                value={changeRequest.category}
                                onChange={(e) => setChangeRequest({ ...changeRequest, category: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary outline-none"
                            >
                                <option value="Feature Request">Feature Request</option>
                                <option value="Bug Report">Bug Report</option>
                                <option value="Content Update">Content Update</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Description</label>
                            <textarea
                                value={changeRequest.description}
                                onChange={(e) =>
                                    setChangeRequest({ ...changeRequest, description: e.target.value })
                                }
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary outline-none min-h-[100px]"
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
                        <ThumbsUp className="text-green-400" size={24} />
                        <h2 className="text-xl font-bold">Give Kudos</h2>
                    </div>
                    <form onSubmit={handleKudosSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">
                                What do you like?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {features.map((feature) => (
                                    <label
                                        key={`like-${feature}`}
                                        className={clsx(
                                            'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border',
                                            kudos.likes.includes(feature)
                                                ? 'bg-green-500/20 border-green-500/50 text-green-200'
                                                : 'bg-black/20 border-transparent hover:bg-white/5'
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
                            <label className="block text-sm font-medium text-muted mb-2">
                                What can we improve?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {features.map((feature) => (
                                    <label
                                        key={`dislike-${feature}`}
                                        className={clsx(
                                            'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border',
                                            kudos.dislikes.includes(feature)
                                                ? 'bg-red-500/20 border-red-500/50 text-red-200'
                                                : 'bg-black/20 border-transparent hover:bg-white/5'
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
                            <label className="block text-sm font-medium text-muted mb-2">
                                Get rid of it!
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {features.map((feature) => (
                                    <label
                                        key={`getridof-${feature}`}
                                        className={clsx(
                                            'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border',
                                            kudos.getRidOf.includes(feature)
                                                ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                                                : 'bg-black/20 border-transparent hover:bg-white/5'
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
                            <label className="block text-sm font-medium text-muted mb-1">Message</label>
                            <textarea
                                value={kudos.message}
                                onChange={(e) => setKudos({ ...kudos, message: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-primary outline-none min-h-[100px]"
                                placeholder="Tell us what you think..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Send size={18} />
                            Send Kudos
                        </button>
                    </form>
                </motion.div>
            </div>

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
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">
                            UI Frameworks & Libraries
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">React</span>
                                <span className="text-xs text-muted/60">v19.2.0 • 2025-10-01</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Framer Motion</span>
                                <span className="text-xs text-muted/60">v12.23.24 • 2025-10-10</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Lucide React</span>
                                <span className="text-xs text-muted/60">v0.554.0 • 2025-11-17</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">clsx</span>
                                <span className="text-xs text-muted/60">v2.1.1 • 2024-04-23</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">Cryptography & PQC</h3>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">OpenSSL</span>
                                <span className="text-xs text-muted/60">v3.5.4 • 2025-11-20</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">liboqs (ML-DSA, ML-KEM)</span>
                                <span className="text-xs text-muted/60">v0.14.3 • 2025-10-14</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">mlkem-wasm</span>
                                <span className="text-xs text-muted/60">v0.0.7 • 2025-09-17</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">openssl-wasm</span>
                                <span className="text-xs text-muted/60">v3.1.0 • 2023-03-24</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">pqcrypto</span>
                                <span className="text-xs text-muted/60">v1.0.1 • 2022-04-11</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">noble-hashes</span>
                                <span className="text-xs text-muted/60">v2.0.1 • 2025-09-22</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">State Management</h3>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Zustand</span>
                                <span className="text-xs text-muted/60">v5.0.8 • 2025-08-19</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">Analytics</h3>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">React GA4</span>
                                <span className="text-xs text-muted/60">v2.1.0 • 2023-03-06</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">Build & Development</h3>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Vite</span>
                                <span className="text-xs text-muted/60">v7.2.4 • 2025-11-20</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">TypeScript</span>
                                <span className="text-xs text-muted/60">v5.9.3 • 2025-09-30</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">ESLint</span>
                                <span className="text-xs text-muted/60">v9.39.1 • 2025-11-03</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Prettier</span>
                                <span className="text-xs text-muted/60">v3.7.3 • 2025-11-29</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-3">Testing</h3>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Vitest</span>
                                <span className="text-xs text-muted/60">v4.0.14 • 2025-11-25</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Playwright</span>
                                <span className="text-xs text-muted/60">v1.57.0 • 2025-11-25</span>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                                <span className="text-muted">Testing Library</span>
                                <span className="text-xs text-muted/60">v16.3.0 • 2025-04-02</span>
                            </li>
                        </ul>
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
                <p className="text-muted text-sm max-w-2xl mx-auto">
                    This site is developed, documented, validated and deployed using advanced AI
                    technologies including Google Antigravity, ChatGPT, Claude AI, Perplexity, and Gemini
                    Pro. While the presented information has been manually curated, it may still contain
                    errors.
                </p>
            </motion.div>
        </div>
    )
}
