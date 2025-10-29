import React from 'react';

interface BrandedImageProps {
    title: string;
    children: React.ReactNode;
}

const BrandedImage: React.FC<BrandedImageProps> = ({ title, children }) => {
    return (
        <>
            {children}
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-black/60 flex items-center justify-center backdrop-blur-sm pointer-events-none">
                <span 
                    className="text-white font-bold text-[10px] uppercase tracking-wider [writing-mode:vertical-rl] [text-orientation:mixed] transform rotate-180 whitespace-nowrap overflow-hidden text-ellipsis px-1"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                    {title}
                </span>
            </div>
        </>
    );
};

export default BrandedImage;
