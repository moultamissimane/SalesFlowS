import { apiClient } from './client';
import { PageResponse, ListParams } from './types';
import { Company } from '../types';

export const companiesApi = {
  list: async (params: ListParams = {}): Promise<PageResponse<Company>> => {
    const { data } = await apiClient.get<PageResponse<Company>>('/companies', {
      params: { page: 0, size: 200, sort: 'createdAt,desc', ...params },
    });
    return data;
  },
  get: async (id: string): Promise<Company> => {
    const { data } = await apiClient.get<Company>(`/companies/${id}`);
    return data;
  },
  create: async (payload: Partial<Company>): Promise<Company> => {
    const { data } = await apiClient.post<Company>('/companies', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Company>): Promise<Company> => {
    const { data } = await apiClient.put<Company>(`/companies/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};
