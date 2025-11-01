// utils/xpUtils.ts

export const XP_CONFIG = {
  episode: 10,
  movie: 50,
  journal: 5,
  feedback: 5,
};

// Exponential growth for levels: Level 1 = 100XP, Level 2 = 250XP total, etc.
const BASE_XP = 100;
const GROWTH_RATE = 1.5;

export const calculateLevelInfo = (xp: number) => {
  if (xp < 0) xp = 0;

  let level = 1;
  let xpForNextLevel = BASE_XP;
  let totalXpForLevel = 0;

  while (xp >= totalXpForLevel + xpForNextLevel) {
    totalXpForLevel += xpForNextLevel;
    xpForNextLevel = Math.floor(xpForNextLevel * GROWTH_RATE);
    level++;
  }
  
  const xpIntoCurrentLevel = xp - totalXpForLevel;
  const progressPercent = (xpIntoCurrentLevel / xpForNextLevel) * 100;

  return {
    level,
    xp,
    xpForNextLevel: xpForNextLevel,
    xpForCurrentLevelStart: totalXpForLevel,
    xpProgress: xpIntoCurrentLevel,
    progressPercent: Math.min(progressPercent, 100),
  };
};