
import { useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes } from '../themes';
import { Theme } from '../types';

export function useTheme(customThemes: Theme[]): [Theme, (themeId: string) => void] {
  const [themeId, setThemeId] = useLocalStorage<string>('themeId', 'original-dark');

  const allThemes = useMemo(() => [...builtInThemes, ...customThemes], [customThemes]);

  const activeTheme = allThemes.find(t => t.id === themeId) || builtInThemes[0];

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme.base);

    root.style.setProperty('--bg-gradient', activeTheme.colors.bgGradient);
    root.style.setProperty('--accent-gradient', activeTheme.colors.accentGradient);
    root.style.setProperty('--card-gradient', activeTheme.colors.cardGradient);
    root.style.setProperty('--text-color-primary', activeTheme.colors.textColorPrimary);
    root.style.setProperty('--text-color-secondary', activeTheme.colors.textColorSecondary);
    root.style.setProperty('--color-accent-primary', activeTheme.colors.accentPrimary);
    root.style.setProperty('--color-accent-secondary', activeTheme.colors.accentSecondary);
    root.style.setProperty('--color-bg-primary', activeTheme.colors.bgPrimary);
    root.style.setProperty('--color-bg-secondary', activeTheme.colors.bgSecondary);
    root.style.setProperty('--color-bg-backdrop', activeTheme.colors.bgBackdrop);
    
    // Set pattern variables if they exist, otherwise clear them
    root.style.setProperty('--pattern-bg-size', activeTheme.colors.patternBgSize || 'auto');
    root.style.setProperty('--pattern-bg-color', activeTheme.colors.patternBgColor || 'transparent');
    root.style.setProperty('--pattern-bg-position', activeTheme.colors.patternBgPosition || '0 0');

    // Support for pattern backgrounds from new theme editor
    // Check if theme has pattern properties to apply them
    if (activeTheme.colors.patternBgSize) {
        document.body.style.backgroundSize = 'var(--pattern-bg-size, auto)';
        document.body.style.backgroundColor = 'var(--pattern-bg-color, transparent)';
        document.body.style.backgroundPosition = 'var(--pattern-bg-position, 0 0)';
    } else {
        document.body.style.backgroundSize = 'auto';
        document.body.style.backgroundColor = 'transparent';
        document.body.style.backgroundPosition = '0 0';
    }


  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (allThemes.some(t => t.id === newThemeId)) {
        setThemeId(newThemeId);
    }
  };

  return [activeTheme, setTheme];
}