// utils/soundUtils.ts

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            return null;
        }
    }
    return audioCtx;
};

export const playNotificationSound = (): void => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if it's suspended (e.g., due to browser autoplay policy)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Configure sound properties for a short, pleasant "ping"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2); // Decay

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
        console.error("Could not play notification sound.", e);
    }
};