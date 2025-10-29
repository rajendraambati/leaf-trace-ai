import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Language = 'en' | 'hi' | 'te' | 'ta' | 'kn';

interface TranslationData {
  [key: string]: {
    en: string;
    hi?: string;
    te?: string;
    ta?: string;
    kn?: string;
  };
}

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('translation_keys')
        .select('*');

      if (error) throw error;

      const translationMap: TranslationData = {};
      data?.forEach(item => {
        translationMap[item.key_name] = {
          en: item.en,
          hi: item.hi || item.en,
          te: item.te || item.en,
          ta: item.ta || item.en,
          kn: item.kn || item.en
        };
      });

      setTranslations(translationMap);
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[key];
    if (!translation) return fallback || key;
    return translation[language] || translation.en || fallback || key;
  };

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('app_language', newLanguage);
  };

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिन्दी' },
      { code: 'te', name: 'తెలుగు' },
      { code: 'ta', name: 'தமிழ்' },
      { code: 'kn', name: 'ಕನ್ನಡ' }
    ] as const
  };
}