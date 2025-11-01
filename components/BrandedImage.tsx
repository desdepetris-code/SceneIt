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
    let bgColor = 'bg-black/60';

    if (status) {
        if (status.includes('Ended')) {
            bgColor = 'bg-black/90';
            colorClass = 'text-gray-300';
        } else if (status.includes('Canceled')) {
            bgColor = 'bg-blue-800/90';
            colorClass = 'text-blue-200';
        } else if (status.includes('in season')) {
            bgColor = 'bg-red-700/90';
            colorClass = 'text-red-100';
        } else if (status.includes('off season') || status.includes('Undetermined')) {
            bgColor = 'bg-purple-800/90';
            colorClass = 'text-purple-200';
        } else if (status.includes('Upcoming')) {
            bgColor = 'bg-teal-700/90';
            colorClass = 'text-teal-100';
        }
    }
    
    return (
        <>
            {children}
            <div className={`absolute top-0 left-0 bottom-0 w-6 ${bgColor} flex items-center justify-center backdrop-blur-sm pointer-events-none`}>
                <span 
                    className={`${colorClass} font-bold text-[10px] uppercase tracking-wider [writing-mode:vertical-rl] [text-orientation:mixed] transform rotate-180 whitespace-nowrap overflow-hidden text-ellipsis px-1`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                    {textToShow}
                </span>
            </div>
        </>
    );
};

export default BrandedImage;