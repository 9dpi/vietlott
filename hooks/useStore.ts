import { create } from 'zustand';
import { LotteryType, PredictionRecord } from '../types.ts';
import { LOTTERY_TYPES } from '../constants.ts';

interface AppState {
  // Lottery Selection
  selectedLottery: LotteryType;
  setSelectedLottery: (lottery: LotteryType) => void;

  // Prediction History
  predictionHistory: PredictionRecord[];
  setPredictionHistory: (history: PredictionRecord[]) => void;
  addPrediction: (prediction: Omit<PredictionRecord, 'id' | 'date'>, isSimulationMode: boolean, simulationDate: string) => void;

  // Modals & UI States
  isDataModalOpen: boolean;
  setIsDataModalOpen: (isOpen: boolean) => void;
  
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (isOpen: boolean) => void;
  
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (isOpen: boolean) => void;
  
  isAdminDashboardOpen: boolean;
  setIsAdminDashboardOpen: (isOpen: boolean) => void;

  isBacktestOpen: boolean;
  setIsBacktestOpen: (isOpen: boolean) => void;

  isSelfLearningOpen: boolean;
  setIsSelfLearningOpen: (isOpen: boolean) => void;
  
  inspectedNumber: number | null;
  setInspectedNumber: (number: number | null) => void;
}

export const useStore = create<AppState>((set, get) => {
  // Try loading prediction history from localStorage
  let initialPredictionHistory: PredictionRecord[] = [];
  try {
    const stored = localStorage.getItem('predictionHistory');
    if (stored) {
      initialPredictionHistory = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load prediction history", e);
  }

  return {
    selectedLottery: LOTTERY_TYPES.POWER,
    setSelectedLottery: (lottery) => set({ selectedLottery: lottery }),

    predictionHistory: initialPredictionHistory,
    setPredictionHistory: (history) => set({ predictionHistory: history }),
    addPrediction: (prediction, isSimulationMode, simulationDate) => {
      set((state) => {
        const newRecord: PredictionRecord = {
          ...prediction,
          id: new Date().toISOString(),
          date: isSimulationMode ? simulationDate : new Date().toLocaleDateString('en-CA'),
        };
        const updatedHistory = [newRecord, ...state.predictionHistory].slice(0, 20);
        localStorage.setItem('predictionHistory', JSON.stringify(updatedHistory));
        return { predictionHistory: updatedHistory };
      });
    },

    isDataModalOpen: false,
    setIsDataModalOpen: (isOpen) => set({ isDataModalOpen: isOpen }),

    isApiKeyModalOpen: false,
    setIsApiKeyModalOpen: (isOpen) => set({ isApiKeyModalOpen: isOpen }),

    isSubscriptionModalOpen: false,
    setIsSubscriptionModalOpen: (isOpen) => set({ isSubscriptionModalOpen: isOpen }),

    isAdminDashboardOpen: false,
    setIsAdminDashboardOpen: (isOpen) => set({ isAdminDashboardOpen: isOpen }),

    isBacktestOpen: false,
    setIsBacktestOpen: (isOpen) => set({ isBacktestOpen: isOpen }),

    isSelfLearningOpen: false,
    setIsSelfLearningOpen: (isOpen) => set({ isSelfLearningOpen: isOpen }),

    inspectedNumber: null,
    setInspectedNumber: (num) => set({ inspectedNumber: num }),
  };
});
