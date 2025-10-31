import { Check, ChevronDown, Languages } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLanguage } from "../hooks/useLanguage";
import type { Language } from "../stores/languageStore";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
}

// Language flags and info
const LANGUAGES: Record<Language, { flag: string; name: string; nativeName: string }> = {
  es: { flag: '🇪🇸', name: 'Spanish', nativeName: 'Español' },
  en: { flag: '🇺🇸', name: 'English', nativeName: 'English' },
  pt: { flag: '🇧🇷', name: 'Portuguese', nativeName: 'Português' },
};

export function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const currentLanguage = LANGUAGES[language];

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group h-9 gap-1.5 rounded-lg px-2.5 hover:bg-gradient-to-r hover:from-blue-50 dark:hover:from-blue-900/20 hover:to-indigo-50 dark:hover:to-indigo-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all"
            title={t('language.select')}
          >
            <span className="text-xl transition-transform group-hover:scale-110">{currentLanguage.flag}</span>
            <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px] dark:bg-gray-800 dark:border-gray-700">
          <DropdownMenuLabel className="text-gray-700 dark:text-gray-300 font-semibold">
            {t('language.select')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="dark:bg-gray-700" />
          {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
            const info = LANGUAGES[lang];
            const isSelected = language === lang;
            return (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex items-center justify-between cursor-pointer py-2.5 ${
                  isSelected ? 'bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-indigo-50 dark:to-indigo-900/30 border-l-2 border-blue-500 dark:border-blue-400' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md scale-110' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                    <span className="text-lg">{info.flag}</span>
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {info.nativeName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{info.name}</span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 font-bold" />
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
              <span className="text-2xl">{currentLanguage.flag}</span>
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
                    <span className="text-2xl">{info.flag}</span>
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
