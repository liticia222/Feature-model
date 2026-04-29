/**
 * toolbar.js — Drag-and-drop toolbar for creating nodes
 */

import * as graph from './graph.js';
import * as canvas from './canvas.js';

export function init() {
  const toolbarNodes = document.querySelectorAll('.toolbar-node[draggable]');

  for (const el of toolbarNodes) {
    el.addEventListener('dragstart', (e) => {
      const type = el.dataset.type;
      e.dataTransfer.setData('node-type', type);
      e.dataTransfer.effectAllowed = 'copy';

      // Create a drag image
      const ghost = el.cloneNode(true);
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      ghost.style.opacity = '0.8';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 20);
      setTimeout(() => ghost.remove(), 0);
    });
  }

  // Canvas drop zone
  const canvasContainer = document.getElementById('canvas-container');

  canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type');
    if (!type) return;

    const pos = canvas.getDropPosition(e.clientX, e.clientY);
    if (!pos) return;

    graph.addNode(type, pos.x, pos.y);
  });
}
