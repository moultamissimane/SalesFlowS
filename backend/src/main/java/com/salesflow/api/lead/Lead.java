package com.salesflow.api.lead;

import com.salesflow.api.common.BaseEntity;
import com.salesflow.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Lead extends BaseEntity {

    @Column(nullable = false)
    private String title;

    private String company;

    @Column(name = "contact_name")
    private String contactName;

    private String email;
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private LeadSource source;

    @Builder.Default
    private Integer score = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "estimated_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal estimatedValue = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    private String city;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
