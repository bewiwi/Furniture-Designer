# Assemblage & Impression 3D

Ce logiciel privilégie la conception invisible par chevilles en bois (tourillons).

![Interface Outils d'Assemblage](/images/assembly-fr.png)

## Calcul des Perçages
Les positions des tourillons sont déduites algorithmiquement à chaque croisement parfait de deux planches (ex: une étagère reposant contre un montant).

Vous maîtrisez les paramètres globaux d'assemblage :
*   **Diamètre** : Historiquement 8mm.
*   **Longueur du Tourillon** : Indiquez la longueur physique d'un tourillon. L'algorithme se chargera de calculer les profondeurs respectives de vos forets selon qu'ils percent en face ou en traverse.
*   **Marge au Bord** : La distance de sécurité depuis les angles.
*   **Espacement** : L'écart maximal toléré entre deux tourillons consécutifs sur de grandes intersections.

## Gabarits Imprimables 3D (Jigs)
Percer de manière parfaitement perpendiculaire avec une cale s'apprend difficilement. Pour annuler ce risque d'erreur au montage, le système génère ses propres **Guides d'Imprimante 3D** calibrés et ajustés *à la fraction de millimètre* de l'épaisseur du meuble.

### 1. Le Guide de Chant (Edge Guide)
Un bloc en profilé-U pensé pour engloutir le chant de la planche. Il offre un unique trou pilote parfaitement centré pour lisser le parcours de votre mèche à bois sans jamais dévier.

### 2. Le Guide de Face (Guide Équerre)
Une pièce avec ergot (forme de L) qui viendra s'ancrer dans le vide sur la surface du panneau. Le trou pilote est décalé pour s'assurer que les connecteurs correspondent symétriquement et fermement au morceau de bois de chant opposé.

### Exportations
- **STL** : Téléchargez les gabarits, envoyez-les dans Cura/PrusaSlicer, et imprimez (généralement aucune structure de support nécessaire et imprimable en moins d'une heure).
- **DXF** : Les puristes opérant avec une défonceuse numérique (CNC) peuvent récupérer l'ensemble de la coupe 2D superposée.
