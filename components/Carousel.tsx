import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CarouselProps {
  children: React.ReactNode;
}

const Carousel: React.FC<CarouselProps> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      // A small buffer is added to account for sub-pixel rendering issues in some browsers
      const buffer = 2;
      const isScrollable = el.scrollWidth > el.clientWidth + buffer;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - buffer);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability, { passive: true });
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(el);

      // Also observe children for content changes that might affect scroll width
      Array.from(el.children).forEach(child => {
        // FIX: Add a type guard to ensure that the child element passed to ResizeObserver is of type Element.
        if (child instanceof Element) {
          resizeObserver.observe(child);
        }
      });

      return () => {
        el.removeEventListener('scroll', checkScrollability);
        resizeObserver.disconnect();
      };
    }
  }, [checkScrollability, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  // FIX: Cast the child to 'React.ReactElement<any>' to resolve a TypeScript error with 'cloneElement' and the 'ref' prop.
  const child = React.Children.only(children) as React.ReactElement<any>;
  const enhancedChild = React.cloneElement(child, {
      ref: scrollContainerRef
  });

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}
      {enhancedChild}
      {canScrollRight && (
         <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Carousel;
