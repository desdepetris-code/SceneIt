import { Theme } from './types';

// --- DARK THEMES ---

const originalDark: Theme = {
  id: 'original-dark',
  name: 'Radiant Red',
  base: 'dark',
  colors: {
    bgGradient: 'radial-gradient(ellipse at top, #b91c1c, #450a0a)',
    accentGradient: 'linear-gradient(to right, #f87171, #dc2626)',
    cardGradient: 'linear-gradient(to bottom, rgba(185, 28, 28, 0.3), rgba(69, 10, 10, 0.5))',
    textColorPrimary: '#FFFBEB',
    textColorSecondary: '#FECACA',
    accentPrimary: '#f87171',
    accentSecondary: '#dc2626',
    bgPrimary: '#450a0a',
    bgSecondary: 'rgba(239, 68, 68, 0.1)',
    bgBackdrop: 'rgba(69, 10, 10, 0.3)',
  }
};

const crimsonSilver: Theme = {
  id: 'crimson-silver',
  name: 'Crimson Silver',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #450a0a, #1c0404)',
    accentGradient: 'linear-gradient(to right, #A0AEC0, #4A5568)', // Silver to Dark Gray
    cardGradient: 'linear-gradient(to bottom, rgba(76, 29, 29, 0.5), rgba(45, 55, 72, 0.7))',
    textColorPrimary: '#F7FAFC', // Lighter (off-white)
    textColorSecondary: '#CBD5E0', // Light Gray
    accentPrimary: '#A0AEC0', // Silver
    accentSecondary: '#4A5568', // Dark Gray
    bgPrimary: '#2b0808',
    bgSecondary: 'rgba(160, 174, 192, 0.1)', // Gray tint
    bgBackdrop: 'rgba(43, 8, 8, 0.3)',
  },
};

const rubyFlare: Theme = {
  id: 'ruby-flare',
  name: 'Ruby Flare',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #450a0a, #1f2937)',
    accentGradient: 'linear-gradient(to right, #dc2626, #fca5a5)',
    cardGradient: 'linear-gradient(to bottom, rgba(127, 29, 29, 0.3), rgba(30, 41, 59, 0.5))',
    textColorPrimary: '#fee2e2',
    textColorSecondary: '#fca5a5',
    accentPrimary: '#dc2626',
    accentSecondary: '#ef4444',
    bgPrimary: '#262d3a',
    bgSecondary: 'rgba(220, 38, 38, 0.1)',
    bgBackdrop: 'rgba(38, 45, 58, 0.3)',
  },
};

const cyberpunkCity: Theme = {
  id: 'cyberpunk-city',
  name: 'Cyberpunk City',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #030712, #1a011d)',
    accentGradient: 'linear-gradient(to right, #ec4899, #22d3ee)',
    cardGradient: 'linear-gradient(to bottom, rgba(20, 4, 32, 0.5), rgba(10, 2, 12, 0.7))',
    textColorPrimary: '#f0f9ff',
    textColorSecondary: '#67e8f9',
    accentPrimary: '#ec4899',
    accentSecondary: '#22d3ee',
    bgPrimary: '#110115',
    bgSecondary: 'rgba(236, 72, 153, 0.1)',
    bgBackdrop: 'rgba(17, 1, 21, 0.3)',
  },
};

const oceanicTwilight: Theme = {
  id: 'oceanic-twilight',
  name: 'Oceanic Twilight',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #0a192f, #020c1b)',
    accentGradient: 'linear-gradient(to right, #3b82f6, #1e40af)',
    cardGradient: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), rgba(30, 64, 175, 0.2))',
    textColorPrimary: '#e2e8f0',
    textColorSecondary: '#94a3b8',
    accentPrimary: '#3b82f6',
    accentSecondary: '#1e40af',
    bgPrimary: '#0a192f',
    bgSecondary: 'rgba(59, 130, 246, 0.1)',
    bgBackdrop: 'rgba(10, 25, 47, 0.3)',
  },
};

const fuchsiaDream: Theme = {
  id: 'fuchsia-dream',
  name: 'Fuchsia Dream',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #9d174d, #5f0f3b)',
    accentGradient: 'linear-gradient(to right, #ec4899, #be185d)',
    cardGradient: 'linear-gradient(to bottom, rgba(236, 72, 153, 0.15), rgba(95, 15, 59, 0.3))',
    textColorPrimary: '#fce7f3',
    textColorSecondary: '#f9a8d4',
    accentPrimary: '#ec4899',
    accentSecondary: '#be185d',
    bgPrimary: '#3d071d',
    bgSecondary: 'rgba(236, 72, 153, 0.1)',
    bgBackdrop: 'rgba(61, 7, 29, 0.3)',
  },
};

const abyssalTeal: Theme = {
  id: 'abyssal-teal',
  name: 'Abyssal Teal',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #0a0a0a, #000000)',
    accentGradient: 'linear-gradient(to right, #2dd4bf, #0d9488)',
    cardGradient: 'linear-gradient(to bottom, rgba(20, 184, 166, 0.1), rgba(13, 148, 136, 0.2))',
    textColorPrimary: '#5eead4',
    textColorSecondary: '#2dd4bf',
    accentPrimary: '#2dd4bf',
    accentSecondary: '#0d9488',
    bgPrimary: '#0a0a0a',
    bgSecondary: 'rgba(20, 184, 166, 0.05)',
    bgBackdrop: 'rgba(10, 10, 10, 0.3)',
  },
};

const electricSunset: Theme = {
  id: 'electric-sunset',
  name: 'Electric Sunset',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #581c87, #450a0a)',
    accentGradient: 'linear-gradient(to right, #ec4899, #a855f7)',
    cardGradient: 'linear-gradient(to bottom, rgba(88, 28, 135, 0.4), rgba(69, 10, 10, 0.6))',
    textColorPrimary: '#f3e8ff',
    textColorSecondary: '#e9d5ff',
    accentPrimary: '#ec4899',
    accentSecondary: '#a855f7',
    bgPrimary: '#1e1b4b',
    bgSecondary: 'rgba(236, 72, 153, 0.1)',
    bgBackdrop: 'rgba(30, 27, 75, 0.3)',
  }
};

const emeraldSea: Theme = {
  id: 'emerald-sea',
  name: 'Deep Sea',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #004d40, #00251a)',
    accentGradient: 'linear-gradient(to right, #64ffda, #1de9b6)',
    cardGradient: 'linear-gradient(to bottom, rgba(0, 77, 64, 0.5), rgba(0, 37, 26, 0.7))',
    textColorPrimary: '#e0f2f1',
    textColorSecondary: '#80cbc4',
    accentPrimary: '#64ffda',
    accentSecondary: '#1de9b6',
    bgPrimary: '#00251a',
    bgSecondary: 'rgba(100, 255, 218, 0.1)',
    bgBackdrop: 'rgba(0, 37, 26, 0.3)',
  },
};

const monochromeNoir: Theme = {
  id: 'monochrome-noir',
  name: 'Noir Redux',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #171717, #0a0a0a)',
    accentGradient: 'linear-gradient(to right, #991b1b, #ef4444)',
    cardGradient: 'linear-gradient(to bottom, rgba(38, 38, 38, 0.5), rgba(20, 20, 20, 0.7))',
    textColorPrimary: '#fee2e2',
    textColorSecondary: '#fca5a5',
    accentPrimary: '#b91c1c',
    accentSecondary: '#ef4444',
    bgPrimary: '#171717',
    bgSecondary: 'rgba(255, 255, 255, 0.1)',
    bgBackdrop: 'rgba(23, 23, 23, 0.3)',
  },
};

const justBlack: Theme = {
  id: 'just-black',
  name: 'Black',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #000000, #000000)',
    accentGradient: 'linear-gradient(to right, #888888, #555555)',
    cardGradient: 'linear-gradient(to bottom, #181818, #0a0a0a)',
    textColorPrimary: '#e5e5e5',
    textColorSecondary: '#a3a3a3',
    accentPrimary: '#888888',
    accentSecondary: '#555555',
    bgPrimary: '#000000',
    bgSecondary: '#111111',
    bgBackdrop: 'rgba(17, 17, 17, 0.3)',
  },
};

const slate: Theme = {
  id: 'slate',
  name: 'Midnight Slate',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #0f172a, #0f172a)',
    accentGradient: 'linear-gradient(to right, #14b8a6, #2dd4bf)',
    cardGradient: 'linear-gradient(to bottom, #1e293b, #0f172a)',
    textColorPrimary: '#e2e8f0',
    textColorSecondary: '#94a3b8',
    accentPrimary: '#14b8a6',
    accentSecondary: '#2dd4bf',
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgBackdrop: 'rgba(15, 23, 42, 0.3)',
  },
};

// --- LIGHT THEMES ---

const originalLight: Theme = {
  id: 'original-light',
  name: 'Minty Fresh',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #f0fdfa, #ccfbf1)',
    accentGradient: 'linear-gradient(to right, #14b8a6, #0d9488)',
    cardGradient: 'linear-gradient(to bottom, #ffffff, #f0fdfa)',
    textColorPrimary: '#0f766e',
    textColorSecondary: '#115e59',
    accentPrimary: '#14b8a6',
    accentSecondary: '#0d9488',
    bgPrimary: '#f0fdfa',
    bgSecondary: '#ccfbf1',
    bgBackdrop: 'rgba(240, 253, 250, 0.2)',
  }
};

const vintageSepia: Theme = {
  id: 'vintage-sepia',
  name: 'Old Parchment',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #fdf6e3, #e8dcb5)',
    accentGradient: 'linear-gradient(to right, #6d4c41, #4e342e)',
    cardGradient: 'linear-gradient(to bottom, rgba(253, 246, 227, 0.8), rgba(245, 222, 179, 0.9))',
    textColorPrimary: '#3e2723',
    textColorSecondary: '#5d4037',
    accentPrimary: '#6d4c41',
    accentSecondary: '#4e342e',
    bgPrimary: '#fdf6e3',
    bgSecondary: '#eee8d5',
    bgBackdrop: 'rgba(253, 246, 227, 0.2)',
  },
};

const goldenHour: Theme = {
  id: 'golden-hour',
  name: 'Golden Hour',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #fff7ed, #fef3c7)',
    accentGradient: 'linear-gradient(to right, #fb923c, #f59e0b)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(254, 243, 199, 0.8))',
    textColorPrimary: '#7c2d12',
    textColorSecondary: '#9a3412',
    accentPrimary: '#fb923c',
    accentSecondary: '#f59e0b',
    bgPrimary: '#fff7ed',
    bgSecondary: '#fef3c7',
    bgBackdrop: 'rgba(255, 247, 237, 0.3)',
  }
};

const lavenderBliss: Theme = {
  id: 'lavender-bliss',
  name: 'Lavender Bliss',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #f5f3ff, #ede9fe)',
    accentGradient: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(237, 233, 254, 0.8))',
    textColorPrimary: '#4c1d95',
    textColorSecondary: '#5b21b6',
    accentPrimary: '#8b5cf6',
    accentSecondary: '#7c3aed',
    bgPrimary: '#f5f3ff',
    bgSecondary: '#ede9fe',
    bgBackdrop: 'rgba(245, 243, 255, 0.3)',
  }
};

const oceanBreeze: Theme = {
  id: 'ocean-breeze',
  name: 'Ocean Breeze',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
    accentGradient: 'linear-gradient(to right, #38bdf8, #0ea5e9)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(224, 242, 254, 0.8))',
    textColorPrimary: '#0c4a6e',
    textColorSecondary: '#075985',
    accentPrimary: '#38bdf8',
    accentSecondary: '#0ea5e9',
    bgPrimary: '#f0f9ff',
    bgSecondary: '#e0f2fe',
    bgBackdrop: 'rgba(240, 249, 255, 0.3)',
  }
};

const softPeach: Theme = {
  id: 'soft-peach',
  name: 'Soft Peach',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #fff7f5, #ffeadb)',
    accentGradient: 'linear-gradient(to right, #fb923c, #f97316)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 234, 219, 0.8))',
    textColorPrimary: '#854d0e',
    textColorSecondary: '#b45309',
    accentPrimary: '#fb923c',
    accentSecondary: '#f97316',
    bgPrimary: '#fff7f5',
    bgSecondary: '#ffeadb',
    bgBackdrop: 'rgba(255, 247, 245, 0.3)',
  }
};

const mintMojito: Theme = {
  id: 'mint-mojito',
  name: 'Mint Mojito',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
    accentGradient: 'linear-gradient(to right, #4ade80, #22c55e)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(220, 252, 231, 0.8))',
    textColorPrimary: '#14532d',
    textColorSecondary: '#166534',
    accentPrimary: '#4ade80',
    accentSecondary: '#22c55e',
    bgPrimary: '#f0fdf4',
    bgSecondary: '#dcfce7',
    bgBackdrop: 'rgba(240, 253, 244, 0.3)',
  }
};

const cherryBlossom: Theme = {
  id: 'cherry-blossom',
  name: 'Cherry Blossom',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #fdf2f8, #fce7f3)',
    accentGradient: 'linear-gradient(to right, #f472b6, #ec4899)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(252, 231, 243, 0.8))',
    textColorPrimary: '#831843',
    textColorSecondary: '#9d174d',
    accentPrimary: '#f472b6',
    accentSecondary: '#ec4899',
    bgPrimary: '#fdf2f8',
    bgSecondary: '#fce7f3',
    bgBackdrop: 'rgba(253, 242, 248, 0.3)',
  }
};

const daybreak: Theme = {
  id: 'daybreak',
  name: 'Daybreak',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #e0f2fe, #fef9c3)',
    accentGradient: 'linear-gradient(to right, #f59e0b, #0ea5e9)',
    cardGradient: 'linear-gradient(to bottom, rgba(224, 242, 254, 0.8), rgba(254, 249, 195, 0.8))',
    textColorPrimary: '#0c4a6e',
    textColorSecondary: '#854d0e',
    accentPrimary: '#0ea5e9',
    accentSecondary: '#f59e0b',
    bgPrimary: '#f0f9ff',
    bgSecondary: '#fefce8',
    bgBackdrop: 'rgba(240, 249, 255, 0.3)',
  }
};

const powderBlue: Theme = {
  id: 'powder-blue',
  name: 'Powder Blue',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #f0f9ff, #f0f9ff)',
    accentGradient: 'linear-gradient(to right, #7dd3fc, #38bdf8)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(240, 249, 255, 0.8))',
    textColorPrimary: '#0369a1',
    textColorSecondary: '#075985',
    accentPrimary: '#7dd3fc',
    accentSecondary: '#38bdf8',
    bgPrimary: '#f0f9ff',
    bgSecondary: '#e0f2fe',
    bgBackdrop: 'rgba(240, 249, 255, 0.3)',
  }
};

const cottonCandy: Theme = {
  id: 'cotton-candy',
  name: 'Cotton Candy',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to right, #fbcfe8, #a5f3fc)',
    accentGradient: 'linear-gradient(to right, #ec4899, #22d3ee)',
    cardGradient: 'linear-gradient(to bottom, rgba(251, 207, 232, 0.8), rgba(165, 243, 252, 0.8))',
    textColorPrimary: '#831843',
    textColorSecondary: '#0e7490',
    accentPrimary: '#ec4899',
    accentSecondary: '#22d3ee',
    bgPrimary: '#fdf2f8',
    bgSecondary: '#ecfeff',
    bgBackdrop: 'rgba(253, 242, 248, 0.3)',
  }
};

const justWhite: Theme = {
  id: 'just-white',
  name: 'White',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
    accentGradient: 'linear-gradient(to right, #555555, #888888)',
    cardGradient: 'linear-gradient(to bottom, #ffffff, #f5f5f5)',
    textColorPrimary: '#171717',
    textColorSecondary: '#525252',
    accentPrimary: '#555555',
    accentSecondary: '#888888',
    bgPrimary: '#ffffff',
    bgSecondary: '#e5e5e5',
    bgBackdrop: 'rgba(245, 245, 244, 0.2)',
  },
};

export const themes: Theme[] = [
    // Dark Themes
    originalDark,
    crimsonSilver,
    rubyFlare,
    cyberpunkCity,
    oceanicTwilight,
    fuchsiaDream,
    abyssalTeal,
    electricSunset,
    emeraldSea,
    monochromeNoir,
    justBlack,
    slate,
    // Light Themes
    originalLight,
    vintageSepia,
    goldenHour,
    lavenderBliss,
    oceanBreeze,
    softPeach,
    mintMojito,
    cherryBlossom,
    daybreak,
    powderBlue,
    cottonCandy,
    justWhite,
];