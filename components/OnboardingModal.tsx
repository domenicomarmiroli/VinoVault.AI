
import React from 'react';
import { createPortal } from 'react-dom';
import { WineIcon, ShopIcon, RestaurantIcon, ChefIcon, ChartBarIcon } from './Icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
      // Chiudi se si clicca sullo sfondo scuro (backdrop)
      if (e.target === e.currentTarget) {
          onClose();
      }
  };

  const content = (
    <div 
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
    >
      {/* Aggiunto stopPropagation per evitare che click sul contenuto chiudano il modale */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 relative"
      >
        
        {/* Header */}
        <div className="bg-wine-700 p-6 text-white shrink-0 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-wine-200 hover:text-white p-2 rounded-full hover:bg-wine-600/50 transition-colors z-50 cursor-pointer"
            title="Chiudi"
            type="button"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
          <h2 className="text-2xl font-serif font-bold pr-8">Benvenuto in AIKnow.wine</h2>
          <p className="text-wine-100 text-sm mt-1">Il tuo sommelier personale e gestore di cantina.</p>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Cantina */}
          <div className="flex gap-4">
            <div className="bg-wine-100 p-3 rounded-xl h-fit shrink-0">
              <WineIcon className="w-8 h-8 text-wine-700" filled />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">La tua Cantina Digitale</h3>
              <p className="text-gray-600 text-sm mt-1">
                Aggiungi i tuoi vini scattando una foto all'etichetta. L'intelligenza artificiale riconoscerà tutti i dettagli. Clicca sul tast <strong>+</strong> per iniziare.
              </p>
            </div>
          </div>

          {/* Section 2: Shop Advisor */}
          <div className="flex gap-4">
            <div className="bg-wine-100 p-3 rounded-xl h-fit shrink-0">
              <ShopIcon className="w-8 h-8 text-wine-700" filled />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Shop Advisor</h3>
              <p className="text-gray-600 text-sm mt-1">
                Sei in enoteca, al supermercato o online? Scatta una foto alla bottiglia <strong>o incolla il link della pagina web</strong>, poi inserisci il prezzo. Ti diremo se è un buon affare e se si adatta alla tua collezione.
              </p>
            </div>
          </div>

          {/* Section 3: Ristorante */}
          <div className="flex gap-4">
            <div className="bg-wine-100 p-3 rounded-xl h-fit shrink-0">
              <RestaurantIcon className="w-8 h-8 text-wine-700" filled />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Al Ristorante</h3>
              <p className="text-gray-600 text-sm mt-1">
                Scrivi il piatto che hai ordinato, scatta una foto alle pagine della carta dei vini e il Sommelier ti suggerirà i 3 migliori abbinamenti da ordinare.
              </p>
            </div>
          </div>

          {/* Section 4: Sommelier */}
          <div className="flex gap-4">
            <div className="bg-wine-100 p-3 rounded-xl h-fit shrink-0">
              <ChefIcon className="w-8 h-8 text-wine-700" filled />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Chef & Abbinamenti</h3>
              <p className="text-gray-600 text-sm mt-1">
                Organizzi una cena? Inserisci il menu e il Sommelier cercherà nella TUA cantina la bottiglia perfetta da aprire.
              </p>
            </div>
          </div>

           {/* Section 5: Analytics */}
           <div className="flex gap-4">
            <div className="bg-wine-100 p-3 rounded-xl h-fit shrink-0">
              <ChartBarIcon className="w-8 h-8 text-wine-700" filled />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Dati & Investimenti</h3>
              <p className="text-gray-600 text-sm mt-1">
                Tieni traccia del valore della tua collezione, vedi i grafici di consumo e scopri quando i tuoi vini saranno al picco di bevibilità.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-wine-700 text-white font-bold rounded-xl hover:bg-wine-800 transition-colors shadow-lg shadow-wine-200 cursor-pointer"
          >
            Inizia a usare l'App
          </button>
        </div>

      </div>
    </div>
  );
  
  return createPortal(content, document.body);
};

export default OnboardingModal;
