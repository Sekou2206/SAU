# SAUTI — Ta valeur en mouvement

Site animé au défilement (Three.js r170 + Anton), tous les fichiers à la racine.

## Lancer en local

```bash
cd ~/Downloads/SAUTI-visibilite && code . && python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080 (un serveur local est nécessaire : le script est un module ES).

## Fichiers

- `index.html`, `style.css`, `motion.js`
- `three.module.min.js` (Three.js r170, licence MIT)
- `anton.woff2` (police Anton, licence SIL OFL)
- `sauti-clair.png`, `sauti-sombre.png`, `sauti-orange.png`, `sauti-signature.png`

## Réservation

Dans `motion.js`, renseigner `BOOKING_URL` (Calendly, Cal.com…) pour que les boutons « Réserver 45 minutes » ouvrent directement l’agenda.
