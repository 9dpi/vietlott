/**
 * Historical Data Service
 * Parses và quản lý dữ liệu lịch sử xổ số từ file JSON cục bộ
 * Hỗ trợ format JSONL (nhiều JSON objects liên tiếp không có dấu phẩy)
 */

import { DrawResult, LotteryType } from '../types.ts';
import { LOTTERY_TYPES } from '../constants.ts';

const STORAGE_KEY_POWER = 'historicalData_Power655';
const STORAGE_KEY_MEGA  = 'historicalData_Mega645';
const STORAGE_META_KEY  = 'historicalData_meta';

export interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  dateRange: { from: string; to: string };
  lotteryType: LotteryType;
  importedAt: string;
}

interface RawEntry {
  date: string;
  id: string;
  result: number[];
  process_time?: string;
}

// ─────────────────────────────────────────────
// Parse engine — handles both JSONL and JSON array
// ─────────────────────────────────────────────

/**
 * Parse chuỗi text dạng nhiều JSON objects liên tiếp (JSONL không chuẩn)
 * hoặc JSON array thông thường
 */
function parseMultiJson(text: string): RawEntry[] {
  const results: RawEntry[] = [];

  // Thử parse JSON array trước
  const trimmed = text.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr as RawEntry[];
    } catch { /* không phải array, tiếp tục */ }
  }

  // Parse nhiều JSON objects liên tiếp
  let pos = 0;
  let depth = 0;
  let inString = false;
  let escape = false;
  let objStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          const obj = JSON.parse(text.slice(objStart, i + 1));
          results.push(obj as RawEntry);
        } catch { /* bỏ qua entry lỗi */ }
        objStart = -1;
      }
    }
  }

  return results;
}

/**
 * Chuyển đổi RawEntry sang DrawResult
 */
function toDrawResult(entry: RawEntry, lotteryType: LotteryType): DrawResult | null {
  if (!entry.date || !entry.id || !Array.isArray(entry.result) || entry.result.length < 6) {
    return null;
  }

  const result: DrawResult = {
    drawId: entry.id.toString().padStart(5, '0'),
    date: entry.date,
    numbers: entry.result.slice(0, 6).map(Number).sort((a, b) => a - b),
    lotteryType,
  };

  // Power 6/55: số thứ 7 là số đặc biệt
  if (lotteryType === LOTTERY_TYPES.POWER && entry.result.length >= 7) {
    result.specialNumber = Number(entry.result[6]);
  }

  return result;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Import dữ liệu từ nội dung file text (JSONL hoặc JSON array)
 * Lưu vào localStorage để dùng cho Backtest và Self-Learning
 */
export async function importHistoricalData(
  fileContent: string,
  lotteryType: LotteryType,
  onProgress?: (pct: number, count: number) => void
): Promise<ImportStats> {
  const storageKey = lotteryType === LOTTERY_TYPES.POWER ? STORAGE_KEY_POWER : STORAGE_KEY_MEGA;

  onProgress?.(5, 0);

  // Parse
  const rawEntries = parseMultiJson(fileContent);
  onProgress?.(30, rawEntries.length);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const draws: DrawResult[] = [];

  // Convert theo batch để không block UI
  const batchSize = 200;
  for (let i = 0; i < rawEntries.length; i += batchSize) {
    const batch = rawEntries.slice(i, i + batchSize);
    for (const entry of batch) {
      try {
        const draw = toDrawResult(entry, lotteryType);
        if (draw) {
          draws.push(draw);
          imported++;
        } else {
          skipped++;
        }
      } catch {
        errors++;
      }
    }
    const pct = 30 + Math.round((i / rawEntries.length) * 60);
    onProgress?.(pct, imported);
    // Yield để không block
    await new Promise(r => setTimeout(r, 0));
  }

  // Sắp xếp mới nhất lên đầu
  draws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Lưu vào localStorage (chunk nếu cần)
  saveToStorage(storageKey, draws);
  onProgress?.(95, imported);

  const stats: ImportStats = {
    total: rawEntries.length,
    imported,
    skipped,
    errors,
    dateRange: {
      from: draws.length > 0 ? draws[draws.length - 1].date : '',
      to:   draws.length > 0 ? draws[0].date : '',
    },
    lotteryType,
    importedAt: new Date().toISOString(),
  };

  // Lưu metadata
  const meta = loadMeta();
  meta[lotteryType] = stats;
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));

  onProgress?.(100, imported);
  return stats;
}

/**
 * Lấy toàn bộ dữ liệu lịch sử đã import
 */
export function getHistoricalData(lotteryType: LotteryType): DrawResult[] {
  const storageKey = lotteryType === LOTTERY_TYPES.POWER ? STORAGE_KEY_POWER : STORAGE_KEY_MEGA;
  return loadFromStorage(storageKey);
}

/**
 * Lấy dữ liệu lịch sử kết hợp với dữ liệu hiện tại, loại bỏ trùng lặp
 */
export function mergeWithHistorical(
  currentData: DrawResult[],
  lotteryType: LotteryType
): DrawResult[] {
  const historical = getHistoricalData(lotteryType);
  if (historical.length === 0) return currentData;

  // Merge và dedup theo drawId
  const map = new Map<string, DrawResult>();
  [...historical, ...currentData].forEach(d => map.set(d.drawId, d));

  return Array.from(map.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Kiểm tra đã có dữ liệu lịch sử chưa
 */
export function hasHistoricalData(lotteryType: LotteryType): boolean {
  return getHistoricalData(lotteryType).length > 0;
}

/**
 * Metadata về dữ liệu đã import
 */
export function getImportMeta(): Record<string, ImportStats> {
  return loadMeta();
}

/**
 * Xóa dữ liệu lịch sử
 */
export function clearHistoricalData(lotteryType: LotteryType): void {
  const storageKey = lotteryType === LOTTERY_TYPES.POWER ? STORAGE_KEY_POWER : STORAGE_KEY_MEGA;
  localStorage.removeItem(storageKey);
  const meta = loadMeta();
  delete meta[lotteryType];
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
}

// ─────────────────────────────────────────────
// Storage helpers (chunk để tránh giới hạn 5MB)
// ─────────────────────────────────────────────

const CHUNK_SIZE = 500; // records per chunk

function saveToStorage(key: string, data: DrawResult[]): void {
  // Xóa chunks cũ
  let i = 0;
  while (localStorage.getItem(`${key}_chunk_${i}`) !== null) {
    localStorage.removeItem(`${key}_chunk_${i}`);
    i++;
  }

  // Lưu meta count
  const chunks = Math.ceil(data.length / CHUNK_SIZE);
  localStorage.setItem(`${key}_count`, String(data.length));
  localStorage.setItem(`${key}_chunks`, String(chunks));

  // Lưu từng chunk
  for (let c = 0; c < chunks; c++) {
    const chunk = data.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
    try {
      localStorage.setItem(`${key}_chunk_${c}`, JSON.stringify(chunk));
    } catch (e) {
      // localStorage đầy — dừng lại
      localStorage.setItem(`${key}_chunks`, String(c));
      console.warn(`Storage full at chunk ${c}, saved ${c * CHUNK_SIZE} records`);
      break;
    }
  }
}

function loadFromStorage(key: string): DrawResult[] {
  const chunks = parseInt(localStorage.getItem(`${key}_chunks`) || '0', 10);
  if (chunks === 0) return [];

  const result: DrawResult[] = [];
  for (let c = 0; c < chunks; c++) {
    try {
      const raw = localStorage.getItem(`${key}_chunk_${c}`);
      if (raw) result.push(...JSON.parse(raw));
    } catch { /* chunk lỗi — bỏ qua */ }
  }
  return result;
}

function loadMeta(): Record<string, ImportStats> {
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
