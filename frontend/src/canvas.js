/**
 * canvas.js — Canvas rendering and interaction for the feature model graph
 */

import * as graph from './graph.js';

// ──────────────────────────────────
// Constants
// ──────────────────────────────────

const NODE_W = 140;
const NODE_H = 48;
const REIFIED_R = 26;        // radius for reified diamond/circle nodes
const PORT_R = 6;             // port radius
const PORT_HIT_R = 14;        // larger hit area for ports
const SNAP_GRID = 12;

// Colors matching CSS vars
let COLORS = {
  feature: { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  xor:     { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
  or:      { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  cardinality: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  edge: { mandatory: '#4f46e5', optional: '#94a3b8' },
  port: { fill: '#6366f1', stroke: '#ffffff' },
  selection: '#0891b2', // Darker Cyan default (Light mode)
  configEnabled: '#10b981',
  configDisabled: '#cbd5e1',
  configConflict: '#ef4444',
  textPrimary: '#0f172a'
};

export function updateTheme() {
  const style = getComputedStyle(document.documentElement);
  const getVar = (name) => style.getPropertyValue(name).trim();

  COLORS = {
    feature: { bg: getVar('--node-feature-bg'), border: getVar('--node-feature-border'), text: getVar('--node-feature-text') },
    xor:     { bg: getVar('--node-xor-bg'), border: getVar('--node-xor-border'), text: getVar('--node-xor-text') },
    or:      { bg: getVar('--node-or-bg'), border: getVar('--node-or-border'), text: getVar('--node-or-text') },
    cardinality: { bg: getVar('--node-card-bg'), border: getVar('--node-card-border'), text: getVar('--node-card-text') },
    edge: { mandatory: getVar('--edge-mandatory'), optional: getVar('--edge-optional') },
    port: { fill: getVar('--accent-1'), stroke: getVar('--bg-secondary') },
    selection: getVar('--accent-3'),
    configEnabled: getVar('--node-enabled'),
    configDisabled: getVar('--node-disabled'),
    configConflict: getVar('--node-conflict'),
    textPrimary: getVar('--text-primary')
  };
  requestDraw();
}

// ──────────────────────────────────
// State
// ──────────────────────────────────

let canvas, ctx;
let canvasW = 0, canvasH = 0;
let dpr = 1;
let scale = 1;

// Interaction state
let hoveredNode = null;
let hoveredPort = null;        // { nodeId, side: 'top'|'bottom' }
let hoveredEdge = null;
let selectedNodes = new Set();
let draggingNode = null;
let dragOffset = { x: 0, y: 0 };
let dragStartPositions = new Map();

// Box selection state
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };

// Edge creation state
let isDrawingEdge = false;
let edgeStart = null;          // { nodeId }
let edgeMouse = { x: 0, y: 0 };

// Panning state
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

// Mode
let mode = 'creation'; // 'creation' | 'configuration'

// Callbacks
let onContextMenu = null;
let onDoubleClick = null;
let onConfigChange = null;

// ──────────────────────────────────
// Initialization
// ──────────────────────────────────

export function init(canvasEl, options = {}) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;

  onContextMenu = options.onContextMenu || null;
  onDoubleClick = options.onDoubleClick || null;
  onConfigChange = options.onConfigChange || null;

  updateTheme();
  resize();
  const observer = new ResizeObserver(() => resize());
  observer.observe(canvas.parentElement);

  // Mouse events
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('dblclick', handleDblClick);
  canvas.addEventListener('contextmenu', handleContextMenu);
  canvas.addEventListener('wheel', handleWheel, { passive: false });

  // Observe graph changes
  graph.onChange(() => requestDraw());

  requestDraw();
}

export function setMode(m) {
  mode = m;
  // Reset state
  hoveredNode = null;
  hoveredPort = null;
  selectedNodes.clear();
  draggingNode = null;
  isDrawingEdge = false;
  isSelecting = false;
  requestDraw();
}

function resize() {
  const container = canvas.parentElement;
  canvasW = container.clientWidth;
  canvasH = container.clientHeight;
  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = canvasW + 'px';
  canvas.style.height = canvasH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  requestDraw();
}

// ──────────────────────────────────
// Coordinate helpers
// ──────────────────────────────────

function screenToWorld(sx, sy) {
  return { 
    x: (sx - panOffset.x) / scale, 
    y: (sy - panOffset.y) / scale 
  };
}

function worldToScreen(wx, wy) {
  return { 
    x: wx * scale + panOffset.x, 
    y: wy * scale + panOffset.y 
  };
}

// ──────────────────────────────────
// Drawing
// ──────────────────────────────────

let drawRequested = false;

function requestDraw() {
  if (!drawRequested) {
    drawRequested = true;
    requestAnimationFrame(draw);
  }
}

function draw() {
  drawRequested = false;
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, scale);

  for (const edge of graph.getEdges()) {
    drawEdge(edge);
  }

  // Draw temporary edge while dragging
  if (isDrawingEdge && edgeStart) {
    const fromNode = graph.getNode(edgeStart.nodeId);
    if (fromNode) {
      const fromPort = getPortPos(fromNode, 'bottom');
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = COLORS.selection;
      ctx.lineWidth = 2;
      const mx = edgeMouse.x - panOffset.x;
      const my = edgeMouse.y - panOffset.y;
      ctx.moveTo(fromPort.x, fromPort.y);
      // Bezier curve
      const midY = (fromPort.y + my) / 2;
      ctx.bezierCurveTo(fromPort.x, midY, mx, midY, mx, my);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  for (const node of graph.getNodes()) {
    drawNode(node);
  }

  if (isSelecting) {
    const x1 = Math.min(selectionStart.x, selectionEnd.x);
    const y1 = Math.min(selectionStart.y, selectionEnd.y);
    const w = Math.abs(selectionStart.x - selectionEnd.x);
    const h = Math.abs(selectionStart.y - selectionEnd.y);

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = COLORS.selection;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, y1, w, h);
    ctx.fillStyle = COLORS.selection + '22';
    ctx.fillRect(x1, y1, w, h);
    ctx.restore();
  }

  ctx.restore();
}

function drawNode(node) {
  const isHovered = hoveredNode === node.id;
  const isSelected = selectedNodes.has(node.id);

  if (node.type === 'feature') {
    drawFeatureNode(node, isHovered, isSelected);
  } else {
    drawReifiedNode(node, isHovered, isSelected);
  }

  if (mode === 'creation') {
    drawPort(node, 'top', isHovered);
    drawPort(node, 'bottom', isHovered);
  }
}

function drawFeatureNode(node, isHovered, isSelected) {
  const x = node.x - NODE_W / 2;
  const y = node.y - NODE_H / 2;
  const r = 10;
  const colors = COLORS.feature;

  // Shadow
  ctx.save();
  ctx.shadowColor = isSelected ? COLORS.selection + '99' : 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = isSelected ? 20 : (isHovered ? 16 : 8);
  ctx.shadowOffsetY = isSelected ? 0 : 4;

  // Background
  ctx.beginPath();
  roundRect(ctx, x, y, NODE_W, NODE_H, r);
  if (mode === 'configuration') {
    if (node.isValidated && node.isProblematic) {
      ctx.fillStyle = COLORS.configConflict + '33';
    } else if (node.isValidated && node.selected) {
      ctx.fillStyle = COLORS.configEnabled + '33';
    } else if (node.selected) {
      ctx.fillStyle = COLORS.textPrimary + '33';
    } else {
      ctx.fillStyle = COLORS.configDisabled + '33';
    }
  } else {
    ctx.fillStyle = colors.bg;
  }
  ctx.fill();
  ctx.restore();

  // Border
  ctx.beginPath();
  roundRect(ctx, x, y, NODE_W, NODE_H, r);
  ctx.lineWidth = isSelected ? 4 : (isHovered ? 2 : 1.5);
  if (isSelected) {
    ctx.strokeStyle = COLORS.selection;
  } else if (mode === 'configuration') {
    if (node.isValidated && node.isProblematic) {
      ctx.strokeStyle = COLORS.configConflict;
    } else if (node.isValidated && node.selected) {
      ctx.strokeStyle = COLORS.configEnabled;
    } else if (node.selected) {
      ctx.strokeStyle = COLORS.textPrimary;
    } else {
      ctx.strokeStyle = COLORS.configDisabled;
    }
  } else {
    ctx.strokeStyle = isHovered ? colors.text : colors.border;
  }
  ctx.stroke();

  // Text
  if (mode === 'configuration') {
    if (node.isValidated && node.isProblematic) ctx.fillStyle = COLORS.configConflict;
    else if (node.isValidated && node.selected) ctx.fillStyle = COLORS.configEnabled;
    else if (node.selected) ctx.fillStyle = COLORS.textPrimary;
    else ctx.fillStyle = '#6b7280';
  } else {
    ctx.fillStyle = colors.text;
  }
  ctx.font = '500 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const displayName = node.name.length > 16 ? node.name.slice(0, 14) + '…' : node.name;
  ctx.fillText(displayName, node.x, node.y);
}

function drawReifiedNode(node, isHovered, isSelected) {
  const colors = COLORS[node.type];
  const r = REIFIED_R;

  ctx.save();
  ctx.shadowColor = isSelected ? COLORS.selection + '99' : 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = isSelected ? 20 : (isHovered ? 14 : 6);
  ctx.shadowOffsetY = isSelected ? 0 : 3;

  // Draw diamond shape
  ctx.beginPath();
  ctx.moveTo(node.x, node.y - r);
  ctx.lineTo(node.x + r, node.y);
  ctx.lineTo(node.x, node.y + r);
  ctx.lineTo(node.x - r, node.y);
  ctx.closePath();

  if (mode === 'configuration') {
    if (node.isValidated && node.isProblematic) {
      ctx.fillStyle = COLORS.configConflict + '33';
    } else if (node.isValidated && node.selected) {
      ctx.fillStyle = COLORS.configEnabled + '33';
    } else if (node.selected) {
      ctx.fillStyle = COLORS.textPrimary + '33';
    } else {
      ctx.fillStyle = COLORS.configDisabled + '33';
    }
  } else {
    ctx.fillStyle = colors.bg;
  }
  ctx.fill();

  // Border
  ctx.strokeStyle = isSelected ? COLORS.selection : (isHovered ? colors.text : colors.border);
  ctx.lineWidth = isSelected ? 4 : 2;
  ctx.stroke();
  ctx.restore();

  // Border
  ctx.beginPath();
  ctx.moveTo(node.x, node.y - r);
  ctx.lineTo(node.x + r, node.y);
  ctx.lineTo(node.x, node.y + r);
  ctx.lineTo(node.x - r, node.y);
  ctx.closePath();
  ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
  if (mode === 'configuration') {
    if (node.isValidated && node.isProblematic) {
      ctx.strokeStyle = COLORS.configConflict;
    } else if (node.isValidated && node.selected) {
      ctx.strokeStyle = COLORS.configEnabled;
    } else if (node.selected) {
      ctx.strokeStyle = COLORS.textPrimary;
    } else {
      ctx.strokeStyle = COLORS.configDisabled;
    }
  } else {
    ctx.strokeStyle = isSelected ? COLORS.selection : isHovered ? colors.text : colors.border;
  }
  ctx.stroke();

  // Label
  if (mode === 'configuration') {
    if (node.isValidated && node.isProblematic) ctx.fillStyle = COLORS.configConflict;
    else if (node.isValidated && node.selected) ctx.fillStyle = COLORS.configEnabled;
    else if (node.selected) ctx.fillStyle = COLORS.textPrimary;
    else ctx.fillStyle = '#6b7280';
  } else {
    ctx.fillStyle = colors.text;
  }
  ctx.font = '600 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.name, node.x, node.y);
}

function drawPort(node, side, isNodeHovered) {
  const pos = getPortPos(node, side);
  const isActive = hoveredPort && hoveredPort.nodeId === node.id && hoveredPort.side === side;
  const show = isNodeHovered || isActive || isDrawingEdge;

  if (!show) return;

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, PORT_R, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? COLORS.port.fill : COLORS.port.fill + '88';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.port.stroke;
  ctx.stroke();
}

function drawEdge(edge) {
  const fromNode = graph.getNode(edge.from);
  const toNode = graph.getNode(edge.to);
  if (!fromNode || !toNode) return;

  const from = getPortPos(fromNode, 'bottom');
  const to = getPortPos(toNode, 'top');

  const isHoveredEdge = hoveredEdge === edge.id;
  const isMandatory = edge.type === 'mandatory';

  // Bezier edge
  ctx.beginPath();
  const midY = (from.y + to.y) / 2;
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(from.x, midY, to.x, midY, to.x, to.y);

  ctx.lineWidth = isHoveredEdge ? 2.5 : 1.8;
  ctx.strokeStyle = isMandatory ? COLORS.edge.mandatory : COLORS.edge.optional;
  if (!isMandatory) {
    ctx.setLineDash([6, 4]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrow head
  const angle = Math.atan2(to.y - midY, to.x - to.x) || Math.PI / 2;
  const arrowLen = 8;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - arrowLen * Math.cos(angle - 0.4), to.y - arrowLen * Math.sin(angle - 0.4));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - arrowLen * Math.cos(angle + 0.4), to.y - arrowLen * Math.sin(angle + 0.4));
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = isMandatory ? COLORS.edge.mandatory : COLORS.edge.optional;
  ctx.stroke();

  // Mandatory dot on parent port
  if (isMandatory) {
    ctx.beginPath();
    ctx.arc(from.x, from.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.edge.mandatory;
    ctx.fill();
  }

  // Edge type label at midpoint
  if (isHoveredEdge) {
    const mx = (from.x + to.x) / 2;
    const my = midY;
    ctx.font = '500 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isMandatory ? COLORS.edge.mandatory : COLORS.edge.optional;
    ctx.fillText(edge.type, mx + 15, my);
  }
}

function getPortPos(node, side) {
  if (node.type === 'feature') {
    return {
      x: node.x,
      y: side === 'top' ? node.y - NODE_H / 2 : node.y + NODE_H / 2,
    };
  } else {
    return {
      x: node.x,
      y: side === 'top' ? node.y - REIFIED_R : node.y + REIFIED_R,
    };
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
}

// ──────────────────────────────────
// Hit testing
// ──────────────────────────────────

function hitTestNode(wx, wy) {
  // Reverse order so topmost is hit first
  const nodes = graph.getNodes();
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.type === 'feature') {
      const hx = n.x - NODE_W / 2;
      const hy = n.y - NODE_H / 2;
      if (wx >= hx && wx <= hx + NODE_W && wy >= hy && wy <= hy + NODE_H) {
        return n;
      }
    } else {
      // Diamond hit test (approximate with circle)
      const dx = wx - n.x;
      const dy = wy - n.y;
      if (dx * dx + dy * dy <= REIFIED_R * REIFIED_R) {
        return n;
      }
    }
  }
  return null;
}

function hitTestPort(wx, wy) {
  for (const n of graph.getNodes()) {
    for (const side of ['top', 'bottom']) {
      const p = getPortPos(n, side);
      const dx = wx - p.x;
      const dy = wy - p.y;
      if (dx * dx + dy * dy <= PORT_HIT_R * PORT_HIT_R) {
        return { nodeId: n.id, side };
      }
    }
  }
  return null;
}

function hitTestEdge(wx, wy) {
  for (const edge of graph.getEdges()) {
    const fromNode = graph.getNode(edge.from);
    const toNode = graph.getNode(edge.to);
    if (!fromNode || !toNode) continue;
    const from = getPortPos(fromNode, 'bottom');
    const to = getPortPos(toNode, 'top');

    // Sample points along the bezier and check distance
    const midY = (from.y + to.y) / 2;
    for (let t = 0; t <= 1; t += 0.05) {
      const t1 = 1 - t;
      // Cubic bezier with control points (from.x, midY) and (to.x, midY)
      const bx = t1*t1*t1*from.x + 3*t1*t1*t*from.x + 3*t1*t*t*to.x + t*t*t*to.x;
      const by = t1*t1*t1*from.y + 3*t1*t1*t*midY + 3*t1*t*t*midY + t*t*t*to.y;
      const dx = wx - bx;
      const dy = wy - by;
      if (dx * dx + dy * dy < 64) {
        return edge;
      }
    }
  }
  return null;
}

// ──────────────────────────────────
// Mouse handlers
// ──────────────────────────────────

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function handleMouseDown(e) {
  const { x, y } = getMousePos(e);
  const world = screenToWorld(x, y);

  // Middle click to pan in all modes
  if (e.button === 1) {
    isPanning = true;
    panStart = { x: x - panOffset.x, y: y - panOffset.y };
    canvas.style.cursor = 'grab';
    return;
  }

  if (e.button === 2) return;

  // Mode-specific left-click behavior
  if (mode === 'creation') {
    const port = hitTestPort(world.x, world.y);
    if (port && port.side === 'bottom') {
      isDrawingEdge = true;
      edgeStart = { nodeId: port.nodeId };
      edgeMouse = { x, y };
      canvas.style.cursor = 'crosshair';
      return;
    }
  }

  const node = hitTestNode(world.x, world.y);
  if (node) {
    if (!selectedNodes.has(node.id) && !e.shiftKey) {
      selectedNodes.clear();
    }
    selectedNodes.add(node.id);
    
    if (mode === 'creation') {
      draggingNode = node.id;
      dragOffset = { x: world.x, y: world.y };
      dragStartPositions.clear();
      for (const id of selectedNodes) {
        const n = graph.getNode(id);
        if (n) dragStartPositions.set(id, { x: n.x, y: n.y });
      }
      canvas.style.cursor = 'grabbing';
    } else {
      if (onConfigChange) onConfigChange();
    }
    requestDraw();
    return;
  }

  // Start box selection (both modes)
  isSelecting = true;
  selectionStart = { ...world };
  selectionEnd = { ...world };
  if (!e.shiftKey) selectedNodes.clear();
  requestDraw();
}

function handleMouseMove(e) {
  const { x, y } = getMousePos(e);
  const world = screenToWorld(x, y);

  if (isDrawingEdge) {
    edgeMouse = { x, y };
    requestDraw();
    return;
  }

  if (isSelecting) {
    selectionEnd = { ...world };
    requestDraw();
    return;
  }

  if (draggingNode) {
    const dx = world.x - dragOffset.x;
    const dy = world.y - dragOffset.y;
    
    for (const [id, startPos] of dragStartPositions.entries()) {
      const nx = Math.round((startPos.x + dx) / SNAP_GRID) * SNAP_GRID;
      const ny = Math.round((startPos.y + dy) / SNAP_GRID) * SNAP_GRID;
      graph.moveNode(id, nx, ny);
    }
    return;
  }

  if (isPanning) {
    panOffset = { x: x - panStart.x, y: y - panStart.y };
    requestDraw();
    return;
  }

  // Hover detection
  const prevHoveredNode = hoveredNode;
  const prevHoveredPort = hoveredPort;
  const prevHoveredEdge = hoveredEdge;

  if (mode === 'creation') {
    hoveredPort = hitTestPort(world.x, world.y);
  } else {
    hoveredPort = null;
  }

  const node = hitTestNode(world.x, world.y);
  hoveredNode = node ? node.id : null;

  if (!hoveredNode) {
    hoveredEdge = hitTestEdge(world.x, world.y)?.id || null;
  } else {
    hoveredEdge = null;
  }

  if (hoveredPort) {
    canvas.style.cursor = 'crosshair';
  } else if (hoveredNode) {
    canvas.style.cursor = mode === 'configuration' ? 'pointer' : 'grab';
  } else if (hoveredEdge) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }

  if (
    prevHoveredNode !== hoveredNode ||
    prevHoveredPort?.nodeId !== hoveredPort?.nodeId ||
    prevHoveredPort?.side !== hoveredPort?.side ||
    prevHoveredEdge !== hoveredEdge
  ) {
    requestDraw();
  }
}

function handleMouseUp(e) {
  const { x, y } = getMousePos(e);
  const world = screenToWorld(x, y);

  if (isDrawingEdge && edgeStart) {
    const port = hitTestPort(world.x, world.y);
    if (port && port.side === 'top' && port.nodeId !== edgeStart.nodeId) {
      const edgeType = document.querySelector('input[name="edge-type"]:checked')?.value || 'mandatory';
      graph.addEdge(edgeStart.nodeId, port.nodeId, edgeType);
    }
    isDrawingEdge = false;
    edgeStart = null;
    canvas.style.cursor = 'default';
    requestDraw();
    return;
  }

  if (isSelecting) {
    const x1 = Math.min(selectionStart.x, selectionEnd.x);
    const y1 = Math.min(selectionStart.y, selectionEnd.y);
    const x2 = Math.max(selectionStart.x, selectionEnd.x);
    const y2 = Math.max(selectionStart.y, selectionEnd.y);

    for (const node of graph.getNodes()) {
      if (node.x >= x1 && node.x <= x2 && node.y >= y1 && node.y <= y2) {
        selectedNodes.add(node.id);
      }
    }
    isSelecting = false;
    requestDraw();
    return;
  }

  if (draggingNode) {
    draggingNode = null;
    dragStartPositions.clear();
    canvas.style.cursor = hoveredNode ? 'grab' : 'default';
    return;
  }

  if (isPanning) {
    isPanning = false;
    canvas.style.cursor = 'default';
    return;
  }
}

function handleDblClick(e) {
  const { x, y } = getMousePos(e);
  const world = screenToWorld(x, y);
  const node = hitTestNode(world.x, world.y);
  if (node) {
    if (mode === 'creation' && onDoubleClick) {
      onDoubleClick(node);
    } else if (mode === 'configuration' && node.type === 'feature') {
      graph.toggleSelected(node.id);
      if (onConfigChange) onConfigChange();
    }
  }
}

function handleContextMenu(e) {
  e.preventDefault();
  const { x, y } = getMousePos(e);
  const world = screenToWorld(x, y);
  const node = hitTestNode(world.x, world.y);
  const edge = node ? null : hitTestEdge(world.x, world.y);

  if (node && !selectedNodes.has(node.id)) {
    selectedNodes.clear();
    selectedNodes.add(node.id);
    requestDraw();
  }

  if (onContextMenu && (node || edge)) {
    onContextMenu(e.clientX, e.clientY, node, edge);
  }
}

function handleWheel(e) {
  e.preventDefault();

  if (e.ctrlKey || e.metaKey) {
    // Zoom
    const zoomSensitivity = 0.002;
    const zoomFactor = 1 - e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.2, scale * zoomFactor), 3.0);
    
    // Zoom around mouse position
    const { x, y } = getMousePos(e);
    
    panOffset.x = x - (x - panOffset.x) * (newScale / scale);
    panOffset.y = y - (y - panOffset.y) * (newScale / scale);
    
    scale = newScale;
  } else {
    // Pan with wheel
    panOffset.x -= e.deltaX;
    panOffset.y -= e.deltaY;
  }
  
  requestDraw();
}

// ──────────────────────────────────
// Drag & drop from toolbar
// ──────────────────────────────────

export function getDropPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  if (sx < 0 || sy < 0 || sx > canvasW || sy > canvasH) return null;
  return screenToWorld(sx, sy);
}

// ──────────────────────────────────
// Selection helpers
// ──────────────────────────────────

export function getSelectedNodes() {
  return Array.from(selectedNodes).map(id => graph.getNode(id)).filter(Boolean);
}

export function clearSelection() {
  selectedNodes.clear();
  requestDraw();
}

export { requestDraw };
