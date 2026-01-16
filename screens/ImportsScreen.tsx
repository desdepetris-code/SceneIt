
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TraktIcon } from '../components/ServiceIcons';
import * as tmdbService from '../services/tmdbService';
import { HistoryItem, TrackedItem, TraktToken, UserRatings, WatchProgress, UserData, CustomList } from '../types';
import * as traktService from '../services/traktService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { firebaseConfig } from '../firebaseConfig';
import { XMarkIcon, CheckCircleIcon, CloudArrowUpIcon, InformationCircleIcon, ArrowPathIcon, ListBulletIcon } from '../components/Icons';
import { confirmationService } from '../services/confirmationService';
import * as googleDriveService from '../services/googleDriveService';

interface TmdbExportItem {
    id: number;
    title?: string;
    original_title?: string;
    name?: string;
    original_name?: string;
    rating?: number;
    media_type: 'movie' | 'tv';
}

interface ImportPreviewItem {
    title: string;
    mediaType: 'movie' | 'tv';
    date: string;
    tmdbId?: number;
    imdbId?: string;
    rawRow: any;
    isValid: boolean;
}

interface ImportSummary {
    imported: number;
    skipped: number;
    total: number;
}

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary mt-1 font-medium">{subtitle}</p>}
    </div>
);

/**
 * Utility to parse CSV text into ImportPreviewItems.
 */
const parseCSV = (text: string): ImportPreviewItem[] => {
    const rows = text.split('\n').filter(r => r.trim());
    if (rows.length < 2) return [];
    
    const headerLine = rows[0].toLowerCase();
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Check for specific formats
    if (headerLine.includes('letterboxd uri')) {
        const nameIndex = headers.indexOf('Name');
        const tmdbIdIndex = headers.indexOf('TMDb ID');
        const dateIndex = headers.indexOf('Watched Date');
        return rows.slice(1).map(r => {
            const row = r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            return {
                title: (row[nameIndex] || '').replace(/"/g, ''),
                mediaType: 'movie' as const,
                date: row[dateIndex] ? new Date(row[dateIndex].replace(/"/g, '')).toISOString() : new Date().toISOString(),
                tmdbId: parseInt((row[tmdbIdIndex] || '').replace(/"/g, ''), 10),
                isValid: !!row[nameIndex],
                rawRow: row
            };
        });
    }

    if (headerLine.includes('const,your rating,date rated,title')) {
        const idIndex = headers.indexOf('Const');
        const titleIndex = headers.indexOf('Title');
        const typeIndex = headers.indexOf('Title Type');
        const dateIndex = headers.indexOf('Date Rated');
        return rows.slice(1).map(r => {
            const row = r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const type = (row[typeIndex] || '').replace(/"/g, '');
            return {
                title: (row[titleIndex] || '').replace(/"/g, ''),
                mediaType: (type === 'tvSeries' || type === 'tvMiniSeries') ? 'tv' : 'movie',
                date: row[dateIndex] ? new Date(row[dateIndex].replace(/"/g, '')).toISOString() : new Date().toISOString(),
                imdbId: (row[idIndex] || '').replace(/"/g, ''),
                isValid: !!row[titleIndex],
                rawRow: row
            };
        });
    }

    // Generic Fallback
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'));
    const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('category'));
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('watched'));
    const idIdx = headers.findIndex(h => h.includes('tmdb') || h.includes('id'));

    if (titleIdx === -1) return [];

    return rows.slice(1).map((rowStr) => {
        const row = rowStr.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const title = (row[titleIdx] || '').replace(/"/g, '').trim();
        let mediaType: 'movie' | 'tv' = 'movie';
        if (typeIdx !== -1) {
            const typeStr = (row[typeIdx] || '').toLowerCase();
            if (typeStr.includes('tv') || typeStr.includes('show')) mediaType = 'tv';
        }
        let date = new Date().toISOString();
        if (dateIdx !== -1 && row[dateIdx]) {
            const parsed = new Date(row[dateIdx].replace(/"/g, ''));
            if (!isNaN(parsed.getTime())) date = parsed.toISOString();
        }
        const tmdbId = idIdx !== -1 ? parseInt(row[idIdx], 10) : undefined;
        return { title, mediaType, date, tmdbId: isNaN(tmdbId as any) ? undefined : tmdbId, rawRow: row, isValid: !!title };
    });
};

const JsonFileImporter: React.FC<{ 
    onImport: (data: any) => void, 
    currentHistory: HistoryItem[] 
}> = ({ onImport, currentHistory }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file || !file.name.endsWith('.json')) {
            setError('Please upload a valid .json file.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                
                // Basic check for SceneIt format
                const hasValidFields = data.history || data.customLists || data.watchProgress || data.ratings;
                if (!hasValidFields) {
                    throw new Error("JSON structure not recognized. Ensure this is a SceneIt backup or supported export.");
                }
                
                setPreviewData(data);
                setShowPreview(true);
            } catch (err: any) {
                setError(err.message || 'Failed to parse JSON file.');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Could not read file.");
            setIsLoading(false);
        };
        reader.readAsText(file);
    };

    const executeImport = () => {
        if (!previewData) return;
        
        onImport(previewData);
        setShowPreview(false);
        setPreviewData(null);
        confirmationService.show("JSON Import successful!");
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="JSON File Upload" subtitle="Import complete library backups or structured datasets." />
            
            <div 
                className={`relative border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center text-center group cursor-pointer ${isDragging ? 'border-primary-accent bg-primary-accent/10' : 'border-white/10 bg-bg-secondary/20 hover:bg-bg-secondary/40 hover:border-white/20'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/5 group-hover:scale-110 transition-transform">
                    {isLoading ? <ArrowPathIcon className="w-8 h-8 text-primary-accent animate-spin" /> : <ListBulletIcon className="w-8 h-8 text-text-secondary group-hover:text-primary-accent" />}
                </div>
                <h3 className="text-xl font-black text-text-primary uppercase tracking-widest">{isLoading ? 'Parsing...' : 'Drop your JSON here'}</h3>
                <p className="text-sm text-text-secondary mt-2 font-medium">Click to select a .json file from your storage</p>
                <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={isLoading} />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                    <XMarkIcon className="w-5 h-5 text-red-500" />
                    <p className="text-sm font-bold text-red-400">{error}</p>
                </div>
            )}

            {showPreview && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPreview(false)}>
                    <div className="bg-bg-primary max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-card-gradient">
                            <div>
                                <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">JSON Data Preview</h2>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">Review contents before syncing</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-6 h-6" /></button>
                        </header>
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Watch History</p>
                                    <p className="text-2xl font-black text-text-primary">{(previewData?.history?.length || 0)} <span className="text-xs font-bold text-text-secondary">logs</span></p>
                                </div>
                                <div className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Custom Lists</p>
                                    <p className="text-2xl font-black text-text-primary">{(previewData?.customLists?.length || 0)} <span className="text-xs font-bold text-text-secondary">lists</span></p>
                                </div>
                                <div className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Ratings</p>
                                    <p className="text-2xl font-black text-text-primary">{Object.keys(previewData?.ratings || {}).length} <span className="text-xs font-bold text-text-secondary">rated</span></p>
                                </div>
                                <div className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Progress</p>
                                    <p className="text-2xl font-black text-text-primary">{Object.keys(previewData?.watchProgress || {}).length} <span className="text-xs font-bold text-text-secondary">shows</span></p>
                                </div>
                            </div>

                            <div className="p-4 bg-primary-accent/5 rounded-2xl border border-primary-accent/10">
                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                    <InformationCircleIcon className="w-4 h-4 inline-block mr-2 text-primary-accent" />
                                    Importing this file will merge it with your current local data. Duplicates with identical timestamps will be skipped automatically.
                                </p>
                            </div>
                        </div>
                        <footer className="p-6 bg-bg-secondary/30 flex justify-end items-center gap-4">
                            <button onClick={() => setShowPreview(false)} className="px-6 py-3 rounded-full text-text-secondary font-black uppercase tracking-widest text-xs hover:text-text-primary transition-colors">Cancel</button>
                            <button onClick={executeImport} className="px-10 py-3 rounded-full bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-lg">Finalize Import</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

const GoogleDriveImporter: React.FC<{ 
    onImport: (history: HistoryItem[], completed: TrackedItem[]) => void, 
    currentHistory: HistoryItem[],
    userData: UserData
}> = ({ onImport, currentHistory, userData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [summary, setSummary] = useState<ImportSummary | null>(null);

    const handleImportFromDrive = async () => {
        setIsLoading(true);
        try {
            const result = await googleDriveService.pickCsvFromDrive();
            if (result) {
                const items = parseCSV(result.content);
                const valid = items.filter(i => i.isValid);
                if (valid.length === 0) throw new Error("No valid data found in CSV.");
                setPreviewItems(valid);
                setShowPreview(true);
            }
        } catch (e: any) {
            confirmationService.show("Drive Error: " + (e.message || "Failed to access file."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportToDrive = async () => {
        setIsLoading(true);
        try {
            // Generate simple History CSV
            const csvRows = [
                ['Title', 'Type', 'Date Watched', 'Season', 'Episode', 'TMDB ID'].join(','),
                ...currentHistory.map(h => [
                    `"${h.title}"`,
                    h.media_type,
                    h.timestamp,
                    h.seasonNumber || '',
                    h.episodeNumber || '',
                    h.id
                ].join(','))
            ].join('\n');

            const fileName = `SceneIt_History_Backup_${new Date().toISOString().split('T')[0]}.csv`;
            const success = await googleDriveService.uploadToDrive(fileName, csvRows);
            if (success) {
                confirmationService.show(`Export successful: ${fileName} saved to your Drive.`);
            } else {
                throw new Error("Failed to upload file.");
            }
        } catch (e: any) {
            confirmationService.show("Export failed: " + (e.message || "Unknown error."));
        } finally {
            setIsLoading(false);
        }
    };

    const executeImport = async () => {
        setShowPreview(false);
        setIsLoading(true);
        const historyToSave: HistoryItem[] = [];
        const completedToSave: TrackedItem[] = [];
        let importedCount = 0;
        let skippedCount = 0;
        const historyLookup = new Set(currentHistory.map(h => `${h.id}-${h.timestamp}`));

        for (let i = 0; i < previewItems.length; i++) {
            const item = previewItems[i];
            try {
                let tmdbItem: any = null;
                if (item.tmdbId) {
                    tmdbItem = { id: item.tmdbId, title: item.title, name: item.title, media_type: item.mediaType, poster_path: null };
                } else {
                    const searchRes = await tmdbService.searchMedia(item.title);
                    tmdbItem = searchRes.find(r => r.media_type === item.mediaType);
                }

                if (tmdbItem) {
                    const lookupKey = `${tmdbItem.id}-${item.date}`;
                    if (!historyLookup.has(lookupKey)) {
                        const tracked: TrackedItem = { id: tmdbItem.id, title: tmdbItem.title || tmdbItem.name || item.title, media_type: item.mediaType, poster_path: tmdbItem.poster_path };
                        completedToSave.push(tracked);
                        historyToSave.push({ ...tracked, timestamp: item.date, logId: `drive-${Date.now()}-${i}` });
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    skippedCount++;
                }
            } catch (e) { skippedCount++; }
        }

        onImport(historyToSave, completedToSave);
        setSummary({ imported: importedCount, skipped: skippedCount, total: previewItems.length });
        setIsLoading(false);
    };

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white/10 rounded-xl">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.71 3.5l2.42 4.19L5.27 16h4.85l2.42-4.19L7.71 3.5zm7.33 0l-5.6 9.69 2.42 4.19L20.27 3.5h-5.23zM9.54 13.5L7.11 17.69 4.69 13.5H9.54z"/>
                    </svg>
                </div>
                <div className="flex-grow">
                    <SectionHeader title="Google Drive" subtitle="Manage your library directly from your cloud storage." />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <button 
                    onClick={handleImportFromDrive}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-3 bg-bg-secondary p-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5 hover:brightness-125 transition-all group overflow-hidden relative"
                >
                    <div className="absolute inset-0 nav-spectral-bg opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <CloudArrowUpIcon className="w-5 h-5 text-primary-accent" />
                    <span>{isLoading ? 'Processing...' : 'Import from Drive'}</span>
                </button>
                <button 
                    onClick={handleExportToDrive}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-3 bg-bg-secondary p-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5 hover:brightness-125 transition-all group overflow-hidden relative"
                >
                    <div className="absolute inset-0 nav-spectral-bg opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{isLoading ? 'Uploading...' : 'Export to Drive'}</span>
                </button>
            </div>

            {summary && (
                <div className="mt-4 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl animate-fade-in flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest">
                        Imported {summary.imported} items ({summary.skipped} skipped)
                    </p>
                </div>
            )}

            {showPreview && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPreview(false)}>
                    <div className="bg-bg-primary max-w-4xl w-full h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-card-gradient">
                            <div>
                                <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">Drive Import Preview</h2>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">{previewItems.length} items found</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-6 h-6" /></button>
                        </header>
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-bg-primary z-10">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary border-b border-white/5">
                                        <th className="pb-4 px-2">Title</th>
                                        <th className="pb-4 px-2">Type</th>
                                        <th className="pb-4 px-2">Date</th>
                                        <th className="pb-4 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {previewItems.slice(0, 100).map((item, i) => (
                                        <tr key={i} className="text-sm font-bold">
                                            <td className="py-4 px-2 text-text-primary">{item.title}</td>
                                            <td className="py-4 px-2 uppercase text-[10px]">{item.mediaType}</td>
                                            <td className="py-4 px-2 text-text-secondary">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="py-4 px-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Ready</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <footer className="p-6 bg-bg-secondary/30 flex justify-end items-center gap-4">
                            <button onClick={() => setShowPreview(false)} className="px-6 py-3 rounded-full text-text-secondary font-black uppercase tracking-widest text-xs hover:text-text-primary transition-colors">Cancel</button>
                            <button onClick={executeImport} className="px-10 py-3 rounded-full bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-lg">Confirm & Sync</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

const CsvFileImporter: React.FC<{ onImport: (history: HistoryItem[], completed: TrackedItem[]) => void, currentHistory: HistoryItem[] }> = ({ onImport, currentHistory = [] }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file || !file.name.endsWith('.csv')) {
            setError('Please upload a valid .csv file.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSummary(null);
        setFeedback('Reading file...');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File is empty.");

                const items = parseCSV(text);
                const validItems = items.filter(i => i.isValid);
                if (validItems.length === 0) {
                    throw new Error("No valid data found in CSV. Please ensure columns are correctly named.");
                }
                setPreviewItems(validItems);
                setShowPreview(true);
            } catch (err: any) {
                setError(err.message || 'Failed to parse the file.');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Could not read file.");
            setIsLoading(false);
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        setShowPreview(false);
        setIsLoading(true);
        setError(null);
        setFeedback('Importing items...');

        const historyToSave: HistoryItem[] = [];
        const completedToSave: TrackedItem[] = [];
        let importedCount = 0;
        let skippedCount = 0;

        const historyLookup = new Set((currentHistory || []).map(h => `${h.id}-${h.timestamp}`));

        for (let i = 0; i < previewItems.length; i++) {
            const item = previewItems[i];
            setFeedback(`Matching ${i + 1}/${previewItems.length}: ${item.title}`);

            try {
                let tmdbItem: any = null;
                if (item.tmdbId) {
                    tmdbItem = { id: item.tmdbId, title: item.title, name: item.title, media_type: item.mediaType, poster_path: null };
                } else if (item.imdbId) {
                    const findResult = await tmdbService.findByImdbId(item.imdbId);
                    tmdbItem = item.mediaType === 'movie' ? findResult.movie_results[0] : findResult.tv_results[0];
                } else {
                    const searchRes = await tmdbService.searchMedia(item.title);
                    tmdbItem = searchRes.find(r => r.media_type === item.mediaType);
                }

                if (tmdbItem) {
                    const lookupKey = `${tmdbItem.id}-${item.date}`;
                    if (!historyLookup.has(lookupKey)) {
                        const tracked: TrackedItem = { 
                            id: tmdbItem.id, 
                            title: tmdbItem.title || tmdbItem.name || item.title, 
                            media_type: item.mediaType, 
                            poster_path: tmdbItem.poster_path, 
                            genre_ids: tmdbItem.genre_ids 
                        };
                        completedToSave.push(tracked);
                        historyToSave.push({ ...tracked, timestamp: item.date, logId: `import-${Date.now()}-${i}` });
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    skippedCount++;
                }
            } catch (e) {
                console.warn(`Failed to match item: ${item.title}`, e);
                skippedCount++;
            }
            
            if (item.imdbId && !item.tmdbId) await new Promise(r => setTimeout(r, 100));
        }

        onImport(historyToSave, completedToSave);
        setSummary({ imported: importedCount, skipped: skippedCount, total: previewItems.length });
        setFeedback(null);
        setIsLoading(false);
        confirmationService.show(`CSV Import complete: ${importedCount} items added.`);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="CSV File Import" subtitle="Upload watch history from IMDb, Letterboxd, or custom files." />
            
            <div 
                className={`relative border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center text-center group cursor-pointer ${isDragging ? 'border-primary-accent bg-primary-accent/10' : 'border-white/10 bg-bg-secondary/20 hover:bg-bg-secondary/40 hover:border-white/20'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/5 group-hover:scale-110 transition-transform">
                    {isLoading ? <ArrowPathIcon className="w-8 h-8 text-primary-accent animate-spin" /> : <CloudArrowUpIcon className="w-8 h-8 text-text-secondary group-hover:text-primary-accent" />}
                </div>
                <h3 className="text-xl font-black text-text-primary uppercase tracking-widest">{isLoading ? 'Processing...' : 'Drop your CSV here'}</h3>
                <p className="text-sm text-text-secondary mt-2 font-medium">Or click to browse files from your device</p>
                <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={isLoading} />
            </div>

            {summary && (
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl animate-fade-in flex items-center gap-6">
                    <div className="p-4 bg-green-500/20 rounded-2xl text-green-400">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-text-primary uppercase tracking-widest">Import Complete</h4>
                        <div className="flex gap-4 mt-1 text-sm font-bold text-text-secondary uppercase tracking-widest">
                            <span>{summary.imported} Imported</span>
                            <span className="opacity-40">•</span>
                            <span>{summary.skipped} Skipped</span>
                            <span className="opacity-40">•</span>
                            <span>{summary.total} Total</span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                    <XMarkIcon className="w-5 h-5 text-red-500" />
                    <p className="text-sm font-bold text-red-400">{error}</p>
                </div>
            )}

            {feedback && isLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-primary-accent font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    {feedback}
                </div>
            )}

            {showPreview && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPreview(false)}>
                    <div className="bg-bg-primary max-w-4xl w-full h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-card-gradient">
                            <div>
                                <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">Import Preview</h2>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">{previewItems.length} items found</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-6 h-6" /></button>
                        </header>
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-bg-primary z-10">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary border-b border-white/5">
                                        <th className="pb-4 px-2">Title</th>
                                        <th className="pb-4 px-2">Type</th>
                                        <th className="pb-4 px-2">Date</th>
                                        <th className="pb-4 px-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {previewItems.slice(0, 100).map((item, i) => (
                                        <tr key={i} className="text-sm font-bold">
                                            <td className="py-4 px-2 text-text-primary truncate max-w-[200px]">{item.title}</td>
                                            <td className="py-4 px-2 uppercase text-[10px]">{item.mediaType}</td>
                                            <td className="py-4 px-2 text-text-secondary">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="py-4 px-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Ready</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewItems.length > 100 && (
                                <p className="text-center py-6 text-xs text-text-secondary font-bold uppercase tracking-widest italic">Showing first 100 items...</p>
                            )}
                        </div>
                        <footer className="p-6 bg-bg-secondary/30 flex justify-end items-center gap-4">
                            <button onClick={() => setShowPreview(false)} className="px-6 py-3 rounded-full text-text-secondary font-black uppercase tracking-widest text-xs hover:text-text-primary transition-colors">Cancel</button>
                            <button onClick={executeImport} className="px-10 py-3 rounded-full bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-lg">Finalize Import</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

const TraktImporter: React.FC<{ onImport: (data: any) => void }> = ({ onImport }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [token, setToken] = useLocalStorage<TraktToken | null>('trakt_token', null);
    
    const TRAKT_AUTH_FUNCTION_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/traktAuth`;

    useEffect(() => {
        const validateAndRefreshToken = async () => {
            if (token) {
                const isExpired = (token.created_at + token.expires_in) < (Date.now() / 1000);
                if (isExpired) {
                    setIsLoading(true);
                    setFeedback("Refreshing session...");
                    try {
                        const refreshedToken = await traktService.refreshToken(token, TRAKT_AUTH_FUNCTION_URL);
                        setToken(refreshedToken);
                        setFeedback("Session refreshed.");
                    } catch (e: any) {
                        setToken(null);
                        setError(`Session expired: ${e.message || 'Please connect again.'}`);
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        };
        validateAndRefreshToken();
    }, [token, setToken, TRAKT_AUTH_FUNCTION_URL]);


    const handleImport = async () => {
        if (!token) {
            setError('Not connected to Trakt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const history: HistoryItem[] = [];
            const completed: TrackedItem[] = [];
            const planToWatch: TrackedItem[] = [];
            const watchProgress: WatchProgress = {};
            const ratings: UserRatings = {};

            setFeedback('Fetching movies...');
            const watchedMovies = await traktService.getWatchedMovies(token);
            watchedMovies.forEach(item => {
                if (item.movie?.ids?.tmdb) {
                    const trackedItem = { id: item.movie.ids.tmdb, title: item.movie.title, media_type: 'movie' as const, poster_path: null };
                    completed.push(trackedItem);
                    history.push({ ...trackedItem, logId: `trakt-movie-${item.movie.ids.tmdb}`, timestamp: item.last_watched_at });
                }
            });

            setFeedback('Fetching shows...');
            const watchedShows = await traktService.getWatchedShows(token);
            watchedShows.forEach(item => {
                if (item.show?.ids?.tmdb) {
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
                    if (item.plays > 0) completed.push(trackedItem);
                }
            });

            onImport({ history, completed, planToWatch, watchProgress, ratings });
            setFeedback(`Imported ${history.length} watch events.`);
        } catch (e: any) {
            setError(`Import failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-start space-x-4">
                <TraktIcon className="w-10 h-10 text-red-500 flex-shrink-0"/>
                <div className="flex-grow">
                    <SectionHeader title="Trakt.tv Sync" />
                    <p className="text-sm text-text-secondary -mt-4 mb-4 font-medium">Connect your account to sync your history.</p>
                </div>
            </div>

            {token ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-black uppercase bg-green-500/10 py-2 rounded-xl">
                        <CheckCircleIcon className="w-4 h-4" /> Connected
                    </div>
                    <button onClick={handleImport} disabled={isLoading} className="w-full text-center bg-bg-secondary p-3 rounded-xl font-black uppercase text-xs border border-white/5">
                        {isLoading ? feedback : 'Start Sync'}
                    </button>
                </div>
            ) : (
                <button onClick={traktService.redirectToTraktAuth} className="w-full text-center bg-bg-secondary p-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center space-x-3 border border-white/5">
                    <TraktIcon className="w-5 h-5" />
                    <span>Connect Trakt</span>
                </button>
            )}

            {error && <p className="text-xs text-red-500 text-center mt-2 font-bold">{error}</p>}
        </div>
    );
};

const TmdbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
        <path fill="#0d253f" d="M24,48 C10.745,48 0,37.255 0,24 C0,10.745 10.745,0 24,0 C37.255,0 48,10.745 48,24 C48,37.255 37.255,48 24,48 Z"></path>
        <path fill="#01b4e4" d="M24,42 C14.059,42 6,33.941 6,24 C6,14.059 14.059,6 24,6 C33.941,6 42,14.059 42,24 C42,33.941 33.941,42 24,42 Z"></path>
        <path fill="#90cea1" d="M19,16h-4v4h4v-4zm-4,6h4v4h-4v-4zm0,6h4v4h-4v-4zm6-12h4v4h-4v-4zm0,6h4v4h-4v-4zm0,6h4v4h-4v-4zm6-6h4v4h-4v-4zm0,6h4v4h-4v-4zm6-12h4v16h-4V16z"></path>
    </svg>
);


const TmdbImporter: React.FC<{ onImport: (data: any) => void }> = ({ onImport }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsLoading(true);
        setError(null);
        setFeedback(`Processing...`);

        const history: HistoryItem[] = [];
        const completed: TrackedItem[] = [];
        const planToWatch: TrackedItem[] = [];
        const favorites: TrackedItem[] = [];
        const ratings: UserRatings = {};

        try {
            for (const file of Array.from(files) as File[]) {
                const text = await file.text();
                const data = JSON.parse(text);
                const name = file.name;

                data.forEach((item: TmdbExportItem) => {
                    const id = item.id;
                    const title = item.title || item.original_title || item.name || item.original_name;
                    if (!id || !title) return;

                    const trackedItem: TrackedItem = { id, title, media_type: item.media_type, poster_path: null, genre_ids: [] };
                    if (name.includes('rated_')) {
                        if(item.rating) ratings[id] = { rating: Math.ceil(item.rating / 2), date: new Date().toISOString() };
                        completed.push(trackedItem);
                        history.push({ ...trackedItem, logId: `import-tmdb-rated-${id}`, timestamp: new Date().toISOString() });
                    } else if (name.includes('favorite_')) {
                        favorites.push(trackedItem);
                    } else if (name.includes('watchlist')) {
                        planToWatch.push(trackedItem);
                    }
                });
            }
            onImport({ history, completed, planToWatch, favorites, ratings });
            setFeedback(`Import complete.`);
        } catch (err: any) {
            setError('Failed to parse JSON files.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-start space-x-4">
                <TmdbIcon className="w-10 h-10 flex-shrink-0"/>
                <div>
                    <SectionHeader title="TMDB JSON Import" subtitle="Upload JSON exports from your TMDB settings." />
                </div>
            </div>
            <label className="w-full text-center cursor-pointer block bg-bg-secondary p-3 rounded-xl font-black uppercase text-xs border border-white/5">
                <span>{isLoading ? feedback : 'Upload JSON Files'}</span>
                <input type="file" className="hidden" accept=".json" onChange={handleFileChange} disabled={isLoading} multiple />
            </label>
            {error && <p className="text-xs text-red-500 text-center mt-2 font-bold">{error}</p>}
        </div>
    );
};


interface ImportsScreenProps {
    onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
    onTraktImportCompleted: (data: {
        history: HistoryItem[];
        completed: TrackedItem[];
        planToWatch: TrackedItem[];
        watchProgress: WatchProgress;
        ratings: UserRatings;
    }) => void;
    onTmdbImportCompleted: (data: {
        history: HistoryItem[];
        completed: TrackedItem[];
        planToWatch: TrackedItem[];
        favorites: TrackedItem[];
        ratings: UserRatings;
    }) => void;
    onJsonImportCompleted: (data: any) => void;
    userData: UserData;
}

const ImportsScreen: React.FC<ImportsScreenProps> = ({ onImportCompleted, onTraktImportCompleted, onTmdbImportCompleted, onJsonImportCompleted, userData }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CsvFileImporter onImport={onImportCompleted} currentHistory={userData?.history || []} />
        <JsonFileImporter onImport={onJsonImportCompleted} currentHistory={userData?.history || []} />
      </div>
      <GoogleDriveImporter onImport={onImportCompleted} currentHistory={userData?.history || []} userData={userData} />
      <TraktImporter onImport={onTraktImportCompleted} />
      <TmdbImporter onImport={onTmdbImportCompleted} />
    </div>
  );
};

export default ImportsScreen;
