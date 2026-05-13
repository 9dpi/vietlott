import React, { useState, useCallback, useEffect } from 'react';
import { getPrediction } from '../services/geminiService.ts';
import { LotteryType, DrawResult, LotteryConfig, AIStrategy, PredictionRecord } from '../types.ts';
import { NumberBall } from './NumberBall.tsx';
import { LOTTERY_CONFIG, AI_STRATEGIES } from '../constants.ts';
import { BrainCircuitIcon } from './icons.tsx';

interface PredictionPanelProps {
  lotteryType: LotteryType;
  history: DrawResult[];
  onPredictionGenerated: (prediction: Omit<PredictionRecord, 'id' | 'date'>) => void;
  isSimulationActive: boolean;
  onRequestApiKey: () => void;
}

const StrategySelector: React.FC<{
  selectedStrategy: AIStrategy;
  onSelectStrategy: (strategy: AIStrategy) => void;
  disabled: boolean;
}> = ({ selectedStrategy, onSelectStrategy, disabled }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-white mb-3 text-center">Chọn Chiến Lược AI</h3>
    <div className={`flex flex-col sm:flex-row justify-center gap-2 bg-slate-900/50 p-2 rounded-xl ${disabled ? 'opacity-50' : ''}`}>
      {(Object.keys(AI_STRATEGIES) as AIStrategy[]).map(key => (
        <button
          key={key}
          onClick={() => onSelectStrategy(key)}
          disabled={disabled || key === 'CO_PILOT'}
          className={`flex-1 text-center px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-brand-yellow ${
            selectedStrategy === key
              ? 'bg-slate-700 text-white font-bold shadow-md'
              : 'bg-transparent text-slate-400 hover:bg-slate-700/50'
          } ${key === 'CO_PILOT' ? 'hidden' : ''} ${disabled && key !== selectedStrategy ? 'cursor-not-allowed' : ''}`}
        >
          <p className="font-semibold">{AI_STRATEGIES[key].label}</p>
          <p className="text-xs hidden sm:block">{AI_STRATEGIES[key].description}</p>
        </button>
      ))}
       {selectedStrategy === 'CO_PILOT' && (
         <div className="flex-1 text-center px-4 py-2 rounded-lg bg-slate-700 text-white font-bold shadow-md">
           <p className="font-semibold">{AI_STRATEGIES['CO_PILOT'].label}</p>
           <p className="text-xs hidden sm:block">{AI_STRATEGIES['CO_PILOT'].description}</p>
         </div>
       )}
    </div>
  </div>
);

const CoPilotPanel: React.FC<{
    config: LotteryConfig;
    lockedNumbers: number[];
    onLockChange: (numbers: number[]) => void;
}> = ({ config, lockedNumbers, onLockChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9, ]/g, '');
        setInputValue(value);
        
        const nums = value.split(/[\s,]+/).filter(Boolean).map(Number);
        if (nums.length > 2) {
            setError('Bạn chỉ được khóa tối đa 2 số.');
            return;
        }

        const uniqueNums = [...new Set(nums)];
        if (uniqueNums.some(n => n < 1 || n > config.range)) {
            setError(`Các số phải nằm trong khoảng từ 1 đến ${config.range}.`);
            return;
        }

        setError('');
        onLockChange(uniqueNums);
    };

    return (
        <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">AI Đồng Hành (Tùy chọn)</h3>
            <p className="text-sm text-slate-400 mb-3">Khóa các số may mắn của bạn, AI sẽ tìm những số bổ sung tốt nhất.</p>
            <input 
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="VD: 7, 21"
                className="bg-slate-900 border border-slate-600 rounded-md p-2 w-full max-w-xs text-center focus:ring-2 focus:ring-brand-yellow focus:outline-none"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
};


export const PredictionPanel: React.FC<PredictionPanelProps> = ({ lotteryType, history, onPredictionGenerated, isSimulationActive, onRequestApiKey }) => {
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const [specialPrediction, setSpecialPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<AIStrategy>('BALANCED');
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [lockedNumbers, setLockedNumbers] = useState<number[]>([]);

  const config: LotteryConfig = LOTTERY_CONFIG[lotteryType];

  useEffect(() => {
    setPrediction(null);
    setSpecialPrediction(null);
    setError(null);
  }, [history]);

  useEffect(() => {
    if (lockedNumbers.length > 0) {
      setStrategy('CO_PILOT');
    } else if (strategy === 'CO_PILOT') {
      setStrategy('BALANCED');
    }
  }, [lockedNumbers, strategy]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setSpecialPrediction(null);
    setReasoning(null);

    try {
      const result = await getPrediction(lotteryType, history, strategy, lockedNumbers);
      if (result.predictedNumbers && result.predictedNumbers.length > 0) {
        setPrediction(result.predictedNumbers);
        setReasoning(result.reasoning);
        if (result.specialNumber) {
            setSpecialPrediction(result.specialNumber);
        }
        onPredictionGenerated({
            lotteryType: lotteryType,
            predictedNumbers: result.predictedNumbers,
            specialNumber: result.specialNumber,
            strategy: strategy,
            reasoning: result.reasoning,
            lockedNumbers: lockedNumbers.length > 0 ? lockedNumbers : undefined
        });
      } else {
        setError('AI không thể tạo dự đoán. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        onRequestApiKey();
        setError('Vui lòng cung cấp Gemini API Key để sử dụng tính năng AI.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
        setError(`Lỗi khi kết nối với AI. ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lotteryType, history, onPredictionGenerated, strategy, lockedNumbers, onRequestApiKey]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-white mb-2 text-center">Dự Đoán Số AI</h2>
      <p className="text-slate-400 mb-6 text-center">AI phân tích dữ liệu lịch sử để đề xuất các con số may mắn cho bạn.</p>
      
      <CoPilotPanel config={config} lockedNumbers={lockedNumbers} onLockChange={setLockedNumbers} />
      <div className="w-full border-t border-slate-700/50 my-6"></div>
      <StrategySelector selectedStrategy={strategy} onSelectStrategy={setStrategy} disabled={lockedNumbers.length > 0} />

      <div className="flex justify-center mb-6">
        <button
          onClick={handleGenerate}
          disabled={isLoading || (isSimulationActive && !!prediction)}
          className="flex items-center justify-center space-x-3 bg-gradient-to-r from-brand-red to-orange-500 hover:from-brand-red hover:to-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Đang tạo dự đoán...</span>
            </>
          ) : (
            <>
              <BrainCircuitIcon className="w-6 h-6" />
              <span>Tạo Dự Đoán</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="text-center bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg mt-4">{error}</div>}
      
      {(prediction || specialPrediction) && (
        <div className="mt-6 bg-slate-900/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-center text-slate-300 mb-4">Các Số AI Đề Xuất:</h3>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {prediction?.map(num => <NumberBall key={num} number={num} className={config.ballColor} isLocked={lockedNumbers.includes(num)} />)}
            {specialPrediction != null && <NumberBall number={specialPrediction} className={config.specialBallColor || ''} />}
          </div>
          {reasoning && (
             <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-slate-300">Lý giải của AI:</p>
                <p className="text-xs text-slate-400 italic">"{reasoning}"</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};