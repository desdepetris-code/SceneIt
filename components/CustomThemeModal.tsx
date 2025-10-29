import React, { useState, useRef } from 'react';
import { Theme } from '../types';
import { XMarkIcon, ChevronDownIcon } from './Icons';

// --- Helper Functions ---
const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
    if (!hex) return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const manipulateColor = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000'; // fallback for invalid hex
    let { r, g, b } = rgb;

    const amount = Math.floor(2.55 * percent);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgba = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0,0,0,${alpha})`; // fallback
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0; // Treat invalid colors as dark
    const { r, g, b } = rgb;

    const sRGB = [r, g, b].map(val => {
        val /= 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}


interface Pattern {
    name: string;
    css: (c1: string, c2: string) => string;
    bgSize?: string;
    bgColor?: 'c1' | 'c2' | string;
    bgPosition?: string;
    defaultColors?: {
      p1: string;
      p2: string;
      overlay: string;
      acc: string;
      text: string;
    };
}

const patterns: Pattern[] = [
    { 
        name: 'Cheetah Print', 
        css: (c1, c2) => `radial-gradient(circle at 50% 50%,transparent 23%,${c1} 24%,${c1} 32%,transparent 33%),radial-gradient(circle at 50% 50%,transparent 23%,${c1} 24%,${c1} 32%,transparent 33%),radial-gradient(circle at 50% 50%,transparent 10%,${c2} 11%,${c2} 22%,transparent 23%),radial-gradient(circle at 50% 50%,transparent 10%,${c2} 11%,${c2} 22%,transparent 23%),radial-gradient(circle at 50% 50%,transparent 29%,${c1} 30%,${c1} 34%,transparent 35%),radial-gradient(circle at 50% 50%,transparent 29%,${c1} 30%,${c1} 34%,transparent 35%),radial-gradient(circle at 50% 50%,transparent 14%,${c2} 15%,${c2} 24%,transparent 25%),radial-gradient(circle at 50% 50%,transparent 14%,${c2} 15%,${c2} 24%,transparent 25%),radial-gradient(circle at 50% 50%,transparent 23%,${c1} 24%,${c1} 32%,transparent 33%),radial-gradient(circle at 50% 50%,transparent 10%,${c2} 11%,${c2} 22%,transparent 23%),radial-gradient(circle at 50% 50%,transparent 29%,${c1} 30%,${c1} 34%,transparent 35%),radial-gradient(circle at 50% 50%,transparent 14%,${c2} 15%,${c2} 24%,transparent 25%)`,
        bgSize: '160px 160px,160px 160px,160px 160px,160px 160px,160px 160px,160px 160px,160px 160px,160px 160px,80px 80px,80px 80px,80px 80px,80px 80px',
        bgPosition: '10px 130px,90px 10px,10px 130px,90px 10px,100px 130px,20px 10px,100px 130px,20px 10px,40px 120px,120px 40px,0 80px,80px 0',
        bgColor: '#F3DFD1',
        defaultColors: { p1: '#4d2600', p2: '#000000', overlay: '#f3dfd1', acc: '#b36b2c', text: '#000000' }
    },
    { name: 'Stripes', css: (c1, c2) => `repeating-linear-gradient(45deg, ${c1}, ${c1} 10px, ${c2} 10px, ${c2} 20px)` },
    { name: 'Checkered', css: (c1, c2) => `linear-gradient(45deg, ${c1} 25%, transparent 25%), linear-gradient(-45deg, ${c1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c1} 75%), linear-gradient(-45deg, transparent 75%, ${c1} 75%)`, bgSize: '20px 20px', bgColor: 'c2', defaultColors: { p1: '#ffffff', p2: '#000000', overlay: '#000000', acc: '#ef4444', text: '#ffffff' } },
    { name: 'Houndstooth', css: (c1, c2) => `linear-gradient(45deg, ${c2} 25%, transparent 25%, transparent 75%, ${c2} 75%), linear-gradient(45deg, ${c2} 25%, transparent 25%, transparent 75%, ${c2} 75%)`, bgSize: '20px 20px', bgColor: 'c1', bgPosition: '0 0, 10px 10px', defaultColors: { p1: '#000000', p2: '#ffffff', overlay: '#ffffff', acc: '#3b82f6', text: '#000000' } },
    { name: 'Waves', css: (c1, c2) => `radial-gradient(circle at 100% 50%, transparent 20%, ${c1} 21%, ${c1} 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, ${c1} 21%, ${c1} 34%, transparent 35%, transparent) 0 -25px`, bgSize: '50px 50px', bgColor: 'c2' },
    { name: 'Zig-Zag', css: (c1, c2) => `repeating-linear-gradient(135deg, ${c1}, ${c1} 10px, transparent 10px, transparent 20px), repeating-linear-gradient(45deg, ${c1}, ${c1} 10px, transparent 10px, transparent 20px)`, bgColor: 'c2' },
    { name: 'Crosshatch', css: (c1, c2) => `repeating-linear-gradient(45deg, ${c1}, ${c1} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, ${c1}, ${c1} 1px, transparent 1px, transparent 10px)`, bgColor: 'c2' },
    { name: 'Scales', css: (c1, c2) => `radial-gradient(circle at 50% 0, ${c2} 12%, transparent 13%), radial-gradient(circle at 50% 100%, ${c2} 12%, transparent 13%) 0 25px`, bgSize: '50px 50px', bgColor: 'c1' },
    { name: 'Honeycomb', css: (c1, c2) => `linear-gradient(300deg, ${c1} 11px, transparent 11px), linear-gradient(60deg, ${c1} 11px, transparent 11px), linear-gradient(180deg, ${c1} 11px, transparent 11px)`, bgSize: '24px 42px', bgColor: 'c2' },
    { name: 'Carbon', css: (c1, c2) => `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%), linear-gradient(-45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%)`, bgSize: '12px 12px', bgColor: 'c2' },
    { name: 'Argyle', css: (c1, c2) => `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%), linear-gradient(-45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%)`, bgSize: '30px 30px', bgColor: 'c2' },
    { name: 'Bricks', css: (c1, c2) => `linear-gradient(${c1} 1px, transparent 1px), linear-gradient(to right, ${c1} 1px, transparent 1px)`, bgSize: '40px 20px', bgColor: 'c2' },
    { name: 'Weave', css: (c1, c2) => `linear-gradient(45deg, ${c1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c1} 75%), linear-gradient(-45deg, ${c1} 25%, transparent 25%), linear-gradient(-45deg, transparent 75%, ${c1} 75%)`, bgSize: '16px 16px', bgColor: 'c2' },
    { name: 'Diagonal Stripes', css: (c1, c2) => `repeating-linear-gradient(45deg, ${c1}, ${c1} 2px, ${c2} 2px, ${c2} 4px)` },
    { name: 'Grid Lines', css: (c1, c2) => `linear-gradient(${c1} 1px, transparent 1px), linear-gradient(to right, ${c1} 1px, ${c2} 1px)`, bgSize: '20px 20px' },
    { name: 'Triangles', css: (c1, c2) => `linear-gradient(45deg, ${c1} 50%, ${c2} 50%)`, bgSize: '20px 20px' },
    { name: 'Paper', css: (c1, c2) => `linear-gradient(${c2}, ${c2}), linear-gradient(0deg, ${c1} 1px, transparent 1px)`, bgSize: '100% 20px' },
    { name: 'Contours', css: (c1, c2) => `radial-gradient(circle at 100% 100%, ${c2} 0, ${c2} 10px, transparent 10px), radial-gradient(circle at 0 0, ${c2} 0, ${c2} 10px, transparent 10px)`, bgSize: '20px 20px', bgColor: 'c1' },
];


// --- Sub-Components ---

const ColorPicker: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => {
    const colorInputRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
            <div 
                className="flex items-center space-x-2 p-2 bg-bg-secondary rounded-md cursor-pointer"
                onClick={() => colorInputRef.current?.click()}
            >
                <input 
                    ref={colorInputRef}
                    type="color" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-8 h-8 border-none cursor-pointer bg-transparent p-0" 
                    style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', 'appearance': 'none'}}
                    onClick={e => e.stopPropagation()} // Prevent double-triggering
                />
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-full bg-transparent text-text-primary focus:outline-none"
                    onFocus={e => e.target.select()} // Select all text on focus
                />
            </div>
        </div>
    );
};


const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all flex-1 ${isActive ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>
        {label}
    </button>
);

const PatternSelector: React.FC<{
    selected: Pattern;
    onSelect: (pattern: Pattern) => void;
}> = ({ selected, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const getPreviewStyle = (pattern: Pattern): React.CSSProperties => {
        let c1 = '#cccccc';
        let c2 = '#f0f0f0';
        if (pattern.name === 'Cheetah Print' || pattern.name === 'Stripes' || pattern.name === 'Checkered') {
            c1 = '#000000';
            c2 = '#FFFFFF';
        }
        const patternBgColor = pattern.bgColor === 'c1' ? c1 : pattern.bgColor === 'c2' ? c2 : pattern.bgColor;
        return {
            backgroundImage: pattern.css(c1, c2),
            backgroundSize: pattern.bgSize,
            backgroundColor: patternBgColor || 'transparent',
            backgroundPosition: pattern.bgPosition,
        };
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-1">Pattern</label>
            <button
                type="button"
                className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            >
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-6 rounded" style={getPreviewStyle(selected)}></div>
                    <span>{selected.name}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-bg-secondary rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {patterns.map(p => (
                        <button
                            key={p.name}
                            type="button"
                            className="w-full text-left p-2 hover:bg-bg-secondary flex items-center space-x-3"
                            onClick={() => { onSelect(p); setIsOpen(false); }}
                        >
                            <div className="w-8 h-6 rounded flex-shrink-0" style={getPreviewStyle(p)}></div>
                            <span className="text-text-primary">{p.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: Theme) => void;
}

const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ isOpen, onClose, onSave }) => {
    type Tab = 'gradient' | 'solid' | 'pattern';
    const [name, setName] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('gradient');
    
    const [colors, setColors] = useState({
        gradient: { bg1: '#1e293b', bg2: '#0f172a', acc1: '#818cf8', acc2: '#4f46e5', text: '#f8fafc' },
        solid: { bg: '#1e293b', acc: '#6366f1', text: '#f8fafc' },
        pattern: { p1: '#334155', p2: '#1e293b', overlay: '#1e293b', acc: '#818cf8', text: '#f1f5f9', pattern: patterns[0] }
    });

    if (!isOpen) return null;

    const handleColorChange = (key: string, value: string) => {
        setColors(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], [key]: value } }));
    };
    
    const handlePatternChange = (pattern: Pattern) => {
        const defaults = pattern.defaultColors || {};
        setColors(prev => ({
            ...prev,
            pattern: {
                ...prev.pattern,
                ...defaults,
                pattern,
            }
        }));
        setName(pattern.name);
    };

    const handleSave = () => {
        if (!name.trim()) return alert('Please enter a name for your theme.');

        const currentColors = colors[activeTab];
        
        let primaryBgColor = '#000000';
        if (activeTab === 'gradient') primaryBgColor = (currentColors as typeof colors.gradient).bg1;
        if (activeTab === 'solid') primaryBgColor = (currentColors as typeof colors.solid).bg;
        if (activeTab === 'pattern') primaryBgColor = (currentColors as typeof colors.pattern).overlay;

        const luminance = getLuminance(primaryBgColor);
        const base: 'light' | 'dark' = luminance > 0.4 ? 'light' : 'dark';

        let finalColors: Theme['colors'];

        if (activeTab === 'gradient') {
            const { bg1, bg2, acc1, acc2, text } = currentColors as typeof colors.gradient;
            finalColors = {
                bgPrimary: bg1, bgSecondary: bg2, accentPrimary: acc1, accentSecondary: acc2, textColorPrimary: text,
                textColorSecondary: hexToRgba(text, 0.7),
                bgGradient: `linear-gradient(to bottom right, ${bg1}, ${bg2})`,
                accentGradient: `linear-gradient(to right, ${acc1}, ${acc2})`,
                cardGradient: `linear-gradient(to bottom, ${hexToRgba(bg2, 0.5)}, ${hexToRgba(bg1, 0.7)})`,
                bgBackdrop: hexToRgba(base === 'dark' ? bg1 : bg2, 0.3),
            };
        } else if (activeTab === 'solid') {
            const { bg, acc, text } = currentColors as typeof colors.solid;
            const bg2 = manipulateColor(bg, base === 'dark' ? 10 : -10);
            finalColors = {
                bgPrimary: bg, bgSecondary: bg2, accentPrimary: acc, accentSecondary: manipulateColor(acc, 20), textColorPrimary: text,
                textColorSecondary: hexToRgba(text, 0.7),
                bgGradient: bg,
                accentGradient: acc,
                cardGradient: `linear-gradient(to bottom, ${hexToRgba(bg2, 0.5)}, ${hexToRgba(bg, 0.7)})`,
                bgBackdrop: hexToRgba(bg, 0.3),
            };
        } else { // Pattern
            const { p1, p2, overlay, acc, text, pattern } = currentColors as typeof colors.pattern;
            const patternCss = pattern.css(p1, p2);
            const overlayRgba = hexToRgba(overlay, 0.85);
            const patternBgColor = pattern.bgColor === 'c1' ? p1 : pattern.bgColor === 'c2' ? p2 : pattern.bgColor;
            finalColors = {
                bgPrimary: overlay, bgSecondary: manipulateColor(overlay, 10), accentPrimary: acc, accentSecondary: manipulateColor(acc, 20), textColorPrimary: text,
                textColorSecondary: hexToRgba(text, 0.7),
                bgGradient: `linear-gradient(${overlayRgba}, ${overlayRgba}), ${patternCss}`,
                accentGradient: acc,
                cardGradient: `linear-gradient(to bottom, ${hexToRgba(manipulateColor(overlay, 10), 0.7)}, ${hexToRgba(overlay, 0.85)})`,
                bgBackdrop: hexToRgba(overlay, 0.5),
                patternBgSize: pattern.bgSize ? `auto, ${pattern.bgSize}` : 'auto',
                patternBgColor: patternBgColor || 'transparent',
                patternBgPosition: pattern.bgPosition ? `0 0, ${pattern.bgPosition}` : '0 0',
            };
        }

        const newTheme: Theme = { id: `custom-${Date.now()}`, name: name.trim(), base, colors: finalColors };
        onSave(newTheme);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-xl p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10"><XMarkIcon className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Create Custom Theme</h2>
                
                <input type="text" placeholder="Theme Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent mb-4"/>
                
                <div className="flex flex-wrap gap-1 p-1 bg-bg-secondary rounded-full mb-6">
                    <TabButton label="Gradient" isActive={activeTab === 'gradient'} onClick={() => setActiveTab('gradient')} />
                    <TabButton label="Solid" isActive={activeTab === 'solid'} onClick={() => setActiveTab('solid')} />
                    <TabButton label="Pattern" isActive={activeTab === 'pattern'} onClick={() => setActiveTab('pattern')} />
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {activeTab === 'gradient' && (<>
                        <ColorPicker label="Background 1" value={colors.gradient.bg1} onChange={v => handleColorChange('bg1', v)} />
                        <ColorPicker label="Background 2" value={colors.gradient.bg2} onChange={v => handleColorChange('bg2', v)} />
                        <ColorPicker label="Accent Color 1" value={colors.gradient.acc1} onChange={v => handleColorChange('acc1', v)} />
                        <ColorPicker label="Accent Color 2" value={colors.gradient.acc2} onChange={v => handleColorChange('acc2', v)} />
                        <ColorPicker label="Font Color" value={colors.gradient.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                    {activeTab === 'solid' && (<>
                        <ColorPicker label="Background" value={colors.solid.bg} onChange={v => handleColorChange('bg', v)} />
                        <ColorPicker label="Accent Color" value={colors.solid.acc} onChange={v => handleColorChange('acc', v)} />
                        <ColorPicker label="Font Color" value={colors.solid.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                    {activeTab === 'pattern' && (<>
                        <PatternSelector selected={colors.pattern.pattern} onSelect={handlePatternChange} />
                        <ColorPicker label="Pattern Color 1" value={colors.pattern.p1} onChange={v => handleColorChange('p1', v)} />
                        <ColorPicker label="Pattern Color 2" value={colors.pattern.p2} onChange={v => handleColorChange('p2', v)} />
                        <ColorPicker label="Overlay" value={colors.pattern.overlay} onChange={v => handleColorChange('overlay', v)} />
                        <ColorPicker label="Accent Color" value={colors.pattern.acc} onChange={v => handleColorChange('acc', v)} />
                        <ColorPicker label="Font Color" value={colors.pattern.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90">Save Theme</button>
                </div>
            </div>
        </div>
    );
};

export default CustomThemeModal;