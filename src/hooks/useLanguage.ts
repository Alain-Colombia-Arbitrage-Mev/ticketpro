/**
 * useLanguage Hook - Compatible con la API anterior
 * Usa Zustand store internamente pero mantiene la misma interfaz
 * Función t es reactiva y se actualiza cuando cambia el idioma
 */
import { useMemo } from 'react';
import { useLanguageStore } from '../stores/languageStore';
import { translations } from '../stores/languageStore';

export function useLanguage() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  
  // Crear función t reactiva que use el idioma actual
  const t = useMemo(() => {
    return (key: string): string => {
      return translations[language][key] || key;
    };
  }, [language]);
  
  return {
    language,
    setLanguage,
    t,
  };
}

