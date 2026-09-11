import { createModuleHttp } from '@/api/client';
import type {
  MaterialCategory,
  MaterialCategoryStatus,
  MaterialCategoryUpdate,
  MaterialFileValidation
} from '@/modules/material/types/materialCategory';

const materialHttp = createModuleHttp('material');

export const getMaterialCategoryListApi = () => {
  return materialHttp.get<MaterialCategory[]>('/material-category/list');
};

export const getEnabledMaterialCategoryListApi = () => {
  return materialHttp.get<MaterialCategory[]>('/material-category/enabledList');
};

export const getMaterialCategoryByCodeApi = (code: string) => {
  return materialHttp.get<MaterialCategory>(`/material-category/getByCode/${encodeURIComponent(code)}`);
};

export const updateMaterialCategoryApi = (params: MaterialCategoryUpdate) => {
  return materialHttp.post<void>('/material-category/update', params);
};

export const changeMaterialCategoryStatusApi = (params: MaterialCategoryStatus) => {
  return materialHttp.post<void>('/material-category/changeStatus', params);
};

export const validateMaterialFileApi = (categoryCode: string, file: File) => {
  const formData = new FormData();
  formData.append('categoryCode', categoryCode);
  formData.append('file', file);
  return materialHttp.upload<MaterialFileValidation>('/material-category/validateFile', formData);
};
