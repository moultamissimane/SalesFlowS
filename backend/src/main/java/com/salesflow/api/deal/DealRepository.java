package com.salesflow.api.deal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DealRepository extends JpaRepository<Deal, UUID>, JpaSpecificationExecutor<Deal> {
    long countByCompany_IdAndDeletedAtIsNullAndStageNotIn(UUID companyId, Collection<PipelineStage> closedStages);

    long countByDeletedAtIsNullAndStage(PipelineStage stage);

    long countByDeletedAtIsNullAndStageNotIn(Collection<PipelineStage> closedStages);

    @Query("select coalesce(sum(d.value), 0) from Deal d where d.contact.id = :contactId and d.deletedAt is null")
    BigDecimal sumValueByContactId(@Param("contactId") UUID contactId);

    @Query("select coalesce(sum(d.value), 0) from Deal d where d.deletedAt is null and d.stage = :won")
    BigDecimal sumWonValue(@Param("won") PipelineStage won);

    @Query("select coalesce(sum(d.value), 0) from Deal d where d.deletedAt is null and d.stage not in :closedStages")
    BigDecimal sumOpenPipelineValue(@Param("closedStages") Collection<PipelineStage> closedStages);

    @Query("select coalesce(sum(d.value * d.probability / 100), 0) from Deal d where d.deletedAt is null and d.stage not in :closedStages")
    BigDecimal sumWeightedPipelineValue(@Param("closedStages") Collection<PipelineStage> closedStages);

    @Query(value = """
            select to_char(date_trunc('month', updated_at), 'YYYY-MM') as ym, coalesce(sum(value), 0) as revenue
            from deals
            where stage = 'WON' and deleted_at is null and updated_at >= :from
            group by 1 order by 1
            """, nativeQuery = true)
    List<Object[]> monthlyWonRevenue(@Param("from") Instant from);

    @Query("select d.assignedAgent.id, count(d), sum(case when d.stage = :won then 1L else 0L end), " +
           "coalesce(sum(case when d.stage = :won then d.value else 0 end), 0), " +
           "coalesce(sum(case when d.stage not in :closedStages then d.value else 0 end), 0) " +
           "from Deal d where d.deletedAt is null and d.assignedAgent is not null group by d.assignedAgent.id")
    List<Object[]> perAgentStats(@Param("won") PipelineStage won, @Param("closedStages") Collection<PipelineStage> closedStages);
}
