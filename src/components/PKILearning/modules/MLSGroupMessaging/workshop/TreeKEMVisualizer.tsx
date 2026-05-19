// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Plus, Minus, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TreeNode {
  id: number
  depth: number
  isLeaf: boolean
  /** index of leaf in `members` if leaf, otherwise undefined */
  leafIdx?: number
  /** Whether this node was re-keyed in the most recent operation. */
  rekeyed: boolean
}

interface Member {
  idx: number
  label: string
}

/**
 * Build the smallest left-balanced complete binary tree that fits `leaves`.
 *
 * Returns an array of node ids by tree position so we can compute the
 * direct path for any leaf via index arithmetic (RFC 9420 §4).
 */
function buildTree(leaves: number): { nodes: TreeNode[]; treeDepth: number } {
  // Compute depth so 2^depth ≥ leaves.
  let depth = 0
  while (1 << depth < leaves) depth += 1
  if (depth === 0 && leaves === 1) depth = 0 // edge case: single leaf, no parents
  const totalLeaves = 1 << depth
  const total = totalLeaves * 2 - 1
  const nodes: TreeNode[] = []
  for (let id = 0; id < total; id += 1) {
    // Level-order indexing: node `id` has children 2id+1 and 2id+2.
    let d = 0
    let n = id + 1
    while (n > 1) {
      n >>= 1
      d += 1
    }
    nodes.push({
      id,
      depth: d,
      isLeaf: 2 * id + 1 >= total,
      rekeyed: false,
    })
  }
  // Map populated leaves to their member index.
  const firstLeafId = totalLeaves - 1
  for (let i = 0; i < leaves; i += 1) {
    nodes[firstLeafId + i].leafIdx = i
  }
  return { nodes, treeDepth: depth }
}

function directPath(leafNodeId: number): number[] {
  // Path from leaf up to (but not including) the root, in RFC 9420 terms.
  const path: number[] = []
  let cur = leafNodeId
  while (cur > 0) {
    path.push(cur)
    cur = Math.floor((cur - 1) / 2)
  }
  path.push(0) // root
  return path
}

const INITIAL_MEMBERS: Member[] = [
  { idx: 0, label: 'Alice' },
  { idx: 1, label: 'Bob' },
]

export const TreeKEMVisualizer: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS)
  const [epoch, setEpoch] = useState(0)
  const [lastOp, setLastOp] = useState<string>('initial state — 2-member group')
  const [rekeyedIds, setRekeyedIds] = useState<Set<number>>(new Set())

  const { nodes, treeDepth } = useMemo(() => buildTree(members.length), [members.length])
  const totalLeaves = 1 << treeDepth || 1
  const firstLeafId = totalLeaves - 1

  const addMember = () => {
    if (members.length >= 8) return
    const newLabel = `Member ${members.length + 1}`
    const newMember = { idx: members.length, label: newLabel }
    const newMembers = [...members, newMember]
    setMembers(newMembers)
    setEpoch((e) => e + 1)
    setLastOp(`Add ${newLabel} → Commit re-keys the new member's direct path`)
    const { treeDepth: d } = buildTree(newMembers.length)
    const newFirstLeafId = (1 << d) - 1
    setRekeyedIds(new Set(directPath(newFirstLeafId + newMembers.length - 1)))
  }

  const removeMember = () => {
    if (members.length <= 2) return
    const removed = members[members.length - 1]
    const newMembers = members.slice(0, -1)
    setMembers(newMembers)
    setEpoch((e) => e + 1)
    setLastOp(`Remove ${removed.label} → committer blanks their leaf and re-keys the path`)
    const { treeDepth: d } = buildTree(newMembers.length)
    const newFirstLeafId = (1 << d) - 1
    setRekeyedIds(new Set(directPath(newFirstLeafId + (newMembers.length - 1))))
  }

  const updateMember = () => {
    const idx = Math.floor(Math.random() * members.length)
    setEpoch((e) => e + 1)
    setLastOp(`Update from ${members[idx].label} → re-key direct path, new epoch secret`)
    setRekeyedIds(new Set(directPath(firstLeafId + idx)))
  }

  const reset = () => {
    setMembers(INITIAL_MEMBERS)
    setEpoch(0)
    setLastOp('initial state — 2-member group')
    setRekeyedIds(new Set())
  }

  // SVG layout.
  const width = 720
  const height = 80 + treeDepth * 70
  const leafSpacing = totalLeaves > 0 ? width / (totalLeaves + 1) : width / 2

  const positionOf = (node: TreeNode): { x: number; y: number } => {
    if (node.isLeaf) {
      const leafPos = node.id - firstLeafId
      return { x: leafSpacing * (leafPos + 1), y: 40 + treeDepth * 70 }
    }
    // Internal: average of two children positions.
    const left = positionOf(nodes[2 * node.id + 1])
    const right = positionOf(nodes[2 * node.id + 2])
    return { x: (left.x + right.x) / 2, y: 40 + node.depth * 70 }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h3 className="text-lg font-semibold">TreeKEM ratchet tree</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Watch which nodes get re-keyed on every Commit. Highlighted nodes are the
              committer&apos;s direct path — the only nodes touched by an O(log N) update.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={addMember} disabled={members.length >= 8}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={removeMember}
              disabled={members.length <= 2}
            >
              <Minus size={14} className="mr-1" /> Remove
            </Button>
            <Button variant="outline" size="sm" onClick={updateMember}>
              <RefreshCw size={14} className="mr-1" /> Update
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Epoch:</span>{' '}
            <span className="font-mono text-foreground">{epoch}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Members:</span>{' '}
            <span className="font-mono text-foreground">{members.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Last op:</span>{' '}
            <span className="text-foreground">{lastOp}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <svg width={width} height={height} className="text-foreground">
            {/* Edges */}
            {nodes
              .filter((n) => !n.isLeaf)
              .flatMap((parent) => {
                const left = nodes[2 * parent.id + 1]
                const right = nodes[2 * parent.id + 2]
                const p = positionOf(parent)
                const l = positionOf(left)
                const r = positionOf(right)
                return [
                  <line
                    key={`e-${parent.id}-l`}
                    x1={p.x}
                    y1={p.y}
                    x2={l.x}
                    y2={l.y}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                  />,
                  <line
                    key={`e-${parent.id}-r`}
                    x1={p.x}
                    y1={p.y}
                    x2={r.x}
                    y2={r.y}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                  />,
                ]
              })}
            {/* Nodes */}
            {nodes.map((n) => {
              const { x, y } = positionOf(n)
              const isPopulated = n.isLeaf
                ? n.leafIdx !== undefined && n.leafIdx < members.length
                : true
              const rekeyed = rekeyedIds.has(n.id)
              const fill = rekeyed
                ? 'hsl(var(--primary))'
                : isPopulated
                  ? 'hsl(var(--muted))'
                  : 'transparent'
              const stroke = rekeyed
                ? 'hsl(var(--primary))'
                : isPopulated
                  ? 'hsl(var(--border))'
                  : 'hsl(var(--border))'
              return (
                <g key={n.id}>
                  {n.isLeaf ? (
                    <rect
                      x={x - 18}
                      y={y - 14}
                      width={36}
                      height={28}
                      rx={4}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={rekeyed ? 2 : 1}
                      strokeDasharray={isPopulated ? undefined : '3 3'}
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={rekeyed ? 2 : 1}
                    />
                  )}
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill={rekeyed ? 'hsl(var(--primary-foreground))' : 'currentColor'}
                  >
                    {n.isLeaf
                      ? n.leafIdx !== undefined && n.leafIdx < members.length
                        ? members[n.leafIdx].label.slice(0, 3)
                        : '∅'
                      : n.id === 0
                        ? 'root'
                        : ''}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-primary" /> Re-keyed this Commit
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-muted border border-border" />{' '}
            Existing node
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full border border-dashed border-border" />{' '}
            Blank / unoccupied
          </div>
        </div>
      </div>
    </div>
  )
}
