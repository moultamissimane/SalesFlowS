import { apiClient } from './client';
import { User } from '../types';

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },
};
