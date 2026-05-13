import React from 'react';
import { PredictionRecord, LotteryConfig, DrawResult, AIStrategy } from '../types.ts';
import { NumberBall } from './NumberBall.tsx';
import { LOTTERY_CONFIG, AI_STRATEGIES } from '../constants.ts';
import { InfoIcon, LockIcon } from './icons.tsx';

interface PredictionHistoryProps {
  predictions: PredictionRecord[];
  drawHistory: DrawResult[];
  onSelectNumber: (num: number) => void;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({ predictions, drawHistory, onSelectNumber }) => {
  const findResult = (prediction: PredictionRecord) => {
    const predictionDate = new Date(prediction.date).getTime();
    const futureDraws = drawHistory
      .filter(draw => 
        LOTTERY_CONFIG[draw.lotteryType as keyof typeof LOTTERY_CONFIG]?.name === prediction.lotteryType &&
        new Date(draw.date).getTime() >= predictionDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const correspondingDraw = futureDraws[0];

    if (!correspondingDraw) {
      return { status: 'Pending' };
    }

    const matchedNumbers = prediction.predictedNumbers.filter(num => correspondingDraw.numbers.includes(num));
    const isSpecialMatched = prediction.specialNumber != null && prediction.specialNumber === correspondingDraw.specialNumber;
    
    return {
      status: 'Complete',
      matchedCount: matchedNumbers.length,
      specialMatched: isSpecialMatched,
      matchedNumbersSet: new Set(matchedNumbers),
    };
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg h-full">
      <h2 className="text-xl font-bold text-white mb-4">Lịch Sử Dự Đoán AI</h2>
      {predictions.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-500 py-10">
          <p>Các dự đoán AI sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[352px] pr-2">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-700/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th scope="col" className="px-4 py-3">Chi tiết</th>
                      <th scope="col" className="px-4 py-3">Dự đoán</th>
                      <th scope="col" className="px-4 py-3">Chiến lược</th>
                      <th scope="col" className="px-4 py-3">Kết quả</th>
                    </tr>
                </thead>
                <tbody>
                    {predictions.map((prediction) => {
                        const config: LotteryConfig = LOTTERY_CONFIG[prediction.lotteryType];
                        const result = findResult(prediction);
                        const lockedNumbersSet = new Set(prediction.lockedNumbers || []);
                        return (
                            <tr key={prediction.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                                    {prediction.lotteryType}<br/>
                                    <span className="font-normal text-slate-500 text-xs">{prediction.date}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {prediction.predictedNumbers.map((num) => (
                                      <button key={`${prediction.id}-${num}`} onClick={() => onSelectNumber(num)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-400">
                                        <NumberBall number={num} className={`${config.ballColor} text-xs`} small isMatched={result.status === 'Complete' && result.matchedNumbersSet.has(num)} isLocked={lockedNumbersSet.has(num)} />
                                      </button>
                                    ))}
                                    {prediction.specialNumber != null && (
                                      <button key={`${prediction.id}-special`} onClick={() => onSelectNumber(prediction.specialNumber!)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-400">
                                        <NumberBall number={prediction.specialNumber} className={`${config.specialBallColor || ''} text-xs`} small isMatched={result.status === 'Complete' && result.specialMatched} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <div className="relative group flex items-center gap-1.5" title={prediction.reasoning}>
                                    {prediction.strategy === 'CO_PILOT' && <LockIcon className="text-sky-400 w-4 h-4" />}
                                    <span>{AI_STRATEGIES[prediction.strategy as AIStrategy]?.label ?? 'N/A'}</span>
                                    <InfoIcon className="text-slate-500 w-4 h-4" />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {result.status === 'Pending' ? (
                                    <span className="text-slate-500">Chờ kết quả</span>
                                  ) : (
                                    <div className="font-semibold">
                                      <span className="text-green-400">{result.matchedCount} / {config.mainNumbers}</span>
                                      {result.specialMatched && <span className="text-green-400 ml-1">+ ĐB</span>}
                                    </div>
                                  )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};