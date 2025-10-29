import React, { useState, useEffect, useMemo, useRef } from 'react';
import { allTimezones, timezoneData, TimezoneRegion } from '../data/timezones';
import { ChevronDownIcon, CheckCircleIcon } from './Icons';

interface TimezoneSettingsProps {
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const SearchableSelect: React.FC<{
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ label, options, value, onChange, disabled }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter(opt => opt.name.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  const selectedOptionName = useMemo(() => {
    return options.find(opt => opt.id === value)?.name || '';
  }, [options, value]);
  
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? query : selectedOptionName}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        disabled={disabled}
        placeholder={`Search for a ${label.toLowerCase()}...`}
        className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent disabled:opacity-50"
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-bg-secondary rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                className="w-full text-left p-2 hover:bg-bg-secondary text-text-primary"
                onClick={() => {
                  onChange(opt.id);
                  setQuery('');
                  setIsOpen(false);
                  inputRef.current?.blur();
                }}
              >
                {opt.name}
              </button>
            ))
          ) : (
            <div className="p-2 text-text-secondary">No results</div>
          )}
        </div>
      )}
    </div>
  );
};


const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ timezone, setTimezone }) => {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
        try {
            setCurrentTime(new Intl.DateTimeFormat('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: timezone, hour12: true
            }).format(new Date()));
        } catch(e) {
            setCurrentTime('Invalid Timezone');
        }
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const handleTimezoneChange = (newTimezone: string) => {
    if (newTimezone && newTimezone !== timezone) {
      setTimezone(newTimezone);
      setConfirmation(`Timezone updated to ${newTimezone.replace(/_/g, ' ')}`);
      setTimeout(() => setConfirmation(''), 3000);
    }
  };

  const handleDetectDeviceTimezone = () => {
    try {
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      handleTimezoneChange(deviceTimezone);
    } catch (e) {
      console.error("Could not detect device timezone", e);
    }
  };

  const statesForCountry = useMemo(() => {
    const country = timezoneData.find(c => c.name === selectedCountry);
    return country ? country.states.map(s => ({ id: s.name, name: s.name })) : [];
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && statesForCountry.length > 0) {
      const stateData = timezoneData.find(c => c.name === selectedCountry)?.states.find(s => s.name === selectedState);
      if (stateData) {
        handleTimezoneChange(stateData.timezone);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedCountry]);

  const countryOptions = useMemo(() => timezoneData.map(c => ({ id: c.name, name: c.name })), []);
  
  return (
    <div className="p-4">
      <h3 className="font-semibold text-text-primary">Time Zone</h3>
      <p className="text-sm text-text-secondary mb-4">Set your local time zone for accurate date display.</p>

      <div className="text-center bg-bg-secondary p-3 rounded-lg mb-4">
        <p className="text-lg font-bold text-text-primary">{currentTime}</p>
        <p className="text-xs text-text-secondary">{timezone.replace(/_/g, ' ')}</p>
      </div>
      
      {confirmation && (
        <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-500/20 p-2 rounded-md mb-4">
            <CheckCircleIcon className="w-5 h-5"/>
            <span>{confirmation}</span>
        </div>
      )}

      <div className="flex p-1 bg-bg-secondary rounded-full mb-4">
        <button onClick={() => setMode('auto')} className={`w-full py-1 text-xs font-semibold rounded-full transition-all ${mode === 'auto' ? 'bg-primary-accent/80 text-on-accent' : 'text-text-secondary'}`}>Auto by Region</button>
        <button onClick={() => setMode('manual')} className={`w-full py-1 text-xs font-semibold rounded-full transition-all ${mode === 'manual' ? 'bg-primary-accent/80 text-on-accent' : 'text-text-secondary'}`}>Manual</button>
      </div>

      {mode === 'auto' ? (
        <div className="space-y-3">
          <SearchableSelect label="Country" options={countryOptions} value={selectedCountry} onChange={setSelectedCountry} />
          <SearchableSelect label="State / Province" options={statesForCountry} value={selectedState} onChange={setSelectedState} disabled={!selectedCountry || statesForCountry.length === 0} />
        </div>
      ) : (
        <SearchableSelect label="Timezone" options={allTimezones} value={timezone} onChange={handleTimezoneChange} />
      )}

      <button onClick={handleDetectDeviceTimezone} className="w-full text-center py-2 mt-4 text-sm font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125">
        Use Device Timezone
      </button>
    </div>
  );
};

export default TimezoneSettings;