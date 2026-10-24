# SAUTI, ta valeur en mouvement

Site animé au défilement (Three.js r170 + Anton), tous les fichiers à la racine.

Le point rouge du logo tombe au premier coup de scroll, devient un ballon en 3D, rebondit sur le titre « Construisons ta visibilité », puis sur le texte en haut à droite, et finit sa course à côté du personnage. Il l'accompagne ensuite du chapitre 1 au chapitre 4.

Palette stricte : #ff4328, #fffefa, #000000 (textes, fonds, logos, matières 3D). À la fin du 4, il remplit l'écran et fait passer le site au rouge.

## Lancer en local

```bash
cd ~/Downloads/SAUTI-ballon && open -a "Visual Studio Code" . && python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080 (un serveur local est nécessaire : le script est un module ES).

## Fichiers

- `index.html`, `style.css`, `motion.js`
- `three.module.min.js` (Three.js r170, licence MIT)
- `anton.woff2` (police Anton, licence SIL OFL)
- `sauti-clair.png`, `sauti-sombre.png`, `sauti-orange.png`, `sauti-signature.png`
- `sauti-clair-vide.png`, `sauti-sombre-vide.png`, `sauti-signature-vide.png` : le logo sans son point, affiché pendant que le ballon est dans la scène

## Réglages du ballon (motion.js)

- `DROP0` : départ du point depuis le logo (en secondes de film, sur 48).
- `HIT1`, `HIT2` : rebond sur le titre, puis sur le texte en haut à droite.
- `LAND`, `BOUNCE2` à `BOUNCE4` : arrivée au sol et petits rebonds à côté du personnage.
- `FILL0`, `FILL1` : début et fin du remplissage rouge à la fin du chapitre 4.
- Chapitre 6 (33 à 38 s) : le ballon devient un signal et les gens viennent entourer le personnage.
- Chapitre 7 (38 à 44 s) : le ballon allume NIKE, VANS et NBA AFRICA, puis se pose sur le panneau SAUTI à la place du point du logo.
- Le film dure 48 secondes de défilement.

## Réservation

Dans `motion.js`, renseigner `BOOKING_URL` (Calendly, Cal.com…) pour que les boutons « Réserver 45 minutes » ouvrent directement l’agenda.
