/**
 * useLanguage Hook - Compatible con la API anterior
 * Usa Zustand store internamente pero mantiene la misma interfaz
 */
import { useLanguageStore } from '../stores/languageStore';

export function useLanguage() {
  const { language, setLanguage, t } = useLanguageStore();
  
  return {
    language,
    setLanguage,
    t,
  };
}

