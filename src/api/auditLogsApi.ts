import { apiClient } from './client';
import { PageResponse } from './types';
import { AuditLog } from '../types';

interface BackendAuditLog extends Omit<AuditLog, 'timestamp'> {
  createdAt: string;
}

export const auditLogsApi = {
  list: async (): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<PageResponse<BackendAuditLog>>('/audit-logs', {
      params: { page: 0, size: 200, sort: 'createdAt,desc' },
    });
    return data.content.map(({ createdAt, ...rest }) => ({ ...rest, timestamp: createdAt }));
  },
};
