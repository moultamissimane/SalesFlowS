import { apiClient } from './client';
import { PageResponse, ListParams } from './types';
import { Contact } from '../types';

export const contactsApi = {
  list: async (params: ListParams = {}): Promise<PageResponse<Contact>> => {
    const { data } = await apiClient.get<PageResponse<Contact>>('/contacts', {
      params: { page: 0, size: 200, sort: 'createdAt,desc', ...params },
    });
    return data;
  },
  create: async (payload: Partial<Contact> & { avatar?: string }): Promise<Contact> => {
    const { data } = await apiClient.post<Contact>('/contacts', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Contact>): Promise<Contact> => {
    const { data } = await apiClient.put<Contact>(`/contacts/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};
