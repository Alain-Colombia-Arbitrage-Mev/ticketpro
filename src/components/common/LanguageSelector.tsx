import React, { useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLanguage } from "../../hooks/useLanguage";
import type { Language } from "../../types/common";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
}

// Flag Components - Usando imágenes SVG de alta calidad
const FlagES = () => (
  <div className="w-6 h-4 rounded-sm overflow-hidden flex items-center justify-center bg-[#c60b1e]">
    <div className="w-full h-full flex flex-col">
      <div className="h-1/4 bg-[#c60b1e]"></div>
      <div className="h-2/4 bg-[#ffc400]"></div>
      <div className="h-1/4 bg-[#c60b1e]"></div>
    </div>
  </div>
);

const FlagEN = () => (
  <div className="w-6 h-4 rounded-sm overflow-hidden flex items-center justify-center bg-[#012169] relative">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full h-[2px] bg-white"></div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-[2px] h-full bg-white"></div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full h-[1px] bg-[#C8102E]"></div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-[1px] h-full bg-[#C8102E]"></div>
    </div>
  </div>
);

const FlagPT = () => (
  <div className="w-6 h-4 rounded-sm overflow-hidden flex items-center justify-center">
    <div className="w-full h-full flex flex-row">
      <div className="w-2/5 bg-[#006600]"></div>
      <div className="w-3/5 bg-[#FF0000]"></div>
    </div>
  </div>
);

// Language flags and info
const LANGUAGES: Record<Language, { flag: React.ReactNode; name: string; nativeName: string }> = {
  es: { flag: <FlagES />, name: 'Spanish', nativeName: 'Español' },
  en: { flag: <FlagEN />, name: 'English', nativeName: 'English' },
  pt: { flag: <FlagPT />, name: 'Portuguese', nativeName: 'Português' },
};

export function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  
  // Debug: Verificar el idioma actual
  console.log('LanguageSelector - Current language:', language);
  
  const currentLanguage = useMemo(() => {
    return LANGUAGES[language] || LANGUAGES['es'];
  }, [language]);
  
  // Obtener el componente de bandera SVG
  const getFlagComponent = (lang: Language) => {
    if (lang === 'es') return <FlagES />;
    if (lang === 'en') return <FlagEN />;
    if (lang === 'pt') return <FlagPT />;
    return <FlagES />; // Default español
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group h-9 gap-2 rounded-lg px-3 hover:!bg-white/10 transition-all"
            title="Seleccionar Idioma"
          >
            <div 
              className="flex items-center justify-center shrink-0" 
              aria-label={`Bandera de ${currentLanguage.nativeName}`}
            >
              {getFlagComponent(language)}
            </div>
            <ChevronDown className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity !text-white shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px] !bg-black border-white/20">
          <DropdownMenuLabel className="!text-white font-semibold">
            {t('language.select')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="!bg-white/20" />
          {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
            const info = LANGUAGES[lang];
            const isSelected = language === lang;
            return (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex items-center justify-between cursor-pointer py-2.5 hover:!bg-white/10 ${
                  isSelected ? '!bg-white/20 border-l-2 border-white' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all shrink-0 ${
                    isSelected 
                      ? 'bg-white/20 shadow-md scale-110' 
                      : 'bg-white/10 hover:bg-white/15'
                  }`}>
                    {getFlagComponent(lang)}
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${isSelected ? '!text-white' : '!text-white/80'}`}>
                      {info.nativeName}
                    </span>
                    <span className="text-xs !text-white/60">{info.name}</span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 !text-white font-bold" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('language.select')}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center">
                {currentLanguage.flag}
              </span>
              <div className="text-left">
                <div className="font-semibold">{currentLanguage.nativeName}</div>
                <div className="text-xs text-muted-foreground">{currentLanguage.name}</div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px] dark:bg-gray-800 dark:border-gray-700">
          <DropdownMenuLabel className="dark:text-gray-300">{t('language.select')}</DropdownMenuLabel>
          <DropdownMenuSeparator className="dark:bg-gray-700" />
          {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
            const info = LANGUAGES[lang];
            const isSelected = language === lang;
            return (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex items-center justify-between cursor-pointer py-3 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <span className="flex items-center justify-center">{info.flag}</span>
                  </div>
                  <div>
                    <div className={`font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                      {info.nativeName}
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-gray-400">{info.name}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 font-bold" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
