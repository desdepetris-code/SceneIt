import React, { useState, useEffect } from 'react';
import { Theme } from '../types';

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: Theme) => void;
}

const defaultColors = {
  dark: {
    accentPrimary: '#6366f1',
    accentSecondary: '#818cf8',
    bgPrimary: '#1e293b',
    bgSecondary: '#334155',
    textColorPrimary: '#f8fafc',
    textColorSecondary: '#94a3b8',
  },
  light: {
    accentPrimary: '#4f46e5',
    accentSecondary: '#6366f1',
    bgPrimary: '#f8fafc',
    bgSecondary: '#e2e8f0',
    textColorPrimary: '#0f172a',
    textColorSecondary: '#475569',
  }
};

const ColorPicker: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <div className="flex items-center space-x-2 p-2 bg-bg-secondary rounded-md">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 border-none cursor-pointer bg-transparent" />
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-text-primary focus:outline-none" />
        </div>
    </div>
);

const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [base, setBase] = useState<'light' | 'dark'>('dark');
  const [colors, setColors] = useState(defaultColors.dark);

  useEffect(() => {
    setColors(defaultColors[base]);
  }, [base]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a name for your theme.');
      return;
    }
    const newTheme: Theme = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      base,
      colors: {
        ...colors,
        bgGradient: `linear-gradient(to bottom right, ${colors.bgPrimary}, ${colors.bgSecondary})`,
        accentGradient: `linear-gradient(to right, ${colors.accentPrimary}, ${colors.accentSecondary})`,
        cardGradient: base === 'dark' 
            ? `linear-gradient(to bottom, ${hexToRgba(colors.bgSecondary, 0.5)}, ${hexToRgba(colors.bgPrimary, 0.7)})`
            : `linear-gradient(to bottom, #ffffff, ${colors.bgSecondary})`,
        bgBackdrop: base === 'dark' ? hexToRgba(colors.bgPrimary, 0.3) : hexToRgba(colors.bgPrimary, 0.2),
      }
    };
    onSave(newTheme);
    onClose();
  };
  
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleColorChange = (key: keyof typeof colors, value: string) => {
      setColors(prev => ({...prev, [key]: value}));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-2xl p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Create Custom Theme</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Controls */}
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Theme Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Base Theme</label>
                    <div className="flex p-1 bg-bg-secondary rounded-full">
                        <button onClick={() => setBase('dark')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${base === 'dark' ? 'bg-accent-gradient text-on-accent font-semibold shadow-lg' : 'text-text-secondary'}`}>Dark</button>
                        <button onClick={() => setBase('light')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${base === 'light' ? 'bg-accent-gradient text-on-accent font-semibold shadow-lg' : 'text-text-secondary'}`}>Light</button>
                    </div>
                </div>
                <ColorPicker label="Accent Primary" value={colors.accentPrimary} onChange={v => handleColorChange('accentPrimary', v)} />
                <ColorPicker label="Accent Secondary" value={colors.accentSecondary} onChange={v => handleColorChange('accentSecondary', v)} />
                <ColorPicker label="Background Primary" value={colors.bgPrimary} onChange={v => handleColorChange('bgPrimary', v)} />
                <ColorPicker label="Background Secondary" value={colors.bgSecondary} onChange={v => handleColorChange('bgSecondary', v)} />
                <ColorPicker label="Text Primary" value={colors.textColorPrimary} onChange={v => handleColorChange('textColorPrimary', v)} />
            </div>
            {/* Right side: Preview */}
            <div className="space-y-4">
                 <label className="block text-sm font-medium text-text-secondary mb-2">Live Preview</label>
                 <div style={{ background: `linear-gradient(to bottom right, ${colors.bgPrimary}, ${colors.bgSecondary})`}} className="p-4 rounded-lg h-full">
                    <div style={{ background: base === 'dark' ? hexToRgba(colors.bgSecondary, 0.5) : '#fff', color: colors.textColorPrimary }} className="p-3 rounded-md shadow-md">
                        <h3 style={{ background: `linear-gradient(to right, ${colors.accentPrimary}, ${colors.accentSecondary})` }} className="text-lg font-bold bg-clip-text text-transparent mb-2">{name || "Theme Name"}</h3>
                        <p style={{ color: colors.textColorSecondary }} className="text-sm">This is a preview of your theme's text and background colors.</p>
                        <button style={{ background: `linear-gradient(to right, ${colors.accentPrimary}, ${colors.accentSecondary})`, color: base === 'dark' ? '#fff' : '#fff' }} className="mt-4 px-4 py-2 rounded-md text-sm font-semibold">
                            Example Button
                        </button>
                    </div>
                 </div>
            </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity"
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomThemeModal;