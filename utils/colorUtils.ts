// utils/colorUtils.ts

/**
 * Extracts the average dominant color from an image URL.
 * Falls back to a default if extraction fails (e.g., CORS).
 */
export async function getDominantColor(imageUrl: string): Promise<{ primary: string; secondary: string; isLight: boolean } | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);

            // Use a tiny canvas to get the average color
            canvas.width = 1;
            canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);

            try {
                const imageData = ctx.getImageData(0, 0, 1, 1).data;
                const [r, g, b] = imageData;
                const primary = rgbToHex(r, g, b);
                
                // Calculate relative luminance to determine text contrast (standard formula)
                const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                const isLight = luminance > 0.6; // Threshold for dark vs light text
                
                // Generate a slightly more vibrant/different secondary for the gradient
                const secondary = adjustColor(primary, 30);
                
                resolve({ primary, secondary, isLight });
            } catch (e) {
                console.warn("Cameleon: Could not read image data (CORS likely).");
                resolve(null);
            }
        };

        img.onerror = () => resolve(null);
    });
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

/**
 * Simple color adjustment to create a gradient pair.
 * Positive percent lightens, negative darkens.
 */
function adjustColor(hex: string, percent: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.floor(r * (100 + percent) / 100);
    g = Math.floor(g * (100 + percent) / 100);
    b = Math.floor(b * (100 + percent) / 100);

    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Mixes two colors for the navigation spectral effect.
 */
export function mixColors(c1: string, c2: string, weight: number): string {
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
}
