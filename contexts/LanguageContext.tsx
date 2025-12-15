
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { translations } from '../constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode, initialLanguage?: Language }> = ({ children, initialLanguage }) => {
  // 1. Detect Browser Language as default
  const getBrowserLanguage = (): Language => {
    const browserLang = navigator.language.split('-')[0];
    if (['it', 'en', 'fr', 'es', 'de'].includes(browserLang)) {
      return browserLang as Language;
    }
    return 'it'; // Default fallback
  };

  const [language, setLanguage] = useState<Language>(initialLanguage || getBrowserLanguage());

  // Update state if initialLanguage changes (e.g., loaded from user profile)
  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const t = (key: string) => {
    return translations[language][key] || key;
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
