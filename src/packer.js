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
    if (root.used) {
      const node = findNode(root.right, w, h);
      if (node) return node;
      return findNode(root.down, w, h);
    }
    else if ((w <= root.w && h <= root.h)) {
      return { node: root, rotated: false };
    }
    // Try rotated
    else if ((h <= root.w && w <= root.h)) {
      return { node: root, rotated: true };
    }
    return null;
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
