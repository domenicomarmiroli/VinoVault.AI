
import { Language } from "../types";

const it = {
    nav_cellar: "Cantina", nav_shop: "Shop", nav_restaurant: "Ristorante", nav_sommelier: "Sommelier", nav_data: "Dati", nav_history: "Storico", nav_admin: "Admin",
    nav_my_restaurant: "Carta Vini",
    rest_manage_title: "Gestione Locale", rest_manage_desc: "Configura la tua carta dei vini digitale.",
    rest_name_label: "Nome del Ristorante", rest_slug_label: "Slug URL (es. il-posto)", rest_menu_label: "Contenuto Carta Vini",
    rest_qr_title: "Il Tuo QR Code", rest_qr_desc: "I tuoi clienti potranno scansionarlo per consultare il menu IA.",
    rest_save_btn: "Salva Configurazione", rest_extract_btn: "Estrai da Foto/PDF",
    rest_slug_hint: "I tuoi clienti accederanno tramite: aiknow.wine/?ref={slug}",
    loading: "Caricamento...", error: "Errore", save: "Salva", cancel: "Annulla", delete: "Elimina", confirm: "Conferma", logout: "Esci",
    // ... (rest of standard translations)
    menu_ready: "La Carta Vini di {name} è a tua disposizione", sommelier_knows: "Il Sommelier conosce già la carta di {name}",
    ai_analyzing: "Analisi IA...",
};

const en = {
    nav_cellar: "Cellar", nav_shop: "Shop", nav_restaurant: "Restaurant", nav_sommelier: "Sommelier", nav_data: "Data", nav_history: "History", nav_admin: "Admin",
    nav_my_restaurant: "Wine List",
    rest_manage_title: "Restaurant Manager", rest_manage_desc: "Configure your digital wine list.",
    rest_name_label: "Restaurant Name", rest_slug_label: "URL Slug (e.g. the-place)", rest_menu_label: "Wine List Content",
    rest_qr_title: "Your QR Code", rest_qr_desc: "Customers scan this to access the AI sommelier.",
    rest_save_btn: "Save Settings", rest_extract_btn: "Extract from Photo/PDF",
    rest_slug_hint: "Access link: aiknow.wine/?ref={slug}",
    loading: "Loading...", error: "Error", save: "Save", cancel: "Cancel", delete: "Delete", confirm: "Confirm", logout: "Logout",
    // ... (rest of standard translations)
};

export const translations: Record<Language, Record<string, string>> = {
  it, en, fr: en, es: en, de: en
};
