(function () {
  'use strict';

  const GRID_SIZE = 8;
  const STATE_KEY = 'scuolaAmica_village_v1';
  const REFUND_RATE = 0.5;
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
    { id: 'alberi', name: 'Alberi', cost: 20, w: 1, h: 1, asset: 'assets/village/alberi.svg', unlock: [] },
    { id: 'casa', name: 'Casa', cost: 70, w: 1, h: 1, asset: 'assets/village/casa.svg', unlock: [] },
    { id: 'parco-giochi', name: 'Parco Giochi', cost: 95, w: 2, h: 2, asset: 'assets/village/parco-giochi.svg', unlock: [] },
    { id: 'scuola-elementare', name: 'Scuola Elementare', cost: 130, w: 2, h: 2, asset: 'assets/village/scuola-elementare.svg', unlock: [] },
    { id: 'supermercato', name: 'Supermercato', cost: 145, w: 2, h: 2, asset: 'assets/village/supermercato.svg', unlock: [] },
    { id: 'campo-basket', name: 'Campo da Basket', cost: 165, w: 2, h: 2, asset: 'assets/village/campo-basket.svg', unlock: [] },
    { id: 'biblioteca', name: 'Biblioteca', cost: 190, w: 2, h: 2, asset: 'assets/village/biblioteca.svg', unlock: [] },
    { id: 'cinema', name: 'Cinema', cost: 220, w: 2, h: 2, asset: 'assets/village/cinema.svg', unlock: ['parco-giochi'] },
    { id: 'campo-tennis', name: 'Campo da Tennis', cost: 250, w: 2, h: 2, asset: 'assets/village/campo-tennis.svg', unlock: ['campo-basket'] },
    { id: 'ristorante', name: 'Ristorante', cost: 280, w: 2, h: 2, asset: 'assets/village/ristorante.svg', unlock: ['supermercato'] },
    { id: 'uffici', name: 'Uffici', cost: 330, w: 2, h: 2, asset: 'assets/village/uffici.svg', unlock: ['ristorante'] },
    { id: 'scuola-media', name: 'Scuola Media', cost: 360, w: 2, h: 2, asset: 'assets/village/scuola-media.svg', unlock: ['scuola-elementare', 'biblioteca'] },
    { id: 'liceo', name: 'Liceo', cost: 500, w: 3, h: 2, asset: 'assets/village/liceo.svg', unlock: ['scuola-media'] },
    { id: 'universita', name: 'Università', cost: 720, w: 3, h: 3, asset: 'assets/village/universita.svg', unlock: ['liceo', 'uffici'] }
  ];

  const BUILDING_MAP = {};
  BUILDINGS.forEach((b) => {
    BUILDING_MAP[b.id] = b;
  });

  let state = loadState();
  let selectedBuildingId = null;
  let selectedPlacementId = null;

  function debugWarn(context, error) {
    if (!DEBUG_MODE) return;
    try {
      console.warn(`[La Scuola Amica][${context}]`, error);
    } catch (_) {}
  }

  function getEconomy() {
    const sa = window.SA;
    if (sa && sa.economy) return sa.economy;
    return window.ScuolaEconomy || null;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function safeInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  }

  function cellKey(x, y) {
    return `${x}:${y}`;
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

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY));
      const placements = Array.isArray(raw?.placements) ? raw.placements : [];
      const occupied = new Set();
      const cleaned = [];

      placements.forEach((p) => {
        const candidate = {
          id: safeInt(p?.id, 0),
          buildingId: String(p?.buildingId || ''),
          x: safeInt(p?.x, -1),
          y: safeInt(p?.y, -1)
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
      const nextPlacementId = Math.max(maxPlacementId + 1, safeInt(raw?.nextPlacementId, 1), 1);

      return {
        size: GRID_SIZE,
        nextPlacementId,
        placements: cleaned
      };
    } catch (e) {
      debugWarn('loadState', e);
      return { size: GRID_SIZE, nextPlacementId: 1, placements: [] };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      debugWarn('saveState', e);
    }
    return false;
  }

  function getBuiltCounts() {
    const counts = {};
    state.placements.forEach((p) => {
      counts[p.buildingId] = (counts[p.buildingId] || 0) + 1;
    });
    return counts;
  }

  function getUnlocked(building, counts) {
    if (!building.unlock.length) return true;
    return building.unlock.every((req) => (counts[req] || 0) > 0);
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

  function selectBuilding(id) {
    selectedBuildingId = id;
    selectedPlacementId = null;
    renderShop();
    renderGrid();
    renderInfo();
  }

  function clearSelection() {
    selectedBuildingId = null;
    selectedPlacementId = null;
    renderShop();
    renderGrid();
    renderInfo();
  }

  function placeBuilding(building, x, y) {
    const economy = getEconomy();
    if (!economy) return;
    if (!building || !BUILDING_MAP[building.id]) return;

    const counts = getBuiltCounts();
    if (!getUnlocked(building, counts)) {
      toast("Questo edificio è ancora bloccato.");
      return;
    }

    const wallet = economy.getWallet();
    if (wallet.balance < building.cost) {
      toast('Crediti insufficienti. Continua a giocare!');
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

    selectedPlacementId = placementId;
    renderShop();
    renderGrid();
    renderInfo();
  }

  function removeSelectedPlacement() {
    const economy = getEconomy();
    if (!economy || !selectedPlacementId) return;
    const idx = state.placements.findIndex((p) => p.id === selectedPlacementId);
    if (idx < 0) return;

    const p = state.placements[idx];
    const building = BUILDING_MAP[p.buildingId];
    if (!building) return;

    const refund = Math.floor(building.cost * REFUND_RATE);
    if (!confirm(`Rimuovere ${building.name}?\nRiceverai ${refund} crediti di rimborso.`)) return;

    state.placements.splice(idx, 1);
    if (!saveState()) {
      state.placements.splice(idx, 0, p);
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
  }

  function renderShop() {
    const shop = $('shopGrid');
    if (!shop) return;
    shop.textContent = '';

    const economy = getEconomy();
    const wallet = economy ? economy.getWallet() : { balance: 0 };
    const counts = getBuiltCounts();
    const frag = document.createDocumentFragment();

    BUILDINGS.forEach((b) => {
      const unlocked = getUnlocked(b, counts);
      const affordable = wallet.balance >= b.cost;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'shop-item';
      card.dataset.buildingId = b.id;
      if (selectedBuildingId === b.id) card.classList.add('selected');
      if (!unlocked) card.classList.add('locked');
      if (unlocked && !affordable) card.classList.add('poor');
      card.disabled = !unlocked;
      card.setAttribute('aria-label', `${b.name}, costo ${b.cost} crediti`);

      const img = document.createElement('img');
      img.src = b.asset;
      img.alt = '';
      img.loading = 'lazy';

      const title = document.createElement('div');
      title.className = 'shop-name';
      title.textContent = b.name;

      const meta = document.createElement('div');
      meta.className = 'shop-meta';
      meta.textContent = `${b.w}x${b.h} · ${b.cost} crediti`;

      const built = document.createElement('div');
      built.className = 'shop-built';
      built.textContent = `Nel villaggio: ${counts[b.id] || 0}`;

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(built);

      if (!unlocked && b.unlock.length) {
        const lock = document.createElement('div');
        lock.className = 'shop-lock';
        lock.textContent = `Sblocca: ${b.unlock.map((id) => BUILDING_MAP[id]?.name || id).join(' + ')}`;
        card.appendChild(lock);
      }

      frag.appendChild(card);
    });

    shop.appendChild(frag);
  }

  function renderGrid() {
    const grid = $('villageGrid');
    if (!grid) return;
    grid.textContent = '';

    const frag = document.createDocumentFragment();
    const lookup = buildPlacementLookup();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tile';
        tile.dataset.x = String(x);
        tile.dataset.y = String(y);

        const placement = getPlacementAt(x, y, lookup);
        if (placement) {
          const b = BUILDING_MAP[placement.buildingId];
          tile.classList.add('occupied');
          tile.dataset.placementId = String(placement.id);
          if (selectedPlacementId === placement.id) tile.classList.add('selected-placement');
          tile.setAttribute('aria-label', `${b.name}, posizione riga ${y + 1} colonna ${x + 1}`);

          if (lookup.anchors.get(cellKey(x, y)) === placement) {
            const img = document.createElement('img');
            img.src = b.asset;
            img.alt = '';
            img.className = 'tile-asset';
            img.style.width = `${b.w * 100}%`;
            img.style.height = `${b.h * 100}%`;
            tile.appendChild(img);
          }
        } else {
          delete tile.dataset.placementId;
          tile.setAttribute('aria-label', `Casella libera, riga ${y + 1} colonna ${x + 1}`);
        }

        frag.appendChild(tile);
      }
    }

    grid.appendChild(frag);
  }

  function updateGridSelectionStyles() {
    const grid = $('villageGrid');
    if (!grid) return;
    const targetId = safeInt(selectedPlacementId, 0);
    grid.querySelectorAll('.tile').forEach((tile) => {
      const tilePlacementId = safeInt(tile.dataset.placementId, 0);
      tile.classList.toggle('selected-placement', !!targetId && tilePlacementId === targetId);
    });
  }

  function onShopGridClick(event) {
    const shop = $('shopGrid');
    if (!shop) return;
    const card = event.target.closest('.shop-item');
    if (!card || !shop.contains(card) || card.disabled) return;
    const buildingId = String(card.dataset.buildingId || '');
    if (!buildingId || !BUILDING_MAP[buildingId]) return;
    selectBuilding(buildingId);
  }

  function onVillageGridClick(event) {
    const grid = $('villageGrid');
    if (!grid) return;
    const tile = event.target.closest('.tile');
    if (!tile || !grid.contains(tile)) return;

    const x = safeInt(tile.dataset.x, -1);
    const y = safeInt(tile.dataset.y, -1);
    if (x < 0 || y < 0) return;

    if (selectedBuildingId) {
      const building = BUILDING_MAP[selectedBuildingId];
      if (building) placeBuilding(building, x, y);
      return;
    }

    const placementId = safeInt(tile.dataset.placementId, 0);
    selectedPlacementId = placementId > 0 ? placementId : null;
    updateGridSelectionStyles();
    renderInfo();
  }

  function renderInfo() {
    const info = $('selectionInfo');
    const removeBtn = $('removeBtn');
    if (!info || !removeBtn) return;

    if (selectedBuildingId) {
      const b = BUILDING_MAP[selectedBuildingId];
      info.textContent = `Selezionato: ${b.name}. Clicca una casella libera per costruire.`;
      removeBtn.disabled = true;
      return;
    }

    if (selectedPlacementId) {
      const p = state.placements.find((it) => it.id === selectedPlacementId);
      const b = p ? BUILDING_MAP[p.buildingId] : null;
      if (b) {
        info.textContent = `${b.name} selezionato. Puoi rimuoverlo con rimborso del ${Math.round(REFUND_RATE * 100)}%.`;
        removeBtn.disabled = false;
        return;
      }
    }

    info.textContent = "Scegli un edificio dal negozio oppure tocca un edificio già costruito.";
    removeBtn.disabled = true;
  }

  function toast(text) {
    const el = $('feedback');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1100);
  }

  function resetVillage() {
    if (!confirm('Vuoi azzerare completamente il villaggio?\nI crediti non verranno cancellati.')) return;
    state = { size: GRID_SIZE, nextPlacementId: 1, placements: [] };
    if (!saveState()) {
      toast('Salvataggio non riuscito. Riprova.');
      return;
    }
    clearSelection();
    renderShop();
    renderGrid();
    renderInfo();
  }

  function bindEvents() {
    $('clearSelectionBtn')?.addEventListener('click', clearSelection);
    $('removeBtn')?.addEventListener('click', removeSelectedPlacement);
    $('resetVillageBtn')?.addEventListener('click', resetVillage);
    $('shopGrid')?.addEventListener('click', onShopGridClick);
    $('villageGrid')?.addEventListener('click', onVillageGridClick);

    window.addEventListener('wallet-updated', () => {
      renderShop();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderShop();
    renderGrid();
    renderInfo();
  });
})();
