/* ================================================================
   CartoDyn — Carte interactive | Commune d'Ogou 1, Togo
   Analyse spatiale de l'accessibilité aux infrastructures en eau potable
   Master GAGER, Université de Ngaoundéré — Ezéchiel Ametovena, 2026
   ================================================================
   Styles reproduits fidèlement depuis les fichiers SLD QGIS
   ================================================================ */

'use strict';

// ── Styles SLD ──────────────────────────────────────────────────
const SLD = {
  ogou:    { color: '#232323', weight: 2, fillOpacity: 0 },
  commEnv: { color: '#e31a1c', weight: 1, fillOpacity: 0 },
  commune: {
    'faible accès': '#f7fbff',
    'accès moyen':  '#73b2d8',
    'bon accès':    '#08306b',
    stroke: '#232323', strokeW: 0.5
  },
  canton: {
    'Bien équipé':        { fill: '#1f78b4', opacity: 0.56 },
    'Moyennement équipé': { fill: '#52fdf3', opacity: 0.47 },
    'Sous-équipé':        { fill: '#35b3eb', opacity: 0.19 },
    stroke: '#232323', strokeW: 1
  },
  priorite: {
    'Zone peu prioritaire':      '#fff5f0',
    'Zone prioritaire':          '#fdccb8',
    'Zone priorité moyenne':     '#fc8f6f',
    'Zone très faible priorité': '#f44d38',
    'Zone très prioritaire':     '#c5161c',
    'Absence de logement':       '#cccccb',
    stroke: '#232323', strokeW: 1
  },
  equipGrille: {
    classes: [
      { min: 0,  max: 0,  fill: '#f7fbff', label: "Absence d'équipement" },
      { min: 0,  max: 4,  fill: '#c8dcf0', label: 'Très peu équipé'      },
      { min: 4,  max: 12, fill: '#73b2d8', label: 'Peu équipé'           },
      { min: 12, max: 28, fill: '#2979b9', label: 'Bien équipé'          },
      { min: 28, max: 40, fill: '#08306b', label: 'Très bien équipé'     }
    ],
    stroke: '#232323', strokeW: 1
  },
  accessGrille: {
    "0 % - Pas d'accès":       '#fff5f0',
    '1 à 50 % - Faible accès': '#fdccb8',
    '51 à 75 % - Accès moyen': '#fc8f6f',
    '76 à 99 % - Bon accès':   '#f44d38',
    '100 % - Accès total':     '#c5161c',
    'Absence de bâtiment':     '#969696',
    stroke: '#232323', strokeW: 1
  },
  infra:   { color: '#2200ff', radius: 6, strokeColor: '#2200ff', strokeW: 1.5 },
  zoneEau: { color: '#1f78b4', weight: 2, fillOpacity: 0 }
};

// ── Fonctions couleur ────────────────────────────────────────────
function couleurCommune(prop) { return SLD.commune[prop] || '#cccccc'; }

function couleurCanton(prop) {
  const c = SLD.canton[prop];
  return c || { fill: '#cccccc', opacity: 0.5 };
}

function couleurPriorite(prop) { return SLD.priorite[prop] || null; }

function couleurEquipGrille(val) {
  if (val === null || val === undefined) return '#cccccc';
  if (val === 0) return SLD.equipGrille.classes[0].fill;
  for (let i = 1; i < SLD.equipGrille.classes.length; i++) {
    const c = SLD.equipGrille.classes[i];
    if (val > c.min && val <= c.max) return c.fill;
  }
  return '#08306b';
}

function labelEquipGrille(val) {
  if (val === null || val === undefined) return '—';
  if (val === 0) return SLD.equipGrille.classes[0].label;
  for (let i = 1; i < SLD.equipGrille.classes.length; i++) {
    const c = SLD.equipGrille.classes[i];
    if (val > c.min && val <= c.max) return c.label;
  }
  return 'Très bien équipé';
}

function couleurAccessGrille(prop) { return SLD.accessGrille[prop] || '#cccccc'; }

// ── Carte Leaflet ────────────────────────────────────────────────
const map = L.map('map', {
  center: [7.62, 1.23],
  zoom: 10,
  zoomControl: false,
  attributionControl: false
});

L.control.zoom({ position: 'topleft' }).addTo(map);
L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

// ── Fonds de carte ───────────────────────────────────────────────
const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap contributors'
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, attribution: '© Esri, Maxar, GeoEye'
  }),
  carto: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, attribution: '© CartoDB, © OpenStreetMap contributors'
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17, attribution: '© OpenTopoMap, © OpenStreetMap contributors'
  })
};

let activeBasemap = 'osm';
basemaps.osm.addTo(map);

window.switchBasemap = function(name) {
  if (activeBasemap === name) return;
  if (basemaps[activeBasemap]) map.removeLayer(basemaps[activeBasemap]);
  basemaps[name].addTo(map);
  basemaps[name].bringToBack();
  activeBasemap = name;
  document.querySelectorAll('.bm-radio').forEach(r => {
    r.classList.toggle('active', r.dataset.bm === name);
  });
};

// Coordonnées curseur → footer
map.on('mousemove', e => {
  const el = document.getElementById('coords-display');
  if (el) el.textContent =
    'Lat : ' + e.latlng.lat.toFixed(5) + '°N  ·  Lon : ' + e.latlng.lng.toFixed(5) + '°E';
});

// ── Gestion chargement ───────────────────────────────────────────
let nbLoaded = 0;
const NB_TOTAL = 9;

function onLayerLoaded() {
  nbLoaded++;
  const pct   = Math.round((nbLoaded / NB_TOTAL) * 100);
  const bar   = document.getElementById('progress-bar');
  const pctEl = document.getElementById('splash-pct');
  const msgEl = document.getElementById('splash-msg');
  const msgs  = [
    'Chargement des limites administratives…',
    'Chargement des communes environnantes…',
    'Chargement de l\'accessibilité par canton…',
    'Chargement des équipements par canton…',
    'Chargement des priorités d\'aménagement…',
    'Chargement de la grille équipements…',
    'Chargement de la grille accessibilité…',
    'Chargement des zones buffer eau…',
    'Chargement des infrastructures eau…',
    'Carte prête !'
  ];
  if (bar)   bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + ' %';
  if (msgEl) msgEl.textContent = msgs[Math.min(nbLoaded, msgs.length - 1)];
  if (nbLoaded >= NB_TOTAL) setTimeout(() => { hideSplash(); showHelp(); }, 600);
}

function hideSplash() {
  const s = document.getElementById('splash-screen');
  if (s) { s.style.opacity = '0'; setTimeout(() => s.style.display = 'none', 500); }
}

function showHelp() {
  const h = document.getElementById('modal-help');
  if (h && !sessionStorage.getItem('help-seen')) {
    h.style.display = 'flex';
    sessionStorage.setItem('help-seen', '1');
  }
}

window.closeHelp = function() {
  const h = document.getElementById('modal-help');
  if (h) h.style.display = 'none';
};

// ── Références couches ───────────────────────────────────────────
let lOgou, lCommEnv, lCommune, lCanton, lPriorite,
    lEquipGrille, lAccessGrille, lZoneEau, lCluster;

// Stockage GeoJSON brut (téléchargement + requêtes)
const RAW = {};

// ── Popup générique ──────────────────────────────────────────────
function makePopup(titre, rows) {
  const lignes = rows
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  return `<div class="popup-inner"><h3>${titre}</h3><table>${lignes}</table></div>`;
}

// ── Info box survol ──────────────────────────────────────────────
function updateInfo(titre, lignes) {
  const box = document.getElementById('info-box');
  if (!box) return;
  box.innerHTML = `<h4>${titre}</h4><p>${lignes}</p>`;
}

function resetInfo() {
  const box = document.getElementById('info-box');
  if (box) box.innerHTML = '<p class="info-hint">Survoler une zone pour voir les détails</p>';
}

// ── Téléchargement couches ───────────────────────────────────────
window.downloadLayer = function(key, format) {
  const data = RAW[key];
  if (!data) { alert('Cette couche n\'est pas encore chargée.'); return; }
  if (format === 'geojson') {
    _triggerDL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      key + '.geojson'
    );
  } else {
    if (!data.features || !data.features.length) return;
    const keys = Object.keys(data.features[0].properties);
    const rows = data.features.map(f =>
      keys.map(k => {
        const v = f.properties[k];
        return (v !== null && v !== undefined)
          ? '"' + String(v).replace(/"/g, '""') + '"' : '';
      }).join(',')
    );
    _triggerDL(
      new Blob(['﻿' + [keys.join(','), ...rows].join('\n')], { type: 'text/csv' }),
      key + '.csv'
    );
  }
};

function _triggerDL(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Spatial : point-dans-polygone (pour trouver le canton des grilles) ──
function _ptInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}

function getCantonForPoint(lng, lat) {
  if (!RAW.canton || !RAW.canton.features) return '—';
  for (const f of RAW.canton.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon'
      ? [g.coordinates]
      : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      if (_ptInRing(lng, lat, poly[0])) {
        return f.properties.Oldcanton1 || '—';
      }
    }
  }
  return '—';
}

// Centroïde approximatif d'un feature polygone
function featureCentroid(feature) {
  const g = feature.geometry;
  if (!g) return [0, 0];
  const ring = g.type === 'Polygon'
    ? g.coordinates[0]
    : g.type === 'MultiPolygon' ? g.coordinates[0][0] : [];
  if (!ring.length) return [0, 0];
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  return [lng, lat];
}

// ── Stats dynamiques ─────────────────────────────────────────────

function buildCantonCards(data) {
  const container = document.getElementById('canton-cards');
  if (!container || !data.features) return;
  const cantons = {};
  data.features.forEach(f => {
    const nom = f.properties.Oldcanton1 || '?';
    if (!cantons[nom]) cantons[nom] = f.properties.reclass_ecart || '—';
  });
  const styles = {
    'Bien équipé':        { bg: '#dbeafe', color: '#1e40af' },
    'Moyennement équipé': { bg: '#cffafe', color: '#0e7490' },
    'Sous-équipé':        { bg: '#e0f2fe', color: '#0369a1' }
  };
  const html = Object.entries(cantons).map(([nom, cls]) => {
    const s = styles[cls] || { bg: '#f3f4f6', color: '#555' };
    return `<div class="canton-card">
      <div class="canton-name">${nom}</div>
      <span class="badge" style="background:${s.bg};color:${s.color}">${cls}</span>
    </div>`;
  }).join('');
  container.innerHTML = html || '<p style="color:#aaa;font-size:11px">Données non disponibles</p>';
}

function buildAccessBars(data) {
  const container = document.getElementById('access-bars');
  if (!container || !data.features) return;
  const cantons = {};
  data.features.forEach(f => {
    const p   = f.properties;
    const nom = p.Oldcanton1 || p.commune_no || '?';
    let val   = p.prop_acces;
    if (val !== null && val !== undefined) {
      if (val <= 1) val = val * 100;
      cantons[nom] = Math.round(val);
    }
  });
  function barColor(v) {
    if (v >= 70) return '#08306b';
    if (v >= 60) return '#73b2d8';
    return '#c8dcf0';
  }
  const sorted = Object.entries(cantons).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    container.innerHTML = '<p style="color:#aaa;font-size:11px">Données non disponibles</p>';
    return;
  }
  container.innerHTML = sorted.map(([nom, val]) =>
    `<div class="bar-row">
      <div class="bar-label">${nom}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${val}%;background:${barColor(val)}"></div>
      </div>
      <div class="bar-val">${val} %</div>
    </div>`
  ).join('');
}

// Stats accès total par canton — données mémoire (Tableau 4)
function buildCantonAccessStats() {
  const container = document.getElementById('canton-access-stats');
  if (!container) return;
  // Source : Tableau 4, mémoire GAGER — Ezéchiel Ametovena 2026
  const data = [
    { nom: 'Gnagna', superficie: 64.57,  habitee: 37.56, accesTotal: 13.926, pctHab: 58.17, pctAcces: 37.1 },
    { nom: 'Djama',  superficie: 233.37, habitee: 81.24, accesTotal: 21.522, pctHab: 34.81, pctAcces: 26.5 },
    { nom: 'Houdou', superficie: 169.22, habitee: 50.64, accesTotal: 11.394, pctHab: 29.93, pctAcces: 22.5 }
  ];
  function barColor(v) {
    if (v >= 35) return '#08306b';
    if (v >= 27) return '#2979b9';
    return '#73b2d8';
  }
  container.innerHTML = data.map(d =>
    `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <span style="font-size:11px;font-weight:600;color:#333">${d.nom}</span>
        <span style="font-size:10px;color:#666">${d.pctAcces} %</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${d.pctAcces}%;background:${barColor(d.pctAcces)}"></div>
      </div>
      <div style="font-size:9px;color:#aaa;margin-top:2px">
        Zone habitée : ${d.habitee} ha · Accès total : ${d.accesTotal} ha
      </div>
    </div>`
  ).join('');
}

// ── Requêtes ─────────────────────────────────────────────────────
const QUERY_FIELDS = {
  commune:     ['Rclas_prop', 'Oldcanton1', 'commune_no', 'Pop_Tot', 'prop_acces', 'Score_norm'],
  canton:      ['reclass_ecart', 'Oldcanton1', 'commune_no', 'NUMPOINTS', 'Score_normalise'],
  priorite:    ['rclass_priori3', 'Rclass_priorite', 'Oldcanton1', 'commune_no', 'SP_pource'],
  equipGrille: ['densitenumpsup', 'Oldcanton1', 'commune_no', 'NUMPOINTS'],
  accessGrille:['Rclss_prop', 'Oldcanton1', 'commune_no', 'Prop_acc_2'],
  infra:       ['canton_nom', 'commune_no', 'organisme', 'borne_font', 'nom_locali']
};

let queryResult = null;

window.updateQueryFields = function() {
  const layerEl = document.getElementById('q-layer');
  const fieldEl = document.getElementById('q-field');
  if (!layerEl || !fieldEl) return;
  const fields = QUERY_FIELDS[layerEl.value] || [];
  fieldEl.innerHTML = fields.map(f => `<option value="${f}">${f}</option>`).join('');
  window.updateQueryValues();
};

window.updateQueryValues = function() {
  const layerEl = document.getElementById('q-layer');
  const fieldEl = document.getElementById('q-field');
  const dl = document.getElementById('q-val-list');
  if (!layerEl || !fieldEl || !dl) return;
  dl.innerHTML = '';
  const data = RAW[layerEl.value];
  if (!data || !data.features) return;
  const field = fieldEl.value;
  const vals = new Set();
  data.features.forEach(f => {
    const v = f.properties[field];
    if (v !== null && v !== undefined && v !== '') vals.add(String(v));
  });
  vals.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    dl.appendChild(opt);
  });
};

window.runQuery = function() {
  const layerKey = document.getElementById('q-layer').value;
  const field    = document.getElementById('q-field').value;
  const op       = document.getElementById('q-op').value;
  const val      = document.getElementById('q-val').value.trim();
  const resultEl = document.getElementById('q-result');
  const dlBtn    = document.getElementById('q-dl-btn');
  const data     = RAW[layerKey];

  if (!data || !data.features) {
    if (resultEl) resultEl.textContent = '⚠ Couche pas encore chargée.';
    return;
  }
  queryResult = {
    type: 'FeatureCollection',
    features: data.features.filter(f => {
      const fVal = f.properties[field];
      if (fVal === null || fVal === undefined) return false;
      const fStr = String(fVal).toLowerCase();
      const vStr = val.toLowerCase();
      switch (op) {
        case 'eq':       return fStr === vStr;
        case 'neq':      return fStr !== vStr;
        case 'contains': return fStr.includes(vStr);
        case 'gt':       return parseFloat(fVal) > parseFloat(val);
        case 'lt':       return parseFloat(fVal) < parseFloat(val);
        default:         return false;
      }
    })
  };
  const n = queryResult.features.length;
  if (resultEl) resultEl.textContent =
    `→ ${n} entité${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''}${n === 0 ? ' — modifier les critères' : ''}`;
  if (dlBtn) dlBtn.disabled = n === 0;
};

window.downloadQueryResult = function() {
  if (!queryResult || !queryResult.features.length) return;
  const layerKey = document.getElementById('q-layer').value;
  const field    = document.getElementById('q-field').value;
  const val      = document.getElementById('q-val').value.trim();
  const format   = document.getElementById('q-format').value;
  const fn = ('requete_' + layerKey + '_' + field + '_' + val)
    .replace(/[\s\/\\:*?"<>|]/g, '_').substring(0, 60);

  if (format === 'geojson') {
    _triggerDL(
      new Blob([JSON.stringify(queryResult, null, 2)], { type: 'application/json' }),
      fn + '.geojson'
    );
  } else {
    const keys = Object.keys(queryResult.features[0].properties);
    const rows = queryResult.features.map(f =>
      keys.map(k => {
        const v = f.properties[k];
        return (v !== null && v !== undefined)
          ? '"' + String(v).replace(/"/g, '""') + '"' : '';
      }).join(',')
    );
    _triggerDL(
      new Blob(['﻿' + [keys.join(','), ...rows].join('\n')], { type: 'text/csv' }),
      fn + '.csv'
    );
  }
};

window.openQuery  = function() {
  document.getElementById('modal-query').style.display = 'flex';
  window.updateQueryValues();
};
window.closeQuery = function() {
  document.getElementById('modal-query').style.display = 'none';
};

// ── Couches GeoJSON ───────────────────────────────────────────────

// 1 — Limite Ogou 1
fetch('data/Ogou_1.geojson').then(r => r.json()).then(d => {
  RAW.ogou = d;
  lOgou = L.geoJSON(d, {
    style: { color: SLD.ogou.color, weight: SLD.ogou.weight, fillOpacity: 0 }
  }).addTo(map);
  map.fitBounds(lOgou.getBounds(), { padding: [30, 30] });
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 2 — Communes environnantes
fetch('data/commune_environnent.geojson').then(r => r.json()).then(d => {
  RAW.commEnv = d;
  lCommEnv = L.geoJSON(d, {
    style: { color: SLD.commEnv.color, weight: SLD.commEnv.weight, fillOpacity: 0 },
    onEachFeature: (ft, layer) => {
      const nom = ft.properties.commune_no || '';
      if (nom) layer.bindTooltip(nom, {
        permanent: true, direction: 'center', className: 'comm-label'
      });
      layer.bindPopup(makePopup(nom, [
        ['Région',     ft.properties.region_nom],
        ['Préfecture', ft.properties.prefectu_1 || ft.properties.prefecture]
      ]));
    }
  });
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 3 — Accessibilité par canton
fetch('data/Accessiblite_commune_500.geojson').then(r => r.json()).then(d => {
  RAW.commune = d;
  lCommune = L.geoJSON(d, {
    style: ft => ({
      fillColor: couleurCommune(ft.properties.Rclas_prop),
      color: SLD.commune.stroke,
      weight: SLD.commune.strokeW,
      fillOpacity: 0.85
    }),
    onEachFeature: (ft, layer) => {
      const p   = ft.properties;
      const pct = p.prop_acces !== null && p.prop_acces !== undefined
        ? (p.prop_acces <= 1 ? (p.prop_acces * 100).toFixed(1) : p.prop_acces.toFixed(1)) + ' %'
        : '—';
      layer.bindPopup(makePopup(p.Oldcanton1 || p.commune_no, [
        ['Commune',                  p.commune_no],
        ['Canton',                   p.Oldcanton1],
        ['Population totale',        p.Pop_Tot ? p.Pop_Tot.toLocaleString('fr-FR') : '—'],
        ['Accès eau (classe)',        p.Rclas_prop],
        ['Prop. bâtim. accessibles', pct],
        ['Nbre bâtiments',           p.nbre_build ? p.nbre_build.toLocaleString('fr-FR') : '—'],
        ['Score normalisé',          p.Score_norm !== null && p.Score_norm !== undefined
                                       ? p.Score_norm.toFixed(2) : '—']
      ]), { maxWidth: 290 });
      layer.on({
        mouseover: e => {
          e.target.setStyle({ weight: 2, color: '#111' });
          updateInfo(p.Oldcanton1 || p.commune_no,
            `Commune : <b>${p.commune_no || '—'}</b><br>` +
            `Accès : <b>${p.Rclas_prop || '—'}</b><br>` +
            `Population : <b>${p.Pop_Tot ? p.Pop_Tot.toLocaleString('fr-FR') : '—'}</b>`);
        },
        mouseout: e => { if (lCommune) lCommune.resetStyle(e.target); resetInfo(); }
      });
    }
  }).addTo(map);
  buildAccessBars(d);
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 4 — Équipements par canton
fetch('data/equipement_par_canton.geojson').then(r => r.json()).then(d => {
  RAW.canton = d;
  lCanton = L.geoJSON(d, {
    style: ft => {
      const c = couleurCanton(ft.properties.reclass_ecart);
      return {
        fillColor:   c.fill,
        color:       SLD.canton.stroke,
        weight:      SLD.canton.strokeW,
        fillOpacity: c.opacity
      };
    },
    onEachFeature: (ft, layer) => {
      const p = ft.properties;
      layer.bindPopup(makePopup(p.Oldcanton1, [
        ['Commune',         p.commune_no],
        ['Pop. canton',     p.OldCantonP ? Math.round(p.OldCantonP).toLocaleString('fr-FR') : '—'],
        ['Nbre localités',  p.OldLocalit],
        ['Équipements',     p.NUMPOINTS || 0],
        ['Classe',          p.reclass_ecart],
        ['Score normalisé', p.Score_normalise !== null && p.Score_normalise !== undefined
                              ? p.Score_normalise.toFixed(2) : '—']
      ]), { maxWidth: 260 });
      layer.on({
        mouseover: e => {
          e.target.setStyle({ weight: 2, color: '#111' });
          updateInfo(p.Oldcanton1,
            `Commune : <b>${p.commune_no}</b><br>` +
            `Classe : <b>${p.reclass_ecart || '—'}</b><br>` +
            `Équipements : <b>${p.NUMPOINTS || 0}</b>`);
        },
        mouseout: e => { if (lCanton) lCanton.resetStyle(e.target); resetInfo(); }
      });
    }
  });
  buildCantonCards(d);
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 5 — Priorités d'aménagement
fetch('data/Hierarchie_priorite_amenagement.geojson').then(r => r.json()).then(d => {
  RAW.priorite = d;
  lPriorite = L.geoJSON(d, {
    style: ft => {
      const p    = ft.properties;
      const cls  = p.rclass_priori3 || p.Rclass_priorite || p.Rclass_priorite_2;
      const fill = couleurPriorite(cls);
      return {
        fillColor:   fill || 'transparent',
        color:       SLD.priorite.stroke,
        weight:      SLD.priorite.strokeW,
        fillOpacity: fill ? 0.85 : 0
      };
    },
    onEachFeature: (ft, layer) => {
      const p   = ft.properties;
      const cls = p.rclass_priori3 || p.Rclass_priorite || p.Rclass_priorite_2;
      if (!cls) return;
      layer.bindPopup(makePopup('Zone d\'aménagement', [
        ['Canton',          p.Oldcanton1],
        ['Commune',         p.commune_no],
        ['Classe priorité', cls],
        ['Score (%)',        p.SP_pource !== null && p.SP_pource !== undefined
                              ? p.SP_pource + ' %' : '—'],
        ['Accès eau',       p.Prop_acc_2 !== null && p.Prop_acc_2 !== undefined
                              ? p.Prop_acc_2 + ' %' : '—'],
        ['Équipements',     p.NUMPOINTS || 0]
      ]), { maxWidth: 260 });
      layer.on({
        mouseover: e => {
          e.target.setStyle({ weight: 2, color: '#111' });
          updateInfo('Zone d\'aménagement',
            `Canton : <b>${p.Oldcanton1 || '—'}</b><br>` +
            `Priorité : <b>${cls}</b><br>` +
            `Score : <b>${p.SP_pource !== null && p.SP_pource !== undefined
                          ? p.SP_pource + ' %' : '—'}</b>`);
        },
        mouseout: e => { if (lPriorite) lPriorite.resetStyle(e.target); resetInfo(); }
      });
    }
  });
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 6 — Équipements par grille
fetch('data/Equipement_par_grille.geojson').then(r => r.json()).then(d => {
  RAW.equipGrille = d;
  lEquipGrille = L.geoJSON(d, {
    style: ft => ({
      fillColor:   couleurEquipGrille(ft.properties.densitenumpsup),
      color:       SLD.equipGrille.stroke,
      weight:      SLD.equipGrille.strokeW,
      fillOpacity: 0.8
    }),
    onEachFeature: (ft, layer) => {
      const p    = ft.properties;
      const lbl  = labelEquipGrille(p.densitenumpsup);
      const ctrd = featureCentroid(ft);
      layer.bindPopup(() => {
        const canton = getCantonForPoint(ctrd[0], ctrd[1]);
        return makePopup('Équipement (grille)', [
          ['Canton',          canton],
          ['Commune',         p.commune_no || '—'],
          ['Densité équip.',  p.densitenumpsup !== null ? p.densitenumpsup : '—'],
          ['Classe',          lbl],
          ['Nbre équipements',p.NUMPOINTS !== null ? p.NUMPOINTS : '—']
        ]);
      }, { maxWidth: 240 });
      layer.on({
        mouseover: e => {
          e.target.setStyle({ weight: 2, color: '#111' });
          const canton = getCantonForPoint(ctrd[0], ctrd[1]);
          updateInfo('Grille équipement',
            `Canton : <b>${canton}</b><br>` +
            `Classe : <b>${lbl}</b><br>` +
            `Densité : <b>${p.densitenumpsup !== null ? p.densitenumpsup : '—'}</b>`);
        },
        mouseout: e => { if (lEquipGrille) lEquipGrille.resetStyle(e.target); resetInfo(); }
      });
    }
  });
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 7 — Accessibilité par grille
fetch('data/Accessibilite_500_par_grille.geojson').then(r => r.json()).then(d => {
  RAW.accessGrille = d;
  lAccessGrille = L.geoJSON(d, {
    style: ft => ({
      fillColor:   couleurAccessGrille(ft.properties.Rclss_prop),
      color:       ft.properties.Rclss_prop === 'Absence de bâtiment' ? '#000' : SLD.accessGrille.stroke,
      weight:      SLD.accessGrille.strokeW,
      fillOpacity: 0.8
    }),
    onEachFeature: (ft, layer) => {
      const p    = ft.properties;
      const ctrd = featureCentroid(ft);
      layer.bindPopup(() => {
        const canton = getCantonForPoint(ctrd[0], ctrd[1]);
        return makePopup('Accessibilité (grille 500 m)', [
          ['Canton',       canton],
          ['Commune',      p.commune_no || '—'],
          ['Classe accès', p.Rclss_prop],
          ['% accès',      p.Prop_acc_2 !== null && p.Prop_acc_2 !== undefined
                             ? p.Prop_acc_2 + ' %' : '—'],
          ['Nbre bâtim.',  p.NUMPOINTS !== null ? p.NUMPOINTS : '—']
        ]);
      }, { maxWidth: 260 });
      layer.on({
        mouseover: e => {
          e.target.setStyle({ weight: 2, color: '#111' });
          const canton = getCantonForPoint(ctrd[0], ctrd[1]);
          updateInfo('Grille accessibilité',
            `Canton : <b>${canton}</b><br>` +
            `Classe : <b>${p.Rclss_prop || '—'}</b><br>` +
            `% accès : <b>${p.Prop_acc_2 !== null && p.Prop_acc_2 !== undefined
                            ? p.Prop_acc_2 + ' %' : '—'}</b>`);
        },
        mouseout: e => { if (lAccessGrille) lAccessGrille.resetStyle(e.target); resetInfo(); }
      });
    }
  });
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 8 — Zones accessibilité eau
fetch('data/Zone_accessiblite_eau.geojson').then(r => r.json()).then(d => {
  RAW.zoneEau = d;
  lZoneEau = L.geoJSON(d, {
    style: { color: SLD.zoneEau.color, weight: SLD.zoneEau.weight, fillOpacity: 0 },
    onEachFeature: (ft, layer) => {
      const rows = Object.entries(ft.properties)
        .filter(([, v]) => v !== null && v !== undefined)
        .slice(0, 6)
        .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
      layer.bindPopup(
        `<div class="popup-inner"><h3>Zone d'accès eau (buffer 500 m)</h3><table>${rows}</table></div>`,
        { maxWidth: 250 }
      );
    }
  });
  onLayerLoaded();
}).catch(() => onLayerLoaded());

// 9 — Infrastructures eau potable (cluster)
fetch('data/Infrasructure_eau_potable.geojson').then(r => r.json()).then(d => {
  RAW.infra = d;

  lCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: cluster => {
      const n    = cluster.getChildCount();
      const size = n < 10 ? 32 : n < 50 ? 38 : 44;
      return L.divIcon({
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:#2200ff;border:3px solid white;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:${n < 10 ? 12 : 11}px;font-weight:700;
          box-shadow:0 2px 8px rgba(0,0,0,0.3)">${n}</div>`,
        iconSize: [size, size],
        className: ''
      });
    }
  });

  L.geoJSON(d, {
    pointToLayer: (ft, latlng) => L.circleMarker(latlng, {
      radius:      SLD.infra.radius,
      fillColor:   SLD.infra.color,
      color:       SLD.infra.strokeColor,
      weight:      SLD.infra.strokeW,
      fillOpacity: 0.9
    }),
    onEachFeature: (ft, layer) => {
      const p      = ft.properties;
      const isBorne = p.borne_font !== null && p.borne_font !== undefined;
      layer.bindPopup(makePopup(
        p.nom_locali || (isBorne ? 'Borne fontaine' : "Point d'eau"),
        [
          ['Type',      isBorne ? 'Borne fontaine (' + p.borne_font + ')' : 'Hydraulique villageoise'],
          ['Organisme', p.organisme || p.borne_font],
          ['Canton',    p.canton_nom],
          ['Commune',   p.commune_no]
        ]
      ), { maxWidth: 240 });
    }
  }).addTo(lCluster);

  lCluster.addTo(map);

  const el = document.getElementById('stat-infra');
  if (el) el.textContent = d.features.length;

  onLayerLoaded();
}).catch(() => onLayerLoaded());

// Construction des stats accès total (mémoire) — indépendant du chargement
buildCantonAccessStats();

// ── Toggles ───────────────────────────────────────────────────────
function bindToggle(checkId, getLayer) {
  const inp = document.getElementById(checkId);
  if (!inp) return;
  inp.addEventListener('change', () => {
    const wait = n => {
      const lyr = getLayer();
      if (lyr) {
        inp.checked ? map.addLayer(lyr) : map.removeLayer(lyr);
      } else if (n > 0) {
        setTimeout(() => wait(n - 1), 600);
      }
    };
    wait(12);
  });
}

// ── Ordre des couches (SortableJS) ───────────────────────────────
function applyLayerOrder() {
  const layerMap = {
    'ord-ogou':         () => lOgou,
    'ord-commenv':      () => lCommEnv,
    'ord-commune':      () => lCommune,
    'ord-canton':       () => lCanton,
    'ord-priorite':     () => lPriorite,
    'ord-equipgrille':  () => lEquipGrille,
    'ord-accessgrille': () => lAccessGrille,
    'ord-zoneeau':      () => lZoneEau,
    'ord-infra':        () => lCluster
  };
  const items = Array.from(document.querySelectorAll('#layer-order-list .order-item'));
  items.forEach((el, i) => {
    const numEl = el.querySelector('.order-num');
    if (numEl) numEl.textContent = i + 1;
  });
  [...items].reverse().forEach(el => {
    const getL = layerMap[el.dataset.id];
    if (getL) {
      const l = getL();
      if (l && map.hasLayer(l)) l.bringToFront();
    }
  });
}

// ── DOMContentLoaded ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  resetInfo();

  // Toggles couches
  bindToggle('tog-ogou',         () => lOgou);
  bindToggle('tog-commenv',      () => lCommEnv);
  bindToggle('tog-commune',      () => lCommune);
  bindToggle('tog-canton',       () => lCanton);
  bindToggle('tog-priorite',     () => lPriorite);
  bindToggle('tog-equipgrille',  () => lEquipGrille);
  bindToggle('tog-accessgrille', () => lAccessGrille);
  bindToggle('tog-zoneeau',      () => lZoneEau);
  bindToggle('tog-infra',        () => lCluster);

  // Plein écran
  const btnFs = document.getElementById('btn-fullscreen');
  if (btnFs) btnFs.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  // Vue initiale
  const btnHome = document.getElementById('btn-home');
  if (btnHome) btnHome.addEventListener('click', () => {
    if (lOgou) map.fitBounds(lOgou.getBounds(), { padding: [30, 30] });
    else map.setView([7.62, 1.23], 10);
  });

  // Impression
  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) btnPrint.addEventListener('click', () => window.print());

  // Panneau droit repliable
  const btnCollapse = document.getElementById('btn-collapse-right');
  const statsPanel  = document.getElementById('stats-panel');
  const appDiv      = document.getElementById('app');
  if (btnCollapse && statsPanel) {
    btnCollapse.addEventListener('click', () => {
      const collapsed = statsPanel.classList.toggle('collapsed');
      if (appDiv) appDiv.classList.toggle('panel-collapsed', collapsed);
      btnCollapse.textContent = collapsed ? '‹' : '›';
      btnCollapse.title = collapsed ? 'Afficher les statistiques' : 'Masquer les statistiques';
      btnCollapse.style.right = collapsed ? '32px' : 'var(--right-w)';
      setTimeout(() => map.invalidateSize(), 280);
    });
    // Clic sur l'en-tête vertical (quand replié) pour rouvrir
    const statsHdr = statsPanel.querySelector('.stats-header');
    if (statsHdr) {
      statsHdr.addEventListener('click', () => {
        if (statsPanel.classList.contains('collapsed')) {
          btnCollapse.click();
        }
      });
    }
  }

  // Onglets sidebar
  document.querySelectorAll('.sb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sb-tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(tab.dataset.panel);
      if (panel) panel.classList.add('active');
    });
  });

  // Mini-légendes synchronisées
  document.querySelectorAll('.toggle-switch input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', function() {
      const item = this.closest('.layer-item');
      if (!item) return;
      const legend = item.querySelector('.mini-legend');
      if (legend) legend.classList.toggle('visible', this.checked);
    });
  });

  // SortableJS — ordre des couches
  const orderList = document.getElementById('layer-order-list');
  if (orderList && typeof Sortable !== 'undefined') {
    new Sortable(orderList, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      onEnd: applyLayerOrder
    });
  }

  // Champs de requête — initialisation
  window.updateQueryFields();
});
