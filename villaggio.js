(function () {
  'use strict';

  const GRID_SIZE = 10;
  const STATE_KEY = 'scuolaAmica_village_v2';
  const LEGACY_STATE_KEYS = ['scuolaAmica_village_v1'];
  const REFUND_RATE = 0.4;
  const CASTLE_UNIQUE_TYPES_REQUIRED = 10;
  const DEBUG_MODE = (() => {
    try {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true;
      return new URLSearchParams(window.location.search).has('debug');
    } catch (e) {
      return false;
    }
  })();

  const BUILDINGS = [
    { id: 'casa', name: 'Casa', cost: 50, w: 1, h: 1, max: 3, asset: 'assets/villaggio/casa.png', unlock: [] },
    { id: 'fattoria', name: 'Fattoria', cost: 80, w: 2, h: 2, max: 2, asset: 'assets/villaggio/fattoria.png', unlock: [] },

    { id: 'mucche', name: 'Mucche', cost: 100, w: 2, h: 1, max: 1, asset: 'assets/villaggio/mucche.png', unlock: ['fattoria'] },
    { id: 'parco-giochi', name: 'Parco Giochi', cost: 120, w: 2, h: 2, max: 1, asset: 'assets/villaggio/parco-giochi.png', unlock: ['casa'] },
    { id: 'scuola-elementare', name: 'Scuola Elementare', cost: 150, w: 2, h: 2, max: 1, asset: 'assets/villaggio/scuola-elementare.png', unlock: ['casa'] },
    { id: 'farmacia', name: 'Farmacia', cost: 140, w: 1, h: 2, max: 1, asset: 'assets/villaggio/farmacia.png', unlock: ['casa'] },
    { id: 'pompieri', name: 'Pompieri', cost: 150, w: 2, h: 2, max: 1, asset: 'assets/villaggio/pompieri.png', unlock: ['casa'] },
    { id: 'chiesa', name: 'Chiesa', cost: 130, w: 1, h: 2, max: 1, asset: 'assets/villaggio/chiesa.png', unlock: ['casa'] },
    { id: 'moschea', name: 'Moschea', cost: 130, w: 1, h: 2, max: 1, asset: 'assets/villaggio/moschea.png', unlock: ['casa'] },

    { id: 'negozio-di-torte', name: 'Pasticceria', cost: 200, w: 1, h: 2, max: 1, asset: 'assets/villaggio/negozio-di-torte.png', unlock: ['fattoria', 'mucche'] },
    { id: 'scuola-media', name: 'Scuola Media', cost: 260, w: 2, h: 2, max: 1, asset: 'assets/villaggio/scuola-media.png', unlock: ['scuola-elementare'] },
    { id: 'ospedale', name: 'Ospedale', cost: 420, w: 3, h: 2, max: 1, asset: 'assets/villaggio/ospedale.png', unlock: ['farmacia'] },
    { id: 'stadio', name: 'Stadio', cost: 380, w: 3, h: 3, max: 1, asset: 'assets/villaggio/stadio.png', unlock: ['parco-giochi', 'fattoria'] },

    { id: 'liceo', name: 'Liceo', cost: 480, w: 3, h: 2, max: 1, asset: 'assets/villaggio/liceo.png', unlock: ['scuola-media'] },
    { id: 'uffici', name: 'Uffici', cost: 350, w: 2, h: 2, max: 1, asset: 'assets/villaggio/uffici.png', unlock: ['scuola-media', 'negozio-di-torte'] },

    { id: 'universita', name: 'Università', cost: 750, w: 3, h: 3, max: 1, asset: 'assets/villaggio/universita.png', unlock: ['liceo', 'ospedale'] },
    {
      id: 'castello',
      name: 'Castello',
      cost: 1100,
      w: 3,
      h: 3,
      max: 1,
      asset: 'assets/villaggio/castello.png',
      unlock: ['universita', 'uffici', 'stadio'],
      minUniqueTypes: CASTLE_UNIQUE_TYPES_REQUIRED
    }
  ];

  const BUILDING_MAP = {};
  BUILDINGS.forEach((b) => {
    BUILDING_MAP[b.id] = b;
  });

  let state = loadState();
  let selectedBuildingId = null;
  let selectedPlacementId = null;
  let gridTileMap = new Map();

  function debugWarn(context, error) {
    if (!DEBUG_MODE) return;
    try {
      console.warn(`[La Scuola Amica][${context}]`, error);
    } catch (_) {}
  }

  function getEconomy() {
    const sa = window.SA;
    if (sa && sa.economy) return sa.economy;
    return null;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function toInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.floor(n);
  }

  function cellKey(x, y) {
    return `${x}:${y}`;
  }

  function createDefaultState() {
    return { size: GRID_SIZE, nextPlacementId: 1, placements: [] };
  }

  function getBuildingLimit(building) {
    return Math.max(1, toInt(building && building.max, 1));
  }

  function getBuiltCounts() {
    const counts = {};
    state.placements.forEach((p) => {
      counts[p.buildingId] = (counts[p.buildingId] || 0) + 1;
    });
    return counts;
  }

  function getBuiltUniqueTypes(counts) {
    return Object.keys(counts || {}).filter((id) => (counts[id] || 0) > 0).length;
  }

  function canBuildMore(building, counts) {
    return (counts[building.id] || 0) < getBuildingLimit(building);
  }

  function getUnlockStatus(building, counts) {
    const missing = (building.unlock || []).filter((req) => (counts[req] || 0) <= 0);
    const parts = [];

    if (missing.length) {
      parts.push(`Costruisci prima: ${missing.map((id) => BUILDING_MAP[id]?.name || id).join(' + ')}.`);
    }

    if (building.minUniqueTypes) {
      const uniqueBuilt = getBuiltUniqueTypes(counts);
      if (uniqueBuilt < building.minUniqueTypes) {
        parts.push(`Servono almeno ${building.minUniqueTypes} edifici diversi (${uniqueBuilt}/${building.minUniqueTypes}).`);
      }
    }

    return {
      ok: parts.length === 0,
      reason: parts.join(' ')
    };
  }

  function getLimitReason(building, counts) {
    return `Hai già costruito il massimo per ${building.name} (${getBuildingLimit(building)}).`;
  }

  function buildPlacementLookup(placements) {
    const occupancy = new Map();
    const anchors = new Map();
    const source = Array.isArray(placements) ? placements : state.placements;

    source.forEach((p) => {
      const b = BUILDING_MAP[p.buildingId];
      if (!b) return;
      const anchorKey = cellKey(p.x, p.y);
      anchors.set(anchorKey, p);
      for (let yy = p.y; yy < p.y + b.h; yy++) {
        for (let xx = p.x; xx < p.x + b.w; xx++) {
          occupancy.set(cellKey(xx, yy), p);
        }
      }
    });

    return { occupancy, anchors };
  }

  function sanitizeState(raw) {
    const placements = Array.isArray(raw && raw.placements) ? raw.placements : [];
    const occupied = new Set();
    const cleaned = [];

    placements.forEach((p) => {
      const candidate = {
        id: toInt(p && p.id, 0),
        buildingId: String((p && p.buildingId) || ''),
        x: toInt(p && p.x, -1),
        y: toInt(p && p.y, -1)
      };

      const b = BUILDING_MAP[candidate.buildingId];
      if (!candidate.id || !b) return;
      if (candidate.x < 0 || candidate.y < 0) return;
      if (candidate.x + b.w > GRID_SIZE || candidate.y + b.h > GRID_SIZE) return;

      for (let yy = candidate.y; yy < candidate.y + b.h; yy++) {
        for (let xx = candidate.x; xx < candidate.x + b.w; xx++) {
          const key = cellKey(xx, yy);
          if (occupied.has(key)) return;
        }
      }

      for (let yy = candidate.y; yy < candidate.y + b.h; yy++) {
        for (let xx = candidate.x; xx < candidate.x + b.w; xx++) {
          occupied.add(cellKey(xx, yy));
        }
      }

      cleaned.push(candidate);
    });

    const maxPlacementId = cleaned.reduce((maxId, p) => Math.max(maxId, p.id), 0);
    const nextPlacementId = Math.max(maxPlacementId + 1, toInt(raw && raw.nextPlacementId, 1), 1);

    return {
      size: GRID_SIZE,
      nextPlacementId,
      placements: cleaned
    };
  }

  function loadState() {
    const keys = [STATE_KEY].concat(LEGACY_STATE_KEYS);
    for (const key of keys) {
      try {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) continue;
        const parsed = JSON.parse(rawValue);
        return sanitizeState(parsed);
      } catch (e) {
        debugWarn(`loadState:${key}`, e);
      }
    }
    return createDefaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      LEGACY_STATE_KEYS.forEach((key) => {
        if (key !== STATE_KEY) localStorage.removeItem(key);
      });
      return true;
    } catch (e) {
      debugWarn('saveState', e);
    }
    return false;
  }

  function getPlacementAt(x, y, lookup) {
    if (lookup && lookup.occupancy) {
      return lookup.occupancy.get(cellKey(x, y)) || null;
    }
    for (const p of state.placements) {
      const b = BUILDING_MAP[p.buildingId];
      if (!b) continue;
      if (x >= p.x && x < p.x + b.w && y >= p.y && y < p.y + b.h) {
        return p;
      }
    }
    return null;
  }

  function canPlace(building, x, y, lookup) {
    if (x + building.w > GRID_SIZE || y + building.h > GRID_SIZE) return false;
    for (let yy = y; yy < y + building.h; yy++) {
      for (let xx = x; xx < x + building.w; xx++) {
        if (getPlacementAt(xx, yy, lookup)) return false;
      }
    }
    return true;
  }

  function getGridTile(x, y) {
    return gridTileMap.get(cellKey(x, y)) || null;
  }

  function getIsoPositionClass(x, y) {
    return `iso-pos iso-r${y}-c${x}`;
  }

  function paintTile(tile, x, y, lookup) {
    if (!tile) return;

    tile.classList.remove('occupied', 'selected-placement');
    delete tile.dataset.placementId;

    const placement = getPlacementAt(x, y, lookup);
    if (!placement) {
      tile.setAttribute('aria-label', `Casella libera, riga ${y + 1} colonna ${x + 1}`);
      return;
    }

    const b = BUILDING_MAP[placement.buildingId];
    if (!b) {
      tile.setAttribute('aria-label', `Casella libera, riga ${y + 1} colonna ${x + 1}`);
      return;
    }

    tile.classList.add('occupied');
    tile.dataset.placementId = String(placement.id);
    if (selectedPlacementId === placement.id) tile.classList.add('selected-placement');
    tile.setAttribute('aria-label', `${b.name}, posizione riga ${y + 1} colonna ${x + 1}`);
  }

  function selectBuilding(id) {
    selectedBuildingId = id;
    selectedPlacementId = null;
    renderShop();
    updateGridSelectionStyles();
    renderInfo();
  }

  function clearSelection() {
    selectedBuildingId = null;
    selectedPlacementId = null;
    renderShop();
    updateGridSelectionStyles();
    renderInfo();
  }

  function pulseElement(el, className, durationMs) {
    if (!el) return;
    if (window.SADom && typeof window.SADom.restartAnimation === 'function') {
      window.SADom.restartAnimation(el, className);
    } else {
      el.classList.remove(className);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add(className);
        });
      });
    }
    setTimeout(() => el.classList.remove(className), durationMs);
  }

  function triggerPurchaseFeedback(buildingId, placementId, x, y) {
    pulseElement(getGridTile(x, y), 'purchase-pop', 760);
    if (placementId) {
      const sprite = document.querySelector(`.iso-building[data-placement-id="${placementId}"]`);
      pulseElement(sprite, 'purchase-pop', 760);
    }
    document.querySelectorAll('.shop-item').forEach((card) => {
      if (String(card.dataset.buildingId || '') === String(buildingId || '')) {
        pulseElement(card, 'purchase-flash', 760);
      }
    });
  }

  function estimateSessionsForMissingCredits(missingCredits) {
    return Math.max(1, Math.ceil(Math.max(0, missingCredits) / 28));
  }

  function toast(text) {
    const el = $('feedback');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1550);
  }

  async function confirmAction(message, options) {
    const sa = window.SA;
    if (sa && sa.ui && typeof sa.ui.confirm === 'function') {
      return sa.ui.confirm(message, options || {});
    }
    return Promise.resolve(window.confirm(message));
  }

  function placeBuilding(building, x, y) {
    const economy = getEconomy();
    if (!economy) return;
    if (!building || !BUILDING_MAP[building.id]) return;

    const counts = getBuiltCounts();
    const unlockStatus = getUnlockStatus(building, counts);
    if (!unlockStatus.ok) {
      toast(unlockStatus.reason || 'Questo edificio è ancora bloccato.');
      return;
    }

    if (!canBuildMore(building, counts)) {
      toast(getLimitReason(building, counts));
      return;
    }

    const wallet = economy.getWallet();
    if (wallet.balance < building.cost) {
      const missing = building.cost - wallet.balance;
      const sessions = estimateSessionsForMissingCredits(missing);
      toast(`Ti mancano ${missing} crediti. Ancora circa ${sessions} sessioni.`);
      return;
    }

    const lookup = buildPlacementLookup();
    if (!canPlace(building, x, y, lookup)) {
      toast("Qui non c'è spazio sufficiente.");
      return;
    }

    const ok = economy.spendCredits(building.cost, {
      source: 'villaggio-shop',
      note: building.id
    });
    if (!ok) {
      toast('Crediti insufficienti.');
      return;
    }

    const placementId = state.nextPlacementId++;
    const placement = { id: placementId, buildingId: building.id, x, y };
    state.placements.push(placement);

    if (!saveState()) {
      state.placements = state.placements.filter((p) => p.id !== placementId);
      state.nextPlacementId = Math.max(1, placementId);
      economy.addCredits(building.cost, {
        source: 'villaggio-rollback',
        note: building.id
      });
      toast('Salvataggio non riuscito. Crediti ripristinati.');
      return;
    }

    const countsAfter = getBuiltCounts();
    if (!canBuildMore(building, countsAfter)) {
      selectedBuildingId = null;
      selectedPlacementId = placementId;
    }

    renderShop();
    renderGrid();
    renderInfo();
    triggerPurchaseFeedback(building.id, placementId, x, y);
    toast(`${building.name} costruito!`);
  }

  async function removeSelectedPlacement() {
    const economy = getEconomy();
    if (!economy || !selectedPlacementId) return;
    const idx = state.placements.findIndex((p) => p.id === selectedPlacementId);
    if (idx < 0) return;

    const placement = state.placements[idx];
    const building = BUILDING_MAP[placement.buildingId];
    if (!building) return;

    const refund = Math.floor(building.cost * REFUND_RATE);
    const accepted = await confirmAction(
      `Riceverai ${refund} crediti di rimborso se rimuovi ${building.name}.`,
      {
        title: `Rimuovere ${building.name}?`,
        confirmLabel: 'Sì, rimuovi',
        cancelLabel: 'Annulla'
      }
    );
    if (!accepted) return;

    state.placements.splice(idx, 1);
    if (!saveState()) {
      state.placements.splice(idx, 0, placement);
      toast('Salvataggio non riuscito. Nessuna modifica applicata.');
      return;
    }

    if (refund > 0) {
      economy.addCredits(refund, {
        source: 'villaggio-rimborso',
        note: building.id
      });
    }

    selectedPlacementId = null;
    renderShop();
    renderGrid();
    renderInfo();
    toast(`${building.name} rimosso. Rimborso: ${refund} crediti.`);
  }

  function renderShop() {
    const shop = $('shopGrid');
    if (!shop) return;
    shop.textContent = '';

    const economy = getEconomy();
    const wallet = economy ? economy.getWallet() : { balance: 0 };
    const counts = getBuiltCounts();
    const frag = document.createDocumentFragment();

    BUILDINGS.forEach((building) => {
      const builtCount = counts[building.id] || 0;
      const unlocked = getUnlockStatus(building, counts);
      const affordable = wallet.balance >= building.cost;
      const underLimit = canBuildMore(building, counts);
      const limit = getBuildingLimit(building);
      const missingCredits = Math.max(0, building.cost - wallet.balance);

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'shop-item';
      card.dataset.buildingId = building.id;
      if (selectedBuildingId === building.id) card.classList.add('selected');
      if (!unlocked.ok) card.classList.add('locked');
      if (unlocked.ok && !affordable) card.classList.add('poor');
      if (!underLimit) card.classList.add('maxed');
      card.setAttribute('aria-disabled', (!unlocked.ok || !underLimit) ? 'true' : 'false');
      card.setAttribute('aria-label', `${building.name}, costo ${building.cost} crediti, dimensione ${building.w}x${building.h}`);

      const img = document.createElement('img');
      img.src = building.asset;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';

      const title = document.createElement('div');
      title.className = 'shop-name';
      title.textContent = building.name;

      const meta = document.createElement('div');
      meta.className = 'shop-meta';
      meta.textContent = `${building.w}x${building.h} · ${building.cost} crediti`;

      const built = document.createElement('div');
      built.className = 'shop-built';
      built.textContent = `Nel villaggio: ${builtCount} / ${limit}`;

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(built);

      const status = document.createElement('div');
      status.className = 'shop-lock';
      if (!unlocked.ok) {
        status.textContent = unlocked.reason;
        card.appendChild(status);
      } else if (!underLimit) {
        status.textContent = getLimitReason(building, counts);
        card.appendChild(status);
      } else if (!affordable) {
        status.textContent = `Ti mancano ${missingCredits} crediti.`;
        card.appendChild(status);
      }

      frag.appendChild(card);
    });

    shop.appendChild(frag);
  }

  function renderGrid() {
    const grid = $('villageGrid');
    const title = $('villageTitle');
    if (!grid) return;
    grid.textContent = '';
    gridTileMap = new Map();
    if (title) title.textContent = `Mappa del Villaggio (${GRID_SIZE}x${GRID_SIZE})`;
    grid.setAttribute('aria-label', `Griglia del villaggio ${GRID_SIZE}x${GRID_SIZE}`);

    const groundLayer = document.createElement('div');
    groundLayer.className = 'iso-ground';
    const groundFrag = document.createDocumentFragment();
    const lookup = buildPlacementLookup();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = `tile iso-tile ${getIsoPositionClass(x, y)}`;
        tile.dataset.x = String(x);
        tile.dataset.y = String(y);
        paintTile(tile, x, y, lookup);
        gridTileMap.set(cellKey(x, y), tile);
        groundFrag.appendChild(tile);
      }
    }

    groundLayer.appendChild(groundFrag);
    grid.appendChild(groundLayer);

    const buildingLayer = document.createElement('div');
    buildingLayer.className = 'iso-building-layer';
    const buildingFrag = document.createDocumentFragment();
    const sortedPlacements = state.placements
      .slice()
      .sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.y - b.y || a.x - b.x);

    sortedPlacements.forEach((placement) => {
      const building = BUILDING_MAP[placement.buildingId];
      if (!building) return;

      const sprite = document.createElement('div');
      sprite.className = `iso-building iso-building--${building.id} ${getIsoPositionClass(placement.x, placement.y)} iso-sprite--${building.w}x${building.h}`;
      sprite.dataset.placementId = String(placement.id);
      if (selectedPlacementId === placement.id) sprite.classList.add('selected-placement');
      sprite.setAttribute('aria-hidden', 'true');

      const img = document.createElement('img');
      img.src = building.asset;
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      img.className = 'iso-building-asset';

      sprite.appendChild(img);
      buildingFrag.appendChild(sprite);
    });

    buildingLayer.appendChild(buildingFrag);
    grid.appendChild(buildingLayer);
  }

  function updateGridSelectionStyles() {
    gridTileMap.forEach((tile) => {
      const placementId = toInt(tile.dataset.placementId, 0);
      tile.classList.toggle('selected-placement', placementId > 0 && placementId === selectedPlacementId);
    });
    document.querySelectorAll('.iso-building[data-placement-id]').forEach((sprite) => {
      const placementId = toInt(sprite.dataset.placementId, 0);
      sprite.classList.toggle('selected-placement', placementId > 0 && placementId === selectedPlacementId);
    });
  }

  function onShopGridClick(event) {
    const shop = $('shopGrid');
    if (!shop) return;
    const card = event.target.closest('.shop-item');
    if (!card || !shop.contains(card)) return;
    const buildingId = String(card.dataset.buildingId || '');
    const building = BUILDING_MAP[buildingId];
    if (!building) return;

    const counts = getBuiltCounts();
    const unlockStatus = getUnlockStatus(building, counts);
    if (!unlockStatus.ok) {
      toast(unlockStatus.reason || 'Questo edificio è ancora bloccato.');
      return;
    }

    if (!canBuildMore(building, counts)) {
      toast(getLimitReason(building, counts));
      return;
    }

    const economy = getEconomy();
    const wallet = economy ? economy.getWallet() : { balance: 0 };
    if (wallet.balance < building.cost) {
      const missing = building.cost - wallet.balance;
      toast(`Puoi selezionarlo, ma ti mancano ancora ${missing} crediti.`);
    }

    selectBuilding(buildingId);
  }

  function onVillageGridClick(event) {
    const grid = $('villageGrid');
    if (!grid) return;
    const tile = event.target.closest('.tile');
    if (!tile || !grid.contains(tile)) return;

    const x = toInt(tile.dataset.x, -1);
    const y = toInt(tile.dataset.y, -1);
    if (x < 0 || y < 0) return;

    if (selectedBuildingId) {
      const building = BUILDING_MAP[selectedBuildingId];
      if (building) placeBuilding(building, x, y);
      return;
    }

    const placementId = Math.max(0, toInt(tile.dataset.placementId, 0));
    selectedPlacementId = placementId > 0 ? placementId : null;
    updateGridSelectionStyles();
    renderInfo();
  }

  function renderInfo() {
    const info = $('selectionInfo');
    const removeBtn = $('removeBtn');
    if (!info || !removeBtn) return;

    const counts = getBuiltCounts();
    const uniqueBuilt = getBuiltUniqueTypes(counts);

    if (selectedBuildingId) {
      const building = BUILDING_MAP[selectedBuildingId];
      if (!building) return;
      const limit = getBuildingLimit(building);
      const remaining = Math.max(0, limit - (counts[building.id] || 0));
      info.textContent = `Selezionato: ${building.name} (${building.w}x${building.h}, ${building.cost} crediti). Tocca una zona libera per costruire. Disponibili ancora: ${remaining}.`;
      removeBtn.disabled = true;
      return;
    }

    if (selectedPlacementId) {
      const placement = state.placements.find((it) => it.id === selectedPlacementId);
      const building = placement ? BUILDING_MAP[placement.buildingId] : null;
      if (building) {
        info.textContent = `${building.name} selezionato. Puoi rimuoverlo con rimborso del ${Math.round(REFUND_RATE * 100)}%.`;
        removeBtn.disabled = false;
        return;
      }
    }

    info.textContent = `Scegli un edificio dal negozio oppure tocca un edificio già costruito. Edifici diversi: ${uniqueBuilt}/${CASTLE_UNIQUE_TYPES_REQUIRED} per il Castello.`;
    removeBtn.disabled = true;
  }

  async function resetVillage() {
    const accepted = await confirmAction(
      'I crediti resteranno salvati, ma tutti gli edifici costruiti verranno rimossi.',
      {
        title: 'Azzera il villaggio?',
        confirmLabel: 'Sì, azzera',
        cancelLabel: 'Annulla'
      }
    );
    if (!accepted) return;

    state = createDefaultState();
    if (!saveState()) {
      toast('Salvataggio non riuscito. Riprova.');
      return;
    }
    clearSelection();
    renderShop();
    renderGrid();
    renderInfo();
    toast('Villaggio azzerato. I crediti sono rimasti disponibili.');
  }

  function bindEvents() {
    $('clearSelectionBtn')?.addEventListener('click', clearSelection);
    $('removeBtn')?.addEventListener('click', () => {
      void removeSelectedPlacement();
    });
    $('resetVillageBtn')?.addEventListener('click', () => {
      void resetVillage();
    });
    $('shopGrid')?.addEventListener('click', onShopGridClick);
    $('villageGrid')?.addEventListener('click', onVillageGridClick);

    window.addEventListener('wallet-updated', () => {
      renderShop();
      renderInfo();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderShop();
    renderGrid();
    renderInfo();
  });
})();
