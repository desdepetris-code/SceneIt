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

export const isNewRelease = (dateString: string | null | undefined): boolean => {
    if (!dateString) return false;
    try {
        // Handle date-only strings by parsing in UTC to avoid timezone shifts
        const releaseDate = new Date(dateString.length === 10 ? `${dateString}T00:00:00Z` : dateString);
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        // Check if the release date is within the last 14 days and not in the future
        return releaseDate >= fourteenDaysAgo && releaseDate <= now;
    } catch (e) {
        console.error("Error parsing date for new release check:", e);
        return false;
    }
};

export const formatDate = (
    date: string | Date, 
    timezone: string, 
    options?: Intl.DateTimeFormatOptions
): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone
    };
    try {
        // Adding 'T00:00:00' for date-only strings to avoid timezone shift on parsing
        const dateStrToParse = typeof date === 'string' && date.length === 10 ? `${date}T00:00:00` : date;
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(dateStrToParse));
    } catch (e) {
        console.error("Error formatting date with timezone", e);
        // Fallback to local
        return new Date(date).toLocaleDateString();
    }
};

export const formatDateTime = (
    date: string | Date, 
    timezone: string,
    options?: Intl.DateTimeFormatOptions
): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', timeZone: timezone
    };
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
    } catch(e) {
        console.error("Error formatting datetime with timezone", e);
        // Fallback to local
        return new Date(date).toLocaleString();
    }
};

export const formatTimeFromDate = (
    date: string | Date,
    timezone: string
): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone,
        }).format(dateObj);
    } catch(e) {
        console.error("Error formatting time with timezone", e);
        return new Date(date).toLocaleTimeString();
    }
}

export const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts: string[] = [];
    if (hours > 0) parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
    return parts.join(':');
};

export const formatAirtime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  try {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12; // convert 0 to 12
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch (e) {
    return timeString || ''; // fallback
  }
}

export const getWeekDateRange = (date: Date): { startDate: Date; endDate: Date } => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  const diffToSunday = d.getDate() - day;
  const startDate = new Date(d.setDate(diffToSunday));
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return { startDate, endDate };
};

export const formatShortDate = (date: Date): string => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    return `${month}/${day}/${year}`;
};

export const getFormattedWeekDateRange = (date: Date): string => {
  const { startDate, endDate } = getWeekDateRange(date);
  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
};