package com.salesflow.api.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record MonthlyRevenuePoint(String month, BigDecimal revenue, BigDecimal target) {}

    public record AgentPerformance(
            UUID agentId, String agentName, long totalDeals, long wonCount,
            BigDecimal wonValue, BigDecimal openValue, BigDecimal quota, double attainmentPercent
    ) {}

    public record DashboardSummary(
            BigDecimal totalWonRevenue,
            BigDecimal totalPipelineValue,
            BigDecimal weightedPipelineValue,
            double conversionRate,
            long openDealsCount,
            long wonDealsCount,
            long lostDealsCount,
            List<MonthlyRevenuePoint> monthlyRevenue,
            List<AgentPerformance> perAgent
    ) {}
}
