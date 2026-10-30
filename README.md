<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MdmPYHBjg5HidgIsiKHfuyhVfZziCcWJ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Pagamenti Premium (Stripe)

Per ora l'app è gratuita e gestita a titolo personale: i pagamenti sono spenti e le funzioni Premium mostrano «in arrivo» (si possono regalare dall'admin con 💎). Quando ci sarà una società, aggiornare titolare, pagamenti e abbonamento in `views/LegalView.tsx` e impostare su Render queste variabili d'ambiente:

| Variabile | Valore |
| --- | --- |
| `STRIPE_SECRET_KEY` | Chiave segreta Stripe (`sk_live_...`, o `sk_test_...` per le prove) |
| `STRIPE_PRICE_MONTHLY` | Id del prezzo mensile (`price_...`) |
| `STRIPE_PRICE_YEARLY` | Id del prezzo annuale (`price_...`) |
| `STRIPE_WEBHOOK_SECRET` | Segreto dell'endpoint webhook (`whsec_...`) |
| `APP_URL` | `https://aiknow.wine` (indirizzo a cui Stripe rimanda dopo il pagamento) |

Su Stripe:

1. Crea un prodotto «AIKNOW.WINE Premium» con due prezzi ricorrenti: mensile e annuale.
2. Aggiungi un endpoint webhook su `https://aiknow.wine/api/billing/webhook` con gli eventi
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. Attiva il portale clienti (Impostazioni → Billing → Customer portal), che serve al pulsante «Gestisci abbonamento».
4. Per regalare il Premium ai contatti della fiera puoi creare codici promozionali: il checkout li accetta.

## Misurare il lancio

- Area admin → **Metriche**: iscrizioni, attivazione, ritorno a 1/7/30 giorni, funzioni usate, costo AI stimato, periodo della fiera.
- Area admin → **Contatti**: richieste dal modulo della pagina `/ristoranti`.
- Link tracciati per i materiali stampati: `https://aiknow.wine/qr/<codice>` (es. `/qr/vinitaly27`) rimanda alla home con `utm_source=<codice>&utm_medium=qr&utm_campaign=offline`, leggibile anche da Google Analytics. Per i link online usa direttamente i parametri UTM.
- Le date delle campagne (es. la fiera FIVI) sono in `server/growth.js`, costante `CAMPAIGNS`.

## Google Search Console

- Sitemap: `https://aiknow.wine/sitemap.xml` (generata dal server, include in automatico le guide dell'Academy). `robots.txt` la indica già.
- Verifica del sito: meglio come «Dominio» con record DNS. In alternativa, metodo «File HTML»: imposta su Render `GOOGLE_SITE_VERIFICATION` con il nome del file dato da Google (es. `google1234abcd.html`).
- Se l'indirizzo principale è `www.aiknow.wine`, imposta `SITE_URL=https://www.aiknow.wine`.
- Ogni pagina pubblica (home, Academy, guide, pagine business, privacy, termini) parte con titolo, descrizione, indirizzo canonico, anteprima social e dati strutturati generati da `server/seo.js`; le guide includono anche il testo completo nell'HTML. I dati delle guide vengono esportati durante `npm run build` (`scripts/build-seo.mjs`).
