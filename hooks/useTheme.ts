import { useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes, holidayThemes } from '../themes';
import { Theme } from '../types';

// --- Dynamic Date Calculation ---

const getEaster = (year: number): Date => {
  // Butcher's algorithm to find Easter day
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // month is 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

const getNthDayOfMonth = (n: number, dayOfWeek: number, month: number, year: number): Date => {
    const d = new Date(year, month, 1);
    const day = d.getDay();
    // Find the first occurrence of the dayOfWeek
    d.setDate(1 + (dayOfWeek - day + 7) % 7);
    // Add (n-1) weeks
    d.setDate(d.getDate() + (n - 1) * 7);
    return d;
};


// --- Holiday Definitions ---

interface HolidayDefinition {
    name: string;
    themeId: string;
    getPeriod: (year: number) => { startDate: Date; endDate: Date };
}

const holidays: HolidayDefinition[] = [
    {
        name: "New Year's Eve",
        themeId: 'holiday-new-years-eve',
        getPeriod: (year) => ({ startDate: new Date(year, 11, 26), endDate: new Date(year, 11, 31, 23, 59, 59) }),
    },
    {
        name: 'New Year',
        themeId: 'holiday-new-year',
        getPeriod: (year) => ({ startDate: new Date(year, 0, 1), endDate: new Date(year, 0, 14, 23, 59, 59) }),
    },
    {
        name: "Valentine's Day",
        themeId: 'holiday-valentines',
        getPeriod: (year) => ({ startDate: new Date(year, 1, 1), endDate: new Date(year, 1, 14, 23, 59, 59) }),
    },
    {
        name: 'Easter',
        themeId: 'holiday-easter',
        getPeriod: (year) => {
            const easterDate = getEaster(year);
            const startDate = new Date(year, 3, 1); // April 1st
            const endDate = new Date(easterDate);
            endDate.setHours(23, 59, 59);
            return { startDate, endDate };
        },
    },
    {
        name: "Mother's Day",
        themeId: 'holiday-mothers-day',
        getPeriod: (year) => {
            const mothersDay = getNthDayOfMonth(2, 0, 4, year); // 2nd Sunday in May
            const startDate = new Date(mothersDay);
            startDate.setDate(mothersDay.getDate() - 14);
            const endDate = new Date(mothersDay);
            endDate.setHours(23, 59, 59);
            return { startDate, endDate };
        },
    },
    {
        name: "Father's Day",
        themeId: 'holiday-fathers-day',
        getPeriod: (year) => {
            const fathersDay = getNthDayOfMonth(3, 0, 5, year); // 3rd Sunday in June
            const startDate = new Date(fathersDay);
            startDate.setDate(fathersDay.getDate() - 14);
            const endDate = new Date(fathersDay);
            endDate.setHours(23, 59, 59);
            return { startDate, endDate };
        },
    },
    {
        name: 'Independence Day',
        themeId: 'holiday-independence-day',
        getPeriod: (year) => ({ startDate: new Date(year, 6, 1), endDate: new Date(year, 6, 4, 23, 59, 59) }),
    },
    {
        name: 'Halloween',
        themeId: 'holiday-halloween',
        getPeriod: (year) => ({ startDate: new Date(year, 9, 18), endDate: new Date(year, 9, 31, 23, 59, 59) }),
    },
    {
        name: 'Thanksgiving',
        themeId: 'holiday-thanksgiving',
        getPeriod: (year) => {
            const thanksgivingDay = getNthDayOfMonth(4, 4, 10, year); // 4th Thursday in Nov
            const startDate = new Date(thanksgivingDay);
            startDate.setDate(thanksgivingDay.getDate() - 14);
            const endDate = new Date(thanksgivingDay);
            endDate.setHours(23, 59, 59);
            return { startDate, endDate };
        },
    },
    {
        name: 'Christmas',
        themeId: 'holiday-christmas',
        getPeriod: (year) => ({ startDate: new Date(year, 11, 11), endDate: new Date(year, 11, 25, 23, 59, 59) }),
    },
];

const getActiveHolidayTheme = (date: Date): { name: string; themeId: string } | null => {
    const year = date.getFullYear();
    for (const holiday of holidays) {
        const { startDate, endDate } = holiday.getPeriod(year);
        if (date >= startDate && date <= endDate) {
            return { name: holiday.name, themeId: holiday.themeId };
        }
    }
    // Also check for previous year's New Year's Eve theme if it's early January
    const prevYear = year - 1;
    const newYearsEvePrevYear = holidays.find(h => h.name === "New Year's Eve");
    if (newYearsEvePrevYear) {
        const { startDate, endDate } = newYearsEvePrevYear.getPeriod(prevYear);
         if (date >= startDate && date <= endDate) {
            return { name: newYearsEvePrevYear.name, themeId: newYearsEvePrevYear.themeId };
        }
    }
    
    return null;
};

export const getNextHoliday = (date: Date): {name: string, date: Date, startDate: Date} | null => {
    const year = date.getFullYear();
    const upcomingThisYear = holidays
        .map(h => ({ name: h.name, startDate: h.getPeriod(year).startDate }))
        .filter(h => h.startDate > date)
        .sort((a,b) => a.startDate.getTime() - b.startDate.getTime());
    
    if (upcomingThisYear.length > 0) {
        return { name: upcomingThisYear[0].name, date: upcomingThisYear[0].startDate, startDate: upcomingThisYear[0].startDate };
    }

    const nextYear = year + 1;
    const upcomingNextYear = holidays
        .map(h => ({ name: h.name, startDate: h.getPeriod(nextYear).startDate }))
        .sort((a,b) => a.startDate.getTime() - b.startDate.getTime());
        
    if (upcomingNextYear.length > 0) {
        return { name: upcomingNextYear[0].name, date: upcomingNextYear[0].startDate, startDate: upcomingNextYear[0].startDate };
    }

    return null;
}

interface HolidayInfo {
    isHoliday: boolean;
    holidayName: string | null;
}

export function useTheme(customThemes: Theme[], autoHolidayThemesEnabled: boolean): [Theme, (themeId: string) => void, HolidayInfo] {
  const [themeId, setThemeId] = useLocalStorage<string>('themeId', 'original-dark');

  const allThemes = useMemo(() => [...builtInThemes, ...holidayThemes, ...customThemes], [customThemes]);

  const activeHoliday = useMemo(() => {
    if (!autoHolidayThemesEnabled) return null;
    return getActiveHolidayTheme(new Date());
  }, [autoHolidayThemesEnabled]);

  const finalThemeId = activeHoliday ? activeHoliday.themeId : themeId;

  const activeTheme = allThemes.find(t => t.id === finalThemeId) || allThemes.find(t => t.id === themeId) || builtInThemes[0];
  
  const holidayInfo: HolidayInfo = {
      isHoliday: !!activeHoliday,
      holidayName: activeHoliday ? activeHoliday.name : null
  };

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
    root.style.setProperty('--on-accent', activeTheme.colors.onAccent || (activeTheme.base === 'dark' ? '#FFFFFF' : '#000000'));
    
    // For pattern themes, we need to add specific properties to the body
    // because the main 'background' property in CSS doesn't cover everything.
    if (activeTheme.colors.patternBgSize) {
        // The bgGradient for patterns already includes the overlay color.
        // This just adds sizing and positioning for the pattern part.
        document.body.style.backgroundSize = activeTheme.colors.patternBgSize;
        document.body.style.backgroundColor = activeTheme.colors.patternBgColor || 'transparent'; // base color behind pattern
        document.body.style.backgroundPosition = activeTheme.colors.patternBgPosition || '0 0';
    } else {
        // IMPORTANT: Reset these properties for non-pattern themes
        document.body.style.backgroundSize = '';
        document.body.style.backgroundColor = '';
        document.body.style.backgroundPosition = '';
    }

    // Special class for Halloween theme
    if (activeTheme.id === 'holiday-halloween') {
        document.body.classList.add('halloween-theme-active');
    } else {
        document.body.classList.remove('halloween-theme-active');
    }

  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (allThemes.some(t => t.id === newThemeId)) {
        setThemeId(newThemeId);
    }
  };

  return [activeTheme, setTheme, holidayInfo];
}