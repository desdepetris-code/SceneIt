import React, { useMemo } from 'react';

interface GenrePieChartProps {
  genres: { id: number; name: string }[];
}

const genreColors: Record<string, string> = {
    'Action & Adventure': '#ef4444', 'Animation': '#f97316', 'Comedy': '#eab308',
    'Crime': '#84cc16', 'Documentary': '#22c55e', 'Drama': '#3b82f6',
    'Family': '#6366f1', 'Kids': '#8b5cf6', 'Mystery': '#a855f7',
    'News': '#d946ef', 'Reality': '#ec4899', 'Sci-Fi & Fantasy': '#14b8a6',
    'Soap': '#f43f5e', 'Talk': '#6b7280', 'War & Politics': '#78350f',
    'Western': '#92400e', 'Action': '#ef4444', 'Adventure': '#f97316',
    'Science Fiction': '#14b8a6', 'Fantasy': '#8b5cf6', 'History': '#a16207',
    'Horror': '#7f1d1d', 'Music': '#d946ef', 'Romance': '#ec4899',
    'Thriller': '#374151', 'War': '#78350f', 'TV Movie': '#64748b'
};
const defaultColor = '#6b7280';

const GenrePieChart: React.FC<GenrePieChartProps> = ({ genres }) => {
  const total = genres.length;
  if (total === 0) return null;

  const chartData = useMemo(() => {
    let cumulativePercent = 0;
    const segments = genres.map(genre => {
        const percent = (1 / total) * 100;
        const color = genreColors[genre.name] || defaultColor;
        const startAngle = cumulativePercent;
        cumulativePercent += percent;
        return { name: genre.name, percent, color, startAngle };
    });
    return segments;
  }, [genres, total]);

  const conicGradient = chartData.map(s => `${s.color} ${s.startAngle}% ${s.startAngle + s.percent}%`).join(', ');
  
  const textSummary = useMemo(() => {
    if (total === 1) {
        return `This is a ${chartData[0].name} title.`;
    }
    const primaryGenre = chartData[0];
    const secondaryGenres = chartData.slice(1);
    
    let summary = `Primarily ${primaryGenre.name} (${primaryGenre.percent.toFixed(0)}%)`;
    if (secondaryGenres.length > 0) {
        summary += ` with ${secondaryGenres.map(g => `${g.name} (${g.percent.toFixed(0)}%)`).join(' and ')} elements.`;
    } else {
        summary += '.';
    }
    return summary;
  }, [chartData, total]);

  return (
    <div className="mt-6">
        <h3 className="text-xl font-bold text-text-primary mb-3">Genre Breakdown</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
                className="w-32 h-32 rounded-full flex-shrink-0"
                style={{
                    background: `conic-gradient(${conicGradient})`,
                }}
                role="img"
                aria-label={`Pie chart showing genres: ${chartData.map(d => `${d.name} ${d.percent.toFixed(0)}%`).join(', ')}`}
            ></div>
            <div className="flex-grow">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {chartData.map(item => (
                        <div key={item.name} className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm text-text-primary">{item.name} <span className="text-text-secondary">({item.percent.toFixed(0)}%)</span></span>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-text-secondary mt-4 italic">{textSummary}</p>
            </div>
        </div>
    </div>
  );
};

export default GenrePieChart;
