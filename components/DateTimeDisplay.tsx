import React, { useState, useEffect } from 'react';

interface DateTimeDisplayProps {
  timezone: string;
  timeFormat: '12h' | '24h';
}

const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({ timezone, timeFormat }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
    timeZone: timezone,
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(currentDateTime);
  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(currentDateTime);

  return (
    <div className="my-8 px-6">
        <div className="bg-card-gradient rounded-lg shadow-md p-6 text-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
                {formattedTime}
            </h2>
            <p className="text-lg text-text-secondary mt-1">
                {formattedDate}
            </p>
        </div>
    </div>
  );
};

export default DateTimeDisplay;