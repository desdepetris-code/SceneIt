import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TrackedItem, DownloadedPdf, CustomImagePaths } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
import { generateAirtimePDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, LockClosedIcon, SparklesIcon, DownloadIcon, PhotoIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
}

type ReportType = 'ongoing' | 'hiatus' | 'legacy' | 'integrity' | 'deep_ongoing' | 'placeholder';

const MASTER_PIN = "999236855421340";
const DEFAULT_MATCH_LIMIT = 100;
const PLACEHOLDER_MATCH_LIMIT = 10;

interface ReportOffset {
    page: number;
    index: number;
    part: number;
    mediaType: 'tv' | 'movie';
}

const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });

    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, ReportOffset>>('cinemontauge_report_offsets', {
        ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        hiatus: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        legacy: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        integrity: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        deep_ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder: { page: 1, index: 0, part: 1, mediaType: 'tv' }
    });

    const [pdfArchive, setPdfArchive] = useLocalStorage<DownloadedPdf[]>('cinemontauge_pdf_archive', []);

    const totalOverriddenEpisodes = useMemo(() => {
        return Object.values(AIRTIME_OVERRIDES).reduce((acc, show) => {
            return acc + Object.keys(show.episodes || {}).length;
        }, 0);
    }, []);

    const assetStats = useMemo(() => {
        let stills = 0;
        let posters = 0;
        let backdrops = 0;

        // Count custom episode images (stills)
        if (userData.customEpisodeImages) {
            (Object.values(userData.customEpisodeImages) as Record<number, Record<number, string>>[]).forEach(show => {
                (Object.values(show) as Record<number, string>[]).forEach(season => {
                    stills += Object.keys(season).length;
                });
            });
        }

        // Count show-level custom assets
        if (userData.customImagePaths) {
            (Object.values(userData.customImagePaths) as { poster_path?: string; backdrop_path?: string; gallery?: string[] }[]).forEach(paths => {
                if (paths.poster_path) posters++;
                if (paths.backdrop_path) backdrops++;
            });
        }

        return { stills, posters, backdrops, total: stills + posters + backdrops };
    }, [userData.customEpisodeImages, userData.customImagePaths]);

    const handlePinInput = useCallback((digit: string) => {
        setPin(prev => {
            if (prev.length >= 15) return prev;
            const newPin = prev + digit;
            if (newPin.length === 15) {
                if (newPin === MASTER_PIN) {
                    setIsAuthorized(true);
                } else {
                    setPinError(true);
                    setTimeout(() => { setPin(''); setPinError(false); }, 1000);
                }
            }
            return newPin;
        });
    }, []);

    useEffect(() => {
        if (isAuthorized) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^\d$/.test(e.key)) handlePinInput(e.key);
            else if (e.key === 'Backspace') setPin(prev => prev.slice(0, -1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthorized, handlePinInput]);

    const auditShow = async (item: TmdbMediaDetails | TrackedItem, type: string, rows: any[], dates: any) => {
        const show: TmdbMediaDetails | null = (item as any).status 
            ? (item as TmdbMediaDetails) 
            : await getMediaDetails(item.id, item.media_type as 'tv' | 'movie').catch(() => null);
        
        if (!show) return false;

        if (type === 'placeholder') {
            const hasCustomPoster = !!userData.customImagePaths?.[show.id]?.poster_path;
            const hasCustomBackdrop = !!userData.customImagePaths?.[show.id]?.backdrop_path;
            
            const missingPoster = !show.poster_path && !hasCustomPoster;
            const missingBackdrop = !show.backdrop_path && !hasCustomBackdrop;
            const missingStills: { sNum: number, count: number, eps: Episode[] }[] = [];

            if (show.media_type === 'tv') {
                const seasons = show.seasons?.filter(s => s.season_number > 0) || [];
                const localImages = userData.customEpisodeImages?.[show.id] || {};

                for (const s of seasons) {
                    try {
                        const sd = await getSeasonDetails(show.id, s.season_number);
                        const seasonLocals = localImages[s.season_number] || {};

                        // Filter requirements:
                        // 1. Must not have TMDB still_path
                        // 2. Must not have local replacement image
                        // 3. Must have already aired
                        // 4. Must satisfy the 3-day grace period (doesn't show episodes aired today or last 3 days)
                        const epsWithNoStill = sd.episodes.filter(ep => 
                            !ep.still_path && 
                            !seasonLocals[ep.episode_number] &&
                            ep.air_date && 
                            ep.air_date <= dates.threeDaysAgoStr // 3-day grace period implemented here
                        );
                        if (epsWithNoStill.length > 0) {
                            missingStills.push({ sNum: s.season_number, count: epsWithNoStill.length, eps: epsWithNoStill });
                        }
                    } catch (e) {}
                }
            }

            if (missingPoster || missingBackdrop || missingStills.length > 0) {
                rows.push({
                    title: `>> ${show.media_type.toUpperCase()} GAP: ${show.name || show.title} (ID: ${show.id})`,
                    status: show.status || 'Active',
                    details: `${missingPoster ? 'NO_POSTER ' : ''}${missingBackdrop ? 'NO_BACKDROP' : ''}`
                });
                missingStills.forEach(ms => {
                    rows.push({
                        title: `   - S${ms.sNum} Missing ${ms.count} Stills`,
                        status: `Registry Error`,
                        details: ms.eps.map(e => `E${e.episode_number} (ID:${e.id})`).join(', ')
                    });
                });
                return true;
            }
            return false;
        }

        const isDeepScan = type === 'integrity' || type === 'deep_ongoing' || type === 'legacy';
        const seasonsToScan = isDeepScan 
            ? (show.seasons?.filter(s => s.season_number > 0) || []) 
            : [{ season_number: show.next_episode_to_air?.season_number || show.last_episode_to_air?.season_number || 1 }];

        let matched = false;

        for (const s of seasonsToScan) {
            try {
                const seasonDetails = await getSeasonDetails(show.id, (s as any).season_number);
                const hasOverride = !!AIRTIME_OVERRIDES[show.id];

                const missingEpisodes = seasonDetails.episodes.filter(ep => {
                    const epKey = `S${ep.season_number}E${ep.episode_number}`;
                    const isAlreadyManaged = hasOverride && (AIRTIME_OVERRIDES[show.id].episodes?.[epKey] || AIRTIME_OVERRIDES[show.id].time);
                    if (isAlreadyManaged) return false;

                    if (type === 'ongoing') {
                        if (!ep.air_date) return false;
                        const epDate = new Date(ep.air_date);
                        return epDate >= dates.sevenDaysAgo && epDate <= dates.sevenDaysFromNow;
                    }
                    if (type === 'deep_ongoing') {
                        if (ep.air_date) {
                            const epDate = new Date(ep.air_date);
                            if (epDate >= dates.sevenDaysAgo && epDate <= dates.sevenDaysFromNow) return false;
                        }
                        return true;
                    }
                    if (type === 'hiatus') {
                        return !ep.air_date || new Date(ep.air_date) > dates.sevenDaysFromNow;
                    }
                    return true;
                });

                if (missingEpisodes.length > 0) {
                    matched = true;
                    rows.push({
                        title: `>> ${show.name?.toUpperCase()} (Show ID: ${show.id})`,
                        status: show.status,
                        details: `S${(s as any).season_number} | Missing ${missingEpisodes.length} Truths`
                    });
                    missingEpisodes.forEach(ep => {
                        rows.push({
                            title: `   - E${ep.episode_number}: ${ep.name}`,
                            status: ep.air_date || 'DATE UNKNOWN',
                            details: `Ep ID: ${ep.id}`
                        });
                    });
                }
            } catch (e) {}
        }
        return matched;
    };

    const handleGenerateReport = async (type: ReportType) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });

        const currentMatchLimit = type === 'placeholder' ? PLACEHOLDER_MATCH_LIMIT : DEFAULT_MATCH_LIMIT;

        try {
            let reportTitle = "";
            let rows: any[] = [];
            const now = new Date();
            const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
            const dates = {
                today: now.toISOString().split('T')[0],
                threeDaysAgoStr: threeDaysAgo.toISOString().split('T')[0],
                sevenDaysFromNow: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)),
                sevenDaysAgo: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
            };

            const offset = reportOffsets[type];
            let currentMatches = 0;
            let lastPage = offset.page;
            let lastIndex = offset.index;
            let currentMediaType = offset.mediaType || 'tv';

            const STATUS_ONGOING = ['Returning Series', 'In Production', 'Planned', 'Pilot'];
            const STATUS_LEGACY = ['Ended', 'Canceled'];
            const statusFilter = type === 'legacy' ? STATUS_LEGACY : STATUS_ONGOING;
            
            reportTitle = type === 'legacy' ? "Legacy Archive Gaps" : 
                          type === 'ongoing' ? "Urgent Global Gaps" :
                          type === 'hiatus' ? "Global Hiatus Gaps" : 
                          type === 'integrity' ? "Library Integrity" : 
                          type === 'placeholder' ? "Media Placeholder Gaps" : "Deep Archive Gaps";

            const fetchMedia = async (page: number, mType: 'tv' | 'movie') => {
                return discoverMediaPaginated(mType, { 
                    sortBy: 'popularity.desc', 
                    page, 
                    watch_region: 'US', 
                    with_watch_monetization_types: 'flatrate|free|ads|rent|buy' 
                });
            };

            const firstPage = await fetchMedia(1, currentMediaType);
            const totalPages = Math.min(firstPage.total_pages, 500); 
            setScanProgress({ current: lastPage, total: totalPages, matches: 0 });

            for (let page = lastPage; page <= totalPages && currentMatches < currentMatchLimit; page++) {
                const data = await fetchMedia(page, currentMediaType);
                const startAt = (page === lastPage) ? lastIndex : 0;

                for (let i = startAt; i < data.results.length && currentMatches < currentMatchLimit; i++) {
                    const result = data.results[i];
                    const details = await getMediaDetails(result.id, currentMediaType).catch(() => null);
                    
                    if (details && (type === 'placeholder' || (currentMediaType === 'tv' && statusFilter.includes(details.status)))) {
                        const wasMatched = await auditShow(details, type, rows, dates);
                        if (wasMatched) {
                            currentMatches++;
                        }
                    }
                    
                    lastPage = page;
                    lastIndex = i + 1; 
                    setScanProgress(p => ({ ...p, current: page, matches: currentMatches }));
                }

                if (page === totalPages && currentMediaType === 'tv' && type === 'placeholder' && currentMatches < currentMatchLimit) {
                    currentMediaType = 'movie';
                    lastPage = 1;
                    lastIndex = 0;
                    page = 0; // restart for movie loop
                }
            }

            if (rows.length === 0) {
                alert(`All caught up! No gaps found in this segment.`);
                return;
            }

            generateAirtimePDF(reportTitle, rows, offset.part);
            
            const newArchiveItem: DownloadedPdf = {
                id: `pdf-${Date.now()}`,
                title: reportTitle,
                timestamp: new Date().toISOString(),
                part: offset.part,
                rows
            };
            setPdfArchive(prev => [newArchiveItem, ...prev].slice(0, 20));

            setReportOffsets(prev => ({
                ...prev,
                [type]: {
                    page: lastPage,
                    index: lastIndex >= 20 ? 0 : lastIndex,
                    part: offset.part + 1,
                    mediaType: currentMediaType
                }
            }));

            confirmationService.show(`Part ${offset.part} generated. Found ${currentMatches} items.`);

        } catch (err) {
            console.error("PDF Gen Error:", err);
            alert("Report generation failed.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleReset = (type: ReportType) => {
        if (window.confirm(`Restart sequential audit for ${type} from the beginning?`)) {
            setReportOffsets(prev => ({ ...prev, [type]: { page: 1, index: 0, part: 1, mediaType: 'tv' } }));
            confirmationService.show("Progress reset to Page 1, Part 1.");
        }
    };

    const reDownload = (pdf: DownloadedPdf) => {
        generateAirtimePDF(pdf.title, pdf.rows, pdf.part);
        confirmationService.show(`Re-downloading ${pdf.title} Part ${pdf.part}`);
    };

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in px-6">
                <div className="bg-bg-secondary/40 border border-white/10 rounded-[3rem] p-10 w-full max-sm shadow-2xl text-center backdrop-blur-xl">
                    <div className={`w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center transition-all duration-500 ${pinError ? 'bg-red-500 animate-shake' : 'bg-primary-accent shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)]'}`}>
                        <LockClosedIcon className="w-10 h-10 text-on-accent" />
                    </div>
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-2">Master Key</h2>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-8">Enter owner credentials to continue</p>
                    <div className="flex justify-center gap-1.5 mb-10">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-primary-accent scale-110 shadow-[0_0_8px_var(--color-accent-primary)]' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"].map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === "CLR") setPin("");
                                    else if (key === "DEL") setPin(prev => prev.slice(0, -1));
                                    else handlePinInput(key);
                                }}
                                className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-90 flex items-center justify-center ${key === "CLR" || key === "DEL" ? 'bg-white/5 text-[10px] uppercase tracking-widest text-text-secondary' : 'bg-bg-primary/60 text-text-primary border border-white/5 hover:border-primary-accent/40 shadow-lg'}`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={onBack} className="mt-8 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">Return to Safety</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-6 pb-40">
            <header className="flex items-center mb-10 relative">
                <button onClick={onBack} className="absolute left-0 p-3 bg-bg-secondary rounded-full text-text-primary hover:text-primary-accent transition-all">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-4xl font-black text-text-primary text-center w-full uppercase tracking-tighter">Owner Portal</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    <div className="bg-primary-accent/10 border border-primary-accent/20 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-primary-accent" />
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Truth Overrides</h2>
                        </div>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                            Individual episode airtime truths currently active in <code className="text-primary-accent">airtimeOverrides.ts</code>. These specific timestamps are excluded from all audit reports.
                        </p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-5xl font-black text-text-primary">{totalOverriddenEpisodes}</span>
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Episodes</span>
                        </div>
                    </div>

                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <PhotoIcon className="w-8 h-8 text-sky-500" />
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Personal Assets</h2>
                        </div>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                            Granular breakdown of manually provided or edited cinematic assets across your library.
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <span className="text-2xl font-black text-text-primary block">{assetStats.posters}</span>
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Posters</span>
                            </div>
                            <div className="text-center">
                                <span className="text-2xl font-black text-text-primary block">{assetStats.backdrops}</span>
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Backdrops</span>
                            </div>
                            <div className="text-center">
                                <span className="text-2xl font-black text-text-primary block">{assetStats.stills}</span>
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Stills</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Total Contributed</span>
                            <span className="text-lg font-black text-sky-500">{assetStats.total}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 px-2">High-Priority Scans</h2>
                        
                        {(['integrity', 'placeholder', 'deep_ongoing'] as ReportType[]).map(type => {
                            const currentLimit = type === 'placeholder' ? PLACEHOLDER_MATCH_LIMIT : DEFAULT_MATCH_LIMIT;
                            return (
                                <div key={type} className="relative group">
                                    <button 
                                        onClick={() => handleGenerateReport(type)}
                                        disabled={isGenerating !== null}
                                        className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all shadow-2xl relative overflow-hidden ${type === 'integrity' ? 'bg-white text-black hover:bg-slate-100' : type === 'placeholder' ? 'bg-sky-500 text-white hover:brightness-110' : 'bg-primary-accent text-on-accent hover:brightness-110'}`}
                                    >
                                        <div className="flex items-center gap-4 text-left relative z-10">
                                            <div className={`p-3 rounded-xl ${type === 'integrity' ? 'bg-black/5' : 'bg-white/10'}`}>
                                                {type === 'integrity' ? <SparklesIcon className="w-6 h-6" /> : type === 'placeholder' ? <PhotoIcon className="w-6 h-6" /> : <ArchiveBoxIcon className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <span className="text-sm font-black uppercase tracking-widest">{type.replace('_', ' ')} Scan</span>
                                                <p className="text-[10px] font-bold uppercase opacity-60">
                                                    {isGenerating === type ? `Scanning: ${scanProgress.matches}/${currentLimit}` : `Part ${reportOffsets[type].part} Registry Audit`}
                                                </p>
                                            </div>
                                        </div>
                                        {isGenerating === type ? <ArrowPathIcon className="w-5 h-5 animate-spin relative z-10" /> : <CloudArrowUpIcon className="w-5 h-5 relative z-10" />}
                                    </button>
                                    <button onClick={() => handleReset(type)} className="absolute right-14 top-1/2 -translate-y-1/2 p-2 hover:bg-black/10 rounded-full z-20 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowPathIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 px-2 mb-2">Global Segments ({DEFAULT_MATCH_LIMIT} Matches / Part)</h2>
                    
                    {(['ongoing', 'hiatus', 'legacy'] as ReportType[]).map(type => (
                        <div key={type} className="relative group">
                            <button 
                                onClick={() => handleGenerateReport(type)}
                                disabled={isGenerating !== null}
                                className="w-full flex items-center justify-between p-5 bg-bg-secondary/40 border border-white/5 rounded-2xl hover:border-primary-accent/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${type === 'ongoing' ? 'bg-red-500/20 text-red-500' : type === 'hiatus' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-500'}`}>
                                        {type === 'ongoing' ? <FireIcon className="w-5 h-5" /> : type === 'hiatus' ? <PlayPauseIcon className="w-5 h-5" /> : <ArchiveBoxIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left">
                                        <span className="text-xs font-black text-text-primary uppercase tracking-widest">{type} Scans</span>
                                        <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">
                                            {isGenerating === type ? `Found: ${scanProgress.matches}/${DEFAULT_MATCH_LIMIT}` : `Resume at Part ${reportOffsets[type].part} (TMDB Pg ${reportOffsets[type].page})`}
                                        </p>
                                    </div>
                                </div>
                                {isGenerating === type ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4 opacity-20 group-hover:opacity-100" />}
                            </button>
                            <button onClick={() => handleReset(type)} className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </section>
            </div>

            <div className="mt-12">
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-widest whitespace-nowrap">Download Archive</h2>
                    <div className="h-px w-full bg-white/5"></div>
                </div>

                {pdfArchive.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pdfArchive.map(pdf => (
                            <div 
                                key={pdf.id}
                                className="bg-bg-secondary/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary-accent/30 transition-all"
                            >
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate">{pdf.title}</h3>
                                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-1">
                                        Part {pdf.part} • {new Date(pdf.timestamp).toLocaleDateString()} at {new Date(pdf.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => reDownload(pdf)}
                                    className="p-3 bg-bg-primary rounded-xl text-primary-accent hover:bg-primary-accent hover:text-on-accent transition-all shadow-lg"
                                    title="Download Again"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-2 border-dashed border-white/5 opacity-40">
                        <p className="text-xs font-black uppercase tracking-widest">No recently generated reports</p>
                    </div>
                )}
            </div>
            
            <div className="mt-12 p-8 bg-bg-secondary/10 rounded-[2.5rem] border-2 border-dashed border-white/5">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-primary-accent" />
                    Auditing Logic
                </h3>
                <ul className="mt-6 space-y-4 text-sm text-text-secondary font-medium">
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">1</span>
                        The <span className="text-text-primary font-bold">Placeholder Scan</span> identifies content missing official poster, backdrop, or episode still assets. Stills are only checked for episodes aired at least <span className="text-text-primary font-bold">3 days ago</span>. Today's and future releases are ignored to allow time for official artwork to arrive in the registry. This scan is limited to 10 results per segment.
                    </li>
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">2</span>
                        Only shows <span className="text-text-primary font-bold">streaming or airing in the US</span> are targeted to ensure data relevance for tracking.
                    </li>
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">3</span>
                        Portals remember where you stopped. Re-generating a report will pick up <span className="text-text-primary font-bold">immediately</span> after the last item audited.
                    </li>
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">4</span>
                        The <span className="text-text-primary font-bold">Download Archive</span> saves your last 20 reports for quick retrieval without needing a new scan.
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AirtimeManagement;