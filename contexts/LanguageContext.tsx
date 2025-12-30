
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
    // 1. Check localStorage first
    const saved = localStorage.getItem('aiknow_language') as Language;
    if (saved && ['it', 'en', 'fr', 'es', 'de'].includes(saved)) return saved;

    // 2. Check browser
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
        const code = lang.split('-')[0].toLowerCase();
        if (['it', 'en', 'fr', 'es', 'de'].includes(code)) {
            return code as Language;
        }
    }
    return 'it';
  };

  const [language, setLanguageState] = useState<Language>(initialLanguage || getBrowserLanguage());

  const setLanguage = (lang: Language) => {
      setLanguageState(lang);
      localStorage.setItem('aiknow_language', lang);
  };

  const t = (key: string, params?: Record<string, string>) => {
    const currentTranslations = translations[language] || translations['en'];
    let text = currentTranslations[key];
    
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
