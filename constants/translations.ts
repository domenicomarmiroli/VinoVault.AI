
import { Language } from "../types";

export const translations: Record<Language, Record<string, string>> = {
  it: {
    // Nav & General
    nav_cellar: "Cantina", nav_shop: "Shop", nav_restaurant: "Ristorante", nav_sommelier: "Sommelier", nav_data: "Dati", nav_history: "Storico", nav_admin: "Admin",
    loading: "Caricamento...", error: "Errore", save: "Salva", cancel: "Annulla", delete: "Elimina", confirm: "Conferma", logout: "Esci",
    
    // History View
    history_diary_title: "Il Tuo Diario",
    history_diary_subtitle: "Ogni calice ha una storia da ricordare.",
    history_search_placeholder: "Cerca nello storico...",
    history_empty: "Non hai ancora registrato bevute.",
    history_to_rate: "Da votare",
    history_analysis_btn: "Analisi Sommelier",
    
    // Landing Page
    lp_b2b_banner: "Sei un Ristorante? Sostituisci la tua carta vini con la nostra IA. Gratis!",
    lp_how_it_works: "Come Funziona", lp_features: "Funzionalità", lp_academy: "Academy", lp_access: "Accedi",
    lp_hero_tag: "Il Futuro del Vino è qui", lp_hero_title: "Il tuo Sommelier", lp_hero_title_span: "Personale IA.",
    lp_hero_desc: "AIKNOW.WINE è l'applicazione definitiva per la gestione cantina digitale e l'analisi sensoriale. Digitalizza le tue etichette, scopri abbinamenti perfetti e monitora i tuoi investimenti.",
    lp_start_free: "Inizia Gratuitamente", lp_discover_more: "Scopri di più",
    lp_quote: "Il calice perfetto, scelto dalla tua intelligenza.",
    lp_what_is_title: "Cos'è un Sommelier Digitale?",
    lp_what_is_desc: "Non è solo un catalogo, è un'esperienza. AIKNOW.WINE utilizza modelli linguistici avanzati per interpretare le tue preferenze e guidarti nella scelta della bottiglia giusta.",
    lp_features_title: "Un Sommelier nel tuo Smartphone",
    lp_f1_t: "Cantina Digitale", lp_f1_d: "Scatta una foto, l'IA fa il resto. Cataloga annate e vitigni istantaneamente.",
    lp_f2_t: "Abbinamenti AI", lp_f2_d: "Inserisci un menu e ricevi il consiglio perfetto pescando dalla tua cantina.",
    lp_f3_t: "Shop Advisor", lp_f3_d: "Benchmark prezzi in tempo reale. Scopri se stai facendo un affare.",
    lp_f4_t: "Analisi Strategica", lp_f4_d: "Report professionali sul tuo profilo palato e sui gap della collezione.",
    lp_academy_title: "Wine Academy", lp_academy_desc: "Approfondimenti gratuiti per gestire la tua passione come un professionista.",
    lp_final_cta: "Dai valore a ogni sorso. Inizia oggi la tua collezione.",
    lp_enter_app: "Entra in AIKNOW.WINE",

    // Academy Guides General
    guide_back: "Indietro",
    guide_start_now: "Inizia Ora",
    guide_read_more: "Leggi la guida",
    
    // Digital Cellar Guide
    gc_title: "La Tua Cantina Digitale",
    gc_subtitle: "Da Scaffale a Smartphone.",
    gc_intro: "Hai mai dimenticato una bottiglia preziosa in fondo al frigo o faticato a ricordare il prezzo di quel Barolo acquistato anni fa?",
    gc_feature_1_t: "Scanner Etichette Intelligente",
    gc_feature_1_d: "Dimentica i moduli infiniti da compilare. Con AIKNOW.WINE, ti basta una foto. La nostra intelligenza artificiale analizza l'immagine ed estrae istantaneamente i dati tecnici.",
    gc_feature_2_t: "Gestione Location",
    gc_feature_2_d: "Che tu abbia una cantinetta frigo o un semplice scaffale, puoi mappare tutto. Trova la bottiglia giusta in 2 secondi.",
    gc_feature_3_t: "Valore di Mercato",
    gc_feature_3_d: "Monitoriamo il valore delle tue bottiglie e ti diciamo quando è il picco di bevibilità.",
    gc_cta: "Inizia a digitalizzare oggi",
    gc_cta_sub: "Crea la tua Cantina Gratis",
    
    // Sommelier Home Guide
    gh_title: "Che vino apro questa sera?",
    gh_subtitle: "Il Sommelier IA risponde.",
    gh_intro: "Trasforma ogni cena in un evento professionale. Non scegliere un vino a caso: scegli quello che esalta i tuoi piatti.",
    gh_feature_1_t: "Tu cucini, l'IA abbina.",
    gh_feature_1_d: "Inserisci il menu in linguaggio naturale. Il nostro algoritmo analizza struttura, grassezza e persistenza dei piatti per trovare il match perfetto.",
    gh_feature_2_t: "Servizio Impeccabile",
    gh_feature_2_d: "Ti consiglia la temperatura di servizio esatta e quanto tempo prima stappare la bottiglia.",
    gh_cta: "Diventa il Sommelier della serata",
    
    // Restaurant Guide
    gr_title: "Addio stress da Carta dei Vini.",
    gr_subtitle: "Al Ristorante.",
    gr_intro: "Con AIKNOW.WINE, avrete un sommelier professionista seduto al vostro tavolo, pronto ad analizzare la carta per voi.",
    gr_step_1_t: "1. Scansiona la Lista",
    gr_step_1_d: "Scattate una foto alle pagine della carta dei vini. La nostra IA leggerà istantaneamente nomi e prezzi.",
    gr_step_2_t: "2. Dimmi cosa mangi",
    gr_step_2_d: "Scrivete il piatto che avete ordinato. L'IA incrocerà i sapori con le bottiglie disponibili.",
    gr_step_3_t: "3. Scegli tra i Top 3",
    gr_step_3_d: "Riceverete i 3 migliori abbinamenti divisi per fascia di prezzo.",
    gr_cta: "Non ordinare mai più il vino sbagliato",
    
    // B2B
    b2b_title: "Smetti di usare la Carta dei Vini cartacea.",
    b2b_desc: "Offri ai tuoi clienti un'esperienza tecnologica senza precedenti. Trasforma il tuo menu in un Sommelier Virtuale intelligente.",
    b2b_cta_setup: "Richiedi Setup Gratuito",
    b2b_free_title: "Completamente GRATIS.",
    b2b_free_desc: "Siamo in fase di lancio e offriamo il setup completo a costo zero.",
    b2b_contact_free: "Contattaci Gratis"
  },
  en: {
    nav_cellar: "Cellar", nav_shop: "Shop", nav_restaurant: "Restaurant", nav_sommelier: "Sommelier", nav_data: "Data", nav_history: "History", nav_admin: "Admin",
    loading: "Loading...", error: "Error", save: "Save", cancel: "Cancel", delete: "Delete", confirm: "Confirm", logout: "Logout",
    
    history_diary_title: "Your Diary",
    history_diary_subtitle: "Every glass has a story to remember.",
    history_search_placeholder: "Search history...",
    history_empty: "You haven't recorded any tastings yet.",
    history_to_rate: "To rate",
    history_analysis_btn: "Sommelier Analysis",
    
    lp_b2b_banner: "Are you a Restaurant? Replace your wine list with our AI. Free!",
    lp_how_it_works: "How It Works", lp_features: "Features", lp_academy: "Academy", lp_access: "Login",
    lp_hero_tag: "The Future of Wine is here", lp_hero_title: "Your Personal", lp_hero_title_span: "AI Sommelier.",
    lp_hero_desc: "AIKNOW.WINE is the ultimate app for digital cellar management and sensory analysis. Scan labels, find perfect pairings, and track investments.",
    lp_start_free: "Start for Free", lp_discover_more: "Discover more",
    lp_quote: "The perfect glass, chosen by your intelligence.",
    lp_what_is_title: "What is a Digital Sommelier?",
    lp_what_is_desc: "It's not just a catalog, it's an experience. AIKNOW.WINE uses advanced language models to guide you to the right bottle.",
    lp_features_title: "A Sommelier in your Smartphone",
    lp_f1_t: "Digital Cellar", lp_f1_d: "Snap a photo, AI does the rest. Catalog vintages and grapes instantly.",
    lp_f2_t: "AI Pairings", lp_f2_d: "Enter a menu and get the perfect recommendation from your own cellar.",
    lp_f3_t: "Shop Advisor", lp_f3_d: "Real-time price benchmark. Find out if you're getting a good deal.",
    lp_f4_t: "Strategic Analysis", lp_f4_d: "Professional reports on your palate profile and collection gaps.",
    lp_academy_title: "Wine Academy", lp_academy_desc: "Free insights to manage your passion like a pro.",
    lp_final_cta: "Give value to every sip. Start your collection today.",
    lp_enter_app: "Enter AIKNOW.WINE",

    guide_back: "Back",
    guide_start_now: "Start Now",
    guide_read_more: "Read guide",

    gc_title: "The Digital Cellar",
    gc_subtitle: "From Shelf to Smartphone.",
    gc_intro: "Ever forgotten a precious bottle in the back of the fridge or struggled to remember the price of that Barolo bought years ago?",
    gc_feature_1_t: "Smart Label Scanner",
    gc_feature_1_d: "Forget endless forms. With AIKNOW.WINE, just one photo. Our AI analyzes the image and extracts technical data instantly.",
    gc_feature_2_t: "Location Management",
    gc_feature_2_d: "Whether you have a fridge cellar or a simple shelf, you can map everything. Find the right bottle in 2 seconds.",
    gc_feature_3_t: "Market Value",
    gc_feature_3_d: "We monitor the value of your bottles and tell you when is the peak of drinkability.",
    gc_cta: "Start digitalizing today",
    gc_cta_sub: "Create your Cellar for Free",

    gh_title: "Which wine should I open tonight?",
    gh_subtitle: "The AI Sommelier answers.",
    gh_intro: "Turn every dinner into a professional event. Don't choose a wine at random: choose one that enhances your dishes.",
    gh_feature_1_t: "You cook, AI pairs.",
    gh_feature_1_d: "Enter the menu in natural language. Our algorithm analyzes structure and persistence of dishes to find the perfect match.",
    gh_feature_2_t: "Impeccable Service",
    gh_feature_2_d: "It recommends the exact serving temperature and when to decant.",
    gh_cta: "Become the Sommelier of the evening",

    gr_title: "Goodbye Wine List stress.",
    gr_subtitle: "At the Restaurant.",
    gr_intro: "With AIKNOW.WINE, you have a professional sommelier at your table, ready to analyze the card for you.",
    gr_step_1_t: "1. Scan the List",
    gr_step_1_d: "Take a photo of the wine list pages. Our AI will instantly read names and prices.",
    gr_step_2_t: "2. Tell me what you're eating",
    gr_step_2_d: "Write the dish you ordered. AI will match flavors with available bottles.",
    gr_step_3_t: "3. Choose from Top 3",
    gr_step_3_d: "You will receive the 3 best pairings divided by price range.",
    gr_cta: "Never order the wrong wine again",

    b2b_title: "Stop using paper Wine Lists.",
    b2b_desc: "Offer your customers an unprecedented technological experience. Turn your menu into a smart Virtual Sommelier.",
    b2b_cta_setup: "Request Free Setup",
    b2b_free_title: "Completely FREE.",
    b2b_free_desc: "We are in the launch phase and offer complete setup at zero cost.",
    b2b_contact_free: "Contact Us Free"
  },
  fr: {
    nav_cellar: "Cave", nav_shop: "Boutique", nav_restaurant: "Restaurant", nav_sommelier: "Sommelier", nav_data: "Données", nav_history: "Historique", nav_admin: "Admin",
    loading: "Chargement...", error: "Erreur", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", confirm: "Confirmer", logout: "Déconnexion",
    
    history_diary_title: "Votre Journal",
    history_diary_subtitle: "Chaque verre a une histoire à raconter.",
    history_search_placeholder: "Rechercher...",
    history_empty: "Vous n'avez pas encore enregistré de dégustations.",
    history_to_rate: "À noter",
    history_analysis_btn: "Analyse Sommelier",
    
    lp_hero_title: "Votre Sommelier", lp_hero_title_span: "Personnel IA.",
    lp_hero_desc: "AIKNOW.WINE est l'application ultime pour la gestion de cave digitale. Scannez les étiquettes et trouvez les accords parfaits.",
    lp_start_free: "Commencer Gratuitement",
    lp_quote: "Le verre parfait, choisi par votre intelligence.",
    
    gc_title: "La Cave Digitale",
    gc_subtitle: "De l'étagère au Smartphone.",
    gc_intro: "Avez-vous déjà oublié une bouteille précieuse au fond du frigo ?",
    gc_feature_1_t: "Scanner d'Étiquettes Intelligent",
    gc_feature_1_d: "Oubliez les formulaires. Avec AIKNOW.WINE, une seule photo suffit.",
    gc_cta: "Commencez à numériser aujourd'hui",
    
    gh_title: "Quel vin ouvrir ce soir ?",
    gh_subtitle: "Le Sommelier IA répond.",
    gh_feature_1_t: "Vous cuisinez, l'IA accorde.",
    gh_cta: "Devenez le Sommelier de la soirée",
    
    gr_title: "Adieu le stress de la Carte des Vins.",
    gr_cta: "Ne commandez plus jamais le mauvais vin",
    
    b2b_title: "Arrêtez d'utiliser des Cartes des Vins papier.",
    b2b_contact_free: "Contactez-nous Gratuitement"
  },
  es: {
    nav_cellar: "Bodega", nav_shop: "Tienda", nav_restaurant: "Restaurante", nav_sommelier: "Sommelier", nav_data: "Datos", nav_history: "Historial", nav_admin: "Admin",
    loading: "Cargando...", error: "Error", save: "Guardar", cancel: "Cancelar", delete: "Eliminar", confirm: "Confirmar", logout: "Salir",
    
    history_diary_title: "Tu Diario",
    history_diary_subtitle: "Cada copa tiene una historia que recordar.",
    history_search_placeholder: "Buscar en historial...",
    history_empty: "Aún no has registrado ninguna degustación.",
    history_to_rate: "Por calificar",
    history_analysis_btn: "Análisis Sommelier",
    
    lp_hero_title: "Tu Sommelier", lp_hero_title_span: "Personal IA.",
    lp_hero_desc: "AIKNOW.WINE es la aplicación definitiva para la gestión de bodegas digitales. Escanea etiquetas y encuentra maridajes.",
    lp_start_free: "Empieza Gratis",
    lp_quote: "La copa perfecta, elegida por tu inteligencia.",
    
    gc_title: "La Bodega Digital",
    gc_subtitle: "Del Estante al Smartphone.",
    gc_feature_1_t: "Escáner de Etiquetas Inteligente",
    gc_cta: "Empieza a digitalizar hoy",
    
    gh_title: "¿Qué vino abro esta noche?",
    gh_subtitle: "El Sommelier IA responde.",
    gh_cta: "Conviértete en el Sommelier de la noche",
    
    gr_title: "Adiós al estrés de la Carta de Vinos.",
    gr_cta: "No vuelvas a pedir el vino equivocado",
    
    b2b_title: "Deja de usar Cartas de Vinos de papel.",
    b2b_contact_free: "Contáctanos Gratis"
  },
  de: {
    nav_cellar: "Keller", nav_shop: "Shop", nav_restaurant: "Restaurant", nav_sommelier: "Sommelier", nav_data: "Daten", nav_history: "Verlauf", nav_admin: "Admin",
    loading: "Laden...", error: "Fehler", save: "Speichern", cancel: "Abbrechen", delete: "Löschen", confirm: "Bestätigen", logout: "Abmelden",
    
    history_diary_title: "Ihr Tagebuch",
    history_diary_subtitle: "Jedes Glas hat eine Geschichte, an die man sich erinnert.",
    history_search_placeholder: "Verlauf durchsuchen...",
    history_empty: "Sie haben noch keine Verkostungen aufgezeichnet.",
    history_to_rate: "Zu bewerten",
    history_analysis_btn: "Sommelier-Analyse",
    
    lp_hero_title: "Ihr persönlicher", lp_hero_title_span: "KI-Sommelier.",
    lp_hero_desc: "AIKNOW.WINE ist die ultimative App für digitales Kellermanagement. Scannen Sie Etiketten und finden Sie Paarungen.",
    lp_start_free: "Gratis starten",
    lp_quote: "Das perfekte Glas, gewählt von Ihrer Intelligenz.",
    
    gc_title: "Der digitale Keller",
    gc_subtitle: "Vom Regal zum Smartphone.",
    gc_feature_1_t: "Intelligenter Etiketten-Scanner",
    gc_cta: "Heute digitalisieren",
    
    gh_title: "Welchen Wein öffne ich heute Abend?",
    gh_subtitle: "Der KI-Sommelier antwortet.",
    gh_cta: "Werden Sie zum Sommelier des Abends",
    
    gr_title: "Schluss mit Weinkarten-Stress.",
    gr_cta: "Nie wieder den falschen Wein bestellen",
    
    b2b_title: "Hören Sie auf, Weinkarten aus Papier zu verwenden.",
    b2b_contact_free: "Gratis kontaktieren"
  }
};
