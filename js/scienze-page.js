const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'scienze_lb_v3',
  cursorKey: 'scienze_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'scienze',
    path: 'json/index.json',
    areaMap: {
      phys: [
        'materia_energia_fenomeni',
        'materia_materiali',
        'materia_materiali_trasformazioni',
        'forze_luce_suono',
        'aria_acqua_suolo_materia',
        'metodo_scientifico'
      ],
      env: ['ecosistemi_ambiente', 'terra_stagioni_ambiente', 'viventi_ambiente', 'astronomia_terra'],
      life: ['viventi_biologia', 'viventi_non_viventi'],
      human: ['corpo_umano_salute', 'scienza_tecnologia']
    }
  },
  bgIcons: ['🔬', '🧪', '🌱', '🧠', '🌧️', '☀️'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Benissimo!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci siamo quasi!', 'Un altro tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'phys', label: 'Fenomeni fisici', icon: '🧪', title: 'Fenomeni Fisici e Chimici', subtitle: 'Materia, energia e trasformazioni' },
    { key: 'env', label: 'Ambienti e cicli', icon: '🌦️', title: 'Ambienti e Cicli', subtitle: 'Acqua, stagioni, ecosistemi' },
    { key: 'life', label: 'Viventi e corpo', icon: '🧬', title: 'Viventi e Corpo Umano', subtitle: 'Piante, animali e salute' },
    { key: 'human', label: 'Uomo e natura', icon: '♻️', title: 'Uomo, Natura e Tecnologia', subtitle: 'Risorse, prevenzione, rispetto' }
  ],
  banks: {
    phys: [
      { q: "L'acqua che bolle passa dallo stato liquido allo stato...", a: 'gassoso', d: ['solido', 'metallico', 'plastico'] },
      { q: 'Quando un liquido diventa ghiaccio avviene...', a: 'solidificazione', d: ['evaporazione', 'fusione', 'combustione'] },
      { q: 'Filtrare acqua sporca da sabbia è un esempio di...', a: 'separazione di miscugli', d: ['fotosintesi', 'respirazione', 'condensazione nucleare'] },
      { q: 'Un materiale che lascia passare la corrente elettrica è...', a: 'conduttore', d: ['isolante', 'invisibile', 'acustico'] },
      { q: 'Calamita e ferro mostrano fenomeni di...', a: 'magnetismo', d: ['gravità lunare', 'evaporazione', 'rifrazione sonora'] },
      { q: "L'ombra si forma quando la luce...", a: 'viene bloccata da un oggetto', d: ['sparisce per sempre', 'diventa liquida', 'si trasforma in suono'] },
      { q: 'Una pila e una lampadina collegate con fili formano un...', a: 'circuito elettrico semplice', d: ['termometro', 'barometro', 'sismografo'] },
      { q: 'Quando un oggetto cade verso il basso agisce la...', a: 'gravità', d: ['fotosintesi', 'magnetite liquida', 'marea solare'] },
      { q: 'Il termometro serve a misurare...', a: 'temperatura', d: ['velocità del vento', 'peso', 'altezza'] },
      { q: 'Riscaldando molti materiali si osserva spesso...', a: 'cambiamento di stato o forma', d: ['sparizione della massa', 'aumento dei giorni', 'cambio di continente'] },
      { q: 'Setacciatura e filtrazione sono metodi per...', a: 'separare materiali', d: ['creare organismi', 'misurare secoli', 'orientarsi con bussola'] },
      { q: 'In laboratorio scolastico la regola principale è...', a: 'lavorare in sicurezza', d: ['toccare tutto subito', 'correre', 'mischiare sostanze a caso'] }
    ],
    env: [
      { q: "Il ciclo dell'acqua comprende evaporazione, condensazione e...", a: 'precipitazione', d: ['respirazione', 'combustione', 'solidità'] },
      { q: 'La pioggia nasce quando il vapore acqueo...', a: 'si condensa in gocce', d: ['scompare', 'diventa sabbia', 'si incendia'] },
      { q: 'Le stagioni cambiano durante...', a: "l'anno", d: ['una sola giornata', "un'ora", 'un minuto'] },
      { q: 'In una catena alimentare, le piante sono spesso...', a: 'produttori', d: ['predatori principali', 'decompositori unici', 'consumatori finali'] },
      { q: 'Gli animali erbivori sono...', a: 'consumatori', d: ['produttori', 'minerali', 'roccia'] },
      { q: 'Un ecosistema è formato da...', a: 'viventi e ambiente fisico', d: ['solo animali', 'solo piante', 'solo acqua'] },
      { q: 'La temperatura dell aria si misura in...', a: 'gradi', d: ['litri', 'metri quadrati', 'chilometri'] },
      { q: 'Un fiume che scorre è un esempio di acqua...', a: 'corrente', d: ['stagnante', 'solida', 'gassosa'] },
      { q: 'Una foresta offre habitat a...', a: 'molte specie viventi', d: ['nessuna specie', 'solo umani', 'solo batteri marini'] },
      { q: "L'inquinamento può alterare...", a: "equilibri dell'ambiente", d: ['orbita terrestre immediata', 'numero dei continenti', 'forma del sole'] },
      { q: 'La lunghezza del giorno varia durante...', a: 'le stagioni', d: ['ogni ora', 'solo in inverno', 'mai'] },
      { q: 'Osservare il meteo ogni giorno aiuta a...', a: 'raccogliere dati scientifici', d: ['evitare ogni previsione', 'eliminare nuvole', 'misurare massa terrestre'] }
    ],
    life: [
      { q: 'Le piante producono nutrimento grazie alla...', a: 'fotosintesi', d: ['evaporazione', 'fusione', 'ossidazione del ferro'] },
      { q: 'Le radici della pianta servono soprattutto a...', a: 'assorbire acqua e sali', d: ['fare ombra', 'respirare come i polmoni', 'attirare calamite'] },
      { q: 'Gli animali vertebrati hanno...', a: 'colonna vertebrale', d: ['foglie verdi', 'radici', 'semi'] },
      { q: 'Nel corpo umano, il cuore pompa...', a: 'sangue', d: ['aria', 'linfa delle piante', 'sabbia'] },
      { q: 'I polmoni servono per...', a: 'respirare', d: ['digerire', 'camminare', 'vedere'] },
      { q: 'Per mantenersi in salute è importante...', a: 'alimentazione equilibrata e movimento', d: ['saltare sempre i pasti', 'dormire pochissimo', 'bere solo bevande zuccherate'] },
      { q: 'Un animale onnivoro mangia...', a: 'sia vegetali sia animali', d: ['solo erba', 'solo carne', 'solo minerali'] },
      { q: 'Le ossa insieme formano...', a: 'scheletro', d: ['muscolo unico', 'radice corporea', 'rete elettrica'] },
      { q: 'Lavarsi le mani aiuta a...', a: 'prevenire malattie', d: ['aumentare polvere', 'raffreddare il corpo', 'cambiare gruppo sanguigno'] },
      { q: 'I denti servono soprattutto a...', a: 'masticare il cibo', d: ['pompare sangue', 'filtrare aria', 'sentire odori'] },
      { q: 'Crescita e sviluppo negli esseri viventi significano...', a: 'cambiamenti nel tempo', d: ['assenza totale di cambiamento', 'solo aumento di peso', 'solo cambio colore'] },
      { q: 'Le differenze tra individui sono...', a: 'normali e naturali', d: ['sempre errori', 'sempre malattie', 'sempre uguali'] }
    ],
    human: [
      { q: 'La raccolta differenziata aiuta a...', a: 'riciclare materiali', d: ['aumentare rifiuti', 'sprecare risorse', 'inquinare di più'] },
      { q: 'Chiudere il rubinetto mentre ti lavi i denti aiuta a...', a: 'risparmiare acqua', d: ['consumare più acqua', 'scaldare il mare', 'fermare la pioggia'] },
      { q: 'Le energie rinnovabili includono...', a: 'sole e vento', d: ['solo petrolio', 'solo carbone', 'solo plastica'] },
      { q: 'Un comportamento corretto in laboratorio è...', a: "seguire le istruzioni dell'insegnante", d: ['mischiare sostanze a caso', 'correre', 'toccare prese elettriche'] },
      { q: "La tecnologia può aiutare l'ambiente se...", a: 'riduce sprechi e inquinamento', d: ['aumenta rifiuti', 'ignora sicurezza', 'consuma risorse senza controllo'] },
      { q: 'Le alluvioni e le frane sono esempi di...', a: 'rischi naturali', d: ['cicli alimentari', 'esperimenti di ottica', 'fonti storiche'] },
      { q: 'La prevenzione dei rischi significa...', a: 'adottare comportamenti sicuri', d: ['ignorare gli avvisi', 'correre pericolo', 'improvvisare sempre'] },
      { q: 'Riutilizzare un oggetto invece di buttarlo aiuta a...', a: 'ridurre i rifiuti', d: ['aumentare consumi', 'sprecare energia', 'inquinare acqua'] },
      { q: "L'aria pulita è importante per...", a: 'salute di persone e animali', d: ['solo piante artificiali', 'solo automobili', 'solo edifici'] },
      { q: 'Usare la bicicletta per tragitti brevi può...', a: 'ridurre emissioni', d: ['aumentare traffico sempre', 'aumentare fumo', 'consumare più benzina'] },
      { q: 'La scienza nella vita quotidiana aiuta a...', a: 'fare scelte consapevoli', d: ['evitare domande', 'scegliere a caso', 'rifiutare ogni prova'] },
      { q: 'Rispettare gli animali e gli habitat significa...', a: 'proteggere biodiversità', d: ['distruggere ecosistemi', 'raccogliere rifiuti nel bosco', 'tagliare alberi senza criterio'] }
    ]
  },
  bonusQuestions: {
    easy: [
      { q: "Bonus facile: l'acqua ghiacciata è allo stato...", a: 'solido', d: ['liquido', 'gassoso', 'plasma'] },
      { q: 'Bonus facile: quale organo pompa il sangue?', a: 'Cuore', d: ['Polmone', 'Stomaco', 'Fegato'] },
      { q: 'Bonus facile: le piante hanno bisogno di luce per...', a: 'fotosintesi', d: ['correre', 'nuotare', 'volare'] },
      { q: 'Bonus facile: differenziare i rifiuti serve a...', a: 'riciclare', d: ['sprecare', 'inquinare', 'nascondere'] }
    ],
    medium: [
      { q: 'Bonus medio: in un circuito semplice, se interrompi un filo la lampadina...', a: 'si spegne', d: ['diventa più luminosa', 'cambia colore da sola', 'suona'] },
      { q: "Bonus medio: nel ciclo dell'acqua, dopo evaporazione e condensazione avviene...", a: 'precipitazione', d: ['fotosintesi', 'combustione', 'fusione'] },
      { q: 'Bonus medio: quale scelta aiuta di più la salute?', a: 'mangiare vario e fare attività fisica', d: ['saltare sempre colazione', 'bere solo bibite zuccherate', 'dormire pochissimo'] },
      { q: 'Bonus medio: produttori, consumatori e decompositori descrivono...', a: 'relazioni in ecosistema', d: ['tipi di strumenti musicali', 'forme geometriche', 'periodi storici'] }
    ],
    hard: [
      { q: 'Bonus difficile: una miscela di acqua e sabbia si separa meglio con...', a: 'filtrazione', d: ['fotosintesi', 'fermentazione', 'ossidazione'] },
      { q: 'Bonus difficile: per ridurre rischio idrico in città è utile soprattutto...', a: 'mantenere puliti canali e suolo permeabile', d: ['cementificare tutto', 'gettare rifiuti nei tombini', 'chiudere parchi urbani'] },
      { q: 'Bonus difficile: quale sequenza è corretta in una catena alimentare semplice?', a: 'erba, coniglio, volpe', d: ['volpe, erba, coniglio', 'coniglio, volpe, erba', 'erba, volpe, coniglio'] },
      { q: 'Bonus difficile: un esperimento scientifico affidabile richiede...', a: 'osservazione, misura e verifica', d: ['solo intuizione', 'solo velocità', 'nessuna registrazione dati'] }
    ]
  }
};
window.SUBJECT_CONFIG = __sa.subjectConfig;
