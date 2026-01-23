import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TrackedItem, DownloadedPdf, CustomImagePaths, ReportType, CastMember, CrewMember, AppNotification, NotificationSettings } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
import { generateAirtimePDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, LockClosedIcon, SparklesIcon, DownloadIcon, PhotoIcon, TvIcon, FilmIcon, SearchIcon, XMarkIcon, UserIcon, MegaphoneIcon, TrashIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';
import * as pushNotificationService from '../services/pushNotificationService';
import BroadcastModal from '../components/BroadcastModal';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
}

const MASTER_PIN = "999236855421340";
const DEFAULT_MATCH_LIMIT = 100;

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
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [downloadedPdfs, setDownloadedPdfs] = useLocalStorage<DownloadedPdf[]>('cinemontauge_reports', []);

    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, ReportOffset>>('cinemontauge_report_offsets', {
        ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        hiatus: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        legacy: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        integrity: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        deep_ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_movies: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        placeholder_episodes: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        library: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        no_recommendations: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_people: { page: 1, index: 0, part: 1, mediaType: 'tv' }
    });

    const deviceCount = useMemo(() => {
        const globalRegistryStr = localStorage.getItem('sceneit_global_device_tokens');
        const globalRegistry = globalRegistryStr ? JSON.parse(globalRegistryStr) : [];
        return globalRegistry.length;
    }, []);

    const handleGlobalBroadcast = async (title: string, message: string) => {
        confirmationService.show("Preparing global broadcast...");
        try {
            await pushNotificationService.triggerLocalNotification(title, message);
            const usersJson = localStorage.getItem('sceneit_users');
            const allUsers = usersJson ? JSON.parse(usersJson) : [];
            allUsers.forEach((user: any) => {
                const userNotifKey = `notifications_${user.id}`;
                const userNotifsStr = localStorage.getItem(userNotifKey);
                const userNotifs = userNotifsStr ? JSON.parse(userNotifsStr) : [];
                const newNotif: AppNotification = {
                    id: `broadcast-${Date.now()}-${user.id}`,
                    type: 'app_update',
                    title: title,
                    description: message,
                    timestamp: new Date().toISOString(),
                    read: false
                };
                localStorage.setItem(userNotifKey, JSON.stringify([newNotif, ...userNotifs].slice(0, 50)));
            });
            const guestNotifKey = 'notifications_guest';
            const guestNotifsStr = localStorage.getItem(guestNotifKey);
            const guestNotifs = guestNotifsStr ? JSON.parse(guestNotifsStr) : [];
            localStorage.setItem(guestNotifKey, JSON.stringify([{
                id: `broadcast-${Date.now()}-guest`,
                type: 'app_update',
                title: title,
                description: message,
                timestamp: new Date().toISOString(),
                read: false
            }, ...guestNotifs].slice(0, 50)));
            confirmationService.show("Global broadcast successfully dispatched.");
        } catch (e) {
            console.error(e);
            alert("Broadcast failed.");
        }
    };

    const runAuditReport = async (type: ReportType, label: string) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });
        const rows: { title: string; status: string; details: string }[] = [];
        const offset = reportOffsets[type];
        
        try {
            let currentPage = offset.page;
            let currentMatches = 0;

            while (currentMatches < DEFAULT_MATCH_LIMIT && currentPage < offset.page + 5) {
                const data = await discoverMediaPaginated(offset.mediaType, { page: currentPage, sortBy: 'popularity.desc' });
                if (!data || data.results.length === 0) break;

                for (let i = (currentPage === offset.page ? offset.index : 0); i < data.results.length; i++) {
                    const item = data.results[i];
                    setScanProgress(prev => ({ ...prev, current: i, total: data.results.length, matches: currentMatches }));
                    
                    const hasTruth = !!AIRTIME_OVERRIDES[item.id];
                    const shouldInclude = (type === 'ongoing' && !hasTruth); // Example filter

                    if (shouldInclude) {
                        rows.push({
                            title: item.title || item.name || 'Unknown',
                            status: item.media_type.toUpperCase(),
                            details: `TMDB ID: ${item.id} • Popularity: ${Math.round(item.popularity || 0)}`
                        });
                        currentMatches++;
                    }

                    if (currentMatches >= DEFAULT_MATCH_LIMIT) {
                        setReportOffsets(prev => ({
                            ...prev,
                            [type]: { ...prev[type], page: currentPage, index: i + 1, part: prev[type].part + 1 }
                        }));
                        break;
                    }
                }
                if (currentMatches >= DEFAULT_MATCH_LIMIT) break;
                currentPage++;
            }

            if (rows.length > 0) {
                generateAirtimePDF(label, rows, offset.part);
                const newReport: DownloadedPdf = {
                    id: `rep-${Date.now()}`,
                    title: `${label} (Part ${offset.part})`,
                    timestamp: new Date().toISOString(),
                    part: offset.part,
                    rows: rows
                };
                setDownloadedPdfs(prev => [newReport, ...prev].slice(0, 20));
                confirmationService.show(`Registry Report Generated: ${rows.length} entries.`);
            } else {
                confirmationService.show("No gaps found in this block.");
            }
        } catch (e) {
            console.error(e);
            confirmationService.show("Audit failed.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleDeletePdf = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Remove this report from history?")) {
            setDownloadedPdfs(prev => prev.filter(p => p.id !== id));
        }
    };

    const handlePinInput = useCallback((digit: string) => {
        setPin(prev => {
            if (prev.length >= 15) return prev;
            const newPin = prev + digit;
            if (newPin.length === 15) {
                if (newPin === MASTER_PIN) setIsAuthorized(true);
                else {
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

    const libraryStats = useMemo(() => {
        const combined = [...userData.watching, ...userData.onHold, ...userData.allCaughtUp, ...userData.completed];
        const unique = Array.from(new Map(combined.map(i => [i.id, i])).values());
        const tv = unique.filter(i => i.media_type === 'tv');
        const truthVerified = tv.filter(show => !!AIRTIME_OVERRIDES[show.id]);
        return {
            totalShows: tv.length,
            truthVerified: truthVerified.length,
            missingTruths: tv.length - truthVerified.length
        };
    }, [userData]);

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4 animate-fade-in">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-8 flex justify-center">
                        <div className={`p-6 rounded-[2rem] bg-bg-secondary/40 border-4 transition-all duration-500 ${pinError ? 'border-red-500 scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-primary-accent/20 shadow-2xl shadow-primary-accent/10'}`}>
                            <LockClosedIcon className={`w-12 h-12 ${pinError ? 'text-red-500 animate-shake' : 'text-primary-accent'}`} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-2">CineMontauge Admin</h2>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] mb-8 opacity-60">Enter Master Token Sequence</p>
                    <div className="flex justify-center gap-3 mb-10">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-primary-accent scale-125 shadow-[0_0_8px_var(--color-accent-primary)]' : 'bg-bg-secondary border border-white/10'}`}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                            <button key={d} onClick={() => handlePinInput(String(d))} className="py-4 text-xl font-black rounded-2xl bg-bg-secondary/30 border border-white/5 text-text-primary hover:bg-bg-secondary transition-all active:scale-95 shadow-md">{d}</button>
                        ))}
                        <button onClick={() => setPin('')} className="py-4 text-xs font-black uppercase text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">Clear</button>
                        <button onClick={() => handlePinInput('0')} className="py-4 text-xl font-black rounded-2xl bg-bg-secondary/30 border border-white/5 text-text-primary hover:bg-bg-secondary transition-all active:scale-95 shadow-md">0</button>
                        <button onClick={onBack} className="py-4 text-xs font-black uppercase text-text-secondary hover:bg-bg-secondary/10 rounded-2xl transition-all">Exit</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-6 pb-40">
            <BroadcastModal 
                isOpen={isBroadcastModalOpen}
                onClose={() => setIsBroadcastModalOpen(false)}
                onSend={handleGlobalBroadcast}
                deviceCount={deviceCount}
            />

            <header className="flex items-center mb-10 relative">
                <button onClick={onBack} className="absolute left-0 p-3 bg-bg-secondary rounded-full text-text-primary hover:text-primary-accent transition-all"><ChevronLeftIcon className="h-6 w-6" /></button>
                <h1 className="text-4xl font-black text-text-primary text-center w-full uppercase tracking-tighter">Admin Portal</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    {/* GLOBAL BROADCAST CONSOLE */}
                    <div className="bg-card-gradient p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-500 shadow-inner">
                                <MegaphoneIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter leading-none">Global Broadcast</h3>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-2 opacity-60">Dispatch alerts to all devices</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-bg-primary/40 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Devices</p>
                                <p className="text-2xl font-black text-text-primary">{deviceCount}</p>
                            </div>
                            <div className="p-4 bg-bg-primary/40 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Status</p>
                                <p className="text-2xl font-black text-green-400">ONLINE</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] bg-yellow-500 text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
                        >
                            <SparklesIcon className="w-4 h-4 animate-pulse" />
                            Create System Broadcast
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </button>
                    </div>

                    <div className="bg-card-gradient p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-accent/20 rounded-2xl text-primary-accent shadow-inner">
                                <ArchiveBoxIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter leading-none">Registry Archives</h3>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-2 opacity-60">Generated Reports & Audits</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {downloadedPdfs.length > 0 ? downloadedPdfs.map(pdf => (
                                <div key={pdf.id} className="flex items-center justify-between p-4 bg-bg-primary/40 rounded-2xl border border-white/5 group hover:border-primary-accent/30 transition-all">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-text-primary uppercase tracking-tight truncate">{pdf.title}</p>
                                        <p className="text-[8px] font-bold text-text-secondary uppercase opacity-50 mt-0.5">{new Date(pdf.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => generateAirtimePDF(pdf.title, pdf.rows, pdf.part)}
                                            className="p-2 bg-primary-accent/10 text-primary-accent rounded-xl hover:bg-primary-accent hover:text-on-accent transition-all"
                                            title="Re-download PDF"
                                        >
                                            <DownloadIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeletePdf(e, pdf.id)}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                            title="Delete Archive"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-10 text-center opacity-30">
                                    <InformationCircleIcon className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No reports archived</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="p-8 bg-primary-accent/10 border border-primary-accent/20 rounded-[2.5rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-primary-accent" />
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Coverage</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-bg-primary/40 rounded-2xl border border-white/5">
                                <span className="text-2xl font-black text-text-primary block">{libraryStats.truthVerified}</span>
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Verified</span>
                            </div>
                            <div className="p-4 bg-bg-primary/40 rounded-2xl border border-white/5">
                                <span className="text-2xl font-black text-red-500 block">{libraryStats.missingTruths}</span>
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Truth Gaps</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-bg-secondary/40 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-[0.2em]">Diagnostic Scanners</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                onClick={() => runAuditReport('ongoing', 'Gap Audit: Ongoing')}
                                disabled={!!isGenerating}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-bg-primary/60 border border-white/5 hover:border-primary-accent/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <ArrowPathIcon className={`w-5 h-5 text-primary-accent ${isGenerating === 'ongoing' ? 'animate-spin' : ''}`} />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-text-primary">Ongoing Gap Scan</span>
                                </div>
                                <span className="text-[9px] font-bold text-text-secondary opacity-40">Block: {reportOffsets.ongoing.part}</span>
                            </button>
                            
                            {isGenerating && (
                                <div className="p-4 bg-primary-accent/10 rounded-2xl border border-primary-accent/20 animate-pulse">
                                    <div className="flex justify-between items-center text-[10px] font-black text-primary-accent uppercase tracking-widest mb-2">
                                        <span>Analyzing Block...</span>
                                        <span>{scanProgress.matches} found</span>
                                    </div>
                                    <div className="w-full bg-bg-primary rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-primary-accent h-full transition-all duration-300"
                                            style={{ width: `${(scanProgress.current / (scanProgress.total || 20)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AirtimeManagement;