export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tag: string;
  roleRequired: string;
  requestBody?: string;
  responseSample: string;
}

export const OPENAPI_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Authenticate user & issue JWT tokens',
    description: 'Validates user credentials against PostgreSQL, returns short-lived JWT access token (15m) and secure HttpOnly refresh token (7d).',
    tag: 'Authentication',
    roleRequired: 'PUBLIC',
    requestBody: JSON.stringify({
      email: 'y.elalami@salesflow.ma',
      password: '••••••••••••'
    }, null, 2),
    responseSample: JSON.stringify({
      status: 200,
      tokenType: 'Bearer',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 900,
      user: {
        id: 'usr-2',
        name: 'Youssef El Alami',
        email: 'y.elalami@salesflow.ma',
        role: 'SALES_MANAGER',
        department: 'Enterprise Sales',
        location: 'Casablanca'
      }
    }, null, 2)
  },
  {
    method: 'GET',
    path: '/api/v1/deals',
    summary: 'Get paginated deals with multi-criteria search',
    description: 'Retrieves active deals with JPA specification filtering by stage, agent, query string, and date ranges. Automatically filters out soft-deleted items.',
    tag: 'Deals',
    roleRequired: 'SALES_AGENT+',
    responseSample: JSON.stringify({
      content: [
        {
          id: 'deal-101',
          title: 'Attijari Omnichannel Banking API Suite',
          companyName: 'Attijari Solutions Cloud',
          value: 480000,
          currency: 'MAD',
          stage: 'NEGOTIATION',
          probability: 85,
          assignedAgentName: 'Youssef El Alami',
          expectedCloseDate: '2026-04-15'
        }
      ],
      page: 0,
      size: 10,
      totalElements: 7,
      totalPages: 1
    }, null, 2)
  },
  {
    method: 'PATCH',
    path: '/api/v1/deals/{id}/stage',
    summary: 'Update deal stage (Kanban move)',
    description: 'Transitions deal pipeline stage. Automatically logs an immutable AuditLog entity, recalculates pipeline metrics, and fires email trigger if stage is WON.',
    tag: 'Deals',
    roleRequired: 'SALES_AGENT+',
    requestBody: JSON.stringify({
      stage: 'WON',
      wonLostReason: 'Passed technical benchmark against legacy provider'
    }, null, 2),
    responseSample: JSON.stringify({
      id: 'deal-101',
      stage: 'WON',
      probability: 100,
      updatedAt: '2026-03-15T14:20:00Z',
      auditLogId: 'aud-9821'
    }, null, 2)
  },
  {
    method: 'POST',
    path: '/api/v1/deals/{id}/attachments',
    summary: 'Upload document / contract to AWS S3',
    description: 'Uploads multipart file (PDF, DOCX) to Amazon S3 bucket, generates presigned URL, and associates attachment metadata with the deal.',
    tag: 'Files',
    roleRequired: 'SALES_AGENT+',
    requestBody: 'multipart/form-data; name="file"; filename="Contract_Final.pdf"',
    responseSample: JSON.stringify({
      id: 'att-99',
      fileName: 'Contract_Final.pdf',
      fileSize: 2415000,
      s3Key: 'tenants/c45/deals/deal-101/contracts/Contract_Final.pdf',
      downloadUrl: 'https://salesflow-s3.s3.eu-west-3.amazonaws.com/...',
      uploadedAt: '2026-03-15T14:22:00Z'
    }, null, 2)
  },
  {
    method: 'GET',
    path: '/api/v1/analytics/dashboard',
    summary: 'Aggregated real-time sales KPIs & pipeline velocity',
    description: 'Calculates total revenue, win/loss conversion ratios, stage breakdown, and rep quota leaderboard using PostgreSQL native window functions.',
    tag: 'Analytics',
    roleRequired: 'SALES_MANAGER+',
    responseSample: JSON.stringify({
      totalRevenue: 2340000,
      pipelineValue: 2350000,
      conversionRate: 66.7,
      openDeals: 5,
      wonDeals: 1,
      lostDeals: 1,
      salesPerEmployee: [
        { agentName: 'Youssef El Alami', closedRevenue: 1320000, target: 1500000 },
        { agentName: 'Sofia Chraibi', closedRevenue: 720000, target: 850000 }
      ]
    }, null, 2)
  },
  {
    method: 'GET',
    path: '/api/v1/audit-logs',
    summary: 'Query enterprise audit trail',
    description: 'Returns chronological immutable security and entity modification logs for compliance and SOC2 requirements.',
    tag: 'Compliance',
    roleRequired: 'ADMIN',
    responseSample: JSON.stringify({
      totalRecords: 1420,
      content: [
        {
          id: 'aud-1',
          action: 'STAGE_CHANGE',
          entityType: 'DEAL',
          userName: 'Youssef El Alami',
          userRole: 'SALES_MANAGER',
          timestamp: '2026-03-14T11:30:22Z',
          userIp: '196.200.145.42 (Casablanca)'
        }
      ]
    }, null, 2)
  }
];

export const SPRING_BOOT_ENTITY_JAVA = `package com.salesflow.crm.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "deals",
    indexes = {
        @Index(name = "idx_deals_stage", columnList = "stage"),
        @Index(name = "idx_deals_agent", columnList = "assigned_agent_id"),
        @Index(name = "idx_deals_company", columnList = "company_id"),
        @Index(name = "idx_deals_expected_close", columnList = "expected_close_date"),
        @Index(name = "idx_deals_deleted_at", columnList = "deleted_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE deals SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL") // Hibernate 6 soft delete filter
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @PositiveOrZero
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Currency currency = Currency.MAD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PipelineStage stage;

    @Column(nullable = false)
    private Integer probability; // 0 to 100 %

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    private User assignedAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    @ElementCollection
    @CollectionTable(name = "deal_tags", joinColumns = @JoinColumn(name = "deal_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DealAttachment> attachments = new ArrayList<>();

    @Column(name = "won_lost_reason", columnDefinition = "TEXT")
    private String wonLostReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt; // Nullable for soft-delete

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;
}`;

export const SPRING_BOOT_SECURITY_JAVA = `package com.salesflow.crm.security;

import com.salesflow.crm.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()
                // Strict RBAC Enforcement:
                .requestMatchers("/api/v1/audit-logs/**", "/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/analytics/**").hasAnyRole("SALES_MANAGER", "ADMIN")
                .requestMatchers("/api/v1/deals/**", "/api/v1/contacts/**").hasAnyRole("SALES_AGENT", "SALES_MANAGER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("ROLE_ADMIN > ROLE_SALES_MANAGER \\n ROLE_SALES_MANAGER > ROLE_SALES_AGENT");
        return hierarchy;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}`;

export const POSTGRESQL_DDL_SQL = `-- ============================================================================
-- SalesFlow Enterprise SaaS CRM - PostgreSQL 16 Production Schema
-- Designed for High Concurrency, Soft-Delete, Full-Text Search, and Audit Trail
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Trigram fuzzy matching for search

-- 1. Users Table with Role-Based Access Control
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'SALES_MANAGER', 'SALES_AGENT')),
    department VARCHAR(100),
    location VARCHAR(100) DEFAULT 'Casablanca, Morocco',
    monthly_quota NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- 2. Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(120),
    website VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100) DEFAULT 'Casablanca',
    country VARCHAR(100) DEFAULT 'Morocco',
    annual_revenue NUMERIC(15, 2) DEFAULT 0,
    employee_count INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Full-Text Search GIN Index on Companies
CREATE INDEX idx_companies_tsv ON companies USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(industry, '') || ' ' || coalesce(city, ''))
);
CREATE INDEX idx_companies_city ON companies(city) WHERE deleted_at IS NULL;

-- 3. Deals Table (Core Pipeline Entity)
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    contact_id UUID REFERENCES contacts(id),
    value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
    stage VARCHAR(30) NOT NULL CHECK (stage IN ('NEW_LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
    probability INT NOT NULL CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    assigned_agent_id UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    won_lost_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- High Performance Partial Indexes for Pipeline Queries
CREATE INDEX idx_deals_stage_active ON deals(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_agent_perf ON deals(assigned_agent_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_close_date ON deals(expected_close_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_value_desc ON deals(value DESC) WHERE deleted_at IS NULL;

-- 4. Enterprise Audit Logs (Immutable Append-Only Trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_name VARCHAR(255),
    action VARCHAR(40) NOT NULL,
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    user_ip VARCHAR(60),
    details TEXT,
    diff_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);`;

export const DOCKER_COMPOSE_YML = `version: '3.9'

services:
  # 1. PostgreSQL 16 Database
  salesflow-postgres:
    image: postgres:16-alpine
    container_name: salesflow-db
    restart: always
    environment:
      POSTGRES_DB: salesflow_db
      POSTGRES_USER: salesflow_app
      POSTGRES_PASSWORD: \${DB_PASSWORD:-DevSecure2026!}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U salesflow_app -d salesflow_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Spring Boot 3 + Java 21 Backend API
  salesflow-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: salesflow-api
    restart: always
    depends_on:
      salesflow-postgres:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://salesflow-postgres:5432/salesflow_db
      SPRING_DATASOURCE_USERNAME: salesflow_app
      SPRING_DATASOURCE_PASSWORD: \${DB_PASSWORD:-DevSecure2026!}
      JWT_SECRET: \${JWT_SECRET:-9a82fbc8921e428392a83748293c837492837492837492837492}
      AWS_REGION: eu-west-3 # Paris/Casablanca low latency
      AWS_S3_BUCKET: salesflow-enterprise-storage
    ports:
      - "8080:8080"

  # 3. Next.js / React Frontend SPA
  salesflow-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: salesflow-ui
    restart: always
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1

volumes:
  pgdata:
    driver: local`;

export const GITHUB_ACTIONS_CI_CD = `name: CI/CD Pipeline - Spring Boot & React Deployment

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]

env:
  AWS_REGION: eu-west-3
  ECR_REPOSITORY: salesflow-enterprise-api
  ECS_SERVICE: salesflow-service
  ECS_CLUSTER: salesflow-production-cluster

jobs:
  backend-test-and-build:
    name: Backend Test (Java 21, JUnit 5, SpotBugs)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 21 (Eclipse Temurin)
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Run Maven Tests & Code Analysis
        run: |
          mvn clean verify \\
            -Dspring.profiles.active=test \\
            -Dspotbugs.effort=Max

      - name: Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: target/surefire-reports/*.xml

  docker-build-push-aws:
    name: Build & Push Docker image to AWS ECR
    needs: backend-test-and-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push Docker image
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Deploy to Amazon ECS Fargate
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: task-definition.json
          service: \${{ env.ECS_SERVICE }}
          cluster: \${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true`;
