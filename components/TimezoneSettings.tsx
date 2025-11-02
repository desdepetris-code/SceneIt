// FIX: Import 'useCallback' from React to fix 'Cannot find name' error.
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { allTimezones, timezoneData } from '../data/timezones';
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
      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [timezonesForCountry, setTimezonesForCountry] = useState<{ id: string; name: string }[]>([]);
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

  const handleTimezoneChange = useCallback((newTimezone: string) => {
    if (newTimezone && newTimezone !== timezone) {
      setTimezone(newTimezone);
      setConfirmation(`Timezone updated to ${newTimezone.replace(/_/g, ' ')}`);
      setTimeout(() => setConfirmation(''), 3000);
    }
  }, [timezone, setTimezone]);

  const handleDetectDeviceTimezone = () => {
    try {
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      handleTimezoneChange(deviceTimezone);
      // Switch to manual to show the detected timezone
      setMode('manual');
    } catch (e) {
      console.error("Could not detect device timezone", e);
    }
  };

  const countryOptions = useMemo(() => 
    timezoneData
      .filter(c => c.states.length > 0)
      .map(c => ({ id: c.name, name: c.name }))
  , []);
  
  const allTimezonesMap = useMemo(() => new Map(allTimezones.map(tz => [tz.id, tz.name])), []);

  useEffect(() => {
    if (!selectedCountry) {
        setTimezonesForCountry([]);
        return;
    }
    const countryData = timezoneData.find(c => c.name === selectedCountry);
    if (countryData && countryData.states.length > 0) {
        const uniqueIds = Array.from(new Set(countryData.states.map(s => s.timezone)));
        const options = uniqueIds.map(id => ({ id, name: allTimezonesMap.get(id) || id })).sort((a,b) => a.name.localeCompare(b.name));
        setTimezonesForCountry(options);
        
        if (options.length === 1) {
            handleTimezoneChange(options[0].id);
        }
    }
  }, [selectedCountry, allTimezonesMap, handleTimezoneChange]);
  
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

      <div className="flex p-1 bg-bg-primary rounded-full mb-4 self-start border border-bg-secondary">
          <button
              onClick={() => setMode('auto')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${
              mode === 'auto' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'
              }`}
          >
              By Region
          </button>
          <button
              onClick={() => setMode('manual')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${
              mode === 'manual' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'
              }`}
          >
              Manual Search
          </button>
      </div>

      <div className="space-y-3">
        {mode === 'auto' ? (
          <div className="space-y-3">
            <SearchableSelect
                label="Country"
                options={countryOptions}
                value={selectedCountry || ''}
                onChange={(val) => setSelectedCountry(val)}
            />
            {timezonesForCountry.length > 1 && (
              <SearchableSelect
                  label="Timezone"
                  options={timezonesForCountry}
                  value={timezone}
                  onChange={handleTimezoneChange}
                  disabled={!selectedCountry}
              />
            )}
          </div>
        ) : (
            <SearchableSelect
                label="Timezone"
                options={allTimezones}
                value={timezone}
                onChange={handleTimezoneChange}
            />
        )}
        <button
          onClick={handleDetectDeviceTimezone}
          className="w-full text-center p-2 text-sm rounded-md font-semibold transition-colors bg-accent-gradient text-on-accent hover:opacity-90"
        >
          Detect Device Timezone
        </button>
      </div>
    </div>
  );
};

export default TimezoneSettings;
