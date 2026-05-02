# Projet CartoDyn — Carte Web Interactive (Région d'Ogou)

## Description du projet
Carte web interactive hébergée sur GitHub Pages, visualisant les résultats d'analyse
spatiale sur l'accessibilité à l'eau potable et les équipements dans la région d'Ogou.
Projet de Master, Université de Ngaoundéré.

## Stack technique
- **Carte** : Leaflet.js 1.9.4 (bibliothèque JavaScript open-source, aucune clé API requise)
- **Hébergement** : GitHub Pages (gratuit)
- **Données** : GeoJSON (fichiers locaux chargés via `fetch()`)
- **Pas de backend** : site 100% statique (HTML + CSS + JS)

## Structure du projet
```
cartodyn/
├── CLAUDE.md
├── index.html              ← page principale avec splash + modale + carte
├── css/
│   └── style.css           ← thème bleu foncé eau, splash, modal, sidebar
├── js/
│   └── carte.js            ← Leaflet, 9 couches GeoJSON, styles SLD
├── logo/
│   ├── logo_univ_ngaoundere.jfif   (Université de Ngaoundéré)
│   ├── logo_auf.png                (Agence Universitaire de la Francophonie)
│   └── logo_ogou1.jfif             (Région d'Ogou)
├── sld/                    ← styles QGIS (référence, ne pas modifier)
│   ├── Ogou_1.sld
│   ├── commune_environnent.sld
│   ├── Accessiblite_commune_500.sld
│   ├── equipement_par_canton.sld
│   ├── Hierarchie_priorite_amenagement.sld
│   ├── Equipement_par_grille.sld
│   ├── Accessibilite_500_par_grille.sld
│   ├── Zone_accessiblite_eau.sld
│   └── Infrasructure_eau_potable.sld
└── data/                   ← fichiers GeoJSON (ne pas modifier)
    ├── Ogou_1.geojson
    ├── commune_environnent.geojson
    ├── Accessiblite_commune_500.geojson
    ├── equipement_par_canton.geojson
    ├── Hierarchie_priorite_amenagement.geojson
    ├── Equipement_par_grille.geojson
    ├── Accessibilite_500_par_grille.geojson
    ├── Zone_accessiblite_eau.geojson
    └── Infrasructure_eau_potable.geojson
```

## Couches et styles (issus des SLD QGIS)

| N° | Fichier GeoJSON                        | Toggle ID        | Champ style          | Type style         |
|----|----------------------------------------|------------------|----------------------|--------------------|
| 1  | Ogou_1.geojson                         | tog-ogou         | —                    | Contour #232323    |
| 2  | commune_environnent.geojson            | tog-commenv      | commune_no           | Contour #e31a1c    |
| 3  | Accessiblite_commune_500.geojson       | tog-commune      | Rclas_prop           | Choroplèthe bleu   |
| 4  | equipement_par_canton.geojson          | tog-canton       | reclass_ecart        | Choroplèthe bleu   |
| 5  | Hierarchie_priorite_amenagement.geojson| tog-priorite     | rclass_priori3 (fallback: Rclass_priorite / Rclass_priorite_2) | Choroplèthe rouge  |
| 6  | Equipement_par_grille.geojson          | tog-equipgrille  | densitenumpsup (→ texte) | Choroplèthe bleu |
| 7  | Accessibilite_500_par_grille.geojson   | tog-accessgrille | Rclss_prop           | Choroplèthe rouge  |
| 8  | Zone_accessiblite_eau.geojson          | tog-zoneeau      | —                    | Contour #1f78b4    |
| 9  | Infrasructure_eau_potable.geojson      | tog-infra        | —                    | Point #2200ff      |
| 10 | (OSM tile)                             | tog-osm          | —                    | Fond de carte      |

## Colonnes clés dans les données
- `Rclas_prop` : classe d'accessibilité par commune ("faible accès", "accès moyen", "bon accès")
- `reclass_ecart` : classe équipement canton ("Bien équipé", "Moyennement équipé", "Sous-équipé")
- `rclass_priori3` : classe de priorité d'aménagement (peut aussi s'appeler Rclass_priorite)
- `densitenumpsup` : densité numérique équipement/grille (valeur numérique → libellé texte)
- `Rclss_prop` : classe accessibilité grille ("0 % - Pas d'accès", "1 à 50 %", …)
- `Pop_Tot` : population totale
- `commune_no` : nom de la commune
- `Oldcanton1` : nom du canton
- `region_nom`, `prefecture` : niveaux administratifs supérieurs

## Éléments HTML critiques (IDs à ne pas changer)

```
id="splash-screen"      → écran d'accueil (fade-out après chargement)
id="progress-bar"       → barre de progression (width en %)
id="splash-pct"         → pourcentage affiché
id="splash-msg"         → message de chargement courant
id="modal-help"         → modale d'aide (display:flex / none)
id="info-box"           → panneau info survol (panneau droit)
id="stat-infra"         → compteur points d'eau (rempli par JS)
id="coords-display"     → coordonnées curseur (footer)
id="btn-home"           → recadrage sur zone d'étude
id="btn-fullscreen"     → plein écran
```

## Conventions de code
- Tout en français dans les labels, popups et légendes
- Palette bleu foncé (#08306b) pour la thématique eau
- Choroplèthe communes/grille accès : rouge (fort) pour accessibilité totale, blanc pour absence
- Choroplèthe équipements : bleu foncé (bien équipé) → bleu clair (sous-équipé)
- Popups au clic avec les infos clés (nom, score, population, classe)
- Mini-légendes dans la sidebar, synchronisées avec le toggle (JS inline)
- sessionStorage : modale d'aide affichée une seule fois par session

## UX — Flux d'ouverture
1. **Splash screen** : logos (Ngaoundéré → AUF → Ogou), titre, barre de progression, messages
2. Après chargement des 9 couches : fondu du splash
3. **Modale d'aide** : guide navigation (une seule fois par session via sessionStorage)
4. **Carte interactive** : header + sidebar + map + panneau stats

## Déploiement GitHub Pages
- Repo : à créer sur le compte GitHub (ezechielametovena18@gmail.com)
- Branch : `main` → Pages activé sur `/` (racine)
- URL finale : `https://[username].github.io/cartodyn`
- ⚠️ Tester en local d'abord avec un serveur HTTP (voir ci-dessous)

## Test local (avant GitHub Pages)
Les fichiers GeoJSON sont chargés via `fetch()` → fichier `file://` bloqué par CORS.
Il faut un serveur HTTP local :

```bash
# Python 3 (depuis le dossier cartodyn/)
python -m http.server 8000
# → ouvrir http://localhost:8000 dans le navigateur
```

Ou utiliser l'extension **Live Server** dans VS Code (clic droit → Open with Live Server).
