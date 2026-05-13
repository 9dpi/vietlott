import React, { useState, useEffect } from 'react';
import { PredictionRecord, DrawResult, LotteryType } from '../types';
import { predictionAnalysisService, AccuracyMetrics } from '../services/predictionAnalysisService';

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
              <span>🧠</span> Self-Learning System
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              AI analyzes past predictions to continuously improve accuracy
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isAnalyzing ? (
                <><div className="w-3 h-3 border-t border-white rounded-full animate-spin" /><span>Analyzing...</span></>
              ) : (
                <><span>↻</span><span>Refresh</span></>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Last run */}
          {lastRun && (
            <p className="text-xs text-slate-500 text-center">
              Last analyzed: {lastRun} · {predictionHistory.length} predictions loaded · {pendingPredictions.length} pending results
            </p>
          )}

          {/* Metrics */}
          {metrics && metrics.totalPredictions > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBadge value={metrics.totalPredictions} label="Total Analyzed" />
                <StatBadge value={`${(metrics.averageAccuracy * 100).toFixed(1)}%`} label="Avg Accuracy" color="text-violet-400" />
                <StatBadge value={`${(metrics.bestAccuracy * 100).toFixed(1)}%`} label="Best Result" color="text-emerald-400" />
                <StatBadge value={`${(metrics.recentPerformance * 100).toFixed(1)}%`} label="Recent (last 10)" color="text-amber-400" />
              </div>

              {/* Trend */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Accuracy Trend</p>
                    <p className="text-xs text-slate-500 mt-0.5">Compared to previous 10 predictions</p>
                  </div>
                  <div className="text-lg font-bold">
                    <TrendArrow trend={metrics.improvementTrend} />
                  </div>
                </div>

                {/* Simple visual trend bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-20">Recent avg</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${Math.min(metrics.recentPerformance * 100 * 6, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{(metrics.recentPerformance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-20">Overall avg</span>
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
                    <span>💡</span> Statistical Insights
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
                    <span>🎯</span> AI Recommendations
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
              <h3 className="text-xl font-semibold text-white mb-2">Not Enough Data Yet</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Generate predictions and wait for actual draw results to appear. The system will
                automatically compare and learn from each prediction you make.
              </p>
              <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-left">
                <p className="text-xs font-semibold text-slate-300 mb-2">How it works:</p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Generate an AI prediction for today's draw</li>
                  <li>After the draw, refresh data to get the actual result</li>
                  <li>The system automatically compares your prediction</li>
                  <li>It identifies patterns in your hits and misses</li>
                  <li>Future predictions incorporate these learnings</li>
                </ol>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-4">
            <p className="text-xs text-indigo-300 leading-relaxed">
              <strong>ℹ️ About Self-Learning:</strong> The system tracks every prediction you generate
              and compares it to the actual draw result. It identifies which number ranges, patterns,
              and strategies perform best for you over time, then feeds that intelligence back into
              future predictions automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
