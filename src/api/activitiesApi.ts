import { apiClient } from './client';
import { Activity } from '../types';

export const activitiesApi = {
  listAll: async (): Promise<Activity[]> => {
    const { data } = await apiClient.get<Activity[]>('/activities');
    return data;
  },
  listForEntity: async (entityType: Activity['entityType'], entityId: string): Promise<Activity[]> => {
    const { data } = await apiClient.get<Activity[]>('/activities', { params: { entityType, entityId } });
    return data;
  },
  create: async (payload: Omit<Activity, 'id' | 'performedAt' | 'performedBy' | 'performedByRole'>): Promise<Activity> => {
    const { data } = await apiClient.post<Activity>('/activities', payload);
    return data;
  },
};
