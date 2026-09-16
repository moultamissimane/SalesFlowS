package com.salesflow.api.company;

import com.salesflow.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Company extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String industry;
    private String website;
    private String phone;

    @Builder.Default
    private String city = "Casablanca";

    @Builder.Default
    private String country = "Morocco";

    @Column(name = "annual_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal annualRevenue = BigDecimal.ZERO;

    @Column(name = "employee_count")
    @Builder.Default
    private Integer employeeCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private CompanyStatus status = CompanyStatus.ACTIVE;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
