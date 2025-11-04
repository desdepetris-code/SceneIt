// utils/achievementImages.ts

const createSvg = (iconPath: string, color: string, bgColor: string, name?: string) => {
    const iconContent = name ?
        // Move icon up and scale it down to make room for the text
        `<g transform="translate(4 2.5) scale(0.66)">
            <path fill="${color}" d="${iconPath}" />
        </g>` :
        // Render icon normally if there's no text
        `<path fill="${color}" d="${iconPath}" />`;

    // Add text element only if a name is provided, try to fit it.
    const nameText = name ? `
        <text x="12" y="21" font-family="sans-serif" font-size="2.2" fill="${color}" text-anchor="middle" font-weight="bold" lengthAdjust="spacingAndGlyphs" textLength="22">${name}</text>
    ` : '';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">
            <rect width="24" height="24" rx="6" fill="${bgColor}" />
            ${iconContent}
            ${nameText}
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const ICONS = {
    JOURNAL: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    MOVIE: 'M6 20.25h12m-7.5-3.75v3.75m-3.75-3.75v3.75m-3.75-3.75h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 004.5 16.5z',
    TV: 'M9 17.25v.75a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-.75m-6 0h6M6 12.75H4.5a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25H19.5a2.25 2.25 0 002.25-2.25v-2.25a2.25 2.25 0 00-2.25-2.25H18M6 12.75v-2.25a2.25 2.25 0 012.25-2.25h7.5a2.25 2.25 0 012.25 2.25v2.25',
    STREAK: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797A8.33 8.33 0 0112 2.25c1.153 0 2.243.3 3.218.834a8.22 8.22 0 01.144 2.13z',
    LIST: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    RATING: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    GENRE: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z',
    TIME: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    DEFAULT: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
};

const COLORS = {
    bronze: { icon: '#CD7F32', bg: '#4d3a2a' },
    silver: { icon: '#C0C0C0', bg: '#4c4c4c' },
    gold: { icon: '#FFD700', bg: '#665f2b' },
};

export const getAchievementImage = (achievementId: string, difficulty: 'Easy' | 'Medium' | 'Hard', name?: string): string => {
    let iconPath = ICONS.DEFAULT;
    
    if (achievementId.includes('journal') || achievementId.includes('critic') || achievementId.includes('mood')) iconPath = ICONS.JOURNAL;
    else if (achievementId.includes('movie')) iconPath = ICONS.MOVIE;
    else if (achievementId.includes('episode') || achievementId.includes('series') || achievementId.includes('season') || achievementId.includes('show')) iconPath = ICONS.TV;
    else if (achievementId.includes('streak')) iconPath = ICONS.STREAK;
    else if (achievementId.includes('list')) iconPath = ICONS.LIST;
    else if (achievementId.includes('rat')) iconPath = ICONS.RATING;
    else if (achievementId.includes('genre')) iconPath = ICONS.GENRE;
    else if (achievementId.includes('hour') || achievementId.includes('decade') || achievementId.includes('watch')) iconPath = ICONS.TIME;

    const colorScheme = difficulty === 'Easy' ? COLORS.bronze : difficulty === 'Medium' ? COLORS.silver : COLORS.gold;

    return createSvg(iconPath, colorScheme.icon, colorScheme.bg, name);
};
