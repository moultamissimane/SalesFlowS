import { apiClient } from './client';

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalDeals: number;
  wonCount: number;
  wonValue: number;
  openValue: number;
  quota: number;
  attainmentPercent: number;
}

export interface DashboardSummary {
  totalWonRevenue: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  conversionRate: number;
  openDealsCount: number;
  wonDealsCount: number;
  lostDealsCount: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  perAgent: AgentPerformance[];
}

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<DashboardSummary>('/analytics/dashboard');
    return data;
  },
};
