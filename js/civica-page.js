const __sa = window.SA = window.SA || {};

__sa.subjectConfig = {
  subject: 'civica',
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'educazioneCivica_lb_v1',
  cursorKey: 'educazioneCivica_cursor_v1',
  historyKey: 'educazioneCivica_history_v2',
  metricsKey: 'educazioneCivica_quality_v1',
  classPrefKey: 'educazioneCivica_class_pref_v1',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'civica',
    path: 'json/index.json',
    includeBonusRows: true,
    areaMap: {
      rules: 'costituzione_regole_comunita',
      env: 'ambiente_rispetto_terra',
      digital: 'cittadinanza_digitale_online',
      road: 'strada_gentilezza_sicurezza'
    }
  },
  bgIcons: ['🏛️', '📜', '🌍', '♻️', '💻', '🤝', '🚸', '🇮🇹', '💡'],
  feedbackOk: ['Esatto! 🎉', 'Ottimo! ⭐', 'Wow! 🌟', 'Giusto! ✅', 'Continua così! 🚀'],
  feedbackKo: ['Riprova! 💪', 'Quasi! ✨', 'Non mollare! 🌈'],
  areas: [
    {
      key: 'mixed',
      label: 'Sessione mista',
      icon: '🎯',
      title: 'Sessione Mista',
      subtitle: 'Domande da tutti gli ambiti'
    },
    {
      key: 'rules',
      label: 'Costituzione e Regole',
      icon: '📜',
      title: 'Costituzione e Regole',
      subtitle: 'Vivere insieme'
    },
    {
      key: 'env',
      label: 'Ambiente',
      icon: '🌍',
      title: 'Ambiente',
      subtitle: 'Rispetto della Terra'
    },
    {
      key: 'digital',
      label: 'Cittadinanza Digitale',
      icon: '💻',
      title: 'Cittadinanza Digitale',
      subtitle: 'Comportamento online'
    },
    {
      key: 'road',
      label: 'Strada e Gentilezza',
      icon: '🚸',
      title: 'Strada e Gentilezza',
      subtitle: 'Sicurezza e rispetto'
    }
  ],
  banks: {
    rules: [
      { q: 'Se entri in biblioteca, qual è il comportamento corretto?', a: 'parlare piano', d: ['correre tra gli scaffali', 'spingere', 'gridare'] },
      { q: 'Quale scelta è più responsabile quando vuoi indicare un diritto dei bambini?', a: 'imparare e giocare', d: ['comandare sempre', 'rompere i giochi altrui', 'non rispettare nessuno'] },
      { q: 'Quale risposta aiuta di più la comunità quando trovi un oggetto non tuo?', a: 'consegnarlo a un adulto', d: ['nasconderlo', 'tenerlo', 'buttarlo'] },
      { q: 'Se trovi un oggetto non tuo, qual è il comportamento corretto?', a: 'consegnarlo a un adulto', d: ['nasconderlo', 'tenerlo', 'buttarlo'] },
      { q: 'Se vuoi spiegare cosa significa uguaglianza, qual è il comportamento corretto?', a: 'le regole valgono per tutti', d: ['decide chi grida di più', 'ognuno fa come vuole', 'contano solo i più forti'] },
      { q: 'Quale risposta aiuta di più la comunità quando un compagno dimentica il materiale?', a: 'aiutarlo se puoi', d: ['dirgli di andare via', 'prenderlo in giro', 'nascondergli lo zaino'] },
      { q: 'Cosa è giusto fare quando un compagno sta parlando?', a: 'Ascoltarlo in silenzio', d: ['Interromperlo sempre', 'Coprirsi le orecchie', 'Parlare più forte di lui'] },
      { q: 'In una classe inclusiva ogni alunno ha diritto a sentirsi accolto. Quale comportamento lo favorisce?', a: 'Invitare tutti a partecipare', d: ['Usare soprannomi offensivi', 'Escludere chi arriva nuovo', 'Ridurre i compiti solo agli amici'] },
      { q: 'Se un compagno dimentica il materiale, qual è il comportamento corretto?', a: 'aiutarlo se puoi', d: ['prenderlo in giro', 'nascondergli lo zaino', 'dirgli di andare via'] },
      { q: 'Quale risposta aiuta di più la comunità quando discuti in gruppo?', a: 'ascoltare più opinioni', d: ['decidere urlando', 'zittire chi parla', 'lasciare decidere solo al più forte'] },
      { q: 'La tua scuola vuole piantare un orto in giardino. Come possono partecipare gli alunni?', a: 'Proporre idee, prendersi cura delle piante e condividere i frutti con la comunità', d: ['Guardare solo i grandi lavorare', 'Non farlo perché sporca le mani', 'Decidere da soli senza parlare con le maestre'] },
      { q: 'Quale scelta è più responsabile quando un compagno cade?', a: 'aiutarlo o chiamare un adulto', d: ['spingerlo ancora', 'ridere', 'andartene'] },
      { q: 'Che cosa mostra più rispetto quando vuoi spiegare a cosa serve una regola?', a: 'far convivere bene tutti', d: ['complicare la giornata', 'far vincere sempre gli stessi', 'mettere paura'] },
      { q: 'Che cosa fa il Governo italiano?', a: 'Governa il paese applicando le leggi e gestendo i servizi pubblici', d: ['Scrive la Costituzione', 'Giudica i processi', 'Elegge il Presidente della Repubblica'] },
      { q: 'Durante la lezione vuoi parlare. Che cosa fai per rispettare la regola della classe?', a: 'Alzi la mano e aspetti il turno', d: ['Parli subito più forte degli altri', 'Ti alzi e vai vicino alla maestra', 'Batti le mani sul banco'] }
    ],
    env: [
      { q: 'Che cosa mostra più rispetto quando puoi fare un tragitto breve vicino a casa?', a: 'andare a piedi o in bici quando possibile', d: ['lasciare il motore acceso', 'usare sempre l\'auto', 'buttare rifiuti dal finestrino'] },
      { q: 'Quale scelta è più responsabile quando esci da una stanza vuota?', a: 'spegnere la luce', d: ['aprire il frigorifero', 'lasciarla accesa', 'buttare carta a terra'] },
      { q: 'Perché prendersi cura del materiale scolastico è anche una forma di risparmio delle risorse?', a: 'Perché dura più a lungo e non va sostituito subito', d: ['Perché così gli oggetti diventano più pesanti', 'Perché occupa meno spazio nello zaino', 'Perché fa sparire i compiti'] },
      { q: 'Quale risposta aiuta di più la comunità quando incontri piccoli animali nel giardino?', a: 'rispettarli', d: ['colpirli', 'disturbarli sempre', 'spaventarli per gioco'] },
      { q: 'Quale progetto di classe va nella direzione del risparmio delle risorse?', a: 'Raccogliere fogli usati da un lato per appunti e bozze', d: ['Usare un bicchiere di plastica nuovo ogni giorno', 'Tenere i computer sempre accesi', 'Cambiare pennarelli prima che finiscano'] },
      { q: 'A scuola avanzano fogli stampati solo da un lato. Prima di buttarli, quale scelta è più sostenibile?', a: 'Usarli ancora come fogli di brutta copia', d: ['Buttarli nella plastica', 'Tagliarli in pezzetti', 'Nasconderli in un cassetto'] },
      { q: 'In una situazione in cui incontri piccoli animali nel giardino, cosa fai?', a: 'rispettarli', d: ['colpirli', 'spaventarli per gioco', 'disturbarli sempre'] },
      { q: 'Se hai una pila scarica, qual è il comportamento corretto?', a: 'portarla in un punto di raccolta adatto', d: ['gettarla nel lavandino', 'buttarla per terra', 'metterla con la carta'] },
      { q: 'Che cosa mostra più rispetto quando noti una fontanella che perde?', a: 'dirlo a un adulto', d: ['giocarci per ore', 'romperla', 'far finta di niente'] },
      { q: 'Che cosa mostra più rispetto quando hai una bottiglia di plastica da buttare?', a: 'metterla nel contenitore corretto', d: ['lasciarla nel prato', 'buttarla nel WC', 'nasconderla nello zaino'] },
      { q: 'Che cosa mostra più rispetto quando sei a mensa o a merenda?', a: 'prendere solo quello che riesci a mangiare', d: ['giocare col cibo', 'lasciare tutto sul tavolo', 'riempire il piatto e buttare il resto'] },
      { q: 'Se hai una bottiglia di plastica da buttare, qual è il comportamento corretto?', a: 'metterla nel contenitore corretto', d: ['buttarla nel WC', 'lasciarla nel prato', 'nasconderla nello zaino'] },
      { q: 'Una lattina di bibita vuota in quale raccolta va di solito?', a: 'Nella raccolta dei metalli', d: ['Nell\'organico', 'Nel tessile', 'Nella carta'] },
      { q: 'Se devi disegnare una prova, quale abitudine aiuta a sprecare meno carta?', a: 'Usare anche il retro del foglio quando possibile', d: ['Usare un foglio nuovo per ogni piccola prova', 'Strappare metà foglio e buttare il resto', 'Piegare il foglio e non usarlo'] },
      { q: 'Perché facciamo la raccolta differenziata?', a: 'Per recuperare materiali utili', d: ['Per avere più compiti', 'Per sporcare più cestini', 'Per cambiare colore ai rifiuti'] }
    ],
    digital: [
      { q: 'Quale scelta è più responsabile quando uno sconosciuto ti scrive online?', a: 'avvisare un adulto', d: ['dirgli tutto di te', 'accettare subito l\'amicizia', 'mandare una foto'] },
      { q: 'Ricevi un link che promette un premio ma chiede subito dati personali. Qual è il comportamento più corretto?', a: 'Non aprire o non inserire dati e confrontarti con un adulto', d: ['Compilare tutto per vedere il premio', 'Inoltrarlo a tutta la classe', 'Mettere dati inventati per gioco'] },
      { q: 'Che cosa mostra più rispetto quando in chat prendono in giro un compagno?', a: 'non partecipare e chiedere aiuto', d: ['aggiungere commenti cattivi', 'girare tutto ad altri', 'mettere like alle offese'] },
      { q: 'Scrivere un messaggio gentile in chat significa?', a: 'Usare parole educate', d: ['Scrivere tutto in maiuscolo', 'Mandare tanti punti esclamativi', 'Rispondere con parole offensive'] },
      { q: 'Se vuoi scaricare una nuova app, qual è il comportamento corretto?', a: 'chiedere prima a un adulto', d: ['dare dati a caso', 'scaricarla da solo sempre', 'pagare da solo'] },
      { q: 'Quale risposta aiuta di più la comunità quando devi scegliere un nome per giocare online?', a: 'usare un nickname invece del nome completo', d: ['mettere numero di telefono', 'scrivere indirizzo e scuola', 'scrivere nome e cognome'] },
      { q: 'Perché è importante pensare prima di pubblicare una foto online?', a: 'Perché una volta condivisa può circolare facilmente', d: ['Perché le foto pesano troppo', 'Perché le foto non si possono vedere di sera', 'Perché ogni foto va stampata'] },
      { q: 'Quale risposta aiuta di più la comunità quando ricevi una richiesta di amicizia da uno sconosciuto?', a: 'valutarla con un adulto', d: ['accettarla per avere più amici', 'mandare i tuoi dati', 'scrivere dove abiti'] },
      { q: 'Se leggi una notizia online, qual è il comportamento corretto?', a: 'controllarla con un adulto o con fonti affidabili', d: ['inoltrarla a tutti', 'fidarti solo del titolo', 'crederle subito'] },
      { q: 'Che cosa vuol dire usare un tono adatto online?', a: 'Scegliere parole educate e comprensibili', d: ['Scrivere il più in fretta possibile', 'Usare sempre abbreviazioni difficili', 'Rispondere solo con faccine'] },
      { q: 'Se un amico ti chiede la password, qual è il comportamento corretto?', a: 'tenerla segreta', d: ['scriverla sul banco', 'dirgliela subito', 'pubblicarla'] },
      { q: 'Quale scelta è più responsabile quando usi una chat di classe?', a: 'restare sul tema e usare toni educati', d: ['mandare insulti', 'scrivere di notte per disturbare', 'inviare foto senza permesso'] },
      { q: 'Se ricevi una richiesta di amicizia da uno sconosciuto, qual è il comportamento corretto?', a: 'valutarla con un adulto', d: ['mandare i tuoi dati', 'scrivere dove abiti', 'accettarla per avere più amici'] },
      { q: 'In una situazione in cui vuoi scaricare una nuova app, cosa fai?', a: 'chiedere prima a un adulto', d: ['scaricarla da solo sempre', 'dare dati a caso', 'pagare da solo'] },
      { q: 'Se qualcuno ti chiede una foto privata, qual è il comportamento corretto?', a: 'dire no e avvisare un adulto', d: ['inoltrarla a un gruppo', 'mandarla subito', 'scambiarla con la password'] }
    ],
    road: [
      { q: 'Se piove o c\'è poca luce, qual è il comportamento corretto?', a: 'essere ancora più attento', d: ['guardare meno', 'distrarti con il telefono', 'correre di più'] },
      { q: 'In una discussione tra compagni, quale atteggiamento favorisce la convivenza?', a: 'Cercare di capire anche il punto di vista dell\'altro', d: ['Voler vincere a tutti i costi', 'Ripetere sempre la stessa frase', 'Coinvolgere altri per litigare'] },
      { q: 'In una situazione in cui usi la bici in città, cosa fai?', a: 'restare negli spazi adatti e con prudenza', d: ['andare senza casco', 'usare cuffie ad alto volume', 'gareggiare con le auto'] },
      { q: 'Se vuoi un gioco che sta usando un altro bambino, che cosa puoi dire?', a: 'Posso averlo quando hai finito, per favore?', d: ['Dammi subito il gioco', 'Sei lento', 'Lo prendo senza parlare'] },
      { q: 'In una situazione in cui una persona anziana passa lentamente, cosa fai?', a: 'aspettare con rispetto', d: ['correre davanti', 'ridere', 'spingerla'] },
      { q: 'Sull\'autobus, a chi è giusto cedere il posto a sedere?', a: 'A una persona anziana o in difficoltà', d: ['A nessuno', 'Solo agli amici', 'A chi urla di più'] },
      { q: 'In una situazione in cui viaggi in auto da bambino, cosa fai?', a: 'usare seggiolino o rialzo quando serve', d: ['alzarti mentre l\'auto va', 'togliere la cintura', 'stare sciolto sul sedile'] },
      { q: 'Se vai in bici, qual è il comportamento corretto?', a: 'indossare il casco', d: ['correre senza controllo', 'fare lo slalom tra le persone', 'andare senza protezioni'] },
      { q: 'Quale risposta aiuta di più la comunità quando cammini quando è buio?', a: 'cercare di essere visibile e prudente', d: ['usare il telefono mentre cammini', 'correre in strada', 'vestirti in modo da non farti vedere'] },
      { q: 'Che cosa mostra più rispetto quando sali sull\'autobus?', a: 'lasciare salire e scendere con ordine', d: ['bloccare la porta', 'spingere', 'correre urlando'] },
      { q: 'Perché la gentilezza non è solo \'essere educati\'?', a: 'Perché riguarda anche attenzione, ascolto e rispetto concreti', d: ['Perché serve solo con gli adulti', 'Perché è utile solo quando si chiede un favore', 'Perché sostituisce tutte le regole'] },
      { q: 'Se sei in una fila lunga, qual è il comportamento corretto?', a: 'mantenere calma e ordine', d: ['urlare', 'saltare avanti', 'spingere'] },
      { q: 'Se sali in auto per un viaggio, qual è il comportamento corretto?', a: 'allacciare la cintura', d: ['stare senza cintura', 'alzarti durante il viaggio', 'giocare sul sedile'] },
      { q: 'Se il semaforo pedonale sta per cambiare, qual è la scelta più sicura?', a: 'Valutare se è meglio attendere il turno successivo', d: ['Iniziare a correre', 'Attraversare diagonalmente', 'Fermarsi in mezzo'] },
      { q: 'Quale comportamento è scorretto durante l\'attraversamento?', a: 'Usare il telefono senza attenzione', d: ['Camminare sulle strisce', 'Guardare se arrivano veicoli', 'Restare vicino all\'adulto'] }
    ]
  }
,
  classMeta: {
    2: { subtitle: 'Prime regole' },
    3: { subtitle: 'Regole e ambiente' },
    4: { subtitle: 'Scelte consapevoli' },
    5: { subtitle: 'Cittadinanza attiva' }
  },
  classProfiles: {
    2: { 2: 1 },
    3: { 2: 0.35, 3: 0.65 },
    4: { 2: 0.15, 3: 0.35, 4: 0.5 },
    5: { 3: 0.15, 4: 0.35, 5: 0.5 }
  },
  mixedRepeatLimit: 2,
  targetGradeWeight: 12,
  classDistanceWeight: 6,
  softmaxTemperature: 1.2,
  softmaxTopK: 6
};
