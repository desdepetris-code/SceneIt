import { useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes, holidayThemes } from '../themes';
import { Theme } from '../types';

const mixColors = (c1: string, c2: string, weight: number) => {
    const hex1 = c1.replace('#', '');
    const hex2 = c2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 * (1 - weight) + r2 * weight);
    const g = Math.round(g1 * (1 - weight) + g2 * weight);
    const b = Math.round(b1 * (1 - weight) + b2 * weight);
    
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const getNextHoliday = (date: Date) => {
  const currentYear = date.getFullYear();
  const holidays = [
    { name: "New Year's Eve", month: 11, day: 31, id: 'holiday-new-years-eve', daysBefore: 1 },
    { name: 'New Year', month: 0, day: 1, id: 'holiday-new-year', daysBefore: 1 },
    { name: "Valentine's Day", month: 1, day: 14, id: 'holiday-valentines', daysBefore: 3 },
    { name: 'Easter', month: 3, day: 9, id: 'holiday-easter', daysBefore: 3 }, 
    { name: "Mother's Day", month: 4, day: 11, id: 'holiday-mothers-day', daysBefore: 3 }, 
    { name: "Father's Day", month: 5, day: 15, id: 'holiday-fathers-day', daysBefore: 3 }, 
    { name: "Independence Day", month: 6, day: 4, id: 'holiday-independence-day', daysBefore: 3 },
    { name: 'Halloween', month: 9, day: 31, id: 'holiday-halloween', daysBefore: 7 },
    { name: 'Thanksgiving', month: 10, day: 27, id: 'holiday-thanksgiving', daysBefore: 3 }, 
    { name: 'Christmas', month: 11, day: 25, id: 'holiday-christmas', daysBefore: 7 },
  ];
  const upcomingHolidays = holidays.map(h => {
    let holidayDate = new Date(currentYear, h.month, h.day);
    if (holidayDate < date && (date.getMonth() !== h.month || date.getDate() !== h.day)) {
        holidayDate = new Date(currentYear + 1, h.month, h.day);
    }
    const startDate = new Date(holidayDate);
    startDate.setDate(holidayDate.getDate() - h.daysBefore);
    return { ...h, date: holidayDate, startDate };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcomingHolidays[0];
};

export function useTheme(customThemes: Theme[], autoHolidayThemesEnabled: boolean = false): [Theme, (themeId: string) => void, string, string | null] {
  const [themeId, setThemeId] = useLocalStorage<string>('themeId', 'original-dark');
  const prevThemeIdRef = useRef<string | null>(null);
  const allThemes = useMemo(() => [...builtInThemes, ...holidayThemes, ...customThemes], [customThemes]);
  
  const holidayInfo = useMemo(() => {
    const now = new Date();
    const nextHoliday = getNextHoliday(now);
    const holidayTheme = holidayThemes.find(t => t.id === nextHoliday.id);
    const isActive = !!(holidayTheme && now >= nextHoliday.startDate && now <= nextHoliday.date);
    return { 
        isActive, 
        theme: holidayTheme, 
        name: nextHoliday.name, 
        date: nextHoliday.date,
        startDate: nextHoliday.startDate
    };
  }, []);

  const activeTheme = useMemo(() => {
    if (autoHolidayThemesEnabled && holidayInfo.isActive && holidayInfo.theme) {
      return holidayInfo.theme;
    }
    return allThemes.find(t => t.id === themeId) || builtInThemes[0];
  }, [themeId, allThemes, autoHolidayThemesEnabled, holidayInfo]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const body = document.body;
    if (prevThemeIdRef.current) body.classList.remove(`theme-${prevThemeIdRef.current}`);
    body.classList.add(`theme-${activeTheme.id}`);
    prevThemeIdRef.current = activeTheme.id;
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
    root.style.setProperty('--on-accent', activeTheme.colors.onAccent || (activeTheme.base === 'dark' ? '#FFFFFF' : '#000000'));

    const c1 = activeTheme.colors.accentPrimary;
    const c2 = activeTheme.colors.accentSecondary;
    for (let i = 0; i < 10; i++) {
        const weight = i / 9;
        root.style.setProperty(`--nav-c${i+1}`, mixColors(c1, c2, weight));
    }
  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (allThemes.some(t => t.id === newThemeId)) setThemeId(newThemeId);
  };

  return [activeTheme, setTheme, themeId, autoHolidayThemesEnabled && holidayInfo.isActive ? holidayInfo.name : null];
}