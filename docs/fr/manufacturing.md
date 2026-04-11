# Fabrication & Optimisation

Une fois le plan 3D abouti, passez à la production en scierie.

![Interface Fabrication](/images/manufacturing-fr.png)

## La Liste de Débit (Cut List)
La liste de coupe dresse l'inventaire plat de toutes les planches de bois individuelles requises pour assembler le meuble.

- **Déductions d'épaisseur** : L'algorithme gère de façon inhérente les intersections (les étagères s'arrêtent naturellement contre les montants verticaux). Les dimensions listées ici sont définitives et exactes.
- **Regroupement** : Les planches identiques sont groupées par quantité.
- **Surface Totale** : Observez la surface exacte (en m²) de matière première consommée pour vous aider à deviser vos achats.
- **Hardware** : Anticipez le nombre de tourillons en bois nécessaires à l'assemblage complet.
- **Exportation** : Exportez cette vue sous forme de Plan PDF très lisible, conçu pour être imprimé et apporté à l'établi.

## Le Plan de Coupe (Cut Plan Packer)
Plutôt que d'essayer de résoudre vous-même comment tailler vos 12 planches dans un grand panneau standard du commerce, le **Panificateur** agit comme un solveur (2D Bin Packing).

### Fonctionnalités de l'Optimiseur
- **Taille de lame (Kerf)** : Renseignez l'épaisseur de votre lame de scie circulaire (ex: 3mm). Le moteur de packing respecte scrupuleusement cette zone perdue entre chaque découpe.
- **Panneaux Commerciaux Mixtes** : Acheter de petites plaques peut parfois s'avérer moins cher que réduire un immense panneau standard en copeaux. Vous pouvez configurer plusieurs tailles de panneaux (Ex: Plaque 2440x1220 à 45€, et Plaque 1220x600 à 15€).
- **Algorithme "Smart Mix"** : L'algorithme calcule les combinaisons et vous propose la combinaison de panneaux absolue **la moins chère** de votre panier.
- **Rotations** : Le moteur tente des rotations intelligentes pour maximiser la densité d'agencement.

*Note: Toutes les pièces qui physiquement refusent de rentrer dans la plus grande plaque que vous avez saisie sont listées en erreur afin de vous avertir.*
