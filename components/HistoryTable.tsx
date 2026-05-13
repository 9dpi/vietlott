import React from 'react';
import { LotteryType, DrawResult, LotteryConfig } from '../types.ts';
import { NumberBall } from './NumberBall.tsx';
import { LOTTERY_CONFIG } from '../constants.ts';

interface HistoryTableProps {
  data: DrawResult[];
  lotteryType: LotteryType;
  onSelectNumber: (num: number) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ data, lotteryType, onSelectNumber }) => {
  const config: LotteryConfig = LOTTERY_CONFIG[lotteryType];

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg h-full">
      <h2 className="text-xl font-bold text-white mb-4">Kết Quả Gần Đây</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="px-4 py-3">Kỳ quay</th>
              <th scope="col" className="px-4 py-3">Các số</th>
            </tr>
          </thead>
          <tbody>
            {data.map((draw) => (
              <tr key={draw.drawId} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                  #{draw.drawId}<br/>
                  <span className="font-normal text-slate-500 text-xs">{draw.date}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 items-center">
                    {draw.numbers.map((num) => (
                      <button key={num} onClick={() => onSelectNumber(num)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-400">
                        <NumberBall number={num} className={`${config.ballColor} text-xs`} small />
                      </button>
                    ))}
                    {draw.specialNumber != null && (
                        <button onClick={() => onSelectNumber(draw.specialNumber!)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-400">
                            <NumberBall number={draw.specialNumber} className={`${config.specialBallColor} text-xs`} small />
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};