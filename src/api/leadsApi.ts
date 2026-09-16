import { apiClient } from './client';
import { PageResponse, ListParams } from './types';
import { Lead } from '../types';

export const leadsApi = {
  list: async (params: ListParams = {}): Promise<PageResponse<Lead>> => {
    const { data } = await apiClient.get<PageResponse<Lead>>('/leads', {
      params: { page: 0, size: 200, sort: 'createdAt,desc', ...params },
    });
    return data;
  },
  create: async (payload: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.post<Lead>('/leads', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.put<Lead>(`/leads/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },
  convertToDeal: async (id: string, dealTitle: string, dealValue: number): Promise<{ dealId: string }> => {
    const { data } = await apiClient.post<{ dealId: string }>(`/leads/${id}/convert-to-deal`, { dealTitle, dealValue });
    return data;
  },
};
