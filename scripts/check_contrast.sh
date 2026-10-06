#!/usr/bin/env bash
# Contrasto del testo su tutte le pagine, nei due modi colore.
# Usa Lighthouse (axe) sul rendering vero: i controlli fatti a mano sbagliano
# sui gradienti e su color(srgb ...). Serve un server sulla porta scelta.
#
#   scripts/check_contrast.sh [porta]     (default 4173)
#
# Esce 1 alla prima pagina con un'area sotto la soglia WCAG AA.
set -u
PORT="${1:-4173}"
BASE="http://127.0.0.1:${PORT}"
PAGES=(index matematica italiano problemi civica geografia storia scienze inglese
       tabelline premi faq bosco breakout link 404 chi-siamo ai-info privacy cookie
       per-genitori per-insegnanti accessibilita supporta supporto-satispay guida-compiti)
fails=0
for p in "${PAGES[@]}"; do
  for q in "" "?palette=okabe"; do
    out=$(npx lighthouse "${BASE}/${p}.html${q}" --only-audits=color-contrast \
      --output=json --quiet --chrome-flags="--headless" 2>/dev/null | node -e "
        let s=''; process.stdin.on('data',d=>s+=d).on('end',()=>{
          try{
            const a=JSON.parse(s).audits['color-contrast'];
            const it=(a.details&&a.details.items)||[];
            console.log(a.score===1?'OK':'FAIL '+it.length+' :: '+it.slice(0,3).map(i=>i.node.selector).join(' | '));
          }catch(e){ console.log('ERR'); }
        });")
    if [ "$out" != "OK" ]; then printf '[KO] %-28s %s\n' "${p}${q}" "$out"; fails=$((fails+1)); fi
  done
done
if [ "$fails" -gt 0 ]; then echo "contrasto: $fails pagine da sistemare"; exit 1; fi
echo "[OK] contrasto: ${#PAGES[@]} pagine x 2 modi colore, nessuna area sotto AA"
