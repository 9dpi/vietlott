import { LotteryType, DrawResult, PredictionRecord } from '../types';

/**
 * Prediction Analysis Service
 * Analyzes the accuracy of AI predictions and provides statistical insights for improvement
 */

export interface PredictionAccuracy {
  predictionId: string;
  date: string;
  lotteryType: LotteryType;
  predictedNumbers: number[];
  actualNumbers: number[];
  specialNumberPredicted?: number;
  specialNumberActual?: number;
  matches: {
    exactMatches: number;
    partialMatches: number;
    specialMatch: boolean;
    accuracy: number; // 0-1 scale
  };
  analysis: {
    hotNumbers: number[]; // Numbers that appeared in both prediction and result
    missedNumbers: number[]; // Numbers in result but not predicted
    overPredicted: number[]; // Numbers predicted but not in result
  };
}

export interface StatisticalInsight {
  type: 'pattern' | 'frequency' | 'sequence' | 'range' | 'sum';
  description: string;
  confidence: number; // 0-1 scale
  recommendation: string;
  data: any;
}

export interface AccuracyMetrics {
  totalPredictions: number;
  averageAccuracy: number;
  bestAccuracy: number;
  worstAccuracy: number;
  improvementTrend: number; // Positive = improving, negative = declining
  recentPerformance: number; // Last 10 predictions average
  byLotteryType: Partial<Record<LotteryType, {
    count: number;
    averageAccuracy: number;
    bestAccuracy: number;
  }>>;
}

export class PredictionAnalysisService {
  private accuracyHistory: PredictionAccuracy[] = [];

  /**
   * Compare a prediction with the actual result
   */
  analyzePrediction(
    prediction: PredictionRecord,
    actualResult: DrawResult
  ): PredictionAccuracy {
    if (prediction.lotteryType !== actualResult.lotteryType) {
      throw new Error('Lottery type mismatch between prediction and result');
    }

    const predictedNumbers = prediction.predictedNumbers.slice().sort((a, b) => a - b);
    const actualNumbers = actualResult.numbers.slice().sort((a, b) => a - b);

    // Calculate matches
    const exactMatches = predictedNumbers.filter(num => actualNumbers.includes(num)).length;
    const totalNumbers = predictedNumbers.length;
    const accuracy = exactMatches / totalNumbers;

    // Special number analysis (for Power 6/55)
    const specialMatch = prediction.specialNumber !== undefined && 
                        actualResult.specialNumber !== undefined &&
                        prediction.specialNumber === actualResult.specialNumber;

    // Detailed analysis
    const hotNumbers = predictedNumbers.filter(num => actualNumbers.includes(num));
    const missedNumbers = actualNumbers.filter(num => !predictedNumbers.includes(num));
    const overPredicted = predictedNumbers.filter(num => !actualNumbers.includes(num));

    const analysis: PredictionAccuracy = {
      predictionId: prediction.id,
      date: actualResult.date,
      lotteryType: prediction.lotteryType,
      predictedNumbers,
      actualNumbers,
      specialNumberPredicted: prediction.specialNumber,
      specialNumberActual: actualResult.specialNumber,
      matches: {
        exactMatches,
        partialMatches: Math.min(exactMatches, totalNumbers - exactMatches),
        specialMatch,
        accuracy
      },
      analysis: {
        hotNumbers,
        missedNumbers,
        overPredicted
      }
    };

    // Store in history
    this.accuracyHistory.push(analysis);
    this.saveAccuracyHistory();

    return analysis;
  }

  /**
   * Generate statistical insights from prediction history
   */
  generateInsights(lotteryType: LotteryType, lookbackDays: number = 30): StatisticalInsight[] {
    const insights: StatisticalInsight[] = [];
    const recentAnalyses = this.getRecentAnalyses(lotteryType, lookbackDays);

    if (recentAnalyses.length < 3) {
      return insights; // Need at least 3 predictions for meaningful analysis
    }

    // Pattern analysis
    insights.push(...this.analyzeNumberPatterns(recentAnalyses));
    
    // Frequency analysis
    insights.push(...this.analyzeNumberFrequency(recentAnalyses));
    
    // Range analysis
    insights.push(...this.analyzeNumberRanges(recentAnalyses));
    
    // Sum analysis
    insights.push(...this.analyzeSumPatterns(recentAnalyses));

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get overall accuracy metrics
   */
  getAccuracyMetrics(): AccuracyMetrics {
    if (this.accuracyHistory.length === 0) {
      return {
        totalPredictions: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        worstAccuracy: 0,
        improvementTrend: 0,
        recentPerformance: 0,
        byLotteryType: {}
      };
    }

    const accuracies = this.accuracyHistory.map(a => a.matches.accuracy);
    const recent10 = accuracies.slice(-10);
    const older10 = accuracies.slice(-20, -10);

    // Calculate improvement trend
    const recentAvg = recent10.reduce((sum, acc) => sum + acc, 0) / recent10.length;
    const olderAvg = older10.length > 0 ? older10.reduce((sum, acc) => sum + acc, 0) / older10.length : recentAvg;
    const improvementTrend = recentAvg - olderAvg;

    // Group by lottery type
    const byLotteryType: Record<LotteryType, any> = {};
    for (const analysis of this.accuracyHistory) {
      if (!byLotteryType[analysis.lotteryType]) {
        byLotteryType[analysis.lotteryType] = {
          count: 0,
          accuracies: []
        };
      }
      byLotteryType[analysis.lotteryType].count++;
      byLotteryType[analysis.lotteryType].accuracies.push(analysis.matches.accuracy);
    }

    // Calculate metrics by lottery type
    for (const lotteryType in byLotteryType) {
      const data = byLotteryType[lotteryType];
      byLotteryType[lotteryType] = {
        count: data.count,
        averageAccuracy: data.accuracies.reduce((sum: number, acc: number) => sum + acc, 0) / data.count,
        bestAccuracy: Math.max(...data.accuracies)
      };
    }

    return {
      totalPredictions: this.accuracyHistory.length,
      averageAccuracy: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
      bestAccuracy: Math.max(...accuracies),
      worstAccuracy: Math.min(...accuracies),
      improvementTrend,
      recentPerformance: recentAvg,
      byLotteryType
    };
  }

  /**
   * Get recommendations for improving predictions
   */
  getImprovementRecommendations(lotteryType: LotteryType): string[] {
    const insights = this.generateInsights(lotteryType);
    const metrics = this.getAccuracyMetrics();
    const recommendations: string[] = [];

    // Performance-based recommendations
    if (metrics.improvementTrend < -0.05) {
      recommendations.push("Prediction accuracy is declining. Consider adjusting the prediction algorithm.");
    }

    if (metrics.recentPerformance < 0.15) {
      recommendations.push("Recent predictions show low accuracy. Focus on hot numbers and recent patterns.");
    }

    // Insight-based recommendations
    const highConfidenceInsights = insights.filter(i => i.confidence > 0.7);
    for (const insight of highConfidenceInsights) {
      recommendations.push(insight.recommendation);
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring patterns and adjust predictions based on recent draw results.");
    }

    return recommendations;
  }

  /**
   * Load accuracy history from storage
   */
  loadAccuracyHistory(): void {
    try {
      const stored = localStorage.getItem('predictionAccuracyHistory');
      if (stored) {
        this.accuracyHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load accuracy history:', error);
      this.accuracyHistory = [];
    }
  }

  /**
   * Save accuracy history to storage
   */
  private saveAccuracyHistory(): void {
    try {
      // Keep only last 100 analyses to prevent storage bloat
      const toSave = this.accuracyHistory.slice(-100);
      localStorage.setItem('predictionAccuracyHistory', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save accuracy history:', error);
    }
  }

  /**
   * Get recent analyses for a specific lottery type
   */
  private getRecentAnalyses(lotteryType: LotteryType, days: number): PredictionAccuracy[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.accuracyHistory
      .filter(a => a.lotteryType === lotteryType)
      .filter(a => new Date(a.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Analyze number patterns in predictions vs results
   */
  private analyzeNumberPatterns(analyses: PredictionAccuracy[]): StatisticalInsight[] {
    const insights: StatisticalInsight[] = [];
    
    // Analyze consecutive numbers
    let consecutiveHits = 0;
    let totalConsecutiveAttempts = 0;

    for (const analysis of analyses) {
      const predicted = analysis.predictedNumbers;
      const actual = analysis.actualNumbers;
      
      // Check for consecutive numbers in predictions
      for (let i = 0; i < predicted.length - 1; i++) {
        if (predicted[i + 1] === predicted[i] + 1) {
          totalConsecutiveAttempts++;
          if (actual.includes(predicted[i]) && actual.includes(predicted[i + 1])) {
            consecutiveHits++;
          }
        }
      }
    }

    if (totalConsecutiveAttempts > 0) {
      const consecutiveAccuracy = consecutiveHits / totalConsecutiveAttempts;
      insights.push({
        type: 'pattern',
        description: `Consecutive number predictions have ${(consecutiveAccuracy * 100).toFixed(1)}% accuracy`,
        confidence: Math.min(consecutiveAccuracy + 0.3, 1),
        recommendation: consecutiveAccuracy > 0.3 
          ? "Continue including consecutive numbers in predictions"
          : "Reduce consecutive number predictions",
        data: { consecutiveHits, totalConsecutiveAttempts, accuracy: consecutiveAccuracy }
      });
    }

    return insights;
  }

  /**
   * Analyze number frequency patterns
   */
  private analyzeNumberFrequency(analyses: PredictionAccuracy[]): StatisticalInsight[] {
    const insights: StatisticalInsight[] = [];
    
    // Track which predicted numbers actually appeared
    const numberPerformance: Record<number, { predicted: number; appeared: number }> = {};
    
    for (const analysis of analyses) {
      for (const num of analysis.predictedNumbers) {
        if (!numberPerformance[num]) {
          numberPerformance[num] = { predicted: 0, appeared: 0 };
        }
        numberPerformance[num].predicted++;
        
        if (analysis.actualNumbers.includes(num)) {
          numberPerformance[num].appeared++;
        }
      }
    }

    // Find best performing predicted numbers
    const bestNumbers = Object.entries(numberPerformance)
      .filter(([_, data]) => data.predicted >= 2) // At least 2 predictions
      .map(([num, data]) => ({
        number: parseInt(num),
        accuracy: data.appeared / data.predicted,
        predictions: data.predicted
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    if (bestNumbers.length > 0) {
      insights.push({
        type: 'frequency',
        description: `Numbers ${bestNumbers.map(n => n.number).join(', ')} show highest prediction accuracy`,
        confidence: 0.6,
        recommendation: "Consider including these high-performing numbers in future predictions",
        data: bestNumbers
      });
    }

    return insights;
  }

  /**
   * Analyze number range patterns
   */
  private analyzeNumberRanges(analyses: PredictionAccuracy[]): StatisticalInsight[] {
    const insights: StatisticalInsight[] = [];
    
    // Analyze range distribution
    const rangeHits = { low: 0, mid: 0, high: 0 };
    const rangePredictions = { low: 0, mid: 0, high: 0 };
    
    const maxNumber = analyses[0].lotteryType === 'power' ? 55 : 45;
    const lowRange = Math.floor(maxNumber / 3);
    const midRange = Math.floor(maxNumber * 2 / 3);

    for (const analysis of analyses) {
      for (const num of analysis.predictedNumbers) {
        if (num <= lowRange) {
          rangePredictions.low++;
          if (analysis.actualNumbers.includes(num)) rangeHits.low++;
        } else if (num <= midRange) {
          rangePredictions.mid++;
          if (analysis.actualNumbers.includes(num)) rangeHits.mid++;
        } else {
          rangePredictions.high++;
          if (analysis.actualNumbers.includes(num)) rangeHits.high++;
        }
      }
    }

    const rangeAccuracy = {
      low: rangePredictions.low > 0 ? rangeHits.low / rangePredictions.low : 0,
      mid: rangePredictions.mid > 0 ? rangeHits.mid / rangePredictions.mid : 0,
      high: rangePredictions.high > 0 ? rangeHits.high / rangePredictions.high : 0
    };

    const bestRange = Object.entries(rangeAccuracy).reduce((a, b) => a[1] > b[1] ? a : b);

    insights.push({
      type: 'range',
      description: `${bestRange[0]} range numbers (${bestRange[0] === 'low' ? '1-' + lowRange : bestRange[0] === 'mid' ? (lowRange + 1) + '-' + midRange : (midRange + 1) + '-' + maxNumber}) show best accuracy: ${(bestRange[1] * 100).toFixed(1)}%`,
      confidence: 0.5,
      recommendation: `Focus more predictions on ${bestRange[0]} range numbers`,
      data: rangeAccuracy
    });

    return insights;
  }

  /**
   * Analyze sum patterns
   */
  private analyzeSumPatterns(analyses: PredictionAccuracy[]): StatisticalInsight[] {
    const insights: StatisticalInsight[] = [];
    
    // Calculate sum accuracy
    let sumAccuracy = 0;
    let validSums = 0;

    for (const analysis of analyses) {
      const predictedSum = analysis.predictedNumbers.reduce((sum, num) => sum + num, 0);
      const actualSum = analysis.actualNumbers.reduce((sum, num) => sum + num, 0);
      
      // Consider "close" if within 10% of actual sum
      const difference = Math.abs(predictedSum - actualSum);
      const tolerance = actualSum * 0.1;
      
      if (difference <= tolerance) {
        sumAccuracy++;
      }
      validSums++;
    }

    if (validSums > 0) {
      const accuracy = sumAccuracy / validSums;
      insights.push({
        type: 'sum',
        description: `Sum predictions are accurate within 10% tolerance ${(accuracy * 100).toFixed(1)}% of the time`,
        confidence: 0.4,
        recommendation: accuracy > 0.3 
          ? "Continue using sum-based prediction strategies"
          : "Adjust sum calculation methods for better accuracy",
        data: { accuracy, hits: sumAccuracy, total: validSums }
      });
    }

    return insights;
  }
}

// Export singleton instance
export const predictionAnalysisService = new PredictionAnalysisService();
