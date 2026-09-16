import { apiClient } from './client';
import { PageResponse, ListParams } from './types';
import { Task } from '../types';

export const tasksApi = {
  list: async (params: ListParams = {}): Promise<PageResponse<Task>> => {
    const { data } = await apiClient.get<PageResponse<Task>>('/tasks', {
      params: { page: 0, size: 200, sort: 'createdAt,desc', ...params },
    });
    return data;
  },
  create: async (payload: Partial<Task>): Promise<Task> => {
    const { data } = await apiClient.post<Task>('/tasks', payload);
    return data;
  },
  toggleStatus: async (id: string): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}/toggle-status`);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
