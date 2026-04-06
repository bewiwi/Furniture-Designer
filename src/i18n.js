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
    'tool.theme.title': 'Toggle Theme (Light / Dark)',
    'tool.undo': '↩ Undo',
    'tool.undo.title': 'Undo (Ctrl+Z)',
    'tool.redo': '↪ Redo',
    'tool.redo.title': 'Redo (Ctrl+Y)',
    'tool.export_stl': '⬇ STL',
    'tool.export_stl.title': 'Export STL',
    'tool.export_dxf': '⬇ DXF',
    'tool.export_dxf.title': 'Export DXF',
    'tool.export_plan': '📋 Plan',
    'tool.export_plan.title': 'Export detailed plan (PDF)',
    'tool.view.front': 'Front',
    'tool.view.top': 'Top',
    'tool.view.side': 'Side',
    'tool.view.iso': '3D View',
    'tool.toggle_locks': '👁️🔒',
    'tool.toggle_locks.title': 'Show locked dimensions in 3D',
    'tool.overlay.quotes':  'Quotes',
    'tool.overlay.locks':   'Locks',
    'tool.overlay.objects': 'Objects',
    'tool.overlay.label':   'View',
    'tool.overlay.title':   'Toggle overlays',
    'tool.export.label':    'Export',
    'tool.export.title':    'Export files',
    'view.design': 'Design',
    'view.cutlist': 'Cut List',
    'view.cutplan': 'Panel Plan',
    'view.tools': '3D Tools',
    
    // Tools
    'tools.description': 'Printable 3D guides to assist with drilling perfectly straight and aligned dowel holes.',
    'tools.edge_guide.title': 'Edge Guide',
    'tools.edge_guide.desc': 'A U-channel block to center the drill on the edge grain.',
    'tools.face_guide.title': 'Face Guide (Équerre)',
    'tools.face_guide.desc': 'An L-shaped registration piece to distance the drill perfectly from the edge for face holes.',
    'tools.download_stl': 'Download STL',


    // Cut List
    'cutlist.title': 'Cut List — {count} pieces ({unique} unique)',
    'cutlist.collapse': '▲ Collapse',
    'cutlist.expand': '▼ Expand',
    'cutlist.label': 'LABEL',
    'cutlist.qty': 'QTY',
    'cutlist.name': 'NAME',
    'cutlist.length': 'LENGTH',
    'cutlist.width': 'WIDTH',
    'cutlist.thickness': 'THICKNESS',
    'cutlist.type': 'TYPE',
    'cutlist.view_detail': 'View Detail',
    'cutlist.total_area': 'Total surface area: {area} m²',
    'cutplan.title': 'Panel Cut Plan',
    'cutplan.error.title': '⚠️ Pieces completely failed to fit',
    'cutplan.error.desc': '{count} piece(s) are too large to fit in a {w}x{h} panel. They were ignored from the cut plan. Please adjust your panel settings or furniture dimensions.',
    'cutplan.panel_width': 'Panel Width:',
    'cutplan.panel_height': 'Panel Height:',
    'cutplan.kerf': 'Kerf:',
    'cutplan.recalculate': 'Recalculate',
    'cutplan.total_panels': 'Total Panels Required: {count}',
    'cutplan.panel_number': 'Panel {num}',

    // Piece Detail
    'piece_detail.title': 'Piece {label}: {name}',
    'piece_detail.dimensions': 'Dimensions',
    'piece_detail.quantity': 'Quantity',
    'piece_detail.total_area': 'Total Area',
    'piece_detail.close': 'Close',

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
    // Dowel / Assembly Holes
    'form.dowel.title': 'Assembly Dowels',
    'form.dowel.diameter': 'Diameter',
    'form.dowel.dowelLength': 'Dowel Length',
    'form.dowel.margin': 'Edge Margin',
    'form.dowel.spacing': 'Spacing',
    'cutlist.holes': 'HOLES',
    'cutlist.holes_count': '{count} holes',
    'piece_detail.holes': 'Holes',
    'piece_detail.hole_spec': '{count}× Ø{diameter} ↧{depth}',
    'piece_detail.face_top': 'Top face',
    'piece_detail.face_bottom': 'Bottom face',
    'piece_detail.face_left': 'Left face',
    'piece_detail.face_right': 'Right face',

    'error.subdivisions_range': 'Number of subdivisions must be between 2 and 20',
    'error.not_enough_space': 'Not enough space for this subdivision',
    'error.invalid_child': 'Invalid child index',
    'error.neighbor_too_small': 'Neighboring compartment would be too small',
    'error.size_positive': 'Size must be positive',
    'error.last_free_child': 'Cannot lock the last remaining free compartment',
    'error.no_free_neighbor': 'No unlocked neighbor available to absorb the resize',

    // Object catalog
    'obj.tv_55': 'TV 55"',
    'obj.tv_42': 'TV 42"',
    'obj.switch': 'Switch Dock',
    'obj.xbox_one': 'Xbox One',
    'obj.xbox_x': 'Xbox Series X',
    'obj.ps5': 'PlayStation 5',
    'obj.books_row': 'Paperbacks (row)',
    'obj.books_grand': 'Large Format Books',
    'obj.kallax_tiroir': 'Kallax — Drawer',
    'obj.kallax_tiroir_2': 'Kallax — 2 Drawers',
    'obj.kallax_panier': 'Kallax — Basket',
    'obj.jeu_s': 'Board Game S',
    'obj.jeu_m': 'Board Game M',
    'obj.jeu_l': 'Board Game L',
    'obj.jeu_flat': 'Board Games (stacked)',
    'obj.vinyl_player': 'Turntable'
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
    'tool.theme.title': 'Changer le thème (Clair / Sombre)',
    'tool.undo': '↩ Undo',
    'tool.undo.title': 'Annuler (Ctrl+Z)',
    'tool.redo': '↪ Redo',
    'tool.redo.title': 'Rétablir (Ctrl+Y)',
    'tool.export_stl': '⬇ STL',
    'tool.export_stl.title': 'Exporter STL',
    'tool.export_dxf': '⬇ DXF',
    'tool.export_dxf.title': 'Exporter DXF',
    'tool.export_plan': '📋 Plan',
    'tool.export_plan.title': 'Exporter le plan détaillé (PDF)',
    'tool.view.front': 'Face',
    'tool.view.top': 'Dessus',
    'tool.view.side': 'Côté',
    'tool.view.iso': 'Vue 3D',
    'tool.toggle_locks': '👁️🔒',
    'tool.toggle_locks.title': 'Afficher les cotes verrouillées en 3D',
    'tool.overlay.quotes':  'Cotes',
    'tool.overlay.locks':   'Verrous',
    'tool.overlay.objects': 'Objets témoins',
    'tool.overlay.label':   'Affichage',
    'tool.overlay.title':   'Gérer les calques',
    'tool.export.label':    'Exporter',
    'tool.export.title':    'Exporter les fichiers',
    'view.design': 'Conception',
    'view.cutlist': 'Liste de Débit',
    'view.cutplan': 'Plan de Coupe',
    'view.tools': 'Outils 3D',

    // Tools
    'tools.description': 'Guides imprimables en 3D pour aider à percer des trous de tourillons droits et parfaitement alignés.',
    'tools.edge_guide.title': 'Guide de Chant',
    'tools.edge_guide.desc': 'Un bloc en U pour centrer le perçage sur le chant.',
    'tools.face_guide.title': 'Guide Équerre (Face)',
    'tools.face_guide.desc': 'Une équerre pour distancer parfaitement le foret par rapport au bord pour les trous de face.',
    'tools.download_stl': 'Télécharger STL',


    // Cut List
    'cutlist.title': 'Liste de débit — {count} pièces ({unique} uniques)',
    'cutlist.collapse': '▲ Replier',
    'cutlist.expand': '▼ Déplier',
    'cutlist.label': 'REPÈRE',
    'cutlist.qty': 'QTÉ',
    'cutlist.name': 'NOM',
    'cutlist.length': 'LONGUEUR',
    'cutlist.width': 'LARGEUR',
    'cutlist.thickness': 'ÉPAISSEUR',
    'cutlist.type': 'TYPE',
    'cutlist.view_detail': 'Voir Détail',
    'cutlist.total_area': 'Surface totale : {area} m²',
    'cutplan.title': 'Plan de Coupe des Panneaux',
    'cutplan.error.title': '⚠️ Pièces impossibles à placer',
    'cutplan.error.desc': '{count} pièce(s) sont trop grandes pour tenir dans un panneau de {w}x{h}. Elles ont été ignorées dans le plan de coupe. Veuillez ajuster les paramètres de vos panneaux ou les dimensions du meuble.',
    'cutplan.panel_width': 'Largeur Panneau :',
    'cutplan.panel_height': 'Hauteur Panneau :',
    'cutplan.kerf': 'Épaisseur lame :',
    'cutplan.recalculate': 'Recalculer',
    'cutplan.total_panels': 'Nombre total de panneaux requis : {count}',
    'cutplan.panel_number': 'Panneau {num}',

    // Piece Detail
    'piece_detail.title': 'Pièce {label} : {name}',
    'piece_detail.dimensions': 'Dimensions',
    'piece_detail.quantity': 'Quantité',
    'piece_detail.total_area': 'Surface Totale',
    'piece_detail.close': 'Fermer',

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
    // Tourillons / Perçages d'assemblage
    'form.dowel.title': 'Tourillons d\'assemblage',
    'form.dowel.diameter': 'Diamètre',
    'form.dowel.dowelLength': 'Longueur du tourillon',
    'form.dowel.margin': 'Marge au bord',
    'form.dowel.spacing': 'Espacement',
    'cutlist.holes': 'PERÇAGES',
    'cutlist.holes_count': '{count} perçages',
    'piece_detail.holes': 'Perçages',
    'piece_detail.hole_spec': '{count}× Ø{diameter} ↧{depth}',
    'piece_detail.face_top': 'Dessus',
    'piece_detail.face_bottom': 'Dessous',
    'piece_detail.face_left': 'Côté gauche',
    'piece_detail.face_right': 'Côté droit',

    'error.subdivisions_range': 'Le nombre de subdivisions doit être entre 2 et 20',
    'error.not_enough_space': 'Pas assez d\'espace pour cette subdivision',
    'error.invalid_child': 'Index enfant invalide',
    'error.neighbor_too_small': 'Le compartiment voisin serait trop petit',
    'error.size_positive': 'La taille doit être positive',
    'error.last_free_child': 'Impossible de verrouiller le dernier compartiment libre',
    'error.no_free_neighbor': 'Aucun voisin déverrouillé disponible pour absorber le changement',

    // Catalogue d'objets
    'obj.tv_55': 'Télé 55"',
    'obj.tv_42': 'Télé 42"',
    'obj.switch': 'Switch (Dock)',
    'obj.xbox_one': 'Xbox One',
    'obj.xbox_x': 'Xbox Series X',
    'obj.ps5': 'PlayStation 5',
    'obj.books_row': 'Livres poche (rangée)',
    'obj.books_grand': 'Livres grand format',
    'obj.kallax_tiroir': 'Kallax — Tiroir',
    'obj.kallax_tiroir_2': 'Kallax — Double tiroir',
    'obj.kallax_panier': 'Kallax — Panier',
    'obj.jeu_s': 'Jeu de plateau S',
    'obj.jeu_m': 'Jeu de plateau M',
    'obj.jeu_l': 'Jeu de plateau L',
    'obj.jeu_flat': 'Jeux (empilés)',
    'obj.vinyl_player': 'Platine Vinyle'
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
