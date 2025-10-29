import React, { useState, useEffect, useRef } from 'react';
import { confirmationService } from '../services/confirmationService';
import { CheckCircleIcon } from './Icons';

interface Confirmation {
    id: number;
    message: string;
}

const ConfirmationBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300); // Animation duration
        }, 3000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            className={`flex items-center space-x-3 bg-card-gradient rounded-lg shadow-xl p-3 px-4 transition-all duration-300 ease-in-out w-full max-w-md ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
            }`}
        >
            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-text-primary">{message}</p>
        </div>
    );
};

const ConfirmationContainer: React.FC = () => {
    const [activeConfirmations, setActiveConfirmations] = useState<Confirmation[]>([]);
    const queueRef = useRef<string[]>([]);
    const isProcessingRef = useRef<boolean>(false);
    const maxBanners = 3;

    useEffect(() => {
        const processQueue = () => {
            if (isProcessingRef.current || queueRef.current.length === 0 || activeConfirmations.length >= maxBanners) {
                return;
            }
            isProcessingRef.current = true;
            
            const message = queueRef.current.shift();
            if (message) {
                setActiveConfirmations(prev => [...prev, { id: Date.now() + Math.random(), message }]);
            }

            setTimeout(() => {
                isProcessingRef.current = false;
                processQueue();
            }, 500); // 0.5s stagger
        };

        const unsubscribe = confirmationService.subscribe((message: string) => {
            queueRef.current.push(message);
            processQueue();
        });

        const interval = setInterval(processQueue, 100);

        return () => {
            unsubscribe();
            clearInterval(interval);
        }
    }, [activeConfirmations.length]);

    const dismissConfirmation = (id: number) => {
        setActiveConfirmations(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-2 w-full max-w-lg px-4 pointer-events-none">
            {activeConfirmations.map((conf) => (
                <ConfirmationBanner
                    key={conf.id}
                    message={conf.message}
                    onDismiss={() => dismissConfirmation(conf.id)}
                />
            ))}
        </div>
    );
};

export default ConfirmationContainer;
