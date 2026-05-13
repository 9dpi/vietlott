import { LotteryType, DrawResult } from '../types';
import { LOTTERY_CONFIG } from '../constants';

export interface BacktestConfig {
  lotteryType: LotteryType;
  strategy: 'HOT' | 'COLD' | 'BALANCED' | 'RANDOM';
  lookbackPeriod: number; // How many draws to analyze before each prediction
  testDraws: number; // How many draws to test (most recent N draws)
}

export interface SingleBacktestResult {
  drawDate: string;
  drawId: string;
  actualNumbers: number[];
  predictedNumbers: number[];
  specialNumberActual?: number;
  specialNumberPredicted?: number;
  matchCount: number;
  specialMatch: boolean;
  matchedNumbers: number[];
  accuracy: number; // 0-1
  prize: string; // Prize tier
}

export interface BacktestSummary {
  lotteryType: LotteryType;
  strategy: string;
  totalDrawsTested: number;
  lookbackPeriod: number;
  results: SingleBacktestResult[];
  metrics: {
    averageMatches: number;
    averageAccuracy: number;
    bestResult: SingleBacktestResult | null;
    worstResult: SingleBacktestResult | null;
    matchDistribution: Record<number, number>; // matches -> count
    specialMatchRate: number;
    prizeDistribution: Record<string, number>;
    winRate: number; // Percentage of draws where at least 3 numbers matched
  };
  chartData: Array<{
    draw: string;
    matches: number;
    accuracy: number;
  }>;
}

export type BacktestProgressCallback = (progress: number, current: number, total: number) => void;

class BacktestService {
  /**
   * Run a backtest simulation over historical data
   */
  async runBacktest(
    config: BacktestConfig,
    allHistory: DrawResult[],
    onProgress?: BacktestProgressCallback
  ): Promise<BacktestSummary> {
    const { lotteryType, strategy, lookbackPeriod, testDraws } = config;
    const lotteryHistory = allHistory
      .filter(d => d.lotteryType === lotteryType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first

    if (lotteryHistory.length < lookbackPeriod + 1) {
      throw new Error(
        `Not enough historical data. Need at least ${lookbackPeriod + 1} draws, have ${lotteryHistory.length}.`
      );
    }

    const testStartIndex = Math.max(lookbackPeriod, lotteryHistory.length - testDraws);
    const drawsToTest = lotteryHistory.slice(testStartIndex);
    const results: SingleBacktestResult[] = [];
    const total = drawsToTest.length;

    for (let i = 0; i < drawsToTest.length; i++) {
      const testDraw = drawsToTest[i];
      const globalIndex = lotteryHistory.indexOf(testDraw);
      const lookbackData = lotteryHistory.slice(
        Math.max(0, globalIndex - lookbackPeriod),
        globalIndex
      );

      if (lookbackData.length === 0) continue;

      // Generate prediction based on strategy
      const { predicted, predictedSpecial } = this.generatePrediction(
        lotteryType,
        lookbackData,
        strategy
      );

      // Compare with actual result
      const matchedNumbers = predicted.filter(n => testDraw.numbers.includes(n));
      const matchCount = matchedNumbers.length;
      const specialMatch =
        predictedSpecial !== undefined &&
        testDraw.specialNumber !== undefined &&
        predictedSpecial === testDraw.specialNumber;
      const accuracy = matchCount / predicted.length;
      const prize = this.determinePrize(lotteryType, matchCount, specialMatch);

      results.push({
        drawDate: testDraw.date,
        drawId: testDraw.drawId,
        actualNumbers: testDraw.numbers,
        predictedNumbers: predicted,
        specialNumberActual: testDraw.specialNumber,
        specialNumberPredicted: predictedSpecial,
        matchCount,
        specialMatch,
        matchedNumbers,
        accuracy,
        prize,
      });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / total) * 100), i + 1, total);
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return this.buildSummary(lotteryType, strategy, lookbackPeriod, results);
  }

  /**
   * Generate a statistical prediction based on lookback data
   */
  private generatePrediction(
    lotteryType: LotteryType,
    lookbackData: DrawResult[],
    strategy: BacktestConfig['strategy']
  ): { predicted: number[]; predictedSpecial?: number } {
    const config = LOTTERY_CONFIG[lotteryType];
    const maxNum = config.range;
    const count = config.mainNumbers;

    // Calculate frequency map
    const freq: Record<number, number> = {};
    for (const draw of lookbackData) {
      for (const num of draw.numbers) {
        freq[num] = (freq[num] || 0) + 1;
      }
    }

    const allNumbers = Array.from({ length: maxNum }, (_, i) => i + 1);
    const sorted = allNumbers.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));

    let pool: number[];
    switch (strategy) {
      case 'HOT':
        pool = sorted.slice(0, Math.min(count * 2, maxNum));
        break;
      case 'COLD':
        pool = sorted.slice(-Math.min(count * 2, maxNum)).reverse();
        break;
      case 'BALANCED':
        // Mix hot and cold
        const hotCount = Math.ceil(count * 0.6);
        const coldCount = count - hotCount;
        pool = [
          ...sorted.slice(0, hotCount * 2),
          ...sorted.slice(-coldCount * 2).reverse(),
        ];
        break;
      case 'RANDOM':
      default:
        pool = [...allNumbers];
        break;
    }

    // Select without replacement
    const predicted = this.selectRandom(pool, count, maxNum, allNumbers);

    // Handle special number for Power 6/55
    let predictedSpecial: number | undefined;
    if (config.specialNumbers && config.specialNumbers > 0) {
      const specialFreq: Record<number, number> = {};
      for (const draw of lookbackData) {
        if (draw.specialNumber !== undefined) {
          specialFreq[draw.specialNumber] = (specialFreq[draw.specialNumber] || 0) + 1;
        }
      }
      const sortedSpecial = Object.entries(specialFreq)
        .sort(([, a], [, b]) => b - a)
        .map(([num]) => parseInt(num));
      predictedSpecial = sortedSpecial.length > 0
        ? sortedSpecial[0]
        : Math.floor(Math.random() * maxNum) + 1;
    }

    return { predicted, predictedSpecial };
  }

  /**
   * Select N unique random numbers from pool
   */
  private selectRandom(
    pool: number[],
    count: number,
    maxNum: number,
    allNumbers: number[]
  ): number[] {
    const shuffled = [...new Set(pool)].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Fill if not enough
    const remaining = allNumbers.filter(n => !selected.includes(n));
    const shuffledRemaining = remaining.sort(() => Math.random() - 0.5);
    while (selected.length < count && shuffledRemaining.length > 0) {
      selected.push(shuffledRemaining.shift()!);
    }

    return selected.sort((a, b) => a - b);
  }

  /**
   * Determine prize tier based on match count
   */
  private determinePrize(lotteryType: LotteryType, matchCount: number, specialMatch: boolean): string {
    if (lotteryType === 'Power 6/55') {
      if (matchCount === 6 && specialMatch) return 'Jackpot 1';
      if (matchCount === 6) return 'Jackpot 2';
      if (matchCount === 5 && specialMatch) return 'Prize 3';
      if (matchCount === 5) return 'Prize 4';
      if (matchCount === 4) return 'Prize 5';
      if (matchCount === 3) return 'Prize 6';
      if (matchCount === 2 && specialMatch) return 'Prize 7';
      if (matchCount === 1 && specialMatch) return 'Prize 7';
      if (matchCount === 0 && specialMatch) return 'Prize 7';
      return 'No Prize';
    } else {
      // Mega 6/45
      if (matchCount === 6) return 'Jackpot 1';
      if (matchCount === 5) return 'Prize 2';
      if (matchCount === 4) return 'Prize 3';
      if (matchCount === 3) return 'Prize 4';
      return 'No Prize';
    }
  }

  /**
   * Build summary from results
   */
  private buildSummary(
    lotteryType: LotteryType,
    strategy: string,
    lookbackPeriod: number,
    results: SingleBacktestResult[]
  ): BacktestSummary {
    if (results.length === 0) {
      return {
        lotteryType, strategy, totalDrawsTested: 0, lookbackPeriod,
        results: [],
        metrics: {
          averageMatches: 0, averageAccuracy: 0,
          bestResult: null, worstResult: null,
          matchDistribution: {}, specialMatchRate: 0,
          prizeDistribution: {}, winRate: 0,
        },
        chartData: [],
      };
    }

    const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);
    const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);
    const matchDistribution: Record<number, number> = {};
    const prizeDistribution: Record<string, number> = {};

    for (const r of results) {
      matchDistribution[r.matchCount] = (matchDistribution[r.matchCount] || 0) + 1;
      prizeDistribution[r.prize] = (prizeDistribution[r.prize] || 0) + 1;
    }

    const sortedByMatches = [...results].sort((a, b) => b.matchCount - a.matchCount);
    const specialMatchCount = results.filter(r => r.specialMatch).length;
    const winCount = results.filter(r => r.matchCount >= 3).length;

    return {
      lotteryType,
      strategy,
      totalDrawsTested: results.length,
      lookbackPeriod,
      results,
      metrics: {
        averageMatches: totalMatches / results.length,
        averageAccuracy: totalAccuracy / results.length,
        bestResult: sortedByMatches[0] || null,
        worstResult: sortedByMatches[sortedByMatches.length - 1] || null,
        matchDistribution,
        specialMatchRate: specialMatchCount / results.length,
        prizeDistribution,
        winRate: (winCount / results.length) * 100,
      },
      chartData: results.map(r => ({
        draw: r.drawDate,
        matches: r.matchCount,
        accuracy: Math.round(r.accuracy * 100),
      })),
    };
  }
}

export const backtestService = new BacktestService();
