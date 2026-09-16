import { apiClient } from './client';

export type TrashEntityType = 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK';

export interface TrashItem {
  id: string;
  type: TrashEntityType;
  name: string;
  deletedAt: string;
  deletedBy: string;
}

export const recycleBinApi = {
  list: async (): Promise<TrashItem[]> => {
    const { data } = await apiClient.get<TrashItem[]>('/recycle-bin');
    return data;
  },
  restore: async (type: TrashEntityType, id: string): Promise<void> => {
    await apiClient.post(`/recycle-bin/${type}/${id}/restore`);
  },
  purge: async (type: TrashEntityType, id: string): Promise<void> => {
    await apiClient.delete(`/admin/purge/${type}/${id}`);
  },
};
