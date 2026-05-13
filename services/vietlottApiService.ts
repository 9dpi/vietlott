import { LotteryType, DrawResult } from '../types.ts';
import { LOTTERY_TYPES } from '../constants.ts';

import power655Url from '../power655.jsonl.txt?url';

// GitHub repository data URLs (or local fallbacks)
const DATA_URLS = {
  [LOTTERY_TYPES.POWER]: power655Url, // Using local file for better reliability and complete history
  [LOTTERY_TYPES.MEGA]: 'https://raw.githubusercontent.com/vietvudanh/vietlott-data/master/data/power645.jsonl'
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
    const url = DATA_URLS[lotteryType];
    if (!url) {
      throw new Error(`Unsupported lottery type: ${lotteryType}`);
    }

    console.log(`Fetching real data for ${lotteryType} from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    // Parse JSONL format (each line is a JSON object)
    const rawData: VietlottDataEntry[] = [];
    for (const line of lines) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line) as VietlottDataEntry;
          rawData.push(entry);
        } catch (parseError) {
          console.warn('Failed to parse line:', line, parseError);
        }
      }
    }

    // Convert to our DrawResult format and sort by date (newest first)
    const drawResults: DrawResult[] = rawData
      .map(entry => convertToDrawResult(entry, lotteryType))
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
  return lotteryType in DATA_URLS;
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