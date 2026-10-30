// Contenuti della Wine Academy. Ogni guida ha i testi in italiano e inglese;
// per le altre lingue si usa l'inglese finché non vengono tradotti.

export type GuideCategory = 'learn' | 'app';

export type GuideBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: { title: string; text: string }[] }
  | { type: 'tip'; title: string; text: string }
  | { type: 'table'; head: [string, string]; rows: [string, string][] };

export interface GuideContent {
  title: string;
  subtitle: string;
  excerpt: string;
  blocks: GuideBlock[];
}

export type GuideIcon = 'wine' | 'chef' | 'restaurant' | 'shop' | 'chart' | 'report' | 'history' | 'box' | 'glass' | 'thermometer' | 'cloche' | 'calendar' | 'camera';

export interface Guide {
  slug: string;
  category: GuideCategory;
  icon: GuideIcon;
  gradient: string;
  content: { it: GuideContent; en: GuideContent };
}

export const GUIDES: Guide[] = [
  // ───────────────────────────── IMPARA IL VINO ─────────────────────────────
  {
    slug: 'leggere-etichetta-vino',
    category: 'learn',
    icon: 'camera',
    gradient: 'from-rose-700 to-wine-900',
    content: {
      it: {
        title: "Come leggere l'etichetta di un vino",
        subtitle: 'Le informazioni che contano, e quelle da non sopravvalutare',
        excerpt: "Denominazione, annata, Riserva, Classico: cosa significano davvero le scritte in etichetta e come usarle per scegliere meglio.",
        blocks: [
          { type: 'p', text: "L'etichetta è la carta d'identità del vino. Alcune informazioni sono obbligatorie per legge, altre sono scelte del produttore. Saperle distinguere ti permette di capire in pochi secondi che cosa hai in mano e quanto puoi aspettarti da quella bottiglia." },
          { type: 'h2', text: 'Le informazioni obbligatorie' },
          { type: 'list', items: [
            "**Denominazione o categoria**: per l'Italia DOCG, DOC, IGT oppure semplicemente \"Vino\". Indica da dove viene il vino e quanto sono severe le regole che il produttore ha dovuto rispettare.",
            "**Titolo alcolometrico**: la percentuale di alcol (es. 13,5% vol). Un valore alto indica di solito un vino più caldo e strutturato.",
            "**Volume**: 0,75 l è la bottiglia standard; la magnum (1,5 l) fa evolvere il vino più lentamente.",
            "**Imbottigliatore**: chi ha messo il vino in bottiglia. \"Imbottigliato all'origine\" significa che lo ha fatto la stessa azienda che ha prodotto l'uva o il vino.",
            "**Allergeni**: \"Contiene solfiti\" è presente su quasi tutti i vini, perché i solfiti si formano anche naturalmente durante la fermentazione.",
          ] },
          { type: 'h2', text: 'La piramide delle denominazioni' },
          { type: 'p', text: "Più si sale nella piramide, più il disciplinare di produzione è restrittivo: zona delimitata, vitigni ammessi, resa massima per ettaro, tempi minimi di affinamento." },
          { type: 'table', head: ['Sigla', 'Cosa significa'], rows: [
            ['DOCG', 'Denominazione di Origine Controllata e Garantita: le regole più severe, con analisi e degustazione prima della vendita. Ha la fascetta numerata sul collo.'],
            ['DOC', 'Denominazione di Origine Controllata: zona, vitigni e metodi definiti da un disciplinare.'],
            ['IGT', 'Indicazione Geografica Tipica: regole più ampie. Qui nascono anche grandi vini che escono dagli schemi, come molti "Supertuscan".'],
            ['Vino', 'Nessuna indicazione geografica: spesso vini semplici, a volte progetti originali del produttore.'],
          ] },
          { type: 'tip', title: 'La sigla non è un voto', text: "Un IGT di un ottimo produttore può valere più di un DOCG anonimo. La denominazione ti dice quanto sono strette le regole, non quanto è buono il vino: il nome del produttore conta almeno altrettanto." },
          { type: 'h2', text: 'Le menzioni che trovi più spesso' },
          { type: 'list', items: [
            "**Riserva**: il vino ha affinato più a lungo del minimo previsto dal disciplinare. Di solito è più strutturato e adatto a invecchiare.",
            "**Classico**: proviene dalla zona storica, più antica, della denominazione (es. Chianti Classico, Soave Classico).",
            "**Superiore**: requisiti più severi, ad esempio una gradazione minima più alta o rese più basse.",
            "**Annata (millesimo)**: l'anno della vendemmia. Per i vini da invecchiamento conta molto; per i vini freschi indica soprattutto quanto è giovane la bottiglia.",
            "**Metodo Classico**: per le bollicine, rifermentazione in bottiglia (come lo Champagne). \"Charmat\" o \"Martinotti\" indica la rifermentazione in autoclave, tipica del Prosecco.",
          ] },
          { type: 'h2', text: 'Retroetichetta: dove si nascondono i dettagli' },
          { type: 'p', text: "Sul retro molti produttori indicano vitigni, vinificazione, tempo in legno, temperatura di servizio e abbinamenti consigliati. Sono informazioni volontarie ma spesso preziose: un \"12 mesi in barrique\" ti anticipa un vino più morbido e speziato." },
          { type: 'tip', title: 'Con AIKNOW.WINE', text: "Fotografa l'etichetta: l'app legge produttore, denominazione, annata e vitigno e ti restituisce punteggio, profilo sensoriale, abbinamenti e finestra di consumo. Se l'annata non è leggibile te la chiede prima di valutare il vino." },
        ],
      },
      en: {
        title: 'How to read a wine label',
        subtitle: 'The information that matters, and what not to overrate',
        excerpt: 'Appellation, vintage, Riserva, Classico: what the words on a label really mean and how to use them to choose better.',
        blocks: [
          { type: 'p', text: "The label is the wine's ID card. Some information is required by law, other details are the producer's choice. Telling them apart lets you understand in seconds what you're holding and what to expect from the bottle." },
          { type: 'h2', text: 'Mandatory information' },
          { type: 'list', items: [
            '**Appellation or category**: in Italy DOCG, DOC, IGT or simply "Vino" (in France AOP/AOC, IGP, Vin de France). It tells you where the wine comes from and how strict the rules were.',
            '**Alcohol by volume**: e.g. 13.5% vol. A higher value usually means a warmer, fuller wine.',
            '**Volume**: 0.75 l is standard; a magnum (1.5 l) ages more slowly.',
            '**Bottler**: who bottled the wine. "Estate bottled" means the same winery that grew the grapes or made the wine.',
            '**Allergens**: "Contains sulphites" appears on almost every wine, because sulphites also form naturally during fermentation.',
          ] },
          { type: 'h2', text: 'The appellation pyramid' },
          { type: 'p', text: 'The higher you go, the stricter the production rules: defined area, permitted grapes, maximum yield per hectare, minimum ageing.' },
          { type: 'table', head: ['Label', 'What it means'], rows: [
            ['DOCG', 'Controlled and Guaranteed Designation of Origin: the strictest rules, with lab analysis and tasting before release. Numbered strip on the neck.'],
            ['DOC', 'Controlled Designation of Origin: area, grapes and methods set by official rules.'],
            ['IGT', 'Typical Geographical Indication: broader rules. Home to great wines that break the mould, like many "Super Tuscans".'],
            ['Vino', 'No geographical indication: often simple wines, sometimes original projects.'],
          ] },
          { type: 'tip', title: 'An appellation is not a score', text: 'An IGT from a great producer can beat an anonymous DOCG. The appellation tells you how strict the rules are, not how good the wine is: the producer matters at least as much.' },
          { type: 'h2', text: 'Common terms' },
          { type: 'list', items: [
            '**Riserva / Reserva**: aged longer than the minimum required. Usually fuller and better suited to ageing.',
            '**Classico**: from the historic heart of the appellation (e.g. Chianti Classico, Soave Classico).',
            '**Superiore**: stricter requirements, such as higher minimum alcohol or lower yields.',
            '**Vintage**: the harvest year. It matters a lot for age-worthy wines; for fresh wines it mainly tells you how young the bottle is.',
            '**Traditional method**: for sparkling wines, second fermentation in the bottle (like Champagne). "Charmat" means tank fermentation, typical of Prosecco.',
          ] },
          { type: 'h2', text: 'The back label' },
          { type: 'p', text: 'Many producers list grapes, winemaking, time in oak, serving temperature and pairings on the back. It is voluntary but often valuable: "12 months in barrique" tells you to expect a rounder, spicier wine.' },
          { type: 'tip', title: 'With AIKNOW.WINE', text: 'Snap the label: the app reads producer, appellation, vintage and grape and gives you a score, sensory profile, pairings and drinking window. If the vintage is unreadable, it asks you before rating the wine.' },
        ],
      },
    },
  },
  {
    slug: 'conservare-vino-casa',
    category: 'learn',
    icon: 'box',
    gradient: 'from-stone-700 to-stone-950',
    content: {
      it: {
        title: 'Conservare il vino a casa',
        subtitle: 'Temperatura, umidità, luce: le regole per non rovinare le bottiglie',
        excerpt: 'Non serve una cantina sotterranea: bastano poche regole per far invecchiare bene i tuoi vini, anche in appartamento.',
        blocks: [
          { type: 'p', text: "Il vino è vivo: in bottiglia continua a evolvere. Le condizioni in cui lo conservi decidono se quell'evoluzione lo migliorerà o lo rovinerà. La buona notizia è che le regole sono poche e chiare." },
          { type: 'h2', text: 'Le cinque regole' },
          { type: 'steps', items: [
            { title: 'Temperatura costante, tra 10 e 15 °C', text: "L'ideale è intorno ai 12–14 °C. Più della temperatura esatta conta la stabilità: gli sbalzi fanno dilatare e contrarre il vino, che spinge sul tappo e lascia entrare ossigeno. Sopra i 20 °C l'invecchiamento accelera e il vino si appiattisce." },
            { title: 'Umidità tra 60 e 75%', text: "Un ambiente troppo secco fa seccare il tappo di sughero, che si ritira e lascia passare aria. Troppo umido rovina le etichette e favorisce le muffe." },
            { title: 'Buio', text: 'La luce, soprattutto quella solare e dei neon, degrada il vino in poche settimane ("gusto di luce"). Sono più a rischio i bianchi, i rosati e le bollicine in bottiglie chiare.' },
            { title: 'Bottiglie coricate', text: 'Se il tappo è di sughero, tieni la bottiglia orizzontale così il vino lo mantiene umido. Tappi a vite e sintetici possono stare anche in piedi.' },
            { title: 'Niente vibrazioni e niente odori', text: "Evita la vicinanza di elettrodomestici che vibrano e di prodotti dall'odore forte (vernici, detersivi): il sughero non è impermeabile agli odori." },
          ] },
          { type: 'h2', text: 'Dove metterle, in pratica' },
          { type: 'list', items: [
            "**Cantina o seminterrato**: la scelta migliore se fresco, buio e senza sbalzi.",
            "**Cantinetta frigo**: la soluzione più affidabile in appartamento. Mantiene temperatura e umidità stabili; i modelli a più zone permettono di tenere i bianchi già pronti da servire.",
            "**Armadio o ripostiglio interno**: accettabile per pochi mesi, lontano da caloriferi, forno e pareti esposte al sole.",
            "**Da evitare**: cucina, sopra il frigorifero, vicino al termosifone, garage non isolati.",
          ] },
          { type: 'tip', title: 'Il frigorifero di casa', text: "Va bene per qualche giorno prima di servire, non per mesi: è troppo freddo e troppo secco, e il tappo ne soffre." },
          { type: 'h2', text: 'E dopo aver aperto la bottiglia?' },
          { type: 'p', text: "Richiudila e mettila in frigo, anche se è un rosso: il freddo rallenta l'ossidazione. Un rosso strutturato regge 2–4 giorni, un bianco o un rosato 2–3, le bollicine 1–2 con un tappo apposito. I vini dolci e fortificati durano molto di più." },
          { type: 'tip', title: 'Con AIKNOW.WINE', text: "Registra dove si trova ogni bottiglia: puoi ricostruire in 3D scaffali e cantinette frigo con colonne e ripiani, e segnare il posto esatto o solo il ripiano. L'app ti indica anche quali vini sono pronti e quali vanno bevuti presto." },
        ],
      },
      en: {
        title: 'Storing wine at home',
        subtitle: 'Temperature, humidity, light: the rules for keeping bottles at their best',
        excerpt: "You don't need an underground cellar: a few rules are enough to age your wines well, even in a flat.",
        blocks: [
          { type: 'p', text: 'Wine is alive: it keeps evolving in the bottle. How you store it decides whether that evolution improves it or ruins it. The good news is that the rules are few and clear.' },
          { type: 'h2', text: 'The five rules' },
          { type: 'steps', items: [
            { title: 'Steady temperature, 10–15 °C', text: 'Around 12–14 °C is ideal. Stability matters more than the exact number: swings make the wine expand and contract, pushing on the cork and letting oxygen in. Above 20 °C ageing speeds up and the wine goes flat.' },
            { title: 'Humidity 60–75%', text: 'Too dry and the cork shrinks and lets air in. Too humid and labels spoil and mould grows.' },
            { title: 'Darkness', text: 'Light, especially sunlight and fluorescent tubes, damages wine within weeks ("light strike"). Whites, rosés and sparkling wines in clear bottles are most at risk.' },
            { title: 'Bottles on their side', text: 'With natural cork, keep bottles horizontal so the wine keeps the cork moist. Screw caps and synthetic closures can stand upright.' },
            { title: 'No vibrations, no smells', text: 'Keep wine away from vibrating appliances and strong smells (paint, detergents): cork is not odour-proof.' },
          ] },
          { type: 'h2', text: 'Where to keep them' },
          { type: 'list', items: [
            '**Cellar or basement**: the best choice if cool, dark and stable.',
            '**Wine fridge**: the most reliable option in a flat. It keeps temperature and humidity steady; multi-zone models keep whites ready to serve.',
            '**Inner cupboard**: fine for a few months, away from radiators, the oven and sun-facing walls.',
            '**Avoid**: the kitchen, the top of the fridge, near radiators, uninsulated garages.',
          ] },
          { type: 'tip', title: 'Your kitchen fridge', text: "Fine for a few days before serving, not for months: it is too cold and too dry, and the cork suffers." },
          { type: 'h2', text: 'After opening' },
          { type: 'p', text: 'Re-cork it and put it in the fridge, even if it is red: cold slows oxidation. A full red lasts 2–4 days, a white or rosé 2–3, sparkling wine 1–2 with a stopper. Sweet and fortified wines last much longer.' },
          { type: 'tip', title: 'With AIKNOW.WINE', text: 'Record where every bottle is: rebuild racks and wine fridges in 3D with columns and shelves, and mark the exact slot or just the shelf. The app also shows which wines are ready and which should be drunk soon.' },
        ],
      },
    },
  },
  {
    slug: 'temperature-servizio-vino',
    category: 'learn',
    icon: 'glass',
    gradient: 'from-sky-700 to-indigo-900',
    content: {
      it: {
        title: 'A che temperatura servire il vino',
        subtitle: 'Pochi gradi cambiano completamente il bicchiere',
        excerpt: 'Bianchi troppo freddi, rossi troppo caldi: la tabella delle temperature e i trucchi per arrivarci in pochi minuti.',
        blocks: [
          { type: 'p', text: "La temperatura è il modo più semplice e gratuito per migliorare un vino. Troppo freddo, gli aromi si chiudono e i tannini sembrano più duri; troppo caldo, l'alcol prende il sopravvento e il vino sembra pesante." },
          { type: 'h2', text: 'La tabella di riferimento' },
          { type: 'table', head: ['Tipologia', 'Temperatura'], rows: [
            ['Bollicine giovani (Prosecco, Charmat)', '6–8 °C'],
            ['Metodo Classico e Champagne importanti, millesimati', '8–10 °C'],
            ['Bianchi leggeri e aromatici, rosati', '8–10 °C'],
            ['Bianchi strutturati o affinati in legno', '10–13 °C'],
            ['Rossi leggeri e giovani', '14–16 °C'],
            ['Rossi strutturati e da invecchiamento', '16–18 °C'],
            ['Vini dolci e passiti', '10–14 °C'],
          ] },
          { type: 'tip', title: '"Temperatura ambiente" non vuol dire 24 °C', text: "L'espressione nasce quando le case erano molto più fresche. Oggi un rosso lasciato in salotto è spesso troppo caldo: qualche minuto in frigo lo migliora." },
          { type: 'h2', text: 'Come arrivarci in fretta' },
          { type: 'list', items: [
            "**Secchiello con acqua e ghiaccio**: raffredda una bottiglia in circa 15–20 minuti, molto più velocemente del frigorifero. Aggiungi un pugno di sale per accelerare.",
            "**Rosso troppo caldo**: 15–20 minuti in frigorifero prima di servirlo.",
            "**Bianco troppo freddo**: versalo e aspetta qualche minuto; nel bicchiere si scalda in fretta.",
            "**Evita il freezer**: si rischia di dimenticare la bottiglia e il raffreddamento è poco uniforme.",
          ] },
          { type: 'h2', text: 'Il bicchiere conta' },
          { type: 'p', text: "Riempi il calice per non più di un terzo: lasci spazio agli aromi e il vino non si scalda troppo in mano. Tieni il bicchiere dallo stelo, non dalla coppa." },
          { type: 'tip', title: 'Con AIKNOW.WINE', text: "Ogni vino in cantina ha la sua temperatura di servizio consigliata, e il Sommelier la indica insieme a ogni abbinamento suggerito." },
        ],
      },
      en: {
        title: 'What temperature to serve wine at',
        subtitle: 'A few degrees change the glass completely',
        excerpt: 'Whites too cold, reds too warm: the temperature chart and the tricks to get there in minutes.',
        blocks: [
          { type: 'p', text: 'Temperature is the simplest free way to improve a wine. Too cold and the aromas close up and tannins feel harsher; too warm and the alcohol takes over and the wine feels heavy.' },
          { type: 'h2', text: 'Reference chart' },
          { type: 'table', head: ['Style', 'Temperature'], rows: [
            ['Young sparkling (Prosecco, tank method)', '6–8 °C'],
            ['Fine traditional method and Champagne, vintage', '8–10 °C'],
            ['Light, aromatic whites and rosés', '8–10 °C'],
            ['Full or oak-aged whites', '10–13 °C'],
            ['Light, young reds', '14–16 °C'],
            ['Full-bodied, age-worthy reds', '16–18 °C'],
            ['Sweet and dessert wines', '10–14 °C'],
          ] },
          { type: 'tip', title: '"Room temperature" does not mean 24 °C', text: 'The phrase dates from when homes were much cooler. A red left in the living room today is often too warm: a few minutes in the fridge helps.' },
          { type: 'h2', text: 'Getting there fast' },
          { type: 'list', items: [
            '**Ice bucket with water and ice**: chills a bottle in about 15–20 minutes, far faster than the fridge. A handful of salt speeds it up.',
            '**Red too warm**: 15–20 minutes in the fridge before serving.',
            '**White too cold**: pour it and wait a few minutes; it warms quickly in the glass.',
            '**Avoid the freezer**: easy to forget the bottle, and cooling is uneven.',
          ] },
          { type: 'h2', text: 'The glass matters' },
          { type: 'p', text: 'Fill the glass no more than a third: it leaves room for the aromas and keeps the wine from warming in your hand. Hold it by the stem, not the bowl.' },
          { type: 'tip', title: 'With AIKNOW.WINE', text: 'Every wine in your cellar has its recommended serving temperature, and the Sommelier gives it with every suggested pairing.' },
        ],
      },
    },
  },
  {
    slug: 'abbinamento-cibo-vino',
    category: 'learn',
    icon: 'cloche',
    gradient: 'from-amber-600 to-orange-800',
    content: {
      it: {
        title: 'Abbinamento cibo-vino: le regole base',
        subtitle: 'Concordanza e contrapposizione, spiegate semplici',
        excerpt: 'Perché le bollicine stanno bene con il fritto e il dolce vuole un vino dolce: i due principi che ti servono per abbinare con sicurezza.',
        blocks: [
          { type: 'p', text: "Un buon abbinamento non è una regola da imparare a memoria: è un equilibrio. Il piatto e il vino non devono coprirsi a vicenda, e ognuno dovrebbe far sembrare migliore l'altro. Bastano due principi per orientarsi quasi sempre." },
          { type: 'h2', text: '1. Concordanza: simile con simile' },
          { type: 'list', items: [
            "**Intensità**: piatti delicati con vini delicati, piatti saporiti con vini strutturati. Un brasato schiaccia un bianco leggero; un Amarone copre un branzino al vapore.",
            "**Dolcezza**: con il dessert il vino deve essere dolce almeno quanto il dolce, altrimenti sembrerà acido e amaro. Un secco con la torta non funziona quasi mai.",
            "**Aromaticità**: cucine speziate e aromatiche stanno bene con vini aromatici (Gewürztraminer, Moscato secco, Riesling).",
          ] },
          { type: 'h2', text: '2. Contrapposizione: il vino \"pulisce\" la bocca' },
          { type: 'table', head: ['Nel piatto', 'Cerca nel vino'], rows: [
            ['Grassezza, fritto, burro, formaggi', 'Acidità e bollicine, che sgrassano'],
            ['Succulenza (carni al sangue, sughi)', 'Tannino, che asciuga'],
            ['Sapidità (salumi, formaggi stagionati)', 'Morbidezza e una leggera dolcezza'],
            ['Tendenza dolce (crostacei, zucca)', 'Acidità e sapidità'],
          ] },
          { type: 'tip', title: 'Il trucco del territorio', text: "Nel dubbio, abbina piatto e vino della stessa zona: tortellini e Lambrusco, pesto e Vermentino, bistecca alla fiorentina e Chianti. Le cucine regionali sono cresciute insieme ai loro vini." },
          { type: 'h2', text: 'Gli abbinamenti difficili' },
          { type: 'list', items: [
            "**Carciofi e asparagi**: rendono amari e metallici molti vini. Meglio bianchi freschi e non affinati in legno.",
            "**Aceto e agrumi in quantità**: l'acidità del piatto fa sembrare il vino piatto; scegli vini con acidità altrettanto vivace.",
            "**Piccante**: l'alcol e il tannino amplificano il bruciore. Meglio vini profumati, con poco alcol e un filo di dolcezza.",
            "**Pesce**: non vuole per forza un bianco. Una zuppa di pesce al pomodoro o un tonno alla griglia stanno bene con un rosso leggero e poco tannico, servito fresco.",
          ] },
          { type: 'tip', title: 'Con AIKNOW.WINE', text: "Scrivi il menu di stasera: il Sommelier sceglie le bottiglie più adatte tra quelle che hai in cantina, portata per portata o con un solo vino, e se manca qualcosa ti dice cosa comprare." },
        ],
      },
      en: {
        title: 'Food and wine pairing: the basics',
        subtitle: 'Matching and contrast, explained simply',
        excerpt: 'Why bubbles love fried food and dessert wants a sweet wine: the two principles you need to pair with confidence.',
        blocks: [
          { type: 'p', text: "A good pairing isn't a rule to memorise: it's a balance. Dish and wine shouldn't overpower each other, and each should make the other taste better. Two principles cover almost every case." },
          { type: 'h2', text: '1. Matching: like with like' },
          { type: 'list', items: [
            '**Intensity**: delicate dishes with delicate wines, bold dishes with structured wines. A braise crushes a light white; an Amarone buries steamed sea bass.',
            '**Sweetness**: with dessert, the wine must be at least as sweet as the dish, or it will taste sour and bitter. Dry wine with cake rarely works.',
            '**Aromatics**: spiced, aromatic cuisines go well with aromatic wines (Gewürztraminer, dry Muscat, Riesling).',
          ] },
          { type: 'h2', text: '2. Contrast: the wine "cleans" the palate' },
          { type: 'table', head: ['On the plate', 'Look for in the wine'], rows: [
            ['Fat, fried food, butter, cheese', 'Acidity and bubbles, which cut through'],
            ['Juiciness (rare meat, rich sauces)', 'Tannin, which dries'],
            ['Saltiness (cured meats, aged cheese)', 'Softness and a touch of sweetness'],
            ['Sweet notes (shellfish, pumpkin)', 'Acidity and minerality'],
          ] },
          { type: 'tip', title: 'The regional trick', text: 'When in doubt, pair dish and wine from the same area: tortellini and Lambrusco, pesto and Vermentino, Florentine steak and Chianti. Regional cuisines grew up with their wines.' },
          { type: 'h2', text: 'Tricky pairings' },
          { type: 'list', items: [
            '**Artichokes and asparagus**: make many wines taste bitter and metallic. Choose fresh, unoaked whites.',
            '**Lots of vinegar or citrus**: the acidity makes wine taste flat; pick wines with equally lively acidity.',
            '**Spicy food**: alcohol and tannin amplify the burn. Prefer aromatic wines, low in alcohol, with a hint of sweetness.',
            '**Fish**: does not always need white. Tomato fish stew or grilled tuna pair well with a light, low-tannin red served cool.',
          ] },
          { type: 'tip', title: 'With AIKNOW.WINE', text: "Type tonight's menu: the Sommelier picks the best bottles from your own cellar, course by course or with a single wine, and tells you what to buy if something is missing." },
        ],
      },
    },
  },
  {
    slug: 'quando-aprire-bottiglia',
    category: 'learn',
    icon: 'calendar',
    gradient: 'from-emerald-700 to-teal-900',
    content: {
      it: {
        title: 'Quando aprire una bottiglia: la finestra di beva',
        subtitle: 'Né troppo presto né troppo tardi',
        excerpt: 'La maggior parte dei vini va bevuta giovane, alcuni migliorano per decenni. Come capire in quale gruppo è la tua bottiglia.',
        blocks: [
          { type: 'p', text: "La finestra di beva è il periodo in cui un vino dà il meglio di sé. Prima è chiuso e spigoloso, dopo perde frutto e freschezza. Saperla stimare evita due errori frequenti: stappare troppo presto una bottiglia importante e dimenticarne un'altra finché non è stanca." },
          { type: 'h2', text: 'La verità che pochi dicono' },
          { type: 'p', text: "La gran parte dei vini in commercio è fatta per essere bevuta entro pochi anni dalla vendemmia. Invecchiare un vino nato per essere fresco non lo migliora: lo spegne." },
          { type: 'table', head: ['Tipologia', 'Finestra indicativa'], rows: [
            ['Bianchi freschi e aromatici, rosati', '1–3 anni'],
            ['Bollicine Charmat (es. Prosecco)', '1–2 anni'],
            ['Rossi giovani e leggeri', '2–5 anni'],
            ['Bianchi strutturati, affinati in legno', '3–8 anni'],
            ['Metodo Classico millesimato', '5–10 anni e oltre'],
            ['Grandi rossi (Barolo, Brunello, Bordeaux)', '10–20 anni e oltre'],
            ['Passiti e vini fortificati', 'Anche decenni'],
          ] },
          { type: 'h2', text: 'Cosa permette a un vino di invecchiare' },
          { type: 'list', items: [
            "**Tannino**: protegge il vino e con il tempo si ammorbidisce.",
            "**Acidità**: mantiene il vino vivo e fresco negli anni.",
            "**Struttura e concentrazione**: un vino ricco ha più materia da far evolvere.",
            "**Zucchero**: i vini dolci sono tra i più longevi in assoluto.",
            "**Annata e conservazione**: un'annata equilibrata e una cantina stabile allungano la vita della bottiglia.",
          ] },
          { type: 'h2', text: 'I segnali nel bicchiere' },
          { type: 'list', items: [
            "**Colore**: i rossi passano dal rubino al granato e poi all'aranciato; i bianchi dal paglierino al dorato e all'ambrato.",
            "**Aromi**: dal frutto fresco si passa a sentori evolutivi come cuoio, tabacco, sottobosco, frutta secca, miele.",
            "**Troppo presto**: tannino duro, aromi chiusi. Prova a decantarlo un'ora.",
            "**Troppo tardi**: frutto spento, note di ossidazione (mela cotta, nocciola, vino \"stanco\").",
          ] },
          { type: 'tip', title: 'Con AIKNOW.WINE', text: "Ogni bottiglia in cantina ha la sua finestra di consumo stimata e uno stato (da attendere, pronta, oltre il picco). La pagina Dati ti mostra l'elenco dei vini da bere presto, così nessuna bottiglia va sprecata." },
        ],
      },
      en: {
        title: 'When to open a bottle: the drinking window',
        subtitle: 'Not too early, not too late',
        excerpt: 'Most wines should be drunk young, a few improve for decades. How to tell which group your bottle belongs to.',
        blocks: [
          { type: 'p', text: 'The drinking window is when a wine shows its best. Before, it is closed and angular; after, it loses fruit and freshness. Estimating it avoids two common mistakes: opening a special bottle too early, and forgetting another until it is tired.' },
          { type: 'h2', text: 'The truth few people tell you' },
          { type: 'p', text: "Most wines on the market are made to be drunk within a few years of the harvest. Ageing a wine meant to be fresh doesn't improve it: it dulls it." },
          { type: 'table', head: ['Style', 'Indicative window'], rows: [
            ['Fresh, aromatic whites and rosés', '1–3 years'],
            ['Tank-method sparkling (e.g. Prosecco)', '1–2 years'],
            ['Young, light reds', '2–5 years'],
            ['Full, oak-aged whites', '3–8 years'],
            ['Vintage traditional-method sparkling', '5–10+ years'],
            ['Great reds (Barolo, Brunello, Bordeaux)', '10–20+ years'],
            ['Dessert and fortified wines', 'Even decades'],
          ] },
          { type: 'h2', text: 'What lets a wine age' },
          { type: 'list', items: [
            '**Tannin**: protects the wine and softens over time.',
            '**Acidity**: keeps the wine lively for years.',
            '**Structure and concentration**: a rich wine has more to evolve.',
            '**Sugar**: sweet wines are among the longest-lived of all.',
            '**Vintage and storage**: a balanced year and a stable cellar extend a bottle\'s life.',
          ] },
          { type: 'h2', text: 'Signs in the glass' },
          { type: 'list', items: [
            '**Colour**: reds move from ruby to garnet to orange; whites from straw to gold to amber.',
            '**Aromas**: fresh fruit gives way to leather, tobacco, forest floor, dried fruit, honey.',
            '**Too early**: hard tannin, closed aromas. Try decanting it for an hour.',
            '**Too late**: faded fruit, oxidised notes (baked apple, hazelnut, a "tired" wine).',
          ] },
          { type: 'tip', title: 'With AIKNOW.WINE', text: 'Every bottle in your cellar has an estimated drinking window and a status (wait, ready, past its peak). The Data page lists the wines to drink soon, so no bottle goes to waste.' },
        ],
      },
    },
  },

  // ───────────────────────────── USA AIKNOW.WINE ─────────────────────────────
  {
    slug: 'cantina-digitale',
    category: 'app',
    icon: 'wine',
    gradient: 'from-wine-700 to-wine-950',
    content: {
      it: {
        title: 'La cantina digitale',
        subtitle: 'Ogni bottiglia catalogata con una foto',
        excerpt: "Come aggiungere un vino scattando l'etichetta e cosa ti restituisce l'analisi: punteggio, profilo, abbinamenti e quando aprirlo.",
        blocks: [
          { type: 'p', text: "La cantina digitale è il cuore di AIKNOW.WINE: un inventario sempre aggiornato di ciò che possiedi, con tutte le informazioni utili per scegliere quando e con cosa aprire ogni bottiglia." },
          { type: 'h2', text: 'Aggiungere un vino' },
          { type: 'steps', items: [
            { title: "Fotografa l'etichetta", text: "Premi il pulsante + nella Cantina e scatta una foto chiara dell'etichetta frontale." },
            { title: "Conferma l'annata, se serve", text: "L'app legge prima l'annata: se non è visibile te la chiede subito, perché incide sulla valutazione." },
            { title: "Leggi l'analisi", text: "Ricevi punteggio qualità su 100, profilo sensoriale (da fresco a ricco, corpo, acidità, tannino, legno, persistenza, aromi), abbinamenti, finestra di consumo, temperatura di servizio e valore di mercato stimato." },
            { title: 'Completa i dati di cantina', text: 'Indica quante bottiglie hai, dove le tieni, quanto le hai pagate e quando le hai comprate. Poi salva.' },
          ] },
          { type: 'tip', title: 'Una foto buona fa la differenza', text: "Inquadra l'etichetta dritta, ben illuminata e senza riflessi. Se il nome o il produttore non sono leggibili, il riconoscimento è meno preciso." },
          { type: 'h2', text: 'Trovare subito ciò che cerchi' },
          { type: 'list', items: [
            '**Filtri** per rossi, bianchi e bollicine, che riconoscono anche diciture come "Rosso Fermo" o "Spumante Rosé".',
            '**Ricerca** per nome, produttore o tipologia, e filtro per posizione.',
            '**Stato di beva** su ogni scheda: da attendere, pronto, oltre il picco.',
            "**Su tablet e computer** la cantina diventa una griglia con più informazioni su ogni vino.",
          ] },
          { type: 'h2', text: 'Quando bevi una bottiglia' },
          { type: 'p', text: "Dalla scheda del vino premi \"Stappa e vota\": la quantità scende di uno, la bottiglia finisce nel tuo Storico e puoi darle un voto e una nota. Se avevi registrato il suo posto nello scaffale, quel posto si libera da solo." },
          { type: 'tip', title: 'Approfondisci', text: "Se hai molte bottiglie, configura le tue posizioni in 3D per sapere esattamente dove si trova ciascuna: trovi tutto nella guida \"La tua cantina in 3D\"." },
        ],
      },
      en: {
        title: 'The digital cellar',
        subtitle: 'Every bottle catalogued with a photo',
        excerpt: 'How to add a wine by snapping its label and what the analysis gives you: score, profile, pairings and when to open it.',
        blocks: [
          { type: 'p', text: 'The digital cellar is the heart of AIKNOW.WINE: an always up-to-date inventory of what you own, with everything you need to decide when and with what to open each bottle.' },
          { type: 'h2', text: 'Adding a wine' },
          { type: 'steps', items: [
            { title: 'Snap the label', text: 'Tap + in the Cellar and take a clear photo of the front label.' },
            { title: 'Confirm the vintage if needed', text: 'The app reads the vintage first: if it is not visible it asks you straight away, because it affects the rating.' },
            { title: 'Read the analysis', text: 'You get a quality score out of 100, a sensory profile (fresh to rich, body, acidity, tannin, oak, length, aromas), pairings, drinking window, serving temperature and estimated market value.' },
            { title: 'Complete the cellar details', text: 'Enter how many bottles you have, where you keep them, what you paid and when you bought them. Then save.' },
          ] },
          { type: 'tip', title: 'A good photo makes the difference', text: 'Frame the label straight, well lit and without glare. If the name or producer is unreadable, recognition is less accurate.' },
          { type: 'h2', text: 'Find what you need instantly' },
          { type: 'list', items: [
            '**Filters** for reds, whites and sparkling, which also recognise labels like "Still Red" or "Sparkling Rosé".',
            '**Search** by name, producer or style, and filter by location.',
            '**Drinking status** on every card: wait, ready, past its peak.',
            '**On tablets and computers** the cellar becomes a grid with more information on each wine.',
          ] },
          { type: 'h2', text: 'When you drink a bottle' },
          { type: 'p', text: 'From the wine card tap "Uncork & rate": the quantity drops by one, the bottle goes to your History and you can rate it and add a note. If you had recorded its slot on a rack, that slot frees up automatically.' },
          { type: 'tip', title: 'Go further', text: 'If you have many bottles, set up your locations in 3D to know exactly where each one is: see the guide "Your cellar in 3D".' },
        ],
      },
    },
  },
  {
    slug: 'cantina-3d',
    category: 'app',
    icon: 'box',
    gradient: 'from-cyan-700 to-stone-950',
    content: {
      it: {
        title: 'La tua cantina in 3D',
        subtitle: 'Scaffali e cantinette frigo ricostruiti come a casa tua',
        excerpt: 'Configura colonne e ripiani, posiziona le bottiglie al posto esatto o sul ripiano e ritrovale in una vista 3D.',
        blocks: [
          { type: 'p', text: "Con poche bottiglie basta sapere \"in cantina\" o \"in cucina\". Con decine o centinaia di etichette serve di più: sapere esattamente su quale ripiano e in quale posto si trova quella bottiglia. Per questo AIKNOW.WINE ti permette di ricostruire in 3D le tue posizioni." },
          { type: 'h2', text: 'Tre tipi di posizione' },
          { type: 'list', items: [
            '**Generica**: solo un nome, come oggi (es. "Cucina"). Nessun posto preciso.',
            "**Scaffale**: scegli quante colonne, e per ognuna quanti ripiani e quante bottiglie per ripiano. Le colonne possono avere altezze diverse, come negli scaffali modulari.",
            '**Cantinetta frigo**: indichi i ripiani e le bottiglie per ripiano; l\'app disegna una cantinetta con porta in vetro e luce interna.',
          ] },
          { type: 'h2', text: 'Configurare una posizione' },
          { type: 'steps', items: [
            { title: 'Apri "Gestisci posizioni"', text: "Dall'icona ingranaggio nella Cantina. Crea una posizione o scegline una esistente e premi \"Configura in 3D\"." },
            { title: 'Scegli il tipo e le misure', text: "Per uno scaffale usa la configurazione rapida (stesse misure per tutte le colonne) o modifica ogni colonna. L'anteprima 3D si aggiorna mentre cambi i numeri." },
            { title: 'Salva', text: "Se riduci una struttura che contiene già bottiglie posizionate, l'app ti avvisa: quelle che restano fuori tornano \"da posizionare\"." },
          ] },
          { type: 'h2', text: 'Posizionare le bottiglie' },
          { type: 'p', text: "Dalla scheda di un vino premi \"Posiziona in 3D\", oppure apri la vista 3D e usa l'elenco \"Da posizionare\". Hai due livelli di precisione:" },
          { type: 'list', items: [
            '**Posto esatto**: tocchi un cerchio verde libero e la bottiglia va proprio lì.',
            '**Solo ripiano**: tocchi un ripiano. Comodo se le bottiglie si spostano spesso; nella vista 3D appaiono semitrasparenti.',
          ] },
          { type: 'p', text: "Ogni bottiglia ha il suo posto: se hai sei bottiglie dello stesso vino puoi metterle in punti diversi. Tocca una bottiglia evidenziata per toglierla dal suo posto." },
          { type: 'h2', text: 'Ritrovare una bottiglia' },
          { type: 'list', items: [
            'La scheda del vino e la card in Cantina mostrano il posto, ad esempio "Col. 2 · Ripiano 3 · Posto 4". I ripiani sono numerati dall\'alto.',
            "Nella vista 3D trascini per ruotare, pizzichi o usi la rotella per lo zoom, e con due dita o il tasto destro ti sposti.",
            'Passando sopra una bottiglia vedi nome, produttore e posto; toccandola puoi aprirne la scheda o spostarla.',
          ] },
          { type: 'tip', title: 'Automatico quando bevi', text: "Quando stappi una bottiglia il suo posto si libera da solo, e se cambi la posizione di un vino il vecchio posto viene cancellato: la vista 3D resta sempre allineata alla realtà." },
        ],
      },
      en: {
        title: 'Your cellar in 3D',
        subtitle: 'Racks and wine fridges rebuilt just like at home',
        excerpt: 'Set up columns and shelves, place bottles in the exact slot or on a shelf, and find them again in a 3D view.',
        blocks: [
          { type: 'p', text: 'With a few bottles, "in the cellar" or "in the kitchen" is enough. With dozens or hundreds of labels you need more: knowing exactly which shelf and which slot a bottle is in. That is why AIKNOW.WINE lets you rebuild your locations in 3D.' },
          { type: 'h2', text: 'Three location types' },
          { type: 'list', items: [
            '**Generic**: just a name (e.g. "Kitchen"). No exact slot.',
            '**Rack**: choose how many columns, and for each one how many shelves and bottles per shelf. Columns can have different heights, like modular racks.',
            '**Wine fridge**: set shelves and bottles per shelf; the app draws a fridge with glass door and interior light.',
          ] },
          { type: 'h2', text: 'Setting up a location' },
          { type: 'steps', items: [
            { title: 'Open "Manage locations"', text: 'From the gear icon in the Cellar. Create a location or pick an existing one and tap "Set up in 3D".' },
            { title: 'Choose type and size', text: 'For a rack use the quick setup (same size for every column) or edit each column. The 3D preview updates as you change the numbers.' },
            { title: 'Save', text: 'If you shrink a structure that already holds placed bottles, the app warns you: those left outside go back to "to be placed".' },
          ] },
          { type: 'h2', text: 'Placing bottles' },
          { type: 'p', text: 'From a wine card tap "Place in 3D", or open the 3D view and use the "To be placed" list. There are two levels of precision:' },
          { type: 'list', items: [
            '**Exact slot**: tap a free green circle and the bottle goes right there.',
            '**Shelf only**: tap a shelf. Handy if bottles move around often; in the 3D view they appear semi-transparent.',
          ] },
          { type: 'p', text: 'Every bottle has its own slot: six bottles of the same wine can sit in different places. Tap a highlighted bottle to remove it from its slot.' },
          { type: 'h2', text: 'Finding a bottle' },
          { type: 'list', items: [
            'The wine card and the Cellar card show the slot, e.g. "Col. 2 · Shelf 3 · Slot 4". Shelves are numbered from the top.',
            'In the 3D view drag to rotate, pinch or scroll to zoom, and use two fingers or right-click to move around.',
            'Hover a bottle to see name, producer and slot; tap it to open its card or move it.',
          ] },
          { type: 'tip', title: 'Automatic when you drink', text: "When you uncork a bottle its slot frees up by itself, and if you change a wine's location the old slot is cleared: the 3D view always matches reality." },
        ],
      },
    },
  },
  {
    slug: 'sommelier-a-casa',
    category: 'app',
    icon: 'chef',
    gradient: 'from-amber-500 to-amber-800',
    content: {
      it: {
        title: 'Il Sommelier a casa',
        subtitle: 'Dici cosa cucini, sceglie tra le tue bottiglie',
        excerpt: 'Inserisci il menu della cena e ricevi gli abbinamenti pescati dalla tua cantina, con temperatura e consigli di servizio.',
        blocks: [
          { type: 'p', text: "Hai ospiti a cena e decine di bottiglie in cantina, ma non sai cosa aprire? Il Sommelier conosce il tuo inventario e ti suggerisce le bottiglie giuste per ciò che hai in tavola." },
          { type: 'h2', text: 'Come funziona' },
          { type: 'steps', items: [
            { title: 'Scrivi il menu', text: 'Anche in modo informale: "antipasto di salumi, risotto ai funghi, arrosto di vitello, tiramisù".' },
            { title: 'Scegli il servizio', text: '"Per portata", per un vino diverso a ogni piatto, oppure "Un solo vino", per una bottiglia che accompagni tutta la cena.' },
            { title: 'Leggi i consigli', text: 'Per ogni portata ricevi più opzioni, con la motivazione, la temperatura di servizio e un consiglio pratico (es. stapparlo un\'ora prima).' },
          ] },
          { type: 'h2', text: 'In cantina o da comprare' },
          { type: 'list', items: [
            '**Vini che possiedi**: indicati con la posizione in cui si trovano. Da lì puoi premere "Stappa e vota" per registrare la bottiglia.',
            "**Consigli d'acquisto**: se in cantina manca qualcosa di adatto, il Sommelier ti suggerisce cosa comprare.",
          ] },
          { type: 'tip', title: 'Condividi la cena', text: "Con \"Condividi abbinamento\" generi un link con menu e vini scelti, da mandare agli ospiti o tenere per la prossima volta." },
          { type: 'tip', title: 'Rendi i consigli più personali', text: "Più bottiglie registri e più voti dai nello Storico, più i suggerimenti rispecchiano i tuoi gusti." },
        ],
      },
      en: {
        title: 'The Sommelier at home',
        subtitle: 'Say what you are cooking, it picks from your bottles',
        excerpt: 'Enter your dinner menu and get pairings drawn from your own cellar, with serving temperature and tips.',
        blocks: [
          { type: 'p', text: "Guests for dinner, dozens of bottles in the cellar, and no idea what to open? The Sommelier knows your inventory and suggests the right bottles for what's on the table." },
          { type: 'h2', text: 'How it works' },
          { type: 'steps', items: [
            { title: 'Write the menu', text: 'Casually is fine: "cured meats, mushroom risotto, roast veal, tiramisu".' },
            { title: 'Choose the service', text: '"Per course", for a different wine with each dish, or "Single wine", for one bottle for the whole dinner.' },
            { title: 'Read the suggestions', text: 'For each course you get several options, with the reasoning, serving temperature and a practical tip (e.g. open it an hour early).' },
          ] },
          { type: 'h2', text: 'In your cellar or to buy' },
          { type: 'list', items: [
            '**Wines you own**: shown with their location. From there you can tap "Uncork & rate" to log the bottle.',
            '**Buying suggestions**: if nothing suitable is in your cellar, the Sommelier tells you what to buy.',
          ] },
          { type: 'tip', title: 'Share the dinner', text: '"Share pairing" creates a link with the menu and chosen wines, to send to guests or keep for next time.' },
          { type: 'tip', title: 'Make it more personal', text: 'The more bottles you log and the more you rate in your History, the more the suggestions reflect your taste.' },
        ],
      },
    },
  },
  {
    slug: 'al-ristorante',
    category: 'app',
    icon: 'restaurant',
    gradient: 'from-emerald-600 to-emerald-900',
    content: {
      it: {
        title: 'Scegliere il vino al ristorante',
        subtitle: 'Dalla carta dei vini alla bottiglia giusta, in un minuto',
        excerpt: 'Fotografa la carta dei vini e descrivi il piatto: ricevi i vini migliori per ogni fascia di prezzo, con un punteggio di abbinamento.',
        blocks: [
          { type: 'p', text: "Le carte dei vini lunghe mettono in difficoltà anche gli appassionati. AIKNOW.WINE legge la carta del ristorante e ti indica le bottiglie più adatte al tuo piatto, scegliendo solo tra quelle davvero disponibili." },
          { type: 'h2', text: 'Come funziona' },
          { type: 'steps', items: [
            { title: 'Descrivi cosa mangi', text: 'Ad esempio "tagliata di manzo con rucola e grana" o "spaghetti alle vongole".' },
            { title: 'Fotografa la carta dei vini', text: "Fino a 3 foto, se la carta ha più pagine. Se il ristorante è partner di AIKNOW.WINE, la carta è già caricata e non serve fotografarla." },
            { title: 'Scegli tra le proposte', text: 'I vini sono divisi per fascia di prezzo (economica, media, alta), ognuno con un punteggio di abbinamento e una motivazione.' },
          ] },
          { type: 'tip', title: 'Fascia di prezzo relativa', text: "Le fasce sono calcolate sui prezzi di quella carta: \"economica\" significa tra le più convenienti di quel ristorante, non in assoluto." },
          { type: 'h2', text: 'Dopo aver scelto' },
          { type: 'p', text: "Tocca il vino scelto e conferma il prezzo pagato: la bottiglia entra nel tuo Storico, dove potrai votarla e ricordare dove l'hai bevuta." },
        ],
      },
      en: {
        title: 'Choosing wine at a restaurant',
        subtitle: 'From the wine list to the right bottle, in a minute',
        excerpt: 'Snap the wine list and describe your dish: get the best wines in every price range, each with a pairing score.',
        blocks: [
          { type: 'p', text: "Long wine lists challenge even enthusiasts. AIKNOW.WINE reads the restaurant's list and points you to the bottles that best suit your dish, choosing only among those actually available." },
          { type: 'h2', text: 'How it works' },
          { type: 'steps', items: [
            { title: 'Describe your dish', text: 'For example "sliced beef with rocket and parmesan" or "spaghetti with clams".' },
            { title: 'Snap the wine list', text: 'Up to 3 photos if it has several pages. If the restaurant is an AIKNOW.WINE partner, the list is already loaded.' },
            { title: 'Pick a suggestion', text: 'Wines are grouped by price range (budget, mid, high), each with a pairing score and reasoning.' },
          ] },
          { type: 'tip', title: 'Relative price ranges', text: 'Ranges are based on the prices on that list: "budget" means among the cheapest at that restaurant, not in absolute terms.' },
          { type: 'h2', text: 'After choosing' },
          { type: 'p', text: 'Tap the wine you chose and confirm the price: the bottle goes to your History, where you can rate it and remember where you drank it.' },
        ],
      },
    },
  },
  {
    slug: 'acquisti-intelligenti',
    category: 'app',
    icon: 'shop',
    gradient: 'from-indigo-600 to-indigo-900',
    content: {
      it: {
        title: 'Comprare bene: la valutazione prima dell\'acquisto',
        subtitle: 'Al supermercato o in enoteca, sai se è un affare',
        excerpt: "Fotografa l'etichetta e inserisci il prezzo: qualità, prezzo di mercato, giudizio sull'affare e se il vino colma una lacuna della tua cantina.",
        blocks: [
          { type: 'p', text: "Davanti a uno scaffale con cento etichette è facile pagare troppo o scegliere a caso. La sezione Shop ti dà una valutazione oggettiva prima di mettere la bottiglia nel carrello." },
          { type: 'h2', text: 'Come funziona' },
          { type: 'steps', items: [
            { title: "Fotografa l'etichetta o incolla un link", text: "Dal negozio scatti una foto; se compri online incolli il link del prodotto." },
            { title: 'Inserisci il prezzo', text: "Il prezzo a cui ti viene offerta la bottiglia: serve per giudicare se è conveniente." },
            { title: "Conferma l'annata", text: "Se in foto non è leggibile, l'app te la chiede prima di valutare." },
          ] },
          { type: 'h2', text: 'Cosa ottieni' },
          { type: 'list', items: [
            '**Punteggio qualità** su 100, indipendente dal prezzo.',
            '**Prezzo di mercato stimato** e **giudizio sull\'affare**: ottimo, buono, nella media o caro.',
            '**Punti di forza e aspetti da considerare**, e le occasioni migliori per berlo.',
            '**Profilo sensoriale e abbinamenti**, come per i vini in cantina.',
            "**Se colma una lacuna**: l'app confronta il vino con la tua cantina e ti dice se aggiunge qualcosa di nuovo o se è un doppione.",
            '**Confronto prezzi online**, per vedere dove si trova a meno.',
          ] },
          { type: 'tip', title: 'Un clic per aggiungerlo', text: "Se decidi di comprarlo, \"Acquista e aggiungi\" lo mette in cantina con tutti i dati della valutazione, punteggio e profilo compresi." },
        ],
      },
      en: {
        title: 'Buy smart: the pre-purchase evaluation',
        subtitle: "At the supermarket or wine shop, know if it's a good deal",
        excerpt: 'Snap the label and enter the price: quality, market price, deal rating and whether the wine fills a gap in your cellar.',
        blocks: [
          { type: 'p', text: "Facing a shelf with a hundred labels it's easy to overpay or pick at random. The Shop section gives you an objective evaluation before the bottle goes in your basket." },
          { type: 'h2', text: 'How it works' },
          { type: 'steps', items: [
            { title: 'Snap the label or paste a link', text: 'In store take a photo; online, paste the product link.' },
            { title: 'Enter the price', text: "The price you're offered: it's used to judge whether it's good value." },
            { title: 'Confirm the vintage', text: "If it isn't readable in the photo, the app asks before rating." },
          ] },
          { type: 'h2', text: 'What you get' },
          { type: 'list', items: [
            '**Quality score** out of 100, independent of price.',
            '**Estimated market price** and **deal rating**: excellent, good, fair or overpriced.',
            '**Strengths and things to consider**, and the best occasions to drink it.',
            '**Sensory profile and pairings**, like the wines in your cellar.',
            '**Cellar fit**: the app compares the wine with your cellar and tells you whether it adds something new or duplicates what you have.',
            '**Online price comparison**, to see where it costs less.',
          ] },
          { type: 'tip', title: 'One tap to add it', text: '"Buy & add" puts it in your cellar with all the evaluation data, score and profile included.' },
        ],
      },
    },
  },
  {
    slug: 'analisi-e-roi',
    category: 'app',
    icon: 'chart',
    gradient: 'from-slate-700 to-slate-950',
    content: {
      it: {
        title: 'Il valore della tua cantina',
        subtitle: 'Quanto vale, come è composta, cosa bere presto',
        excerpt: 'La pagina Dati: valore di mercato e rendimento, composizione, finestre di consumo, bottiglie più preziose e ricalcolo mensile del valore.',
        blocks: [
          { type: 'p', text: "Una cantina è anche un patrimonio. La pagina Dati ti mostra a colpo d'occhio quanto vale, com'è composta e quali bottiglie meritano attenzione." },
          { type: 'h2', text: 'Cosa trovi nella pagina Dati' },
          { type: 'list', items: [
            '**Valore della cantina** e **rendimento** rispetto a quanto hai pagato.',
            '**Composizione** per tipologia: rossi, bianchi, rosati, bollicine, dolci.',
            '**Finestra di consumo**: quante bottiglie sono da attendere, pronte o oltre il picco.',
            '**Qualità della collezione**: le bottiglie suddivise per punteggio.',
            '**Top regioni** e **bottiglie più preziose**.',
            '**Da bere presto**: i vini la cui finestra si chiude entro l\'anno prossimo.',
          ] },
          { type: 'h2', text: 'Aggiornare il valore di mercato' },
          { type: 'p', text: "I prezzi dei vini cambiano nel tempo. Nello Storico trovi il pulsante \"Ricalcola valore\": l'AI aggiorna il prezzo di mercato di tutte le bottiglie e salva un punto nel grafico del valore nel tempo. Si può usare una volta al mese." },
          { type: 'tip', title: 'Stime, non quotazioni', text: "Il valore è una stima basata su produttore, denominazione e annata, utile per seguire l'andamento della cantina. Per vendere o assicurare bottiglie importanti rivolgiti a un esperto o a una casa d'aste." },
        ],
      },
      en: {
        title: 'Your cellar\'s value',
        subtitle: "What it's worth, what's in it, what to drink soon",
        excerpt: 'The Data page: market value and return, composition, drinking windows, most valuable bottles and the monthly revaluation.',
        blocks: [
          { type: 'p', text: "A cellar is also an asset. The Data page shows at a glance what it's worth, what's in it and which bottles need attention." },
          { type: 'h2', text: "What's on the Data page" },
          { type: 'list', items: [
            '**Cellar value** and **return** compared with what you paid.',
            '**Composition** by style: reds, whites, rosés, sparkling, sweet.',
            '**Drinking window**: how many bottles should wait, are ready or are past their peak.',
            '**Collection quality**: bottles grouped by score.',
            '**Top regions** and **most valuable bottles**.',
            '**Drink soon**: wines whose window closes by next year.',
          ] },
          { type: 'h2', text: 'Updating the market value' },
          { type: 'p', text: 'Wine prices change over time. In History you will find "Recalculate value": the AI updates the market price of every bottle and saves a point on the value-over-time chart. It can be used once a month.' },
          { type: 'tip', title: 'Estimates, not quotes', text: 'The value is an estimate based on producer, appellation and vintage, useful to follow your cellar over time. To sell or insure important bottles, consult an expert or an auction house.' },
        ],
      },
    },
  },
  {
    slug: 'analisi-sommelier',
    category: 'app',
    icon: 'report',
    gradient: 'from-purple-700 to-indigo-950',
    content: {
      it: {
        title: "Il report del Sommelier",
        subtitle: 'Un parere da esperto su cantina e gusti personali',
        excerpt: 'Punteggio di salute della cantina, il tuo profilo di gusto, le lacune da colmare e cosa comprare: cosa contiene il report e quando aggiornarlo.',
        blocks: [
          { type: 'p', text: "Il report del Sommelier è un'analisi approfondita che mette insieme la tua cantina e le bottiglie che hai bevuto, con i voti e le note che hai lasciato. Lo trovi nella pagina Dati." },
          { type: 'h2', text: 'Cosa contiene' },
          { type: 'list', items: [
            '**Punteggio di salute** della cantina, spiegato in cinque voci: varietà, qualità, equilibrio, maturità e rapporto qualità/prezzo.',
            '**Il tuo profilo di gusto**, dedotto soprattutto dai vini che hai votato meglio.',
            '**Punti di forza** e **cosa manca** rispetto ai tuoi gusti.',
            "**Consigli d'acquisto** concreti, con la fascia di prezzo e il motivo per cui fanno per te.",
            '**Strategia di consumo**: quali bottiglie aprire per prime e come organizzare le prossime aperture.',
          ] },
          { type: 'h2', text: 'Quando si aggiorna' },
          { type: 'p', text: "Il report si può rigenerare ogni 10 bottiglie bevute: è il tempo necessario perché i tuoi gusti e la tua cantina cambino abbastanza da rendere utile una nuova analisi. Nel frattempo puoi riaprire quello salvato quando vuoi." },
          { type: 'tip', title: 'Più voti, più precisione', text: "Il segnale più importante sono i voti e le note nello Storico. Vota ogni bottiglia che bevi, anche in due secondi: il report diventa molto più personale." },
          { type: 'p', text: 'Il report del Sommelier fa parte del piano Premium.' },
        ],
      },
      en: {
        title: "The Sommelier's report",
        subtitle: 'An expert opinion on your cellar and your taste',
        excerpt: 'Cellar health score, your taste profile, gaps to fill and what to buy: what the report contains and when to refresh it.',
        blocks: [
          { type: 'p', text: "The Sommelier's report is an in-depth analysis combining your cellar with the bottles you have drunk, including your ratings and notes. You'll find it on the Data page." },
          { type: 'h2', text: 'What it contains' },
          { type: 'list', items: [
            '**Cellar health score**, explained through five factors: variety, quality, balance, readiness and value for money.',
            '**Your taste profile**, inferred mainly from the wines you rated highest.',
            '**Strengths** and **what is missing** relative to your taste.',
            '**Concrete buying suggestions**, with price range and why they suit you.',
            '**Drinking strategy**: which bottles to open first and how to plan your next openings.',
          ] },
          { type: 'h2', text: 'When it refreshes' },
          { type: 'p', text: 'The report can be regenerated every 10 bottles drunk: enough time for your taste and cellar to change for a new analysis to be useful. Meanwhile you can reopen the saved one whenever you like.' },
          { type: 'tip', title: 'More ratings, more precision', text: 'The strongest signal is the ratings and notes in your History. Rate every bottle you drink, even in two seconds: the report becomes far more personal.' },
          { type: 'p', text: "The Sommelier's report is part of the Premium plan." },
        ],
      },
    },
  },
  {
    slug: 'storico-degustazioni',
    category: 'app',
    icon: 'history',
    gradient: 'from-stone-600 to-stone-900',
    content: {
      it: {
        title: 'Il diario delle degustazioni',
        subtitle: 'Ogni bottiglia bevuta, ricordata',
        excerpt: 'Voti, note e luoghi di ogni bottiglia, raccolti mese per mese, con statistiche e grafici su cosa e quanto bevi.',
        blocks: [
          { type: 'p', text: "\"Com'era quel rosso che abbiamo bevuto l'estate scorsa?\" Lo Storico risponde a questa domanda. Ogni bottiglia stappata dalla cantina o scelta al ristorante finisce qui, con il tuo voto e le tue note." },
          { type: 'h2', text: 'Il diario' },
          { type: 'list', items: [
            '**Raggruppato per mese**, con il numero di bottiglie e la spesa di ciascun mese.',
            '**Voto da 1 a 5**, **note** e **luogo** per ogni bottiglia, modificabili in qualsiasi momento.',
            '**Ricerca e filtri** per nome, produttore, luogo, note e tipologia; ordinamento per data o per voto.',
          ] },
          { type: 'h2', text: 'Le statistiche' },
          { type: 'list', items: [
            '**Bevute e spesa** degli ultimi 12 mesi, mese per mese.',
            '**Valore della cantina nel tempo**, con un punto per ogni ricalcolo mensile.',
            '**Cosa bevi**: la ripartizione per tipologia.',
            '**I tuoi record**: miglior voto, bottiglia più preziosa, produttore preferito, mese più attivo.',
          ] },
          { type: 'tip', title: 'Perché votare', text: "I voti non servono solo a ricordare: il Sommelier e il report li usano per capire i tuoi gusti e consigliarti meglio." },
        ],
      },
      en: {
        title: 'The tasting diary',
        subtitle: 'Every bottle you drink, remembered',
        excerpt: 'Ratings, notes and places for every bottle, grouped month by month, with stats and charts on what and how much you drink.',
        blocks: [
          { type: 'p', text: '"What was that red we had last summer?" History answers that question. Every bottle uncorked from your cellar or chosen at a restaurant ends up here, with your rating and notes.' },
          { type: 'h2', text: 'The diary' },
          { type: 'list', items: [
            '**Grouped by month**, with the number of bottles and spend for each month.',
            '**Rating from 1 to 5**, **notes** and **place** for each bottle, editable any time.',
            '**Search and filters** by name, producer, place, notes and style; sort by date or rating.',
          ] },
          { type: 'h2', text: 'The stats' },
          { type: 'list', items: [
            '**Bottles and spend** over the last 12 months, month by month.',
            '**Cellar value over time**, with a point for each monthly revaluation.',
            '**What you drink**: breakdown by style.',
            '**Your records**: top rating, most valuable bottle, favourite producer, busiest month.',
          ] },
          { type: 'tip', title: 'Why rate', text: 'Ratings are not just for remembering: the Sommelier and the report use them to understand your taste and advise you better.' },
        ],
      },
    },
  },
];

export const getGuide = (slug: string) => GUIDES.find(g => g.slug === slug);

export const getGuideContent = (guide: Guide, language: string): GuideContent =>
  language === 'it' ? guide.content.it : guide.content.en;

export const readingMinutes = (content: GuideContent) => {
  const text = content.blocks.map(b => {
    if (b.type === 'h2' || b.type === 'p') return b.text;
    if (b.type === 'list') return b.items.join(' ');
    if (b.type === 'steps') return b.items.map(i => `${i.title} ${i.text}`).join(' ');
    if (b.type === 'tip') return `${b.title} ${b.text}`;
    return b.rows.map(r => r.join(' ')).join(' ');
  }).join(' ');
  return Math.max(2, Math.ceil(text.split(/\s+/).length / 180));
};

export const ACADEMY_UI: Record<'it' | 'en', Record<string, string>> = {
  it: {
    title: 'Wine Academy', intro: "Guide pratiche per conoscere il vino e per usare al meglio il tuo sommelier digitale.",
    all: 'Tutte', learn: 'Impara il vino', app: 'Usa AIKNOW.WINE', search: 'Cerca una guida...', min: 'min di lettura',
    read: 'Leggi la guida', back: 'Tutte le guide', toc: 'In questa guida', related: 'Continua a leggere',
    cta_title: 'Metti in pratica con AIKNOW.WINE', cta_text: 'Il tuo sommelier personale: cantina, acquisti, ristorante e abbinamenti a casa.', cta_btn: 'Inizia gratis',
    empty: 'Nessuna guida trovata.', featured: 'In evidenza', start: 'Inizia ora',
  },
  en: {
    title: 'Wine Academy', intro: 'Practical guides to understand wine and get the most from your digital sommelier.',
    all: 'All', learn: 'Learn about wine', app: 'Use AIKNOW.WINE', search: 'Search a guide...', min: 'min read',
    read: 'Read the guide', back: 'All guides', toc: 'In this guide', related: 'Keep reading',
    cta_title: 'Put it into practice with AIKNOW.WINE', cta_text: 'Your personal sommelier: cellar, shopping, restaurants and pairings at home.', cta_btn: 'Start for free',
    empty: 'No guides found.', featured: 'Featured', start: 'Start now',
  },
};

export const academyUi = (language: string) => (language === 'it' ? ACADEMY_UI.it : ACADEMY_UI.en);
