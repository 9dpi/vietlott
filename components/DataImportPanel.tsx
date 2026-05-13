import React, { useState, useRef, useCallback } from 'react';
import { LotteryType } from '../types.ts';
import { LOTTERY_TYPES } from '../constants.ts';
import {
  importHistoricalData,
  getHistoricalData,
  getImportMeta,
  clearHistoricalData,
  hasHistoricalData,
  ImportStats,
} from '../services/historicalDataService.ts';

interface DataImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Gọi khi import xong để reload dữ liệu */
  onDataImported: (lotteryType: LotteryType) => void;
}

// ─── Sub-components ───────────────────────────

const ProgressBar: React.FC<{ pct: number; count: number }> = ({ pct, count }) => (
  <div className="mt-3">
    <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span>Đang xử lý... {count.toLocaleString()} bản ghi</span>
      <span>{pct}%</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({
  label, value, color = 'text-white'
}) => (
  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 text-center">
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
  </div>
);

const ImportResult: React.FC<{ stats: ImportStats; onClear: () => void }> = ({ stats, onClear }) => (
  <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4 mt-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 text-lg">✅</span>
        <div>
          <p className="font-semibold text-emerald-300 text-sm">Import thành công!</p>
          <p className="text-xs text-slate-400">{stats.lotteryType}</p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-800/50 hover:bg-red-900/20 transition-colors"
      >
        Xóa dữ liệu
      </button>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-3">
      <StatCard label="Tổng kỳ quay" value={stats.imported.toLocaleString()} color="text-indigo-400" />
      <StatCard label="Từ ngày" value={stats.dateRange.from} color="text-slate-300" />
      <StatCard label="Đến ngày" value={stats.dateRange.to} color="text-slate-300" />
    </div>
    {stats.skipped > 0 && (
      <p className="text-xs text-amber-400">⚠ Bỏ qua {stats.skipped} dòng không hợp lệ</p>
    )}
    <p className="text-xs text-slate-500 mt-1">
      Imported lúc: {new Date(stats.importedAt).toLocaleString('vi-VN')}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────

export const DataImportPanel: React.FC<DataImportPanelProps> = ({
  isOpen, onClose, onDataImported
}) => {
  const [selectedType, setSelectedType] = useState<LotteryType>(LOTTERY_TYPES.POWER);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importedStats, setImportedStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing stats on open
  const existingMeta = getImportMeta();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json') && !file.name.endsWith('.jsonl') && !file.name.endsWith('.txt')) {
      setError('Chỉ hỗ trợ file .json, .jsonl hoặc .txt');
      return;
    }

    setError(null);
    setIsImporting(true);
    setProgress(0);
    setProgressCount(0);

    try {
      const text = await file.text();
      const stats = await importHistoricalData(
        text,
        selectedType,
        (pct, count) => {
          setProgress(pct);
          setProgressCount(count);
        }
      );
      setImportedStats(stats);
      onDataImported(selectedType);
    } catch (err) {
      setError(`Lỗi khi import: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsImporting(false);
    }
  }, [selectedType, onDataImported]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleClear = (type: LotteryType) => {
    clearHistoricalData(type);
    setImportedStats(null);
  };

  if (!isOpen) return null;

  const power655Count = getHistoricalData(LOTTERY_TYPES.POWER).length;
  const mega645Count = getHistoricalData(LOTTERY_TYPES.MEGA).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📂</span> Import Dữ Liệu Lịch Sử
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Tải file dữ liệu để dùng cho Backtest & Tự Học
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Trạng thái dữ liệu hiện có */}
          <div className="grid grid-cols-2 gap-3">
            {[LOTTERY_TYPES.POWER, LOTTERY_TYPES.MEGA].map(type => {
              const count = type === LOTTERY_TYPES.POWER ? power655Count : mega645Count;
              const meta = existingMeta[type];
              const hasData = count > 0;
              return (
                <div
                  key={type}
                  className={`rounded-xl p-3 border text-sm ${
                    hasData
                      ? 'bg-emerald-900/20 border-emerald-700/40'
                      : 'bg-slate-900/50 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{type}</span>
                    {hasData && (
                      <button
                        onClick={() => handleClear(type)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  {hasData ? (
                    <>
                      <p className="text-emerald-400 font-bold text-lg">{count.toLocaleString()} kỳ</p>
                      {meta && (
                        <p className="text-xs text-slate-400">
                          {meta.dateRange.from} → {meta.dateRange.to}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500 text-xs mt-1">Chưa có dữ liệu</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chọn loại xổ số */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Chọn loại xổ số cần import:
            </label>
            <div className="flex gap-2">
              {[LOTTERY_TYPES.POWER, LOTTERY_TYPES.MEGA].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  disabled={isImporting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    selectedType === type
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Format hướng dẫn */}
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs font-semibold text-slate-300 mb-1.5">📋 Format file được hỗ trợ:</p>
            <div className="font-mono text-xs text-slate-400 space-y-0.5">
              <p className="text-emerald-400">✓ JSONL — nhiều object liên tiếp (power655_data.json)</p>
              <p className="text-emerald-400">✓ JSON Array — mảng các object</p>
              <p className="text-emerald-400">✓ Mỗi object cần: date, id, result (array số)</p>
              <p className="text-slate-500">  • result[0–5]: 6 số chính, result[6]: số đặc biệt (Power)</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isImporting && fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
              }
              ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.jsonl,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="text-4xl mb-3">
              {isImporting ? '⏳' : isDragging ? '📥' : '📄'}
            </div>
            {isImporting ? (
              <>
                <p className="text-white font-semibold">Đang import dữ liệu...</p>
                <ProgressBar pct={progress} count={progressCount} />
              </>
            ) : (
              <>
                <p className="text-white font-semibold mb-1">
                  Kéo thả file vào đây
                </p>
                <p className="text-slate-400 text-sm">hoặc click để chọn file</p>
                <p className="text-slate-500 text-xs mt-2">
                  Hỗ trợ: .json, .jsonl, .txt
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Import result */}
          {importedStats && (
            <ImportResult
              stats={importedStats}
              onClear={() => handleClear(importedStats.lotteryType)}
            />
          )}

          {/* Thông tin về dữ liệu có sẵn */}
          <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-4">
            <p className="text-xs text-indigo-300 leading-relaxed">
              <strong>💡 Lưu ý:</strong> Dữ liệu sau khi import sẽ được lưu trong trình duyệt
              (localStorage). Backtest sẽ tự động sử dụng toàn bộ lịch sử này thay vì chỉ
              50–100 kỳ gần nhất. Self-Learning cũng sẽ có thêm ngữ cảnh để đưa ra insight
              chính xác hơn.
              <br/><br/>
              <strong>⚠ Giới hạn:</strong> localStorage giới hạn ~5MB/domain. Với Power 6/55
              (~1,344 kỳ), dữ liệu chiếm khoảng 500KB — hoàn toàn phù hợp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
