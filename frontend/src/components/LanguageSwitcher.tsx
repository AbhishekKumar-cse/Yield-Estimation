"use client"

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  isCompact?: boolean;
}

export function LanguageSwitcher({ isCompact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (isCompact) {
    return (
      <div className="flex items-center">
        <Button
          variant={i18n.language.startsWith('en') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('en')}
          className="p-2"
        >
          En
        </Button>
        <Button
          variant={i18n.language.startsWith('hi') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('hi')}
          className="p-2"
        >
          Hi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={i18n.language.startsWith('en') ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('en')}
      >
        English
      </Button>
      <Button
        variant={i18n.language.startsWith('hi') ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('hi')}
      >
        Hindi
      </Button>
    </div>
  );
}
