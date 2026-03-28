# Meuble Designer — Design Document

## Résumé

Application web de conception de meubles (étagères, bibliothèques) basée sur une approche par compartiments. L'utilisateur définit les dimensions globales du meuble, puis subdivise récursivement l'espace en rangées et colonnes. La visualisation 3D est assurée par JSCAD.

## Contexte

L'utilisateur fabrique ses meubles et a besoin d'un outil pour :
- Concevoir la structure avant fabrication
- Obtenir la liste de débit (toutes les planches à découper)
- Exporter en STL/DXF pour d'autres logiciels

## Décisions de conception

### Approche "compartiments"
L'utilisateur raisonne en **espaces** : "je divise mon meuble en 3 rangées, la rangée du bas en 8 colonnes", plutôt qu'en coordonnées de planches. Le logiciel déduit automatiquement les planches nécessaires.

### Contraintes simplificatrices
- **Profondeur unique** : toutes les planches ont la même profondeur
- **Épaisseur unique** : toutes les planches ont la même épaisseur
- Cela simplifie considérablement le modèle de données et la génération 3D

### Stack technique
- **HTML/CSS/JS** vanilla (pas de framework frontend)
- **Vite** comme bundler (nécessaire pour les imports JSCAD)
- **@jscad/modeling** : génération de géométrie 3D
- **@jscad/regl-renderer** : rendu WebGL dans le navigateur
- **@jscad/stl-serializer** + **@jscad/dxf-serializer** : export
- Pas de backend

## Architecture

### Layout de l'interface

```
┌─────────────────────────────────────────────────────┐
│  Toolbar (nouveau, ouvrir, sauver, exporter)        │
├────────────┬──────────────────────┬─────────────────┤
│  Arbre     │   Vue 3D JSCAD      │   Formulaire    │
│  structure │   (regl-renderer)    │   propriétés    │
├────────────┴──────────────────────┴─────────────────┤
│  Liste de débit (tableau des planches à découper)   │
└─────────────────────────────────────────────────────┘
```

### Modèle de données

```javascript
{
  name: "Ma bibliothèque",
  width: 1000,       // mm
  height: 2000,      // mm  
  depth: 300,        // mm
  thickness: 18,     // mm
  root: {
    direction: "row",  // "row" = subdivisé horizontalement, "col" = verticalement
    children: [
      {
        size: 250,     // mm
        direction: "col",
        children: [
          { size: 500 },
          { size: 500 }
        ]
      },
      { size: 400 },
      { size: 400 }
    ]
  }
}
```

### Génération des planches

À partir de l'arbre de compartiments, le système génère la liste des planches :
1. Le **cadre extérieur** : 2 montants verticaux + 2 traverses horizontales (haut/bas)
2. Pour chaque subdivision : une planche de séparation (horizontale si `direction: "row"`, verticale si `direction: "col"`)
3. L'épaisseur des planches est prise en compte dans le calcul des dimensions internes

### Sauvegarde

- **Export/Import JSON** : téléchargement/chargement de fichier `.json`
- **Auto-save localStorage** : sauvegarde à chaque modification avec historique des versions (undo)

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| Paramètres globaux | Largeur, hauteur, profondeur, épaisseur |
| Subdiviser | Diviser un compartiment en N rangées ou N colonnes |
| Redimensionner | Modifier la taille d'un compartiment |
| Supprimer | Supprimer une subdivision |
| Vue 3D | Preview JSCAD temps réel avec rotation/zoom/pan |
| Liste de débit | Tableau auto-généré des pièces à découper |
| Export JSON | Sauvegarder/charger le projet |
| Export STL | Pour impression 3D ou import CAD |
| Export DXF | Pour découpe ou dessin technique |
| Auto-save | localStorage avec historique |
