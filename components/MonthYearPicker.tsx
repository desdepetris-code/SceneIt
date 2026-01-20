import React, { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, ChevronDownIcon } from './Icons';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  mode: 'full' | 'month-year';
}

const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({ isOpen, onClose, currentDate, onDateChange, mode }) => {
  // CRITICAL: All hooks must be at the top level, before any conditional early returns.
  
  // Ensure we start with a valid date
  const initialDate = useMemo(() => (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date(), [currentDate]);
  
  const [viewDate, setViewDate] = useState(new Date(initialDate));
  const [view, setView] = useState<'days' | 'months' | 'years'>(mode === 'full' ? 'days' : 'months');
  
  useEffect(() => {
    if (isOpen) {
        const resetDate = (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date();
        setViewDate(new Date(resetDate));
        setView(mode === 'full' ? 'days' : 'months');
    }
  }, [isOpen, currentDate, mode]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const daysInMonth = useMemo(() => {
    try {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const days = [];
        
        const firstDayIndex = firstDayOfMonth.getDay();
        for (let i = 0; i < firstDayIndex; i++) {
          days.push(null);
        }
        
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
          days.push(i);
        }
        
        return days;
    } catch (e) {
        return [];
    }
  }, [viewDate]);

  const years = useMemo(() => {
      const currentYear = new Date().getFullYear();
      // Range from 1900 to 5 years in the future
      return Array.from({ length: currentYear + 6 - 1900 }, (_, i) => currentYear + 5 - i);
  }, []);

  // Now we can safely return null if not open
  if (!isOpen) return null;

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    if (mode === 'month-year') {
        onDateChange(newDate);
        onClose();
    } else {
        setView('days');
    }
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setView('months');
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onDateChange(newDate);
    onClose();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
    onClose();
  };

  const renderDaysView = () => (
    <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex flex-col">
                <button 
                    onClick={() => setView('years')} 
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent hover:opacity-80 transition-opacity text-left"
                >
                    {viewDate.getFullYear()}
                </button>
                <button 
                    onClick={() => setView('months')} 
                    className="text-xl font-black text-text-primary hover:text-primary-accent transition-colors flex items-center gap-2 group"
                >
                    {months[viewDate.getMonth()]}
                    <ChevronDownIcon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-all" />
                </button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-bg-secondary rounded-xl transition-all border border-white/5 text-text-secondary hover:text-text-primary"><ChevronLeftIcon className="w-5 h-5" /></button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-bg-secondary rounded-xl transition-all border border-white/5 text-text-secondary hover:text-text-primary"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(d => <div key={d} className="text-center text-[10px] font-black text-text-secondary opacity-30 uppercase tracking-widest">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                const isSelected = initialDate.getDate() === day && 
                                  initialDate.getMonth() === viewDate.getMonth() && 
                                  initialDate.getFullYear() === viewDate.getFullYear();
                const todayRef = new Date();
                const isToday = todayRef.getDate() === day && 
                               todayRef.getMonth() === viewDate.getMonth() && 
                               todayRef.getFullYear() === viewDate.getFullYear();
                return (
                    <button
                        key={day}
                        onClick={() => handleDaySelect(day)}
                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all relative ${isSelected ? 'bg-accent-gradient text-on-accent shadow-lg scale-110 z-10' : 'hover:bg-bg-secondary text-text-primary active:scale-95'}`}
                    >
                        {day}
                        {isToday && !isSelected && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-accent rounded-full" />}
                    </button>
                );
            })}
        </div>
    </div>
  );

  const renderMonthsView = () => (
    <div className="animate-fade-in">
        <div className="text-center mb-6">
            <button 
                onClick={() => setView('years')} 
                className="text-lg font-black text-text-primary hover:text-primary-accent transition-colors flex items-center justify-center gap-2 mx-auto group"
            >
                {viewDate.getFullYear()}
                <ChevronDownIcon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-all" />
            </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
            {months.map((month, index) => {
                const isSelected = mode === 'month-year' && initialDate.getMonth() === index && initialDate.getFullYear() === viewDate.getFullYear();
                return (
                    <button 
                        key={month}
                        onClick={() => handleMonthSelect(index)}
                        className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border ${isSelected ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg scale-105' : 'bg-bg-secondary/40 border-white/5 text-text-primary hover:bg-bg-secondary hover:border-white/10 active:scale-95'}`}
                    >
                        {month.substring(0, 3)}
                    </button>
                );
            })}
        </div>
    </div>
  );

  const renderYearsView = () => (
    <div className="animate-fade-in">
        <div className="text-center mb-4 font-black uppercase text-[10px] tracking-[0.3em] text-text-secondary opacity-40">Select Year</div>
        <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {years.map(year => {
                const isSelected = viewDate.getFullYear() === year;
                return (
                    <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className={`py-3 text-xs font-black rounded-xl transition-all border ${isSelected ? 'bg-accent-gradient text-on-accent border-transparent shadow-md scale-105' : 'bg-bg-secondary/40 border-white/5 text-text-primary hover:bg-bg-secondary active:scale-95'}`}
                    >
                        {year}
                    </button>
                );
            })}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-bg-primary rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-[340px] p-8 border border-white/10 flex flex-col relative" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter leading-none">
                        {mode === 'full' ? 'Jump to Date' : 'Jump to Month'}
                    </h3>
                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-50">Select your cinematic timeline</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </header>

            <div className="min-h-[320px] flex flex-col justify-center">
                {view === 'days' && renderDaysView()}
                {view === 'months' && renderMonthsView()}
                {view === 'years' && renderYearsView()}
            </div>

            <footer className="mt-8 flex flex-col gap-2">
                <button 
                    onClick={handleToday}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary-accent/10 border border-primary-accent/20 text-primary-accent font-black uppercase tracking-widest text-[10px] hover:bg-primary-accent/20 transition-all shadow-sm active:scale-95"
                >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    Reset to Today
                </button>
                {view !== (mode === 'full' ? 'days' : 'months') && (
                    <button 
                        onClick={() => setView(mode === 'full' ? 'days' : 'months')}
                        className="text-[9px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-text-primary transition-colors text-center py-2"
                    >
                        Back to Selection
                    </button>
                )}
            </footer>
        </div>
    </div>
  );
};

export default CalendarPickerModal;