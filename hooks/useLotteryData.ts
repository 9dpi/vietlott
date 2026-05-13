import { useState, useEffect, useCallback } from 'react';
import { DrawResult, LotteryType } from '../types.ts';
import { getInitialHistory } from '../services/initialData.ts';
import { lotteryDataService } from '../services/lotteryDataService.ts';

export const useLotteryData = (selectedLottery: LotteryType) => {
  const [history, setHistory] = useState<DrawResult[]>([]);
  const [isLoadingRealData, setIsLoadingRealData] = useState<boolean>(false);
  const [isUsingRealData, setIsUsingRealData] = useState<boolean>(false);

  useEffect(() => {
    const loadLotteryData = async () => {
      setIsLoadingRealData(true);
      const storageKey = `drawHistory_${selectedLottery}`;

      try {
        const realData = await lotteryDataService.getLotteryData(selectedLottery, true, 2000);
        if (realData && realData.length > 0) {
          setHistory(realData);
          setIsUsingRealData(await lotteryDataService.isUsingRealData(selectedLottery));
          localStorage.setItem(storageKey, JSON.stringify(realData));
        } else {
          throw new Error('No real data available');
        }
      } catch (error) {
        console.warn('Failed to load real data, using fallback:', error);
        try {
          const cachedData = localStorage.getItem(storageKey);
          if (cachedData) {
            setHistory(JSON.parse(cachedData));
          } else {
            const initialData = getInitialHistory(selectedLottery);
            setHistory(initialData);
            localStorage.setItem(storageKey, JSON.stringify(initialData));
          }
          setIsUsingRealData(false);
        } catch (cacheError) {
          console.error("Failed to load draw history from cache", cacheError);
          const initialData = getInitialHistory(selectedLottery);
          setHistory(initialData);
          setIsUsingRealData(false);
        }
      } finally {
        setIsLoadingRealData(false);
      }
    };

    loadLotteryData();
  }, [selectedLottery]);

  const updateDrawHistory = useCallback((newHistory: DrawResult[]) => {
    const sortedHistory = [...newHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(sortedHistory);
    localStorage.setItem(`drawHistory_${selectedLottery}`, JSON.stringify(sortedHistory));
  }, [selectedLottery]);

  const refreshData = useCallback(async () => {
    setIsLoadingRealData(true);
    try {
      const refreshedData = await lotteryDataService.refreshData(selectedLottery, 2000);
      setHistory(refreshedData);
      setIsUsingRealData(await lotteryDataService.isUsingRealData(selectedLottery));
      localStorage.setItem(`drawHistory_${selectedLottery}`, JSON.stringify(refreshedData));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoadingRealData(false);
    }
  }, [selectedLottery]);

  return {
    history,
    isLoadingRealData,
    isUsingRealData,
    updateDrawHistory,
    refreshData
  };
};
