# Conception 3D & Modélisation

Le **Meuble Designer** repose sur un concept de partitionnement spatial récursif. Au lieu de dessiner des planches une par une sur un croquis, vous définissez des volumes fonctionnels, et la géométrie algorithmique résout elle-même les intersections et l'épaisseur des planches. Cela garantit que votre meuble reste mathématiquement parfait et physiquement viable à tout moment.

![Interface Conception](/images/design-fr.png)

## Contraintes Globales
Votre conception commence par définir les limites absolues du caisson :
*   **Dimensions Extérieures** : Largeur, hauteur et profondeur totales du meuble.
*   **Épaisseur du Matériau** : L'épaisseur du bois est appliquée uniformément sur toutes les planches. Modifiez-la, et tous les compartiments intérieurs se recalculent dynamiquement pour compenser.

## Création de Compartiments
En sélectionnant n'importe quel nœud 3D (soit en cliquant directement sur le modèle 3D, soit en le sélectionnant via l'arborescence de gauche), vous pouvez scinder l'espace :
- **Rangées (Rows / Horizontaux)** : Découpe l'espace vertical disponible.
- **Colonnes (Cols / Verticaux)** : Découpe l'espace horizontal disponible.

Vous pouvez imbriquer des colonnes dans des rangées à l'infini.

## Contrôle Avancé des Dimensions
Le logiciel répartit par défaut l'espace de manière égale.
- **Verrouillage des Cotes 🔒** : Vous pouvez verrouiller la dimension d'un compartiment (en millimètres) pour garantir qu'il ne se redimensionnera pas tout seul. C'est crucial lorsque vous concevez une niche pour un amplificateur qui doit faire exactement 430mm de large.
- **Égaliser les Tailles ⚖** : Si vous avez ajouté ou supprimé un casier, cliquez sur "Égaliser" pour redistribuer équitablement l'espace restant entre vos compartiments non verrouillés.
- **Redimensionnement Intelligent** : Si vous modifiez manuellement la taille d'un compartiment non verrouillé, le logiciel va automatiquement "voler" l'espace de son voisin non verrouillé le plus proche. Les dimensions extérieures du meuble ne sont jamais brisées.

## Calques & Objets Témoins
L'interface propose des outils visuels puissants :
- **Cotes (Quotes)** : Affichez les mesures absolues directement sur la vue 3D.
- **Verrous (Locks)** : Souligne visuellement les compartiments dont les dimensions sont rendues rigides.
- **Objets Témoins** : Faites apparaître des objets de référence 3D à l'échelle dans vos compartiments (ex: **TV 55"**, **Xbox Series X**, **Platine Vinyle** ou **Panier IKEA Kallax**). Ces maquettes vous garantissent que vos affaires rentreront de manière certaine !
