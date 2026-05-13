import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { LotterySelector } from './components/LotterySelector.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Footer } from './components/Footer.tsx';
import { DataManagementModal } from './components/DataManagementModal.tsx';
import { NumberInspectorModal } from './components/NumberInspectorModal.tsx';
import { SimulationControls } from './components/SimulationControls.tsx';
import { SimulationResultModal } from './components/SimulationResultModal.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';
import { SubscriptionModal } from './components/SubscriptionModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { BacktestPanel } from './components/BacktestPanel.tsx';
import { SelfLearningPanel } from './components/SelfLearningPanel.tsx';
import { DataImportPanel } from './components/DataImportPanel.tsx';
import { Toaster, toast } from 'react-hot-toast';

import { startupServices } from './services/startup.ts';
import { autoFetchService, AutoFetchStatus } from './services/autoFetchService.ts';
import { useStore } from './hooks/useStore.ts';
import { useLotteryData } from './hooks/useLotteryData.ts';
import { useSimulation } from './hooks/useSimulation.ts';
import { DrawResult } from './types.ts';

// Import service loader
import './services/serviceLoader.ts';

const App: React.FC = () => {
  const {
    selectedLottery, setSelectedLottery,
    predictionHistory, addPrediction,
    isDataModalOpen, setIsDataModalOpen,
    isApiKeyModalOpen, setIsApiKeyModalOpen,
    isSubscriptionModalOpen, setIsSubscriptionModalOpen,
    isAdminDashboardOpen, setIsAdminDashboardOpen,
    isBacktestOpen, setIsBacktestOpen,
    isSelfLearningOpen, setIsSelfLearningOpen,
    isDataImportOpen, setIsDataImportOpen,
    inspectedNumber, setInspectedNumber
  } = useStore();

  const { 
    history, 
    isLoadingRealData, 
    isUsingRealData, 
    updateDrawHistory, 
    refreshData 
  } = useLotteryData(selectedLottery);

  const {
    isSimulationMode, setIsSimulationMode,
    simulationDate, setSimulationDate,
    revealedDraw, setRevealedDraw,
    visibleHistory, handleRevealDraw
  } = useSimulation(history, predictionHistory);

  // Auto-fetch state
  const [autoFetchStatus, setAutoFetchStatus] = useState<AutoFetchStatus>(autoFetchService.getStatus());
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);

  // Initialize automation services on startup
  useEffect(() => {
    startupServices();
  }, []);

  // Subscribe to auto-fetch status changes
  useEffect(() => {
    const unsubscribe = autoFetchService.onStatusChange(setAutoFetchStatus);
    return unsubscribe;
  }, []);

  // Auto-fetch listener: when new data arrives, update history
  const handleAutoFetchData = useCallback((data: DrawResult[], lotteryType: typeof selectedLottery) => {
    if (lotteryType === selectedLottery) {
      updateDrawHistory(data);
      toast.success(`✅ Auto-fetched ${data.length} latest results for ${lotteryType}`, {
        duration: 4000,
        icon: '🔄',
      });
    }
  }, [selectedLottery, updateDrawHistory]);

  // Toggle auto-fetch
  const handleToggleAutoFetch = useCallback(() => {
    const nowEnabled = autoFetchService.toggle([handleAutoFetchData]);
    setAutoFetchEnabled(nowEnabled);
    if (nowEnabled) {
      toast.success('Đã bật tự động lấy kết quả. Hệ thống sẽ cập nhật sau mỗi kỳ quay.', {
        icon: '⏰',
        duration: 4000,
      });
    } else {
      toast('Đã tắt tự động lấy kết quả.', { icon: '⏸️' });
    }
  }, [handleAutoFetchData]);

  const handleSaveApiKey = (apiKey: string) => {
    sessionStorage.setItem('geminiApiKey', apiKey);
    setIsApiKeyModalOpen(false);
    toast.success('API Key saved successfully!');
  };

  const handlePredictionGenerated = (prediction: any) => {
    addPrediction(prediction, isSimulationMode, simulationDate);
  };

  const handleRefreshData = async () => {
    const refreshPromise = refreshData();
    toast.promise(refreshPromise, {
      loading: 'Đang làm mới dữ liệu...',
      success: 'Cập nhật dữ liệu thành công!',
      error: 'Không thể làm mới dữ liệu',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } 
        }} 
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <SimulationControls
          isSimulationMode={isSimulationMode}
          onToggle={setIsSimulationMode}
          simulationDate={simulationDate}
          onDateChange={setSimulationDate}
          onReveal={handleRevealDraw}
          history={history}
          latestPrediction={predictionHistory[0]}
        />

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 flex-wrap">
            <LotterySelector
              selectedLottery={selectedLottery}
              onSelectLottery={setSelectedLottery}
            />

            {/* Data Source Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-inner ${
                isUsingRealData
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isUsingRealData ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                }`}></div>
                {isLoadingRealData ? 'Đang tải...' : (isUsingRealData ? 'Dữ liệu thực' : 'Dữ liệu mẫu')}
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={handleRefreshData}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md disabled:opacity-50"
                disabled={isSimulationMode || isLoadingRealData}
                title="Làm mới dữ liệu xổ số"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoadingRealData ? 'animate-spin text-indigo-400' : ''}>
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                Làm Mới
              </button>

              {/* Auto-Fetch Toggle */}
              <button
                onClick={handleToggleAutoFetch}
                disabled={isSimulationMode}
                title={autoFetchEnabled 
                  ? `Tự động fetch ĐANG BẬT · Lần tiếp: ${autoFetchStatus.nextFetchTime ? new Date(autoFetchStatus.nextFetchTime).toLocaleString('vi-VN') : 'Sắp tới'}`
                  : 'Bật tự động tải kết quả sau mỗi kỳ quay'
                }
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all border shadow-md disabled:opacity-50 ${
                  autoFetchEnabled
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {autoFetchEnabled ? `Tự Động ✓` : 'Tự Động'}
                {autoFetchEnabled && autoFetchStatus.fetchCount > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-1.5 py-0.5 rounded-full">
                    {autoFetchStatus.fetchCount}
                  </span>
                )}
              </button>

              {/* Backtest Button */}
              <button
                onClick={() => setIsBacktestOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Backtest
              </button>

              {/* Self-Learning Button */}
              <button
                onClick={() => setIsSelfLearningOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                  <path d="M9 21h6"/>
                  <path d="M10 17v4"/>
                  <path d="M14 17v4"/>
                </svg>
                Tự Học
              </button>

              {/* Import Dữ Liệu */}
              <button
                onClick={() => setIsDataImportOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Nhập Dữ Liệu
              </button>

              <button
                onClick={() => setIsDataModalOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md disabled:opacity-50"
                disabled={isSimulationMode}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 15v5"/><path d="M12 4v3"/><path d="M18 7v3"/><path d="M6 7v3"/><path d="M12 10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z"/></svg>
                Quản Lý Dữ Liệu
              </button>

              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Thông Báo Email
              </button>

              <button
                onClick={() => setIsAdminDashboardOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 shadow-md group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/></svg>
                Quản Trị
              </button>
            </div>
        </div>

        <ErrorBoundary fallbackMessage="The main dashboard encountered an error. Please try refreshing the data.">
          <Dashboard 
            lotteryType={selectedLottery} 
            history={visibleHistory} 
            predictionHistory={predictionHistory}
            onPredictionGenerated={handlePredictionGenerated}
            onSelectNumber={setInspectedNumber}
            isSimulationActive={isSimulationMode}
            onRequestApiKey={() => setIsApiKeyModalOpen(true)}
          />
        </ErrorBoundary>
      </main>
      <Footer />

      {/* Modals */}
      {isDataModalOpen && (
        <DataManagementModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          lotteryType={selectedLottery}
          drawHistory={history}
          onHistoryUpdate={updateDrawHistory}
        />
      )}
      {inspectedNumber !== null && (
        <NumberInspectorModal
          isOpen={inspectedNumber !== null}
          onClose={() => setInspectedNumber(null)}
          number={inspectedNumber}
          lotteryType={selectedLottery}
          fullHistory={visibleHistory}
        />
      )}
      {revealedDraw && (
        <SimulationResultModal
          isOpen={!!revealedDraw}
          onClose={() => setRevealedDraw(null)}
          result={revealedDraw}
        />
      )}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={handleSaveApiKey}
        />
      )}
      {isSubscriptionModalOpen && (
        <ErrorBoundary fallbackMessage="The subscription modal encountered an error.">
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
          />
        </ErrorBoundary>
      )}
      {isAdminDashboardOpen && (
        <ErrorBoundary fallbackMessage="The Admin Dashboard encountered an error. Please restart it.">
          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
          />
        </ErrorBoundary>
      )}
      {isBacktestOpen && (
        <ErrorBoundary fallbackMessage="The Backtest panel encountered an error.">
          <BacktestPanel
            isOpen={isBacktestOpen}
            onClose={() => setIsBacktestOpen(false)}
            history={history}
            lotteryType={selectedLottery}
          />
        </ErrorBoundary>
      )}
      {isSelfLearningOpen && (
        <ErrorBoundary fallbackMessage="The Self-Learning panel encountered an error.">
          <SelfLearningPanel
            isOpen={isSelfLearningOpen}
            onClose={() => setIsSelfLearningOpen(false)}
            predictionHistory={predictionHistory}
            drawHistory={history}
            lotteryType={selectedLottery}
          />
        </ErrorBoundary>
      )}
      {isDataImportOpen && (
        <ErrorBoundary fallbackMessage="Lỗi khi mở panel import.">
          <DataImportPanel
            isOpen={isDataImportOpen}
            onClose={() => setIsDataImportOpen(false)}
            onDataImported={(lotteryType) => {
              toast.success(`Đã import dữ liệu lịch sử ${lotteryType} thành công!`, { icon: '📊', duration: 4000 });
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default App;