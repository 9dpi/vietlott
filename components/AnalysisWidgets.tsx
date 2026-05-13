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
      return { oddEvenRatio: 'N/A', lowHighRatio: 'N/A', hottestNumber: 'N/A', avgSum: 'N/A', totalDraws: 0 };
    }

    const config = LOTTERY_CONFIG[lotteryType];
    const lowHighBoundary = Math.floor(config.range / 2);
    
    let totalNumbers = 0;
    let oddCount = 0;
    let lowCount = 0;
    let totalSum = 0;
    const freqMap = new Map<number, number>();

    history.forEach(draw => {
      let drawSum = 0;
      draw.numbers.forEach(num => {
        totalNumbers++;
        drawSum += num;
        if (num % 2 !== 0) oddCount++;
        if (num <= lowHighBoundary) lowCount++;
        freqMap.set(num, (freqMap.get(num) || 0) + 1);
      });
      totalSum += drawSum;
    });
    
    const oddRatio = (oddCount / totalNumbers) * 100;
    const evenRatio = 100 - oddRatio;

    const lowRatio = (lowCount / totalNumbers) * 100;
    const highRatio = 100 - lowRatio;

    // Find hottest number
    let hottestNum = 0;
    let maxFreq = 0;
    freqMap.forEach((freq, num) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        hottestNum = num;
      }
    });

    const avgSum = totalSum / history.length;

    return {
      oddEvenRatio: `${oddRatio.toFixed(0)}% / ${evenRatio.toFixed(0)}%`,
      lowHighRatio: `${lowRatio.toFixed(0)}% / ${highRatio.toFixed(0)}%`,
      hottestNumber: `${hottestNum} (${maxFreq} lần)`,
      avgSum: Math.round(avgSum).toString(),
      totalDraws: history.length
    };
  }, [history, lotteryType]);

  return (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Phân Tích Lịch Sử</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                label="Tổng Số Kỳ Quay" 
                value={stats.totalDraws.toLocaleString('vi-VN')}
                description="Khối lượng dữ liệu lịch sử đang được AI phân tích."
                colorClass="text-emerald-400"
            />
            <StatCard 
                label="Số Nóng Nhất" 
                value={stats.hottestNumber}
                description="Con số xuất hiện nhiều lần nhất trong lịch sử."
                colorClass="text-brand-red"
            />
            <StatCard 
                label="Lẻ / Chẵn" 
                value={stats.oddEvenRatio}
                description="Tỷ lệ phân bổ số lẻ và số chẵn."
                colorClass="text-cyan-400"
            />
            <StatCard 
                label="Tổng Trung Bình" 
                value={stats.avgSum}
                description="Tổng trung bình của 6 số trong một kết quả quay."
                colorClass="text-amber-400"
            />
        </div>
    </div>
  );
};
