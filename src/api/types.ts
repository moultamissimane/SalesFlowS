export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
}
