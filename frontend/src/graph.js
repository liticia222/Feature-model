/**
 * graph.js — Feature model graph data structure
 * Manages nodes, edges, and serialization.
 */

let _idCounter = 0;
function nextId() {
  return ++_idCounter;
}

export function resetIdCounter() {
  _idCounter = 0;
}

/**
 * @typedef {'feature'|'xor'|'or'|'cardinality'} NodeType
 * @typedef {'mandatory'|'optional'} EdgeType
 *
 * @typedef {Object} GraphNode
 * @property {number} id
 * @property {NodeType} type
 * @property {string} name        — display label
 * @property {number} x
 * @property {number} y
 * @property {number} [min]       — for cardinality nodes
 * @property {number} [max]       — for cardinality nodes
 * @property {boolean} [selected] — for configuration mode
 * @property {boolean} [isValidated]
 * @property {boolean} [isProblematic]
 *
 * @typedef {Object} GraphEdge
 * @property {number} id
 * @property {string} from  — parent node id
 * @property {string} to    — child node id
 * @property {EdgeType} type
 */

/** @type {GraphNode[]} */
let nodes = [];

/** @type {GraphEdge[]} */
let edges = [];

/** All registered change listeners */
const listeners = [];

// ──────────────────────────────────
// Change notification
// ──────────────────────────────────

export function onChange(fn) {
  listeners.push(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

// ──────────────────────────────────
// Node operations
// ──────────────────────────────────

export function addNode(type, x, y, name) {
  const defaultNames = {
    feature: 'Feature',
    xor: 'XOR',
    or: 'OR',
    cardinality: '[1..1]',
  };
  const node = {
    id: nextId(),
    type,
    name: name || defaultNames[type],
    x,
    y,
  };
  if (type === 'cardinality') {
    node.min = 1;
    node.max = 1;
  }
  nodes.push(node);
  notify();
  return node;
}

export function removeNode(id) {
  nodes = nodes.filter((n) => n.id !== id);
  edges = edges.filter((e) => e.from !== id && e.to !== id);
  notify();
}

export function getNode(id) {
  return nodes.find((n) => n.id === id);
}

export function moveNode(id, x, y) {
  const n = getNode(id);
  if (n) {
    n.x = x;
    n.y = y;
    notify();
  }
}

export function renameNode(id, name) {
  const n = getNode(id);
  if (n) {
    n.name = name;
    notify();
  }
}

export function setCardinality(id, min, max) {
  const n = getNode(id);
  if (n && n.type === 'cardinality') {
    n.min = min;
    n.max = max;
    n.name = `[${min}..${max}]`;
    notify();
  }
}

export function toggleSelected(id) {
  const n = getNode(id);
  if (n) {
    n.selected = !n.selected;
    clearValidationState();
  }
}

export function setSelected(id, value) {
  const n = getNode(id);
  if (n) {
    n.selected = value;
    clearValidationState();
  }
}

export function clearValidationState() {
  for (const n of nodes) {
    n.isValidated = false;
    n.isProblematic = false;
  }
  notify();
}

export function applyValidationState(problematicIds) {
  for (const n of nodes) {
    n.isValidated = true;
    n.isProblematic = problematicIds.includes(n.id);
  }
  notify();
}

// ──────────────────────────────────
// Edge operations
// ──────────────────────────────────

export function addEdge(fromId, toId, type) {
  // Prevent duplicate edges
  if (edges.find((e) => e.from === fromId && e.to === toId)) return null;
  // Prevent self-loops
  if (fromId === toId) return null;
  const edge = {
    id: nextId(),
    from: fromId,
    to: toId,
    type,
  };
  edges.push(edge);
  notify();
  return edge;
}

export function removeEdge(id) {
  edges = edges.filter((e) => e.id !== id);
  notify();
}

export function getChildEdges(nodeId) {
  return edges.filter((e) => e.from === nodeId);
}

export function getParentEdges(nodeId) {
  return edges.filter((e) => e.to === nodeId);
}

export function getEdge(id) {
  return edges.find((e) => e.id === id);
}

// ──────────────────────────────────
// Queries
// ──────────────────────────────────

export function getNodes() {
  return nodes;
}

export function getEdges() {
  return edges;
}

// ──────────────────────────────────
// Serialization
// ──────────────────────────────────

export function serialize() {
  return {
    nodes: nodes.map((n) => {
      const out = { id: n.id, type: n.type, name: n.name, x: Math.round(n.x), y: Math.round(n.y) };
      if (n.type === 'cardinality') {
        out.min = n.min;
        out.max = n.max;
      }
      if (n.selected !== undefined) out.selected = n.selected;
      return out;
    }),
    edges: edges.map((e) => ({ id: e.id, from: e.from, to: e.to, type: e.type })),
  };
}

export function deserialize(data) {
  nodes = (data.nodes || []).map((n) => ({ ...n }));
  edges = (data.edges || []).map((e) => ({ ...e }));
  // Restore id counter
  let maxNum = 0;
  for (const n of nodes) {
    maxNum = Math.max(maxNum, n.id || 0);
  }
  for (const e of edges) {
    maxNum = Math.max(maxNum, e.id || 0);
  }
  _idCounter = maxNum;
  notify();
}

export function clearGraph() {
  nodes = [];
  edges = [];
  resetIdCounter();
  notify();
}
