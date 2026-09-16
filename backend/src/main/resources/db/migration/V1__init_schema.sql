-- ============================================================================
-- SalesFlow CRM - PostgreSQL schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Users -------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'SALES_MANAGER', 'SALES_AGENT')),
    department VARCHAR(100),
    location VARCHAR(100) DEFAULT 'Casablanca, Morocco',
    avatar_url VARCHAR(500),
    monthly_quota NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- 2. Refresh & password-reset tokens ------------------------------------------
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    replaced_by_token_hash VARCHAR(255),
    created_by_ip VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Companies -----------------------------------------------------------------
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(120),
    website VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100) DEFAULT 'Casablanca',
    country VARCHAR(100) DEFAULT 'Morocco',
    annual_revenue NUMERIC(15, 2) DEFAULT 0,
    employee_count INT DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LEAD', 'CHURNED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_city ON companies(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);

-- 4. Contacts --------------------------------------------------------------
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(150),
    avatar_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LEAD', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_contacts_company ON contacts(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_name_trgm ON contacts USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at);

-- 5. Leads -----------------------------------------------------------------
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(40) NOT NULL CHECK (source IN ('LINKEDIN', 'CASABLANCA_TECH_EXPO', 'INBOUND_WEB', 'REFERRAL', 'COLD_CALL', 'PARTNER')),
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED')),
    estimated_value NUMERIC(15, 2) DEFAULT 0,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    city VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_leads_status ON leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_agent ON leads(assigned_agent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_deleted_at ON leads(deleted_at);

-- 6. Deals (core pipeline entity) -------------------------------------------
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'MAD' CHECK (currency IN ('MAD', 'USD', 'EUR')),
    stage VARCHAR(30) NOT NULL CHECK (stage IN ('NEW_LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
    probability INT NOT NULL CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    won_lost_reason TEXT,
    last_activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_deals_stage_active ON deals(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_agent_perf ON deals(assigned_agent_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_company ON deals(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_close_date ON deals(expected_close_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_value_desc ON deals(value DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_title_trgm ON deals USING gin (title gin_trgm_ops);
CREATE INDEX idx_deals_deleted_at ON deals(deleted_at);

CREATE TABLE deal_tags (
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    tag VARCHAR(60) NOT NULL,
    PRIMARY KEY (deal_id, tag)
);

CREATE TABLE deal_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(120),
    storage_key VARCHAR(500) NOT NULL,
    uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deal_attachments_deal ON deal_attachments(deal_id);

-- 7. Tasks -------------------------------------------------------------------
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_tasks_agent ON tasks(assigned_agent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);

-- 8. Activities (timeline entries / notes) ------------------------------------
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('DEAL', 'LEAD', 'COMPANY', 'CONTACT')),
    entity_id UUID NOT NULL,
    entity_title VARCHAR(255),
    type VARCHAR(30) NOT NULL CHECK (type IN ('CALL', 'MEETING', 'EMAIL', 'NOTE', 'STAGE_CHANGE', 'TASK_COMPLETED')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    performed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    outcome VARCHAR(255)
);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_performed_at ON activities(performed_at DESC);

-- 9. Audit logs (immutable, append-only) --------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_name VARCHAR(255),
    action VARCHAR(40) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'STAGE_CHANGE', 'SOFT_DELETE', 'RESTORE', 'PERMANENT_DELETE', 'FILE_UPLOAD', 'AUTH_LOGIN')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    user_ip VARCHAR(60),
    details TEXT,
    diff_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- 10. Email notifications ------------------------------------------------------
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    template_type VARCHAR(40) NOT NULL CHECK (template_type IN ('FOLLOW_UP', 'PROPOSAL_SUBMITTED', 'DEAL_WON', 'TASK_REMINDER', 'PASSWORD_RESET', 'WELCOME')),
    content TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('DELIVERED', 'QUEUED', 'OPENED', 'FAILED'))
);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);
