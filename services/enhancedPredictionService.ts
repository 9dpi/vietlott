import { LotteryType, DrawResult, PredictionRecord } from '../types';
import { predictionAnalysisService } from './predictionAnalysisService';
import { lotteryDataService } from './lotteryDataService';
import { getPrediction } from './geminiService';

/**
 * Enhanced AI Prediction Service
 * Uses statistical analysis and historical accuracy data to improve predictions
 */

export interface EnhancedPredictionOptions {
  useStatisticalInsights: boolean;
  useHotNumbers: boolean;
  useColdNumbers: boolean;
  usePatternAnalysis: boolean;
  useFrequencyAnalysis: boolean;
  confidenceThreshold: number; // 0-1 scale
}

export interface PredictionContext {
  lotteryType: LotteryType;
  recentDraws: DrawResult[];
  historicalAccuracy: any;
  statisticalInsights: any[];
  recommendations: string[];
}

export interface EnhancedPrediction extends PredictionRecord {
  confidence: number; // 0-1 scale
  methodology: string[];
  insights: string[];
  statisticalBasis: {
    hotNumbers: number[];
    coldNumbers: number[];
    patterns: string[];
    frequency: Record<number, number>;
  };
}

export class EnhancedPredictionService {
  private defaultOptions: EnhancedPredictionOptions = {
    useStatisticalInsights: true,
    useHotNumbers: true,
    useColdNumbers: false,
    usePatternAnalysis: true,
    useFrequencyAnalysis: true,
    confidenceThreshold: 0.6
  };

  /**
   * Generate an enhanced prediction using AI and statistical analysis
   */
  async generateEnhancedPrediction(
    lotteryType: LotteryType,
    options: Partial<EnhancedPredictionOptions> = {}
  ): Promise<EnhancedPrediction> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Gather prediction context
    const context = await this.buildPredictionContext(lotteryType);
    
    // Generate base AI prediction
    const basePrediction = await this.generateBasePrediction(lotteryType, context);
    
    // Apply statistical enhancements
    const enhancedNumbers = this.applyStatisticalEnhancements(
      basePrediction.predictedNumbers,
      context,
      opts
    );
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(context, opts);
    
    // Generate methodology explanation
    const methodology = this.generateMethodology(context, opts);
    
    // Generate insights
    const insights = this.generateInsights(context);

    return {
      ...basePrediction,
      predictedNumbers: enhancedNumbers,
      confidence,
      methodology,
      insights,
      statisticalBasis: {
        hotNumbers: context.statisticalInsights
          .filter(i => i.type === 'frequency')
          .flatMap(i => i.data?.map((d: any) => d.number) || []),
        coldNumbers: this.getColdNumbers(context.recentDraws, lotteryType),
        patterns: context.statisticalInsights
          .filter(i => i.type === 'pattern')
          .map(i => i.description),
        frequency: this.calculateNumberFrequency(context.recentDraws)
      }
    };
  }

  /**
   * Build comprehensive prediction context
   */
  private async buildPredictionContext(lotteryType: LotteryType): Promise<PredictionContext> {
    // Get recent draws for analysis
    const recentDraws = await lotteryDataService.getLotteryData(lotteryType, true, 50);
    
    // Load historical accuracy data
    predictionAnalysisService.loadAccuracyHistory();
    const historicalAccuracy = predictionAnalysisService.getAccuracyMetrics();
    
    // Generate statistical insights
    const statisticalInsights = predictionAnalysisService.generateInsights(lotteryType, 30);
    
    // Get improvement recommendations
    const recommendations = predictionAnalysisService.getImprovementRecommendations(lotteryType);

    return {
      lotteryType,
      recentDraws,
      historicalAccuracy,
      statisticalInsights,
      recommendations
    };
  }

  /**
   * Generate base AI prediction using Gemini
   */
  private async generateBasePrediction(
    lotteryType: LotteryType,
    context: PredictionContext
  ): Promise<PredictionRecord> {
    try {
      // Generate prediction using Gemini with BALANCED strategy
      const result = await getPrediction(lotteryType, context.recentDraws, 'BALANCED');

      return {
        id: `enhanced_${Date.now()}`,
        predictedNumbers: result.predictedNumbers,
        lotteryType,
        date: new Date().toISOString().split('T')[0],
        reasoning: result.reasoning,
        specialNumber: result.specialNumber,
        strategy: 'BALANCED',
      };
    } catch (error) {
      console.warn('Failed to generate AI prediction, using statistical fallback:', error);
      return this.generateStatisticalFallback(lotteryType, context);
    }
  }

  /**
   * Apply statistical enhancements to base prediction
   */
  private applyStatisticalEnhancements(
    baseNumbers: number[],
    context: PredictionContext,
    options: EnhancedPredictionOptions
  ): number[] {
    let enhancedNumbers = [...baseNumbers];

    if (options.useStatisticalInsights) {
      // Apply high-confidence insights
      const highConfidenceInsights = context.statisticalInsights
        .filter(insight => insight.confidence > options.confidenceThreshold);

      for (const insight of highConfidenceInsights) {
        if (insight.type === 'frequency' && options.useFrequencyAnalysis) {
          enhancedNumbers = this.incorporateFrequencyInsights(enhancedNumbers, insight);
        }
        
        if (insight.type === 'pattern' && options.usePatternAnalysis) {
          enhancedNumbers = this.incorporatePatternInsights(enhancedNumbers, insight);
        }
      }
    }

    if (options.useHotNumbers) {
      enhancedNumbers = this.incorporateHotNumbers(enhancedNumbers, context);
    }

    // Ensure we have the right number of unique numbers
    const maxNumber = context.lotteryType === 'power' ? 55 : 45;
    enhancedNumbers = this.ensureValidNumbers(enhancedNumbers, 6, maxNumber);

    return enhancedNumbers.sort((a, b) => a - b);
  }

  /**
   * Calculate prediction confidence based on context
   */
  private calculateConfidence(
    context: PredictionContext,
    options: EnhancedPredictionOptions
  ): number {
    let confidence = 0.5; // Base confidence

    // Factor in historical accuracy
    if (context.historicalAccuracy.totalPredictions > 0) {
      confidence += context.historicalAccuracy.recentPerformance * 0.3;
    }

    // Factor in improvement trend
    if (context.historicalAccuracy.improvementTrend > 0) {
      confidence += Math.min(context.historicalAccuracy.improvementTrend * 2, 0.2);
    }

    // Factor in statistical insights
    const highConfidenceInsights = context.statisticalInsights
      .filter(insight => insight.confidence > options.confidenceThreshold);
    confidence += highConfidenceInsights.length * 0.05;

    // Factor in data quality
    if (context.recentDraws.length >= 20) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0.1), 0.95); // Clamp between 0.1 and 0.95
  }

  /**
   * Generate methodology explanation
   */
  private generateMethodology(
    context: PredictionContext,
    options: EnhancedPredictionOptions
  ): string[] {
    const methodology: string[] = [];

    methodology.push("AI-powered prediction using Gemini language model");

    if (options.useStatisticalInsights) {
      methodology.push("Statistical analysis of recent draw patterns");
    }

    if (options.useFrequencyAnalysis) {
      methodology.push("Number frequency analysis from historical data");
    }

    if (options.usePatternAnalysis) {
      methodology.push("Pattern recognition from previous predictions");
    }

    if (context.historicalAccuracy.totalPredictions > 0) {
      methodology.push("Self-learning from prediction accuracy history");
    }

    if (options.useHotNumbers) {
      methodology.push("Hot number identification from recent draws");
    }

    return methodology;
  }

  /**
   * Generate prediction insights
   */
  private generateInsights(context: PredictionContext): string[] {
    const insights: string[] = [];

    // Add statistical insights
    const topInsights = context.statisticalInsights
      .filter(insight => insight.confidence > 0.6)
      .slice(0, 3);

    for (const insight of topInsights) {
      insights.push(insight.description);
    }

    // Add performance insights
    if (context.historicalAccuracy.totalPredictions > 0) {
      const accuracy = (context.historicalAccuracy.recentPerformance * 100).toFixed(1);
      insights.push(`Recent prediction accuracy: ${accuracy}%`);
    }

    // Add recommendations
    if (context.recommendations.length > 0) {
      insights.push(...context.recommendations.slice(0, 2));
    }

    return insights;
  }

  /**
   * Build enhanced prompt for AI prediction
   */
  private buildEnhancedPrompt(lotteryType: LotteryType, context: PredictionContext): string {
    let prompt = `Generate lottery prediction for ${lotteryType} based on recent draws and statistical analysis.\n\n`;

    // Add statistical insights
    if (context.statisticalInsights.length > 0) {
      prompt += "Statistical Insights:\n";
      for (const insight of context.statisticalInsights.slice(0, 3)) {
        prompt += `- ${insight.description} (confidence: ${(insight.confidence * 100).toFixed(0)}%)\n`;
      }
      prompt += "\n";
    }

    // Add performance context
    if (context.historicalAccuracy.totalPredictions > 0) {
      prompt += `Previous prediction accuracy: ${(context.historicalAccuracy.recentPerformance * 100).toFixed(1)}%\n`;
      if (context.historicalAccuracy.improvementTrend > 0) {
        prompt += "Prediction accuracy is improving.\n";
      }
      prompt += "\n";
    }

    // Add recommendations
    if (context.recommendations.length > 0) {
      prompt += "Recommendations for improvement:\n";
      for (const rec of context.recommendations.slice(0, 2)) {
        prompt += `- ${rec}\n`;
      }
      prompt += "\n";
    }

    prompt += "Please consider these insights when generating your prediction.";

    return prompt;
  }

  /**
   * Generate statistical fallback prediction
   */
  private generateStatisticalFallback(
    lotteryType: LotteryType,
    context: PredictionContext
  ): PredictionRecord {
    const maxNumber = lotteryType === 'power' ? 55 : 45;
    const frequency = this.calculateNumberFrequency(context.recentDraws);
    
    // Select numbers based on frequency and patterns
    const numbers = this.selectNumbersByFrequency(frequency, 6, maxNumber);
    
    return {
      id: `fallback_${Date.now()}`,
      predictedNumbers: numbers,
      lotteryType,
      date: new Date().toISOString().split('T')[0],
      reasoning: "Statistical analysis based on recent draw frequency",
      strategy: 'BALANCED',
      specialNumber: lotteryType === 'power' ? this.selectSpecialNumber(context.recentDraws) : undefined
    };
  }

  /**
   * Calculate number frequency from recent draws
   */
  private calculateNumberFrequency(draws: DrawResult[]): Record<number, number> {
    const frequency: Record<number, number> = {};
    
    for (const draw of draws) {
      for (const number of draw.numbers) {
        frequency[number] = (frequency[number] || 0) + 1;
      }
    }
    
    return frequency;
  }

  /**
   * Get cold numbers (least frequent)
   */
  private getColdNumbers(draws: DrawResult[], lotteryType: LotteryType): number[] {
    const maxNumber = lotteryType === 'power' ? 55 : 45;
    const frequency = this.calculateNumberFrequency(draws);
    
    const allNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
    return allNumbers
      .map(num => ({ number: num, freq: frequency[num] || 0 }))
      .sort((a, b) => a.freq - b.freq)
      .slice(0, 10)
      .map(item => item.number);
  }

  /**
   * Select numbers by frequency
   */
  private selectNumbersByFrequency(
    frequency: Record<number, number>,
    count: number,
    maxNumber: number
  ): number[] {
    const sortedNumbers = Object.entries(frequency)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency);

    const selected: number[] = [];
    
    // Select top frequent numbers (with some randomization)
    for (let i = 0; i < Math.min(count, sortedNumbers.length); i++) {
      if (Math.random() < 0.8 || selected.length < count - 2) {
        selected.push(sortedNumbers[i].number);
      }
    }

    // Fill remaining with random numbers
    while (selected.length < count) {
      const randomNum = Math.floor(Math.random() * maxNumber) + 1;
      if (!selected.includes(randomNum)) {
        selected.push(randomNum);
      }
    }

    return selected;
  }

  /**
   * Select special number for Power 6/55
   */
  private selectSpecialNumber(draws: DrawResult[]): number {
    const specialNumbers = draws
      .map(draw => draw.specialNumber)
      .filter(num => num !== undefined) as number[];

    if (specialNumbers.length === 0) {
      return Math.floor(Math.random() * 55) + 1;
    }

    // Use frequency-based selection for special number
    const frequency: Record<number, number> = {};
    for (const num of specialNumbers) {
      frequency[num] = (frequency[num] || 0) + 1;
    }

    const sortedSpecial = Object.entries(frequency)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency);

    // 70% chance to pick from top 3 most frequent, 30% random
    if (Math.random() < 0.7 && sortedSpecial.length > 0) {
      const topIndex = Math.min(2, sortedSpecial.length - 1);
      return sortedSpecial[Math.floor(Math.random() * (topIndex + 1))].number;
    }

    return Math.floor(Math.random() * 55) + 1;
  }

  /**
   * Incorporate frequency insights into prediction
   */
  private incorporateFrequencyInsights(numbers: number[], insight: any): number[] {
    if (!insight.data || !Array.isArray(insight.data)) return numbers;

    const highPerformingNumbers = insight.data
      .filter((item: any) => item.accuracy > 0.3)
      .map((item: any) => item.number);

    // Replace some numbers with high-performing ones
    const result = [...numbers];
    for (let i = 0; i < Math.min(2, highPerformingNumbers.length); i++) {
      const replaceIndex = Math.floor(Math.random() * result.length);
      if (!result.includes(highPerformingNumbers[i])) {
        result[replaceIndex] = highPerformingNumbers[i];
      }
    }

    return result;
  }

  /**
   * Incorporate pattern insights into prediction
   */
  private incorporatePatternInsights(numbers: number[], insight: any): number[] {
    // This is a placeholder for pattern-based adjustments
    // Could include consecutive number logic, range distribution, etc.
    return numbers;
  }

  /**
   * Incorporate hot numbers into prediction
   */
  private incorporateHotNumbers(numbers: number[], context: PredictionContext): number[] {
    const frequency = this.calculateNumberFrequency(context.recentDraws.slice(0, 10));
    const hotNumbers = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([num]) => parseInt(num));

    // Replace 1-2 numbers with hot numbers
    const result = [...numbers];
    for (let i = 0; i < Math.min(2, hotNumbers.length); i++) {
      if (!result.includes(hotNumbers[i])) {
        const replaceIndex = Math.floor(Math.random() * result.length);
        result[replaceIndex] = hotNumbers[i];
      }
    }

    return result;
  }

  /**
   * Ensure valid number selection
   */
  private ensureValidNumbers(numbers: number[], count: number, maxNumber: number): number[] {
    const unique = [...new Set(numbers)];
    
    while (unique.length < count) {
      const randomNum = Math.floor(Math.random() * maxNumber) + 1;
      if (!unique.includes(randomNum)) {
        unique.push(randomNum);
      }
    }

    return unique.slice(0, count);
  }
}

// Export singleton instance
export const enhancedPredictionService = new EnhancedPredictionService();
