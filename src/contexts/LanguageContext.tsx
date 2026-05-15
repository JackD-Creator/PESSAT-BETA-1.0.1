import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Lang, translations } from '../lib/translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('livestock_lang');
    return (stored === 'en' || stored === 'id') ? stored : 'id';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('livestock_lang', newLang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[lang]?.[key] || key;
  }, [lang]);

  const locale = lang === 'id' ? 'id-ID' : 'en-US';
  return (
    <LanguageContext.Provider value={{ lang, setLang, t, locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
