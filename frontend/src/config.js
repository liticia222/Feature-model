/**
 * config.js — Configuration mode logic
 */

import * as graph from './graph.js';
import { validateConfiguration } from './api.js';

let validationBar = null;
let validationIcon = null;
let validationText = null;
let btnVerify = null;

export function init() {
  validationBar = document.getElementById('validation-bar');
  validationIcon = document.getElementById('validation-icon');
  validationText = document.getElementById('validation-text');
  btnVerify = document.getElementById('btn-verify');
}

export function enter() {
  for (const node of graph.getNodes()) {
    if (node.selected === undefined) {
      node.selected = false;
    }
  }
  graph.clearValidationState();
  validationBar.classList.remove('is-hidden');
  setStatus('idle', 'Click Verify to check configuration');
}

export function leave() {
  validationBar.classList.add('is-hidden');
}

export function onConfigChange() {
  setStatus('idle', 'Unsaved changes (click Verify to check)');
}

export async function runValidation() {
  setStatus('checking', 'Validating configuration…');
  const model = graph.serialize();
  const selectedFeatures = graph.getNodes()
    .filter((n) => n.type === 'feature' && n.selected)
    .map((n) => n.id);

  if (selectedFeatures.length === 0) {
    setStatus('idle', 'No features selected');
    graph.applyValidationState([]);
    return;
  }

  const result = await validateConfiguration(model, { selectedFeatures });

  if (result.valid) {
    setStatus('valid', '✓ Configuration is valid');
    graph.applyValidationState([]);
  } else {
    setStatus('invalid', `✗ ${result.message || 'Invalid configuration'}`);
    graph.applyValidationState(result.problematicFeatures || []);
  }
}

function setStatus(state, text) {
  validationIcon.className = `validation-icon ${state}`;
  validationText.textContent = text;

  // Update button color
  btnVerify.classList.remove('success', 'danger', 'warning');
  if (state === 'valid') {
    btnVerify.classList.add('success');
  } else if (state === 'invalid') {
    btnVerify.classList.add('danger');
  } else {
    btnVerify.classList.add('warning');
  }
}

export function getConfigSerialization() {
  const nodes = graph.getNodes();
  const featureNodes = nodes.filter((n) => n.type === 'feature');
  return {
    features: featureNodes.map((n) => ({
      id: n.id,
      name: n.name,
      selected: !!n.selected,
    })),
    selectedFeatures: featureNodes
      .filter((n) => n.selected)
      .map((n) => n.id),
  };
}
