import React, { useMemo } from 'react';
import { ParticleEffectName } from '../types';

interface BackgroundParticleEffectsProps {
  effect: ParticleEffectName[] | undefined;
}

const particleConfig = {
    snow: { content: '❄️', count: 30, minSize: 10, maxSize: 20 },
    hearts: { content: '❤️', count: 20, minSize: 12, maxSize: 24 },
    leaves: { content: ['🍂', '🍁', '🍃'], count: 25, minSize: 15, maxSize: 25 },
    confetti: { content: ['🎉', '🎊', '✨'], count: 40, minSize: 10, maxSize: 20 },
    fireworks: { content: ['🎆', '🎇'], count: 15, minSize: 20, maxSize: 40 },
    sparkles: { content: '✨', count: 35, minSize: 8, maxSize: 16 },
    bats: { content: '🦇', count: 12, minSize: 15, maxSize: 25 },
    flowers: { content: ['🌸', '🌼', '🌷'], count: 25, minSize: 15, maxSize: 25 },
    pumpkins: { content: '🎃', count: 8, minSize: 20, maxSize: 30 },
    ghosts: { content: '👻', count: 10, minSize: 15, maxSize: 25 },
    eggs: { content: ['🥚', '🐣'], count: 25, minSize: 15, maxSize: 25 },
};

const BackgroundParticleEffects: React.FC<BackgroundParticleEffectsProps> = ({ effect }) => {
    const particles = useMemo(() => {
        if (!effect || effect.length === 0) return [];
        
        let allParticles: any[] = [];
        let particleIdCounter = 0;

        effect.forEach(effectName => {
            const config = particleConfig[effectName as keyof typeof particleConfig];
            if (!config) return;

            const newParticlesForEffect = Array.from({ length: config.count }).map((_, i) => {
                const content = Array.isArray(config.content)
                    ? config.content[i % config.content.length]
                    : config.content;
                
                const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
                let style: React.CSSProperties = {
                    fontSize: `${size}px`,
                };

                // Default fall animation
                const duration = Math.random() * 8 + 8;
                const delay = Math.random() * -16;
                const animationName = ['leaves'].includes(effectName) ? 'sway-and-fall' : 'fall';
                // FIX: Cast style object to React.CSSProperties to allow for custom CSS properties like '--sway-amount'.
                style = {
                    ...style,
                    left: `${Math.random() * 100}vw`,
                    top: '-5vh',
                    animation: `${animationName} ${duration}s linear ${delay}s infinite`,
                    '--sway-amount': `${(Math.random() - 0.5) * 10}vw`
                } as React.CSSProperties;

                if (effectName === 'ghosts') {
                    style = {
                        ...style,
                        left: `-10vw`,
                        top: `${Math.random() * 90}vh`,
                        animation: `slide-across ${Math.random() * 10 + 10}s linear ${Math.random() * 20}s infinite`,
                    };
                } else if (effectName === 'pumpkins') {
                    style = {
                        ...style,
                        left: `${Math.random() * 90 + 5}vw`,
                        top: `${Math.random() * 85 + 5}vh`,
                        animationName: `fade-in-out`,
                        animationDuration: `${Math.random() * 3 + 4}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationDelay: `${Math.random() * 15}s`,
                        animationIterationCount: 'infinite',
                    };
                } else if (effectName === 'bats') {
                    style = {
                        ...style,
                        left: `-10vw`,
                        top: `${Math.random() * 80}vh`,
                        animation: `bat-fly-across ${Math.random() * 5 + 8}s linear ${Math.random() * 20}s infinite`,
                    };
                }

                return {
                    id: particleIdCounter++,
                    content,
                    style,
                    effectName,
                    hasBooBubble: effectName === 'ghosts' ? Math.random() < 0.25 : false,
                };
            });
            allParticles.push(...newParticlesForEffect);
        });
        
        return allParticles;
    }, [effect]);

    if (!effect || particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map(p => {
                if (p.effectName === 'pumpkins') {
                    return (
                        <div key={p.id} className="particle-bg pumpkin-container" style={p.style}>
                            <span className="pumpkin-emoji">{p.content}</span>
                            <div className="pumpkin-eye left"></div>
                            <div className="pumpkin-eye right"></div>
                        </div>
                    )
                }
                if (p.effectName === 'ghosts') {
                    return (
                        <div key={p.id} className="particle-bg" style={p.style}>
                            {p.content}
                            {p.hasBooBubble && <div className="boo-bubble">Boo!</div>}
                        </div>
                    )
                }
                return (
                    <span key={p.id} className="particle-bg" style={p.style}>
                        {p.content}
                    </span>
                )
            })}
            <style>{`
                @keyframes fall {
                    to { transform: translateY(105vh); }
                }
                @keyframes sway-and-fall {
                    to { transform: translateY(105vh) translateX(var(--sway-amount)); }
                }
                @keyframes slide-across {
                    0%   { transform: translateX(-10vw); opacity: 0; }
                    10%  { opacity: 0.8; }
                    90%  { opacity: 0.8; }
                    100% { transform: translateX(110vw); opacity: 0; }
                }
                @keyframes fade-in-out {
                    0%, 100% { opacity: 0; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1); }
                }
                @keyframes pumpkin-eye-glow {
                    0%, 100% { box-shadow: 0 0 2px #ffc500, 0 0 3px #ff8000; }
                    50% { box-shadow: 0 0 10px #ffc500, 0 0 15px #ff8000, 0 0 20px #ff8000; }
                }
                @keyframes bat-fly-across {
                    0%   { transform: translateX(-10vw) scaleY(1); opacity: 0.8; }
                    10%  { transform: translateX(10vw) scaleY(-1); }
                    20%  { transform: translateX(20vw) scaleY(1); }
                    30%  { transform: translateX(30vw) scaleY(-1); }
                    40%  { transform: translateX(40vw) scaleY(1); }
                    50%  { transform: translateX(50vw) scaleY(-1); }
                    60%  { transform: translateX(60vw) scaleY(1); }
                    70%  { transform: translateX(70vw) scaleY(-1); }
                    80%  { transform: translateX(80vw) scaleY(1); }
                    90%  { transform: translateX(90vw) scaleY(-1); opacity: 0.8; }
                    100% { transform: translateX(110vw) scaleY(1); opacity: 0; }
                }
                .particle-bg {
                    position: absolute;
                    opacity: 0.7;
                    text-shadow: 0 0 5px rgba(0,0,0,0.5);
                    will-change: transform, opacity;
                }
                .pumpkin-container {
                    position: absolute;
                    display: inline-block;
                    line-height: 1;
                }
                .pumpkin-container .pumpkin-eye {
                    position: absolute;
                    width: 15%;
                    height: 15%;
                    background: #ffc500;
                    border-radius: 50%;
                    animation-name: pumpkin-eye-glow;
                    animation-duration: inherit;
                    animation-timing-function: inherit;
                    animation-delay: inherit;
                    animation-iteration-count: inherit;
                }
                .pumpkin-container .pumpkin-eye.left {
                    top: 30%;
                    left: 25%;
                }
                .pumpkin-container .pumpkin-eye.right {
                    top: 30%;
                    right: 25%;
                }
                .boo-bubble {
                    position: absolute;
                    bottom: 95%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    color: black;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    opacity: inherit; /* Inherit opacity from parent ghost */
                }
                .boo-bubble::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: white transparent transparent transparent;
                }
            `}</style>
        </div>
    );
};

export default BackgroundParticleEffects;
