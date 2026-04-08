export function packPlanks(planks, panelWidth, panelHeight, kerf) {
  const panels = [];
  const unplaced = [];
  
  // Flatten planks (2 largest dimensions are used for 2D)
  const items = planks.map(p => {
    const dims = [p.w, p.h, p.d].sort((a,b) => b - a);
    return { ...p, pw: dims[0], ph: dims[1] };
  });

  // Sort by area (largest first)
  items.sort((a, b) => (b.pw * b.ph) - (a.pw * a.ph));

  function createNode(x, y, w, h) {
    return { x, y, w, h, used: false, right: null, down: null };
  }

  function findNode(root, w, h) {
    let best = null;
    let bestScore = Infinity;

    function search(node) {
      if (!node) return;
      if (node.used) {
        search(node.right);
        search(node.down);
      } else {
        // Try unrotated
        if (w <= node.w && h <= node.h) {
          const score = Math.min(node.w - w, node.h - h);
          if (score < bestScore) {
            best = { node, rotated: false };
            bestScore = score;
          }
        }
        // Try rotated
        if (h <= node.w && w <= node.h) {
          const score = Math.min(node.w - h, node.h - w);
          if (score < bestScore) {
            best = { node, rotated: true };
            bestScore = score;
          }
        }
      }
    }

    search(root);
    return best;
  }

  function splitNode(node, w, h) {
    node.used = true;
    // Add kerf to piece dimensions for remaining space
    const totalW = w + kerf;
    const totalH = h + kerf;

    // Guillotine split - choose axis that leaves largest single area
    const spaceRight = node.w - totalW;
    const spaceDown = node.h - totalH;

    if (spaceRight > spaceDown) { // Split vertically
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, h);
      node.down  = createNode(node.x, node.y + totalH, node.w, node.h - totalH);
    } else { // Split horizontally
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, node.h);
      node.down  = createNode(node.x, node.y + totalH, w, node.h - totalH);
    }
    return node;
  }

  for (const item of items) {
    const w = item.pw;
    const h = item.ph;
    
    let placed = false;
    // Try existing panels
    for (const panel of panels) {
      const match = findNode(panel.root, w, h);
      if (match) {
        splitNode(match.node, match.rotated ? h : w, match.rotated ? w : h);
        panel.placements.push({
          item,
          rect: { x: match.node.x, y: match.node.y, w: match.rotated ? h : w, h: match.rotated ? w : h }
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Add new panel
      const newPanel = {
        root: createNode(0, 0, panelWidth, panelHeight),
        placements: []
      };
      const match = findNode(newPanel.root, w, h);
      if (match) {
        splitNode(match.node, match.rotated ? h : w, match.rotated ? w : h);
        newPanel.placements.push({
          item,
          rect: { x: match.node.x, y: match.node.y, w: match.rotated ? h : w, h: match.rotated ? w : h }
        });
        panels.push(newPanel);
      } else {
        unplaced.push(item);
      }
    }
  }

  return { panels, unplaced };
}

/**
 * Smart-mix packer: places each piece on the cheapest already-open panel
 * that fits, or opens a new panel of the cheapest fitting kind.
 *
 * @param {Object[]} planks - Planks with pw/ph already computed (2 largest dims)
 * @param {Object[]} panelKinds - Array of { id, name, width, height, pricePerPanel }
 * @param {number} kerf - Saw blade kerf in mm
 * @returns {{ panels: Object[], unplaced: Object[], totalCost: number, kindCosts: Object }}
 */
export function packPlanksSmartMix(planks, panelKinds, kerf) {
  // Normalize: ensure pw/ph exist (in case raw planks are passed without pre-computation)
  const items = planks.map(p => {
    if (p.pw !== undefined) return p;
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    return { ...p, pw: dims[0], ph: dims[1] };
  });

  // Sort by area descending so largest pieces are placed first
  items.sort((a, b) => (b.pw * b.ph) - (a.pw * a.ph));

  // Sort kinds by price ascending so cheapest is tried first when opening a new panel
  const sortedKinds = [...panelKinds].sort((a, b) => a.pricePerPanel - b.pricePerPanel);

  const openPanels = []; // { kind, root, placements }
  const unplaced = [];

  function createNode(x, y, w, h) {
    return { x, y, w, h, used: false, right: null, down: null };
  }

  function findNode(root, w, h) {
    let best = null;
    let bestScore = Infinity;
    function search(node) {
      if (!node) return;
      if (node.used) {
        search(node.right);
        search(node.down);
      } else {
        if (w <= node.w && h <= node.h) {
          const score = Math.min(node.w - w, node.h - h);
          if (score < bestScore) { best = { node, rotated: false }; bestScore = score; }
        }
        if (h <= node.w && w <= node.h) {
          const score = Math.min(node.w - h, node.h - w);
          if (score < bestScore) { best = { node, rotated: true }; bestScore = score; }
        }
      }
    }
    search(root);
    return best;
  }

  function splitNode(node, w, h) {
    node.used = true;
    const totalW = w + kerf;
    const totalH = h + kerf;
    const spaceRight = node.w - totalW;
    const spaceDown = node.h - totalH;
    if (spaceRight > spaceDown) {
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, h);
      node.down  = createNode(node.x, node.y + totalH, node.w, node.h - totalH);
    } else {
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, node.h);
      node.down  = createNode(node.x, node.y + totalH, w, node.h - totalH);
    }
    return node;
  }

  for (const item of items) {
    const w = item.pw;
    const h = item.ph;
    let placed = false;

    // 1. Try existing open panels — prefer cheapest kind's panels first
    const sorted = [...openPanels].sort((a, b) => a.kind.pricePerPanel - b.kind.pricePerPanel);
    for (const panel of sorted) {
      const match = findNode(panel.root, w, h);
      if (match) {
        const rw = match.rotated ? h : w;
        const rh = match.rotated ? w : h;
        splitNode(match.node, rw, rh);
        panel.placements.push({ item, rect: { x: match.node.x, y: match.node.y, w: rw, h: rh } });
        placed = true;
        break;
      }
    }

    // 2. Open a new panel — use cheapest kind where the piece fits
    if (!placed) {
      for (const kind of sortedKinds) {
        const newPanel = {
          kind,
          root: createNode(0, 0, kind.width, kind.height),
          placements: [],
        };
        const match = findNode(newPanel.root, w, h);
        if (match) {
          const rw = match.rotated ? h : w;
          const rh = match.rotated ? w : h;
          splitNode(match.node, rw, rh);
          newPanel.placements.push({ item, rect: { x: match.node.x, y: match.node.y, w: rw, h: rh } });
          openPanels.push(newPanel);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      unplaced.push(item);
    }
  }

  // Compute per-kind cost breakdown
  const kindCosts = {};
  for (const panel of openPanels) {
    const id = panel.kind.id;
    if (!kindCosts[id]) kindCosts[id] = { kind: panel.kind, count: 0, subtotal: 0 };
    kindCosts[id].count++;
    kindCosts[id].subtotal += panel.kind.pricePerPanel;
  }
  const totalCost = Object.values(kindCosts).reduce((s, k) => s + k.subtotal, 0);

  return { panels: openPanels, unplaced, totalCost, kindCosts };
}
