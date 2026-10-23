(function () {
  'use strict';

  // Calcolatore di /tabelline: la tabellina di un numero da 1 a 1000, da × 1
  // a × 10. Senza JavaScript la sezione resta nascosta (attributo hidden) e
  // la pagina mostra comunque le tabelline fino al 100 in testo statico.
  const form = document.getElementById('tabCalc');
  const input = document.getElementById('tabCalcNumero');
  const esito = document.getElementById('tabCalcEsito');
  const el = window.SADom && window.SADom.el;
  if (!form || !input || !esito || !el) return;

  const MESSAGGIO = 'Scrivi un numero intero da 1 a 1000, solo cifre: niente lettere, virgole o segni.';

  // «dell'» davanti ai numeri che si leggono con una vocale (uno, otto,
  // undici, ottanta..., ottocento...), come scripts/build_tabelline.py.
  const vocale = (n) => n === 1 || n === 8 || n === 11 || (n >= 80 && n <= 89) || (n >= 800 && n <= 899);
  const di = (n) => (vocale(n) ? "dell'" : 'del ') + n;
  const numero = (n) => n.toLocaleString('it-IT');

  function errore() {
    const messaggio = el('p', MESSAGGIO, 'tab-calc-errore');
    messaggio.id = 'tabCalcErrore';
    esito.replaceChildren(messaggio);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'tabCalcErrore');
    input.focus();
  }

  function risultato(n) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    const lista = el('ul', undefined, 'tab-calc-lista');
    for (let k = 1; k <= 10; k += 1) lista.append(el('li', `${n} × ${k} = ${numero(n * k)}`));
    esito.replaceChildren(el('p', `Tabellina ${di(n)}`, 'tab-calc-titolo'), lista);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const testo = input.value.trim();
    const n = /^\d{1,4}$/.test(testo) ? Number(testo) : 0;
    if (n >= 1 && n <= 1000) risultato(n);
    else errore();
  });

  form.closest('section').hidden = false;
})();
