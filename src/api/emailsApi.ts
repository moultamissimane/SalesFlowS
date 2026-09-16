import { apiClient } from './client';
import { EmailNotification } from '../types';

export const emailsApi = {
  send: async (payload: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>): Promise<void> => {
    await apiClient.post('/emails', payload);
  },
  list: async (): Promise<EmailNotification[]> => {
    const { data } = await apiClient.get<EmailNotification[]>('/emails');
    return data;
  },
};
