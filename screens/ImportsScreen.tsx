import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon } from '../components/Icons';
import { TraktIcon, TvdbIcon, TmdbIcon, ImdbIcon, TvTimeIcon, ShowlyIcon } from '../components/ServiceIcons';
import * as traktService from '../services/traktService';
import { TraktHistoryItem, HistoryItem, TrackedItem, TraktTokenResponse } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
    </div>
);

const ServiceCard: React.FC<{ name: string; description: string; icon: React.ReactNode }> = ({ name, description, icon }) => (
    <div className="bg-bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10">{icon}</div>
            <div>
                <h3 className="font-semibold text-text-primary">{name}</h3>
                <p className="text-sm text-text-secondary">{description}</p>
            </div>
        </div>
        <button
            onClick={() => alert(`${name} connection coming soon!`)}
            className="px-4 py-1.5 text-sm rounded-md font-semibold bg-bg-secondary text-text-primary hover:brightness-125 transition-all"
        >
            Connect
        </button>
    </div>
);

const TraktImporter: React.FC<{ onImport: (history: HistoryItem[], completed: TrackedItem[]) => void }> = ({ onImport }) => {
    const [traktToken, setTraktToken] = useLocalStorage<TraktTokenResponse | null>('trakt_token', null);
    const [isExchangingToken, setIsExchangingToken] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code && !traktToken) { // prevent re-exchange on hot reload
            setIsExchangingToken(true);
            setError(null);
            traktService.exchangeCodeForToken(code)
                .then(token => {
                    setTraktToken(token);
                })
                .catch(err => {
                    console.error(err);
                    setError("Failed to connect with Trakt. Please try again.");
                })
                .finally(() => {
                    setIsExchangingToken(false);
                    // Clean the ?code=... from the URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTraktToken]); // Only run when setTraktToken changes (i.e., on mount)

    const handleImport = async () => {
        if (!traktToken) {
            setError('Not connected to Trakt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFeedback(null);
        try {
            const traktHistory = await traktService.getAuthenticatedTraktWatchHistory(traktToken.access_token);
            if (traktHistory.length === 0) {
                setFeedback('No watch history found on your Trakt account.');
                setIsLoading(false);
                return;
            }

            const historyItems: HistoryItem[] = [];
            const completedItems = new Map<number, TrackedItem>();

            for (const item of traktHistory) {
                if (item.type === 'movie' && item.movie) {
                    const tmdbId = item.movie.ids.tmdb;
                    if (tmdbId) {
                        if (!completedItems.has(tmdbId)) {
                            completedItems.set(tmdbId, {
                                id: tmdbId, title: item.movie.title, media_type: 'movie',
                                poster_path: null, genre_ids: [],
                            });
                        }
                        historyItems.push({
                            id: tmdbId, media_type: 'movie', title: item.movie.title,
                            poster_path: null, timestamp: item.watched_at,
                        });
                    }
                } else if (item.type === 'episode' && item.show && item.episode) {
                    const tmdbId = item.show.ids.tmdb;
                     if (tmdbId) {
                        if (!completedItems.has(tmdbId)) {
                           completedItems.set(tmdbId, {
                               id: tmdbId, title: item.show.title, media_type: 'tv',
                               poster_path: null, genre_ids: [],
                           });
                        }
                        historyItems.push({
                            id: tmdbId, media_type: 'tv', title: item.show.title,
                            poster_path: null, timestamp: item.watched_at,
                            seasonNumber: item.episode.season, episodeNumber: item.episode.number,
                        });
                    }
                }
            }
            
            onImport(historyItems, Array.from(completedItems.values()));
            setFeedback(`Successfully imported ${historyItems.length} history entries for ${completedItems.size} items.`);

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during import.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDisconnect = async () => {
        if (traktToken) {
            try {
                await traktService.revokeTraktToken(traktToken.access_token);
            } catch (error) {
                console.error("Failed to revoke Trakt token, but disconnecting locally anyway.", error);
            }
        }
        setTraktToken(null);
        setError(null);
        setFeedback('Disconnected from Trakt.');
    };

    if (isExchangingToken) {
        return (
            <div className="bg-bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-text-primary font-semibold">Connecting to Trakt...</p>
            </div>
        );
    }
    
    return (
         <div className="bg-bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10"><TraktIcon /></div>
                <div>
                    <h3 className="font-semibold text-text-primary">Trakt</h3>
                    <p className="text-sm text-text-secondary">Import watch history, lists, and ratings.</p>
                </div>
            </div>
            
            {traktToken ? (
                 <div className="space-y-2">
                    <p className="text-sm text-center text-green-500 font-semibold">Successfully connected to Trakt!</p>
                    <button
                        onClick={handleImport}
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-sm rounded-md font-semibold bg-primary-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? 'Importing...' : 'Import Watch History'}
                    </button>
                    <button
                        onClick={handleDisconnect}
                        className="w-full text-center text-xs text-text-secondary hover:underline"
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                <button
                    onClick={traktService.redirectToTraktOauth}
                    className="w-full px-4 py-2 text-sm rounded-md font-semibold bg-bg-secondary text-text-primary hover:brightness-125 transition-all"
                >
                    Connect with Trakt
                </button>
            )}

            {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
            {feedback && <p className="text-xs text-green-500 text-center mt-2">{feedback}</p>}
        </div>
    );
};


interface ImportsScreenProps {
    onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
}

const ImportsScreen: React.FC<ImportsScreenProps> = ({ onImportCompleted }) => {

  const handleCsvUpload = () => {
    // This would trigger a file input click event
    alert('CSV import coming soon!');
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-8">
        <SectionHeader title="Connect a Service" />
        <div className="space-y-4">
            <TraktImporter onImport={onImportCompleted} />
            <ServiceCard name="The Movie Database (TMDB)" description="Import your rated movies and shows." icon={<TmdbIcon />} />
            <ServiceCard name="The TVDB" description="Import your favorites and ratings." icon={<TvdbIcon />} />
            <ServiceCard name="TV Time" description="Import your tracked shows and movies." icon={<TvTimeIcon />} />
            <ServiceCard name="IMDb" description="Import your public ratings and lists." icon={<ImdbIcon />} />
            <ServiceCard name="Showly" description="Import your full watch history." icon={<ShowlyIcon />} />
        </div>
      </div>
      
       <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-8">
        <SectionHeader 
            title="Upload a CSV File"
            subtitle="Alternatively, upload CSV files exported from Trakt, TV Time, TMDB, TVDB, or IMDb."
        />
        <button 
            onClick={handleCsvUpload}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-bg-secondary hover:brightness-125 transition-all text-text-primary font-semibold"
        >
            <CloudArrowUpIcon className="w-6 h-6" />
            <span>Choose a file...</span>
        </button>
      </div>

       <div className="text-center text-xs text-text-secondary/70">
          <p className="font-semibold">Privacy &amp; Security Note</p>
          <p>SceneIt never stores your login credentials for other services. Only secure API tokens are used to fetch your data.</p>
      </div>
    </div>
  );
};

export default ImportsScreen;