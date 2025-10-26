import React from 'react';

// Change prop type from SVG to IMG attributes
type IconProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const ImdbIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 32" fill="currentColor" {...props}>
        <path fill="#F5C518" d="M14.68.22L11.52 0l-1.2 5.24-3.14.05.1 3.23L4.1 12.02l2.9 1.54 1.25-5.5-2.2-1.1.28-1.24 3.12-.05 1.15 5.05 2.1-1.04-.6-2.6 3.1-.04L14.68.22zm4.1 6.8l-1.2 5.23 2.9 1.55-3.18 3.5-.18-3.6 1.25-5.5-2.2-1.1.28-1.23 2.13-1.05zm-9.35 11.2l-1.2 5.24 3.14-.05-.1-3.23 3.18-3.5-2.9-1.54-1.25 5.5 2.2 1.1-.28 1.23-3.12.05zm9.35-2.15l-1.2 5.24 3.14-.05-.1-3.23 3.18-3.5-2.9-1.54-1.25 5.5 2.2 1.1-.28 1.23-3.12.05z"/>
        <path fill="#F5C518" d="M0 4.9v22.2A4.9 4.9 0 004.9 32h18.2a4.9 4.9 0 004.9-4.9V4.9A4.9 4.9 0 0023.1 0H4.9A4.9 4.9 0 000 4.9zm24.93 22.3a1.83 1.83 0 01-1.83 1.83H4.9a1.83 1.83 0 01-1.83-1.83V4.9A1.83 1.83 0 014.9 3.07h18.2a1.83 1.83 0 011.83 1.83z"/>
    </svg>
);

export const SimklIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" {...props}>
        <path d="M192.8,0H63.2C28.4,0,0,28.4,0,63.2v129.6C0,227.6,28.4,256,63.2,256h129.6c34.8,0,63.2-28.4,63.2-63.2V63.2 C256,28.4,227.6,0,192.8,0z M112.5,186.9l-43.1-43.1l20.4-20.4l22.7,22.7l62.1-62.1l20.4,20.4L112.5,186.9z"/>
    </svg>
);