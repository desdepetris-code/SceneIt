import React, { useState } from 'react';
import { UserData, HistoryItem } from '../types';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import { ChevronDownIcon } from '../components/Icons';
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
                        <div>
                            <div className="font-bold text-text-primary text-2xl">{s.label}</div>
                            <div className="text-sm text-text-secondary">{s.value} Entries ({s.percent.toFixed(1)}%)</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HistoryLog: React.FC<{ history: HistoryItem[] }> = ({ history }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (history.length === 0) {
        return (
            <ChartContainer title="Watch History Log">
                 <div className="text-text-secondary text-center h-24 flex items-center justify-center">Your watch history is empty.</div>
            </ChartContainer>
        )
    }

    return (
        <div className="bg-card-gradient rounded-lg shadow-md">
             <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="text-lg font-bold text-text-primary">Watch History Log ({history.length} entries)</h3>
                <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="overflow-x-auto p-4 animate-fade-in">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-bg-secondary/50">
                            <tr>
                                <th scope="col" className="px-4 py-2"></th>
                                <th scope="col" className="px-4 py-2">Title</th>
                                <th scope="col" className="px-4 py-2">Type</th>
                                <th scope="col" className="px-4 py-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item, index) => (
                                <tr key={`${item.id}-${item.timestamp}-${index}`} className="border-b border-bg-secondary hover:bg-bg-secondary/30">
                                    <td className="px-4 py-2">
                                        <img src={getImageUrl(item.poster_path, 'w92')} alt="" className="w-8 h-12 object-cover rounded"/>
                                    </td>
                                    <td className="px-4 py-2 font-medium text-text-primary truncate" style={{ maxWidth: '200px' }}>{item.title}</td>
                                    <td className="px-4 py-2 text-text-secondary">
                                        {item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Movie'}
                                    </td>
                                    <td className="px-4 py-2 text-text-secondary">{new Date(item.timestamp).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}


const StatsScreen: React.FC<StatsScreenProps> = ({ userData, genres }) => {
  const stats = useCalculatedStats(userData);

  const topGenresAllTimeData = Object.entries(stats.genreDistributionAllTime)
    .map(([id, value]) => ({ label: genres[Number(id)] || `ID ${id}`, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
  
  const topGenresThisMonthData = stats.topGenresThisMonth
    .map(id => ({ label: genres[id] || `ID ${id}`, value: stats.genreDistributionThisMonth[id] || 0 }))
    .filter(item => item.value > 0);

  const weeklyActivityData = [
    { label: 'Sun', value: stats.weeklyActivity[0] },
    { label: 'Mon', value: stats.weeklyActivity[1] },
    { label: 'Tue', value: stats.weeklyActivity[2] },
    { label: 'Wed', value: stats.weeklyActivity[3] },
    { label: 'Thu', value: stats.weeklyActivity[4] },
    { label: 'Fri', value: stats.weeklyActivity[5] },
    { label: 'Sat', value: stats.weeklyActivity[6] },
  ];
  
  const moodDistributionData = Object.entries(stats.moodDistribution)
    .map(([mood, value]) => ({ label: mood, value, color: moodColors[mood] || '#888' }))
    .sort((a, b) => b.value - a.value);

  const monthlyActivityData = stats.monthlyActivity.map(item => ({
      label: item.month,
      value: item.count
  }));

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Your Stats</h1>
        <p className="text-text-secondary mt-1">A visual overview of your viewing habits.</p>
      </header>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatHighlightCard title="Episodes Watched" value={stats.watchedThisWeek} period="This Week" />
        <StatHighlightCard title="Movies Watched" value={stats.moviesWatchedThisWeek} period="This Week" />
        <StatHighlightCard title="Hours Watched" value={`~${stats.hoursWatchedThisWeek}h`} period="This Week" />
        <StatHighlightCard title="Episodes Watched" value={stats.episodesWatchedThisMonth} period="This Month" />
        <StatHighlightCard title="Movies Watched" value={stats.moviesWatchedThisMonth} period="This Month" />
        <StatHighlightCard title="Hours Watched" value={`~${stats.hoursWatchedThisMonth}h`} period="This Month" />
        <StatHighlightCard title="Episodes Watched" value={stats.episodesWatchedThisYear} period="This Year" />
        <StatHighlightCard title="Movies Watched" value={stats.moviesWatchedThisYear} period="This Year" />
        <StatHighlightCard title="Hours Watched" value={`~${stats.hoursWatchedThisYear}h`} period="This Year" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Top Genres (This Month)">
            <HorizontalBarChart data={topGenresThisMonthData} />
        </ChartContainer>
        <ChartContainer title="Top Genres (All Time)">
            <HorizontalBarChart data={topGenresAllTimeData} />
        </ChartContainer>
        <ChartContainer title="Weekly Activity">
            <VerticalBarChart data={weeklyActivityData} />
        </ChartContainer>
         <ChartContainer title="Monthly Activity (Last 12 Months)">
            <VerticalBarChart data={monthlyActivityData} />
        </ChartContainer>
         <ChartContainer title="Mood Distribution">
            <DonutChart data={moodDistributionData} />
        </ChartContainer>
      </div>
       <div className="mt-8">
            <HistoryLog history={userData.history} />
       </div>
    </div>
  );
};
export default StatsScreen;