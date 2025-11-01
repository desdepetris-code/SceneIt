import React, { useState } from 'react';

interface MonthYearPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ isOpen, onClose, currentDate, onDateChange }) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [view, setView] = useState<'months' | 'years'>('months');
  
  if (!isOpen) return null;

  const allYears = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() + 10 - i); // Approx. -90 to +10 years from now
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleMonthSelect = (monthIndex: number) => {
    onDateChange(new Date(selectedYear, monthIndex, 1));
    onClose();
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setView('months');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-xs p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
                <button 
                    onClick={() => setView(view === 'months' ? 'years' : 'months')}
                    className="bg-bg-secondary text-text-primary rounded-md p-2 font-bold focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
                    {view === 'months' ? selectedYear : 'Select Year'}
                </button>
            </div>

            {view === 'months' ? (
                <div className="grid grid-cols-4 gap-2">
                    {months.map((month, index) => (
                        <button 
                            key={month}
                            onClick={() => handleMonthSelect(index)}
                            className={`p-3 text-sm rounded-md font-semibold transition-colors ${currentDate.getFullYear() === selectedYear && currentDate.getMonth() === index ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`}
                        >
                            {month}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {allYears.map(year => (
                        <button
                            key={year}
                            onClick={() => handleYearSelect(year)}
                            className={`p-2 text-sm rounded-md font-semibold transition-colors ${selectedYear === year ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default MonthYearPicker;