package com.salesflow.api.deal;

import com.salesflow.api.common.BaseEntity;
import com.salesflow.api.company.Company;
import com.salesflow.api.contact.Contact;
import com.salesflow.api.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Deal extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal value = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Currency currency = Currency.MAD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PipelineStage stage;

    @Column(nullable = false)
    private Integer probability;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DealPriority priority = DealPriority.MEDIUM;

    @ElementCollection
    @CollectionTable(name = "deal_tags", joinColumns = @JoinColumn(name = "deal_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("uploadedAt DESC")
    @Builder.Default
    private List<DealAttachment> attachments = new ArrayList<>();

    @Column(name = "won_lost_reason", columnDefinition = "TEXT")
    private String wonLostReason;

    @Column(name = "last_activity_date", nullable = false)
    @Builder.Default
    private Instant lastActivityDate = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
