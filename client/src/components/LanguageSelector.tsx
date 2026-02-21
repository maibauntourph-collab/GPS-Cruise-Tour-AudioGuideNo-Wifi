import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', speechLang: 'en-US' },
  { code: 'es', name: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', speechLang: 'fr-FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', speechLang: 'de-DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', speechLang: 'it-IT' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', speechLang: 'pt-PT' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', speechLang: 'ru-RU' },
  { code: 'zh', name: '中文', flag: '🇨🇳', speechLang: 'zh-CN' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', speechLang: 'ja-JP' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', speechLang: 'ko-KR' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', speechLang: 'ar-SA' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', speechLang: 'tr-TR' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', speechLang: 'nl-NL' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', speechLang: 'pl-PL' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', speechLang: 'sv-SE' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰', speechLang: 'da-DK' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮', speechLang: 'fi-FI' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴', speechLang: 'nb-NO' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', speechLang: 'el-GR' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿', speechLang: 'cs-CZ' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', speechLang: 'th-TH' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', speechLang: 'vi-VN' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', speechLang: 'id-ID' },
];

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-primary shrink-0" />
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="select-language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} data-testid={`option-lang-${lang.code}`}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
