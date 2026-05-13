import React, { useMemo } from 'react';
import { LotteryType, DrawResult } from '../types.ts';
import { LOTTERY_CONFIG } from '../constants.ts';

interface HeatmapChartProps {
  history: DrawResult[];
  lotteryType: LotteryType;
  onSelectNumber: (num: number) => void;
}

const HeatmapCell: React.FC<{
  number: number;
  stats: any;
  onClick: () => void;
}> = ({ number, stats, onClick }) => {
  const { count, lastSeenIndex, isMomentum, color } = stats;

  const momentumClasses = isMomentum ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'ring-1 ring-white/10';

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full h-12 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-200 transform hover:scale-110 hover:z-10 focus:outline-none focus:z-10 ${momentumClasses}`}
        style={{ backgroundColor: color }}
      >
        {number}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-3 py-2 bg-slate-950 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <p className="font-bold text-base text-center mb-1">Số {number}</p>
        <p><strong>Xuất hiện:</strong> {count} lần</p>
        <p><strong>Lần cuối:</strong> {lastSeenIndex === 0 ? 'Kỳ gần nhất' : `${lastSeenIndex} kỳ trước`}</p>
        {isMomentum && <p className="font-semibold text-cyan-400">Đang tăng xu hướng</p>}
      </div>
    </div>
  );
};

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ history, lotteryType, onSelectNumber }) => {
  const config = LOTTERY_CONFIG[lotteryType];
  const numbers = Array.from({ length: config.range }, (_, i) => i + 1);

  const numberStats = useMemo(() => {
    if (!history || history.length === 0) return new Map();

    const statsMap = new Map();
    const allNumbersHistory = history.flatMap(d => d.numbers);
    const recentHistory = history.slice(0, 10).flatMap(d => d.numbers);
    const maxFreq = Math.max(...numbers.map(num => allNumbersHistory.filter(n => n === num).length));

    for (const num of numbers) {
      const count = allNumbersHistory.filter(n => n === num).length;
      const recentCount = recentHistory.filter(n => n === num).length;
      const lastSeenIndex = history.findIndex(d => d.numbers.includes(num));
      
      const overallRate = count / history.length;
      const recentRate = recentCount / 10;
      const isMomentum = recentRate > overallRate && count > 0;
      
      const normalizedFreq = maxFreq > 0 ? count / maxFreq : 0;
      
      // HSL color: 240 (blue = lạnh) -> 0 (red = nóng)
      const hue = (1 - normalizedFreq) * 240;
      const color = `hsl(${hue}, 80%, ${Math.max(20, 50 * normalizedFreq + 20)}%)`;

      statsMap.set(num, { count, lastSeenIndex: lastSeenIndex === -1 ? history.length : lastSeenIndex, isMomentum, color });
    }
    return statsMap;
  }, [history, numbers]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Bản Đồ Nhiệt Các Số</h2>
        <div className="flex items-center space-x-4 text-xs text-slate-400">
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-600"></div><span>Lạnh</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span>Nóng</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800"></div><span>Xu hướng</span></div>
        </div>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 gap-2">
        {numbers.map(num => (
          <HeatmapCell
            key={num}
            number={num}
            stats={numberStats.get(num) || { count: 0, lastSeenIndex: history.length, isMomentum: false, color: 'hsl(240, 80%, 20%)' }}
            onClick={() => onSelectNumber(num)}
          />
        ))}
      </div>
    </div>
  );
};
