import React, { useState, useEffect } from 'react';
import { PredictionRecord, DrawResult, LotteryType } from '../types';
import { predictionAnalysisService, AccuracyMetrics } from '../services/predictionAnalysisService';
import { backtestService } from '../services/backtestService';
import { toast } from 'react-hot-toast';

interface SelfLearningPanelProps {
  isOpen: boolean;
  onClose: () => void;
  predictionHistory: PredictionRecord[];
  drawHistory: DrawResult[];
  lotteryType: LotteryType;
}

const StatBadge: React.FC<{ value: string | number; label: string; color?: string }> = ({ value, label, color = 'text-indigo-400' }) => (
  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-400 mt-1">{label}</p>
  </div>
);

const TrendArrow: React.FC<{ trend: number }> = ({ trend }) => {
  if (trend > 0.02) return <span className="text-emerald-400">↑ Improving</span>;
  if (trend < -0.02) return <span className="text-red-400">↓ Declining</span>;
  return <span className="text-slate-400">→ Stable</span>;
};

export const SelfLearningPanel: React.FC<SelfLearningPanelProps> = ({
  isOpen, onClose, predictionHistory, drawHistory, lotteryType
}) => {
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runAnalysis = () => {
    setIsAnalyzing(true);

    // Load existing accuracy history
    predictionAnalysisService.loadAccuracyHistory();

    // Analyze unanalyzed predictions
    let newAnalyses = 0;
    for (const prediction of predictionHistory) {
      if (prediction.lotteryType !== lotteryType) continue;
      
      // Find the actual draw that occurred on or after this prediction
      const predDate = new Date(prediction.date).getTime();
      const actualDraw = drawHistory
        .filter(d => d.lotteryType === lotteryType && new Date(d.date).getTime() >= predDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      if (actualDraw) {
        try {
          predictionAnalysisService.analyzePrediction(prediction, actualDraw);
          newAnalyses++;
        } catch {
          // Already analyzed or type mismatch — skip
        }
      }
    }

    // Get updated metrics
    const updatedMetrics = predictionAnalysisService.getAccuracyMetrics();
    const updatedInsights = predictionAnalysisService.generateInsights(lotteryType, 60);
    const updatedRecs = predictionAnalysisService.getImprovementRecommendations(lotteryType);

    setMetrics(updatedMetrics);
    setInsights(updatedInsights.map(i => i.description));
    setRecommendations(updatedRecs);
    setLastRun(new Date().toLocaleTimeString('vi-VN'));
    setIsAnalyzing(false);
  };

  const trainFromHistory = async () => {
    if (drawHistory.length < 50) {
      toast.error('Cần ít nhất 50 kỳ quay để tự học từ lịch sử.');
      return;
    }

    setIsAnalyzing(true);
    toast.loading('Đang tự học từ dữ liệu lịch sử...', { id: 'training' });

    try {
      // Simulate predictions using BacktestService on the last 200 available draws
      const result = await backtestService.runBacktest(
        {
          lotteryType,
          strategy: 'BALANCED',
          lookbackPeriod: 20,
          testDraws: Math.min(200, drawHistory.length - 20)
        },
        drawHistory
      );

      // Inject simulated results into PredictionAnalysisService
      let count = 0;
      for (const r of result.results) {
        const mockPrediction: PredictionRecord = {
          id: `mock-${r.drawId}`,
          date: r.drawDate,
          lotteryType,
          predictedNumbers: r.predictedNumbers,
          specialNumber: r.specialNumberPredicted,
          strategy: 'BALANCED',
          reasoning: 'Retroactive simulation'
        };

        const actualDraw = drawHistory.find(d => d.drawId === r.drawId);
        if (actualDraw) {
          try {
            predictionAnalysisService.analyzePrediction(mockPrediction, actualDraw);
            count++;
          } catch { /* ignore duplicates */ }
        }
      }

      toast.success(`Đã học xong từ ${count} kỳ quay lịch sử!`, { id: 'training' });
      runAnalysis(); // reload metrics
    } catch (error) {
      toast.error('Lỗi khi học từ lịch sử.', { id: 'training' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen, predictionHistory.length, drawHistory.length]);

  if (!isOpen) return null;

  const pendingPredictions = predictionHistory.filter(p => {
    if (p.lotteryType !== lotteryType) return false;
    const predDate = new Date(p.date).getTime();
    return !drawHistory.some(d => d.lotteryType === lotteryType && new Date(d.date).getTime() >= predDate);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🧠</span> Hệ Thống Tự Học
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              AI phân tích dự đoán cũ để liên tục cải thiện độ chính xác
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={trainFromHistory}
              disabled={isAnalyzing || drawHistory.length < 50}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Chạy mô phỏng trên lịch sử để AI học hỏi các mẫu hình"
            >
              <span>📚</span> Học từ Dữ liệu
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Last run */}
          {lastRun && (
            <p className="text-xs text-slate-500 text-center">
              Phân tích lần cuối: {lastRun} · {predictionHistory.length} dự đoán · {pendingPredictions.length} chờ kết quả
            </p>
          )}

          {/* Metrics */}
          {metrics && metrics.totalPredictions > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBadge value={metrics.totalPredictions} label="Tổng đã phân tích" />
                <StatBadge value={`${(metrics.averageAccuracy * 100).toFixed(1)}%`} label="Độ chính xác TB" color="text-violet-400" />
                <StatBadge value={`${(metrics.bestAccuracy * 100).toFixed(1)}%`} label="Kết quả tốt nhất" color="text-emerald-400" />
                <StatBadge value={`${(metrics.recentPerformance * 100).toFixed(1)}%`} label="Gần đây (10 lần)" color="text-amber-400" />
              </div>

              {/* Trend */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Xu Hướng Độ Chính Xác</p>
                    <p className="text-xs text-slate-500 mt-0.5">So với 10 dự đoán trước</p>
                  </div>
                  <div className="text-lg font-bold">
                    <TrendArrow trend={metrics.improvementTrend} />
                  </div>
                </div>

                {/* Simple visual trend bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-20">Gần đây</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${Math.min(metrics.recentPerformance * 100 * 6, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{(metrics.recentPerformance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-20">Tổng thể</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-slate-500"
                        style={{ width: `${Math.min(metrics.averageAccuracy * 100 * 6, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{(metrics.averageAccuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <span>💡</span> Phân Tích Thống Kê
                  </h3>
                  <ul className="space-y-2">
                    {insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-700/30">
                  <h3 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                    <span>🎯</span> Khuyến Nghị AI
                  </h3>
                  <ul className="space-y-2">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-white mb-2">Chưa Đủ Dữ Liệu</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Hãy tạo dự đoán và chờ kết quả thực tế. Hệ thống sẽ tự động
                so sánh và học hỏi từ mỗi dự đoán bạn thực hiện.
              </p>
              <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
                <p className="text-xs font-semibold text-slate-300 mb-2">Cách hoạt động:</p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Tạo dự đoán AI cho kỳ quay hôm nay</li>
                  <li>Sau kỳ quay, nhấn &quot;Làm Mới&quot; để lấy kết quả thực</li>
                  <li>Hệ thống tự động so sánh dự đoán của bạn</li>
                  <li>Xác định pattern trong các số đúng và sai</li>
                  <li>Dự đoán tương lai sẽ tích hợp các học hỏi này</li>
                </ol>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-4">
            <p className="text-xs text-indigo-300 leading-relaxed">
              <strong>ℹ️ Về Tính Năng Tự Học:</strong> Hệ thống theo dõi mọi dự đoán bạn tạo
              và so sánh với kết quả thực tế của kỳ quay. Nó xác định phạm vi số, pattern
              và chiến lược nào hoạt động tốt nhất theo thời gian, sau đó tự động đưa
              thông tin đó vào các dự đoán tương lai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
