import type { IPageQuery } from '@/api/types';

export type MaterialCategoryCode = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
export type MaterialTagCategory = {
  categoryCode: MaterialCategoryCode;
  categoryName?: string;
  aiAnalysisEnabled: boolean;
  aiDescription?: string | null;
};
export type MaterialTag = {
  id: number;
  name: string;
  remark?: string | null;
  enabled: boolean;
  categories: MaterialTagCategory[];
  updateTime?: string | null;
};
export type MaterialTagQuery = IPageQuery & { name?: string; enabled?: boolean; categoryCode?: MaterialCategoryCode };
export type MaterialTagPayload = { name: string; remark?: string | null; categories: MaterialTagCategory[] };
export type MaterialTagUpdate = MaterialTagPayload & { id: number };
export type MaterialTagStatus = { id: number; enabled: boolean };
export type MaterialTagOption = { id: number; name: string };
