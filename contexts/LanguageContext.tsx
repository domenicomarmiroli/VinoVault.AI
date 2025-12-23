
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { translations } from '../constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode, initialLanguage?: Language }> = ({ children, initialLanguage }) => {
  const getBrowserLanguage = (): Language => {
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
        const code = lang.split('-')[0].toLowerCase();
        if (['it', 'en', 'fr', 'es', 'de'].includes(code)) {
            return code as Language;
        }
    }
    return 'it';
  };

  const [language, setLanguage] = useState<Language>(initialLanguage || getBrowserLanguage());

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const t = (key: string, params?: Record<string, string>) => {
    // 1. Prova la lingua corrente
    // 2. Se manca, prova l'Inglese (fallback universale)
    // 3. Se manca anche l'Inglese, restituisci la chiave (estrema ratio)
    let text = translations[language][key];
    
    if (text === undefined || text === key) {
        text = translations['en'][key] || key;
    }

    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
