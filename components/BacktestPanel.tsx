import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DrawResult, LotteryType } from '../types';
import { backtestService, BacktestConfig, BacktestSummary } from '../services/backtestService';
import { LOTTERY_TYPES } from '../constants';
import { mergeWithHistorical, hasHistoricalData, getHistoricalData } from '../services/historicalDataService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface BacktestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: DrawResult[];
  lotteryType: LotteryType;
}

const STRATEGY_OPTIONS: { value: BacktestConfig['strategy']; label: string; desc: string }[] = [
  { value: 'HOT', label: '🔥 Số Nóng', desc: 'Tập trung vào các số xuất hiện nhiều nhất' },
  { value: 'COLD', label: '❄️ Số Lạnh', desc: 'Tập trung vào các số xuất hiện ít nhất' },
  { value: 'BALANCED', label: '⚖️ Cân Bằng', desc: 'Kết hợp số nóng và số lạnh' },
  { value: 'RANDOM', label: '🏒 Ngẫu Nhiên', desc: 'Chọn ngẫu nhiên làm đường cơ sở' },
];

const MatchBadge: React.FC<{ count: number }> = ({ count }) => {
  const colors: Record<number, string> = {
    0: 'bg-slate-700 text-slate-400',
    1: 'bg-slate-700 text-slate-300',
    2: 'bg-blue-900/50 text-blue-300',
    3: 'bg-indigo-900/50 text-indigo-300',
    4: 'bg-violet-900/50 text-violet-300',
    5: 'bg-amber-900/50 text-amber-300',
    6: 'bg-emerald-900/50 text-emerald-300',
  };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${colors[count] || colors[0]}`}>
      {count}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({ label, value, sub, color = 'text-indigo-400' }) => (
  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
    <p className="text-xs text-slate-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ isOpen, onClose, history, lotteryType }) => {
  const [strategy, setStrategy] = useState<BacktestConfig['strategy']>('BALANCED');
  const [lookback, setLookback] = useState(20);
  const [testDraws, setTestDraws] = useState(100);
  const [selectedLottery, setSelectedLottery] = useState<LotteryType>(lotteryType);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const isMounted = useRef(true);

  // Merge dữ liệu lịch sử đã import với dữ liệu hiện tại
  const [mergedHistory, setMergedHistory] = useState<DrawResult[]>(history);
  const [hasHistorical, setHasHistorical] = useState(false);

  useEffect(() => {
    const merged = mergeWithHistorical(history, selectedLottery);
    setMergedHistory(merged);
    setHasHistorical(hasHistoricalData(selectedLottery));
  }, [history, selectedLottery]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setSummary(null);
    setProgress(0);
    setProgressText('Initializing backtest...');

    try {
      const result = await backtestService.runBacktest(
        {
          lotteryType: selectedLottery,
          strategy,
          lookbackPeriod: lookback,
          testDraws,
        },
        mergedHistory,   // ← dùng dữ liệu đã merge
        (pct, cur, tot) => {
          if (isMounted.current) {
            setProgress(pct);
            setProgressText(`Đang kiểm tra kỳ ${cur}/${tot}...`);
          }
        }
      );

      if (isMounted.current) {
        setSummary(result);
        setProgressText('Backtest complete!');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Backtest failed');
      }
    } finally {
      if (isMounted.current) {
        setIsRunning(false);
      }
    }
  }, [selectedLottery, strategy, lookback, testDraws, mergedHistory]);

  const availableDraws = mergedHistory.filter(d => d.lotteryType === selectedLottery).length;
  const maxTestDraws = Math.min(1300, Math.max(10, availableDraws - lookback));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>📊</span> Công Cụ Backtest
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Kiểm tra hiệu quả chiến lược trên dữ liệu lịch sử
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Data source badge */}
            <div className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              hasHistorical
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {availableDraws.toLocaleString()} kỳ {hasHistorical ? '📂 Lịch sử' : '🌐 Thực tế'}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left: Lottery & Strategy */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Loại Xổ Số</label>
                <div className="flex gap-2">
                  {Object.values(LOTTERY_TYPES).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedLottery(type)}
                      disabled={isRunning}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                        selectedLottery === type
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                      } disabled:opacity-50`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Chiến Lược</label>
                <div className="grid grid-cols-2 gap-2">
                  {STRATEGY_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStrategy(s.value)}
                      disabled={isRunning}
                      className={`p-3 rounded-lg text-left transition-all border ${
                        strategy === s.value
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                      } disabled:opacity-50`}
                    >
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs mt-0.5 opacity-70">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Parameters */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Lookback: <span className="text-indigo-400 font-bold">{lookback} kỳ phân tích</span>
                </label>
                <input
                  type="range" min="5" max="50" step="5" value={lookback}
                  onChange={e => setLookback(+e.target.value)}
                  disabled={isRunning}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5 (ngắn)</span><span>50 (dài)</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Kiểm tra: <span className="text-indigo-400 font-bold">{Math.min(testDraws, maxTestDraws)} kỳ</span>
                  <span className="text-slate-500 text-xs ml-2">({availableDraws.toLocaleString()} kỳ có sẵn)</span>
                </label>
                <input
                  type="range" min="10" max={Math.max(10, maxTestDraws)} step="10" value={testDraws}
                  onChange={e => setTestDraws(+e.target.value)}
                  disabled={isRunning}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10</span><span>{Math.max(10, maxTestDraws)}</span>
                </div>
              </div>

              <button
                onClick={handleRun}
                disabled={isRunning || availableDraws < lookback + 10}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                    <span>Đang chạy... {progress}%</span>
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    <span>Chạy Backtest</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{progressText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Results */}
          {summary && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  label="Kỳ đã kiểm tra"
                  value={summary.totalDrawsTested}
                  sub={`Chiến lược: ${summary.strategy}`}
                />
                <MetricCard
                  label="TB số khớp / kỳ"
                  value={summary.metrics.averageMatches.toFixed(2)}
                  sub={`trên ${summary.lotteryType === 'Power 6/55' ? 6 : 6} số`}
                  color="text-violet-400"
                />
                <MetricCard
                  label="Tỷ lệ thắng (≥3 số)"
                  value={`${summary.metrics.winRate.toFixed(1)}%`}
                  sub="Ít nhất 3 số đúng"
                  color={summary.metrics.winRate > 10 ? 'text-emerald-400' : 'text-amber-400'}
                />
                <MetricCard
                  label="Kết quả tốt nhất"
                  value={summary.metrics.bestResult ? `${summary.metrics.bestResult.matchCount} khớp` : 'N/A'}
                  sub={summary.metrics.bestResult?.prize}
                  color="text-amber-400"
                />
              </div>

              {/* Match Distribution */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Phân Phối Số Khớp</h3>
                <div className="flex items-end gap-2 h-24">
                  {[0, 1, 2, 3, 4, 5, 6].map(n => {
                    const count = summary.metrics.matchDistribution[n] || 0;
                    const max = Math.max(...Object.values(summary.metrics.matchDistribution));
                    const height = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div key={n} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400">{count}</span>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${height}%`,
                            minHeight: count > 0 ? '4px' : '0',
                            background: n >= 5 ? 'linear-gradient(to top, #10b981, #059669)' :
                                        n >= 3 ? 'linear-gradient(to top, #6366f1, #8b5cf6)' :
                                                  '#334155'
                          }}
                        />
                        <span className="text-xs text-slate-500">{n}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Số lượng số khớp mỗi kỳ</p>
              </div>

              {/* Tabs */}
              <div>
                <div className="flex gap-2 mb-4">
                  {(['chart', 'table'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === 'chart' ? '📈 Biểu Đồ Hiệu Suất' : '📋 Bảng Kết Quả'}
                    </button>
                  ))}
                </div>

                {/* Chart Tab */}
                {activeTab === 'chart' && (
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Số Khớp Theo Thời Gian</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={summary.chartData.slice(-50)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="draw" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 6]} ticks={[0,1,2,3,4,5,6]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                          formatter={(val: number) => [`${val} khớp`, 'Số khớp']}
                        />
                        <ReferenceLine y={3} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Ngưỡng thắng', fill: '#6366f1', fontSize: 11 }} />
                        <Line type="monotone" dataKey="matches" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Table Tab */}
                {activeTab === 'table' && (
                  <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="overflow-y-auto max-h-64">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800 sticky top-0 text-slate-400 uppercase text-xs">
                          <tr>
                            <th className="px-3 py-2">Ngày</th>
                            <th className="px-3 py-2">Kết quả thực</th>
                            <th className="px-3 py-2">Dự đoán</th>
                            <th className="px-3 py-2">Khớp</th>
                            <th className="px-3 py-2">Giải</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...summary.results].reverse().map((r, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="px-3 py-2 text-slate-400">{r.drawDate}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {r.actualNumbers.map(n => (
                                    <span
                                      key={n}
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                        r.matchedNumbers.includes(n)
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-slate-700 text-slate-300'
                                      }`}
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {r.predictedNumbers.map(n => (
                                    <span
                                      key={n}
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                        r.matchedNumbers.includes(n)
                                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <MatchBadge count={r.matchCount} />
                              </td>
                              <td className="px-3 py-2">
                                <span className={`text-xs font-medium ${
                                  r.prize === 'No Prize' ? 'text-slate-500' :
                                  r.prize.includes('Jackpot') ? 'text-amber-300' : 'text-indigo-300'
                                }`}>
                                  {r.prize}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Prize Distribution */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Phân Bố Giải Thưởng</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.metrics.prizeDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([prize, count]) => (
                      <div key={prize} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        prize === 'No Prize' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                        prize.includes('Jackpot') ? 'bg-amber-900/30 text-amber-300 border-amber-700/50' :
                        'bg-indigo-900/30 text-indigo-300 border-indigo-700/50'
                      }`}>
                        {prize}: <strong>{count}</strong> <span className="opacity-60">({((count / summary.totalDrawsTested) * 100).toFixed(1)}%)</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
