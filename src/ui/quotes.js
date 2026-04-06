import { getNodeDimensions, getNodePath } from '../model.js';

// Pool to avoid destroying and recreating SVG elements at 60fps (which causes OOM crashes and GC pauses)
const pooledNodes = [];

/**
 * Calculates and renders SVG dimension quotes (lines + text) 
 * floating natively over the 3D canvas via 2D projection.
 *
 * @param {Object} furniture
 * @param {string} selectedId
 * @param {Function} project3DTo2D
 */
export function renderQuotes(furniture, selectedId, project3DTo2D) {
  const overlay = document.getElementById('quotes-overlay');
  if (!overlay) return;

  let usedNodes = 0;

  function acquireNodes() {
    if (usedNodes < pooledNodes.length) {
      const nodes = pooledNodes[usedNodes];
      nodes.line.style.display = '';
      nodes.text.style.display = '';
      usedNodes++;
      return nodes;
    }
    
    // Create new ones if pool is empty
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'quote-line');
    overlay.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'quote-text');
    overlay.appendChild(text);

    const nodes = { line, text };
    pooledNodes.push(nodes);
    usedNodes++;
    return nodes;
  }

  function drawQuote(p1_3d, p2_3d, value) {
    if (value <= 20) return; // Hide dimension lines for extremely tiny spaces

    const sc1 = project3DTo2D(p1_3d[0], p1_3d[1], p1_3d[2]);
    const sc2 = project3DTo2D(p2_3d[0], p2_3d[1], p2_3d[2]);

    if (!sc1 || !sc2) return; // Behind camera

    const nodes = acquireNodes();

    nodes.line.setAttribute('x1', sc1.x);
    nodes.line.setAttribute('y1', sc1.y);
    nodes.line.setAttribute('x2', sc2.x);
    nodes.line.setAttribute('y2', sc2.y);

    const tX = (sc1.x + sc2.x) / 2;
    const tY = (sc1.y + sc2.y) / 2;
    
    nodes.text.setAttribute('x', tX);
    nodes.text.setAttribute('y', tY - 8); 
    nodes.text.textContent = `${Math.round(value)} mm`;
  }

  if (furniture && selectedId && project3DTo2D) {
    const dim = getNodeDimensions(furniture, selectedId);
    if (dim) {
      const zFront = furniture.depth + 10;
      const T = furniture.thickness;
      const gap = T / 2;
      
      const topY = dim.y + dim.h - Math.min(40, dim.h * 0.2);
      const leftX = dim.x + Math.min(40, dim.w * 0.2);

      const p1_w = [dim.x + gap, topY, zFront];
      const p2_w = [dim.x + dim.w - gap, topY, zFront];

      const p1_h = [leftX, dim.y + gap, zFront];
      const p2_h = [leftX, dim.y + dim.h - gap, zFront];

      drawQuote(p1_w, p2_w, dim.w);
      drawQuote(p1_h, p2_h, dim.h);

      if (selectedId === furniture.root.id) {
        drawQuote([0, -50, zFront], [furniture.width, -50, zFront], furniture.width);
        drawQuote([-50, 0, zFront], [-50, furniture.height, zFront], furniture.height);
      }
    }
  }

  // Hide any remaining pooled nodes that weren't used this frame
  for (let i = usedNodes; i < pooledNodes.length; i++) {
    pooledNodes[i].line.style.display = 'none';
    pooledNodes[i].text.style.display = 'none';
  }

  // Trim excess pool entries beyond a reasonable cap to prevent memory leaks
  const MAX_POOL = 20;
  while (pooledNodes.length > MAX_POOL && pooledNodes.length > usedNodes) {
    const excess = pooledNodes.pop();
    excess.line.remove();
    excess.text.remove();
  }
}

const pooledLockNodes = [];
let usedLockNodes = 0;

export function renderLocks(furniture, showLocks, project3DTo2D) {
  const overlay = document.getElementById('quotes-overlay');
  if (!overlay) return;

  usedLockNodes = 0;

  if (furniture && showLocks && project3DTo2D) {
    function traverse(node) {
      if (node.id !== furniture.root.id) {
        const dim = getNodeDimensions(furniture, node.id);
        const path = getNodePath(furniture.root, node.id);
        
        if (dim && path && path.length > 0) {
          let wLock = false;
          let hLock = false;

          for (let i = path.length - 1; i >= 1; i--) {
            const curr = path[i].node || path[i];
            const p = path[i - 1].node || path[i - 1];
            if (curr.locked) {
              if (p.direction === 'col') wLock = true;
              if (p.direction === 'row') hLock = true;
            }
          }

          const isLeaf = node.children.length === 0;
          const isCompletelyBlocked = wLock && hLock;
          
          // Draw standard edge lock if this specific node is locked
          const shouldDrawEdge = node.locked && !isCompletelyBlocked;
          const shouldDrawCenter = isLeaf && isCompletelyBlocked;

          if (shouldDrawEdge || shouldDrawCenter) {
            let targetX, targetY;
            let iconText = '🔒';
            let extraClass = '';

            if (shouldDrawCenter) {
              targetX = dim.x + (dim.w / 2);
              targetY = dim.y + (dim.h / 2);
              iconText = '🔒'; // could be a bigger emoji or we scale it via css class
              extraClass = ' lock-text-big';
            } else {
              const parentNode = path[path.length - 2].node || path[path.length - 2];
              if (parentNode.direction === 'col') {
                targetX = dim.x + (dim.w / 2);
                targetY = dim.y + dim.h - 5;
              } else {
                targetX = dim.x + dim.w - 15;
                targetY = dim.y + (dim.h / 2);
              }
            }

            const zFront = furniture.depth + 10;
            const sc = project3DTo2D(targetX, targetY, zFront);
            
            if (sc) {
              if (usedLockNodes >= pooledLockNodes.length) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('class', 'quote-text lock-text');
                overlay.appendChild(text);
                pooledLockNodes.push(text);
              }
              const textNode = pooledLockNodes[usedLockNodes];
              textNode.setAttribute('x', sc.x);
              textNode.setAttribute('y', sc.y);
              textNode.setAttribute('class', 'quote-text lock-text' + extraClass);
              
              // If it's a small compartment and we are drawing a center lock, maybe scale it down slightly?
              // Standard styling via CSS handles it.
              textNode.textContent = iconText;
              textNode.style.display = '';
              usedLockNodes++;
            }
          }
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    }
    traverse(furniture.root);
  }

  for (let i = usedLockNodes; i < pooledLockNodes.length; i++) {
    pooledLockNodes[i].style.display = 'none';
  }
}
