package com.salesflow.api.audit;

public enum AuditAction {
    CREATE,
    UPDATE,
    STAGE_CHANGE,
    SOFT_DELETE,
    RESTORE,
    PERMANENT_DELETE,
    FILE_UPLOAD,
    AUTH_LOGIN
}
