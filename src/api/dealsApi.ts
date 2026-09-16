import { apiClient } from './client';
import { PageResponse, ListParams } from './types';
import { Deal, PipelineStage } from '../types';

export const dealsApi = {
  list: async (params: ListParams = {}): Promise<PageResponse<Deal>> => {
    const { data } = await apiClient.get<PageResponse<Deal>>('/deals', {
      params: { page: 0, size: 200, sort: 'createdAt,desc', ...params },
    });
    return data;
  },
  create: async (payload: Record<string, unknown>): Promise<Deal> => {
    const { data } = await apiClient.post<Deal>('/deals', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, unknown>): Promise<Deal> => {
    const { data } = await apiClient.put<Deal>(`/deals/${id}`, payload);
    return data;
  },
  updateStage: async (id: string, stage: PipelineStage, wonLostReason?: string): Promise<Deal> => {
    const { data } = await apiClient.patch<Deal>(`/deals/${id}/stage`, { stage, wonLostReason });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/deals/${id}`);
  },
  uploadAttachment: async (dealId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(`/deals/${dealId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteAttachment: async (dealId: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(`/deals/${dealId}/attachments/${attachmentId}`);
  },
  downloadAttachmentUrl: (dealId: string, attachmentId: string) =>
    `/api/v1/deals/${dealId}/attachments/${attachmentId}/download`,
};
