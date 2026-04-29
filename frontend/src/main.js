/**
 * main.js — Application entry point
 * Wires up all modules and handles mode switching.
 */

import * as graph from './graph.js';
import * as canvas from './canvas.js';
import * as toolbar from './toolbar.js';
import * as config from './config.js';

// ──────────────────────────────────
// DOM elements
// ──────────────────────────────────

const modeSelect = document.getElementById('mode-select');
const toolbarEl = document.getElementById('toolbar');
const jsonOutput = document.getElementById('json-output');
const contextMenu = document.getElementById('context-menu');
const renameModal = document.getElementById('rename-modal');
const renameInput = document.getElementById('rename-input');
const modalTitle = document.getElementById('modal-title');
const cardinalityModal = document.getElementById('cardinality-modal');
const cardMin = document.getElementById('card-min');
const cardMax = document.getElementById('card-max');
const btnVerify = document.getElementById('btn-verify');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const btnTheme = document.getElementById('btn-theme');
const importFileInput = document.getElementById('import-file-input');
const btnCopyJson = document.getElementById('btn-copy-json');

let currentMode = 'creation';
let contextTarget = null; // { node, edge }

// ──────────────────────────────────
// Initialization
// ──────────────────────────────────

function init() {
  const canvasEl = document.getElementById('graph-canvas');

  canvas.init(canvasEl, {
    onContextMenu: showContextMenu,
    onDoubleClick: handleDoubleClick,
    onConfigChange: () => config.onConfigChange(),
  });

  toolbar.init();
  config.init();

  modeSelect.addEventListener('change', switchMode);

  graph.onChange(updateJsonPanel);

  btnVerify.addEventListener('click', () => {
    if (currentMode === 'configuration') {
      config.runValidation();
    }
  });
  btnExport.addEventListener('click', handleExport);
  btnImport.addEventListener('click', () => {
    importFileInput.click();
  });

  // Theme logic
  let isDarkMode = false;
  btnTheme.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    canvas.updateTheme();
  });

  importFileInput.addEventListener('change', handleImport);
  btnCopyJson.addEventListener('click', handleCopyJson);

  for (const item of contextMenu.querySelectorAll('.ctx-item')) {
    item.addEventListener('click', handleContextAction);
  }

  document.getElementById('rename-cancel').addEventListener('click', closeRenameModal);
  document.getElementById('rename-ok').addEventListener('click', submitRename);
  renameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') closeRenameModal();
  });

  document.getElementById('card-cancel').addEventListener('click', closeCardModal);
  document.getElementById('card-ok').addEventListener('click', submitCardinality);

  // Global click to dismiss context menu
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.add('hidden');
    }
  });

  updateJsonPanel();
}

// ──────────────────────────────────
// Mode switching
// ──────────────────────────────────

function switchMode() {
  const newMode = modeSelect.value;
  if (newMode === currentMode) return;
  currentMode = newMode;

  if (currentMode === 'creation') {
    toolbarEl.classList.remove('is-hidden');
    btnVerify.classList.add('is-hidden');
    config.leave();
    canvas.setMode('creation');
  } else {
    toolbarEl.classList.add('is-hidden');
    btnVerify.classList.remove('is-hidden');
    config.enter();
    canvas.setMode('configuration');
  }

  updateJsonPanel();
}

// ──────────────────────────────────
// JSON panel
// ──────────────────────────────────

function updateJsonPanel() {
  let data;
  if (currentMode === 'creation') {
    data = graph.serialize();
  } else {
    data = {
      model: graph.serialize(),
      configuration: config.getConfigSerialization(),
    };
  }

  const raw = JSON.stringify(data, null, 2);
  jsonOutput.innerHTML = `<code>${syntaxHighlight(raw)}</code>`;
}

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

// ──────────────────────────────────
// Context menu
// ──────────────────────────────────

function showContextMenu(x, y, node, edge) {
  contextTarget = { node, edge };

  // Show/hide relevant items
  const renameItem = contextMenu.querySelector('[data-action="rename"]');
  const cardItem = contextMenu.querySelector('[data-action="set-cardinality"]');

  const selectedCount = canvas.getSelectedNodes().length;
  const isCreation = currentMode === 'creation';

  if (node && selectedCount <= 1) {
    renameItem.style.display = isCreation && node.type === 'feature' ? '' : 'none';
    cardItem.style.display = isCreation && node.type === 'cardinality' ? '' : 'none';
  } else {
    renameItem.style.display = 'none';
    cardItem.style.display = 'none';
  }

  const configEnableItem = contextMenu.querySelector('[data-action="config-enable"]');
  const configDisableItem = contextMenu.querySelector('[data-action="config-disable"]');
  const configToggleItem = contextMenu.querySelector('[data-action="config-toggle"]');

  if (!isCreation && node && node.type === 'feature') {
    configEnableItem.style.display = '';
    configDisableItem.style.display = '';
    configToggleItem.style.display = '';
    // Hide delete in config mode
    contextMenu.querySelector('[data-action="delete"]').style.display = 'none';
  } else {
    configEnableItem.style.display = 'none';
    configDisableItem.style.display = 'none';
    configToggleItem.style.display = 'none';
    // Show delete in creation mode
    contextMenu.querySelector('[data-action="delete"]').style.display = isCreation ? '' : 'none';
  }

  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.classList.remove('hidden');
}

function handleContextAction(e) {
  const action = e.target.dataset.action;
  contextMenu.classList.add('hidden');

  if (!contextTarget) return;

  if (action === 'rename' && contextTarget.node) {
    openRenameModal(contextTarget.node);
  } else if (action === 'set-cardinality' && contextTarget.node) {
    openCardModal(contextTarget.node);
  } else if (action === 'config-enable') {
    const selected = canvas.getSelectedNodes().filter(n => n.type === 'feature');
    selected.forEach(n => graph.setSelected(n.id, true));
    config.onConfigChange();
  } else if (action === 'config-disable') {
    const selected = canvas.getSelectedNodes().filter(n => n.type === 'feature');
    selected.forEach(n => graph.setSelected(n.id, false));
    config.onConfigChange();
  } else if (action === 'config-toggle') {
    const selected = canvas.getSelectedNodes().filter(n => n.type === 'feature');
    selected.forEach(n => graph.toggleSelected(n.id));
    config.onConfigChange();
  } else if (action === 'delete') {
    if (contextTarget.node) {
      const selected = canvas.getSelectedNodes();
      // If the right-clicked node is part of a selection, delete the whole selection
      if (selected.some(n => n.id === contextTarget.node.id)) {
        selected.forEach(n => graph.removeNode(n.id));
        canvas.clearSelection();
      } else {
        graph.removeNode(contextTarget.node.id);
      }
    } else if (contextTarget.edge) {
      graph.removeEdge(contextTarget.edge.id);
    }
  }

  contextTarget = null;
}

// ──────────────────────────────────
// Rename modal
// ──────────────────────────────────

let renameTargetId = null;

function handleDoubleClick(node) {
  if (node.type === 'feature') {
    openRenameModal(node);
  } else if (node.type === 'cardinality') {
    openCardModal(node);
  }
}

function openRenameModal(node) {
  renameTargetId = node.id;
  modalTitle.textContent = 'Rename Feature';
  renameInput.value = node.name;
  renameModal.classList.remove('hidden');
  setTimeout(() => renameInput.focus(), 50);
}

function closeRenameModal() {
  renameModal.classList.add('hidden');
  renameTargetId = null;
}

function submitRename() {
  if (renameTargetId && renameInput.value.trim()) {
    graph.renameNode(renameTargetId, renameInput.value.trim());
  }
  closeRenameModal();
}

// ──────────────────────────────────
// Cardinality modal
// ──────────────────────────────────

let cardTargetId = null;

function openCardModal(node) {
  cardTargetId = node.id;
  cardMin.value = node.min || 1;
  cardMax.value = node.max || 1;
  cardinalityModal.classList.remove('hidden');
  setTimeout(() => cardMin.focus(), 50);
}

function closeCardModal() {
  cardinalityModal.classList.add('hidden');
  cardTargetId = null;
}

function submitCardinality() {
  if (cardTargetId) {
    const min = parseInt(cardMin.value, 10) || 0;
    const max = parseInt(cardMax.value, 10) || 1;
    graph.setCardinality(cardTargetId, Math.max(0, min), Math.max(min, max));
  }
  closeCardModal();
}

// ──────────────────────────────────
// Header actions
// ──────────────────────────────────



function handleExport() {
  const data = graph.serialize();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'feature-model.json';
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      graph.deserialize(data);
    } catch (err) {
      alert('Invalid JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be re-imported
  e.target.value = '';
}

function handleCopyJson() {
  let data;
  if (currentMode === 'creation') {
    data = graph.serialize();
  } else {
    data = {
      model: graph.serialize(),
      configuration: config.getConfigSerialization(),
    };
  }
  navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
    btnCopyJson.title = 'Copied!';
    setTimeout(() => (btnCopyJson.title = 'Copy JSON'), 2000);
  });
}

// ──────────────────────────────────
// Boot
// ──────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
