import React, { useState, useEffect } from 'react';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcs: (string | null | undefined)[];
  placeholder: string;
  noPlaceholder?: boolean;
  // Metadata to help resolve global placeholders from UserData
  type?: 'poster' | 'backdrop' | 'still';
  globalPlaceholders?: { poster?: string; backdrop?: string; still?: string };
}

const FallbackImage: React.FC<FallbackImageProps> = ({ srcs, placeholder, noPlaceholder, type, globalPlaceholders, ...props }) => {
  const customPlaceholder = type && globalPlaceholders ? globalPlaceholders[type] : null;
  const finalPlaceholder = customPlaceholder || placeholder;

  const validSrcs = React.useMemo(() => srcs.filter((s): s is string => !!s), [srcs]);
  
  const [imageToRender, setImageToRender] = useState<string>(validSrcs[0] || (noPlaceholder ? 'fail' : finalPlaceholder));

  useEffect(() => {
    setImageToRender(validSrcs[0] || (noPlaceholder ? 'fail' : finalPlaceholder));
  }, [validSrcs, finalPlaceholder, noPlaceholder]);

  const handleError = () => {
    const currentIndex = validSrcs.indexOf(imageToRender);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < validSrcs.length) {
      setImageToRender(validSrcs[nextIndex]);
    } else {
      // No more valid srcs
      if (noPlaceholder) {
        setImageToRender('fail');
      } else {
        // Prevent loop if placeholder fails
        if (imageToRender !== finalPlaceholder) {
          setImageToRender(finalPlaceholder);
        } else {
          setImageToRender('fail');
        }
      }
    }
  };
  
  if (imageToRender === 'fail') {
    return <div className={props.className} style={{ backgroundColor: 'var(--color-bg-secondary)' }} />;
  }

  return <img src={imageToRender} onError={handleError} {...props} />;
};

export default FallbackImage;