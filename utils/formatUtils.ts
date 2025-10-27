
// utils/formatUtils.ts

export const formatRuntime = (minutes: number | null | undefined): string => {
    if (!minutes || minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (mins > 0) {
        parts.push(`${mins}m`);
    }
    return parts.join(' ');
};