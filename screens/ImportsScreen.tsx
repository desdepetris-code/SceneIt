
import React, { useState, useEffect } from 'react';
import { ImdbIcon, SimklIcon, TraktIcon } from '../components/ServiceIcons';
import * as tmdbService from '../services/tmdbService';
import { HistoryItem, TrackedItem, TraktToken, UserRatings, WatchProgress } from '../types';
import * as traktService from '../services/traktService';
import { useLocalStorage } from '../hooks/useLocalStorage';

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
    </div>
);

// --- CSV Importer Component ---
const CsvFileImporter: React.FC<{ onImport: (history: HistoryItem[], completed: TrackedItem[]) => void }> = ({ onImport }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const parseLetterboxdCsv = (text: string): { historyItems: HistoryItem[], completedItems: TrackedItem[] } => {
        const rows = text.split('\n');
        const header = rows[0].split(',');
        const nameIndex = header.indexOf('Name');
        const tmdbIdIndex = header.indexOf('TMDb ID');
        const dateIndex = header.indexOf('Watched Date');
        
        if (nameIndex === -1 || tmdbIdIndex === -1) {
            throw new Error('Invalid Letterboxd CSV. Missing "Name" or "TMDb ID" columns.');
        }

        const historyItems: HistoryItem[] = [];
        const completedItems: TrackedItem[] = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            if (row.length < Math.max(nameIndex, tmdbIdIndex) + 1) continue;
            
            const tmdbId = parseInt(row[tmdbIdIndex], 10);
            const title = row[nameIndex].replace(/"/g, '');
            const watchedDate = dateIndex > -1 && row[dateIndex] ? new Date(row[dateIndex]).toISOString() : new Date().toISOString();

            if (tmdbId && title) {
                 const trackedItem: TrackedItem = { id: tmdbId, title, media_type: 'movie', poster_path: null, genre_ids: [] };
                completedItems.push(trackedItem);
                historyItems.push({ ...trackedItem, timestamp: watchedDate, logId: `import-lb-${tmdbId}-${i}` });
            }
        }
        return { historyItems, completedItems };
    };

    const parseImdbCsv = async (text: string): Promise<{ historyItems: HistoryItem[], completedItems: TrackedItem[] }> => {
        const rows = text.split('\n');
        const header = rows[0].split(',');
        const idIndex = header.indexOf('Const');
        const titleIndex = header.indexOf('Title');
        const typeIndex = header.indexOf('Title Type');
        const dateIndex = header.indexOf('Date Rated');

        if (idIndex === -1 || titleIndex === -1 || typeIndex === -1) {
            throw new Error('Invalid IMDb CSV. Missing "Const", "Title", or "Title Type" columns.');
        }

        const historyItems: HistoryItem[] = [];
        const completedItems: TrackedItem[] = [];
        const rateLimitDelay = 250; // ms between API calls

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            if (row.length < Math.max(idIndex, titleIndex, typeIndex) + 1) continue;

            const imdbId = row[idIndex];
            const title = row[titleIndex].replace(/"/g, '');
            const type = row[typeIndex];
            const ratedDate = dateIndex > -1 && row[dateIndex] ? new Date(row[dateIndex]).toISOString() : new Date().toISOString();

            if (imdbId && title && (type === 'movie' || type === 'tvSeries')) {
                setFeedback(`Processing: ${title} (${i}/${rows.length - 1})`);
                try {
                    const findResult = await tmdbService.findByImdbId(imdbId);
                    const mediaType = type === 'movie' ? 'movie' : 'tv';
                    const results = mediaType === 'movie' ? findResult.movie_results : findResult.tv_results;
                    
                    if (results.length > 0) {
                        const tmdbItem = results[0];
                        const trackedItem: TrackedItem = { id: tmdbItem.id, title: tmdbItem.title || tmdbItem.name || title, media_type: mediaType, poster_path: tmdbItem.poster_path, genre_ids: tmdbItem.genre_ids };
                        completedItems.push(trackedItem);
                        historyItems.push({ ...trackedItem, timestamp: ratedDate, logId: `import-imdb-${tmdbItem.id}-${i}` });
                    }
                } catch (e) {
                    console.warn(`Could not find TMDB match for IMDb ID ${imdbId}`, e);
                }
                await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
            }
        }
        return { historyItems, completedItems };
    };
    
    const parseSimklCsv = (text: string): { historyItems: HistoryItem[], completedItems: TrackedItem[] } => {
        const rows = text.split('\n');
        const header = rows[0].toLowerCase().split(',');
        const tmdbIdIndex = header.indexOf('tmdb');
        const titleIndex = header.indexOf('title');
        const typeIndex = header.indexOf('type');
        const lastWatchedIndex = header.indexOf('last watched');

        if (tmdbIdIndex === -1 || titleIndex === -1 || typeIndex === -1) {
            throw new Error('Invalid Simkl CSV. Missing "TMDb", "Title", or "Type" columns.');
        }
        
        const historyItems: HistoryItem[] = [];
        const completedItems: TrackedItem[] = [];

        for (let i = 1; i < rows.length; i++) {
             const row = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            if (row.length < Math.max(tmdbIdIndex, titleIndex, typeIndex) + 1) continue;

            const tmdbId = parseInt(row[tmdbIdIndex], 10);
            const title = row[titleIndex].replace(/"/g, '');
            const type = row[typeIndex];
            const lastWatched = lastWatchedIndex > -1 && row[lastWatchedIndex] ? new Date(row[lastWatchedIndex]).toISOString() : new Date().toISOString();

            if (tmdbId && title && (type === 'movie' || type === 'show')) {
                const media_type = type === 'show' ? 'tv' : 'movie';
                const trackedItem: TrackedItem = { id: tmdbId, title, media_type, poster_path: null, genre_ids: [] };
                completedItems.push(trackedItem);
                historyItems.push({ ...trackedItem, timestamp: lastWatched, logId: `import-simkl-${tmdbId}-${i}` });
            }
        }
        return { historyItems, completedItems };
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setFeedback('Parsing your file...');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File is empty.");

                const header = text.split('\n')[0].toLowerCase();
                let result: { historyItems: HistoryItem[], completedItems: TrackedItem[] };

                if (header.includes('letterboxd uri')) {
                    setFeedback('Detected Letterboxd format...');
                    result = parseLetterboxdCsv(text);
                } else if (header.includes('const,your rating,date rated,title')) {
                    setFeedback('Detected IMDb format. This may take several minutes...');
                    result = await parseImdbCsv(text);
                } else if (header.includes('simkl id') && header.includes('tmdb')) {
                    setFeedback('Detected Simkl format...');
                    result = parseSimklCsv(text);
                } else {
                    throw new Error("Unrecognized CSV format. Please use a file from Letterboxd, IMDb, or Simkl.");
                }
                
                onImport(result.historyItems, result.completedItems);
                setFeedback(`Successfully imported ${result.completedItems.length} items.`);
            } catch (err: any) {
                setError(err.message || 'Failed to parse the file.');
            } finally {
                setIsLoading(false);
                // Reset file input to allow re-uploading the same file
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const CsvImportOption: React.FC<{
      icon: React.ReactNode;
      title: string;
      steps: string[];
    }> = ({ icon, title, steps }) => (
      <div className="bg-bg-secondary/50 p-4 rounded-lg">
        <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 flex-shrink-0">{icon}</div>
            <h4 className="font-semibold text-text-primary">{title}</h4>
        </div>
        <ol className="text-sm text-text-secondary list-decimal list-inside space-y-1 my-2">
            {steps.map((step, i) => <li key={i} dangerouslySetInnerHTML={{ __html: step }}></li>)}
        </ol>
      </div>
    );

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-6">
            <SectionHeader title="Import from CSV Exports" subtitle="Upload a file from services like Letterboxd, IMDb, or Simkl." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <CsvImportOption 
                icon={<img src="https://letterboxd.com/favicon.ico" alt="Letterboxd" />}
                title="Letterboxd"
                steps={[
                  'Go to your Letterboxd <strong>Settings</strong> page.',
                  'Click the <strong>Import & Export</strong> tab.',
                  'Click <strong>Export Your Data</strong> and download the zip.',
                  'Unzip and upload the <strong>ratings.csv</strong> file below.',
                ]}
              />
              <CsvImportOption 
                icon={<ImdbIcon className="text-yellow-500"/>}
                title="IMDb"
                steps={[
                  'Go to your IMDb <strong>Ratings</strong> page.',
                  'Click the <strong>...</strong> menu and select <strong>Export</strong>.',
                  'Download your <strong>ratings.csv</strong> file.',
                  'Upload it below. Note: Import can be slow.',
                ]}
              />
              <CsvImportOption 
                icon={<SimklIcon className="text-white"/>}
                title="Simkl"
                steps={[
                    'Go to your Simkl profile <strong>Settings</strong>.',
                    'Navigate to the <strong>Import/Export</strong> section.',
                    'Choose <strong>Export to CSV</strong> and download.',
                    'Upload the exported file below.',
                ]}
              />
            </div>
            <p className="text-xs text-text-secondary/80 text-center mb-4">Note: IMDb imports can be slow due to API lookups for each item. Other imports are much faster.</p>
            <label className="w-full text-center cursor-pointer btn-secondary block">
                <span>{isLoading ? feedback : 'Upload CSV File'}</span>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
            </label>
            {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
            {!isLoading && feedback && !error && <p className="text-xs text-green-500 text-center mt-2">{feedback}</p>}
        </div>
    );
};


// --- Trakt Importer Component ---

const TraktImporter: React.FC<{ onImport: (data: any) => void }> = ({ onImport }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [token, setToken] = useLocalStorage<TraktToken | null>('trakt_token', null);

    useEffect(() => {
        const validateAndRefreshToken = async () => {
            if (token) {
                const isExpired = (token.created_at + token.expires_in) < (Date.now() / 1000);
                if (isExpired) {
                    setIsLoading(true);
                    setError(null);
                    setFeedback("Trakt session expired, refreshing...");
                    try {
                        const refreshedToken = await traktService.refreshToken(token);
                        setToken(refreshedToken);
                        setFeedback("Session refreshed.");
                    } catch (e: any) {
                        setToken(null);
                        setError(`Could not refresh session: ${e.message || 'Please connect again.'}`);
                        setFeedback(null);
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        };
        validateAndRefreshToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleImport = async () => {
        let currentToken = token;
        if (!currentToken) {
            setError('Not connected to Trakt. Please connect your account first.');
            return;
        }

        const isExpired = (currentToken.created_at + currentToken.expires_in) < (Date.now() / 1000);
        if (isExpired) {
            setIsLoading(true);
            setFeedback("Refreshing session...");
            try {
                const refreshedToken = await traktService.refreshToken(currentToken);
                setToken(refreshedToken);
                currentToken = refreshedToken;
            } catch (e: any) {
                setIsLoading(false);
                setToken(null);
                setError(`Session expired and could not be refreshed: ${e.message || 'Please connect again.'}`);
                setFeedback(null);
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        try {
            const history: HistoryItem[] = [];
            const completed: TrackedItem[] = [];
            const planToWatch: TrackedItem[] = [];
            const watchProgress: WatchProgress = {};
            const ratings: UserRatings = {};

            // 1. Watched Movies
            setFeedback('Fetching watched movies...');
            const watchedMovies = await traktService.getWatchedMovies(currentToken);
            for (const item of watchedMovies) {
                if (!item.movie?.ids?.tmdb) continue;
                const trackedItem = { id: item.movie.ids.tmdb, title: item.movie.title, media_type: 'movie' as const, poster_path: null };
                completed.push(trackedItem);
                history.push({ ...trackedItem, logId: `trakt-movie-${item.movie.ids.tmdb}`, timestamp: item.last_watched_at });
            }

            // 2. Watched Shows
            setFeedback(`Processing ${watchedMovies.length} movies. Fetching watched shows...`);
            const watchedShows = await traktService.getWatchedShows(currentToken);
            for (const item of watchedShows) {
                if (!item.show?.ids?.tmdb) continue;
                const showId = item.show.ids.tmdb;
                const trackedItem = { id: showId, title: item.show.title, media_type: 'tv' as const, poster_path: null };
                
                if (!watchProgress[showId]) watchProgress[showId] = {};
                
                item.seasons.forEach(season => {
                    if (!watchProgress[showId][season.number]) watchProgress[showId][season.number] = {};
                    season.episodes.forEach(ep => {
                        watchProgress[showId][season.number][ep.number] = { status: 2 };
                        history.push({ ...trackedItem, logId: `trakt-tv-${showId}-${season.number}-${ep.number}`, timestamp: ep.last_watched_at, seasonNumber: season.number, episodeNumber: ep.number });
                    });
                });

                // Check if show is complete and add to list
                // This is a simplified check. A full check would require fetching TMDB details.
                if (item.plays > 0) completed.push(trackedItem);
            }

            // 3. Watchlist
            setFeedback(`Processing ${watchedShows.length} shows. Fetching watchlist...`);
            const watchlist = await traktService.getWatchlist(currentToken);
            for (const item of watchlist) {
                const media = item.movie || item.show;
                if (!media?.ids?.tmdb) continue;
                planToWatch.push({ id: media.ids.tmdb, title: media.title, media_type: item.type === 'show' ? 'tv' : 'movie', poster_path: null });
            }

            // 4. Ratings
            setFeedback(`Processing ${watchlist.length} watchlist items. Fetching ratings...`);
            const traktRatings = await traktService.getRatings(currentToken);
            for (const item of traktRatings) {
                 const media = item.movie || item.show;
                if (!media?.ids?.tmdb || item.type === 'season' || item.type === 'episode') continue;
                ratings[media.ids.tmdb] = {
                    rating: Math.ceil(item.rating / 2), // Convert 1-10 to 1-5
                    date: item.rated_at
                };
            }

            setFeedback('Finalizing import...');
            onImport({ history, completed, planToWatch, watchProgress, ratings });
            setFeedback('Import complete! Your library has been updated.');

        } catch (e: any) {
            setError(`An error occurred during import: ${e.message}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-start space-x-4">
                <TraktIcon className="w-10 h-10 text-red-500 flex-shrink-0"/>
                <div>
                    <SectionHeader title="Import from Trakt.tv" />
                    <p className="text-sm text-text-secondary -mt-4 mb-4">
                        Connect your Trakt account to import your watch history, watchlist, and ratings.
                    </p>
                </div>
            </div>

            {token ? (
                <div className="space-y-4">
                    <p className="text-green-400 text-sm font-semibold text-center">✓ Connected to Trakt.tv</p>
                    <button onClick={handleImport} disabled={isLoading} className="w-full text-center btn-secondary">
                        {isLoading ? feedback : 'Start Import'}
                    </button>
                    <button onClick={() => { setToken(null); setFeedback(null); }} disabled={isLoading} className="w-full text-center text-xs text-text-secondary hover:underline">
                        Disconnect
                    </button>
                </div>
            ) : (
                <button onClick={traktService.redirectToTraktAuth} className="w-full text-center btn-secondary flex items-center justify-center space-x-2">
                    <TraktIcon className="w-5 h-5" />
                    <span>Connect to Trakt</span>
                </button>
            )}

            {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
            {!isLoading && feedback && !error && <p className="text-xs text-green-500 text-center mt-2">{feedback}</p>}
        </div>
    );
};


// --- MAIN SCREEN ---
interface ImportsScreenProps {
    onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
    onTraktImportCompleted: (data: {
        history: HistoryItem[];
        completed: TrackedItem[];
        planToWatch: TrackedItem[];
        watchProgress: WatchProgress;
        ratings: UserRatings;
    }) => void;
}

const ImportsScreen: React.FC<ImportsScreenProps> = ({ onImportCompleted, onTraktImportCompleted }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <style>{`
        .btn-secondary {
          width: 100%; padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: 0.375rem; font-weight: 600;
          background-color: var(--color-bg-secondary); color: var(--text-color-primary); transition: all 0.2s;
        }
        .btn-secondary:hover { filter: brightness(1.25); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        strong { color: var(--text-color-primary); font-weight: 600; }
      `}</style>

      <CsvFileImporter onImport={onImportCompleted} />
      <TraktImporter onImport={onTraktImportCompleted} />
    </div>
  );
};

export default ImportsScreen;