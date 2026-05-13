import { LotteryType, DrawResult } from '../types';
import { LOTTERY_TYPES } from '../constants';

/**
 * Vietnamese Vietlott Draw Schedule:
 * - Power 6/55: Tuesday (3), Thursday (5), Saturday (7) — 18:00 ICT
 * - Mega 6/45: Wednesday (4), Friday (6), Sunday (0) — 18:00 ICT
 */
const DRAW_SCHEDULE: Record<LotteryType, number[]> = {
  [LOTTERY_TYPES.POWER]: [2, 4, 6], // Tue, Thu, Sat (JS: 0=Sun)
  [LOTTERY_TYPES.MEGA]: [3, 5, 0],  // Wed, Fri, Sun
};

const DRAW_HOUR_ICT = 18; // 18:00 ICT = UTC+7
const ICT_OFFSET_HOURS = 7;

export type FetchListener = (data: DrawResult[], lotteryType: LotteryType) => void;
export type StatusListener = (status: AutoFetchStatus) => void;

export interface AutoFetchStatus {
  isEnabled: boolean;
  lastFetchTime: string | null;
  nextFetchTime: string | null;
  fetchCount: number;
  consecutiveErrors: number;
}

class AutoFetchService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: FetchListener[] = [];
  private statusListeners: StatusListener[] = [];
  private status: AutoFetchStatus = {
    isEnabled: false,
    lastFetchTime: null,
    nextFetchTime: null,
    fetchCount: 0,
    consecutiveErrors: 0,
  };

  // Check interval: every 5 minutes
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000;
  // Fetch window: 15 minutes after the scheduled draw
  private readonly FETCH_WINDOW_MINUTES = 15;

  /**
   * Start the auto-fetch scheduler
   */
  start(listeners: FetchListener[]) {
    if (this.intervalId) return; // Already running

    this.listeners = listeners;
    this.status.isEnabled = true;
    this.updateNextFetchTime();
    this.notifyStatusListeners();

    console.log('[AutoFetch] Service started. Checking schedule every 5 minutes.');

    // Initial check immediately
    this.checkAndFetch();

    this.intervalId = setInterval(() => {
      this.checkAndFetch();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop the auto-fetch scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.isEnabled = false;
    this.notifyStatusListeners();
    console.log('[AutoFetch] Service stopped.');
  }

  /**
   * Toggle the auto-fetch service
   */
  toggle(listeners: FetchListener[]) {
    if (this.status.isEnabled) {
      this.stop();
    } else {
      this.start(listeners);
    }
    return this.status.isEnabled;
  }

  /**
   * Get current status
   */
  getStatus(): AutoFetchStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(listener: StatusListener) {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  /**
   * Force an immediate fetch regardless of schedule
   */
  async forceFetch(lotteryType: LotteryType): Promise<DrawResult[]> {
    return this.fetchForType(lotteryType);
  }

  /**
   * Check if we should fetch data now based on the draw schedule
   */
  private checkAndFetch() {
    const now = new Date();
    const icTNow = new Date(now.getTime() + ICT_OFFSET_HOURS * 60 * 60 * 1000);
    const dayOfWeek = icTNow.getUTCDay(); // 0=Sun, 1=Mon, ...6=Sat
    const hour = icTNow.getUTCHours();
    const minute = icTNow.getUTCMinutes();

    const minutesSinceDraw = (hour - DRAW_HOUR_ICT) * 60 + minute;

    // Fetch if within 15 minutes after scheduled draw time
    if (minutesSinceDraw >= 0 && minutesSinceDraw <= this.FETCH_WINDOW_MINUTES) {
      // Check if we already fetched in this window (avoid double-fetch)
      if (this.shouldFetch(dayOfWeek)) {
        this.performScheduledFetch(dayOfWeek);
      }
    }

    this.updateNextFetchTime();
    this.notifyStatusListeners();
  }

  /**
   * Determine if we should fetch based on schedule and last fetch time
   */
  private shouldFetch(dayOfWeek: number): boolean {
    const lotteriesToFetch = this.getLotteriesForDay(dayOfWeek);
    if (lotteriesToFetch.length === 0) return false;

    if (!this.status.lastFetchTime) return true;

    const lastFetch = new Date(this.status.lastFetchTime);
    const now = new Date();
    // Don't fetch if we already fetched within the last 10 minutes
    const minutesSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
    return minutesSinceLastFetch > 10;
  }

  /**
   * Perform scheduled fetch for the appropriate lottery types
   */
  private async performScheduledFetch(dayOfWeek: number) {
    const lotteriesToFetch = this.getLotteriesForDay(dayOfWeek);
    console.log(`[AutoFetch] Scheduled fetch triggered for: ${lotteriesToFetch.join(', ')}`);

    for (const lotteryType of lotteriesToFetch) {
      try {
        const data = await this.fetchForType(lotteryType);
        this.status.lastFetchTime = new Date().toISOString();
        this.status.fetchCount++;
        this.status.consecutiveErrors = 0;
        this.listeners.forEach(l => l(data, lotteryType));
        console.log(`[AutoFetch] ✅ Fetched ${data.length} results for ${lotteryType}`);
      } catch (error) {
        this.status.consecutiveErrors++;
        console.error(`[AutoFetch] ❌ Failed to fetch for ${lotteryType}:`, error);
      }
    }

    this.notifyStatusListeners();
  }

  /**
   * Fetch data for a specific lottery type
   */
  private async fetchForType(lotteryType: LotteryType): Promise<DrawResult[]> {
    const { fetchRealLotteryData } = await import('./vietlottApiService');
    return fetchRealLotteryData(lotteryType, 100);
  }

  /**
   * Get which lotteries draw on a given day
   */
  private getLotteriesForDay(dayOfWeek: number): LotteryType[] {
    return (Object.keys(DRAW_SCHEDULE) as LotteryType[]).filter(
      type => DRAW_SCHEDULE[type].includes(dayOfWeek)
    );
  }

  /**
   * Calculate and update the next scheduled fetch time
   */
  private updateNextFetchTime() {
    const now = new Date();
    const icTNow = new Date(now.getTime() + ICT_OFFSET_HOURS * 60 * 60 * 1000);

    // Find next draw day
    const allDrawDays = [
      ...DRAW_SCHEDULE[LOTTERY_TYPES.POWER],
      ...DRAW_SCHEDULE[LOTTERY_TYPES.MEGA],
    ];

    const currentDayOfWeek = icTNow.getUTCDay();
    const currentHour = icTNow.getUTCHours();

    // Calculate days until next draw
    let minDaysUntilDraw = 7;
    for (const drawDay of allDrawDays) {
      let daysUntil = (drawDay - currentDayOfWeek + 7) % 7;
      if (daysUntil === 0 && currentHour >= DRAW_HOUR_ICT + 1) {
        daysUntil = 7; // Already past today's draw
      }
      minDaysUntilDraw = Math.min(minDaysUntilDraw, daysUntil);
    }

    const nextFetch = new Date(icTNow);
    nextFetch.setUTCDate(nextFetch.getUTCDate() + minDaysUntilDraw);
    nextFetch.setUTCHours(DRAW_HOUR_ICT + 1, 0, 0, 0);

    // Convert back to local time
    const nextFetchLocal = new Date(nextFetch.getTime() - ICT_OFFSET_HOURS * 60 * 60 * 1000);
    this.status.nextFetchTime = nextFetchLocal.toISOString();
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(l => l({ ...this.status }));
  }
}

export const autoFetchService = new AutoFetchService();
