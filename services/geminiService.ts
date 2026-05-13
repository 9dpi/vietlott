import { GoogleGenAI, Type } from "@google/genai";
import { LotteryType, DrawResult, LotteryConfig, AIStrategy } from '../types';
import { LOTTERY_CONFIG, AI_STRATEGIES } from '../constants';
import { predictionAnalysisService } from './predictionAnalysisService';

function getAiClient() {
  const apiKey = sessionStorage.getItem('geminiApiKey');
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }
  return new GoogleGenAI({ apiKey });
}

function preparePrompt(
  lotteryType: LotteryType, 
  history: DrawResult[], 
  strategy: AIStrategy,
  lockedNumbers?: number[]
): string {
  const config: LotteryConfig = LOTTERY_CONFIG[lotteryType];
  const analysisDepth = Math.min(history.length, 50);
  const recentSlice = Math.min(history.length, 10);
  const fullHistory = history.slice(0, analysisDepth);
  const recentHistory = history.slice(0, recentSlice);

  const calculateFrequencies = (data: DrawResult[]) => {
      const freq = new Map<number, number>();
      data.forEach(draw => draw.numbers.forEach(num => freq.set(num, (freq.get(num) || 0) + 1)));
      return freq;
  };

  const overallFreq = calculateFrequencies(fullHistory);
  const recentFreq = calculateFrequencies(recentHistory);

  const momentumNumbers = Array.from(recentFreq.entries())
    .filter(([num, count]) => count > (overallFreq.get(num) || 0) / (analysisDepth / recentSlice))
    .map(e => e[0])
    .join(', ') || 'None';

  const sortedFrequencies = Array.from(overallFreq.entries()).sort((a, b) => b[1] - a[1]);
  const hotNumbers = sortedFrequencies.slice(0, 5).map(e => e[0]).join(', ');
  const coldNumbers = sortedFrequencies.slice(-5).map(e => e[0]).join(', ');
  
  const strategyDescription = AI_STRATEGIES[strategy].description;

  // Lay insights tu he thong tu hoc
  const insights = predictionAnalysisService.generateInsights(lotteryType, 300); // lookback 300 days for broad patterns
  const insightText = insights.length > 0 
    ? insights.map(i => i.description).join('\n    - ') 
    : 'Chưa đủ dữ liệu tự học. Hãy dựa vào thống kê cơ bản.';

  const lockedNumbersPrompt = lockedNumbers && lockedNumbers.length > 0
    ? `The user has locked in the numbers: ${lockedNumbers.join(', ')}. Your primary task is to find the best ${config.mainNumbers - lockedNumbers.length} companion numbers to complete their ticket. The final set must include the locked numbers.`
    : '';

  const prompt = `
    You are a data analysis expert specializing in probability and lottery systems.
    Your task is to predict the next winning numbers for the Vietnamese lottery: ${config.name}.

    GAME RULES:
    - Main Numbers: Select ${config.mainNumbers} unique numbers from 1 to ${config.range}.
    ${config.specialNumbers ? `- Special Number: Select ${config.specialNumbers} number from 1 to ${config.range}.` : ''}
    - Your final prediction must contain exactly ${config.mainNumbers} unique numbers.

    DEEP HISTORICAL ANALYSIS (based on last ${analysisDepth} draws, with trends from last ${recentSlice}):
    - Hot Numbers (most frequent overall): ${hotNumbers}
    - Cold Numbers (least frequent overall): ${coldNumbers}
    - Momentum Numbers (appearing more often recently): ${momentumNumbers}

    AI SELF-LEARNING INSIGHTS (from past prediction simulations):
    - ${insightText}
    
    YOUR TASK:
    1.  ${lockedNumbersPrompt || 'Based on the deep analysis and self-learning insights, generate a set of predicted numbers.'}
    2.  Adhere to the selected user strategy: "${strategy} - ${strategyDescription}".
    3.  Provide a single, concise sentence explaining the reasoning for your number selection based on the chosen strategy and the data. For example: "The numbers balance hot and cold picks while maintaining a common odd/even ratio."

    Generate your response in the specified JSON format. The predicted numbers array MUST contain exactly ${config.mainNumbers} unique numbers.
  `;
  return prompt;
}

export async function getPrediction(
    lotteryType: LotteryType, 
    history: DrawResult[],
    strategy: AIStrategy,
    lockedNumbers?: number[]
): Promise<{ predictedNumbers: number[], specialNumber?: number, reasoning: string }> {
  
  const ai = getAiClient(); // Throws if no key
  
  const config = LOTTERY_CONFIG[lotteryType];
  const prompt = preparePrompt(lotteryType, history, strategy, lockedNumbers);

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      predictedNumbers: {
        type: Type.ARRAY,
        description: `An array of ${config.mainNumbers} unique numbers predicted to be drawn. Numbers must be between 1 and ${config.range}.`,
        items: { type: Type.INTEGER },
      },
      ...(config.specialNumbers && {
        specialNumber: {
          type: Type.INTEGER,
          description: `The predicted special number, between 1 and ${config.range}.`,
        }
      }),
      reasoning: {
        type: Type.STRING,
        description: "A concise, single-sentence explanation for the number selection based on the chosen strategy and data analysis."
      }
    },
    required: ['predictedNumbers', 'reasoning'],
  };


  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 1.0,
      topP: 0.95,
    }
  });

  const jsonText = result.text.trim();
  try {
    const parsedJson = JSON.parse(jsonText);
    
    const predictedNumbers = parsedJson.predictedNumbers as number[];
    if (!Array.isArray(predictedNumbers) || predictedNumbers.length === 0) {
        throw new Error("AI response did not contain valid predicted numbers.");
    }
     if (predictedNumbers.length !== config.mainNumbers) {
        throw new Error(`AI returned ${predictedNumbers.length} numbers, but expected ${config.mainNumbers}.`);
    }
    if (!parsedJson.reasoning || typeof parsedJson.reasoning !== 'string') {
        throw new Error("AI response did not contain valid reasoning text.");
    }
    
    const response: { predictedNumbers: number[], specialNumber?: number, reasoning: string } = {
        predictedNumbers: predictedNumbers.sort((a,b) => a-b),
        reasoning: parsedJson.reasoning
    };

    if (config.specialNumbers && typeof parsedJson.specialNumber === 'number') {
        response.specialNumber = parsedJson.specialNumber;
    }

    return response;

  } catch (e) {
    console.error("Failed to parse AI response:", jsonText, e);
    throw new Error("AI returned an invalid response format.");
  }
}