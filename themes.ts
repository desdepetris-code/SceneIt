import { Theme } from './types';

// New Theme
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

// Original Theme (Refreshed)
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

// New Themes
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

const monochromeNoir: Theme = {
  id: 'monochrome-noir',
  name: 'Noir Redux',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #171717, #0a0a0a)',
    accentGradient: 'linear-gradient(to right, #991b1b, #ef4444)',
    cardGradient: 'linear-gradient(to bottom, rgba(38, 38, 38, 0.5), rgba(20, 20, 20, 0.7))',
    textColorPrimary: '#fafafa',
    textColorSecondary: '#d4d4d4',
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

const slate: Theme = {
  id: 'slate',
  name: 'Slate',
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

const stone: Theme = {
  id: 'stone',
  name: 'Stone',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #f5f5f4, #f5f5f4)',
    accentGradient: 'linear-gradient(to right, #f97316, #fb923c)',
    cardGradient: 'linear-gradient(to bottom, #ffffff, #fafaf9)',
    textColorPrimary: '#44403c',
    textColorSecondary: '#78716c',
    accentPrimary: '#f97316',
    accentSecondary: '#fb923c',
    bgPrimary: '#f5f5f4',
    bgSecondary: '#e7e5e4',
    bgBackdrop: 'rgba(245, 245, 244, 0.2)',
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

export const themes: Theme[] = [
    crimsonSilver,
    originalDark,
    originalLight,
    rubyFlare,
    cyberpunkCity,
    electricSunset,
    emeraldSea,
    vintageSepia,
    monochromeNoir,
    justBlack,
    justWhite,
    slate,
    stone,
];