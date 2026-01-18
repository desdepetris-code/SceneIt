import React from 'react';

interface BrandedImageProps {
    title: string;
    status?: string | null;
    children: React.ReactNode;
}

const BrandedImage: React.FC<BrandedImageProps> = ({ title, status, children }) => {
    if (!status) {
        return <>{children}</>;
    }

    const textToShow = status ? status.replace('Status: ', '').replace('Ongoing: ', '') : '';
    let colorClass = 'text-white';
    let bgColor = 'bg-black/70';

    if (status) {
        if (status.includes('Ended')) {
            bgColor = 'bg-black/90';
            colorClass = 'text-gray-300';
        } else if (status.includes('Canceled')) {
            bgColor = 'bg-blue-900/90';
            colorClass = 'text-blue-200';
        } else if (status.includes('in season')) {
            bgColor = 'bg-red-900/90';
            colorClass = 'text-red-100';
        } else if (status.includes('off season') || status.includes('Undetermined') || status.includes('Hiatus')) {
            bgColor = 'bg-purple-900/90';
            colorClass = 'text-purple-200';
        } else if (status.includes('Upcoming')) {
            bgColor = 'bg-teal-900/90';
            colorClass = 'text-teal-100';
        } else if (status.includes('All Caught Up')) {
            bgColor = 'bg-emerald-900/90';
            colorClass = 'text-emerald-100';
        }
    }
    
    return (
        <div className="relative h-full w-full">
            {children}
            <div className={`absolute bottom-0 left-0 right-0 h-5 ${bgColor} flex items-center justify-center backdrop-blur-md pointer-events-none z-10 border-t border-white/5`}>
                <span 
                    className={`${colorClass} font-black text-[9px] uppercase tracking-[0.2em] px-2 truncate leading-none text-center`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                    {textToShow}
                </span>
            </div>
        </div>
    );
};

export default BrandedImage;