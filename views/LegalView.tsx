
import React from 'react';
import { Logo } from '../components/Logo';

interface LegalViewProps {
  page: 'privacy' | 'terms';
  onBack: () => void;
}

// ⚠️ I campi tra [ ] vanno completati con i dati reali della tua società
// e il testo va validato da un consulente prima della pubblicazione sugli store.
const COMPANY = {
  name: '[RAGIONE SOCIALE]',
  address: '[INDIRIZZO COMPLETO]',
  vat: '[P.IVA / C.F.]',
  email: 'privacy@aiknow.wine',
};

const LAST_UPDATE = '30 ottobre 2026';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
      <span className="w-1.5 h-5 bg-wine-600 rounded-full shrink-0"></span>
      {title}
    </h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2 pl-3.5">{children}</div>
  </section>
);

const PrivacyContent: React.FC = () => (
  <>
    <Section title="1. Chi tratta i tuoi dati">
      <p>
        Il titolare del trattamento è {COMPANY.name}, {COMPANY.address}, {COMPANY.vat}.
        Per qualsiasi richiesta sui tuoi dati puoi scrivere a{' '}
        <a href={`mailto:${COMPANY.email}`} className="text-wine-700 font-medium underline">{COMPANY.email}</a>.
      </p>
    </Section>

    <Section title="2. Quali dati raccogliamo">
      <p><strong>Dati di account:</strong> indirizzo email e password. La password è conservata solo in forma cifrata (hash bcrypt): non è leggibile da noi.</p>
      <p><strong>Dati della tua cantina:</strong> i vini che inserisci (nome, produttore, annata, prezzo, posizione, quantità), le fotografie delle etichette che carichi, lo storico delle bottiglie consumate, le tue valutazioni personali e le note di degustazione.</p>
      <p><strong>Dati di utilizzo:</strong> i giorni in cui usi l'app, le funzioni che usi, il numero di analisi AI effettuate e il loro costo stimato, la lingua preferita e lo stile di analisi scelto.</p>
      <p><strong>Come sei arrivato:</strong> al momento della registrazione salviamo il link o il sito da cui sei arrivato la prima volta (ad esempio il QR code di un ristorante partner o di un nostro materiale promozionale) e, se scegli di rispondere, come ci hai conosciuto.</p>
      <p><strong>Consensi:</strong> la data in cui hai accettato questa informativa e i termini, e la tua scelta, modificabile in ogni momento dal profilo, sulla ricezione di novità e offerte via email.</p>
      <p><strong>Abbonamento Premium:</strong> se ti abboni, il pagamento avviene sulle pagine di Stripe. Noi riceviamo solo l'identificativo cliente, il piano scelto e lo stato dell'abbonamento: non vediamo né conserviamo i dati della tua carta.</p>
      <p><strong>Richieste dalla pagina business:</strong> se compili il modulo contatti per ristoranti, enoteche e cantine, conserviamo nome, attività, email, telefono, città e messaggio che ci invii.</p>
      <p><strong>Visite anonime:</strong> contiamo le visite alla home e il loro canale di provenienza senza registrare indirizzi IP né identificativi del visitatore.</p>
      <p>Non raccogliamo dati di geolocalizzazione, non usiamo cookie di profilazione e non facciamo pubblicità.</p>
    </Section>

    <Section title="3. Perché li trattiamo e con quale base giuridica">
      <p><strong>Per erogare il servizio</strong> (gestione cantina, analisi AI, abbinamenti): esecuzione del contratto — art. 6.1.b GDPR.</p>
      <p><strong>Per la sicurezza dell'account</strong> e per prevenire abusi: legittimo interesse — art. 6.1.f GDPR.</p>
      <p><strong>Per gestire l'abbonamento Premium</strong> e per rispondere alle richieste dalla pagina business: esecuzione del contratto o di misure precontrattuali — art. 6.1.b GDPR.</p>
      <p><strong>Per capire come viene usato il servizio e migliorarlo</strong> (statistiche d'uso, provenienza delle iscrizioni, costi di funzionamento): legittimo interesse — art. 6.1.f GDPR. Puoi opporti scrivendoci.</p>
      <p><strong>Per inviarti novità e offerte via email</strong>, solo se lo hai scelto: consenso — art. 6.1.a GDPR, revocabile in ogni momento dal profilo.</p>
      <p><strong>Per obblighi di legge</strong> (fiscali, contabili, se applicabili): art. 6.1.c GDPR.</p>
    </Section>

    <Section title="4. Uso dell'intelligenza artificiale">
      <p>
        Le funzioni di analisi (lettura dell'etichetta, valutazione di un acquisto, abbinamenti, report della cantina)
        funzionano inviando i dati necessari — comprese le <strong>fotografie delle etichette</strong> e i dati dei tuoi vini —
        ad <strong>Anthropic PBC</strong>, fornitore del modello Claude, che li elabora per nostro conto in qualità di responsabile del trattamento.
      </p>
      <p>
        I tuoi dati <strong>non vengono utilizzati per addestrare</strong> i modelli di intelligenza artificiale.
        La funzione di ricerca prezzi effettua inoltre ricerche sul web basate sul nome del vino, senza trasmettere dati che ti identificano.
      </p>
      <p>
        I risultati generati dall'AI sono stime e suggerimenti automatici: possono contenere imprecisioni e non costituiscono
        consulenza professionale né valutazioni commerciali certificate.
      </p>
    </Section>

    <Section title="5. Con chi condividiamo i dati">
      <p>Ci avvaliamo di fornitori selezionati, nominati responsabili del trattamento ai sensi dell'art. 28 GDPR:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Anthropic PBC</strong> (USA) — elaborazione delle analisi AI</li>
        <li><strong>Render Services Inc.</strong> (USA/UE) — hosting dell'applicazione e del database</li>
        <li><strong>Stripe Payments Europe, Ltd.</strong> (Irlanda) — pagamento dell'abbonamento Premium; per alcuni trattamenti, come la prevenzione delle frodi, Stripe agisce come titolare autonomo secondo la propria informativa</li>
        <li><strong>Google LLC</strong> — erogazione dei web font utilizzati dall'interfaccia</li>
      </ul>
      <p>Non vendiamo e non cediamo i tuoi dati a terzi per finalità commerciali.</p>
    </Section>

    <Section title="6. Trasferimenti fuori dall'Unione Europea">
      <p>
        Alcuni fornitori hanno sede negli Stati Uniti. I trasferimenti avvengono sulla base delle
        Clausole Contrattuali Standard approvate dalla Commissione Europea e delle garanzie supplementari previste dagli accordi in essere.
      </p>
    </Section>

    <Section title="7. Per quanto tempo conserviamo i dati">
      <p>
        Conserviamo i dati del tuo account e della tua cantina finché l'account resta attivo.
        Quando elimini l'account, i tuoi dati personali, i vini, le foto e lo storico vengono
        <strong> cancellati definitivamente dai nostri sistemi</strong>, salvo quanto debba essere conservato per obblighi di legge.
        Restano solo i totali dei costi delle analisi AI, senza alcun collegamento alla tua persona.
      </p>
      <p>Le richieste inviate dalla pagina business sono conservate fino a 24 mesi dall'ultimo contatto, salvo che diventino un rapporto contrattuale.</p>
    </Section>

    <Section title="8. I tuoi diritti">
      <p>
        Puoi in ogni momento chiedere accesso, rettifica, cancellazione, limitazione o portabilità dei tuoi dati,
        e opporti al trattamento (artt. 15-22 GDPR).
      </p>
      <p>
        <strong>Cancellazione immediata:</strong> puoi eliminare autonomamente il tuo account e tutti i dati collegati
        direttamente dall'app, aprendo il tuo profilo e scegliendo «Elimina account». L'operazione è immediata e irreversibile.
      </p>
      <p>
        Per ogni altra richiesta scrivi a{' '}
        <a href={`mailto:${COMPANY.email}`} className="text-wine-700 font-medium underline">{COMPANY.email}</a>.
        Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).
      </p>
    </Section>

    <Section title="9. Cookie e archiviazione locale">
      <p>
        Non utilizziamo cookie di profilazione o di terze parti a fini pubblicitari.
        Usiamo esclusivamente l'archiviazione locale del dispositivo (localStorage) per conservare il token che ti mantiene
        collegato e le tue preferenze di lingua e stile: si tratta di strumenti tecnici necessari al funzionamento del servizio,
        per i quali non è richiesto il consenso.
        Sullo stesso dispositivo salviamo anche il link o il sito da cui sei arrivato la prima volta: resta sul tuo dispositivo
        e ci viene inviato solo se crei un account, per sapere quali canali funzionano. Non serve a seguirti su altri siti.
      </p>
    </Section>

    <Section title="10. Sicurezza">
      <p>
        Le comunicazioni avvengono su connessione cifrata HTTPS, le password sono salvate come hash bcrypt
        e l'accesso alle API è protetto da token di autenticazione firmati con scadenza.
      </p>
    </Section>

    <Section title="11. Minori">
      <p>
        Il servizio riguarda bevande alcoliche ed è riservato a utenti maggiorenni.
        Non raccogliamo consapevolmente dati di minori di 18 anni.
      </p>
    </Section>

    <Section title="12. Modifiche">
      <p>
        Eventuali aggiornamenti di questa informativa saranno pubblicati su questa pagina con una nuova data di ultimo aggiornamento.
      </p>
    </Section>
  </>
);

const TermsContent: React.FC = () => (
  <>
    <Section title="1. Oggetto del servizio">
      <p>
        AIKNOW.WINE è un'applicazione che permette di catalogare la propria cantina, registrare le degustazioni
        e ottenere analisi e suggerimenti generati da un sistema di intelligenza artificiale.
        Il servizio è fornito da {COMPANY.name}.
      </p>
    </Section>

    <Section title="2. Account">
      <p>
        Per usare il servizio devi creare un account con un indirizzo email valido e devi essere maggiorenne.
        Sei responsabile della riservatezza delle tue credenziali e delle attività svolte tramite il tuo account.
      </p>
      <p>Puoi eliminare l'account in qualsiasi momento dall'app, senza costi e senza preavviso.</p>
    </Section>

    <Section title="3. Uso consentito">
      <p>Ti impegni a non utilizzare il servizio per scopi illeciti, a non tentare di accedere ad aree riservate,
        a non effettuare operazioni automatizzate massive e a non caricare contenuti di cui non detieni i diritti.</p>
    </Section>

    <Section title="4. I tuoi contenuti">
      <p>
        I dati e le fotografie che carichi restano tuoi. Ci concedi esclusivamente la licenza tecnica necessaria
        a conservarli ed elaborarli per fornirti il servizio, come descritto nell'informativa privacy.
      </p>
    </Section>

    <Section title="5. Natura dei contenuti generati dall'AI">
      <p>
        Valutazioni, punteggi, stime di prezzo, finestre di consumo e abbinamenti sono <strong>generati automaticamente</strong>
        e hanno finalità puramente informative e di intrattenimento.
      </p>
      <p>
        <strong>I prezzi indicati sono indicativi</strong> e possono non essere aggiornati: verifica sempre il prezzo definitivo
        sul sito del venditore. Le stime di valore della cantina non costituiscono una perizia né una valutazione commerciale.
      </p>
      <p>
        Il servizio non fornisce consulenza professionale, medica, fiscale o di investimento.
        Beviamo responsabilmente: l'abuso di alcol è nocivo per la salute.
      </p>
    </Section>

    <Section title="6. Piani e funzionalità Premium">
      <p>
        Alcune funzionalità sono riservate agli account Premium. Le funzionalità incluse in ciascun piano
        possono essere modificate nel tempo per esigenze tecniche o di sostenibilità del servizio.
      </p>
      <p>
        <strong>Abbonamento.</strong> Il Premium è un abbonamento mensile o annuale. Prezzo e durata sono mostrati prima del pagamento,
        che avviene tramite Stripe. L'abbonamento si rinnova automaticamente alla scadenza finché non lo disdici.
      </p>
      <p>
        <strong>Disdetta.</strong> Puoi disdire in qualsiasi momento dal tuo profilo («Gestisci abbonamento»): il Premium resta attivo
        fino alla fine del periodo già pagato e non ci saranno altri addebiti.
      </p>
      <p>
        <strong>Recesso.</strong> Se sei un consumatore puoi recedere entro 14 giorni dal primo pagamento scrivendo a{' '}
        <a href={`mailto:${COMPANY.email}`} className="text-wine-700 font-medium underline">{COMPANY.email}</a>: ti rimborsiamo l'importo pagato.
      </p>
    </Section>

    <Section title="7. Disponibilità e limitazione di responsabilità">
      <p>
        Il servizio è fornito «così com'è». Pur impegnandoci per garantirne continuità e correttezza,
        non garantiamo l'assenza di interruzioni o di errori nei contenuti generati automaticamente.
      </p>
      <p>
        Nei limiti consentiti dalla legge, non rispondiamo di danni indiretti derivanti dall'uso del servizio
        o da decisioni di acquisto basate sui suggerimenti dell'AI. Restano impregiudicati i diritti inderogabili
        riconosciuti ai consumatori dalla normativa vigente.
      </p>
    </Section>

    <Section title="8. Sospensione e cessazione">
      <p>
        Possiamo sospendere o chiudere un account in caso di violazione dei presenti termini o di utilizzo
        che comprometta la sicurezza o la stabilità del servizio.
      </p>
    </Section>

    <Section title="9. Legge applicabile">
      <p>
        I presenti termini sono regolati dalla legge italiana. Per i consumatori resta competente
        il foro del luogo di residenza o domicilio elettivo.
      </p>
    </Section>

    <Section title="10. Contatti">
      <p>
        Per qualsiasi comunicazione:{' '}
        <a href={`mailto:${COMPANY.email}`} className="text-wine-700 font-medium underline">{COMPANY.email}</a>
      </p>
    </Section>
  </>
);

const LegalView: React.FC<LegalViewProps> = ({ page, onBack }) => {
  const isPrivacy = page === 'privacy';

  return (
    <div className="min-h-screen bg-stone-50 overflow-y-auto">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-wine-700 p-1 -ml-1 shrink-0" aria-label="Indietro">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <Logo className="w-8 h-8" showText={false} />
          <h1 className="text-lg font-serif font-bold text-gray-900">
            {isPrivacy ? 'Informativa Privacy' : 'Termini di Servizio'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-7 pb-20">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          Ultimo aggiornamento: {LAST_UPDATE}
        </p>

        {isPrivacy ? <PrivacyContent /> : <TermsContent />}

        <div className="pt-6 border-t border-gray-200">
          <button onClick={onBack} className="text-sm font-bold text-wine-700 hover:underline">
            ← Torna ad AIKNOW.WINE
          </button>
        </div>
      </main>
    </div>
  );
};

export default LegalView;
