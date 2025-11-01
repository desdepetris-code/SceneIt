import React, { useState } from 'react';
import { UserData, HistoryItem } from '../types';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import { ChevronDownIcon, StarIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';

interface StatsScreenProps {
  userData: UserData;
  genres: Record<number, string>;
}

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card-gradient p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
        {children}
    </div>
);

const StatHighlightCard: React.FC<{ title: string; value: string | number; period: string }> = ({ title, value, period }) => (
    <div className="bg-card-gradient p-4 rounded-lg shadow-md">
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
        <p className="text-xs text-text-secondary/70">{period}</p>
    </div>
);

const HorizontalBarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    if (data.length === 0) return <div className="text-text-secondary text-center h-48 flex items-center justify-center">No genre data available.</div>;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-2">
            {data.map(({ label, value }) => (
                <div key={label} className="flex items-center text-sm">
                    <div className="w-28 text-text-secondary truncate pr-2 text-right">{label}</div>
                    <div className="flex-grow bg-bg-secondary rounded-full h-5">
                        <div
                            className="bg-accent-gradient rounded-full h-5 flex items-center justify-end pr-2 text-white text-xs font-bold"
                            style={{ width: `${(value / maxValue) * 100}%`, transition: 'width 0.5s ease-in-out' }}
                        >
                            {value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const VerticalBarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex justify-around items-end h-48 space-x-2">
            {data.map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center flex-grow text-center w-1/12">
                    <div className="text-xs text-text-secondary font-bold">{value}</div>
                    <div className="w-full bg-bg-secondary rounded-t-md flex-grow mt-1" style={{ minWidth: '10px' }}>
                        <div
                            className="w-full bg-accent-gradient rounded-t-md"
                            style={{ height: `${(value / maxValue) * 100}%`, transition: 'height 0.5s ease-in-out' }}
                        ></div>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">{label}</div>
                </div>
            ))}
        </div>
    );
};

const moodColors: Record<string, string> = {
    '😊': '#4CAF50', '😂': '#FFC107', '😍': '#E91E63',
    '😢': '#2196F3', '🤯': '#9C27B0', '🤔': '#795548', '😠': '#F44336'
};

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) return <div className="text-text-secondary text-center h-48 flex items-center justify-center">No mood data available. Add moods to your journal entries!</div>;

    let cumulativePercent = 0;
    const segments = data.map(item => {
        const percent = (item.value / total) * 100;
        const startAngle = cumulativePercent;
        cumulativePercent += percent;
        return { ...item, percent, startAngle };
    });

    const conicGradient = segments.map(s => `${s.color} ${s.startAngle}% ${s.startAngle + s.percent}%`).join(', ');
    const midGradient = `radial-gradient(var(--color-bg-primary) 55%, transparent 56%)`;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-8">
            <div
                className="w-40 h-40 rounded-full mb-4 sm:mb-0"
                style={{
                    background: `${midGradient}, conic-gradient(${conicGradient})`,
                }}
            ></div>
            <div className="space-y-2">
                {segments.map(s => (
                    <div key={s.label} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: s.color }}></div>
                        <span className="text-3xl">{s.label}</span>
                        <span className="text-sm text-text-secondary ml-2">({s.value} - {s.percent.toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsScreen: React.FC<StatsScreenProps> = ({ userData, genres }) => {
  const stats = useCalculatedStats(userData);
  const [activeFilter, setActiveFilter] = useState<'all' | 'month'>('all');

  const topGenresAllTime = Object.entries(stats.genreDistributionAllTime)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([id, value]) => ({ label: genres[Number(id)] || 'Unknown', value }));
  
  const topGenresThisMonth = Object.entries(stats.genreDistributionThisMonth)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([id, value]) => ({ label: genres[Number(id)] || 'Unknown', value }));

  const topMoods = Object.entries(stats.moodDistribution)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, color: moodColors[label] || '#9CA3AF' }));

  const weeklyActivityData = [
    { label: 'Sun', value: stats.weeklyActivity[0] }, { label: 'Mon', value: stats.weeklyActivity[1] },
    { label: 'Tue', value: stats.weeklyActivity[2] }, { label: 'Wed', value: stats.weeklyActivity[3] },
    { label: 'Thu', value: stats.weeklyActivity[4] }, { label: 'Fri', value: stats.weeklyActivity[5] },
    { label: 'Sat', value: stats.weeklyActivity[6] },
  ];

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Your Stats</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatHighlightCard title="Total Episodes" value={stats.totalEpisodesWatched} period="All Time" />
            <StatHighlightCard title="Total Movies" value={stats.moviesCompleted} period="All Time" />
            <StatHighlightCard title="Total Hours" value={`~${stats.totalHoursWatched}h`} period="All Time" />
            <StatHighlightCard title="Longest Streak" value={`${stats.longestStreak} days`} period="All Time" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartContainer title="Weekly Activity">
                <VerticalBarChart data={weeklyActivityData} />
            </ChartContainer>
            <ChartContainer title="Mood Distribution">
                <DonutChart data={topMoods} />
            </ChartContainer>
        </div>
        
        <ChartContainer title="Monthly Activity (Last 12 Months)">
             <VerticalBarChart data={stats.monthlyActivity.map(m => ({ label: m.month, value: m.count }))} />
        </ChartContainer>

        <ChartContainer title="Top Genres">
            <div className="flex p-1 bg-bg-secondary rounded-full mb-4 self-start">
                <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${activeFilter === 'all' ? 'bg-accent-gradient text-white shadow-lg' : 'text-text-secondary'}`}
                >All Time</button>
                <button
                    onClick={() => setActiveFilter('month')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${activeFilter === 'month' ? 'bg-accent-gradient text-white shadow-lg' : 'text-text-secondary'}`}
                >This Month</button>
            </div>
            <HorizontalBarChart data={activeFilter === 'all' ? topGenresAllTime : topGenresThisMonth} />
        </ChartContainer>
    </div>
  );
};

export default StatsScreen;