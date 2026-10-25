// Dai server statici dei test (sw_update_smoke, sw_versioni_smoke,
// check_static_grids, build_css_critico): l'URL richiesto -> il file da
// servire, solo se sta dentro ROOT.
//
// `file.startsWith(ROOT)` non bastava: path.join(ROOT, '../files-backup/x')
// comincia con ROOT e passava (avviso CodeQL #4, js/path-injection). Qui si
// confronta il percorso relativo: niente '..' in testa, niente assoluti.
// URL non decodificabili e byte nulli: null (404), non un'eccezione.
//
// Restituisce { file, rel } (rel con le barre «/») oppure null.

const fs = require('fs');
const path = require('path');

function fileServito(root, url) {
  let richiesto;
  try {
    richiesto = decodeURIComponent(String(url).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (richiesto.includes('\0')) return null;
  const base = path.resolve(root);
  const file = path.resolve(base, richiesto.replace(/^\/+/, '') || 'index.html');
  const rel = path.relative(base, file);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return { file, rel: rel.split(path.sep).join('/') };
}

module.exports = { fileServito };
