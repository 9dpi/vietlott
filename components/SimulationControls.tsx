import React from 'react';
import { DrawResult, PredictionRecord } from '../types.ts';

interface SimulationControlsProps {
  isSimulationMode: boolean;
  onToggle: (active: boolean) => void;
  simulationDate: string;
  onDateChange: (date: string) => void;
  onReveal: () => void;
  history: DrawResult[];
  latestPrediction: PredictionRecord | undefined;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isSimulationMode,
  onToggle,
  simulationDate,
  onDateChange,
  onReveal,
  history,
  latestPrediction,
}) => {
  const minDate = history.length > 0 ? new Date(history[history.length - 1].date).toISOString().split('T')[0] : '2024-01-01';
  const maxDate = history.length > 0 ? new Date(history[0].date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const canReveal = isSimulationMode && latestPrediction && new Date(latestPrediction.date).getTime() === new Date(simulationDate).getTime();

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-8 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label htmlFor="sim-toggle" className="flex items-center cursor-pointer">
            <span className="text-lg font-bold text-white mr-3">Chế Độ Mô Phỏng</span>
            <div className="relative">
              <input id="sim-toggle" type="checkbox" className="sr-only" checked={isSimulationMode} onChange={(e) => onToggle(e.target.checked)} />
              <div className="block bg-slate-700 w-14 h-8 rounded-full"></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isSimulationMode ? 'translate-x-6 bg-brand-yellow' : ''}`}></div>
            </div>
          </label>
        </div>

        {isSimulationMode && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="sim-date" className="text-sm font-medium text-slate-300">Ngày kiểm tra:</label>
              <input
                id="sim-date"
                type="date"
                value={simulationDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={minDate}
                max={maxDate}
                className="bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-yellow focus:outline-none"
              />
            </div>
            <button
              onClick={onReveal}
              disabled={!canReveal}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canReveal ? "Hãy tạo dự đoán cho ngày đã chọn trước khi xem kết quả." : "Xem kết quả kỳ tiếp theo"}
            >
              Xem Kết Quả
            </button>
          </div>
        )}
      </div>
      {isSimulationMode && (
        <p className="text-center text-xs text-yellow-300/80 mt-3 pt-3 border-t border-slate-700/50">
          <strong>Chế Độ Mô Phỏng Đang Bật:</strong> Toàn bộ dữ liệu và dự đoán dựa trên trạng thái tại ngày {new Date(simulationDate).toLocaleDateString('vi-VN')}.
        </p>
      )}
    </div>
  );
};