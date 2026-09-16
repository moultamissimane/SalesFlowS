import { apiClient, setAccessToken } from './client';
import { User, UserRole } from '../types';

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    return data;
  },

  register: async (fullName: string, email: string, password: string, role: UserRole, department?: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', {
      fullName, email, password, role, department,
    });
    setAccessToken(data.accessToken);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    setAccessToken(null);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
