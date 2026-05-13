import { LotteryType, LotteryConfig, AIStrategy } from './types.ts';

export const LOTTERY_TYPES = {
  MEGA: 'Mega 6/45',
  POWER: 'Power 6/55',
} as const;

export const LOTTERY_CONFIG: Record<LotteryType, LotteryConfig> = {
  [LOTTERY_TYPES.MEGA]: {
    name: 'Mega 6/45',
    range: 45,
    ballColor: 'bg-brand-red',
    mainNumbers: 6,
  },
  [LOTTERY_TYPES.POWER]: {
    name: 'Power 6/55',
    range: 55,
    ballColor: 'bg-brand-yellow text-slate-900',
    specialBallColor: 'bg-brand-red',
    mainNumbers: 6,
    specialNumbers: 1
  },
};

export const AI_STRATEGIES: Record<AIStrategy, { label: string; description: string }> = {
  BALANCED: {
    label: 'Cân Bằng',
    description: 'Kết hợp thông minh giữa số nóng, số lạnh và phân tích thống kê.',
  },
  HOT_FOCUS: {
    label: 'Số Nóng',
    description: 'Ưu tiên các số xuất hiện nhiều nhất trong các kỳ gần đây.',
  },
  COLD_FOCUS: {
    label: 'Số Lạnh (Ngược chiều)',
    description: 'Ưu tiên các số ít xuất hiện, đang "chờ" được chọn.',
  },
  CO_PILOT: {
    label: 'AI Đồng Hành',
    description: 'Bạn khóa số may mắn, AI tìm các số bổ sung tốt nhất.',
  }
};