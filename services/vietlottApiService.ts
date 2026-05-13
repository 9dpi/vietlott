import { LotteryType, DrawResult } from '../types.ts';
import { LOTTERY_TYPES } from '../constants.ts';

import power655Url from '../power655.jsonl.txt?url';

// Live GitHub repository data URLs
const LIVE_DATA_URLS = {
  [LOTTERY_TYPES.POWER]: 'https://raw.githubusercontent.com/vietvudanh/vietlott-data/master/data/power655.jsonl',
  [LOTTERY_TYPES.MEGA]: 'https://raw.githubusercontent.com/vietvudanh/vietlott-data/master/data/power645.jsonl'
};

// Local deep history fallback URLs
const LOCAL_DATA_URLS = {
  [LOTTERY_TYPES.POWER]: power655Url,
  [LOTTERY_TYPES.MEGA]: null
};

interface VietlottDataEntry {
  date: string;
  id: string;
  result: number[];
  page: number;
  process_time: string;
}

/**
 * Fetches real lottery data from the vietlott-data GitHub repository
 * @param lotteryType The type of lottery (Power 6/55 or Mega 6/45)
 * @param limit Maximum number of results to return (default: 50)
 * @returns Promise<DrawResult[]> Array of draw results
 */
export async function fetchRealLotteryData(
  lotteryType: LotteryType,
  limit: number = 50
): Promise<DrawResult[]> {
  try {
    const liveUrl = LIVE_DATA_URLS[lotteryType];
    const localUrl = LOCAL_DATA_URLS[lotteryType];
    
    if (!liveUrl) {
      throw new Error(`Unsupported lottery type: ${lotteryType}`);
    }

    const rawData: VietlottDataEntry[] = [];

    // 1. Fetch live data (always has the most recent draws)
    try {
      console.log(`Fetching live data for ${lotteryType} from: ${liveUrl}`);
      const response = await fetch(liveUrl);
      if (response.ok) {
        const text = await response.text();
        const lines = text.trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try { rawData.push(JSON.parse(line) as VietlottDataEntry); } catch { /* ignore */ }
          }
        }
      }
    } catch (e) {
      console.warn(`Could not fetch live data for ${lotteryType}:`, e);
    }

    // 2. Fetch local deep history data (for Power 6/55)
    if (localUrl) {
      try {
        console.log(`Fetching local deep history for ${lotteryType}`);
        const localResponse = await fetch(localUrl);
        if (localResponse.ok) {
          const text = await localResponse.text();
          const lines = text.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try { rawData.push(JSON.parse(line) as VietlottDataEntry); } catch { /* ignore */ }
            }
          }
        }
      } catch (e) {
        console.warn(`Could not fetch local data for ${lotteryType}:`, e);
      }
    }

    // 3. Deduplicate by drawId, convert to DrawResult, and sort
    const uniqueMap = new Map<string, DrawResult>();
    
    rawData.forEach(entry => {
      const result = convertToDrawResult(entry, lotteryType);
      if (!uniqueMap.has(result.drawId)) {
        uniqueMap.set(result.drawId, result);
      }
    });

    const drawResults: DrawResult[] = Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Only limit if limit is provided and less than total length
    const finalResults = limit && limit < drawResults.length ? drawResults.slice(0, limit) : drawResults;

    console.log(`Successfully fetched ${finalResults.length} real lottery results for ${lotteryType}`);
    return finalResults;

  } catch (error) {
    console.error(`Error fetching real lottery data for ${lotteryType}:`, error);
    throw error;
  }
}

/**
 * Converts raw data entry to our DrawResult format
 */
function convertToDrawResult(entry: VietlottDataEntry, lotteryType: LotteryType): DrawResult {
  const result: DrawResult = {
    drawId: entry.id,
    date: entry.date,
    numbers: entry.result.slice(0, 6).sort((a, b) => a - b), // First 6 numbers, sorted
    lotteryType
  };

  // For Power 6/55, the 7th number is the special number
  if (lotteryType === LOTTERY_TYPES.POWER && entry.result.length > 6) {
    result.specialNumber = entry.result[6];
  }

  return result;
}

/**
 * Fetches the latest draw result for a specific lottery type
 */
export async function fetchLatestDraw(lotteryType: LotteryType): Promise<DrawResult | null> {
  try {
    const results = await fetchRealLotteryData(lotteryType, 1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error fetching latest draw for ${lotteryType}:`, error);
    return null;
  }
}

/**
 * Checks if real data is available for the given lottery type
 */
export function isRealDataAvailable(lotteryType: LotteryType): boolean {
  return lotteryType in LIVE_DATA_URLS;
}

/**
 * Gets the data source information
 */
export function getDataSourceInfo() {
  return {
    source: 'Local Dataset & vietlott-data GitHub Repository',
    url: 'https://github.com/vietvudanh/vietlott-data',
    description: 'Local complete history for Power 6/55, external for Mega 6/45',
    updateFrequency: 'Daily',
    coverage: 'Historical data from 2017 to present'
  };
}