import React from 'react';
import { DrawResult, LotteryType } from '../types.ts';
import { LOTTERY_CONFIG } from '../constants.ts';

interface AnalysisWidgetsProps {
  history: DrawResult[];
  lotteryType: LotteryType;
}

interface StatCardProps {
    label: string;
    value: string;
    description: string;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, description, colorClass }) => (
    <div className="bg-slate-800 p-4 rounded-lg flex-1">
        <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">{label}</span>
            <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
);

export const AnalysisWidgets: React.FC<AnalysisWidgetsProps> = ({ history, lotteryType }) => {
  const stats = React.useMemo(() => {
    if (history.length === 0) {
      return { oddEvenRatio: 'N/A', lowHighRatio: 'N/A' };
    }

    const config = LOTTERY_CONFIG[lotteryType];
    const lowHighBoundary = Math.floor(config.range / 2);
    
    let totalNumbers = 0;
    let oddCount = 0;
    let lowCount = 0;

    history.forEach(draw => {
      draw.numbers.forEach(num => {
        totalNumbers++;
        if (num % 2 !== 0) oddCount++;
        if (num <= lowHighBoundary) lowCount++;
      });
    });
    
    const oddRatio = (oddCount / totalNumbers) * 100;
    const evenRatio = 100 - oddRatio;

    const lowRatio = (lowCount / totalNumbers) * 100;
    const highRatio = 100 - lowRatio;

    return {
      oddEvenRatio: `${oddRatio.toFixed(0)}% / ${evenRatio.toFixed(0)}%`,
      lowHighRatio: `${lowRatio.toFixed(0)}% / ${highRatio.toFixed(0)}%`,
    };
  }, [history, lotteryType]);

  return (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Phân Tích Lịch Sử</h2>
        <div className="flex flex-col sm:flex-row gap-4">
            <StatCard 
                label="Lẻ / Chẵn" 
                value={stats.oddEvenRatio}
                description="Tỷ lệ phân bổ số lẻ và số chẵn trong tất cả các kỳ quay."
                colorClass="text-cyan-400"
            />
            <StatCard 
                label="Thấp / Cao" 
                value={stats.lowHighRatio}
                description="Tỷ lệ phân bổ số thấp và số cao trong tất cả các kỳ quay."
                colorClass="text-amber-400"
            />
        </div>
    </div>
  );
};
