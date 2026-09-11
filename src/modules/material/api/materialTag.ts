import { createModuleHttp } from '@/api/client';
import type { IPage } from '@/api/types';
import type {
  MaterialTag,
  MaterialTagOption,
  MaterialTagPayload,
  MaterialTagQuery,
  MaterialTagStatus,
  MaterialTagUpdate
} from '@/modules/material/types/materialTag';

const materialHttp = createModuleHttp('material');
export const getMaterialTagPageApi = (params: MaterialTagQuery) =>
  materialHttp.get<IPage<MaterialTag>>('/material-tag/page', params);
export const getMaterialTagByIdApi = (id: number) => materialHttp.get<MaterialTag>(`/material-tag/getById/${id}`);
export const getEnabledMaterialTagListApi = (categoryCode: string) =>
  materialHttp.get<MaterialTagOption[]>('/material-tag/enabledList', { categoryCode });
export const getAiCandidateMaterialTagListApi = (categoryCode: string) =>
  materialHttp.get<MaterialTagOption[]>('/material-tag/aiCandidateList', { categoryCode });
export const createMaterialTagApi = (params: MaterialTagPayload) => materialHttp.post<void>('/material-tag/create', params);
export const updateMaterialTagApi = (params: MaterialTagUpdate) => materialHttp.post<void>('/material-tag/update', params);
export const changeMaterialTagStatusApi = (params: MaterialTagStatus) =>
  materialHttp.post<void>('/material-tag/changeStatus', params);
