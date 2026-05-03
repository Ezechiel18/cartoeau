# Cartoeau — Carte interactive d'accessibilité à l'eau potable

### Commune d'Ogou 1, Togo

> Projet de Master GAGER — Université de Ngaoundéré  
> Réalisé par **Ezéchiel Ametovena** · 2026

---

## Présentation

Cartoeau est une carte web interactive développée dans le cadre d'un mémoire de Master en Géomatique, Aménagement et Gestion de l'Environnement et des Ressources (GAGER) à l'Université de Ngaoundéré.

Elle visualise les résultats d'une **analyse spatiale de l'accessibilité aux infrastructures en eau potable** dans la commune d'Ogou 1 (Togo), en s'appuyant sur des méthodes de géotraitement avancées : densité spatiale, z-score, proportion d'accessibilité cantonale (PAC), grille hexagonale 500 × 500 m, analyse multicritère et hiérarchisation des zones prioritaires.

🌐 **Carte en ligne** : [https://ezechiel18.github.io/cartoeau](https://ezechiel18.github.io/cartoeau)

---

## Fonctionnalités

- 9 couches thématiques activables/désactivables (accessibilité, équipements, priorités, buffer eau, infrastructures)
- 4 fonds de carte : OpenStreetMap, Satellite (Esri), CartoDB clair, Topographique
- Regroupement automatique (clustering) des points d'eau potable
- Panneau de statistiques dynamiques calculées depuis les données GeoJSON
- Téléchargement par couche en GeoJSON ou CSV
- Requêtes et filtres par attribut avec export du résultat
- Réorganisation des couches par glisser-déposer
- Impression en PDF avec en-tête et pied de page personnalisés
- Interface 100 % responsive, sans backend ni clé API

---

## Stack technique

| Composant | Technologie |
| --- | --- |
| Carte | [Leaflet.js 1.9.4](https://leafletjs.com/) |
| Clustering | [Leaflet.markercluster 1.4.1](https://github.com/Leaflet/Leaflet.markercluster) |
| Glisser-déposer | [SortableJS 1.15.0](https://sortablejs.github.io/Sortable/) |
| Données | GeoJSON (fichiers locaux, `fetch()`) |
| Styles | CSS3 pur, thème bleu foncé |
| Hébergement | GitHub Pages (statique, gratuit) |

---

## Structure du projet

```
cartoeau/
├── index.html                  ← page principale
├── css/style.css               ← styles de l'interface
├── js/carte.js                 ← logique cartographique
├── data/                       ← couches GeoJSON (9 fichiers)
├── logo/                       ← logos institutionnels
├── sld/                        ← styles QGIS de référence
└── memoire/                    ← mémoire complet (PDF)
```

---

## Données

| Couche | Description |
| --- | --- |
| Ogou_1 | Limite de la zone d'étude |
| commune_environnent | Communes voisines (contexte) |
| Accessiblite_commune_500 | Accessibilité par canton (buffer 500 m) |
| equipement_par_canton | Niveau d'équipement par canton |
| Hierarchie_priorite_amenagement | Zones prioritaires d'intervention |
| Equipement_par_grille | Équipements sur grille 500 × 500 m |
| Accessibilite_500_par_grille | Accessibilité sur grille 500 × 500 m |
| Zone_accessiblite_eau | Buffer 500 m autour des points d'eau |
| Infrasructure_eau_potable | Points d'eau potable (bornes fontaines, forages) |

**Sources :** Géodata Gouvernement Togo · RGPH-5 · © OpenStreetMap contributors  
**Projection :** WGS 84 (EPSG:4326)

---

## Test en local

Les fichiers GeoJSON étant chargés via `fetch()`, il faut un serveur HTTP local (le double-clic sur `index.html` ne suffit pas).

```bash
# Python 3
cd cartoeau/
python -m http.server 8000
# Ouvrir http://localhost:8000
```

Ou utiliser l'extension **Live Server** dans VS Code.

---

## Auteur

**Ezéchiel Ametovena**  
Master GAGER — Université de Ngaoundéré  
[LinkedIn](https://www.linkedin.com/in/ez%C3%A9chiel-ametovena-5a48a1196/)

---

*Projet académique — Université de Ngaoundéré · Agence Universitaire de la Francophonie (AUF) · 2026*
