package com.salesflow.api.dashboard;

import com.salesflow.api.dashboard.dto.DashboardDtos.AgentPerformance;
import com.salesflow.api.dashboard.dto.DashboardDtos.DashboardSummary;
import com.salesflow.api.dashboard.dto.DashboardDtos.MonthlyRevenuePoint;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.deal.PipelineStage;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final List<PipelineStage> CLOSED_STAGES = List.of(PipelineStage.WON, PipelineStage.LOST);
    private static final int TREND_MONTHS = 6;

    private final DealRepository dealRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardSummary summary() {
        BigDecimal totalWonRevenue = dealRepository.sumWonValue(PipelineStage.WON);
        BigDecimal totalPipelineValue = dealRepository.sumOpenPipelineValue(CLOSED_STAGES);
        BigDecimal weightedPipelineValue = dealRepository.sumWeightedPipelineValue(CLOSED_STAGES);

        long wonCount = dealRepository.countByDeletedAtIsNullAndStage(PipelineStage.WON);
        long lostCount = dealRepository.countByDeletedAtIsNullAndStage(PipelineStage.LOST);
        long openCount = dealRepository.countByDeletedAtIsNullAndStageNotIn(CLOSED_STAGES);

        double conversionRate = (wonCount + lostCount) == 0
                ? 0.0
                : (wonCount * 100.0) / (wonCount + lostCount);

        return new DashboardSummary(
                totalWonRevenue, totalPipelineValue, weightedPipelineValue,
                round1(conversionRate), openCount, wonCount, lostCount,
                monthlyRevenue(), perAgent());
    }

    private List<MonthlyRevenuePoint> monthlyRevenue() {
        LocalDate startMonth = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).minusMonths(TREND_MONTHS - 1L);
        Instant from = startMonth.atStartOfDay(ZoneOffset.UTC).toInstant();

        Map<String, BigDecimal> revenueByMonth = new LinkedHashMap<>();
        for (int i = 0; i < TREND_MONTHS; i++) {
            String key = startMonth.plusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM"));
            revenueByMonth.put(key, BigDecimal.ZERO);
        }
        for (Object[] row : dealRepository.monthlyWonRevenue(from)) {
            revenueByMonth.put((String) row[0], (BigDecimal) row[1]);
        }

        BigDecimal monthlyTarget = userRepository.findAll().stream()
                .map(User::getMonthlyQuota)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return revenueByMonth.entrySet().stream()
                .map(e -> new MonthlyRevenuePoint(e.getKey(), e.getValue(), monthlyTarget))
                .toList();
    }

    private List<AgentPerformance> perAgent() {
        // Left-join in Java: every non-ADMIN user appears, even with zero deals (matches the
        // original UI's "all sales reps" leaderboard rather than only reps with activity).
        record Stats(long total, long won, BigDecimal wonValue, BigDecimal openValue) {}
        Map<UUID, Stats> statsByAgent = dealRepository.perAgentStats(PipelineStage.WON, CLOSED_STAGES).stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> new Stats((Long) row[1], (Long) row[2], (BigDecimal) row[3], (BigDecimal) row[4])));

        return userRepository.findByDeletedAtIsNullAndRoleNot(com.salesflow.api.user.UserRole.ADMIN).stream()
                .map(user -> {
                    Stats stats = statsByAgent.getOrDefault(user.getId(), new Stats(0, 0, BigDecimal.ZERO, BigDecimal.ZERO));
                    BigDecimal quota = user.getMonthlyQuota() != null ? user.getMonthlyQuota() : BigDecimal.ZERO;
                    double attainment = quota.signum() == 0
                            ? 0.0
                            : stats.wonValue().divide(quota, 4, RoundingMode.HALF_UP).doubleValue() * 100;
                    return new AgentPerformance(
                            user.getId(), user.getFullName(),
                            stats.total(), stats.won(), stats.wonValue(), stats.openValue(), quota, round1(attainment));
                })
                .sorted((a, b) -> b.wonValue().compareTo(a.wonValue()))
                .toList();
    }

    private double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
