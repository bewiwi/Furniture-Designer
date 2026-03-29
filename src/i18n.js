const dictionaries = {
  en: {
    // General
    'app.title': 'Furniture Designer',
    'app.default_name': 'My Furniture',

    // Tree (Hierarchy)
    'tree.title': 'Hierarchy',
    'tree.compartment': 'Compartment',
    'tree.rows': 'Rows',
    'tree.columns': 'Columns',

    // Form (Properties)
    'form.title.root': 'Furniture Properties',
    'form.title.node': 'Compartment Properties',
    'form.empty': 'Select a compartment',
    'form.dims.global': 'Furniture Dimensions',
    'form.dims.name': 'Name',
    'form.dims.width': 'Width',
    'form.dims.height': 'Height',
    'form.dims.depth': 'Depth',
    'form.dims.thickness': 'Thickness',
    'form.dims.actual': 'Actual Dimensions',
    'form.sub.add': 'Add Subdivisions',
    'form.sub.help': 'Divide this compartment into multiple parts.',
    'form.sub.btn_row': '↔ Rows',
    'form.sub.btn_col': '↕ Columns',
    'form.sub.remove': '🗑️ Remove Subdivisions',
    'form.sub.remove_single': 'Remove this compartment',
    'form.sub.add_single_row': '+ Add Row',
    'form.sub.add_single_col': '+ Add Column',
    'form.sub.lock_toggle': 'Toggle size lock',
    'form.sub.move_up': 'Move up',
    'form.sub.move_down': 'Move down',
    'form.sub.row_prefix': 'Row',
    'form.sub.col_prefix': 'Column',
    'form.sub.equalize': '⚖ Equalize Sizes',

    // Toolbar
    'tool.new': '📄 New',
    'tool.new.title': 'New Furniture',
    'tool.new.confirm': 'Create new furniture? Unsaved changes will be lost.',
    'tool.open': '📂 Open',
    'tool.open.title': 'Open JSON',
    'tool.save': '💾 Save',
    'tool.save.title': 'Save JSON (Ctrl+S)',
    'tool.undo': '↩ Undo',
    'tool.undo.title': 'Undo (Ctrl+Z)',
    'tool.redo': '↪ Redo',
    'tool.redo.title': 'Redo (Ctrl+Y)',
    'tool.export_stl': '⬇ STL',
    'tool.export_stl.title': 'Export STL',
    'tool.export_dxf': '⬇ DXF',
    'tool.export_dxf.title': 'Export DXF',
    'tool.view.front': 'Front',
    'tool.view.top': 'Top',
    'tool.view.side': 'Side',
    'tool.view.iso': '3D View',

    // Cut List
    'cutlist.title': 'Cut List — {count} pieces ({unique} unique)',
    'cutlist.collapse': '▲ Collapse',
    'cutlist.expand': '▼ Expand',
    'cutlist.qty': 'QTY',
    'cutlist.name': 'NAME',
    'cutlist.length': 'LENGTH',
    'cutlist.width': 'WIDTH',
    'cutlist.thickness': 'THICKNESS',
    'cutlist.type': 'TYPE',
    'cutlist.total_area': 'Total surface area: {area} m²',

    // Planks & Errors
    'type.frameV': 'V Frame',
    'type.frameH': 'H Frame',
    'type.shelf': 'H Shelf',
    'type.separator': 'V Sep.',
    'plank.left_upright': 'Left upright',
    'plank.right_upright': 'Right upright',
    'plank.bottom_rail': 'Bottom rail',
    'plank.top_rail': 'Top rail',
    'plank.shelf': 'Shelf',
    'plank.separator': 'Separator',
    'error.subdivisions_range': 'Number of subdivisions must be between 2 and 20',
    'error.not_enough_space': 'Not enough space for this subdivision',
    'error.invalid_child': 'Invalid child index',
    'error.neighbor_too_small': 'Neighboring compartment would be too small',
    'error.size_positive': 'Size must be positive',
    'error.last_free_child': 'Cannot lock the last remaining free compartment',
    'error.no_free_neighbor': 'No unlocked neighbor available to absorb the resize'
  },
  fr: {
    // General
    'app.title': 'Meuble Designer',
    'app.default_name': 'Mon Meuble',

    // Tree (Hierarchy)
    'tree.title': 'Structure',
    'tree.compartment': 'Compartiment',
    'tree.rows': 'Rangées',
    'tree.columns': 'Colonnes',

    // Form (Properties)
    'form.title.root': 'Propriétés du meuble',
    'form.title.node': 'Propriétés du compartiment',
    'form.empty': 'Sélectionnez un compartiment',
    'form.dims.global': 'Dimensions Globales',
    'form.dims.name': 'Nom',
    'form.dims.width': 'Largeur',
    'form.dims.height': 'Hauteur',
    'form.dims.depth': 'Profondeur',
    'form.dims.thickness': 'Épaisseur',
    'form.dims.actual': 'Dimensions Réelles',
    'form.sub.add': 'Ajouter des subdivisions',
    'form.sub.help': 'Diviser ce compartiment en plusieurs parties.',
    'form.sub.btn_row': '↔ Rangées',
    'form.sub.btn_col': '↕ Colonnes',
    'form.sub.remove': '🗑️ Supprimer subdivisions',
    'form.sub.remove_single': 'Supprimer ce compartiment',
    'form.sub.add_single_row': '+ Ajouter une Rangée',
    'form.sub.add_single_col': '+ Ajouter une Colonne',
    'form.sub.lock_toggle': 'Verrouiller/Déverrouiller la taille',
    'form.sub.move_up': 'Déplacer vers le haut',
    'form.sub.move_down': 'Déplacer vers le bas',
    'form.sub.row_prefix': 'Rangée',
    'form.sub.col_prefix': 'Colonne',
    'form.sub.equalize': '⚖ Égaliser les tailles',

    // Toolbar
    'tool.new': '📄 Nouveau',
    'tool.new.title': 'Nouveau Meuble',
    'tool.new.confirm': 'Créer un nouveau meuble ? Les changements non sauvegardés seront perdus.',
    'tool.open': '📂 Ouvrir',
    'tool.open.title': 'Ouvrir JSON',
    'tool.save': '💾 Sauver',
    'tool.save.title': 'Sauvegarder JSON (Ctrl+S)',
    'tool.undo': '↩ Undo',
    'tool.undo.title': 'Annuler (Ctrl+Z)',
    'tool.redo': '↪ Redo',
    'tool.redo.title': 'Rétablir (Ctrl+Y)',
    'tool.export_stl': '⬇ STL',
    'tool.export_stl.title': 'Exporter STL',
    'tool.export_dxf': '⬇ DXF',
    'tool.export_dxf.title': 'Exporter DXF',
    'tool.view.front': 'Face',
    'tool.view.top': 'Dessus',
    'tool.view.side': 'Côté',
    'tool.view.iso': 'Vue 3D',

    // Cut List
    'cutlist.title': 'Liste de débit — {count} pièces ({unique} uniques)',
    'cutlist.collapse': '▲ Replier',
    'cutlist.expand': '▼ Déplier',
    'cutlist.qty': 'QTÉ',
    'cutlist.name': 'NOM',
    'cutlist.length': 'LONGUEUR',
    'cutlist.width': 'LARGEUR',
    'cutlist.thickness': 'ÉPAISSEUR',
    'cutlist.type': 'TYPE',
    'cutlist.total_area': 'Surface totale : {area} m²',

    // Planks & Errors
    'type.frameV': 'Cadre V',
    'type.frameH': 'Cadre H',
    'type.shelf': 'Étagère',
    'type.separator': 'Séparation',
    'plank.left_upright': 'Montant gauche',
    'plank.right_upright': 'Montant droit',
    'plank.bottom_rail': 'Traverse basse',
    'plank.top_rail': 'Traverse haute',
    'plank.shelf': 'Étagère',
    'plank.separator': 'Séparation',
    'error.subdivisions_range': 'Le nombre de subdivisions doit être entre 2 et 20',
    'error.not_enough_space': 'Pas assez d\'espace pour cette subdivision',
    'error.invalid_child': 'Index enfant invalide',
    'error.neighbor_too_small': 'Le compartiment voisin serait trop petit',
    'error.size_positive': 'La taille doit être positive',
    'error.last_free_child': 'Impossible de verrouiller le dernier compartiment libre',
    'error.no_free_neighbor': 'Aucun voisin déverrouillé disponible pour absorber le changement'
  }
};

let currentLang = 'en';

export function setLanguage(lang) {
  if (dictionaries[lang]) {
    currentLang = lang;
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key, params = {}) {
  const dict = dictionaries[currentLang] ?? dictionaries['en'];
  let str = dict[key] ?? key;

  // Simple string interpolation for params, e.g., {count}
  // Uses replaceAll instead of RegExp to avoid GC pressure and metacharacter bugs
  for (const [k, v] of Object.entries(params)) {
    str = str.replaceAll(`{${k}}`, v);
  }

  return str;
}
